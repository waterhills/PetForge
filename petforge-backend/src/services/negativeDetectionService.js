import fs from 'fs';
import path from 'path';

/**
 * 负面样本检测服务
 * 专门检测和过滤低质量、不合适的生成结果
 */
class NegativeDetectionService {
  constructor() {
    // 初始化负面样本库
    this.initializeNegativePatterns();

    // 检测历史
    this.detectionHistory = [];

    // 质量阈值
    this.thresholds = {
      lowQuality: 0.3,
      styleMismatch: 0.5,
      inappropriate: 0.1,
      technicalIssues: 0.4
    };
  }

  /**
   * 初始化负面模式库
   */
  initializeNegativePatterns() {
    this.negativePatterns = {
      // 质量问题
      quality: {
        blur: ['blurry', 'unclear', 'fuzzy', 'out of focus', 'blur', 'unsharp'],
        distortion: ['deformed', 'distorted', 'warped', 'stretched', 'twisted', 'bent'],
        noise: ['noise', 'grainy', 'pixelated', 'compression artifacts', 'jpeg artifacts'],
        artifacts: ['watermark', 'text', 'signature', 'logo', 'stamp'],
        lowRes: ['low resolution', 'poor quality', 'bad quality', 'low quality'],
        incomplete: ['cropped', 'cut off', 'missing parts', 'incomplete', 'truncated']
      },

      // 技术问题
      technical: {
        loading: ['loading', 'buffering', 'processing', 'generating'],
        error: ['error', 'failed', 'exception', 'crash', 'bug'],
        network: ['timeout', 'connection', 'network', 'offline'],
        server: ['server error', 'internal error', 'service unavailable']
      },

      // 风格不匹配
      styleMismatch: {
        wrongStyle: ['wrong style', 'inconsistent', 'mismatched', 'different'],
        mixStyle: ['mixed styles', 'hybrid', 'blend', 'combination'],
        unintended: ['unintended', 'accidental', 'unexpected', 'random'],
        poorExecution: ['poor execution', 'bad implementation', 'failed concept']
      },

      // 内容不合适
      inappropriate: {
        nsfw: ['nude', 'naked', 'explicit', 'adult', 'mature', 'nsfw'],
        violent: ['violent', 'blood', 'gore', 'weapons', 'aggressive'],
        scary: ['scary', 'fear', 'horror', 'terror', 'nightmare'],
        offensive: ['offensive', 'discriminatory', 'hate', 'harassing'],
        distorted: ['monstrous', 'demonic', 'evil', 'cursed', 'possessed']
      },

      // 特定问题
      specific: {
        // 文字问题
        text: ['letters', 'words', 'text', 'writing', 'characters', 'font'],
        // 多重主体
        multiple: ['multiple', 'several', 'group', 'crowd', 'pair'],
        // 不自然元素
        unnatural: ['unnatural', 'weird', 'strange', 'odd', 'uncanny'],
        // 动作问题
        pose: ['unnatural pose', 'awkward position', 'rigid movement', 'stiff']
      }
    };

    // 正面和反向冲突词库
    this.conflictWords = {
      positive: [
        'beautiful', 'cute', 'adorable', 'perfect', 'amazing', 'wonderful',
        'excellent', 'stunning', 'gorgeous', 'lovely', 'charming', 'delightful'
      ],
      negative: [
        'ugly', 'horrible', 'terrible', 'awful', 'disgusting', 'nasty',
        'repulsive', 'hideous', 'grotesque', 'monstrous', 'freakish'
      ]
    };

    // 风格特定检测规则
    this.styleSpecificRules = {
      pixar: {
        mustHave: ['3D', 'Pixar', 'animation', 'render'],
        mustAvoid: ['2D', 'cartoon', 'flat', 'pixel', 'realistic']
      },
      clay: {
        mustHave: ['clay', 'handmade', 'handcrafted', 'stop motion'],
        mustAvoid: ['digital', '3D', 'render', 'realistic', 'perfect']
      },
      cyber: {
        mustHave: ['cyber', 'tech', 'neon', 'futuristic', 'digital'],
        mustAvoid: ['traditional', 'natural', 'organic', 'vintage', 'soft']
      },
      line: {
        mustHave: ['line art', 'minimalist', 'simple', 'outline', 'vector'],
        mustAvoid: ['3D', 'shading', 'gradient', 'colorful', 'realistic']
      }
    };
  }

