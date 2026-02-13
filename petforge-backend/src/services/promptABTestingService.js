import fs from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Prompt A/B 测试服务
 * 实现 Prompt 对比测试，自动选择最佳版本
 */
class PromptABTestingService {
  constructor() {
    // 测试配置
    this.testConfig = {
      maxConcurrentTests: 5,
      defaultDuration: 3600000, // 1小时
      minSamples: 10, // 最小样本数
      confidenceLevel: 0.95, // 置信度
      autoSelectThreshold: 0.1 // 10%优势即可自动选择
    };

    // 活跃测试
    this.activeTests = new Map();

    // 测试历史
    this.testHistory = [];

    // 测试统计
    this.testStats = {
      total: 0,
      completed: 0,
      cancelled: 0,
      selectedA: 0,
      selectedB: 0,
      inconclusive: 0
    };

    // 初始化测试目录
    this.ensureTestDataDir();
  }

  /**
   * 确保测试数据目录存在
   */
  ensureTestDataDir() {
    const dataDir = path.join(process.cwd(), 'test-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * 创建 A/B 测试
   */
  async createABTest(testConfig) {
    try {
      // 验证测试配置
      const validatedConfig = this.validateTestConfig(testConfig);

      // 检查是否已有限制测试
      if (this.activeTests.size >= this.testConfig.maxConcurrentTests) {
        throw new Error(`Maximum concurrent tests (${this.testConfig.maxConcurrentTests}) reached`);
      }

      // 创建测试 ID
      const testId = this.generateTestId();

      // 创建测试对象
      const test = {
        id: testId,
        name: validatedConfig.name,
        description: validatedConfig.description,
        variants: validatedConfig.variants,
        criteria: validatedConfig.criteria,
        status: 'created',
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        samples: [],
        results: null,
        winner: null,
        confidence: 0,
        metadata: validatedConfig.metadata || {}
      };

      // 保存测试
      this.activeTests.set(testId, test);
      this.saveTestData(test);

      console.log(`[ABTest] Created test: ${testId} (${test.name})`);

      return {
        success: true,
        data: {
          testId,
          name: test.name,
          variants: test.variants.map((v, i) => ({
            id: v.id,
            name: v.name,
            description: v.description
          })),
          status: test.status
        }
      };

    } catch (error) {
      console.error('[ABTest] Error creating test:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证测试配置
   */
  validateTestConfig(config) {
    const testConfigSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      variants: z.array(z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        prompt: z.string().min(1),
        weight: z.number().min(0).max(2).default(1)
      })).min(2).max(5),
      criteria: z.object({
        metric: z.enum(['quality', 'user_rating', 'completion_rate', 'speed']),
        threshold: z.number().min(0).max(1).optional()
      }).default({ metric: 'quality' }),
      duration: z.number().positive().optional(),
      metadata: z.object({}).optional()
    });

    return testConfigSchema.parse(config);
  }

  /**
   * 启动 A/B 测试
   */
  async startABTest(testId) {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'created') {
        throw new Error('Test already started or completed');
      }

      // 更新状态
      test.status = 'running';
      test.startedAt = new Date().toISOString();
      this.activeTests.set(testId, test);

      console.log(`[ABTest] Started test: ${testId}`);

      return {
        success: true,
        data: {
          testId,
          status: test.status,
          startedAt: test.startedAt,
          variants: test.variants
        }
      };

    } catch (error) {
      console.error('[ABTest] Error starting test:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 记录测试样本
   */
  async recordSample(testId, variantId, resultData) {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'running') {
        throw new Error('Test is not running');
      }

      // 验证变体
      const variant = test.variants.find(v => v.id === variantId);
      if (!variant) {
        throw new Error('Invalid variant ID');
      }

      // 计算分数
      const score = this.calculateVariantScore(resultData, test.criteria);

      // 记录样本
      const sample = {
        id: this.generateSampleId(),
        testId,
        variantId,
        resultData,
        score,
        timestamp: new Date().toISOString(),
        metadata: resultData.metadata || {}
      };

      test.samples.push(sample);
      this.activeTests.set(testId, test);

      // 保存数据
      this.saveTestData(test);

      console.log(`[ABTest] Recorded sample for ${testId}, variant ${variantId}: ${score}`);

      return {
        success: true,
        data: {
          testId,
          variantId,
          score,
          totalSamples: test.samples.length
        }
      };

    } catch (error) {
      console.error('[ABTest] Error recording sample:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 计算变体分数
   */
  calculateVariantScore(resultData, criteria) {
    switch (criteria.metric) {
      case 'quality':
        return this.calculateQualityScore(resultData);
      case 'user_rating':
        return resultData.userRating || 0.5; // 默认中间值
      case 'completion_rate':
        return resultData.completed ? 1 : 0;
      case 'speed':
        return resultData.speed ? Math.min(1, resultData.speed / 100) : 0; // 假设速度0-100
      default:
        return 0.5;
    }
  }

  /**
   * 计算质量分数
   */
  calculateQualityScore(resultData) {
    // 这里集成质量评估服务
    // 简化实现：基于结果数据计算分数
    let score = 0.5; // 基础分数

    if (resultData.quality) {
      score += resultData.quality * 0.3;
    }

    if (resultData.completeness) {
      score += resultData.completeness * 0.2;
    }

    if (resultData.aesthetics) {
      score += resultData.aesthetics * 0.2;
    }

    if (resultData.styleMatch) {
      score += resultData.styleMatch * 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 分析测试结果
   */
  async analyzeTestResults(testId) {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'running') {
        throw new Error('Test is not running');
      }

      const { minSamples } = this.testConfig;

      // 检查是否有足够样本
      if (test.samples.length < minSamples) {
        throw new Error(`Need at least ${minSamples} samples, current: ${test.samples.length}`);
      }

      // 按变体分组
      const variantResults = this.groupSamplesByVariant(test);

      // 计算统计
      const stats = this.calculateTestStatistics(variantResults);

      // 确定胜者
      const winner = this.selectWinner(variantResults, stats);

      // 计算置信度
      const confidence = this.calculateConfidence(stats, winner);

      // 更新测试
      test.results = stats;
      test.winner = winner;
      test.confidence = confidence;
      test.status = 'completed';
      test.completedAt = new Date().toISOString();

      this.activeTests.delete(testId);
      this.testHistory.push(test);

      // 更新统计
      this.updateTestStats(test);

      // 保存历史
      this.saveTestHistory(test);

      console.log(`[ABTest] Test ${testId} completed. Winner: ${winner?.variantId}, Confidence: ${confidence}`);

      return {
        success: true,
        data: {
          testId,
          status: test.status,
          results: stats,
          winner,
          confidence: Math.round(confidence * 100),
          totalSamples: test.samples.length
        }
      };

    } catch (error) {
      console.error('[ABTest] Error analyzing results:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 按变体分组样本
   */
  groupSamplesByVariant(test) {
    const groups = {};

    test.variants.forEach(variant => {
      groups[variant.id] = {
        variant,
        samples: [],
        scores: []
      };
    });

    test.samples.forEach(sample => {
      groups[sample.variantId].samples.push(sample);
      groups[sample.variantId].scores.push(sample.score);
    });

    return groups;
  }

  /**
   * 计算测试统计
   */
  calculateTestStatistics(variantGroups) {
    const stats = {};

    Object.entries(variantGroups).forEach(([variantId, group]) => {
      const scores = group.scores;
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);

      stats[variantId] = {
        variantId,
        sampleCount: scores.length,
        mean: Math.round(mean * 1000) / 1000,
        stdDev: Math.round(stdDev * 1000) / 1000,
        min: Math.min(...scores),
        max: Math.max(...scores),
        median: this.calculateMedian(scores),
        stdError: stdDev / Math.sqrt(scores.length)
      };
    });

    return stats;
  }

  /**
   * 计算中位数
   */
  calculateMedian(scores) {
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * 选择胜者
   */
  selectWinner(variantGroups, stats) {
    const variants = Object.keys(stats);
    if (variants.length < 2) {
      return null;
    }

    // 计算差异
    let bestVariant = null;
    let maxDiff = 0;

    for (let i = 0; i < variants.length - 1; i++) {
      for (let j = i + 1; j < variants.length; j++) {
        const diff = Math.abs(stats[variants[i]].mean - stats[variants[j]].mean);
        if (diff > maxDiff) {
          maxDiff = diff;
          bestVariant = stats[variants[i]].mean > stats[variants[j]].mean
            ? variants[i]
            : variants[j];
        }
      }
    }

    // 检查是否达到自动选择阈值
    if (maxDiff >= this.testConfig.autoSelectThreshold) {
      return {
        variantId: bestVariant,
        mean: stats[bestVariant].mean,
        sampleCount: stats[bestVariant].sampleCount,
        margin: Math.round(maxDiff * 1000) / 1000
      };
    }

    return null; // 无明确胜者
  }

  /**
   * 计算置信度
   */
  calculateConfidence(stats, winner) {
    if (!winner) {
      return 0;
    }

    // 简化的置信度计算
    // 实际应使用 t-test 或其他统计方法
    const winnerStats = stats[winner.variantId];
    const otherStats = Object.values(stats).filter(s => s.variantId !== winner.variantId);

    // 计算与其他变体的平均差距
    let totalDiff = 0;
    otherStats.forEach(other => {
      totalDiff += Math.abs(winnerStats.mean - other.mean);
    });

    const avgDiff = totalDiff / otherStats.length;
    const confidence = Math.min(1, avgDiff / winnerStats.stdError / 1.96); // 95% CI

    return confidence;
  }

  /**
   * 获取测试状态
   */
  async getTestStatus(testId) {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    const sampleCount = test.samples.length;
    const variantStats = {};

    test.variants.forEach(variant => {
      const variantSamples = test.samples.filter(s => s.variantId === variant.id);
      const avgScore = variantSamples.length > 0
        ? variantSamples.reduce((sum, s) => sum + s.score, 0) / variantSamples.length
        : 0;

      variantStats[variant.id] = {
        sampleCount: variantSamples.length,
        averageScore: Math.round(avgScore * 1000) / 1000
      };
    });

    return {
      testId,
      name: test.name,
      status: test.status,
      sampleCount,
      variantStats,
      startedAt: test.startedAt,
      createdAt: test.createdAt
    };
  }

  /**
   * 取消测试
   */
  async cancelTest(testId) {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status === 'completed') {
        throw new Error('Test already completed');
      }

      // 更新状态
      test.status = 'cancelled';
      test.completedAt = new Date().toISOString();

      // 移除活跃测试
      this.activeTests.delete(testId);

      // 更新统计
      this.testStats.cancelled++;

      console.log(`[ABTest] Cancelled test: ${testId}`);

      return {
        success: true,
        data: {
          testId,
          status: test.status
        }
      };

    } catch (error) {
      console.error('[ABTest] Error cancelling test:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取测试历史
   */
  getTestHistory(limit = 50) {
    return this.testHistory.slice(-limit);
  }

  /**
   * 获取测试统计
   */
  getTestStatistics() {
    const history = this.testHistory;
    const total = history.length;

    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        cancelled: 0,
        selectedA: 0,
        selectedB: 0,
        inconclusive: 0,
        averageConfidence: 0
      };
    }

    const completed = history.filter(t => t.status === 'completed').length;
    const cancelled = history.filter(t => t.status === 'cancelled').length;
    const selectedA = history.filter(t => t.winner?.variantId === 'A').length;
    const selectedB = history.filter(t => t.winner?.variantId === 'B').length;
    const inconclusive = total - completed - cancelled - selectedA - selectedB;

    const avgConfidence = history
      .filter(t => t.confidence)
      .reduce((sum, t) => sum + t.confidence, 0) / (total - cancelled);

    return {
      total,
      completed,
      cancelled,
      selectedA,
      selectedB,
      inconclusive,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      passRate: Math.round((completed / total) * 100)
    };
  }

  /**
   * 生成测试 ID
   */
  generateTestId() {
    return `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * 生成样本 ID
   */
  generateSampleId() {
    return `sample_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * 保存测试数据
   */
  saveTestData(test) {
    try {
      const dataPath = path.join(process.cwd(), 'test-data', `${test.id}.json`);
      fs.writeFileSync(dataPath, JSON.stringify(test, null, 2));
    } catch (error) {
      console.error('[ABTest] Error saving test data:', error);
    }
  }

  /**
   * 保存测试历史
   */
  saveTestHistory(test) {
    try {
      const historyPath = path.join(process.cwd(), 'test-data', 'history.json');
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8') || '[]');
      history.push(test);
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('[ABTest] Error saving test history:', error);
    }
  }

  /**
   * 更新测试统计
   */
  updateTestStats(test) {
    if (test.status === 'completed') {
      this.testStats.completed++;
      if (test.winner) {
        if (test.winner.variantId === 'A') {
          this.testStats.selectedA++;
        } else if (test.winner.variantId === 'B') {
          this.testStats.selectedB++;
        }
      } else {
        this.testStats.inconclusive++;
      }
    }
  }

  /**
   * 清理过期测试
   */
  cleanupExpiredTests() {
    const now = Date.now();
    const expiredTests = [];

    this.activeTests.forEach((test, testId) => {
      const duration = test.duration || this.testConfig.defaultDuration;
      if (test.startedAt && (now - new Date(test.startedAt).getTime()) > duration) {
        expiredTests.push(testId);
      }
    });

    expiredTests.forEach(testId => {
      this.cancelTest(testId);
    });

    if (expiredTests.length > 0) {
      console.log(`[ABTest] Cleaned up ${expiredTests.length} expired tests`);
    }
  }

  /**
   * 获取推荐 Prompt
   */
  getRecommendedPrompt(baseParams) {
    // 基于历史测试数据推荐最佳 Prompt
    const history = this.testHistory.filter(t => t.status === 'completed' && t.winner);

    if (history.length === 0) {
      // 没有历史数据，返回默认
      return {
        prompt: baseParams.customPrompt || 'cute pet',
        confidence: 0.5,
        basedOn: 'default'
      };
    }

    // 查找最相似的成功测试
    const similarTests = this.findSimilarTests(history, baseParams);

    if (similarTests.length > 0) {
      const bestTest = similarTests[0];
      const winningVariant = bestTest.variants.find(v => v.id === bestTest.winner.variantId);

      return {
        prompt: winningVariant.prompt,
        confidence: bestTest.confidence,
        basedOn: `similar test: ${bestTest.name}`,
        testId: bestTest.id
      };
    }

    return {
      prompt: baseParams.customPrompt || 'cute pet',
      confidence: 0.5,
      basedOn: 'default'
    };
  }

  /**
   * 查找相似测试
   */
  findSimilarTests(history, params) {
    const similarities = history.map(test => {
      let score = 0;

      // 计算风格相似度
      if (test.metadata?.style === params.style) {
        score += 0.4;
      }

      // 计算类型相似度
      if (test.metadata?.type === params.type) {
        score += 0.3;
      }

      // 计算强度相似度
      if (test.metadata?.intensity && params.intensity) {
        const diff = Math.abs(test.metadata.intensity - params.intensity);
        score += (1 - diff) * 0.3;
      }

      return {
        test,
        similarity: score
      };
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(s => s.test);
  }
}

export default new PromptABTestingService();