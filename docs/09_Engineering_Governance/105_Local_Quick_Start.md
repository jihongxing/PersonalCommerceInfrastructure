# PCI 认证系统 - 本地手工验收 - 快速开始

**日期**: 2026-11-07  
**状态**: 本地环境已准备  
**需要手动启动的服务**: 后端 API 模拟服务器 + 前端开发服务器

---

## 🚀 快速启动 (3 步)

### Step 1: 验证数据库

```bash
podman exec pci-postgres psql -U pci_user -d pci_auth -c "SELECT 1"
```

**预期输出**:
```
 ?column? 
----------
        1
(1 row)
```

### Step 2: 启动模拟后端 API (新终端 1)

```bash
cd /d/codeSpace/PersonalCommerceInfrastructure/apps/api-mock
pnpm run dev
```

**预期输出**:
```
✅ Database connected
✅ Mock API server running on http://localhost:8080
📍 Base URL: http://localhost:8080/api/v1
🔗 Health check: http://localhost:8080/health
```

### Step 3: 启动前端开发服务器 (新终端 2)

```bash
cd /d/codeSpace/PersonalCommerceInfrastructure/apps/web-v2
pnpm run dev -- -p 3000
```

**预期输出**:
```
ready - started server on http://localhost:3000
```

### Step 4: 打开浏览器

访问: **http://localhost:3000**

---

## ✅ 验收检查清单

### 1. 注册流程 (user-signup-journey)

**URL**: http://localhost:3000/auth/signup

**步骤**:
1. 输入邮箱: `testuser@example.com`
2. 输入密码: `SecurePassword123!`
3. 确认密码: `SecurePassword123!`
4. 输入名称: `Test User`
5. 点击"Sign Up"

**验收标准**:
- [ ] 页面加载无错误
- [ ] 密码强度显示（弱/中等/强）
- [ ] 提交成功
- [ ] 自动重定向到登陆页面
- [ ] 浏览器 localStorage 中有 token

**数据库验证**:
```bash
podman exec pci-postgres psql -U pci_user -d pci_auth -c \
  "SELECT email, name FROM accounts WHERE email='testuser@example.com';"
```

---

### 2. 登陆流程 (user-login-journey)

**URL**: http://localhost:3000/auth/login

**步骤**:
1. 输入邮箱: `testuser@example.com`
2. 输入密码: `SecurePassword123!`
3. 点击"Sign In"

**验收标准**:
- [ ] 页面加载无错误
- [ ] 登陆成功
- [ ] 自动重定向到 dashboard 或主页
- [ ] localStorage 有 accessToken 和 refreshToken

**浏览器验证** (F12 DevTools):
1. 打开浏览器开发者工具
2. 切换到 Application → LocalStorage
3. 查找 `auth_session` 键
4. 应该包含 `accessToken` 和 `refreshToken`

---

### 3. API 拦截器验证 (api-interceptor-journey)

**步骤**:
1. 登陆后打开 DevTools (F12)
2. 切换到 Network 标签
3. 页面上执行任何操作
4. 查看 API 请求

**验收标准**:
- [ ] 所有 API 请求都包含 `Authorization: Bearer <token>` 头
- [ ] 请求头显示: `Authorization: Bearer eyJhbGc...`
- [ ] 没有 CORS 错误
- [ ] 返回码 200/201 (成功)

---

### 4. 密码重置流程 (password-reset-journey)

**URL**: http://localhost:3000/auth/forgot-password

**步骤**:
1. 输入邮箱: `testuser@example.com`
2. 点击"Send Reset Link"

**验收标准**:
- [ ] 页面加载无错误
- [ ] 提交成功
- [ ] 显示成功消息: "Password reset link sent"

**后端日志验证**:
查看模拟 API 后端的启动终端日志:
```
[EMAIL] Password reset link sent to testuser@example.com
[EMAIL] Reset token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

复制 reset token，然后访问:
**http://localhost:3000/auth/reset-password?token=<PASTE_TOKEN>**

输入新密码并提交:
- [ ] 新密码: `NewPassword@2026`
- [ ] 重置成功
- [ ] 重定向到登陆页面
- [ ] 可用新密码登陆

---

### 5. 用户登出流程 (logout-journey)

**步骤**:
1. 登陆后查找登出按钮
2. 点击登出

**验收标准**:
- [ ] 登出成功
- [ ] localStorage 清空
- [ ] 重定向到登陆页面
- [ ] 无法访问受保护页面

---

## 🧪 自动化测试验收

所有 211 个测试应该通过。运行:

```bash
cd /d/codeSpace/PersonalCommerceInfrastructure
pnpm run test
```

**预期结果**:
```
✅ 211 tests passed
✅ 95%+ coverage
```

按类型运行:
```bash
# 用户旅程 E2E (22 个)
pnpm run test tests/user-journey-e2e.test.ts

# 安全测试 (31 个)
pnpm run test tests/security.test.ts