  /**
   * 检测负面样本
   */
  async detectNegativeSample(generationData) {
    try {
      console.log('[NegativeDetection] Starting detection for:', generationData.id);

      const detectionResult = {
        id: generationData.id,
        timestamp: new Date().toISOString(),
        overallScore: 1.0,
        issues: [],
        categories: {},
        recommendation: 'approve',
        details: {}
      };

      // 1. 基础数据检查
      const basicCheck = this.checkBasicData(generationData);
      if (!basicCheck.passed) {
        detectionResult.overallScore = 0;
        detectionResult.recommendation = 'reject';
        detectionResult.issues = basicCheck.issues;
        return detectionResult;
      }

      // 2. URL 检查
      const urlCheck = this.checkUrl(generationData.resultUrl);
      detectionResult.categories.url = urlCheck;

      // 3. Prompt 冲突检查
      if (generationData.promptData) {
        const promptCheck = this.checkPromptConflicts(generationData.promptData);
        detectionResult.categories.prompt = promptCheck;
      }

      // 4. 风格一致性检查
      if (generationData.metadata?.style) {
        const styleCheck = this.checkStyleConsistency(
          generationData.metadata.style,
          generationData.promptData,
          generationData.resultUrl
        );
        detectionResult.categories.style = styleCheck;
      }

      // 5. 内容安全检查
      const safetyCheck = this.checkContentSafety(generationData);
      detectionResult.categories.safety = safetyCheck;

      // 6. 技术问题检查
      const technicalCheck = this.checkTechnicalIssues(generationData);
      detectionResult.categories.technical = technicalCheck;

      // 7. 计算总体评分
      detectionResult.overallScore = this.calculateOverallScore(detectionResult.categories);

      // 8. 生成建议
      detectionResult.recommendation = this.generateRecommendation(
        detectionResult.overallScore,
        detectionResult.categories
      );

      // 9. 记录检测结果
      this.recordDetection(detectionResult);

      console.log('[NegativeDetection] Detection completed:', {
        score: detectionResult.overallScore,
        recommendation: detectionResult.recommendation,
        issuesCount: detectionResult.issues.length
      });

      return detectionResult;

    } catch (error) {
      console.error('[NegativeDetection] Error in detection:', error);
      return {
        id: generationData.id,
        timestamp: new Date().toISOString(),
        overallScore: 0,
        issues: ['Detection failed'],
        recommendation: 'reject',
        error: error.message
      };
    }
  }

  /**
   * 检查基础数据
   */
  checkBasicData(data) {
    const issues = [];

    if (!data) {
      issues.push('No data provided');
      return { passed: false, issues };
    }

    if (!data.id) {
      issues.push('Missing generation ID');
    }

    if (!data.resultUrl) {
      issues.push('Missing result URL');
    }

    return { passed: issues.length === 0, issues };
  }

  /**
   * 检查 URL
   */
  checkUrl(url) {
    if (!url) {
      return {
        passed: false,
        score: 0,
        issues: ['No URL provided'],
        severity: 'critical'
      };
    }

    // 检查 URL 格式
    try {
      new URL(url);
    } catch {
      return {
        passed: false,
        score: 0,
        issues: ['Invalid URL format'],
        severity: 'critical'
      };
    }

    const result = {
      passed: true,
      score: 1.0,
      issues: [],
      severity: 'low'
    };

    // 检查负面关键词
    const lowerUrl = url.toLowerCase();
    Object.entries(this.negativePatterns).forEach(([category, patterns]) => {
      patterns.forEach(subPatterns => {
        subPatterns.forEach(pattern => {
          if (lowerUrl.includes(pattern)) {
            result.passed = false;
            result.score = 0;
            result.issues.push(`URL contains ${category} pattern: ${pattern}`);
            result.severity = 'critical';
          }
        });
      });
    });

    return result;
  }

  /**
   * 检查 Prompt 冲突
   */
  checkPromptConflicts(promptData) {
    if (!promptData) {
      return {
        passed: true,
        score: 1.0,
        issues: ['No prompt data'],
        severity: 'low'
      };
    }

    const { positive, negative } = promptData;
    const result = {
      passed: true,
      score: 1.0,
      issues: [],
      severity: 'low'
    };

    // 检查正向和反向提示词冲突
    const positiveWords = positive.split(', ');
    const negativeWords = negative.split(', ');

    positiveWords.forEach(posWord => {
      negativeWords.forEach(negWord => {
        if (posWord.includes(negWord) || negWord.includes(posWord)) {
          result.passed = false;
          result.score = 0.5;
          result.issues.push(`Prompt conflict: "${posWord}" vs "${negWord}"`);
          result.severity = 'medium';
        }
      });
    });

    // 检查负面词混入正向提示
    this.negativePatterns.quality.noise.forEach(noiseWord => {
      if (positive.toLowerCase().includes(noiseWord)) {
        result.passed = false;
        result.score = 0.3;
        result.issues.push(`Negative word in positive prompt: ${noiseWord}`);
        result.severity = 'high';
      }
    });

    return result;
  }

