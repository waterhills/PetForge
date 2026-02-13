import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';
import PromptService from '../services/promptService.js';
import GenerationQualityService from '../services/generationQualityService.js';
import NegativeDetectionService from '../services/negativeDetectionService.js';
import PromptABTestingService from '../services/promptABTestingService.js';

const router = express.Router();
const logger = createLogger('prompt-optimization');

// 验证模式
const generatePromptSchema = z.object({
  style: z.enum(['pixar', 'clay', 'cyber', 'line']),
  petName: z.string().max(100).optional(),
  customPrompt: z.string().max(500).optional(),
  intensity: z.number().min(0).max(2).default(1),
  detailLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  type: z.enum(['2d', '3d']).default('2d'),
  inputImage: z.string().optional()
});

const createABTestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  variants: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    prompt: z.string().min(1),
    weight: z.number().min(0).max(2).default(1)
  })).min(2).max(5)
});

// 生成优化 Prompt
router.post('/generate-prompt', authenticateToken, async (req, res) => {
  try {
    logger.info('Generating optimized prompt', { userId: req.userId });

    const validatedData = generatePromptSchema.parse(req.body);
    const promptData = await PromptService.generatePrompt(validatedData);

    logger.info('Prompt generated successfully', {
      style: validatedData.style,
      variantsCount: promptData.variants.length
    });

    res.json({
      success: true,
      data: {
        positive: promptData.positive,
        negative: promptData.negative,
        variants: promptData.variants,
        metadata: promptData.metadata,
        quality: await PromptService.analyzePromptQuality(promptData)
      }
    });

  } catch (error) {
    logger.error('Error generating prompt', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 优化现有 Prompt
router.post('/optimize-prompt', authenticateToken, async (req, res) => {
  try {
    logger.info('Optimizing prompt', { userId: req.userId });

    const { positive, negative, metadata } = req.body;
    if (!positive || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Positive prompt and metadata are required'
      });
    }

    const optimized = await PromptService.optimizePrompt({
      positive,
      negative: negative || '',
      metadata
    });

    logger.info('Prompt optimized', {
      originalQuality: metadata.originalScore || 'N/A',
      optimizedQuality: optimized.quality.score,
      issuesCount: optimized.detection.issues.length
    });

    res.json({
      success: true,
      data: optimized
    });

  } catch (error) {
    logger.error('Error optimizing prompt', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 分析 Prompt 质量
router.post('/analyze-prompt', authenticateToken, async (req, res) => {
  try {
    logger.info('Analyzing prompt quality', { userId: req.userId });

    const { positive, negative, metadata } = req.body;
    if (!positive || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Positive prompt and metadata are required'
      });
    }

    const analysis = PromptService.analyzePromptQuality({
      positive,
      negative: negative || '',
      metadata
    });

    logger.info('Prompt quality analyzed', { score: analysis.score.totalScore });

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Error analyzing prompt', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 检测负面样本
router.post('/detect-negative', authenticateToken, async (req, res) => {
  try {
    logger.info('Detecting negative samples', { userId: req.userId });

    const detection = await NegativeDetectionService.detectNegativeSample(req.body);

    logger.info('Negative detection completed', {
      score: detection.overallScore,
      recommendation: detection.recommendation,
      issuesCount: detection.issues.length
    });

    res.json({
      success: true,
      data: detection
    });

  } catch (error) {
    logger.error('Error detecting negative samples', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 创建 A/B 测试
router.post('/create-ab-test', authenticateToken, async (req, res) => {
  try {
    logger.info('Creating A/B test', { userId: req.userId });

    const validatedData = createABTestSchema.parse(req.body);
    const result = await PromptABTestingService.createABTest(validatedData);

    if (result.success) {
      logger.info('A/B test created', { testId: result.data.testId });

      // 启动测试
      const startResult = await PromptABTestingService.startABTest(result.data.testId);

      res.json({
        success: true,
        data: {
          testId: result.data.testId,
          status: startResult.data.status,
          variants: result.data.variants
        }
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    logger.error('Error creating A/B test', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 记录 A/B 测试样本
router.post('/record-ab-test-sample', authenticateToken, async (req, res) => {
  try {
    logger.info('Recording A/B test sample', { userId: req.userId });

    const { testId, variantId, resultData } = req.body;

    if (!testId || !variantId || !resultData) {
      return res.status(400).json({
        success: false,
        error: 'testId, variantId, and resultData are required'
      });
    }

    const result = await PromptABTestingService.recordSample(testId, variantId, resultData);

    if (result.success) {
      logger.info('A/B test sample recorded', {
        testId,
        variantId,
        totalSamples: result.data.totalSamples
      });

      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    logger.error('Error recording A/B test sample', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 分析 A/B 测试结果
router.post('/analyze-ab-test', authenticateToken, async (req, res) => {
  try {
    logger.info('Analyzing A/B test results', { userId: req.userId });

    const { testId } = req.body;

    if (!testId) {
      return res.status(400).json({
        success: false,
        error: 'testId is required'
      });
    }

    const result = await PromptABTestingService.analyzeTestResults(testId);

    if (result.success) {
      logger.info('A/B test analyzed', {
        testId,
        winner: result.data.winner?.variantId,
        confidence: result.data.confidence,
        totalSamples: result.data.totalSamples
      });

      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    logger.error('Error analyzing A/B test', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取 A/B 测试状态
router.get('/ab-test-status/:testId', authenticateToken, async (req, res) => {
  try {
    logger.info('Getting A/B test status', {
      testId: req.params.testId,
      userId: req.userId
    });

    const status = await PromptABTestingService.getTestStatus(req.params.testId);

    logger.info('A/B test status retrieved', { testId: req.params.testId, status: status.status });

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Error getting A/B test status', error, {
      testId: req.params.testId,
      userId: req.userId
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取测试历史
router.get('/test-history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = PromptABTestingService.getTestHistory(limit);

    logger.info('Retrieved test history', {
      userId: req.userId,
      count: history.length
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logger.error('Error getting test history', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取测试统计
router.get('/test-statistics', authenticateToken, async (req, res) => {
  try {
    const stats = PromptABTestingService.getTestStatistics();

    logger.info('Retrieved test statistics', {
      userId: req.userId,
      totalTests: stats.total
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting test statistics', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取质量评估历史
router.get('/quality-history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = GenerationQualityService.getAssessmentHistory(limit);

    logger.info('Retrieved quality assessment history', {
      userId: req.userId,
      count: history.length
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logger.error('Error getting quality history', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取质量统计
router.get('/quality-statistics', authenticateToken, async (req, res) => {
  try {
    const stats = GenerationQualityService.getQualityStats();

    logger.info('Retrieved quality statistics', {
      userId: req.userId,
      totalAssessments: stats.total
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting quality statistics', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取推荐的 Prompt
router.get('/recommended-prompt', authenticateToken, async (req, res) => {
  try {
    const { style, type, intensity } = req.query;

    if (!style) {
      return res.status(400).json({
        success: false,
        error: 'style parameter is required'
      });
    }

    const recommendation = PromptABTestingService.getRecommendedPrompt({
      style,
      type: type || '2d',
      intensity: intensity ? parseFloat(intensity) : 1
    });

    logger.info('Retrieved recommended prompt', {
      userId: req.userId,
      style,
      basedOn: recommendation.basedOn
    });

    res.json({
      success: true,
      data: recommendation
    });

  } catch (error) {
    logger.error('Error getting recommended prompt', error, { userId: req.userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;