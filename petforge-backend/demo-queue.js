#!/usr/bin/env node

/**
 * PetForge 队列系统演示
 * 展示如何使用 Bull + Redis 队列系统
 */

import { generationQueue, GENERATION_PRIORITY } from './src/queue/generationQueue.js';
import { queueMonitor } from './src/queue/queueMonitor.js';
import logger from './src/utils/logger.js';

async function demoQueueSystem() {
  console.log(`
🐾 PetForge Bull 队列系统演示
==============================

`);

  // 1. 显示队列状态
  console.log('1️⃣ 当前队列状态:');
  const stats = await generationQueue.getQueueStats();
  console.log(`   等待中: ${stats.waiting} 个任务`);
  console.log(`   处理中: ${stats.active} 个任务`);
  console.log(`   已完成: ${stats.completed} 个任务`);
  console.log(`   失败: ${stats.failed} 个任务\n`);

  // 2. 显示健康状态
  console.log('2️⃣ 队列健康状态:');
  const health = await queueMonitor.getQueueHealth();
  console.log(`   状态: ${health.status}`);
  console.log(`   Redis 连接: ${health.checks.redisConnection ? '正常' : '异常'}`);
  console.log(`   并发控制: ${health.checks.concurrentJobs ? '正常' : '警告'}\n`);

  // 3. 模拟添加不同优先级的任务
  console.log('3️⃣ 模拟添加任务:');

  const demoTasks = [
    { priority: GENERATION_PRIORITY.HIGH, type: 'VIP用户', count: 2 },
    { priority: GENERATION_PRIORITY.NORMAL, type: '普通用户', count: 3 },
    { priority: GENERATION_PRIORITY.LOW, type: '批量任务', count: 1 }
  ];

  for (const task of demoTasks) {
    console.log(`   添加 ${task.count} 个 ${task.type} 任务 (优先级: ${task.priority})`);

    for (let i = 0; i < task.count; i++) {
      const jobData = {
        type: 'image',
        userId: `user-${task.priority}-${i}`,
        generationId: `gen-${task.priority}-${i}`,
        prompt: JSON.stringify({
          type: 'image',
          style: 'pixar',
          name: `${task.type}-任务${i + 1}`
        }),
        style: 'pixar',
        demo: true
      };

      const result = await generationQueue.addGenerationJob(jobData, task.priority);
      if (result.success) {
        console.log(`   ✅ 任务 ${result.jobId} 已添加`);
      } else {
        console.log(`   ❌ 添加失败: ${result.error}`);
      }
    }
    console.log('');
  }

  // 4. 显示添加任务后的状态
  console.log('4️⃣ 添加任务后队列状态:');
  const newStats = await generationQueue.getQueueStats();
  console.log(`   等待中: ${newStats.waiting} 个任务`);
  console.log(`   处理中: ${newStats.active} 个任务\n`);

  // 5. 显示队列详细统计
  console.log('5️⃣ 队列详细统计:');
  const detailedStats = await queueMonitor.getDetailedQueueStats();
  console.log(`   内存使用: ${Math.round(detailedStats.memoryUsage.heapUsed / 1024 / 1024)}MB`);
  console.log(`   活动任务: ${detailedStats.activeJobs}`);
  console.log(`   剩余槽位: ${detailedStats.remainingSlots}\n`);

  // 6. 演示获取任务详情
  console.log('6️⃣ 获取任务详情:');
  const waitingJobs = await generationQueue.getWaiting([0, 5]);
  if (waitingJobs.length > 0) {
    const firstJob = waitingJobs[0];
    const jobDetails = await generationQueue.getJobDetails(firstJob.id);
    console.log(`   任务ID: ${jobDetails.id}`);
    console.log(`   用户ID: ${jobDetails.data.userId}`);
    console.log(`   类型: ${jobDetails.data.type}`);
    console.log(`   优先级: ${jobDetails.data.priority}`);
    console.log(`   创建时间: ${new Date(jobDetails.timestamp).toLocaleString()}\n`);
  }

  // 7. 演示取消任务
  console.log('7️⃣ 取消最后一个任务:');
  if (newStats.waiting > 0) {
    const lastJob = waitingJobs[waitingJobs.length - 1];
    const removeResult = await generationQueue.removeJob(lastJob.id);
    console.log(`   取消结果: ${removeResult.success ? '成功' : '失败'}`);

    // 显示取消后的状态
    const finalStats = await generationQueue.getQueueStats();
    console.log(`   等待中: ${finalStats.waiting} 个任务\n`);
  }

  // 8. 生成队列报告
  console.log('8️⃣ 生成队列报告:');
  const report = await queueMonitor.generateReport();
  console.log(`   生成时间: ${new Date(report.generatedAt).toLocaleString()}`);
  console.log(`   总任务数: ${report.summary.totalJobs}`);
  console.log(`   完成率: ${Math.round((report.summary.completedJobs / report.summary.totalJobs) * 100)}%\n`);

  // 9. 清理演示任务
  console.log('9️⃣ 清理演示任务:');
  const allJobs = await generationQueue.getJobs(['waiting', 'active', 'completed'], 0, 100);
  const demoJobs = allJobs.filter(job => job.data.demo);

  console.log(`   找到 ${demoJobs.length} 个演示任务`);
  for (const job of demoJobs) {
    await job.remove();
    console.log(`   ✅ 已清理任务 ${job.id}`);
  }

  // 10. 最终状态
  console.log('\n🎉 演示完成!');
  console.log('\n最终队列状态:');
  const finalStats = await generationQueue.getQueueStats();
  console.log(`   等待中: ${finalStats.waiting} 个任务`);
  console.log(`   处理中: ${finalStats.active} 个任务`);
  console.log(`   已完成: ${finalStats.completed} 个任务`);
  console.log(`   失败: ${finalStats.failed} 个任务\n`);

  console.log('\n💡 提示:');
  console.log('   - 使用 /api/generation/queue/stats 查看实时统计');
  console.log('   - 使用 /api/generation/queue/health 查看健康状态');
  console.log('   - 使用 WebSocket 接收实时通知');
}

// 运行演示
demoQueueSystem()
  .then(() => {
    console.log('🎯 演示完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 演示过程中发生错误:', error);
    process.exit(1);
  });