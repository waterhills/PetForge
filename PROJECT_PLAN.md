# PetForge 项目开发计划

> **项目定位**: AI驱动的宠物IP生成与定制平台
>
> **核心价值**: 用户上传宠物照片 → AI生成个性化IP形象 → 定制周边产品 → 社交分享

---

## 📊 项目概览

### 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      PetForge 平台架构                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐          ┌──────────────────┐         │
│  │   前端 Frontend   │          │   后端 Backend    │         │
│  ├──────────────────┤          ├──────────────────┤         │
│  │  Next.js 14      │◄─────►   │  Express.js      │         │
│  │  App Router      │  HTTP    │  Prisma ORM      │         │
│  │  Tailwind CSS    │          │  JWT Auth        │         │
│  │  Zustand         │          │  Multer Upload   │         │
│  │  Port: 3001      │          │  Port: 4000      │         │
│  └──────────────────┘          └──────────────────┘         │
│                                         │                   │
│                                         ▼                   │
│                                ┌──────────────────┐         │
│                                │   SQLite / PG    │         │
│                                │   Prisma Studio  │         │
│                                └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 项目目录结构

```
firstpet/
├── petforge-app/              # 前端应用 (Next.js 14)
│   ├── app/                   # App Router 页面
│   │   ├── page.tsx           # 首页
│   │   ├── upload/            # 照片上传页
│   │   ├── showcase/          # 作品展示页
│   │   ├── community/         # 社区页
│   │   ├── cart/              # 购物车
│   │   └── admin/             # 管理后台
│   │       ├── page.tsx       # 仪表盘
│   │       ├── users/         # 用户管理
│   │       ├── petips/        # 宠物IP管理
│   │       └── orders/        # 订单管理
│   ├── components/            # React 组件
│   │   └── ui/               # UI 基础组件
│   ├── lib/                   # 工具库
│   │   └── api.ts            # API 客户端
│   ├── store/                 # Zustand 状态管理
│   └── package.json
│
├── petforge-backend/          # 后端 API (Express.js)
│   ├── src/
│   │   ├── routes/           # API 路由
│   │   │   ├── auth.js       # 认证接口
│   │   │   ├── upload.js     # 文件上传
│   │   │   ├── petips.js     # 宠物IP
│   │   │   ├── cart.js       # 购物车
│   │   │   ├── orders.js     # 订单
│   │   │   └── admin.js      # 管理后台
│   │   ├── middleware/       # 中间件
│   │   ├── lib/              # 工具库
│   │   └── server.js         # 服务器入口
│   ├── prisma/
│   │   └── schema.prisma     # 数据库模型
│   └── package.json
│
├── README_ARCHITECTURE.md     # 架构说明文档
└── PROJECT_PLAN.md            # 本文件
```

---

## 🎯 开发阶段规划

### ✅ Phase 1: 基础架构搭建 (已完成)

**目标**: 建立前后端分离的开发环境

**已完成任务**:
- [x] 前端项目初始化 (Next.js 14 + App Router)
- [x] 后端项目初始化 (Express.js + Prisma)
- [x] 数据库模型设计 (User, PetIP, Order, CartItem, OrderItem, Style, CommunityPost)
- [x] JWT 认证系统
- [x] CORS 跨域配置
- [x] 文件上传功能 (Multer)
- [x] API 客户端封装 (lib/api.ts)
- [x] 管理后台基础页面
  - [x] 仪表盘 (统计数据展示)
  - [x] 用户管理页面
  - [x] 宠物IP管理页面
  - [x] 订单管理页面

**技术债务**:
- [ ] 添加请求限流 (Rate Limiting)
- [ ] 完善输入验证 (Zod/Joi)
- [ ] 添加单元测试

**验证方式**:
```bash
# 后端
cd petforge-backend && npm run dev
# ✓ 访问 http://localhost:4000/health

# 前端
cd petforge-app && npm run dev
# ✓ 访问 http://localhost:3001
# ✓ 访问 http://localhost:3001/admin
```

---

### 🚧 Phase 2: 用户前台页面 (进行中)

**目标**: 完善面向用户的界面和交互

**任务清单**:

