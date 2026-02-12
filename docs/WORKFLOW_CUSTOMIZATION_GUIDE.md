# 🎨 ComfyUI 工作流自定义完整指南

## 📚 目录
1. [什么是工作流](#什么是工作流)
2. [在ComfyUI界面创建工作流](#在comfyui界面创建工作流)
3. [导出工作流为API格式](#导出工作流为api格式)
4. [集成到PetForge](#集成到petforge)
5. [工作流示例](#工作流示例)
6. [常见场景](#常见场景)

---

## 什么是工作流

ComfyUI工作流是一个JSON格式的节点图，定义了：
- **节点类型**: 加载模型、编码文本、采样等
- **连接方式**: 数据如何在节点间流动
- **参数配置**: 每个节点的具体设置

**基本结构**:
```json
{
  "节点ID": {
    "inputs": {
      "参数名": "值或[其他节点ID, 输出索引]"
    },
    "class_type": "节点类型名"
  }
}
```

---

## 在ComfyUI界面创建工作流

### 步骤 1: 打开ComfyUI并熟悉界面

访问: http://localhost:8188

```
┌─────────────────────────────────────────────────────┐
│  ComfyUI 界面布局                                │
├─────────────────────────────────────────────────────┤
│  左侧: 节点列表                                    │
│    - Loaders (加载模型)                            │
│    - Sampling (采样)                                │
│    - Conditioning (条件)                             │
│    - Latent (潜空间)                               │
│    - Image (图像)                                  │
│                                                     │
│  中间: 画布区                                     │
│    - 拖拽节点到画布                                 │
│    - 连接节点                                       │
│    - 配置参数                                       │
│                                                     │
│  右侧: 工具栏                                      │
│    - Queue Prompt (执行)                            │
│    - Queue/History (队列/历史)                       │
│    - Save/Load (保存/加载)                          │
└─────────────────────────────────────────────────────┘
```

### 步骤 2: 创建基础图像生成工作流

#### 2.1 添加必要的节点

右键点击画布 → 添加节点，或从左侧双击添加：

**必需节点**:

1. **CheckpointLoaderSimple** (加载模型)
   - 位置: `loaders → CheckpointLoaderSimple`
   - 用途: 加载SD模型

2. **CLIPTextEncode** (正向提示词)
   - 添加2次
   - 一个用于正向提示
   - 一个用于负向提示

3. **KSampler** (采样器)
   - 位置: `sampling → KSampler`
   - 用途: 生成图像的核心节点

4. **VAEDecode** (解码)
   - 位置: `latent → VAEDecode`
   - 用途: 将潜空间转换为图像

5. **SaveImage** (保存图像)
   - 位置: `image → SaveImage`
   - 用途: 保存生成结果

6. **LoadImage** (加载输入图像)
   - 位置: `image → LoadImage`
   - 用途: 加载用户上传的宠物照片

#### 2.2 连接节点

按照以下方式连接（从节点的输出连到下一个节点的输入）:

```
CheckpointLoaderSimple (模型加载)
  ├── model[0] → KSampler.model
  ├── clip[1] → CLIPTextEncode.clip (正向)
  └── clip[2] → CLIPTextEncode.clip (负向)

CLIPTextEncode (正向提示词)
  └── CONDITIONING → KSampler.positive

CLIPTextEncode (负向提示词)
  └── CONDITIONING → KSampler.negative

KSampler (采样器)
  └── LATENT → VAEDecode.samples

VAEDecode (解码器)
  └── IMAGE → SaveImage.images
```

#### 2.3 配置参数

**CheckpointLoaderSimple**:
- `ckpt_name`: 选择您的模型（如 `sd_xl_base_1.0.safetensors`）

**CLIPTextEncode (正向)**:
- `text`: "cute pet, high quality, detailed"

**CLIPTextEncode (负向)**:
- `text`: "blurry, low quality, distorted, ugly"

**KSampler**:
- `seed`: 123456789 (或使用 `-1` 随机)
- `steps`: 20 (采样步数，越高越慢但质量可能更好)
- `cfg`: 8 (提示词遵循度，7-15)
- `sampler_name`: "euler" (采样器算法)
- `scheduler`: "normal" (调度器)

**VAEDecode**:
- `vae`: 连接到 CheckpointLoaderSimple 的 vae 输出

**SaveImage**:
- `filename_prefix`: "petforge"

#### 2.4 测试工作流

1. 点击右上角 **"Queue Prompt"** 按钮
2. 观察右侧 "Queue" 标签
3. 生成完成后在 "Save Image" 节点查看结果

---

## 导出工作流为API格式

### 方法 1: 使用 "Save (API Format)" 按钮

1. 点击菜单栏 **"Save"**
2. 选择 **"Save (API Format)"**
3. 保存为 `pet_generation_api.json`

这会生成一个JSON文件，可以直接通过API调用！

### 方法 2: 查看当前工作流格式

1. 点击菜单栏 **"Save"**
2. 选择 **"Save"**
3. 查看JSON结构

**重要区别**:
- **Save (API Format)**: 简化版，用于API调用（推荐）
- **Save (Default)**: 包含UI信息，用于保存加载工作流

---

## 集成到PetForge

### 步骤 1: 保存工作流文件

创建目录并保存工作流:

```bash
mkdir -p petforge-backend/workflows
```

将导出的工作流保存为:
```
petforge-backend/workflows/pet_sdxl.json
```

### 步骤 2: 更新 AI 服务

编辑 `petforge-backend/src/services/aiGenerationService.js`:

#### 当前实现（简单提示词）

```javascript
async queueGeneration(taskData) {
  const prompt = this.buildPrompt(taskData);
  const requestBody = {
    client_id: this.clientId,
    task: {
      prompt: prompt, // 只是文本提示词
    }
  };
}
```

#### 新实现（使用工作流）

```javascript
async queueGeneration(taskData) {
  try {
    // 1. 加载工作流模板
    const workflowTemplate = await this.loadWorkflow(taskData.style);

    // 2. 根据参数修改工作流
    const workflow = this.customizeWorkflow(workflowTemplate, taskData);

    // 3. 发送到ComfyUI
    const response = await fetch(`${this.comfyUIUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        prompt: workflow, // 使用完整工作流
      }),
    });

    const result = await response.json();
    return result.prompt_id; // 返回任务ID

  } catch (error) {
    console.error('[AI Service] Queue generation error:', error);
    throw error;
  }
}

/**
 * 加载工作流文件
 */
async loadWorkflow(style) {
  const fs = await import('fs');
  const path = await import('path');

  const workflowPath = path.join(
    process.cwd(),
    'workflows',
    `${style}_workflow.json`
  );

  const workflowData = fs.readFileSync(workflowPath, 'utf-8');
  return JSON.parse(workflowData);
}

/**
 * 根据用户输入自定义工作流
 */
customizeWorkflow(workflow, taskData) {
  // 修改提示词
  const positivePrompt = this.buildPrompt(taskData);

  // 假设节点 6 是 CLIP Text Encode (正向)
  if (workflow['6']) {
    workflow['6'].inputs.text = positivePrompt;
  }

  // 修改种子
  const seed = Math.floor(Math.random() * 1000000000);
  if (workflow['3']) { // 假设节点 3 是 KSampler
    workflow['3'].inputs.seed = seed;
  }

  // 修改输入图像（如果有）
  if (taskData.inputImage && workflow['10']) {
    // 假设节点 10 是 LoadImage
    workflow['10'].inputs.image = taskData.inputImage;
  }

  return workflow;
}
```

### 步骤 3: 为不同风格创建工作流

创建多个工作流文件:

```
petforge-backend/workflows/
├── pixar_workflow.json      # 皮克斯风格
├── clay_workflow.json       # 粘土风格
├── cyber_workflow.json      # 赛博风格
└── line_workflow.json       # 线条风格
```

---

## 工作流示例

### 示例 1: 基础文本到图像

```json
{
  "3": {
    "inputs": {
      "seed": 123456789,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": {
      "ckpt_name": "sd_xl_base_1.0.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "6": {
    "inputs": {
      "text": "cute pet, high quality",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": {
      "text": "blurry, low quality",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "9": {
    "inputs": {
      "filename_prefix": "petforge",
      "images": ["8", 0]
    },
    "class_type": "SaveImage"
  },
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode"
  }
}
```

### 示例 2: 图像到图像（Img2Img）

```json
{
  "1": {
    "inputs": {
      "image": "input_placeholder",
      "upload": "image"
    },
    "class_type": "LoadImage"
  },
  "3": {
    "inputs": {
      "seed": 123456789,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler_a",
      "scheduler": "normal",
      "denoise": 0.75,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": {
      "ckpt_name": "sd_xl_base_1.0.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": {
      "pixels": ["10", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEEncode"
  },
  "6": {
    "inputs": {
      "text": "cute pet, pixar style, 3d render",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": {
      "text": "blurry, distorted, ugly",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode"
  },
  "9": {
    "inputs": {
      "filename_prefix": "petforge_img2img",
      "images": ["8", 0]
    },
    "class_type": "SaveImage"
  },
  "10": {
    "inputs": {
      "upscale_method": "nearest-exact",
      "width": 1024,
      "height": 1024,
      "crop": "disabled",
      "image": ["1", 0]
    },
    "class_type": "ImageScale"
  }
}
```

### 示例 3: 带 ControlNet 的高级工作流

```json
{
  "1": {
    "inputs": {
      "image": "input_image"
    },
    "class_type": "LoadImage"
  },
  "4": {
    "inputs": {
      "ckpt_name": "sd_xl_base_1.0.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": {
      "pixels": ["1", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEEncode"
  },
  "6": {
    "inputs": {
      "text": "cute pet, high quality, detailed",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": {
      "text": "blurry, low quality",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": {
      "control_net_name": "control_v11p_sd15_s2bae68e.pth",
      "image": ["10", 0]
    },
    "class_type": "ControlNetLoader"
  },
  "9": {
    "inputs": {
      "seed": 123456789,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0],
      "control_net": [["8", 0], ["11", 0]]
    },
    "class_type": "KSampler"
  },
  "10": {
    "inputs": {
      "upscale_method": "lanczos",
      "width": 512,
      "height": 512,
      "crop": "disabled",
      "image": ["1", 0]
    },
    "class_type": "ImageScale"
  },
  "11": {
    "inputs": {
      "strength": 0.7,
      "conditioning": ["6", 0]
    },
    "class_type": "ControlNetApply"
  },
  "12": {
    "inputs": {
      "filename_prefix": "petforge_controlnet",
      "images": ["13", 0]
    },
    "class_type": "SaveImage"
  },
  "13": {
    "inputs": {
      "samples": ["9", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode"
  }
}
```

---

## 常见场景

### 场景 1: 创建不同风格的工作流

1. **在ComfyUI中**创建基础工作流
2. **调整CLIPTextEncode节点的text**:
   - 皮克斯: "3D render, Pixar style, vibrant colors"
   - 粘土: "clay animation, stop motion, soft texture"
   - 赛博: "cyberpunk, neon lights, futuristic"
3. **导出为不同名称**:
   - `pixar_workflow.json`
   - `clay_workflow.json`
   - `cyber_workflow.json`

### 场景 2: 优化生成速度

**调整KSampler参数**:
- `steps`: 降低到 10-15 (更快) 或提高到 30-50 (更慢但更好)
- `sampler_name`: 使用 "dpmpp_sde" (质量好) 或 "euler" (快)

**使用更快的模型**:
- `sd_xl_turbo.safetensors` (4-8步即可)

### 场景 3: 添加图像放大

1. 添加 **ImageScale** 节点
2. 添加 **UpscaleModelLoader** 节点
3. 添加 **ImageUpscaleWithModel** 节点

连接:
```
SaveImage 之前的图像
  → ImageUpscaleWithModel
    → ImageScale (调整尺寸)
      → SaveImage
```

### 场景 4: 使用LoRA

添加 LoRA 加载器:

1. 添加 **LoraLoader** 节点
2. 配置:
   ```
   lora_name: "pet_style_lora.safetensors"
   strength_model: 0.8
   strength_clip: 0.8
   ```
3. 连接到模型和clip

---

## 🎯 实战练习

### 练习 1: 创建第一个工作流

1. 打开 http://localhost:8188
2. 添加节点: CheckpointLoader, CLIPTextEncode x2, KSampler, VAEDecode, SaveImage
3. 连接节点
4. 设置参数
5. 点击 "Queue Prompt"
6. 导出为API格式

### 练习 2: 集成到PetForge

1. 将导出的工作流保存到 `petforge-backend/workflows/`
2. 修改 `aiGenerationService.js` 使用新工作流
3. 重启后端
4. 在 http://localhost:3000/upload 测试

---

## 📞 需要帮助？

告诉我您遇到的具体问题：

❓ **基础问题**:
- 如何添加某个节点？
- 如何连接节点？
- 导出的JSON格式不对？

❓ **集成问题**:
- 如何修改工作流的某个参数？
- 如何动态修改提示词？
- 如何处理输入图像？

❓ **优化问题**:
- 如何提高生成速度？
- 如何改善质量？
- 如何添加特殊效果？

我会帮您解决！