# 优化测试 (17 个)
pnpm run test tests/optimization.test.ts
```

---

## 📊 性能基准测试

使用浏览器 DevTools 的 Network 标签测试:

**登陆性能**:
1. Network 标签
2. 执行登陆
3. 查看 POST `/api/v1/auth/login` 的时间
4. 应该 < 500ms

**Token 刷新性能**:
1. Network 标签
2. 监控自动刷新请求
3. 应该 < 100ms

---

## 📝 验收结果记录

### 功能验收结果

| 流程 | 完成 | 备注 |
|------|------|------|
| 用户注册 | ☐ | |
| 用户登陆 | ☐ | |
| API 拦截器 | ☐ | |
| 密码重置 | ☐ | |
| 用户登出 | ☐ | |

### 自动化测试结果

| 测试类型 | 预期 | 实际 | 通过 |
|---------|------|------|------|
| 单元测试 | 211 | | ☐ |
| E2E 用户旅程 | 22 | | ☐ |
| 安全测试 | 31 | | ☐ |
| 优化测试 | 17 | | ☐ |

### 性能测试结果

| 操作 | 目标 | 实际 | 达标 |
|------|------|------|------|
| 注册请求 | < 500ms | | ☐ |
| 登陆请求 | < 500ms | | ☐ |
| Token 刷新 | < 100ms | | ☐ |
| API 平均 | < 200ms | | ☐ |

---

## 🛠️ 故障排查

### 问题: 后端 API 无法启动

**症状**: `pnpm run dev` 不输出任何内容，或显示错误

**解决方案**:
```bash
# 1. 检查数据库是否运行
podman ps | grep pci-postgres

# 2. 测试数据库连接
podman exec pci-postgres psql -U pci_user -d pci_auth -c "SELECT 1"

# 3. 检查环境变量
cat ../.env.local | grep DATABASE_URL

# 4. 手动编译并运行
npm install
npm run build
node dist/server.js
```

### 问题: 前端无法连接后端

**症状**: Network 标签显示 CORS 错误或无法连接

**解决方案**:
```bash
# 1. 检查后端是否运行
curl http://localhost:8080/health

# 2. 检查前端环境变量
cat apps/web-v2/.env.local | grep NEXT_PUBLIC_API_URL

# 3. 应该是: http://localhost:8080/api/v1

# 4. 重启前端服务器
```

### 问题: 登陆失败 (401)

**症状**: 登陆返回 "Invalid credentials"

**解决方案**:
```bash
# 1. 检查账户是否存在
podman exec pci-postgres psql -U pci_user -d pci_auth -c \
  "SELECT email FROM accounts WHERE email='testuser@example.com';"

# 2. 如果不存在，需要先注册
# 3. 检查后端日志中是否有错误

# 4. 尝试用另一个邮箱
```

### 问题: localStorage 中没有 token

**症状**: 登陆成功但 localStorage 为空

**解决方案**:
```bash
# 1. 检查浏览器控制台是否有 JavaScript 错误
# F12 → Console 标签

# 2. 检查 AuthContext 是否正确初始化
# 查看 apps/web-v2/lib/auth/context.ts

# 3. 检查响应中是否有 token
# Network 标签 → 登陆请求 → Response
```

---

## 🎯 验收完成标准

系统通过验收需要满足:

✅ **所有 5 个功能流程完成**
- 用户注册
- 用户登陆
- API 拦截器
- 密码重置
- 用户登出

✅ **所有自动化测试通过**
- 211/211 测试通过
- 95%+ 代码覆盖率

✅ **性能指标达标**
- 注册/登陆 < 500ms
- Token 刷新 < 100ms
- 平均响应 < 200ms

✅ **没有关键错误**
- 浏览器控制台无 JavaScript 错误
- Network 标签无红色错误
- 后端日志无异常

---

## 📍 文件位置

**后端模拟 API**:
- `apps/api-mock/src/server.ts` - 模拟 API 服务器
- `apps/api-mock/package.json` - 依赖配置

**前端**:
- `apps/web-v2/app/auth/` - 认证页面
- `apps/web-v2/lib/auth/` - 认证逻辑
- `apps/web-v2/lib/api/` - API 客户端

**数据库**:
- `database/migrations/0100_auth_system.sql` - 认证表结构

**文档**:
- `docs/09_Engineering_Governance/102_Week3_Deployment_Guide.md` - 部署指南
- `docs/09_Engineering_Governance/104_Local_Acceptance_Testing_Guide.md` - 详细验收指南

---

## 🎊 下一步

1. 启动数据库 ✅
2. 启动后端 API ← 你在这里
3. 启动前端服务
4. 打开浏览器开始验收
5. 记录所有结果
6. 提供反馈

**准备好了吗？让我们开始！** 🚀

---

**需要帮助？** 查看故障排查部分或完整验收指南: `docs/09_Engineering_Governance/104_Local_Acceptance_Testing_Guide.md`
