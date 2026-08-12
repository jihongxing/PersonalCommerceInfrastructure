# 24 — 技术架构落地规划

> **状态**：Execution Plan v4 — CU-TA-01–CU-TA-07、ENG-008、M2 与 M3 已完成  
> **阶段**：M1.5 技术架构基线完成 / M2、M3 已完成基础验收 / M4 工程入口已开放  
> **范围**：VS-01 受控原型的工程架构演进  
> **文档角色**：把 `23` 的技术架构决策转换为可执行 Change Unit、依赖顺序与工程门禁  
> **上游事实源**：[20 MVP PRD: VS-01](../07_Product_Architecture/20_MVP_PRD_VS01.md)、[21 Prototype Execution](../08_Execution/21_Prototype_Execution.md)、[22 工程治理](./22_Engineering_Governance.md)、[23 技术架构决策](./23_Technology_Architecture_Decision.md)  
> **最后更新**：2026-08-11

## 1. 目的

本规划回答：

> 如何在不冻结最终产品形态的前提下，维护已经落地的跨端 VS-01 工程底座，并约束后续产品里程碑？

本规划不重新定义产品。CU-TA-01–CU-TA-07 已建立工程底座；M2 已实现 Creator Identity 的创建、读取、编辑与 Capability 关联；M3 已实现 Service Offering Draft、Capability 关联、最小可请求条件与 Publish Eligibility 反馈。公开入口尚未进入 VS-01 范围，因此 FR-005 保持 Partial，直到 M5 Public Surface 提供可验证的拒绝路径。

落地目标是：

```text
M1 Foundation
    ↓
平台无关的 Application Core
    ↓
稳定的跨端 API Contract
    ↓
可替换的基础设施 Adapter
    ↓
首个 Web Reference Client
    ↓
未来 App / Mini-program Client
```

## 2. 当前工程基线

### 2.1 当前已具备

当前仓库已经具备：

- Node.js 22、TypeScript strict mode 和 pnpm；
- 模块化单体目录基础；
- Creator / Customer / Platform Actor 策略；
- `Commerce Identity`、`Offering`、`Distribution Asset`、`Commerce Action` 状态机；
- `Commerce Decision` 终态决策；
- Canonical Event Registry；
- 配置 Bootstrap；
- 安全结构化日志；
- Vitest 分层测试入口；
- `AT-001–AT-013` 验收入口；
- GitHub Actions 与完整 Preflight。
- 平台无关的 Application Core、Port 与 Unit of Work；
- Fastify API Runtime、TypeBox Contract、OpenAPI 与统一错误 Envelope；
- PostgreSQL Product Event Store、Drizzle Migration 与 Podman 真实事务验证；
- Supabase Auth Adapter Contract、Creator Actor 显式映射、可替换测试身份与 Hosted Provider 真实验证；
- Next.js Web Reference Client、生成式 API Client 与三类路由骨架；
- Playwright 双服务 Acceptance Harness，使用系统 Edge 执行；
- Web Build、OpenAPI Client 生成与浏览器烟雾测试已进入 Preflight。
- Creator Identity 的领域模型、Application Use Case、v1 API、PostgreSQL Repository / Migration 与 Web Reference Client；
- M2 的领域、应用、API、PostgreSQL 集成与 Edge 浏览器验收证据。

### 2.2 当前未完成项

| 未完成项                    | 当前影响                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| M3–M7 Application Use Case  | Offering、Publish、Request、Decision 与 Notification 产品 API 尚未实现 |
| 后续产品数据持久化          | Creator Identity / Capability 已持久化；Offering、Action 等对象仍未实现 |
| AT-001–AT-013 产品验收      | Harness 已就绪；M2 子流程已独立验证，完整 AT 仍因后续依赖保持显式 Skip |
| Customer 轻量访问凭据       | ENG-009 在 M5 前处理                                                |
| 真实通知 Provider           | ENG-010 在 M7 前处理                                                |

这些是后续产品里程碑缺口，不再是 M1.5 架构底座或 Provider 真实性缺口。

## 3. 目标架构

### 3.1 逻辑视图

```text
┌────────────────────────────────────────────────────────────┐
│ Clients                                                    │
│ Web Reference Client | Future App | Future Mini-program    │
└────────────────────────────┬───────────────────────────────┘
                             │ HTTP / OpenAPI Contract
┌────────────────────────────▼───────────────────────────────┐
│ Transport Layer                                            │
│ Route | Validation | Authentication Context | Serialization│
└────────────────────────────┬───────────────────────────────┘
                             │ Command / Query
┌────────────────────────────▼───────────────────────────────┐
│ Application Layer                                          │
│ Use Cases | Authorization | Unit of Work | Event Dispatch   │
└────────────────────────────┬───────────────────────────────┘
                             │ Domain Calls / Ports
┌────────────────────────────▼───────────────────────────────┐
│ Business Modules                                           │
│ Identity | Offering | Distribution | Request | Decision     │
│ Product Facts | State Machines | Product Rules             │
└────────────────────────────┬───────────────────────────────┘
                             │ Ports
┌────────────────────────────▼───────────────────────────────┐
│ Adapters                                                   │
│ PostgreSQL | Auth | Notification | Observability | Storage  │
└────────────────────────────────────────────────────────────┘
```

### 3.2 物理部署视图

VS-01 初期采用模块化单体部署：

```text
API Runtime
├── Transport
├── Application Services
├── Business Modules
└── Infrastructure Adapters

PostgreSQL

Web Reference Client
```

API Runtime 与 Web Reference Client 可以在开发环境中共同运行，但必须保持逻辑边界。未来是否部署为同一进程、同一平台或独立服务，属于部署决策，不影响应用契约。

