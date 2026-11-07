# 认证系统设计决策：为什么选择方案 B（自建 API）

**日期**: 2026-11-07  
**决策**: 选择自建认证 API 而不是 Supabase SDK  
**优先级**: 🔴 最高  
**预计工作量**: 5-7 天

---

## 📌 决策摘要

**选择方案 B: 自建认证 API** 而不是方案 A: Supabase SDK

```
不是因为速度 (自建更慢: 5-7 天 vs 2-3 天)
而是因为架构一致性和战略价值
```

---

## 🎯 为什么自建 API 是正确选择

### 1️⃣ 核心理由：架构一致性（最重要）

#### PCI 的架构设计原则

```
后端 → 定义所有业务规则、数据边界、权限检查
前端 → 纯粹的 API 消费、UI 展示、状态管理
```

这在所有现有代码中都得到了体现：

```typescript
// ✅ 这是 PCI 的设计方式
// 后端定义规则
GET /api/v1/creator/offerings
GET /api/v1/private/profiles/{id}
PATCH /api/v1/creator/identity

// 前端消费
const { data } = useQuery(() => apiClient.get('/creator/offerings'));
```

#### Supabase SDK 方案的问题

```typescript
// ❌ 违反设计原则
import { createClient } from '@supabase/supabase-js';

// 认证逻辑散落在前端
const { data, error } = await supabase.auth.signUp({
  email: user@example.com,
  password: '...'
});

// 问题：
// 1. 前端直接依赖 Supabase 服务
// 2. 认证逻辑不在后端定义
// 3. 无法在后端做权限检查
// 4. 难以替换认证提供商
```

#### 自建 API 方案的优势

```typescript
// ✅ 符合 PCI 架构
// 后端定义
POST /api/v1/auth/signup
POST /api/v1/auth/login

// 前端消费
const { login } = useLogin(); // Hook 简化
await login(email, password);

// 好处：
// 1. 认证完全在后端定义
// 2. 前端只负责 UI 和 API 调用
// 3. 后端可以集中管理权限
// 4. 轻松替换认证提供商（Supabase → Auth0 → 自建）
```

### 2️⃣ Creator Economy 特殊需求

#### PCI 的核心问题

```
为被平台封禁的 Creator 提供永不失效的商业身份
```

这需要非常规的认证设计。

#### 特殊需求对比

| 需求 | 标准 SaaS | Supabase SDK | 自建 API |
|------|----------|-------------|---------|
| **C号绑定** (无意义字符串与身份绑定) | ❌ | ⚠️ 困难 | ✅ 灵活 |
| **多账户** 绑定同一 Creator | ❌ | ⚠️ 困难 | ✅ 灵活 |
| **离线验证** (本地已验证 Creator) | ❌ | ⚠️ 受限 | ✅ 完全控制 |
| **自定义 Token 格式** | ❌ | ⚠️ 受限 | ✅ 自由设计 |
| **渐进式认证** (匿名 → 实名) | ❌ | ⚠️ 复杂 | ✅ 自然支持 |
| **身份持久化** (防平台封禁) | ❌ | ⚠️ 受限 | ✅ 完全掌控 |

**结论**: Supabase SDK 是为标准 SaaS 设计的，不适合 Creator Economy 基础设施。

### 3️⃣ 充分利用已有基础设施

#### 后端已经做好的工作

```go
// adapters/auth/supabase/
✅ SupabaseTokenVerifier          // Token 验证器
✅ SupabaseAuthContextProvider    // 认证上下文
✅ Account Context Resolution     // 账户信息解析
✅ Permission Checks              // 权限检查

// adapters/transport/http/
✅ Creator Identity Routes        // Creator 权限路由
✅ Private Identity Routes        // 私有权限路由
✅ Access Control 完整            // 访问控制
```

#### Supabase SDK 方案的浪费

```
❌ 整个后端认证框架都用不上
❌ 前端绕过后端直接调用 Supabase
❌ 后端的权限设计无法应用到认证
❌ 大量重复工作
```

#### 自建 API 方案的充分利用

```
✅ 完整利用现有的认证框架
✅ 前端 → 后端 → Supabase 的清晰链路
✅ 所有权限检查集中在后端
✅ 一致的权限管理策略
✅ 充分利用已有的投资
```

### 4️⃣ 长期控制力和战略价值

#### 今天选择 Supabase SDK

