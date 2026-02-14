// 生成任务 WebSocket 服务器
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { GenerationUpdate, WebSocketMessage } from './types.js';
import { createWebSocketAuthMiddleware, setupHeartbeat } from './socketMiddleware.js';
import prisma from '../config/database.js';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('generationSocket');

class GenerationSocketServer extends EventEmitter {
  constructor(server) {
    super();
    this.server = server;
    this.wss = null;
    this.connectedClients = new Map(); // userId -> Set of sockets
    this.taskSubscriptions = new Map(); // taskId -> Set of sockets
    this.heartbeatInterval = null;

    this.init();
  }

  init() {
    // 创建 WebSocket 服务器
    this.wss = new WebSocketServer({
      server: this.server,
      path: '/ws/generation'
    });

    // 连接数量限制
    this.wss.maxConnections = process.env.WS_MAX_CONNECTIONS || 100;

    this.wss.on('connection', (socket, req) => {
      this.handleConnection(socket, req);
    });

    // 启动清理任务
    this.startCleanupTask();

    logger.debug('[WebSocket] GenerationSocketServer initialized');
  }

  handleConnection(socket, req) {
    try {
      // 认证中间件
      const authMiddleware = createWebSocketAuthMiddleware();
      authMiddleware(socket, req, () => {
        this.setupSocket(socket);
      });

    } catch (error) {
      logger.error('[WebSocket] Connection error:', error);
      socket.close(4001, error.message);
    }
  }

  setupSocket(socket) {
    const clientId = `${socket.userId}_${Date.now()}`;
    socket.clientId = clientId;

    // 心跳检测
    setupHeartbeat(socket);

    // 添加连接日志
    logger.debug(`[WebSocket] Client connected: ${clientId} (User: ${socket.userId})`);

    // 添加到连接池
    if (!this.connectedClients.has(socket.userId)) {
      this.connectedClients.set(socket.userId, new Set());
    }
    this.connectedClients.get(socket.userId).add(socket);

    // 发送连接成功消息
    const connectedMsg = new WebSocketMessage('connected', {
      clientId,
      userId: socket.userId,
    });
    socket.send(JSON.stringify(connectedMsg.toJSON()));

    // 监听消息
    socket.on('message', (data) => {
      this.handleMessage(socket, data);
    });

    // 监听断开连接
    socket.on('close', () => {
      this.handleDisconnect(socket);
    });

    // 监听错误
    socket.on('error', (error) => {
      logger.error(`[WebSocket] Socket error for ${clientId}:`, error);
      this.handleDisconnect(socket);
    });
  }

  handleMessage(socket, data) {
    try {
      const message = JSON.parse(data);
      const { event, data: payload } = message;

      switch (event) {
        case 'subscribe':
          this.handleSubscribe(socket, payload);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(socket, payload);
          break;
        case 'ping':
          this.handlePing(socket);
          break;
        default:
          logger.warn(`[WebSocket] Unknown event: ${event}`);
      }
    } catch (error) {
      logger.error('[WebSocket] Message handling error:', error);

      const errorMsg = new WebSocketMessage('error', {
        code: 'INVALID_MESSAGE',
        message: 'Invalid message format',
      });
      socket.send(JSON.stringify(errorMsg.toJSON()));
    }
  }

  async handleSubscribe(socket, payload) {
    const { taskId } = payload;

    if (!taskId) {
      const errorMsg = new WebSocketMessage('error', {
        code: 'INVALID_PAYLOAD',
        message: 'Task ID is required',
      });
      socket.send(JSON.stringify(errorMsg.toJSON()));
      return;
    }

    try {
      // 验证任务权限
      const accessInfo = validateTaskAccess(socket, taskId);

      // 检查任务是否存在
      const generation = await prisma.generation.findUnique({
        where: { id: taskId },
      });

      if (!generation) {
        const errorMsg = new WebSocketMessage('error', {
          code: 'TASK_NOT_FOUND',
          message: 'Generation task not found',
        });
        socket.send(JSON.stringify(errorMsg.toJSON()));
        return;
      }

      if (generation.userId !== socket.userId) {
        const errorMsg = new WebSocketMessage('error', {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this task',
        });
        socket.send(JSON.stringify(errorMsg.toJSON()));
        return;
      }

      // 添加订阅
      if (!this.taskSubscriptions.has(taskId)) {
        this.taskSubscriptions.set(taskId, new Set());
      }
      this.taskSubscriptions.get(taskId).add(socket);

      logger.debug(`[WebSocket] User ${socket.userId} subscribed to task ${taskId}`);

      // 发送订阅成功消息
      const successMsg = new WebSocketMessage('subscribed', {
        taskId,
        status: generation.status,
      });
      socket.send(JSON.stringify(successMsg.toJSON()));

    } catch (error) {
      logger.error('[WebSocket] Subscribe error:', error);

      const errorMsg = new WebSocketMessage('error', {
        code: 'SUBSCRIBE_ERROR',
        message: error.message,
      });
      socket.send(JSON.stringify(errorMsg.toJSON()));
    }
  }

