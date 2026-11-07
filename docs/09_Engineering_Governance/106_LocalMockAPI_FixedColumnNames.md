# 本地模拟 API 数据库列名修复

## 问题

模拟 API (`apps/api-mock/src/server.ts`) 在插入 `refresh_tokens` 表时使用了错误的列名：

```sql
-- ❌ 错误 - 列不存在
INSERT INTO refresh_tokens (id, account_id, token, ...)

-- ✅ 正确 - 使用实际列名
INSERT INTO refresh_tokens (id, account_id, token_hash, ...)
```

## 错误信息

```
Signup error: error: column "token" of relation "refresh_tokens" does not exist
```

## 修复步骤

### 步骤 1: 修改服务器文件

编辑 `apps/api-mock/src/server.ts`，查找所有 `INSERT INTO refresh_tokens` 语句。

找到这样的代码：

```typescript
await pool.query(
  'INSERT INTO refresh_tokens (id, account_id, token, is_revoked, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'7 days\', NOW())',
  [tokenId, accountId, refreshToken, false]
);
```

改为：

```typescript
const tokenHash = Buffer.from(refreshToken).toString('base64');
await pool.query(
  'INSERT INTO refresh_tokens (id, account_id, token_hash, is_revoked, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'7 days\', NOW())',
  [tokenId, accountId, tokenHash, false]
);
```

### 步骤 2: 修改查询语句

找到所有 `WHERE token = ` 的查询，改为 `WHERE token_hash = `：

```typescript
// ❌ 错误
WHERE token = $1

// ✅ 正确
WHERE token_hash = $1
```

### 步骤 3: 重启服务

```bash
# 停止旧进程
kill <pid>

# 重启模拟 API
cd apps/api-mock
pnpm run dev
```

## 数据库表结构

实际的 `refresh_tokens` 表列名：

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'refresh_tokens' 
ORDER BY ordinal_position;

-- 结果：
-- id
-- account_id
-- token_hash        ← 注意是 token_hash，不是 token
-- expires_at
-- is_revoked
-- created_at
-- revoked_at
```

## 验证修复

修复后运行：

```bash
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'
```

预期应返回 `201` 并包含 `accessToken` 和 `refreshToken`。

## 完整的修复检查清单

- [ ] 修改 `INSERT INTO refresh_tokens` 的列名为 `token_hash`
- [ ] 修改参数使用 `Buffer.from(token).toString('base64')`
- [ ] 修改所有 `WHERE token = ` 为 `WHERE token_hash = `
- [ ] 重启模拟 API 服务
- [ ] 验证注册端点返回 201
- [ ] 验证 `/health` 返回正常
- [ ] 验证数据库中有新账户创建

## 文件位置

```
apps/api-mock/src/server.ts
```

修改这个文件中所有涉及 `refresh_tokens` 表的 SQL 语句。
