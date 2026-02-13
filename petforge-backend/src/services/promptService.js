import fs from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Prompt 管理服务
 * 负责管理不同艺术风格的 Prompt 模板，实现动态生成和优化
 */
class PromptService {
  constructor() {
    // 风格模板路径
    this.templatePath = path.join(process.cwd(), 'workflows');
    // 缓存已加载的模板
    this.templateCache = new Map();
  }

  /**
   * 质量评估维度定义
   */
  getQualityMetrics() {
    return {
      clarity: 0.7,      // 清晰度（主体是否清晰）
      aesthetics: 0.8,   // 美学质量
      consistency: 0.9,  // 一致性（风格符合度）
      cuteness: 0.8,     // 完成度（是否完整）
      appeal: 0.7        // 吸引力（整体吸引力）
    };
  }

  /**
   * 验证 Prompt 参数
   */
  validatePromptParams(params) {
    const promptParamsSchema = z.object({
      style: z.enum(['pixar', 'clay', 'cyber', 'line']),
      petName: z.string().max(100).optional(),
      customPrompt: z.string().max(500).optional(),
      intensity: z.number().min(0).max(2).default(1), // 强度调节: 0.5(弱), 1(中), 2(强)
      detailLevel: z.enum(['low', 'medium', 'high']).default('medium'), // 细节级别
      type: z.enum(['2d', '3d']).default('2d'),
      inputImage: z.string().optional() // 输入图像的base64
    });

    return promptParamsSchema.parse(params);
  }

  /**
   * 获取风格模板
   */
  async getStyleTemplate(style) {
    // 从缓存获取
    if (this.templateCache.has(style)) {
      return this.templateCache.get(style);
    }

    try {
      // 加载JSON模板文件
      const templatePath = path.join(this.templatePath, `${style}_prompts.json`);

      if (!fs.existsSync(templatePath)) {
        console.log(`[Prompt] Template file not found: ${templatePath}, using default`);
        return this.getDefaultTemplate(style);
      }

      const templateData = fs.readFileSync(templatePath, 'utf-8');
      const template = JSON.parse(templateData);

      // 缓存模板
      this.templateCache.set(style, template);

      console.log(`[Prompt] Loaded template for style: ${style}`);
      return template;
    } catch (error) {
      console.error(`[Prompt] Error loading template for ${style}:`, error);
      return this.getDefaultTemplate(style);
    }
  }

  /**
   * 获取默认模板
   */
  getDefaultTemplate(style) {
    const baseTemplates = {
      pixar: {
        positive: [
          "A adorable 3D Pixar-style character of a pet",
          "cute and expressive",
          "vibrant colors",
          "high quality render",
          "soft lighting",
          "cinematic composition",
          "detailed textures"
        ],
        negative: [
          "dark",
          "scary",
          "realistic",
          "low quality",
          "blurry",
          "deformed",
          "distorted"
        ],
        modifiers: {
          emotion: ["happy", "playful", "sleepy", "curious", "excited"],
          pose: ["sitting", "standing", "lying down", "playing", "running"],
          background: ["simple", "studio", "indoor", "outdoor", "abstract"],
          colorPalette: ["bright", "warm", "cool", "pastel", "vibrant"]
        }
      },
      clay: {
        positive: [
          "A handcrafted claymation character of a pet",
          "cute, playful",
          "bright colors",
          "simple shapes",
          "clay texture visible",
          "handcrafted feel",
          "stop motion style"
        ],
        negative: [
          "realistic",
          "scary",
          "complex",
          "dark",
          "digital art",
          "photorealistic"
        ],
        modifiers: {
          material: ["polymery clay", "plasticine", "modeling clay", "air dry clay"],
          texture: ["glossy", "matte", "textured", "smooth"],
          shape: ["rounded", "geometric", "organic", "chunky"],
          mood: ["cheerful", "calm", "mischievous", "friendly"]
        }
      },
      cyber: {
        positive: [
          "A cool cyberpunk pet character",
          "neon lights",
          "futuristic elements",
          "vibrant colors",
          "high tech aesthetic",
          "clean lines",
          "glowing effects"
        ],
        negative: [
          "traditional",
          "cute",
          "soft lighting",
          "pastel colors",
          "rustic",
          "vintage"
        ],
        modifiers: {
          tech: ["cybernetic", "robotic", "mechanical", "augmented"],
          lighting: ["neon glow", "led lights", "holographic", "digital"],
          elements: ["circuit patterns", "glowing circuits", "tech details"],
          vibe: ["edgy", "futuristic", "digital", "high-tech"]
        }
      },
      line: {
        positive: [
          "A minimalist line art pet character",
          "clean lines",
          "simple shapes",
          "elegant",
          "professional",
          "artistic",
          "vector style"
        ],
        negative: [
          "complex",
          "detailed",
          "messy",
          "3D rendering",
          "realistic",
          "colorful"
        ],
        modifiers: {
          style: ["geometric", "organic", "abstract", "minimal"],
          lineType: ["single stroke", "contour line", "technical drawing", "sketch"],
          composition: ["centered", "asymmetrical", "balanced", "dynamic"],
          detail: ["simple outline", "minimalist", "pure line art", "stencil"]
        }
      }
    };

    return baseTemplates[style] || baseTemplates.pixar;
  }