#### 2.1 核心页面开发

- [ ] **首页优化** (`app/page.tsx`)
  - [ ] 添加 Hero 区域展示产品价值
  - [ ] 展示热门作品轮播
  - [ ] 添加用户评价/案例
  - [ ] CTA 按钮引导上传

- [ ] **上传页面完善** (`app/upload/page.tsx`)
  - [ ] 拖拽上传组件
  - [ ] 图片预览和裁剪
  - [ ] 上传进度显示
  - [ ] 表单验证

- [ ] **展示页面** (`app/showcase/page.tsx`)
  - [ ] 作品列表展示 (卡片布局)
  - [ ] 筛选功能 (类型、风格、稀有度)
  - [ ] 搜索功能
  - [ ] 排序功能 (最新、最热)

- [ ] **社区页面** (`app/community/page.tsx`)
  - [ ] 用户发帖功能
  - [ ] 作品分享
  - [ ] 评论和点赞
  - [ ] 关注系统

#### 2.2 通用组件开发

- [ ] **导航组件** (`components/navigation.tsx`)
  - [ ] 响应式导航栏
  - [ ] 用户登录状态显示
  - [ ] 购物车图标 (带数量角标)

- [ ] **页脚组件** (`components/footer.tsx`)
  - [ ] 公司信息
  - [ ] 快捷链接
  - [ ] 社交媒体

- [ ] **加载状态** (`components/loading.tsx`)
- [ ] **错误提示** (`components/error-boundary.tsx`)

#### 2.3 用户中心

- [ ] **用户个人中心** (`app/profile/page.tsx`)
  - [ ] 个人信息编辑
  - [ ] 头像上传
  - [ ] 我的作品
  - [ ] 我的订单
  - [ ] 积分/优惠券管理

- [ ] **登录/注册页面**
  - [ ] 登录表单
  - [ ] 注册表单
  - [ ] 密码找回
  - [ ] 第三方登录 (微信/QQ)

**预计工时**: 2-3 周

---

### 🔮 Phase 3: AI 功能集成 (未开始)

**目标**: 实现 AI 图像生成核心功能

**技术选型**:
- **图像生成**: Stability AI (Stable Diffusion) / OpenAI DALL-E 3
- **3D 生成**: Meshy.ai / Tripo AI
- **Prompt 优化**: 结合用户输入和模板

#### 3.1 后端任务

- [ ] **AI 服务集成**
  - [ ] 安装 SDK (Stability AI / OpenAI)
  - [ ] 配置环境变量
  - [ ] 实现服务封装 (`src/services/aiService.js`)
  - [ ] 错误处理和重试机制
  - [ ] API 调用限流

- [ ] **生成控制器** (`src/controllers/generationController.js`)
  - [ ] `generatePetImage()` - 2D 图像生成
  - [ ] `generate3DModel()` - 3D 模型生成
  - [ ] 参数验证和预处理
  - [ ] 生成结果存储

- [ ] **生成 API 路由** (`src/routes/generation.js`)
  - [ ] `POST /api/generate/image` - 生成 2D 图像
  - [ ] `POST /api/generate/3d` - 生成 3D 模型
  - [ ] `GET /api/generate/history` - 生成历史
  - [ ] `GET /api/generate/status/:id` - 查询生成状态

- [ ] **异步任务队列** (推荐: Bull + Redis)
  - [ ] 任务队列搭建
  - [ ] 生成任务入队
  - [ ] 任务状态查询
  - [ ] 失败重试机制

- [ ] **数据库模型更新**
  ```prisma
  model Generation {
    id          String   @id @default(cuid())
    userId      String
    type        String   // "2d" | "3d"
    prompt      String
    parameters  String   // JSON
    status      String   // "pending" | "processing" | "completed" | "failed"
    resultUrl   String?
    cost        Int      // 消耗积分
    createdAt   DateTime @default(now())
    completedAt DateTime?
  }
  ```

#### 3.2 前端任务

- [ ] **生成页面** (`app/generate/page.tsx`)
  - [ ] 宠物类型选择 (猫/狗/其他)
  - [ ] 风格选择器 (卡通/写实/水彩等)
  - [ ] 特征描述输入框
  - [ ] 参考图片上传
  - [ ] 生成按钮
  - [ ] 价格预览 (显示消耗积分)

