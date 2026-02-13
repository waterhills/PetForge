import { generationQueue, getQueueStats } from './generationQueue.js';
import processor from './generationProcessor.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 队列监控服务
 * 提供队列状态监控和管理功能
 */
export class QueueMonitor {
  constructor() {
    this.healthCheckInterval = null;
    this.isMonitoring = false;
  }

  /**
   * 获取详细队列状态
   */
  async getDetailedQueueStats() {
    try {
      const [basicStats, jobCountsByType, jobCountsByPriority, jobCountsByStatus] = await Promise.all([
        getQueueStats(),
        this.getJobCountsByType(),
        this.getJobCountsByPriority(),
        this.getJobCountsByStatus()
      ]);

      const activeStats = processor.getActiveStats();

      return {
        ...basicStats,
        breakdown: {
          byType: jobCountsByType,
          byPriority: jobCountsByPriority,
          byStatus: jobCountsByStatus
        },
        activeStats,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get detailed queue stats:', error);
      throw error;
    }
  }

  /**
   * 获取按类型统计的任务数量
   */
  async getJobCountsByType() {
    try {
      const types = ['image', '3d'];
      const counts = {};

      for (const type of types) {
        const waiting = await generationQueue.getWaiting([0, 100], type);
        const active = await generationQueue.getActive([0, 100], type);
        counts[type] = {
          waiting: waiting.filter(job => job.data.type === type).length,
          active: active.filter(job => job.data.type === type).length
        };
      }

      return counts;
    } catch (error) {
      logger.error('Failed to get job counts by type:', error);
      return {};
    }
  }

  /**
   * 获取按优先级统计的任务数量
   */
  async getJobCountsByPriority() {
    try {
      const waitingJobs = await generationQueue.getWaiting([0, 100]);
      const activeJobs = await generationQueue.getActive([0, 100]);

      const priorityCounts = {
        HIGH: { waiting: 0, active: 0 },
        NORMAL: { waiting: 0, active: 0 },
        LOW: { waiting: 0, active: 0 }
      };

      // 统计等待中的任务
      waitingJobs.forEach(job => {
        const priority = job.data.priority || 5;
        if (priority === 1) priorityCounts.HIGH.waiting++;
        else if (priority === 10) priorityCounts.LOW.waiting++;
        else priorityCounts.NORMAL.waiting++;
      });

      // 统计活动中的任务
      activeJobs.forEach(job => {
        const priority = job.data.priority || 5;
        if (priority === 1) priorityCounts.HIGH.active++;
        else if (priority === 10) priorityCounts.LOW.active++;
        else priorityCounts.NORMAL.active++;
      });

      return priorityCounts;
    } catch (error) {
      logger.error('Failed to get job counts by priority:', error);
      return {};
    }
  }

  /**
   * 获取按状态统计的任务数量
   */
  async getJobCountsByStatus() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        generationQueue.getWaiting([0, 100]),
        generationQueue.getActive([0, 100]),
        generationQueue.getCompleted([0, 100]),
        generationQueue.getFailed([0, 100]),
        generationQueue.getDelayed([0, 100])
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      };
    } catch (error) {
      logger.error('Failed to get job counts by status:', error);
      return {};
    }
  }

  /**
   * 获取队列健康状态
   */
  async getQueueHealth() {
    try {
      const stats = await getQueueStats();
      const activeStats = processor.getActiveStats();

      const health = {
        status: 'healthy',
        checks: {
          queueActive: stats.active < stats.total * 0.8,
          concurrentJobs: activeStats.activeJobs < activeStats.maxConcurrentJobs,
          waitingJobs: stats.waiting < 50, // 队列积压检查
          redisConnection: true // 假设 Redis 连接正常
        },
        metrics: {
          ...stats,
          ...activeStats
        }
      };

      // 评估健康状态
      const failedChecks = Object.values(health.checks).filter(check => !check).length;

      if (failedChecks >= 2) {
        health.status = 'critical';
      } else if (failedChecks >= 1) {
        health.status = 'warning';
      }

      health.checks.failedCount = failedChecks;

      return health;
    } catch (error) {
      logger.error('Failed to get queue health:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 获取用户队列状态
   */
  async getUserQueueStatus(userId) {
    try {
      const [generations, queueStats] = await Promise.all([
        prisma.generation.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        getQueueStats()
      ]);

      const userStats = {
        totalGenerations: generations.length,
        completed: generations.filter(g => g.status === 'completed').length,
        failed: generations.filter(g => g.status === 'failed').length,
        pending: generations.filter(g => g.status === 'pending').length,
        inProgress: generations.filter(g => g.status === 'processing').length
      };

      return {
        userStats,
        queueStats,
        recentGenerations: generations.map(g => ({
          id: g.id,
          type: g.type,
          status: g.status,
          createdAt: g.createdAt,
          completedAt: g.completedAt,
          cost: g.cost
        }))
      };
    } catch (error) {
      logger.error('Failed to get user queue status:', error);
      throw error;
    }
  }

  /**
   * 获取慢任务
   */
  async getSlowTasks(threshold = 300000) { // 5分钟
    try {
      const activeJobs = await generationQueue.getActive([0, 100]);
      const now = Date.now();
      const slowJobs = [];

      for (const job of activeJobs) {
        const duration = now - job.timestamp;
        if (duration > threshold) {
          slowJobs.push({
            id: job.id,
            data: job.data,
            duration,
            progress: job.progress()
          });
        }
      }

      return slowJobs;
    } catch (error) {
      logger.error('Failed to get slow tasks:', error);
      return [];
    }
  }

  /**
   * 获取失败任务详情
   */
  async getFailedJobs(limit = 10) {
    try {
      const failedJobs = await generationQueue.getFailed([0, limit]);

      const detailedJobs = await Promise.all(
        failedJobs.map(async (job) => ({
          id: job.id,
          data: job.data,
          failedAt: job.finishedOn,
          attempts: job.attemptsMade,
          failedReason: job.failedReason,
          stacktrace: job.stacktrace,
          timestamp: job.timestamp
        }))
      );

      return detailedJobs;
    } catch (error) {
      logger.error('Failed to get failed jobs:', error);
      return [];
    }
  }

  /**
   * 开始健康检查
   */
  startHealthCheck(interval = 30000) { // 30秒
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.isMonitoring = true;
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getQueueHealth();

        if (health.status === 'critical') {
          logger.error('Queue health critical!', health);
          // 这里可以添加告警逻辑
        } else if (health.status === 'warning') {
          logger.warn('Queue health warning', health);
        }
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    }, interval);

    logger.info(`Started queue health check with ${interval}ms interval`);
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Stopped queue health check');
  }

  /**
   * 生成队列报告
   */
  async generateReport() {
    try {
      const [stats, health, slowTasks, failedJobs] = await Promise.all([
        this.getDetailedQueueStats(),
        this.getQueueHealth(),
        this.getSlowTasks(),
        this.getFailedJobs(5)
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          status: health.status,
          totalJobs: stats.total,
          activeJobs: stats.active,
          waitingJobs: stats.waiting,
          completedJobs: stats.completed,
          failedJobs: stats.failed,
          slowTasks: slowTasks.length
        },
        breakdown: stats.breakdown,
        health: health,
        slowTasks,
        recentFailures: failedJobs
      };

      logger.info('Queue report generated', report);
      return report;
    } catch (error) {
      logger.error('Failed to generate queue report:', error);
      throw error;
    }
  }
}

