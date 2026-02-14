# PetForge Backend - WebSocket 实时进度系统

## WebSocket 实时进度推送系统

### 概述

PetForge 实现了基于 WebSocket 的实时进度推送系统，为用户提供无缝的生成任务监控体验。系统使用 Node.js 原生 WebSocket 和浏览器原生 WebSocket API，实现低延迟的状态更新。

### 架构特点

- **后端**: ws (Node.js 原生 WebSocket)
- **前端**: 浏览器原生 WebSocket API
- **认证**: JWT Token 安全认证
- **管理**: React Hook 封装，自动重连
- **性能**: 事件驱动，高效广播

### 快速开始

1. **启动服务器**
```bash
npm run dev
```

2. **连接 WebSocket**
```typescript
const ws = new WebSocket('ws://localhost:4000/ws/generation?token=your-jwt-token');
```

### API 文档

#### 消息格式
```json
{
  "event": "事件类型",
  "data": {
    // 事件数据
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### 事件类型

**服务器推送**:
- `connected` - 连接建立
- `progress_update` - 进度更新
- `status_change` - 状态变化
- `error` - 错误消息

**客户端发送**:
- `subscribe` - 订阅任务
- `unsubscribe` - 取消订阅
- `ping` - 心跳检测

### 使用示例

#### React Hook
```typescript
import { useGenerationProgress } from '../hooks/useGenerationProgress';

function GenerationComponent() {
  const { status, updates, connect, disconnect } = useGenerationProgress();

  connect('task-001', 'your-jwt-token');

  useEffect(() => {
    updates.forEach(update => {
      console.log('Task update:', update);
    });
  }, [updates]);

  return <div>实时进度组件</div>;
}
```

#### 原生 JavaScript
```javascript
const ws = new WebSocket('ws://localhost:4000/ws/generation?token=your-jwt-token');

ws.onopen = () => {
  ws.send(JSON.stringify({
    event: 'subscribe',
    data: { taskId: 'task-001' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Message:', message);
};
```

### 错误处理

常见错误代码：
- `AUTH_FAILED` - 认证失败
- `INVALID_MESSAGE` - 消息格式无效
- `TASK_NOT_FOUND` - 任务不存在
- `ACCESS_DENIED` - 访问被拒绝

### 测试

```bash
# 运行 WebSocket 测试
npm test

# 运行特定测试
npm test -- --testPathPattern=websocket

# 覆盖率测试
npm run test:coverage
```

### 配置

#### 环境变量
```env
WS_MAX_CONNECTIONS=1000
WS_RECONNECT_DELAY=3000
WS_TIMEOUT=10000
```

### 监控

WebSocket 服务器提供实时统计：
- 总连接数
- 独立用户数
- 活跃订阅数

```javascript
const stats = wsServer.getStats();
console.log({
  totalConnections: stats.totalConnections,
  uniqueUsers: stats.uniqueUsers,
  activeSubscriptions: stats.activeSubscriptions,
});
```

## 部署

### 生产环境配置

1. **HTTPS + WSS**
2. **WebSocket 负载均衡**
3. **JWT 令牌轮换**
4. **连接数限制**

### 性能优化

- 心跳检测（30秒间隔）
- 自动重连（最多5次）
- 消息批量处理
- 连接池管理

---

## 安全检查清单

### 🔴 关键安全项（部署前必须完成）

#### 密钥管理
- [ ] 无硬编码密钥在源代码中
  - [ ] DATABASE_URL 未硬编码
  - [ ] JWT_SECRET 未硬编码
  - [ ] API 密钥未硬编码
- [ ] `.env` 文件在 `.gitignore` 中
- [ ] 生产环境使用强密钥
  - [ ] JWT_SECRET 长度≥32字符
  - [ ] 数据库密码强强度（16+字符）

#### 身份认证与授权
- [ ] 密码使用 bcrypt 哈希（成本因子12+）
- [ ] JWT 令牌设置了过期时间（7天或更短）
- [ ] 实现了基于角色的访问控制（RBAC）
- [ ] 管理路由受 `requireRole('admin')` 保护
- [ ] 启用了 API 速率限制
- [ ] 用户只能访问自己的资源

#### 输入验证
- [ ] 所有 POST/PUT/PATCH 端点验证输入
- [ ] 使用 Zod 模式定义所有用户输入
- [ ] SQL 注入防护（Prisma ORM）
- [ ] XSS 防护（输入清理）
- [ ] 文件上传限制
  - [ ] 文件类型验证
  - [ ] 文件大小限制

### 🟠 高优先级安全项

#### 安全头
- [ ] Helmet 中间件已启用
- [ ] 内容安全策略（CSP）已配置
- [ ] HTTP 严格传输安全（HSTS）在生产环境启用
- [ ] CORS 配置正确
- [ ] 速率限制已激活

#### 令牌安全
- [ ] HttpOnly Cookie 用于身份验证
- [ ] 生产环境设置 Secure 标志（仅 HTTPS）
- [ ] SameSite 标志设置防止 CSRF
- [ ] 令牌过期时间合理（7天或更短）

### 预部署验证

```bash
# 检查硬编码密钥
grep -rn "DATABASE_URL.*postgresql://" --exclude-dir=node_modules
grep -rn "JWT_SECRET.*your-super-secret" --exclude-dir=node_modules

# 检查生产代码中的 console.log
grep -rn "console\." src/routes --include="*.js" | grep -v "test"

# 运行安全审计
npm audit

# 运行测试
npm test
```

### 部署后监控

部署后监控以下指标（首次24小时）：
- [ ] 失败的身份验证尝试
- [ ] 速率限制违规
- [ ] 各端点错误率
- [ ] 响应时间
- [ ] 异常流量模式
- [ ] API 滥用尝试

---

**最后更新**: 2026-02-14
**版本**: 1.0