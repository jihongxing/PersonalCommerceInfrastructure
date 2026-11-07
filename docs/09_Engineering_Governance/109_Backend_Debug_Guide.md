# 后端 API 调试指南

## 问题概述

后端 API 端点返回 500 Internal Server Error

```
POST /api/v1/auth/signup → 500
POST /api/v1/auth/login → 500
GET /health → 200 ✅
```

## 立即需要的调试步骤

### 1. 查看后端进程日志

```bash
# 停止后端
ps aux | grep "api-mock" | grep -v grep | awk '{print $2}' | xargs kill -9

# 重新启动后端并捕获所有输出
cd /d/codeSpace/PersonalCommerceInfrastructure/apps/api-mock
pnpm run dev 2>&1 | tee backend.log

# 在另一个终端测试
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","name":"Test"}'

# 查看 backend.log 中的错误
```

### 2. 可能的根本原因

根据症状分析：

1. **TypeScript 编译错误** - 代码改动后未重新编译
   - 解决: `rm -rf dist && pnpm run dev`

2. **缺少导入或库不可用** - crypto 或其他模块问题
   - 检查: `grep -n "import crypto" server.ts`
   - 确认: crypto 是 Node.js 内置模块，不需要安装

3. **数据库连接问题** - pool.query 调用失败
   - 添加调试: 在每个 try/catch 中添加 console.error

4. **中间件执行顺序** - express 中间件问题
   - 检查: cors、bodyParser 的顺序

### 3. 快速诊断代码补丁

在 `apps/api-mock/src/server.ts` 的 signup 端点添加详细日志：

```typescript
app.post(`${API_V1}/auth/signup`, async (req: Request, res: Response) => {
  console.log('[SIGNUP] 收到请求:', req.body);
  try {
    const { email, password, name } = req.body;
    console.log('[SIGNUP] 已解析字段:', { email, password, name });

    if (!email || !password || !name) {
      console.log('[SIGNUP] 缺少字段');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[SIGNUP] 开始检查邮箱重复...');
    const existing = await pool.query('SELECT id FROM accounts WHERE email = $1', [email]);
    console.log('[SIGNUP] 检查完成，结果:', existing.rows.length);

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    console.log('[SIGNUP] 开始哈希密码...');
    const passwordHash = password; // 临时使用明文
    console.log('[SIGNUP] 密码哈希完成');

    // ... 继续处理
  } catch (error) {
    console.error('[SIGNUP] 捕获到错误:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 4. 最小化重现

创建最小的测试端点：

```typescript
app.post('/api/v1/test', (req: Request, res: Response) => {
  try {
    console.log('[TEST] 接收到请求');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[TEST] 错误:', error);
    res.status(500).json({ error: 'error' });
  }
});

// 测试
// curl http://localhost:8080/api/v1/test
```

如果 /test 也返回 500，问题在 express 本身或中间件。
如果 /test 返回 200，问题在 signup 端点逻辑。

### 5. 环境检查清单

```bash
# 检查 crypto 模块
node -e "console.log(require('crypto').createHash('sha256').update('test').digest('hex'))"

# 检查 pg 模块
node -e "const pg = require('pg'); console.log('pg version:', pg.version)"

# 检查 jwt 模块
node -e "const jwt = require('jsonwebtoken'); console.log('jwt loaded')"

# 检查数据库连接
PGUSER=pci_user PGPASSWORD=pci_test_pass PGDATABASE=pci_auth PGHOST=localhost PGPORT=5432 \
  psql -c "SELECT version();"
```

## 预期修复时间

- **快速诊断**: 5-10 分钟（查看日志）
- **问题定位**: 10-20 分钟（识别具体错误）
- **修复**: 10-30 分钟（根据问题类型）

## 推荐下一步

1. **立即**: 运行上面的诊断命令，查看详细错误日志
2. **然后**: 根据错误信息采取针对性修复
3. **最后**: 重新运行本地验收

一旦后端调试完成，系统就可以进行完整的端到端验收。
