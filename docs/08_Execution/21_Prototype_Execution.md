# 21 — Prototype Execution

> **Status**：VS-02D Engineering Readiness READY
> **Phase**：VS-02D Internal Technical Readiness / Real Money Activation Disabled
> **Product**：Personal Commerce Infrastructure  
> **Build Target**：VS-01 Regression + VS-02A–VS-02D Engineering Readiness Baseline
> **Implementation Mode**：Reference Product / Controlled Paid Commerce without Real Money
> **Source of Truth**：[20 MVP PRD: VS-01](../07_Product_Architecture/20_MVP_PRD_VS01.md)  
> **Upstream Product Definitions**：[17 Core Product Objects](../07_Product_Architecture/17_Core_Product_Objects.md)、[18 MVP Product Flow](../07_Product_Architecture/18_MVP_Product_Flow.md)、[19 MVP Product Specification](../07_Product_Architecture/19_MVP_Product_Specification.md)  
> **Document Type**：Living execution record; implementation status, deviations, blockers, testing evidence and handoff only  
> **Last Updated**：2026-08-16

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
NEXT TASK = RESUME-001 — Project Re-entry Audit & Reopening Decision
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
