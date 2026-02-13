import { generationQueue, CONCURRENCY_LIMIT } from './generationQueue.js';
import prisma from '../config/database.js';
import comfyUIService from '../services/comfyUIService.js';
import logger from '../utils/logger.js';

/**
 * AI 生成任务处理器
 * 负责处理队列中的生成任务
 */
export class GenerationProcessor {
  constructor() {
    this.activeJobs = new Set();
    this.maxConcurrentJobs = CONCURRENCY_LIMIT.MAX_ACTIVE_JOBS;
    this.comfyUILimit = 3; // ComfyUI API 限制
  }

  /**
   * 处理生成任务
   */
  async process(job) {
    const { id: jobId, data } = job;
    const {
      type,
      userId,
      prompt,
      style,
      priority,
      inputImage,
      generationId
    } = data;

    // 添加到活动任务集合
    this.activeJobs.add(jobId);

    try {
      logger.info(`Starting generation job ${jobId}`, {
        userId,
        type,
        style,
        priority
      });

      // 更新任务状态为处理中
      await this.updateJobStatus(jobId, 'processing');

      // 并发控制检查
      if (this.activeJobs.size >= this.maxConcurrentJobs) {
        logger.warn(`Max concurrent jobs reached (${this.activeJobs.size}), job ${jobId} will wait`);
        await job.updateProgress(0, { message: 'Waiting for slot available' });
      }

      // ComfyUI 生成
      const result = await this.generateWithComfyUI(data, jobId);

      // 检查生成结果
      if (!result.success || !result.resultUrl) {
        throw new Error(`Generation failed: ${result.error || 'No result URL'}`);
      }

      // 更新任务状态为完成
      await this.updateJobStatus(jobId, 'completed', {
        resultUrl: result.resultUrl,
        comfyTaskId: result.comfyTaskId,
        completedAt: new Date()
      });

      // 更新数据库记录
      await this.updateGenerationRecord(generationId, {
        status: 'completed',
        resultUrl: result.resultUrl,
        completedAt: new Date()
      });

      // 处理用户积分扣除
      await this.handleUserCredits(userId, type);

      logger.info(`Generation job ${jobId} completed successfully`, {
        userId,
        type,
        style,
        resultUrl: result.resultUrl
      });

      // 从活动任务集合中移除
      this.activeJobs.delete(jobId);

      return {
        success: true,
        resultUrl: result.resultUrl,
        comfyTaskId: result.comfyTaskId
      };

    } catch (error) {
      logger.error(`Generation job ${jobId} failed`, {
        error: error.message,
        stack: error.stack,
        userId,
        type
      });

      // 更新任务状态为失败
      await this.updateJobStatus(jobId, 'failed', {
        errorMessage: error.message,
        failedAt: new Date()
      });

      // 更新数据库记录
      await this.updateGenerationRecord(generationId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      });

      // 从活动任务集合中移除
      this.activeJobs.delete(jobId);

      throw error;
    }
  }

  /**
   * 使用 ComfyUI 进行生成
   */
  async generateWithComfyUI(taskData, jobId) {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // 检查 ComfyUI API 是否过载
        const isOverloaded = await this.checkComfyUIOverload();
        if (isOverloaded) {
          logger.warn(`ComfyUI is overloaded, retrying in ${(retryCount + 1) * 2000}ms`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          retryCount++;
          continue;
        }

        // 调用 ComfyUI API
        const comfyTaskId = await comfyUIService.queueGeneration(taskData);
        logger.info(`ComfyUI task queued for job ${jobId}`, {
          comfyTaskId,
          retryCount
        });

        // 等待生成完成
        const result = await comfyUIService.waitForCompletion(
          comfyTaskId,
          3000, // 3秒检查一次
          180   // 最多等待9分钟（180*3秒）
        );

        if (result.status === 'completed') {
          return {
            success: true,
            resultUrl: result.resultUrl,
            comfyTaskId
          };
        } else {
          throw new Error(`ComfyUI generation failed: ${result.error || 'Unknown error'}`);
        }

      } catch (error) {
        retryCount++;
        logger.warn(`ComfyUI generation attempt ${retryCount} failed for job ${jobId}`, {
          error: error.message,
          retryCount,
          maxRetries
        });

        if (retryCount >= maxRetries) {
          throw error;
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
      }
    }
  }

  /**
   * 检查 ComfyUI 是否过载
   */
  async checkComfyUIOverload() {
    try {
      // 这里可以添加检查当前活动 ComfyUI 任务的逻辑
      // 例如检查已有任务数量或 API 响应时间
      const activeComfyUITasks = await generationQueue.getActive();

      // 如果活动任务超过 ComfyUI 限制，认为过载
      return activeComfyUITasks.length >= this.comfyUILimit;
    } catch (error) {
      logger.error('Error checking ComfyUI overload:', error);
      // 出错时保守处理，认为过载
      return true;
    }
  }

  /**
   * 更新任务状态
   */
  async updateJobStatus(jobId, status, additionalData = {}) {
    try {
      const progress = status === 'completed' ? 100 :
                      status === 'processing' ? 50 :
                      status === 'failed' ? 0 : 0;

      await generationQueue.getJob(jobId).updateProgress(progress);

      // 这里可以添加到数据库记录状态更新逻辑
      logger.info(`Job ${jobId} status updated to ${status}`, additionalData);
    } catch (error) {
      logger.error(`Failed to update job ${jobId} status:`, error);
    }
  }

  /**
   * 更新生成记录
   */
  async updateGenerationRecord(generationId, data) {
    try {
      if (!generationId) return;

      const updateData = { ...data };

      // 移除不需要的字段
      delete updateData.userId;
      delete updateData.type;

      await prisma.generation.update({
        where: { id: generationId },
        data: updateData
      });

      logger.info(`Generation record ${generationId} updated`, data);
    } catch (error) {
      logger.error(`Failed to update generation record ${generationId}:`, error);
    }
  }

  /**
   * 处理用户积分扣除
   */
  async handleUserCredits(userId, type) {
    try {
      const requiredCredits = type === '3d' ? 10 : 5;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: requiredCredits
          }
        }
      });

      logger.info(`Credits deducted for user ${userId}`, {
        credits: requiredCredits,
        remaining: user.credits
      });

      // 如果积分不足，记录警告（理论上不应该发生）
      if (user.credits < 0) {
        logger.warn(`User ${userId} has negative credits after deduction`);
      }
    } catch (error) {
      logger.error(`Failed to deduct credits for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 获取活动任务统计
   */
  getActiveStats() {
    return {
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      remainingSlots: this.maxConcurrentJobs - this.activeJobs.size,
      comfyUILimit: this.comfyUILimit
    };
  }
}

// 创建处理器实例
const processor = new GenerationProcessor();

// 注册任务处理器
generationQueue.process('generate', async (job) => {
  return processor.process(job);
});

// 错误处理
generationQueue.on('error', (error) => {
  logger.error('Queue processing error:', error);
});

// 导出处理器
export default processor;