  /**
   * 检查风格一致性
   */
  checkStyleConsistency(style, promptData, resultUrl) {
    if (!style) {
      return {
        passed: true,
        score: 1.0,
        issues: ['No style specified'],
        severity: 'low'
      };
    }

    const rules = this.styleSpecificRules[style];
    if (!rules) {
      return {
        passed: true,
        score: 1.0,
        issues: ['No specific rules for this style'],
        severity: 'low'
      };
    }

    const result = {
      passed: true,
      score: 1.0,
      issues: [],
      severity: 'low',
      mustHaveCount: 0,
      mustAvoidCount: 0,
      positiveChecks: 0,
      negativeChecks: 0
    };

    // 检查必须包含的词
    if (promptData?.positive) {
      const positive = promptData.positive.toLowerCase();
      rules.mustHave.forEach(word => {
        if (positive.includes(word.toLowerCase())) {
          result.positiveChecks++;
          result.mustHaveCount++;
        }
      });

      rules.mustAvoid.forEach(word => {
        if (positive.includes(word.toLowerCase())) {
          result.negativeChecks++;
          result.mustAvoidCount++;
          result.issues.push(`Should avoid: ${word}`);
          result.score -= 0.2;
        }
      });
    }

    // 检查 URL 中的风格词
    if (resultUrl) {
      const lowerUrl = resultUrl.toLowerCase();
      rules.mustHave.forEach(word => {
        if (lowerUrl.includes(word.toLowerCase())) {
          result.mustHaveCount++;
        }
      });
    }

    // 计算风格匹配度
    const totalMustHave = rules.mustHave.length;
    const matchRatio = result.mustHaveCount / totalMustHave;

    if (matchRatio < 0.5) {
      result.passed = false;
      result.score = matchRatio;
      result.issues.push(`Poor style matching: ${Math.round(matchRatio * 100)}%`);
      result.severity = 'medium';
    } else {
      result.score = Math.min(1, matchRatio + 0.2);
    }

    return result;
  }

  /**
   * 检查内容安全
   */
  checkContentSafety(data) {
    const result = {
      passed: true,
      score: 1.0,
      issues: [],
      severity: 'low'
    };

    // 检查不安全内容
    this.negativePatterns.inappropriate.forEach(category => {
      category.forEach(pattern => {
        if (data.promptData?.positive?.toLowerCase().includes(pattern)) {
          result.passed = false;
          result.score = 0;
          result.issues.push(`Inappropriate content detected: ${pattern}`);
          result.severity = 'critical';
        }
      });
    });

    // 检查是否包含多个主体
    if (data.promptData?.positive?.toLowerCase().includes('multiple') ||
        data.promptData?.positive?.toLowerCase().includes('several')) {
      result.score -= 0.3;
      result.issues.push('Multiple subjects detected');
      result.severity = 'medium';
    }

    return result;
  }

  /**
   * 检查技术问题
   */
  checkTechnicalIssues(data) {
    const result = {
      passed: true,
      score: 1.0,
      issues: [],
      severity: 'low'
    };

    // 检查技术相关的词
    if (data.promptData?.positive) {
      const positive = data.promptData.positive.toLowerCase();

      this.negativePatterns.technical.forEach(category => {
        category.forEach(pattern => {
          if (positive.includes(pattern)) {
            result.passed = false;
            result.score = 0;
            result.issues.push(`Technical issue detected: ${pattern}`);
            result.severity = 'critical';
          }
        });
      });
    }

    return result;
  }

  /**
   * 计算总体评分
   */
  calculateOverallScore(categories) {
    let totalScore = 0;
    let weightSum = 0;

    Object.entries(categories).forEach(([category, result]) => {
      const weights = {
        url: 0.3,
        prompt: 0.2,
        style: 0.3,
        safety: 0.15,
        technical: 0.05
      };

      const weight = weights[category] || 0.1;
      totalScore += result.score * weight;
      weightSum += weight;
    });

    return Math.max(0, Math.min(1, totalScore / weightSum));
  }

