# PCI 认证系统 - 本地手工验收指南

**日期**: 2026-11-07  
**状态**: 准备本地验收  
**环境**: Windows + Podman + PostgreSQL + Node.js

---

## 📋 本地部署状态

### ✅ 已完成

1. **数据库准备**
   - ✅ Podman PostgreSQL 容器运行
     - 容器名: `pci-postgres`
     - 端口: 5432
     - 用户: `pci_user`
     - 密码: `pci_local_pass`
     - 数据库: `pci_auth`
   
   - ✅ 认证系统表已创建
     - `accounts` - 用户账户表
     - `refresh_tokens` - Token 刷新表
     - `password_resets` - 密码重置表
     - 所有索引和触发器已就绪

2. **项目结构**
   - ✅ Monorepo 结构识别
     - 前端: `apps/web-v2` (Next.js)
     - 后端: `apps/api` (Node.js/TypeScript)
     - 核心库: Root
   
   - ✅ 环境变量配置
     - 文件: `.env.local`
     - 数据库 URL 已配置
     - Email 提供商设为 Mock (本地测试)
     - JWT 密钥已生成

3. **依赖安装**
   - ✅ `pnpm install` 完成
   - ✅ 所有 npm 包已就绪

---

## 🚀 本地启动步骤

### Step 1: 验证数据库连接

```bash
# 从项目根目录执行
podman exec pci-postgres psql -U pci_user -d pci_auth -c "SELECT COUNT(*) FROM accounts;"

# 预期输出:
# count
# -------
#     0
# (1 row)
```

### Step 2: 启动后端 API 服务器

```bash
# 从项目根目录执行
cd /d/codeSpace/PersonalCommerceInfrastructure
pnpm run dev:api

# 预期输出:
# 服务器监听在 http://localhost:8080
# API 准备就绪
```

**故障排查**:
- 如果有 TypeScript 编译错误，尝试先运行 `pnpm run build --filter @personal-commerce/api`
- 如果端口已被占用，检查现有进程: `lsof -i :8080`

### Step 3: 启动前端开发服务器（新终端）

```bash
# 从项目 apps/web-v2 目录执行
cd /d/codeSpace/PersonalCommerceInfrastructure/apps/web-v2
pnpm run dev -- -p 3000

# 预期输出:
# ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**故障排查**:
- 如果 3000 端口被占用，使用不同端口: `pnpm run dev -- -p 3001`
- 检查 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 是否指向正确的后端

### Step 4: 打开浏览器访问

```
http://localhost:3000
```

---

## ✅ 手工验收检查清单

### 认证流程验证

#### 1. 注册流程

**路径**: `http://localhost:3000/auth/signup`

**验收标准**:
- [ ] 页面成功加载
- [ ] 表单显示所有字段 (邮箱、密码、确认密码、名称)
- [ ] 密码强度实时显示 (弱/中等/强)
- [ ] 密码要求显示正确 (≥8字符、大小写、数字)
- [ ] 提交按钮可点击
- [ ] 提交后成功创建账户
- [ ] 重定向到 dashboard 或登陆页面

**测试数据**:
```
邮箱: testuser@example.com
密码: SecurePassword123!
名称: Test User
```

**验证SQL**:
```bash
podman exec pci-postgres psql -U pci_user -d pci_auth -c "SELECT email, name FROM accounts WHERE email='testuser@example.com';"
```

#### 2. 登陆流程

**路径**: `http://localhost:3000/auth/login`

**验收标准**:
- [ ] 页面成功加载
- [ ] 表单显示邮箱和密码字段
- [ ] 输入注册用户的凭证
- [ ] 提交成功
- [ ] Token 存储到 localStorage
- [ ] 重定向到 dashboard

**测试数据**:
```
邮箱: testuser@example.com
密码: SecurePassword123!
```

**验证浏览器**:
- F12 开启开发者工具
- Application → LocalStorage → http://localhost:3000
- 查看 `auth_session` 中的 accessToken

#### 3. API 拦截器验证

**方法**:
1. 登陆后打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 访问任何受保护的页面
4. 查看请求头是否包含 `Authorization: Bearer <token>`

**验收标准**:
- [ ] 所有 API 请求都包含 Bearer Token
- [ ] 401 响应时自动刷新 token
- [ ] 成功重试原始请求

#### 4. 密码重置流程

**路径**: `http://localhost:3000/auth/forgot-password`

**验收标准**:
- [ ] 页面成功加载
- [ ] 输入邮箱地址
- [ ] 提交后显示成功消息
- [ ] 检查控制台日志中是否有模拟邮件信息 (EMAIL_PROVIDER=mock)

**在后端日志中查找**:
```
邮件已发送到: testuser@example.com
重置链接: /auth/reset-password?token=<token>
```

#### 5. 重置密码流程

**路径**: `http://localhost:3000/auth/reset-password?token=<reset-token>`

**验收标准**:
- [ ] 页面成功加载
- [ ] 输入新密码
- [ ] 密码强度检查生效
- [ ] 提交成功
- [ ] 可用新密码登陆

---

## 🧪 自动化测试验收

### 单元测试

```bash
cd /d/codeSpace/PersonalCommerceInfrastructure

# 运行所有测试
pnpm run test

# 预期结果
# ✅ 211 个测试通过
# ✅ 95%+ 代码覆盖率
```

### E2E 用户旅程测试

```bash
# 仅运行 E2E 测试
pnpm run test tests/user-journey-e2e.test.ts

# 预期结果
# ✅ 22 个用户旅程测试通过
```

