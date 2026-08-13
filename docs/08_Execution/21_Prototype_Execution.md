# 21 — Prototype Execution

> **Status**：Prototype Ready  
> **Phase**：Post-Build Product Review  
> **Product**：Personal Commerce Infrastructure  
> **Build Target**：VS-01 — Dancer Private Lesson Request  
> **Implementation Mode**：Controlled Prototype / Shadow Commerce  
> **Source of Truth**：[20 MVP PRD: VS-01](../07_Product_Architecture/20_MVP_PRD_VS01.md)  
> **Upstream Product Definitions**：[17 Core Product Objects](../07_Product_Architecture/17_Core_Product_Objects.md)、[18 MVP Product Flow](../07_Product_Architecture/18_MVP_Product_Flow.md)、[19 MVP Product Specification](../07_Product_Architecture/19_MVP_Product_Specification.md)  
> **Document Type**：Living execution record; implementation status, deviations, blockers, testing evidence and handoff only  
> **Last Updated**：2026-08-12

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
| Real-money Public Launch    | Not Ready           | 禁止启动                                       |

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

| Item                       | Current Status  | Evidence / Note                                                                                          |
| -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| Engineering Governance     | Complete        | `22_Engineering_Governance.md` 已建立；`scripts/test/preflight.ps1 -SkipProjectTests` 于 2026-08-11 通过 |
| Technology Architecture    | Complete        | CU-TA-01–CU-TA-07 已落地；真实 Supabase Provider 验证通过，ENG-008 已关闭                                |
| VS-01 Controlled Prototype | Prototype Ready | M1 / M1.5、M2–M8 全部完成；完整 Canonical Flow 已在 System Edge 通过                                     |
| PRD Traceability           | Complete        | FR-001–FR-053 全部为 Implemented，并有领域、应用、API、持久化或验收证据                                  |
| Acceptance Testing         | Complete        | AT-001–AT-013 全部 Pass；System Edge 16/16，通过完整 VS-01 路径与 Explicit Non-goal 检查                 |
| Real-money Capability      | Deferred        | PRD 明确禁止                                                                                             |

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

| Deviation ID | Related PRD                                | Status            | Note                                                                                                                                                                                                                                                                                                        |
| ------------ | ------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEV-001      | FR-029 / FR-030 / FR-031 / AT-006 / AT-007 | Closed — Verified | PRD 冻结“最小可联系信息”与“服务相关 Request 信息”，未冻结字段名；M5 以 `contactName`、`contactMethod`、`requestMessage` 实现最小可处理 Request，不新增 CRM、账号注册、支付或预约能力。                                                                                                                      |
| DEV-002      | FR-023 / AT-005 / `storefront_viewed`      | Closed — Verified | 公开入口允许 Customer 在未提交 Request 前保持匿名，但 Canonical Event 需要 actor ID；M5 以请求关联 ID 作为匿名访问的技术 actor 标识，只记录公开 Storefront 打开事实，不创建 Customer 或平台账号。                                                                                                           |
| DEV-003      | FR-041 / AT-008 / AT-009                   | Closed — Verified | 匿名 Customer 提交后需要查看 Confirmed / Declined 结果，但 VS-01 不创建账号；M6 返回仅能读取该 Request 结果的轻量访问 token，并由公开结果页与 System Edge AT-008 / AT-009 验证；不创建 Session、CRM、支付或履约能力。                                                                                       |
| DEV-004      | FR-045 / FR-046 / FR-047 / ENG-010         | Closed — Verified | M7 Controlled Prototype 使用可替换 Notification Port；测试环境使用 In-Memory Adapter，当前运行时使用脱敏 Log Adapter，并由 Creator 待处理列表与 Customer 结果页验证正确角色可得知状态变化。通知失败隔离测试通过；不宣称真实短信、邮件或推送 Provider 已通过验证；通知中心、读状态、偏好与营销推送仍不实现。 |

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