  /**
   * 生成建议
   */
  generateRecommendation(overallScore, categories) {
    if (overallScore < this.thresholds.inappropriate) {
      return 'reject';
    } else if (overallScore < this.thresholds.technicalIssues) {
      return 'review';
    } else if (overallScore < this.thresholds.styleMismatch) {
      return 'flag';
    } else if (overallScore < this.thresholds.lowQuality) {
      return 'approve_with_review';
    } else {
      return 'approve';
    }
  }

  /**
   * 记录检测结果
   */
  recordDetection(detection) {
    this.detectionHistory.push(detection);

    // 保持历史记录大小
    if (this.detectionHistory.length > 1000) {
      this.detectionHistory = this.detectionHistory.slice(-1000);
    }

    // 记录到文件（可选）
    this.logDetectionToFile(detection);
  }

  /**
   * 记录检测结果到文件
   */
  logDetectionToFile(detection) {
    try {
      const logPath = path.join(process.cwd(), 'logs', 'negative-detection.log');

      // 确保日志目录存在
      const logDir = path.dirname(logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = JSON.stringify(detection) + '\n';
      fs.appendFileSync(logPath, logEntry);
    } catch (error) {
      console.error('[NegativeDetection] Failed to log detection:', error);
    }
  }

  /**
   * 获取检测历史
   */
  getDetectionHistory(limit = 100) {
    return this.detectionHistory.slice(-limit);
  }

  /**
   * 获取检测统计
   */
  getDetectionStats() {
    const total = this.detectionHistory.length;
    if (total === 0) {
      return {
        total: 0,
        approved: 0,
        rejected: 0,
        reviewed: 0,
        averageScore: 0
      };
    }

    const approved = this.detectionHistory.filter(d => d.recommendation === 'approve').length;
    const rejected = this.detectionHistory.filter(d => d.recommendation === 'reject').length;
    const reviewed = this.detectionHistory.filter(d => d.recommendation === 'review').length;

    const averageScore = this.detectionHistory.reduce((sum, d) => sum + d.overallScore, 0) / total;

    return {
      total,
      approved,
      rejected,
      reviewed,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round((approved / total) * 100)
    };
  }

  /**
   * 添加新的负面模式
   */
  addNegativePattern(category, subCategory, patterns) {
    if (!this.negativePatterns[category]) {
      this.negativePatterns[category] = {};
    }

    if (!this.negativePatterns[category][subCategory]) {
      this.negativePatterns[category][subCategory] = [];
    }

    this.negativePatterns[category][subCategory].push(...patterns);
    console.log(`[NegativeDetection] Added patterns for ${category}.${subCategory}`);
  }

  /**
   * 清除检测历史
   */
  clearHistory() {
    this.detectionHistory = [];
    console.log('[NegativeDetection] Detection history cleared');
  }

  /**
   * 导出检测报告
   */
  exportDetectionReport(startDate, endDate) {
    const filtered = this.detectionHistory.filter(detection => {
      const date = new Date(detection.timestamp);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });

    const report = {
      period: { startDate, endDate },
      total: filtered.length,
      stats: {
        approved: filtered.filter(d => d.recommendation === 'approve').length,
        rejected: filtered.filter(d => d.recommendation === 'reject').length,
        reviewed: filtered.filter(d => d.recommendation === 'review').length,
        flagged: filtered.filter(d => d.recommendation === 'flag').length
      },
      topIssues: this.getTopIssues(filtered),
      trends: this.getTrends(filtered)
    };

    return report;
  }

  /**
   * 获取常见问题
   */
  getTopIssues(detections) {
    const issueCount = {};

    detections.forEach(detection => {
      detection.issues.forEach(issue => {
        issueCount[issue] = (issueCount[issue] || 0) + 1;
      });
    });

    return Object.entries(issueCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));
  }

  /**
   * 获取趋势分析
   */
  getTrends(detections) {
    // 按日期分组
    const dailyStats = {};

    detections.forEach(detection => {
      const date = new Date(detection.timestamp).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          total: 0,
          approved: 0,
          rejected: 0,
          averageScore: 0
        };
      }

      const day = dailyStats[date];
      day.total++;
      if (detection.recommendation === 'approve') day.approved++;
      if (detection.recommendation === 'reject') day.rejected++;
      day.averageScore += detection.overallScore;
    });

    // 计算平均值
    Object.keys(dailyStats).forEach(date => {
      const day = dailyStats[date];
      day.averageScore = day.averageScore / day.total;
      day.passRate = day.approved / day.total;
    });

    return dailyStats;
  }
}

export default new NegativeDetectionService();