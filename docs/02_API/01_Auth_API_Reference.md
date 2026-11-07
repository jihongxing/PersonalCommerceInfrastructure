# PCI 认证系统 API 文档

## 概述

PCI (Personal Commerce Infrastructure) 认证系统提供完整的用户身份验证和授权解决方案。

**基础 URL**: `https://api.yourapp.com/api/v1`  
**协议**: HTTPS 仅  
**认证**: Bearer Token (JWT)

---

## 核心概念

### Token 类型

#### AccessToken (访问令牌)
- **有效期**: 15 分钟
- **用途**: 访问受保护资源
- **存储**: 建议内存存储
- **格式**: JWT (HS256)

#### RefreshToken (刷新令牌)
- **有效期**: 7 天
- **用途**: 获取新的 AccessToken
- **存储**: 安全的服务器端存储
- **格式**: JWT (HS256)

#### ResetToken (重置令牌)
- **有效期**: 1 小时
- **用途**: 重置密码
- **传输**: 邮件链接
- **格式**: Base64URL 编码

### 密码要求

所有密码必须满足以下要求 (OWASP 标准):

- 最少 8 字符
- 包含大写字母 (A-Z)
- 包含小写字母 (a-z)
- 包含数字 (0-9)
- 包含特殊字符 (!@#$%^&*等)

**示例**:
```
✅ SecurePass123!
✅ MyP@ssw0rd
✅ Test1234!

❌ weak (太短)
❌ NoDigits! (无数字)
❌ NoUppercase123! (无大写)
❌ NOLOWERCASE123! (无小写)
❌ NoSpecial123 (无特号)
```

---

## API 端点

### 1. 用户注册 (Signup)

**请求**:
```http
POST /auth/signup HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**成功响应** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "user-123",
    "email": "user@example.com"
  }
}
```

**错误响应** (400 Bad Request):
```json
{
  "category": "validation",
  "code": "invalid_email",
  "message": "Invalid email format"
}
```

**验证规则**:
- 邮箱格式有效
- 密码符合强度要求
- 邮箱未被注册

---

### 2. 用户登陆 (Login)

**请求**:
```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**成功响应** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "lastLoginAt": "2026-11-07T15:30:00Z"
  }
}
```

**错误响应** (401 Unauthorized):
```json
{
  "category": "authentication",
  "code": "invalid_credentials",
  "message": "Invalid email or password"
}
```

---

### 3. Token 刷新 (Refresh)

**请求**:
```http
POST /auth/refresh HTTP/1.1
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**成功响应** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**错误响应** (401 Unauthorized):
```json
{
  "category": "authentication",
  "code": "invalid_token",
  "message": "Invalid or expired refresh token"
}
```

---

### 4. 用户登出 (Logout)

**请求**:
```http
POST /auth/logout HTTP/1.1
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**成功响应** (200 OK):
```json
{
  "ok": true
}
```

**说明**:
- 如果提供了 refreshToken，将其标记为已撤销
- 前端应该删除本地存储的所有 tokens
- 即使 refreshToken 无效，也返回成功

---

### 5. 忘记密码 (Forgot Password)

**请求**:
```http
POST /auth/forgot-password HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**成功响应** (200 OK):
```json
{
  "message": "If an account with that email exists, a password reset link has been sent"
}
```

**说明**:
- 总是返回成功，即使邮箱不存在（防邮箱枚举）
- 发送重置邮件到该邮箱
- 邮件中包含重置链接，有效期 1 小时
- 链接格式: `https://app.com/reset-password?token={resetToken}`

---

### 6. 重置密码 (Reset Password)

**请求**:
```http
POST /auth/reset-password HTTP/1.1
Content-Type: application/json

{
  "token": "aB1cD2eF3gH4iJ5kL6mN7oPqRsTuVwXyZ0",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**成功响应** (200 OK):
```json
{
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

**错误响应** (400 Bad Request):
```json
{
  "category": "validation",
  "code": "password_mismatch",
  "message": "Passwords do not match"
}
```

**或** (401 Unauthorized):
```json
{
  "category": "authentication",
  "code": "invalid_reset_token",
  "message": "Invalid or expired reset token"
}
```

---

## 认证头使用

所有需要认证的端点都需要在请求头中包含 Bearer Token:

```http
GET /api/v1/protected-resource HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 缺失认证头

```json
{
  "category": "authentication",
  "code": "missing_authorization",
  "message": "Authentication is required."
}
```

### 无效认证头

```json
{
  "category": "authentication",
  "code": "invalid_authorization",
  "message": "Authentication could not be verified."
}
```

---

## 错误代码参考

### 验证错误 (Validation)

| 代码 | 说明 |
|------|------|
| `invalid_email` | 邮箱格式无效 |
| `invalid_password` | 密码格式无效 |
| `weak_password` | 密码强度不足 |
| `password_mismatch` | 密码不匹配 |

### 认证错误 (Authentication)

| 代码 | 说明 |
|------|------|
| `missing_authorization` | 缺失 Authorization 头 |
| `invalid_authorization` | Authorization 头无效 |
| `invalid_credentials` | 邮箱或密码错误 |
| `invalid_token` | Token 无效或已过期 |
| `invalid_reset_token` | 重置 token 无效或已过期 |

### 业务错误 (Business)

| 代码 | 说明 |
|------|------|
| `email_already_exists` | 邮箱已被注册 |
| `account_disabled` | 账户已被禁用 |
| `token_revoked` | Token 已被撤销 |

---

## 前端集成指南

### 1. 初始化

```typescript
// 创建 API 客户端
const api = new AuthClient({
  baseUrl: 'https://api.yourapp.com/api/v1',
  tokenStorage: 'memory' // 或 'sessionStorage'
});

// 恢复以前的会话（如果存在）
await api.restoreSession();
```

### 2. 注册用户

```typescript
try {
  const result = await api.signup({
    email: 'user@example.com',
    password: 'SecurePass123!'
  });

  // 成功：tokens 已自动存储
  console.log('User created:', result.user);
} catch (error) {
  // 处理错误
  console.error('Signup failed:', error.message);
}
```

### 3. 登陆用户

```typescript
try {
  const result = await api.login({
    email: 'user@example.com',
    password: 'SecurePass123!'
  });

  // 成功：tokens 已自动存储
  console.log('Logged in:', result.user);

  // 重定向到仪表板
  navigate('/dashboard');
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### 4. 自动 Token 刷新

```typescript
// API 客户端会自动处理 token 刷新
// 当 access token 即将过期时（剩余 < 1 分钟）

// 如果手动需要刷新：
await api.refresh();
```

### 5. 使用认证的 API

```typescript
// API 客户端会自动在请求头中添加 Authorization
const response = await api.get('/protected-resource');

// 如果 token 无效，会自动：
// 1. 尝试刷新
// 2. 失败则重定向到登陆
```

### 6. 登出用户

```typescript
await api.logout();

// tokens 已清理
// 重定向到登陆页面
navigate('/login');
```

### 7. 重置密码

```typescript
// 第一步：请求重置
await api.forgotPassword({ email: 'user@example.com' });
// 用户检查邮件

// 第二步：使用链接中的 token 重置
const token = new URLSearchParams(window.location.search).get('token');

try {
  await api.resetPassword({
    token,
    newPassword: 'NewSecurePass456!',
    confirmPassword: 'NewSecurePass456!'
  });

  console.log('Password reset successful');
  navigate('/login');
} catch (error) {
  console.error('Password reset failed:', error.message);
}
```

---

## 安全建议

### 1. Token 存储

✅ **推荐**: 内存存储
```typescript
// 最安全，刷新页面时丢失（需要重新登陆）
let tokens = { accessToken: null, refreshToken: null };
```

⚠️ **次选**: SessionStorage
```typescript
// 页面会话内持久化，页面关闭时清理
sessionStorage.setItem('accessToken', token);
```

❌ **不推荐**: LocalStorage
```typescript
// XSS 攻击会暴露 tokens
// 仅在使用 HttpOnly Cookies 时才可考虑
```

### 2. HTTPS 要求

- 所有认证请求必须使用 HTTPS
- HTTP 请求将被拒绝

### 3. CORS 配置

```typescript
// 仅允许已知的前端域名
const corsOrigins = [
  'https://yourapp.com',
  'https://www.yourapp.com'
];
```

### 4. 速率限制

```
POST /auth/login: 10 requests per 15 minutes per IP
POST /auth/forgot-password: 5 requests per hour per email
POST /auth/reset-password: 3 requests per hour per token
```

### 5. 敏感信息

- 永远不要在 URL 中包含密码
- 永远不要在日志中记录完整 tokens
- 永远不要在前端代码中硬编码 API 密钥

### 6. Token 过期处理

```typescript
// 监控 token 过期时间
const checkTokenExpiry = () => {
  const expiresIn = getTokenExpiryTime();
  
  if (expiresIn < 60) { // 剩余 < 1 分钟
    // 自动刷新
    refresh();
  } else if (expiresIn < 0) { // 已过期
    // 强制重新登陆
    logout();
    navigate('/login');
  }
};

// 定期检查
setInterval(checkTokenExpiry, 30000); // 每 30 秒检查
```

---

## 常见问题

### Q: 如何处理 401 错误？

**A**: 当收到 401 Unauthorized 时：
1. 尝试使用 refreshToken 刷新 accessToken
2. 如果刷新成功，重试原始请求
3. 如果刷新失败，清理所有 tokens 并重定向到登陆页面

### Q: 是否可以同时使用多个 refreshTokens？

**A**: 可以。支持多设备登陆，每个设备有独立的 refreshToken。登出时可以选择：
- 单个 token 登出（仅该设备）
- 全部 token 登出（所有设备）

### Q: 重置密码时是否会清理旧 tokens？

**A**: 是的（可选）。为了安全，建议在密码重置时撤销该用户的所有 refresh tokens，强制用户在所有设备上重新登陆。

### Q: Token 可以手动过期吗？

**A**: 可以。通过调用 logout 端点，将 refreshToken 标记为已撤销。AccessToken 本身无法手动过期（只能等待自然过期）。

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-11-07 | 初始版本 |

