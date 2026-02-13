#!/bin/bash
# PetForge 服务启动脚本

echo "=== 启动 PetForge 服务 ==="

# 启动后端
echo "启动后端服务..."
cd "G:/myproject/firstpet/petforge-backend"
tmux new-session -d -s backend "npm run dev"

# 启动前端
echo "启动前端服务..."
cd "G:/myproject/firstpet/petforge-app"
tmux new-session -d -s frontend "npm run dev"

echo ""
echo "✅ 服务已启动！"
echo ""
echo "访问地址："
echo "  前端: http://localhost:3001"
echo "  后端: http://localhost:4000"
echo "  WebSocket: ws://localhost:4000"
echo ""
echo "查看日志："
echo "  后端: tmux attach -t backend"
echo "  前端: tmux attach -t frontend"
echo ""
echo "停止服务："
echo "  后端: tmux kill-session -t backend"
echo "  前端: tmux kill-session -t frontend"
