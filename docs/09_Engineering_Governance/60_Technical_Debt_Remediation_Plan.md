# 60 — Technical Debt Remediation Plan

> **状态**：Decision v1  
> **阶段**：Post-VS-02D Technical Hardening  
> **范围**：安全、可靠性、可观测性工程实践补齐  
> **文档角色**：技术债修复决策与实施计划  
> **上游文档**：[22 — Engineering Governance](./22_Engineering_Governance.md)  
> **执行台账**：[21 — Prototype Execution](../08_Execution/21_Prototype_Execution.md)  
> **最后更新**：2026-11-06

## 1. 背景与目的

### 1.1 评审发现

在 VS-02D Engineering Readiness 完成后，对项目技术架构进行了全面评审，发现：

**架构设计优秀**：
- ✅ 清晰的 DDD 分层架构（modules/applications/adapters/contracts）
- ✅ 严谨的领域模型设计（Identity → Commerce Profile → Commerce Reference）
- ✅ 金融级 Money Domain（bigint、完整状态机、Event Sourcing 风格 Wallet）
- ✅ 全面的测试覆盖（18 个模块单元测试 + 88 个集成/验收测试）
- ✅ 规范的数据库设计（版本化 Migration、外键约束、CHECK 约束）
- ✅ 完整的 CI/CD 流水线

**工程实践缺口**（10 项技术债）：
- 安全：速率限制、Webhook 签名验证、日志脱敏
- 可靠性：幂等性、事务边界、错误处理细化
- 可观测性：性能监控、慢查询告警
- 核心逻辑：C号 生成算法、碰撞重试
- 测试修复：2 个失败的持久化测试

### 1.2 修复原则

本次修复遵循以下原则：

1. **不改变产品行为**：所有修复均为内部工程实践增强，不涉及产品对象、状态机、规范事件变化
2. **遵守治理流程**：按照 `22_Engineering_Governance.md` 的变更分类执行
3. **优先级驱动**：P0 阻塞项先修复，P1/P2 按风险和收益排序
4. **证据驱动**：每项修复必须有测试证据和执行记录
5. **可追溯**：在 `21_Prototype_Execution.md` 中记录实施状态

### 1.3 变更分类

根据 `22_Engineering_Governance.md` § 10.1：

| 修复项 | 变更分类 | 必须执行的流程 |
|--------|---------|---------------|
| TD-001 ~ TD-010 | 工程变更（不改变产品行为） | 架构审查 + 测试 + 执行证据 |

**结论**：这 10 项修复均为**内部工程变更**，不需要登记 `DEV-###` 偏差，但需要在本文档中明确决策并提供测试证据。

---

## 2. Technical Debt 清单与优先级

### 2.1 优先级定义

| 优先级 | 定义 | 修复时间窗口 |
|--------|------|-------------|
| P0 | 阻塞项：影响核心功能或存在安全风险 | 立即修复（本周） |
| P1 | 重要项：影响生产可用性或用户体验 | 本迭代（2 周内） |
| P2 | 优化项：提升可维护性和可观测性 | 下个迭代（1 个月内） |

### 2.2 Technical Debt 清单

| ID | 描述 | 分类 | 优先级 | 风险评分 | 预估工作量 |
|----|------|------|--------|---------|-----------|
| TD-001 | 测试失败未修复（`commerce-relationship.test.ts`） | 阻塞项 | P0 | 高 | 2h |
| TD-002 | Commerce Reference 生成算法未实现 | 核心缺失 | P0 | 高 | 4h |
| TD-003 | API 速率限制缺失 | 安全 | P0 | 高 | 3h |
| TD-004 | Webhook 签名验证缺失 | 安全 | P1 | 高 | 4h |
| TD-005 | 幂等性设计未完整实施 | 可靠性 | P1 | 中 | 3h |
| TD-006 | 日志脱敏不足 | 安全 | P1 | 中 | 3h |
| TD-007 | 错误处理不够细化 | 可维护性 | P2 | 低 | 4h |
| TD-008 | 性能监控埋点缺失 | 可观测性 | P2 | 低 | 4h |
| TD-009 | C号 碰撞处理未完整实现 | 可靠性 | P0 | 中 | 2h |
| TD-010 | 事务边界未明确标注 | 可维护性 | P2 | 低 | 3h |

**总工作量估算**：32 小时（约 4 个工作日）

---

## 3. Technical Debt 详细分析与修复方案

### TD-001：测试失败未修复

#### 问题分析

**当前状态**：
```bash
FAIL  tests/persistence/commerce-relationship.test.ts
- 2 个测试失败（外键约束和字段数量不匹配）
```

**失败原因**：
```diff
- Expected: 7 columns
+ Received: 8 columns (多了 'provenance' 字段)
```

**根本原因**：
- `commerce_relationship` 表新增了 `provenance` 字段（用于标识关系来源：`SELF_DECLARED` / `PLATFORM_VERIFIED`）
- 测试未同步更新字段断言

#### 修复方案

**变更分类**：测试修复（回归测试 + 执行证据）