### 3.3 依赖方向

允许：

```text
Client → API Contract
Transport → Application
Application → Domain + Ports
Adapter → Ports + External SDK
Composition Root → All Required Implementations
```

禁止：

```text
Domain → Client Framework
Domain → Database ORM
Domain → Provider SDK
Client → Database
Client → Canonical Event Store
Transport → Direct State Mutation
Adapter → Product Rule Definition
```

## 4. 开源组件策略

### 4.1 组件选择原则

成熟开源组件优先用于：

- Web 与 API 运行时；
- 数据库和迁移；
- 身份认证；
- 对象存储；
- Schema 校验；
- API 文档和客户端生成；
- 日志、可观测性；
- 自动化测试；
- CI 和本地开发环境。

项目必须自行拥有：

- 产品对象语义；
- 状态机与转换不变量；
- Actor 权限规则；
- Application Use Case；
- Canonical Event 语义；
- FR / AT 追溯；
- Shadow Commerce 边界。

### 4.2 推荐组件矩阵

| 能力                 | 推荐组件                               | 采用阶段                  | 使用边界                             |
| -------------------- | -------------------------------------- | ------------------------- | ------------------------------------ |
| API Runtime          | Fastify                                | M1.5                      | 只负责 HTTP、插件和运行时组合        |
| API Schema           | JSON Schema + TypeBox                  | M1.5                      | 仅定义 Transport 输入输出            |
| API 文档             | `@fastify/swagger`                     | M1.5                      | 从受治理 Route Schema 生成 OpenAPI   |
| API 客户端           | `openapi-typescript` / `openapi-fetch` | Reference Client 阶段     | 客户端消费 API，不复制业务类型       |
| 数据库               | PostgreSQL                             | M1.5 / M2                 | 关系数据、事务和审计事实             |
| ORM                  | Drizzle ORM                            | M1.5 / M2                 | 仅在 Persistence Adapter 内使用      |
| Migration            | Drizzle Kit + SQL Review               | M1.5 / M2                 | 所有 Schema 变化进入版本化 Migration |
| Auth                 | Supabase Auth                          | M2 前                     | 通过 Auth Adapter 映射为统一 Actor   |
| Storage              | Supabase Storage                       | 出现头像或文件需求时      | 不提前引入；通过 Storage Port 接入   |
| Web Reference Client | Next.js + React                        | API Core 稳定后           | 只负责参考界面和交互                 |
| UI 基础              | Tailwind CSS + shadcn/ui               | Web Reference Client 阶段 | 不进入 Domain / Application          |
| 单元与应用测试       | Vitest                                 | 已采用                    | Domain、Application、Contract 测试   |
| 数据库集成测试       | Podman + PostgreSQL                    | 已采用                    | 验证真实 Migration、事务和约束       |
| Web E2E              | Playwright + 系统 Edge                 | 已采用                    | 执行 Web Reference Client 的 AT      |
| 日志                 | Pino Adapter                           | API Runtime 阶段          | 延续现有 PII 脱敏规则                |
| 可观测性             | OpenTelemetry                          | 出现跨 Adapter 诊断需求时 | 不在 M1.5 强制引入                   |
| CI                   | GitHub Actions                         | 已采用                    | 增量加入 API、数据库和 E2E 门禁      |

### 4.3 为什么选择独立 Fastify API

采用独立 API Runtime，而不是用 Next.js 专属机制承载核心能力，原因是：

1. Web、App 和小程序都可以消费同一契约；
2. API 生命周期不依赖 Web 框架；
3. Transport Schema、认证和错误映射有明确边界；
4. Fastify 可以保持轻量，不替代现有业务模块；
5. OpenAPI 可以成为跨端客户端生成和契约测试的输入；
6. 未来替换 Reference Client 不影响业务实现。

Fastify 不拥有产品行为。业务动作仍由 Application Service 和 Domain Module 完成。

### 4.4 为什么保留 Next.js

Next.js 仍适合作为 Web Reference Client，因为它可以快速提供：

- Creator 管理界面；
- Public Commerce Identity；
- Customer Request Flow；
- 服务端渲染的公开页面；
- 可分享 URL；
- Playwright 可操作界面。

但必须遵守：

- 不用 Server Actions 作为唯一业务入口；
- 页面通过统一 API Client 调用后端；
- 页面组件不直接调用 Drizzle 或 Supabase Database；
- 页面不自行决定状态转换；
- Web 专属缓存不得改变产品事实。

### 4.5 为什么选择 PostgreSQL 与 Drizzle

VS-01 对象之间具有明确关系：

```text
Creator
→ Commerce Identity
→ Offering
→ Availability
→ Distribution Asset
→ Commerce Action
→ Confirmed Commerce
→ Canonical Event
```

PostgreSQL 适合：

- 所有权和关联约束；
- 状态与唯一性约束；
- Request / Confirm 的事务一致性；
- Canonical Event 审计；
- 后续分析与运营查询。

Drizzle 仅承担：

- TypeScript 数据访问；
- Schema 表达；
- Migration 管理；
- Persistence Adapter 实现。

Drizzle Model 不得成为 Domain Model。

### 4.6 Supabase 的正确定位

初期推荐托管 Supabase 提供：

- PostgreSQL 托管；
- Auth；
- 按需对象存储；
- 开发阶段管理工具。

Supabase 不是业务平台，也不是产品事实源。

禁止：

- 客户端直接通过 Supabase SDK 修改 Offering 或 Commerce Action 状态；
- 使用 Row Level Security 代替全部领域权限规则；
- 把 Supabase User 直接等同于 `Creator` 或 `Customer`；
- 把 Supabase 数据库类型泄漏到业务模块。

