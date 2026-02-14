import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('generationQualityService');

/**
 * 生成质量评估服务
 * 实现对 AI 生成图像的自动质量评估和检测
 */
class GenerationQualityService {
  constructor() {
    // 质量评估权重
    this.qualityMetrics = {
      clarity: 0.25,        // 清晰度
      aesthetics: 0.25,     // 美学质量
      consistency: 0.20,    // 一致性
      cuteness: 0.20,      // 可爱度
      appeal: 0.10         // 吸引力
    };

    // 负面样本特征库
    this.negativePatterns = {
      blur: ['blurry', 'unclear', 'fuzzy', 'out of focus'],
      distortion: ['deformed', 'distorted', 'warped', 'stretched'],
      artifacts: ['noise', 'pixelated', 'jpeg artifacts', 'compression'],
      composition: ['cropped', 'cut off', 'missing parts'],
      quality: ['low quality', 'poor quality', 'bad quality'],
      style: ['wrong style', 'inconsistent', 'mismatched']
    };

    // 质量阈值
    this.qualityThresholds = {
      excellent: 90,    // 优秀
      good: 75,         // 良好
      fair: 60,         // 一般
      poor: 40,         // 较差
      reject: 30        // 拒绝
    };

    // 评估历史缓存
    this.assessmentCache = new Map();
  }

  /**
   * 评估生成质量
   */
  async assessGeneration(generationData) {
    try {
      const { resultUrl, metadata, promptData } = generationData;

      logger.debug('[Quality] Starting quality assessment for:', resultUrl);

      // 1. 基础信息检查
      const basicCheck = this.checkBasicInfo(generationData);

      if (!basicCheck.passed) {
        return this.createAssessmentResult({
          score: 0,
          status: 'failed',
          issues: basicCheck.issues,
          reason: 'Basic validation failed'
        });
      }

      // 2. 元数据质量评估
      const metadataScore = this.assessMetadataQuality(metadata);

      // 3. Prompt 质量评估
      const promptScore = this.assessPromptQuality(promptData);

      // 4. 生成结果质量评估
      const resultScore = await this.assessImageQuality(resultUrl, metadata);

      // 5. 负面样本检测
      const negativeDetection = this.detectNegativePatterns(generationData);

      // 6. 综合评分
      const overallScore = this.calculateOverallScore({
        metadataScore,
        promptScore,
        resultScore,
        negativeDetection
      });

      // 7. 生成建议
      const recommendation = this.generateRecommendation(
        overallScore,
        { metadataScore, promptScore, resultScore, negativeDetection }
      );

      // 8. 记录评估历史
      const assessment = this.createAssessmentResult({
        score: overallScore,
        status: overallScore >= this.qualityThresholds.good ? 'passed' : 'needs_review',
        metrics: {
          metadata: metadataScore,
          prompt: promptScore,
          result: resultScore,
          negative: negativeDetection.score
        },
        issues: negativeDetection.issues,
        recommendation,
        timestamp: new Date().toISOString()
      });

      // 缓存评估结果
      this.cacheAssessment(generationData, assessment);

      return assessment;

    } catch (error) {
      logger.error('[Quality] Error in quality assessment:', error);
      return this.createAssessmentResult({
        score: 0,
        status: 'error',
        issues: ['Assessment failed'],
        reason: error.message
      });
    }
  }