- [ ] **生成状态页面** (`app/generate/status/[id]/page.tsx`)
  - [ ] 进度显示
  - [ ] 预计等待时间
  - [ ] 生成结果展示
  - [ ] 下载/保存按钮
  - [ ] 重新生成选项

- [ ] **历史记录页面** (`app/generate/history/page.tsx`)
  - [ ] 生成历史列表
  - [ ] 筛选和排序
  - [ ] 批量操作
  - [ ] 导出功能

- [ ] **API 客户端更新** (`lib/api.ts`)
  ```typescript
  async generateImage(params: GenerateParams) { }
  async generate3D(params: Generate3DParams) { }
  async getGenerationStatus(id: string) { }
  async getGenerationHistory(filters: HistoryFilters) { }
  ```

**预计工时**: 3-4 周

**注意事项**:
- ⚠️ AI API 按次计费，需要严格控制成本
- ⚠️ 生成时间较长，必须实现异步处理
- ⚠️ 需要内容审核机制 (防止违规内容)
- ⚠️ 建议添加配额限制 (防止滥用)

---

### 💰 Phase 4: 支付系统集成 (未开始)

**目标**: 实现订单支付功能

**支付渠道**:
- 微信支付 (国内用户)
- 支付宝 (国内用户)
- Stripe (国际用户，可选)

#### 4.1 后端任务

- [ ] **支付服务封装** (`src/services/paymentService.js`)
  - [ ] 微信支付 SDK 集成
  - [ ] 支付宝 SDK 集成
  - [ ] 统一支付接口

- [ ] **支付 API 路由** (`src/routes/payment.js`)
  - [ ] `POST /api/payment/create` - 创建支付订单
  - [ ] `POST /api/payment/callback/wechat` - 微信回调
  - [ ] `POST /api/payment/callback/alipay` - 支付宝回调
  - [ ] `GET /api/payment/status/:orderId` - 查询支付状态

- [ ] **Webhook 处理**
  - [ ] 签名验证
  - [ ] 订单状态更新
  - [ ] 积分扣除
  - [ ] 通知发送

#### 4.2 前端任务

- [ ] **收银台页面** (`app/checkout/page.tsx`)
  - [ ] 订单确认
  - [ ] 支付方式选择
  - [ ] 优惠券输入
  - [ ] 价格明细

- [ ] **支付结果页面** (`app/payment/result/page.tsx`)
  - [ ] 支付成功/失败展示
  - [ ] 订单详情
  - [ ] 后续操作按钮

**预计工时**: 2 周

---

### 🎨 Phase 5: 产品定制功能 (未开始)

**目标**: 实现周边产品定制和预览

**产品类型**:
- 手机壳
- T 恤
- 马克杯
- 海报
- 毛绒玩具

#### 5.1 后端任务

- [ ] **产品管理** (`src/routes/products.js`)
  - [ ] 产品 CRUD
  - [ ] 规格管理
  - [ ] 价格配置

- [ ] **定制预览** (`src/routes/preview.js`)
  - [ ] 图片合成服务
  - [ ] 模板管理
  - [ ] 实时预览生成

#### 5.2 前端任务

- [ ] **产品定制页面** (`app/customize/[product]/page.tsx`)
  - [ ] 产品展示
  - [ ] IP 选择
  - [ ] 实时预览 (Canvas/WebGL)
  - [ ] 规格选择
  - [ ] 添加到购物车

- [ ] **3D 预览** (可选)
  - [ ] Three.js 3D 模型展示
  - [ ] 交互式旋转/缩放
  - [ ] 实时纹理贴图

**预计工时**: 3-4 周

---

### 🧪 Phase 6: 测试与优化 (未开始)

**目标**: 提高代码质量和系统稳定性

#### 6.1 测试

- [ ] **单元测试**
  - [ ] 后端 API 测试 (Jest)
  - [ ] 前端组件测试 (React Testing Library)
  - [ ] 目标覆盖率: 70%+

