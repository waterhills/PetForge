# ComfyUI 配置指南 - PetForge 集成

## 🎯 当前配置

您的 PetForge 后端已配置为连接到：
- **URL**: http://localhost:8188
- **Client ID**: petforge-client
- **配置文件**: `petforge-backend/.env`

## 📋 安装步骤

### 1. 安装 ComfyUI

#### Windows 便携版（最简单）
```bash
# 下载并解压
https://github.com/comfyanonymous/ComfyUI_windows_portable

# 运行
run_nvidia_gpu.bat  # NVIDIA GPU
# 或
run_cpu.bat  # CPU
```

#### 手动安装（更灵活）
```bash
# 1. 安装 Python 3.10+
# 2. 克隆仓库
git clone https://github.com/comfyanonymous/ComfyUI.git G:/ComfyUI

# 3. 安装依赖
cd G:/ComfyUI
pip install -r requirements.txt

# 4. 启动
python main.py --listen 0.0.0.0 --port 8188
```

### 2. 安装必需的自定义节点

ComfyUI 需要一些自定义节点来支持图像生成工作流：

```bash
# 进入 ComfyUI 目录
cd G:/ComfyUI

# 安装 ComfyUI Manager（插件管理器）
cd custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager.git
cd ..

# 重启 ComfyUI

# 在 ComfyUI 界面中：
# 1. 点击 Manager 按钮
# 2. 安装以下节点：
#    - IPAdapter Plus
#    - ControlNet
#    - Ultimate SD Upscale
```

### 3. 下载基础模型

将模型文件放到对应目录：

```bash
# Stable Diffusion 检查点模型
G:/ComfyUI/models/checkpoints/
# 推荐模型：
# - sd_xl_base_1.0.safetensors
# - dreamshaper_8.safetensors

# LoRA 模型（可选）
G:/ComfyUI/models/loras/

# VAE 模型
G:/ComfyUI/models/vae/
# 推荐sdxl_vae.safetensors

# Upscale 模型
G:/ComfyUI/models/upscale_models/
# 推荐RealESRGAN_x4plus.pth
```

### 4. 配置 CORS（重要！）

编辑 `G:/ComfyUI/web/extensions/__init__.py` 或创建服务器配置：

```python
# 在 ComfyUI 启动时添加参数
python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header "*"
```

或在 `G:/ComfyUI/web/__init__.py` 中添加：

```python
# 添加 CORS 支持
from flask_cors import CORS
# ... 在 app 创建后
CORS(app, resources={r"/*": {"origins": "*"}})
```

## 🧪 测试连接

### 1. 启动 ComfyUI

```bash
# 使用提供的脚本
G:/myproject/firstpet/start-comfyui.bat

# 或手动
cd G:/ComfyUI
python main.py --listen 0.0.0.0 --port 8188
```

### 2. 验证服务

访问：http://localhost:8188

您应该看到 ComfyUI 的黑色界面。

### 3. 测试 API

```bash
# 测试队列端点
curl http://localhost:8188/queue

# 测试历史端点
curl http://localhost:8188/history

# 测试系统状态
curl http://localhost:8188/system_stats
```

### 4. 从 PetForge 测试

1. 确保 ComfyUI 正在运行（端口 8188）
2. 确保后端服务正在运行（端口 4000）
3. 访问 http://localhost:3000/upload
4. 上传图片并点击"开始生成"

## 🎨 创建 PetForge 工作流（可选）

如果您想自定义工作流：

1. 在 ComfyUI 界面创建工作流
2. 点击 "Save" → "API Format"
3. 将 JSON 保存到 `petforge-backend/workflows/pet_generation.json`
4. 更新 `aiGenerationService.js` 以使用自定义工作流

## ⚠️ 常见问题

### 端口冲突
如果 8188 端口被占用：
```bash
# 使用其他端口
python main.py --listen 0.0.0.0 --port 8189

# 然后更新 .env
COMFYUI_URL="http://localhost:8189"
```

### GPU 内存不足
在启动参数中添加：
```bash
python main.py --listen 0.0.0.0 --port 8188 --gpu-only --use-pytorch-cross-attention
```

### CORS 错误
确保 ComfyUI 启动时启用了 CORS：
```bash
python main.py --enable-cors-header "*" --listen 0.0.0.0
```

## 📊 推荐硬件

- **GPU**: NVIDIA RTX 3060 (12GB+) 或更好
- **RAM**: 16GB+
- **存储**: 至少 20GB 可用空间（用于模型）

## 🚀 快速开始

1. 下载 ComfyUI Windows 便携版
2. 解压到 `G:/ComfyUI`
3. 下载一个 SDXL 检查点到 `models/checkpoints/`
4. 运行 `start-comfyui.bat`
5. 访问 http://localhost:8188 确认运行
6. 在 PetForge 上传页面测试生成

## 📚 参考资源

- ComfyUI GitHub: https://github.com/comfyanonymous/ComfyUI
- ComfyUI 官方文档: https://docs.comfy.org/
- 工作流分享: https://comfylive.com/
- 模型下载: https://civitai.com/