允许：

- 客户端使用 Auth SDK 完成登录会话；
- API 验证 Provider Token；
- Auth Adapter 将 Provider Identity 映射为统一 Actor Context；
- Persistence Adapter 使用 PostgreSQL 连接。

## 5. 应用层规划

### 5.1 Application Service 责任

Application Service 负责：

- 接收经过 Transport 校验的命令；
- 加载 Actor Context；
- 执行用例级权限检查；
- 通过 Repository Port 加载对象；
- 调用领域状态机和产品规则；
- 在同一工作单元内保存状态变化；
- 记录 Canonical Event；
- 请求 Notification Port 发送状态通知；
- 返回与客户端无关的结果。

Application Service 不负责：

- 页面导航；
- HTML 或 UI 文案；
- 数据库 SQL；
- Provider SDK 调用；
- 创建新的产品状态；
- 绕过 Domain 直接修改状态。

### 5.2 VS-01 Application Use Case

后续 M2–M7 只能通过以下已批准用例扩展：

| 用例                        | 对应里程碑 |
| --------------------------- | ---------- |
| `CreateCommerceIdentity`    | M2         |
| `UpdateCommerceIdentity`    | M2         |
| `GetCreatorHome`            | M2         |
| `GetPublicCommerceIdentity` | M2 / M4    |
| `CreateServiceOffering`     | M3         |
| `UpdateServiceOffering`     | M3         |
| `SetOfferingAvailability`   | M3         |
| `PublishOffering`           | M4         |
| `UnpublishOffering`         | M4         |
| `RecordDistribution`        | M4         |
| `GetPublicOffering`         | M4 / M5    |
| `CreateCommerceAction`      | M5         |
| `GetCreatorRequests`        | M5         |
| `ConfirmCommerceAction`     | M6         |
| `DeclineCommerceAction`     | M6         |
| `GetCommerceActionResult`   | M6         |

新增用例前必须证明其对应 `FR-001–FR-053`；不能追溯到 FR 的用例不得进入 VS-01。

### 5.3 Port 规划

当前计划建立：

| Port                          | 责任                                | 首个 Adapter                                    |
| ----------------------------- | ----------------------------------- | ----------------------------------------------- |
| `CommerceIdentityRepository`  | 身份加载和保存                      | PostgreSQL                                      |
| `OfferingRepository`          | Offering 与 Availability 加载和保存 | PostgreSQL                                      |
| `DistributionAssetRepository` | 分发资产保存和状态读取              | PostgreSQL                                      |
| `CustomerRepository`          | Customer 联系信息和请求关联         | PostgreSQL                                      |
| `CommerceActionRepository`    | Request 与终态保存                  | PostgreSQL                                      |
| `ConfirmedCommerceRepository` | Confirmed Commerce 保存             | PostgreSQL                                      |
| `ProductEventStore`           | Canonical Event 追加与查询          | PostgreSQL                                      |
| `AuthContextProvider`         | Provider Session → Actor Context    | Supabase Auth Adapter                           |
| `NotificationPort`            | 状态变化通知                        | In-memory / Log Adapter，M7 再决定真实 Provider |
| `Clock`                       | 可测试时间来源                      | System Clock / Fixed Clock                      |
| `IdGenerator`                 | 可测试 ID 来源                      | UUID Adapter                                    |
| `UnitOfWork`                  | 状态与事件原子提交                  | PostgreSQL Transaction                          |

不建立无实际调用方的通用 Repository 或抽象基础类。

## 6. API 契约规划

### 6.1 Contract 原则

API Contract：

- 面向应用用例，不机械映射数据库表；
- 只表达客户端需要提交和读取的数据；
- 使用稳定业务错误码；
- 不向客户端暴露 ORM、Provider 或内部事件存储结构；
- 对所有客户端保持一致的产品语义；
- 可生成 OpenAPI 文档与类型安全客户端。

### 6.2 API Namespace

VS-01 初期使用版本化前缀：

```text
/api/v1
```

资源路径可以按 Identity、Offering 和 Commerce Action 组织，但每个写操作必须映射到唯一 Application Use Case。

示例仅作为工程方向，不在本规划冻结完整 API：

```text
POST   /api/v1/creator/identity
PATCH  /api/v1/creator/identity
POST   /api/v1/creator/offerings
POST   /api/v1/creator/offerings/:id/publish
POST   /api/v1/public/offerings/:id/requests
POST   /api/v1/creator/requests/:id/confirm
POST   /api/v1/creator/requests/:id/decline
GET    /api/v1/public/creators/:handle
```

具体 API Route 必须在对应 M2–M6 Change Unit 中和 FR 一起冻结。

### 6.3 错误契约

应用错误至少区分：

| 类别           | 示例                       |
| -------------- | -------------------------- |
| Validation     | 缺少发布条件、无效输入     |
| Authentication | 无有效 Actor 会话          |
| Authorization  | 非 Owner Creator 尝试操作  |
| Not Found      | 对象不存在或不可公开访问   |
| Conflict       | 非法状态转换、重复终态操作 |
| Unavailable    | Offering 当前不可请求      |
| Internal       | 未预期的系统错误           |

错误响应不得泄漏：

- 数据库结构；
- Provider 原始错误；
- Stack Trace；
- Customer PII；
- 内部 Canonical Event Payload。

## 7. 数据与持久化规划

### 7.1 Schema 原则

产品对象不自动等于数据表。Schema 根据：

- 聚合一致性；
- 所有权；
- 查询路径；
- 唯一性；
- 事务边界；
- 审计要求；
- PII 隔离；
- 删除与保留策略

独立决定。

### 7.2 初始数据边界

VS-01 持久化只覆盖已实现对象，不提前建立 Deferred Object 表。

