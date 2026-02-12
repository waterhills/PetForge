import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * Real ComfyUI Integration Service
 * 使用真实的ComfyUI API进行图像生成
 */
class ComfyUIService {
  constructor() {
    this.comfyUIUrl = process.env.COMFYUI_URL || 'http://localhost:8188';
    this.clientId = process.env.COMFYUI_CLIENT_ID || 'petforge-client';
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
        console.log(`[ComfyUI] Workflow file not found: ${workflowPath}, using default`);
        return this.getDefaultWorkflow();
      }

      const workflowData = fs.readFileSync(workflowPath, 'utf-8');
      const workflow = JSON.parse(workflowData);
      console.log(`[ComfyUI] Loaded workflow: ${workflowFilename}`);
      return workflow;
    } catch (error) {
      console.error(`[ComfyUI] Error loading workflow:`, error);
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
      console.log('[ComfyUI] Image uploaded to ComfyUI:', result.name);
      return result.name; // 返回上传后的文件名
    } catch (error) {
      console.error('[ComfyUI] Image upload error:', error);
      throw error;
    }
  }

  /**
   * 构建提示词
   */
  buildPrompt(taskData) {
    const { style, petName, customPrompt } = taskData;

    let prompt = `cute pet`;

    // 风格修饰符
    const styleModifiers = {
      'pixar': '3D render, Pixar animation style, vibrant colors, smooth textures, detailed, expressive eyes, soft lighting',
      'clay': 'clay animation style, stop motion, polymer clay, soft texture, handcrafted, warm lighting, childish, adorable, pastel colors',
      'cyber': 'cyberpunk, neon lights, mechanical elements, futuristic, glowing effects, high tech, digital art',
      'line': 'clean minimalist line art, simple elegant outlines, monochrome, vector style, suitable for printing',
    };

    if (styleModifiers[style]) {
      prompt += `, ${styleModifiers[style]}`;
    }

    if (petName) {
      prompt += `, pet's name is "${petName}"`;
    }

    if (customPrompt) {
      prompt += `, ${customPrompt}`;
    }

    return prompt;
  }

  /**
   * 自定义工作流参数
   */
  customizeWorkflow(workflow, taskData, uploadedImageName = null) {
    const prompt = this.buildPrompt(taskData);

    // 克隆工作流以避免修改原始对象
    const customizedWorkflow = JSON.parse(JSON.stringify(workflow));

    // 修改正向提示词（节点2）
    if (customizedWorkflow['2'] && customizedWorkflow['2'].inputs) {
      customizedWorkflow['2'].inputs.text = prompt;
      console.log(`[ComfyUI] Customized prompt for ${taskData.style}: ${prompt.substring(0, 50)}...`);
    }

    // 设置随机种子（节点4）
    if (customizedWorkflow['4'] && customizedWorkflow['4'].inputs) {
      customizedWorkflow['4'].inputs.seed = Math.floor(Math.random() * 1000000000);
      console.log(`[ComfyUI] Set random seed: ${customizedWorkflow['4'].inputs.seed}`);
    }

    // 如果有输入图像且已上传，设置到LoadImage节点（节点10）
    if (uploadedImageName && customizedWorkflow['10'] && customizedWorkflow['10'].inputs) {
      customizedWorkflow['10'].inputs.image = uploadedImageName;
      console.log(`[ComfyUI] Set input image: ${uploadedImageName}`);
    }

    return customizedWorkflow;
  }

  /**
   * 队列生成任务
   */
  async queueGeneration(taskData) {
    try {
      const { style = 'pixar', inputImage } = taskData;

      console.log(`[ComfyUI] Queueing generation: style=${style}`);
      console.log(`[ComfyUI] inputImage present: ${!!inputImage}, type: ${typeof inputImage}, length: ${inputImage?.length || 0}`);

      // 判断是否有输入图片
      const hasInputImage = !!inputImage;
      let uploadedImageName = null;

      // 如果有输入图片，先上传到ComfyUI
      if (hasInputImage) {
        console.log('[ComfyUI] Uploading input image for img2img...');
        uploadedImageName = await this.uploadImageToComfyUI(inputImage);
      }

      // 加载工作流（根据是否有输入图片选择工作流）
      const workflow = await this.loadWorkflow(style, hasInputImage);

      // 自定义工作流参数（传入上传的图片文件名）
      const customizedWorkflow = this.customizeWorkflow(workflow, taskData, uploadedImageName);

      // 准备请求数据
      const requestBody = {
        client_id: this.clientId,
        prompt: customizedWorkflow, // ComfyUI API期望工作流对象，不是字符串
      };

      console.log('[ComfyUI] Sending to ComfyUI:', JSON.stringify(requestBody, null, 2));

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
        console.error(`[ComfyUI] Request failed: ${response.status} ${errorText}`);
        throw new Error(`ComfyUI request failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      // ComfyUI返回 { prompt_id, number, node_errors }
      if (result.node_errors && Object.keys(result.node_errors).length > 0) {
        console.error('[ComfyUI] Node errors:', result.node_errors);
        throw new Error('ComfyUI workflow validation failed');
      }

      const taskId = result.prompt_id;
      console.log(`[ComfyUI] Task queued: ${taskId}`);

      return taskId;

    } catch (error) {
      console.error('[ComfyUI] Queue generation error:', error);
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

      console.log(`[ComfyUI] Status check: ${status} ${progress}%`);

      return result;

    } catch (error) {
      console.error('[ComfyUI] Status check error:', error);
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
        console.log('[ComfyUI] Generation completed successfully');
        return result;
      }

      if (result.status === 'failed') {
        throw new Error('Generation failed');
      }

      // 还在处理，等待重试
      console.log(`[ComfyUI] Still processing... (${result.progress || 0}%) attempt ${attempts + 1}/${maxAttempts}`);
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