| Test ID | Status | Evidence                                                                                                                                                                                    | Defect / Deviation | Date       |
| ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- |
| AT-001  | Pass   | System Edge Playwright `vs01.spec.ts`; complete Identity → Capability → Draft Offering → Publish → Share → Request → Confirm → Customer Result path                                         | —                  | 2026-08-12 |
| AT-002  | Pass   | System Edge Playwright `m4-publish-share.spec.ts`; incomplete Draft Offering shows missing conditions and cannot publish                                                                    | —                  | 2026-08-12 |
| AT-003  | Pass   | System Edge Playwright `m4-publish-share.spec.ts`; eligible Offering → Published → Generated Asset                                                                                          | —                  | 2026-08-12 |
| AT-004  | Pass   | System Edge Playwright `m4-publish-share.spec.ts`; Creator explicitly records external distribution                                                                                         | —                  | 2026-08-12 |
| AT-005  | Pass   | System Edge Playwright `m5-customer-request.spec.ts`; Buyer views current Published Offering through public Storefront                                                                      | DEV-002            | 2026-08-12 |
| AT-006  | Pass   | System Edge Playwright `m5-customer-request.spec.ts`; anonymous Buyer submits complete Request and sees Submitted result                                                                    | DEV-001            | 2026-08-12 |
| AT-007  | Pass   | System Edge Playwright `m5-customer-request.spec.ts`; Unpublished Offering is unavailable; application test also rejects incomplete Request without Action / event                          | DEV-001            | 2026-08-12 |
| AT-008  | Pass   | System Edge Playwright `m6-creator-decision.spec.ts`; existing Submitted Action remains Confirmable after Offering Unpublish, records Confirmed result and Customer sees the bounded result | DEV-003            | 2026-08-12 |
| AT-009  | Pass   | System Edge Playwright `m6-creator-decision.spec.ts`; owning Creator declines Submitted Action and Customer sees the bounded Declined result                                                | DEV-003            | 2026-08-12 |
| AT-010  | Pass   | System Edge Playwright `m6-creator-decision.spec.ts`; unauthorized action returns 403, repeated terminal action returns 409, and Customer result remains unchanged                          | —                  | 2026-08-12 |
| AT-011  | Pass   | System Edge Playwright `m5-customer-request.spec.ts`; existing Submitted Action remains stored after Unpublish and new Request is blocked                                                   | —                  | 2026-08-12 |
| AT-012  | Pass   | Application acceptance `external-observation-use-cases.test.ts`; evidence-backed external observations append only Canonical Events and leave Commerce Action state unchanged               | —                  | 2026-08-12 |
| AT-013  | Pass   | System Edge `foundation.spec.ts`; Reference Client and real OpenAPI expose no deferred commerce operations, states or metrics                                                               | —                  | 2026-08-12 |

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
- 2026-08-13 本地未配置 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_TEST_EMAIL`、`SUPABASE_TEST_PASSWORD`，因此真实 Hosted Supabase Provider 测试保持 5 项 conditional skip；该验证只能在受控环境注入凭据后执行，不以本地 Mock 或 Skip 作为通过证据；
- 真实依赖复验入口保持可复现：PostgreSQL 使用 `DATABASE_URL=... pnpm db:migrate && pnpm test:persistence`，Hosted Supabase 使用 `RUN_REAL_SUPABASE_AUTH_TESTS=1 pnpm test:auth:provider`，后者缺少四项凭据时必须停止并报告缺失项；
- `.github/workflows/ci.yml` 已新增仅允许 `workflow_dispatch` 触发的 `supabase-provider` Job；该 Job 注入受控 GitHub Secrets 后运行 `pnpm test:auth:provider`，用于持续保留真实 Hosted Provider 通过或失败的证据；
- 2026-08-13 Production-like Compose 复验未形成通过证据：本机 `podman compose` 委托外部 Docker Compose provider 后超时，最终未遗留容器、网络、卷或端口；不将该次环境超时误报为 Compose 通过，需在可用 Compose provider / Registry 环境重跑；
- `pnpm typecheck`、`pnpm test:governance`、`pnpm check:openapi` 与受影响文件 Prettier 检查均通过；
- M9 不修改 `FR-001–FR-053`、AT-001–AT-013 产品语义、状态机、权限、Canonical Event 或 Deferred Capability。

**边界**

- 不修改 `FR-001–FR-053`；
- 不修改 AT-001–AT-013 的产品语义；
- 不新增产品对象、状态、权限或 Canonical Event；
- 不引入 Payment、Settlement、Refund、Marketplace、CRM、自动排期或履约工作流；
- 任何后续产品行为变化仍必须先登记 `DEV-###`。