预计最小持久化区域：

```text
actors / auth mappings
commerce identities
capabilities
offerings
availability
distribution assets
customers
commerce actions
confirmed commerce
product events
notification deliveries
```

这不是最终表名，也不表示每一项必须独立成表。

### 7.3 迁移规则

1. 所有 Schema 变化必须生成版本化 SQL Migration；
2. 禁止在共享或生产环境使用无审查 Schema Push；
3. Migration 必须能在空数据库执行；
4. Migration 必须在 CI 的临时 PostgreSQL 中验证；
5. 破坏性变化必须记录数据迁移和回滚策略；
6. Product Event 不得因业务表重构失去历史解释能力；
7. PII 字段必须在 Schema Review 中显式标注。

### 7.4 事务边界

以下操作必须在单一工作单元内提交：

- 对象状态变化；
- 关联对象创建；
- Canonical Event 追加；
- 必要的通知投递记录。

外部通知发送可以异步，但其“应发送”事实必须与业务变化一致地记录。

## 8. 身份、权限与多端会话

### 8.1 Actor 模型

产品 Actor 继续保持：

- `Creator`；
- `Customer`；
- `Platform`。

认证 Provider 的 User / Session 只提供身份凭据，不取代产品 Actor。

```text
Provider Identity
    ↓ Auth Adapter
Actor Context
    ↓ Application Authorization
Product Action
```

### 8.2 Creator 会话

Creator 使用真实认证会话访问管理能力。API 必须：

- 验证 Token；
- 映射 Creator Actor；
- 校验资源所有权；
- 不信任客户端提交的 `creatorId`。

### 8.3 Customer 会话

VS-01 Customer 不要求完整注册账号。

初期可以采用：

- Request-specific Access Token；
- 签名结果链接；
- 短期 Session；
- 经批准的等价轻量方案。

最终选择必须满足：

- Customer 能提交 Request；
- Customer 能读取自己的结果；
- 其他 Customer 不能读取；
- 不提前实现 Relationship / CRM；
- Token 不进入日志；
- Token 可撤销或失效。

## 9. 客户端规划

### 9.1 客户端共同责任

所有客户端只负责：

- 表面呈现；
- 输入收集；
- API 调用；
- 状态展示；
- 客户端平台能力适配；
- 可恢复的交互状态。

所有客户端不得负责：

- 领域状态转换；
- 所有权判断；
- Canonical Event 创建；
- 数据持久化；
- Confirmed Commerce 业务定义。

### 9.2 Web Reference Client

首个 Reference Client 预计提供：

- Creator Home；
- Commerce Identity Editor；
- Offering Editor；
- Request Management；
- Public Commerce Identity；
- Public Offering；
- Customer Request；
- Customer Result。

它用于：

- 让 VS-01 可操作；
- 运行 Playwright Acceptance；
- 验证应用 API；
- 支持 Prototype Review。

它不决定产品最终是 Web、App 还是小程序。

### 9.3 未来 App 与小程序

出现真实需求前不建立客户端代码，但架构必须保证：

- OpenAPI 可生成对应客户端；
- Auth Adapter 可以接受不同平台凭据；
- 分享能力通过 Client Adapter 实现；
- 推送和订阅消息通过 Notification Adapter 实现；
- 业务错误与状态语义保持一致。

## 10. Canonical Event 落地

### 10.1 唯一事件源

现有 Canonical Event Registry 继续作为唯一名称注册表。

工程实现必须：

- 由 Application Service 在业务动作成功后记录事件；
- 使用受治理的事件 Payload；
- 带有 Actor、Object、Timestamp、Correlation 和 Source；
- 避免把按钮点击当成产品事实；
- 防止重复终态事件；
- 保证客户端类型不改变事件名称。

### 10.2 Event Store

VS-01 使用 PostgreSQL Append-only Product Event Store，不引入 Kafka 或独立 Event Bus。

Event Store 主要用于：

- 产品事实审计；
- FR / AT 验收证据；
- Prototype 行为分析；
- 状态问题追踪。

当前不实施完整 Event Sourcing。业务对象仍以当前状态持久化，Canonical Event 作为受治理事实记录。

## 11. 测试落地

### 11.1 测试分层

```text
Domain Tests
    ↓
Application Use Case Tests
    ↓
Contract Tests
    ↓
Persistence / Adapter Integration Tests
    ↓
API Integration Tests
    ↓
Reference Client Component Tests
    ↓
Playwright Acceptance Tests
```

### 11.2 各层责任

| 测试层          | 验证内容                                        |
| --------------- | ----------------------------------------------- |
| Domain          | 状态机、不变量、纯业务规则                      |
| Application     | 权限、用例编排、事件和事务意图                  |
| Contract        | 请求响应 Schema、错误码、OpenAPI 稳定性         |
| Persistence     | Migration、Repository、事务、唯一性             |
| API Integration | Auth Context、Route、Application 调用和错误映射 |
| Client          | 状态感知 UI、输入与 API 适配                    |
| Acceptance      | `AT-001–AT-013` 端到端产品行为                  |

### 11.3 AT 执行原则

Playwright 只执行 Web Reference Client 的验收路径，但 AT 的产品语义不属于 Web。

未来出现 App 或小程序时：

- 继续复用 AT 的业务场景；
- 替换客户端自动化 Driver；
- 不重新定义验收结果。

## 12. 环境与交付规划

### 12.1 环境

至少区分：

| 环境      | 目的               |
| --------- | ------------------ |
| Local     | 开发和快速反馈     |
| CI        | 隔离的自动化验证   |
| Prototype | 受控原型演示和验收 |

当前不要求建立公开 Production 环境。