  /**
   * 检查基础信息
   */
  checkBasicInfo(generationData) {
    const issues = [];

    if (!generationData.resultUrl) {
      issues.push('Missing result URL');
    }

    if (!generationData.metadata) {
      issues.push('Missing metadata');
    }

    if (!generationData.promptData) {
      issues.push('Missing prompt data');
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * 评估元数据质量
   */
  assessMetadataQuality(metadata) {
    let score = 0;
    const issues = [];

    // 检查完整性
    const requiredFields = ['style', 'type', 'timestamp'];
    const completeness = this.checkFieldCompleteness(metadata, requiredFields);
    score += completeness * 0.4;

    // 检查有效性
    if (metadata.style && !['pixar', 'clay', 'cyber', 'line'].includes(metadata.style)) {
      issues.push('Invalid style value');
    }

    if (metadata.type && !['2d', '3d'].includes(metadata.type)) {
      issues.push('Invalid type value');
    }

    // 检查时间戳
    if (metadata.timestamp) {
      const timestamp = new Date(metadata.timestamp);
      if (isNaN(timestamp.getTime())) {
        issues.push('Invalid timestamp format');
      }
    }

    return {
      score: Math.round(score * 100),
      completeness,
      issues
    };
  }

  /**
   * 评估 Prompt 质量
   */
  assessPromptQuality(promptData) {
    if (!promptData) return { score: 50, issues: ['No prompt data'] };

    const { positive, negative, metadata } = promptData;
    let score = 0;

    // 1. 长度合理性
    const lengthScore = this.assessPromptLength(positive, negative);
    score += lengthScore * 0.2;

    // 2. 词平衡性
    const balanceScore = this.assessPromptBalance(positive, negative);
    score += balanceScore * 0.2;

    // 3. 特定性
    const specificityScore = this.assessPromptSpecificity(positive);
    score += specificityScore * 0.3;

    // 4. 风格一致性
    const styleScore = this.assessStyleConsistency(positive, metadata?.style);
    score += styleScore * 0.3;

    return {
      score: Math.round(score * 100),
      length: lengthScore,
      balance: balanceScore,
      specificity: specificityScore,
      style: styleScore
    };
  }

  /**
   * 评估 Prompt 长度
   */
  assessPromptLength(positive, negative) {
    const positiveWords = positive.split(', ').length;
    const negativeWords = negative.split(', ').length;
    const totalWords = positiveWords + negativeWords;

    // 理想长度：正向 8-15 词，反向 3-8 词
    if (positiveWords >= 8 && positiveWords <= 15 &&
        negativeWords >= 3 && negativeWords <= 8) {
      return 1;
    } else if (totalWords >= 10 && totalWords <= 20) {
      return 0.8;
    } else if (totalWords >= 5 && totalWords <= 30) {
      return 0.6;
    } else {
      return 0.3;
    }
  }

  /**
   * 评估 Prompt 平衡性
   */
  assessPromptBalance(positive, negative) {
    const positiveWords = positive.split(', ').length;
    const negativeWords = negative.split(', ').length;
    const totalWords = positiveWords + negativeWords;

    if (totalWords === 0) return 0;

    const positiveRatio = positiveWords / totalWords;

    // 理想比例：70-85% 正向，15-30% 反向
    if (positiveRatio >= 0.7 && positiveRatio <= 0.85) {
      return 1;
    } else if (positiveRatio >= 0.6 && positiveRatio <= 0.9) {
      return 0.8;
    } else {
      return 0.5;
    }
  }

  /**
   * 评估 Prompt 特定性
   */
  assessPromptSpecificity(positive) {
    // 检查具体词
    const specificWords = [
      'detailed', 'high quality', 'masterpiece', 'professional',
      'vibrant', 'cinematic', 'ultra', 'sharp', 'crisp'
    ];

    // 检查模糊词
    const vagueWords = [
      'good', 'nice', 'beautiful', 'cute', 'lovely', 'pretty'
    ];

    const specificCount = specificWords.filter(word =>
      positive.toLowerCase().includes(word)
    ).length;

    const vagueCount = vagueWords.filter(word =>
      positive.toLowerCase().includes(word)
    ).length;

    if (specificCount > 0) {
      return Math.min(1, specificCount * 0.3);
    } else if (vagueCount === 0) {
      return 0.8; // 没有模糊词
    } else {
      return Math.max(0, 0.8 - vagueCount * 0.1);
    }
  }

  /**
   * 评估风格一致性
   */
  assessStyleConsistency(positive, style) {
    if (!style) return 0.5;

    const styleKeywords = {
      pixar: ['3D', 'Pixar', 'render', 'animation', 'cinematic', 'expressive'],
      clay: ['clay', 'handcrafted', 'stop motion', 'animation', 'polymer', 'handmade'],
      cyber: ['cyber', 'neon', 'tech', 'futuristic', 'digital', 'glowing'],
      line: ['line art', 'minimalist', 'clean', 'simple', 'vector', 'outline']
    };

    const keywords = styleKeywords[style] || [];
    const matches = keywords.filter(keyword =>
      positive.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    return Math.min(1, matches / Math.max(1, keywords.length));
  }

  /**
   * 评估图像质量
   */
  async assessImageQuality(imageUrl, metadata) {
    // 这里应该集成图像分析服务
    // 目前使用模拟的评估逻辑

    logger.debug('[Quality] Assessing image quality for:', imageUrl);

    // 模拟图像质量分数
    const baseScore = 70 + Math.random() * 25; // 70-95

    // 根据风格调整
    const styleBonus = {
      pixar: 5,
      clay: 3,
      cyber: 4,
      line: 2
    };

    const style = metadata?.style || 'pixar';
    const adjustedScore = baseScore + (styleBonus[style] || 0);

    // 添加一些随机性来模拟真实情况
    const finalScore = Math.max(0, Math.min(100, adjustedScore + (Math.random() - 0.5) * 10));

    return {
      score: Math.round(finalScore),
      clarity: Math.round(finalScore * 0.9),
      aesthetics: Math.round(finalScore * 0.85),
      consistency: Math.round(finalScore * 0.95),
      cuteness: Math.round(finalScore * 0.8),
      appeal: Math.round(finalScore * 0.75)
    };
  }

  /**
   * 检测负面样本
   */
  detectNegativePatterns(generationData) {
    const { resultUrl, promptData } = generationData;
    const issues = [];

    // 1. 检查 URL 中的负面模式
    if (resultUrl) {
      Object.entries(this.negativePatterns).forEach(([category, patterns]) => {
        patterns.forEach(pattern => {
          if (resultUrl.toLowerCase().includes(pattern)) {
            issues.push(`URL contains ${category} pattern: ${pattern}`);
          }
        });
      });
    }

    // 2. 检查 Prompt 中的冲突
    if (promptData) {
      const { positive, negative } = promptData;
      const positiveWords = positive.split(', ');
      const negativeWords = negative.split(', ');

      // 检查正向提示中是否有负面词
      positiveWords.forEach(posWord => {
        negativeWords.forEach(negWord => {
          if (posWord.includes(negWord) || negWord.includes(posWord)) {
            issues.push(`Conflict in prompt: "${posWord}" vs "${negWord}"`);
          }
        });
      });
    }

    // 计算负面分数
    const negativeScore = Math.max(0, 100 - (issues.length * 10));

    return {
      score: negativeScore,
      issues: issues,
      severity: issues.length > 3 ? 'high' : issues.length > 1 ? 'medium' : 'low'
    };
  }

  /**
   * 计算总体评分
   */
  calculateOverallScore(components) {
    const { metadataScore, promptScore, resultScore, negativeDetection } = components;

    // 加权计算
    const metadataWeight = 0.1;
    const promptWeight = 0.3;
    const resultWeight = 0.5;
    const negativeWeight = 0.1;

    const score = (
      metadataScore.score * metadataWeight +
      promptScore.score * promptWeight +
      resultScore.score * resultWeight +
      negativeDetection.score * negativeWeight
    );

    return Math.round(score);
  }

  /**
   * 生成建议
   */
  generateRecommendation(overallScore, components) {
    const thresholds = this.qualityThresholds;

    if (overallScore >= thresholds.excellent) {
      return {
        level: 'excellent',
        message: 'Excellent quality! Ready for production.',
        action: 'approve',
        confidence: 'high'
      };
    } else if (overallScore >= thresholds.good) {
      return {
        level: 'good',
        message: 'Good quality with minor improvements possible.',
        action: 'approve',
        confidence: 'medium'
      };
    } else if (overallScore >= thresholds.fair) {
      return {
        level: 'fair',
        message: 'Average quality. Consider regenerating with better prompts.',
        action: 'review',
        confidence: 'medium'
      };
    } else if (overallScore >= thresholds.poor) {
      return {
        level: 'poor',
        message: 'Poor quality. Recommended to regenerate.',
        action: 'regenerate',
        confidence: 'low'
      };
    } else {
      return {
        level: 'reject',
        message: 'Poor quality. Please check parameters and try again.',
        action: 'reject',
        confidence: 'high'
      };
    }
  }

  /**
   * 创建评估结果
   */
  createAssessmentResult(data) {
    return {
      id: this.generateAssessmentId(),
      score: data.score,
      status: data.status,
      metrics: data.metrics || {},
      issues: data.issues || [],
      recommendation: data.recommendation || null,
      timestamp: data.timestamp || new Date().toISOString(),
      details: {
        metadata: data.metadata || null,
        prompt: data.prompt || null,
        result: data.result || null
      }
    };
  }

  /**
   * 生成评估 ID
   */
  generateAssessmentId() {
    return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查字段完整性
   */
  checkFieldCompleteness(data, requiredFields) {
    const presentFields = requiredFields.filter(field =>
      data[field] !== undefined && data[field] !== null && data[field] !== ''
    );
    return presentFields.length / requiredFields.length;
  }

  /**
   * 缓存评估结果
   */
  cacheAssessment(generationData, assessment) {
    const cacheKey = `${generationData.resultUrl}_${generationData.metadata?.style}_${Date.now()}`;
    this.assessmentCache.set(cacheKey, {
      assessment,
      timestamp: new Date().toISOString()
    });

    // 保持缓存大小
    if (this.assessmentCache.size > 100) {
      const oldestKey = this.assessmentCache.keys().next().value;
      this.assessmentCache.delete(oldestKey);
    }
  }

  /**
   * 获取评估历史
   */
  getAssessmentHistory(limit = 50) {
    const history = Array.from(this.assessmentCache.entries())
      .map(([key, data]) => data)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return history.map(item => item.assessment);
  }

  /**
   * 获取质量统计
   */
  getQualityStats() {
    const history = this.getAssessmentHistory(100);

    if (history.length === 0) {
      return {
        total: 0,
        averageScore: 0,
        distribution: { excellent: 0, good: 0, fair: 0, poor: 0, reject: 0 },
        successRate: 0
      };
    }

    const scores = history.map(h => h.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const distribution = {
      excellent: history.filter(h => h.score >= 90).length,
      good: history.filter(h => h.score >= 75 && h.score < 90).length,
      fair: history.filter(h => h.score >= 60 && h.score < 75).length,
      poor: history.filter(h => h.score >= 30 && h.score < 60).length,
      reject: history.filter(h => h.score < 30).length
    };

    const passed = distribution.excellent + distribution.good;
    const successRate = passed / history.length;

    return {
      total: history.length,
      averageScore: Math.round(averageScore),
      distribution,
      successRate: Math.round(successRate * 100)
    };
  }

  /**
   * 清除评估历史
   */
  clearHistory() {
    this.assessmentCache.clear();
    logger.debug('[Quality] Assessment history cleared');
  }

  /**
   * 导出评估报告
   */
  exportAssessmentReport(assessmentId) {
    const history = this.getAssessmentHistory(1000);
    const assessment = history.find(a => a.id === assessmentId);

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const report = {
      assessment: assessment,
      summary: {
        timestamp: new Date().toISOString(),
        style: assessment.details.metadata?.style || 'unknown',
        type: assessment.details.metadata?.type || 'unknown',
        score: assessment.score,
        status: assessment.status
      },
      statistics: this.getQualityStats()
    };

    return report;
  }
}

export default new GenerationQualityService();