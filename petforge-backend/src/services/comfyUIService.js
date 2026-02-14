import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import PromptService from './promptService.js';
import GenerationQualityService from './generationQualityService.js';
import NegativeDetectionService from './negativeDetectionService.js';
import PromptABTestingService from './promptABTestingService.js';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('comfyUIService');

/**
 * Real ComfyUI Integration Service
 * 使用真实的ComfyUI API进行图像生成
 */
class ComfyUIService {
  constructor() {
    this.comfyUIUrl = process.env.COMFYUI_URL || 'http://localhost:8188';
    this.clientId = process.env.COMFYUI_CLIENT_ID || 'petforge-client';

    // 优化配置
    this.optimizationEnabled = process.env.COMFYUI_OPTIMIZATION === 'true';
    this.abTestingEnabled = process.env.COMFYUI_AB_TESTING === 'true';
    this.qualityAssessmentEnabled = process.env.COMFYUI_QUALITY_ASSESSMENT === 'true';
    this.negativeDetectionEnabled = process.env.COMFYUI_NEGATIVE_DETECTION === 'true';

    logger.debug('Service initialized with optimizations:', {
      optimization: this.optimizationEnabled,
      abTesting: this.abTestingEnabled,
      qualityAssessment: this.qualityAssessmentEnabled,
      negativeDetection: this.negativeDetectionEnabled
    });
  }

  /**
   * 加载工作流JSON文件
   */
  async loadWorkflow(style = 'pixar', hasInputImage = false) {
    try {
      // 如果有输入图片，使用img2img工作流，否则使用txt2img工作流
      const workflowFilename = hasInputImage ? `${style}_img2img.json` : `${style}_workflow.json`;
      const workflowPath = path.join(
        process.cwd(),
        'workflows',
        workflowFilename
      );

      // 检查文件是否存在
      if (!fs.existsSync(workflowPath)) {
        logger.debug(`Workflow file not found: ${workflowPath}, using default`);
        return this.getDefaultWorkflow();
      }

      const workflowData = fs.readFileSync(workflowPath, 'utf-8');
      const workflow = JSON.parse(workflowData);
      logger.debug(`Loaded workflow: ${workflowFilename}`);
      return workflow;
    } catch (error) {
      logger.error('Error loading workflow:', error);
      return this.getDefaultWorkflow();
    }
  }