### 12.2 本地开发

本地开发应支持：

- API Runtime；
- PostgreSQL；
- Web Reference Client；
- 测试数据库；
- 配置 Bootstrap；
- Mock / Log Notification Adapter。

容器运行规则：

- 当前本地容器运行时为 Podman；
- PostgreSQL 真实集成验证使用临时 Podman 容器；
- 不因缺少 Docker 引入第二套实现路径；
- 不要求开发者把 Node.js 应用全部容器化；
- 不为尚未存在的服务创建容器；
- Supabase Local 只有在 Auth / Storage 本地联调确有价值时引入。

### 12.3 CI 演进

当前 Preflight：

```text
Governance
→ Format
→ Lint
→ Typecheck
→ Vitest
→ Server Build
→ OpenAPI Client Generation
→ Web Typecheck
→ Reference Client Build
→ Playwright Acceptance
```

PostgreSQL 真实集成测试在提供 `DATABASE_URL` 时运行；普通 Preflight 不伪造外部 Provider 证据。

## 13. Change Unit 落地顺序

### CU-TA-01 — Workspace Boundary Preparation

**状态**：Complete（2026-08-11）

**目标**

让当前仓库可以承载独立 API、Application 和 Contract，而不改变产品行为。

**变更**

- 建立 `applications/` 或经治理批准的等价应用层位置；
- 建立 `contracts/`；
- 调整 TypeScript、ESLint、Prettier 和 Build 范围；
- 增加边界检查；
- 保留 `apps/prototype` 作为当前组合根。

**不做**

- 不创建 Creator Identity 功能；
- 不安装客户端框架；
- 不创建数据库表。

**退出条件**

- 当前 28 项测试继续通过；
- AT 入口保持 Skip；
- Domain 不依赖 Application、Transport 或 Framework；
- Preflight 通过。

**完成证据**

- 建立 `applications/` 和 `contracts/` 的目录职责合同与局部 `AGENTS.md`；
- TypeScript、pnpm Workspace、Prettier、ESLint 和 Build 范围已覆盖新边界；
- 新增 `scripts/test/check-import-boundaries.mjs` 自动检查层级依赖；
- 新增 `tests/governance/import-boundaries.test.ts`，将边界检查纳入 Vitest；
- Preflight 在工程治理检查后强制执行导入边界检查；
- 未新增 Application Use Case、API Route、产品对象、客户端框架或数据库资产；
- `pnpm preflight` 于 2026-08-11 通过。

### CU-TA-02 — Application Core and Ports

**状态**：Complete（2026-08-11）

**目标**

建立平台无关的 Application Service、Repository Port、Clock、ID 和 Unit of Work 边界。

**变更**

- 定义应用错误模型；
- 定义 Actor Context；
- 定义 Port；
- 建立用例测试模板；
- 建立 Canonical Event 记录协议；
- 使用 In-memory Adapter 验证组合。

**不做**

- 不实现完整 M2；
- 不连接真实数据库或 Auth Provider；
- 不暴露 HTTP Route。

**退出条件**

- Application 层不依赖 Web、数据库或 Provider SDK；
- 状态变化与事件记录可在测试中原子验证；
- 没有新增产品对象。

**完成证据**

- 建立 `ApplicationError` 分类、稳定错误码和 Provider 无关的错误边界；
- 建立 `ActorContext` 与必需 `correlationId`；
- 建立平台无关的 `ApplicationUseCase` 合同；
- 建立 `Clock`、`IdGenerator`、`EntityRepository`、`ProductEventStore` 和 `UnitOfWork` Port；
- 建立 `CanonicalEventRecorder`，只接受已登记 Canonical Event；
- 建立 Fixed Clock、Sequential ID、Entity Repository、Product Event Store 和 Unit of Work 的 In-memory Adapter；
- 应用测试证明状态与 Canonical Event 可以共同提交或共同回滚；
- 未实现 M2 用例、HTTP Route、数据库、Auth Provider 或新产品对象；
- `pnpm preflight` 于 2026-08-11 通过。

### CU-TA-03 — API Contract and Runtime Skeleton

**状态**：Complete（2026-08-11）

**目标**

建立可被任何客户端消费的 API 运行时和 OpenAPI 机制。

**变更**

- 引入 Fastify；
- 建立 Route / Application Adapter；
- 建立 TypeBox Transport Schema；
- 建立统一错误响应；
- 生成 OpenAPI；
- 增加 Health / Readiness；
- 增加 API Contract 测试。

**不做**

- 不实现完整 Creator Identity Route；
- 不使用 Next.js Server Actions；
- 不暴露数据库。

**退出条件**

- API Runtime 可独立启动；
- OpenAPI 可生成并通过 Contract Check；
- 示例 Route 只验证架构，不宣称 FR 已实现；
- Preflight 通过。

**完成证据**

- 引入并锁定 Fastify 5.11.3、TypeBox 1.0.13、Fastify TypeBox Provider 6.1.0 和 Fastify Swagger 9.8.1；
- 冻结 API 版本 `v1` 与 Base Path `/api/v1`；
- 建立 `/api/v1/health`、`/api/v1/readiness` 和 `/openapi.json`；
- 建立统一 Error Envelope、错误类别映射和 `x-correlation-id`；
- 请求验证错误不泄漏 Fastify Validation 细节；
- OpenAPI 3.0.3 只包含系统运行 Route，不包含任何 VS-01 产品 Route；
- API Runtime 可通过 `apps/api` 独立启动；
- 构建产物实机绑定 `127.0.0.1:43123`，Health 和 OpenAPI 请求成功，测试结束后无遗留监听进程；
- 未实现 Creator Identity、Offering 或其他产品 Route；
- `pnpm preflight` 于 2026-08-11 通过。