**实施步骤**：
1. 确认 `provenance` 字段是否是已批准的产品需求
2. 更新 `tests/persistence/commerce-relationship.test.ts` 的字段断言
3. 验证所有相关测试通过

**测试证据**：
```bash
pnpm test:persistence -- commerce-relationship
# 预期：所有测试通过
```

**不涉及**：
- ❌ 不改变产品对象定义
- ❌ 不改变状态机
- ❌ 不改变 API 契约

---

### TD-002：Commerce Reference 生成算法未实现

#### 问题分析

**当前状态**：
- 在 `modules/` 中未找到 C号 生成逻辑
- 未见 CSPRNG（密码学安全随机数生成）实现
- 未见碰撞重试逻辑

**设计规范**（来自 Product Direction）：
```text
Canonical = 18 uppercase ASCII characters, no punctuation
Alphabet = 3479ACDEFHJKMNPQRTVWXY (25 个字符)
Grouped display = 6-6-6 only
Generation = CSPRNG + UNIQUE constraint + collision retry
```

**根本原因**：
- 核心业务逻辑缺失（Commerce Reference 是产品核心抽象）
- 可能导致 C号 分配失败或不符合产品规范

#### 修复方案

**变更分类**：工程变更（恢复 PRD 行为）

**实施步骤**：

1. **创建领域模块**：`modules/commerce-reference/`
   ```typescript
   // modules/commerce-reference/commerce-reference-generator.ts
   import { randomBytes } from 'node:crypto';
   
   const ALPHABET = '3479ACDEFHJKMNPQRTVWXY';
   const REFERENCE_LENGTH = 18;
   
   export function generateCommerceReference(): string {
     const buffer = randomBytes(REFERENCE_LENGTH);
     let ref = '';
     
     for (let i = 0; i < REFERENCE_LENGTH; i++) {
       ref += ALPHABET[buffer[i] % 25];
     }
     
     return ref;
   }
   
   export function formatForDisplay(ref: string): string {
     if (ref.length !== 18) {
       throw new TypeError('Commerce Reference must be exactly 18 characters');
     }
     return `${ref.slice(0, 6)}-${ref.slice(6, 12)}-${ref.slice(12, 18)}`;
   }
   
   export function normalizeFromDisplay(formatted: string): string {
     return formatted.replace(/-/g, '');
   }
   ```

2. **添加单元测试**：
   ```typescript
   // modules/commerce-reference/commerce-reference-generator.test.ts
   describe('Commerce Reference Generator', () => {
     it('generates 18-character reference', () => {
       const ref = generateCommerceReference();
       expect(ref).toHaveLength(18);
     });
     
     it('uses only allowed alphabet', () => {
       const ref = generateCommerceReference();
       expect(ref).toMatch(/^[3479ACDEFHJKMNPQRTVWXY]{18}$/);
     });
     
     it('formats reference as 6-6-6', () => {
       const ref = '3479ACDEFHJKMNPQRT';
       expect(formatForDisplay(ref)).toBe('3479AC-DEFHJK-MNPQRT');
     });
     
     it('generates unique references', () => {
       const refs = new Set();
       for (let i = 0; i < 1000; i++) {
         refs.add(generateCommerceReference());
       }
       expect(refs.size).toBe(1000);
     });
   });
   ```

3. **在 Application 层实现碰撞重试**（见 TD-009）

**测试证据**：
```bash
pnpm test modules/commerce-reference
# 预期：所有测试通过
```

**不涉及**：
- ❌ 不改变产品对象定义（C号 规范已在 PRD 中冻结）
- ❌ 不改变 API 契约
- ✅ 恢复缺失的核心业务逻辑

---

### TD-003：API 速率限制缺失

#### 问题分析

**当前状态**：
- `apps/api/src/create-api-server.ts` 未见速率限制中间件
- 公开的 C号 解析接口可能被滥用

**风险**：
- 暴力枚举 C号（虽然 25^18 ≈ 3.8 × 10^25 极大，但仍需防护）
- DDoS 攻击导致服务不可用
- 成本攻击（数据库查询）

**根本原因**：
- API 层缺少基础安全防护

#### 修复方案

**变更分类**：工程变更（新模块 Adapter）

**实施步骤**：

1. **添加依赖**：
   ```bash
   pnpm add @fastify/rate-limit
   ```

2. **在 API Server 注册**：
   ```typescript
   // apps/api/src/create-api-server.ts
   import rateLimit from '@fastify/rate-limit';
   
   await server.register(rateLimit, {
     max: 100,                    // 每个 IP 每分钟 100 次请求
     timeWindow: '1 minute',
     skipOnError: false,          // 出错时不跳过限制
     errorResponseBuilder: (request, context) => ({
       error: 'TOO_MANY_REQUESTS',
       message: `Rate limit exceeded. Retry after ${context.after}`,
       statusCode: 429,
     }),
   });
   ```

3. **为敏感接口设置更严格的限制**：
   ```typescript
   // 对 C号 解析接口单独限制
   server.get('/api/reference/:commerceReference', {
     config: {
       rateLimit: {
         max: 20,              // 更严格：每分钟 20 次
         timeWindow: '1 minute',
       },
     },
   }, async (request, reply) => {
     // ...
   });
   ```