  /**
   * 动态生成 Prompt
   */
  async generatePrompt(params) {
    try {
      // 验证参数
      const validatedParams = this.validatePromptParams(params);
      const { style, petName, customPrompt, intensity, detailLevel, type } = validatedParams;

      // 获取风格模板
      const template = await this.getStyleTemplate(style);

      // 构建正向提示词
      let positivePrompts = this.buildPositivePrompts(template, {
        petName,
        customPrompt,
        intensity,
        detailLevel,
        type
      });

      // 构建反向提示词
      let negativePrompts = this.buildNegativePrompts(template, {
        intensity,
        type
      });

      // 生成变体用于 A/B 测试
      const variants = this.generateVariants(template, validatedParams);

      return {
        positive: positivePrompts,
        negative: negativePrompts,
        variants,
        metadata: {
          style,
          intensity,
          detailLevel,
          type,
          timestamp: new Date().toISOString(),
          variantCount: variants.length
        }
      };

    } catch (error) {
      console.error('[Prompt] Error generating prompt:', error);
      throw new Error(`Failed to generate prompt: ${error.message}`);
    }
  }

  /**
   * 构建正向提示词
   */
  buildPositivePrompts(template, options) {
    const { petName, customPrompt, intensity, detailLevel, type } = options;

    let prompts = [...template.positive];

    // 添加宠物名称
    if (petName) {
      prompts.unshift(`pet's name is "${petName}"`);
    }

    // 根据强度调整
    if (intensity > 1) {
      // 高强度 - 添加更多细节描述
      prompts.push('ultra detailed', 'highly realistic', 'masterpiece');
    } else if (intensity < 1) {
      // 低强度 - 简化描述
      prompts = prompts.filter(p => !p.includes('detailed') && !p.includes('high'));
      prompts.push('simple design');
    }

    // 根据细节级别调整
    if (detailLevel === 'high') {
      prompts.push('intricate details', 'fine details', 'detailed features');
    } else if (detailLevel === 'low') {
      prompts = prompts.filter(p => !p.includes('detailed'));
    }

    // 根据类型调整
    if (type === '3d') {
      prompts.push('3D render', '3D model', 'three dimensional');
    }

    // 添加自定义提示词
    if (customPrompt) {
      prompts.push(customPrompt);
    }

    // 添加风格修饰符
    prompts.push(this.getStyleModifier(template, intensity));

    // 去重并限制长度
    prompts = [...new Set(prompts)].slice(0, 20);

    return prompts.join(', ');
  }

  /**
   * 构建反向提示词
   */
  buildNegativePrompts(template, options) {
    const { intensity } = options;

    let negatives = [...template.negative];

    // 根据强度添加更多反向词
    if (intensity > 1) {
      negatives.push(
        'low resolution',
        'watermark',
        'signature',
        'text',
        'word',
        'letter',
        'jpeg artifacts',
        'pixelated',
        'blurry'
      );
    }

    // 去重
    negatives = [...new Set(negatives)];

    return negatives.join(', ');
  }

  /**
   * 获取风格修饰符
   */
  getStyleModifier(template, intensity) {
    // 根据模板类型返回对应的风格描述
    if (template.positive.some(p => p.includes('Pixar'))) {
      return 'Pixar animation style';
    } else if (template.positive.some(p => p.includes('clay'))) {
      return 'claymation stop motion';
    } else if (template.positive.some(p => p.includes('cyberpunk'))) {
      return 'cyberpunk aesthetic';
    } else if (template.positive.some(p => p.includes('line'))) {
      return 'minimalist line art';
    }
    return 'professional quality';
  }

