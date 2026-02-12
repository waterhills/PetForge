# PetForge 项目架构文档

> **面向架构师的技术架构说明** - 本文档提供 PetForge 宠物IP生成平台的完整技术架构概览

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈](#2-技术栈)
- [3. 系统架构](#3-系统架构)
- [4. 前端架构](#4-前端架构)
- [5. 后端架构](#5-后端架构)
- [6. 数据库设计](#6-数据库设计)
- [7. AI生成架构](#7-ai生成架构)
- [8. 支付系统](#8-支付系统)
- [9. 安全性设计](#9-安全性设计)
- [10. 扩展性考虑](#10-扩展性考虑)

---

## 1. 项目概述

### 1.1 业务定位

**PetForge** 是一个基于 AI 的宠物 IP（Intellectual Property）生成与定制平台，用户可以：

- 上传宠物照片
- 选择 AI 艺术风格（Pixar 3D、黏土世界、赛博朋克、极简线条）
- 生成 2D/3D 数字资产
- 定制实体商品（摆件、T恤、数字壁纸）
- 社区分享与互动
- 积分/信用点数系统

### 1.2 核心功能模块

| 模块 | 功能 | 技术实现 |
|------|------|----------|
| **用户系统** | 注册、登录、JWT 认证、个人中心 |
| **AI 生成** | ComfyUI 工作流集成、任务队列、状态轮询 |
| **资产管理** | PetIP 创建、展示、多 IP 管理 |
| **电商系统** | 购物车、订单、支付模拟 |
| **社区互动** | 内容展示、点赞、评论 |
| **管理后台** | 统计数据、用户管理、订单管理 |

---

## 2. 技术栈

### 2.1 前端技术栈

```
┌─────────────────────────────────────────────────────────┐
│           Next.js 14 (App Router)              │
│  ┌──────────────────────────────────────┐   │
│  │         TypeScript                  │   │
│  ├──────────────────────────────────┤   │
│  │     React 18                   │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │   Tailwind CSS         │  │   │
│  │  │  ┌────────────────┐   │  │   │
│  │  │  │ Zustand Store  │   │  │   │
│  │  │  └────────────────┘   │  │   │
│  │  │                         │  │   │
│  │  └──────────────────────────┘  │   │
│  └──────────────────────────────────┤   │
│                                     │
└─────────────────────────────────────────┘
```

**核心依赖：**
- `next@14.2.35` - React 框架
- `react@18` - UI 库
- `typescript@5` - 类型系统
- `tailwindcss@3` - 样式系统
- `zustand@4` - 状态管理
- `prisma@5` - ORM 客户端
- `@authmiddleware/jwt` - Token 管理

### 2.2 后端技术栈

```
┌─────────────────────────────────────────────────────────┐
│           Express.js (ES Modules)              │
│  ┌──────────────────────────────────────┐   │
│  │         Node.js Runtime               │   │
│  ├──────────────────────────────────┤   │
│  │     Middleware Stack              │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │  Prisma ORM          │  │   │
│  │  │  ┌────────────────┐   │  │   │
│  │  │  │ SQLite (Dev)  │   │  │   │
│  │  │  └────────────────┘   │  │   │
│  │  │                         │  │   │
│  │  └──────────────────────────┘  │   │
│  └──────────────────────────────────┤   │
│                                     │
└─────────────────────────────────────────┘
```

**核心依赖：**
- `express@4` - Web 框架
- `prisma@5` - 数据库 ORM
- `bcrypt@5` - 密码加密
- `jsonwebtoken@9` - JWT 认证
- `multer@1` - 文件上传
- `zod@3` - Schema 验证
- `cors@2` - 跨域支持

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     用户浏览器                           │
│  ┌──────────────────────────────────────────────┐       │
│  │        Next.js Frontend (Port 3000)       │       │
│  │  ┌────────────────────────────────┐        │       │
│  │  │   API Client (lib/api.ts)  │        │       │
│  │  └───────────┬────────────────┘        │       │
│  │              │ RESTful HTTP               │       │
│  └──────────────┼───────────────────────────┘       │
│                 │                                  │
│        ┌────────┴────────────────┐                │
│        │  Express Backend (4000) │                │
│        │  ┌───────────────────┤                │
│        │  │  Service Layer   │                │
│        │  └───┬──────────────┤                │
│        │      │              │                │
│        │  ┌───┴──────┐   ┌──┴──────┐   │
│        │  │ Database  │   │ ComfyUI  │   │
│        │  │ SQLite   │   │  (8188)  │   │
│        │  └──────────┘   └──────────┘   │
│        └───────────────────────────────────┘        │
└───────────────────────────────────────────────────┘
```

### 3.2 数据流向

```
用户操作
    ↓
前端状态更新 (Zustand)
    ↓
API 请求 (api.ts)
    ↓
HTTP 请求 (fetch)
    ↓
后端接收 (Express Router)
    ↓
中间件验证 (Auth + CORS)
    ↓
业务逻辑 (Service Layer)
    ↓
数据库操作 (Prisma)
    ↓
响应返回 (JSON)
    ↓
前端状态更新
    ↓
UI 渲染更新
```

---

## 4. 前端架构

### 4.1 目录结构

```
petforge-app/
├── app/                      # Next.js App Router 页面
│   ├── page.tsx              # 首页（英雄区 + 功能展示）
│   ├── upload/page.tsx         # AI 生成主界面
│   ├── showcase/page.tsx       # 资产展示（多 IP 管理）
│   ├── community/page.tsx        # 社区广场
│   ├── cart/page.tsx           # 购物车
│   ├── checkout/               # 结算流程
│   │   ├── page.tsx           # 订单确认
│   │   ├── payment/page.tsx     # 支付页面
│   │   ├── success/page.tsx      # 支付成功
│   │   └── failure/page.tsx      # 支付失败
│   ├── account/                # 用户中心
│   │   ├── page.tsx            # 个人中心首页
│   │   ├── profile/page.tsx     # 个人信息
│   │   ├── orders/page.tsx       # 订单列表
│   │   ├── orders/[id]/page.tsx # 订单详情
│   │   ├── points/page.tsx       # 积分历史
│   │   ├── addresses/page.tsx    # 地址管理
│   │   └── layout.tsx          # 账户区布局
│   ├── admin/                  # 管理后台
│   │   ├── page.tsx            # 后台首页（统计）
│   │   ├── users/page.tsx        # 用户管理
│   │   ├── orders/page.tsx       # 订单管理
│   │   └── petips/page.tsx      # PetIP 管理
│   ├── login/page.tsx          # 登录页
│   ├── register/page.tsx        # 注册页
│   ├── api/                   # Next.js API 路由
│   │   ├── auth/route.ts       # 本地认证代理
│   │   ├── admin/             # 后台 API
│   │   ├── cart/route.ts       # 购物车 API
│   │   ├── orders/route.ts      # 订单 API
│   │   └── upload/route.ts     # 文件上传代理
│   ├── layout.tsx              # 根布局
│   └── globals.css             # 全局样式
├── components/               # 可复用组件
│   ├── layout/
│   │   └── Navigation.tsx     # 主导航栏
│   └── ui/
│       └── icons.tsx            # 图标库（自定义实现）
├── store/                   # Zustand 状态管理
│   ├── authStore.ts           # 认证状态
│   └── cartStore.ts           # 购物车状态
├── lib/                     # 工具库
│   ├── api.ts                # API 客户端（带认证）
│   └── prisma.ts             # Prisma 客户端
├── prisma/                  # 数据库 Schema
│   ├── schema.prisma         # 数据模型定义
│   └── migrations/           # 迁移历史
└── public/                  # 静态资源
    ├── favicon.ico
    └── placeholder-pet.svg
```

### 4.2 状态管理（Zustand）

#### **authStore** - 认证状态

```typescript
interface AuthStore {
  user: User | null;           // 当前登录用户
  token: string | null;         // JWT Token
  isAuthenticated: boolean;       // 认证状态

  // Actions
  initializeAuth: () => void;    // 从 localStorage 恢复认证
  setAuth: (user, token) => void;
  logout: () => void;
  updateUser: (data) => void;
}
```

#### **cartStore** - 购物车状态

```typescript
interface CartStore {
  items: CartItem[];

  // Actions
  loadCart: () => Promise<void>;
  addItem: (item) => Promise<void>;
  removeItem: (itemId) => Promise<void>;
  updateQuantity: (itemId, quantity) => Promise<void>;
  clearCart: () => void;
}
```

### 4.3 API 客户端设计

**lib/api.ts** 统一 API 请求管理：

```typescript
class ApiClient {
  private baseUrl: string;
  private token: string | null;

  // 自动从 localStorage 加载 token
  constructor(baseUrl: string);

  // Token 管理
  setToken(token: string): void;
  clearToken(): void;

  // 统一请求方法（自动注入认证头）
  request<T>(endpoint, options, auth): Promise<T>;

  // API 方法
  register(email, password, name): Promise<any>;
  login(email, password): Promise<any>;
  getCurrentUser(): Promise<any>;
  uploadPetPhoto(file, name, style): Promise<any>;
  createPetIP(data): Promise<any>;
  getPetIPs(params): Promise<any>;
  queueGeneration(params): Promise<any>;
  checkGenerationStatus(taskId): Promise<any>;
  // ... 更多方法
}
```

### 4.4 关键页面说明

#### **upload/page.tsx** - AI 生成主界面

**功能流程：**
1. 文件拖放上传区域
2. 实时预览上传图片
3. 4 种风格选择（图标 + 名称 + 示例）
4. 生成类型选择（2D 图片 / 3D 模型）
5. 价格显示（5 积分 / 10 积分）
6. 生成按钮（带加载状态）
7. 生成进度显示（轮询 ComfyUI 状态）
8. 生成成功后自动跳转到 `/showcase?petId=xxx`

**关键特性：**
- Base64 图片编码
- 实时样式预览
- 进度百分比显示
- 自动创建 PetIP 记录
- 错误重试机制

#### **showcase/page.tsx** - 资产展示

**功能流程：**
1. 左侧滚动列表：显示用户所有 PetIP
2. 中间 3D 展区：显示选中 PetIP 的 3D 模型
3. 右侧定制面板：产品类型选择（摆件/T恤/壁纸）
4. 规格配置：尺寸选择、底座样式
5. 加入购物车功能

**关键特性：**
- 多 IP 管理与切换
- 3D 模型交互控制（旋转、缩放、灯光）
- 稀有度等级显示（Common/Rare/Epic/Legendary）
- 产品实时价格计算
- 购物车集成

---

## 5. 后端架构

### 5.1 目录结构

```
petforge-backend/
├── src/
│   ├── routes/              # API 路由层
│   │   ├── auth.js          # /api/auth/* - 注册、登录、获取当前用户
│   │   ├── user.js          # /api/user/* - 个人信息更新
│   │   ├── upload.js        # /api/upload - 文件上传处理
│   │   ├── petips.js       # /api/petips/* - PetIP CRUD
│   │   ├── cart.js          # /api/cart/* - 购物车操作
│   │   ├── orders.js        # /api/orders/* - 订单管理
│   │   ├── payments.js      # /api/payments/* - 支付处理
│   │   ├── addresses.js     # /api/addresses/* - 地址管理
│   │   ├── points.js        # /api/points/* - 积分系统
│   │   ├── admin.js         # /api/admin/* - 后台统计
│   │   ├── generation.js    # /api/generation - 旧版生成（保留）
│   │   ├── generation-comfyui.js  # /api/generation/queue-comfyui
│   │   └── generation-simple.js   # 简单生成回退
│   ├── middleware/         # 中间件
│   │   └── auth.js          # JWT 认证中间件
│   ├── services/          # 业务逻辑层
│   │   ├── aiGenerationService.js  # AI 生成逻辑封装
│   │   └── comfyUIService.js       # ComfyUI 集成服务
│   ├── config/            # 配置
│   │   └── database.js       # Prisma 客户端
│   └── server.js          # Express 服务入口
├── workflows/             # ComfyUI 工作流定义
│   ├── pixar_workflow.json       # Pixar 3D 风格
│   ├── clay_workflow.json       # 黏土风格
│   ├── cyber_workflow.json      # 赛博朋克风格
│   ├── line_workflow.json       # 极简线条风格
│   └── *_img2img.json        # 各风格的 2D 图像生成
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   └── migrations/        # 数据库迁移
├── package.json
└── API_DOCUMENTATION.md       # API 文档
```

### 5.2 中间件设计

#### **认证中间件** (middleware/auth.js)

```javascript
export const authenticateToken = (req, res, next) => {
  // 1. 从 Authorization header 提取 token
  const authHeader = req.headers.authorization;

  // 2. 验证 token
  const decoded = jwt.verify(token, SECRET);

  // 3. 附加用户信息到请求对象
  req.userId = decoded.userId;

  // 4. 继续处理请求
  next();
};

export const optionalAuth = (req, res, next) => {
  // 可选认证 - 允许未登录访问
  const authHeader = req.headers.authorization;
  if (authHeader) {
    req.userId = decoded.userId;
  }
  next();
};
```

### 5.3 路由设计模式

所有路由遵循统一模式：

```javascript
// POST /api/auth/register
router.post('/register, async (req, res) => {
  // 1. 输入验证 (Zod)
  const validated = registerSchema.parse(req.body);

  // 2. 密码加密
  const hashedPassword = await bcrypt.hash(validated.password);

  // 3. 数据库操作
  const user = await prisma.user.create({
    data: { ...validated, password: hashedPassword }
  });

  // 4. JWT Token 生成
  const token = jwt.sign({ userId: user.id }, SECRET);

  // 5. 响应返回
  res.json({ success: true, data: { user, token } });
});
```

---

## 6. 数据库设计

### 6.1 核心实体关系图

```
┌──────────────┐
│    User      │
│  ┌─────────┤
│  │         │
│  │ petIPs  │──────────┐
│  └─────────┤          │
│  │         │          │
│  │ orders  │          ↓
│  └─────────┤     ┌──────────────┐
│  │         │     │   PetIP      │
│  │ cartItems│     │  ┌───────┤  │
│  └─────────┤     │  │       │  │
│  │         │     │likes   │  │
│  │addresses│     └───────┘  │
│  └─────────┤                │
│  │         │     generations│
│  │points   │     └────────────┘
│  └─────────┤
└──────────────┘
```

### 6.2 数据模型详解

#### **User** - 用户表

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  name         String?
  phone        String?
  avatar       String?
  bio          String?
  points       Int       @default(100)  // 积分/信用点数
  role         String    @default("user")  // user | admin
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // 关系
  orders       Order[]
  petIPs       PetIP[]
  cartItems    CartItem[]
  addresses    Address[]
  pointTransactions PointTransaction[]
}
```

#### **PetIP** - 宠物 IP 表

```prisma
model PetIP {
  id              String    @id @default(uuid())
  name            String
  style           String    // pixar | clay | cyber | line
  originalImage   String?   @map("original_image")
  generatedImage  String    @map("generated_image")
  model3D         String?   @map("model_3d")  // GLB/GLTF 文件
  rarity          String    @default("Common")  // Common | Rare | Epic | Legendary
  isPublic        Boolean   @default(true) @map("is_public")
  likes           Int       @default(0)

  userId          String    @map("user_id")
  user            User      @relation(fields: [userId], references: [id])

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}
```

#### **Generation** - AI 生成记录

```prisma
model Generation {
  id          String    @id @default(uuid())
  type        String    // image | 3d
  style       String
  inputImage  String?   @map("input_image")
  prompt      String
  taskId      String?   @map("task_id")  // ComfyUI 任务 ID
  status      String    @default("pending")  // pending | processing | completed | failed
  resultUrl   String?   @map("result_url")
  errorMessage String?   @map("error_message")
  creditsCost Int       @map("credits_cost")

  userId      String    @map("user_id")
  user            User      @relation(fields: [userId], references: [id])
  petIPId     String?   @map("petip_id")

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

#### **Order** - 订单表

```prisma
model Order {
  id                String    @id @default(uuid())
  receiverName      String    @map("receiver_name")
  receiverPhone     String    @map("receiver_phone")
  receiverAddress  String    @map("receiver_address")
  totalAmount       Float     @map("total_amount")
  status            String    @default("pending")
  paymentMethod     String    @map("payment_method")

  userId            String    @map("user_id")
  user              User      @relation(fields: [userId], references: [id])

  items        OrderItem[]
  payments     Payment[]

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}
```

#### **CartItem** - 购物车

```prisma
model CartItem {
  id           String    @id @default(uuid())

  productType  String    @map("product_type")
  productName  String    @map("product_name")
  price        Float
  quantity     Int       @default(1)
  size         String?    // small | medium | large
  baseStyle   String?   @map("base_style")  // black | white | gold | purple

  userId       String    @map("user_id")
  user             User    @relation(fields: [userId], references: [id])

  petIPId      String?   @map("petip_id")
  originalImage String?   @map("original_image")
  generatedImage String    @map("generated_image")

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

### 6.3 数据库索引策略

```prisma
@@index([userId])
@@index([petIPId])
@@index([createdAt(sort: Desc)])
```

---

## 7. AI 生成架构

### 7.1 ComfyUI 集成流程

```
用户上传照片
    ↓
前端 Base64 编码
    ↓
POST /api/generation/queue-comfyui
    ↓
后端接收请求
    ↓
构建 ComfyUI Prompt
    ↓
POST http://localhost:8188/prompt
    ↓
ComfyUI 处理任务
    ↓
返回 taskId
    ↓
前端轮询状态
    ↓
GET /api/generation/status-comfyui/{taskId}
    ↓
GET http://localhost:8188/history/{taskId}
    ↓
ComfyUI 返回结果
    ↓
提取图片 URL
    ↓
创建 PetIP 记录
    ↓
跳转到展示页面
```

### 7.2 工作流系统

**workflows/** 目录包含 10 个 JSON 工作流文件：**

| 文件 | 用途 | 输入 | 输出 |
|------|------|------|------|
| `pixar_workflow.json` | 3D Pixar 风格 | 图片 | GLB 模型 |
| `pixar_img2img.json` | 2D Pixar 风格 | 图片 | 2D 图像 |
| `clay_workflow.json` | 3D �土风格 | 图片 | GLB 模型 |
| `clay_img2img.json` | 2D �土风格 | 图片 | 2D 图像 |
| `cyber_workflow.json` | 3D 赛博朋克 | 图片 | GLB 模型 |
| `cyber_img2img.json` | 2D 赛博朋克 | 图片 | 2D 图像 |
| `line_workflow.json` | 3D 线条风格 | 图片 | GLB 模型 |
| `line_img2img.json` | 2D 线条风格 | 图片 | 2D 图像 |

### 7.3 Prompt 构建逻辑

```javascript
// services/comfyUIService.js
buildPrompt(params) {
  const basePrompt = {
    pixar: "3D Pixar animation style cute pet",
    clay: "stop-motion clay animation style",
    cyber: "cyberpunk neon-lit pet",
    line: "minimalist line art style"
  };

  const stylePrompt = basePrompt[params.style];
  const typeSuffix = params.type === '3d'
    ? "3D character model, GLB format"
    : "2D illustration";

  return `${stylePrompt}, ${typeSuffix}, high quality, detailed`;
}
```

### 7.4 任务队列管理

```javascript
// 队列状态存储（内存中，生产环境用 Redis）
const taskQueue = new Map();

// 任务添加
queueTask(taskId, userId) {
  taskQueue.set(taskId, {
    userId,
    status: 'processing',
    createdAt: Date.now()
  });
}

// 状态更新
updateTaskStatus(taskId, status, result) {
  const task = taskQueue.get(taskId);
  if (task) {
    task.status = status;
    task.result = result;
    task.completedAt = Date.now();
  }
}
```

---

## 8. 支付系统

### 8.1 支付流程架构

```
用户确认订单
    ↓
POST /api/payments/create
    ↓
生成支付交易
    {
      transactionId: "PAY" + Date.now() + random,
      amount: order.totalAmount,
      method: "wechat" | "alipay" | "card"
    }
    ↓
返回支付信息
    ↓
前端跳转支付页面
    ↓
模拟支付（测试环境）
    ↓
POST /api/payments/confirm
    ↓
更新订单状态为 "paid"
    ↓
奖励用户积分
    (spentAmount * 1 = pointsEarned)
    ↓
重定向到成功页面
```

### 8.2 支付接口

```javascript
// POST /api/payments/create
async createPayment(req, res) {
  const { orderId, paymentMethod } = req.body;

  // 1. 创建支付记录
  const payment = await prisma.payment.create({
    data: {
      orderId,
      transactionId: generateTransactionId(),
      amount: order.totalAmount,
      method: paymentMethod,
      status: 'pending'
    }
  });

  // 2. 返回支付信息
  res.json({
    success: true,
    data: {
      paymentId: payment.transactionId,
      amount: payment.amount,
      qrCode: `mock_${paymentMethod}_qr.png`  // 模拟二维码
    }
  });
}

// POST /api/payments/confirm
async confirmPayment(req, res) {
  const { paymentId } = req.body;

  // 1. 验证支付
  const payment = await prisma.payment.findUnique({
    where: { transactionId: paymentId }
  });

  // 2. 更新支付状态
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'completed' }
  });

  // 3. 更新订单状态
  await prisma.order.update({
    where: { id: payment.orderId },
    data: { status: 'paid' }
  });

  // 4. 奖励积分
  const pointsEarned = Math.floor(payment.amount);
  await prisma.pointTransaction.create({
    data: {
      userId: req.userId,
      amount: pointsEarned,
      type: 'earn'
    }
  });

  await prisma.user.update({
    where: { id: req.userId },
    data: {
      points: { increment: pointsEarned }
    }
  });
}
```

---

## 9. 安全性设计

### 9.1 认证安全

| 措施 | 实现方式 |
|------|----------|
| **密码加密** | bcrypt + salt（10 轮）|
| **Token 签名** | HS256 JWT secret |
| **Token 过期** | 7 天有效期 |
| **HTTP 头** | Authorization: Bearer {token} |
| **刷新机制** | localStorage + 页面加载自动恢复 |

### 9.2 输入验证

所有 API 输入使用 **Zod Schema** 验证：

```javascript
import { z } from 'z';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// 在路由中使用
const validated = registerSchema.parse(req.body);
```

### 9.3 CORS 配置

```javascript
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3000',  // 前端地址
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 9.4 文件上传安全

```javascript
import multer from 'multer';

const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      // 生成唯一文件名
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片格式
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许图片文件上传'));
    }
  }
});
```

---

## 10. 扩展性考虑

### 10.1 数据库扩展

**当前：** SQLite（开发环境）

**生产环境迁移：**
- 迁移到 **PostgreSQL** 或 **MySQL**
- 使用 Prisma 的 provider 切换
- 添加连接池管理

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql";  // 从 "sqlite" 切换
  url      = env("DATABASE_URL")
}
```

### 10.2 文件存储扩展

**当前：** 本地文件系统

**生产环境迁移：**
- **AWS S3** 或 **阿里云 OSS**
- CDN 加速
- 图片优化（WebP 格式、多尺寸）

```javascript
// 示例：S3 集成
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET
  }
});

async uploadFile(file) {
  await s3.putObject({
    Bucket: 'petforge-uploads',
    Key: `${Date.now()}-${file.name}`,
    Body: file.buffer
  });

  return `https://cdn.petforge.com/${key}`;
}
```

### 10.3 缓存策略

**推荐添加：**
1. **Redis** - 会话存储、任务队列
2. **CDN 缓存** - 静态资源
3. **API 响应缓存** - 统计数据等

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

// 缓存用户会话
await redis.setex(
  `session:${userId}`,
  JSON.stringify(session),
  3600  // 1 小时过期
);
```

### 10.4 性能监控

**推荐工具：**
- **Sentry** - 错误追踪
- **DataDog** - 性能监控
- **Google Analytics** - 用户行为分析
- **Vercel Analytics** - Next.js 性能

---

## 11. 开发环境设置

### 11.1 环境变量

**前端** (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**后端** (.env):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-key-change-in-production"
PORT=4000
COMFYUI_URL=http://localhost:8188
```

### 11.2 启动命令

```bash
# 后端
cd petforge-backend
npm run dev          # 启动开发服务器
npm run migrate       # 运行数据库迁移

# 前端
cd petforge-app
npm run dev          # 启动 Next.js 开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务器

# ComfyUI（独立）
cd petforge-backend
python main.py        # 启动 ComfyUI 服务
```

---

## 12. API 端点清单

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理
- `GET /api/user/profile` - 获取个人信息
- `PATCH /api/user/profile` - 更新个人信息
- `PATCH /api/user/password` - 修改密码
- `POST /api/user/avatar` - 上传头像

### PetIP 管理
- `POST /api/petips` - 创建 PetIP
- `GET /api/petips` - 获取 PetIP 列表
- `GET /api/petips/:id` - 获取单个 PetIP
- `PATCH /api/petips/:id` - 更新 PetIP
- `DELETE /api/petips/:id` - 删除 PetIP
- `POST /api/petips/:id/like` - 点赞 PetIP

### AI 生成
- `POST /api/generation/queue-comfyui` - 排队生成任务
- `GET /api/generation/status-comfyui/:taskId` - 查询生成状态
- `GET /api/generation/history` - 获取生成历史

### 电商相关
- `GET /api/cart` - 获取购物车
- `POST /api/cart` - 添加到购物车
- `DELETE /api/cart/:id` - 删除购物车项
- `PATCH /api/cart/:id` - 更新数量
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情

### 支付相关
- `POST /api/payments/create` - 创建支付
- `POST /api/payments/confirm` - 确认支付

### 积分系统
- `GET /api/points` - 获取积分余额
- `GET /api/points/history` - 获取积分历史

### 地址管理
- `GET /api/addresses` - 获取地址列表
- `POST /api/addresses` - 添加地址
- `PATCH /api/addresses/:id` - 更新地址
- `DELETE /api/addresses/:id` - 删除地址
- `POST /api/addresses/:id/default` - 设置默认地址

### 管理后台
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/petips` - 获取所有 PetIP
- `GET /api/admin/orders` - 获取所有订单

---

## 13. 故障排查指南

### 13.1 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| **前端 404 错误** | Next.js 构建问题 | 运行 `npm run build` 重试 |
| **API 连接失败** | 后端未启动 | 检查 `npm run dev` 是否运行 |
| **CORS 错误** | 跨域配置 | 检查 `cors()` 配置 |
| **数据库错误** | Prisma 未迁移 | 运行 `npx prisma migrate dev` |
| **ComfyUI 超时** | 服务未启动 | 运行 `python main.py` 启动 ComfyUI |
| **Token 无效** | JWT 过期 | 重新登录获取新 token |

### 13.2 调试技巧

```bash
# 查看后端日志
cd petforge-backend && npm run dev

# 查看前端网络请求
# 在浏览器 DevTools → Network 选项卡

# 查看数据库内容
cd petforge-backend && npx prisma studio

# 测试 API 端点
curl http://localhost:4000/api/petips \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 14. 部署检查清单

### 14.1 上线前检查

- [ ] 更改所有默认密码和密钥
- [ ] 配置生产数据库连接
- [ ] 启用 HTTPS
- [ ] 配置 CORS 正确的生产域名
- [ ] 设置文件上传大小限制
- [ ] 配置 CDN 或云存储
- [ ] 启用错误监控（Sentry）
- [ ] 配置环境变量
- [ ] 运行数据库迁移
- [ ] 测试支付流程
- [ ] 压力测试（至少 100 并发）
- [ ] 检查 SEO 标签和 meta 信息

### 14.2 性能优化建议

**前端：**
- 代码分割（Next.js 自动处理）
- 图片懒加载
- 路由预加载
- 缓存 API 响应
- 压缩静态资源

**后端：**
- 数据库查询优化（添加索引）
- API 响应压缩
- 静态文件 CDN
- 限流保护
- Redis 缓存热点数据

---

## 附录：技术决策记录

### A. 为什么选择 Next.js 14？

- **App Router** - 更清晰的目录结构
- **Server Components** - 性能优化
- **Streaming SSR** - 更快的首屏加载
- **内置优化** - 图片优化、字体优化

### B. 为什么使用 Zustand 而非 Redux？

- **轻量级** - Bundle 体积小
- **简单 API** - 学习成本低
- **TypeScript 友好** - 无需额外类型定义
- **持久化** - 内置 localStorage 同步

### C. 为什么使用 Prisma？

- **类型安全** - 自动生成 TypeScript 类型
- **迁移管理** - 版本化数据库 Schema
- **多数据库** - 易于切换数据库提供商
- **查询构建器** - 类型安全的 API

### D. ComfyUI 集成原因

- **真实 AI 能力** - Stable Diffusion + ControlNet
- **可定制工作流** - JSON 格式灵活定义
- **开源免费** - 无 API 费用
- **本地部署** - 数据隐私保护

---

**文档版本:** v1.0
**最后更新:** 2026-02-12
**维护者:** PetForge 开发团队
