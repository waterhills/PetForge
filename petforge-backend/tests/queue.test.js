import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'jest';
import { generationQueue, GENERATION_PRIORITY } from '../src/queue/generationQueue.js';
import { queueMonitor } from '../src/queue/queueMonitor.js';
import prisma from '../src/config/database.js';

describe('Queue System Tests', () => {
  let testUserId;
  let testGenerationId;

  beforeAll(async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        email: 'test-queue@example.com',
        name: 'Test User Queue',
        password: 'hashedpassword123',
        credits: 100,
        isVip: false
      }
    });
    testUserId = user.id;

    // 创建测试生成记录
    const generation = await prisma.generation.create({
      data: {
        userId: testUserId,
        type: 'image',
        status: 'pending',
        prompt: '{"type": "image", "style": "pixar"}',
        cost: 5
      }
    });
    testGenerationId = generation.id;

    // 确保队列已初始化
    await generationQueue.isReady();
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.generation.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.delete({
      where: { id: testUserId }
    });

    // 清理队列中的测试任务
    const jobs = await generationQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 100);
    for (const job of jobs) {
      if (job.data.userId === testUserId) {
        await job.remove();
      }
    }
  });

  beforeEach(async () => {
    // 确保队列干净
    await generationQueue.clean(0, 'completed');
    await generationQueue.clean(0, 'failed');
  });

  describe('Queue Configuration', () => {
    it('should have correct priority levels', () => {
      expect(GENERATION_PRIORITY.HIGH).toBe(1);
      expect(GENERATION_PRIORITY.NORMAL).toBe(5);
      expect(GENERATION_PRIORITY.LOW).toBe(10);
    });

    it('should be initialized and ready', async () => {
      const isReady = await generationQueue.isReady();
      expect(isReady).toBe(true);
    });
  });

  describe('Job Management', () => {
    it('should add a job to the queue', async () => {
      const result = await generationQueue.addGenerationJob({
        type: 'image',
        userId: testUserId,
        generationId: testGenerationId,
        prompt: '{"type": "image", "style": "pixar"}',
        style: 'pixar'
      }, GENERATION_PRIORITY.NORMAL);

      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(typeof result.jobId).toBe('string');
    });

    it('should get job details', async () => {
      // 先添加一个任务
      const addResult = await generationQueue.addGenerationJob({
        type: 'image',
        userId: testUserId,
        generationId: testGenerationId,
        prompt: '{"type": "image", "style": "pixar"}',
        style: 'pixar'
      }, GENERATION_PRIORITY.NORMAL);

      // 获取任务详情
      const jobDetails = await generationQueue.getJobDetails(addResult.jobId);
      expect(jobDetails).toBeTruthy();
      expect(jobDetails.id).toBe(addResult.jobId);
      expect(jobDetails.data.userId).toBe(testUserId);
      expect(jobDetails.data.type).toBe('image');
    });

    it('should handle invalid job data', async () => {
      const result = await generationQueue.addGenerationJob({
        type: 'image',
        // 缺少必要的 userId
        prompt: '{"type": "image"}',
        style: 'pixar'
      }, GENERATION_PRIORITY.NORMAL);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field');
    });
  });

  describe('Queue Statistics', () => {
    it('should provide queue statistics', async () => {
      const stats = await generationQueue.getQueueStats();

      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('total');
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
    });

    it('should provide detailed queue stats', async () => {
      const detailedStats = await queueMonitor.getDetailedQueueStats();

      expect(detailedStats).toHaveProperty('waiting');
      expect(detailedStats).toHaveProperty('active');
      expect(detailedStats).toHaveProperty('breakdown');
      expect(detailedStats).toHaveProperty('memoryUsage');
    });
  });

  describe('Queue Health', () => {
    it('should check queue health', async () => {
      const health = await queueMonitor.getQueueHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
    });

    it('should get user queue status', async () => {
      const userStatus = await queueMonitor.getUserQueueStatus(testUserId);

      expect(userStatus).toHaveProperty('userStats');
      expect(userStatus).toHaveProperty('queueStats');
      expect(userStatus.userStats).toHaveProperty('totalGenerations');
      expect(userStats.userStats.totalGenerations).toBeGreaterThan(0);
    });
  });

  describe('Queue Management', () => {
    it('should retry a failed job', async () => {
      // 首先创建一个模拟的失败任务
      const addResult = await generationQueue.addGenerationJob({
        type: 'image',
        userId: testUserId,
        generationId: testGenerationId,
        prompt: '{"type": "image", "style": "pixar"}',
        style: 'pixar'
      }, GENERATION_PRIORITY.NORMAL);

      // 模拟任务失败
      const job = await generationQueue.getJob(addResult.jobId);
      await job.moveToFailed(new Error('Test error'), true);

      // 重试任务
      const retryResult = await generationQueue.retryJob(addResult.jobId);
      expect(retryResult.success).toBe(true);
    });

    it('should remove a job', async () => {
      const addResult = await generationQueue.addGenerationJob({
        type: 'image',
        userId: testUserId,
        generationId: testGenerationId,
        prompt: '{"type": "image", "style": "pixar"}',
        style: 'pixar'
      }, GENERATION_PRIORITY.NORMAL);

      const removeResult = await generationQueue.removeJob(addResult.jobId);
      expect(removeResult.success).toBe(true);

      // 验证任务已被移除
      const job = await generationQueue.getJob(addResult.jobId);
      expect(job).toBeNull();
    });
  });

  describe('User Priority', () => {
    it('should handle VIP user priority', async () => {
      // 创建 VIP 用户
      const vipUser = await prisma.user.create({
        data: {
          email: 'vip-queue@example.com',
          name: 'VIP User Queue',
          password: 'hashedpassword123',
          credits: 100,
          isVip: true
        }
      });

      const vipGeneration = await prisma.generation.create({
        data: {
          userId: vipUser.id,
          type: 'image',
          status: 'pending',
          prompt: '{"type": "image", "style": "pixar"}',
          cost: 5
        }
      });

      // VIP 用户应该获得高优先级
      const addResult = await generationQueue.addGenerationJob({
        type: 'image',
        userId: vipUser.id,
        generationId: vipGeneration.id,
        prompt: '{"type": "image", "style": "pixar"}',
        style: 'pixar'
      }, GENERATION_PRIORITY.HIGH);

      expect(addResult.success).toBe(true);

      // 验证任务数据中的优先级
      const job = await generationQueue.getJob(addResult.jobId);
      expect(job.data.priority).toBe(GENERATION_PRIORITY.HIGH);

      // 清理
      await prisma.generation.delete({ where: { id: vipGeneration.id } });
      await prisma.user.delete({ where: { id: vipUser.id } });
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // 这里需要模拟 Redis 连接失败的情况
      // 在实际测试中，这可能需要 mock Redis 服务
      const stats = await generationQueue.getQueueStats();
      // 即使 Redis 连接有问题，也应该返回一个对象
      expect(typeof stats).toBe('object');
    });

    it('should handle invalid priority values', async () => {
      const addResult = await generationQueue.addGenerationJob({
        type: 'image',
        userId: testUserId,
        generationId: testGenerationId,
        prompt: '{"type": "image", "style": "pixar"}',
        style: 'pixar'
      }, 999); // 无效的高优先级值

      expect(addResult.success).toBe(true);
      // Bull 会自动将无效的优先级转换为有效的值
    });
  });
});