# 🎯 PetForge + ComfyUI 连接指南

## ✅ 当前状态 - 所有服务已就绪！

```
┌─────────────────────────────────────────────────────────────┐
│  PetForge 架构                                          │
├─────────────────────────────────────────────────────────────┤
│                                                          │
│  前端 (Next.js)    →  http://localhost:3000              │
│       ↓                                                   │
│  上传图片 + 选择风格                                       │
│       ↓                                                   │
│  后端 (Express)    →  http://localhost:4000              │
│       ↓                                                   │
│  API 调用                                               │
│       ↓                                                   │
│  ComfyUI            →  http://localhost:8188              │
│       ↓                                                   │
│  AI 生成                                                │
│       ↓                                                   │
│  返回结果                                               │
│                                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 连接架构说明

### 1. 前端 → 后端通信
- **URL**: http://localhost:3000 → http://localhost:4000
- **API 端点**: `POST /api/generation/queue`
- **请求内容**:
  ```json
  {
    "type": "image",        // 或 "3d"
    "style": "pixar",       // clay, cyber, line
    "petName": "旺财",
    "inputImage": "base64...",
    "customPrompt": "红色领结"
  }
  ```

### 2. 后端 → ComfyUI 通信
- **URL**: http://localhost:4000 → http://localhost:8188
- **API 端点**: `POST /prompt`
- **配置文件**: `petforge-backend/.env`
  ```
  COMFYUI_URL="http://localhost:8188"
  COMFYUI_CLIENT_ID="petforge-client"
  ```

### 3. 代码文件位置

**后端 AI 服务**:
```
petforge-backend/src/services/aiGenerationService.js
```
- 负责构建 ComfyUI 提示词
- 发送生成请求到 ComfyUI
- 轮询生成状态
- 处理生成结果

**API 路由**:
```
petforge-backend/src/routes/generation.js
```
- 处理前端的生成请求
- 验证用户积分
- 调用 AI 服务
- 返回结果给前端

## 🧪 完整测试流程

### 测试 1: 验证服务连接

```bash
# 测试 ComfyUI
curl http://localhost:8188/queue

# 测试后端
curl http://localhost:4000/health

# 测试前端
# 浏览器访问 http://localhost:3000
```

### 测试 2: 测试 ComfyUI 工作流

在浏览器中：

1. **访问 ComfyUI**: http://localhost:8188

2. **加载基础工作流**:
   - 点击 "Load" 按钮
   - 选择 JSON 格式
   - 复制下面的工作流并粘贴

3. **简单测试工作流** (测试图像加载):

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
  "5": {
    "inputs": {
      "pixels": ["10", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode"
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
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode"
  },
  "9": {
    "inputs": {
      "filename_prefix": "petforge_test",
      "images": ["8", 0]
    },
    "class_type": "SaveImage"
  },
  "10": {
    "inputs": {
      "image": "example_image"
    },
    "class_type": "CheckpointLoaderSimple"
  }
}
```

4. **点击 "Queue Prompt" 测试**

### 测试 3: 端到端测试（PetForge 完整流程）

1. **访问上传页面**: http://localhost:3000/upload

2. **上传测试图片**:
   - 点击上传区域
   - 选择一张宠物图片
   - 输入宠物名称（如：旺财）

3. **选择风格**:
   - 皮克斯 3D (pixar)
   - 粘土世界 (clay)
   - 赛博萌宠 (cyber)
   - 极简线条 (line)

4. **点击"开始生成"**

5. **观察生成过程**:
   - 弹窗显示进度
   - 后端控制台显示日志
   - ComfyUI 队列显示任务

6. **获取结果**:
   - 生成完成后显示图片
   - 可下载或重新生成

## 📊 监控和调试

### 查看后端日志

```bash
# 后端正在后台运行，查看日志
cat C:\Users\DELL\AppData\Local\Temp\claude\G--myproject-firstpet\tasks\ba58f40.output
```

### 查看 ComfyUI 控制台

ComfyUI 的命令行窗口会显示：
- 队列请求
- 生成进度
- 错误信息

### 浏览器开发者工具

按 F12 打开，查看：
- **Network 标签**: API 请求
- **Console 标签**: 错误信息

## ⚠️ 可能遇到的问题

### 问题 1: CORS 错误

**症状**: 浏览器控制台显示 "CORS policy" 错误

**原因**: ComfyUI 没有启用 CORS

**解决方案**:
```bash
# 重启 ComfyUI 并添加 CORS 参数
python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header "*"
```

### 问题 2: 模型未找到

**症状**: 生成失败，日志显示 "model not found"

**原因**: 检查点模型不在正确位置

**解决方案**:
```bash
# 确保模型在以下目录之一：
G:/ComfyUI/models/checkpoints/sd_xl_base_1.0.safetensors
# 或其他 SDXL 模型
```

### 问题 3: 超时

**症状**: 前端显示 "生成超时"

**原因**: 生成时间过长或请求丢失

**解决方案**:
1. 增加 ComfyUI 步数限制
2. 检查 GPU 内存使用
3. 查看后端日志

### 问题 4: 积分不足

**症状**: 错误 "用户积分不足"

**原因**: 用户没有足够的积分

**解决方案**:
```bash
# 在数据库中给用户添加积分
# 或注册新用户（默认100积分）
```

## 🔧 调整和优化

### 修改生成参数

编辑 `petforge-backend/src/services/aiGenerationService.js`:

```javascript
buildPrompt(taskData) {
  // 修改提示词构建逻辑
  const styleModifiers = {
    'pixar': '3D render, Pixar style, vibrant colors, 8k',
    'clay': 'clay animation, soft texture, stop motion',
    // ... 添加或修改风格
  };

  // 修改生成步数（影响速度和质量）
  steps: 20,  // 可调整为 10-50

  // 修改 CFG 值（影响提示词遵循度）
  cfg: 8,      // 可调整为 5-15
}
```

### 修改工作流

1. 在 ComfyUI 中创建工作流
2. 点击 "Save" → "API Format"
3. 保存 JSON 到：
   ```
   petforge-backend/workflows/custom_workflow.json
   ```
4. 更新 `aiGenerationService.js` 使用自定义工作流

## 📝 检查清单

在使用前确认：

- [ ] ComfyUI 运行在 http://localhost:8188
- [ ] 后端运行在 http://localhost:4000
- [ ] 前端运行在 http://localhost:3000
- [ ] 至少一个 SDXL 检查点模型在 `models/checkpoints/`
- [ ] 后端 `.env` 包含正确的 `COMFYUI_URL`
- [ ] CORS 已启用（--enable-cors-header "*"）
- [ ] 用户有足够的积分（默认100）

## 🎬 开始使用！

一切就绪后：

1. **打开浏览器**: http://localhost:3000/upload
2. **上传宠物照片**
3. **选择风格和类型**
4. **点击"开始生成"**
5. **等待 15-30 秒**
6. **查看结果**

## 💡 提示

- **首次生成**会较慢（模型加载到GPU）
- **SDXL Turbo** 模型最快（4-8步）
- **低分辨率** 生成更快，然后放大
- **批量生成** 前测试不同参数

## 🆘 需要帮助？

遇到问题？告诉我：
1. 具体错误信息
2. 浏览器控制台日志
3. 后端日志
4. ComfyUI 控制台输出

我会帮您解决！
