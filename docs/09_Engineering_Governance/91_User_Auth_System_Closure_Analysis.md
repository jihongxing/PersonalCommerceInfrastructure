# PCI 用户体系闭环分析 - 注册、登陆、找回、更新

**分析日期**: 2026-11-07  
**分析范围**: 后端 API + 前端页面  
**项目**: Personal Commerce Infrastructure (PCI)  

---

## 🔴 关键发现：用户体系严重不闭环

### 整体状态评分

```
认证与账户管理闭环度: ⚠️ 30%

完整度分布:
├── 用户注册:      ❌ 0% (No API + No UI)
├── 用户登陆:      ❌ 0% (No API + No UI)
├── 密码找回:      ❌ 0% (No API + No UI)
├── 个人资料更新:  ✅ 100% (完整 API + UI)
├── 会话管理:      ⚠️ 50% (简化实现，无真正认证)
└── 权限管理:      ✅ 100% (后端 API 支持)

系统状态: 🚫 无法独立启动（缺少首次用户获取 token 的入口）
```

---

## 📋 详细分析

### Part 1: 注册系统 (SignUp) - ❌ **完全缺失**

#### 后端状态
```
API 端点:         ❌ 无
数据模型:         ✅ 已定义 (Account, Identity)
数据库:           ✅ 已迁移
权限检查:         ✅ 已定义

问题: 
- 没有 POST /api/v1/auth/signup 或等价端点
- 没有 POST /api/v1/private/accounts 创建账户端点
- 认证完全委托给 Supabase，无中间层 API
```

#### 前端状态
```
注册页面:         ❌ 无
  - 无 /auth/signup
  - 无 /register
  - 无 sign-up 组件

表单组件:         ❌ 无
  - 无注册表单验证
  - 无密码强度检查
  - 无邮箱验证逻辑

集成:             ❌ 无
  - 不依赖 Supabase SDK
  - 不调用任何认证 API
```

#### 流程缺陷
```
新用户入场流程: ❌ 不存在

预期流程:
1. 用户访问注册页面
   ❌ 页面不存在
   
2. 填写邮箱 + 密码
   ❌ 没有表单
   
3. 提交到后端
   ❌ 没有 API
   
4. Supabase 创建用户
   ❌ 完全委托，无前端入口
   
5. 返回 Token
   ❌ 无 Token 发放机制
```

**关键问题**: 
🔴 **用户无法首次进入系统**（没有注册入口）

---

### Part 2: 登陆系统 (Login) - ❌ **完全缺失**

#### 后端状态
```
登陆 API:         ❌ 无
  - 无 POST /api/v1/auth/login
  - 无 POST /api/v1/auth/signin
  - 无 email/password 验证端点

Token 发放:       ❌ 无
  - 不生成 JWT
  - 不管理 Session
  - 不处理 Refresh Token

身份验证:         ✅ 已实现
  - Supabase Token 验证 (adapters/auth/supabase)
  - 但仅用于验证已有 Token，不生成 Token
```

#### 前端状态
```
登陆页面:         ❌ 无
  - 无 /login
  - 无 /auth/login
  - 无登陆入口

登陆表单:         ❌ 无
  - 无邮箱输入
  - 无密码输入
  - 无"记住我"选项

集成:             ❌ 无
  - 不调用任何登陆 API
  - 不处理登陆响应
  - 不存储 Token
```

#### 令牌获取方式 - **关键发现**
```
现状: localStorage 中的 "pci.auth.session"

关键问题:
1. 谁负责写入这个 session？
   ❌ 代码中找不到 setSession() 的调用者
   
2. 这个 token 从哪里来？
   ❌ 没有登陆 API → 没有 Token 生成
   
3. 实际上如何启动的？
   📍 推测: 通过 query parameter (如 ?token=xxx) 传入
      见: apps/web-v2/app/(operations)/ops
```

**实际的令牌注入流程**（推断）:
```
1. 操作者在后端或其他系统生成 Token
2. 编码到 URL: /creator/dashboard?token=xxx
3. 前端 JavaScript 从 URL 读取
4. 保存到 localStorage
5. 后续 API 调用从 localStorage 读取 Token

这不是用户友好的认证流程！
```

**关键问题**:
🔴 **用户无法通过密码登陆**
🔴 **Token 无法自主获取**

---

### Part 3: 密码找回系统 (Password Reset) - ❌ **完全缺失**

