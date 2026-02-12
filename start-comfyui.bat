@echo off
REM ============================================
REM PetForge - ComfyUI 启动脚本
REM ============================================

echo.
echo ============================================
echo   PetForge - ComfyUI 启动工具
echo ============================================
echo.

REM 检查 ComfyUI 是否存在
if exist "G:\ai_picture\comfyui\main.py" (
    echo [✓] 找到 ComfyUI 安装
    cd /d G:\ai_picture\comfyui

    echo.
    echo 正在启动 ComfyUI...
    echo 服务地址: http://localhost:8188
    echo.

    REM 检测 GPU 类型并启动
    if exist "run_nvidia_gpu.bat" (
        echo [GPU] 使用 NVIDIA GPU 加速
        call run_nvidia_gpu.bat
    ) else if exist "venv\Scripts\python.exe" (
        echo [GPU] 使用 Python 虚拟环境
        venv\Scripts\python.exe main.py --listen 0.0.0.0 --port 8188
    ) else (
        echo [CPU] 使用系统 Python
        python main.py --listen 0.0.0.0 --port 8188
    )

) else (
    echo [✗] 未找到 ComfyUI 安装！
    echo.
    echo 请先安装 ComfyUI：
    echo.
    echo 方案 1（推荐）- 下载便携版：
    echo   https://github.com/comfyanonymous/ComfyUI_windows_portable
    echo.
    echo 方案 2 - 手动安装：
    echo   git clone https://github.com/comfyanonymous/ComfyUI.git G:\ai_picture\comfyui
    echo.
    pause
)
