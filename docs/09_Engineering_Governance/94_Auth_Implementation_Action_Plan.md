# 自建认证 API - 详细行动计划

**优先级**: 🔴 最高  
**预计工作量**: 62 小时 (后端 42h + 前端 20h)  
**预计完成**: 2-3 周  
**开始日期**: 建议本周启动

---

## 📊 工作量分解

### 后端: 5 天（42 小时）

```
Day 1: API 合约 + 数据模型       (8h)
Day 2-3: 核心逻辑 (signup+login) (18h)
Day 4-5: Token 管理 + 测试       (16h)
────────────────────────────
小计: 42 小时
```

### 前端: 3 天（20 小时）

```
Day 1-3 (并行): 页面 + 集成     (18h)
Day 4-5 (并行): 路由 + 测试     (12h)
────────────────────────────
小计: 20 小时（与后端并行，实际周期缩短）
```

### 总计: 1.5 - 2.5 周

---

## 🎯 Week 1 - 后端任务分解

### Day 1: API 合约 & 数据模型（8 小时）

**输出物**:
- `contracts/api/v1/auth-contracts.ts` - API 端点定义
- Database migration files - 数据表定义
- `AGENTS.md` 更新 - 设计文档

**具体任务**:

1. 查看现有结构
   ```bash
   ls contracts/api/v1/
   cat contracts/api/v1/creator-identity-contracts.ts  # 参考格式
   ```

2. 创建 `contracts/api/v1/auth-contracts.ts`
   ```typescript
   export type SignUpRequest = {
     email: string;
     password: string;
     name?: string;
   };

   export type SignUpResponse = {
     accessToken: string;
     refreshToken: string;
     user: {
       id: string;
       email: string;
       name?: string;
     };
   };

   // 类似定义其他 5 个端点...
   ```

3. 数据库迁移脚本
   ```sql
   CREATE TABLE accounts (
     id VARCHAR(32) PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     name VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW(),
     ...
   );

   CREATE TABLE refresh_tokens (
     id VARCHAR(32) PRIMARY KEY,
     account_id VARCHAR(32) REFERENCES accounts(id),
     token VARCHAR(512) NOT NULL,
     expires_at TIMESTAMP,
     ...
   );

   CREATE TABLE password_resets (
     id VARCHAR(32) PRIMARY KEY,
     email VARCHAR(255) NOT NULL,
     token VARCHAR(512) NOT NULL,
     expires_at TIMESTAMP,
     ...
   );
   ```

4. 更新 `AGENTS.md`
   - 列出所有 6 个认证 API 端点
   - 描述认证流程
   - 安全考虑
   - Token 格式

**检查点**:
- [ ] 所有 6 个端点定义完整
- [ ] 数据库脚本可执行
- [ ] 团队评审通过

---

### Day 2-3: 核心认证逻辑（18 小时）

**输出物**:
- `adapters/transport/http/auth-routes.ts` - 认证路由
- 单元测试 - signup/login 测试

**具体任务**:

1. 创建 `adapters/transport/http/auth-routes.ts`
   ```typescript
   import { Router } from '@fastify/router';
   import { SignUpRequest, SignUpResponse } from '@contracts/auth-contracts';

   export function registerAuthRoutes(router: Router) {
     router.post<{ Body: SignUpRequest; Reply: SignUpResponse }>(
       '/auth/signup',
       async (request, reply) => {
         // 验证输入
         // 调用 Supabase 创建用户
         // 生成 tokens
         // 返回结果
       }
     );

     router.post<{ Body: LoginRequest; Reply: LoginResponse }>(
       '/auth/login',
       async (request, reply) => {
         // 验证输入
         // 调用 Supabase 验证
         // 生成 tokens
         // 返回结果
       }
     );
   }
   ```

2. 实现 Token 生成函数
   ```typescript
   // lib/auth/token-service.ts
   export function createAccessToken(
     userId: string,
     email: string,
     roles: string[]
   ): string {
     return jwt.sign(
       {
         sub: userId,
         email,
         roles,
         iat: Date.now() / 1000,
         exp: (Date.now() + 15 * 60 * 1000) / 1000, // 15 分钟
       },
       process.env.JWT_SECRET,
       { algorithm: 'HS256' }
     );
   }

   export function createRefreshToken(userId: string): string {
     return jwt.sign(
       {
         sub: userId,
         type: 'refresh',
         iat: Date.now() / 1000,
         exp: (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000, // 7 天
       },
       process.env.JWT_REFRESH_SECRET,
       { algorithm: 'HS256' }
     );
   }
   ```

