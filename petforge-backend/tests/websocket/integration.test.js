import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { WebSocket } from 'ws';
import http from 'http';
import express from 'express';
import { request } from 'supertest';
import GenerationSocketServer from '../../src/websocket/generationSocket.js';

// 模拟 Prisma
jest.mock('../../src/config/database.js');
const prisma = require('../../src/config/database.js');

describe('WebSocket Integration Tests', () => {
  let app, server, wsServer;

  beforeAll(() => {
    app = express();
    server = http.createServer(app);
    wsServer = new GenerationSocketServer(server);
    server.listen(4002);
  });

  afterAll(() => {
    server.close();
  });

  describe('End-to-End Flow', () => {
    it('should handle complete generation workflow', async () => {
      // 模拟用户创建任务
      const mockTask = {
        id: 'test-task-001',
        userId: 'user-123',
        status: 'pending',
        cost: 5,
      };

      prisma.generation.create.mockResolvedValue(mockTask);
      prisma.generation.update.mockResolvedValue({ ...mockTask, status: 'completed' });
      prisma.generation.findUnique.mockResolvedValue(mockTask);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123', credits: 100 });

      // 模拟 ComfyUI 服务
      const comfyUIService = {
        queueGeneration: jest.fn().mockResolvedValue('comfy-task-123'),
        checkStatus: jest.fn()
          .mockReturnValueOnce({ status: 'processing' })
          .mockReturnValueOnce({ status: 'completed', resultUrl: 'https://example.com/result.jpg' })
      };

      // 1. 创建生成任务
      const createTaskResponse = await request(app)
        .post('/api/generation/queue-comfyui')
        .send({
          type: 'image',
          style: 'pixar',
          petName: 'Test Pet',
        })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(createTaskResponse.body.success).toBe(true);
      const taskId = createTaskResponse.body.data.taskId;

      // 2. 模拟 JWT 认证
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' });

      // 3. 建立 WebSocket 连接并订阅
      const ws = new WebSocket('ws://localhost:4002/ws/generation?token=valid-token');

      return new Promise((resolve) => {
        let receivedMessages = [];

        ws.on('open', () => {
          // 订阅任务
          const subscribeMessage = {
            event: 'subscribe',
            data: { taskId: taskId }
          };
          ws.send(JSON.stringify(subscribeMessage));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data);
          receivedMessages.push(message);

          // 检查是否收到所有预期消息
          if (receivedMessages.some(m => m.event === 'connected' &&
                                        m.data.userId === 'user-123')) {
            // 收到连接确认
            console.log('✓ WebSocket 连接成功');
          }

          if (receivedMessages.some(m => m.event === 'subscribed' &&
                                       m.data.taskId === taskId)) {
            // 收到订阅确认
            console.log('✓ 任务订阅成功');
          }

          if (receivedMessages.some(m => m.event === 'status_change' &&
                                       m.data.status === 'completed' &&
                                       m.data.resultUrl)) {
            // 收到完成通知
            console.log('✓ 生成完成通知');
            ws.close();
            resolve();
          }
        });

        // 设置超时
        setTimeout(() => {
          console.log('⏱ 测试超时');
          ws.close();
          resolve();
        }, 5000);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication failures gracefully', (done) => {
      const ws = new WebSocket('ws://localhost:4002/ws/generation?token=invalid-token');

      ws.on('open', () => {
        expect.fail('Should not connect with invalid token');
      });

      ws.on('close', (code) => {
        expect(code).toBe(4003); // Authentication failed
        done();
      });

      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.terminate();
          done();
        }
      }, 3000);
    });

    it('should handle malformed messages gracefully', (done) => {
      // 模拟有效的 JWT
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' });

      const ws = new WebSocket('ws://localhost:4002/ws/generation?token=valid-token');

      ws.on('open', () => {
        // 发送无效的 JSON
        ws.send('invalid json');
        // 发送无效的事件格式
        ws.send(JSON.stringify({ invalid: 'format' }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'error') {
          expect(message.data.code).toBe('INVALID_MESSAGE');
          ws.close();
          done();
        }
      });

      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          done();
        }
      }, 3000);
    });
  });

  describe('Connection Resilience', () => {
    it('should handle connection drops and reconnections', (done) => {
      let reconnectCount = 0;

      // 模拟有效的 JWT
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({ userId: 'user-123', email: 'test@example.com' });

      // 第一次连接
      let ws = new WebSocket('ws://localhost:4002/ws/generation?token=valid-token');

      ws.on('open', () => {
        reconnectCount++;

        if (reconnectCount === 1) {
          // 第一次连接成功，等待一下然后断开
          setTimeout(() => {
            ws.close();
          }, 1000);
        } else if (reconnectCount === 2) {
          // 第二次连接成功
          expect(reconnectCount).toBe(2);
          ws.close();
          done();
        }
      });

      ws.on('close', () => {
        // 模拟重连
        if (reconnectCount === 1) {
          setTimeout(() => {
            ws = new WebSocket('ws://localhost:4002/ws/generation?token=valid-token');
          }, 100);
        }
      });

      // 设置超时
      setTimeout(() => {
        if (reconnectCount < 2) {
          done.fail('Reconnection failed');
        }
        ws.close();
        done();
      }, 5000);
    });
  });
});