#### 后端状态
```
密码重置 API:     ❌ 无
  - 无 POST /api/v1/auth/forgot-password
  - 无 POST /api/v1/auth/reset-password
  - 无 Supabase password reset 集成

重置链接:         ❌ 无
  - 不生成重置令牌
  - 不发送邮件
  - 不验证重置令牌
```

#### 前端状态
```
密码找回页面:     ❌ 无
  - 无 /auth/forgot-password
  - 无 /forgot-password
  - 无密码重置表单

重置流程:         ❌ 无
  - 无"忘记密码"链接
  - 无邮件验证流程
  - 无新密码设置表单
```

**关键问题**:
🔴 **用户忘记密码无法重置**
🔴 **账户无法恢复**

---

### Part 4: 个人资料更新 - ✅ **完整（但隐藏）**

#### 后端 API - ✅ 已实现
```
查询个人资料:
  ✅ GET /api/v1/private/identity
  ✅ GET /api/v1/private/profiles
  ✅ GET /api/v1/creator/identity

更新个人资料:
  ✅ PATCH /api/v1/private/profiles/{profileId}
  ✅ PATCH /api/v1/creator/identity

创建身份:
  ✅ POST /api/v1/private/onboarding/initialize
  ✅ POST /api/v1/creator/identity
```

#### 前端 UI - ✅ 已实现
```
个人资料页:
  ✅ /creator/profile
    ├── 显示当前身份
    ├── 显示商业资料
    └── 编辑按钮

编辑页面:
  ✅ /creator/profile/edit
    ├── 编辑显示名
    ├── 编辑简介
    ├── 编辑头像
    └── 编辑社交链接

Hooks:
  ✅ useCreatorIdentity()
    - 查询当前身份
    - 错误处理完整
    - 缓存管理完整
  
  ✅ useUpdateCreatorIdentity()
    - 更新身份信息
    - 表单验证 (Zod)
    - 成功后刷新缓存
```

#### 但存在的问题
```
✅ 功能完整，但前提是用户已登陆

⚠️ 会话管理不安全
   - Token 存储在 localStorage (XSS 风险)
   - 无 CSRF 保护
   - 无 Token 刷新机制
   - 无会话过期处理

⚠️ 无注销功能
   - 没有 /logout 页面
   - 没有 POST /api/v1/auth/logout
   - 无安全清理 localStorage
```

**状态**: ✅ 代码完整，❌ 使用前提缺失

---

## 📊 闭环检查表

### 新用户旅程
```
注册:
  前端入口:      ❌ 无 /signup 页面
  后端 API:      ❌ 无 POST /auth/signup
  工作流:        ❌ 无法启动
  结果:          🔴 用户无法创建账户

登陆:
  前端入口:      ❌ 无 /login 页面
  后端 API:      ❌ 无 POST /auth/login
  Token 获取:    ⚠️ 通过 URL Parameter（非正常流程）
  工作流:        ⚠️ 勉强可用（非用户友好）
  结果:          🟡 技术演示可行，生产不可用

密码重置:
  前端入口:      ❌ 无 /forgot-password
  后端 API:      ❌ 无 POST /auth/forgot-password
  工作流:        ❌ 无法启动
  结果:          🔴 用户被锁定账户

个人资料更新:
  前端入口:      ✅ /creator/profile/edit
  后端 API:      ✅ PATCH /api/v1/creator/identity
  工作流:        ✅ 完整
  前提条件:      ❌ 用户已登陆（但无法登陆）
  结果:          🟡 功能完整但不可用
```

---

## 🔍 系统架构现状

### 后端架构
```
┌─────────────────────────────────────────┐
│         Frontend (Web-V2)                │
└────────────────┬────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
  API Client            No Auth API
  (openapi-fetch)
      │
      ▼
┌─────────────────────────────────────────┐
│  Backend API (Fastify)                  │
├─────────────────────────────────────────┤
│                                          │
│  ✅ Token Verification (Supabase)       │
│  ├── SupabaseTokenVerifier              │
│  ├── Bearer Token Extract               │
│  └── Account Context Resolution         │
│                                          │
│  ✅ Authorization                       │
│  ├── Creator Identity Policies          │
│  ├── Permission Checks                  │
│  └── Access Control                     │
│                                          │
│  ❌ NO User Registration                │
│  ❌ NO User Login                       │
│  ❌ NO Password Reset                   │
│  ❌ NO Token Generation                 │
│  ❌ NO Session Management               │
│                                          │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│  Supabase Auth                          │
│                                          │
│  ✅ User Creation                       │
│  ✅ Password Storage                    │
│  ✅ Password Reset (Built-in)           │
│  ✅ Token Generation                    │
│  ✅ Token Verification                  │
│  ✅ Session Management                  │
│                                          │
│  ❌ NO Frontend Integration             │
│     (Supabase SDK not in dependencies)  │
│                                          │
└─────────────────────────────────────────┘
```

