#!/usr/bin/env node

// WebSocket 功能测试脚本
import { WebSocket } from 'ws';
import http from 'http';

console.log('🚀 WebSocket 测试脚本启动...\n');

// 创建测试服务器
const app = require('express')();
const server = http.createServer(app);
const GenerationSocketServer = require('./src/websocket/generationSocket.js');

const wsServer = new GenerationSocketServer(server);
const PORT = 4001;

server.listen(PORT, () => {
  console.log(`📡 测试服务器运行在 http://localhost:${PORT}`);
  console.log(`🔌 WebSocket 端点: ws://localhost:${PORT}/ws/generation\n`);
});

// 模拟 JWT 认证
const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');

const validUserToken = jwt.sign(
  { userId: 'test-user', email: 'test@example.com' },
  'test-secret'
);

const invalidToken = 'invalid-token';

// 测试函数
async function runTests() {
  console.log('🧪 开始运行 WebSocket 测试...\n');

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // 测试 1: 无认证连接
    console.log('📝 测试 1: 无认证连接');
    await testUnauthenticatedConnection();
    console.log('✅ 测试 1 通过\n');

    // 测试 2: 有效认证连接
    console.log('📝 测试 2: 有效认证连接');
    await testAuthenticatedConnection();
    console.log('✅ 测试 2 通过\n');

    // 测试 3: 任务订阅
    console.log('📝 测试 3: 任务订阅');
    await testTaskSubscription();
    console.log('✅ 测试 3 通过\n');

    // 测试 4: 进度推送
    console.log('📝 测试 4: 进度推送');
    await testProgressPush();
    console.log('✅ 测试 4 通过\n');

    // 测试 5: 错误处理
    console.log('📝 测试 5: 错误处理');
    await testErrorHandling();
    console.log('✅ 测试 5 通过\n');

    console.log('🎉 所有测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    server.close();
  }
}

// 测试 1: 无认证连接
function testUnauthenticatedConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws/generation`);

    ws.on('open', () => {
      ws.close();
      reject(new Error('不应该连接成功'));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.event === 'error') {
        expect(message.data.code).toBe('AUTH_FAILED');
        ws.close();
        resolve();
      }
    });

    ws.on('close', (code) => {
      if (code !== 1005) { // 正常关闭
        expect(code).toBe(4003);
        resolve();
      }
    });

    // 超时
    setTimeout(() => {
      ws.terminate();
      resolve();
    }, 3000);
  });
}

// 测试 2: 有效认证连接
function testAuthenticatedConnection() {
  return new Promise((resolve, reject) => {
    // 模拟 JWT 验证
    jwt.verify.mockReturnValue({ userId: 'test-user', email: 'test@example.com' });

    const ws = new WebSocket(`ws://localhost:${PORT}/ws/generation?token=${validUserToken}`);

    ws.on('open', () => {
      // 检查是否收到连接确认
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'connected') {
          expect(message.data.userId).toBe('test-user');
          ws.close();
          resolve();
        }
      });
    });

    ws.on('error', reject);

    // 超时
    setTimeout(() => {
      ws.terminate();
      reject(new Error('连接超时'));
    }, 3000);
  });
}

// 测试 3: 任务订阅
function testTaskSubscription() {
  return new Promise((resolve, reject) => {
    // 模拟任务存在
    const prisma = require('./src/config/database.js');
    prisma.generation.findUnique.mockResolvedValue({
      id: 'task-001',
      userId: 'test-user',
      status: 'pending',
    });

    const ws = new WebSocket(`ws://localhost:${PORT}/ws/generation?token=${validUserToken}`);

    ws.on('open', () => {
      // 发送订阅消息
      ws.send(JSON.stringify({
        event: 'subscribe',
        data: { taskId: 'task-001' }
      }));

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'subscribed') {
          expect(message.data.taskId).toBe('task-001');
          ws.close();
          resolve();
        }
      });
    });

    ws.on('error', reject);

    // 超时
    setTimeout(() => {
      ws.terminate();
      reject(new Error('订阅超时'));
    }, 3000);
  });
}

// 测试 4: 进度推送
function testProgressPush() {
  return new Promise((resolve, reject) => {
    const updateData = {
      taskId: 'task-001',
      status: 'processing',
      progress: 50,
      message: 'Generating... 50%',
    };

    let receivedUpdate = false;

    const ws = new WebSocket(`ws://localhost:${PORT}/ws/generation?token=${validUserToken}`);

    ws.on('open', () => {
      // 先订阅
      ws.send(JSON.stringify({
        event: 'subscribe',
        data: { taskId: 'task-001' }
      }));

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'subscribed') {
          // 接收订阅确认后触发进度更新
          wsServer.broadcastProgressUpdate('task-001', updateData);
        } else if (message.event === 'progress_update') {
          expect(message.data.taskId).toBe('task-001');
          expect(message.data.progress).toBe(50);
          expect(message.data.status).toBe('processing');
          receivedUpdate = true;
          ws.close();
          resolve();
        }
      });
    });

    ws.on('error', reject);

    // 超时
    setTimeout(() => {
      ws.terminate();
      if (!receivedUpdate) {
        reject(new Error('未收到进度更新'));
      } else {
        resolve();
      }
    }, 3000);
  });
}

// 测试 5: 错误处理
function testErrorHandling() {
  return new Promise((resolve, reject) => {
    // 模拟任务不存在
    const prisma = require('./src/config/database.js');
    prisma.generation.findUnique.mockResolvedValue(null);

    const ws = new WebSocket(`ws://localhost:${PORT}/ws/generation?token=${validUserToken}`);

    ws.on('open', () => {
      // 尝试订阅不存在的任务
      ws.send(JSON.stringify({
        event: 'subscribe',
        data: { taskId: 'non-existent-task' }
      }));

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.event === 'error') {
          expect(message.data.code).toBe('TASK_NOT_FOUND');
          ws.close();
          resolve();
        }
      });
    });

    ws.on('error', reject);

    // 超时
    setTimeout(() => {
      ws.terminate();
      resolve();
    }, 3000);
  });
}

// 运行测试
runTests()
  .then(() => {
    console.log('\n🏁 测试完成，服务器已关闭');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 测试失败:', error);
    server.close();
    process.exit(1);
  });