**测试证据**：
```typescript
// tests/integration/rate-limit.test.ts
describe('API Rate Limit', () => {
  it('enforces global rate limit', async () => {
    for (let i = 0; i < 100; i++) {
      await apiClient.get('/api/health');
    }
    
    const response = await apiClient.get('/api/health');
    expect(response.status).toBe(429);
  });
  
  it('enforces stricter limit on C号 resolution', async () => {
    for (let i = 0; i < 20; i++) {
      await apiClient.get('/api/reference/TESTREF123456789');
    }
    
    const response = await apiClient.get('/api/reference/TESTREF123456789');
    expect(response.status).toBe(429);
  });
});
```

**依赖登记**：

在 `docs/09_Engineering_Governance/external-dependencies.md` 中新增：

| 依赖 | 版本 | 能力 | 允许位置 | 禁止位置 | 证据 |
|------|------|------|---------|---------|------|
| @fastify/rate-limit | ^10.0.0 | API 速率限制 | `apps/api` | `modules/`、`applications/` | Rate Limit 集成测试 |

**不涉及**：
- ❌ 不改变产品行为
- ❌ 不改变 API 契约（只是返回 429 状态码）
- ✅ 新增基础设施 Adapter

---

### TD-004：Webhook 签名验证缺失

#### 问题分析

**当前状态**：
- `adapters/providers/` 下未见 Webhook 签名验证实现
- `apps/api/src/create-api-server.ts` 注册了 `registerProviderWebhookRoutes`，但未见签名验证

**风险**：
- 伪造的 Webhook 请求可能触发支付确认
- 资金安全风险（高优先级）

**根本原因**：
- Webhook 接收边界缺少安全验证

#### 修复方案

**变更分类**：工程变更（新 Adapter）

**实施步骤**：

1. **创建签名验证 Adapter**：
   ```typescript
   // adapters/providers/webhook-signature-verifier.ts
   import { createHmac, timingSafeEqual } from 'node:crypto';
   
   export interface WebhookSignatureVerifier {
     verify(
       timestamp: string,
       nonce: string,
       body: string,
       signature: string,
     ): boolean;
   }
   
   export function createWechatPaySignatureVerifier(
     apiKey: string,
   ): WebhookSignatureVerifier {
     return {
       verify(timestamp, nonce, body, signature) {
         const message = `${timestamp}\n${nonce}\n${body}\n`;
         const expectedSignature = createHmac('sha256', apiKey)
           .update(message)
           .digest('base64');
         
         try {
           return timingSafeEqual(
             Buffer.from(signature),
             Buffer.from(expectedSignature),
           );
         } catch {
           return false;
         }
       },
     };
   }
   ```

2. **在 Webhook Route 中使用**：
   ```typescript
   // adapters/transport/http/provider-webhook-routes.ts
   export function registerProviderWebhookRoutes(
     server: FastifyInstance,
     dependencies: {
       runtime: ProviderWebhookRuntime;
       signatureVerifier: WebhookSignatureVerifier;
     },
   ) {
     server.post('/webhooks/provider/:providerId', async (request, reply) => {
       const { timestamp, nonce, signature } = request.headers;
       const body = JSON.stringify(request.body);
       
       const isValid = dependencies.signatureVerifier.verify(
         timestamp as string,
         nonce as string,
         body,
         signature as string,
       );
       
       if (!isValid) {
         return reply.code(401).send({
           error: 'INVALID_SIGNATURE',
           message: 'Webhook signature verification failed',
         });
       }
       
       // 处理 Webhook...
     });
   }
   ```

**测试证据**：
```typescript
// adapters/providers/webhook-signature-verifier.test.ts
describe('Webhook Signature Verifier', () => {
  it('accepts valid signature', () => {
    const verifier = createWechatPaySignatureVerifier('test-key');
    const timestamp = '1234567890';
    const nonce = 'abc123';
    const body = '{"event":"payment.confirmed"}';
    
    const signature = createHmac('sha256', 'test-key')
      .update(`${timestamp}\n${nonce}\n${body}\n`)
      .digest('base64');
    
    expect(verifier.verify(timestamp, nonce, body, signature)).toBe(true);
  });
  
  it('rejects invalid signature', () => {
    const verifier = createWechatPaySignatureVerifier('test-key');
    expect(verifier.verify('1234567890', 'abc123', '{}', 'invalid')).toBe(false);
  });
  
  it('prevents timing attacks', () => {
    const verifier = createWechatPaySignatureVerifier('test-key');
    const start = performance.now();
    verifier.verify('1234567890', 'abc123', '{}', 'invalid');
    const duration1 = performance.now() - start;
    
    const start2 = performance.now();
    verifier.verify('1234567890', 'abc123', '{}', 'different-invalid');
    const duration2 = performance.now() - start2;
    
    // 时间差应该小于 1ms（timingSafeEqual 保证恒定时间）
    expect(Math.abs(duration1 - duration2)).toBeLessThan(1);
  });
});
```

**配置更新**：