```
现在: 快速解决 (2-3 天)
3 个月后: 
  ❌ 想替换 Supabase？困难
  ❌ 想自定义认证流程？困难
  ❌ 想添加特殊身份逻辑？困难
  
结果: 被 Supabase 绑定，长期成本高
```

#### 今天选择自建 API

```
现在: 稍慢一点 (5-7 天，3-5 天的差异)
3 个月后:
  ✅ 想替换认证提供商？只改后端
  ✅ 想自定义认证流程？完全控制
  ✅ 想添加 Creator 特殊逻辑？自由设计
  
结果: 完全独立，长期收益高
```

#### 成本-收益分析

```
成本: +3-5 天工程时间
收益: 
  + 完整的架构一致性
  + 创意自由度
  + 长期可控性
  + Creator Economy 适配
  + 战略独立性
```

---

## 📊 完整的方案对比

### 维度 1: 架构符合度 ⭐⭐⭐⭐⭐

```
Supabase SDK:  ⭐⭐
  - 认证逻辑在前端
  - 前端直接依赖 Supabase
  - 违反"后端契约优先"设计
  ❌ 不符合 PCI 架构

自建 API:      ⭐⭐⭐⭐⭐
  - 认证逻辑在后端
  - 前端只消费 API
  - 完全符合"后端契约优先"设计
  ✅ 完全符合 PCI 架构
```

### 维度 2: Creator Economy 适配度 ⭐⭐⭐⭐⭐

```
Supabase SDK:  ⭐⭐⭐
  - 标准 SaaS 认证
  - 难以定制特殊需求
  - 无法支持 C号绑定
  - 无法支持多账户关联

自建 API:      ⭐⭐⭐⭐⭐
  - 完全定制认证流程
  - 灵活支持 C号绑定
  - 灵活支持多账户关联
  - 支持渐进式认证
```

### 维度 3: 长期控制力 ⭐⭐⭐⭐⭐

```
Supabase SDK:  ⭐⭐
  - 依赖 Supabase 生态
  - 无法替换认证提供商
  - 定制空间受限

自建 API:      ⭐⭐⭐⭐⭐
  - 完全的独立性
  - 任何时候可替换
  - 无限的定制空间
```

### 维度 4: 已有基础设施利用 ⭐⭐⭐⭐⭐

```
Supabase SDK:  ⭐⭐
  - 浪费后端投资
  - 不使用现有框架
  - 创建冗余系统

自建 API:      ⭐⭐⭐⭐⭐
  - 充分利用现有框架
  - 复用已有的权限系统
  - 一致的技术栈
```

### 维度 5: 实施速度

```
Supabase SDK:  ⭐⭐⭐⭐⭐ (2-3 天)
  + 快速启动
  - 但违反架构

自建 API:      ⭐⭐⭐ (5-7 天)
  + 符合架构
  + 完全控制
  - 多花 3-5 天
```

### 综合评分

| 维度 | 权重 | Supabase | 自建 |
|------|------|---------|------|
| 架构一致性 | 30% | ⭐⭐ (60) | ⭐⭐⭐⭐⭐ (150) |
| Creator 适配 | 25% | ⭐⭐⭐ (75) | ⭐⭐⭐⭐⭐ (125) |
| 长期价值 | 25% | ⭐⭐ (50) | ⭐⭐⭐⭐⭐ (125) |
| 基础设施利用 | 15% | ⭐⭐ (30) | ⭐⭐⭐⭐⭐ (75) |
| 实施速度 | 5% | ⭐⭐⭐⭐⭐ (25) | ⭐⭐⭐ (15) |
| **总分** | 100% | **240/500** | **490/500** |

**结论**: 自建 API 在综合评分上明显优势（490 vs 240）。

---

## 🚀 自建认证 API 实施方案

### 架构设计