// 创建监控实例
export const queueMonitor = new QueueMonitor();

// 导出 Express 路由
export function getQueueRoutes() {
  return {
    // 获取队列统计
    async getQueueStats(req, res) {
      try {
        const stats = await queueMonitor.getDetailedQueueStats();
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error('Get queue stats error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get queue stats'
        });
      }
    },

    // 获取队列健康状态
    async getQueueHealth(req, res) {
      try {
        const health = await queueMonitor.getQueueHealth();
        res.json({
          success: true,
          data: health
        });
      } catch (error) {
        logger.error('Get queue health error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get queue health'
        });
      }
    },

    // 获取用户队列状态
    async getUserQueueStatus(req, res) {
      try {
        const { userId } = req.params;
        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'User ID is required'
          });
        }

        const status = await queueMonitor.getUserQueueStatus(userId);
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        logger.error('Get user queue status error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get user queue status'
        });
      }
    },

    // 获取慢任务
    async getSlowTasks(req, res) {
      try {
        const { threshold } = req.query;
        const slowTasks = await queueMonitor.getSlowTasks(threshold ? parseInt(threshold) : 300000);
        res.json({
          success: true,
          data: slowTasks
        });
      } catch (error) {
        logger.error('Get slow tasks error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get slow tasks'
        });
      }
    },

    // 获取失败任务
    async getFailedJobs(req, res) {
      try {
        const { limit } = req.query;
        const failedJobs = await queueMonitor.getFailedJobs(limit ? parseInt(limit) : 10);
        res.json({
          success: true,
          data: failedJobs
        });
      } catch (error) {
        logger.error('Get failed jobs error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get failed jobs'
        });
      }
    },

    // 生成队列报告
    async generateReport(req, res) {
      try {
        const report = await queueMonitor.generateReport();
        res.json({
          success: true,
          data: report
        });
      } catch (error) {
        logger.error('Generate report error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to generate queue report'
        });
      }
    },

    // 启动/停止监控
    async toggleMonitoring(req, res) {
      try {
        const { action } = req.body;

        if (action === 'start') {
          const { interval = 30000 } = req.body;
          queueMonitor.startHealthCheck(interval);
          res.json({
            success: true,
            message: 'Monitoring started'
          });
        } else if (action === 'stop') {
          queueMonitor.stopHealthCheck();
          res.json({
            success: true,
            message: 'Monitoring stopped'
          });
        } else {
          res.status(400).json({
            success: false,
            error: 'Invalid action'
          });
        }
      } catch (error) {
        logger.error('Toggle monitoring error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to toggle monitoring'
        });
      }
    }
  };
}

export default queueMonitor;