  /**
   * 生成 Prompt 变体（用于 A/B 测试）
   */
  generateVariants(template, params) {
    const { style, petName, customPrompt, intensity, detailLevel } = params;
    const variants = [];

    // 基础变体
    variants.push({
      id: 'base',
      name: 'Base Prompt',
      intensity: 1,
      detailLevel: detailLevel
    });

    // 高强度变体
    if (intensity !== 2) {
      variants.push({
        id: 'intense',
        name: 'High Intensity',
        intensity: 2,
        detailLevel: 'high'
      });
    }

    // 低强度变体
    if (intensity !== 0.5) {
      variants.push({
        id: 'gentle',
        name: 'Gentle Intensity',
        intensity: 0.5,
        detailLevel: 'low'
      });
    }

    // 高细节变体
    if (detailLevel !== 'high') {
      variants.push({
        id: 'detailed',
        name: 'High Detail',
        intensity: intensity,
        detailLevel: 'high'
      });
    }

    // 生成每个变体的完整提示词
    return variants.map(variant => {
      const variantParams = { ...params, ...variant };
      return {
        ...variant,
        prompt: this.buildPositivePrompts(template, variantParams),
        negative: this.buildNegativePrompts(template, variantParams),
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * 混合多个 Prompt 元素
   */
  async blendPrompts(promptConfigs) {
    try {
      const blended = {
        positive: [],
        negative: []
      };

      for (const config of promptConfigs) {
        const styleData = await this.getStyleTemplate(config.style);

        // 混合正向提示词
        styleData.positive.forEach(prompt => {
          if (config.weight > 0.5 && !blended.positive.includes(prompt)) {
            blended.positive.push(prompt);
          }
        });

        // 混合反向提示词（取交集）
        if (!config.includeNegatives) {
          styleData.negative.forEach(negative => {
            if (!blended.negative.includes(negative)) {
              blended.negative.push(negative);
            }
          });
        }
      }

      return {
        positive: blended.positive.join(', '),
        negative: blended.negative.join(', '),
        metadata: {
          blendCount: promptConfigs.length,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('[Prompt] Error blending prompts:', error);
      throw new Error(`Failed to blend prompts: ${error.message}`);
    }
  }

  /**
   * 分析 Prompt 质量
   */
  analyzePromptQuality(promptData) {
    const { positive, negative, metadata } = promptData;

    const qualityScore = {
      completeness: this.checkCompleteness(positive, metadata),
      balance: this.checkBalance(positive, negative),
      specificity: this.checkSpecificity(positive),
      consistency: this.checkStyleConsistency(positive, metadata.style),
      totalScore: 0 // 将在后面计算
    };

    // 计算总分
    qualityScore.totalScore = Math.round(
      (qualityScore.completeness * 0.25 +
       qualityScore.balance * 0.25 +
       qualityScore.specificity * 0.25 +
       qualityScore.consistency * 0.25) * 100
    );

    return {
      score: qualityScore,
      recommendation: this.getRecommendation(qualityScore)
    };
  }

  /**
   * 检查完整性
   */
  checkCompleteness(positive, metadata) {
    const { style, intensity, detailLevel } = metadata;
    let score = 0.5; // 基础分数

    // 检查是否包含宠物描述
    if (positive.includes('pet') || positive.includes('character')) {
      score += 0.2;
    }

    // 检查风格描述
    const styleKeywords = {
      pixar: ['Pixar', '3D', 'render'],
      clay: ['clay', 'animation', 'handcrafted'],
      cyber: ['cyberpunk', 'neon', 'tech'],
      line: ['line art', 'minimalist', 'clean']
    };

    if (styleKeywords[style]?.some(keyword => positive.includes(keyword))) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * 检查平衡性
   */
  checkBalance(positive, negative) {
    const positiveCount = positive.split(', ').length;
    const negativeCount = negative.split(', ').length;

    // 理想比例是正向 60-80%，反向 20-40%
    const positiveRatio = positiveCount / (positiveCount + negativeCount);

    if (positiveRatio >= 0.6 && positiveRatio <= 0.8) {
      return 1;
    } else if (positiveRatio >= 0.5 && positiveRatio <= 0.9) {
      return 0.8;
    } else {
      return 0.6;
    }
  }

  /**
   * 检查具体性
   */
  checkSpecificity(positive) {
    const vagueWords = ['good', 'nice', 'beautiful', 'cute', 'lovely'];
    const specificWords = ['detailed', 'high quality', 'professional', 'masterpiece', 'ultra'];

    const vagueCount = vagueWords.filter(word => positive.includes(word)).length;
    const specificCount = specificWords.filter(word => positive.includes(word)).length;

    if (specificCount > 0) {
      return Math.min(1, specificCount * 0.3);
    } else if (vagueCount === 0) {
      return 0.8; // 没有模糊词，但也没有具体词
    } else {
      return 0.5; // 有模糊词
    }
  }

  /**
   * 检查风格一致性
   */
  checkStyleConsistency(positive, style) {
    const styleScores = {
      pixar: 0,
      clay: 0,
      cyber: 0,
      line: 0
    };

    const keywords = {
      pixar: ['3D', 'Pixar', 'render', 'animation', 'cinematic'],
      clay: ['clay', 'handcrafted', 'stop motion', 'animation', 'polymer'],
      cyber: ['cyber', 'neon', 'tech', 'futuristic', 'digital'],
      line: ['line art', 'minimalist', 'clean', 'simple', 'vector']
    };

    keywords[style].forEach(keyword => {
      if (positive.includes(keyword)) {
        styleScores[style] += 0.3;
      }
    });

    // 检查是否有其他风格的干扰词
    const otherStyles = Object.keys(styleScores).filter(s => s !== style);
    let penalty = 0;

    otherStyles.forEach(otherStyle => {
      keywords[otherStyle].forEach(keyword => {
        if (positive.includes(keyword)) {
          penalty += 0.1;
        }
      });
    });

    return Math.max(0, styleScores[style] - penalty);
  }

  /**
   * 获取质量建议
   */
  getRecommendation(qualityScore) {
    const { totalScore } = qualityScore;

    if (totalScore >= 80) {
      return { level: 'excellent', message: 'Excellent prompt quality! Ready for generation.' };
    } else if (totalScore >= 70) {
      return { level: 'good', message: 'Good prompt quality. Consider adding more specific details.' };
    } else if (totalScore >= 60) {
      return { level: 'fair', message: 'Fair quality. Review and improve specific elements.' };
    } else {
      return { level: 'poor', message: 'Poor quality. Please revise the prompt.' };
    }
  }

  /**
   * 检测负面样本
   */
  detectNegativeSamples(promptData) {
    const { positive, negative } = promptData;
    const issues = [];

    // 检查是否有冲突词
    const positiveWords = positive.split(', ');
    const negativeWords = negative.split(', ');

    positiveWords.forEach(posWord => {
      negativeWords.forEach(negWord => {
        if (posWord.includes(negWord) || negWord.includes(posWord)) {
          issues.push(`Potential conflict: "${posWord}" vs "${negWord}"`);
        }
      });
    });

    // 检查是否过于宽泛
    if (positiveWords.length < 3) {
      issues.push('Prompt is too broad. Add more specific details.');
    }

    // 检查是否有负面词混入正向提示
    const negativePhrases = ['blurry', 'low quality', 'ugly', 'bad', 'poor'];
    negativePhrases.forEach(phrase => {
      if (positive.includes(phrase)) {
        issues.push(`Negative phrase found in positive prompt: "${phrase}"`);
      }
    });

    return {
      hasIssues: issues.length > 0,
      issues,
      suggestion: issues.length > 0 ?
        'Prompt needs refinement to avoid conflicts and improve quality.' :
        'Prompt is well-balanced and ready for generation.'
    };
  }

  /**
   * 清理和优化 Prompt
   */
  async optimizePrompt(promptData) {
    let { positive, negative, metadata } = promptData;

    // 检测负面样本
    const detection = this.detectNegativeSamples({ positive, negative });

    if (detection.hasIssues) {
      console.log('[Prompt] Detected issues:', detection.issues);

      // 自动修复一些简单问题
      positive = this.cleanPositivePrompt(positive);
      negative = this.cleanNegativePrompt(negative);
    }

    // 重新分析质量
    const analysis = this.analyzePromptQuality({ positive, negative, metadata });

    return {
      optimized: {
        positive,
        negative,
        metadata
      },
      quality: analysis,
      detection,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 清理正向提示词
   */
  cleanPositivePrompt(positive) {
    // 移除负面词
    const negativeWords = ['blurry', 'low quality', 'ugly', 'bad', 'poor', 'scary'];
    let cleaned = positive;

    negativeWords.forEach(word => {
      cleaned = cleaned.replace(new RegExp(word, 'gi'), '');
    });

    // 移除多余的逗号和空格
    cleaned = cleaned.replace(/,\s*,/g, ',').replace(/^,\s*|\s*,\s*$/g, '');

    return cleaned;
  }

  /**
   * 清理反向提示词
   */
  cleanNegativePrompt(negative) {
    // 确保反向提示词不包含积极描述
    const positiveWords = ['beautiful', 'cute', 'perfect', 'amazing', 'great'];
    let cleaned = negative;

    positiveWords.forEach(word => {
      cleaned = cleaned.replace(new RegExp(word, 'gi'), '');
    });

    return cleaned;
  }

  /**
   * 清理模板缓存
   */
  clearCache() {
    this.templateCache.clear();
    console.log('[Prompt] Template cache cleared');
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus() {
    return {
      cacheSize: this.templateCache.size,
      cachedStyles: Array.from(this.templateCache.keys()),
      timestamp: new Date().toISOString()
    };
  }
}

export default new PromptService();