在 `docs/09_Engineering_Governance/configuration-and-secrets.md` 中已有：
```text
LIVE_PROVIDER_WEBHOOK_SECRET | 无 | Live Provider Webhook Secret | 是
```

**不涉及**：
- ❌ 不改变产品行为
- ❌ 不改变 Webhook 接收契约
- ✅ 新增安全验证 Adapter

---

### TD-005：幂等性设计未完整实施

#### 问题分析

**当前状态**：
- `Withdrawal` 接口已定义 `idempotencyKey`
- 但数据库未建立唯一索引
- API 层未强制要求 `idempotencyKey`

**风险**：
- 网络超时重试导致重复提现
- Webhook 重复调用导致重复记账
- 资金安全风险

**根本原因**：
- 幂等性设计不完整

#### 修复方案

**变更分类**：工程变更（数据库 Migration + API 增强）

**实施步骤**：

1. **创建数据库 Migration**：
   ```sql
   -- database/migrations/0026_add_idempotency_constraints.sql
   
   -- Withdrawal 幂等性索引
   CREATE UNIQUE INDEX idx_withdrawals_idempotency_key
   ON paid_commerce_withdrawals(idempotency_key)
   WHERE state IN ('requested', 'completed');
   
   -- Payment 幂等性索引（已有 correlationId，但可能不唯一）
   ALTER TABLE paid_commerce_payments
   ADD CONSTRAINT unique_payment_correlation_id
   UNIQUE (correlation_id, order_id);
   ```

2. **在 API Contract 中强制要求**：
   ```typescript
   // contracts/api/v1/paid-commerce-contracts.ts
   export const CreateWithdrawalInputSchema = Type.Object(
     {
       amount: MoneySchema,
       destinationReference: Type.String({ minLength: 1 }),
       idempotencyKey: Type.String({ 
         minLength: 32, 
         maxLength: 128,
         description: 'Client-generated unique key for idempotency',
       }),
     },
     { additionalProperties: false },
   );
   ```

3. **在 Application 层处理冲突**：
   ```typescript
   // applications/paid-commerce/paid-commerce-service.ts
   async createWithdrawal(input: CreateWithdrawalInput): Promise<Withdrawal> {
     try {
       // 尝试创建
       return await this.repository.createWithdrawal(input);
     } catch (error) {
       if (isUniqueConstraintViolation(error, 'idempotency_key')) {
         // 幂等返回已存在的 Withdrawal
         return await this.repository.findWithdrawalByIdempotencyKey(
           input.idempotencyKey,
         );
       }
       throw error;
     }
   }
   ```

**测试证据**：
```typescript
// tests/integration/idempotency.test.ts
describe('Idempotency', () => {
  it('prevents duplicate withdrawal with same idempotency key', async () => {
    const input = {
      amount: { currency: 'CNY', minor: 10000n },
      destinationReference: 'bank-account-123',
      idempotencyKey: 'unique-key-001',
    };
    
    const withdrawal1 = await paidCommerceService.createWithdrawal(input);
    const withdrawal2 = await paidCommerceService.createWithdrawal(input);
    
    expect(withdrawal1.id).toBe(withdrawal2.id);
  });
  
  it('allows different withdrawals with different keys', async () => {
    const withdrawal1 = await paidCommerceService.createWithdrawal({
      amount: { currency: 'CNY', minor: 10000n },
      destinationReference: 'bank-account-123',
      idempotencyKey: 'unique-key-001',
    });
    
    const withdrawal2 = await paidCommerceService.createWithdrawal({
      amount: { currency: 'CNY', minor: 20000n },
      destinationReference: 'bank-account-123',
      idempotencyKey: 'unique-key-002',
    });
    
    expect(withdrawal1.id).not.toBe(withdrawal2.id);
  });
});
```

**不涉及**：
- ❌ 不改变产品行为（只是防止重复操作）
- ✅ 数据库 Schema 变更（需要在 `21_Prototype_Execution.md` 中记录）

---

### TD-006：日志脱敏不足

#### 问题分析

**当前状态**：
```typescript
server.addHook('onRequest', (request, _reply, done) => {
  dependencies.logger?.info('api_request_started', {
    correlationId: request.id,
    method: request.method,
    path: request.routeOptions.url ?? request.url,  // 可能包含敏感信息
  });
  done();
});
```

**风险**：
- URL 可能包含敏感参数（如 token、邮箱、手机号）
- Request Body 未脱敏（可能记录密码、身份证号）
- PII 泄漏风险

**根本原因**：
- 日志记录缺少脱敏处理

#### 修复方案

**变更分类**：工程变更（新 Adapter）

**实施步骤**：