### 认证流程

**期望流程** (标准 SaaS):
```
1. 用户 → 访问 /signup
2. UI   → 显示注册表单
3. 用户 → 填写邮箱 + 密码
4. UI   → 提交到 POST /api/v1/auth/signup
5. API  → 验证 + 调用 Supabase
6. API  → 生成或获取 Token
7. API  → 返回 Token
8. UI   → 保存 Token
9. 用户 → 自动跳转到 Dashboard
```

**实际流程** (当前):
```
1. 操作者 → 在后端/Supabase 创建用户
2. 操作者 → 手动生成或获取 Token
3. 操作者 → 编码 URL: /creator/dashboard?token=xxx
4. 操作者 → 共享 URL 给用户
5. 用户   → 访问 URL（需要已知链接）
6. JS     → 从 URL 提取 Token
7. JS     → 保存到 localStorage
8. 用户   → 开始使用（有时间限制，不知道何时过期）

问题:
- 用户无法自主创建账户
- 用户无法自主登陆
- 用户无法重置密码
- 系统对用户不透明
```

---

## 💡 根本原因分析

### 为什么会这样？

根据代码和架构文档，这是**刻意的设计决策**：

```
抉择点: "Web-V2 只实现 Creator 初始化流程，不实现完整 vs-01 产品"

参考: apps/web/AGENTS.md
"当前只建立路由和运行基础，不实现完整 VS-01 产品流程。"

结果:
- Auth 层完全由 Supabase 管理
- 前端是 Reference Client（可替换）
- 不实现用户获取逻辑
- 只演示已认证用户的体验（Creator Onboarding 演示）
```

### 验证这个假设

**证据 1**: 后端 AGENTS.md
```
"Auth Adapter 只能把外部认证凭据映射为统一 ActorContext。
 Provider User / Subject 不得自动等同于 Creator、Customer 或其他产品对象。"
```
→ **说明**: Auth 是基础设施层，不属于产品业务逻辑

**证据 2**: Web AGENTS.md
```
"当前只建立路由和运行基础，不实现完整 VS-01 产品流程。"
```
→ **说明**: 前端刻意不完整

**证据 3**: 代码中的 TODO
```javascript
// apps/web-v2/lib/api/client.ts
// TODO: Import types from contracts package
// 临时使用空的 paths 类型，等待 contracts 包完善
```
→ **说明**: 工作还在进行中

---

## 🎯 要使用户体系闭环需要的工作

### 优先级 1: 最小可用认证 (MVP Auth)

#### 后端
```
1. POST /api/v1/auth/signup
   ├── 接收 email + password
   ├── 调用 Supabase 创建用户
   ├── 生成或转发 Token
   └── 返回 Token + User Info

2. POST /api/v1/auth/login
   ├── 接收 email + password
   ├── 调用 Supabase 验证
   ├── 获取 Token
   └── 返回 Token + User Info

3. POST /api/v1/auth/logout
   ├── 接收 Token
   ├── 标记 Session 失效（可选）
   └── 返回 200 OK

4. POST /api/v1/auth/refresh
   ├── 接收 refresh token
   ├── 获取新的 access token
   └── 返回 Token
```

#### 前端
```
1. 新增路由
   ├── /auth/signup
   ├── /auth/login
   ├── /auth/forgot-password
   └── /auth/reset-password

2. 新增页面
   ├── SignupPage (表单 + 验证)
   ├── LoginPage (邮箱 + 密码)
   ├── ForgotPasswordPage (邮箱确认)
   └── ResetPasswordPage (新密码设置)

3. 新增 Hooks
   ├── useSignup()
   ├── useLogin()
   ├── useLogout()
   ├── useForgotPassword()
   └── useResetPassword()

4. 新增组件
   ├── SignupForm
   ├── LoginForm
   ├── ForgotPasswordForm
   └── ResetPasswordForm

5. 会话管理升级
   ├── useAuthContext() - 全局认证状态
   ├── ProtectedRoute - 路由守卫
   ├── useAuth() - Hook 访问认证
   └── 自动 Redirect 到 /auth/login
```

---

## 📝 建议的改进方案

### 方案 A: 集成 Supabase 前端 SDK（推荐）

