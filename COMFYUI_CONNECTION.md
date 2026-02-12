# ComfyUI 连接须知

> **PetForge AI 生成服务集成指南** - 本文档说明如何正确配置和连接 ComfyUI 服务

---

## 📋 目录

- [1. ComfyUI 简介](#1-comfyui-简介)
- [2. 系统要求](#2-系统要求)
- [3. 快速启动](#3-快速启动)
- [4. 详细配置](#4-详细配置)
- [5. 工作流系统](#5-工作流系统)
- [6. API 接口](#6-api-接口)
- [7. 故障排查](#7-故障排查)
- [8. 安全注意事项](#8-安全注意事项)

---

## 1. ComfyUI 简介

### 1.1 什么是 ComfyUI？

**ComfyUI** 是一个基于 Stable Diffusion 的图形化 AI 图像生成工具，提供：

- ✅ **节点式工作流** - 可视化拖拽连接
- ✅ **实时预览** - 即时看到生成效果
- ✅ **自定义工作流** - JSON 格式灵活定义
- ✅ **免费开源** - 无需付费 API
- ✅ **本地部署** - 数据完全可控

### 1.2 在 PetForge 中的作用

```
PetForge 前端
    ↓
用户上传照片 + 选择风格
    ↓
调用后端 API
    ↓
后端转发到 ComfyUI
    ↓
ComfyUI 处理生成任务
    ↓
返回生成的图像
    ↓
PetIP 记录 + 展示
```

**关键优势：**
- 🎨 **4 种独特风格** - Pixar、黏土、赛博、线条
- 🖼️ **2D/3D 双模式** - 图片与 3D 模型
- ⚡ **本地处理** - 无需上传到外部服务器
- 🔄 **实时状态** - WebSocket 支持进度追踪

---

## 2. 系统要求

### 2.1 硬件要求

#### **最低配置（开发环境）**

| 组件 | 要求 | 说明 |
|------|------|------|
| **CPU** | 4 核心以上 | 推荐 8 核心以上 |
| **内存** | 16 GB RAM | 推荐 32 GB |
| **显卡** | NVIDIA GTX 1060 (6GB）| 推荐 RTX 3060 以上 |
| **硬盘** | 20 GB 可用空间 | 用于模型文件存储 |
| **系统** | Windows 10/11, macOS, Linux | Ubuntu 22.04 推荐 |

#### **推荐配置（生产环境）**

| 组件 | 要求 | 说明 |
|------|------|------|
| **CPU** | 16 核心以上 | AMD Ryzen 9 或 Intel i9 |
| **内存** | 64 GB RAM | 处理大批量任务 |
| **显卡** | NVIDIA RTX 4090 (24GB）| 最佳性能 |
| **硬盘** | 100 GB SSD | NVMe 推荐 |
| **网络** | 稳定宽带 | 保障 API 响应速度 |

### 2.2 软件环境

#### **必需软件：**

```bash
# Python 环境
Python 3.10 - 3.11

# Git 版本控制
Git 2.0+

# 包管理器
pip 或 conda
```

#### **Python 依赖：**

创建 `requirements.txt`：

```txt
# ComfyUI 核心依赖
torch>=2.0.0
torchvision>=0.15.0
torchaudio>=2.0.0

# 图像处理
Pillow>=9.0.0
opencv-python>=4.5.0

# Web 框架
flask>=2.0.0
flask-cors>=3.0.0
websockets>=11.0

# AI 模型
transformers>=4.30.0
diffusers>=0.20.0
accelerate>=0.20.0

# 工具
numpy>=1.24.0
pandas>=2.0.0
```

---

## 3. 快速启动

### 3.1 Windows 启动（推荐）

#### **方式一：使用批处理文件**

项目已包含 `start-comfyui.bat`，双击即可启动：

```batch
@echo off
echo ========================================
echo   PetForge - ComfyUI 服务
echo ========================================
echo.
echo 正在启动 ComfyUI 服务...
echo.

cd petforge-backend
python main.py

pause
```

**使用步骤：**
1. 双击 `start-comfyui.bat`
2. 等待服务启动（约 10-30 秒）
3. 看到 `Running on http://0.0.0.0:8188` 表示成功
4. 访问 http://localhost:8188 查看界面

#### **方式二：手动启动**

```bash
# 1. 进入后端目录
cd petforge-backend

# 2. 启动 ComfyUI 服务
python main.py

# 3. 观察启动日志
# 应该看到：
# ComfyUI running on http://0.0.0.0:8188
```

### 3.2 macOS/Linux 启动

```bash
# 1. 进入后端目录
cd petforge-backend

# 2. 启动服务
python3 main.py  # 或 python main.py

# 3. 后台运行（可选）
nohup python3 main.py > comfyui.log 2>&1 &

# 4. 查看日志
tail -f comfyui.log
```

### 3.3 验证服务启动

**检查服务状态：**

```bash
# 方法 1: 浏览器访问
open http://localhost:8188

# 方法 2: curl 测试
curl http://localhost:8188/api/ping

# 方法 3: 检查端口
netstat -ano | findstr "8188"  # Windows
lsof -i :8188                    # macOS/Linux
```

**成功启动后应该看到：**
```
==================================================
   PetForge - ComfyUI Service
==================================================

[INFO] Starting ComfyUI integration...
[INFO] Loading workflows...
[INFO] Loaded 10 workflow files
[INFO] Starting Flask server...
[INFO] * Running on http://0.0.0.0:8188
[INFO] Press Ctrl+C to stop
```

---

## 4. 详细配置

### 4.1 服务配置文件

**位置：** `petforge-backend/src/services/comfyUIService.js`

```javascript
// ComfyUI 服务配置
const COMFYUI_CONFIG = {
  // 服务地址
  baseURL: process.env.COMFYUI_URL || 'http://localhost:8188',

  // API 端点
  endpoints: {
    queue: '/prompt',           // 提交生成任务
    history: '/history',          // 查询任务历史
    view: '/view',               // 查看任务详情
    queueWebSocket: '/ws'        // WebSocket 连接
  },

  // 超时设置
  timeout: 300000,  // 5 分钟（毫秒）

  // 轮询间隔
  pollInterval: 2000,  // 2 秒

  // 最大重试次数
  maxRetries: 3
};
```

### 4.2 环境变量

创建 `petforge-backend/.env` 文件：

```env
# ComfyUI 服务配置
COMFYUI_URL=http://localhost:8188
COMFYUI_TIMEOUT=300000
COMFYUI_MAX_RETRIES=3

# 文件上传配置
UPLOAD_MAX_SIZE=5242880  # 5MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp

# JWT 密钥（必须设置）
JWT_SECRET=your-super-secret-jwt-key-here

# 数据库（开发环境使用 SQLite）
DATABASE_URL="file:./dev.db"
```

### 4.3 工作流文件配置

**工作流目录：** `petforge-backend/workflows/`

| 文件名 | 风格 | 类型 | 说明 |
|--------|------|------|------|
| `pixar_workflow.json` | Pixar 3D | 3D | 3D 动画风格，生成 GLB 模型 |
| `pixar_img2img.json` | Pixar 2D | 2D | 2D 插画风格 |
| `clay_workflow.json` | 黏土世界 | 3D | 黏土动画风格，生成 GLB 模型 |
| `clay_img2img.json` | 黏土 2D | 2D | 黏土风格 2D 插画 |
| `cyber_workflow.json` | 赛博朋克 | 3D | 霓虹灯光，生成 GLB 模型 |
| `cyber_img2img.json` | 赛博 2D | 2D | 赛博朋克风格 2D 插画 |
| `line_workflow.json` | 极简线条 | 3D | 线条艺术，生成 GLB 模型 |
| `line_img2img.json` | 线条 2D | 2D | 适合打印的黑白线稿 |

**工作流自定义步骤：**

1. 复制现有工作流文件作为模板
2. 在 ComfyUI 中打开编辑器
3. 调整节点参数（风格、强度、尺寸等）
4. 导出为 JSON 文件
5. 放入 `workflows/` 目录
6. 在后端服务中引用新文件名

---

## 5. 工作流系统

### 5.1 工作流调用流程

```
后端接收生成请求
    ↓
选择对应工作流文件
    ↓
读取并解析 JSON
    ↓
注入用户图片（Base64）
    ↓
修改 Prompt 参数
    ↓
POST 到 ComfyUI /prompt 接口
    ↓
获取 taskId
    ↓
返回 taskId 给前端
    ↓
前端轮询 /history/{taskId}
    ↓
检测到任务完成
    ↓
获取生成结果（图片 URL）
    ↓
创建 PetIP 记录
```

### 5.2 API 接口详解

#### **POST /prompt** - 提交生成任务

**请求格式：**
```json
{
  "prompt": "string text, required",
  "workflow": "object, required",
  "images": [
    {
      "name": "input_image",
      "data": "base64_image_string",
      "type": "input"
    }
  ]
}
```

**响应：**
```json
{
  "prompt_id": "unique_task_id",
  "number": 1,
  "status": "queue_pending"
}
```

#### **GET /history/{prompt_id}** - 查询任务状态

**响应示例：**
```json
{
  "prompt": [
    {
      "status": "success",  // success | processing | failed
      "outputs": [
        {
          "type": "image",
          "source": "generated_image_url",
          "filename": "pet_ip_xxxxx.png"
        }
      ]
    }
  ]
}
```

### 5.3 风格映射配置

**后端服务映射：**

```javascript
// services/comfyUIService.js

const STYLE_WORKFLOWS = {
  pixar: {
    '3d': 'pixar_workflow.json',
    '2d': 'pixar_img2img.json'
  },
  clay: {
    '3d': 'clay_workflow.json',
    '2d': 'clay_img2img.json'
  },
  cyber: {
    '3d': 'cyber_workflow.json',
    '2d': 'cyber_img2img.json'
  },
  line: {
    '3d': 'line_workflow.json',
    '2d': 'line_img2img.json'
  }
};

function getWorkflowFile(style, type) {
  return STYLE_WORKFLOWS[style][type];
}
```

---

## 6. API 接口

### 6.1 PetForge 后端接口

#### **POST /api/generation/queue-comfyui**

**请求：**
```json
{
  "style": "pixar",      // pixar | clay | cyber | line
  "type": "3d",         // 2d | 3d
  "petName": "旺财",
  "customPrompt": "cute cat"  // 可选
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "taskId": "cmfy-1234567890",
    "status": "pending",
    "estimatedTime": 60  // 秒
  }
}
```

#### **GET /api/generation/status-comfyui/:taskId**

**轮询间隔：** 每 2 秒一次

**响应示例：**
```json
{
  "success": true,
  "data": {
    "status": "processing",  // pending | processing | completed | failed
    "progress": 45,  // 0-100
    "resultUrl": null  // 完成后有值
  }
}
```

### 6.2 图片处理流程

```javascript
// 前端：上传照片转换为 Base64
async function imageToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // 移除 data:image/xxx;base64, 前缀
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

// 后端：构建 ComfyUI 请求
function buildComfyUIRequest(base64Image, style, type) {
  return {
    prompt: buildPrompt(style, type),      // 见下节
    workflow: loadWorkflow(style, type),     // 从 workflows/ 加载
    images: [
      {
        name: 'input_image',
        data: base64Image,
        type: 'input'
      }
    ]
  };
}
```

### 6.3 Prompt 构建规则

```javascript
function buildPrompt(style, type) {
  const basePrompts = {
    pixar: '3D Pixar animation style cute pet',
    clay: 'stop-motion clay animation style cute pet',
    cyber: 'cyberpunk neon-lit cute pet',
    line: 'minimalist line art style cute pet for printing'
  };

  const typeSuffix = type === '3d'
    ? '3D character model, GLB format'
    : '2D illustration';

  return `${basePrompts[style]}, ${typeSuffix}, high quality, detailed`;
}
```

---

## 7. 故障排查

### 7.1 常见错误

#### **错误 1：连接被拒绝**

```
Error: connect ECONNREFUSED http://localhost:8188
```

**解决方案：**
1. 确认 ComfyUI 服务已启动
2. 检查端口 8188 是否被占用
3. Windows 防火墙可能阻止连接
4. 检查 `COMFYUI_URL` 环境变量是否正确

```bash
# 检查服务状态
curl http://localhost:8188

# 检查端口占用
netstat -ano | findstr "8188"
```

#### **错误 2：任务超时**

```
Error: Generation timeout after 300000ms
```

**解决方案：**
1. 检查 ComfyUI 是否正在处理其他任务
2. 增加超时时间（`COMFYUI_TIMEOUT`）
3. 检查显卡内存是否充足
4. 减小输入图片尺寸

```bash
# 检查 GPU 内存
nvidia-smi  # NVIDIA
sudo amdtop  # AMD
```

#### **错误 3：工作流加载失败**

```
Error: Workflow file not found: pixar_workflow.json
```

**解决方案：**
1. 确认文件存在于 `workflows/` 目录
2. 检查文件名拼写
3. 检查文件权限（可读）
4. 验证 JSON 格式是否正确

```bash
# 验证工作流文件
cd petforge-backend/workflows
ls -la *.json
cat pixar_workflow.json | python -m json.tool
```

#### **错误 4：Base64 图片过大**

```
Error: Request payload too large
```

**解决方案：**
```javascript
// 前端：压缩图片后再上传
async function compressImage(file) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  return await imageCompression(file, options);
}

// 或调整图片质量
function reduceQuality(base64) {
  // 移除 Base64 头
  const base64Data = base64.split(',')[1];

  // 解码为二进制
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  // 这里可以进行图片压缩处理
  // ...

  return compressedBase64;
}
```

### 7.2 性能优化

#### **优化图片处理速度**

```javascript
// 使用 Web Worker 处理大图片
const worker = new Worker('image-worker.js');

worker.postMessage({
  image: file,
  quality: 0.8
});

worker.onmessage = (e) => {
  const compressedImage = e.data;
  // 发送到后端
  api.queueGeneration({ image: compressedImage });
};
```

#### **优化轮询频率**

```javascript
// 前端：动态调整轮询间隔
let pollCount = 0;
const pollTask = async (taskId) => {
  const interval = Math.min(2000 * Math.pow(1.5, pollCount), 10000);

  const result = await api.checkGenerationStatus(taskId);

  if (result.data.status === 'processing') {
    pollCount++;
    setTimeout(() => pollTask(taskId), interval);
  } else {
    // 任务完成或失败
    handleComplete(result);
  }
};
```

---

## 8. 安全注意事项

### 8.1 文件上传安全

#### **前端验证**

```typescript
// 验证文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateImage(file: File): boolean {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('不支持的图片格式');
  }

  // 验证文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('图片大小不能超过 5MB');
  }

  // 验证图片尺寸（可选）
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width < 300 || img.height < 300) {
        reject(new Error('图片尺寸至少 300x300'));
      }
      resolve(true);
    };
    img.src = URL.createObjectURL(file);
  });
}
```

#### **后端验证**

```javascript
// Multer 配置（已在代码中实现）
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许图片文件'));
    }
  }
});
```

### 8.2 API 安全

#### **ComfyUI 访问控制**

```javascript
// 生产环境应该限制访问
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://petforge.com'  // 生产域名
];

// 在 ComfyUI Flask 中配置 CORS
from flask_cors import CORS
app = Flask(__name__)
cors = CORS(
  origins=ALLOWED_ORIGINS,
  methods=['POST', 'GET'],
  max_age=3600
)
```

#### **速率限制**

```javascript
// 防止 API 滥用
const rateLimiter = {
  // 用户限制
  user: new Map(),

  // IP 限制
  ip: new Map(),

  check(userId, ip) {
    const now = Date.now();
    const window = 60000;  // 1 分钟

    // 检查用户限制
    if (this.hasExceeded(userId, now, window, 5)) {
      throw new Error('请求过于频繁，请稍后再试');
    }

    // 检查 IP 限制
    if (this.hasExceeded(ip, now, window * 2, 10)) {
      throw new Error('请求过于频繁');
    }
  },

  hasExceeded(key, now, window, maxRequests) {
    const requests = this.user.get(key) || [];
    const validRequests = requests.filter(t => now - t < window);

    if (validRequests.length >= maxRequests) {
      return true;
    }

    validRequests.push(now);
    this.user.set(key, validRequests);
    return false;
  }
};
```

### 8.3 数据安全

#### **敏感信息保护**

```javascript
// 不要在日志中记录
const sanitizeLog = (data) => {
  const sensitive = ['password', 'token', 'secret', 'key'];

  return JSON.stringify(data, (key, value) => {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      return '[REDACTED]';
    }
    return value;
  });
};

// 正确使用
console.log(sanitizeLog({
  username: 'user123',
  password: '[REDACTED]',  // 会被替换
  email: 'user@example.com'
}));
```

#### **存储安全**

```bash
# 设置正确的文件权限
chmod 600 .env
chmod 700 workflows/

# 不要提交敏感文件到 Git
echo ".env" >> .gitignore
echo "workflows/*.secret.json" >> .gitignore
```

---

## 9. 最佳实践

### 9.1 开发建议

1. **始终在开发环境测试** - 使用 `npm run dev`
2. **查看 ComfyUI 日志** - 了解生成进度
3. **逐步调整参数** - 不要一次修改太多
4. **保存工作流版本** - 便于回滚
5. **监控资源使用** - GPU 和内存占用
6. **处理失败情况** - 提供重试选项

### 9.2 生产部署

1. **使用独立服务器** - ComfyUI 资源密集
2. **启用 HTTPS** - 保护数据传输
3. **配置负载均衡** - 多个 ComfyUI 实例
4. **设置监控告警** - 服务异常及时通知
5. **定期备份工作流** - 防止配置丢失

### 9.3 维护建议

**每日检查：**
- [ ] ComfyUI 服务运行状态
- [ ] 磁盘空间使用率
- [ ] GPU 内存使用率
- [ ] 错误日志
- [ ] API 响应时间

**每周检查：**
- [ ] 工作流性能（生成时间统计）
- [ ] 失败率分析
- [ ] 资源成本评估
- [ ] 安全漏洞扫描

---

## 10. 快速参考

### 10.1 常用命令

```bash
# 启动 ComfyUI
cd petforge-backend && python main.py

# 查看日志
tail -f comfyui.log

# 测试 API
curl -X POST http://localhost:8188/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "workflow": {}}'

# 检查端口
netstat -ano | findstr "8188"

# 杀死进程
taskkill /FIM python.exe
```

### 10.2 配置文件位置

| 文件 | 位置 | 用途 |
|------|------|------|
| `.env` | petforge-backend/ | 环境变量 |
| `workflows/*.json` | petforge-backend/workflows/ | 工作流定义 |
| `comfyUIService.js` | petforge-backend/src/services/ | 集成服务 |
| `start-comfyui.bat` | petforge-backend/ | 快速启动脚本 |

---

## 附录：故障排查清单

### ✅ 启动前检查

- [ ] Python 3.10+ 已安装
- [ ] 依赖已安装（torch, torchvision, flask）
- [ ] 端口 8188 未被占用
- [ ] 环境变量已配置
- [ ] 工作流文件存在
- [ ] 至少 10GB 可用内存
- [ ] GPU 驱动已安装（如有 GPU）

### ✅ 服务运行检查

- [ ] ComfyUI 进程运行中
- [ ] http://localhost:8188 可访问
- [ ] /prompt 接口返回 200
- [ ] /history 接口返回数据
- [ ] 工作流文件加载成功
- [ ] 图片生成测试通过

### ✅ 集成检查

- [ ] 后端能连接 ComfyUI
- [ ] 前端能调用生成接口
- [ ] 状态轮询正常工作
- [ ] 生成的图片能正确显示
- [ ] PetIP 记录创建成功
- [ ] 错误处理和重试机制生效

---

**文档版本:** v1.0
**最后更新:** 2026-02-12
**技术支持:** PetForge 开发团队