1. **创建日志脱敏工具**：
   ```typescript
   // adapters/observability/log-sanitizer.ts
   
   const SENSITIVE_QUERY_PARAMS = [
     'token', 'password', 'email', 'phone', 'idcard',
     'secret', 'key', 'credential', 'authorization',
   ];
   
   const SENSITIVE_BODY_FIELDS = [
     'password', 'oldPassword', 'newPassword',
     'secret', 'privateKey', 'apiKey',
     'idNumber', 'passportNumber', 'creditCardNumber',
   ];
   
   export function sanitizePath(path: string): string {
     try {
       const url = new URL(path, 'http://localhost');
       
       for (const param of SENSITIVE_QUERY_PARAMS) {
         if (url.searchParams.has(param)) {
           url.searchParams.set(param, '***');
         }
       }
       
       return url.pathname + url.search;
     } catch {
       // 如果不是有效 URL，使用正则替换
       return path.replace(
         /([?&](token|password|email|phone|secret)=)[^&]*/gi,
         '$1***',
       );
     }
   }
   
   export function sanitizeBody(body: unknown): unknown {
     if (typeof body !== 'object' || body === null) {
       return body;
     }
     
     const sanitized: Record<string, unknown> = {};
     
     for (const [key, value] of Object.entries(body)) {
       if (SENSITIVE_BODY_FIELDS.includes(key.toLowerCase())) {
         sanitized[key] = '***';
       } else if (typeof value === 'object' && value !== null) {
         sanitized[key] = sanitizeBody(value);
       } else {
         sanitized[key] = value;
       }
     }
     
     return sanitized;
   }
   ```

2. **在日志记录中使用**：
   ```typescript
   // apps/api/src/create-api-server.ts
   import { sanitizePath, sanitizeBody } from '../../../adapters/observability/log-sanitizer.js';
   
   server.addHook('onRequest', (request, _reply, done) => {
     dependencies.logger?.info('api_request_started', {
       correlationId: request.id,
       method: request.method,
       path: sanitizePath(request.routeOptions.url ?? request.url),
     });
     done();
   });
   
   server.addHook('preHandler', (request, _reply, done) => {
     if (request.method === 'POST' || request.method === 'PATCH') {
       dependencies.logger?.debug('api_request_body', {
         correlationId: request.id,
         body: sanitizeBody(request.body),
       });
     }
     done();
   });
   ```

**测试证据**：
```typescript
// adapters/observability/log-sanitizer.test.ts
describe('Log Sanitizer', () => {
  it('sanitizes sensitive query parameters', () => {
    const path = '/api/auth?token=secret123&email=user@example.com';
    expect(sanitizePath(path)).toBe('/api/auth?token=***&email=***');
  });
  
  it('sanitizes sensitive body fields', () => {
    const body = {
      username: 'john',
      password: 'secret123',
      profile: {
        idNumber: '110101199001011234',
      },
    };
    
    expect(sanitizeBody(body)).toEqual({
      username: 'john',
      password: '***',
      profile: {
        idNumber: '***',
      },
    });
  });
  
  it('preserves non-sensitive data', () => {
    const body = { username: 'john', age: 30 };
    expect(sanitizeBody(body)).toEqual({ username: 'john', age: 30 });
  });
});
```

**配置文档更新**：

在 `docs/09_Engineering_Governance/configuration-and-secrets.md` § 11 中已有：
```text
7. 日志必须脱敏 Token、凭据、联系方式和非必要 PII。
```

本次修复提供实现。

**不涉及**：
- ❌ 不改变产品行为
- ❌ 不改变日志格式（只是脱敏值）
- ✅ 新增安全 Adapter

---

### TD-007：错误处理不够细化

#### 问题分析

**当前状态**：
```typescript
export class DomainTransitionError extends Error {
  // 只有一个通用的状态转换错误
}
```

**问题**：
- 缺少业务错误分类（如 `InsufficientFundsError`、`DuplicateReferenceError`）
- 客户端难以区分错误类型并提供友好提示
- 运营难以快速定位问题

**根本原因**：
- 错误类型系统不完善

#### 修复方案

**变更分类**：工程变更（新模块）

**实施步骤**：

1. **创建业务错误基类**：
   ```typescript
   // modules/shared/business-error.ts
   
   export class BusinessError extends Error {
     constructor(
       public readonly code: string,
       public readonly message: string,
       public readonly recoverable: boolean = true,
       public readonly context?: Record<string, unknown>,
     ) {
       super(message);
       this.name = 'BusinessError';
     }
   }
   
   export class InsufficientFundsError extends BusinessError {
     constructor(requested: Money, available: Money) {
       super(
         'INSUFFICIENT_FUNDS',
         `Requested ${requested.minor}, but only ${available.minor} available`,
         true,
         { requested, available },
       );
     }
   }
   
   export class DuplicateReferenceError extends BusinessError {
     constructor(reference: string) {
       super(
         'DUPLICATE_REFERENCE',
         `Commerce Reference ${reference} already assigned`,
         false,
         { reference },
       );
     }
   }
   
   export class InvalidStateTransitionError extends BusinessError {
     constructor(aggregate: string, fromState: string, action: string) {
       super(
         'INVALID_STATE_TRANSITION',
         `${aggregate} cannot perform ${action} from state ${fromState}`,
         false,
         { aggregate, fromState, action },
       );
     }
   }
   ```