3. 单元测试
   ```typescript
   // tests/auth-signup.test.ts
   describe('POST /auth/signup', () => {
     it('should create user and return tokens', async () => {
       // ...
     });

     it('should validate email format', async () => {
       // ...
     });

     it('should reject duplicate email', async () => {
       // ...
     });
   });
   ```

**检查点**:
- [ ] signup 端点创建用户成功
- [ ] login 端点验证邮箱密码
- [ ] tokens 包含正确的 claims
- [ ] 单元测试全部通过

---

### Day 4-5: Token 管理 & 测试（16 小时）

**输出物**:
- `POST /api/v1/auth/refresh` 端点
- `POST /api/v1/auth/logout` 端点
- Token 验证中间件
- 集成测试

**具体任务**:

1. 实现 `POST /auth/refresh`
   ```typescript
   router.post('/auth/refresh', async (request, reply) => {
     const { refreshToken } = request.body;

     // 验证 token 有效性
     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

     // 检查是否已失效（logout 情况）
     const isBlacklisted = await checkRefreshTokenBlacklist(decoded.sub);
     if (isBlacklisted) return reply.code(401);

     // 生成新 tokens
     const newAccessToken = createAccessToken(...);
     const newRefreshToken = createRefreshToken(...);

     reply.code(200).send({
       accessToken: newAccessToken,
       refreshToken: newRefreshToken,
     });
   });
   ```

2. 实现 `POST /auth/logout`
   ```typescript
   router.post('/auth/logout', async (request, reply) => {
     const token = request.headers.authorization?.split(' ')[1];
     const decoded = jwt.verify(token, process.env.JWT_SECRET);

     // 将 refreshToken 加入黑名单
     await addToRefreshTokenBlacklist(decoded.sub);

     reply.code(200).send({ ok: true });
   });
   ```

3. Token 验证中间件
   ```typescript
   export async function verifyToken(request, reply) {
     const token = request.headers.authorization?.split(' ')[1];
     if (!token) return reply.code(401).send({ error: 'Missing token' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       request.user = decoded;
     } catch (error) {
       return reply.code(401).send({ error: 'Invalid token' });
     }
   }
   ```

4. 错误处理和验证
   - 400 Bad Request (验证失败)
   - 401 Unauthorized (认证失败)
   - 409 Conflict (用户已存在)
   - 500 Internal Server Error

5. 集成测试
   ```typescript
   // tests/auth-flow.test.ts
   describe('Auth Flow', () => {
     it('should complete full signup -> login -> refresh flow', async () => {
       // signup
       // login
       // refresh token
       // verify new token works
     });
   });
   ```

**检查点**:
- [ ] refresh 端点成功返回新 token
- [ ] logout 使 token 失效
- [ ] token 验证中间件工作正确
- [ ] 所有错误场景都有正确的 HTTP 码
- [ ] 集成测试通过

---

## 🎯 Week 2 - 前后端并行

### 前端: Day 1-3 - 页面 & 集成（18 小时）

**输出物**:
- `/auth/login` 页面
- `/auth/signup` 页面
- `/auth/forgot-password` 页面
- `AuthContext` 和 `useAuth()` Hook
- `lib/auth/auth-service.ts`

**具体任务**:

1. 创建 `lib/auth/auth-service.ts`
   ```typescript
   export class AuthService {
     async signup(email: string, password: string, name?: string) {
       const response = await apiClient.post('/auth/signup', {
         email,
         password,
         name,
       });
       this.saveSession(response);
       return response;
     }

     async login(email: string, password: string) {
       const response = await apiClient.post('/auth/login', {
         email,
         password,
       });
       this.saveSession(response);
       return response;
     }

     private saveSession(data: any) {
       // 使用 httpOnly cookie 或内存 + sessionStorage
       // 不要用 localStorage
       localStorage.setItem('auth.session', JSON.stringify({
         accessToken: data.accessToken,
         refreshToken: data.refreshToken,
         user: data.user,
       }));
     }
   }
   ```

