# 🎯 ComfyUI 工作流自定义快速指南

## ✅ 测试结果分析

刚才的测试显示两个需要修复的问题：

1. **模型名称不存在** ❌
   ```
   您的ComfyUI中没有: sd_xl_base_1.0.safetensors
   可用的模型:
   - AnythingV5Ink_ink.safetensors
   - BlindBoxV2_BlindBoxV2.safetensors
   - hunyuan_3d_v2.1.safetensors
   - meinamix_meinaV11.safetensors
   ```

2. **图像占位符无效** ❌
   ```
   节点10的"input_placeholder"不是有效的图像
   需要实际的上传图像或删除此节点
   ```

## 📋 立即修复步骤

### 步骤 1: 检查可用的模型

在浏览器访问: http://localhost:8188

1. 找到 "CheckpointLoaderSimple" 节点
2. 查看 "ckpt_name" 下拉列表
3. 记录您实际拥有的模型名称

### 步骤 2: 下载推荐模型（如果需要）

**快速选项 - SDXL Turbo**（推荐，生成最快）:
```bash
# 下载地址
https://huggingface.co/stabilityai/sdxl-turbo/tree/main

# 保存到
G:/ComfyUI/models/checkpoints/

# 或者直接下载
https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0.safetensors
```

**高质量选项**:
- DreamShaper: https://civitai.com/models/11290/dreamshaper
- Realistic Vision: https://civitai.com/models/42830/realistic-vision-v60

### 步骤 3: 更新工作流文件

编辑 `petforge-backend/workflows/pixar_workflow.json`:

**修改节点4（模型加载器）**:
```json
"4": {
  "inputs": {
    "ckpt_name": "您的模型名称.safetensors"
  },
  "class_type": "CheckpointLoaderSimple"
}
```

例如，如果您下载了SDXL Turbo:
```json
"ckpt_name": "sd_xl_turbo_1.0.safetensors"
```

### 步骤 4: 处理输入图像（两个选择）

**选项 A - 不使用输入图像（文本到图像）**:

删除节点10 (LoadImage) 和节点5 (VAEEncode)，并修改KSampler:

```json
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
    "latent_image": ["5", 0]  // 删除这一行！
  },
  "class_type": "KSampler"
}
```

**选项 B - 使用输入图像（图像到图像）**:

将 `input_placeholder` 替换为实际的base64图像或上传的图像文件名（后端代码会处理）。

## 🎨 在ComfyUI界面中创建工作流（最简单）

### 步骤 1: 打开ComfyUI

访问: http://localhost:8188

### 步骤 2: 添加节点

右键点击画布 → "Add Node" → 添加以下节点：

```
1. CheckpointLoaderSimple
2. CLIPTextEncode (x2 - 一个正向，一个负向)
3. KSampler
4. VAEDecode
5. SaveImage
```

### 步骤 3: 连接节点

```
CheckpointLoaderSimple
  ├── model → KSampler.model
  ├── clip → CLIPTextEncode.clip (两个)

CLIPTextEncode (正向)
  └── CONDITIONING → KSampler.positive

CLIPTextEncode (负向)
  └── CONDITIONING → KSampler.negative

KSampler
  └── LATENT → VAEDecode.samples

VAEDecode
  └── IMAGE → SaveImage.images
```

### 步骤 4: 配置参数

**CheckpointLoaderSimple**:
- ckpt_name: 选择您下载的模型

**CLIPTextEncode (正向)**:
- text: "cute pet, high quality, detailed"

**CLIPTextEncode (负向)**:
- text: "blurry, low quality, ugly"

**KSampler**:
- seed: 123456789
- steps: 20
- cfg: 8
- sampler_name: euler
- scheduler: normal
- denoise: 1

**VAEDecode**:
- vae: 连接到 CheckpointLoaderSimple 的 vae 输出

**SaveImage**:
- filename_prefix: petforge_test

### 步骤 5: 测试生成

1. 点击右上角 "Queue Prompt" 按钮
2. 观察右侧进度
3. 生成完成后查看图像

### 步骤 6: 导出为API格式

1. 点击菜单 "Save"
2. 选择 "Save (API Format)"
3. 保存为: `petforge-backend/workflows/my_custom_workflow.json`

## 🔧 集成到PetForge后端

完成上述步骤后，您的自定义工作流就可以集成了！

### 方法 1: 手动测试

```bash
# 测试您的工作流
node test-workflow-simple.js petforge-backend/workflows/my_custom_workflow.json
```

### 方法 2: 在ComfyUI中直接使用

1. 在ComfyUI界面: http://localhost:8188
2. 点击 "Load" → 加载您保存的工作流JSON
3. 点击 "Queue Prompt" 测试

### 方法 3: 通过PetForge前端使用（完整集成）

目前PetForge使用简化的提示词方式。要完整支持自定义工作流，需要：

1. **测试通过的工作流已就绪**
2. **在ComfyUI中验证能正常生成**
3. **告诉我您想要集成哪个工作流**

我会帮您修改后端代码以支持新的工作流！

## 💡 推荐的初次工作流

如果您想快速开始，建议使用这个简化配置：

### 超简单SDXL Turbo工作流

```json
{
  "1": {
    "inputs": {
      "ckpt_name": "sd_xl_turbo_1.0.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "2": {
    "inputs": {
      "text": "cute pet, high quality",
      "clip": ["1", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "3": {
    "inputs": {
      "text": "blurry, low quality",
      "clip": ["1", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "4": {
    "inputs": {
      "seed": 123456789,
      "steps": 4,
      "cfg": 7,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["1", 0],
      "positive": ["2", 0],
      "negative": ["3", 0]
    },
    "class_type": "KSampler"
  },
  "5": {
    "inputs": {
      "samples": ["4", 0],
      "vae": ["1", 2]
    },
    "class_type": "VAEDecode"
  },
  "6": {
    "inputs": {
      "filename_prefix": "petforge",
      "images": ["5", 0]
    },
    "class_type": "SaveImage"
  }
}
```

**特点**:
- 使用SDXL Turbo（只需4-8步，快速！）
- 纯文本到图像（不需要输入图）
- 简单直接

保存为: `petforge-backend/workflows/sdxl_turbo_simple.json`

## 🎯 现在可以问我

告诉我您想要：

❓ **"帮我创建一个工作流，使用[您的模型名称]"**
   我会创建完整的工作流JSON

❓ **"如何添加[特定效果]到工作流？"**
   如：放大、ControlNet、LoRA等

❓ **"测试这个工作流:[粘贴JSON]"**
   我会帮您分析和测试

❓ **"如何修改提示词以获得更好的效果？"**
   我会给您提示词工程技巧

## 📚 额外资源

- **ComfyUI节点参考**: https://ltdrdata.github.io/ComfyUI-_nodes/
- **工作流分享**: https://comfylive.com/
- **SDXL提示词**: https://civitai.com/articles/4264-best-sdxl-1-0-prompts
- **提示词工程指南**: https://prompthero.com/stable-diffusion-prompts

祝您创作愉快！🎨✨