### 安全测试

```bash
# 运行安全审计测试
pnpm run test tests/security.test.ts

# 预期结果
# ✅ 31 个安全测试通过
```

### 性能优化测试

```bash
# 运行优化测试
pnpm run test tests/optimization.test.ts

# 预期结果
# ✅ 17 个性能测试通过
```

---

## 🔍 数据库验证

### 检查用户账户

```bash
podman exec pci-postgres psql -U pci_user -d pci_auth << 'EOF'
SELECT id, email, name, is_active, created_at FROM accounts;
EOF
```

### 检查 Refresh Token

```bash
podman exec pci-postgres psql -U pci_user -d pci_auth << 'EOF'
SELECT rt.id, rt.account_id, rt.is_revoked, rt.expires_at 
FROM refresh_tokens rt 
JOIN accounts a ON rt.account_id = a.id
LIMIT 5;
EOF
```

### 检查密码重置请求

```bash
podman exec pci-postgres psql -U pci_user -d pci_auth << 'EOF'
SELECT id, email, is_used, expires_at FROM password_resets LIMIT 5;
EOF
```

---

## 📊 性能验收

### 响应时间基准

使用浏览器开发者工具网络标签测试:

- [ ] 登陆请求: < 500ms
- [ ] Token 刷新: < 100ms
- [ ] 获取用户信息: < 200ms
- [ ] 发送密码重置: < 300ms

### 错误处理

- [ ] 无效凭证返回 401
- [ ] 用户不存在返回 404
- [ ] 速率限制返回 429
- [ ] 服务器错误返回 500

---

## 🔐 安全验收

### XSS 防护

在浏览器控制台测试:
```javascript
// 试图在表单中输入 XSS 脚本
<script>alert('XSS')</script>

// 验证: 应该被转义或清理
```

### CSRF 防护

- [ ] 检查请求头中是否有 CSRF Token
- [ ] 修改 Token 后请求应该失败

### 密码强度

- [ ] 弱密码 (< 8 字符) 被拒绝
- [ ] 无大写字母被提示
- [ ] 无数字被提示
- [ ] 强密码 (8+ 字符，混合大小写数字) 被接受

### 速率限制

测试在 1 分钟内发送超过 5 个请求:
- [ ] 第 6 个请求返回 429
- [ ] 重试提示显示倒计时

---

## 📝 验收结果记录

### 功能验收

| 功能 | 状态 | 备注 |
|------|------|------|
| 用户注册 | [ ] | |
| 用户登陆 | [ ] | |
| Token 刷新 | [ ] | |
| 用户登出 | [ ] | |
| 密码重置 | [ ] | |
| API 拦截器 | [ ] | |

### 测试验收

| 测试类型 | 通过数 | 失败数 | 覆盖率 | 状态 |
|---------|--------|--------|--------|------|
| 单元测试 | 211 | 0 | 95%+ | [ ] ✅ |
| E2E 用户旅程 | 22 | 0 | - | [ ] ✅ |
| 安全测试 | 31 | 0 | - | [ ] ✅ |
| 优化测试 | 17 | 0 | - | [ ] ✅ |

### 性能验收

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| 登陆响应时间 | < 500ms | | [ ] |
| Token 刷新 | < 100ms | | [ ] |
| 平均 API 响应 | < 200ms | | [ ] |
| 成功率 | > 99% | | [ ] |

---

## 🛠️ 故障排查

### 问题 1: 后端无法连接数据库

```bash
# 检查数据库是否运行
podman ps | grep pci-postgres

# 测试连接
podman exec pci-postgres psql -U pci_user -d pci_auth -c "SELECT 1"

# 解决方案
# - 确保 DATABASE_URL 正确
# - 检查防火墙规则
# - 验证用户名和密码
```

### 问题 2: 前端无法连接后端

```bash
# 检查后端是否运行
curl http://localhost:8080/health

# 检查 .env.local 中的 NEXT_PUBLIC_API_URL
# 应该是: http://localhost:8080/api/v1

# 解决方案
# - 重启后端服务
# - 检查防火墙规则
# - 查看浏览器控制台 CORS 错误
```

### 问题 3: 登陆失败

```bash
# 检查 JWT_SECRET 是否正确设置
echo $JWT_SECRET

# 检查密码是否正确哈希
podman exec pci-postgres psql -U pci_user -d pci_auth -c \
  "SELECT email, password_hash FROM accounts LIMIT 1;"

# 查看后端日志获取详细错误
```

### 问题 4: Token 刷新失败

```bash
# 检查 refresh_token 是否过期
podman exec pci-postgres psql -U pci_user -d pci_auth -c \
  "SELECT expires_at FROM refresh_tokens WHERE is_revoked=false LIMIT 1;"

# 解决方案
# - 重新登陆获取新 Token
# - 检查系统时钟是否正确
```

---

## 📞 支持

遇到问题?

1. 查看后端日志 (pnpm run dev:api 输出)
2. 查看前端浏览器控制台 (F12)
3. 查看数据库日志 (podman logs pci-postgres)
4. 检查 `.env.local` 配置是否正确

---

## 🎯 验收完成标准

系统可视为已通过验收当：

- ✅ 所有功能测试通过
- ✅ 所有自动化测试通过 (211/211)
- ✅ 性能指标达标
- ✅ 安全检查通过
- ✅ 数据库操作正常
- ✅ 没有关键错误或安全问题

---

**准备好开始验收了！** 🚀

按照上述步骤启动服务并执行测试，记录所有结果到上面的检查清单。