2. **在 API 层统一处理**：
   ```typescript
   // adapters/transport/http/api-error-handler.ts
   
   export function registerApiErrorHandling(
     server: FastifyInstance,
     logger?: SafeLogger,
   ) {
     server.setErrorHandler((error, request, reply) => {
       if (error instanceof BusinessError) {
         logger?.warn('business_error', {
           correlationId: request.id,
           code: error.code,
           recoverable: error.recoverable,
           context: error.context,
         });
         
         return reply.code(error.recoverable ? 400 : 409).send({
           error: error.code,
           message: error.message,
           recoverable: error.recoverable,
         });
       }
       
       // 处理其他错误...
     });
   }
   ```

**测试证据**：
```typescript
// modules/shared/business-error.test.ts
describe('Business Error', () => {
  it('creates insufficient funds error with context', () => {
    const error = new InsufficientFundsError(
      { currency: 'CNY', minor: 10000n },
      { currency: 'CNY', minor: 5000n },
    );
    
    expect(error.code).toBe('INSUFFICIENT_FUNDS');
    expect(error.recoverable).toBe(true);
    expect(error.context).toEqual({
      requested: { currency: 'CNY', minor: 10000n },
      available: { currency: 'CNY', minor: 5000n },
    });
  });
});
```

**不涉及**：
- ❌ 不改变产品行为（只是错误分类）
- ✅ 改进用户体验和可维护性

---

### TD-008：性能监控埋点缺失

#### 问题分析

**当前状态**：
- 只有请求开始/结束日志
- 未见数据库查询耗时、慢查询监控
- 缺少性能瓶颈诊断能力

**风险**：
- 生产环境性能问题难以定位
- 无法主动发现慢查询

**根本原因**：
- 可观测性基础设施不完整

#### 修复方案

**变更分类**：工程变更（新 Adapter）

**实施步骤**：

1. **创建性能监控 Adapter**：
   ```typescript
   // adapters/observability/performance-monitor.ts
   
   export interface PerformanceMetrics {
     operation: string;
     duration_ms: number;
     success: boolean;
     error?: string;
   }
   
   export class PerformanceMonitor {
     constructor(private readonly logger: SafeLogger) {}
     
     async trackDatabaseQuery<T>(
       operation: string,
       query: () => Promise<T>,
     ): Promise<T> {
       const start = performance.now();
       
       try {
         const result = await query();
         const duration = performance.now() - start;
         
         this.recordMetric({
           operation,
           duration_ms: duration,
           success: true,
         });
         
         if (duration > 1000) {
           this.logger.warn('slow_query_detected', {
             operation,
             duration_ms: duration,
           });
         }
         
         return result;
       } catch (error) {
         const duration = performance.now() - start;
         
         this.recordMetric({
           operation,
           duration_ms: duration,
           success: false,
           error: error instanceof Error ? error.message : String(error),
         });
         
         this.logger.error('query_failed', {
           operation,
           duration_ms: duration,
           error,
         });
         
         throw error;
       }
     }
     
     private recordMetric(metric: PerformanceMetrics): void {
       this.logger.info('performance_metric', metric);
     }
   }
   ```

2. **在 Repository 中使用**：
   ```typescript
   // adapters/persistence/postgres/commerce-profile-repository.ts
   
   export class PostgresCommerceProfileRepository {
     constructor(
       private readonly db: DatabaseConnection,
       private readonly performanceMonitor: PerformanceMonitor,
     ) {}
     
     async findByIdmyId(identityId: string): Promise<CommerceProfile | null> {
       return this.performanceMonitor.trackDatabaseQuery(
         'find_commerce_profile_by_identity',
         async () => {
           const result = await this.db
             .select()
             .from(commerceProfiles)
             .where(eq(commerceProfiles.identityId, identityId))
             .limit(1);
           
           return result[0] ?? null;
         },
       );
     }
   }
   ```

**测试证据**：
```typescript
// adapters/observability/performance-monitor.test.ts
describe('Performance Monitor', () => {
  it('tracks successful query duration', async () => {
    const logger = createMockLogger();
    const monitor = new PerformanceMonitor(logger);
    
    await monitor.trackDatabaseQuery('test_query', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'success';
    });
    
    expect(logger.info).toHaveBeenCalledWith('performance_metric', 
      expect.objectContaining({
        operation: 'test_query',
        success: true,
        duration_ms: expect.any(Number),
      }),
    );
  });
  
  it('warns on slow queries', async () => {
    const logger = createMockLogger();
    const monitor = new PerformanceMonitor(logger);
    
    await monitor.trackDatabaseQuery('slow_query', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      return 'success';
    });
    
    expect(logger.warn).toHaveBeenCalledWith('slow_query_detected', 
      expect.objectContaining({
        operation: 'slow_query',
        duration_ms: expect.any(Number),
      }),
    );
  });
});
```

**不涉及**：
- ❌ 不改变产品行为
- ✅ 提升可观测性

---

### TD-009：C号 碰撞处理未完整实现

#### 问题分析

**当前设计**：
```text
Generation = CSPRNG + UNIQUE constraint + collision retry
```

**缺失**：
- 数据库 UNIQUE 约束存在 ✅
- 应用层碰撞重试逻辑缺失 ❌

**风险**：
- C号 分配可能因碰撞而失败（虽然概率极低）