- [ ] **集成测试**
  - [ ] API 端到端测试
  - [ ] 支付流程测试

- [ ] **E2E 测试**
  - [ ] Playwright/Cypress
  - [ ] 关键用户流程

#### 6.2 性能优化

- [ ] **前端优化**
  - [ ] 图片懒加载
  - [ ] 代码分割
  - [ ] 缓存策略
  - [ ] SEO 优化

- [ ] **后端优化**
  - [ ] 数据库查询优化
  - [ ] Redis 缓存
  - [ ] CDN 加速
  - [ ] 响应压缩

#### 6.3 监控与日志

- [ ] **日志系统**
  - [ ] Winston/Pino
  - [ ] 结构化日志
  - [ ] 日志分级

- [ ] **错误追踪**
  - [ ] Sentry 集成
  - [ ] 错误告警

- [ ] **性能监控**
  - [ ] APM 工具 (New Relic/DataDog)
  - [ ] 自定义指标

**预计工时**: 2-3 周

---

### 🚀 Phase 7: 部署与上线 (未开始)

**目标**: 部署到生产环境

#### 7.1 前端部署

- [ ] **Vercel 部署**
  - [ ] 连接 GitHub 仓库
  - [ ] 配置环境变量
  - [ ] 自定义域名
  - [ ] 自动部署

#### 7.2 后端部署

**选项 A: Railway / Render**
- [ ] 推送代码到 GitHub
- [ ] 在平台导入项目
- [ ] 配置环境变量
- [ ] 设置数据库 (PostgreSQL)

**选项 B: 自建服务器**
- [ ] 服务器采购 (阿里云/腾讯云)
- [ ] Nginx 配置
- [ ] PM2 进程管理
- [ ] SSL 证书
- [ ] 域名解析

#### 7.3 数据库迁移

- [ ] 从 SQLite 迁移到 PostgreSQL
- [ ] 数据迁移脚本
- [ ] 备份策略
- [ ] 监控告警

#### 7.4 CI/CD

- [ ] GitHub Actions
- [ ] 自动测试
- [ ] 自动部署
- [ ] 回滚机制

**预计工时**: 1-2 周

---

## 📋 开发优先级建议

### 高优先级 (P0) - 核心功能
1. ✅ 用户认证系统
2. ✅ 基础管理后台
3. 🚧 用户前台页面 (Phase 2)
4. 🔮 AI 图像生成功能 (Phase 3)

### 中优先级 (P1) - 增强功能
1. 💰 支付系统 (Phase 4)
2. 🎨 产品定制 (Phase 5)
3. 社区互动功能

### 低优先级 (P2) - 优化项
1. 🧪 测试覆盖 (Phase 6)
2. 性能优化
3. 监控告警

---

## 🎯 近期行动计划 (接下来 4 周)

### Week 1-2: 完善前台页面
- [ ] 首页优化 (Hero、热门作品)
- [ ] 上传页面完善 (拖拽、裁剪)
- [ ] 展示页面 (筛选、搜索)
- [ ] 导航和页脚组件

### Week 3: AI 功能准备
- [ ] 调研 AI 服务商 (Stability AI / Meshy.ai)
- [ ] 申请 API 密钥
- [ ] 本地测试 API 调用
- [ ] 设计生成流程

### Week 4: AI 功能开发
- [ ] 后端生成服务封装
- [ ] 生成 API 路由
- [ ] 前端生成页面
- [ ] 联调测试

---

## 📞 技术支持

### 相关文档
- [Next.js 文档](https://nextjs.org/docs)
- [Express 文档](https://expressjs.com)
- [Prisma 文档](https://www.prisma.io/docs)
- [Stability AI API](https://docs.stability.ai/)
- [Meshy.ai 文档](https://docs.meshy.ai/)

### 开发规范
1. **提交信息**: 使用约定式提交 `feat:`, `fix:`, `refactor:` 等
2. **代码审查**: 重要功能需要 Review
3. **文档更新**: 功能变更时同步更新文档
4. **测试先行**: 先写测试，再写功能 (TDD)

---

## 📝 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2025-02-11 | v1.0 | 创建项目计划，基于当前架构和进展 |