### CU-TA-04 — PostgreSQL Persistence Foundation

**状态**：Complete（2026-08-11，使用 Podman PostgreSQL 验证）

**目标**

建立数据库、Migration、Repository Adapter 和真实事务测试基线。

**变更**

- 引入 PostgreSQL、Drizzle 和 Drizzle Kit；
- 建立数据库配置与 Migration 目录；
- 建立 Unit of Work；
- 建立 Product Event Store；
- 建立可由 `DATABASE_URL` 启用的真实 PostgreSQL 集成测试入口；
- 更新外部依赖登记。

**不做**

- 不提前建立全部 VS-01 表；
- 不建立 Deferred Object；
- 不允许客户端直连数据库。

**退出条件**

- Migration 可在空数据库运行；
- CI 可验证 Migration；
- 事务和 Event Store 集成测试通过；
- Provider / ORM 类型不进入 Domain。

**当前证据**

- PostgreSQL Schema 目前只包含 `product_events`，未创建 Creator、Commerce Identity、Offering、Customer、Commerce Action 或 Deferred Object 表；
- Drizzle Kit Journal、Snapshot 与单一版本化 SQL Migration 已建立，`pnpm db:check` 可验证 Migration 与 Canonical Event Registry 一致；
- PostgreSQL Product Event Store 与真实数据库事务 `UnitOfWork` Adapter 已建立；
- Application `UnitOfWork` 通过 transaction-scoped `ProductEventStore` 保证事件写入参与同一事务；
- 数据库配置通过受治理 Bootstrap 加载，数据库连接未暴露给 Domain、Application、Contract 或客户端；
- 数据库层已进入自动化导入边界和工程治理检查；
- 使用 Podman `postgres:17` 临时实例完成空库 Migration、真实事务 Commit / Rollback 与重复 Migration 幂等性验证；
- 2026-08-11 在 `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/personal_commerce` 下完整 Preflight 通过：16 个测试文件通过、1 个测试文件 Skip；58 个测试通过、13 个 AT 占位测试 Skip；
- 数据库证据：`product_events` 表已创建，Drizzle Migration 记录数为 1，公共 Schema 未创建其他产品表；
- 验证完成后已删除临时 Podman 容器 `pci-cu-ta-04-postgres`，未保留运行中的数据库实例。

**验证边界**

- 本次使用 Podman 而非 Docker，未引入 Testcontainers；
- CU-TA-04 的最初真实 PostgreSQL 验证只覆盖 Persistence Foundation；M2 已另以 Identity / Capability PostgreSQL 集成测试补充验证，但不代表完整 VS-01 产品流程已实现；
- 临时数据库仅用于受控工程验证，未作为开发或生产环境 Provider 冻结。

### CU-TA-05 — Auth Foundation

**状态**：Complete（2026-08-11）

**目标**

建立跨端认证凭据到统一 Actor Context 的映射。

**变更**

- 引入 Supabase Auth Adapter；
- 定义 Token 验证；
- 建立 Creator Actor 映射；
- 建立测试身份 Adapter；
- 建立认证失败和权限错误契约；
- 更新秘密与外部依赖登记。

**不做**

- 不让 Supabase User 等同于 Creator；
- 不把 RLS 当作唯一业务权限；
- 不实现 Customer CRM。

**退出条件**

- API 不信任客户端提交的 Owner ID；
- Provider SDK 不进入 Application / Domain；
- 测试可以替换 Auth Provider；
- Token 不进入日志。

**当前证据**

- 建立平台无关的 `AuthContextProvider`、`ProviderTokenVerifier` 与 `CreatorActorResolver` Port；
- 建立 Supabase Auth Adapter，通过 `auth.getUser(accessToken)` 验证凭据；
- Supabase User / Subject 仅作为 Provider Identity，不自动等同于 Creator；
- Creator Actor 必须通过显式 `CreatorActorResolver` 映射；
- 建立可替换的 `InMemoryAuthContextProvider` 测试身份 Adapter；
- 建立 Bearer Token Transport Adapter 与认证错误码 Contract；
- `Application`、`Domain` 与 `Contract` 未依赖 Supabase SDK；
- Auth Token、Provider 原始错误与密钥不会进入业务错误响应或日志；
- 2026-08-11 Auth 定向测试、Contract 测试、类型检查、Lint 与导入边界检查通过。

**真实 Provider 验证**

- 使用受控 Hosted Supabase 项目和专用测试用户完成真实登录；
- 验证真实 Access Token、无效 Token、未映射 Creator 与显式映射 Creator；
- 验证网络错误统一映射，Access Token、Provider Key 与测试密码不进入错误结果；
- 新增 `pnpm test:auth:provider` 显式验证入口；`RUN_REAL_SUPABASE_AUTH_TESTS=1` 启用真实测试，缺少所需凭据时直接失败；
- 真实 Provider 测试和完整 `pnpm preflight` 均通过，ENG-008 已关闭。

### CU-TA-06 — Web Reference Client Foundation

**状态**：Complete（2026-08-11）

**目标**

建立首个可替换 Reference Client，不实现完整 VS-01。

**变更**

- 引入 Next.js、React、Tailwind 和 shadcn/ui；
- 建立生成式 API Client；
- 建立 Creator / Public / Customer 路由骨架；
- 建立客户端错误和认证适配；
- 建立 Reference Client Build 门禁。

**不做**

- 不在页面中实现业务规则；
- 不直接使用 Drizzle；
- 不直接写 Product Event；
- 不宣称最终产品形态为 Web。

**退出条件**

- 客户端只通过 API Contract 访问能力；
- 可替换 API Base URL；
- 无 Next.js 类型进入 Domain / Application；
- Client Build 进入 CI。

