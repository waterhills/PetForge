import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import helmet from 'helmet';
import GenerationSocketServer from './websocket/generationSocket.js';
import { generalLimiter, authLimiter, paymentLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { validateEnv } from './utils/env.js';
import { requestId } from './middleware/requestId.js';

dotenv.config();

// Validate environment variables before starting
validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// 创建 HTTP 服务器用于 WebSocket
const server = http.createServer(app);

// Request ID middleware (must be first)
app.use(requestId);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
}));

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow multipart form data for file uploads
  crossOriginOpenerPolicy: { policy: "same-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/upload-image', uploadLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PetForge API Server is running' });
});

// API Routes
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/user', (await import('./routes/user.js')).default);
app.use('/api/upload', (await import('./routes/upload.js')).default);
app.use('/api/upload-image', (await import('./routes/upload-image.js')).default);
app.use('/api/petips', (await import('./routes/petips.js')).default);
app.use('/api/cart', (await import('./routes/cart.js')).default);
app.use('/api/orders', (await import('./routes/orders.js')).default);
app.use('/api/payments', (await import('./routes/payments.js')).default);
app.use('/api/addresses', (await import('./routes/addresses.js')).default);
app.use('/api/payments/wechat', (await import('./routes/payments-wechat.js')).default);
app.use('/api/payments/alipay', (await import('./routes/payments-alipay.js')).default);
app.use('/api/points', (await import('./routes/points.js')).default);
app.use('/api/admin', (await import('./routes/admin.js')).default);
app.use('/api/admin', (await import('./routes/admin-rbac.js')).default);
app.use('/api/community', (await import('./routes/community.js')).default);

// Prompt Optimization Routes
app.use('/api/prompt-optimization', (await import('./routes/prompt-optimization.js')).default);

// Import generation routes
import generationRouter from './routes/generation.js';
import simpleGenerationRouter from './routes/generation-simple.js';
import comfyUIRouter from './routes/generation-comfyui.js';
import queueGenerationRouter from './routes/generation-queue.js';
import { queueInitializer } from './queue/initQueue.js';

// Enable ComfyUI routes (real AI generation)
app.use('/api/generation', comfyUIRouter);
// Enable Bull queue routes
app.use('/api/generation', queueGenerationRouter);

// Error handling middleware
import { errorHandler, notFoundHandler } from './utils/logger.js';

// Custom error handler
app.use(errorHandler);

// 404 handler
app.use(notFoundHandler);


// 启动 WebSocket 服务器
const wsServer = new GenerationSocketServer(server);

// 初始化队列系统
async function initializeQueueSystem() {
  try {
    await queueInitializer.init();
    console.log('✅ Queue system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize queue system:', error);
    process.exit(1);
  }
}

// 启动服务器
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════╗
║     🐾 PetForge Backend API Server         ║
╠═══════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}                      ║
║  HTTP Port: ${PORT}                            ║
║  WebSocket: ws://localhost:${PORT}/ws/generation  ║
║  Queue: Bull + Redis Ready     ║
╚══════════════════════════════════╝

`);

  // 输出队列系统状态
  setInterval(() => {
    const status = queueInitializer.getStatus();
    if (status.isInitialized) {
      console.log(`[Queue] Status: ${status.health.status}, Active: ${status.stats.active}, Waiting: ${status.stats.waiting}`);
    }
  }, 60000);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await queueInitializer.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await queueInitializer.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
