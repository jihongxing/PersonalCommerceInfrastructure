# PCI 认证系统 - 完整部署指南

**版本**: 1.0  
**状态**: 生产就绪 ✅  
**最后更新**: 2026-11-07

---

## 📋 目录

1. [系统架构](#系统架构)
2. [前置要求](#前置要求)
3. [本地开发环境](#本地开发环境)
4. [生产部署](#生产部署)
5. [环境配置](#环境配置)
6. [数据库迁移](#数据库迁移)
7. [监控和日志](#监控和日志)
8. [故障排查](#故障排查)
9. [安全检查清单](#安全检查清单)
10. [性能调优](#性能调优)

---

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                   客户端 (Web)                       │
│  ├─ /auth/signup                                   │
│  ├─ /auth/login                                    │
│  ├─ /auth/forgot-password                          │
│  ├─ /auth/reset-password                           │
│  └─ Protected Routes (AuthContext)                 │
└────────────────────┬────────────────────────────────┘
                     │
            API 拦截器 (Interceptor)
            - 自动添加 Bearer Token
            - 401 自动刷新
                     │
┌────────────────────▼────────────────────────────────┐
│              后端 API (Go + PostgreSQL)              │
│                                                      │
│  ├─ POST /api/v1/auth/signup                       │
│  ├─ POST /api/v1/auth/login                        │
│  ├─ POST /api/v1/auth/refresh                      │
│  ├─ POST /api/v1/auth/logout                       │
│  ├─ POST /api/v1/auth/forgot-password              │
│  └─ POST /api/v1/auth/reset-password               │
│                                                      │
│  ├─ Token Service                                   │
│  ├─ Password Reset Service                          │
│  └─ Email Service                                   │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
     ┌───▼───┐   ┌───▼───┐   ┌──▼────┐
     │PostgreSQL  │Redis  │   │Email   │
     │          │ Cache  │   │Provider│
     └────────┘   └──────┘   └────────┘
```

---

## 前置要求

### 硬件要求

- **最小**: 2GB RAM, 1 CPU, 10GB 存储
- **建议**: 4GB+ RAM, 2+ CPU, 50GB 存储
- **高负载**: 8GB+ RAM, 4+ CPU, 100GB 存储

### 软件要求

```
Go:              1.21+
Node.js:         18+
PostgreSQL:      14+
Redis:           6+ (可选，用于缓存)
Docker:          20.10+ (可选)
```

### 依赖库版本

```json
{
  "backend": {
    "github.com/golang-jwt/jwt": "v4.5.0",
    "github.com/jackc/pgx": "v5.0.0"
  },
  "frontend": {
    "next": "14.0.0",
    "react": "18.0.0",
    "typescript": "5.0.0",
    "openapi-fetch": "1.0.0"
  }
}
```

---

## 本地开发环境

### 1. 克隆仓库

```bash
git clone <repository-url>
cd PersonalCommerceInfrastructure
```

### 2. 后端设置

```bash
# 创建 .env 文件
cat > .env << EOF
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/pci_auth"

# JWT Secret
JWT_SECRET="your-super-secret-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this"

# Email 配置
EMAIL_PROVIDER="mock"  # 开发用
SENDGRID_API_KEY=""    # 生产用

# 服务
PORT=8080
ENVIRONMENT=development
EOF

# 安装依赖
go mod download

# 运行数据库迁移
go run ./cmd/migrate up

# 启动后端服务
go run ./cmd/server
```

### 3. 前端设置

```bash
cd apps/web-v2

# 创建 .env.local 文件
cat > .env.local << EOF
NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

# 安装依赖
pnpm install

# 生成 API 客户端
pnpm run generate-api

# 启动前端服务
pnpm run dev
```

### 4. 测试

```bash
# 后端测试
cd ../../
go test ./...

# 前端测试
cd apps/web-v2
pnpm test

# 完整集成测试
cd ../../
pnpm run test
```

---

## 生产部署

### Docker 部署

#### 1. 构建 Docker 镜像

```bash
# 后端镜像
docker build -f Dockerfile.backend -t pci-auth-backend:1.0 .

# 前端镜像
docker build -f Dockerfile.frontend -t pci-auth-web:1.0 .
```

#### 2. Docker Compose

```yaml
version: '3.8'

services:
  backend:
    image: pci-auth-backend:1.0
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/pci_auth
      - JWT_SECRET=${JWT_SECRET}
      - EMAIL_PROVIDER=sendgrid
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    image: pci-auth-web:1.0
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
    depends_on:
      - backend

  postgres:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=pci_auth
      - POSTGRES_USER=pci_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 3. 部署命令

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 运行数据库迁移
docker-compose exec backend go run ./cmd/migrate up

# 停止服务
docker-compose down
```

### Kubernetes 部署

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pci-auth-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pci-auth-backend
  template:
    metadata:
      labels:
        app: pci-auth-backend
    spec:
      containers:
      - name: backend
        image: pci-auth-backend:1.0
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: pci-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: pci-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## 环境配置

### 后端环境变量

```bash
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/database
TEST_DATABASE_URL=postgresql://user:password@host:5432/test_db

# JWT
JWT_SECRET=your-secret-key-min-32-chars-long
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRY=900           # 15 分钟
JWT_REFRESH_EXPIRY=604800 # 7 天

# Email
EMAIL_PROVIDER=sendgrid|supabase|mock
SENDGRID_API_KEY=sk_live_...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# 应用
PORT=8080
ENVIRONMENT=production  # development|staging|production
LOG_LEVEL=info         # debug|info|warn|error

# 速率限制
RATE_LIMIT_WINDOW=60   # 秒
RATE_LIMIT_MAX=100     # 每个窗口的最大请求

# 可选
REDIS_URL=redis://localhost:6379
CORS_ALLOWED_ORIGINS=https://example.com
```

### 前端环境变量

```bash
# 必需
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_APP_URL=https://example.com

# 可选
NEXT_PUBLIC_ANALYTICS_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 数据库迁移

### 自动迁移

```bash
# 运行所有待处理的迁移
go run ./cmd/migrate up

# 回滚最后一个迁移
go run ./cmd/migrate down

# 显示迁移状态
go run ./cmd/migrate status
```

### 手动迁移（如果需要）

```bash
# 连接数据库
psql postgresql://user:password@localhost:5432/pci_auth

# 创建表
CREATE TABLE accounts (
  id VARCHAR(32) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id VARCHAR(32) PRIMARY KEY,
  account_id VARCHAR(32) REFERENCES accounts(id),
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE password_resets (
  id VARCHAR(32) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_refresh_tokens_account_id ON refresh_tokens(account_id);
CREATE INDEX idx_password_resets_email ON password_resets(email);
```

---

## 监控和日志

### 结构化日志

```bash
# 查看后端日志
docker-compose logs -f backend

# 日志格式
{
  "timestamp": "2026-11-07T10:00:00Z",
  "level": "info",
  "service": "auth-api",
  "request_id": "abc123",
  "message": "User signup successful",
  "user_id": "user-123",
  "latency_ms": 45
}
```

### 健康检查

```bash
# 后端健康状态
curl http://localhost:8080/health
# 响应: {"status":"healthy","version":"1.0.0"}

# 数据库连接
curl http://localhost:8080/health/db
# 响应: {"status":"connected","latency_ms":5}
```

### Prometheus 指标

```bash
# 获取指标
curl http://localhost:8080/metrics

# 关键指标
- auth_signup_total
- auth_login_total
- auth_token_refresh_total
- auth_password_reset_total
- http_request_duration_seconds
- database_query_duration_seconds
```

---

## 故障排查

### 常见问题

#### 问题 1: 数据库连接失败

```bash
# 检查连接字符串
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1"

# 检查 PostgreSQL 状态
systemctl status postgresql

# 解决方案
- 检查 hostname 和 port
- 验证用户名和密码
- 检查防火墙规则
```

#### 问题 2: JWT Token 验证失败

```bash
# 检查 JWT_SECRET 长度 (至少 32 字符)
echo $JWT_SECRET | wc -c

# 检查 token 格式
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/...

# 解决方案
- 重新生成 JWT_SECRET
- 清空旧的 token
- 重启服务
```

#### 问题 3: 邮件发送失败

```bash
# 检查 SendGrid API key
curl -X GET "https://api.sendgrid.com/v3/mail/validate" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# 检查邮件模板
go run ./cmd/test-email send

# 解决方案
- 验证 API key
- 检查邮件配额
- 查看邮件日志
```

#### 问题 4: 前端登陆循环

```bash
# 检查 API 连接
curl $NEXT_PUBLIC_API_URL/health

# 检查 CORS 设置
curl -H "Origin: $NEXT_PUBLIC_APP_URL" \
  -X OPTIONS http://localhost:8080/api/v1/auth/login

# 清理浏览器缓存
# 检查 localStorage
# 重启开发服务器
```

---

## 安全检查清单

### 部署前检查

- [ ] 生成新的 JWT_SECRET（至少 32 字符）
- [ ] 生成新的 JWT_REFRESH_SECRET
- [ ] 设置强数据库密码
- [ ] 启用 HTTPS/TLS
- [ ] 设置 CORS_ALLOWED_ORIGINS
- [ ] 启用防火墙规则
- [ ] 配置 WAF 规则
- [ ] 设置 Rate Limiting
- [ ] 启用日志记录
- [ ] 配置备份策略
- [ ] 运行安全测试
- [ ] 进行 Penetration Testing

### 生产安全设置

```nginx
# Nginx SSL 配置
server {
  listen 443 ssl http2;
  ssl_certificate /etc/ssl/cert.pem;
  ssl_certificate_key /etc/ssl/key.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  # 安全头
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## 性能调优

### 后端优化

```bash
# 连接池优化
DATABASE_MAX_CONNECTIONS=50
DATABASE_IDLE_TIMEOUT=5m

# 缓存配置
CACHE_TTL=300           # 5 分钟
CACHE_MAX_SIZE=10000

# Token 缓存
TOKEN_CACHE_ENABLED=true
TOKEN_CACHE_TTL=600

# 请求去重
REQUEST_DEDUP_ENABLED=true
REQUEST_DEDUP_TIMEOUT=30s
```

### 前端优化

```bash
# 代码分割
NEXT_BUILD_OPTIMIZATION=true

# 图片优化
NEXT_IMAGE_OPTIMIZATION=true

# API 缓存
SWR_REVALIDATE_ON_FOCUS=false
SWR_DEDUPE_INTERVAL=60000

# 预加载
PRELOAD_FONTS=true
PRELOAD_CRITICAL_CSS=true
```

### 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_accounts_created_at ON accounts(created_at DESC);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 清理过期 token
DELETE FROM refresh_tokens WHERE expires_at < NOW();
DELETE FROM password_resets WHERE expires_at < NOW();

-- 分析表
ANALYZE accounts;
ANALYZE refresh_tokens;
```

---

## 监控仪表板

### 关键指标

```
认证相关:
  ├─ 注册成功率: 98%+
  ├─ 登陆成功率: 99%+
  ├─ Token 刷新成功率: 99.5%+
  └─ 密码重置成功率: 95%+

性能指标:
  ├─ API 响应时间: < 200ms
  ├─ 数据库查询: < 50ms
  ├─ Token 生成: < 10ms
  └─ 邮件发送: < 500ms

系统指标:
  ├─ CPU 使用率: < 70%
  ├─ 内存使用率: < 80%
  ├─ 磁盘使用率: < 85%
  └─ 网络 I/O: < 100Mbps
```

---

## 支持和联系

- 文档: https://docs.example.com
- 问题报告: support@example.com
- 安全漏洞: security@example.com

---

**最后更新**: 2026-11-07  
**版本**: 1.0  
**状态**: 生产就绪 ✅
