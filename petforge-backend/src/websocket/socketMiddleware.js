// WebSocket 认证中间件
import { WebSocketMessage } from './types.js';

export const authenticateWebSocket = (req) => {
  try {
    // 从查询参数中获取 token
    const token = req.headers['authorization'] ||
                  req.headers['x-auth-token'] ||
                  (req.query ? req.query.token : null);

    if (!token) {
      throw new Error('No authentication token provided');
    }

    // 验证 JWT token
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }

    try {
      const decoded = jwt.verify(token, secret);

      // 返回用户信息
      return {
        userId: decoded.userId,
        email: decoded.email,
        // 验证时间
        issuedAt: decoded.iat,
        expiresAt: decoded.exp,
      };
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  } catch (error) {
    console.error('[WebSocket Auth] Error:', error);
    throw error;
  }
};

export const createWebSocketAuthMiddleware = () => {
  return (socket, req, next) => {
    try {
      // 认证用户
      const userInfo = authenticateWebSocket(req);

      // 添加用户信息到 socket
      socket.userId = userInfo.userId;
      socket.userEmail = userInfo.email;
      socket.issuedAt = userInfo.issuedAt;
      socket.expiresAt = userInfo.expiresAt;

      // 添加认证时间戳
      socket.authenticatedAt = new Date();

      console.log(`[WebSocket] User authenticated: ${socket.userId}`);
      next();
    } catch (error) {
      console.error('[WebSocket Auth] Authentication failed:', error);

      // 发送错误消息并断开连接
      const errorMsg = new WebSocketMessage('error', {
        code: 'AUTH_FAILED',
        message: error.message,
      });

      socket.send(JSON.stringify(errorMsg.toJSON()));
      socket.close(4003, 'Authentication failed');
    }
  };
};

// 验证任务权限的中间件
export const validateTaskAccess = (socket, taskId) => {
  if (!socket.userId) {
    throw new Error('User not authenticated');
  }

  // 这里可以添加更复杂的权限验证逻辑
  // 例如检查用户是否有权限访问特定任务

  return {
    taskId,
    userId: socket.userId,
    hasAccess: true,
  };
};

// 心跳检测中间件
export const setupHeartbeat = (socket, interval = 30000) => {
  let pingTimeout;

  // 心跳间隔
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      // 添加 PING 标记
      socket.ping();

      // 设置超时
      pingTimeout = setTimeout(() => {
        console.warn(`[WebSocket] Heartbeat timeout for user: ${socket.userId}`);
        socket.terminate();
      }, interval * 2);
    }
  }, interval);

  // 清理函数
  socket.on('pong', () => {
    clearTimeout(pingTimeout);
  });

  socket.on('close', () => {
    clearInterval(pingInterval);
    clearTimeout(pingTimeout);
  });
};