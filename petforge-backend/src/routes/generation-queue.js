import express from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { addGenerationJob, GENERATION_PRIORITY } from '../queue/generationQueue.js';
import { queueMonitor } from '../queue/queueMonitor.js';
import GenerationSocketServer from '../websocket/generationSocket.js';

// 获取 WebSocket 服务器实例
let wsServer;
const getWsServer = () => {
  if (!wsServer) {
    const server = express();
    wsServer = new GenerationSocketServer(server);
  }
  return wsServer;
};

const router = express.Router();

// Validation schemas
const queueGenerationSchema = z.object({
  type: z.enum(['image', '3d']).optional(),
  style: z.enum(['pixar', 'clay', 'cyber', 'line']).optional(),
  petName: z.string().min(1).max(50).optional(),
  customPrompt: z.string().max(500).optional(),
  inputImage: z.string().optional(),
});

// 新的队列化生成端点
router.post('/queue', authenticateToken, async (req, res) => {
  try {
    console.log('[Queue] Generation request received');

    // Validate request body
    const validatedData = queueGenerationSchema.parse(req.body);
    const { type = 'image', style = 'pixar', petName = '', customPrompt = '', inputImage } = validatedData;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated. Please login again.',
      });
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, isVip: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const requiredCredits = type === '3d' ? 10 : 5;

    if (user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        error: `Insufficient credits. You need at least ${requiredCredits} credits to generate.`,
        credits: user.credits,
        required: requiredCredits,
      });
    }

    console.log('[Queue] User has sufficient credits:', user.credits);

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId,
        type: type === '3d' ? '3d' : '2d',
        status: 'pending',
        prompt: JSON.stringify(validatedData),
        inputImage: inputImage || null,
        cost: requiredCredits,
      },
    });

    const taskId = generation.id;
    console.log('[Queue] Created generation record:', taskId);

    // Determine priority based on user tier
    let priority = GENERATION_PRIORITY.NORMAL;
    if (user.isVip) {
      priority = GENERATION_PRIORITY.HIGH;
    }

    // Add to queue
    const queueResult = await addGenerationJob({
      type,
      userId,
      generationId: taskId,
      prompt: JSON.stringify(validatedData),
      style,
      petName,
      customPrompt,
      inputImage
    }, priority);

    if (!queueResult.success) {
      // Queue failed, rollback database record
      await prisma.generation.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          errorMessage: queueResult.error,
        },
      });

      return res.status(500).json({
        success: false,
        error: `Failed to queue generation: ${queueResult.error}`,
      });
    }

    // Notify WebSocket clients
    const ws = getWsServer();
    ws.emit('generation-queued', {
      taskId,
      userId,
      type,
      priority,
      queueJobId: queueResult.jobId
    });

    console.log('[Queue] Generation job added to queue:', queueResult.jobId);

    // Return task ID for client polling
    res.json({
      success: true,
      data: {
        taskId: taskId,
        queueJobId: queueResult.jobId,
        message: 'Generation queued successfully',
        estimatedTime: '15-30 seconds',
        backend: 'bull-queue',
        priority,
        queuePosition: 0 // 暂时为0，可以通过其他接口获取队列位置
      },
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    console.error('[Queue] Queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue generation',
    });
  }
});

// 获取队列状态
router.get('/queue/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const status = await queueMonitor.getUserQueueStatus(userId);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[Queue] Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status',
    });
  }
});

// 获取队列统计信息
router.get('/queue/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await queueMonitor.getDetailedQueueStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Queue] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue stats',
    });
  }
});

// 获取队列健康状态
router.get('/queue/health', authenticateToken, async (req, res) => {
  try {
    const health = await queueMonitor.getQueueHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('[Queue] Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue health',
    });
  }
});

// 获取队列报告
router.get('/queue/report', authenticateToken, async (req, res) => {
  try {
    const report = await queueMonitor.generateReport();
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('[Queue] Report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate queue report',
    });
  }
});

// 获取慢任务
router.get('/queue/slow-tasks', authenticateToken, async (req, res) => {
  try {
    const { threshold } = req.query;
    const slowTasks = await queueMonitor.getSlowTasks(threshold ? parseInt(threshold) : 300000);
    res.json({
      success: true,
      data: slowTasks
    });
  } catch (error) {
    console.error('[Queue] Slow tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get slow tasks',
    });
  }
});

// 获取失败任务
router.get('/queue/failed-jobs', authenticateToken, async (req, res) => {
  try {
    const { limit } = req.query;
    const failedJobs = await queueMonitor.getFailedJobs(limit ? parseInt(limit) : 10);
    res.json({
      success: true,
      data: failedJobs
    });
  } catch (error) {
    console.error('[Queue] Failed jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get failed jobs',
    });
  }
});

// 重试失败任务
router.post('/queue/:jobId/retry', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const result = await generationQueue.retryJob(jobId);
    res.json(result);
  } catch (error) {
    console.error('[Queue] Retry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry job',
    });
  }
});

// 取消任务
router.delete('/queue/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const result = await generationQueue.removeJob(jobId);
    res.json(result);
  } catch (error) {
    console.error('[Queue] Cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel job',
    });
  }
});

// 启动/停止监控
router.post('/queue/monitoring', authenticateToken, async (req, res) => {
  try {
    const { action, interval } = req.body;

    if (action === 'start') {
      await queueMonitor.startHealthCheck(interval || 30000);
      res.json({
        success: true,
        message: 'Queue monitoring started'
      });
    } else if (action === 'stop') {
      await queueMonitor.stopHealthCheck();
      res.json({
        success: true,
        message: 'Queue monitoring stopped'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }
  } catch (error) {
    console.error('[Queue] Monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle monitoring',
    });
  }
});

export default router;