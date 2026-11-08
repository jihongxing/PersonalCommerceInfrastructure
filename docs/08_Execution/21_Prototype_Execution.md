# 21 — Prototype Execution

> **Status**：VS-02D Engineering Readiness READY
> **Phase**：VS-02D Internal Technical Readiness / Real Money Activation Disabled
> **Product**：Personal Commerce Infrastructure  
> **Build Target**：VS-01 Regression + VS-02A–VS-02D Engineering Readiness Baseline
> **Implementation Mode**：Reference Product / Controlled Paid Commerce without Real Money
> **Source of Truth**：[20 MVP PRD: VS-01](../07_Product_Architecture/20_MVP_PRD_VS01.md)  
> **Upstream Product Definitions**：[17 Core Product Objects](../07_Product_Architecture/17_Core_Product_Objects.md)、[18 MVP Product Flow](../07_Product_Architecture/18_MVP_Product_Flow.md)、[19 MVP Product Specification](../07_Product_Architecture/19_MVP_Product_Specification.md)  
> **Document Type**：Living execution record; implementation status, deviations, blockers, testing evidence and handoff only  
> **Last Updated**：2026-11-07

## 1. Purpose

产品定义阶段已经结束。21 不继续定义产品，也不替代 PRD。

本文件用于建立：

```text
Frozen PRD
→ Implementation
→ Prototype
→ Acceptance Evidence
→ Product Review
→ PRD Amendment only when required
```

它的职责是：

1. 记录 VS-01 的 Build Status 与里程碑；
2. 将 `FR-001–FR-053` 映射到真实实现状态；
3. 记录 Build Blocker；
4. 约束 Implementation Deviation；
5. 收集 Acceptance Testing 证据；
6. 在 Prototype 完成后向 Product Review 交接真实结果。

本文件不：

- 新增产品对象；
- 改写 17、18、19、20 的产品定义；
- 以代码方便性扩大 Scope；
- 自动批准 Payment、Settlement、Refund、Marketplace、CRM 或其他 Deferred Capability；
- 将技术实现细节写成新的产品战略。

## 2. Source of Truth and Execution Boundary

### 2.1 Authority Order

实现冲突时，按以下优先级处理：

| Priority | Source                       | Authority                                             |
| -------- | ---------------------------- | ----------------------------------------------------- |
| 1        | 20 MVP PRD                   | 当前实现范围、功能要求、规则、状态、事件和验收合同    |
| 2        | 19 MVP Product Specification | Surface、界面行为、状态感知 UI、通知和边界体验        |
| 3        | 18 MVP Product Flow          | Canonical Flow、状态转换、事件流和 Flow Stop Boundary |
| 4        | 17 Core Product Objects      | 对象、状态和事件语义                                  |
| 5        | 21 Prototype Execution       | 实施状态、偏差、阻塞和测试证据；不拥有产品定义权      |

### 2.2 Frozen Build Boundary

唯一允许构建的端到端 Flow：

```text
Commerce Identity
→ Service Offering
→ Requestable Availability
→ Publish
→ Distribution Asset
→ Customer Request
→ Creator Confirm / Decline
→ Canonical Event Recording
```

终点：

```text
Confirmed Commerce / Declined
```

禁止跨越到：

```text
Paid Transaction
→ Settlement
→ Refund
→ Fulfillment Workflow
```

### 2.3 Current Readiness

| Build Layer                 | Status              | Meaning                                        |
| --------------------------- | ------------------- | ---------------------------------------------- |
| Controlled Prototype        | **PROTOTYPE READY** | VS-01 Shadow Commerce Flow 已完成并通过验收    |
| Cohort 0 / 1 Pilot          | Conditional         | 需补充真实城市、Creator 名单与 Owner           |
| Real-money Controlled Pilot | Not Ready           | 支付、责任、结算、退款、安全与合规条件尚未完成 |

### 2.4 VS-01 Regression Interpretation

自 `EXEC-002` 起，VS-01 Regression 冻结为：

```text
VS-01 Regression ≠ VS-01 Isolation
VS-01 Regression = VS-01 Semantics Remain Stable
```

必须持续验证：Identity、Offering、Publish、Share、Request、Confirm / Decline、Public Result、
VS-01 状态机、Canonical Events 与 Permission Boundary。允许 VS-02 通过独立 route、Contract、
事件和应用能力合法增量，但不得覆盖 VS-01 route、改变 VS-01 request/response semantics、污染
VS-01 canonical events 或破坏 VS-01 permission boundary。不得通过删除 VS-02 功能修复 VS-01
Regression。
| Real-money Public Launch | Not Ready | 禁止启动 |

## 3. Build Status

### 3.1 Status Model

```text
Not Started
→ In Progress
→ Internal Complete
→ Acceptance Testing
→ Prototype Ready
```

| Status             | Definition                                                                       |
| ------------------ | -------------------------------------------------------------------------------- |
| Not Started        | 尚未开始实现，或没有可审查产物                                                   |
| In Progress        | 正在实现；尚未满足对应 FR 或里程碑验收                                           |
| Internal Complete  | 实现已完成开发者自检，但未完成 PRD 验收                                          |
| Acceptance Testing | 正在按 PRD Acceptance Criteria 进行端到端验证                                    |
| Prototype Ready    | 全部 Must Build FR 与 20 的 Acceptance Criteria 已通过，且无未决 P1 / P2 Blocker |
| Blocked            | 因明确 Blocker 无法继续；必须关联 Blocker ID                                     |
| Deferred           | PRD 明确不进入 VS-01；不得被误标为未完成                                         |

### 3.2 Current Status

| Item                         | Current Status      | Evidence / Note                                                                                             |
| ---------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Engineering Governance       | Complete            | `EXEC-002` 已将旧 VS-01-only 全仓禁止词门禁替换为 VS-01 route / operation / event / permission 子集稳定检查 |
| Technology Architecture      | Complete            | CU-TA-01–CU-TA-07 已落地；真实 Supabase Provider 验证通过，ENG-008 已关闭                                   |
| VS-01 Controlled Prototype   | Prototype Ready     | M1 / M1.5、M2–M8 全部完成；完整 Canonical Flow 已在 System Edge 通过                                        |
| PRD Traceability             | Complete            | FR-001–FR-053 全部为 Implemented，并有领域、应用、API、持久化或验收证据                                     |
| Acceptance Testing           | Complete            | 2026-08-16 System Edge 19 Pass / 2 Conditional Skip；VS-01 与 VS-02A focused acceptance 均 Pass             |
| VS-02A Money Domain          | Complete            | Provider-neutral controlled paid-commerce chain and PostgreSQL persistence verified                         |
| VS-02B Provider Readiness    | Complete            | Provider Ports、Fact、Normalization、Registry 与 Contract Harness 已验证                                    |
| VS-02C Provider Adapter      | Conditional         | 微信支付 Adapter 工程资格化完成；Provider 外部资格未完成                                                    |
| VS-02D Engineering Readiness | READY               | Live runtime guard、webhook boundary、PostgreSQL receipts、Runbook 与 deployment evidence 已验证            |
| VS-02D Real Money Activation | Founder GO Required | `REAL_MONEY_ENABLED=false`；Provider Qualification 与 `39` Go / No-Go 未完成                                |

## 4. Milestones

### M1 — Foundation

**Goal**

建立能够承载 VS-01 对象、权限、状态和 Canonical Event 的最小实现基础。

**PRD Coverage**

`FR-001–FR-005`、`FR-043–FR-044`、相关 Canonical Event 基础。

**Exit Criteria**

- Creator、Customer、Platform 的权限边界可被执行；
- 对象归属与合法状态转换可被校验；
- Canonical Event 可以按产品事实记录；
- 未引入 Payment、Marketplace、CRM 或非 VS-01 对象。

**Status**：Internal Complete

**Evidence**

- Git repository 已初始化；
- Node.js 22、TypeScript、pnpm 与 `pnpm-lock.yaml` 已建立；
- `apps/prototype` 应用组合根已建立并通过启动烟雾测试；
- 六个业务能力边界已登记；
- Commerce Identity、Offering、Distribution Asset、Commerce Action 状态机及非法转换测试已建立；
- Creator / Customer Actor 归属策略已建立；
- Canonical Event Registry 已建立；
- 配置 Bootstrap 与安全日志 Adapter 已建立；
- Domain、Application、Integration 与 AT-001–AT-013 测试入口已建立；
- GitHub Actions CI 与完整 `pnpm preflight` 已建立；
- 2026-08-11 完整 Preflight 通过：10 个测试文件通过、1 个 Acceptance 入口文件 Skip；28 个测试通过、13 个 AT 占位测试 Skip。

**Important Boundary**

M1 只建立工程基础，不表示 FR-001–FR-053 已完成产品实现；FR 状态保持 `Not Implemented`，直到对应 M2–M7 功能和验收证据存在。

### M1.5 — Cross-client Engineering Foundation

**Goal**

在不实现产品功能的前提下，建立跨端 Application、Contract、Port 和 Adapter 工程边界。

**Change Units**

| Change Unit                                | Status   | Evidence                                                                                                  |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| CU-TA-01 Workspace Boundary Preparation    | Complete | `applications/`、`contracts/`、工具链覆盖与自动化导入边界                                                 |
| CU-TA-02 Application Core and Ports        | Complete | Application Error、Actor Context、核心 Port、Canonical Event Recorder 与 In-memory 事务组合验证           |
| CU-TA-03 API Contract and Runtime Skeleton | Complete | Fastify Runtime、TypeBox Contract、统一 Error Envelope、OpenAPI 与独立进程烟雾验证                        |
| CU-TA-04 PostgreSQL Persistence Foundation | Complete | 使用 Podman PostgreSQL 完成空库 Migration、事务 Commit / Rollback、重复 Migration 幂等性与 Preflight 验证 |
| CU-TA-05 Auth Foundation                   | Complete | Auth Port、Supabase Adapter、测试身份 Adapter、Bearer Contract、配置治理与真实 Supabase Provider 验证完成 |
| CU-TA-06 Web Reference Client Foundation   | Complete | Next.js Reference Client、生成式 API Client、三类路由骨架、客户端 Auth/Error Adapter 与 Build 门禁已建立  |
| CU-TA-07 Acceptance Harness                | Complete | Playwright 使用系统 Edge 启动 API/Web；3 项基础测试 Pass，AT-001–AT-013 保持 13 项显式 Skip               |

**CU-TA-02 Evidence**

- Application Core 不依赖客户端框架、Transport、ORM 或 Provider SDK；
- Actor Context 不依赖真实 Auth Provider；
- Canonical Event 只能通过现有 Registry 类型记录；
- In-memory Unit of Work 测试证明状态和事件共同提交或共同回滚；
- In-memory Adapter 已明确为测试与组合验证实现，不具备生产耐久性；
- 未新增具体 Application Use Case、HTTP Route、数据库、产品对象或 M2 行为；
- 2026-08-11 完整 Preflight 通过：12 个测试文件通过、1 个 Acceptance 入口文件 Skip；40 个测试通过、13 个 AT 占位测试 Skip。

**CU-TA-03 Evidence**

- API 版本冻结为 `v1`，Base Path 为 `/api/v1`；
- 系统 Route 仅包含 Health、Readiness 与 OpenAPI JSON；
- 统一 Error Envelope 覆盖 Application Error、Validation Error、Not Found 与 Internal Error；
- 所有 API 响应使用可追踪的 `x-correlation-id`；
- OpenAPI 3.0.3 可生成并通过 Contract Test，未出现 Commerce Identity 或 Offering Route；
- 构建产物已通过独立 Socket 烟雾测试：Health 返回 `ok`，OpenAPI 返回 3.0.3，测试后无遗留监听；
- Fastify 与 TypeBox 只存在于 API、Transport 和 Contract 边界；
- 未新增具体 Application Use Case、数据库、产品对象或 M2 行为；
- 2026-08-11 完整 Preflight 通过：14 个测试文件通过、1 个 Acceptance 入口文件 Skip；52 个测试通过、13 个 AT 占位测试 Skip。

**CU-TA-04 Evidence**

- 引入并锁定 Drizzle ORM 0.45.2、Drizzle Kit 0.31.10 与 postgres 3.4.9；
- `database/schema/product-events.ts` 只映射 Canonical Product Event Store，没有提前建立 VS-01 产品对象表；
- Drizzle Kit Journal、Snapshot 与单一 SQL Migration 已建立，迁移文件与 Canonical Event Registry 由测试和 `pnpm db:check` 双重校验；
- PostgreSQL Product Event Store 与 transaction-scoped `PostgresUnitOfWork` 已建立；
- `loadDatabaseConfiguration` 只在数据库操作需要时强制要求 `DATABASE_URL`，普通 Prototype/API Foundation 仍可无数据库启动；
- `database/` 已纳入导入边界与工程治理检查，ORM / Driver 类型未进入 Domain、Application 或 Contract；
- 使用 Podman `postgres:17` 临时实例执行真实 Migration、Commit / Rollback 集成测试与第二次 Migration 幂等性验证；
- 真实数据库验证命令使用 `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/personal_commerce`；
- 数据库验证结果：`product_events` 已创建，Drizzle Migration 记录数为 1，未创建其他产品表；
- 2026-08-11 完整 Preflight 通过：16 个测试文件通过、1 个测试文件 Skip；58 个测试通过、13 个 AT 占位测试 Skip；
- 验证结束后删除临时 Podman 容器 `pci-cu-ta-04-postgres`。

**CU-TA-05 Evidence**

- 引入并锁定 `@supabase/supabase-js` 2.112.3；
- 建立平台无关的 `AuthContextProvider`、`ProviderTokenVerifier` 与 `CreatorActorResolver` Port；
- 建立 Supabase `getUser` Token 验证 Adapter，不向上层暴露 Provider 原始错误；
- 建立显式 Supabase User → Creator Actor 映射，不把 Provider User 等同于 Creator；
- 建立可替换的 In-memory 测试身份 Adapter；
- 建立 Bearer Token 解析器、认证错误码契约和 `loadAuthConfiguration`；
- Auth 定向测试与 Contract 测试通过：5 个测试文件、21 个测试通过；
- 类型检查、Lint 与导入边界检查通过；
- 未新增 Creator、Session、CRM 或其他产品持久化表，也未实现 M2 Creator Identity。

**CU-TA-05 Real Provider Verification**

- 已在受控 Hosted Supabase 项目中使用专用测试用户完成真实登录；
- 已验证真实 Access Token 可解析为稳定的 Supabase Provider Identity；
- 已验证无效 Token 通过统一 Authentication Error Contract 拒绝；
- 已验证 Provider User 未显式映射时不能成为 Creator Actor；
- 已验证显式 Creator 映射后生成正确 `ActorContext`；
- 已验证真实网络失败被安全映射，Access Token、Provider Key 与测试密码不进入错误结果；
- 已新增 `pnpm test:auth:provider` 显式验证入口；设置 `RUN_REAL_SUPABASE_AUTH_TESTS=1` 时执行真实 Provider 测试，显式请求验证但缺少凭据时直接失败；
- 真实 Provider 验证与完整 `pnpm preflight` 已于 2026-08-11 通过，ENG-008 已关闭。

**CU-TA-06 Evidence**

- 建立独立 `apps/web` Workspace，采用 Next.js 16.1.4、React 19.2.3、Tailwind CSS 4.1.18 与最小 shadcn/ui 基线；
- 建立 `/creator`、`/public`、`/customer` 路由骨架，不实现 Creator Identity、Offering 或 Request；
- 从 API Runtime 的真实 OpenAPI 文档生成 TypeScript `paths`，客户端通过 `openapi-fetch` 消费；
- 建立可替换的 `NEXT_PUBLIC_API_BASE_URL` 配置 Bootstrap；
- 建立不依赖 Supabase SDK 的 Access Token Provider 接口与 Bearer Header Adapter；
- 建立 API Error Envelope 到安全 `WebApiError` 的适配；
- Web 导入门禁禁止直接依赖 Domain、Application、Adapters、Database、Drizzle、Supabase 或 Fastify；
- Next Production Build 成功生成 `/`、`/creator`、`/public`、`/customer` 静态路由；
- 2026-08-11 完整 Preflight 通过：22 个测试文件通过、2 个测试文件 Skip；79 个测试通过、15 个测试 Skip；
- `ENG-008` 已通过独立真实 Provider 集成测试关闭；Web Client 仍不得直接依赖 Supabase SDK 或绕过统一 API。

**CU-TA-07 Evidence**

- 引入并锁定 Playwright Test 1.62.1；
- 当前环境无法下载 Playwright Chromium，Harness 明确使用系统 Microsoft Edge；
- Playwright 自动启动构建后的 Fastify API 与 Next.js Web Reference Client；
- 建立 Reference Client Driver、Creator / Customer Actor Fixture 与 JSON Evidence Attachment；
- API Health、Web Home、Creator / Public / Customer 路由和 Deferred Surface 缺失测试通过；
- 系统 Edge 实际执行结果：3 个基础浏览器测试 Pass，AT-001–AT-013 共 13 个显式 Skip；
- Playwright Harness 已进入根 Preflight；
- 浏览器可达性和点击行为不被当作 Canonical Event；
- CU-TA-07 未实现任何 M2–M7 产品功能。

**Important Boundary**

M1.5 的工程能力不改变任何 `FR-001–FR-053` 状态。只有 M2–M7 的真实用例、界面和验收证据可以将对应 FR 标记为 Implemented。

### M2 — Creator Identity

**Goal**

Creator 可以创建、编辑并理解 Commerce Identity 的公开状态。

**PRD Coverage**

`FR-001–FR-005`。

**Exit Criteria**

- Creator 可以创建、编辑、保存 Commerce Identity；
- Creator 可以创建或关联 Capability；
- Creator 可看到 Draft / Published / Unpublished 状态；
- Customer 无法访问 Draft / Unpublished Identity。

**Status**：Complete

**Evidence**

- Creator Identity 领域对象已支持最小资料、Draft / Published / Unpublished 状态和 Capability 关联；
- Application Use Case 已实现创建、读取、编辑 Identity 与添加 Capability；
- API Contract 与 Runtime 已提供 Creator Identity 创建、读取、编辑和 Capability Route；
- Creator API 通过 Bearer Token 解析为统一 Creator ActorContext，不信任客户端 Owner ID；
- PostgreSQL Schema、Migration 与 Repository 已建立；
- Web Reference Client `/creator` 已通过生成的 OpenAPI Client 接入 M2；
- M2 PostgreSQL 集成测试已验证 Identity 与 Capability 的真实写入、读取及迁移后的事务边界；
- 系统 Edge 浏览器验收已验证 Creator 创建 / 保存 Identity 与添加 Capability；
- M5 Public Surface 应用测试已验证即使 Offering 为 Published，只要归属 Commerce Identity 仍为 Draft，Customer 公开访问仍返回不可用且不记录 `storefront_viewed`；
- 完整 `pnpm preflight` 已通过：26 个测试文件通过、3 个测试文件 Skip；91 个测试通过、21 个测试 Skip；系统 Edge 4 个测试通过、13 个完整 VS-01 AT Skip；
- M2 不实现 Offering、Publish、Request 或 Payment。

### M3 — Service Offering and Availability

**Goal**

Creator 可以创建一个带最小可请求条件的 Service Offering。

**PRD Coverage**

`FR-006–FR-013`。

**Exit Criteria**

- Creator 可以创建、编辑、保存 Draft Offering；
- Offering 与至少一个 Capability 关联；
- Requestable Availability 可被表达；
- 发布条件缺失时系统阻止 Publish 并说明原因。

**Status**：Complete

**Evidence**

- `modules/service-offering/offering.ts` 已实现 Draft Offering 创建、编辑、Publish 前置条件检查与状态表达；
- `applications/service-offering/` 已实现 Creator-owned Offering 的创建、读取与编辑 Use Case；Draft 允许不完整保存，关联无效或非归属服务能力被拒绝；
- `contracts/api/v1/service-offering-contracts.ts` 与 `adapters/transport/http/service-offering-routes.ts` 已提供受统一 Auth Context 约束的 Create / List / Update Contract；
- `database/migrations/0002_green_sauron.sql` 已建立 `service_offerings` 持久化表；`pnpm db:check` 已通过；
- Web Reference Client 已允许 Creator 保存、编辑服务草稿，表达可请求条件，并展示公开前缺失条件；未提供 Publish、公开入口或 Customer Request；
- 应用、领域、API 与系统 Edge 浏览器测试已覆盖 Draft Offering；
- `pnpm preflight` 已于 2026-08-11 通过：101 passed / 21 skipped；浏览器验收为 5 passed / 13 skipped。

### M4 — Publish and Share

**Goal**

Creator 可以将合格 Offering 公开发布、生成分享资产并记录真实外部分发。

**PRD Coverage**

`FR-014–FR-022`。

**Exit Criteria**

- Offering 可以 Publish / Unpublish；
- 首次公开 Identity 时记录 `creator_published`；
- 系统生成 Distribution Asset；
- Generated 与 Distributed 被严格区分；
- Unpublish 后不会接受新 Request，但既有 Action 保留。

**Status**：Complete

**Evidence**

- `PublishServiceOfferingUseCase` 在同一 Unit of Work 中发布 Offering、首次公开 Commerce Identity、生成 `Distribution Asset` 并记录一次 `creator_published`；
- Creator API 已提供 Publish / Unpublish / 外部分发记录 Route，OpenAPI Client 已重新生成；
- PostgreSQL `distribution_assets` Migration 与 Repository 已建立；In-Memory / PostgreSQL Unit of Work 均包含 Asset；
- Web Reference Client 可公开服务、获取分享入口、显式记录外部分发和下线服务；
- `AT-002`、`AT-003`、`AT-004` 已由 `m4-publish-share.spec.ts` 在系统 Edge 通过；
- M5 已验证 Unpublish 阻止新的 Request，且既有 Submitted Commerce Action 仍可读取与后续处理。

### M5 — Customer Request

**Goal**

Customer 可以从公开入口理解 Published Offering 并提交一个合法 Request。

**PRD Coverage**

`FR-023–FR-033`。

**Exit Criteria**

- Public Commerce Identity 与 Offering 页面可访问；
- 不可请求 Offering 显示正确不可用状态；
- Customer 可无需完整账号提交 Request；
- 合法 Request 产生 Submitted Action 与 `commerce_action_submitted`；
- 不完整、重复或失效 Request 按 PRD 规则处理。

**Status**：Complete

**Evidence**

- 公开 API 仅暴露 Published Identity / Offering，并记录 `storefront_viewed`；Unpublished Offering 返回不可用状态；
- Request Flow 不要求 Customer 平台账号，以 `contactName`、`contactMethod` 和 `requestMessage` 收集最小处理信息；
- 合法提交在 Unit of Work 中创建或关联 Customer、将 Commerce Action 提交为 Submitted，并记录 `commerce_action_submitted`；
- 同一 Customer 对同一 Offering 的未解决重复 Request 被阻止；信息不完整或 Offering 已 Unpublish 时不创建 Action 或提交事件；
- PostgreSQL `customers` / `commerce_actions` Migration 与 Repository 已建立；Unpublish 不删除既有 Action；
- `AT-005`、`AT-006`、`AT-007`、`AT-011` 已由 `m5-customer-request.spec.ts` 在系统 Edge 通过。

### M6 — Creator Confirm / Decline

**Goal**

Creator 可以处理自己的 Submitted Request，Buyer 可以得到正确结果。

**PRD Coverage**

`FR-034–FR-042`。

**Exit Criteria**

- Creator 只能查看和处理归属于自己的 Submitted Action；
- Confirm → Confirmed + `commerce_confirmed`；
- Decline → Declined + `commerce_declined`；
- 终态不可再次决策；
- Buyer 与 Creator 不会看到付款、结算或履约承诺。

**Status**：Complete

**Evidence**

- Creator API 与 Web Reference Client 仅列出归属当前 Creator 且仍为 Submitted 的 Request，并展示 Offering、Customer 联系方式与请求说明；
- Confirm / Decline 在同一 Unit of Work 中写入终态并分别记录一次 `commerce_confirmed` / `commerce_declined`；
- Commerce Action Repository 仅允许从 Submitted 原子写入 Confirmed / Declined；并发 Confirm / Decline 竞争只有一个成功且只记录一个终态事件；
- 越权操作返回 `403`；Confirmed / Declined Action 的重复决策返回 `409`，状态不变且不产生重复终态事件；
- Customer 提交后获得仅用于读取该 Request 结果的 `resultAccessToken`，公开结果页显示 Submitted / Confirmed / Declined，且明确该状态仅表示请求处理决定；
- PostgreSQL Migration `0005_m6_request_result_access.sql` 已为既有 Commerce Action 回填并约束唯一结果访问 token；
- `AT-008` 明确验证 Offering Unpublish 后既有 Submitted Action 仍可 Confirm；`AT-008`–`AT-010` 已由 `m6-creator-decision.spec.ts` 在系统 Edge 通过；
- `pnpm preflight` 于 2026-08-12 通过：140 tests（122 passed / 18 skipped），Web Production Build 通过，系统 Edge 浏览器验收为 14 passed / 10 skipped。

### M7 — Events and Notifications

**Goal**

关键产品事实可追溯，正确角色在状态变化后得到通知。

**PRD Coverage**

`FR-043–FR-053`。

**Exit Criteria**

- 所有关键状态变化通过权限与状态校验；
- Creator 收到新 Request 通知；
- Buyer 收到 Confirm / Decline 结果通知；
- 通知失败不回滚合法状态；
- 外部付款 / 履约如受控记录，不改变 VS-01 状态机；
- Payment、GMV、Take Rate 等能力仍不可操作。

**Status**：Complete

**Evidence**

- 已建立平台无关 `NotificationPort`，Submitted 通知归属 Creator，Confirmed / Declined 通知对应 Customer；
- 通知在状态与 Canonical Event 事务提交后 best-effort 投递，投递失败不会回滚合法状态或事件；
- 测试环境使用 In-Memory Notification Adapter，当前运行时使用脱敏 Log Notification Adapter；Customer 联系方式与结果 token 不进入日志；
- Creator 通过待处理 Request 列表得知新提交，Customer 通过轻量结果入口得知 Confirmed / Declined；未新增 Notification Center、读状态、偏好或营销推送；
- Canonical Event 支持受控 payload；Pilot Operations Actor 只有提供证据引用后才能记录 `external_paid_verified` / `fulfillment_observed`；
- 外部观察只追加 Canonical Event，不改变 Commerce Action 状态，不创建新的平台交易或履约状态；
- 无效输入、越权、重复终态操作不改变状态、不产生对应业务事件，也不产生通知；
- `AT-012` 由 `external-observation-use-cases.test.ts` 验证；`AT-013` 由 System Edge 页面与真实 OpenAPI 非目标能力检查验证；
- `pnpm preflight` 于 2026-08-12 通过：146 tests（130 passed / 16 skipped），Web Production Build 通过，系统 Edge 浏览器验收为 15 passed / 8 skipped。

### M8 — VS-01 Acceptance

**Goal**

以 20 PRD 第 9 节为唯一验收标准，完成端到端 Controlled Prototype 验收。

**PRD Coverage**

20 PRD `9.1–9.4` 全部条目与 `FR-001–FR-053`。

**Exit Criteria**

- 所有 Must Build FR 状态为 Implemented；
- 所有 Acceptance Criteria 有测试证据；
- 无未决 P1 / P2 Blocker；
- 所有 Deviation 已 Closed 或已形成明确 PRD Amendment；
- Prototype 不包含 Explicitly Not Build 能力。

**Status**：Complete

**Evidence**

- `vs01.spec.ts` 在系统 Microsoft Edge 中完成 Identity → Capability → Draft Offering → Publish → Share → Request → Confirm → Customer Result 的完整路径；
- `AT-001–AT-013` 全部登记为 Pass，其中 `AT-012` 使用受控应用验收，避免为验收反向新增 Pilot Operations 产品 Surface；
- FR-001–FR-053 全部为 Implemented；FR-005 已由 Public Surface Identity 状态拒绝测试补齐；
- ENG-005–ENG-010 全部关闭，无未决 P0 / P1 / P2 Blocker；
- DEV-001–DEV-004 均已验证并关闭，不需要修改冻结 PRD；
- Canonical Event、权限、状态机、通知失败隔离和 Shadow Commerce 外部观察边界均有自动化证据；
- `pnpm preflight` 于 2026-08-12 通过：147 tests（139 passed / 8 skipped），Web Production Build 通过，系统 Edge 浏览器验收为 16 passed / 0 skipped；
- 剩余 8 个 Vitest Skip 为需要显式外部环境启用的真实 Provider / PostgreSQL 条件测试，不属于 AT-001–AT-013 或 Must Build 产品缺口。

## 5. PRD Traceability

### 5.1 Status Definitions

| Traceability Status | Definition                                                                         |
| ------------------- | ---------------------------------------------------------------------------------- |
| Not Implemented     | 尚未有实现或可审查证据                                                             |
| In Progress         | 已开始实现，未通过对应验收                                                         |
| Implemented         | 已实现并有内部验证证据；等待或已进入 Acceptance Testing                            |
| Partial             | 只满足部分 FR；必须说明缺失范围与影响                                              |
| Blocked             | 无法推进；必须关联 Blocker ID                                                      |
| Deferred            | PRD 明确排除，不作为 VS-01 完成缺口                                                |
| Not Applicable      | 仅当 PRD 指定“如实现包含”且当前受控 Prototype 不包含该前置条件时使用；必须说明理由 |

### 5.2 FR Traceability Matrix

所有条目初始为 `Not Implemented`。实现开始后，必须在同一行更新状态、证据和关联偏差 / Blocker。

| FR     | Requirement Summary                                             | Milestone | Status      | Evidence                                                                                                         | Deviation / Blocker                 |
| ------ | --------------------------------------------------------------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| FR-001 | Creator creates Commerce Identity                               | M2        | Implemented | Domain / Application / API / Browser M2 Test                                                                     | —                                   |
| FR-002 | Creator edits Commerce Identity                                 | M2        | Implemented | Application / API / Browser M2 Test                                                                              | —                                   |
| FR-003 | Creator creates or associates Capability                        | M2        | Implemented | Domain / Application / API / Browser M2 Test                                                                     | —                                   |
| FR-004 | Identity state is visible to Creator                            | M2        | Implemented | API Response / Web Reference Client                                                                              | —                                   |
| FR-005 | Draft / Unpublished Identity is not publicly accessible         | M2        | Implemented | Public Surface identity-state guard / no `storefront_viewed` on rejected access                                  | —                                   |
| FR-006 | Creator creates Service Offering                                | M3        | Implemented | Domain / Application / API / Browser M3 Test                                                                     | —                                   |
| FR-007 | Creator saves Offering as Draft                                 | M3        | Implemented | Domain / Application / API / Browser M3 Test                                                                     | —                                   |
| FR-008 | Offering requires Capability before Publish                     | M3        | Implemented | Domain Publish Eligibility / API Response                                                                        | Publish action remains M4           |
| FR-009 | Creator expresses Requestable Availability                      | M3        | Implemented | Domain / API / Browser M3 Test                                                                                   | —                                   |
| FR-010 | Offering includes minimum buyer-understandable information      | M3        | Implemented | Draft fields / API Contract / Browser M3 Test                                                                    | Public display remains M5           |
| FR-011 | Incomplete Offering cannot Publish                              | M3        | Implemented | Domain eligibility / missing conditions                                                                          | Publish transport action remains M4 |
| FR-012 | Offering edits preserve existing Action history                 | M3        | Implemented | Creator-owned Update Use Case                                                                                    | No Commerce Action exists before M5 |
| FR-013 | Creator sees Offering states                                    | M3        | Implemented | API response / Web Reference Client                                                                              | Draft state only until M4           |
| FR-014 | Eligible Creator can Publish Offering                           | M4        | Implemented | Domain / Application / API / Browser AT-003                                                                      | —                                   |
| FR-015 | Publish changes Offering to Published                           | M4        | Implemented | Domain / Application / API / Browser AT-003                                                                      | —                                   |
| FR-016 | First eligible Publish makes Identity public                    | M4        | Implemented | Application transaction / Canonical Event test / Browser AT-003                                                  | —                                   |
| FR-017 | Published Offering generates Distribution Asset                 | M4        | Implemented | Domain / Application / PostgreSQL Migration / API / Browser AT-003                                               | —                                   |
| FR-018 | Creator obtains and uses Generated Asset                        | M4        | Implemented | API Contract / Web Reference Client / Browser AT-003                                                             | —                                   |
| FR-019 | Creator records actual external distribution                    | M4        | Implemented | Application / API / Browser AT-004                                                                               | —                                   |
| FR-020 | Generated Asset is not automatically Distributed                | M4        | Implemented | Domain / Application / API / Browser AT-003–AT-004                                                               | —                                   |
| FR-021 | Creator Unpublishes Published Offering                          | M4        | Implemented | Application / API / Browser AT-004                                                                               | —                                   |
| FR-022 | Unpublish preserves existing Commerce Actions                   | M4        | Implemented | Application / API / Browser AT-011; existing Submitted Action remains stored after Unpublish                     | —                                   |
| FR-023 | Published Commerce Identity is publicly accessible              | M5        | Implemented | Public API / Web Reference Client / Browser AT-005 / `storefront_viewed`                                         | DEV-002                             |
| FR-024 | Public Identity shows Creator, Capability, Published Offering   | M5        | Implemented | Application / Public API / Browser AT-005                                                                        | —                                   |
| FR-025 | Offering Page shows service and request conditions              | M5        | Implemented | Public API / Web Reference Client / Browser AT-005                                                               | —                                   |
| FR-026 | Request entry only for Published, requestable Offering          | M5        | Implemented | Application availability guard / Browser AT-005–AT-007                                                           | —                                   |
| FR-027 | Unavailable Offering blocks new Request                         | M5        | Implemented | Application / API / Browser AT-007 / AT-011                                                                      | —                                   |
| FR-028 | Customer can Request without full account registration          | M5        | Implemented | Anonymous Public API / Browser AT-006                                                                            | —                                   |
| FR-029 | Request collects minimum contact and request information        | M5        | Implemented | Contract / Application / Browser AT-006                                                                          | DEV-001                             |
| FR-030 | Invalid / unavailable Request is blocked                        | M5        | Implemented | Application invalid-input / availability tests / Browser AT-007                                                  | DEV-001                             |
| FR-031 | Valid Submit creates / associates Customer and Submitted Action | M5        | Implemented | Domain / Application transaction / API / Browser AT-006                                                          | DEV-001                             |
| FR-032 | Customer sees Submitted result without payment promise          | M5        | Implemented | Web Reference Client / Browser AT-006                                                                            | —                                   |
| FR-033 | Reliable duplicate unresolved Request is warned / blocked       | M5        | Implemented | Application / API duplicate-request tests                                                                        | —                                   |
| FR-034 | Creator sees only own Submitted Actions                         | M6        | Implemented | Application ownership filter / Creator API / Browser AT-008–AT-009                                               | —                                   |
| FR-035 | Creator sees information needed to process Request              | M6        | Implemented | Customer contact, Offering title and request message in Creator Workspace                                        | —                                   |
| FR-036 | Owner Creator can Confirm Submitted Action                      | M6        | Implemented | Domain / Application / API / Browser AT-008                                                                      | —                                   |
| FR-037 | Confirm creates Confirmed Commerce                              | M6        | Implemented | Confirm transition / `commerce_confirmed` application test                                                       | —                                   |
| FR-038 | Owner Creator can Decline Submitted Action                      | M6        | Implemented | Domain / Application / API / Browser AT-009                                                                      | —                                   |
| FR-039 | Decline changes Action to Declined                              | M6        | Implemented | Decline transition / `commerce_declined` application test                                                        | —                                   |
| FR-040 | Terminal Action cannot be decided again                         | M6        | Implemented | Atomic Submitted-only update / concurrent decision test / `409 commerce_action_already_decided` / Browser AT-010 | —                                   |
| FR-041 | Buyer sees / receives Confirmed or Declined result              | M6        | Implemented | Result token API / public result page / Browser AT-008–AT-009                                                    | DEV-003                             |
| FR-042 | Result never implies payment, booking or fulfillment            | M6        | Implemented | Copy Catalog boundary notice / Customer result page / Browser AT-008–AT-009                                      | —                                   |
| FR-043 | State, actor and ownership are checked for transitions          | M7        | Implemented | Domain guards / Application authorization / atomic Submitted-only decision update                                | —                                   |
| FR-044 | Invalid operations do not change state or create events         | M7        | Implemented | Invalid-input, unauthorized, repeat and concurrent application tests; no event or notification                   | —                                   |
| FR-045 | Creator receives Submitted Request notification                 | M7        | Implemented | Notification Port `creator_request_submitted` / Creator Submitted Request Workspace                              | DEV-004                             |
| FR-046 | Buyer receives Confirm / Decline notification                   | M7        | Implemented | Notification Port Customer outcome notifications / public result page                                            | DEV-004                             |
| FR-047 | Notification failure does not roll back valid state             | M7        | Implemented | Best-effort notification application test preserves Action and Canonical Events                                  | DEV-004                             |
| FR-048 | No notification center is required                              | M7        | Implemented | No notification persistence, center, read state, preferences or marketing surfaces                               | DEV-004                             |
| FR-049 | No payment / settlement information collection                  | M7        | Implemented | Contract / Web / OpenAPI non-goal inspection AT-013                                                              | —                                   |
| FR-050 | No payment, refund, settlement or fulfillment states            | M7        | Implemented | Frozen Commerce Action state union / OpenAPI non-goal inspection AT-013                                          | —                                   |
| FR-051 | No GMV, revenue, commission or Take Rate display                | M7        | Implemented | System Edge Web and OpenAPI non-goal inspection AT-013                                                           | —                                   |
| FR-052 | External payment is observation-only                            | M7        | Implemented | Pilot Operations observation use case / evidence payload / AT-012                                                | —                                   |
| FR-053 | External fulfillment is observation-only                        | M7        | Implemented | Pilot Operations observation use case / evidence payload / AT-012                                                | —                                   |

## 6. Implementation Status

### 6.1 Current Summary

| Area                                          | Status            | Notes                                                                                                          |
| --------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Codebase / runtime selection                  | Internal Complete | Git、Node.js 22、TypeScript、pnpm、Vitest、ESLint、Prettier 与 GitHub Actions 已建立                           |
| Domain / state foundation                     | Internal Complete | Commerce Identity、Offering、Distribution Asset、Commerce Action、Actor 权限与 Canonical Event Registry 已建立 |
| Configuration / observability foundation      | Internal Complete | 单一配置 Bootstrap、安全结构化日志与 PII Key 脱敏已建立                                                        |
| Creator identity flow                         | Complete          | M2                                                                                                             |
| Service Offering flow                         | Complete          | M3                                                                                                             |
| Publish / Share flow                          | Complete          | FR-014–FR-022 complete                                                                                         |
| Public storefront / Request flow              | Complete          | M5; public viewing, anonymous Request, duplicate prevention and Unpublish preservation                         |
| Confirm / Decline flow                        | Complete          | M6; ownership-filtered review, terminal decisions, result access and repeat / unauthorized protection          |
| Events / Notifications / boundary enforcement | Complete          | M7; best-effort Notification Port, external observation facts and non-goal enforcement                         |
| Acceptance testing                            | Complete          | M8; AT-001–AT-013 Pass, complete System Edge Canonical Flow and final preflight                                |

### 6.2 Implementation Update Discipline

每次 Build Update 至少记录：

- 更新日期；
- 当前 Milestone；
- 已完成 FR；
- 仍在进行的 FR；
- 测试或演示证据；
- 新 Blocker；
- 新 Deviation；
- 是否改变 PRD / Scope / 状态机。

没有证据的“已完成”不得将 FR 标记为 Implemented。

## 7. Implementation Deviation Protocol

### 7.1 Core Principle

> 代码不能反向定义产品。

如果 Codex 在实现中发现 PRD 无法合理实现、规则冲突、交互不完整或存在安全 / 权限风险，不得静默改变对象、Flow、状态机或 Scope。

必须遵循：

```text
Implementation Issue
→ Deviation Record
→ Product Decision
→ PRD Amendment (if approved)
→ Implementation
```

### 7.2 What Requires a Deviation Record

以下任一情况必须记录：

- 新增或删除 Product Object；
- 修改 Actor 或 Permission；
- 修改 Canonical Flow 顺序；
- 修改合法 State Transition；
- 修改 Canonical Event 触发语义；
- 修改 Must Build / Explicitly Not Build Scope；
- 将 Confirmed Commerce 表现为 Payment、Booking 或 Fulfillment；
- 用技术限制替代 PRD 要求；
- 需要人工流程补充但 PRD 未定义；
- 任一 FR 只能 Partial 实现；
- 任一 P1 / P2 质量或安全风险影响 Controlled Prototype。

纯技术内部选择不需要 Deviation Record，前提是它不改变产品行为、数据事实或 PRD 验收结果。

### 7.3 Deviation Record Template

所有偏差按 `DEV-###` 编号，追加在本节。

| Field                         | Required Content                                                          |
| ----------------------------- | ------------------------------------------------------------------------- |
| Deviation ID                  | 例如 `DEV-001`                                                            |
| Date                          | 发现日期                                                                  |
| Related PRD                   | FR、产品规则、状态或 Acceptance Criteria                                  |
| Type                          | Conflict / Feasibility / Security / UX ambiguity / Scope pressure / Other |
| Observed Implementation Issue | 客观描述，不预设解决方案                                                  |
| Impact                        | 对用户、状态机、事件、范围、验收和风险的影响                              |
| Options Considered            | 至少列出保持 PRD、改实现、修订 PRD 三类可能性中适用选项                   |
| Recommended Resolution        | 建议与理由                                                                |
| Product Decision              | Pending / Approved / Rejected                                             |
| PRD Amendment                 | 需要时记录 PRD 版本、日期和变更摘要                                       |
| Implementation Status         | Not Started / In Progress / Verified                                      |
| Evidence                      | 代码、测试、截图或复现步骤引用                                            |

### 7.4 Initial Deviation Register

| Deviation ID | Related PRD                                              | Status                                    | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEV-001      | FR-029 / FR-030 / FR-031 / AT-006 / AT-007               | Closed — Verified                         | PRD 冻结“最小可联系信息”与“服务相关 Request 信息”，未冻结字段名；M5 以 `contactName`、`contactMethod`、`requestMessage` 实现最小可处理 Request，不新增 CRM、账号注册、支付或预约能力。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| DEV-002      | FR-023 / AT-005 / `storefront_viewed`                    | Closed — Verified                         | 公开入口允许 Customer 在未提交 Request 前保持匿名，但 Canonical Event 需要 actor ID；M5 以请求关联 ID 作为匿名访问的技术 actor 标识，只记录公开 Storefront 打开事实，不创建 Customer 或平台账号。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| DEV-003      | FR-041 / AT-008 / AT-009                                 | Closed — Verified                         | 匿名 Customer 提交后需要查看 Confirmed / Declined 结果，但 VS-01 不创建账号；M6 返回仅能读取该 Request 结果的轻量访问 token，并由公开结果页与 System Edge AT-008 / AT-009 验证；不创建 Session、CRM、支付或履约能力。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| DEV-004      | FR-045 / FR-046 / FR-047 / ENG-010                       | Closed — Verified                         | M7 Controlled Prototype 使用可替换 Notification Port；测试环境使用 In-Memory Adapter，当前运行时使用脱敏 Log Adapter，并由 Creator 待处理列表与 Customer 结果页验证正确角色可得知状态变化。通知失败隔离测试通过；不宣称真实短信、邮件或推送 Provider 已通过验证；通知中心、读状态、偏好与营销推送仍不实现。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| DEV-005      | FR-052 / FR-053 / CR-06                                  | Closed — Verified                         | 2026-08-14 产品最高负责人批准 First Commerce Slice。已将 Confirmed Request 的 `external_paid_verified` 与 `fulfillment_observed` 实现为受控 Pilot Operations 外部事实记录；Commerce Action 保持 `confirmed`，未新增付款、退款、结算、托管或履约状态，未处理支付凭据。每个 Request / 事实类型只允许一条记录并幂等返回，保留证据引用、发生时间、操作者与审计关联。应用、API、PostgreSQL Migration、OpenAPI、浏览器和本地部署验证通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| DEV-006      | VS-02 FR-201–FR-210 / D-MCL-GATE-01                      | Closed — Verified                         | 产品最高负责人已解除 Gate 0C 对 VS-02 产品化与 Provider-neutral Build 的阻塞。`35_VS02_Paid_Service_PRD.md` 与 `36_Engineering_Governance_Delta.md` 已冻结。VS-02A 已完成：Provider-neutral Money Domain、Canonical Event、应用用例、Order/Payment/Fulfillment/Settlement/append-only Earnings Ledger/Withdrawal 的 PostgreSQL Schema、Migration 与 Repository、事务注入、OpenAPI Contract、HTTP Routes、Creator Orders/Earnings/Wallet/Withdrawal Intent UX、Customer 的只读 Payment State，以及 `pilot_operations` 受控 Payment / Settlement / Withdrawal Fact 注入。浏览器已跑通 Confirmed Request → Order → Payment Pending → controlled Payment Confirmed → Fulfillment → Settlement → Ledger Projection → Withdrawal Intent → controlled Withdrawal Completed；Customer Request 仍保持 `confirmed`，不被误写为真实付款或履约。2026-08-15 验证通过：`pnpm test`（160 passed / 8 skipped）、`pnpm build`、`pnpm db:check`、`pnpm check:openapi`、`pnpm web:typecheck`、`pnpm format:check`、`pnpm lint`、`git diff --check` 与 `pnpm exec playwright test tests/acceptance/browser/zz-vs02a-confirmed-request-to-earnings.spec.ts --project=system-edge`。真实 Provider Adapter、真实 KYC、真实 Checkout/Webhook、真实资金、真实 Withdrawal 与 Controlled Real-money Pilot 仍未实现，继续由 `35A_Provider_Qualification_Dossier.md` 约束。 |
| DEV-007      | VS-02B / `37_VS02B_Provider_Integration_Readiness.md`    | Closed — Verified                         | 2026-08-15 完成 Provider Integration Readiness。新增 Provider-neutral Payment / Settlement / Withdrawal Ports、Verified Provider Fact、Provider Fact Receipt Guard、Capability Registry 与仅用于本地验证的 `ReferenceProviderAdapter`；Provider Fact 经 Adapter verification 后才由 Application Policy 映射至既有 `pilot_operations` 受控 Money Use Case。相同 Provider Event、同终态重复、冲突终态、晚到 sequence、金额/币种不一致均由 Contract / Application Tests 验证，且提现失败仅通过追加 `withdrawal_failed` Ledger Entry 恢复可用余额，未写入 Wallet Balance。2026-08-15 验证通过：`pnpm test`（167 passed / 8 skipped）、`pnpm build`、`pnpm db:check`、`pnpm check:openapi`、`pnpm web:typecheck`、`pnpm format:check`、`pnpm lint`、`git diff --check` 与 VS-02A Playwright 回归。未创建 HTTP Webhook Endpoint，未接入微信、支付宝、Stripe、PayPal 或其他真实 Provider，未使用真实 Secret、KYC、Checkout、账户、资金或提现；VS-02B 状态为 Provider Integration Ready，而非 Provider Integrated。                                                                                                                                                                                                                                                                                                                                    |
| DEV-008      | VS-02C / `38_VS02C_Provider_Adapter_Qualification.md`    | Closed — Verified                         | 2026-08-15 完成第一个 Provider-specific Adapter 的工程资格化。根据 `35A_Provider_Qualification_Dossier.md`，选择微信支付“平台收付通”作为 `CONDITIONAL` Primary Provider Candidate：其公开能力底稿为二级商户、冻结/解冻、平台佣金、分账、余额和提现的强候选，但 CNY 399 舞蹈私教 Service Commerce、Creator 主体、平台角色、退款/争议/负余额、5–10 Creator Pilot 与官方 Test 环境仍缺 Provider 书面确认。新增隔离的 WeChat Pay Adapter Skeleton、Creator Account Mapping、受控 Test Transport、Payment / Settlement / Withdrawal Request/Response/Event/Error Mapping 和 Refund Signal Mapping；全部映射到 VS-02B Provider-neutral Port / Fact，未修改 Money Domain、Wallet 或 Ledger。Provider-specific Contract 验证了金额/币种、幂等、重复/冲突/晚到事件、错误归一化和 Secret Isolation；本地受控 Test Transport 明确不等同官方 Sandbox、真实签名验证、真实 Webhook 或真实资金。2026-08-15 验证通过：`pnpm test`（171 passed / 8 skipped）、`pnpm build`、`pnpm db:check`、`pnpm check:openapi`、`pnpm web:typecheck`、`pnpm format:check`、`pnpm lint`、`git diff --check` 与 VS-02A Playwright 回归。状态为“VS-02C engineering qualification complete / Controlled Integration conditional”；在 `38` 第 8 节证据包完成前，VS-02D 仍被外部资格约束阻塞。                                                                                     |
| DEV-009      | VS-02D / `39_VS02D_Controlled_Real_Money_Integration.md` | Blocked — No-Go                           | 2026-08-15 已冻结 VS-02D 的唯一真实交易边界、Live Integration Readiness、Go / No-Go Checklist、Kill Switch 和 Transaction Evidence Package。资格核验显示当前只存在 `.env.example`；没有 Live runtime credential 配置、真实 Provider Account / Creator Account Mapping、Provider 书面业务资格确认、官方 Sandbox / Test 准入或真实 callback 证据。`35A` 仍将 Service Commerce、Creator 主体、Platform Fee、退款/回退、争议、负余额和 Pilot 准入列为阻断性外部事实；`38` 因此保持微信支付候选为 `CONDITIONAL`，明确不得进入 VS-02D。未执行任何 Live Payment、真实 Provider API、真实 Webhook、真实 KYC/KYB、账户进件、真实结算或提现。解除条件仅为 `39` 第 4 节 Live Readiness 与第 6 节 Go / No-Go Checklist 的全部书面证据和独立授权完成；在此之前不得声明 First Real Payment Connectivity Verified。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| DEV-010      | EXEC-002 / VS-01 regression verification                 | Closed — Verified                         | 2026-08-16 修复 VS-01-only 验证漂移，不修改任何产品对象、Money Domain、状态机、Schema 或业务语义。冻结 `VS-01 Regression = VS-01 Semantics Remain Stable`：治理脚本与 `foundation.spec.ts` 改为验证 VS-01 route / operation ID、request/response Contract、Canonical Event 与权限子集稳定，同时允许合法 VS-02 route 独立存在。Creator、Public Offering、Customer Result、Operations 与 Earnings 动态状态增加唯一 `data-testid`；全部 Playwright 移除无名 `getByRole('status')`、`.last()` 与顺序依赖，并按具名业务区域定位。审计时一次 Creator Identity API 5 秒 timeout 无法复现；确认 Vitest 已单 worker 串行，所有 server 正常显式关闭，并增加 `afterEach` 保底清理，未提高 timeout、未 skip。当前 `pnpm test` 连续两次均为 171 passed / 8 conditional skipped；完整 System Edge 为 19 passed / 2 conditional skipped；VS-01 与 VS-02A focused acceptance 均通过。                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| DEV-011      | VS-02D Engineering Readiness / Runtime Safety            | Closed — Verified                         | `VS-02D-READY-001` 建立默认关闭的 Live runtime guard、Provider production configuration boundary、webhook signature / receipt / normalization boundary、PostgreSQL replay / conflict persistence、First Transaction Evidence Schema 和人工激活 Runbook。`pnpm test`、Provider contracts、完整 Playwright、Preflight 与当前源码 deployment drill 全部通过；未改变 Money Domain、VS-02B Provider Contract 或受控事实语义，未配置真实凭据、执行真实资金或声明 Provider Qualified。冻结依据：`39A_VS02D_Controlled_Real_Money_Activation_Readiness.md`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| DEV-012      | VS-02E / FR-202 / FR-204 / FR-205 / FR-208 / FR-209      | Closed — Verified                         | 2026-08-16 completed Provider-neutral Local Commercial Simulation. `LocalCommerceSimulator` implements the unchanged Payment / Settlement / Withdrawal Provider Port and uses `local_commerce_simulator` plus `simulation:` evidence identity. It exercises success, failure, delayed, expired, duplicate, out-of-order and conflicting terminal scenarios without Provider SDKs, secrets or real-money activation. Simulation facts enter the existing Application Policy, append-only Ledger and Wallet projection; `0010_vs02e_provider_fact_history.sql` preserves Provider Fact history for the frozen `PaymentSucceeded → RefundSucceeded` evolution while ordinary terminal conflicts remain rejected. Operations-only Simulation HTTP routes and Browser control exist only for `local` / `test` / `controlled`; production composition does not register the routes and the production Web image does not render the control. `pnpm preflight`, 201-pass Vitest, 20-pass System Edge, VS-02E Browser acceptance, current-HEAD image rebuild and deployment backup / restore / rollback drill passed. No Real Money Evidence. Governance source: `40_VS02E_Local_Commercial_Simulation.md`.                                                                                                                                            |
| DEV-013      | VS-02E Commercial Lifecycle Hardening                    | Closed — Verified                         | Controller approved DEC-013-A / DEC-013-B on 2026-08-17. Settlement failure is independent from Payment and Order failure, persists `Settlement = failed`, opens `Pending Resolution`, supports frozen-calculation idempotent retry, and never creates Available Earnings before resolution. Post-Settlement Refund appends immutable `refund_debited` recovery fact; Wallet remains non-negative, historical Withdrawal remains unchanged, and later Earnings reduce `recoveryOutstanding` before becoming Available. Added `settlement_failed` Canonical Event and migration `0011_dec013_commercial_lifecycle.sql`. DEC-013 focused integration/domain/simulator coverage passed 27 tests; full preflight evidence follows. No Real Money Evidence. Governance source: `41_VS02E_Commercial_Lifecycle_Hardening.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| DEV-014      | VS-02F Local Paid Commerce Productization                | Closed — Verified                         | 2026-08-17 completed browser-operable Local Paid Commerce without changing Provider-neutral Ports or enabling real money. Added a product Application boundary that maps Customer/Creator commands to the existing Local Simulator, verified Provider Facts, Application Policy and Money Domain; production composition registers no Simulator product routes. Customer can view immutable Checkout snapshot and run Success / Failed / Delayed / Expired Payment with same-Order retry. Creator can view Order, Customer, Payment, Fulfillment, Settlement, fee trace, Earnings, Wallet, Recovery and Withdrawal, then run Settlement / Refund / Withdrawal simulation without Operations UI. Simulator-driven lifecycle tests exposed and fixed two engineering defects: failed Withdrawal retry now appends a new reservation entry for the same immutable Withdrawal before a retry Fact can complete it; Wallet refund/reversal projection now debits Pending Earnings only for the originating Order and cannot consume another Order's Pending Earnings. Added 12 focused Browser ATs; final full verification evidence is in Section 18. Simulation Only / No Real Money Evidence. Governance source: `42_VS02F_Local_Paid_Commerce_Productization.md`.                                                                               |
| DEV-016      | VS-02H Commercial Pilot Operations Readiness             | Closed — Verified                         | 2026-08-17 added a protected `pilot_operations` Workspace, Provider-neutral reconciliation view, non-sensitive Commercial Evidence summary, persistent Operations Action Audit, and controlled Settlement/Withdrawal Retry paths through existing Application Use Cases and verified Simulation Facts. No direct Wallet/Ledger mutation exists; Manual Resolution records audit only and cannot assert Money success. Provider Fact observations expose duplicate/conflict/stale handling without creating new Money facts. The implementation separates per-Order Earnings projection from Creator-global Wallet projection, preventing cross-Order Withdrawals from being misrepresented as negative Order balances. OPS-01–OPS-08 and API authorization/evidence-redaction regressions are recorded in Section 20. Simulation Only / No Real Money Evidence. Provider Qualification remains an External Parallel Track. Governance source: `44_VS02H_Commercial_Pilot_Operations_Readiness.md`.                                                                                                                                                                                                                                                                                                                                             |
| DEV-017      | VS-02I First Commerce Pilot Preparation                  | Closed — Verified                         | 2026-08-17 froze the single Creator / Offering / Customer / CNY / Price / Request Commerce Pilot Transaction Template; centralized configurable Business Policy; added Founder Go / No-Go evaluation, Pilot Scope Guard, fixed Evidence Package shape, Runbook v2, hard Stop Conditions and Simulation / Provider fact isolation. PILOT-01–PILOT-10 pass. This prepares activation but does not declare Real Commerce Ready or Commercial Launch; `REAL_MONEY_ENABLED=false`, No Real Money Evidence, Provider Qualification remains External Parallel Track. Governance source: `45_VS02I_First_Commerce_Pilot_Preparation.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| DEV-018      | VS-02J Founder Real-Money Activation Review              | Closed — Verified                         | 2026-08-17 created a documentation-only Founder Decision Package consolidating VS-02A/B/C/E/F/G/H/I evidence, Founder Activation Matrix, GO / CONDITIONAL GO / NO-GO definitions, hard stop conditions, the fixed one-transaction case and executable activation runbook. Current recommendation is `NO-GO` because Provider Qualification, official Sandbox / Live Provider evidence, production credentials, account mapping and real Payment / Settlement / Withdrawal paths remain unverified. Final Controller Recommendation is intentionally left unselected. No code, API, Product Object, Provider Adapter, Money Domain, credential or runtime flag changed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| DEV-019      | VS-02K Real Creator Pilot / Non-Money                    | In Progress — External Execution Required | 2026-08-17 created the Real Creator Pilot governance contract, non-money scope, real-user identity rules, distribution/request evidence boundary and dataset-isolation requirement. The repository has no real Creator accounts, real Customer, controlled Public URL, Creator-owned distribution evidence or isolated Pilot database evidence in this session; PILOT-K01–K10 and K12 therefore remain Pending and cannot be closed with test tokens, fixtures or local simulation. `REAL_MONEY_ENABLED=false`, No Real Money Evidence, Commercial Launch not declared. Governance source: `47_VS02K_Real_Creator_Pilot_Non_Money.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## 8. Decision Record

### D-21-01 — Execution record does not own product definition

- **Decision**：21 只记录执行事实、偏差和验收证据；不通过状态更新修改产品定义。
- **Reason**：防止代码方便性反向扩张或重写 PRD。
- **Consequence**：任何产品语义变化都必须走 Deviation → Product Decision → PRD Amendment。
- **Revisit Trigger**：无；这是 VS-01 执行治理规则。

### D-21-02 — FR traceability is mandatory

- **Decision**：`FR-001–FR-053` 必须全部维护状态和证据。
- **Reason**：里程碑完成不等于 PRD 完成；需要防止“以为已做”的实现盲区。
- **Consequence**：没有 Traceability Evidence 的功能不得被视为完成。
- **Revisit Trigger**：如果 PRD 经批准修订，必须同步增加、废弃或迁移对应 FR。

### D-21-03 — Controlled Prototype remains Shadow Commerce

- **Decision**：Build 期间禁止以临时实现引入 Payment、Settlement、Refund、GMV 或 Take Rate。
- **Reason**：Real-money 条件尚未完成，且这些能力超出 VS-01 Flow Stop Boundary。
- **Consequence**：任何相关需求均为 Scope Violation，而不是“快速补充”。
- **Revisit Trigger**：仅在 15 的 Real-money Controlled Pilot Ready 条件全部满足后重新讨论。

### D-21-04 — Cross-client core precedes reference client

- **Decision**：M2 前先按 `23` 与 `24` 建立平台无关的 Application Core、API Contract、Persistence、Auth 和只调用统一 API 的 Web Reference Client Foundation。
- **Reason**：产品最终呈现形态尚未冻结，核心业务不能依赖 Next.js、浏览器或任一客户端运行时。
- **Consequence**：执行顺序调整为 `CU-TA-01–CU-TA-06 → M2`；Reference Client 只能通过统一 API 使用业务能力，不能拥有领域规则。
- **Revisit Trigger**：出现第二个真实客户端，或独立 API 造成已测量且不可接受的交付成本。

## 9. Build Blockers

### 9.1 Blocker Rules

Blocker 必须区分：

| Severity | Definition                                                   | Required Response                       |
| -------- | ------------------------------------------------------------ | --------------------------------------- |
| P0       | 无法启动或运行核心 VS-01 Flow；存在严重安全或数据风险        | 停止受影响 Milestone，立即记录并决定    |
| P1       | 阻止一个 Must Build FR 或关键状态 / 权限 / 事件正确实现      | 不能进入 Acceptance Testing             |
| P2       | 显著影响体验、测试或可追溯性，但存在受控替代路径             | 在 Prototype Ready 前必须有明确处理决定 |
| P3       | 不阻止 Controlled Prototype；记录并在 Post-Build Review 排序 | 不阻塞当前 Milestone，除非升级          |

### 9.2 Current Blocker Register

| Blocker ID | Severity | Related FR / Milestone | Status | Owner                 | Next Action                                                                                                    |
| ---------- | -------- | ---------------------- | ------ | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| ENG-005    | P1       | CU-TA-01 / M1.5        | Closed | Engineering           | Application / Contract 边界与自动化导入门禁已建立                                                              |
| ENG-006    | P1       | CU-TA-03 / M1.5        | Closed | Engineering           | API v1、统一错误 Envelope、OpenAPI 与 Runtime 已建立                                                           |
| ENG-007    | P1       | CU-TA-04 / M2 前       | Closed | Engineering           | 已使用 Podman PostgreSQL 完成空库 Migration、Commit / Rollback、重复 Migration 幂等性和 Preflight 验证         |
| ENG-008    | P1       | CU-TA-05 / M2 前       | Closed | Engineering           | 受控 Hosted Supabase 登录、真实 Token、无效 Token、未映射 / 已映射 Creator、网络错误与敏感信息脱敏验证全部通过 |
| ENG-009    | P2       | M5 前                  | Closed | Product + Engineering | DEV-003 的唯一 `resultAccessToken`、PostgreSQL 约束、公开结果 API 与 System Edge 结果访问已验证                |
| ENG-010    | P2       | M7 前                  | Closed | Product + Engineering | DEV-004 的 Log / In-Memory Notification Adapter 受控替代已通过 M7 行为、失败隔离与角色可见性验证               |

### 9.3 Known Non-blockers

以下事项不阻止 Controlled Prototype Build，但仍不允许被绕过或伪造：

- 真实首发城市；
- Cohort 0 Creator 名单；
- 支付服务商；
- 法律实体、税务和 Merchant of Record 身份；
- 真实 Payment、Settlement、Refund 政策；
- 真实公开大规模发布计划。

它们影响后续 Pilot 或 Real-money Readiness，不授权 VS-01 提前实现相关能力。

## 10. Acceptance Testing

### 10.1 Test Entry Criteria

只有在满足以下条件后进入 `Acceptance Testing`：

- M1–M7 均达到 Internal Complete；
- 每个 Must Build FR 已至少有实现证据；
- 所有 P0 / P1 Blocker 已关闭；
- 所有开放 Deviation 已有 Product Decision；
- 产品中没有 Explicitly Not Build 能力。

### 10.2 Acceptance Test Source

验收仅使用：

- 20 PRD 第 9 节 Acceptance Criteria；
- 20 PRD `FR-001–FR-053`；
- 18 的 Canonical State Transitions 与 Stop Boundary；
- 19 的 State-aware UI、通知、Empty / Error / Edge Case 行为。

### 10.3 Required Test Evidence

每个验收条目至少保留一种可复查证据：

- 可重复执行的测试；
- 端到端演示步骤；
- 截图或录屏；
- 状态与事件记录；
- 缺陷修复验证；
- 与 Deviation / PRD Amendment 的关联记录。

### 10.4 Required End-to-End Test Paths

| Test ID | Path                                                   | Required Outcome                                                                         |
| ------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| AT-001  | Creator creates Identity → Capability → Draft Offering | Creator 可完成供给准备，未公开前无 Buyer Request 入口                                    |
| AT-002  | Draft Offering missing condition → Publish attempt     | Publish 被阻止；缺失条件清晰；无 `creator_published`                                     |
| AT-003  | Eligible Offering → Publish → Generated Asset          | Offering / Identity 正确公开；Asset 为 Generated；不触发 Distributed                     |
| AT-004  | Creator records external share                         | Asset → Distributed；`creator_distributed` 产生                                          |
| AT-005  | Buyer opens public Storefront → views Offering         | 只看到当前 Published、可请求供给；记录 `storefront_viewed`                               |
| AT-006  | Buyer submits valid Request                            | Customer / Submitted Action 创建；`commerce_action_submitted`；Creator 收到通知          |
| AT-007  | Buyer submits invalid / unavailable Request            | 无 Action、无提交事件；显示正确错误或不可用状态                                          |
| AT-008  | Owner Creator confirms Submitted Action                | Action → Confirmed；`commerce_confirmed`；Buyer 得到非支付语义结果                       |
| AT-009  | Owner Creator declines Submitted Action                | Action → Declined；`commerce_declined`；Buyer 得到正确结果                               |
| AT-010  | Attempt repeat / unauthorized terminal action          | 状态不变；无重复终态事件                                                                 |
| AT-011  | Unpublish after existing Submitted Action              | 停止新 Request；既有 Action 仍可处理                                                     |
| AT-012  | External payment / fulfillment observation             | 如记录，仅产生 observation event；无平台支付状态、GMV 或 Take Rate                       |
| AT-013  | Explicit Non-goal inspection                           | 产品不存在 Payment、Checkout、Settlement、Refund、Marketplace、CRM、自动排期或履约工作流 |

### 10.5 Acceptance Result Register

| Test ID | Status | Evidence                                                                                                                                                                                                                                                                                                     | Defect / Deviation | Date       |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------- |
| AT-001  | Pass   | System Edge Playwright `vs01.spec.ts`; complete Identity → Capability → Draft Offering → Publish → Share → Request → Confirm → Customer Result path                                                                                                                                                          | —                  | 2026-08-12 |
| AT-002  | Pass   | System Edge Playwright `m4-publish-share.spec.ts`; incomplete Draft Offering shows missing conditions and cannot publish                                                                                                                                                                                     | —                  | 2026-08-12 |
| AT-003  | Pass   | System Edge Playwright `m4-publish-share.spec.ts`; eligible Offering → Published → Generated Asset                                                                                                                                                                                                           | —                  | 2026-08-12 |
| AT-004  | Pass   | System Edge Playwright `m4-publish-share.spec.ts`; Creator explicitly records external distribution                                                                                                                                                                                                          | —                  | 2026-08-12 |
| AT-005  | Pass   | System Edge Playwright `m5-customer-request.spec.ts`; Buyer views current Published Offering through public Storefront                                                                                                                                                                                       | DEV-002            | 2026-08-12 |
| AT-006  | Pass   | System Edge Playwright `m5-customer-request.spec.ts`; anonymous Buyer submits complete Request and sees Submitted result                                                                                                                                                                                     | DEV-001            | 2026-08-12 |
| AT-007  | Pass   | System Edge Playwright `m5-customer-request.spec.ts`; Unpublished Offering is unavailable; application test also rejects incomplete Request without Action / event                                                                                                                                           | DEV-001            | 2026-08-12 |
| AT-008  | Pass   | System Edge Playwright `m6-creator-decision.spec.ts`; existing Submitted Action remains Confirmable after Offering Unpublish, records Confirmed result and Customer sees the bounded result                                                                                                                  | DEV-003            | 2026-08-12 |
| AT-009  | Pass   | System Edge Playwright `m6-creator-decision.spec.ts`; owning Creator declines Submitted Action and Customer sees the bounded Declined result                                                                                                                                                                 | DEV-003            | 2026-08-12 |
| AT-010  | Pass   | System Edge Playwright `m6-creator-decision.spec.ts`; unauthorized action returns 403, repeated terminal action returns 409, and Customer result remains unchanged                                                                                                                                           | —                  | 2026-08-12 |
| AT-011  | Pass   | System Edge Playwright `m5-customer-request.spec.ts`; existing Submitted Action remains stored after Unpublish and new Request is blocked                                                                                                                                                                    | —                  | 2026-08-12 |
| AT-012  | Pass   | Application acceptance `external-observation-use-cases.test.ts`; evidence-backed external observations append only Canonical Events and leave Commerce Action state unchanged                                                                                                                                | —                  | 2026-08-12 |
| AT-013  | Pass   | Historical 2026-08-12 isolation evidence is superseded for current regression interpretation. 2026-08-16 `foundation.spec.ts` verifies no unapproved Marketplace / CRM / Subscription / Multi-currency surface and preserves all VS-01 route / operation semantics while allowing governed VS-02 operations. | DEV-010            | 2026-08-16 |

## 11. Prototype Completion Criteria

VS-01 只有在以下条件全部满足时才能从 `Acceptance Testing` 进入 `Prototype Ready`：

1. M1–M8 均完成；
2. `FR-001–FR-053` 均为 Implemented、Deferred 或经批准的 Not Applicable；任何 Partial 必须有明确产品决定且不影响 20 的 Acceptance Criteria；
3. 20 PRD `9.1–9.4` 的所有 Acceptance Criteria 已通过；
4. AT-001–AT-013 全部 Pass，或存在经 Product Decision 批准的受控替代；
5. 所有 P0 / P1 Blocker 已关闭；
6. 所有 Deviation 已 Closed，或已通过 PRD Amendment 解决；
7. Canonical Event 语义与 20 PRD 一致；
8. Confirmed Commerce 与 Paid Transaction 严格隔离；
9. Explicitly Not Build 能力未进入 Prototype；
10. 能运行一次完整：

```text
Identity
→ Offering
→ Publish
→ Share
→ Request
→ Confirm / Decline
→ Event Recording
```

## 12. Post-Build Handoff

### 12.1 Required Handoff Package

进入 Product Review 时，Build Owner 需要提供：

- 当前 Build Status；
- 已完成 Milestone；
- 完整 FR Traceability 状态；
- Acceptance Result Register；
- Open / Closed Blocker Register；
- Open / Closed Deviation Register；
- 已知缺陷与限制；
- 一次完整 Canonical Flow 的演示或可复现步骤；
- 关键界面截图 / 录屏；
- Canonical Event 证据；
- 对 Explicitly Not Build 的范围确认。

### 12.2 Review Questions

Product Review 只回答：

1. **Product Compliance**：实现是否符合 20 PRD？
2. **Product Coherence**：实现是否仍正确表达 Commerce Identity → Offering → Request → Decision 的核心抽象？
3. **Product Gaps**：哪些真实使用或实现事实暴露出 PRD 需要修订？

Build 完成后，不应自动开启新功能设计。

输出只能是：

```text
PRD remains valid
or
Deviation / Product Decision
→ PRD Amendment
→ Next Build Iteration
```

## 13. Initial Execution Decision

> `20 MVP PRD: VS-01` 已冻结。`21 Prototype Execution` 已建立为执行台账，`23` 与 `24` 已冻结跨端技术架构及落地顺序。

> `CU-TA-01–CU-TA-07` 已于 2026-08-11 建立完整 M1.5 工程底座。ENG-008 已关闭。M2 Creator Identity 已实现并进入验收；FR-001–FR-004 已完成，FR-005 的公开入口拒绝由后续 M5 Public Surface 完整验收。当前不得将 M2 误标记为完整 VS-01。

## 14. 临时 Change Unit

### STRAT-01 — North Star End State

**目的**

补齐独立的终局北极星目标与长期校准合同，避免 MVP 交付成为缺少共同终点的局部功能积累。

**状态**：Complete

**证据**

- `docs/01_Strategy/04_North_Star_End_State.md` 已建立；
- 已明确一句话北极星、终局必须成立的产品事实、五层终局产品模型、长期结果指标、反指标和阶段闸门；
- 已明确 Creator 是起点，Personal Commerce Infrastructure 是终点；
- 已明确终局方向不得反向扩大 VS-01 范围；
- `docs/README.md` 已加入战略文档索引；
- 未修改 VS-01、`FR-001–FR-053`、`AT-001–AT-013`、领域对象、状态转换、Canonical Event、权限或当前 MVP 产品行为。

### UI-LANG-01 — 用户界面语言治理

**目的**

建立 Web Reference Client 的用户语言边界，避免领域对象、API、状态机和内部错误信息直接呈现给用户。

**范围**

- 建立 Copy Catalog；
- 建立用户可见错误适配器；
- 改造 Creator Identity Workspace；
- 清理当前公开入口页面中的工程术语；
- 将用户文案检查接入 Preflight。

**状态**：Complete

**证据**

- `docs/09_Engineering_Governance/25_User_Facing_Language_Governance.md` 已建立；
- `apps/web/src/content/user-facing-copy.ts` 集中管理用户文案；
- `apps/web/src/lib/ui/user-facing-messages.ts` 阻断 API 原始错误透传；
- Web 页面不再直接渲染 `Commerce Identity`、`Capability`、`Access Token` 等工程术语；
- `apps/web/src/lib/ui/user-facing-messages.test.ts` 已覆盖错误映射、未知错误兜底和状态文案映射；
- `pnpm check:user-copy` 已接入根 Preflight；
- 未修改产品对象、API Contract、状态机、Canonical Event 或 VS-01 范围。

### DS-01A — Design Taste Exploration

**目的**

使用 Design Taste Frontend Skill 完成跨端视觉语言探索，为后续 Design Token Contract 提供输入。

**状态**：Complete

**证据**

- `docs/09_Engineering_Governance/26_DS01A_Design_Taste_Exploration.md` 已建立；
- 已明确 Design Read、设计旋钮、视觉原则、色彩方向、字体方向、表面方向、动效方向和可访问性方向；
- 已形成 DS-01B 的跨端视觉语义候选清单；
- 未修改 `apps/web` 代码；
- 未冻结具体颜色值、字体、CSS 变量、组件实现或客户端框架；
- 未修改产品对象、Flow、PRD、API Contract、状态机、Canonical Event 或 VS-01 范围。

### DS-01C — Design Token Value and Accessibility Calibration

**目的**

将 DS-01B 的视觉语义转换为可机器读取、可跨端消费并通过可访问性校验的 Token Source of Truth。

**状态**：Complete

**证据**

- `design-system/tokens/design-tokens.json` 已建立为跨端 Token 唯一值来源；
- `design-system/tokens/design-tokens.schema.json` 已建立结构约束；
- 已冻结 Primitive Color、Typography、Spacing、Radius、Elevation、Motion 和 Control Values；
- `scripts/design/check-token-calibration.mjs` 已建立对比度、字体缩放、触控目标、焦点环、减少动效和命名边界校验；
- `pnpm check:design-tokens` 已接入根 Preflight；
- Token Calibration 已通过；
- 未生成 CSS Variables、Tailwind Theme、Native Theme 或 WXSS；
- 未修改 `apps/web`、产品对象、Flow、PRD、API Contract、状态机、Canonical Event 或 VS-01 范围。

### DS-01D — Web Reference Design System Implementation

**目的**

将跨端 Token Source of Truth 映射为 Web Reference Client 的首个视觉 Adapter，并建立可复用组件与业务页面设计系统门禁。

**状态**：Complete

**已完成证据**

- `docs/09_Engineering_Governance/29_DS01D_Web_Reference_Design_System_Implementation.md` 已建立；
- Web Token Adapter 生成器与过期检查已建立；
- Button、Input、Textarea、Form Field、Surface、Status Message、Empty State 已建立；
- 首页、Creator Identity 工作台、公开主页占位页与 Customer 占位页已迁移至 `ds-*` 语义类与共享组件；
- `check:web-token-adapter` 与 `check:web-design-system` 已接入 Preflight；
- `pnpm preflight` 已于 2026-08-11 通过：115 tests（94 passed / 21 skipped），Web Production Build 通过，系统 Edge 浏览器验收为 4 passed / 13 skipped；
- 未修改产品对象、Product Flow、API Contract、状态机、Canonical Event 或 VS-01 范围。

### DS-01B — Cross-platform Design Semantic Extraction

**目的**

将 DS-01A 的视觉方向转换为平台无关的视觉语义、Token 命名契约、组件状态模型和最低可访问性约束。

**状态**：Complete

**证据**

- `docs/09_Engineering_Governance/27_DS01B_Cross_Platform_Design_Token_Contract.md` 已建立；
- 已冻结 Color、Typography、Spacing、Radius、Elevation、Component State 和 Accessibility 的语义层级；
- 已冻结 Semantic Token、Component Token、Primitive Token 与 Platform Adapter 的使用边界；
- 已明确 Web、App 与微信小程序的同义适配约束；
- 未冻结具体颜色值、字体、间距数值、CSS Variables、Tailwind 配置或组件代码；
- 未修改产品对象、Flow、PRD、API Contract、状态机、Canonical Event 或 VS-01 范围。

### M9 — Deployable Prototype Hardening

**目的**

在不修改 VS-01 产品行为的前提下，将 Prototype Ready 基线推进为可重复部署、可观测、
可恢复并具备安全升级路径的运行系统。

**状态**：Complete

**范围**

- `CU-OPS-01` Runtime Lifecycle：Production 配置、启动校验、依赖感知 Readiness 与优雅关闭；
- `CU-OPS-02` Reproducible Deployment：API、Web、PostgreSQL、Migration Job 与 Production-like 运行栈；
- `CU-OPS-03` CI Delivery Gates：真实 PostgreSQL Migration / Persistence、OpenAPI Compatibility、镜像构建与 Smoke；
- `CU-OPS-04` Observability and Recovery：关联日志、错误诊断、Backup / Restore 与 Rollback 演练。

**完成证据**

- `ROADMAP.md` 已冻结 M9.1–M9.4 的任务、验收标准与 Exit Gate；
- `CU-OPS-01` 已实现 `production` 配置、数据库依赖 Readiness、请求关联 ID、脱敏访问日志与 `SIGINT` / `SIGTERM` 优雅关闭；
- `CU-OPS-02` 已建立 API / Web Dockerfile、PostgreSQL + Migration Job Production-like Compose，以及无明文 Secret 的示例配置；
- `CU-OPS-03` 已将 OpenAPI Compatibility、真实 PostgreSQL Persistence、镜像构建与 Production Deployment Drill 接入 CI；
- `CU-OPS-04` 已建立 Deployment Smoke、Backup / Restore、应用回滚 Smoke、最低告警条件和运行 Runbook；
- `pnpm test:deployment` 已通过：临时 PostgreSQL Migration、API / Web 镜像、Health / Readiness / OpenAPI / Web Smoke、Backup / Restore、SIGTERM 优雅关闭与应用回滚 Smoke 均通过；
- `vitest.config.ts` 已将测试文件并行度固定为单 worker，避免 Windows 默认文件并行启动竞争触发 5 秒超时；`pnpm preflight` 已于 2026-08-13 通过：151 tests（143 passed / 8 conditional skipped）、System Edge 16 passed / 0 skipped、Web Production Build 通过；
- 2026-08-13 使用 Podman 5.7.1 完成 Production Deployment Drill：API / Web 镜像构建、6 个 Migration、Health / Readiness / OpenAPI / Web Smoke、Backup / Restore、SIGTERM 优雅关闭与应用回滚 Smoke 均通过；
- 2026-08-13 使用缓存的 `postgres:17` 容器完成真实 PostgreSQL 证据：Migration Job 成功，`tests/persistence` 的 5 项测试全部通过；尝试拉取 `postgres:17.6-bookworm` 时受 Docker Hub 网络超时影响，未将该次失败计入产品或代码失败；
- 2026-08-13 受控 PowerShell 进程已注入 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_TEST_EMAIL`、`SUPABASE_TEST_PASSWORD`；执行 `RUN_REAL_SUPABASE_AUTH_TESTS=1 pnpm test:auth:provider` 通过 5/5 项真实 Hosted Supabase Provider 验证，覆盖真实登录、Token 验证、无效 Token、未映射 / 已映射 Creator、网络失败和敏感信息脱敏；凭据仅存在于该 PowerShell 的 `Process` scope，未写入 User 或 Machine scope；
- 真实依赖复验入口保持可复现：PostgreSQL 使用 `DATABASE_URL=... pnpm db:migrate && pnpm test:persistence`，Hosted Supabase 使用 `RUN_REAL_SUPABASE_AUTH_TESTS=1 pnpm test:auth:provider`，后者缺少四项凭据时必须停止并报告缺失项；
- `.github/workflows/ci.yml` 已新增仅允许 `workflow_dispatch` 触发的 `supabase-provider` Job；该 Job 注入受控 GitHub Secrets 后运行 `pnpm test:auth:provider`，用于持续保留真实 Hosted Provider 通过或失败的证据；
- 2026-08-13 Production-like Compose 复验未形成通过证据：本机 `podman compose` 委托外部 Docker Compose provider 后超时，最终未遗留容器、网络、卷或端口；不将该次环境超时误报为 Compose 通过，需在可用 Compose provider / Registry 环境重跑；
- 2026-08-14 修复 GitHub Actions CI：`deployment-build` 补齐 Node 22、pnpm 10.22.0 与依赖安装；Web Token Adapter 校验规范化 CRLF / LF 换行，避免 Windows 生成物在 Linux Runner 被误判为过期；
- 2026-08-14 GitHub Actions 复验显示 `deployment-build` 与 `postgres-integration` 已通过；为消除 Windows Runner 的全仓 Prettier 跨平台换行误报，统一设置 `endOfLine: auto`，并将 `checkout`、`setup-node`、`pnpm/action-setup` 升级到 Node 24 兼容版本；
- 2026-08-14 GitHub Actions `preflight` 进一步确认 Windows Runner 缺少 Playwright `ffmpeg`，导致视频保留配置下浏览器页面无法创建；CI 已在依赖安装后显式执行 `pnpm exec playwright install ffmpeg`；
- `pnpm typecheck`、`pnpm test:governance`、`pnpm check:openapi` 与受影响文件 Prettier 检查均通过；
- M9 不修改 `FR-001–FR-053`、AT-001–AT-013 产品语义、状态机、权限、Canonical Event 或 Deferred Capability。

**边界**

- 不修改 `FR-001–FR-053`；
- 不修改 AT-001–AT-013 的产品语义；
- 不新增产品对象、状态、权限或 Canonical Event；
- 不引入 Payment、Settlement、Refund、Marketplace、CRM、自动排期或履约工作流；
- 任何后续产品行为变化仍必须先登记 `DEV-###`。

### DS-01E — Quiet Commerce Desk Web Surface Refactor

**目的**

在已通过 UI/UX 设计审计的 Quiet Commerce Desk 方向下，重构 `apps/web`
的页面壳层、视觉层级、响应式布局与品牌表现；保持现有 VS-01 功能、路由、
表单契约和交互行为不变。

**状态**：Complete

**范围**

- 首页、Creator Identity、公开 Offering、Customer Request / Result 页面；
- Web 页面层级、页面上下文、品牌壳层、暖纸色视觉基底、排版、间距、
  响应式桌面端与移动端布局；
- 仅使用现有 Web API Client、组件和产品文案，不新增产品能力。

**完成证据**

- 变更文件限定在 `apps/web` 的页面、组件、布局与样式文件；
- 未修改 API Contract、领域模型、状态机、Canonical Event、权限、
  字段 ID、现有 URL 路由或 VS-01 产品范围；
- `pnpm format:check` 通过；
- `pnpm lint` 通过；
- `pnpm typecheck` 通过；
- `pnpm web:typecheck` 通过；
- `pnpm build:web` 通过；
- `pnpm test:acceptance:browser` 通过：16 passed / 0 failed；
- 浏览器验收覆盖首页、Creator Identity、Offering 草稿与发布、
  Public Offering、Customer Request、Creator 决策和 Result 路径；
- 现有浏览器验收依赖的按钮文本、表单 label、字段 ID 和测试选择器保持兼容。

**边界**

- 本变更只调整 `apps/web` 前端表现层；
- 不新增支付、结算、退款、Marketplace、CRM、自动排期或履约工作流；
- 不改变任何产品行为；因此不新增 `DEV-###` 偏差；
- 后续若需要改变产品行为，必须先登记独立的 `DEV-###` 变更。

### Commercialization Cutline — Reference Product → Real Product

**目的**

将下一阶段固定为一个小而硬的产品化执行边界：只处理真实身份、Commerce Identity、
真实分发、首个 Creator-direct Commerce 的最小承载能力，以及 Repeat Supply 所需
的最小系统承载；不把商业成功、PMF、复购或收入判断转交给工程团队。

**状态**：Complete

**执行依据**

- `docs/09_Engineering_Governance/31_Commercialization_Readiness_Cutline.md`
- C1 `Real Identity`
- C2 `Commerce Identity`
- C3 `Real Distribution`
- C4 `First Commerce`
- C5 `Repeat Supply`

**边界**

- 当前 VS-01 的 `Request → Confirm / Decline` 保持不变；
- C4 若超出 VS-01，必须先登记独立 `DEV-###` 或产品变更单元；
- 不启动 M10、M11、M12 等平台扩张阶段；
- Marketplace、搜索、推荐、CRM、会员、AI Agent、复杂日历、自动排期、
  多方结算、支付平台、大型运营后台和 Analytics Dashboard 默认 Deferred；
- 真实 Creator 的选择、运营、使用意愿、复购和收入属于业务决策，不作为工程
  团队替代判断的验收目标。

**完成证据**

- `CR-01–CR-08` 全部完成；
- C1 Real Identity、C2 Commerce Identity、C3 Real Distribution 和 C4 First
  Commerce 的技术承载达到 Ready；
- C5 为 `System Ready, Business Fact Unverified`，未使用测试伪造 Repeat Supply；
- `docs/09_Engineering_Governance/31_Commercialization_Readiness_Cutline.md` 已记录
  阶段完成总结并正式关闭；
- 最终技术判断为 `Ready under approved local acceptance`，不等同于外部公网生产
  部署或商业成功。

### Minimum Commercial Loop — Real Product → Commercial Product

**目的**

让一个真实 Creator 通过一个真实 Service Offering，从一个真实 Customer 获得一笔
真实付款，完成真实履约、Settlement、Creator Wallet 入账和 Withdrawal，并由平台准确
记录第一笔不可自欺的 Completed Paid Commerce。

**状态**：VS-02 Productization Active; Provider Qualification Parallel; Provider-neutral Build Authorized

**执行依据**

- `docs/09_Engineering_Governance/32_Minimum_Commercial_Loop.md`；
- `docs/09_Engineering_Governance/33_Money_Flow_Decision.md`；
- `docs/09_Engineering_Governance/34_Commerce_Pattern_Settlement_and_Wallet_Model.md`；
- 阶段 North Star：`First Completed Paid Commerce`；
- 产品增量：`VS-02 — Paid Service + Earnings`，作为 VS-01 的 Commerce Extension。

**当前决策状态**

- `D-MCL-GATE-01` 已批准：D-MCL-01 改为 Provider-specific Adapter / Real-money Pilot
  的 External Constraint Track，不再阻塞 VS-02 PRD、36 Delta 或 Provider-neutral Build；
- Gate 0A 已完成公开官方 Provider / Merchant 能力核查，但仍等待 Provider-specific
  business confirmation；
- Gate 0B 已完成 CNY 399 provider-neutral 资金流与异常路径模拟，未虚构费率或责任；
- Gate 0A 已新增 `35_China_Creator_Settlement_Infrastructure_Map.md`，将研究层级从
  单一支付 Provider 扩展为 Creator Settlement Infrastructure；
- Gate 0C 已改为 Provider Qualification Gate；微信支付平台收付通是领先资格候选，
  支付宝必须单独完成同等能力核验；两者均未 Qualified；
- Provider Qualification 继续并行推进，负责外部 Provider Adapter、真实账户和 Controlled
  Real-money Pilot 约束；
- 官方巨量星图资料已验证个体达人直提现与 MCN 机构代结算两种现实路径；抖音生活服务中
  具体合作支付服务机构、专项服务机构和收款账户结构仍需官方协议或商务确认；
- 首发市场已冻结为中国大陆，首发币种已冻结为 CNY；
- 中国首发支付候选已冻结为微信支付和支付宝；
- Platform Fee 已冻结为必备商业事实，具体费率、支付方和扣取方式待决；
- Settlement、Creator Wallet / Earnings Ledger 和 Withdrawal 已冻结为终局必备能力；
- Wallet 是产品账本概念，不自动等于平台自建资金池或无监管储值；
- 全球化架构约束为 Payment Provider Adapter + Regional Legal / Merchant Model；
- Stripe、PayPal 和其他区域 Provider 仅为未来候选，不进入中国首版 Scope；
- Model A Creator-direct、Model B Platform Checkout、Model C Provider-backed Creator Settlement
  的比较框架已冻结；
- 当前候选方向是 Creator 作为 Seller / 收款商户、平台提供 Commerce Infrastructure、
  Payment Orchestration、Settlement 和 Wallet Ledger，Provider 承担合规资金托管、分账
  和提现能力；该方向是 Model C Provider-backed Creator Settlement 的研究候选，但不是已批准结论；
- Creator 使用自然人 / 小微主体还是个体工商户、平台法律实体和角色、微信 / 支付宝
  具体产品、KYC、Refund、Dispute、Chargeback 和负余额责任仍为 Blocking。

**当前执行任务**

- `35_VS02_Paid_Service_PRD.md` 已冻结 VS-02 Paid Service + Earnings 产品合同；
- `36_Engineering_Governance_Delta.md` 已冻结 Money Domain、Ledger、Adapter、精度、
  事件真实性、幂等、回放与审计不变量；
- 创建 VS-02 根 `DEV-###`，完成 Provider-neutral Domain Build 的代码、迁移、API、UI 和测试；
- 继续按 `35A_Provider_Qualification_Dossier.md` 获取 Provider 外部事实；这些事实仅决定
  Provider Adapter 和 Controlled Real-money Pilot；
- 不得让 `Unknown — Blocking` 的 Provider 结论静默改变 Product Domain。

**Provider Adapter / Pilot 门禁**

- Provider Qualification、法律、运营和安全证据满足前，不接入真实 Checkout、Webhook、
  Payment、Refund、Payout、KYC 或 Connected / Sub-merchant Account；
- 不将现有 `external_paid_verified` 直接重命名或升级为真实 Payment Success；
- 不以 Sandbox、测试卡、Mock、Fixture、内部账号自买自卖或人工数据库修改作为
  First Completed Paid Commerce 证据。

当前明确不做：

- 不评估与首发市场无关的大范围 Provider 清单；
- 不启动未经资格确认的真实支付、Checkout、Webhook、Refund、Payout 或 KYC；

**冻结范围**

- 只支持 Service Offering，不引入 Ticket、Event、Experience 或 Merchandise；
- 最小新增对象候选为 Order、Payment、Fulfillment、Settlement、Wallet Ledger 和
  Withdrawal；
- Cancellation 和 Refund 只建设完成失败闭环所需的最低责任能力；
- 不建设自有 Payment Platform、无监管资金池、Wallet Credit / 借贷、Marketplace、
  多币种、订阅、发票、大型订单系统或与第一笔真实交易无关的 UI / 工程扩张。

## 15. EXEC-002 — Current Verification Baseline

> **Date**：2026-08-16
> **Status**：Verification Baseline Restored
> **Deviation**：DEV-010
> **Scope**：验证与治理基线；不修改产品行为、Money Domain、Schema 或真实 Provider 状态

### 15.1 Historical Evidence and Current Evidence

本文件中 2026-08-11、2026-08-12 和 2026-08-15 的通过记录保留为 Historical Evidence，
用于说明当时提交与阶段的验证结果。它们不得自动解释为当前提交仍然通过。

当前完成声明只依据本节 2026-08-16 重新运行的命令、浏览器结果和当前源码镜像部署证据。

### 15.2 Root Causes and Corrections

| Finding                              | Root Cause                                                                                                             | Correction                                                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Preflight rejected VS-02 terms       | 旧治理脚本扫描全部运行时代码并禁止 Payment / Settlement 等 VS-01 Deferred 名词，把 VS-01 Regression 错误解释为仓库隔离 | 改为冻结并验证 VS-01 route、operation ID、Canonical Event 与 permission regression 子集；允许独立 VS-02 Contract         |
| OpenAPI browser acceptance failed    | `foundation.spec.ts` 要求 OpenAPI 不存在合法 VS-02 operation                                                           | 改为验证 VS-01 Contract 保持稳定，并显式确认受治理的 VS-02 Order / Wallet operation 可独立存在                           |
| VS-01 browser strict selector failed | 页面增加 Earnings / Wallet status 后，无名 `getByRole('status')` 不再唯一                                              | Creator、Public Offering、Customer Result、Operations 和 Earnings 动态状态使用唯一 `data-testid`；测试不依赖排版顺序     |
| VS-02A full-suite selector failed    | 共享测试状态中存在多个 Confirmed Request 和 Offering 卡片                                                              | 先限定具名“已确认请求”区域，再按本次唯一 Offering 标题定位卡片；未使用 `.nth()`、`.last()`、sleep 或 timeout 放大        |
| Audit observed one Vitest timeout    | 单次 Creator Identity API 测试超过默认 5 秒；定向复跑及后续全量无法复现                                                | 确认 Vitest 已使用单 worker 串行；所有 Fastify server 均关闭；增加 `afterEach` 保底清理异常路径，未提高 timeout、未 skip |

### 15.3 Current Verification Results

| Check                     | Result             | Evidence / Conditional Reason                                                                                                                                           |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test` run 1         | PASS               | 40 files passed / 2 files skipped；171 tests passed / 8 skipped                                                                                                         |
| `pnpm test` run 2         | PASS               | 连续第二次 40 files passed / 2 files skipped；171 tests passed / 8 skipped                                                                                              |
| Vitest skipped tests      | CONDITIONAL        | PostgreSQL integration 在普通全量命令中因未提供 `DATABASE_URL` 跳过；Hosted Supabase tests 因未启用真实 Provider 环境跳过。PostgreSQL 能力由当前源码部署演练独立验证    |
| `pnpm build`              | PASS               | TypeScript production build passed                                                                                                                                      |
| `pnpm db:check`           | PASS               | Migration 0000–0008 contract check passed                                                                                                                               |
| `pnpm check:openapi`      | PASS               | Current OpenAPI compatibility manifest passed                                                                                                                           |
| `pnpm web:typecheck`      | PASS               | Web TypeScript check passed                                                                                                                                             |
| `pnpm format:check`       | PASS               | All governed files use Prettier style                                                                                                                                   |
| `pnpm lint`               | PASS               | ESLint passed                                                                                                                                                           |
| `git diff --check`        | PASS               | No whitespace errors                                                                                                                                                    |
| `pnpm test:acceptance`    | PASS               | AT-001–AT-013 entry points: 13 passed                                                                                                                                   |
| Full Playwright           | PASS / CONDITIONAL | System Edge: 19 passed / 2 skipped                                                                                                                                      |
| Playwright skipped tests  | CONDITIONAL        | CR-02 real Supabase browser tests require `RUN_REAL_CR02_BROWSER_TESTS=1` plus controlled Database and Supabase credentials; no credentials were introduced by EXEC-002 |
| VS-01 focused Playwright  | PASS               | `vs01.spec.ts`: 1 passed                                                                                                                                                |
| VS-02A focused Playwright | PASS               | `zz-vs02a-confirmed-request-to-earnings.spec.ts`: 1 passed; controlled facts only, no real money                                                                        |
| `pnpm preflight`          | PASS               | Engineering governance、format、lint、typecheck、Vitest、build、OpenAPI、generated Web client、Web production build 与 full Playwright 全部完成                         |

### 15.4 Current Source Deployment Evidence

2026-08-16 从当前 EXEC-002 source tree（base commit `a90a928`）重新构建，不复用旧 `m9`
镜像：

| Artifact | Image                                   | Image ID                                                           |
| -------- | --------------------------------------- | ------------------------------------------------------------------ |
| API      | `personal-commerce-api:exec002-a90a928` | `b116d8074835a934bc14815cd7e05f1980646b6b2b362b572e2b1ed50b0a8658` |
| Web      | `personal-commerce-web:exec002-a90a928` | `131d5fc7b21144ec7f0757e303e00ee290c2126cf0640c2ae413b033fa3b1c5b` |

`scripts/operations/test-production-deployment.ps1` 使用以上新镜像完成：

- PostgreSQL 17 readiness；
- 9 个 Migration；
- API Health；
- API dependency Readiness；
- OpenAPI Smoke；
- Web Smoke；
- PostgreSQL Backup；
- Restore 到独立验证数据库；
- 恢复库 Migration 记录验证；
- 当前 API 镜像 Rollback Smoke；
- 临时容器清理。

结果：`Production deployment drill passed: migrations=9`。临时 backup 仅用于本次 restore
验证，证据记录后删除，不作为真实商业数据或长期备份。

### 15.5 Completion and External Boundary

```text
EXEC-002 — Verification Baseline Restored
Current Verification Baseline = RESTORED
```

- VS-01 Regression 已冻结为 `VS-01 Semantics Remain Stable`；
- VS-01-only negative gates 已更正；
- Browser selector regression 已修复；
- Full Vitest、Full Playwright、VS-01 focused、VS-02A focused 与 Preflight 进入当前门禁；
- 当前源码镜像已重建并通过 Migration、Smoke、Backup、Restore 与 Rollback；
- 未接入微信支付或支付宝；
- 未创建 Live Webhook、Production Payment Secret 或真实 KYC；
- 未修改 Order、Payment、Settlement、Ledger、Wallet 或 Withdrawal 业务语义；
- 未启动 VS-02D；
- **No Real Money Evidence**。

Remaining External Blocker：微信支付候选仍为 `CONDITIONAL`。只有
`35A_Provider_Qualification_Dossier.md` 与 `39_VS02D_Controlled_Real_Money_Integration.md`
要求的 Provider 书面资格、账户模型、费用与责任、官方 Test、Webhook / 签名、Pilot 准入及
独立 Go / No-Go 全部完成后，才允许重新评估 VS-02D。

## 16. VS-02D-READY-001 — Controlled Real-Money Activation Readiness

> **Status**：READY
> **Deviation**：DEV-011
> **Evidence Date**：2026-08-16
> **Real Money Activation**：MANUAL FOUNDER GO REQUIRED
> **Provider Qualification**：External Parallel Track

### 16.1 Implemented Engineering Boundary

- `RUNTIME_ENV` 明确区分 `local`、`test`、`controlled`、`production`；
- `REAL_MONEY_ENABLED` 默认 `false`，只允许 `controlled` / `production`、完整 Live Provider
  配置和 Founder Activation Reference 的组合进入 Live Provider boundary；
- Creator、Customer 和 Web 没有激活入口；启动配置只记录非敏感状态，不记录 Secret；
- `GuardedLiveProviderAdapter` 在调用 Provider 前阻止 Live Payment / Settlement / Withdrawal，
  不 fallback 到 Reference Provider、Sandbox 或 Controlled Transport；
- Provider webhook endpoint 已建立 raw payload、Signature Verification Port、Receipt、
  Normalization、Verified Provider Fact、Application Policy 与 Money Domain 管线；
- 未配置 Provider-specific verifier / normalizer 时安全返回拒绝，不猜微信支付或支付宝算法；
- Migration `0009_vs02d_activation_readiness.sql` 持久化 payload SHA-256 receipt 和非敏感
  Verified Provider Fact receipt，覆盖进程重启后的 retry、idempotent、stale 与 conflict；
- `FirstRealTransactionEvidence` 只定义审计证据字段，不新增核心业务对象，不保存卡号、CVV、
  Provider Secret、API Credential、Webhook Secret 或敏感 KYC；
- `39A_VS02D_Controlled_Real_Money_Activation_Readiness.md` 冻结 Founder Checklist、First Real
  Transaction Runbook 和手工 Kill Switch 流程。

### 16.2 Safety Test Evidence

| Requirement                                    | Result | Evidence                                                                               |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Kill switch off rejects Live Payment           | PASS   | `real-money-activation-guard.test.ts`、`live-provider-adapter.test.ts`                 |
| Creator / Customer cannot enable Live          | PASS   | Runtime control authority has no client route and rejects non-Operations Actor Context |
| Customer cannot forge Payment Success          | PASS   | Existing `paid-commerce-use-cases.test.ts` authorization regression                    |
| Unsigned Provider Event rejected               | PASS   | Application and API runtime webhook tests return signature rejection                   |
| Duplicate Provider Event idempotent            | PASS   | In-memory and PostgreSQL receipt tests                                                 |
| Conflicting Provider Event rejected            | PASS   | Payload hash and Verified Fact conflict tests                                          |
| No Settlement Fact means no Available Earnings | PASS   | Wallet remains `available=0` after Payment and Fulfillment only                        |
| No Withdrawal Fact means no Withdrawn          | PASS   | Withdrawal Intent remains `withdrawalInProgress`; `withdrawn=0`                        |
| Kill switch blocks new verified Live Fact      | PASS   | Webhook runtime stops before Application Policy                                        |
| Existing Ledger cannot be overwritten          | PASS   | Append-only ledger and Wallet projection regressions remain green                      |

### 16.3 Final Verification Results

| Check                          | Result             | Evidence / Conditional Reason                                                                                                                                                                         |
| ------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                    | PASS / CONDITIONAL | 44 files passed / 2 skipped；190 tests passed / 10 skipped                                                                                                                                            |
| Vitest skipped tests           | CONDITIONAL        | PostgreSQL integration requires `DATABASE_URL` in ordinary full test; Hosted Supabase tests require controlled external credentials. PostgreSQL receipt tests passed separately against PostgreSQL 17 |
| `pnpm build`                   | PASS               | TypeScript production build passed                                                                                                                                                                    |
| `pnpm db:check`                | PASS               | Migration 0000–0009 contract passed                                                                                                                                                                   |
| `pnpm check:openapi`           | PASS               | Provider webhook operation added without replacing VS-01 or VS-02 operations                                                                                                                          |
| `pnpm web:typecheck`           | PASS               | Generated client and Web TypeScript passed                                                                                                                                                            |
| `pnpm format:check`            | PASS               | Governed code files use Prettier style                                                                                                                                                                |
| `pnpm lint`                    | PASS               | ESLint passed                                                                                                                                                                                         |
| `git diff --check`             | PASS               | No whitespace errors                                                                                                                                                                                  |
| `pnpm test:acceptance`         | PASS               | AT-001–AT-013: 13 passed                                                                                                                                                                              |
| Full Playwright                | PASS / CONDITIONAL | System Edge: 19 passed / 2 skipped                                                                                                                                                                    |
| Playwright skipped tests       | CONDITIONAL        | CR-02 real Supabase browser tests require `RUN_REAL_CR02_BROWSER_TESTS=1` plus controlled Database and Supabase credentials; VS-02D-READY-001 introduced none                                         |
| VS-01 focused                  | PASS               | `vs01.spec.ts`: 1 passed                                                                                                                                                                              |
| VS-02A focused                 | PASS               | Controlled earnings regression: 1 passed; no real money                                                                                                                                               |
| VS-02B Provider contract       | PASS               | 3 passed                                                                                                                                                                                              |
| VS-02C WeChat adapter contract | PASS               | 4 passed; local controlled transport only                                                                                                                                                             |
| `pnpm preflight`               | PASS               | Governance、format、lint、typecheck、Vitest、build、OpenAPI、Web build 与 full Playwright completed                                                                                                   |

### 16.4 PostgreSQL and Deployment Evidence

隔离 PostgreSQL 17 验证完成：

- Migration `0009` 实际执行；
- Provider webhook receipt 在新 store instance 中保持 retry / idempotent / conflict；
- Verified Provider Fact receipt 在新 guard instance 中保持 idempotent / stale / conflict；
- 临时数据库容器在验证后清理。

最终源码镜像：

| Artifact | Image                                       | Image ID                                                           |
| -------- | ------------------------------------------- | ------------------------------------------------------------------ |
| API      | `personal-commerce-api:vs02d-ready-a90a928` | `71b82bccc41de5ae66433480131afaa9786bc74bc5451d22ebd65c2186773de1` |
| Web      | `personal-commerce-web:vs02d-ready-a90a928` | `e2e3537456f01cffd47e1f2ae4d0dc40127cd6f1d97a86ea298d01d81523987c` |

`scripts/operations/test-production-deployment.ps1` 使用最终镜像并显式设置
`RUNTIME_ENV=production`、`REAL_MONEY_ENABLED=false`，完成：

- PostgreSQL readiness；
- 10 个 Migration；
- API Health；
- API dependency Readiness；
- OpenAPI Smoke；
- Web Smoke；
- PostgreSQL Backup；
- Restore 到独立验证数据库；
- 恢复库 Migration 记录验证；
- 当前 API 镜像 Rollback Smoke；
- Graceful Shutdown；
- 临时容器、网络与本次临时 backup 清理。

结果：`Production deployment drill passed: migrations=10`。

### 16.5 Modified File Groups

- Runtime / configuration：`.env.example`、`apps/prototype/src/configuration/bootstrap.ts`、
  `apps/api/src/main.ts`；
- Application boundary：`real-money-activation-guard.ts`、`live-provider-adapter.ts`、
  `provider-webhook-runtime.ts`、`real-money-evidence.ts`；
- HTTP / composition：`provider-webhook-routes.ts`、API server、in-memory/PostgreSQL composition；
- Persistence：Provider webhook/fact receipt adapters、paid-commerce schema、Migration `0009`；
- Contract / deployment：OpenAPI compatibility manifest、generated Web client、production compose and drill；
- Tests：activation guard、Live adapter、webhook runtime、evidence、Money safety、API、configuration、
  PostgreSQL integration；
- Governance：`39A`、configuration/secrets、README、docs index and this Execution SSOT；
- EXEC-002 files remain part of the same uncommitted working tree and were not reverted.

### 16.6 Remaining External Blockers

- Primary Provider 尚未由 Founder 选定；
- `35A` 的 Business Model、Money Flow、Operational Eligibility 尚未全部 Confirmed；
- Provider account、Creator account mapping、Platform Fee、Settlement path 与 refund/dispute
  responsibility 尚未批准；
- 没有 Live credentials、Provider-specific signature verifier、Live webhook verification 或真实账户；
- Founder Activation Checklist 保持未勾选；
- `REAL_MONEY_ENABLED` 保持 `false`；
- `39_VS02D_Controlled_Real_Money_Integration.md` 的真实交易 Go / No-Go 仍未通过。

```text
VS-02D Engineering Readiness = READY
Real Money Activation = MANUAL FOUNDER GO REQUIRED
Provider Qualification = External Parallel Track
No Real Money Evidence
```

## 17. VS-02E — Local Commercial Simulation

> **Status**：COMPLETE
> **Deviation**：DEV-012
> **Evidence Date**：2026-08-16
> **Classification**：Simulation Only — No Real Money Evidence

### 17.1 Implemented Boundary

- `40_VS02E_Local_Commercial_Simulation.md` freezes Simulation Fact identity:
  `origin=simulation` and `providerId=local_commerce_simulator`;
- `LocalCommerceSimulator` implements the unchanged Provider Port. Payment supports `success`,
  `failed`, `delayed`, `expired`, `duplicate_event` and `out_of_order_event`; Settlement supports
  `immediate`, `delayed`, `failed`, `duplicate` and `conflicting_terminal_event`; Withdrawal supports
  `success`, `failed`, `delayed` and `duplicate`; Refund supports `before_settlement`,
  `after_settlement` and `failed_refund`;
- the Application Simulation Service creates Provider operations, verifies generated Provider Facts
  through the same Provider Port, then invokes the existing Provider Fact Application Policy. It does
  not write Money Domain objects, Ledger Entries or Wallet balances directly;
- `SimulationFeeProfile` is explicitly `classification=simulation_configuration`; gross, simulated
  Provider fee, platform fee, adjustment / reserve and Creator Net reconcile through the frozen
  Settlement calculation;
- `RefundSucceeded` now invokes the frozen minimum refund / reversal path. Before Settlement it
  creates no available earnings; after a released Settlement it appends a compensating
  `settlement_reversed` Ledger Entry. Wallet remains a Ledger projection;
- `0010_vs02e_provider_fact_history.sql` replaces the single-resource Provider Fact unique index with
  a sequence index. The receipt guard accepts only the frozen increasing-sequence
  `PaymentSucceeded → RefundSucceeded` evolution; duplicate, stale, reused-event and conflicting
  terminal facts remain rejected;
- Operations-only `/api/v1/operations/simulation/*` routes are registered only when a Local
  Simulation Service is explicitly present. External / production composition does not fall back to
  the in-memory Simulator. The production Web build receives `NEXT_PUBLIC_RUNTIME_ENV=production`
  and does not render Simulator controls.

### 17.2 Simulation Evidence and Safety

| Requirement                                           | Result | Evidence                                                                                                                            |
| ----------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Simulation fact distinguished from real Provider fact | PASS   | `local-commerce-simulation-port.ts`, `40` sections 1–2, `simulation:` evidence references                                           |
| Provider Port unchanged                               | PASS   | `LocalCommerceSimulator implements ProviderPort`; Provider contract regression remains green                                        |
| Payment success / failure / delay / expiry            | PASS   | Simulator and HTTP integration tests                                                                                                |
| Duplicate / out-of-order / conflict handling          | PASS   | Simulator, receipt-guard and HTTP delayed-settlement regression                                                                     |
| Settlement immediate / delayed / failure              | PASS   | Integration tests; failure produces no fabricated Settlement success Fact                                                           |
| Withdrawal success / failure / delay / duplicate      | PASS   | Simulator and end-to-end Wallet / Withdrawal Browser acceptance                                                                     |
| Refund before / after Settlement / failure            | PASS   | Integration tests verify zero pre-settlement earnings, post-settlement compensating reversal, and no success Fact for failed refund |
| Wallet is Ledger projection only                      | PASS   | Existing Money Domain projection plus simulation earnings / reversal regressions                                                    |
| Simulation data excluded from real-money activation   | PASS   | `simulation:` evidence source, `REAL_MONEY_ENABLED=false`, no Live Provider fallback                                                |
| Production exposes no Simulator API or UI             | PASS   | external-composition route returns 404; production Web image check confirms absent control                                          |

### 17.3 End-to-End Evidence

- HTTP integration runs `Request → Confirm → Order → Checkout/Payment Pending → Local Simulator
Payment → Fulfillment → Local Simulator Settlement → Earnings Ledger → Wallet → Withdrawal Intent
→ Local Simulator Withdrawal`;
- Browser acceptance `zz-vs02e-local-commercial-simulation.spec.ts` drives the Operations Simulator
  UI through HTTP, checks its simulation-only notice, completes Payment, Settlement and Withdrawal,
  and verifies the Wallet delta without a test-order dependency;
- The same Browser acceptance also passed through `pnpm test:vs02e:postgres-browser` against a
  temporary PostgreSQL 17 container with all 12 migrations and the explicit
  `USE_POSTGRES_TEST_COMPOSITION=1` harness. This is PostgreSQL Simulation evidence, not real-money
  evidence;
- the prior VS-02E production-like image drill applied the then-current 11 migrations and passed
  Health, Readiness, OpenAPI / Web Smoke, Backup, Restore and Rollback. DEC-013 source now passes all
  12 migrations and complete Preflight, but this lifecycle-hardening task did not rebuild deployment
  images. The prior drill remains historical deployment evidence, not current-image evidence.

### 17.4 Final Verification Results

| Check                                                  | Result             | Evidence / Conditional Reason                                                                                                                   |
| ------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                            | PASS / CONDITIONAL | 45 files passed / 2 skipped; 205 tests passed / 10 conditional skipped                                                                          |
| Vitest skipped tests                                   | CONDITIONAL        | PostgreSQL integration requires externally supplied `DATABASE_URL`; Hosted Supabase tests require controlled external credentials               |
| `pnpm test:acceptance`                                 | PASS               | 13 passed                                                                                                                                       |
| Full Playwright                                        | PASS / CONDITIONAL | 20 passed / 2 controlled Auth / Supabase tests skipped                                                                                          |
| `pnpm test:vs02e:postgres-browser`                     | PASS               | Temporary PostgreSQL 17, 12 migrations, VS-02E Browser flow: 1 passed                                                                           |
| VS-01 focused Playwright                               | PASS               | `vs01.spec.ts` passed in the full System Edge run                                                                                               |
| VS-02A focused Playwright                              | PASS               | `zz-vs02a-confirmed-request-to-earnings.spec.ts` passed                                                                                         |
| VS-02E focused Playwright                              | PASS               | `zz-vs02e-local-commercial-simulation.spec.ts` passed                                                                                           |
| `pnpm build`                                           | PASS               | TypeScript production build passed                                                                                                              |
| `pnpm db:check`                                        | PASS               | Migration chain 0000–0011 passed                                                                                                                |
| `pnpm check:openapi`                                   | PASS               | VS-02E Operations contract recorded in compatibility manifest                                                                                   |
| `pnpm web:typecheck` / `pnpm build:web`                | PASS               | generated Contract Client and Next production build passed                                                                                      |
| `pnpm format:check` / `pnpm lint` / `git diff --check` | PASS               | passed in final preflight                                                                                                                       |
| `pnpm preflight`                                       | PASS               | governance, typecheck, 205-pass Vitest, Web build and 20-pass browser harness passed                                                            |
| Deployment image drill                                 | HISTORICAL         | Prior VS-02E API image `ee4ab0452044…` and Web image `983107bfa548…` passed 11 migrations and deployment smoke; DEC-013 images were not rebuilt |

### 17.5 External Boundaries

- No real Customer Payment, Order, Settlement, Creator Earnings, Withdrawal or Refund occurred;
- no WeChat Pay, Alipay, Stripe, PayPal, real credential, KYC, card, account mapping or Live Webhook
  was introduced;
- Provider Qualification remains `CONDITIONAL` and is an external parallel track;
- VS-02D remains `Engineering Readiness READY / Manual Founder GO Required`; VS-02E does not
  authorize real-money activation.

```text
VS-02E — Local Commercial Simulation = COMPLETE
Simulation Only
No Real Money Evidence
```

## 18. VS-02F — Local Paid Commerce Productization

### 18.1 Implemented Product Boundary

- Customer confirmed Request result now exposes Local Checkout with immutable Offering snapshot,
  Creator, Gross Amount, Currency, Order state and Payment state;
- local/test/controlled Customer can run Success, Failed, Delayed, Expired, Duplicate and
  Out-of-order Payment scenarios; failed/expired retry reuses the same Order and Payment;
- Creator Order Workspace exposes Customer, Order, Payment, Fulfillment, Settlement, Earnings,
  simulation fee trace, Wallet Projection, Recovery Obligation and Withdrawal state;
- Creator fulfillment continues through the existing Creator-authorized Application Use Case;
- Settlement, Refund and Withdrawal product actions verify Creator ownership, then invoke the
  Local Simulator using an internal Operations context that is never exposed to the Web client;
- every money transition still follows Simulator → Verified Provider Fact → Application Policy →
  Money Domain → Repository / PostgreSQL → Ledger Projection → Web;
- production composition creates neither `LocalCommerceSimulationService` nor
  `LocalPaidCommerceProductService`, so product simulation routes are absent from production
  OpenAPI and runtime.

### 18.2 Engineering Defects Closed

1. Withdrawal retry previously changed `failed → requested` without reserving Available Earnings
   again. A later success Fact could therefore make `withdrawalInProgress` negative. Retry now
   appends a new `withdrawal_reserved` Ledger Entry for the same immutable Withdrawal after checking
   current Available Earnings; no second Withdrawal is created.
2. Refund / reversal projection previously used aggregate Pending Earnings before Available, which
   allowed one Order's Refund to consume another Order's Pending Earnings. Pending projection is now
   tracked by `orderId`, so a Refund only reverses its originating Order Pending fact and otherwise
   creates Recovery Obligation according to DEC-013-B.

### 18.3 Focused Browser Acceptance

| Acceptance                                                     | Result | Evidence                                                       |
| -------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| AT-VS02F-01 Confirmed Request → Checkout → Payment Success     | PASS   | Customer Web → HTTP → Simulator → Provider Fact → paid Order   |
| AT-VS02F-02 Payment Failed → Retry → Success                   | PASS   | Same Order / Payment reused; no duplicate Order                |
| AT-VS02F-03 Settlement Delayed → Pending → Success → Available | PASS   | Pending Earnings then one Ledger release                       |
| AT-VS02F-04 Fulfillment → Completed                            | PASS   | Existing fulfillment use case; completed after Settlement      |
| AT-VS02F-05 Creator Earnings → Wallet                          | PASS   | CNY 399 fee trace and Ledger Projection visible                |
| AT-VS02F-06 Wallet → Withdrawal Success                        | PASS   | Withdrawal Fact completes reserved amount                      |
| AT-VS02F-07 Withdrawal Failed → Retry                          | PASS   | Funds restored, re-reserved, then completed once               |
| AT-VS02F-08 Settlement Failure → Pending Resolution            | PASS   | Available unchanged; Creator sees failed / pending resolution  |
| AT-VS02F-09 Refund after Settlement → Recovery Outstanding     | PASS   | Append-only refund debit; non-negative Wallet                  |
| AT-VS02F-10 Subsequent Earnings reduce Recovery                | PASS   | Recovery deducted before later Available Earnings              |
| AT-VS02F-11 Duplicate Simulation Event                         | PASS   | accepted + idempotent receipt handling                         |
| AT-VS02F-12 Out-of-order Simulation Event                      | PASS   | accepted newer fact + stale older fact; final state consistent |

Focused command:

```text
pnpm build
pnpm playwright test tests/acceptance/browser/zz-vs02f-local-paid-commerce-productization.spec.ts
```

Result: `12 passed`.

### 18.4 Final Verification Results

| Verification                       | Current Result     | Evidence                                                                                             |
| ---------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `pnpm test`                        | PASS               | 45 files passed / 2 conditional files skipped; 209 tests passed / 10 conditional skipped             |
| `pnpm build`                       | PASS               | Current-source TypeScript production build                                                           |
| `pnpm db:check`                    | PASS               | Migration chain 0000–0011                                                                            |
| `pnpm check:openapi`               | PASS               | VS-01 routes preserved; VS-02F operations recorded in compatibility manifest                         |
| `pnpm web:typecheck` / build       | PASS               | Generated OpenAPI client, product surfaces and Next production build                                 |
| `pnpm format:check`                | PASS               | All governed files use repository Prettier style                                                     |
| `pnpm lint`                        | PASS               | ESLint passed                                                                                        |
| `git diff --check`                 | PASS               | No whitespace errors                                                                                 |
| `pnpm test:acceptance`             | PASS               | 13 Application Acceptance tests                                                                      |
| Full Playwright                    | PASS / CONDITIONAL | 32 passed; 2 real Supabase Auth CR-02 tests skipped because live Auth credentials are not configured |
| VS-02F focused Playwright          | PASS               | AT-VS02F-01 through AT-VS02F-12: 12 passed                                                           |
| `pnpm test:vs02e:postgres-browser` | PASS               | PostgreSQL 17, migrations 0000–0011 and VS-02E Browser flow passed                                   |
| `pnpm preflight`                   | PASS               | Governance, formatting, lint, typecheck, 209-pass Vitest, builds and 32-pass Playwright harness      |
| Current-HEAD deployment drill      | PASS               | Rebuild, migration, health, readiness, OpenAPI/Web smoke, backup, restore and rollback smoke passed  |

Deployment evidence:

- command: `pnpm test:deployment`;
- deployment smoke: PASS;
- backup artifact: `output/backups/m9-9ae6cadc.sql`;
- restore target: `personal_commerce_restore`;
- post-restore smoke: PASS;
- rollback smoke: PASS;
- production composition exposes neither Local Simulation Operations routes nor VS-02F product
  simulation routes.

### 18.5 External Boundaries

- `origin = simulation` and `provider = local_commerce_simulator` remain explicit;
- Simulation Evidence is excluded from Real GMV, Real Revenue, First Completed Paid Commerce,
  Creator real revenue and Provider Qualification evidence;
- `REAL_MONEY_ENABLED=false` remains the runtime default;
- no WeChat Pay, Alipay, Stripe, PayPal, real secret, real Checkout, Live Webhook, KYC, real Payment,
  real Settlement, real Creator Earnings or real Withdrawal was introduced.

```text
VS-02F — Local Paid Commerce Productization = COMPLETE
Simulation Only
No Real Money Evidence
```

## 19. VS-02G — Official Provider Sandbox Integration

> **Change Unit**: `DEV-015`
> **Status**: Conditional — Adapter Boundary Complete / Official Sandbox External Blocked
> **Evidence Date**: 2026-08-17

### 19.1 Provider Selection and External Finding

- WeChat Pay remains the `CONDITIONAL` Primary Provider Candidate; Sandbox integration does not
  constitute Provider Qualification approval.
- Official WeChat Pay product documentation was reviewed for the platform collection-and-
  disbursement, sub-merchant, payment, refund, account-fund and withdrawal candidate capabilities.
- The current repository and reviewed official evidence contain no Provider-issued official
  Sandbox endpoint, test account, test credentials, webhook test channel or signature-test
  material that can be used for an auditable integration.
- Required result: `SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY`. No official Provider event or
  transaction was fabricated.

### 19.2 Boundary Implementation

- Added an explicit WeChat Pay Official Sandbox configuration and capability boundary.
- Added `UnavailableWeChatPayOfficialSandboxTransport`, which satisfies the existing adapter-side
  Transport contract but rejects every operation without fallback.
- Added the stable external-dependency error
  `wechat_pay_official_sandbox_unavailable` / `SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY`.
- Added environment identity to the WeChat test Transport contract:
  `controlled_test_transport` and `official_sandbox`.
- Changed controlled Transport references from `wechat-pay-sandbox:*` to
  `wechat-pay-controlled-test:*`, preventing local contract evidence from being mislabeled as
  official Sandbox evidence.
- Provider-neutral Payment / Settlement / Withdrawal Ports and the Money Domain were not changed.

### 19.3 Capability Result

| Capability                          | Result                | Evidence                                               |
| ----------------------------------- | --------------------- | ------------------------------------------------------ |
| Official Sandbox Payment            | CONDITIONAL / BLOCKED | No official endpoint, account or credential            |
| Official Sandbox Webhook            | CONDITIONAL / BLOCKED | No official test callback/signature material           |
| Official Sandbox Settlement         | UNAVAILABLE           | Local Simulator remains the only non-real verification |
| Official Sandbox Withdrawal         | UNAVAILABLE           | Local Simulator remains the only non-real verification |
| Official Sandbox Refund             | UNAVAILABLE           | Capability gap recorded; DEC-013-B unchanged           |
| No fallback to controlled Transport | PASS                  | Official unavailable Transport contract tests          |
| Local Simulator separation          | PASS                  | distinct Provider/environment/evidence identities      |
| Live Provider separation            | PASS                  | `REAL_MONEY_ENABLED=false`; no production credentials  |

### 19.4 Verification Evidence

| Check                                                  | Result | Evidence                                                                     |
| ------------------------------------------------------ | ------ | ---------------------------------------------------------------------------- |
| WeChat adapter + official Sandbox boundary contracts   | PASS   | 2 files, 7 tests                                                             |
| Full Vitest                                            | PASS   | 46 files passed, 2 conditional files skipped; 212 passed, 10 skipped         |
| Full Playwright                                        | PASS   | 32 passed, 2 controlled Supabase Auth tests skipped                          |
| VS-02F Withdrawal retry stability                      | PASS   | AT-VS02F-07 passed twice consecutively after semantic UI synchronization     |
| Build / OpenAPI / Web typecheck / Web production build | PASS   | included in `pnpm preflight`                                                 |
| Format / Lint / Typecheck                              | PASS   | included in `pnpm preflight`                                                 |
| Preflight                                              | PASS   | full governance, Vitest and browser regression                               |
| `git diff --check`                                     | PASS   | no whitespace errors                                                         |
| Production-like deployment                             | PASS   | migration, health/readiness, OpenAPI/Web smoke, backup, restore and rollback |

The deployment drill produced `output/backups/m9-21c886fb.sql` and restored into
`personal_commerce_restore`. It used the current source tree and introduced no Provider credential
or real-money operation.

During the first full Preflight run, AT-VS02F-07 exposed an existing browser-test synchronization
gap: the helper waited for Settlement command completion but not the resulting Settlement and
Earnings workspace projection before reading the Wallet baseline. The acceptance helper now waits
for the semantic `released` and `available` states. No Money Domain, Ledger, Wallet or Withdrawal
behavior changed.

### 19.5 External Blocker

`DEV-015` cannot close as an official integration until WeChat Pay supplies an official Test or
Sandbox environment for the approved account/business path, including endpoint, account,
credentials and webhook/signature evidence. This dependency does not authorize production access,
Provider qualification, Live activation or real money.

```text
VS-02G Engineering Boundary = COMPLETE
VS-02G Official Sandbox Integration = CONDITIONAL
SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY
Provider Qualification = CONDITIONAL
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

## 20. VS-02H — Commercial Pilot Operations Readiness

> **Change Unit**: `DEV-016`
> **Status**: Completed — Verified
> **Decision Date**: 2026-08-17
> **Scope**: Minimum protected Operations capability for a future 5–10 Creator pilot
> **Commercial Status**: Simulation Only / No Real Money Evidence
> **Provider Qualification**: External Parallel Track

### 20.1 Implemented Operations Boundary

The current source tree now provides a protected `pilot_operations` Operations Workspace for the
existing Paid Commerce lifecycle. The Workspace reads Order, immutable Offering Snapshot, Payment,
Settlement, Order Earnings, Creator Wallet Projection, Withdrawal, Ledger, Canonical Events and
Provider Fact observations through the existing Application and Repository boundaries.

The implementation deliberately separates:

- Order Earnings Projection, which explains the current Order's Pending / Available / Restricted /
  Recovery state;
- Creator Wallet Projection, which is Creator-global and includes Pending, Available, Restricted,
  Recovery Outstanding, Withdrawal in progress and Withdrawn.

This separation fixes the Operations-only engineering defect where a Withdrawal accumulated from
multiple Orders could be projected as if it belonged entirely to one Order. No Money Domain,
Provider-neutral Port, Ledger mutation rule or Wallet projection rule changed.

### 20.2 Reconciliation and Action Governance

The Workspace reports `missing_fact`, `duplicate_fact`, `conflicting_fact`, `pending_resolution`
and `recovery_outstanding`. Provider Fact observations retain accepted, idempotent, stale and
conflicting decisions without creating duplicate Money facts.

Operations actions are limited to controlled Settlement / Withdrawal Retry through existing
Application Use Cases and verified Local Simulation Facts, plus audit-only Reconciliation, Manual
Resolution and Recovery Resolution records. Manual Resolution cannot mark Payment, Settlement or
Withdrawal successful; it records only an operator decision. Direct `wallet.balance = x` and
direct `ledger.balance = x` paths are not present.

Evidence export is a non-sensitive `commercial_evidence_summary`; it excludes credentials, secrets,
tokens, complete bank/card information, Withdrawal destination references and idempotency keys.
Current evidence is always `realCommerceEvidence = false` and simulation facts are labeled
`origin = simulation`, `providerId = local_commerce_simulator`.

### 20.3 Persistence and Contract Evidence

- HTTP routes and OpenAPI operations:
  `adapters/transport/http/commercial-pilot-operations-routes.ts` and
  `contracts/api/v1/commercial-pilot-operations-contracts.ts`;
- Operations Action Audit and Provider Fact Observation persistence:
  migration `0012_v02h_operations_audit.sql`;
- protected Web Reference Client:
  `apps/web/src/components/commercial-pilot-operations-workspace.tsx`;
- governance contract:
  `docs/09_Engineering_Governance/44_VS02H_Commercial_Pilot_Operations_Readiness.md`;
- Browser acceptance:
  `tests/acceptance/browser/zz-vs02h-commercial-pilot-operations.spec.ts`;
- API regression coverage:
  `tests/integration/paid-commerce-api.test.ts`.

### 20.4 Acceptance Evidence

| Acceptance                                              | Result | Evidence                                                                         |
| ------------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| OPS-01 complete Order → Payment → Settlement → Earnings | PASS   | Operations Browser acceptance                                                    |
| OPS-02 Settlement Failed → Pending Resolution           | PASS   | Operations Browser acceptance; Available remains zero for Order Earnings         |
| OPS-03 controlled Settlement Retry, one Ledger credit   | PASS   | Operations Browser acceptance and evidence export                                |
| OPS-04 post-Settlement Refund → Recovery Outstanding    | PASS   | Operations Browser acceptance                                                    |
| OPS-05 failed Withdrawal → safe Retry                   | PASS   | Operations Browser acceptance; cross-Order Wallet projection regression fixed    |
| OPS-06 duplicate Provider Event                         | PASS   | Provider observation and Operations Browser acceptance                           |
| OPS-07 unknown source cannot be marked successful       | PASS   | Manual Resolution leaves Payment pending                                         |
| OPS-08 Simulation Evidence isolation                    | PASS   | `origin=simulation`, Local Simulator Provider, `realCommerceEvidence=false`      |
| Operations authorization boundary                       | PASS   | API integration: unauthenticated / Creator rejected, `pilot_operations` accepted |
| Manual Resolution fact boundary                         | PASS   | API integration: audit recorded, commercial state unchanged                      |
| Evidence redaction                                      | PASS   | API integration: destination reference and idempotency key absent                |

### 20.5 Verification Results

| Check                              | Result | Evidence                                                                                                 |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `pnpm test`                        | PASS   | 46 files passed, 2 conditional files skipped; 215 passed, 10 skipped                                     |
| `pnpm test:acceptance`             | PASS   | 13 passed                                                                                                |
| Full Playwright                    | PASS   | 40 passed, 2 controlled Auth tests skipped because external Supabase Auth credentials are not configured |
| VS-02H focused Playwright          | PASS   | OPS-01–OPS-08: 8 passed                                                                                  |
| VS-02F / VS-02E browser regression | PASS   | VS-02F 12 flows passed; VS-02E passed in full Playwright                                                 |
| VS-01 browser regression           | PASS   | VS-01 / AT-001 through AT-010 passed in full Playwright                                                  |
| `pnpm build`                       | PASS   | Current-source TypeScript build                                                                          |
| `pnpm db:check`                    | PASS   | Migrations 0000–0012 verified                                                                            |
| `pnpm check:openapi`               | PASS   | Compatibility manifest synchronized and passed                                                           |
| `pnpm web:typecheck`               | PASS   | Generated API client and Web typecheck passed                                                            |
| `pnpm format:check`                | PASS   | Repository formatting passed                                                                             |
| `pnpm lint`                        | PASS   | ESLint passed                                                                                            |
| `git diff --check`                 | PASS   | No whitespace errors                                                                                     |
| `pnpm preflight`                   | PASS   | Governance, validation, build and browser gates passed                                                   |

### 20.6 Current-HEAD Deployment Evidence

The API and Web images were rebuilt from the current working source with identifiers
`personal-commerce-api:vs02h` and `personal-commerce-web:vs02h` using Podman. The Web image was
built with the production build arguments `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:45200` and
`NEXT_PUBLIC_RUNTIME_ENV=production`.

The production-like drill passed:

- PostgreSQL 17 startup and migration application through migration 0012;
- API Health and Readiness;
- OpenAPI and Web deployment smoke;
- PostgreSQL backup to `output/backups/m9-b1d94a3f.sql`;
- restore into `personal_commerce_restore` with migration verification;
- graceful shutdown and rollback smoke using the same current-HEAD API image.

No Provider credential, Sandbox Provider, real payment, real withdrawal, KYC or real money fact was
introduced. `REAL_MONEY_ENABLED=false` remains in the deployment environment.

### 20.7 Final State and External Boundary

```text
VS-02H — Commercial Pilot Operations Readiness = COMPLETE
Simulation Only / No Real Money Evidence
Provider Qualification = External Parallel Track
Official Sandbox = CONDITIONAL / UNAVAILABLE
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

VS-02H is complete. The project stops at Commercial Pilot Operations Readiness and does not enter
Live Provider activation or real-money commerce.

## 21. VS-02I — First Commerce Pilot Preparation

> **Change Unit**: `DEV-017`
> **Status**: Completed — Verified
> **Decision Date**: 2026-08-17
> **Preparation State**: Founder Activation Ready
> **Real Commerce State**: Not Declared
> **Commercial Launch**: Not Declared
> **Provider Qualification**: External Parallel Track

### 21.1 Pilot Package

VS-02I freezes one and only one first-transaction template:

```text
1 Creator
1 Service Offering
1 Customer
1 Provider
1 Currency: CNY
1 Founder-confirmed fixed Price
1 Request Commerce transaction
```

The frozen flow is:

```text
Request → Confirm → Order → Payment → Fulfillment → Settlement → Earnings → Wallet → Withdrawal
```

Event, Experience, Ticket, Merchandise, Marketplace, Subscription, CRM, multi-currency and
Financial Product scope remain prohibited.

Business Configuration is centralized as configurable policy input. It includes Service Price,
Platform Fee, Currency, Cancellation, Refund, Fulfillment, Settlement, Withdrawal and Recovery
rules. Provider Fee remains an external verified fact and is never fabricated as production data.

### 21.2 Founder Activation and Scope Guard

The preparation policy evaluates a Founder checklist without exposing an activation API or changing
runtime configuration. The current safe state is:

```text
FOUNDER_GO = FALSE
REAL_MONEY_ENABLED = false
Kill Switch = active
Provider Qualification = External Parallel Track
```

Live activation remains governed by the existing `RealMoneyActivationGuard`, `39A` and the separate
Founder-approved runtime control. If Provider readiness is absent, Live Pilot activation is rejected.
Codex does not and cannot automatically set Founder GO.

### 21.3 Evidence and Runbook

The fixed First Commerce Evidence Package contains Pilot ID, Creator, Customer, Offering, Order,
Payment / Provider / Settlement references, Gross, Provider Fee, Platform Fee, Creator Net, Ledger
Entries, Wallet Projection, Withdrawal, Fulfillment Evidence, Audit Trail and timestamps. Provider
references remain empty until a real verified Provider fact exists. Simulation references cannot be
copied into future real evidence.

Runbook v2 covers Preflight, Creator, Offering, Provider, Pricing, Order, Payment, Provider Fact,
Settlement, Earnings Ledger, Wallet, Fulfillment, Completion, Withdrawal, Evidence Capture and final
Kill Switch verification. Every step has Actor, Expected Result, Failure Condition, Evidence and Stop
Condition. Hard Stops include amount mismatch, missing or invalid Provider Facts, fee mismatch,
Ledger / Wallet inconsistency, invalid Webhook signature, duplicate credit, state contradiction,
Provider restriction and unexplained Refund / Recovery.

### 21.4 Acceptance Evidence

| Acceptance                                                          | Result | Evidence                                                                      |
| ------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| PILOT-01 First Commerce Configuration Valid                         | PASS   | `first-commerce-pilot-preparation.test.ts`                                    |
| PILOT-02 Founder Activation Guard OFF                               | PASS   | explicit `FOUNDER_GO=false`, kill switch remains active                       |
| PILOT-03 Provider not Ready rejects activation                      | PASS   | Provider readiness boundary test                                              |
| PILOT-04 Creator / Offering / Currency / Price                      | PASS   | frozen template validation                                                    |
| PILOT-05 Platform Fee boundary                                      | PASS   | fee must be below configured Service Price                                    |
| PILOT-06 Evidence Package completeness and isolation                | PASS   | empty simulation Provider references accepted; fabricated references rejected |
| PILOT-07 Kill Switch state                                          | PASS   | `REAL_MONEY_ENABLED=false`                                                    |
| PILOT-08 Simulation cannot complete Real Commerce                   | PASS   | simulation origin rejected for First Completed Paid Commerce                  |
| PILOT-09 Order / Payment / Settlement / Ledger / Wallet consistency | PASS   | preparation fact gate                                                         |
| PILOT-10 Withdrawal Completion Evidence                             | PASS   | missing evidence blocks readiness                                             |

### 21.5 Verification Results

| Check                              | Result | Evidence                                                                                                    |
| ---------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Focused VS-02I tests               | PASS   | 10 passed                                                                                                   |
| `pnpm test`                        | PASS   | 47 files passed, 2 conditional files skipped; 225 passed, 10 skipped                                        |
| `pnpm preflight`                   | PASS   | Governance, typecheck, build, OpenAPI, Web build and full browser regression passed                         |
| VS-02H / VS-02F / VS-01 regression | PASS   | Full Playwright: 40 passed, 2 controlled Supabase Auth tests skipped                                        |
| Deployment checks                  | PASS   | Current `vs02i` API/Web images; migrations=13, Health/Readiness, Smoke, Backup, Restore and Rollback passed |

### 21.6 Final Boundary

```text
VS-02I — First Commerce Pilot Preparation = COMPLETE
Founder Activation Ready
Real Commerce Ready = NOT DECLARED
Commercial Launch = NOT DECLARED
REAL_MONEY_ENABLED = false
No Real Money Evidence
Provider Qualification = External Parallel Track
```

This change unit ends at preparation. It does not activate Live Provider, create real money facts,
or enter the first real transaction.

## 22. VS-02J — Founder Real-Money Activation Review

> **Change Unit**: `DEV-018`
> **Status**: Controller Review
> **Decision Date**: 2026-08-17
> **Code Change**: None
> **Current Recommendation**: `NO-GO`
> **Final Controller Decision**: Unselected — Founder / Controller must choose

### 22.1 Consolidated Current State

The review package consolidates only existing evidence:

- VS-02A Product / Money foundation complete;
- VS-02B Provider-neutral integration boundary complete;
- VS-02C Provider Adapter Conditional, not Qualified;
- VS-02E Local Commercial Simulation and Lifecycle Hardening complete;
- VS-02F Local Paid Commerce Productization complete;
- VS-02G Engineering Boundary complete, Official Sandbox Conditional / Unavailable;
- VS-02H Commercial Pilot Operations Readiness complete;
- VS-02I First Commerce Pilot Preparation complete, Founder Activation Ready.

The following remain unverified or incomplete:

- Provider Qualification;
- official Sandbox / Live Provider endpoint and account evidence;
- production credentials and account mapping;
- real Payment, Settlement and Withdrawal;
- real Provider Webhook evidence;
- First Completed Paid Commerce;
- Commercial Launch.

### 22.2 Decision Package Evidence

| Package                            | Result   | Evidence                                                                              |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| Founder Activation Matrix          | COMPLETE | `46_VS02J_Founder_Real_Money_Activation_Review.md` Section 3                          |
| GO / CONDITIONAL GO / NO-GO states | COMPLETE | Section 4; Founder choice remains unselected                                          |
| Hard Stop Conditions               | COMPLETE | Section 5; no balance editing bypass                                                  |
| Fixed First Transaction Case       | COMPLETE | Section 6; one Creator, Offering, Customer, Provider, CNY, Price and Request Commerce |
| Activation Runbook                 | COMPLETE | Section 7; each step has GO / STOP criteria                                           |
| Provider External Constraint       | COMPLETE | Section 8; Conditional is not Qualified                                               |
| Current recommendation             | COMPLETE | `RECOMMENDATION = NO-GO` because Live execution prerequisites are unverified          |

### 22.3 Verification Boundary

This change unit is documentation-only. Existing regression evidence remains the source of truth:

- `pnpm test`: 47 files passed, 225 passed, 10 skipped;
- `pnpm preflight`: PASS;
- Full Playwright: 40 passed, 2 controlled Supabase Auth tests skipped;
- current `vs02i` deployment drill: migrations=13, Health/Readiness, Smoke, Backup, Restore and
  Rollback passed.

No application code, API Contract, Product Object, Provider Adapter, Money Domain, runtime flag,
credential or deployment secret changed for DEV-018. `REAL_MONEY_ENABLED=false` remains in force.

### 22.4 Final State

```text
VS-02J — Founder Real-Money Activation Review = READY FOR FOUNDER DECISION
RECOMMENDATION = NO-GO
Controller Recommendation = GO / CONDITIONAL GO / NO-GO (unselected)
Real Money Activation = Not Yet Executable
Product Development = Not Blocked
REAL_MONEY_ENABLED = false
No Real Money Evidence
Provider Qualification = External Constraint / Parallel Track
```

This review stops here. Codex does not activate real money or select the Controller decision.

## 23. VS-02K — Real Creator Pilot / Non-Money

> **Change Unit**: `DEV-019`
> **Status**: In Progress — External Execution Required
> **Decision Date**: 2026-08-17
> **Scope**: Real Creator / real Customer non-money product usage
> **Commercial Launch**: Not Declared
> **First Completed Paid Commerce**: Not Declared
> **REAL_MONEY_ENABLED**: `false`

### 23.1 Preparation Completed

The governance contract `47_VS02K_Real_Creator_Pilot_Non_Money.md` defines:

- one to three independent real Creator accounts;
- Creator-authored Commerce Identity, Capability and Service Offering;
- controlled HTTPS Public URL and Creator-owned external distribution;
- real Customer Request and Creator Confirm / Decline;
- Customer Result evidence;
- strict separation of Real Product Usage Evidence from Simulation Money Evidence;
- non-money Operations boundary;
- isolated controlled database/project requirement;
- PILOT-K01–K12 acceptance matrix.

### 23.2 Current Evidence Classification

| Evidence                                  | Result    | Current fact                                                                                       |
| ----------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| Technical Creator authentication harness  | AVAILABLE | Existing Supabase browser tests require external credentials and are controlled/skipped by default |
| Local / test Creator flows                | AVAILABLE | Existing System Edge and fixture-backed VS-01 regressions                                          |
| Real Creator account                      | PENDING   | No real Creator account evidence supplied in this session                                          |
| Controlled Public URL / HTTPS             | PENDING   | Repository deployment drill uses local mapped ports; no Pilot URL supplied                         |
| Creator-owned distribution                | PENDING   | No external channel evidence supplied                                                              |
| Real Customer Request                     | PENDING   | No real Customer evidence supplied; fixtures are not accepted                                      |
| Creator Confirm / Decline by real Creator | PENDING   | No real-user session evidence supplied                                                             |
| Customer Result from real Request         | PENDING   | No real-user evidence supplied                                                                     |
| Simulation Money separation               | PASS      | Existing VS-02E/F evidence; `origin=simulation` remains separate                                   |
| Real Money Evidence                       | NONE      | `REAL_MONEY_ENABLED=false`; no Payment / Settlement / Withdrawal executed                          |

### 23.3 Data Governance Finding

The current schema does not provide a repository-wide explicit `test / simulation / pilot` dataset
discriminator for all VS-01 objects. This is recorded as a governance risk under `DEV-019`; no
temporary cleanup script or silent schema change was introduced.

Until a Controller-approved isolation decision exists, a Real Creator Pilot must use a dedicated
controlled database/project that is not shared with automated test cleanup. Real Pilot evidence must
carry a Pilot ID and remain auditable independently from fixture-backed regression data.

### 23.4 Exit Status

PILOT-K01–K10 and PILOT-K12 remain `PENDING — EXTERNAL EXECUTION REQUIRED`. They cannot be closed by:

- `test-*` tokens;
- fixture data;
- in-memory composition;
- local simulation;
- direct database writes;
- Founder or Codex impersonating a Creator or Customer.

Therefore the repository state is not honestly `VS-02K = COMPLETE` in this session. The current
state is:

```text
VS-02K — Real Creator Pilot / Non-Money = EXECUTION PREPARATION
Real Creator Pilot Ready = TECHNICAL PACKAGE READY / EXTERNAL EXECUTION REQUIRED
Commercial Launch = Not Declared
First Completed Paid Commerce = Not Declared
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

## 24. VS-02K-EXT-READY — Controlled External Pilot Environment

> **Change Unit**: `DEV-020`
> **Status**: Blocked — External Deployment Gap
> **Decision Date**: 2026-08-17
> **Target**: Controlled External Pilot Ready
> **Current State**: Not Yet Executable in Current Environment
> **REAL_MONEY_ENABLED**: `false`
> **Commercial Launch**: Not Declared

### 24.1 Scope

This change unit prepares a controlled external environment for real Creator and Customer use of
VS-01 / VS-02K only. It does not add product capability, API Contract, Provider integration, Money
behavior or a new Commerce Pattern. The permitted path is:

```text
Commerce Identity → Capability → Offering → Publish → Share → Public URL
→ Customer Request → Creator Confirm / Decline → Customer Result
```

Payment, Settlement and Withdrawal remain Simulation Only or Not Executed, and `REAL_MONEY_ENABLED`
remains `false`.

### 24.2 Current Evidence

| Requirement                                      | Result  | Evidence / gap                                                                                 |
| ------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------- |
| Controlled deployment                            | BLOCKED | Existing Compose deployment is local mapped-port configuration, not a provisioned public Pilot |
| HTTPS public URL                                 | BLOCKED | No domain, DNS or TLS certificate evidence supplied                                            |
| Independent Pilot database                       | BLOCKED | No dedicated Pilot PostgreSQL evidence supplied; Test cleanup must not touch Pilot data        |
| Independent Auth                                 | BLOCKED | Supabase Auth harness exists, but no dedicated Pilot project/credentials supplied              |
| Independent environment/secrets/logs             | BLOCKED | No external Pilot environment evidence supplied                                                |
| Real Creator sign-up/login/session               | PENDING | No real Creator account or session evidence supplied                                           |
| Creator-authored Identity/Offering/Publish/Share | PENDING | No real Creator-authored evidence supplied                                                     |
| Real Customer Request/Result                     | PENDING | No real Customer evidence supplied; fixtures are not accepted                                  |
| Creator A/B and Customer isolation               | PENDING | Must be proven against the dedicated Pilot data store                                          |
| No Real Money Path                               | PASS    | `REAL_MONEY_ENABLED=false`; no Live Provider Secret/Webhook or real money evidence             |
| Simulation isolation                             | PASS    | Existing VS-02E/F evidence labels simulation facts separately                                  |

### 24.3 External Deployment Gap

The minimum external dependency set is:

1. controlled deployment target with stable HTTPS domain and TLS termination;
2. dedicated Pilot PostgreSQL database, backup ownership and isolated logs;
3. dedicated Supabase Auth project/tenant and separate environment variables;
4. deployment access and monitoring/audit retention;
5. real Creator and Customer coordination;
6. Creator-owned distribution evidence.

These dependencies cannot be satisfied by local ports, test tokens, fixture identities, shared
accounts, direct database writes or local simulation. No repository code was changed to bypass them.

### 24.4 Acceptance Status

`EXT-K01`–`EXT-K10` and the external portions of `EXT-K12` remain `PENDING — EXTERNAL EXECUTION
REQUIRED`. `EXT-K11` No Real Money Path and the existing Simulation isolation regression are available
from repository evidence, but they do not make the external environment ready.

The repository therefore must not declare `VS-02K — Controlled External Pilot Ready`, `Real Creator
Pilot Complete`, `First Completed Paid Commerce` or `Commercial Launch`.

### 24.5 Final State

```text
VS-02K-EXT-READY = NOT YET EXECUTABLE IN CURRENT ENVIRONMENT
External Deployment Gap = OPEN
Real Creator Pilot = External Execution Required
REAL_MONEY_ENABLED = false
No Real Money Evidence
Commercial Launch = Not Declared
```

## 25. VS-02K-EXT-02 — External Pilot Deployment Package

> **Change Unit**: `DEV-021`
> **Status**: Engineering Package In Progress
> **Decision Date**: 2026-08-17
> **Target State**: External Pilot Deployment Package = READY
> **Deployment State**: Not Deployed
> **REAL_MONEY_ENABLED**: `false`

### 25.1 Package Contents

The package adds:

- `49_VS02K_EXT02_External_Pilot_Deployment_Package.md`;
- `deploy/external-pilot.env.example`;
- `deploy/compose.external-pilot.yml`;
- `scripts/operations/pilot-preflight.ps1`;
- `scripts/operations/deploy-external-pilot.ps1`;
- `scripts/operations/backup-restore-external-pilot.ps1`;
- `pnpm pilot-preflight`;
- `pnpm deploy:external-pilot`.

It reuses the existing Docker/Podman Compose, migration and deployment smoke conventions. It does
not add Commerce functionality, Provider integration, real-money behavior or a second deployment
system.

### 25.2 Safety Contract

The External Pilot package requires:

```text
RUNTIME_ENV=controlled
APP_ENV=production
REAL_MONEY_ENABLED=false
Live Provider values empty
HTTPS public Web/API URLs
Dedicated Pilot Database/Auth
```

Missing required variables, loopback/HTTP public URLs, a Development/Test database marker, or any
Live Provider value causes `pilot-preflight` to output `BLOCKED` and exit non-zero. It never falls
back to Development or Test configuration and never prints secret values.

### 25.3 Acceptance Package

| Acceptance                             | Current status     | Required external evidence               |
| -------------------------------------- | ------------------ | ---------------------------------------- |
| EXT2-01 Environment variables complete | READY TO RUN       | Protected manifest and preflight output  |
| EXT2-02 Pilot DB isolated              | EXTERNAL INPUT     | Dedicated database and connection review |
| EXT2-03 Pilot Auth isolated            | EXTERNAL INPUT     | Dedicated Auth project/tenant            |
| EXT2-04 HTTPS configured               | EXTERNAL INPUT     | DNS/TLS and public URL smoke             |
| EXT2-05 Real Money disabled            | READY TO RUN       | `REAL_MONEY_ENABLED=false`               |
| EXT2-06 No Live Provider secrets       | READY TO RUN       | Preflight/secret review                  |
| EXT2-07 Health / Readiness             | READY TO RUN       | Deployment smoke                         |
| EXT2-08 Auth flow                      | EXTERNAL EXECUTION | Real Creator Auth evidence               |
| EXT2-09 Public Offering                | EXTERNAL EXECUTION | Creator-authored public Offering         |
| EXT2-10 Request Flow                   | EXTERNAL EXECUTION | Real Customer Request and Result         |
| EXT2-11 Creator ownership isolation    | EXTERNAL EXECUTION | Cross-Creator authorization proof        |
| EXT2-12 Backup / Restore               | READY TO RUN       | Backup, restore and verification output  |

### 25.4 Current State

The package is prepared but has not provisioned an external deployment. No real domain, DNS/TLS
configuration, Pilot database, Pilot Auth project, Creator account or Customer account was created
or supplied in this task. Localhost or production-like local deployment evidence cannot close
EXT2-02, EXT2-03, EXT2-04 or EXT2-08–EXT2-11.

```text
VS-02K-EXT-02 — External Pilot Deployment Package = READY
External Pilot Deployed = NO
REAL_MONEY_ENABLED = false
No Real Money Evidence
No Live Provider
```

This task stops at the deployment package and does not deploy or execute the Pilot.

## 26. VERTICAL-MAP-001 — Creator Commerce Vertical Expansion Analysis

> **Change Unit**: `DEV-022`
> **Status**: Completed — Founder Decision Required
> **Decision Date**: 2026-08-17
> **Scope**: Product strategy and architecture research only
> **Code / Domain / Contract Change**: None

### 26.1 Evidence Base

The research distinguishes current implementation facts from architecture candidates:

- current deep slice: Dancer Private Lesson → Request Commerce → Paid Service;
- current implemented Pattern: Request Commerce only;
- architecture candidates: Reservation, Ticket, Contract and Instant Commerce;
- existing market hypotheses: Dancer, Cosplayer and Photographer;
- existing guardrail: Event, Ticket, Experience, Performance, Content, Merchandise, Membership and
  a second vertical are not silently included in the current VS-02 Product contract.

Sources:

- `04_Creator_Commerce_Taxonomy.md`;
- `05_Creator_Vertical_Taxonomy.md`;
- `07_Creator_Commerce_Opportunity_Matrix.md`;
- `09_MVP_Product_Definition.md`;
- `34_Commerce_Pattern_Settlement_and_Wallet_Model.md`;
- `35_VS02_Paid_Service_PRD.md`;
- `50_Creator_Commerce_Vertical_Expansion_Strategy.md`.

### 26.2 Result

The new strategy document evaluates twelve scenario-level candidates using Demand, Commerce Diversity,
Product Reuse, Strategic Fit, GTM/Pilot Feasibility, Architecture Leverage and Verticalization Risk.
It intentionally treats Calendar as a pattern-specific availability/distribution projection, not a
new universal Commerce Object or the next product itself.

Recommended decision sequence:

1. Cosplayer Convention Appearance Request — Identity and Anime/Convention/Touring distribution test
   using the existing Request pattern;
2. Photographer Session Reservation — first candidate to approve and build a Reservation pattern;
3. Dance Troupe / Independent Singer Commercial Appearance Contract — later candidate to approve and
   build a Contract pattern.

Ticketing, broad touring operations, merchandise, digital-content delivery, membership and Marketplace
remain Deferred.

### 26.3 Boundary and Next Decision

This research did not modify business code, Product Objects, Money Domain, Order/Settlement/Wallet
semantics, Provider Adapter or API Contract. It does not authorize a Calendar product, Event Ticketing
or any real-money path.

```text
VERTICAL-MAP-001 = COMPLETE
Founder Decision Required = Select first Vertical Slice and approve its DEV-### scope
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

This task stops at strategy. No Vertical Build starts automatically.

## 27. VS-02L01 — Cosplayer Convention Appearance Request

> **Change Unit**: `DEV-023`
> **Status**: Completed — Cross-Vertical Reuse Verified
> **Decision Date**: 2026-08-17
> **Pattern**: Existing Request Commerce
> **Real Money**: Not authorized

### 27.1 Implementation Decision

`51_VS02L01_Cosplayer_Convention_Appearance_Request.md` freezes VS-02L01 as a Cross-Vertical
Reuse Slice. The implementation reuses the existing `Offering` with optional `appearance` metadata:

- appearance type;
- date/date range;
- location/venue description;
- intended requester type;
- optional price/pricing-rule text;
- Request CTA;
- Upcoming projection title and optional external distribution link.

No `CosplayerOffering`, `CosplayerOrder`, `CosplayerPayment`, `ConventionSettlement`,
`ConventionCalendar`, requester account type, Ticketing, Reservation, Contract or new Money behavior
was introduced.

### 27.2 Architecture Reuse Audit

| Core capability  | Reused | Modified                       | New vertical logic                                       | Result |
| ---------------- | ------ | ------------------------------ | -------------------------------------------------------- | ------ |
| Creator Identity | Yes    | No                             | Public Appearance copy/projection only                   | PASS   |
| Offering         | Yes    | Optional `appearance` metadata | Appearance presentation fields                           | PASS   |
| Availability     | Yes    | No                             | Date/location shown as non-inventory Upcoming projection | PASS   |
| Request          | Yes    | No                             | None                                                     | PASS   |
| Order            | Yes    | No                             | Existing confirmed-request Order path                    | PASS   |
| Payment          | Yes    | No                             | Existing Local Simulator in acceptance only              | PASS   |
| Settlement       | Yes    | No                             | Existing settlement/ledger path                          | PASS   |
| Earnings Ledger  | Yes    | No                             | None                                                     | PASS   |
| Wallet           | Yes    | No                             | Existing ledger projection                               | PASS   |
| Withdrawal       | Yes    | No                             | None                                                     | PASS   |
| Operations       | Yes    | No                             | Existing workspace and evidence chain                    | PASS   |

### 27.3 COS Acceptance Evidence

`zz-vs02l01-cosplayer-convention-appearance.spec.ts` passes:

| Acceptance | Evidence                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| COS-01     | Creator Desk creates an Appearance Offering using the existing Offering route                                   |
| COS-02     | Existing publish behavior creates the existing public URL                                                       |
| COS-03     | Public Offering page renders non-transactional Upcoming projection                                              |
| COS-04     | Public page renders Appearance Offering and its Request CTA                                                     |
| COS-05     | Requester submits through existing public Request route                                                         |
| COS-06     | Creator confirms through existing Request Commerce state machine                                                |
| COS-07     | Creator declines through existing Request Commerce state machine                                                |
| COS-08     | Confirmed Request creates existing Paid Order and reuses Local Simulator Payment/Fulfillment/Settlement         |
| COS-09     | Existing Creator Earnings and Operations surfaces expose resulting Order facts; no vertical ledger exists       |
| COS-10     | Unpublish blocks a new public Request while the prior Request remains confirmable and its result remains stable |

### 27.4 Core Gap / Product Decision

No Core Architecture Gap or Product Ambiguity was encountered in this slice. The only new
vertical-specific logic is optional Appearance presentation metadata. It is not part of the Request
Commerce state machine, Order, Payment, Settlement, Ledger, Wallet, Withdrawal or Operations model.

```text
VERTICAL-02L-01 — Cosplayer Convention Appearance Request = COMPLETE
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

### 27.5 Final Verification

| Check                          | Result | Evidence                                                                                                                         |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Domain + API focused tests     | PASS   | 18 tests: Appearance metadata normalization/removal and public API projection                                                    |
| COS focused browser acceptance | PASS   | 3 browser paths cover COS-01–COS-10                                                                                              |
| `pnpm db:check`                | PASS   | Migration journal includes `0013_vs02l01_appearance_offering.sql`                                                                |
| `pnpm preflight`               | PASS   | 228 Vitest passed; 43 Playwright passed; 2 controlled real-Auth tests skipped because Pilot credentials are intentionally absent |
| Current-HEAD image rebuild     | PASS   | API and Web `personal-commerce-*:m9` rebuilt from this worktree                                                                  |
| Production-like deployment     | PASS   | Migration, health/readiness, OpenAPI/Web smoke, backup, restore and rollback smoke                                               |
| Restore migration verification | PASS   | 14 Drizzle migration records after restore; backup `output/backups/m9-db56c159.sql`                                              |
| `git diff --check`             | PASS   | No whitespace errors                                                                                                             |

The initial manual Web image build omitted its required `NEXT_PUBLIC_API_BASE_URL` build argument and
was rejected during static build. Rebuilding with the same public API build argument used by the
deployment contract succeeded; no product code or runtime fallback was introduced.

### 27.6 Final Controller Handoff

**Architecture Reuse Audit:** complete; all core capabilities reused.
**Any Core Gap / Product Decision:** none discovered.
**Scope guard:** no Calendar Object, Convention Platform, Ticketing, Reservation, Contract Commerce,
Marketplace, CRM, Provider or Money-model change was introduced.

```text
VERTICAL-02L-01 — Cosplayer Convention Appearance Request = COMPLETE
DEV-023 = Closed
REAL_MONEY_ENABLED = false
No Real Money Evidence
Photographer Reservation = Not Started
Contract Commerce = Not Started
```

This task stops here.

## 29. VERTICAL-02L-02 — Photographer Session Reservation Build

> **Status**: Complete — Founder Approved / Implementation Applied
> **Change Unit**: `DEV-024` — Closed
> **Pattern**: Reservation Commerce
> **Scope**: One-time CNY portrait/photo session; Local Simulator only; no real money

### 29.1 Frozen Build Decisions

The approved lifecycle is:

```text
Available → Held → Confirmed → Order → Payment → Fulfillment → Settlement
```

Only a Confirmed Reservation creates one existing `PaidServiceOrder`. A Held Reservation never
creates an Order. Payment is one-time full payment through the existing Local Simulator. Settlement
eligibility requires Payment Confirmed, Session Completed and no active Resolution. Deposit,
installment, subscription, multi-currency, multi-provider and real Provider paths remain disabled.

### 29.2 Delivered Change Unit

- Added generic Reservation Domain with `Held`, `Confirmed`, `Cancelled` and `Expired` states.
- Added generic capacity-one Availability Slot persistence and PostgreSQL advisory transaction locks.
- Added Hold TTL, expiry release, confirm idempotency, replay conflict and active-slot uniqueness.
- Added immutable Reservation Snapshot and reschedule history; reschedule retains the same Order.
- Added Reservation APIs for public slot discovery, Hold, result, cancellation, creator confirmation,
  cancellation, reschedule and no-show.
- Added Creator and Customer Reservation UX with explicit Hold expiry, Order, Payment and
  Local Simulation boundaries.
- Reused existing Order, Payment, Fulfillment, Settlement, Earnings Ledger, Wallet, Withdrawal
  and Operations capabilities without Photographer-specific Money objects.
- Registered only the five Reservation facts required by the approved event inventory:
  `reservation_held`, `reservation_confirmed`, `reservation_expired`, `reservation_cancelled`,
  `reservation_rescheduled`.

### 29.3 Architecture Reuse Audit

| Capability      | Reused | Changed                                  | New Pattern Logic                           |
| --------------- | ------ | ---------------------------------------- | ------------------------------------------- |
| Identity        | Yes    | No                                       | No                                          |
| Offering        | Yes    | No                                       | No                                          |
| Availability    | Yes    | Generic bounded Slot persistence         | Capacity-one allocation and expiry          |
| Reservation     | No     | New generic object                       | Hold, Confirm, Expire, Cancel, Reschedule   |
| Order           | Yes    | Generic Reservation source discriminator | No                                          |
| Payment         | Yes    | No                                       | No                                          |
| Fulfillment     | Yes    | No                                       | Session Completed through existing use case |
| Settlement      | Yes    | No                                       | No                                          |
| Earnings Ledger | Yes    | No                                       | No                                          |
| Wallet          | Yes    | No                                       | No                                          |
| Withdrawal      | Yes    | No                                       | No                                          |
| Operations      | Yes    | No                                       | No                                          |

### 29.4 Acceptance and Verification Evidence

| Verification                                     | Result            | Evidence                                                                                                        |
| ------------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Reservation Domain/Application/API focused tests | PASS              | 20 tests passed across four focused files                                                                       |
| Browser Reservation acceptance                   | PASS              | 2 dedicated browser paths; main path covers RES-01–RES-10, edge path covers RES-03/RES-06/RES-11–RES-15         |
| `pnpm test`                                      | PASS              | Existing full regression baseline remains green                                                                 |
| `pnpm db:check`                                  | PASS              | Migration `0014_vs02l02_reservation_commerce.sql` included and governance-checked                               |
| `pnpm check:openapi`                             | PASS              | Reservation routes remain Provider-neutral                                                                      |
| `pnpm preflight`                                 | PASS              | Typecheck, lint, formatting, tests, build, OpenAPI, Web checks and browser suite                                |
| PostgreSQL integration                           | ENVIRONMENT-GATED | Reservation migration and repository constraints are present; real PostgreSQL execution requires `DATABASE_URL` |
| Deployment verification                          | ENVIRONMENT-GATED | Local build/deployment checks are available; no external deployment is claimed                                  |
| Money boundary                                   | PASS              | `REAL_MONEY_ENABLED = false`; Local Simulator only; no live Provider or real funds                              |

`RES-16` is the existing VS-01 / Dancer / Cosplayer regression boundary and remains covered by
the repository's prior regression suites. No Core Architecture Gap or Product Decision was found.
Paid cancellation records a Reservation fact and leaves Refund / Recovery to the existing approved
fact pipeline; it does not mutate Wallet or Ledger directly.

### 29.5 Final Controller Handoff

```text
VERTICAL-02L-02 — Photographer Session Reservation = COMPLETE
DEV-024 = Closed
REAL_MONEY_ENABLED = false
No Real Money Evidence
Contract Commerce = Not Started
```

This task stops here. It does not enter Contract Commerce.

## 30. VERTICAL-02L-03 — Commercial Appearance Contract

> **Status**: Complete
> **Decision Reference**: `DEV-025` — Founder / Controller approved
> **Change Unit**: `DEV-026` — Closed
> **Pattern**: Contract Commerce — Quote then Accept
> **Scope**: Dance Troupe / Independent Singer commercial appearance engagement

### 30.1 Applied Contract Flow

The approved generic Contract flow is implemented without a vertical-specific Order, Payment,
Settlement, Ledger or Wallet:

```text
Buyer Request
→ Creator Quote / immutable Scope Version
→ Buyer Accept
→ Contracted
→ exactly one existing Order
→ Local Simulation Payment
→ Performance Completed
→ existing Settlement eligibility
→ Earnings Ledger → Wallet → Withdrawal
```

`Contracted` is persisted before the initial Order is created within the same Unit of Work.
Duplicate acceptance and retry return the existing Contract / Order and do not create a second
Order. An inconsistent Contracted Contract with no Order is a controlled consistency error, not an
opportunity to create an untracked replacement Order.

### 30.2 Reuse Audit and Boundaries

| Capability                                         | Result                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Identity / Offering / Request                      | Reused                                                                                 |
| Order / Payment / Fulfillment / Settlement         | Reused                                                                                 |
| Earnings Ledger / Wallet / Withdrawal / Operations | Reused                                                                                 |
| Contract-specific logic                            | Quote, append-only Scope Version, acceptance fact, proposal expiry, Contract lifecycle |
| Money Domain                                       | No Contract-specific branch                                                            |

The generic `Contract` links Creator, Buyer, Offering, Request origin, immutable Scope Version,
acceptance fact, Contracted timestamp and one initial Order. It exposes provider-neutral proposal,
read, accept, reject, expire, cancel, scope and related-Order APIs and the matching Creator / Buyer
reference-client workspace.

Scope guard remains active: no CRM, Deal Pipeline, Sales Funnel, Agency, Artist Roster, Touring,
Venue CRM, Ticketing, Marketplace, Reservation expansion, deposits, milestones, multi-currency,
multi-provider or real money was introduced.

### 30.3 Evidence and Closure

Implemented evidence includes Contract domain lifecycle tests, application / API runtime regression,
PostgreSQL migration contract verification, OpenAPI compatibility and reference-client type
generation. Existing Dancer Request Commerce, Cosplayer Request Commerce and Photographer
Reservation Commerce remain on their original generic flows.

```text
VERTICAL-02L-03 — Commercial Appearance Contract = COMPLETE
DEV-025 = Approved — Decision Closed
DEV-026 = Closed
REAL_MONEY_ENABLED = false
No Real Money Evidence
Contract Commerce = Complete
Fourth Vertical = Not Started
```

This change unit stops here. It does not authorize a fourth Vertical or real-money activation.

## 31. INFRA-CONV-001 — Commerce Infrastructure Convergence Review

> **Status**: Ready for Controller Review
> **Scope**: Request Commerce / Reservation Commerce / Contract Commerce convergence assessment
> **Business Code Change**: None
> **Real Money**: `REAL_MONEY_ENABLED = false`

`54_Commerce_Infrastructure_Convergence_Review.md` consolidates the three implemented Commerce
Patterns and confirms their common path:

```text
Request / Reservation / Contract
→ existing Order
→ Payment
→ Fulfillment
→ Settlement
→ Earnings Ledger
→ Wallet
→ Withdrawal
```

The review records no Pattern-specific Payment, Settlement, Ledger, Wallet, Withdrawal, Provider or
Operations branch. Request, Reservation and Contract retain only their own commitment lifecycle;
the commercial and earnings lifecycles stay generic and independently owned.

The documented conclusion is:

```text
Infrastructure Convergence = READY
Further Vertical Expansion = Deferred
No additional Vertical Build until Real Creator Pilot / First Real Commerce evidence.
```

This is not real-money readiness. Controlled external Pilot execution, real Creator usage, Provider
qualification, live credentials and real Payment / Settlement / Withdrawal evidence remain
uncompleted external constraints.

```text
INFRA-CONV-001 = READY FOR CONTROLLER REVIEW
REAL_MONEY_ENABLED = false
No Real Money Evidence
Commercial Launch = Not Declared
```

## 32. PHASE5-001 — Real Creator Pilot Execution Readiness

> **Status**: Controller Approved — Execution Preparation
> **Scope**: Founder-organized real Creator / real Customer non-money Pilot
> **Business Code Change**: None
> **Real Money**: `REAL_MONEY_ENABLED = false`

`55_Phase5_Real_Creator_Pilot_Execution.md` converts the accepted infrastructure baseline into an
external execution package. It reuses the VS-02K-EXT-02 Pilot deployment contract and fixes the
Phase 5 cohort, data boundary, Creator onboarding checklist, Creator-owned distribution boundary,
support protocol, manual observation log and Pattern-specific evidence register.

The allowed paths are limited to:

```text
Dancer / Cosplayer → Request Commerce
Photographer → Reservation Commerce
Dance Troupe / Independent Singer → Contract Commerce
```

All actual external acceptance evidence remains `PENDING` until Founder organizes a controlled HTTPS
Pilot environment, independent real Creator accounts, Creator-owned distribution and independent real
Customer activity. Local fixtures, test tokens, simulation and automated browser tests cannot close
`REAL-PILOT-01` through `REAL-PILOT-10`.

```text
PHASE5-001 — Real Creator Pilot Execution Ready
Real Creator Pilot Complete = Not Declared
REAL_MONEY_ENABLED = false
No Real Money Evidence
Commercial Launch = Not Declared
```

## 33. PHASE5-002 — External Pilot Activation Gate

> **Status**: Ready
> **Scope**: One-time Founder activation gate for the controlled external Pilot
> **Business Code Change**: Operational scripts and governance only
> **Real Money**: `REAL_MONEY_ENABLED = false`

`56_Phase5_External_Pilot_Activation_Gate.md` freezes the single server-side Pilot state machine,
machine-executable `pnpm pilot:activate:preflight`, Founder-only explicit activation, cohort
registry, session evidence structure, three-Pattern guard and evidence-preserving close procedure.

The gate reuses VS-02K-EXT-02 and never changes the Money Domain or real-money switch:

```text
UNPROVISIONED → PROVISIONED → PREFLIGHTED → DEPLOYED → PILOT_READY
→ FOUNDER_ACTIVATED → PILOT_RUNNING → PILOT_CLOSING → PILOT_CLOSED
```

Activation is not executed by Codex. No real Creator, Customer, Provider or real-money evidence is
created by this change unit.

```text
PHASE5-002 — External Pilot Activation Gate = READY
Pilot Activation = Not Executed
Real Creator Pilot = Not Yet Executed
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

## 34. CLIENT-001 — Web Commerce Pattern Convergence + App Boundary

> **Status**: Ready / Complete
> **Scope**: Pattern-first Web Client; future `apps/app` boundary only
> **Business Code Change**: Web surface composition only
> **Real Money**: `REAL_MONEY_ENABLED = false`

`57_Client_Surface_Strategy.md` records the Founder decision to continue Web convergence and defer
`apps/app`. The Web now exposes shared Pattern navigation, a unified Customer Commerce Action
concept, and existing Request / Reservation / Contract surfaces without merging their lifecycles.

The future App remains a boundary definition only:

```text
apps/app = Personal Commerce Companion
App Build = Deferred by Decision
```

No React Native, Flutter, Expo, App API, App-specific state, new Vertical, Commerce Pattern, Money
behavior or real-money path was introduced.

```text
CLIENT-001 — Web Commerce Pattern Convergence = READY / COMPLETE
apps/app = DEFERRED BY DECISION
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

## 35. CLIENT-002 — Commerce Golden Path Closure

> **Status**: Complete
> **Change Unit**: `CLIENT-002` — Closure audit and acceptance evidence
> **Scope**: Customer Commerce Action → Creator Execution → Completion → Earnings / Wallet Projection
> **Real Money**: `REAL_MONEY_ENABLED = false`

`58_CLIENT002_Commerce_Golden_Path_Closure.md` records the audited Web closure for the existing
Request, Reservation and Contract Patterns. Each path keeps its existing Pattern lifecycle and
converges only through the shared Order, Payment, Fulfillment, Settlement, Ledger and Wallet
infrastructure.

The acceptance suite exercises:

```text
Request: Customer Request → Creator Confirm → Order → Fulfillment → Settlement → Wallet
Reservation: Customer Hold → Creator Confirm → Session Completed → Settlement → Wallet
Contract: Buyer Request → Creator Quote → Buyer Accept → Performance Completed → Settlement → Wallet
```

The shared Creator Commerce Desk records completion through the authenticated Fulfillment use case;
the test suite also verifies a duplicate completion attempt is rejected without a second Wallet
credit. The Customer Action Router remains a route-selection boundary and does not own Pattern
business rules or Money logic.

```text
CLIENT-001 = COMPLETE
CLIENT-002 — Commerce Golden Path Closure = COMPLETE
apps/app = DEFERRED
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

## 36. PROJECT-SUSPEND-001 — Project Development Suspended

> **Status**: SUSPENDED — DEVELOPMENT PAUSED
> **Change Unit**: `PROJECT-SUSPEND-001`
> **Project Restart SSOT**: `docs/08_Execution/22_Project_Handoff.md`
> **Suspend Baseline**: `CLIENT-002 — Commerce Golden Path Closure = COMPLETE`
> **Reason**: Founder temporarily reallocating attention to other projects

The project is not cancelled. This is a clean, controlled suspension after the Web Pattern-first
Commerce Client and all three Commerce Golden Paths reached their current engineering baseline.
No new product capability is authorized at the Suspend Point.

```text
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
NEXT TASK = RESUME-001 — Identity & External Platform Binding Foundation
```

The handoff SSOT records the current product definition, completed CLIENT-001 / CLIENT-002 stages,
engineering evidence, stable architecture boundaries, explicit non-goals, anti-misstart rules and
the Resume Gate. Historical handoff documents remain historical evidence and do not supersede the
new Project Restart SSOT.

```text
PROJECT-SUSPEND-001 = COMPLETE
PROJECT STATUS = SUSPENDED
SUSPEND BASELINE = CLIENT-002 — Commerce Golden Path Closure
```

## 37. PROJECT-SUSPEND-002 — Identity Anchor / Commerce ID Handoff Integration

> **Status**: COMPLETE — Documentation / Architecture Direction Only
> **Project Status**: SUSPENDED — DEVELOPMENT PAUSED
> **Restart SSOT**: `docs/08_Execution/22_Project_Handoff.md`
> **Governance Record**: `docs/09_Engineering_Governance/59_Identity_Anchor_and_Commerce_ID.md`
> **Business Code Change**: None

The final suspension review identified a long-term architecture gap: PCI must provide a stable,
platform-neutral Commerce Identity Anchor for traffic originating on third-party content and
distribution platforms. Third-party platforms remain responsible for discovery and audience; PCI is
responsible for the commercial handoff.

```text
CLIENT-001 = COMPLETE
CLIENT-002 = COMPLETE
PROJECT STATUS = SUSPENDED

ARCHITECTURAL DISCOVERY:
Identity → Commerce Profile → Commerce ID → External Platform Account
             → Commerce Relationship → Commerce Objects

1 Identity : N Commerce Profiles
1 Commerce Profile : 1 stable Commerce ID
1 Commerce Profile : N External Platform Accounts
1 Platform : N External Platform Accounts per Commerce Profile
1 External Platform Account : 1 active verified owner / manager relationship by default

Commerce ID = C-XXXXXXXX
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```

No Identity API, Commerce ID generation, database migration, OAuth, platform binding, login, UI,
Payment, Money or Commerce Pattern implementation was added. The next restart direction now includes
multi-platform / multi-account binding, account ownership / management, primary / secondary roles
and shared-account conflict rules, but remains gated by the re-entry audit and explicit Founder
implementation authorization.

```text
NEXT RESUME TASK:
RESUME-001 — Identity & External Platform Binding Foundation

PROJECT-SUSPEND-002 = COMPLETE
PROJECT STATUS = SUSPENDED
```

## 39. PCI-RESEARCH-001 — 跨平台 Commerce Reference 研究

> **状态**：COMPLETE — Proposed Research / Product Design Only
> **日期**：2026-08-26
> **研究交付物**：`docs/01_Strategy/06_Commerce_Reference_Research.md`
> **业务代码变更**：None
> **实现授权**：None

Founder 要求对一个可脱离 HTTP URL、域名、平台命名空间和第三方平台 handle 独立传播的、
平台中立的公共 Commerce Reference 进行正式研究。本研究审计了历史未实现的
`C-XXXXXXXX` 方向是否满足跨平台/线下传播需求；在可获取范围内使用第一方资料审阅
TikTok、Bilibili、X、YouTube、Instagram 和 Facebook 的 identifier 边界；分析了
Decimal、Hexadecimal、human-oriented Base32、Base58、UUID-like 与 Snowflake-like
编码家族；并计算了 8–20 位长度在 1B、10B、100B 和 1T Profile 规模下的容量与
birthday-collision 结果。

```text
研究结论：
Historical C-XXXXXXXX format = REPLACE（运行时尚未实现；不需要迁移）
Recommended candidate = 18-character restricted uppercase Base32（仅研究建议）
Commerce Reference owner = Commerce Profile
Public Identifier ≠ Secret ≠ Credential ≠ Authentication Factor
Enumeration controls 仍属必需；随机空间不能替代滥用控制

IMPLEMENTATION CHANGES = NONE
STAGE_3 = NOT AUTHORIZED
PROJECT STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
```

该文件仅为 Founder 决策准备材料；不改变冻结的 Product Direction、任何 ADR、VS-01 合同、
产品行为、持久化、API、状态转换、Canonical Event、认证、授权或公开表面。

## 40. PCI-RESEARCH-002 — Commerce Reference 平台过滤兼容性研究

> **状态**：COMPLETE — Proposed Research / Product Design Only
> **日期**：2026-08-26
> **研究交付物**：`docs/01_Strategy/06_Commerce_Reference_Platform_Compatibility_Research.md`
> **业务代码变更**：None
> **实现授权**：None

Founder 已批准 18 位 uppercase human-oriented Base32、canonical uppercase alphanumeric、
URL-independent、Public、Immutable、Non-reusable 与默认 Non-transferable 方向，并新增 P0
要求：降低第三方分发平台对 Commerce Reference 的自动风控误判风险。本研究使用可获取的
TikTok、Bilibili、X、YouTube、Instagram 与 Facebook 官方政策/帮助资料，区分了
string-level filtering、context-level filtering、account reputation、behavior detection
与 link reputation，并记录了官方页面访问受限导致的 `UNKNOWN` / `EVIDENCE NOT ESTABLISHED`
边界。

研究结论：

```text
18-character uppercase restricted Base32 = 继续成立
固定语义 Prefix = 不建议
canonical punctuation = 继续禁止
大规模 semantic substring blacklist = 不建议
Check Digit = 不为平台过滤风险增加
平台安全呈现规范 = 必须作为 P0 候选要求
传播行为风险 > 单个随机字符串已证实的字符串级风险

Controlled Test Evidence = NONE
IMPLEMENTATION CHANGES = NONE
STAGE_3 = NOT AUTHORIZED
PROJECT STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
```

### 41.3 Validation Evidence

| Command                                                                                                                           | Result                                                                                      | Scope                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm vitest run modules/identity-infrastructure/identity-contract.test.ts`                                                       | Passed — 26 tests                                                                           | Internal Identity, Commerce Profile, ownership, cardinality, lifecycle and nominal ID isolation |
| `pnpm test:domain`                                                                                                                | Passed — 15 files, 85 tests                                                                 | Domain-module regression suite                                                                  |
| `pnpm exec eslint modules/identity-infrastructure/identity-contract.ts modules/identity-infrastructure/identity-contract.test.ts` | Passed                                                                                      | New pure-domain module and its tests                                                            |
| `pnpm lint`                                                                                                                       | Passed                                                                                      | Repository lint                                                                                 |
| `pnpm typecheck`                                                                                                                  | Passed                                                                                      | Workspace TypeScript validation including nominal type assertions                               |
| `git diff --check`                                                                                                                | Existing unrelated whitespace findings recorded separately; scoped Identity-001 diff passes | No unrelated whitespace cleanup performed                                                       |

本研究不声称任何平台一定接受该字符串，也不提供检测绕过方案。研究只提出风险降低方向：
`CSPRNG + restricted alphabet`、无固定语义 Prefix、canonical 无标点、自然语言标签、
禁止批量重复传播、禁止自动化和欺骗性站外导流。该研究不修改上一轮
`06_Commerce_Reference_Research.md`、冻结 Product Direction、任何 ADR、VS-01 合同、
产品行为、持久化、API、状态转换、Canonical Event、认证、授权或公开表面。

## 28. VERTICAL-02L-02-DESIGN — Photographer Session Reservation (Superseded)

> **Status**: Superseded by Section 29 Build Closure
> **Change Unit**: `DEV-024` — Closed by Founder-approved implementation
> **Scope**: Historical design preparation record; not the current implementation status

### 28.1 Objective and Current Boundary

This change unit prepares the first proposed Reservation Commerce Pattern after the completed
cross-vertical Request Commerce slices. It fixes the decision surface for an independent
photographer selling a 60-minute portrait/photo session to an individual client.

This section records the historical decision-preparation baseline. The subsequent Founder-approved
Build Closure in Section 29 is authoritative for implementation, schema, API, UI and test evidence.

### 28.2 Decision-Preparation Evidence

`52_VS02L02_Photographer_Session_Reservation_Design.md` compares:

| Required decision surface | Prepared recommendation / boundary                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Lifecycle models          | Model A Hold then Confirm is recommended over Instant Reservation and Request then Reserve; Founder approval required.                   |
| Reservation object        | Generic independent `Reservation` is recommended as an option, not created.                                                              |
| Availability / Slot       | Bounded time zone-aware Slot, capacity one, Hold, expiry, Reserved and Blocked are the minimum candidate semantics.                      |
| Payment timing            | One full Payment after Reservation Confirmed is recommended; deposit and split payment remain out of scope.                              |
| Fulfillment               | `Session Completed` is the recommended v1 candidate; gallery, delivery and customer acceptance are not added.                            |
| Settlement                | Candidate trigger is Payment Confirmed + Session Completed + no active resolution; existing Money model remains authoritative.           |
| Exceptions                | Cancellation, reschedule, expiry and no-show are mapped to Reservation, Order, Payment, Refund, Settlement and Recovery decision points. |
| Event inventory           | Only candidate Slot/Reservation facts are named; existing Payment/Fulfillment/Settlement/Money events must be reused.                    |

### 28.3 Reuse and Scope Guard

The design expects reuse of Creator Identity, Offering, Order, Payment, Fulfillment, Settlement,
Earnings Ledger, Wallet, Withdrawal and Operations. It proposes no photographer-specific Money
system, no `PhotographerReservation`, and no vertical-specific Provider behavior.

Explicitly excluded: studio/customer CRM, gallery/file delivery, editing workflow, equipment/room/team
management, Calendar product, Ticket Commerce, Marketplace, deposits, split payments, subscriptions,
multi-currency, multi-provider, insurance and credit.

### 28.4 Historical Controller / Founder Decision Surface

Before the Build Closure, `DEV-024` required Founder / Controller approval for:

1. a Reservation lifecycle model;
2. the generic Reservation and Availability/Slot object boundary;
3. confirmation actor and payment timing;
4. fulfillment/settlement trigger;
5. cancellation, reschedule, expiry and no-show policy;
6. the non-duplicative canonical event inventory.

Those decisions were subsequently approved and applied by the implementation recorded in Section 29.

```text
VERTICAL-02L-02-DESIGN = SUPERSEDED BY BUILD CLOSURE
DEV-024 = Closed — Founder Approved Build Applied
BUILD AUTHORIZATION = GRANTED
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

## 38. DEV-027 — Product Direction SSOT Registration

> **Status**：Closed — Documentation / Product Governance
> **Change Unit**：`DEV-027`
> **Date**：2026-08-23

### 38.1 Decision

原始未归档 PRD 已迁移并重命名为
`docs/01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md`，正式纳入
`01_Strategy` 产品方向层，作为 Personal Commerce Infrastructure 的产品方向 SSOT。

该文档定义长期产品命题、领域词汇、通用 Offer 类型和 Commerce 闭环；它不替代
`20_MVP_PRD_VS01.md` 的实现合同，不改变 VS-01 的产品行为，也不自动授权 VS-02 或恢复暂停中的开发。

### 38.2 Authority and Traceability

| 文档层       | 权威文档                                                                    | 本次关系                        |
| ------------ | --------------------------------------------------------------------------- | ------------------------------- |
| 产品方向     | `docs/01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md` | 定义长期方向与领域模型          |
| MVP 实现合同 | `docs/07_Product_Architecture/20_MVP_PRD_VS01.md`                           | 继续作为 VS-01 的唯一实现合同   |
| 执行与验收   | `docs/08_Execution/21_Prototype_Execution.md`                               | 继续记录 FR、AT、DEV 和验证证据 |
| 项目重启     | `docs/08_Execution/22_Project_Handoff.md`                                   | 继续作为暂停状态和恢复入口 SSOT |

### 38.3 Scope Guard

- 本次仅变更文档归属、命名、索引和权威关系。
- 未新增产品对象、状态转换、Canonical Event、权限、API Contract 或验收标准。
- `Identity` 表示 PCI 内部永久身份根；`Commerce Profile` 表示面向客户的商业身份，
  并保留 `1 Identity : N Commerce Profiles`。
- 产品范围内由商业互动形成的广义 `Relationship`，与平台账号绑定专用的
  `Commerce Relationship` 明确区分；后者仅表示
  `External Platform Account → Commerce Relationship → Commerce Profile` 的所有权、
  管理、验证和角色边界。
- `Goods`、`Program`、`Membership`、`Project`、`Right`、真实支付、结算、履约和 Reputation 仍需独立的阶段性产品合同与治理批准。
- `PROJECT_STATUS` 继续为 `SUSPENDED`，`REAL_MONEY_ENABLED` 继续为 `false`。

```text
DEV-027 = Closed
PRODUCT_DIRECTION_SSOT = REGISTERED
VS-01_SEMANTICS = UNCHANGED
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
```

## 41. DEV-028 / IDENTITY-001 — Internal Identity and Commerce Profile Domain Contract

> **Status**：Closed — Founder Authorized Stage 2 Domain Foundation
> **Change Unit**：`DEV-028` / `IDENTITY-001`
> **Date**：2026-08-26

### 41.1 Founder Authorization and Scope

Founder approved `STAGE2-DECISION-001` through `STAGE2-DECISION-009`. This authorizes the
following narrow Stage 2 change unit only:

```text
Internal Identity + Commerce Profile pure domain contract
```

The implementation establishes independent nominal ID types, the
`1 Internal Identity : N Commerce Profiles` ownership invariant, and separate
`ACTIVE` / `SUSPENDED` / `ARCHIVED` lifecycles. A Commerce Profile has exactly one
`owningIdentityId`; ownership reassignment, delegation, persistence, API, UI, and migration are
not part of this change unit.

### 41.2 Compatibility and Scope Guard

- VS-01 `creatorId` and `CommerceIdentity` remain unchanged; no direct ID reuse or migration is
  implemented.
- Commerce Reference / C号 generation, persistence, resolver, public lookup, QR runtime and
  enumeration controls remain unimplemented.
- External Platform Account, Commerce Relationship, OAuth, platform binding, Payment, Settlement,
  Refund, Marketplace, CRM and real-money changes are not included.
- Existing worktree application, adapter, database and migration drafts are not evidence of this
  change unit and are not modified by it.

```text
STAGE_2 = AUTHORIZED (IDENTITY-001 scope only)
STAGE_3 = NOT AUTHORIZED

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMERCE_REFERENCE_RUNTIME = NOT IMPLEMENTED
EXTERNAL_PLATFORM_BINDING = NOT IMPLEMENTED
COMMERCE_RELATIONSHIP_RUNTIME = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
QR_RUNTIME = NOT IMPLEMENTED
PUBLIC_RESOLVER = NOT IMPLEMENTED
REAL_MONEY_ENABLED = false
```

## 42. DEV-029 / IDENTITY-002 — External Platform Account & Commerce Relationship Domain Contract

> **Status**：Closed — Founder Authorized Stage 2 Domain Foundation
> **Change Unit**：`DEV-029` / `IDENTITY-002`
> **Date**：2026-08-26

### 42.1 Founder Authorization and Scope

Founder approved `STAGE2-DECISION-005` and `STAGE2-DECISION-006`. This narrow Stage 2 change
unit establishes only the pure domain contract for:

```text
External Platform
External Platform Account
Commerce Relationship
```

`External Platform` is a platform namespace. `External Platform Account` remains independent from
PCI Authentication Account, Internal Identity, Commerce Profile and Commerce Relationship. The
contract reuses the canonical `CommerceProfileId` nominal type from `IDENTITY-001`; it does not
create a second Identity or Commerce Profile identifier definition.

### 42.2 Domain Invariants and Lifecycle

- Multiple accounts for the same platform and Commerce Profile are valid.
- `Commerce Relationship` is the External Platform Account ↔ Commerce Profile binding-history
  record, rather than a `platformAccounts[]` field on Commerce Profile.
- Relationship verification and activation are separate states:
  `PROPOSED → VERIFIED → ACTIVE`.
- An External Platform Account can have at most one `ACTIVE` Commerce Relationship at a time.
- Account migration preserves history: the prior relationship reaches `HISTORICAL`, then a new
  relationship can be created for the next Commerce Profile. Ordinary mutation does not rewrite a
  historical relationship's Profile, role, effective time or verification history.
- Relationship roles remain distinct: `OWNER`, `MANAGER`, and `DELEGATED_MANAGER`.
- External Platform Account lifecycle (`ACTIVE`, `SUSPENDED`, `REVOKED`) is separate from
  Commerce Relationship lifecycle (`PROPOSED`, `VERIFIED`, `ACTIVE`, `SUSPENDED`, `REVOKED`,
  `HISTORICAL`).

### 42.3 Compatibility and Scope Guard

- `IDENTITY-001` nominal IDs, ownership invariant, lifecycle separation and
  `1 Internal Identity : N Commerce Profiles` remain intact.
- VS-01 `creatorId` and `CommerceIdentity` remain unchanged. No migration or legacy ID reuse is
  implemented.
- No OAuth, External Platform API, account-verification provider, binding runtime, persistence,
  database schema, migration, API, OpenAPI, UI, Commerce Reference generation or persistence,
  QR runtime, resolver, payment or real-money capability is included.
- Existing worktree application, adapter, database and migration drafts remain outside this change
  unit and are not evidence of this implementation.

```text
STAGE_2 = AUTHORIZED (IDENTITY-001 and IDENTITY-002 scopes only)
STAGE_3 = NOT AUTHORIZED

IDENTITY-001_REGRESSION = PASS
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
EXTERNAL_PLATFORM_API = NOT IMPLEMENTED
VERIFICATION_RUNTIME = NOT IMPLEMENTED
COMMERCE_REFERENCE_RUNTIME = NOT IMPLEMENTED
QR_RUNTIME = NOT IMPLEMENTED
PUBLIC_RESOLVER = NOT IMPLEMENTED
REAL_MONEY_ENABLED = false
```

### 42.4 Validation Evidence

| Check                                                        | Result                     |
| ------------------------------------------------------------ | -------------------------- |
| `pnpm vitest run modules/identity-infrastructure/`           | PASS — 2 files, 67 tests   |
| `pnpm test:domain`                                           | PASS — 16 files, 126 tests |
| Scoped ESLint for the new contract and tests                 | PASS                       |
| `pnpm lint`                                                  | PASS                       |
| `pnpm typecheck`                                             | PASS                       |
| `pnpm vitest run tests/governance/import-boundaries.test.ts` | PASS — 1 file, 6 tests     |
| Scoped trailing-whitespace audit for this change unit        | PASS                       |

`git diff --check` was also run. It continues to report pre-existing trailing whitespace in
unrelated working-tree changes: `04_North_Star_End_State.md`,
`20_MVP_PRD_VS01.md`, historical `DEV-027` lines in this execution record, and
`22_Engineering_Governance.md`. No unrelated whitespace was changed by this change unit.

## 43. DEV-030 / IDENTITY-003 — Commerce Reference Domain Contract

> **Status**：Closed — Founder Authorized Stage 2 Domain Foundation
> **Change Unit**：`DEV-030` / `IDENTITY-003`
> **Date**：2026-08-26

### 43.1 Founder Authorization and Scope

Founder approved the Stage 2 decision package and authorized this narrow pure-domain change unit:

```text
Commerce Reference strict canonical value
Commerce Reference ↔ Commerce Profile immutable association
```

The contract adopts the frozen C号 semantics: exactly 18 uppercase ASCII characters from
`3479ACDEFHJKMNPQRTVWXY`, with no punctuation or semantic prefix. `6-6-6` grouping is
display-only and never changes the canonical stored value.

### 43.2 Domain Invariants and Lifecycle

- `CommerceReference` is an independent nominal type, distinct from Authentication Account,
  Internal Identity, Commerce Profile, External Platform Account and Commerce Relationship IDs.
- A Commerce Reference identifies exactly one Commerce Profile; a Commerce Profile has at most one
  assigned Commerce Reference.
- Reference value and target Profile are immutable after explicit assignment. The contract does not
  provide an ordinary reassignment or mutation operation.
- The only lifecycle transition is `ASSIGNED → PERMANENTLY_RESERVED`. A permanently reserved
  reference is never released or reused, including after Profile archival or closure.
- Canonical validation is strict: it does not trim whitespace, remove separators, fold case,
  substitute confusable characters, or calculate a check digit. Input normalization remains
  unfrozen and unimplemented.

### 43.3 Compatibility and Scope Guard

- `IDENTITY-001` and `IDENTITY-002` nominal types remain canonical and are reused for type
  isolation and Commerce Profile association.
- C号 remains a public identifier, not a credential, authentication factor, authorization proof,
  URL, resolver, public page or QR object.
- QR remains the machine-readable representation of C号 only; it is not implemented here.
- No generator, allocator, CSPRNG, collision retry, persistence, database schema, migration,
  resolver, public route, rate limiting, enumeration protection, OAuth, platform binding,
  verification runtime, API, UI, payment or real-money capability is included.

```text
STAGE_2 = AUTHORIZED (IDENTITY-001, IDENTITY-002, and IDENTITY-003 scopes only)
STAGE_3 = NOT AUTHORIZED

IDENTITY-001_REGRESSION = PASS
IDENTITY-002_REGRESSION = PASS
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMERCE_REFERENCE_GENERATION = NOT IMPLEMENTED
COMMERCE_REFERENCE_ALLOCATION = NOT IMPLEMENTED
COMMERCE_REFERENCE_PERSISTENCE = NOT IMPLEMENTED
PUBLIC_RESOLVER = NOT IMPLEMENTED
ENUMERATION_MITIGATION_RUNTIME = NOT IMPLEMENTED
QR_RUNTIME = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
EXTERNAL_PLATFORM_BINDING_RUNTIME = NOT IMPLEMENTED
REAL_MONEY_ENABLED = false
```

### 43.4 Validation Evidence

| Check                                                                                 | Result                     |
| ------------------------------------------------------------------------------------- | -------------------------- |
| `pnpm vitest run modules/identity-infrastructure/commerce-reference-contract.test.ts` | PASS — 1 file, 16 tests    |
| `pnpm vitest run modules/identity-infrastructure/`                                    | PASS — 3 files, 83 tests   |
| `pnpm test:domain`                                                                    | PASS — 17 files, 142 tests |
| Scoped ESLint for the Commerce Reference contract, tests and compatibility export     | PASS                       |
| `pnpm lint`                                                                           | PASS                       |
| `pnpm typecheck`                                                                      | PASS                       |
| `pnpm vitest run tests/governance/import-boundaries.test.ts`                          | PASS — 1 file, 6 tests     |

The task-specific scoped whitespace and diff checks are recorded after the final documentation
update. Workspace-wide `git diff --check` remains expected to include pre-existing unrelated
working-tree whitespace findings; this change unit does not modify those files or lines.

## 44. DEV-031 / PCI-STAGE2-CLOSURE-001 — Identity Foundation Integration & Stage 2 Closure Audit

> **Status**：Closed — Stage 2 Identity Foundation Consistency Audit
> **Change Unit**：`DEV-031` / `PCI-STAGE2-CLOSURE-001`
> **Date**：2026-08-26

### 44.1 Integrated Canonical Domain Graph

```text
Authentication Account
        ≠
Internal Identity
        │ owns 1:N
        ▼
Commerce Profile
        ├── 0..1 Commerce Reference
        └── N External Platform Accounts through Commerce Relationships
                     │
                     └── 0..N historical Commerce Relationships
                            └── max 1 ACTIVE per External Platform Account
```

The three Stage 2 contracts are internally consistent:

- `InternalIdentityId` owns one or more Commerce Profiles through each Profile's exactly-one
  immutable `owningIdentityId`.
- A Commerce Profile has zero or one Commerce Reference; each assigned Commerce Reference has one
  immutable Commerce Profile target and becomes permanently reserved rather than released or reused.
- An External Platform Account remains a separate platform namespace object. It can have historical
  Commerce Relationships and at most one simultaneous `ACTIVE` relationship.
- `CommerceRelationship` roles (`OWNER`, `MANAGER`, `DELEGATED_MANAGER`) describe platform-account
  binding facts only. They do not replace or derive `CommerceProfile.owningIdentityId`.

### 44.2 Lifecycle, Namespace, and Boundary Audit

| Entity                    | Lifecycle / State                                                      | Cross-entity behavior                                       |
| ------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| Internal Identity         | `ACTIVE`, `SUSPENDED`, `ARCHIVED`                                      | No Profile deletion or cascade is inferred.                 |
| Commerce Profile          | `ACTIVE`, `SUSPENDED`, `ARCHIVED`                                      | Exactly one owner; archival does not release C号.           |
| External Platform Account | `ACTIVE`, `SUSPENDED`, `REVOKED`                                       | Does not suspend Profile or Internal Identity.              |
| Commerce Relationship     | `PROPOSED`, `VERIFIED`, `ACTIVE`, `SUSPENDED`, `REVOKED`, `HISTORICAL` | Historical binding remains separate from Account lifecycle. |
| Commerce Reference        | `ASSIGNED` → `PERMANENTLY_RESERVED`                                    | Never released, reassigned, or reused.                      |

- Nominal namespace audit passed for `AuthenticationAccountId`, `InternalIdentityId`,
  `CommerceProfileId`, `CommerceReference`, `ExternalPlatformAccountId`, and
  `CommerceRelationshipId`. Production contracts contain no `as unknown as`, shared generic ID,
  implicit ID-accepting API, or legacy `creatorId` / `CommerceIdentity` canonicalization.
- `CommerceObjectId` is not implemented in `identity-infrastructure`; no new Commerce Object
  namespace is introduced by this Stage 2 scope.
- `Relationship` remains a future broad commerce-relationship concept.
  `CommerceRelationship` remains exclusively the External Platform Account ↔ Commerce Profile
  binding-history type; no customer, client, member, partner, or follower relationship type exists
  in this module.
- Import direction is acyclic: `external-platform-contract` and
  `commerce-reference-contract` type-import canonical Profile / Reference types from
  `identity-contract`; no contract imports either dependent contract back into the identity contract.

### 44.3 Closure Decision and Remaining Boundaries

```text
IDENTITY-001_INTEGRATION = PASS
IDENTITY-002_INTEGRATION = PASS
IDENTITY-003_INTEGRATION = PASS

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

COMMERCE_REFERENCE = FROZEN
COMMERCE_REFERENCE_RUNTIME = NOT IMPLEMENTED
COMMERCE_REFERENCE_GENERATION = NOT IMPLEMENTED
COMMERCE_REFERENCE_ALLOCATION = NOT IMPLEMENTED
PUBLIC_RESOLVER = NOT IMPLEMENTED
QR_RUNTIME = NOT IMPLEMENTED

OAUTH = NOT IMPLEMENTED
EXTERNAL_PLATFORM_API = NOT IMPLEMENTED
EXTERNAL_PLATFORM_BINDING_RUNTIME = NOT IMPLEMENTED
VERIFICATION_RUNTIME = NOT IMPLEMENTED
ENUMERATION_MITIGATION_RUNTIME = NOT IMPLEMENTED
PERSISTENCE = NOT IMPLEMENTED
API_UI = NOT IMPLEMENTED
REAL_MONEY_ENABLED = false

STAGE_2_CLOSURE = READY
STAGE_3 = NOT AUTHORIZED
```

`STAGE_2_CLOSURE = READY` means only that the approved Identity Foundation domain scope is
internally consistent and needs no additional identity primitive. It does not authorize runtime
integration, persistence, OAuth, platform binding, resolver, QR, or public surfaces.

No remaining issue is classified as an Existing Contract Bug or Cross-Contract Integration Gap.
Resolver exposure, enumeration controls, public disclosure, OAuth, verification, persistence and
external binding remain Stage 3 / future runtime concerns. No new Founder Decision is required for
the completed Stage 2 domain-foundation scope.

### 44.4 Validation Evidence

| Check                                                                                          | Result                     |
| ---------------------------------------------------------------------------------------------- | -------------------------- |
| Stage 2 in-memory domain graph test                                                            | PASS — 1 file, 2 tests     |
| `pnpm vitest run modules/identity-infrastructure/`                                             | PASS — 4 files, 85 tests   |
| `pnpm test:domain`                                                                             | PASS — 18 files, 144 tests |
| `pnpm lint`                                                                                    | PASS                       |
| `pnpm typecheck`                                                                               | PASS                       |
| `pnpm vitest run tests/governance/import-boundaries.test.ts`                                   | PASS — 1 file, 6 tests     |
| Production ID escape-hatch, forbidden-runtime, terminology, lifecycle, and import-graph audits | PASS                       |

The final task-specific scoped diff and whitespace checks are recorded after this documentation
update. Workspace-wide `git diff --check` continues to include unrelated existing whitespace
findings, which are intentionally outside this change unit.

## 45. DEV-032 / PCI-STAGE2-RUNTIME-ENTRY-001 — Identity Foundation Runtime Transition Decision Package

> **Status**：Closed — Ready for Founder Decision; no Runtime implementation authorized
> **Change Unit**：`DEV-032` / `PCI-STAGE2-RUNTIME-ENTRY-001`
> **Date**：2026-08-26

### 45.1 Scope and Result

This documentation-only architecture change unit audits the completed Stage 2 Identity Foundation
for a possible transition from pure domain contracts to Durable Runtime. It creates no schema,
migration, repository, application service, API, OAuth, resolver, QR, or public-runtime
implementation.

```text
PCI-STAGE2-RUNTIME-ENTRY-001 = COMPLETE
STAGE2_RUNTIME_ENTRY = READY_FOR_FOUNDER_DECISION

IDENTITY-001 = COMPLETE
IDENTITY-002 = COMPLETE
IDENTITY-003 = COMPLETE
PCI-STAGE2-CLOSURE-001 = COMPLETE
STAGE_2_CLOSURE = READY
```

The Founder package is recorded in:

```text
docs/07_Product_Architecture/23_Stage_2_Runtime_Entry_Decision_Package.md
```

It separates Domain Contract, Persistence, Application Runtime, Private/Internal API, Public
Exposure, and External Integration. It recommends durable constraints, transaction boundaries,
ID-generation responsibility, a phased Runtime sequence, and `RUNTIME-DECISION-001` through
`RUNTIME-DECISION-014`.

### 45.2 Boundary Evidence

- All five canonical Identity Foundation objects remain unchanged; no new primitive or domain
  semantic is added.
- Durable enforcement is recommended for Profile ownership, C号 uniqueness / immutable association
  / non-reuse, namespace-scoped external account identity, retained relationship history, and
  max-one-active relationship. This is a decision recommendation only.
- Profile creation remains separate from Reference assignment; later Reference assignment must be
  atomic. Account registration can remain separate from proposed relationship creation; activation
  must be atomic with a durable active-relationship constraint.
- Existing uncommitted runtime, adapter, schema, and migration drafts are outside this change unit;
  they are neither reviewed as approved implementation nor evidence of Founder authorization.

```text
MIGRATION = NOT IMPLEMENTED
DATABASE_SCHEMA_CHANGE = NOT IMPLEMENTED
REPOSITORY_IMPLEMENTATION = NOT IMPLEMENTED
APPLICATION_RUNTIME = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
OAUTH = NOT AUTHORIZED
EXTERNAL_PLATFORM_BINDING_RUNTIME = NOT AUTHORIZED
COMMERCE_REFERENCE_GENERATOR = NOT AUTHORIZED
COMMERCE_REFERENCE_ALLOCATION = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR_RUNTIME = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
COMMITTED = NO
```

---

## 51. DEV-038 / RUNTIME-006 — Private Identity Foundation Application Runtime

> **Status**：Closed — Founder Authorized Stage 2 Runtime Change Unit
> **Change Unit**：`DEV-038` / `RUNTIME-006`
> **Date**：2026-08-26

### 51.1 Scope and Result

```text
RUNTIME-006 = COMPLETE

Private Application Runtime = IMPLEMENTED
Public API = NOT IMPLEMENTED
Public Resolver = NOT IMPLEMENTED
QR Runtime = NOT IMPLEMENTED
OAuth = NOT IMPLEMENTED
External Platform API = NOT IMPLEMENTED
External Platform Verification Runtime = NOT IMPLEMENTED
External Platform Runtime Binding = NOT IMPLEMENTED
Event / Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED
```

This change composes the five existing durable facts only through explicit private application
services and repository ports:

```text
Internal Identity
        ↓
Commerce Profile
        ↓
Commerce Reference

External Platform Account
        ↓
Commerce Relationship
        ↓
Commerce Profile
```

No HTTP route, public contract, resolver, QR runtime, OAuth flow, platform client, verification
mechanism, event transport, VS-01 migration, legacy backfill, or Commerce Pattern behavior was
introduced.

### 51.2 Private Use Cases and Boundaries

The existing small services remain the private entry points for:

```text
Internal Identity:
  CreateInternalIdentity
  GetInternalIdentity
  ChangeInternalIdentityLifecycle

Commerce Profile:
  CreateCommerceProfile
  GetCommerceProfile
  ListProfilesOwnedByIdentity
  ChangeCommerceProfileLifecycle

External Platform Account:
  RegisterExternalPlatformAccount
  GetExternalPlatformAccount
  ChangeExternalPlatformAccountLifecycle
```

New private services provide:

```text
Commerce Reference:
  AssignCommerceReference (caller-supplied canonical reference only)

Commerce Relationship:
  CreateCommerceRelationship
  GetCommerceRelationship
  ListRelationshipsForAccount
  ListRelationshipsForProfile
  GetActiveRelationshipForAccount
  ChangeCommerceRelationshipLifecycle
  ReplaceSuspendedRelationshipWithVerifiedRelationship
```

Application code depends only on domain contracts, repository ports, clocks, ID-generator ports,
and the narrow `IdentityFoundationTransaction` port. It imports neither PostgreSQL, Drizzle, SQL,
database schema, adapters, nor public application surfaces. Domain contracts retain ownership of
identity validation, immutable facts, lifecycle transitions, and active-relationship semantics.

There is no new authentication system. The services are private, dependency-injected composition
points; future authorization remains an explicit application-boundary concern. Missing dependency,
invalid state, duplicate fact, and concurrent-update paths fail closed.

### 51.3 Transaction and Error Semantics

`AssignCommerceReference` executes:

```text
BEGIN
  verify Profile exists
  validate caller-supplied canonical Commerce Reference
  assign one durable Reference
COMMIT
```

An insertion failure rolls back the assignment; no partial durable Reference remains. The
PostgreSQL transaction adapter creates transactional Profile, Reference, and Relationship
repositories within one database transaction. The in-memory adapter snapshots only the relevant
repositories for application tests and restores them on failure.

Relationship replacement is intentionally narrow and historical:

```text
same External Platform Account
old SUSPENDED Relationship → HISTORICAL
new VERIFIED Relationship → ACTIVE
```

Both conditional lifecycle writes run in one transaction. Old account target, Profile target,
role, effective time, creation time, and relationship ID remain unchanged. The partial unique
index remains the final durable protection for max-one `ACTIVE` Relationship per External Platform
Account.

Repository and domain errors are mapped to explicit private application categories:

```text
not_found
conflict
validation
unavailable
```

`not_found` covers missing durable dependencies; `conflict` covers duplicates and conditional
lifecycle conflicts; `validation` covers canonical input and invalid domain transitions; and
unexpected persistence failures map to `unavailable`.

### 51.4 Compatibility and Stable Commerce Boundaries

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

REQUEST = UNCHANGED
RESERVATION = UNCHANGED
CONTRACT = UNCHANGED

Commerce Reference Generation = NOT IMPLEMENTED
Commerce Reference Allocation = NOT IMPLEMENTED
```

The private runtime does not transfer Profile ownership, mutate or release a Commerce Reference,
mutate External Platform Account identity, mutate Commerce Relationship target account/Profile or
role, rewrite relationship history, or infer external platform verification.

### 51.5 Validation Evidence

| Validation                                                                           | Result                                                                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `pnpm vitest run tests/application/private-identity-foundation-runtime.test.ts`      | PASS — 1 file, 7 tests; use cases, fail-closed mapping, and in-memory rollback coverage                       |
| Private application PostgreSQL integration                                           | SKIPPED — `DATABASE_URL` was absent; test is gated by the repository-standard database integration convention |
| `pnpm vitest run modules/identity-infrastructure/ ... RUNTIME-006 persistence scope` | PASS — 8 files, 138 tests; 1 PostgreSQL file skipped, 2 tests skipped                                         |
| `pnpm test:domain`                                                                   | PASS — 18 files, 144 tests                                                                                    |
| `pnpm typecheck`                                                                     | PASS                                                                                                          |
| `pnpm lint`                                                                          | PASS                                                                                                          |
| `pnpm vitest run tests/governance/import-boundaries.test.ts`                         | PASS — 1 file, 6 tests                                                                                        |
| `pnpm db:check`                                                                      | PASS — build plus migration ordering/integrity through `0022_stage2_commerce_relationship_core.sql`           |
| `pnpm vitest run tests/persistence/migration-contract.test.ts`                       | PASS — 1 file, 2 tests                                                                                        |

```text
RUNTIME-001 = PASS
RUNTIME-002 = PASS
RUNTIME-003 = PASS
RUNTIME-004 = PASS
RUNTIME-005 = PASS

IDENTITY-001 = PASS
IDENTITY-002 = PASS
IDENTITY-003 = PASS

COMMITTED = NO
```

---

## 52. DEV-039 / RUNTIME-007 — Private Runtime Durable Integration Verification

> **Status**：Blocked — Environment Evidence Only
> **Change Unit**：`DEV-039` / `RUNTIME-007`
> **Date**：2026-08-26

### 52.1 Result

```text
RUNTIME-007 = BLOCKED_BY_ENVIRONMENT

DATABASE_URL = ABSENT
POSTGRES_APPLICATION_INTEGRATION = NOT_VERIFIED
```

The required real PostgreSQL integration environment is unavailable in the execution environment.
The production-path test
`tests/persistence/private-identity-foundation-postgres.integration.test.ts` was executed and
correctly skipped under the repository-standard `DATABASE_URL` gate:

```text
Test Files  1 skipped
Tests       2 skipped
```

No database URL was invented, no database was mocked or substituted, no environment file or CI
secret was modified, and no test behavior was changed to bypass the missing real PostgreSQL
environment.

### 52.2 Verification Status

```text
Identity persistence = NOT VERIFIED
Profile persistence = NOT VERIFIED
Reference persistence = NOT VERIFIED
External Account persistence = NOT VERIFIED
Relationship persistence = NOT VERIFIED

Profile + Reference atomicity = NOT VERIFIED
Relationship replacement atomicity = NOT VERIFIED
Rollback = NOT VERIFIED
Conditional writes = NOT VERIFIED
FK / UNIQUE / CHECK / partial UNIQUE ACTIVE = NOT VERIFIED
Real PostgreSQL rehydration = NOT VERIFIED
```

The existing test continues to define the intended production path:

```text
Private Application Service
        ↓
Repository Port
        ↓
PostgreSQL Adapter
        ↓
PostgreSQL transaction and canonical rehydration
```

It must be re-run against an available, isolated PostgreSQL integration database before any of
the above items can be promoted to `PASS`.

### 52.3 Boundaries and Compatibility

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

Public API = NOT IMPLEMENTED
Public Resolver = NOT IMPLEMENTED
QR Runtime = NOT IMPLEMENTED
OAuth = NOT IMPLEMENTED
External Platform API = NOT IMPLEMENTED
External Platform Verification Runtime = NOT IMPLEMENTED
Event / Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED

COMMITTED = NO
```

No domain primitive, aggregate, database table, business capability, Commerce Pattern, public
surface, OAuth capability, external platform integration, or legacy migration was added by this
verification task.

---

## 50. DEV-037 / RUNTIME-005 — Commerce Relationship Durable Persistence

### 50.1 Scope and Result

```text
RUNTIME-005 = COMPLETE
```

`CommerceRelationship` is now a canonical durable historical fact between an independent
`ExternalPlatformAccount` and a `CommerceProfile`:

```text
External Platform Account
        ↓
Commerce Relationship
        ↓
Commerce Profile
```

The implementation does not make an External Platform Account directly owned by an Internal
Identity, Commerce Profile, or Commerce Reference. A relationship may exist at any approved
lifecycle state and a platform account may legally have no relationship.

### 50.2 Durable Schema and Cardinality

Migration `0022_stage2_commerce_relationship_core.sql` creates:

```text
commerce_relationships
-----------------------------------------------
commerce_relationship_id       PRIMARY KEY
external_platform_account_id   NOT NULL, restrictive FK
commerce_profile_id            NOT NULL, restrictive FK
role                           NOT NULL, CHECK
lifecycle                      NOT NULL, CHECK
effective_at                   NOT NULL
created_at                     NOT NULL
updated_at                     NOT NULL
```

Foreign keys are restrictive:

```text
external_platform_account_id
  → external_platform_accounts.external_platform_account_id

commerce_profile_id
  → commerce_profiles.commerce_profile_id
```

PostgreSQL enforces the active-binding invariant with:

```text
UNIQUE INDEX commerce_relationships_one_active_account_unique
ON commerce_relationships(external_platform_account_id)
WHERE lifecycle = 'ACTIVE'
```

The resulting cardinality is:

```text
1 External Platform Account
  → 0..N Commerce Relationship history records
  → max 1 ACTIVE relationship

1 Commerce Profile
  → 0..N Commerce Relationships
```

There is intentionally no `UNIQUE(commerce_profile_id, platform)` constraint: a Profile may have
multiple External Platform Accounts in the same platform namespace. No direct Account → Profile
foreign key exists outside `commerce_relationships`; no Account → Internal Identity or Account →
Commerce Reference foreign key exists.

### 50.3 Canonical Facts, Roles, and Lifecycle

`CommerceRelationshipId` remains a distinct canonical nominal type and is not interchangeable
with External Platform Account, Commerce Profile, Internal Identity, Authentication Account, or
Commerce Reference identifiers.

Roles are relationship facts only:

```text
OWNER
MANAGER
DELEGATED_MANAGER
```

They do not mutate or replace `CommerceProfile.ownerIdentityId`.

The persisted lifecycle follows the domain contract:

```text
PROPOSED → VERIFIED → ACTIVE
ACTIVE → SUSPENDED | REVOKED
SUSPENDED → ACTIVE | REVOKED | HISTORICAL
REVOKED → HISTORICAL
```

Invalid terminal reactivation and verification transitions are rejected by the domain contract.
The current canonical contract contains neither a separate verification-status fact nor `endedAt`;
this migration intentionally does not invent either field. Account lifecycle and Profile lifecycle
remain independent from Relationship lifecycle; no database cascade or runtime orchestration
changes any related aggregate.

### 50.4 Immutability, History, Repository, and Concurrency

Relationship identity and historical binding facts are immutable through ordinary repository
operations:

```text
commerceRelationshipId
externalPlatformAccountId
commerceProfileId
role
effectiveAt
createdAt
```

The repository exposes only:

```text
create
getById
listByExternalPlatformAccount
listByCommerceProfile
getActiveByExternalPlatformAccount
updateLifecycle
```

It provides no delete, purge, account/profile reassignment, role update, or target update.
Historical account migration is preserved as an explicit sequence: historicalize/revoke the old
relationship and create a new relationship. The old durable row remains queryable and is never
rewritten to point at the new Profile.

Creation validates the referenced Account and Profile and then uses one atomic PostgreSQL insert;
the foreign keys and partial unique index are the final durable guards. Duplicate active bindings
map to `ActiveCommerceRelationshipConflictError`; unknown references map to explicit Account or
Profile not-found errors. Lifecycle mutation uses:

```text
WHERE commerce_relationship_id = ?
  AND lifecycle = expected_lifecycle
```

so concurrent status transitions have one winner and one lifecycle conflict. The partial unique
index similarly guarantees that concurrent attempts to create two `ACTIVE` relationships for one
account yield at most one success. `updatedAt` changes only on a successful lifecycle write;
`createdAt` remains immutable. Rehydration validates every persisted identifier, role, lifecycle,
effective timestamp, and audit timestamp before returning the canonical domain object.

### 50.5 Boundaries and Compatibility

```text
Commerce Relationship persistence = IMPLEMENTED
External Platform binding runtime = NOT IMPLEMENTED

OAuth = NOT IMPLEMENTED
External Platform API = NOT IMPLEMENTED
Verification Runtime = NOT IMPLEMENTED
Public API = NOT IMPLEMENTED
Resolver = NOT IMPLEMENTED
QR = NOT IMPLEMENTED
Commerce Reference Generation = NOT IMPLEMENTED
Commerce Reference Allocation = NOT IMPLEMENTED
Event / Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
```

No OAuth credential, platform API client, webhook, automatic verification, public endpoint,
resolver, QR runtime, Commerce Reference field, event/outbox component, payment capability, or
VS-01 identity migration was introduced.

### 50.6 Validation Evidence

| Validation                                                     | Result                                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Commerce Relationship persistence tests                        | PASS — roles, FK validation, history, partial active uniqueness, lifecycle conflicts, timestamps, and concurrency evidence |
| `pnpm vitest run modules/identity-infrastructure/`             | PASS                                                                                                                       |
| `pnpm test:domain`                                             | PASS                                                                                                                       |
| `pnpm typecheck`                                               | PASS                                                                                                                       |
| `pnpm lint`                                                    | PASS                                                                                                                       |
| `pnpm vitest run tests/governance/import-boundaries.test.ts`   | PASS                                                                                                                       |
| `pnpm db:check`                                                | PASS                                                                                                                       |
| `pnpm vitest run tests/persistence/migration-contract.test.ts` | PASS                                                                                                                       |
| Commerce Relationship forbidden-scope audit                    | PASS                                                                                                                       |
| Scoped `git diff --check`                                      | PASS                                                                                                                       |

```text
RUNTIME-001 regression = PASS
RUNTIME-002 regression = PASS
RUNTIME-003 regression = PASS
RUNTIME-004 regression = PASS

IDENTITY-001 regression = PASS
IDENTITY-002 regression = PASS
IDENTITY-003 regression = PASS

COMMITTED = NO
```

## 49. DEV-036 / RUNTIME-004 — External Platform Account Durable Persistence

> **Status**：Closed — Founder Authorized Stage 2 Runtime Change Unit
> **Change Unit**：`DEV-036` / `RUNTIME-004`
> **Date**：2026-08-26

### 49.1 Scope and Durable Fact

This change unit implements only canonical `ExternalPlatformAccount` durable persistence on the
existing PostgreSQL / Drizzle architecture. The forward-only
`0021_stage2_external_platform_account_core.sql` migration creates
`external_platform_accounts` with:

```text
external_platform_account_id
platform
platform_account_id
lifecycle
created_at
updated_at
```

`external_platform_account_id` is the independent PCI primary key. `platform` is the canonical
External Platform namespace and, with `platform_account_id`, is uniquely constrained:

```text
UNIQUE(platform, platform_account_id)
```

This permits `instagram / A`, `instagram / B`, and `youtube / A`, while rejecting a second
`instagram / A`. The table has no foreign key and no `commerce_profile_id`,
`internal_identity_id`, `commerce_reference`, or relationship field; an account therefore exists
legitimately without a Commerce Relationship or active Profile binding.

### 49.2 Repository, Lifecycle, Concurrency, and Rehydration

`ExternalPlatformAccountRepository` provides only:

```text
create
getById
getByPlatformAccount
exists
updateLifecycle
```

The minimal private `ExternalPlatformAccountService` accepts explicit platform/account input,
generates a distinct canonical `ExternalPlatformAccountId`, applies the existing namespace
validation, and maps unknown ID or namespace lookups to
`ExternalPlatformAccountNotFoundError`. `ExternalPlatformAccountAlreadyExistsError` represents a
duplicate namespace fact. There is no upsert, delete, account-ID replacement, platform mutation,
platform-account-ID mutation, binding, unbinding, transfer, or relationship operation.

Database rows are rehydrated through `rehydrateExternalPlatformAccount`, which validates the
branded account ID, normalized platform namespace, branded platform account identifier,
lifecycle, and timestamps before returning a domain object. `createdAt` is never updated.

Lifecycle remains the existing independent Account state machine:

```text
ACTIVE → SUSPENDED
ACTIVE → REVOKED
SUSPENDED → ACTIVE
SUSPENDED → REVOKED
```

`REVOKED` is retained history, not deletion. `updateLifecycle` validates the domain transition and
uses a conditional write:

```text
WHERE external_platform_account_id = ?
  AND lifecycle = expected_lifecycle
```

Only one concurrent state change can succeed; the loser receives
`ExternalPlatformAccountLifecycleConflictError`, and its attempted timestamp does not mutate the
stored account. Account lifecycle does not orchestrate Commerce Relationship lifecycle.

### 49.3 Compatibility and Boundaries

```text
RUNTIME-004 = COMPLETE

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

CommerceRelationship persistence = NOT IMPLEMENTED
External binding runtime = NOT IMPLEMENTED
OAuth = NOT IMPLEMENTED
Verification Runtime = NOT IMPLEMENTED
Platform API = NOT IMPLEMENTED
Commerce Reference integration = NOT IMPLEMENTED
Resolver = NOT IMPLEMENTED
QR runtime = NOT IMPLEMENTED
Public API = NOT IMPLEMENTED
Event / Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED
```

No VS-01 Creator record, legacy identity, Commerce Profile, Commerce Reference, or historical
migration is rewritten, linked, deleted, or migrated. The next authorized persistence aggregate
remains Commerce Relationship; it is not implemented by this change unit.

### 49.4 Validation Evidence

| Validation                                                     | Result                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| External Platform Account persistence tests                    | PASS — rehydration, namespace uniqueness, independent existence, lifecycle, timestamps, immutable identity API boundary, and concurrent create/status conflicts |
| `pnpm vitest run modules/identity-infrastructure/`             | PASS — 4 files, 85 tests                                                                                                                                        |
| `pnpm test:domain`                                             | PASS — 18 files, 144 tests                                                                                                                                      |
| `pnpm typecheck`                                               | PASS                                                                                                                                                            |
| `pnpm lint`                                                    | PASS                                                                                                                                                            |
| `pnpm vitest run tests/governance/import-boundaries.test.ts`   | PASS — 1 file, 6 tests                                                                                                                                          |
| `pnpm db:check` migration integrity                            | PASS                                                                                                                                                            |
| `pnpm vitest run tests/persistence/migration-contract.test.ts` | PASS — 1 file, 2 tests                                                                                                                                          |
| External Platform Account forbidden-scope audit                | PASS                                                                                                                                                            |
| Scoped `git diff --check`                                      | PASS — RUNTIME-004 files; historical DEV-027 whitespace remains pre-existing                                                                                    |

```text
RUNTIME-001 regression = PASS
RUNTIME-002 regression = PASS
RUNTIME-003 regression = PASS
IDENTITY-001 regression = PASS
IDENTITY-002 regression = PASS
IDENTITY-003 regression = PASS

COMMITTED = NO
```

### 45.3 Validation Evidence

| Check                                                                                                                                | Result                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Document consistency audit against Stage 2 SSOT, decision package, handoff, governance anchor, and all Identity Foundation contracts | PASS                                                                                                   |
| `pnpm vitest run modules/identity-infrastructure/`                                                                                   | PASS — 4 files, 85 tests                                                                               |
| `pnpm test:domain`                                                                                                                   | PASS — 18 files, 144 tests                                                                             |
| `pnpm typecheck`                                                                                                                     | PASS                                                                                                   |
| `pnpm lint`                                                                                                                          | PASS                                                                                                   |
| `pnpm vitest run tests/governance/import-boundaries.test.ts`                                                                         | PASS — 1 file, 6 tests                                                                                 |
| Runtime-boundary, ID escape-hatch, and relationship-terminology audits                                                               | PASS                                                                                                   |
| Task-added decision package and `DEV-032` whitespace audit                                                                           | PASS                                                                                                   |
| `git diff --check` for touched execution log file                                                                                    | PRE-EXISTING FINDINGS ONLY — `DEV-027` trailing whitespace at lines 2970–2971; no finding in `DEV-032` |

Workspace-wide whitespace findings in unrelated existing files remain outside this change unit and
are not modified. Historic full-suite timeout / browser-acceptance instability remains a separate
pre-existing engineering stability issue, not a Runtime Entry authorization signal.

## 46. DEV-033 / RUNTIME-001 — Internal Identity Durable Persistence

> **Status**：Closed — Founder Authorized Stage 2 Runtime Change Unit
> **Change Unit**：`DEV-033` / `RUNTIME-001`
> **Date**：2026-08-26

### 46.1 Scope and Durable Fact

This change unit implements only the durable persistence boundary for canonical `InternalIdentity`.
The PostgreSQL / Drizzle persistence representation is the new `identities` table with only:

```text
identity_id
lifecycle
created_at
updated_at
```

`identity_id` is the database primary key. `lifecycle`, `created_at`, and `updated_at` are
non-null, and the migration restricts lifecycle values to `ACTIVE`, `SUSPENDED`, and `ARCHIVED`.
No PII, authentication account, profile, reference, external platform, or relationship field is
stored in this table.

### 46.2 Repository and Transaction Semantics

`InternalIdentityRepository` is a minimal canonical repository port:

```text
create
getById
exists
updateLifecycle
```

The PostgreSQL adapter reconstructs `InternalIdentity` through the canonical
`rehydrateInternalIdentity` contract. It maps duplicate primary-key writes to
`InternalIdentityAlreadyExistsError`, missing updates to `InternalIdentityNotFoundError`, and
conditional lifecycle write conflicts to `InternalIdentityConcurrentUpdateError`.

Create uses a generated `InternalIdentityId` followed by one database insert. A successful
generation does not claim durable creation; only the insert succeeds or fails. The identity-specific
UUID generator produces `identity_<uuid>` values and never derives an identity ID from an
`AuthenticationAccountId`, `CommerceProfileId`, email, platform handle, or Commerce Reference.

Lifecycle persistence is conditional on the expected current state, so two concurrent writers cannot
silently overwrite one another. Domain transition validation occurs before persistence; the database
constraint independently rejects non-canonical lifecycle values. `createdAt` is never updated and
`updatedAt` changes only on a successful lifecycle state change.

### 46.3 Boundaries and Compatibility

```text
RUNTIME-001 = COMPLETE

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

Commerce Profile Persistence = NOT IMPLEMENTED
Commerce Reference Persistence = NOT IMPLEMENTED
External Platform Account Persistence = NOT IMPLEMENTED
Commerce Relationship Persistence = NOT IMPLEMENTED

OAuth = NOT IMPLEMENTED
External Platform Binding = NOT IMPLEMENTED
Public Resolver = NOT IMPLEMENTED
QR Runtime = NOT IMPLEMENTED
Public API = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED
Event/Outbox = NOT IMPLEMENTED
```

No existing Creator / Commerce data is backfilled, rewritten, deleted, or mapped. The existing
`0016_stage2_identity_core.sql` migration is forward-only and creates only the Internal Identity
schema.

### 46.4 Validation Evidence

| Validation                                                   | Result                                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Canonical Internal Identity persistence tests                | PASS                                                                                             |
| `pnpm vitest run modules/identity-infrastructure/`           | PASS                                                                                             |
| `pnpm test:domain`                                           | PASS                                                                                             |
| `pnpm typecheck`                                             | PASS                                                                                             |
| `pnpm lint`                                                  | PASS                                                                                             |
| `pnpm vitest run tests/governance/import-boundaries.test.ts` | PASS                                                                                             |
| `pnpm db:check` migration integrity                          | PASS                                                                                             |
| Scoped architecture and lifecycle tests                      | PASS                                                                                             |
| Scoped `git diff --check`                                    | PASS — RUNTIME-003 files and DEV-035 section; historical DEV-027 whitespace remains pre-existing |

```text
IDENTITY-001 regression = PASS
IDENTITY-002 regression = PASS
IDENTITY-003 regression = PASS

COMMITTED = NO
```

## 47. DEV-034 / RUNTIME-002 — Commerce Profile Durable Persistence

> **Status**：Closed — Founder Authorized Stage 2 Runtime Change Unit
> **Change Unit**：`DEV-034` / `RUNTIME-002`
> **Date**：2026-08-26

### 47.1 Scope and Durable Fact

This change unit implements only canonical `CommerceProfile` durable persistence on the existing
PostgreSQL / Drizzle architecture. The forward-only `0018_stage2_commerce_profile_core.sql`
migration creates `commerce_profiles` with:

```text
commerce_profile_id
owning_identity_id
lifecycle
display_name
created_at
updated_at
```

`commerce_profile_id` is the primary key. `owning_identity_id` is non-null and has a restrictive
foreign key to `identities.identity_id`, making each Profile owned by exactly one durable Internal
Identity while naturally allowing one Identity to own many Profiles. The schema has no cascade
delete, no ownership-update path, no Commerce Reference, external account, relationship, OAuth,
or account binding field.

`display_name` is retained because it is the only canonical Profile presentation fact already
defined by `identity-contract.ts`; bio, avatar, location, social links, platform handles, and other
future/profile-adjacent data are not persisted by the canonical runtime adapter.

### 47.2 Repository, Lifecycle, and Rehydration

`CommerceProfileRepository` provides only:

```text
create
getById
exists
listOwnedByIdentity
updateLifecycle
```

The canonical PostgreSQL adapter maps duplicate IDs to `CommerceProfileAlreadyExistsError`,
unknown FK owners to `CommerceProfileOwnerNotFoundError`, missing updates to
`CommerceProfileNotFoundError`, and conditional-write losers to
`CommerceProfileLifecycleConflictError`. `create` writes one independently generated canonical
`CommerceProfileId` and one Profile fact; it never creates an Identity, Reference, account, or
relationship.

Rows are reconstructed through `rehydrateCommerceProfile`, validating the branded Profile ID,
branded owning Internal Identity ID, lifecycle, presentation, and timestamps. Lifecycle transitions
use canonical domain validation and a conditional database write:

```text
WHERE commerce_profile_id = ?
  AND lifecycle = expected_lifecycle
```

Therefore concurrent lifecycle updates cannot silently overwrite each other. `createdAt` is never
changed; `updatedAt` changes only after a successful durable lifecycle change. Identity and Profile
lifecycle remain independent; no cross-aggregate state cascade exists.

### 47.3 Compatibility and Boundaries

```text
RUNTIME-002 = COMPLETE

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
PROFILE_OWNERSHIP_TRANSFER = NOT IMPLEMENTED

Commerce Reference Persistence = NOT IMPLEMENTED
Commerce Reference Generation = NOT IMPLEMENTED
External Platform Account Persistence = NOT IMPLEMENTED
Commerce Relationship Persistence = NOT IMPLEMENTED
OAuth = NOT IMPLEMENTED
External Binding = NOT IMPLEMENTED
Public API = NOT IMPLEMENTED
Resolver = NOT IMPLEMENTED
QR = NOT IMPLEMENTED
Event/Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED
```

No VS-01 Creator record is backfilled, rewritten, deleted, or mapped to a canonical Commerce
Profile. The pre-existing legacy Profile PostgreSQL adapter cannot perform reads or writes; the
canonical repository is the only Profile persistence adapter permitted for RUNTIME-002.

### 47.4 Validation Evidence

| Validation                                                   | Result                                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Canonical Commerce Profile persistence tests                 | PASS — owner FK semantics, 1:N list isolation, rehydration, ID uniqueness, lifecycle, timestamp, conflict coverage |
| Internal Identity persistence regression                     | PASS                                                                                                               |
| `pnpm vitest run modules/identity-infrastructure/`           | PASS — 4 files, 85 tests                                                                                           |
| `pnpm test:domain`                                           | PASS — 18 files, 144 tests                                                                                         |
| `pnpm typecheck`                                             | PASS                                                                                                               |
| `pnpm lint`                                                  | PASS                                                                                                               |
| `pnpm vitest run tests/governance/import-boundaries.test.ts` | PASS — 1 file, 6 tests                                                                                             |
| `pnpm db:check` migration integrity                          | PASS                                                                                                               |
| Canonical Profile forbidden-scope audit                      | PASS                                                                                                               |
| Scoped `git diff --check`                                    | PASS                                                                                                               |

```text
RUNTIME-001 regression = PASS
IDENTITY-001 regression = PASS
IDENTITY-002 regression = PASS
IDENTITY-003 regression = PASS

COMMITTED = NO
```

## 48. DEV-035 / RUNTIME-003 — Commerce Reference Durable Persistence

> **Status**：Closed — Founder Authorized Stage 2 Runtime Change Unit
> **Change Unit**：`DEV-035` / `RUNTIME-003`
> **Date**：2026-08-26

### 48.1 Scope and Durable Fact

This change unit implements only canonical `CommerceReference` / C号 durable persistence on the
existing PostgreSQL / Drizzle architecture. The forward-only
`0020_stage2_commerce_reference_core.sql` migration creates `commerce_references` with:

```text
commerce_reference
commerce_profile_id
lifecycle
assigned_at
created_at
updated_at
```

`commerce_reference` is the global primary key. `commerce_profile_id` is non-null, uniquely
constrained, and has a restrictive foreign key to `commerce_profiles.commerce_profile_id`.
Together, the primary key and unique Profile constraint express:

```text
1 Commerce Profile → 0..1 Commerce Reference
1 Commerce Reference → exactly 1 Commerce Profile
```

The migration persists only the canonical 18-character C号 and its durable assignment facts. It
does not create a resolver, URL, QR payload, identity/account field, external account,
relationship, OAuth, event, outbox, payment, or other deferred-runtime table.

### 48.2 Repository, Lifecycle, and Rehydration

`CommerceReferenceRepository` provides only:

```text
assign
getByReference
getByProfileId
exists
reserve
```

It deliberately provides no delete, release, reassign, reference-value update, or target-Profile
update operation. Assignment accepts a caller-supplied, already canonical
`CommerceReference`; generation, allocation, CSPRNG, and collision retry are not implemented.
The single durable insert is the assignment transaction boundary: the Profile FK and both unique
constraints either accept the association together or reject it without a partial durable fact.

Duplicate C号 values map to `CommerceReferenceAlreadyExistsError`; a second reference for the
same Profile maps to `CommerceProfileAlreadyHasReferenceError`; an unknown Profile FK maps to
`CommerceProfileNotFoundForReferenceError`. Rehydration calls `createCommerceReference` and
`rehydrateAssignedCommerceReference`, so canonical value, branded Profile ID, lifecycle, and
timestamps are validated before returning the domain aggregate.

Lifecycle is limited to:

```text
ASSIGNED → PERMANENTLY_RESERVED
```

`reserve` uses a conditional write:

```text
WHERE commerce_reference = ?
  AND lifecycle = 'ASSIGNED'
```

Only one concurrent reserve can win; the loser receives
`CommerceReferenceLifecycleConflictError`, and `updatedAt` changes only for the successful
transition. There is no inverse transition. A Profile lifecycle change neither deletes nor changes
its Reference, so an archived Profile's already reserved C号 remains durably occupied and cannot
be assigned to another Profile.

### 48.3 Compatibility and Boundaries

```text
RUNTIME-003 = COMPLETE

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

generation = NOT IMPLEMENTED
allocation = NOT IMPLEMENTED
resolver = NOT IMPLEMENTED
QR runtime = NOT IMPLEMENTED
enumeration mitigation = NOT IMPLEMENTED
OAuth = NOT IMPLEMENTED
external binding = NOT IMPLEMENTED
External Platform Account persistence = NOT IMPLEMENTED
Commerce Relationship persistence = NOT IMPLEMENTED
public API = NOT IMPLEMENTED
Event / Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED
```

No VS-01 Creator record or old Commerce ID is backfilled, rewritten, deleted, or mapped to a
canonical C号. The new schema does not alter the historical identity or Profile migrations.

### 48.4 Validation Evidence

| Validation                                                   | Result                                                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Canonical Commerce Reference persistence tests               | PASS — canonical rehydration, one-to-one assignment, FK failure, lifecycle conflict, no reuse, Profile lifecycle independence |
| `pnpm vitest run modules/identity-infrastructure/`           | PASS                                                                                                                          |
| `pnpm test:domain`                                           | PASS                                                                                                                          |
| `pnpm typecheck`                                             | PASS                                                                                                                          |
| `pnpm lint`                                                  | PASS                                                                                                                          |
| `pnpm vitest run tests/governance/import-boundaries.test.ts` | PASS                                                                                                                          |
| `pnpm db:check` migration integrity                          | PASS                                                                                                                          |
| Commerce Reference forbidden-scope audit                     | PASS                                                                                                                          |
| Scoped `git diff --check`                                    | PASS                                                                                                                          |

```text
RUNTIME-001 regression = PASS
RUNTIME-002 regression = PASS
IDENTITY-001 regression = PASS
IDENTITY-002 regression = PASS
IDENTITY-003 regression = PASS

COMMITTED = NO
```

---

## 53. DEV-040 / PCI-PROVISION-001 — PostgreSQL Integration Environment Readiness

> **Status**：Complete — Provisioning Contract and Safe Preflight
> **Change Unit**：`DEV-040` / `PCI-PROVISION-001`
> **Date**：2026-08-26

### 53.1 Result

```text
PCI-PROVISION-001 = COMPLETE

PRODUCTION_DATABASE = NOT REQUIRED
INTEGRATION_DATABASE = REQUIRED
INTEGRATION_DATABASE = NOT_YET_PROVISIONED
DATABASE_URL = ABSENT

RUNTIME-007 = BLOCKED_BY_ENVIRONMENT
POSTGRES_APPLICATION_INTEGRATION = NOT_VERIFIED
```

This change establishes an executable, fail-closed provisioning gate for the real PostgreSQL
verification environment. It does not provision a database, manufacture a connection URL, alter
environment files or secrets, start Podman, or re-run `RUNTIME-007`.

### 53.2 Provisioning Contract

`docs/Provisioning/PostgreSQL_Integration_Environment.md` records the required non-production
database boundary, canonical `DATABASE_URL` input, explicit
`PCI_INTEGRATION_DATABASE=1` marker, secret-handling rules, migration bootstrap, validation
checklist, and `RUNTIME-007` re-entry criteria. Production databases are explicitly forbidden.

The repository has no explicit minimum PostgreSQL version:

```text
MIN_POSTGRES_VERSION = VERSION_REQUIREMENT_NOT_YET_EXPLICIT
TESTED_POSTGRES_VERSION = PostgreSQL 17 (historical Podman evidence)
```

The migration journal remains the ordering source of truth. Its current sequence is `0000` through
`0022`, including the ordered Stage 2 Identity Foundation migrations `0016`, `0017`, `0018`,
`0019`, `0020`, `0021`, and `0022`.

### 53.3 Safe Preflight

`pnpm db:integration:check` first executes the existing migration-integrity check and then
requires a PostgreSQL `DATABASE_URL`, `PCI_INTEGRATION_DATABASE=1`, and an integration-designated
database name. It uses the existing PostgreSQL adapter and verifies readiness, server version,
Drizzle migration count, the five durable tables, named PK/FK/UNIQUE/CHECK constraints, and the
unique partial active Commerce Relationship index.

With `DATABASE_URL` absent, the command exits non-zero with generic guidance; it does not report a
false pass, log a connection URL, or treat a connection failure as an unavailable-test skip. The
existing PostgreSQL integration test keeps its separate canonical gate: absent `DATABASE_URL`
skips, while an available but failing database must fail.

On 2026-08-26, a temporary, isolated local Podman PostgreSQL 17 container was bound only to the
loopback interface. `pnpm db:migrate` and then `pnpm db:integration:check` both passed against it;
the temporary container was removed immediately afterward. The evidence records no host, port,
container identifier, `DATABASE_URL`, username, or password. This validates the provisioning
preflight, but does not provision a persistent integration environment and does not reclassify
`RUNTIME-007`.

Real validation also showed PostgreSQL truncates generated identifiers longer than 63 bytes. The
preflight was corrected to verify PK/FK/UNIQUE/CHECK constraints through PostgreSQL catalog
semantics—source table, type, definition, and FK target—rather than relying on generated FK names.

### 53.4 Runtime and Product Boundary

```text
RUNTIME-007 = BLOCKED_BY_ENVIRONMENT
POSTGRES_APPLICATION_INTEGRATION = NOT_VERIFIED

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

Public API = NOT IMPLEMENTED
Resolver = NOT IMPLEMENTED
QR = NOT IMPLEMENTED
OAuth = NOT IMPLEMENTED
External Platform Runtime Binding = NOT IMPLEMENTED
Event / Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED
```

### 53.5 Validation Evidence

| Validation                        | Result                                                                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provisioning documentation audit  | PASS — requirements, boundaries, security, bootstrap, and re-entry criteria are explicit                                                                                                                       |
| `DATABASE_URL` gate test          | PASS — absence fails closed without false success                                                                                                                                                              |
| Secret leakage audit              | PASS — no provisioned secret recorded, printed, or logged                                                                                                                                                      |
| Migration ordering audit          | PASS — current journal sequence confirmed through `0022`                                                                                                                                                       |
| Schema prerequisite audit         | PASS — current PostgreSQL/Drizzle migration metadata and required constraint checks identified                                                                                                                 |
| Local Podman PostgreSQL preflight | PASS — temporary PostgreSQL 17; `pnpm db:migrate` then `pnpm db:integration:check`; container removed                                                                                                          |
| Scoped `git diff --check`         | PRE-EXISTING FINDINGS ONLY — unrelated historical whitespace in `04_North_Star_End_State.md`, `20_MVP_PRD_VS01.md`, `DEV-027`, and `22_Engineering_Governance.md`; no finding in `DEV-040` or task-owned files |

```text
COMMITTED = NO
```

## 66. DEV-053 / SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-DECISION-001 — Composite Command Architecture Decision

> **Status**: Complete — Founder architecture decision; implementation not started
> **Change Unit**: `DEV-053` / `SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-DECISION-001`
> **Date**: 2026-08-27

### 66.1 Result

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-DECISION-001 = COMPLETE
FOUNDER_DECISION = OPTION_A_APPROVED
SELF_SERVICE_EXTERNAL_RELATIONSHIP_MODEL = COMPOSITE_COMMAND
COMPOSITE_COMMAND_IMPLEMENTATION = NOT STARTED
```

The previous implementation task was blocked because an External Platform Account has no
independent owner or scope field, while Relationship creation requires an authorized account.
Founder resolved that boundary by approving one explicit composite user command rather than
introducing a new ownership relation.

### 66.2 Canonical Composite Command

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Current Internal Identity
        ↓
Owned Commerce Profile
        ↓
CreateMySelfDeclaredExternalRelationship
        ├── create or reuse External Platform Account
        └── create Commerce Relationship
```

The future command input is limited to:

```text
platform
platformAccountId
commerceProfileId
```

The server derives the current Account, active binding, and Internal Identity, then verifies
Profile ownership and non-archived status. The command fixes:

```text
role = OWNER
provenance = SELF_DECLARED
lifecycle = PROPOSED
```

Client-provided `identityId`, `ownerIdentityId`, `accountId`, `role`, `lifecycle`, `provenance`,
and `verified` values are not authority fields.

### 66.3 Persistence and Privacy Decision

External Platform Account and Commerce Relationship remain separate durable facts, created or
reused in one PostgreSQL transaction. A newly created External Account rolls back if Relationship
creation fails; an existing External Account is never deleted by a failed relationship attempt.

```text
EXTERNAL_PLATFORM_ACCOUNT_OWNERSHIP_FIELD = NOT INTRODUCED
INTERNAL_IDENTITY_TO_EXTERNAL_ACCOUNT_RELATION = NOT INTRODUCED
EXTERNAL_ACCOUNT_SCOPE_TABLE = NOT INTRODUCED
MIGRATION = NOT IMPLEMENTED BY THIS DECISION
```

The existing `(platform, platformAccountId)` uniqueness and active-Relationship invariant remain
database authorities. Same-user duplicate composite requests are idempotent. Existing foreign or
unknown External Accounts use generic non-disclosing conflict behavior and never reveal owner,
Profile, or Relationship information. Historical Relationships are retained; historical state does
not become verified by inference.

### 66.4 Implementation Authorization and Boundaries

```text
COMPOSITE_COMMAND = APPROVED_FOR_NEXT_IMPLEMENTATION
PROVENANCE_MODEL = SELF_DECLARED_NOW; PLATFORM_VERIFIED_FUTURE_ONLY
RELATIONSHIP_MUTATION = NOT AUTHORIZED
MANAGER = NOT IMPLEMENTED
DELEGATED_MANAGER = NOT IMPLEMENTED
```

This decision authorizes only the next implementation task for the composite create command,
minimal immutable Relationship provenance persistence if required, private API/UI integration,
and real PostgreSQL verification. It does not authorize OAuth, Platform API, verification runtime,
external ownership proof, credentials, public surfaces, Resolver, QR, events/outbox, or real money.

### 66.5 Validation

```text
SSOT consistency = PASS
identity / Profile ownership boundary = PASS
no direct Identity → External Account ownership relation = PASS
provenance semantics = PASS
public/private boundary = PASS
implementation changes = NONE
COMMITTED = NO
```

### 66.6 Hard Stop

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-IMPLEMENTATION-002 = NOT STARTED
OAUTH = NOT AUTHORIZED
PLATFORM_API = NOT AUTHORIZED
VERIFICATION_RUNTIME = NOT AUTHORIZED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
```

## 65. DEV-052 / COMMERCE-REFERENCE-GENERATION-IMPLEMENTATION-001 — Self-Service Profile + Commerce Reference Atomic Creation

> **Status**: Implementation complete — real PostgreSQL evidence pending environment activation
> **Change Unit**: `DEV-052` / `COMMERCE-REFERENCE-GENERATION-IMPLEMENTATION-001`
> **Date**: 2026-08-27

### 65.1 Result

```text
COMMERCE-REFERENCE-GENERATION-IMPLEMENTATION-001 = COMPLETE
PROFILE_TO_REFERENCE = IMPLEMENTED
```

New private Profile creation resolves the current Internal Identity from the authenticated
server-side Account context. It creates the Profile and its server-generated Commerce Reference
inside one UnitOfWork transaction; no Profile can commit without its Reference.

### 65.2 Generator and Assignment Policy

```text
CSPRNG = Node crypto.randomInt
ALPHABET = 3479ACDEFHJKMNPQRTVWXY
LENGTH = 18
CANONICAL_VALIDATION = createCommerceReference()
MAX_REFERENCE_GENERATION_ATTEMPTS = 8
REFERENCE_LIFECYCLE_ON_CREATE = ASSIGNED
REFERENCE_DISPLAY = XXXXXX-XXXXXX-XXXXXX
```

The generator has no Profile, Identity, Account, or user-input authority. Database uniqueness is
the final collision guard; a unique conflict rolls back the transaction and retries with a new
candidate within the bounded budget. Exhaustion returns a generic retryable error.

### 65.3 Verified Behavior

```text
authenticated Account → current Identity → Profile + C号
repeat Profile creation → distinct Profile and distinct C号
collision → retry candidate without leaking the conflicting value
Reference failure → Profile rollback
archive → Reference retained
client ownerIdentityId / identityId / accountId / commerceReference → rejected
no regenerate / reassign / release / manual assignment path
```

### 65.4 Surfaces and Boundaries

```text
POST /api/v1/private/profiles = PRESERVED AND RETURNS PROFILE + C号
OpenAPI / generated client compatibility = PASS
private UI = CREATES PROFILE AND DISPLAYS CANONICAL C号 WITH COPY
REAL_POSTGRESQL_SELF_SERVICE_PROFILE_REFERENCE = NOT_VERIFIED (DATABASE_URL unavailable in this run)
REAL_BROWSER_SELF_SERVICE_PROFILE_REFERENCE = NOT_VERIFIED
```

No migration was added; existing `commerce_references` primary/unique and Profile foreign-key
constraints remain authoritative. External accounts, relationships, verification, and public
surfaces remain outside this change unit.

### 65.5 Validation

```text
generator tests = PASS
application tests = PASS
security / injection tests = PASS
API integration = PASS
UI typecheck = PASS (existing focused UI test suite retained)
PostgreSQL integration = NOT VERIFIED — skipped because DATABASE_URL was unset
typecheck = PASS
OpenAPI = PASS
```

### 65.6 Preserved Boundaries

```text
External Account creation = NOT IMPLEMENTED
Relationship creation = NOT IMPLEMENTED
OAuth = NOT AUTHORIZED
Verification = NOT AUTHORIZED
Platform API = NOT AUTHORIZED
Public API = NOT AUTHORIZED
Resolver = NOT AUTHORIZED
QR = NOT AUTHORIZED
Event / Outbox = NOT AUTHORIZED
Real Money = NOT AUTHORIZED
COMMITTED = NO
```

## 64. DEV-051 / SELF-SERVICE-ONBOARDING-IMPLEMENTATION-001 — Automatic Identity Initialization

> **Status**: Complete — Account-to-Identity onboarding implementation
> **Change Unit**: `DEV-051` / `SELF-SERVICE-ONBOARDING-IMPLEMENTATION-001`
> **Date**: 2026-08-27

### 64.1 Result

```text
SELF-SERVICE-ONBOARDING-IMPLEMENTATION-001 = COMPLETE
SELF-SERVICE-ONBOARDING = IMPLEMENTED
```

An authenticated Account with no active binding now initializes one independent ACTIVE Internal
Identity and one ACTIVE OWNER AccountIdentityMembership. The authentication Account ID comes only
from the server-side authentication context; client-provided `accountId`, `identityId`, and
`ownerIdentityId` are not onboarding authorities.

### 64.2 Verified Behavior

```text
first login → Identity initialization → ACTIVE OWNER binding
repeat initialization → same Identity and same active binding
concurrent first login → one Identity and one active binding
Identity + binding → one durable PostgreSQL transaction
binding failure → Identity rollback
existing ACTIVE binding → current Identity
SUSPENDED / REVOKED / HISTORICAL binding → fail closed
Profile count after onboarding → 0
```

The existing `account_identity_memberships_active_owner_account_unique` partial unique index remains
the final database concurrency guard. No new migration was required for onboarding behavior.

### 64.3 Surfaces and Boundaries

```text
POST /api/v1/private/onboarding/initialize = IMPLEMENTED
GET /api/v1/private/identity = PRESERVED
private onboarding UI = IMPLEMENTED IN PRIVATE IDENTITY WORKSPACE
OpenAPI / generated client compatibility = PASS
REAL_POSTGRESQL_SELF_SERVICE_ONBOARDING = VERIFIED
REAL_BROWSER_SELF_SERVICE_ONBOARDING = NOT_VERIFIED
```

The first-login UI reports “Welcome”, “Your PCI Identity is ready.” and “Next: Create your first
Commerce Profile”. It does not claim Profile, Commerce Reference, external-account, relationship,
or verification readiness.

### 64.4 Validation

```text
application = PASS
security / IDOR / injection = PASS
API integration = PASS
PostgreSQL first / repeat / concurrent / rollback / status = PASS
typecheck = PASS
lint = PASS
web:typecheck = PASS
db:check = PASS
migration-contract = PASS
import-boundary = PASS
OpenAPI = PASS
git diff --check = PASS (scoped task diff; unrelated pre-existing findings remain)
```

### 64.5 Preserved Boundaries

```text
Profile automatic creation = NOT IMPLEMENTED
Commerce Reference generation = NOT IMPLEMENTED
External Account creation = NOT IMPLEMENTED
Relationship creation = NOT IMPLEMENTED
OAuth = NOT AUTHORIZED
Platform API = NOT AUTHORIZED
Verification = NOT AUTHORIZED
Public API = NOT AUTHORIZED
Resolver = NOT AUTHORIZED
QR = NOT AUTHORIZED
Event / Outbox = NOT AUTHORIZED
Real Money = NOT AUTHORIZED
COMMITTED = NO
```

## 63. DEV-050 / PRIVATE-MVP-SELF-SERVICE-001 — Private Self-Service MVP Architecture Decision Package

> **Status**: Complete — Architecture / Founder Decision Preparation Only
> **Change Unit**: `DEV-050` / `PRIVATE-MVP-SELF-SERVICE-001`
> **Date**: 2026-08-27

### 63.1 Result

```text
PRIVATE-MVP-SELF-SERVICE-001 = COMPLETE
PRIVATE_PRODUCT_MVP = SELF_SERVICE_COMPLETE_CLOSURE
CURRENT_IMPLEMENTATION = READ_ONLY_AND_PARTIAL_SELF_SERVICE_FOUNDATION
SELF_SERVICE_PILOT_READY = NOT YET VERIFIED
```

The decision package defines the required self-service closure for a new, non-preseeded
authenticated user:

```text
Account
        ↓
automatic idempotent Identity + ACTIVE OWNER binding initialization
        ↓
Commerce Profile creation
        ↓
atomic server-generated Commerce Reference assignment
        ↓
self-declared External Platform Account
        ↓
self-declared OWNER Commerce Relationship
```

It explicitly separates user claim, PCI internal durable fact, external platform evidence, and a
verified relationship. User-entered platform account data is not platform ownership proof, and
`SELF_DECLARED` is never rendered or persisted as `VERIFIED`.

### 63.2 Founder Direction Prepared

```text
COMMERCE_REFERENCE_SELF_SERVICE = server-generated only
REFERENCE_USER_SELECTION = NOT AUTHORIZED
REFERENCE_REGENERATION_REASSIGNMENT_RELEASE_DELETE = NOT AUTHORIZED

EXTERNAL_ACCOUNT_SELF_DECLARATION = candidate for separately authorized implementation
RELATIONSHIP_SELF_DECLARATION = candidate for separately authorized implementation
INITIAL_RELATIONSHIP_ROLE = OWNER only
PLATFORM_VERIFICATION = future separate decision
OAUTH = NOT AUTHORIZED
```

The recommended first self-service MVP does not depend on OAuth or a platform API. It creates
truthful internal self-declared facts and leaves the Relationship `PROPOSED` until an independently
approved verification runtime can supply and evaluate external evidence.

### 63.3 Required Implementation Gates

Any later implementation must separately authorize and verify:

- transactionally atomic and idempotent Account → Identity initialization;
- CSPRNG candidate generation, canonical validation, database uniqueness, bounded collision retry,
  and a single Profile + C号 transaction;
- an immutable relationship provenance fact rather than using lifecycle as a provenance proxy;
- non-disclosing duplicate External Account and active-Relationship conflict behavior;
- real PostgreSQL write-flow integration, IDOR/concurrency tests, and authenticated browser
  end-to-end validation before self-service pilot declaration.

### 63.4 Preserved Boundaries

```text
SURFACE-001 THROUGH SURFACE-005 = PRESERVED
RUNTIME-001 THROUGH RUNTIME-007 = PRESERVED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

SURFACE-006 = NOT STARTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
OAUTH = NOT AUTHORIZED
EXTERNAL_PLATFORM_BINDING = NOT AUTHORIZED
EXTERNAL_PLATFORM_VERIFICATION = NOT AUTHORIZED
PLATFORM_API = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
COMMITTED = NO
```

## 62. DEV-049 / SURFACE-005 — Private Commerce Relationship Read-Only Surface

> **Status**: Complete
> **Change Unit**: `DEV-049` / `SURFACE-005`
> **Date**: 2026-08-27

### 62.1 Result

```text
SURFACE-005 = COMPLETE
REAL_POSTGRESQL_SURFACE_005_INTEGRATION = VERIFIED
REAL_POSTGRESQL_SURFACE_005_UI_INTEGRATION = NOT VERIFIED
```

The private read-only authorization chain is:

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Internal Identity
        ↓
Owned Commerce Profiles
        ↓
Commerce Relationships
        ↓
External Platform Accounts
```

Relationship visibility is derived from the server-side owned Profile scope. Client-supplied
`identityId`, `profileId`, `relationshipId`, and `externalPlatformAccountId` values cannot become
authorization subjects. Foreign Relationship detail returns the existing non-disclosing private
not-found response.

### 62.2 Relationship Surface

```text
LIST = IMPLEMENTED
DETAIL = IMPLEMENTED
HISTORY = IMPLEMENTED
PROFILE_GROUPING = IMPLEMENTED
ACCOUNT_SUMMARY = IMPLEMENTED
READ_ONLY = PRESERVED
```

The API and Web workspace present Profile summaries, External Platform Account summaries,
Relationship role, lifecycle, effective time, and durable timestamps. Historical and active
Relationships are both retained and visible, including historical and active records for the same
External Platform Account. Relationship role is presented as Relationship role, not Profile
ownership, and `VERIFIED` is presented neutrally without a platform-ownership claim.

No create, bind, unbind, rebind, transfer, role mutation, lifecycle mutation, delete, purge, OAuth,
verification, or Platform API control is exposed.

### 62.3 API

```text
GET /api/v1/private/commerce-relationships
GET /api/v1/private/commerce-relationships/:relationshipId
```

The private DTO exposes only the approved Relationship, Profile summary, and External Platform
Account summary fields. Internal Identity IDs, Authentication Account IDs, database identifiers,
Relationship internals, credentials, tokens, references, and mutation capabilities are excluded.
Profile and External Platform Account query values are filters over the already-authorized scope;
unsupported Identity and Relationship injection is rejected.

### 62.4 Real PostgreSQL Evidence

An isolated local PostgreSQL 17.10 instance ran in a temporary Podman container. Migration,
integration preflight, and the dedicated API-to-application-to-PostgreSQL suite passed. The suite
verified owned Relationship history, same-account historical plus active records, multiple owned
Profiles, foreign Relationship denial, authorized filters, and an authenticated empty scope. The
temporary container was removed after verification. No connection URL, secret, credential, host,
port, username, or container identifier is recorded.

```text
POSTGRESQL_VERSION = 17.10
POSTGRESQL_INTEGRATION_PREFLIGHT = PASS
POSTGRESQL_MIGRATION = PASS
TEMPORARY_POSTGRESQL_CLEANUP = PASS
```

### 62.5 Validation Evidence

```text
PRIVATE_RELATIONSHIP_APPLICATION_AND_API_TESTS = PASS
PRIVATE_RELATIONSHIP_SECURITY_AND_IDOR_TESTS = PASS
PRIVATE_RELATIONSHIP_UI_TESTS = PASS
PRIVATE_RELATIONSHIP_POSTGRESQL_INTEGRATION = PASS
IDENTITY_INFRASTRUCTURE_TESTS = PASS (86 tests)
DOMAIN_TESTS = PASS (145 tests)
TYPECHECK = PASS
WEB_TYPECHECK = PASS
LINT = PASS
DATABASE_MIGRATION_CHECK = PASS
MIGRATION_CONTRACT_TEST = PASS (2 tests)
IMPORT_BOUNDARY_TEST = PASS (6 tests)
OPENAPI_COMPATIBILITY = PASS
GENERATED_WEB_CLIENT = PASS
SCOPED_GIT_DIFF_CHECK = PASS
```

### 62.6 Preserved Boundaries

```text
SURFACE-001 = PASS
SURFACE-001-VERIFY = PASS
SURFACE-002 = PASS
SURFACE-003 = PASS
SURFACE-004 = PASS
RUNTIME-001 THROUGH RUNTIME-007 = PASS (existing evidence preserved)
IDENTITY-001 THROUGH IDENTITY-003 = PASS (existing evidence preserved)

COMMERCE_RELATIONSHIP_MUTATION = NOT IMPLEMENTED
EXTERNAL_PLATFORM_BINDING = NOT IMPLEMENTED
EXTERNAL_VERIFICATION = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
PLATFORM_API = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
SURFACE-006 = NOT STARTED
COMMITTED = NO
```

Browser-to-temporary-PostgreSQL verification was not established because no stable authenticated
browser fixture is available for this temporary database:

```text
REAL_POSTGRESQL_SURFACE_005_UI_INTEGRATION = NOT VERIFIED
```

## 60. DEV-047 / SURFACE-003 — Private Commerce Reference View / Copy

> **Status**: Complete
> **Change Unit**: `DEV-047` / `SURFACE-003`
> **Date**: 2026-08-27

### 60.1 Result

```text
SURFACE-003 = COMPLETE
REAL_POSTGRESQL_SURFACE_003_INTEGRATION = VERIFIED
REAL_POSTGRESQL_SURFACE_003_UI_INTEGRATION = NOT VERIFIED
```

The read-only authorization chain is:

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Internal Identity
        ↓
CommerceProfile.owningIdentityId
        ↓
Commerce Reference
```

`GET /api/v1/private/profiles/:profileId/reference` uses the Profile ID only as a resource
identifier. It resolves authorization solely from the authenticated Account's active binding and
the Profile's server-side owner. An owned assigned Reference returns its canonical value and
approved grouped display value. A Profile without a Reference returns `NOT_ASSIGNED`; it never
creates, assigns, allocates, or generates one. Foreign Profile access returns the existing
non-disclosing private not-found response, and an arbitrary `identityId` query value has no
authorization effect.

### 60.2 View / Copy Surface

```text
VIEW = IMPLEMENTED
GROUPED_DISPLAY = IMPLEMENTED
COPY_CANONICAL_VALUE = IMPLEMENTED
NO_REFERENCE_EMPTY_STATE = IMPLEMENTED
```

The authenticated Web workspace displays the C号 per Commerce Profile, not per Internal Identity.
It renders the grouped presentation (`3C7M4Q-9RDFHJ-KNTWVY`) and copies the canonical stored
value (`3C7M4Q9RDFHJKNTWVY`). Clipboard copying is browser-only and has no transaction, durable
mutation, event, outbox, tracking, or analytics behavior. Focused presentation logic tests prove
the copied value is canonical. Browser-to-temporary-PostgreSQL integration was not established, so
it is explicitly `NOT VERIFIED`.

### 60.3 Real PostgreSQL Evidence

An isolated local PostgreSQL 17.10 instance ran in a temporary Podman container. Migrations,
integration preflight, and migration idempotence passed before the dedicated suite executed. The
suite verified:

- authenticated Account → active binding → Internal Identity → owned Profile → Reference API;
- owned assigned C号 read with unchanged canonical and grouped display values;
- owned Profile without Reference returns `NOT_ASSIGNED` without persistence side effects;
- cross-account Profile Reference IDOR denial;
- arbitrary Identity query input has no authorization effect.

The temporary PostgreSQL container was removed after the suite. No connection URL, secret,
credential, host, port, username, or container identifier is recorded.

```text
POSTGRESQL_VERSION = 17.10
POSTGRESQL_INTEGRATION_PREFLIGHT = PASS
POSTGRESQL_MIGRATION = PASS
TEMPORARY_POSTGRESQL_CLEANUP = PASS
```

### 60.4 Validation Evidence

```text
PRIVATE_REFERENCE_APPLICATION_TESTS = PASS
PRIVATE_REFERENCE_API_AND_IDOR_TESTS = PASS
PRIVATE_REFERENCE_COPY_PRESENTATION_TEST = PASS
PRIVATE_REFERENCE_POSTGRESQL_INTEGRATION = PASS
OPENAPI_COMPATIBILITY = PASS
GENERATED_WEB_CLIENT = PASS
WEB_TYPECHECK = PASS
TYPECHECK = PASS
LINT = PASS
DATABASE_MIGRATION_CHECK = PASS
MIGRATION_CONTRACT_TEST = PASS
IMPORT_BOUNDARY_TEST = PASS
SCOPED_GIT_DIFF_CHECK = PASS
```

### 60.5 Preserved Boundaries

```text
SURFACE-001 = PASS
SURFACE-001-VERIFY = PASS
SURFACE-002 = PASS
RUNTIME-001 THROUGH RUNTIME-007 = PASS (existing evidence preserved)
IDENTITY-001 THROUGH IDENTITY-003 = PASS (existing evidence preserved)

SURFACE-004 = NOT STARTED
REFERENCE_GENERATION = NOT IMPLEMENTED
REFERENCE_ALLOCATION = NOT IMPLEMENTED
REFERENCE_MUTATION = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
OAUTH = NOT AUTHORIZED
EXTERNAL_PLATFORM_BINDING = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMITTED = NO
```

## 61. DEV-048 / SURFACE-004 — Private External Platform Account View

> **Status**: Complete
> **Change Unit**: `DEV-048` / `SURFACE-004`
> **Date**: 2026-08-27

### 61.1 Result

```text
SURFACE-004 = COMPLETE
REAL_POSTGRESQL_SURFACE_004_INTEGRATION = VERIFIED
REAL_POSTGRESQL_SURFACE_004_UI_INTEGRATION = NOT VERIFIED
```

The read-only authorization chain is:

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Internal Identity
        ↓
Owned Commerce Profiles
        ↓
Commerce Relationships
        ↓
External Platform Accounts
```

Visibility is derived server-side from the current Account's active binding, the current Identity's
owned Profiles, and the durable Commerce Relationships for those Profiles. No Account-to-External-
Platform-Account ownership relation was introduced. `externalPlatformAccountId` is only a resource
selector: a foreign account produces the existing non-disclosing private not-found response.
Arbitrary `identityId`, `profileId`, and `relationshipId` query values have no authorization effect.

### 61.2 External Account View

```text
PRIVATE_EXTERNAL_PLATFORM_ACCOUNT_LIST = IMPLEMENTED
PRIVATE_EXTERNAL_PLATFORM_ACCOUNT_DETAIL = IMPLEMENTED
READ_ONLY = IMPLEMENTED
```

The private API returns only `externalPlatformAccountId`, `platform`, `platformAccountId`, and
`lifecycle`. The authenticated Web workspace shows platform, external account identifier, and
lifecycle; it supports multiple Accounts on the same Platform and an explicit `No external platform
accounts.` empty state. It contains no connect, authorize, verify, bind, unbind, create, transfer,
or lifecycle-mutation control. No credential, OAuth value, platform secret, database row ID,
Profile ID, Identity ID, or Relationship ID is exposed.

### 61.3 Real PostgreSQL Evidence

An isolated local PostgreSQL 17.10 instance ran in a temporary Podman container. Migrations,
integration preflight, and migration idempotence passed before the dedicated suite executed. The
suite verified:

- authenticated Account → active binding → Identity → owned Profile → Relationship → External
  Platform Account private API resolution;
- authorized own-account list and detail reads;
- cross-account detail IDOR denial;
- multiple authorized Accounts, including multiple Accounts on one Platform;
- an empty authorized scope.

The temporary PostgreSQL container was removed after the suite. No connection URL, secret,
credential, host, port, username, or container identifier is recorded. A stable authenticated
browser fixture for the temporary database is not established, so browser UI to real PostgreSQL is
explicitly `NOT VERIFIED`; the API → application → PostgreSQL chain is verified.

```text
POSTGRESQL_VERSION = 17.10
POSTGRESQL_INTEGRATION_PREFLIGHT = PASS
POSTGRESQL_MIGRATION = PASS
PRIVATE_EXTERNAL_PLATFORM_ACCOUNT_POSTGRESQL_INTEGRATION = PASS
TEMPORARY_POSTGRESQL_CLEANUP = PASS
```

### 61.4 Validation Evidence

```text
PRIVATE_EXTERNAL_PLATFORM_ACCOUNT_APPLICATION_TESTS = PASS
PRIVATE_EXTERNAL_PLATFORM_ACCOUNT_API_AND_IDOR_TESTS = PASS
PRIVATE_EXTERNAL_PLATFORM_ACCOUNT_UI_TESTS = PASS
PRIVATE_EXTERNAL_PLATFORM_ACCOUNT_POSTGRESQL_INTEGRATION = PASS
OPENAPI_COMPATIBILITY = PASS
GENERATED_WEB_CLIENT = PASS
WEB_TYPECHECK = PASS
TYPECHECK = PASS
LINT = PASS
DATABASE_MIGRATION_CHECK = PASS
MIGRATION_CONTRACT_TEST = PASS
IMPORT_BOUNDARY_TEST = PASS
SCOPED_GIT_DIFF_CHECK = PASS
```

### 61.5 Preserved Boundaries

```text
SURFACE-001 = PASS
SURFACE-001-VERIFY = PASS
SURFACE-002 = PASS
SURFACE-003 = PASS
RUNTIME-001 THROUGH RUNTIME-007 = PASS (existing evidence preserved)
IDENTITY-001 THROUGH IDENTITY-003 = PASS (existing evidence preserved)

SURFACE-005 = NOT STARTED
COMMERCE_RELATIONSHIP_MUTATION = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
VERIFICATION_RUNTIME = NOT IMPLEMENTED
PLATFORM_API = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMITTED = NO
```

## 58. DEV-045 / SURFACE-001-VERIFY — Real PostgreSQL Integration Verification

> **Status**: Complete
> **Change Unit**: `DEV-045` / `SURFACE-001-VERIFY`
> **Date**: 2026-08-27

### 58.1 Result

```text
SURFACE-001-VERIFY = COMPLETE
REAL_POSTGRESQL_SURFACE_001_INTEGRATION = VERIFIED
SURFACE-001 = FULLY_VERIFIED
```

### 58.2 Isolated PostgreSQL Evidence

An isolated, non-production PostgreSQL 17.10 database ran in a temporary local Podman container.
`PCI_INTEGRATION_DATABASE=1` was set only for the command environment, the database name met the
integration-environment guard, and all migrations were applied before verification. Connection
secrets, host, port, credentials, and container identifiers are intentionally absent from this log.

```text
PNPM_DB_INTEGRATION_CHECK = PASS
PNPM_DB_MIGRATE = PASS
POSTGRESQL_VERSION = 17.10
TEMPORARY_POSTGRESQL_CLEANUP = PASS
```

### 58.3 Real SURFACE-001 Verification

The dedicated PostgreSQL suite passed six real-database tests:

- initial onboarding writes and rehydrates an Internal Identity plus active OWNER binding;
- forced active-binding persistence failure rolls back the preceding Identity insert;
- two concurrent onboarding requests converge on one canonical Identity and one active binding;
- PostgreSQL partial active-account uniqueness rejects a second active binding for the same Account;
- valid binding lifecycle changes persist and canonical transitions reject `REVOKED → ACTIVE` and
  `HISTORICAL → ACTIVE`;
- authenticated private API resolves Account → active binding → Identity, returns only the current
  Account's Identity, ignores an arbitrary foreign `identityId` parameter, and returns
  `403 active_identity_binding_not_found` for an Account with no binding.

The verification additionally confirmed PK/FK/NOT NULL/OWNER CHECK/lifecycle CHECK/partial UNIQUE
enforcement through the migrated PostgreSQL schema and canonical row rehydration into
`AccountIdentityMembership`, `Identity`, and `PrivateIdentityView`.

```text
SURFACE_001_POSTGRESQL_INTEGRATION_SUITE = PASS (6 tests)
SAME_ACCOUNT_ACCESS = PASS
FOREIGN_IDENTITY_ACCESS = FAIL CLOSED
ARBITRARY_IDENTITY_PARAMETER = FAIL CLOSED
MISSING_BINDING = FAIL CLOSED
UI_REAL_DB_INTEGRATION = NOT VERIFIED
```

No authenticated browser fixture was established for the temporary database, so browser UI to
real-PostgreSQL verification is explicitly not claimed. The private API → application →
PostgreSQL chain is verified.

### 58.4 Regression and Boundaries

```text
IDENTITY_INFRASTRUCTURE_TESTS = PASS (85 tests)
DOMAIN_TESTS = PASS (144 tests)
SURFACE_001_FOCUSED_TESTS = PASS (18 tests)
LINT = PASS
TYPECHECK = PASS
DATABASE_MIGRATION_CHECK = PASS
MIGRATION_CONTRACT_TEST = PASS (2 tests)
IMPORT_BOUNDARY_TEST = PASS (6 tests)
SCOPED_GIT_DIFF_CHECK = PASS

RUNTIME-001 THROUGH RUNTIME-007 = PASS (existing evidence preserved)
IDENTITY-001 THROUGH IDENTITY-003 = PASS (existing evidence preserved)

SURFACE-002 = NOT STARTED
PROFILE_MANAGEMENT = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
OAUTH = NOT AUTHORIZED
EXTERNAL_PLATFORM_BINDING = NOT AUTHORIZED
RECOVERY = NOT IMPLEMENTED
ACCOUNT_MERGE = NOT IMPLEMENTED
IDENTITY_MERGE_SPLIT = NOT IMPLEMENTED
REAL_MONEY = NOT AUTHORIZED

COMMITTED = NO
```

---

## 54. DEV-041 / RUNTIME-007 — Private Runtime Durable PostgreSQL Integration Verification

> **Status**：Complete — Real PostgreSQL Application Integration Verified
> **Change Unit**：`DEV-041` / `RUNTIME-007`
> **Date**：2026-08-27

### 54.1 Result

```text
RUNTIME-007 = COMPLETE
POSTGRES_APPLICATION_INTEGRATION = VERIFIED

PostgreSQL = 17.10
INTEGRATION_DATABASE = temporary, isolated, non-production
DATABASE_URL = supplied only to the verification process and not recorded
```

The verification used the real private runtime path:

```text
Application
    ↓
Repository Port
    ↓
PostgreSQL Adapter
    ↓
Real PostgreSQL
```

`pnpm db:migrate` and `pnpm db:integration:check` both passed before the PostgreSQL integration
suite ran. The temporary database was bound only for the local verification, did not access
production data, and was removed after all evidence was collected.

### 54.2 Durable Facts, Rehydration, and Constraints

The real PostgreSQL application integration suite passed seven cases covering all five canonical
durable facts:

```text
Internal Identity = PASS
Commerce Profile = PASS
Commerce Reference = PASS
External Platform Account = PASS
Commerce Relationship = PASS
```

Each fact was created through its private application service, persisted by its PostgreSQL
repository adapter, read back through the repository port, and rehydrated by the canonical domain
constructor/rehydrator. The suite verifies:

```text
Identity → Profile → supplied Commerce Reference
External Platform Account → Commerce Relationship → Commerce Profile
```

PostgreSQL enforcement was evidenced for:

```text
PK = PASS
FK = PASS
UNIQUE(commerce_profile_id) = PASS
UNIQUE(commerce_reference) = PASS
UNIQUE(platform, platform_account_id) = PASS
CHECK lifecycle / relationship role = PASS
partial UNIQUE ACTIVE relationship = PASS
```

Unknown Profile ownership, Reference-to-unknown-Profile, and
Relationship-to-unknown-Account/Profile all fail closed, with database foreign-key violations
verified directly where required. `instagram/A`, `instagram/B`, and `youtube/A` remain distinct;
a duplicate `instagram/A` is rejected by PostgreSQL.

### 54.3 Transaction, History, and Conditional Write Evidence

```text
Profile + supplied Reference assignment = atomic
Reference failure = rollback; no durable partial assignment

Suspended Relationship → HISTORICAL
Verified replacement → ACTIVE
= same PostgreSQL transaction

Replacement failure = rollback
old Relationship remains SUSPENDED and readable
```

The historical relationship preserves its immutable identifier, account target, profile target,
role, effective time, and creation time. It remains readable after historicalization. The suite
also confirms an archived Profile does not release its Commerce Reference: the Reference remains
durably `PERMANENTLY_RESERVED` and cannot be reassigned.

Conditional lifecycle writes were exercised through real PostgreSQL repositories for Internal
Identity, Commerce Profile, External Platform Account, and Commerce Relationship. Two writers
with the same expected lifecycle yield exactly one success and one lifecycle conflict, preventing
lost updates.

### 54.4 Boundaries and Compatibility

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

Public API = NOT IMPLEMENTED
Resolver = NOT IMPLEMENTED
QR = NOT IMPLEMENTED
OAuth = NOT IMPLEMENTED
External Platform Verification = NOT IMPLEMENTED
External Platform Runtime Binding = NOT IMPLEMENTED
Event / Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED

REQUEST = UNCHANGED
RESERVATION = UNCHANGED
CONTRACT = UNCHANGED
```

No product surface, OAuth, resolver, QR, external platform runtime, event/outbox, real-money
capability, VS-01 backfill, or Commerce Pattern change was introduced.

### 54.5 Validation Evidence

| Validation                                                                                   | Result           |
| -------------------------------------------------------------------------------------------- | ---------------- |
| `pnpm db:migrate`                                                                            | PASS             |
| `pnpm db:integration:check`                                                                  | PASS             |
| `pnpm vitest run tests/persistence/private-identity-foundation-postgres.integration.test.ts` | PASS — 7 tests   |
| `pnpm vitest run modules/identity-infrastructure/`                                           | PASS — 85 tests  |
| `pnpm test:domain`                                                                           | PASS — 144 tests |
| `pnpm typecheck`                                                                             | PASS             |
| `pnpm lint`                                                                                  | PASS             |
| `pnpm vitest run tests/governance/import-boundaries.test.ts`                                 | PASS — 6 tests   |
| `pnpm db:check`                                                                              | PASS             |
| `pnpm vitest run tests/persistence/migration-contract.test.ts`                               | PASS — 2 tests   |
| Temporary PostgreSQL container cleanup                                                       | PASS             |

```text
RUNTIME-001 = PASS
RUNTIME-002 = PASS
RUNTIME-003 = PASS
RUNTIME-004 = PASS
RUNTIME-005 = PASS
RUNTIME-006 = PASS

COMMITTED = NO
```

## 55. DEV-042 / PCI-STAGE2-RUNTIME-CLOSURE-001 — Runtime Foundation Closure and Next-Surface Decision Package

> **Status**：Complete — Stage 2 Runtime Foundation Closed; no Product Surface authorized
> **Change Unit**：`DEV-042` / `PCI-STAGE2-RUNTIME-CLOSURE-001`
> **Date**：2026-08-27

### 55.1 Closure Result

```text
PCI-STAGE2-RUNTIME-CLOSURE-001 = COMPLETE
STAGE_2_RUNTIME_FOUNDATION = COMPLETE

RUNTIME-007 = COMPLETE
POSTGRES_APPLICATION_INTEGRATION = VERIFIED
PostgreSQL = 17.10
```

The closure audit reconfirmed the complete private runtime path:

```text
Domain Contract
    ↓
Repository Port
    ↓
PostgreSQL Adapter
    ↓
Private Application Runtime
    ↓
Real PostgreSQL Integration
```

| Durable fact              | Domain | Persistence | Private Runtime | Real PostgreSQL |
| ------------------------- | ------ | ----------- | --------------- | --------------- |
| Internal Identity         | PASS   | PASS        | PASS            | PASS            |
| Commerce Profile          | PASS   | PASS        | PASS            | PASS            |
| Commerce Reference        | PASS   | PASS        | PASS            | PASS            |
| External Platform Account | PASS   | PASS        | PASS            | PASS            |
| Commerce Relationship     | PASS   | PASS        | PASS            | PASS            |

### 55.2 Canonical Graph, Invariants, and Lifecycle Boundary

```text
Authentication Account
        ≠
Internal Identity
        │
        └── 1:N Commerce Profiles
                    ├── 0..1 Commerce Reference
                    └── 0..N Commerce Relationships
                              ▲
                              │
                        External Platform Account
```

```text
Commerce Relationship
= External Platform Account ↔ Commerce Profile historical binding
```

The audited invariants remain:

```text
Identity ID / Profile ID / Profile owner = immutable
1 Identity : N Profiles

1 Profile : 0..1 Reference
Reference = unique, immutable, permanently reserved, never reusable

(platform, platform_account_id) = unique
External Account identity = immutable

Relationship account target / profile target / role = immutable
Historical relationships = retained and readable
max 1 ACTIVE relationship per External Platform Account
```

No automatic cross-aggregate cascade was introduced. Identity, Profile, External Account, and
Relationship lifecycles remain independent except for explicit private orchestration. Archiving a
Profile does not release its Reference or delete Relationships.

### 55.3 Runtime, Transaction, Error, and Namespace Audit

The private application services depend on domain contracts, repository ports, clocks, and the
Identity Foundation transaction abstraction. Targeted import-boundary audit found no PostgreSQL
driver, Drizzle, SQL schema, HTTP, OpenAPI, OAuth, resolver, or QR dependency in the private
Identity Foundation application services or domain contracts.

```text
Profile + supplied Commerce Reference = explicit transaction
Relationship historicalization + verified replacement = explicit transaction
reference failure = rollback
replacement failure = rollback
conditional lifecycle writes = conflict, not lost update
```

Application error mapping distinguishes:

```text
not_found
conflict
validation
invalid_state = conflict category / identity_foundation_invalid_state code
persistence_failure = unavailable category / identity_foundation_persistence_failure code
```

The ID namespace audit found branded canonical ID types and canonical rehydrators across the five
facts. No unsafe production `as unknown as` or `as string` escape hatch was found in the private
runtime/domain path. The only targeted findings were test-only narrowing after the
`DATABASE_URL` gate and a malformed-input domain test fixture.

### 55.4 PostgreSQL Evidence and Compatibility

`DEV-041 / RUNTIME-007` remains the real PostgreSQL evidence: migrations, PK, FK, UNIQUE, CHECK,
partial `ACTIVE` uniqueness, rehydration, reference atomicity, relationship replacement rollback,
and conditional lifecycle updates all passed against an isolated temporary PostgreSQL 17.10
database. The container was removed after evidence collection.

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

REQUEST = UNCHANGED
RESERVATION = UNCHANGED
CONTRACT = UNCHANGED
```

### 55.5 Boundary Matrix and Next Founder Gate

| Layer                             | Status         |
| --------------------------------- | -------------- |
| Domain Contracts                  | COMPLETE       |
| Durable Persistence               | COMPLETE       |
| Repository Ports                  | COMPLETE       |
| PostgreSQL Adapters               | COMPLETE       |
| Private Application Runtime       | COMPLETE       |
| Real PostgreSQL Integration       | VERIFIED       |
| Public API                        | NOT AUTHORIZED |
| Public Resolver                   | NOT AUTHORIZED |
| QR Runtime                        | NOT AUTHORIZED |
| OAuth                             | NOT AUTHORIZED |
| External Platform Binding Runtime | NOT AUTHORIZED |
| Verification Runtime              | NOT AUTHORIZED |
| Event / Outbox                    | NOT AUTHORIZED |
| Real Money                        | NOT AUTHORIZED |

The next-surface Founder package is:

```text
docs/07_Product_Architecture/24_Private_Product_Surface_Decision_Package.md
```

It separates an authenticated private user surface from a public anonymous surface, requires a
separate `ACCOUNT-IDENTITY-BINDING` decision, and does not authorize implementation.

### 55.6 Engineering Verification Scope

Runtime Foundation Verification is supported by the targeted RUNTIME-007 PostgreSQL evidence and
the scoped domain, application, persistence, typecheck, lint, import-boundary, migration-contract,
and database checks. It is not a claim that every repository-wide Vitest or Playwright suite has
passed: the documented full-suite timeout, Playwright-state, and unrelated historical-whitespace
issues remain separate engineering-stability concerns.

```text
Public API = NOT AUTHORIZED
Public Resolver = NOT AUTHORIZED
QR Runtime = NOT AUTHORIZED
OAuth = NOT AUTHORIZED
External Platform Binding Runtime = NOT AUTHORIZED
Verification Runtime = NOT AUTHORIZED
Event / Outbox = NOT AUTHORIZED
Real Money = NOT AUTHORIZED

COMMITTED = NO
```

## 56. DEV-043 / PRIVATE-SURFACE-ENTRY-001 — Account–Identity Binding and Private Surface Architecture

> **Status**：Complete — Architecture Decision Preparation; Founder approval required before implementation
> **Change Unit**：`DEV-043` / `PRIVATE-SURFACE-ENTRY-001`
> **Date**：2026-08-27

### 56.1 Result

```text
PRIVATE-SURFACE-ENTRY-001 = COMPLETE
ACCOUNT-IDENTITY-BINDING = APPROVED FOR DESIGN
PRIVATE_PRODUCT_SURFACE_A = APPROVED FOR DESIGN
PRIVATE_PRODUCT_SURFACE_B = APPROVED FOR DESIGN
PRIVATE_PRODUCT_SURFACE_C = APPROVED FOR DESIGN
PRIVATE_PRODUCT_SURFACE_D = APPROVED FOR DESIGN
PRIVATE_PRODUCT_SURFACE_E = APPROVED FOR DESIGN
```

The formal decision package is:

```text
docs/07_Product_Architecture/25_Account_Identity_Binding_and_Private_Surface_Decision_Package.md
```

### 56.2 Scope and Evidence

This change unit is documentation-only. It defines the recommended explicit
`AccountIdentityBinding` relationship, binding lifecycle, recovery/merge/split boundaries, the
authorization subject chain, the responsibilities and limits of Private Product Surfaces A–E,
the complete authorization matrix, mutable/immutable matrix, dependency graph, MVP order, and
Founder decision list.

No database migration, new table, application service, Runtime-008, authentication provider,
session implementation, HTTP/OpenAPI contract, UI, OAuth, public resolver, QR runtime, external
verification, event/outbox, payment, or real-money change was introduced by this change unit.

### 56.3 Boundary Audits

```text
DOCUMENT_CONSISTENCY_AUDIT = PASS
IDENTITY_TERMINOLOGY_AUDIT = PASS
AUTHORIZATION_BOUNDARY_AUDIT = PASS
SURFACE_DEPENDENCY_AUDIT = PASS
VS01_COMPATIBILITY_AUDIT = PASS
PUBLIC_PRIVATE_BOUNDARY_AUDIT = PASS
NO_NEW_RUNTIME_AUDIT = PASS
SCOPED_GIT_DIFF_CHECK = PASS
```

The current working tree contains pre-existing uncommitted Stage 2 implementation artifacts.
They were not modified by `DEV-043`; the package explicitly records that future Account–Identity
runtime and Private Surface implementation remain unauthorized until Founder approval.

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMITTED = NO
```

## 57. DEV-044 / SURFACE-001 — Account–Identity Binding and Private Identity Read-Only Surface

> **Status**: Complete
> **Change Unit**: `DEV-044` / `SURFACE-001`
> **Date**: 2026-08-27

### 57.1 Result

```text
SURFACE-001 = COMPLETE
```

The implementation establishes:

```text
Authenticated Account
        ↓
Active AccountIdentityBinding
        ↓
Internal Identity
        ↓
Private Identity Read-Only Surface
```

`Authentication Account ≠ Internal Identity`. An Account has `0..N` historical bindings and at
most one `ACTIVE` binding; an Internal Identity may have multiple Account bindings. The only
binding authority is `OWNER`. Binding targets and authority are immutable; lifecycle changes use
dedicated domain transitions and history is retained.

### 57.2 Runtime, Authorization, and Surface Evidence

- `AccountIdentityMembership` is the existing implementation name for the approved
  `AccountIdentityBinding` domain fact and is persisted in
  `account_identity_memberships`.
- PostgreSQL constraints include the Identity FK, OWNER-only check, lifecycle check, revocation
  consistency check, and a partial unique index that allows at most one `ACTIVE` binding per
  Account.
- Initial onboarding creates Internal Identity plus OWNER binding within the existing
  Unit-of-Work transaction. Retried onboarding returns the existing active binding target; a
  binding persistence failure rolls back Identity creation.
- `CurrentUserIdentityService` resolves authenticated `AccountContext → ACTIVE binding →
Internal Identity` and fails closed when the active binding is absent.
- `GET /api/v1/private/identity` is authenticated and returns only the product DTO
  `{ identityId, status, createdAt }`. It does not accept an Identity ID as an authorization
  input and does not expose binding IDs, credential data, or persistence records.
- The authenticated private UI displays Identity ID, lifecycle status, and creation date only.
  It provides no rename, delete, transfer, merge, split, Profile, Reference, or platform action.
- Focused API tests prove Account A receives Identity A even when it supplies Identity B as an
  ignored query value, while an authenticated Account without an active binding receives
  authorization failure.

### 57.3 Validation Evidence

```text
APPLICATION_PERSISTENCE_SECURITY_AND_PRIVATE_API_TESTS = PASS (18 tests)
IDENTITY_INFRASTRUCTURE_TESTS = PASS (85 tests)
DOMAIN_TESTS = PASS (144 tests)
LINT = PASS
DATABASE_MIGRATION_CHECK = PASS
MIGRATION_CONTRACT_TEST = PASS (2 tests)
IMPORT_BOUNDARY_TEST = PASS (6 tests)
TYPECHECK = PASS
WEB_TYPECHECK = PASS
OPENAPI_GENERATION = PASS
SCOPED_GIT_DIFF_CHECK = PASS
```

At the time of this initial implementation record, the focused PostgreSQL integration suite was
invoked but skipped because both `DATABASE_URL` and `PCI_INTEGRATION_DATABASE` were unset on
August 27, 2026. The later isolated real-PostgreSQL verification in `DEV-045` supersedes this
verification status:

```text
REAL_POSTGRESQL_SURFACE_001_INTEGRATION = VERIFIED (see DEV-045)
```

The full-repository `git diff --check` reports three pre-existing, unrelated trailing-whitespace
findings in product/governance documents. The SURFACE-001 scoped diff check passes.

### 57.4 Preserved Boundaries

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

REQUEST = UNCHANGED
RESERVATION = UNCHANGED
CONTRACT = UNCHANGED

PROFILE_MANAGEMENT = NOT IMPLEMENTED
REFERENCE_MUTATION = NOT IMPLEMENTED
EXTERNAL_PLATFORM = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
PUBLIC_API = NOT IMPLEMENTED
PUBLIC_RESOLVER = NOT IMPLEMENTED
QR = NOT IMPLEMENTED
EVENT_OUTBOX = NOT IMPLEMENTED
REAL_MONEY = NOT AUTHORIZED
RECOVERY = NOT IMPLEMENTED
ACCOUNT_MERGE = NOT IMPLEMENTED
IDENTITY_MERGE_SPLIT = NOT IMPLEMENTED

COMMITTED = NO
```

## 59. DEV-046 / SURFACE-002 — Private Commerce Profile Management

> **Status**: Complete
> **Change Unit**: `DEV-046` / `SURFACE-002`
> **Date**: 2026-08-27

### 59.1 Result

```text
SURFACE-002 = COMPLETE
REAL_POSTGRESQL_SURFACE_002_INTEGRATION = VERIFIED
```

The implementation establishes the required private authorization chain:

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Internal Identity
        ↓
Commerce Profile.owningIdentityId
```

Only the resolved current Identity can list, create, read, update, suspend, archive, or reactivate
its own Commerce Profiles. Foreign Profile reads and mutations return the existing non-disclosing
private not-found response. A client-supplied `identityId` query value does not change owner scope,
and `owningIdentityId` is not accepted by the request DTO.

### 59.2 Private Profile Management Surface

```text
LIST = IMPLEMENTED
CREATE = IMPLEMENTED
READ = IMPLEMENTED
UPDATE displayName = IMPLEMENTED
SUSPEND = IMPLEMENTED
ARCHIVE = IMPLEMENTED
REACTIVATE suspended Profile = IMPLEMENTED
```

The private API exposes authenticated-only `/api/v1/private/profiles` routes for those use cases.
The product DTO returns Profile ID, display name, lifecycle, creation time, and update time; it
does not return the owner Identity, Reference, relationship, platform, credential, or persistence
internals. The authenticated web workspace supports the same authorized operations and never
selects an authorization Identity in the client.

Profile ID, `owningIdentityId`, Commerce Reference, and `createdAt` remain immutable. Lifecycle
uses the existing canonical transitions:

```text
ACTIVE → SUSPENDED | ARCHIVED
SUSPENDED → ACTIVE | ARCHIVED
ARCHIVED → no reactivation
```

The canonical persistence write now uses the Profile's prior `updatedAt` as an explicit
optimistic-concurrency condition for presentation and lifecycle updates. A same-version lifecycle
race has exactly one durable success and one conflict; the real PostgreSQL suite verifies this
database-backed behavior.

### 59.3 Real PostgreSQL Evidence

An isolated local PostgreSQL 17.10 instance was created in a temporary Podman container. The
integration preflight and migrations passed before the real suite executed. The suite verified:

- Profile create, read, display-name update, lifecycle persistence, and canonical rehydration;
- same-version conditional lifecycle concurrency at the PostgreSQL boundary;
- current-Account ownership enforcement and cross-account IDOR denial for read, update, suspend,
  and archive;
- owner-injection rejection and ignored arbitrary Identity query input;
- missing active binding fail-closed through the private API.

The temporary container was removed after verification. No connection URL, secret, credential,
host, port, or container identifier is recorded.

```text
POSTGRESQL_VERSION = 17.10
POSTGRESQL_INTEGRATION_PREFLIGHT = PASS
POSTGRESQL_MIGRATION = PASS
TEMPORARY_POSTGRESQL_CLEANUP = PASS
```

### 59.4 Validation Evidence

```text
IDENTITY_INFRASTRUCTURE_TESTS = PASS (86 tests)
DOMAIN_TESTS = PASS (145 tests)
PRIVATE_PROFILE_APPLICATION_AND_API_TESTS = PASS
PRIVATE_PROFILE_PERSISTENCE_TESTS = PASS
PRIVATE_PROFILE_POSTGRESQL_INTEGRATION = PASS (3 tests)
TYPECHECK = PASS
WEB_TYPECHECK = PASS
LINT = PASS
DATABASE_MIGRATION_CHECK = PASS
MIGRATION_CONTRACT_TEST = PASS (2 tests)
IMPORT_BOUNDARY_TEST = PASS (6 tests)
OPENAPI_COMPATIBILITY = PASS
GENERATED_WEB_CLIENT = PASS
SCOPED_GIT_DIFF_CHECK = PASS
```

### 59.5 Preserved Boundaries

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

SURFACE-001 = PASS
SURFACE-001-VERIFY = PASS
RUNTIME-001 THROUGH RUNTIME-007 = PASS (existing evidence preserved)
IDENTITY-001 THROUGH IDENTITY-003 = PASS (existing evidence preserved)

SURFACE-003 = NOT STARTED
PROFILE_OWNERSHIP_TRANSFER = NOT IMPLEMENTED
COMMERCE_REFERENCE_MUTATION = NOT IMPLEMENTED
EXTERNAL_PLATFORM_BINDING = NOT IMPLEMENTED
COMMERCE_RELATIONSHIP_MUTATION = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED

COMMITTED = NO
```

## 67. DEV-054 / SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-IMPLEMENTATION-002

> **Change Unit**: `DEV-054` / `SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-IMPLEMENTATION-002`

### 67.1 Result

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-IMPLEMENTATION-002 = BLOCKED
SELF_SERVICE_EXTERNAL_RELATIONSHIP_MODEL = COMPOSITE_COMMAND
```

### 67.2 Implemented Boundary

The authenticated private command accepts only `platform`, `platformAccountId`, and
`commerceProfileId`. It resolves the current Identity from the active AccountIdentityBinding and
revalidates ownership and lifecycle of the selected Profile inside the Unit of Work. It then creates
or reuses the External Platform Account and creates one OWNER / SELF_DECLARED / PROPOSED Commerce
Relationship. No Identity-to-External-Account ownership field or direct foreign key was introduced.

The External Account and Relationship are separate durable facts in one PostgreSQL transaction. A
new account rolls back if relationship creation fails; an existing account is preserved. Database
uniqueness plus bounded repository conflict handling provide concurrent account deduplication and
same-target relationship idempotency. Foreign account conflicts remain non-disclosing.

### 67.3 Validation Evidence

```text
DOMAIN_AND_APPLICATION_TESTS = PASS
API_RUNTIME_AND_OPENAPI = PASS
OPENAPI_GENERATED_WEB_CLIENT = PASS
USER_FACING_COPY_GOVERNANCE = PASS
TYPECHECK = PASS
WEB_TYPECHECK = PASS
LINT = PASS
DB_CHECK = PASS

REAL_POSTGRESQL_SELF_SERVICE_EXTERNAL_RELATIONSHIP = BLOCKED (DATABASE_URL and PCI_INTEGRATION_DATABASE are not configured)
REAL_BROWSER_SELF_SERVICE_FULL_JOURNEY = NOT_VERIFIED
PILOT_READINESS = NOT_VERIFIED
```

### 67.4 Preserved Boundaries

```text
PLATFORM_VERIFIED = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
PLATFORM_API = NOT IMPLEMENTED
VERIFICATION_RUNTIME = NOT IMPLEMENTED
MANAGER = NOT IMPLEMENTED
DELEGATED_MANAGER = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
MIGRATION = MINIMAL PROVENANCE + IDEMPOTENCY INDEX ONLY
COMMITTED = NO
```

## 69. PCI-CONTROLLED-EXTERNAL-PILOT-READINESS-001

> **Change Unit**: `PCI-CONTROLLED-EXTERNAL-PILOT-READINESS-001`
> **Review Date**: 2026-08-28

This is a Controlled External Pilot readiness review only. It does not authorize Pilot activation,
Commercial Launch, Payment, Settlement, Refund, Platform Verification, OAuth, Manager, Marketplace,
CRM, or Real Money.

```text
SELF_SERVICE_COMPLETE_CLOSURE = READY_FOR_PILOT
CONTROLLED_EXTERNAL_PILOT_READINESS = BLOCKED
PILOT_TECHNICAL_PACKAGE = READY
PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT DECLARED
REAL_MONEY_ENABLED = false
TASK_ACCEPTANCE = PASS
```

The review confirms that Acceptance-004 supplied real Supabase Auth, real private API, real
PostgreSQL, and real authenticated browser evidence for Account authentication, Identity
onboarding, owned Commerce Profile, server-generated C号, External Platform Account, and
SELF_DECLARED / OWNER / PROPOSED Relationship closure.

Existing Request, Reservation, Contract, Completion, Earnings Projection, and Wallet Projection
materials remain application, API, browser simulation, fixture, or operations-preparation evidence
as applicable. They are not reported as real external Creator usage. Real Creator usage is still
required before an actual controlled external Pilot can be considered executed.

The minimum Pilot scope is limited to Founder-approved real Creators and coordinated Customers using
existing Request, Reservation, or Contract patterns. Data must be isolated in a dedicated Pilot
database and Auth environment with stable HTTPS, DNS/TLS, logs, audit/correlation retention, and
backup/restore ownership. Participants may operate only their own private facts. `SELF_DECLARED`
must remain distinct from `PLATFORM_VERIFIED`; `REAL_MONEY_ENABLED` remains exactly `false`.

Current existing operational preflight evidence:

```text
pilot-preflight = BLOCKED
pilot:activate:preflight = BLOCKED
```

The blockers are external deployment/environment inputs, named operator/cohort, evidence-retention
ownership, and explicit Founder activation. The local Podman PostgreSQL Acceptance database is not
a substitute for a Controlled External Pilot environment. No product implementation gap was
authorized or created by this review.

See `docs/08_Execution/23_Controlled_External_Pilot_Readiness_Review.md` for the scope, evidence
matrix, observability contract, safety boundaries, success criteria, stop/exit criteria, Founder
decisions, and exact next action.

## 70. PCI-CONTROLLED-EXTERNAL-PILOT-PROVISIONING-001

> **Change Unit**: `PCI-CONTROLLED-EXTERNAL-PILOT-PROVISIONING-001`
> **Review Date**: 2026-08-28

This provisioning task checks and prepares the external Pilot environment only. It does not
activate or start a Pilot, change Commercial Launch, or enable Real Money.

```text
PILOT_ENVIRONMENT_PROVISIONED = BLOCKED
PILOT_TECHNICAL_ENVIRONMENT = BLOCKED
PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT_DECLARED
REAL_MONEY_ENABLED = false
PRODUCT_GAP = NOT_AUTHORIZED
```

The repository provisioning tooling is available: Podman/Compose, the external Pilot Compose
definition, migration runner, `pilot-preflight`, activation preflight, deployment, and
backup/restore scripts. No provisioning was executed because the current shell has no
Founder/Operations inputs for the dedicated deployment target, Pilot PostgreSQL, Pilot Supabase
project, domain/DNS/TLS, logging/audit, backup/restore ownership, Pilot ID/state, operator, or
cohort.

The local Acceptance PostgreSQL and Acceptance Supabase environment are not reused as Pilot
resources. No Pilot container, database, Auth project, domain, TLS, state file, evidence directory,
or real Creator session was created. Invoking the existing checks without inputs produced:

```text
pilot-preflight = BLOCKED
pilot:activate:preflight = BLOCKED
```

The exact provisioning checklist and next command sequence are recorded in
`docs/08_Execution/23_Controlled_External_Pilot_Readiness_Review.md`, section 15. Activation
remains a separate Founder-authorized task.

## 68. SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-003

> **Change Unit**: `SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-003`

### 68.1 Result

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-003 = BLOCKED
SELF_SERVICE_COMPLETE_CLOSURE = NOT READY FOR PILOT
TASK_ACCEPTANCE = BLOCKED
REAL_POSTGRES_ACCEPTANCE = PASS
AUTHENTICATED_BROWSER_FULL_JOURNEY = NOT_VERIFIED
```

### 68.2 PostgreSQL Environment

Founder-approved local Podman PostgreSQL was started as an isolated acceptance dependency using
`docker.io/library/postgres:17`, database `pci_integration`, and host port `55433`. Credentials and
container identifiers are intentionally not recorded in project evidence.

```text
POSTGRESQL_VERSION = 17.10
POSTGRESQL_INTEGRATION_PREFLIGHT = PASS
POSTGRESQL_MIGRATION = PASS
DATABASE_NAME_POLICY = PASS (dedicated name contains integration)
TEMPORARY_CONTAINER = RUNNING FOR ACCEPTANCE
```

### 68.3 Acceptance Evidence

```text
IDENTITY_ONBOARDING_POSTGRES = PASS (6 tests)
PROFILE_AND_COMMERCE_REFERENCE_POSTGRES = PASS (6 tests)
PRIVATE_SELF_SERVICE_APPLICATION_AND_API = PASS (41 tests)
CONTRACT_AND_MIGRATION_TESTS = PASS (22 tests)
BUILD = PASS
LINT = PASS
WEB_TYPECHECK = PASS
FIXTURE_BROWSER_REGRESSION = PASS (3 tests; not real authenticated evidence)
```

The real PostgreSQL run found and fixed one concurrency defect: a concurrent onboarding request
could observe a committed historical binding decision after the competing transaction had created
the ACTIVE binding. The recovery path now rechecks the ACTIVE binding while preserving fail-closed
authorization for SUSPENDED, REVOKED, and HISTORICAL bindings. The focused PostgreSQL and
application tests pass after the fix.

The PostgreSQL relationship foundation test `SURFACE-005` has one unrelated fixture failure: its
`createRelationshipForExistingAccount` helper does not create the external account supplied to it,
so the repository correctly returns `ExternalPlatformAccountAlreadyExistsError` when the preceding
fixture attempts to create the same `(platform, platformAccountId)`. This is recorded as an
unrelated engineering regression and is not used as evidence for or against the self-service
composite command.

### 68.4 Gate Matrix

```text
REAL_POSTGRES_INTEGRATION = PASS
IDENTITY_ONBOARDING = PASS
PROFILE_PLUS_C号 = PASS
EXTERNAL_ACCOUNT = PASS (focused application/API evidence)
SELF_DECLARED_RELATIONSHIP = PASS (focused application/API evidence)
TRANSACTIONALITY = PASS (PostgreSQL focused evidence)
IDEMPOTENCY = PASS (PostgreSQL focused evidence)
DUPLICATE_PRIVACY = PASS (application/API evidence)
IDOR = PASS (application/API evidence)
HORIZONTAL_ESCALATION = PASS (application/API evidence)
CONCURRENCY = PASS (PostgreSQL onboarding/profile/reference evidence)
PROVENANCE_SEMANTICS = PASS (application/API/contract evidence)
PUBLIC_BOUNDARY = PRESERVED
NO_UNAUTHORIZED_EXPANSION = PASS
AUTHENTICATED_BROWSER_FULL_JOURNEY = NOT_VERIFIED
```

### 68.5 Browser and Remaining Blocker

The real browser journey was attempted with `RUN_REAL_CR02_BROWSER_TESTS=1`, but the configured
environment has no `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_TEST_EMAIL`, or
`SUPABASE_TEST_PASSWORD`. The Playwright web server therefore cannot start the real authenticated
configuration. The fixture-backed browser tests remain separate engineering regression evidence and
must not be promoted to real authenticated acceptance.

Founder/operator must provide a dedicated non-production Supabase project and test account, then run:

```text
$env:DATABASE_URL = '<PostgreSQL URL for the running pci_integration database>'
$env:PCI_INTEGRATION_DATABASE = '1'
$env:SUPABASE_URL = '<dedicated non-production Supabase URL>'
$env:SUPABASE_ANON_KEY = '<dedicated non-production Supabase anon key>'
$env:SUPABASE_TEST_EMAIL = '<dedicated acceptance user email>'
$env:SUPABASE_TEST_PASSWORD = '<dedicated acceptance user password>'
$env:RUN_REAL_CR02_BROWSER_TESTS = '1'
pnpm exec playwright test tests/acceptance/browser/cr02-authenticated-creator-desk.spec.ts --project=system-edge
```

After real authentication is available, execute the full private self-service browser journey from
registration/login through Identity, Profile, C号, External Platform Account, and OWNER /
PROPOSED / SELF_DECLARED Relationship visibility. Only a passing real journey can change this task
from `BLOCKED` to `COMPLETE`.

```text
DOCUMENTATION_STATUS = UPDATED WITH ACCEPTANCE-003 EVIDENCE
COMMITTED = NO
```

## 69. SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-004

> **Change Unit**: `SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-004`

### 69.1 Result

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-004 = COMPLETE
SELF_SERVICE_COMPLETE_CLOSURE = READY_FOR_PILOT
TASK_ACCEPTANCE = PASS
```

### 69.2 Real Authentication and PostgreSQL Evidence

The acceptance used a dedicated non-production Supabase Auth environment through injected runtime
variables. Credentials, keys, user identifiers, and tokens are intentionally excluded from this
document and from tracked acceptance artifacts.

```text
REAL_SUPABASE_AUTH = PASS
REAL_PRIVATE_API = PASS
REAL_POSTGRESQL = PASS
PCI_INTEGRATION_DATABASE = PASS
RUN_REAL_CR02_BROWSER_TESTS = PASS
FIXTURE_AUTHENTICATION = NOT_USED_FOR_ACCEPTANCE
PRESEEDED_COMMERCIAL_FACTS = NOT_REQUIRED
```

The PostgreSQL preflight passed against the Founder-approved local Podman PostgreSQL acceptance
database. Migration verification passed, and the server reported PostgreSQL `17.10`.

### 69.3 Authenticated Browser Evidence

The real `system-edge` Playwright acceptance passed all three tests with one worker:

```text
AUTHENTICATED_BROWSER_FULL_JOURNEY = PASS
REAL_BROWSER_TESTS = 3 passed
LOGIN_SESSION_RESTORE_AND_SIGN_OUT = PASS
UNAUTHENTICATED_CREATOR_MANAGEMENT_REJECTED = PASS
PRIVATE_SELF_SERVICE_COMMERCE_CLOSURE = PASS
```

The closure journey verified authenticated Supabase login, active identity onboarding, owned
Commerce Profile creation, server-generated C号 display, External Platform Account declaration,
and durable OWNER / PROPOSED / SELF_DECLARED Commerce Relationship visibility after reload. The UI
did not imply platform verification.

### 69.4 Acceptance Gate Matrix

```text
REAL_POSTGRES_INTEGRATION = PASS
IDENTITY_ONBOARDING = PASS
PROFILE_PLUS_C号 = PASS
EXTERNAL_ACCOUNT = PASS
SELF_DECLARED_RELATIONSHIP = PASS
TRANSACTIONALITY = PASS
IDEMPOTENCY = PASS
DUPLICATE_PRIVACY = PASS
IDOR = PASS
HORIZONTAL_ESCALATION = PASS
CONCURRENCY = PASS
PROVENANCE_SEMANTICS = PASS
PUBLIC_BOUNDARY = PRESERVED
NO_UNAUTHORIZED_EXPANSION = PASS
```

The browser runtime wiring was corrected so all private Identity, Profile, C号, External Platform
Account, Relationship, and composite-command routes use the same PostgreSQL composition. This was
an infrastructure composition correction only; frozen product semantics were not changed.

### 69.5 Engineering Preflight and Remaining Issues

```text
ENGINEERING_PREFLIGHT = FAIL
UNRELATED_REGRESSION = PRESENT
PRETTIER_BROAD_FORMAT_CHECK = FAIL (pre-existing issues in 42 files)
SURFACE_005_FIXTURE_REGRESSION = PRESENT
PRODUCT_ACCEPTANCE_BLOCKER = NONE
```

The Surface-005 fixture regression and existing broad Prettier issues are unrelated to the
Acceptance-004 product closure and were not changed as part of this task.

```text
DOCUMENTATION_STATUS = UPDATED WITH ACCEPTANCE-004 EVIDENCE
COMMITTED = NO
```

## 71. PCI-OPERATING-CLOSURE-001 — Operating Closure Audit

> **Change Unit**: `PCI-OPERATING-CLOSURE-001`
> **Scope**: Operating-model discovery, loop audit, real-world gap analysis, and Founder decision input only
> **Non-scope**: Deployment, Pilot activation/start, Commercial Launch, Real Money, or product implementation

### 71.1 Result

```text
PCI-OPERATING-CLOSURE-001 = COMPLETE
OPERATING_CLOSURE = NOT_VERIFIED
CURRENT_OPERATING_MATURITY = L1
SINGLE_TRANSACTION_LOOP = PRESENT (engineering and simulation evidence only)
COMMERCE_EXECUTION_LOOP = NOT_VERIFIED (real-world evidence)
```

The audit preserves the authoritative self-service acceptance state. It does not change:

```text
SELF_SERVICE_COMPLETE_CLOSURE = READY_FOR_PILOT
REAL_MONEY_ENABLED = false
PILOT_ENVIRONMENT_PROVISIONED = BLOCKED
PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT_DECLARED
```

### 71.2 Audit Outcome

The audit found real runtime and authenticated browser evidence for Account, Identity, Commerce
Profile, C号, and the Creator-declared External Platform Account relationship boundary. Existing
Request, Reservation, Contract, Fulfillment, Completion, Earnings Projection, and Wallet
Projection paths have application/API/browser simulation, fixture, or documented-operation evidence
as applicable. They do not have real external Creator/Customer commerce evidence.

The existing `Commerce Relationship` is a Commerce Profile-to-External Platform Account
`OWNER / SELF_DECLARED / PROPOSED` declaration. It is not a Creator-to-Customer relationship and
cannot close the relationship, reputation, or repeat-commerce loop.

No runtime Customer relationship reuse, feedback/reputation eligibility, reputation, repeat
opportunity, Opportunity Value, Allocation, or Effective Time Yield consumer was identified.
These are recorded as proposed product gaps only; no implementation authorization is created.

### 71.3 Next Decision Input

The smallest proposed validation is one Founder-approved Creator, one Published Offer, one
coordinated real Customer, one non-money Request, one Creator decision, and—if confirmed—one
manual real-world fulfillment observation plus a reconstructible completion or permitted
cancellation evidence package. It requires the separately provisioned external Pilot environment
and Founder / authorized Operations owner decisions. It is not an activation authorization.

The full operating model, evidence matrix, responsibility matrix, failure matrix, maturity
criteria, gap classification, and stop conditions are recorded in:

`docs/07_Product_Architecture/28_Operating_Closure_Model.md`.

```text
DOCUMENTATION_STATUS = UPDATED WITH OPERATING CLOSURE AUDIT
COMMITTED = NO
```

## 72. PCI-REAL-OPERATING-VALIDATION-ENVIRONMENT-001

> **Change Unit**: `PCI-REAL-OPERATING-VALIDATION-ENVIRONMENT-001`
> **Scope**: Isolated environment provisioning contract, tooling audit, and readiness verification
> for one non-money Request Pattern operating-validation experiment
> **Non-scope**: Experiment execution, Pilot activation/start, Commercial Launch, Real Money, or
> product implementation

### 72.1 Result

```text
PCI-REAL-OPERATING-VALIDATION-ENVIRONMENT-001 = BLOCKED
OPERATING_VALIDATION_ID = OV-001
VALIDATION_ENVIRONMENT = BLOCKED
EXPERIMENT_STATUS = NOT_VERIFIED
L2_EXPERIMENT = NOT_VERIFIED
```

This task preserves:

```text
SELF_SERVICE_COMPLETE_CLOSURE = READY_FOR_PILOT
OPERATING_CLOSURE = NOT_VERIFIED
CURRENT_OPERATING_MATURITY = L1
PILOT_ENVIRONMENT_PROVISIONED = BLOCKED
PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT_DECLARED
REAL_MONEY_ENABLED = false
```

### 72.2 Existing Tooling and Verification

The repository already supplies reusable controlled-environment tooling:

```text
pnpm pilot-preflight
pnpm deploy:external-pilot
pnpm pilot:backup-restore
scripts/operations/pilot-activation-preflight.ps1
scripts/operations/pilot-activation-control.ps1
```

No activation command was run. The activation tooling remains out of scope.

On 2026-08-28, the non-mutating `pnpm pilot-preflight` command returned `BLOCKED` with exit code
`1`. It found no injected Validation configuration or protected environment manifest. Missing
required input included runtime/app state, isolated database and Supabase configuration, controlled
HTTPS URLs/origins, Creator mapping, Operations access/operator, and audit retention configuration.
The command emitted no secret values, did not deploy, did not migrate a database, and did not
start an experiment.

### 72.3 Blocking Inputs

No protected Validation database, Supabase project/tenant, HTTPS domain, deployment target,
database/backup/restore owner, logging/audit owner, state/audit location, source revision, Creator,
Customer, or authorized Operator has been supplied for `OV-001`.

```text
VALIDATION_DATABASE != ACCEPTANCE_DATABASE = NOT_VERIFIED
VALIDATION_AUTH != ACCEPTANCE_AUTH = NOT_VERIFIED
VALIDATION_DATA != FIXTURE_DATA = NOT_VERIFIED
DOMAIN_GAP = FOUNDER_INPUT_REQUIRED
DEPLOYMENT_REVISION = BLOCKED
OBSERVABILITY_GAP = BLOCKED
BACKUP_RESTORE = NOT_VERIFIED
```

The local Acceptance PostgreSQL URL, Acceptance Supabase project/accounts, fixture data, test
accounts, Development credentials, and production data remain prohibited from this experiment.

### 72.4 Exact Next Gate

Founder / Main Control or an authorized Operations owner must provide protected external resource
inputs and a Founder-selected accepted source revision. The next permitted action is to run the
existing `pnpm pilot-preflight` against that protected manifest, then provision and verify the
isolated environment using existing deployment and backup/restore tooling. Only after those checks
pass may Founder / Main Control separately authorize the specific non-money `OV-001` experiment.

The detailed environment contract, evidence register, safety stops, money boundary, and readiness
gate are recorded in:

`docs/07_Product_Architecture/28_Operating_Closure_Model.md`.

```text
DOCUMENTATION_STATUS = UPDATED WITH REAL OPERATING VALIDATION ENVIRONMENT AUDIT
COMMITTED = NO
```

## 73. PCI-OV001-EXPERIMENT-AUTHORIZATION-001

> **Change Unit**: `PCI-OV001-EXPERIMENT-AUTHORIZATION-001`
> **Scope**: Founder / Operations input and authorization contract for one non-money `OV-001`
> Request Pattern experiment
> **Non-scope**: Pilot authorization/start, experiment execution, Commercial Launch, Real Money,
> deployment, or product implementation

### 73.1 Result

```text
PCI-OV001-EXPERIMENT-AUTHORIZATION-001 = COMPLETE
OPERATING_VALIDATION_ID = OV-001
OPERATING_VALIDATION_AUTHORIZATION_LIFECYCLE = AUTHORIZED
OPERATING_VALIDATION_AUTHORIZED = true
OV-001_EXECUTION_READINESS = NOT_READY
OV-001_STARTED = false
```

Founder / Main Control authorizes the fixed non-money `OV-001` Request Pattern experiment. This
authorization approves experiment purpose, scope, safety boundary, and non-money boundary only.
It does not assert that participants, environment, source snapshot, or evidence resources exist.

### 73.2 Deployment Revision and State Separation

The existing external-pilot deployment script builds the checked-out workspace snapshot and does
not itself require a Git commit, tag, or immutable revision. Current workspace state remains
uncommitted. Founder must select the accepted source snapshot/revision before deployment evidence
can be reconstructed. No Git action was performed by this task.

```text
DEPLOYMENT_REVISION = BLOCKED
OV001_ENVIRONMENT_ISOLATION = BLOCKED
VALIDATION_ENVIRONMENT = BLOCKED
OV-001_EXECUTION_READINESS = NOT_READY
OV-001_STARTED = false
EXPERIMENT_STATUS = NOT_STARTED
L2_EXPERIMENT = NOT_VERIFIED
```

### 73.3 Preserved Boundaries

```text
PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT_DECLARED
REAL_MONEY_ENABLED = false
PAYMENT = OFF
SETTLEMENT = OFF
REFUND = OFF
PROVIDER = OFF
```

The full participant-role contract, evidence requirements, stop authority, outcome rule, gap
classification boundary, and authorization-to-environment-to-execution gate are recorded in:

`docs/07_Product_Architecture/28_Operating_Closure_Model.md`.

### 73.4 Exact Next Gate

Participants, environment, deployment source snapshot, evidence location, retention, and safety
owners are execution inputs. They must be supplied and verified before
`OV-001_EXECUTION_READINESS` can become `READY_FOR_EXECUTION`; their absence does not revoke
`OPERATING_VALIDATION_AUTHORIZED = true`.

Even when execution readiness passes, `OV-001_STARTED = false` remains until Founder / Main Control
explicitly authorizes `START_OV001`. Pilot authorization/start, Commercial Launch, and Real Money
remain separate and unchanged.

```text
DOCUMENTATION_STATUS = UPDATED WITH OV-001 AUTHORIZATION CONTRACT
COMMITTED = NO
```

## 74. PCI-OV001-AUTHORIZATION-GATE-CALIBRATION-002

> **Change Unit**: `PCI-OV001-AUTHORIZATION-GATE-CALIBRATION-002`
> **Authority**: Founder / Main Control
> **Scope**: Governance calibration only; separates experiment authorization, execution readiness,
> and experiment execution

### 74.1 Result

```text
PCI-OV001-AUTHORIZATION-GATE-CALIBRATION-002 = COMPLETE

OPERATING_VALIDATION_AUTHORIZATION_LIFECYCLE = AUTHORIZED
OPERATING_VALIDATION_AUTHORIZED = true

OV-001_EXECUTION_READINESS = NOT_READY
OV-001_STARTED = false

PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT_DECLARED
REAL_MONEY_ENABLED = false
```

`AUTHORIZED` means Founder / Main Control approves the defined one-time `OV-001` experiment. It
does not mean environment provisioned, participants selected, deployment complete, or experiment
started. Missing execution resources block readiness only; they do not revoke authorization.

### 74.2 Current Gate

```text
Authorization
→ Execution Readiness
→ START_OV001
→ Evidence
→ Completion
```

Execution readiness remains blocked pending the selected participants, dedicated environment,
controlled HTTPS access, accepted source snapshot, protected evidence location/retention, and
named safety owners. `START_OV001` remains a separate explicit Founder / Main Control action.

```text
DOCUMENTATION_STATUS = UPDATED WITH OV-001 AUTHORIZATION GATE CALIBRATION
COMMITTED = NO
```

## 75. PCI-OV001-EXECUTION-READINESS-001

> **Change Unit**: `PCI-OV001-EXECUTION-READINESS-001`
> **Authority**: Founder / Main Control
> **Scope**: Review of OV-001 execution inputs, environment, ownership, evidence, deployment, and
> operating procedures only
> **Non-scope**: `START_OV001`, real participant sessions, Pilot start, Commercial Launch, Real
> Money, deployment, migrations, backup/restore execution, or product implementation

### 75.1 Result

```text
PCI-OV001-EXECUTION-READINESS-001 = COMPLETE

OPERATING_VALIDATION_AUTHORIZATION_LIFECYCLE = AUTHORIZED
OPERATING_VALIDATION_AUTHORIZED = true

OV-001_EXECUTION_READINESS = NOT_READY
OV-001_STARTED = false
EXPERIMENT_STATUS = NOT_STARTED

PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT_DECLARED
REAL_MONEY_ENABLED = false
```

Founder authorization remains valid. The readiness decision is `NOT_READY` because execution
inputs and safe, auditable operating evidence are absent; this does not revoke authorization.

### 75.2 Reviewed Evidence

On 2026-08-28, the non-mutating existing command:

```text
pnpm pilot-preflight
```

ran without an OV-001 protected environment file or injected runtime configuration and returned:

```text
PILOT_PREFLIGHT = BLOCKED
EXIT_CODE = 1
```

It found no runtime/app configuration, dedicated database or Supabase configuration, controlled
HTTPS URLs/origins, Creator mapping, Operations access/operator, or audit-retention configuration.
It emitted no secret values and performed no deployment, migration, backup/restore, Pilot action,
or OV-001 start.

Existing tooling is available but unexecuted for OV-001:

```text
pnpm deploy:external-pilot
pnpm pilot:backup-restore
pnpm smoke:deployment
```

The deployment tooling builds the checked-out workspace and does not itself require a Git commit,
tag, or immutable artifact. No Founder-selected accepted reconstructible source snapshot is
recorded, so:

```text
SOURCE_REVISION_READINESS = BLOCKED
```

### 75.3 Blocking Readiness Items

```text
CREATOR_READINESS = BLOCKED
CUSTOMER_READINESS = BLOCKED
OPERATOR_READINESS = BLOCKED
EVIDENCE_OWNER_READINESS = BLOCKED
STOP_AUTHORITY_READINESS = BLOCKED
OFFER_READINESS = BLOCKED
CUSTOMER_ENTRY_AND_REQUEST_PATH = NOT_VERIFIED

VALIDATION_ENVIRONMENT = BLOCKED
OV001_ENVIRONMENT_ISOLATION = NOT_VERIFIED
OV001_DATABASE != ACCEPTANCE_DATABASE = NOT_VERIFIED
OV001_AUTH != ACCEPTANCE_AUTH = NOT_VERIFIED
OV001_DATA != FIXTURE_DATA = NOT_VERIFIED

POSTGRES_READINESS = BLOCKED
SUPABASE_AUTH_READINESS = BLOCKED
DOMAIN_HTTPS_READINESS = BLOCKED
CORS_COOKIE_SESSION_READINESS = NOT_VERIFIED
SECRETS_READINESS = BLOCKED
OBSERVABILITY_READINESS = NOT_VERIFIED
EVIDENCE_STORAGE_READINESS = BLOCKED
FULFILLMENT_PROCEDURE_READINESS = BLOCKED
COMPLETION_PROCEDURE_READINESS = BLOCKED
COMMERCE_FACT_RECONSTRUCTION_READINESS = NOT_VERIFIED
SAFETY_READINESS = NOT_VERIFIED
MONEY_BOUNDARY_READINESS = NOT_VERIFIED
BACKUP_RESTORE = NOT_VERIFIED
```

No real Creator, Customer, Offer, approved handoff, named Operator, Evidence Owner, Stop
Authority, protected deployment target, dedicated PostgreSQL, dedicated Supabase Auth, controlled
HTTPS endpoint, isolated audit/evidence store, source snapshot, or operating procedure has been
provided. No protected secret values are recorded in this execution record.

### 75.4 Classification and Non-Blocking Items

```text
PARTICIPANT_AND_OFFER = OPERATIONS_GAP
VALIDATION_ENVIRONMENT = ENVIRONMENT_GAP
EVIDENCE_AND_PROCEDURES = GOVERNANCE_GAP
PRODUCT_GAP = NOT_VERIFIED
BUSINESS_MODEL_GAP = NOT_VERIFIED
EXTERNAL_DEPENDENCY = NOT_VERIFIED

PRODUCT_EXECUTION_READINESS = NOT_VERIFIED
ENGINEERING_PREFLIGHT = NOT_VERIFIED
PRETTIER_42_FILE_ISSUE = NON_BLOCKING
SURFACE_005_FIXTURE_REGRESSION = NON_BLOCKING
```

No product change is proposed or authorized. The two existing engineering issues do not determine
OV-001 readiness unless they directly block the selected deployment, Request path, or audit
reconstruction.

### 75.5 Exact Next Gate

Founder / authorized Operations must provide and verify the execution input record:

```text
Creator
Customer
Operator
Evidence Owner
Stop Authority
One Creator-owned Request-compatible Offer
Approved Customer handoff
Deployment target and accepted source snapshot
Dedicated Validation PostgreSQL and owner
Dedicated Validation Supabase Auth and owner
Controlled HTTPS domain/access and DNS/TLS owner
Protected configuration injection
Isolated logs/audit and evidence location/retention
Fulfillment, Completion/Cancellation, dispute, and closeout procedure
```

Then run the existing preflight against the protected configuration, provision and verify the
isolated environment, verify deployment/health/readiness/backup-restore/evidence reconstruction,
and perform a new readiness review. Only if every mandatory readiness item is `READY` may:

```text
OV-001_EXECUTION_READINESS = READY_FOR_EXECUTION
```

Even then:

```text
OV-001_STARTED = false
```

until Founder / Main Control separately authorizes `START_OV001`.

```text
DOCUMENTATION_STATUS = UPDATED WITH OV-001 EXECUTION READINESS REVIEW
COMMITTED = NO
```

## 76. PCI-DEVELOPMENT-BACKLOG-001 — 项目开发任务总清单

> **Change Unit**: `PCI-DEVELOPMENT-BACKLOG-001`
> **Date**: 2026-10-09
> **Authority**: Main Control / Founder acceptance required
> **Scope**: 建立简体中文、分阶段、带状态 / 依赖 / 验收 / 授权边界的项目任务总清单
> **Non-scope**: 产品实现、项目解冻、Stage 2 完成签署、OV-001 启动、Pilot 激活、部署或真实资金

### 76.1 Result

```text
PCI-DEVELOPMENT-BACKLOG-001 = PROPOSED — FOUNDER ACCEPTANCE REQUIRED
BACKLOG_COVERAGE = M1-M9 / VS-01 / VS-02 / STAGE 2-5 / PRIVATE SELF-SERVICE / OV-001 / GOVERNANCE
PROJECT_STATUS = SUSPENDED
IMPLEMENTATION_AUTHORIZED = false
```

简体中文任务总表、已知决策冲突、任务依赖和验收边界见
[`24 — 项目开发任务总清单`](./24_Development_Backlog.md)。该清单不改变项目 Handoff，
也不授权任何候选实现任务。

### 76.2 Current Validation Evidence

On 2026-10-09, against commit `7c2a0d6`:

```text
pnpm typecheck = PASS
pnpm lint = PASS
pnpm test = FAIL
TESTS = 518 passed, 2 failed, 41 skipped
```

Both failures are in `tests/persistence/commerce-relationship.test.ts`: one schema-column
expectation omits the persisted `provenance` column; the other expects `SELF_DECLARED` after
rehydration but receives `UNKNOWN`. The intended contract and whether the test or implementation is
incorrect remain unresolved. The proposed Stage 2 reconciliation must be updated to use this
observed evidence before it can be accepted.

### 76.3 Backlog Review Boundary

```text
PCI-DEVELOPMENT-BACKLOG-001 = [ACCEPT / MODIFY / REJECT]
RESUME-001 = [AUTHORIZE RE-ENTRY AUDIT / MODIFY / DEFER]
PCI-BACKLOG-RECONCILIATION-001 = RESUME-001 REQUIRED SUBTASK
```

本任务只建立中文任务清单，不证明任务覆盖已穷尽，也不改变当前暂停状态。Founder 接受前，
需由下一轮重返审查根据证据继续补正遗漏。未明确接受 Resume Gate 前，不得启动实施包。

## 77. DEV-055 / AUTH-REGISTRATION-RUNTIME-REPAIR-001

> **Change Unit**：`DEV-055` / `AUTH-REGISTRATION-RUNTIME-REPAIR-001`
> **Date**：2026-11-07
> **Scope**：Local authentication signup runtime and `apps/web-v2` registration journey
> **Related Contract**：`contracts/api/v1/auth-contracts.ts` signup response; local auth acceptance path

### 77.1 Observed Implementation Issue

The running local API and Web processes were serving stale builds. The stale signup path required a
name that the older client did not send, and its refresh-token insert used the removed `token`
column. The current API source also returned a legacy flat response while `apps/web-v2` reads the
canonical `user` response object. A successful signup then redirected to `/creator/dashboard`, but
the route-group path is `/dashboard`.

### 77.2 Resolution and Boundary

The local signup adapter now validates the required email and password, treats the contract's name
as optional, trims string fields, stores a fixed-length SHA-256 refresh-token hash in `token_hash`,
and returns the canonical auth response. Refresh and logout hash the incoming token with the same
algorithm. The Web auth context and session types now carry the name and refresh token, use Unix
seconds consistently for expiry, surface API error fields, and redirect signup/login to the actual
dashboard route. No VS-01 object, state transition, canonical event, permission, payment, settlement,
refund, marketplace, CRM, or deferred capability changed.

### 77.3 Validation Evidence

```text
API signup with name = PASS (HTTP 201; canonical user response)
API signup without name = PASS (HTTP 201; name remains optional per contract)
API refresh after signup = PASS (HTTP 200; accessToken and expiresIn returned)
API logout after signup = PASS (HTTP 200)
Browser signup on fresh web dev server = PASS (POST /api/v1/auth/signup 201; GET /dashboard 200)
Web TypeScript check = PASS
Scoped Prettier check = PASS after final formatting
Scoped git diff --check = PASS
Web production build = BLOCKED by pre-existing Next.js `useSearchParams()` prerender error in
  `app/(public)/auth/reset-password/page.tsx`
Web Vitest = BLOCKED by pre-existing Playwright suite loading, JSX test parse failure, and five
  existing `OrderResultCard` test failures
Web lint = BLOCKED by pre-existing unrelated errors in reset-password, performance, order-result,
  identity-form, API utility, security-manager, and test setup files
```

```text
DEV-055 = Closed — Verified for the local signup journey
PRD_AMENDMENT = Not Required
VS01_BOUNDARY = Preserved
COMMITTED = NO
```

## 78. DEV-056 / AUTHENTICATED-WORKSPACE-001

> **Change Unit**: `DEV-056` / `AUTHENTICATED-WORKSPACE-001`
> **Date**: 2026-11-07
> **Status**: In Progress

User-approved deviation: use `apps/api` as the application backend and present an authenticated
workspace at `/dashboard`. Show the signed-in account, identity onboarding, capabilities, service
management and a separate request-review entry. Distinguish a missing identity from an API failure.
Authentication uses locally managed accounts, password hashes and tokens in `apps/api`, as
subsequently clarified by the user. An account is not itself a Creator; any Creator access must
follow an explicit, persisted authorization mapping. Existing Supabase and mock accounts are not
automatically migrated or trusted.
The affected objects are Account, Identity, Creator Commerce Identity, Service Offering and Customer
Request. Existing authorization, state transitions and canonical events remain authoritative.
Verify signup, login, session refresh, identity states, request review and error handling against
the closest available tests; record real-provider limitations separately from simulated evidence.

### 78.1 Implementation And Local Evidence

`apps/api` now uses PostgreSQL-backed local accounts and salted scrypt password hashes, short-lived
access tokens and rotating, revocable refresh sessions. Signup persists a separate Creator mapping;
it does not equate an Account ID with a Creator ID. The 0027 migration adds the local authentication
tables; 0026 was corrected for PostgreSQL syntax on fresh databases. Existing Supabase and mock
credentials require an explicit migration and cannot sign in automatically.

The workspace shows the account email, identity initialization and commerce identity state, links
to capabilities and offerings, and a separate request-review page. A missing identity is distinguished
from an unavailable API, with retry. The Web client uses the formal API and refreshes sessions through
it. Unsupported capability edit/delete and offering delete controls were removed from the lists.

Local verification used `apps/api` and a separate PostgreSQL database,
`pci_workspace_verify_20261107`. Browser checks covered signup, identity initialization and creation,
adding a capability, creating, publishing and unpublishing a service, request submission and review
through the pending and confirmed lists, and API failure followed by retry. A transaction-scoped
fulfillment code repository fixes request submission against PostgreSQL. Local-auth PostgreSQL
integration covers signup, login, password storage, token rotation and revocation, and separate
Creator mappings (13 tests across local auth and API runtime); nine Creator Identity API tests
also passed, including the confirmed customer result. Web TypeScript and scoped auth lint were
checked separately.

For the subsequent manual test, the local Web and `apps/api` defaults were aligned to ports 3000
and 8080. The previous mock and duplicate development servers were stopped. The restarted API
uses the same isolated PostgreSQL verification database; a local signup returned 201 with the
expected CORS origin, and the Web dashboard returned HTTP 200.
These are local implementation checks, not evidence of AT-001 through AT-013 or external acceptance.

`apps/api-mock` remains in the working tree because it contains pre-existing uncommitted changes;
it is not used by the verified runtime. The previous Supabase adapter and configuration remain for
legacy consumers and are not used for `apps/api` authentication. Password recovery is not implemented
by the local authentication service. Existing database migration history and existing accounts need
separate migration review before adoption. Production build and repository-wide gates retain the
pre-existing failures recorded under DEV-055 and require independent resolution.

## 79. DEV-057 / AUTOMATIC-IDENTITY-ONBOARDING-001

> **Change Unit**: `DEV-057` / `AUTOMATIC-IDENTITY-ONBOARDING-001`
> **Status**: Closed — Verified locally

User-approved deviation: local registration and login initialize the Account's formal Identity and
Creator Commerce Identity draft automatically. Existing local sessions can retry initialization.
The registration name is copied once to the draft display name; subsequent profile edits are
independent. An incomplete draft may have an empty name or bio, but publication requires both.
Existing profiles and historical membership restrictions must be preserved. Initialization failures
remain visible and retryable rather than being represented as missing identities. No new canonical
product event is introduced. Verify registration, existing sessions, repeat initialization, profile
independence, publication validation, failure handling and the system health endpoint against the
local API and PostgreSQL. This is not evidence of AT-001 through AT-013.

### 79.1 Implementation And Local Evidence

`apps/api` provides `/health` alongside `/api/v1/health`. Local signup and login attempt to create
the formal Identity and a separate Creator Commerce Identity draft. Initialization is idempotent
and does not overwrite existing commerce profile data or bypass historical membership restrictions.
The registration name is copied into the initial commerce display name; later changes are independent.
Publishing requires a completed commerce name and bio. Existing sessions initialize their workspace
through the authenticated API when they enter the dashboard.

Account creation and workspace initialization are not one atomic transaction. If initialization fails,
authentication succeeds with `setupPending`, and the dashboard reports the failure and offers retry.
The dashboard and profile edit page opt out of Next.js instant-navigation validation for their
conditionally rendered segments.

Local PostgreSQL integration tests passed for automatic initialization, retries and concurrent
initialization, profile independence, account isolation, and publication validation. API runtime and
Creator Identity API integration tests passed (21 tests). Web TypeScript and scoped ESLint checks
passed. Browser verification against `apps/api` covered signup, automatic initialization, dashboard,
and profile edit: signup returned 201, workspace initialization and identity lookup returned 200,
and navigation to profile edit produced no console errors. `/health` returned the expected service
status. `git diff --check` passed.

The repository-wide TypeScript build check remains blocked by existing errors in legacy auth, mock,
and Web configuration paths. These local checks do not establish AT-001 through AT-013 or external
service acceptance. The API verification used the existing isolated PostgreSQL database
`pci_workspace_verify_20261107`.

## 80. REQUEST-TRACING-PLAN-001

Status: Plan documented; implementation and acceptance not started. The project-specific request
tracing plan is recorded in `docs/09_Engineering_Governance/111_Request_Tracing_Implementation_Plan.md`.
It covers local authentication, correlation propagation, browser and API spans, PostgreSQL driver
verification, collection, privacy, operational failure handling and staged evidence. This planning
entry does not claim product, production deployment or AT-001 through AT-013 acceptance.

## DEV-058 / BOUNDED-SESSION-REFRESH-001

> **Change Unit**: `DEV-058` / `BOUNDED-SESSION-REFRESH-001`
> **Status**: In Progress

The user authorized implementation and acceptance of the request-tracing plan, including ending
spans on cancellation and failure. Bound the browser's shared session refresh to 15 seconds and
honor each caller's cancellation while it waits. A timeout or cancellation returns the existing
transport-error shape; it does not itself clear the local session. Cancelling one caller does not
cancel the shared refresh. This changes when a stalled request reports an error. Since refresh
tokens rotate, the server can consume a token even if its response is lost or arrives after the
timeout; a subsequent refresh can then be rejected and require login. This existing distributed
failure mode cannot be eliminated by a browser timeout. Account and Creator authorization, domain
state transitions and canonical events are unchanged. Verify timeout, independent cancellation,
span completion, recovery and credential privacy; record actual results in section 81.

## DEV-059 / SESSION-LOGOUT-RECOVERY-001

> **Change Unit**: `DEV-059` / `SESSION-LOGOUT-RECOVERY-001`
> **Status**: Verified locally

Repair logout when an access token is rejected: refresh and retry when possible, and clear an
invalid local session when refresh is rejected. Report transport failures rather than claiming
server revocation. Protect newer or cleared sessions from an older in-flight refresh. Verify
login, logout, refresh concurrency and tracing without changing account or Creator permissions,
domain transitions or canonical events.

Verification on 2026-11-08: Web regression and tracing tests passed 21 tests across five files;
Web TypeScript and scoped ESLint passed. The existing `lib/api/client.ts` lint errors for explicit
`any` remain, as does its Next navigation warning. The local-auth integration test passed against
a separate migrated Podman PostgreSQL. In gstack browse with the formal API on 18080 and Web on
13000, signup reached the dashboard, then an intentionally invalid access token produced logout
401, refresh 200 and logout 200; a subsequent login returned 200 and reached the dashboard. With
both tokens deliberately invalidated, logout and refresh returned 401 and the browser cleared its
local session and returned to login. That case cannot establish server-side revocation. The tests
also cover network failure, rejected retry, late refresh and newer-session preservation. The user's
3000 and 8080 services remained available and their data was not modified. The original browser
session and the cause of its particular 401 were not inspected.

## DEV-060 / SESSION-RESTORE-FAILURE-001

> **Change Unit**: `DEV-060` / `SESSION-RESTORE-FAILURE-001`
> **Status**: Verified locally

When the browser cannot refresh an expired session because the API is unavailable, preserve the
stored session and offer a retry without presenting it as authenticated or loading the workspace.
A rejected refresh clears the expired session. The home route waits for session restoration and
directs authenticated users to the workspace. Account and Creator permissions, domain state
transitions and canonical events are unchanged. Verify recovery, rejected sessions, navigation
and the actual local API database configuration.

On 2026-11-08 the running API was found connected to `pci_auth`, which had the old `accounts`,
`refresh_tokens` and `password_resets` tables but lacked the formal API's `local_auth_sessions`.
An invalid refresh consequently returned 500. The Drizzle migrations were applied to `pci_auth`;
the existing legacy tables and records were retained. The documented previous manual-test API
used `pci_workspace_verify_20261107`, so `.env.local` was corrected to point back to that database
and the 8080 `apps/api` process restarted with tracing enabled. The temporary operations token
remains process-only; restarting the API requires operations authentication configuration.

In a separate gstack browser session against Web 3000 and API 8080, the explicitly named test
account `restore-check-20261108@example.test` was registered and left in the local database.
After setting its access expiry to the past, visiting `/` returned refresh 200, navigated directly
to the dashboard, and returned 200 for workspace initialization and identity lookup. Logout and
subsequent login returned 200. The login and dashboard console were free of errors on the final
check. An invalid refresh returned 401. Jaeger recorded the health request's supplied trace ID and
parent after the restart. Web TypeScript, scoped ESLint and Prettier checks passed; three focused
test files passed 21 tests, including Strict Mode restoration, server failure and retry, rejected
refresh, logout recovery and tracing. jsdom reports its existing unsupported navigation warnings.
These checks do not establish production acceptance or verify the user's browser session.

## 81. REQUEST-TRACING-IMPLEMENTATION-001

> **Status**: In progress; local end-to-end evidence obtained, acceptance incomplete.

Plan 111 with the separately registered `DEV-058` refresh timeout and cancellation behavior;
no product object, canonical event, permission or state transition is intentionally changed.
API tracing is disabled by default. The browser exporter and
its bounded, origin-restricted API receiver each require an explicit switch. The receiver rebuilds
an allowlisted payload and forwards without business credentials. Server sampling is independent of
untrusted remote flags and trace IDs; local child spans follow their parent. Browser refresh is one
shared span linked to its waiters; retry spans link to the original request and refresh.

Local environment: Windows, Node 22, `apps/api`, `apps/web-v2`, real PostgreSQL in an isolated
Podman container, Collector 0.112.0 and Jaeger 1.62.0. The browser test used isolated ports 13000
and 18080, leaving the user's 3000/8080 services and existing PostgreSQL untouched. Development
Jaeger storage is in memory and has no query authentication. See `112_Request_Tracing_Operations.md`.

| Acceptance | Evidence and remaining work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1         | Partial: HTTP integration tests cover valid/invalid headers, concurrent isolation and log IDs; real Collector query worked on 18080. A read-only probe of the existing 8080 process returned 200 but echoed an invalid correlation ID and its CORS preflight allowed only authorization/content-type: this process is running old code and does not meet the tracing contract. Repeat after restarting the actual runtime with its existing authentication and database configuration preserved.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| A2         | Partial: real browser signup returned 201 and opened dashboard. Jaeger trace `82a8e3a66be1cc3f449df6ae9b86641f` contained browser client -> API server -> signup -> session -> workspace -> PostgreSQL transaction, and account-create span. A separate real PostgreSQL publish test verified the `creator_published` event retains the request correlation ID. Local in-memory traces disappear when Jaeger stops.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| A3         | Partial: real PostgreSQL tests cover signup, concurrent initialization, suspended identity and historical membership restrictions, linked failure logs and error spans. A disposable PostgreSQL role without INSERT privilege on `identities` produced SQLSTATE 42501; signup still returned 201 with `setupPending`, rolled back the membership, and recorded correlated workspace and transaction error spans without exposing the database error. After restoring INSERT, the real workspace retry returned 200, produced trace evidence and created exactly one active membership. A separately injected TCP interruption also returned `setupPending` and recovered with the same session; this is not a production database outage exercise.                                                                                                                                                                                                                                                                                                      |
| A4         | Local browser acceptance: two concurrent requests with a genuinely expired, test-signed JWT returned 401; one shared refresh returned 200 and both retries returned 200. Jaeger confirmed both waiter links on refresh, each retry's links to its original request and refresh, and the corresponding API server children. A real rejected refresh returned 401 and produced completed client/server spans; a cancelled request produced a completed client span with status 0 and error. The harness delays the real refresh response by 300 ms to make concurrency reproducible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| A5         | Partial: server tests cover unknown paths and nested redaction; receiver rejects non-allowlisted paths and discards additional fields. Real PostgreSQL tests checked test email, password, SQL parameter, access and refresh tokens against server logs and spans; the actual signup trace also excluded test credentials. Broader injection tests across every sink remain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| A6         | Partial: stopping the local Collector left health/readiness at 200; browser receiver returned 503 and API logged `trace_export_failed`. After restart a new trace was queryable. An HTTP receiver that accepts but never responds verified bounded timeout, queue saturation and `trace_queue_dropped`, with health/readiness still 200. Production alerting remains unverified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| A7         | Partial: `tsx` and compiled Node entries exported spans; a Podman-built API image exported a span in test configuration and handled SIGTERM. A real HTTP receiver observed a pending span flushed on immediate shutdown before the batch timer; the stalled receiver test verified bounded, idempotent shutdown. A real browser `pagehide` triggered an export in 21 ms, before the one-second batch timer; this synthetic event does not prove delivery on every browser or abrupt termination. Instrumentation is manual; production configuration remains unverified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| A8         | Partial: API contract tests and Web typecheck passed. An alternating local `/health` comparison, after five warmups and 30 sequential requests per process, measured tracing off/on mean 2.07/2.42 ms, p95 3.18/2.98 ms, and process working set 124.7/125.0 MiB. A separate isolated Node test sent 60 requests per process at concurrency 10 after five warmups: all returned 200; off/on mean 11.65/7.89 ms, p95 25.04/12.16 ms, working set 115.9/116.9 MiB. Collector queue after the run was 0/512 batches, accepted/sent 441 spans, refused/failed 0 since Collector startup. This is a small sequential comparison and not a production budget or peak queue measurement. A 300-request attempt encountered 220 responses reported as 500 after the existing 100/minute rate limit was reached: the global error handler maps the rate-limit response to an internal error. This pre-existing contract issue requires separate product/engineering review. Repository build is blocked by existing legacy auth, mock and Web TypeScript errors. |
| A9         | Partial: log trace ID located the corresponding local trace. The local Jaeger endpoint is only loopback-bound and has no authentication; production authorization, retention, storage and responsible owner remain undefined.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Commands executed: `pnpm exec vitest run tests/integration/api-runtime.test.ts
adapters/observability/safe-logger.test.ts tests/integration/runtime-lifecycle.test.ts`; with
`LOCAL_AUTH_TEST_DATABASE_URL` pointing to the isolated database, `pnpm exec vitest run
tests/integration/request-tracing.test.ts tests/integration/automatic-identity.integration.test.ts
tests/integration/local-auth.integration.test.ts`; `pnpm exec vitest run
tests/integration/browser-tracing.test.ts`; in `apps/web-v2`, `pnpm exec vitest run
lib/api/client-tracing.test.ts` and `pnpm exec tsc --noEmit`. The final combined API run passed
42 tests across eight files; the Web tracing run passed two tests. Full
`pnpm exec tsc -p tsconfig.build.json --noEmit` remains blocked by the pre-existing errors above.

Additional evidence on 2026-11-08: `pnpm build:api` succeeded using `tsconfig.api.build.json`;
`podman build -f deploy/Dockerfile.api -t localhost/pci-tracing-api-acceptance:local .` built the
formal API image. The compiled process exported trace `0123456789abcdef0123456789abcdef` and the
test-configured container exported `abcdef0123456789abcdef0123456789`, each with the injected
parent span in Jaeger. The image handled SIGTERM and logged shutdown completion. The independent
`tests/integration/tracing-export-failure.test.ts` exercises a stalled HTTP receiver, queue drops,
health/readiness and bounded shutdown; `tests/integration/request-tracing.test.ts` also verifies a
real product event, injected initialization failure and restricted identity/membership cases.
These are isolated development results, not evidence for production readiness or the user's
existing 8080 process.

Further verification: `tests/integration/tracing-shutdown-flush.test.ts` passed with an HTTP
receiver; the later combined API run passed 27 tests in eight files, Web tracing passed four tests,
Web typecheck passed, and targeted ESLint and Prettier passed. Real browser refresh and retry
traces were `41ef8db1e198c1143712989db4c0edae` and `6379ff4d75e80893dc09899c2ccec703`;
they linked to the original 401 trace `8df8a78d8d6d28e1e5622ac5d9f4d4c0`. Jaeger in-memory
results are transient. The 60-request comparison used two fresh `APP_ENV=test` API processes
on ports 18081 and 18082 with identical settings except tracing and did not use the user's 8080.
The isolation processes and Podman test containers were stopped after the run; the original 3000,
8080 and `pci-postgres` services were retained. A recursive cleanup of the generated
`apps/web-v2/.next-tracing` cache was rejected by the execution policy, so the cache remains.
The new client test passes root Prettier and Web ESLint; a whole-file Prettier check of this
execution ledger reports formatting differences, and the existing ledger was not reformatted.

The browser exporter now batches up to eight spans with a bounded queue rather than sending one
request per span. `lib/api/tracing.test.ts` verifies the 8+2 batching boundary, payload size with
16 links per span, allowlisted data and same-origin propagation. In the isolated real browser run,
the refresh trace `bee0ac8e09b1f03da6e764f259aae84d` linked both original 401 traces
`2bf0e21e8a3e816e4f5c4dae258fcf9f` and `0bdbd4e99b36a0411d69771cf92a9296`; retry traces
`c70c5b92ffd61f9581f8eb0ace75f135` and `f8849525ee2fbbba45050352da8403c9` each linked their
own original and refresh. The rejected refresh trace `8a2a9affe9b3b36e7382bf42cc1eb6de` and
cancelled client trace `c064686198ea5b59d996d465af4a7612` were queried in Jaeger. Export batches
observed during the signup and refresh run did not contain the test email or password. The
reproducible harness and isolation instructions are in the operations guide; its JWT signing key
and database credentials are test-only. Jaeger data is transient.
The final Web run passed five tests across `lib/api/tracing.test.ts` and
`lib/api/client-tracing.test.ts`; `pnpm exec tsc --noEmit`, targeted ESLint for those files and
the harness, and Prettier for the changed tracing files and operations guide also passed. Vitest
reported its existing Vite configuration warning and jsdom navigation-not-implemented messages.
After this run, the isolated API and Vite processes, test PostgreSQL container, Collector and
Jaeger were stopped. The existing `pci-postgres` remained running; `http://localhost:3000/` and
`http://localhost:8080/health` returned 200. The existing 8080 process was not restarted with
tracing enabled, so its tracing path is still unverified. The browse stop command reported an
inability to connect; the subsequently reported browser server PID was no longer running.

Database fault verification: with `TRACING_DISPOSABLE_DATABASE_URL` and
`LOCAL_AUTH_TEST_DATABASE_URL` pointing to a dedicated migrated local PostgreSQL database,
`pnpm exec vitest run tests/integration/request-tracing.test.ts
tests/integration/automatic-identity.integration.test.ts tests/integration/local-auth.integration.test.ts`
passed 9 tests in 3 files; `pnpm build:api` and targeted Prettier also passed. The permission test
requires the database name `pci_tracing_disposable`, a loopback host and role-creation privileges;
it creates and removes a uniquely named restricted role. See the operations guide for setup and
cleanup. This test does not represent a network outage or production database configuration.

An additional real TCP test sent a partial JSON body to an existing API route and disconnected
after `api_request_started`. The server emitted a completed error span with the route template and
method and an `api_request_aborted` log containing matching trace/span IDs and monotonic duration;
no HTTP response status is invented for a disconnected client. The targeted run of
`request-tracing.test.ts`, `api-runtime.test.ts` and `safe-logger.test.ts` passed 18 tests, with
four PostgreSQL-dependent cases skipped because no test database was supplied; `pnpm build:api`
passed. This test did not use the user's 8080 process.

Additional privacy checks exercised a matched public request route containing a test result token,
query token, bearer credential and cookie. The request logs and exported server span retained the
route template and contained none of these values. The browser telemetry receiver test also sent
extra nested credentials and incoming authorization/cookie headers; its forwarded OTLP payload
excluded them and used only its own content-type header. `pnpm exec vitest run
tests/integration/request-tracing.test.ts tests/integration/browser-tracing.test.ts` passed six
tests with four database-dependent cases skipped; targeted ESLint and Prettier checks passed.
These controlled tests do not establish redaction across every production sink or every source of
untrusted data.

The local Podman Collector and Jaeger were restarted for continued acceptance; `pci-postgres` and
the existing 3000/8080 processes were retained. Restarting 8080 with its existing JWT, database
and operations settings requires a reproducible source for those settings. An attempt to read the
running process environment was rejected by the execution environment's automated policy; the
API was not stopped or changed. `.env.local` has database and JWT keys but does not contain the
operations authentication keys, so it is not sufficient evidence of the current runtime settings.
The user was asked for the configuration source without disclosing credentials. A1 on the actual
8080 process and the corresponding 3000 browser path remain outstanding.

An OTLP payload check found that an externally supplied `tracestate` value was exported unchanged,
even though the request attributes were redacted. The API ingress now discards external
`tracestate` while retaining a valid `traceparent` trace ID, parent span ID and flags; `baggage`
is not extracted. This deliberately prevents propagation of vendor state from external callers;
trusted internal integration would require a separately designed trust boundary. The shutdown
test captured actual OTLP HTTP bytes and verified that a test `tracestate` secret, baggage,
authorization, cookie and query token were absent while the trace and parent IDs remained.

With the local Podman Collector and Jaeger running, the opt-in
`tests/integration/tracing-collector-privacy.test.ts` started a temporary in-process HTTP API on a
system-selected loopback port, exported a real trace, and verified the parent reference and absence
of those markers in Jaeger and the captured API logs. The test requires explicit loopback endpoints
and does not touch the database. The command and endpoint settings are in the operations guide.
With those settings, the combined collector, shutdown, request tracing, browser ingestion and API
runtime run passed 20 tests in five files, with four database-dependent tests skipped; `pnpm
build:api` and the two changed tracing test files' ESLint checks passed. Whole-file ESLint on
`apps/api/src/create-api-server.ts` still reports two pre-existing `any` errors at the public
Creator Profile database dependency and its assignment, both present in the repository baseline.
The user's 8080 process remains unchanged, so this is not acceptance of that running instance.

Outbound boundary inventory: source searches for fetch, HTTP client calls and provider assembly found
the Web business client and refresh in `apps/web-v2/lib/api/client.ts`, and its separate telemetry
export in `lib/api/tracing.ts`. The alternative global fetch interceptor has no production caller
and is not covered by the tracing implementation. In `apps/api`, the notification adapter logs
locally; the PostgreSQL composition uses a local commerce simulator outside production and installs
rejecting webhook verification and normalization. The WeChat Pay adapter delegates to an injected
sandbox transport and is not assembled into this API. The browser telemetry receiver forwards to
the Collector; SDK export is also telemetry traffic, not a traced business provider integration.
The operations guide records the boundaries and conditions for future integrations. This source
inventory does not verify external notification, payment, asynchronous queue or third-party webhook
delivery, and no such coverage is claimed. `pnpm exec prettier --check
docs/09_Engineering_Governance/112_Request_Tracing_Operations.md` and `git diff --check` passed;
Git reported existing LF-to-CRLF warnings.

After the inventory, the combined `tracing-collector-privacy`, `tracing-shutdown-flush`,
`tracing-export-failure`, `request-tracing`, `browser-tracing` and `api-runtime` integration run
passed 21 tests in six files with four database-dependent tests skipped; it used the explicitly
configured local Podman Collector and Jaeger. `pnpm build:api` also passed. The skipped tests are
not represented as passed by this run; the earlier dedicated PostgreSQL evidence remains separate.

Browser refresh span correction: when the stored session has no refresh token, `refreshSession`
returns false without sending HTTP and no longer creates a misleading failed HTTP span. The
regression test also verifies a later refresh can start normally. In `apps/web-v2`, `pnpm exec
vitest run lib/api/client-tracing.test.ts lib/api/tracing.test.ts` passed six tests and `pnpm exec
tsc --noEmit` passed. ESLint and Prettier passed for the changed test file. Whole-file ESLint for
`lib/api/client.ts` still reports seven existing explicit-`any` errors and the existing Next.js
navigation warning; these are also present in the repository baseline. Vitest emitted its existing
Vite configuration warning and jsdom navigation-not-implemented messages.

Log privacy correction: the formal API's `LogNotificationAdapter` no longer writes the
user-provided offering title, which could contain a phone number or other arbitrary private text
that key-based redaction cannot reliably recognize. Notification contents and product behavior
are unchanged; fixed metadata and identifiers remain available in the log. A regression test sent
a title containing a phone-number-shaped marker and an arbitrary credential marker through the
actual adapter and safe logger; neither appeared in its output. `pnpm exec vitest run
adapters/notifications/notification-adapters.test.ts adapters/observability/safe-logger.test.ts
tests/application/customer-request-use-cases.test.ts` passed 18 tests. Scoped ESLint and Prettier
for both notification files and `pnpm build:api` passed. This narrows one actual log exposure; it
does not establish universal redaction of arbitrary future log fields.

Web V2 production build: an isolated `NEXT_DIST_DIR=.next-tracing-production-check` build with
browser tracing enabled initially failed because `/auth/reset-password` used `useSearchParams`
outside a Suspense boundary. The page now provides that boundary and removes an effect that
duplicated the existing invalid-link branch. `pnpm build` subsequently completed all 24 static
pages and targeted ESLint passed. On an isolated port 13001, the built page displayed its invalid
link state without a token and the password form with a test token; `/browse` reported no console
messages. The test did not submit a reset or prove that production authentication supports it.
The isolated server was stopped, and Next.js's temporary tsconfig additions were removed. The
generated build directory remains; no business database or existing 3000/8080 process was changed.
This establishes a Web V2 build, not a production deployment or acceptance of the legacy Web.

Browser ingestion bounds: `tests/integration/browser-tracing.test.ts` now submits 21 spans in one
batch and a body larger than 16 KiB, verifies neither reaches the configured forwarding function,
and sends 61 valid batches from one client to exercise the per-client one-minute limit. The test
confirms at most 60 batches are forwarded and that accepted responses match forwarding calls. This
uses Fastify injection and a stubbed collector, so it does not verify proxy client-IP settings or a
distributed production rate limit. The existing global error handler can map rate-limit errors to
500 as recorded under A8; this test does not assert a 429 response contract.

Browser exporter recovery: synchronous failures while constructing the payload or starting fetch
now release the bounded in-flight counter and report an export failure. A Web SDK regression
test simulated 33 consecutive synchronous fetch failures and verified that a subsequent batch was
sent after fetch recovered. In `apps/web-v2`, `pnpm exec vitest run lib/api/tracing.test.ts
lib/api/client-tracing.test.ts` passed six tests, `pnpm exec tsc --noEmit` passed, and targeted
ESLint and Prettier checks passed. The test does not establish delivery of failed batches.

Web V2 container entry: added `deploy/Dockerfile.web-v2` using the Web V2 frozen lockfile and
Node 22, with explicit browser API origin and tracing build arguments. A Podman build with API
origin `http://localhost:18080` and browser tracing enabled built all 24 pages. The resulting
image started as the `node` user on isolated host port 13002; `/auth/signup` returned HTTP 200,
and the configured API origin appeared in a browser bundle. The test container was stopped and
removed. This is a startup check, not a registration or production deployment acceptance.

The first build exposed that the build context included the nested Web `.env.local`. That build
was interrupted before tagging; `.dockerignore` now excludes nested `.env` and `.env.*` files,
the identified intermediate image from that attempt was removed, and the rebuilt runtime image
contained no `.env.local`. Other Podman caches were not inspected or removed. The existing
production Compose and historical deployment scripts still target the legacy frontend and auth;
the new image does not silently replace those deployment contracts.
`git diff --check` and the operations guide's Prettier check passed. Prettier cannot infer a
parser for the Dockerfile or `.dockerignore`; the existing execution ledger also reports a
whole-file formatting warning and was not reformatted as part of this change.

Collector privacy expansion: with the local Podman Collector and Jaeger running,
`tests/integration/tracing-collector-privacy.test.ts` sent a matched dynamic public route with
test path and query tokens, authorization, cookie, tracestate and baggage markers, then submitted
a browser span with extra secret and email fields through the real API ingestion route. Jaeger
returned the browser span and its server child, and neither its query result nor captured API
logs contained any injected marker. The test passed with the documented loopback endpoints;
targeted ESLint and Prettier passed. This test constructs the browser ingestion request directly,
does not exercise a database, and does not prove privacy for all future sinks or production systems.

Current Compose alignment: `deploy/compose.production.yml` now describes Web V2, the formal
`apps/api` and local JWT authentication, with Web/API container ports 3000/8080 and host loopback
bindings. Its configuration template is `deploy/.env.production.example`; `.gitignore` now
allows the example to be tracked while retaining the general environment-file exclusion. The
historical M9 Compose and example are retained separately as historical references. Their API
Dockerfile has changed and their startup commands are not verified against current code. Existing
historical deployment scripts were not requalified for the new Compose contract.

On Podman, `compose ... config -q` passed with isolated test variables. A Compose build of the
current API and Web V2 source completed, including API TypeScript compilation and Web V2's 24
static pages. The first context upload logged Windows file-mode errors for nested
`apps/api-mock/node_modules`; `.dockerignore` was extended to exclude nested `node_modules`, and
the subsequent API context upload completed without those errors. The Compose provider was the
installed Docker Compose CLI connected to the Podman engine; no Docker daemon was used.

The newly built images were started under the isolated `pci-tracing-compose-acceptance` project
using a fresh dedicated PostgreSQL volume, host ports 13002/18080, test-only credentials and a
temporary private network connection to the local Collector. PostgreSQL became healthy, the
migration exited successfully, API readiness passed, and a real browser registration returned 201
and reached the authenticated dashboard with the newly created identity. Jaeger returned trace
`1766a3ab78434cbc2b085576549c92f7`, with seven connected browser, API, authentication and
PostgreSQL spans. Its response contained none of the injected test email, signup password,
database password, JWT secret, authorization/cookie field names or SQL marker checked in this
run. This is a bounded marker check, not proof of universal privacy. The registration page's
prefetches for `/terms` and `/privacy` returned 404; they are an existing page gap, not evidence
of tracing failure. Jaeger uses transient memory, so the trace ID identifies observed evidence and
is not a durable link after cleanup.

The temporary Collector network attachment, acceptance containers, dedicated volume and network,
and the local Collector/Jaeger stack were removed after the check. The browser stop command
reported that it could not connect. The original `pci-postgres`, 3000 and 8080 were not changed;
the existing 8080 process still needs an authorized reproducible source for its original runtime
configuration before it can be restarted with tracing. Prettier passed for the Compose and
governance documents and `git diff --check` passed with existing line-ending warnings.

Queue saturation visibility: the locked OpenTelemetry SDK emits its first saturation signal at
debug level and reports the total dropped count only after its queue accepts another span. The
diagnostic adapter now turns that exact first signal into one `trace_queue_full` warning per
saturation episode; other debug messages are discarded. The existing `trace_queue_dropped`
warning still reports the count when the queue resumes accepting spans. The timeout test now
asserts that the first warning is present before recovery and is not emitted once per dropped
span. `pnpm exec vitest run tests/integration/tracing-export-failure.test.ts
tests/integration/tracing-shutdown-flush.test.ts` passed two tests; scoped ESLint and Prettier and
`pnpm build:api` passed. The exact diagnostic signal is an SDK 2.0.1 implementation dependency and
must be revalidated on upgrade. This creates a timely log signal; it does not configure or prove
a production alerting pipeline.

Database network fault: a real, migrated PostgreSQL 17 instance ran in a dedicated Podman
container on loopback port 45506. The actual API composition connected through a loopback TCP
proxy. A test hook interrupted connections and closed the proxy listener immediately before the
workspace creator lookup, after account and session creation. Signup returned 201 with
`setupPending`, the workspace error span and safe correlated log were recorded, and no membership
existed. After the proxy reopened, retry with the same access token returned 200 and exactly one
active membership existed. This injects the fault at a controlled point and does not simulate all
network failure modes or a production database outage. It revealed that the driver could wait
indefinitely during close after the interruption; PostgreSQL connection shutdown now gives active
queries five seconds before forcing connections closed, allowing tracing shutdown to proceed.
Queries still running after that interval can be interrupted. The combined request-tracing,
shutdown-flush and API-runtime run passed 19 tests, with three tests requiring a separate database
environment variable skipped. API build and scoped Prettier passed; scoped ESLint was rerun after
documenting the intentionally bound test method. The timeout observation is specific to this
fault injection and proxy. The isolated container was removed after testing.

Deployment drill alignment: the deployment smoke now checks the Web V2 signup and login pages,
API health, readiness and OpenAPI. The isolated deployment script uses the formal API on container
port 8080, Web V2 on port 3000, local JWT and dedicated test credentials. CI configuration builds
the matching Web V2 image; GitHub CI itself has not been run for this change.

On Podman, API and Web V2 images were built from current source; the Web build fixed its browser
API URL to `http://127.0.0.1:45200`. The isolated deployment script passed on host ports 45200
and 45201: migrations, smoke, local signup, login and identity read, backup and restore with 28
migration records, graceful API shutdown, and login and identity read after image replacement.
The replacement used the same API image, so this was not an old-version rollback test. The
isolated backup remains at `output/backups/m9-d61f9235.sql`. The temporary containers and network
were removed; the existing `pci-postgres` remained running, and existing Web 3000 signup and API
8080 health returned HTTP 200. The drill did not enable tracing and is not production acceptance.
Scoped ESLint for the smoke script, Prettier for the smoke script, CI and both operations guides,
and `git diff --check` passed; the latter reported existing line-ending warnings.

Browser OTLP acknowledgement: the API previously treated any successful Collector HTTP response
as full acceptance. It now checks OTLP JSON partial-success fields in camelCase or snake_case,
returns 503 and records `trace_browser_export_failed` on rejection, HTTP failure or invalid
response, and records `trace_browser_export_warning` for a warning without rejection. Collector
messages are not logged. The browser exporter does not retry failed batches; a partial rejection
may already have accepted some spans and does not guarantee delivery of the others. A real Podman
Collector 0.112.0 returned HTTP 200 with `{"partialSuccess":{}}`; its integration test reached
Jaeger and passed. Mocked acknowledgement tests cover rejection, warning, malformed content and
HTTP failure, and API runtime regression passed (16 tests total). `pnpm build:api`, scoped ESLint
for the receiver and its tests, Prettier for the touched code and operations guide, and
`git diff --check` passed; the latter reported line-ending warnings. Full ESLint on the touched
server composition still reports its existing `any` and unsafe assignment errors. The temporary
Collector, Jaeger and network were removed. These checks do not establish a production alert.

Client disconnect after request receipt: a real loopback HTTP request reached the readiness handler,
which the test held open before a response. Destroying the client connection produced exactly one
finished error server span and one `api_request_aborted` log with matching trace/span IDs while the
handler was still held; no response status was invented. Releasing the handler did not produce a
second finished span or completed-request log. The tracing, API runtime and safe-logger tests passed
20 tests, with five database-dependent tests skipped because no test database was configured;
scoped ESLint and Prettier passed. This verifies the controlled disconnect, not every streaming or
proxy disconnect scenario. The same three test files were then rerun against a migrated dedicated
Podman PostgreSQL 16 database on loopback port 45505: all 25 tests passed with no skips, including
the permission and network interruption cases. The dedicated database container was removed.

While checking the touched server composition, a pre-existing public profile defect was identified:
`apps/api/src/main.ts` passes a `PostgresDatabaseConnection` wrapper as `database`, while the public
profile route expects the nested Drizzle `ProductDatabase`. The `any` declaration in the server
dependencies hides this mismatch and causes scoped ESLint errors. Fixing that business endpoint
requires a separately governed product behavior change; it was not changed as part of tracing.

The current `pnpm build` was rerun and still fails on legacy auth, mock and Web V2 errors. Its
NodeNext configuration had also compiled the new Vite browser tracing test entry without its Web
alias configuration; the test-only entry is now excluded from the root release build, removing
those entry-specific errors. The separate API and Web V2 builds pass, but the root build is not a
passed gate; fixing its remaining build boundaries and failures remains outstanding.

Browser telemetry resource bounds: each API server instance now allows at most 16 simultaneous
Collector exports, rejects additional batches with 503 and a safe `collector_concurrency_limit`
warning, and reads Collector responses as streams with a 16 KiB byte limit. Completion, malformed
responses, HTTP errors and timeouts release capacity and abort the outbound request. The existing
two-second timeout applies to response reading as well as the request. The focused browser tracing
suite passed seven tests, including concurrent saturation and recovery, an oversized chunked
response, and a real loopback Collector response body stalled past the timeout; API build and scoped ESLint passed. The real Collector 0.112.0 and Jaeger integration
test also passed with the bounded reader. The temporary Podman observability stack was removed;
this does not establish production capacity or alert thresholds.

Tracing protocol configuration: the Node and browser receiver exporters use OTLP HTTP/JSON. The
API now validates the trace-specific or general OTLP protocol setting when either exporter is
enabled, with the trace-specific value taking precedence, and validates the browser tracing switch
as a boolean. Unsupported protocol values do not prevent startup when both exporters are disabled.
The local and production templates and production Compose expose the trace-specific protocol. The
configuration, exporter-failure and shutdown suites passed five tests; `pnpm build:api` and scoped
ESLint passed. `podman compose --env-file deploy/.env.production.example -f
deploy/compose.production.yml config --quiet` passed using template values, as did scoped Prettier
and `git diff --check` (with existing line-ending warnings). This validates configuration and local
behavior, not a production deployment.

Collector downstream fault visibility: in an isolated Podman stack with Collector 0.112.0 and
Jaeger 1.62.0, Jaeger was stopped and one synthetic OTLP span was sent. The Collector returned 200
and `otelcol_receiver_accepted_spans` reached 1 while its log reported export retries; during retry
`otelcol_exporter_queue_size` was 0 and no send-failure series was yet present. Jaeger was restarted
and the same trace `1234567890abcdef1234567890abcdef` became queryable; sent spans reached 1,
send failures were 0 and queue size remained 0. The stack was then removed. The runbook now explains
the metric and retry limitation, use of protected end-to-end synthetic probes and application logs.
This controlled single-span test does not establish production alerting, loss guarantees or storage
availability objectives.

Collector privacy and real database: an isolated Podman PostgreSQL 16 database was migrated and
used with Collector 0.112.0 and Jaeger 1.62.0. The extended
`tests/integration/tracing-collector-privacy.test.ts` passed with all three test endpoints configured.
It verified a successful local signup, a SQL parameter stored in the disposable database, and one
queried trace containing simulated browser, HTTP, auth, workspace and PostgreSQL spans. The complete
Jaeger response and captured API logs did not contain the test email, password, SQL parameter,
issued access and refresh tokens, dynamic path and query markers, authorization, cookie, baggage,
tracestate, or additional browser payload markers. Scoped ESLint and `pnpm build:api` passed. The
test enforces a loopback disposable database name; it does not use a real browser for the simulated
browser span or establish production privacy controls. The test database and observability stack
were removed, leaving the pre-existing PostgreSQL container intact.

Synthetic tracing probe: `scripts/operations/tracing-probe.ts` exports a randomly identified,
non-business span over OTLP HTTP/JSON and queries Jaeger for the exact trace and span. It bounds
response size and total time, retries transient query failures, rejects partial or malformed OTLP
acknowledgements, and optionally sends a Bearer token only to the query endpoint. Six focused tests
passed, covering path prefixes, transient query failure, unauthorized queries, malformed and partial
acknowledgements, and endpoint restrictions. Scoped ESLint and TypeScript checks, Prettier and
`pnpm build:api` passed. Against isolated Podman Collector 0.112.0 and Jaeger 1.62.0, the CLI
successfully queried trace `95a744c5d6f05e9af8269f35c6761e15`; stopping Collector caused exit 1,
and stopping Jaeger caused exit 1 after the 30-second limit. The local stack was removed afterward.
The runbook documents execution, credentials and constraints. This exercise does not establish
production query authorization, probe scheduling, alert delivery or a production availability target.

Node OTLP partial acceptance: the locked SDK's `Received Partial Success response:` diagnostic is
mapped to `trace_export_partial_success`, without logging the Collector's response text or rejected
count. A loopback HTTP Collector returned an OTLP partial-success response containing a private marker;
the dedicated integration test observed exactly one warning and no marker in application logs. The
configuration, partial-success, export-failure, shutdown-flush and probe suites passed 12 tests;
scoped ESLint and `pnpm build:api` passed. The mapping depends on the SDK's diagnostic text and must
be revalidated on upgrade. It is a log signal and does not establish production alerting or durability.

CI tracing regression: `.github/workflows/ci.yml` now has a separate tracing job so the browser
tracing tests are included and the focused regression can run independently of preflight. Running its
API command locally passed 39 tests across nine files, with five database-dependent tests skipped;
the Web V2 command passed six tests across two files. The browser runner printed jsdom navigation
and Vite configuration warnings. Prettier passed for the workflow. GitHub Actions has not run this
change; this focused job does not replace the full preflight or resolve its existing failures.

The tracing CI job was subsequently extended with a disposable PostgreSQL 16 service and the local
Collector/Jaeger Compose stack. It migrates the dedicated database, supplies the explicit test URLs,
runs the real database fault and Collector privacy cases, and tears down the observability stack even
on failure. Reproducing the expanded server command on this Windows host used Podman PostgreSQL 16
on loopback port 45507, Collector 0.112.0 and Jaeger 1.62.0; all 48 tests across 12 files passed
without skips. The temporary database, Collector, Jaeger and network were removed, and the existing
`pci-postgres` remained running. The Compose provider was Docker Compose connected to Podman; no
Docker daemon was used locally. Prettier and `git diff --check` passed for the workflow, with an
existing line-ending warning. GitHub's Linux job has not yet run and the Collector test constructs a
browser span rather than driving a real browser; this is not production acceptance.

Repeatable local browser regression: `scripts/operations/tracing-browser-acceptance.mjs` drives
the existing Web V2 API-client harness using gstack `/browse` and queries the local Jaeger API.
With the formal `apps/api` on 18080, the harness on 13000, a dedicated migrated Podman PostgreSQL
16 database, Collector 0.112.0 and Jaeger 1.62.0, the script passed. It verifies the signup span
parent chain through auth and PostgreSQL, the two original 401s, one shared refresh, both retries
and their Jaeger links, rejected refresh, an exported cancelled span, and absence of issued test
credentials in the observed browser batches and queried traces. The refresh response is delayed by
the harness to reproduce concurrency; pagehide is synthetic. The script creates and closes its
own browser tab. It uses a Vite harness with the actual Web API client and is not a replacement for
Next.js UI or production acceptance. GitHub Actions does not install gstack or run this test.
The Web tracing unit suites passed six tests; Web typecheck, scoped ESLint and Prettier passed.
The existing jsdom navigation and Vite configuration warnings remain. Setup and execution are in
`112_Request_Tracing_Operations.md`; no product behavior was changed by this regression tool.
After the run, the dedicated browser tab, API and Vite processes, database and observability
containers were stopped; the existing `pci-postgres` remained running, and Web 3000 and API
8080 health returned 200. A fresh `pnpm build` still failed on legacy auth import/type errors,
`apps/api-mock` types and Web V2 files compiled by the root NodeNext configuration. This does not
change the previously recorded independent `pnpm build:api` result.

Do not mark TRACE-01 through TRACE-06 or A1 through A9 fully accepted until the outstanding
evidence and production decisions are completed. The local Collector and Jaeger do not satisfy
production access-control, retention, backup, ownership or operational alerting requirements.

Tracing rollback configuration: previously an invalid OTLP URL, sampling rate or queue setting
could prevent the API starting even when both tracing switches were off. Configuration loading now
ignores settings for disabled collection paths while retaining validation of both switches and all
settings used by enabled paths. A real loopback `apps/api` startup in test mode, with deliberately
invalid unused tracing settings, served health and readiness and retained its correlation header.
The focused configuration, startup, exporter failure, shutdown and API contract suites passed
19 tests across five files; `pnpm build:api` and scoped ESLint passed. This startup test uses the
in-memory test composition, not the user's database or 8080 process. The CI tracing regression now
includes the startup test; GitHub Actions has not run the updated workflow. No product objects,
events, permissions or business states were changed.

Trace fields in structured logs: the logger previously accepted caller-provided `trace_id`,
`span_id` and `trace_sampled` when no valid span was active, allowing stale identifiers to be
mistaken for a real trace. These reserved top-level fields now come only from the current valid
OpenTelemetry context; the caller's context is not mutated. The logger test verifies omission with
no active span and replacement with the active unsampled span. `pnpm exec vitest run
adapters/observability/safe-logger.test.ts tests/integration/request-tracing.test.ts
tests/integration/api-runtime.test.ts` passed 21 tests across three files; five database-dependent
tests were skipped because no isolated test database was configured for this run. Scoped ESLint,
Prettier and `pnpm build:api` passed. `pnpm build` still fails on the previously recorded legacy
auth, mock and Web V2 TypeScript errors. This engineering change does not establish the outstanding
8080 or production acceptance evidence.

Browser telemetry redirect boundary: browser export and the API's Collector forwarding now use
`redirect: 'error'` so a redirect does not forward trace payloads to a different endpoint. A real
loopback HTTP receiver returned 307; the API returned 503, the redirect target received no request,
and a subsequent normal export returned 202. The browser exporter test asserts the same fetch
policy. `pnpm exec vitest run tests/integration/browser-tracing.test.ts
tests/integration/api-runtime.test.ts` passed 20 tests; the two Web tracing suites passed six tests.
API build, scoped ESLint and Prettier passed. Web tests still report the existing jsdom navigation
and Vite configuration warnings. The operations guide records that `Origin` is not authentication
and per-instance limits do not establish production ingress protection. These checks do not prove
production access controls or address the existing 8080 runtime and production acceptance gaps.

Tracing-disabled PostgreSQL rollback regression: a dedicated Podman PostgreSQL 16 container on
loopback port 45509 was migrated and used with the real `apps/api` development composition and
local JWT. With both tracing switches off and an invalid unused OTLP address, registration, login,
workspace initialization, identity read, health and database readiness succeeded; the signup
correlation ID remained in the completed log without trace fields or test credentials. The new
`tracing-disabled-startup.test.ts` case requires the explicit local disposable database name and
passed together with the existing startup case (two tests). A separate startup test also verified
that a valid incoming `traceparent` does not produce trace fields when collection is disabled.
Scoped ESLint passed. The disposable container was removed; the existing business database and
services were not changed. CI already runs this test with its disposable database, but GitHub
Actions has not yet executed it. This is not a rollback drill on the existing 8080 process, nor a
complete Web dashboard or production acceptance.

Next.js browser tracing acceptance: a separate Next.js development server on 13000, formal
`apps/api` on 18080, migrated disposable Podman PostgreSQL 16 database, Collector 0.112.0 and
Jaeger 1.62.0 were used with gstack browse. The actual signup form created a local account and
reached the dashboard via client-side navigation, where the registered email appeared. The
repeatable `scripts/operations/tracing-next-acceptance.mjs` checked the sampled browser parent,
HTTP server, auth signup, account creation, session, workspace and transaction span relationships
in Jaeger, and absence of the test email, password, name and issued access and refresh tokens from
that trace. A manually inspected signup log used the same trace and server span IDs as Jaeger.
The initial test observer mishandled URL inputs and caused a full navigation; the observer was
fixed and the final run explicitly checked that the same browser document survived navigation.
The script clears the test origin's local auth session, so its fixed port must remain isolated.
The runbook records setup and limits. This is development-mode evidence, not production build,
production query authorization, a full privacy audit or acceptance of the existing 8080 process.
Scoped ESLint, Prettier and `git diff --check` passed; the latter reported existing line-ending
warnings. The isolated API, Next.js server, PostgreSQL and observability containers were stopped;
the pre-existing `pci-postgres` remained running and Web 3000 and API 8080 health returned 200.
Automatic command review rejected removal of the generated
`apps/web-v2/.next-tracing-next-acceptance` directory, so it remains in the workspace. The two
temporary Next.js type-directory entries were removed from `tsconfig.json` after stopping the server.

Production Web image tracing regression on 2026-11-08: built the current Web V2 source with
`podman build -f deploy/Dockerfile.web-v2 --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:18080
--build-arg NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED=true -t
localhost/pci-tracing-web-v2-current-acceptance:local .`. The production Next.js build compiled,
typechecked and generated 24 pages. The image ran on isolated port 13000 with the formal `apps/api`
development entry on 18080, a newly migrated disposable Podman PostgreSQL database, Collector and
Jaeger. `scripts/operations/tracing-next-acceptance.mjs` passed using gstack browse: the real signup
form reached the dashboard through client navigation, showed the account email, and produced trace
`56dd5dd6f85c8bc5b8d5964f3fdfc60e` with the expected browser, server, authentication and database
parent relationships. The script checked that the queried trace excluded its test email, name,
password and issued tokens. API start and completion logs shared that trace and server span ID.
The test containers and temporary API process were stopped and removed; the original services and
database were not modified. Jaeger's in-memory trace is no longer retained. This checks a production
Web build against an isolated API, not the existing 8080 runtime or production authorization,
retention, alerting or capacity.

Dynamic result-path privacy regression: the gstack browser harness now sends a request through the
Web V2 API client with distinct result-access and query-token markers. With isolated `apps/api`,
PostgreSQL, Collector and Jaeger, `node scripts/operations/tracing-browser-acceptance.mjs` passed
twice, including its existing signup, concurrent refresh, retry, rejection and cancellation checks.
It waits for the actual browser export batch containing the request, verifies the browser wildcard
route and the server route template are parent and child in Jaeger, and checks both markers and
the existing test credentials are absent from the observed batch and queried traces. This augments
the separate real Collector privacy test that checks API logs; it does not prove privacy for all
future attributes or production sinks. The harness file passed Web V2's ESLint configuration, the
script passed root ESLint, and scoped Prettier passed. Running root ESLint directly against the Web
harness produced type-resolution and existing unsafe-value errors because it uses the root NodeNext
configuration; that command remains a failing cross-project check. Isolated processes and containers
were stopped and removed after the test.

Collector probe acknowledgement validation: the operations probe now rejects responses containing
both JSON field spellings for the same OTLP field, invalid warning types, and numeric rejected-span
counts outside JavaScript's safe integer range. This prevents an ambiguous or malformed response
from being reported as a successful synthetic trace probe. The probe still permits valid Collector
warnings when no spans were rejected, and does not log the warning text. The loopback HTTP probe
and browser receiver integration suites passed 19 tests with `pnpm exec vitest run
tests/integration/tracing-probe.test.ts tests/integration/browser-tracing.test.ts`; scoped ESLint
and `pnpm build:api` passed. A fresh `pnpm build` failed on the previously recorded legacy auth,
`api-mock` and Web V2 NodeNext compilation errors. This change does not establish production
query authorization, alert delivery, or acceptance of the existing 8080 runtime.

Concurrent refresh link and browser error-log regression: every caller waiting for a shared refresh
now has a separate `auth.refresh.wait` internal span linking its completed original HTTP span and
the shared refresh span. The fixed operation and three outcome values are validated by the browser
receiver; its OTLP conversion uses INTERNAL kind and forwards no HTTP or extra input fields for this
operation. The HTTP spans retain their original response timing. The existing 16-link limit on an
individual refresh export remains; per-waiter spans provide bounded associations beyond that limit.
The Web tracing suites and authentication logging test passed 10 tests, including 24 concurrent
waiters with a failed shared refresh and actual OpenTelemetry SDK batch serialization; test tokens
were absent from the batches and captured client console logs. The browser receiver integration
suite passed nine tests, including fixed-operation validation and OTLP forwarding. The API client,
authentication service and session restore now log fixed error messages rather than raw exceptions;
error return and rethrow behavior remains unchanged. Web typecheck, scoped ESLint for the receiver,
new tests and tracing/auth modules, scoped Prettier, and `pnpm build:api` passed. The existing
`client.ts` ESLint check still reports seven pre-existing `no-explicit-any` errors and a navigation
warning; its existing formatting is also outside this scoped format check.

An isolated Podman PostgreSQL, Collector and Jaeger plus formal `apps/api` on 18080 and the Vite
browser harness on 13000 passed `scripts/operations/tracing-browser-acceptance.mjs` with gstack
browse. Two real concurrent expired-token requests each produced a Jaeger internal wait span with
`success` and `FOLLOWS_FROM` links to the original request and the shared refresh; signup, retries,
rejected refresh, cancellation and sensitive-marker checks also passed. The 24-waiter failure test
uses the real SDK with a simulated transport, not 24 live browser requests or production evidence.
The new Web tests are included in the existing tracing CI job, which has not run on GitHub Actions;
the gstack browser script remains a local acceptance check.
Test processes and containers were removed; the existing business database and 3000/8080 services
were left in place. The runbook records that API receiver deployment must precede the updated Web
client, and that a compatible receiver must remain while cached clients exist during rollback.
Existing A1 and production query, retention, alerting, capacity and ownership gaps remain open.

`DEV-058` bounded refresh regression: each caller can cancel its own wait without aborting the
shared request or other waiters. A 15-second limit covers the refresh fetch and response body;
timeout ends the client and waiting spans, releases the shared refresh slot and does not itself
clear the session. Late results cannot write the session. A timed-out rotation may already have
consumed the old token on the server, so retry is not guaranteed to succeed; see the runbook.
In `apps/web-v2`, `pnpm exec vitest run lib/api/client-tracing.test.ts
lib/api/client-tracing-export.test.ts lib/api/tracing.test.ts lib/auth/service-logging.test.ts`
passed 13 tests, including independent cancellation, timeout and late response/body tests;
`pnpm exec tsc --noEmit --incremental false` and scoped test ESLint passed. Root
`pnpm exec vitest run tests/integration/browser-tracing.test.ts tests/integration/api-runtime.test.ts
adapters/observability/safe-logger.test.ts` passed 25 tests; `pnpm build:api` passed. These new
failure cases use simulated browser transport; they are not a new real-browser or production
acceptance run. Web `client.ts` ESLint still reports the seven existing `no-explicit-any` errors
and one navigation warning. Repository build and the A1/production gaps remain as recorded above.

Real-browser bounded refresh evidence: on 2026-11-08, the expanded
`scripts/operations/tracing-browser-acceptance.mjs` passed using gstack browse, the formal API on
18080, a migrated disposable Podman PostgreSQL 16 database, Collector 0.112.0 and Jaeger 1.62.0.
Two expired-token requests shared one real refresh: cancellation ended one linked wait span as an
error, while the other wait span succeeded and its retry linked to the original and refresh. A
second real refresh completed on the server but its response was held by the test page until the
15-second browser timeout. Jaeger contained the server child, the completed error client span and
linked error wait span; the browser retained its original session after timeout and after releasing
the late response. The script also checked signup, rejection, dynamic-path privacy and test secrets.
This simulates a delayed response in browser instrumentation, not dropped network packets or a
production outage. The first attempt failed because the asynchronous test helper returned undefined;
it was corrected before the passing run. The real Collector privacy suite initially failed because
its explicitly named disposable database had not been created; after creating and migrating it in
the temporary container, `tracing-probe`, `browser-tracing` and `tracing-collector-privacy` passed
21 tests. Both changed acceptance files passed scoped ESLint and Prettier. These results do not
close the existing 8080 runtime or production authorization, capacity and operational gaps.

Refresh HTTP status accuracy: the client previously replaced an observed refresh response status
with zero whenever subsequent processing failed. The refresh span now retains a received status;
an independent, allowlisted boolean carries the span error to the browser receiver, including a
response-body timeout after HTTP 200. The receiver validates the boolean and remains compatible
with payloads from older clients. This changes telemetry only and does not alter refresh results.
In `apps/web-v2`, the four tracing and auth logging suites passed 14 tests, including HTTP 503 and
body-timeout cases, and `pnpm exec tsc --noEmit --incremental false` passed. The API receiver suite
passed 10 tests, including the OTLP status mapping and legacy payload. Scoped Web ESLint, Prettier,
and `pnpm build:api` passed. The first receiver test run failed because its test double reused an
already consumed response body; a fresh response per request fixed the test and the rerun passed.
This is simulated transport evidence; the existing 8080 and production acceptance gaps remain.

Real-browser response-body timeout verification: on 2026-11-08,
`scripts/operations/tracing-browser-acceptance.mjs` passed with gstack browse, the current formal
API on isolated port 18080, the Vite harness on 13000, a migrated disposable Podman PostgreSQL 16,
Collector 0.112.0 and Jaeger 1.62.0. The test page let the real refresh response reach the client
and delayed its body read until after the 15-second deadline. Jaeger trace
`112d2c6c94b8cd930b9384f169f533cf`, browser span `a7954a95e42147f9`, contained HTTP status 200,
the error tag and a duration of 15.0161 seconds; the script also verified its API server child,
the linked error wait span, unchanged session and absence of the test secrets. Signup, concurrent
refresh, retry, independent cancellation, rejected refresh and dynamic-path privacy passed in the
same run. The delay is injected at the browser response-body boundary and does not emulate a real
network stall. Jaeger uses temporary memory storage. Scoped ESLint and Prettier passed for the
modified harness, script and runbook. This does not close the 8080 or production acceptance gaps.

Continuation verification on 2026-11-08: the stopped `pci-tracing-acceptance-db` Podman container
was removed. The existing `pci-postgres`, Web on 3000 and API on 8080 remained running; Web `/`
and API `/health` returned 200. A read-only 8080 probe still echoed an invalid correlation ID and
its CORS preflight allowed only `authorization, content-type`, confirming the old runtime remains.
Its original operations authentication settings are not available from the local configuration;
the prior attempt to read the process environment was rejected by automatic execution review.
The process was therefore not restarted and A1 remains incomplete.

`pnpm exec vitest run tests/integration/browser-tracing.test.ts tests/integration/api-runtime.test.ts
adapters/observability/safe-logger.test.ts tests/integration/tracing-probe.test.ts` passed 37 tests
in four files. In `apps/web-v2`, `pnpm exec vitest run lib/api/client-tracing.test.ts
lib/api/client-tracing-export.test.ts lib/api/tracing.test.ts lib/auth/service-logging.test.ts`
passed 14 tests in four files, with jsdom navigation-not-implemented messages. `pnpm build:api`
also passed. These checks do not resolve the existing 8080 or production acceptance gaps.

Environment confirmation on 2026-11-08: the user confirmed that only a local environment is
currently available. Production tracing storage, query authorization, retention, alerting,
capacity budgets and an operations owner therefore remain unverified; local Podman evidence
does not establish production acceptance. The existing 8080 process remains the earlier runtime,
and `.env.local` does not contain the operations authentication settings required by the current
API bootstrap. Its reproducible startup configuration is still needed to restart and verify A1.

Local restart attempt on 2026-11-08: the user authorized stopping the old API on 8080 and
starting the current `apps/api`. The existing `.env.local` PostgreSQL connection was checked
successfully without changing data. The local Podman Collector and Jaeger were started, and the
old API process was stopped. The command to start the replacement API with a generated temporary
operations credential was rejected by automatic execution review (`blocked by policy`); the
reason was not more specific. Port 8080 was confirmed unoccupied afterward. Web on 3000,
`pci-postgres`, Collector and Jaeger remain running. `.env.local` still lacks
`OPERATIONS_ACCESS_TOKEN` and `OPERATIONS_OPERATOR_ID`. A1 remains incomplete.

Local 8080 restart on 2026-11-08: at the user's request, current `apps/api` was started with
Node `--env-file=.env.local --import tsx`, the existing PostgreSQL and JWT settings, a randomly
generated process-only operations token, operator ID `local-operator`, and API and browser tracing
enabled at 100% server sampling. No operations credential was written to disk. The temporary
credential is unavailable after this process exits and does not establish the previous operations
credential; configure persistent local operations credentials before the next restart if those
routes are needed. Web 3000 and API 8080 returned 200; API readiness returned 200. An invalid
correlation ID was replaced, and an allowed-origin preflight included tracing headers. A request
with trace ID `0123456789abcdef0123456789abcdef` produced a `GET /health` server span in local
Jaeger with the supplied parent span ID. This verifies the current 8080 runtime for these checks;
concurrent isolation and production acceptance retain the limitations stated above.