  /**
   * 获取默认工作流（如果文件不存在）
   */
  getDefaultWorkflow() {
    return {
      "1": {
        "inputs": {
          "ckpt_name": "AnythingV5Ink_ink.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": "cute pet, 3D render, high quality",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": "blurry, low quality, ugly",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "seed": 123456789,
          "steps": 20,
          "cfg": 8,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "5": {
        "inputs": {
          "width": 512,
          "height": 512,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "samples": ["4", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },
      "7": {
        "inputs": {
          "filename_prefix": "petforge_comfyui",
          "images": ["6", 0]
        },
        "class_type": "SaveImage"
      }
    };
  }

  /**
   * 上传图片到ComfyUI服务器
   */
  async uploadImageToComfyUI(base64Image) {
    try {
      // 提取base64数据（如果包含data:image/xxx;base64,前缀）
      let imageData = base64Image;
      if (base64Image.includes(',')) {
        imageData = base64Image.split(',')[1];
      }

      // ComfyUI的/upload/image接口需要multipart/form-data
      const buffer = Buffer.from(imageData, 'base64');

      const formData = new FormData();
      formData.append('image', buffer, {
        filename: 'input_image.png',
        contentType: 'image/png',
      });

      const response = await fetch(`${this.comfyUIUrl}/upload/image`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`ComfyUI image upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      logger.debug('Image uploaded to ComfyUI:', result.name);
      return result.name; // 返回上传后的文件名
    } catch (error) {
      logger.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * 构建提示词 - 使用新的 Prompt 服务
   */
  async buildPrompt(taskData) {
    try {
      const { style, petName, customPrompt, intensity = 1, detailLevel = 'medium' } = taskData;

      logger.debug('[ComfyUI] Building optimized prompt for:', { style, petName, intensity, detailLevel });

      // 使用 Prompt 服务生成优化提示词
      const promptData = await PromptService.generatePrompt({
        style,
        petName,
        customPrompt,
        intensity,
        detailLevel,
        type: taskData.type || '2d'
      });

      // 如果启用了 A/B 测试，可能使用变体
      let finalPrompt = promptData.positive;
      let finalNegative = promptData.negative;

      if (this.abTestingEnabled && promptData.variants.length > 1) {
        // 选择第一个变体进行 A/B 测试
        const variant = promptData.variants[0];
        finalPrompt = variant.prompt;
        finalNegative = variant.negative;
        logger.debug('[ComfyUI] Using A/B test variant:', variant.id);
      }

      // 如果启用了优化，进一步优化提示词
      if (this.optimizationEnabled) {
        const optimized = await PromptService.optimizePrompt({
          positive: finalPrompt,
          negative: finalNegative,
          metadata: {
            style,
            intensity,
            detailLevel,
            type: taskData.type || '2d'
          }
        });
        finalPrompt = optimized.optimized.positive;
        finalNegative = optimized.optimized.negative;
        logger.debug('[ComfyUI] Prompt optimized with score:', optimized.quality.score);
      }

      logger.debug('[ComfyUI] Final prompt generated:', {
        positive: finalPrompt.substring(0, 100) + '...',
        negative: finalNegative.substring(0, 100) + '...'
      });

      return { positive: finalPrompt, negative: finalNegative };

    } catch (error) {
      logger.error('[ComfyUI] Error building prompt:', error);
      // 回退到简单提示词
      return this.getFallbackPrompt(taskData);
    }
  }

  /**
   * 获取备用提示词
   */
  getFallbackPrompt(taskData) {
    const { style, petName, customPrompt } = taskData;
    const fallback = {
      positive: `cute ${style} pet character`,
      negative: 'blurry, low quality, ugly, scary'
    };

    if (petName) {
      fallback.positive += `, name is ${petName}`;
    }

    if (customPrompt) {
      fallback.positive += `, ${customPrompt}`;
    }

    return fallback;
  }

  /**
   * 自定义工作流参数
   */
  async customizeWorkflow(workflow, taskData, uploadedImageName = null) {
    const promptData = await this.buildPrompt(taskData);

    // 克隆工作流以避免修改原始对象
    const customizedWorkflow = JSON.parse(JSON.stringify(workflow));

    // 修改正向提示词（节点2）
    if (customizedWorkflow['2'] && customizedWorkflow['2'].inputs) {
      customizedWorkflow['2'].inputs.text = promptData.positive;
      logger.debug(`[ComfyUI] Customized prompt for ${taskData.style}: ${promptData.positive.substring(0, 50)}...`);
    }

    // 修改反向提示词（节点3）
    if (customizedWorkflow['3'] && customizedWorkflow['3'].inputs) {
      customizedWorkflow['3'].inputs.text = promptData.negative;
      logger.debug(`[ComfyUI] Customized negative prompt for ${taskData.style}: ${promptData.negative.substring(0, 50)}...`);
    }

    // 设置随机种子（节点4）
    if (customizedWorkflow['4'] && customizedWorkflow['4'].inputs) {
      customizedWorkflow['4'].inputs.seed = Math.floor(Math.random() * 1000000000);
      logger.debug(`[ComfyUI] Set random seed: ${customizedWorkflow['4'].inputs.seed}`);
    }

    // 如果有输入图像且已上传，设置到LoadImage节点（节点10）
    if (uploadedImageName && customizedWorkflow['10'] && customizedWorkflow['10'].inputs) {
      customizedWorkflow['10'].inputs.image = uploadedImageName;
      logger.debug(`[ComfyUI] Set input image: ${uploadedImageName}`);
    }

    return customizedWorkflow;
  }

  /**
   * 记录 A/B 测试样本
   */
  async recordABTestSample(comfyTaskId, taskData) {
    try {
      // 获取当前活跃的 A/B 测试
      // 这里简化处理，实际应该从配置或数据库获取
      logger.debug('[ComfyUI] Recording A/B test sample for:', comfyTaskId);

      // 模拟记录样本
      const sampleData = {
        taskId: comfyTaskId,
        taskData,
        timestamp: new Date().toISOString()
      };

      logger.debug('[ComfyUI] A/B test sample recorded:', sampleData);

      // 这里可以集成实际的 A/B 测试服务
      // await PromptABTestingService.recordSample(testId, variantId, resultData);

    } catch (error) {
      logger.error('[ComfyUI] Error recording A/B test sample:', error);
    }
  }

  /**
   * 处理生成结果
   */
  async processGenerationResult(taskId, resultData) {
    try {
      logger.debug('[ComfyUI] Processing generation result for:', taskId);

      // 如果启用了负面样本检测
      if (this.negativeDetectionEnabled) {
        const detection = await NegativeDetectionService.detectNegativeSample({
          id: taskId,
          resultUrl: resultData.resultUrl,
          promptData: resultData.promptData,
          metadata: resultData.metadata
        });

        logger.debug('[ComfyUI] Negative detection result:', {
          score: detection.overallScore,
          recommendation: detection.recommendation,
          issues: detection.issues
        });

        if (detection.overallScore < 0.3) {
          logger.debug('[ComfyUI] Generation rejected due to negative sample detection');
          throw new Error('Generation rejected: Low quality detected');
        }
      }

      // 如果启用了质量评估
      if (this.qualityAssessmentEnabled) {
        const quality = await GenerationQualityService.assessGeneration({
          resultUrl: resultData.resultUrl,
          metadata: resultData.metadata,
          promptData: resultData.promptData
        });

        logger.debug('[ComfyUI] Quality assessment result:', {
          score: quality.score,
          recommendation: quality.recommendation
        });

        // 根据质量评估结果处理
        if (quality.score < 60) {
          logger.debug('[ComfyUI] Quality below threshold, consider regenerating');
          // 可以选择自动重新生成或标记为需要审查
        }
      }

      return resultData;

    } catch (error) {
      logger.error('[ComfyUI] Error processing generation result:', error);
      throw error;
    }
  }

  /**
   * 队列生成任务
   */
  async queueGeneration(taskData) {
    try {
      const { style = 'pixar', inputImage } = taskData;

      logger.debug(`[ComfyUI] Queueing generation: style=${style}`);
      logger.debug(`[ComfyUI] inputImage present: ${!!inputImage}, type: ${typeof inputImage}, length: ${inputImage?.length || 0}`);

      // 判断是否有输入图片
      const hasInputImage = !!inputImage;
      let uploadedImageName = null;

      // 如果有输入图片，先上传到ComfyUI
      if (hasInputImage) {
        logger.debug('[ComfyUI] Uploading input image for img2img...');
        uploadedImageName = await this.uploadImageToComfyUI(inputImage);
      }

      // 加载工作流（根据是否有输入图片选择工作流）
      const workflow = await this.loadWorkflow(style, hasInputImage);

      // 自定义工作流参数（传入上传的图片文件名）
      const customizedWorkflow = await this.customizeWorkflow(workflow, taskData, uploadedImageName);

      // 准备请求数据
      const requestBody = {
        client_id: this.clientId,
        prompt: customizedWorkflow, // ComfyUI API期望工作流对象，不是字符串
      };

      logger.debug('[ComfyUI] Sending to ComfyUI:', JSON.stringify(requestBody, null, 2));

      // 发送到ComfyUI
      const response = await fetch(`${this.comfyUIUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[ComfyUI] Request failed: ${response.status} ${errorText}`);
        throw new Error(`ComfyUI request failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      // ComfyUI返回 { prompt_id, number, node_errors }
      if (result.node_errors && Object.keys(result.node_errors).length > 0) {
        logger.error('[ComfyUI] Node errors:', result.node_errors);
        throw new Error('ComfyUI workflow validation failed');
      }

      const taskId = result.prompt_id;
      logger.debug(`[ComfyUI] Task queued: ${taskId}`);

      // 如果启用了 A/B 测试，记录测试数据
      if (this.abTestingEnabled) {
        await this.recordABTestSample(taskId, taskData);
      }

      return taskId;

    } catch (error) {
      logger.error('[ComfyUI] Queue generation error:', error);
      throw error;
    }
  }

  /**
   * 检查生成状态
   */
  async checkStatus(taskId) {
    try {
      // 检查历史记录
      const response = await fetch(`${this.comfyUIUrl}/history/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ComfyUI status check failed: ${response.statusText}`);
      }

      const historyData = await response.json();

      // 解析ComfyUI响应
      if (!historyData[taskId]) {
        return {
          status: 'pending',
          progress: 0,
          taskId,
          resultUrl: null,
        };
      }

      const task = historyData[taskId];

      // 判断状态
      let status = 'pending';
      let progress = 0;

      if (task.status && task.status.completed) {
        // 检查是否有输出图像 (outputs 是对象，不是数组)
        if (task.outputs && Object.keys(task.outputs).length > 0) {
          const firstOutput = task.outputs[Object.keys(task.outputs)[0]];
          if (firstOutput.images && firstOutput.images.length > 0) {
            status = 'completed';
            progress = 100;
          }
        }
      } else if (task.status.executing) {
        status = 'processing';
        progress = task.status.current_step ? (task.status.current_step / 20) * 100 : 50;
      }

      // 获取结果图片URL
      let resultUrl = null;
      if (status === 'completed' && task.outputs) {
        const outputKeys = Object.keys(task.outputs);
        for (const key of outputKeys) {
          const output = task.outputs[key];
          if (output.images && output.images.length > 0) {
            // ComfyUI保存的图片格式: filename, subfolder, type
            const imageInfo = output.images[0];
            const filename = imageInfo.filename;
            const subfolder = imageInfo.subfolder || '';
            const type = imageInfo.type || 'output';

            // 构建URL（ComfyUI默认不提供直接URL访问）
            // 通常文件保存在: ComfyUI/output/子文件夹
            // 可以通过文件名访问
            resultUrl = `http://localhost:8188/view?filename=${filename}&subfolder=${subfolder}&type=${type}`;
            break;
          }
        }
      }

      const result = {
        status,
        progress,
        taskId,
        resultUrl,
        error: null,
      };

      logger.debug(`[ComfyUI] Status check: ${status} ${progress}%`);

      // 如果完成，处理结果
      if (status === 'completed' && this.qualityAssessmentEnabled) {
        try {
          await this.processGenerationResult(taskId, {
            resultUrl,
            metadata: { taskId, timestamp: new Date().toISOString() },
            promptData: null // 这里应该从数据库获取
          });
        } catch (processingError) {
          logger.error('[ComfyUI] Error processing completed generation:', processingError);
          // 标记为失败但保留结果URL
          result.status = 'failed';
          result.error = processingError.message;
        }
      }

      return result;

    } catch (error) {
      logger.error('[ComfyUI] Status check error:', error);
      throw error;
    }
  }

  /**
   * 轮询等待完成
   */
  async waitForCompletion(taskId, interval = 2000, maxAttempts = 150) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const result = await this.checkStatus(taskId);

      if (result.status === 'completed') {
        logger.debug('[ComfyUI] Generation completed successfully');
        return result;
      }

      if (result.status === 'failed') {
        throw new Error('Generation failed');
      }

      // 还在处理，等待重试
      logger.debug(`[ComfyUI] Still processing... (${result.progress || 0}%) attempt ${attempts + 1}/${maxAttempts}`);
      await this.sleep(interval);
      attempts++;
    }

    throw new Error('Generation timeout: max attempts reached');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ComfyUIService();