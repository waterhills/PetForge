# PetForge 项目全面改进实施计划

## 📊 项目概述

**项目名称**: PetForge - 宠物IP生成平台
**当前状态**: 功能完整，生产就绪度不足
**改进目标**: 测试覆盖 / 支付系统 / AI优化 / 生产环境

**技术栈**:
- 前端: Next.js 14 + React + TypeScript + Tailwind CSS
- 后端: Express.js + Prisma ORM + SQLite
- AI: ComfyUI集成（图生图工作流）

---

## 📅 分阶段实施计划

### Phase 1: 测试基础设施建设 (Week 1-2)

**目标**: 建立80%+测试覆盖率

#### 主要任务

**Week 1**: 测试框架搭建 + 单元测试
- 安装 Vitest (前端) + Jest (后端) + Playwright (E2E)
- 配置测试脚本 (test:unit, test:integration, test:e2e, test:coverage)
- 创建测试工具
- 编写高优先级单元测试 (认证、API客户端)

**Week 2**: 集成测试 + E2E测试
- 编写中优先级单元测试 (购物车、工具函数)
- API集成测试 (认证、生成、订单流程)
- E2E测试场景 (用户旅程)

#### 验证标准

```bash
npm run test:coverage
# Statements: 80%+, Branches: 75%+, Functions: 85%+, Lines: 80%+
```

---

### Phase 2: 支付系统完善 (Week 3-4)

**目标**: 集成真实支付网关

**Week 3**: 支付网关 + 状态机
- 集成微信支付 SDK (`wechatpay-node-v3`)
- 集成支付宝 SDK (`alipay-sdk`)
- 实现订单状态机
- 支付回调验证 (签名、IP白名单、幂等性)

**Week 4**: 重试机制 + 订单管理
- 失败重试机制 (3次，指数退避)
- 订单状态变更历史
- 退款处理流程

---

### Phase 3: AI生成优化 (Week 5-6)

**目标**: 优化性能，实现队列管理和实时推送

**Week 5**: 队列系统 + WebSocket
- 集成 Redis + Bull 队列
- 实现生成任务队列
- WebSocket 实时进度推送

**Week 6**: Prompt优化 + 性能调优
- 优化 Prompt 模板
- 实现质量评估
- 性能优化 (批量生成、缓存)

#### 验证指标

- 队列响应: < 500ms
- WebSocket连接: < 100ms
- 生成成功率: > 95%
- 生成时间: < 60s

---

### Phase 4: 生产环境准备 (Week 7-8)

**目标**: 迁移到生产级基础设施

**Week 7**: 数据库迁移 + 云存储
- SQLite → PostgreSQL
- 集成云存储 (阿里云OSS / AWS S3)
- 数据迁移脚本

**Week 8**: 监控日志 + 安全加固
- Sentry 错误追踪
- Winston 结构化日志
- API限流、CSRF防护
- HTTPS强制

---

## 📁 关键文件清单

### 需要创建的文件

**测试**:
- `petforge-app/tests/` (Vitest配置、测试文件)
- `petforge-app/e2e/` (Playwright测试)
- `petforge-backend/tests/` (Jest配置、测试文件)

**支付系统**:
- `src/services/paymentService.js`
- `src/services/wechatPayService.js`
- `src/services/alipayService.js`
- `src/routes/payments-wechat.js`
- `src/routes/payments-alipay.js`

**AI优化**:
- `src/queue/generationQueue.js` ✅
- `src/queue/generationProcessor.js` ✅
- `src/queue/queueMonitor.js` ✅
- `src/queue/initQueue.js` ✅
- `src/routes/generation-queue.js` ✅
- `src/websocket/generationSocket.js` ✅

**生产环境**:
- `src/services/storageService.js`
- `src/utils/logger.js`
- `src/utils/sentry.js`
- `scripts/migrate-to-postgres.js`

### 需要修改的关键文件

1. `prisma/schema.prisma` - 数据库模型更新 ✅
2. `src/routes/payments.js` - 支付网关集成 ✅
3. `src/routes/generation-comfyui.js` - 队列+WebSocket ✅
4. `src/services/comfyUIService.js` - 重试+性能优化 ✅
5. `lib/api.ts` - 前端API客户端
6. `src/server.js` - 集成队列系统 ✅

---

## ✅ 时间表

```
Week 1-2: Phase 1 - 测试基础
Week 3-4: Phase 2 - 支付系统
Week 5-6: Phase 3 - AI优化
Week 7-8: Phase 4 - 生产环境
```

**里程碑**:
- Week 2: 测试覆盖率80% ✅
- Week 4: 真实支付可用 ✅
- Week 6: AI性能提升50% ✅ (队列系统已完成)
- Week 8: 生产环境上线 🚀

---

## 🚀 快速开始

### 安装测试依赖

```bash
# 前端
cd petforge-app
npm install -D vitest @testing-library/react @testing-library/user-event @vitest/ui
npm install -D @playwright/test

# 后端
cd petforge-backend
npm install -D jest supertest @types/jest
```

### 创建第一个测试文件

```bash
# petforge-app/tests/store/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthStore } from '../store/authStore';

describe('AuthStore', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### 运行测试

```bash
# 单元测试
npm run test:unit

# 覆盖率报告
npm run test:coverage
```

---

## 📚 相关文档

- [Prisma 文档](https://www.prisma.io/docs)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
- [微信支付文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- [支付宝文档](https://opendocs.alipay.com/)
- [Bull 队列文档](https://docs.bullmq.io/)

---

**准备好开始了？从哪个 Phase 开始实施？**