**根本原因**：
- 应用层未实现完整的碰撞处理

#### 修复方案

**变更分类**：工程变更（应用层增强）

**实施步骤**：

1. **在 Application Service 中实现碰撞重试**：
   ```typescript
   // applications/private-commerce-reference/commerce-reference-assignment-service.ts
   
   import { generateCommerceReference } from '../../modules/commerce-reference/commerce-reference-generator.js';
   
   export class CommerceReferenceAssignmentService {
     async assignCommerceReference(
       profileId: string,
       maxRetries: number = 3,
     ): Promise<CommerceReference> {
       for (let attempt = 1; attempt <= maxRetries; attempt++) {
         const ref = generateCommerceReference();
         
         try {
           return await this.repository.createCommerceReference({
             commerceReference: ref,
             commerceProfileId: profileId,
             lifecycle: 'ASSIGNED',
             assignedAt: new Date().toISOString(),
           });
         } catch (error) {
           const isCollision = 
             this.isUniqueConstraintViolation(error, 'commerce_reference');
           
           if (isCollision && attempt < maxRetries) {
             this.logger.warn('commerce_reference_collision', {
               attempt,
               profileId,
               collisionReference: ref,
             });
             continue;  // 重试
           }
           
           throw error;
         }
       }
       
       throw new BusinessError(
         'REFERENCE_ASSIGNMENT_FAILED',
         `Failed to assign Commerce Reference after ${maxRetries} retries`,
         false,
       );
     }
     
     private isUniqueConstraintViolation(
       error: unknown,
       field: string,
     ): boolean {
       // PostgreSQL unique constraint error code: 23505
       return (
         error instanceof Error &&
         'code' in error &&
         error.code === '23505' &&
         error.message.includes(field)
       );
     }
   }
   ```

**测试证据**：
```typescript
// applications/private-commerce-reference/commerce-reference-assignment-service.test.ts
describe('Commerce Reference Assignment Service', () => {
  it('retries on collision', async () => {
    const mockRepository = {
      createCommerceReference: vi.fn()
        .mockRejectedValueOnce({ code: '23505', message: 'commerce_reference' })
        .mockResolvedValueOnce({ commerceReference: 'SUCCESS' }),
    };
    
    const service = new CommerceReferenceAssignmentService(mockRepository);
    const result = await service.assignCommerceReference('profile-123');
    
    expect(result.commerceReference).toBe('SUCCESS');
    expect(mockRepository.createCommerceReference).toHaveBeenCalledTimes(2);
  });
  
  it('throws after max retries', async () => {
    const mockRepository = {
      createCommerceReference: vi.fn()
        .mockRejectedValue({ code: '23505', message: 'commerce_reference' }),
    };
    
    const service = new CommerceReferenceAssignmentService(mockRepository);
    
    await expect(
      service.assignCommerceReference('profile-123', 3),
    ).rejects.toThrow('REFERENCE_ASSIGNMENT_FAILED');
    
    expect(mockRepository.createCommerceReference).toHaveBeenCalledTimes(3);
  });
});
```

**不涉及**：
- ❌ 不改变产品行为（只是提高可靠性）
- ✅ 完善应用层逻辑

---

### TD-010：事务边界未明确标注

#### 问题分析

**当前状态**：
- Repository 层有事务支持，但应用层未明确标注哪些操作需要事务
- 复杂业务流程（如 Order → Payment → Ledger Entry）可能不在同一事务

**风险**：
- 部分成功导致数据不一致
- 难以追溯哪些操作应该原子执行

**根本原因**：
- 事务边界不清晰

#### 修复方案

**变更分类**：工程变更（文档 + 代码注释）

**实施步骤**：

1. **在 Application Service 中明确标注**：
   ```typescript
   // applications/paid-commerce/paid-commerce-service.ts
   
   /**
    * Creates an order and initiates payment in a single transaction.
    * 
    * @transactional This operation must be executed within a database transaction.
    * @invariant Order and Payment must both succeed or both fail.
    */
   async createOrderAndInitiatePayment(
     input: CreateOrderInput,
   ): Promise<{ order: PaidServiceOrder; payment: Payment }> {
     return this.db.transaction(async (tx) => {
       const order = await tx.createOrder(input);
       const payment = await tx.createPayment({
         orderId: order.id,
         amount: order.snapshot.grossPrice,
       });
       
       await tx.recordLedgerEntry({
         type: 'pending_earnings_credited',
         orderId: order.id,
         creatorId: order.creatorId,
         amount: order.snapshot.grossPrice,
       });
       
       return { order, payment };
     });
   }
   ```

2. **创建事务边界文档**：
   ```markdown
   <!-- docs/09_Engineering_Governance/61_Transaction_Boundaries.md -->
   
   # Transaction Boundaries
   
   ## 必须在同一事务中的操作
   
   ### Paid Commerce
   
   - Order + Payment 创建
   - Payment 确认 + Ledger Entry 记录
   - Fulfillment + Settlement 创建
   - Withdrawal 请求 + Ledger Entry 更新
   
   ### Identity & Commerce Profile
   
   - Identity 创建 + Commerce Profile 创建
   - Commerce Reference 分配 + Commerce Profile 更新
   
   ## 不需要事务的操作
   
   - 只读查询
   - 日志记录
   - 事件发送（异步，最终一致性）
   ```