```
┌─────────────────────────┐
│   Frontend (Web-V2)     │
│  ┌──────────────────┐   │
│  │  /auth/login     │   │
│  │  /auth/signup    │   │
│  │  /auth/logout    │   │
│  └──────────────────┘   │
└────────────┬────────────┘
             │ API 调用
             ▼
┌─────────────────────────┐
│   Backend API           │
│  ┌──────────────────┐   │
│  │ POST /auth/..    │   │
│  │ 认证逻辑         │   │
│  │ Token 生成       │   │
│  │ 权限检查         │   │
│  └──────────────────┘   │
└────────────┬────────────┘
             │ 调用
             ▼
┌─────────────────────────┐
│   Supabase Auth         │
│  ┌──────────────────┐   │
│  │ 密码验证         │   │
│  │ 用户存储         │   │
│  │ 邮件服务         │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

### API 合约定义

```typescript
// POST /api/v1/auth/signup
Request: {
  email: string;
  password: string;
  name?: string;
}
Response: {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

// POST /api/v1/auth/login
Request: {
  email: string;
  password: string;
}
Response: {
  accessToken: string;
  refreshToken: string;
  user: { ... };
}

// POST /api/v1/auth/refresh
Request: {
  refreshToken: string;
}
Response: {
  accessToken: string;
  refreshToken: string;
}

// POST /api/v1/auth/logout
Request: {
  refreshToken: string;
}
Response: {
  ok: boolean;
}

// POST /api/v1/auth/forgot-password
Request: {
  email: string;
}
Response: {
  ok: boolean;
  message: string;
}

// POST /api/v1/auth/reset-password
Request: {
  token: string;
  newPassword: string;
}
Response: {
  ok: boolean;
}
```

### 实施分解（5-7 天）

#### **Week 1 - Day 1: 合约设计和准备**

后端:
```
□ 设计认证 API 合约（POST /api/v1/auth/*)
□ 定义数据模型
  - Account (email, password_hash, created_at, ...)
  - RefreshToken (token, expires_at, ...)
  - PasswordReset (token, email, expires_at, ...)
□ 记录到 contracts/api/v1/auth-contracts.ts
□ 同步到 AGENTS.md
```

前端:
```
□ 创建路由结构
  - app/auth/login/page.tsx
  - app/auth/signup/page.tsx
  - app/auth/forgot-password/page.tsx
  - app/auth/reset-password/page.tsx
□ 创建 AuthContext 框架
```

#### **Week 1 - Day 2-3: 后端核心逻辑**

```
□ 实现 POST /api/v1/auth/signup
  - 输入验证
  - 调用 Supabase 创建用户
  - 生成 access + refresh token
  - 返回用户信息

□ 实现 POST /api/v1/auth/login
  - 输入验证
  - 调用 Supabase 验证密码
  - 生成 access + refresh token
  - 返回用户信息

□ Token 生成逻辑
  - JWT 签名 (HS256 或 RS256)
  - accessToken: 15 分钟过期
  - refreshToken: 7 天过期
  - 包含 sub (user_id), email, roles

□ 集成现有认证框架
  - 使用 SupabaseTokenVerifier
  - 使用权限系统
```

#### **Week 1 - Day 4-5: Token 管理 + 错误处理**

```
□ 实现 POST /api/v1/auth/refresh
  - 验证 refreshToken 有效性
  - 检查过期时间
  - 生成新的 tokens
  - RefreshToken 轮换机制

□ 实现 POST /api/v1/auth/logout
  - 标记 refreshToken 失效
  - 清理会话数据
  - 返回 200 OK

□ 错误处理
  - 400 Bad Request (验证失败)
  - 401 Unauthorized (认证失败)
  - 409 Conflict (用户已存在)
  - 500 Internal Server Error

□ 单元测试
  - signup 成功/失败场景
  - login 成功/失败场景
  - token 刷新
  - token 过期
```

#### **Week 2 - Day 1-3: 密码重置 + 前端集成**

后端:
```
□ 实现 POST /api/v1/auth/forgot-password
  - 输入验证 (email)
  - 生成重置令牌
  - 发送邮件
  - 返回成功确认

□ 实现 POST /api/v1/auth/reset-password
  - 验证重置令牌有效性
  - 检查过期时间
  - 调用 Supabase 更新密码
  - 返回成功

□ 邮件模板
  - 密码重置链接
  - 链接有效期 (1 小时)
```

前端:
```
□ 实现 /auth/login 页面
  - 邮箱 + 密码表单
  - 客户端验证 (Zod)
  - 提交到 POST /auth/login
  - 处理错误
  - 成功后重定向到 /creator/dashboard

□ 实现 /auth/signup 页面
  - 邮箱 + 密码 + 名字表单
  - 密码强度检查
  - 提交到 POST /auth/signup
  - 成功后自动登陆

□ 实现 /auth/forgot-password 页面
  - 邮箱输入
  - 提交邮箱
  - 成功后显示确认

□ 实现 /auth/reset-password 页面
  - 从 URL 获取 token
  - 新密码表单
  - 提交新密码
  - 成功后重定向到 /auth/login
```

#### **Week 2 - Day 4-5: 会话管理 + 路由守卫**

```
□ 会话存储策略
  - accessToken: 内存 + cookie (HttpOnly)
  - refreshToken: 内存 + cookie (HttpOnly, Secure)
  - 防止 XSS + CSRF

□ AuthContext 实现
  - 登陆状态管理
  - Token 刷新逻辑
  - 登出功能
  - useAuth() Hook

□ API Client 集成
  - 自动添加 Authorization header
  - 自动处理 401 → 刷新 token
  - 重试机制

□ 路由守卫
  - ProtectedRoute 高阶组件
  - 未登陆 → 重定向到 /auth/login
  - 已登陆 → 允许访问

□ 集成测试
  - 完整的登陆流程
  - Token 刷新流程
  - 路由守卫测试
```

#### **Week 3 - Day 1-5: 优化 + 安全审计 + 文档**

```
□ 性能优化
  - Token 缓存
  - 请求去重
  - 错误恢复

□ 安全审计
  - XSS 防护检查
  - CSRF 令牌验证
  - Token 过期处理
  - 密码最小要求

□ 文档完善
  - API 文档
  - 前端集成指南
  - 故障排查指南
  - 安全最佳实践

□ E2E 测试
  - 注册 → 登陆 → 更新资料 → 注销
  - 密码重置流程
  - Token 刷新流程
```

---

## 📈 预期成果

### 系统完整性

完成后你将拥有：

```
✅ 完整的用户旅程
   新用户 → 注册 → 登陆 → 使用系统 → 注销

✅ 符合架构的设计
   前端 ← → 后端定义 ← → Supabase 验证
   
✅ Creator Economy 就绪
   支持 C号绑定、多账户关联、离线验证

✅ 长期的控制力
   任何时刻可替换认证提供商

✅ 生产级别的系统
   Token 刷新、安全存储、错误恢复
```

### 用户体系闭环度提升

```
当前: 30% ⚠️
  ❌ 注册: 0%
  ❌ 登陆: 0%
  ❌ 密码重置: 0%
  ✅ 个人资料: 100% (但无入口)

完成后: 100% ✅
  ✅ 注册: 100%
  ✅ 登陆: 100%
  ✅ 密码重置: 100%
  ✅ 个人资料: 100% (有入口)
  ✅ 注销: 100%
```

---

## 🎯 最后的说明

### 为什么我最初推荐了 Supabase SDK

当时的思路是：
```
1. "最快解决问题" → 追求速度
2. "最低风险" → 依赖官方支持
3. "最简单上手" → 易于启动
```

这在**通用 SaaS 项目**中是正确的。

### 但你的项目不同

```
PCI 特点:
  - Creator Economy 底层操作系统
  - 后端契约优先的架构
  - 需要特殊的认证定制
  - 长期的战略独立性

在这些特点下:
  - 速度的优势 ↓ (3-5 天差异不重要)
  - 架构一致性的价值 ↑ (长期收益高)
  - 完全控制的价值 ↑ (战略需求)
```

### 结论

对于 PCI 这样的项目，**自建认证 API 是正确的决策**。

不是为了更快，而是为了更好的长期收益。

---

## ✅ 行动计划

### 立即行动（本周）

```
□ 确认决策（已做）
□ 设计 API 合约
  - 定义端点
  - 定义数据模型
  - 定义错误处理
□ 创建 Issue
□ 分配资源
```

### 短期计划（1-2 周）

```
□ Week 1: 后端核心 API
  - signup + login + logout
  - Token 生成和验证
  - 错误处理

□ Week 2: 前端实现
  - 登陆/注册页面
  - 会话管理
  - 路由守卫
  
□ 集成测试
```

### 中期计划（3-4 周）

```
□ 密码重置流程
□ 邮件验证
□ OAuth 集成
□ 性能优化
```

---

## 📚 相关文档

- `docs/91_User_Auth_System_Closure_Analysis.md` - 完整分析
- `docs/92_Auth_System_Closure_Quick_Reference.md` - 快速参考
- 本文档 - 设计决策

---

**决策状态**: ✅ 确认  
**优先级**: 🔴 最高  
**开始时间**: 建议本周启动  
**预计完成**: 2-3 周（MVP）+ 1 周（完整）

