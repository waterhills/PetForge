import Bull from 'bull';
import { createClient } from 'redis';
import logger from '../utils/logger.js';

/**
 * AI 生成任务队列配置
 * 使用 Bull + Redis 实现任务队列系统
 */
export const GENERATION_PRIORITY = {
  HIGH: 1,      // VIP 用户，优先处理
  NORMAL: 5,    // 普通用户，默认处理
  LOW: 10       // 批量生成，最后处理
};

// 创建 Redis 客户端
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// 连接 Redis
redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

// 创建生成队列
export const generationQueue = new Bull('generation', {
  redis: {
    port: parseInt(process.env.REDIS_PORT || 6379),
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || 0)
  },
  defaultJobOptions: {
    removeOnComplete: 50,  // 保留最近的50个已完成任务
    removeOnFail: 20,      // 保留最近的20个失败任务
    attempts: 3,          // 最大重试次数
    backoff: {
      type: 'exponential',
      delay: 2000          // 指数退避，2秒开始
    },
    removeOnComplete: {
      age: 24 * 60 * 60 * 1000  // 24小时后删除已完成任务
    }
  },
  limiter: {
    max: 10,               // 每秒最多处理10个任务
    duration: 1000
  }
});

// 并发控制信号量
export const CONCURRENCY_LIMIT = {
  MAX_JOBS_PER_WORKER: 2,  // 每个工作进程最多同时处理2个任务
  MAX_ACTIVE_JOBS: 5,      // 整个队列最多同时处理5个任务
};

// 队列事件监听
generationQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, {
    type: job.data.type,
    userId: job.data.userId,
    style: job.data.style,
    priority: job.data.priority
  });
});

generationQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed`, {
    error: err.message,
    type: job.data.type,
    userId: job.data.userId,
    style: job.data.style,
    priority: job.data.priority,
    attempt: job.attemptsMade
  });
});

generationQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`, {
    type: job.data.type,
    userId: job.data.userId
  });
});

generationQueue.on('progress', (job, progress) => {
  logger.info(`Job ${job.id} progress: ${progress}%`, {
    userId: job.data.userId,
    type: job.data.type,
    progress
  });
});

// 队列统计信息
export async function getQueueStats() {
  const waiting = await generationQueue.getWaiting();
  const active = await generationQueue.getActive();
  const completed = await generationQueue.getCompleted();
  const failed = await generationQueue.getFailed();
  const delayed = await generationQueue.getDelayed();
  const paused = await generationQueue.isPaused();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
    paused,
    total: waiting.length + active.length + completed.length + failed.length + delayed.length
  };
}

// 添加生成任务
export async function addGenerationJob(jobData, priority = GENERATION_PRIORITY.NORMAL) {
  try {
    // 验证必要字段
    const requiredFields = ['type', 'userId', 'prompt'];
    for (const field of requiredFields) {
      if (!jobData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // 创建任务数据副本（不可变）
    const jobDataCopy = { ...jobData, priority };

    logger.info('Adding generation job to queue', {
      userId: jobData.userId,
      type: jobData.type,
      style: jobData.style,
      priority
    });

    const job = await generationQueue.add('generate', jobDataCopy, {
      priority,
      delay: priority === GENERATION_PRIORITY.LOW ? 5000 : 0, // 低优先级任务延迟5秒
      removeOnComplete: {
        age: 24 * 60 * 60 * 1000 // 24小时后删除
      }
    });

    return {
      success: true,
      jobId: job.id,
      message: 'Generation job added to queue'
    };

  } catch (error) {
    logger.error('Failed to add generation job:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取任务详情
export async function getJobDetails(jobId) {
  try {
    const job = await generationQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      data: job.data,
      progress: job.progress(),
      attempts: job.attemptsMade,
      priority: job.opts.priority,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      failedReason: failedReason,
      stacktrace: job.stacktrace,
      state: await job.getState()
    };
  } catch (error) {
    logger.error('Failed to get job details:', error);
    return null;
  }
}

// 重试失败任务
export async function retryJob(jobId) {
  try {
    const job = await generationQueue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (await job.isFailed()) {
      await job.retry();
      logger.info(`Job ${jobId} retry initiated`);
      return { success: true, message: 'Job retry initiated' };
    } else {
      throw new Error('Job is not in failed state');
    }
  } catch (error) {
    logger.error('Failed to retry job:', error);
    return { success: false, error: error.message };
  }
}

// 取消任务
export async function removeJob(jobId) {
  try {
    const job = await generationQueue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    await job.remove();
    logger.info(`Job ${jobId} removed from queue`);
    return { success: true, message: 'Job removed from queue' };
  } catch (error) {
    logger.error('Failed to remove job:', error);
    return { success: false, error: error.message };
  }
}

// 暂停/恢复队列
export async function toggleQueue(paused = true) {
  try {
    if (paused) {
      await generationQueue.pause();
      logger.info('Generation queue paused');
    } else {
      await generationQueue.resume();
      logger.info('Generation queue resumed');
    }
    return { success: true, paused };
  } catch (error) {
    logger.error('Failed to toggle queue:', error);
    return { success: false, error: error.message };
  }
}

// 清理旧任务
export async function cleanOldJobs(olderThan = 24 * 60 * 60 * 1000) {
  try {
    const removedCount = await generationQueue.clean(olderThan, 'completed');
    logger.info(`Cleaned up ${removedCount} old completed jobs`);
    return { success: true, removedCount };
  } catch (error) {
    logger.error('Failed to clean old jobs:', error);
    return { success: false, error: error.message };
  }
}

export default {
  generationQueue,
  GENERATION_PRIORITY,
  CONCURRENCY_LIMIT,
  getQueueStats,
  addGenerationJob,
  getJobDetails,
  retryJob,
  removeJob,
  toggleQueue,
  cleanOldJobs
};