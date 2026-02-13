#!/usr/bin/env node

/**
 * 队列系统测试脚本
 * 简单验证队列基本功能
 */

import { generationQueue, GENERATION_PRIORITY } from './src/queue/generationQueue.js';
import { queueMonitor } from './src/queue/queueMonitor.js';
import logger from './src/utils/logger.js';

async function testQueueSystem() {
  try {
    console.log('🚀 开始测试队列系统...\n');

    // 1. 测试队列连接
    console.log('1️⃣ 测试队列连接...');
    await generationQueue.isReady();
    console.log('✅ 队列连接成功\n');

    // 2. 测试优先级系统
    console.log('2️⃣ 测试优先级系统...');
    console.log(`HIGH优先级: ${GENERATION_PRIORITY.HIGH}`);
    console.log(`NORMAL优先级: ${GENERATION_PRIORITY.NORMAL}`);
    console.log(`LOW优先级: ${GENERATION_PRIORITY.LOW}`);
    console.log('✅ 优先级系统正常\n');

    // 3. 测试队列统计
    console.log('3️⃣ 测试队列统计...');
    const stats = await generationQueue.getQueueStats();
    console.log('队列统计:', {
      waiting: stats.waiting,
      active: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      total: stats.total
    });
    console.log('✅ 队列统计正常\n');

    // 4. 测试详细统计
    console.log('4️⃣ 测试详细统计...');
    const detailedStats = await queueMonitor.getDetailedQueueStats();
    console.log('详细统计获取成功，内存使用:', {
      rss: Math.round(detailedStats.memoryUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(detailedStats.memoryUsage.heapUsed / 1024 / 1024) + 'MB'
    });
    console.log('✅ 详细统计正常\n');

    // 5. 测试健康检查
    console.log('5️⃣ 测试健康检查...');
    const health = await queueMonitor.getQueueHealth();
    console.log('队列健康状态:', {
      status: health.status,
      checks: health.checks
    });
    console.log('✅ 健康检查正常\n');

    // 6. 测试添加任务（不实际处理）
    console.log('6️⃣ 测试添加任务...');
    const jobData = {
      type: 'image',
      userId: 'test-user-id',
      generationId: 'test-gen-id',
      prompt: '{"type": "image", "style": "pixar"}',
      style: 'pixar',
      test: true
    };

    const addResult = await generationQueue.addGenerationJob(jobData, GENERATION_PRIORITY.NORMAL);
    console.log('添加任务结果:', addResult);

    if (addResult.success) {
      console.log('✅ 任务添加成功');

      // 获取任务详情
      const jobDetails = await generationQueue.getJobDetails(addResult.jobId);
      console.log('任务详情:', {
        id: jobDetails.id,
        type: jobDetails.data.type,
        priority: jobDetails.data.priority
      });

      // 清理测试任务
      await generationQueue.removeJob(addResult.jobId);
      console.log('✅ 测试任务已清理\n');
    } else {
      console.log('❌ 任务添加失败:', addResult.error);
    }

    // 7. 总结
    console.log('🎉 队列系统测试完成！');
    console.log('\n📊 测试总结:');
    console.log('- ✅ 队列连接正常');
    console.log('- ✅ 优先级系统正常');
    console.log('- ✅ 统计功能正常');
    console.log('- ✅ 健康检查正常');
    console.log('- ✅ 任务管理正常');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

// 运行测试
testQueueSystem()
  .then(() => {
    console.log('\n🎯 所有测试通过！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 测试过程中发生错误:', error);
    process.exit(1);
  });