# PetForge - 前后端分离架构

## 项目结构

```
firstpet/
├── petforge-frontend/    # 前端 (Next.js)
│   ├── app/              # 页面组件
│   ├── components/       # UI 组件
│   ├── lib/              # API 客户端
│   └── store/            # 状态管理
│
├── petforge-backend/     # 后端 (Express)
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── middleware/   # 中间件
│   │   ├── config/       # 配置文件
│   │   └── server.js     # 服务器入口
│   └── prisma/           # 数据库 Schema
│
└── README.md
```

## 架构说明

### 前端 (Next.js)
- **框架**: Next.js 14 with App Router
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **功能**: UI 展示、用户交互、调用后端 API

### 后端 (Express)
- **框架**: Express.js
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: Prisma
- **认证**: JWT
- **功能**: 业务逻辑、数据处理、API 接口

## 快速开始

### 1. 安装依赖

```bash
# 前端
cd petforge-frontend
npm install

# 后端
cd ../petforge-backend
npm install
```

### 2. 配置数据库

```bash
cd petforge-backend
npx prisma generate
npx prisma migrate dev --name init
```

### 3. 启动服务

**终端 1 - 启动后端:**
```bash
cd petforge-backend
npm run dev
# 后端运行在 http://localhost:4000
```

**终端 2 - 启动前端:**
```bash
cd petforge-frontend
npm run dev
# 前端运行在 http://localhost:3000
```

### 4. 访问应用

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:4000
- **API 文档**: http://localhost:4000/health

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户

### 上传
- `POST /api/upload` - 上传宠物照片

### 宠物IP
- `GET /api/petips` - 获取宠物IP列表
- `GET /api/petips/:id` - 获取单个宠物IP
- `POST /api/petips/:id/like` - 点赞宠物IP

### 购物车
- `GET /api/cart` - 获取购物车
- `POST /api/cart` - 添加商品到购物车
- `DELETE /api/cart?id=:id` - 删除购物车商品
- `PATCH /api/cart/:id` - 更新商品数量

### 订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取单个订单
- `POST /api/orders` - 创建订单
- `PATCH /api/orders/:id` - 更新订单状态

### 管理后台
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/users` - 获取所有用户
- `GET /api/admin/petips` - 获取所有宠物IP
- `GET /api/admin/orders` - 获取所有订单
- `PATCH /api/admin/orders/:id` - 更新订单状态

## 数据库管理

### Prisma Studio (可视化数据库管理)

```bash
cd petforge-backend
npx prisma studio
# 打开 http://localhost:5555
```

## 环境变量

### 后端 (.env)
```env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:3000"
```

### 前端 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 部署

### 前端部署 (Vercel)

1. 在 Vercel 创建新项目
2. 连接到 `petforge-frontend` 目录
3. 设置环境变量 `NEXT_PUBLIC_API_URL`
4. 部署

### 后端部署 (常见平台)

#### Railway / Render / Fly.io
1. 推送代码到 GitHub
2. 在平台导入项目
3. 设置环境变量
4. 部署

#### 自定义服务器
```bash
# 构建前端
cd petforge-frontend
npm run build

# PM2 启动后端
cd ../petforge-backend
pm2 start src/server.js --name petforge-api
```

## 开发注意事项

1. **先启动后端，再启动前端**
2. **确保端口不冲突** (后端 4000, 前端 3000)
3. **CORS 配置**: 后端已配置允许前端跨域请求
4. **文件上传**: 后端会自动创建 `uploads` 目录

## 商业化准备

### 安全性
- ✅ JWT 认证
- ✅ 密码加密 (bcrypt)
- ✅ CORS 配置
- ⚠️ 需要添加: Rate Limiting、Input Validation

### 性能
- ⚠️ 需要添加: Redis 缓存
- ⚠️ 需要添加: CDN 加速
- ⚠️ 需要添加: 图片压缩

### 监控
- ⚠️ 需要添加: 日志系统
- ⚠️ 需要添加: 错误追踪 (Sentry)
- ⚠️ 需要添加: 性能监控

### 支付集成
- ⚠️ 需要添加: 微信支付
- ⚠️ 需要添加: 支付宝
- ⚠️ 需要添加: Stripe (国际)

## 下一步

1. ✅ 前后端分离完成
2. ⚠️ 更新前端使用新 API (需要修改前端组件)
3. ⚠️ 添加用户注册/登录页面
4. ⚠️ 集成真实支付接口
5. ⚠️ 添加单元测试

## 技术支持

如有问题，请查看：
- Next.js 文档: https://nextjs.org/docs
- Express 文档: https://expressjs.com
- Prisma 文档: https://www.prisma.io/docs