**测试证据**：
```typescript
// tests/integration/transaction-boundaries.test.ts
describe('Transaction Boundaries', () => {
  it('rolls back order and payment on payment failure', async () => {
    const mockPaymentAdapter = {
      createPayment: vi.fn().mockRejectedValue(new Error('Payment failed')),
    };
    
    await expect(
      paidCommerceService.createOrderAndInitiatePayment({
        ...validInput,
        paymentAdapter: mockPaymentAdapter,
      }),
    ).rejects.toThrow('Payment failed');
    
    // 验证 Order 也未创建（事务回滚）
    const order = await db.findOrder(validInput.orderId);
    expect(order).toBeNull();
  });
});
```

**不涉及**：
- ❌ 不改变产品行为
- ✅ 提升可维护性和数据一致性

---

## 4. 实施计划

### 4.1 分阶段实施

**Phase 1：P0 阻塞项**（第 1 周）
- TD-001：测试失败修复（2h）
- TD-002：C号 生成算法（4h）
- TD-003：API 速率限制（3h）
- TD-009：C号 碰撞处理（2h）

**Phase 2：P1 重要项**（第 2 周）
- TD-004：Webhook 签名验证（4h）
- TD-005：幂等性实施（3h）
- TD-006：日志脱敏（3h）

**Phase 3：P2 优化项**（第 3-4 周）
- TD-007：错误处理细化（4h）
- TD-008：性能监控（4h）
- TD-010：事务边界标注（3h）

### 4.2 实施检查清单

每个 Technical Debt 修复必须完成：

- [ ] 代码实现
- [ ] 单元测试通过
- [ ] 集成测试通过（如适用）
- [ ] 文档更新（如适用）
- [ ] 依赖登记（如适用）
- [ ] 在 `21_Prototype_Execution.md` 中记录
- [ ] Code Review 通过
- [ ] CI/CD 通过

### 4.3 验收标准

**Phase 1 完成标准**：
```bash
pnpm test                     # 所有测试通过（无失败）
pnpm test:persistence         # 持久化测试 100% 通过
pnpm test:integration         # 集成测试 100% 通过
pnpm run lint                 # 无 Lint 错误
pnpm run typecheck            # 无类型错误
```

**Phase 2 完成标准**：
- Webhook 签名验证集成测试通过
- 幂等性集成测试通过
- 日志脱敏单元测试通过

**Phase 3 完成标准**：
- 错误分类系统完整
- 性能监控日志可见
- 事务边界文档完成

### 4.4 风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| TD-002 实现时发现 C号 设计不足 | 高 | 立即咨询 Founder，必要时登记 `DEV-###` |
| TD-005 Migration 失败 | 中 | 在测试环境充分验证，准备回滚脚本 |
| TD-004 Webhook 签名算法不明确 | 中 | 参考微信支付官方文档，实现通用接口 |
| 时间超出预估 | 低 | P2 项可推迟到下个迭代 |

---

## 5. 后续行动

### 5.1 立即行动

1. **Founder 审批**：本文档需要 Founder 确认后开始实施
2. **创建 JIRA/GitHub Issues**：为每个 TD 创建跟踪 Issue
3. **分配执行人**：确定每个 TD 的负责人

### 5.2 持续改进

在完成这 10 项 Technical Debt 后：

1. **建立技术债评审机制**：每个迭代结束时评审新增技术债
2. **防止技术债累积**：Code Review 时主动识别潜在技术债
3. **定期回顾**：每季度回顾技术债清单，调整优先级

---

## 6. 决策记录

### D-60-01 — 技术债修复不需要 DEV-### 登记

- **Decision**：这 10 项技术债修复均为工程实践增强，不改变产品行为，因此不需要登记 `DEV-###` 偏差。
- **Reason**：根据 `22_Engineering_Governance.md` § 10.1，"产品行为不变的内部重构"和"不改变产品行为的新模块或 Adapter"属于普通工程变更。
- **Consequence**：修复过程中如果发现需要改变产品行为（如 C号 格式调整），必须立即停止并登记偏差。
- **Revisit Trigger**：任何修复导致 API 契约、产品对象、状态机或规范事件变化时。

### D-60-02 — 优先级调整授权

- **Decision**：实施过程中，如果发现 P2 项的实际风险高于预期，执行人可以提升优先级并调整排期。
- **Reason**：技术债评估可能不完整，实施过程中可能发现新风险。
- **Consequence**：优先级调整必须在本文档中更新并通知 Founder。
- **Revisit Trigger**：Phase 1 完成后评审一次优先级准确性。

### D-60-03 — 测试覆盖强制要求

- **Decision**：每个 Technical Debt 修复必须有对应的测试覆盖，无测试不允许合并。
- **Reason**：防止修复引入新的 Bug，保证工程质量。
- **Consequence**：Code Review 时将检查测试覆盖率。
- **Revisit Trigger**：无。

---

**END OF DOCUMENT**