  handleUnsubscribe(socket, payload) {
    const { taskId } = payload;

    if (taskId) {
      // 从任务订阅中移除
      if (this.taskSubscriptions.has(taskId)) {
        this.taskSubscriptions.get(taskId).delete(socket);

        // 清理空订阅
        if (this.taskSubscriptions.get(taskId).size === 0) {
          this.taskSubscriptions.delete(taskId);
        }
      }

      logger.debug(`[WebSocket] User ${socket.userId} unsubscribed from task ${taskId}`);
    }
  }

  handlePing(socket) {
    const pongMsg = new WebSocketMessage('pong', {
      timestamp: new Date().toISOString(),
    });
    socket.send(JSON.stringify(pongMsg.toJSON()));
  }

  handleDisconnect(socket) {
    // 从所有订阅中移除
    for (const [taskId, sockets] of this.taskSubscriptions.entries()) {
      sockets.delete(socket);
      if (sockets.size === 0) {
        this.taskSubscriptions.delete(taskId);
      }
    }

    // 从连接池中移除
    if (this.connectedClients.has(socket.userId)) {
      this.connectedClients.get(socket.userId).delete(socket);
      if (this.connectedClients.get(socket.userId).size === 0) {
        this.connectedClients.delete(socket.userId);
      }
    }

    logger.debug(`[WebSocket] Client disconnected: ${socket.clientId}`);
  }

  // 推送生成进度更新
  async broadcastProgressUpdate(taskId, updateData) {
    try {
      const update = new GenerationUpdate(updateData);

      if (this.taskSubscriptions.has(taskId)) {
        const sockets = this.taskSubscriptions.get(taskId);

        const progressMsg = new WebSocketMessage('progress_update', update);

        for (const socket of sockets) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(progressMsg.toJSON()));
          }
        }
      }

      // 触发事件（用于日志或其他处理）
      this.emit('progress_update', {
        taskId,
        update: update.toJSON(),
      });

    } catch (error) {
      logger.error('[WebSocket] Error broadcasting progress update:', error);
    }
  }

  // 推送状态变化
  async broadcastStatusChange(taskId, status, data = {}) {
    try {
      const statusMsg = new WebSocketMessage('status_change', {
        taskId,
        status,
        ...data,
      });

      if (this.taskSubscriptions.has(taskId)) {
        const sockets = this.taskSubscriptions.get(taskId);

        for (const socket of sockets) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(statusMsg.toJSON()));
          }
        }
      }

      // 触发事件
      this.emit('status_change', {
        taskId,
        status,
        data,
      });

    } catch (error) {
      logger.error('[WebSocket] Error broadcasting status change:', error);
    }
  }

  // 获取连接统计
  getStats() {
    return {
      totalConnections: Array.from(this.connectedClients.values())
        .reduce((sum, sockets) => sum + sockets.size, 0),
      uniqueUsers: this.connectedClients.size,
      activeSubscriptions: this.taskSubscriptions.size,
    };
  }

  // 启动清理任务
  startCleanupTask() {
    this.heartbeatInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  // 清理断开的连接
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分钟

    for (const [userId, sockets] of this.connectedClients.entries()) {
      for (const socket of sockets) {
        if (socket.lastActivity && (now - socket.lastActivity) > maxAge) {
          socket.terminate();
        }
      }
    }

    // 清理无订阅的连接
    for (const [userId, sockets] of this.connectedClients.entries()) {
      if (sockets.size === 0) {
        this.connectedClients.delete(userId);
      }
    }

    logger.debug(`[WebSocket] Cleanup completed. Stats: ${JSON.stringify(this.getStats())}`);
  }
}

export default GenerationSocketServer;