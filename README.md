# PetForge - AI 宠物 IP 生成平台

> 基于 Next.js 和 Express.js 的全栈应用，支持 AI 生成 3D 宠物 IP、社区互动、定制周边商品

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3C20.1.0-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black.svg)](https://nextjs.org/)

## ✨ 功能特性

### 🎨 核心 AI 生成
- **文本生成 3D 宠物**：输入描述，AI 自动生成独一无二的三维宠物形象
- **多种风格支持**：赛博朋克、机甲兽、全息幻影等多种艺术风格
- **图片优化**：AI 自动优化提示词，提升生成质量
- **实时进度**：WebSocket 实时显示生成进度

### 💬 社区互动
- **发布动态**：分享你的宠物 IP 到社区
- **评论互动**：支持4级嵌套评论的深度讨论
- **点赞收藏**：点赞和收藏喜欢的作品
- **通知系统**：实时接收互动通知
- **隐私控制**：公开/私密帖子设置

### 🛍 商品定制
- **周边商城**：将宠物 IP 定制到 T 恤、马克杯、手机壳等实物
- **购物车**：完整的购物车管理
- **订单系统**：完整的订单流程和状态追踪
- **支付集成**：微信支付、支付宝支付接口

### 🎁 用户系统
- **JWT 认证**：安全的用户认证系统
- **个人资料**：用户头像、昵称、简介管理
- **地址管理**：多个收货地址管理
- **积分系统**：积分累积和消费

## 🛠 技术栈

### 前端 (petforge-app)
- **框架**：Next.js 15.0 (App Router)
- **语言**：TypeScript 5.7
- **样式**：Tailwind CSS 3.4
- **状态管理**：React Hooks
- **UI 组件**：自定义组件库

### 后端 (petforge-backend)
- **框架**：Express.js 4.21
- **语言**：Node.js 22.22 (ES Modules)
- **数据库**：PostgreSQL 16
- **ORM**：Prisma 5.22
- **认证**：JWT (jsonwebtoken)
- **文件上传**：Multer
- **WebSocket**：Socket.IO
- **任务队列**：Bull + Redis

### AI 服务
- **ComfyUI**：AI 图像生成工作流引擎
- **Stable Diffusion**：图像生成模型

## 📦 安装步骤

### 前置要求
- Node.js >= 20.1.0
- PostgreSQL >= 14
- Redis >= 6.0 (用于任务队列)

### 1. 克隆仓库

```bash
git clone https://github.com/waterhills/PetForge.git
cd PetForge
```

### 2. 安装依赖

```bash
# 安装前端依赖
cd petforge-app
npm install

# 安装后端依赖
cd ../petforge-backend
npm install
```

### 3. 配置环境变量

#### 后端配置
```bash
cd petforge-backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
NODE_ENV=development
PORT=4000

# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/petforge?schema=public"

# JWT 密钥（请更改为随机字符串）
JWT_SECRET=your-secret-key-change-this

# Redis
REDIS_URL=redis://localhost:6379

# 前端 URL（用于 CORS）
FRONTEND_URL=http://localhost:3000

# AI 服务
COMFYUI_URL=http://localhost:8188

# 支付配置（可选）
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
```

#### 前端配置
```bash
cd petforge-app
cp .env.local.example .env.local
```

编辑 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. 初始化数据库

```bash
cd petforge-backend

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# （可选）填充示例数据
npx prisma db seed
```

### 5. 启动 Redis

```bash
# Windows
redis-server

# Linux/Mac
redis-server
```

### 6. 启动后端服务

```bash
cd petforge-backend
npm start
```

后端将运行在 http://localhost:4000

### 7. 启动前端服务

```bash
cd petforge-app
npm run dev
```

前端将运行在 http://localhost:3000

## 🚀 运行指南

### 开发模式

**终端 1 - 后端**：
```bash
cd petforge-backend
npm start
```

**终端 2 - 前端**：
```bash
cd petforge-app
npm run dev
```

访问 http://localhost:3000 查看应用

### 生产模式

#### 构建前端
```bash
cd petforge-app
npm run build
npm start
```

#### 使用 PM2 运行后端（推荐）
```bash
cd petforge-backend
npm install -g pm2
pm2 start ecosystem.config.cjs
```

## 📁 项目结构

```
PetForge/
├── petforge-app/                 # Next.js 前端
│   ├── app/                      # App Router 页面
│   │   ├── community/            # 社区模块
│   │   │   ├── page.tsx         # 社区主页
│   │   │   ├── create/          # 发布动态
│   │   │   └── post/[id]/       # 动态详情
│   │   ├── upload/               # 上传生成
│   │   └── layout.tsx            # 根布局
│   ├── components/               # React 组件
│   │   ├── community/            # 社区组件
│   │   └── layout/               # 布局组件
│   ├── lib/                     # 工具库
│   │   ├── api.ts                 # API 客户端
│   │   └── communityApi.ts       # 社区 API
│   └── types/                   # TypeScript 类型
│
├── petforge-backend/            # Express.js 后端
│   ├── prisma/                  # Prisma ORM
│   │   └── schema.prisma          # 数据库 Schema
│   ├── src/                     # 源代码
│   │   ├── config/                # 配置文件
│   │   ├── middleware/            # 中间件
│   │   ├── routes/                # API 路由
│   │   │   ├── auth.js          # 认证
│   │   │   ├── community.js     # 社区
│   │   │   └── ...
│   │   ├── websocket/             # WebSocket
│   │   └── server.js               # 服务器入口
│   └── uploads/                  # 用户上传文件
│
└── README.md                    # 项目说明
```

## 🔧 API 文档

### 认证 API

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 社区 API

#### 获取动态列表
```
GET /api/community/posts?page=1&limit=20
Authorization: Bearer {token}
```

#### 发布动态
```
POST /api/community/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "petIpId": "cuid...",
  "content": "分享我的宠物 IP！",
  "isPublic": true
}
```

#### 点赞动态
```
POST /api/community/posts/{id}/like
Authorization: Bearer {token}
```

#### 评论动态
```
POST /api/community/posts/{postId}/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "太棒了！",
  "parentId": "cuid..."  // 可选，用于回复
}
```

完整 API 文档请查看：[API.md](./docs/API.md)

## 🧪 测试

### 运行测试

```bash
# 后端测试
cd petforge-backend
npm test

# 前端测试
cd petforge-app
npm test

# E2E 测试
cd petforge-app
npm run test:e2e
```

## 🐛 调试

### 后端
```bash
cd petforge-backend
npm run debug
```

### 前端
```bash
cd petforge-app
npm run debug
```

## 📝 贡献指南

我们欢迎所有形式的贡献！

### 贡献流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范
- 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
- 编写测试覆盖率 >= 80%
- 遵循 ESLint 和 Prettier 代码规范

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 👥 作者

**PetForge Team**

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Express.js](https://expressjs.com/) - Node.js Web 框架
- [Prisma](https://www.prisma.io/) - Next-Gen ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - AI 图像生成界面

---

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**