**完成证据**

- 建立独立 `apps/web` pnpm Workspace，采用 Next.js 16、React 19、Tailwind CSS 4 与最小 shadcn/ui 基线；
- 建立 Creator、Public、Customer 三类路由骨架，不包含任何 VS-01 产品行为；
- 从 Fastify OpenAPI 文档生成 `openapi-typescript` 类型，并通过 `openapi-fetch` 建立 API Client；
- API Base URL 通过 Web Configuration Bootstrap 加载，可由 `NEXT_PUBLIC_API_BASE_URL` 替换；
- 建立客户端 Bearer Token 注入接口，不直接依赖 Supabase SDK；ENG-008 已通过独立 Provider 验证关闭；
- 建立统一 API Error Envelope 到 `WebApiError` 的客户端适配；
- Web 专属导入门禁禁止依赖 Domain、Application、Adapter、Database、Drizzle、Supabase 与 Fastify；
- 根 Preflight 已包含 OpenAPI Client 生成、Web Typecheck 与 Next Production Build；
- 2026-08-11 完整 Preflight 通过：22 个测试文件通过、2 个测试文件 Skip；79 个测试通过、15 个测试 Skip；
- Next Production Build 成功生成 `/`、`/creator`、`/public` 与 `/customer` 静态路由。

### CU-TA-07 — Acceptance Harness

**状态**：Complete（2026-08-11，使用系统 Microsoft Edge）

**目标**

把 `AT-001–AT-013` 从占位入口连接到真实跨层验收设施。

**变更**

- 引入 Playwright；
- 建立 Prototype 环境启动编排；
- 建立测试数据和 Actor Fixture；
- 建立 AT → UI Driver → API / Event Evidence 路径；
- 保持未实现 AT 为显式 Skip。

**不做**

- 不为了通过测试实现未进入当前里程碑的功能；
- 不改变 AT 语义；
- 不把浏览器点击日志当作 Canonical Event。

**退出条件**

- Playwright 能启动 Reference Client 和 API；
- 至少完成基础可达性与架构烟雾测试；
- AT 状态继续由 `21` 统一记录；
- 未实现 AT 不被误报为 Pass。

**完成证据**

- 引入并锁定 Playwright Test 1.62.1；
- 因当前环境无法下载 Playwright Chromium，Harness 明确使用系统 Microsoft Edge；
- Playwright 可自动启动构建后的 Fastify API 与 Next.js Web Reference Client；
- 建立 `ReferenceClientDriver`、Creator / Customer Actor Fixture 与 JSON Evidence Attachment；
- 建立 API Health、Web Home、Creator / Public / Customer 路由和 Deferred Surface 缺失的基础浏览器烟雾测试；
- `AT-001–AT-013` 已连接到真实 Playwright Suite，但因 M2–M7 尚未实现而保持 13 个显式 Skip；
- 2026-08-11 系统 Edge 验收结果：3 个基础测试 Pass，13 个产品 AT Skip；
- 浏览器点击和页面可达性不被记录为 Canonical Event；
- Playwright Harness 已进入根 Preflight。

## 14. 与 M2–M8 的关系

技术架构 Change Unit 不替代产品里程碑。

原规划顺序与当前状态：

```text
CU-TA-01 Workspace Boundaries
    ↓
CU-TA-02 Application Core
    ↓
CU-TA-03 API Skeleton
    ↓
CU-TA-04 Persistence Foundation
    ↓
CU-TA-05 Auth Foundation
    ↓
CU-TA-06 Web Reference Client Foundation
    ↓
CU-TA-07 Acceptance Harness
    ↓
ENG-008 Real Supabase Verification（Closed）
    ↓
M2 Creator Identity（FR-001–FR-004 Implemented；FR-005 Partial）
    ↓
M3 Offering / Availability
    ↓
M4 Publish / Share
    ↓
M5 Request
    ↓
M6 Confirm / Decline
    ↓
M7 Events / Notifications
    ↓
M8 VS-01 Acceptance
```

实际执行允许交错，但必须满足：

- Application、API、Persistence、Reference Client 与 Acceptance Harness 基线已具备；
- Auth Adapter 基线与真实 Provider 证据已具备，ENG-008 已关闭；
- Web Reference Client 不得阻塞平台无关核心建设；
- Acceptance Harness 已建立，随 M2–M7 逐步把 AT 从 Skip 转为真实执行；
- 每个里程碑只实现自身 FR 范围。

## 15. 依赖引入时机

### 15.1 已引入并受治理

- Fastify、TypeBox、Swagger / OpenAPI；
- Drizzle ORM、Drizzle Kit、PostgreSQL Driver；
- Supabase Auth SDK；
- Next.js、React、Tailwind CSS、shadcn/ui 基线；
- openapi-typescript、openapi-fetch；
- Playwright Test。

### 15.2 继续延后

- Supabase Storage：出现真实文件存储需求时；
- OpenTelemetry：日志不足以诊断跨 Adapter 问题时；
- 真实通知 Provider：M7 明确通知渠道后；
- Redis / Queue：出现已测量的异步或并发问题后。

### 15.3 禁止预装

不得仅因为“未来可能需要”而引入：

- 支付 SDK；
- Marketplace SDK；
- CRM；
- AI SDK；
- 微服务框架；
- 消息队列；
- 多端客户端框架；
- GraphQL Federation；
- 复杂工作流引擎。

## 16. FR / Code / Test 追溯方式

每个 M2–M7 Change Unit 必须提供：