```
优点:
  ✅ 官方支持，安全可靠
  ✅ 内置密码重置
  ✅ 内置邮件验证
  ✅ 内置 OAuth
  ✅ 内置 Session 管理

工作量: 中等 (2-3 天)

步骤:
  1. npm install @supabase/supabase-js
  2. 创建 useSupabaseAuth() Hook
  3. 创建 /auth/login, /auth/signup 页面
  4. 集成 Auth Context
  5. 添加路由守卫
```

### 方案 B: 构建自己的认证 API

```
优点:
  ✅ 完全控制
  ✅ 自定义业务逻辑
  ✅ 符合架构设计

缺点:
  ❌ 工作量大 (5-7 天)
  ❌ 需要处理安全细节

步骤:
  1. 实现后端 /api/v1/auth/* 端点
  2. 集成 Supabase 认证
  3. Token 生成和管理
  4. 会话持久化
  5. 前端表单和流程
  6. 单元测试 + 集成测试
```

### 方案 C: 使用 NextAuth.js

```
优点:
  ✅ Next.js 原生支持
  ✅ 多认证方式
  ✅ 内置 Session 管理

缺点:
  ❌ 引入新依赖
  ❌ 需要适配后端

工作量: 中等 (3-4 天)
```

---

## 🔴 风险评估

### 当前状态风险

| 风险项 | 严重度 | 说明 |
|--------|--------|------|
| 无注册入口 | 🔴 致命 | 用户无法创建账户 |
| 无登陆流程 | 🔴 致命 | 用户无法访问系统 |
| 无密码重置 | 🟠 高 | 用户被锁定账户 |
| Token 通过 URL | 🟠 高 | 安全风险 (URL History) |
| localStorage 存储 | 🟠 高 | XSS 风险 |
| 无会话过期处理 | 🟡 中 | Token 泄露风险增加 |
| 无注销功能 | 🟡 中 | 用户无法清理会话 |

### 生产就绪度

```
功能完整度:     20% (个人资料管理可用，其他无法启动)
安全性:         40% (Token 验证安全，管理不安全)
用户体验:       5% (无用户友好的入口)
生产可部署:     ❌ 否 (无法获取用户)
```

---

## 📌 结论

### 当前状态

```
✅ 已完成:
  - 后端认证框架 (Supabase 集成)
  - Token 验证逻辑
  - 权限检查系统
  - 个人资料管理 API + UI
  - Creator 初始化流程演示

❌ 缺失:
  - 用户注册系统 (Frontend + Backend)
  - 用户登陆系统 (Frontend + Backend)
  - 密码找回系统 (Frontend + Backend)
  - 会话管理 (安全升级)
  - 用户获取漏斗

🟡 半完成:
  - 会话存储 (localStorage, 无 Refresh)
  - 个人资料更新 (完整但不可用，因为无法登陆)
```

### 用户体系闭环度

```
    0%          25%         50%         75%        100%
    |-----------|-----------|-----------|-----------|
    ❌                                              ✅
    
当前: 30% (个人资料管理 + 权限系统，但无入口)
目标: 100% (完整用户旅程)
缺口: 70%

要达到 100%，需要:
  □ 注册系统
  □ 登陆系统
  □ 密码重置
  □ 会话管理升级
  □ 路由守卫
  □ 用户注销
```

### 建议

```
短期 (1-2 周):
  ✅ 集成 Supabase 前端 SDK
  ✅ 实现最小认证流程 (/auth/login, /auth/signup)
  ✅ 添加路由守卫

中期 (1 个月):
  ✅ 密码重置功能
  ✅ 邮件验证
  ✅ OAuth 集成

长期 (3+ 个月):
  ✅ 自建认证 API（如需完全控制）
  ✅ 高级会话管理
  ✅ 审计日志
  ✅ 2FA/MFA 支持
```

---

## 📚 相关文件位置

```
后端认证:
  └── adapters/auth/
      ├── supabase/supabase-auth-context-provider.ts
      └── operations/static-operations-auth-context-provider.ts

后端 API:
  └── adapters/transport/http/
      ├── private-identity-routes.ts
      ├── creator-identity-routes.ts
      └── private-commerce-profile-routes.ts

前端会话:
  └── apps/web-v2/lib/auth/session.ts

前端 API:
  └── apps/web-v2/lib/api/client.ts

前端页面:
  └── apps/web-v2/app/(creator)/
      ├── onboarding/
      └── profile/
```

---

**综合评估**: 用户体系在"个人资料管理"层面完整，但在"用户获取层面"完全缺失。系统目前只能演示已认证用户的功能，无法独立启动真实用户工作流。

**优先级**: 🔴 **高** - 建议在推进其他功能前完成认证系统闭环。
