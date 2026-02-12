# 🚀 ComfyUI 快速启动指南

## 当前状态
- ✅ 后端服务运行中 (端口 4000)
- ✅ 前端服务运行中 (端口 3000)
- ❌ ComfyUI 未运行 (端口 8188)

## 📋 立即开始（3个步骤）

### 步骤 1: 下载 ComfyUI

**选项 A - Windows 便携版（推荐，最简单）**

1. 访问：https://github.com/comfyanonymous/ComfyUI_windows_portable
2. 下载最新版本 `ComfyUI_windows_portable.zip`
3. 解压到：`G:/ComfyUI_windows_portable/`

**选项 B - Git 克隆**

```bash
cd G:/
git clone https://github.com/comfyanonymous/ComfyUI.git ComfyUI
```

### 步骤 2: 下载基础模型（必须）

1. 下载 Stable Diffusion XL 模型：
   - https://huggingface.co/stabilityai/sdxl-turbo
   - 或：https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0

2. 将模型文件放到：
   ```
   G:/ComfyUI_windows_portable/ComfyUI/models/checkpoints/
   ```
   或手动安装：
   ```
   G:/ComfyUI/models/checkpoints/
   ```

### 步骤 3: 启动 ComfyUI

**Windows 便携版：**
```bash
# 打开文件夹
G:/ComfyUI_windows_portable

# 运行启动脚本
run_nvidia_gpu.bat  # 如果有 NVIDIA 显卡
# 或
run_cpu.bat  # 如果使用 CPU
```

**手动安装版本：**
```bash
cd G:/ComfyUI
python main.py --listen 0.0.0.0 --port 8188 --enable-cors-header "*"
```

## ✅ 验证安装

启动后，访问以下地址确认运行：

```
http://localhost:8188
```

您应该看到 ComfyUI 的黑色界面。

## 🧪 测试连接

从项目根目录运行：

```bash
node test-comfyui.js
```

预期输出：
```
✅ ComfyUI 正在运行
✅ 系统状态: {...}
✅ 队列状态: {...}
🎉 所有测试通过！ComfyUI 已就绪
```

## 🎨 使用 PetForge 生成

1. 访问：http://localhost:3000/upload
2. 上传宠物照片
3. 选择风格
4. 点击"开始生成"
5. 等待 15-30 秒

## 📚 模型推荐

### 用于图像生成：
- **SDXL Turbo** (快速，质量好)
  - 下载：https://huggingface.co/stabilityai/sdxl-turbo

- **DreamShaper 8** (艺术风格)
  - 下载：https://civitai.com/models/11290/dreamshaper

- **Realistic Vision** (写实风格)
  - 下载：https://civitai.com/models/42830/realistic-vision-v60

### 用于放大：
- **RealESRGAN x4+**
  - 下载：https://github.com/xinntao/Real-ESRGAN/releases

## ⚙️ 配置优化

### GPU 内存优化（如果显存不足）
```bash
python main.py --listen 0.0.0.0 --port 8188 --gpu-only --use-pytorch-cross-attention
```

### CPU 模式（无 GPU）
```bash
python main.py --listen 0.0.0.0 --port 8188 --cpu
```

### 自定义端口（如果 8188 被占用）
```bash
python main.py --listen 0.0.0.0 --port 8189

# 然后更新 petforge-backend/.env
COMFYUI_URL="http://localhost:8189"
```

## 🐛 故障排除

### 问题 1: 无法访问 localhost:8188
**解决方案：**
1. 检查 ComfyUI 是否在运行
2. 检查防火墙设置
3. 尝试：`netstat -ano | findstr ":8188"`

### 问题 2: CUDA out of memory
**解决方案：**
1. 使用更小的模型（SDXL Turbo 而非 SDXL）
2. 减少批次大小
3. 关闭其他占用 GPU 的程序

### 问题 3: 生成失败
**解决方案：**
1. 检查 ComfyUI 控制台日志
2. 确保模型文件正确放置
3. 测试简单工作流

## 📞 需要帮助？

- **ComfyUI 文档**: https://docs.comfy.org/
- **ComfyUI GitHub**: https://github.com/comfyanonymous/ComfyUI
- **工作流示例**: https://comfylive.com/
- **社区论坛**: https://reddit.com/r/comfyui

## 🎬 视频教程

ComfyUI 基础教程：
https://www.youtube.com/results?search_query=ComfyUI+tutorial

## 📝 检查清单

启动前确认：
- [ ] ComfyUI 已安装
- [ ] 至少一个检查点模型已下载
- [ ] 端口 8188 未被占用
- [ ] Python 3.10+ 已安装
- [ ] 足够的磁盘空间（20GB+）

配置确认：
- [ ] `.env` 文件包含正确的 COMFYUI_URL
- [ ] CORS 已启用（--enable-cors-header "*"）
- [ ] 后端服务运行在端口 4000
- [ ] 前端服务运行在端口 3000

准备就绪！开始创作您的宠物 IP 吧！🎨