2. 创建 `AuthContext`
   ```typescript
   // lib/auth/auth-context.tsx
   const AuthContext = createContext(null);

   export function AuthProvider({ children }) {
     const [user, setUser] = useState(null);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
       // 从 localStorage 恢复会话
       const session = localStorage.getItem('auth.session');
       if (session) {
         setUser(JSON.parse(session).user);
       }
       setIsLoading(false);
     }, []);

     const login = async (email, password) => {
       try {
         const result = await authService.login(email, password);
         setUser(result.user);
       } catch (err) {
         setError(err.message);
       }
     };

     const logout = async () => {
       // ...
       setUser(null);
     };

     return (
       <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
         {children}
       </AuthContext.Provider>
     );
   }

   export function useAuth() {
     return useContext(AuthContext);
   }
   ```

3. 创建 `/auth/login` 页面
   ```typescript
   // app/auth/login/page.tsx
   'use client';

   export default function LoginPage() {
     const { login } = useAuth();
     const router = useRouter();

     const handleSubmit = async (email, password) => {
       await login(email, password);
       router.push('/creator/dashboard');
     };

     return (
       <div className="max-w-md mx-auto">
         <h1>登陆</h1>
         <LoginForm onSubmit={handleSubmit} />
         <Link href="/auth/signup">没有账户？注册</Link>
       </div>
     );
   }
   ```

4. 创建 `/auth/signup` 页面
   ```typescript
   // app/auth/signup/page.tsx
   export default function SignupPage() {
     // 类似 login 页面
   }
   ```

5. 创建 `/auth/forgot-password` 页面
   ```typescript
   // app/auth/forgot-password/page.tsx
   export default function ForgotPasswordPage() {
     // 邮箱输入表单
     // 发送邮件
   }
   ```

**检查点**:
- [ ] /auth/login 页面可访问
- [ ] /auth/signup 页面可访问
- [ ] 表单验证完整 (Zod)
- [ ] 错误处理完整
- [ ] 提交后自动重定向

---

### 后端: Day 1-3 - 密码重置（同步进行，8 小时）

**输出物**:
- `POST /api/v1/auth/forgot-password` 端点
- `POST /api/v1/auth/reset-password` 端点
- 邮件模板

**具体任务**:

1. 实现 `forgot-password`
   ```typescript
   router.post('/auth/forgot-password', async (request, reply) => {
     const { email } = request.body;

     // 查询用户
     const account = await db.accounts.findOne({ email });
     if (!account) {
       // 不泄露用户是否存在
       return reply.code(200).send({ ok: true });
     }

     // 生成重置 token
     const resetToken = crypto.randomBytes(32).toString('hex');

     // 存储到数据库
     await db.passwordResets.create({
       email,
       token: resetToken,
       expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 小时
     });

     // 发送邮件
     await sendEmail({
       to: email,
       subject: '重置密码',
       html: `
         <a href="${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}">
           点击重置密码
         </a>
       `,
     });

     reply.code(200).send({ ok: true });
   });
   ```

2. 实现 `reset-password`
   ```typescript
   router.post('/auth/reset-password', async (request, reply) => {
     const { token, newPassword } = request.body;

     // 查询重置记录
     const resetRecord = await db.passwordResets.findOne({ token });
     if (!resetRecord || resetRecord.expiresAt < new Date()) {
       return reply.code(400).send({ error: 'Invalid or expired token' });
     }

     // 查询用户
     const account = await db.accounts.findOne({ email: resetRecord.email });

     // 调用 Supabase 更新密码
     await supabase.auth.admin.updateUserById(account.supabaseId, {
       password: newPassword,
     });

     // 删除重置记录
     await db.passwordResets.delete({ id: resetRecord.id });

     reply.code(200).send({ ok: true });
   });
   ```

**检查点**:
- [ ] forgot-password 邮件发送成功
- [ ] reset-password token 有效期正确
- [ ] 过期 token 被拒绝

---

### 前端: Day 4-5 - 路由守卫 & 测试（12 小时，同步）

**输出物**:
- `ProtectedRoute` 组件
- 路由守卫应用
- E2E 集成测试

**具体任务**:

1. 创建 `ProtectedRoute` 组件
   ```typescript
   // components/protected-route.tsx
   export function ProtectedRoute({ children }) {
     const { user, isLoading } = useAuth();
     const router = useRouter();

     if (isLoading) return <LoadingSpinner />;

     if (!user) {
       router.push('/auth/login');
       return null;
     }

     return children;
   }
   ```

2. 应用到页面
   ```typescript
   // app/(creator)/layout.tsx
   export default function CreatorLayout({ children }) {
     return (
       <ProtectedRoute>
         <div className="flex">
           <Sidebar />
           <main>{children}</main>
         </div>
       </ProtectedRoute>
     );
   }
   ```

3. 升级 API 客户端
   ```typescript
   // lib/api/client.ts
   const client = createClient({
     baseUrl: API_URL,
     interceptors: {
       request: {
         handler: (request) => {
           // 自动添加 token
           const session = localStorage.getItem('auth.session');
           if (session) {
             const { accessToken } = JSON.parse(session);
             request.headers.Authorization = `Bearer ${accessToken}`;
           }
           return request;
         },
       },
       response: {
         handler: async (response) => {
           // 处理 401 → 刷新 token
           if (response.status === 401) {
             const session = localStorage.getItem('auth.session');
             if (session) {
               const { refreshToken } = JSON.parse(session);
               const newTokens = await refreshTokens(refreshToken);
               // 重试请求
             }
           }
           return response;
         },
       },
     },
   });
   ```

4. E2E 测试
   ```typescript
   // e2e/auth-flow.test.ts
   describe('Auth Flow E2E', () => {
     it('should complete signup -> login -> dashboard access', async () => {
       // 1. 访问 /auth/signup
       // 2. 填写表单并提交
       // 3. 验证重定向到 dashboard
       // 4. 检查用户信息显示
     });

     it('should access protected route after login', async () => {
       // 1. 登陆
       // 2. 访问 /creator/profile
       // 3. 验证页面加载
     });

     it('should be redirected to login when unauthenticated', async () => {
       // 1. 访问 /creator/dashboard (未登陆)
       // 2. 验证重定向到 /auth/login
     });
   });
   ```

**检查点**:
- [ ] 未登陆用户被重定向
- [ ] 已登陆用户可访问保护页面
- [ ] 自动 token 刷新工作正确
- [ ] 所有 E2E 测试通过

---

## 📈 Week 3 - 优化、安全、文档

### 优化（5 小时）
- Token 缓存策略
- 请求去重
- 错误恢复

### 安全审计（5 小时）
- XSS 防护检查
- CSRF 保护
- 密码最小要求
- 速率限制

### 文档（5 小时）
- API 文档
- 前端集成指南
- 部署指南
- 故障排查

### E2E 测试（5 小时）
- 完整用户旅程
- 边界情况
- 错误恢复

---

## ✅ 完成检查清单

### 功能检查

```
后端:
  □ POST /api/v1/auth/signup - 创建账户
  □ POST /api/v1/auth/login - 登陆
  □ POST /api/v1/auth/refresh - 刷新 token
  □ POST /api/v1/auth/logout - 登出
  □ POST /api/v1/auth/forgot-password - 忘记密码
  □ POST /api/v1/auth/reset-password - 重置密码

前端:
  □ /auth/signup - 注册页面
  □ /auth/login - 登陆页面
  □ /auth/forgot-password - 忘记密码页面
  □ /auth/reset-password - 重置密码页面
  □ AuthContext & useAuth() Hook
  □ ProtectedRoute 守卫
  □ 自动 token 刷新

系统:
  □ 所有测试通过 (> 80% 覆盖)
  □ 安全审计无漏洞
  □ 文档完整
  □ 用户体系闭环: 100%
```

---

## 📞 参考资源

### 文档
- `docs/93_Auth_System_Design_Decision.md` - 设计决策
- `contracts/api/v1/creator-identity-contracts.ts` - API 格式参考

### 代码参考
- `adapters/auth/supabase/` - 现有认证框架
- `adapters/transport/http/` - API 路由结构
- `apps/web-v2/lib/api/client.ts` - API 客户端

### 依赖库
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.20.0",
    "@supabase/supabase-js": "^2.0.0",
    "next": "^14.0.0"
  }
}
```

---

**预计完成时间**: 2-3 周  
**优先级**: 🔴 最高  
**下一步**: 启动 Week 1 Day 1 任务

