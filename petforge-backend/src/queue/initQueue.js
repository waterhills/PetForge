import logger from '../utils/logger.js';
import { generationQueue, toggleQueue, getQueueStats } from './generationQueue.js';
import { queueMonitor } from './queueMonitor.js';
import processor from './generationProcessor.js';

/**
 * 队列系统初始化和启动
 */
export class QueueInitializer {
  constructor() {
    this.isInitialized = false;
    this.healthCheckInterval = null;
  }

  /**
   * 初始化队列系统
   */
  async init() {
    if (this.isInitialized) {
      logger.warn('Queue system already initialized');
      return;
    }

    try {
      logger.info('Initializing Bull queue system...');

      // 连接 Redis
      await this.connectRedis();

      // 设置队列处理器
      await this.setupProcessors();

      // 启动监控
      this.startMonitoring();

      this.isInitialized = true;
      logger.info('✅ Bull queue system initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize queue system:', error);
      throw error;
    }
  }

  /**
   * 连接 Redis
   */
  async connectRedis() {
    const { generationQueue } = await import('./generationQueue.js');

    try {
      // 检查队列连接状态
      await generationQueue.client;
      logger.info('✅ Redis connection established');
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      throw new Error('Redis connection failed. Please ensure Redis is running on localhost:6379');
    }
  }

  /**
   * 设置队列处理器
   */
  async setupProcessors() {
    // 这里可以添加额外的处理器配置
    logger.info('✅ Queue processors configured');
  }

  /**
   * 启动监控
   */
  startMonitoring() {
    // 启动队列健康检查（30秒间隔）
    queueMonitor.startHealthCheck(30000);
    logger.info('✅ Queue health monitoring started');
  }

  /**
   * 停止队列系统
   */
  async shutdown() {
    if (!this.isInitialized) {
      return;
    }

    try {
      logger.info('Shutting down queue system...');

      // 停止监控
      queueMonitor.stopHealthCheck();

      // 关闭 Redis 连接
      const { generationQueue } = await import('./generationQueue.js');
      await generationQueue.client.quit();

      logger.info('✅ Queue system shutdown complete');
    } catch (error) {
      logger.error('❌ Error during queue shutdown:', error);
    }
  }

  /**
   * 获取队列状态
   */
  async getStatus() {
    try {
      const [stats, health] = await Promise.all([
        getQueueStats(),
        queueMonitor.getQueueHealth()
      ]);

      return {
        isInitialized: this.isInitialized,
        stats,
        health,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get queue status:', error);
      return {
        isInitialized: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建全局队列初始化器实例
export const queueInitializer = new QueueInitializer();

// 在服务器启动时初始化队列系统
if (import.meta.url === `file://${process.argv[1]}`) {
  // 如果直接运行此文件，初始化队列
  queueInitializer.init()
    .then(() => {
      logger.info('Queue initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Queue initialization failed:', error);
      process.exit(1);
    });
}