| 字段                 | 要求                                          |
| -------------------- | --------------------------------------------- |
| FR                   | 明确对应 `FR-###`                             |
| Application Use Case | 唯一用例入口                                  |
| Domain Rule          | 调用的状态机或规则                            |
| Port / Adapter       | 所需外部能力                                  |
| API Contract         | 对外输入输出                                  |
| Tests                | Domain / Application / Contract / Integration |
| AT                   | 影响的 `AT-###`                               |
| Events               | 产生的 Canonical Event                        |
| Deviation            | 如有，登记 `DEV-###`                          |

无法形成完整追溯的代码不得被认定为产品功能完成。

## 17. 架构验证门禁

### 17.1 每个 Change Unit

必须通过：

```text
Governance Check
→ Format
→ Lint
→ Typecheck
→ Relevant Tests
→ Build
```

### 17.2 依赖边界

后续治理脚本应逐步检查：

- `modules/` 不导入客户端、ORM 或 Provider SDK；
- `applications/` 不导入客户端框架；
- `apps/web` 不导入 Drizzle；
- Canonical Event 只能从 Registry 引用；
- Route Handler 不直接更新 Repository；
- 环境变量读取只在 Bootstrap；
- Deferred Capability 不进入 Runtime。

### 17.3 架构测试

至少建立：

- Import Boundary Tests；
- OpenAPI Contract Snapshot / Diff；
- Migration Verification；
- Repository Integration Tests；
- Auth Adapter Contract Tests；
- Canonical Event Uniqueness Tests；
- API Error Contract Tests。

## 18. 实施风险与控制

| 风险                 | 控制                                        |
| -------------------- | ------------------------------------------- |
| 为跨端而过度抽象     | 只为已存在用例建立 Port，不创建通用框架     |
| API 变成 CRUD 表映射 | Route 必须映射 Application Use Case         |
| Next.js 吞并后端业务 | 独立 API Contract，禁止页面直连数据库       |
| Supabase 锁定        | Auth、Storage、Persistence 全部通过 Adapter |
| Domain 与 ORM 混合   | Drizzle 类型只存在于 Persistence Adapter    |
| Canonical Event 漂移 | Registry + Contract Test + 变更记录         |
| 多仓库过早拆分       | 当前保持一个 Monorepo 与模块化单体          |
| 基础设施一次性过重   | 按 Change Unit 延迟引入依赖                 |
| 测试全部依赖浏览器   | 维持 Domain 到 Acceptance 的测试金字塔      |
| 技术计划改变产品     | 行为冲突进入 `DEV-###`，不得由代码自行决定  |

## 19. Engineering Blockers

当前工程 Blocker 与待决项：

| 编号    | 优先级 | 问题                                                     | 处理时点               |
| ------- | ------ | -------------------------------------------------------- | ---------------------- |
| ENG-005 | P1     | Application 层目录与包边界尚未建立                       | Closed by CU-TA-01     |
| ENG-006 | P1     | API Contract 版本与错误 Envelope 尚未冻结                | Closed by CU-TA-03     |
| ENG-007 | P1     | PostgreSQL Persistence Foundation 已通过 Podman 真实验证 | Closed by CU-TA-04     |
| ENG-008 | P1     | Hosted Supabase 真实 Provider 验证                        | Closed by CU-TA-05     |
| ENG-009 | P2     | Customer 轻量结果访问凭据方案尚未冻结                    | M5 前                  |
| ENG-010 | P2     | M7 的真实通知渠道尚未决定                                | M7 前                  |

这些问题不得通过客户端临时逻辑绕过。

## 20. 下一执行建议

技术架构基线、真实 Auth Provider 门禁、M2 与 M3 的基础验收已经完成。下一项工程任务可以是：

> **进入 `M4 — Publish and Share`，仅实现其已冻结的 FR-014–FR-022 范围。**

进入 M4 时必须继续满足：

- 以 `17–20` 为产品事实源，不新增产品对象；
- Creator 身份必须经过统一 Auth Context 与显式 Actor 映射；
- Application Use Case、API Contract、Persistence Adapter 与测试保持可追溯；
- Web 仅作为 Reference Client，不承载核心业务规则；
- AT-001 已有 M2/M3 子流程覆盖；AT-002–AT-013 只随真实产品行为逐项解除 Skip；
- 不引入 Payment、Settlement、Refund、Marketplace、CRM 或其他 Deferred Capability。

M3 结束边界必须继续保持：

- `FR-001–FR-004` 与 `FR-006–FR-013` 已由领域、Application、API、Persistence 与 Reference Client 共同实现；
- `FR-005` 的公开入口拒绝尚无 Public Surface，必须在 M5 以真实 Customer 访问路径完成，而不得因缺少路由而误报为 Implemented；
- M3 不授权提前实现 Publish、Distribution Asset、公开入口、Request、Decision、Payment 或其他后续能力。

## 21. 明确非目标

本规划不：

- 把产品冻结为 Web；
- 同时开发 Web、App 和小程序；
- 重新设计或扩大已实现的 M2 Creator Identity；
- 修改 `17–20` 的产品定义；
- 设计完整数据库 Schema；
- 冻结全部 API Route；
- 引入支付、结算、退款、Marketplace 或 CRM；
- 以技术架构文档替代代码、测试和 Acceptance Evidence。

## 22. 结论

技术架构落地遵循：

```text
产品形态保持开放
    +
领域能力保持唯一
    +
应用契约保持跨端
    +
基础设施保持可替换
    +
首个 Reference Client 保持轻量
```

这使项目能够使用成熟开源组件快速搭建底座，同时避免：

- 从零开发认证、数据库、路由、迁移和测试设施；
- 把核心业务锁死在 Next.js；
- 为尚未决定的 App 或小程序重复实现业务规则；
- 让基础设施 Provider 反向定义产品。
