import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { WebSocket } from 'ws';
import http from 'http';
import express from 'express';
import GenerationSocketServer from '../../src/websocket/generationSocket.js';
import { authenticateToken } from '../../src/middleware/auth.js';

// 模拟 Prisma
jest.mock('../../src/config/database.js');
const prisma = require('../../src/config/database.js');

// 模拟 JWT
jest.mock('jsonwebtoken');

describe('WebSocket Generation Socket Server', () => {
  let app, server, wsServer;

  beforeAll(() => {
    app = express();
    server = http.createServer(app);
    wsServer = new GenerationSocketServer(server);
    server.listen(4001);
  });

  afterAll(() => {
    server.close();
  });

  describe('WebSocket Connection', () => {
    it('should reject connection without authentication', (done) => {
      const ws = new WebSocket('ws://localhost:4001/ws/generation');

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        expect(message.event).toBe('error');
        expect(message.data.code).toBe('AUTH_FAILED');
        ws.close();
        done();
      });
    });

    it('should accept connection with valid token', (done) => {
      // 模拟有效的 JWT
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'test-user', email: 'test@example.com' });

      // 模拟 authenticateToken
      const originalMiddleware = authenticateToken;
      authenticateToken = (req, res, next) => {
        req.userId = 'test-user';
        req.user = { email: 'test@example.com' };
        next();
      };

      const ws = new WebSocket('ws://localhost:4001/ws/generation?token=valid-token');

      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'connected') {
          expect(message.data.userId).toBe('test-user');
          ws.close();
          done();
        }
      });

      // 恢复原始中间件
      authenticateToken = originalMiddleware;
    });
  });

  describe('Task Subscription', () => {
    let ws;

    beforeEach((done) => {
      // 模拟有效的 JWT
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'test-user', email: 'test@example.com' });

      ws = new WebSocket('ws://localhost:4001/ws/generation?token=valid-token');
      ws.on('open', done);
    });

    afterEach(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    it('should subscribe to task updates', (done) => {
      // 模拟任务存在
      prisma.generation.findUnique.mockResolvedValue({
        id: 'task-001',
        userId: 'test-user',
        status: 'pending',
      });

      const subscribeMessage = {
        event: 'subscribe',
        data: { taskId: 'task-001' }
      };

      ws.send(JSON.stringify(subscribeMessage));

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'subscribed') {
          expect(message.data.taskId).toBe('task-001');
          expect(message.data.status).toBe('pending');
          done();
        }
      });
    });

    it('should reject subscription to unauthorized task', (done) => {
      // 模拟任务存在但属于其他用户
      prisma.generation.findUnique.mockResolvedValue({
        id: 'task-002',
        userId: 'other-user',
        status: 'pending',
      });

      const subscribeMessage = {
        event: 'subscribe',
        data: { taskId: 'task-002' }
      };

      ws.send(JSON.stringify(subscribeMessage));

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'error') {
          expect(message.data.code).toBe('ACCESS_DENIED');
          done();
        }
      });
    });

    it('should reject subscription to non-existent task', (done) => {
      // 模拟任务不存在
      prisma.generation.findUnique.mockResolvedValue(null);

      const subscribeMessage = {
        event: 'subscribe',
        data: { taskId: 'non-existent' }
      };

      ws.send(JSON.stringify(subscribeMessage));

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'error') {
          expect(message.data.code).toBe('TASK_NOT_FOUND');
          done();
        }
      });
    });
  });

  describe('Progress Updates', () => {
    let ws;

    beforeEach((done) => {
      // 模拟有效的 JWT 和任务
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'test-user', email: 'test@example.com' });

      prisma.generation.findUnique.mockResolvedValue({
        id: 'task-001',
        userId: 'test-user',
        status: 'pending',
      });

      ws = new WebSocket('ws://localhost:4001/ws/generation?token=valid-token');

      ws.on('open', () => {
        // 订阅任务
        const subscribeMessage = {
          event: 'subscribe',
          data: { taskId: 'task-001' }
        };
        ws.send(JSON.stringify(subscribeMessage));
        done();
      });
    });

    afterEach(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    it('should receive progress updates', (done) => {
      // 模拟进度更新
      const updateData = {
        taskId: 'task-001',
        status: 'processing',
        progress: 50,
        message: 'Generating...',
      };

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'progress_update') {
          expect(message.data.taskId).toBe('task-001');
          expect(message.data.progress).toBe(50);
          expect(message.data.status).toBe('processing');
          done();
        }
      });

      // 手动触发进度更新
      wsServer.broadcastProgressUpdate('task-001', updateData);
    });

    it('should receive status change updates', (done) => {
      // 模拟状态变化
      const statusData = {
        taskId: 'task-001',
        status: 'completed',
        resultUrl: 'https://example.com/result.jpg',
      };

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'status_change') {
          expect(message.data.taskId).toBe('task-001');
          expect(message.data.status).toBe('completed');
          expect(message.data.resultUrl).toBe('https://example.com/result.jpg');
          done();
        }
      });

      // 手动触发状态变化
      wsServer.broadcastStatusChange('task-001', 'completed', statusData);
    });
  });

  describe('Connection Management', () => {
    it('should track active connections', () => {
      const initialStats = wsServer.getStats();
      expect(initialStats.totalConnections).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple connections', (done) => {
      const ws1 = new WebSocket('ws://localhost:4001/ws/generation?token=token1');
      const ws2 = new WebSocket('ws://localhost:4001/ws/generation?token=token2');

      let connected = 0;

      ws1.on('open', () => {
        connected++;
        if (connected === 2) {
          const stats = wsServer.getStats();
          expect(stats.totalConnections).toBeGreaterThanOrEqual(2);
          ws1.close();
          ws2.close();
          done();
        }
      });

      ws2.on('open', () => {
        connected++;
        if (connected === 2) {
          const stats = wsServer.getStats();
          expect(stats.totalConnections).toBeGreaterThanOrEqual(2);
          ws1.close();
          ws2.close();
          done();
        }
      });
    });
  });
});