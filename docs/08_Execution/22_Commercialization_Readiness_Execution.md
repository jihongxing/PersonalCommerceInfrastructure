# Commercialization Readiness Execution Plan

> 依据：`docs/09_Engineering_Governance/31_Commercialization_Readiness_Cutline.md`  
> 状态：Completed — local deployment acceptance  
> 阶段：Reference Product → Real Product  
> 建立日期：2026-08-13  
> 计划性质：独立执行阶段，不命名为 M10/M11/M12

## 1. 阶段目的

本阶段只把 Reference Client 收敛为具备真实使用承载条件的 Real Product 基础：

```text
Real Identity
→ Stable Commerce Identity
→ Real Distribution Ready
→ First Commerce Ready
→ Repeat Supply Support
```

本阶段不负责证明商业成功、PMF、Creator 使用意愿、复购、收入或规模化增长。
真实 Creator 的选择、运营和业务判断由产品负责人决定。

## 2. 执行原则

- 以 `31_Commercialization_Readiness_Cutline.md` 为硬边界；
- 优先消除开发 Token、测试凭据和内部工作台依赖；
- 优先复用现有 API Contract、领域模型、状态机和 Web Design System；
- 任何产品对象、状态、事件、权限或 API 行为变化，先登记独立 `DEV-###`；
- C4 不得直接修改 VS-01；未获产品批准前只做边界设计，不实现 Commerce 行为；
- C5 的真实发生属于业务事实，工程只提供必要承载、记录和审计能力；
- 与 C1–C5 无关的工作进入 Deferred，不在本阶段顺手扩展。

## 3. 工作流与依赖

```text
CR-01  Real Identity Boundary
  ↓
CR-02  Authenticated Creator Desk
  ↓
CR-03  Commerce Identity Productization
  ↓
CR-04  Real Distribution Readiness
  ↓
CR-05  First Commerce Boundary Design
  ↓
CR-06  First Commerce Slice [conditional]
  ↓
CR-07  Repeat Supply Support
  ↓
CR-08  Cutline Verification
```

其中 `CR-06` 只有在产品负责人批准并完成独立产品变更登记后才可启动。

## 4. 任务清单

### CR-01 — Real Identity Boundary

**对应 Cutline**：C1  
**优先级**：Must
**状态**：Completed — controlled Provider evidence verified

**目标**

明确并固定真实身份的最小技术边界，不建设完整账号平台。

**任务**

- 确认 Supabase Auth 作为当前受控 Provider；
- 定义 Sign Up、Login、Session Restore、Logout、Session Expiry 的 Web 行为；
- 定义 Provider User → Creator Mapping 的创建和幂等规则；
- 梳理所有 Creator API 的认证和资源归属检查；
- 明确开发 Token 仅保留在测试适配器和自动化测试中；
- 保留 Provider 失败、映射失败和未认证访问的脱敏错误契约。

**完成证据**

- 身份边界和映射规则已由代码、测试或现有 Contract 明确表达；
- 真实 Hosted Supabase Provider 测试具备成功执行证据；
- 未认证和错误映射路径有自动化覆盖；
- 不新增组织、团队、SSO 或复杂权限对象。

**当前执行记录**

- 已确认 Supabase Auth 是当前受控 Provider；
- `loadAuthConfiguration` 现在要求 `CREATOR_ACTOR_MAPPINGS` 非空；
- 映射键必须使用 `supabase:<provider-user-id>` 格式，空映射、空 Subject、
  空 Creator ID 和未知 Provider 前缀在启动阶段失败；
- 配置、Supabase Adapter 和 Creator Resolver 相关自动化验证通过；
- 定向验证命令 `pnpm vitest run adapters/auth/supabase/supabase-auth-context-provider.test.ts tests/integration/configuration.test.ts tests/integration/supabase-auth-provider.integration.test.ts`
  结果为 13 passed、5 skipped；`pnpm typecheck` 和 `pnpm format:check` 通过；
- 已在受控 PowerShell 进程中注入 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、
  `SUPABASE_TEST_EMAIL`、`SUPABASE_TEST_PASSWORD`，并执行
  `RUN_REAL_SUPABASE_AUTH_TESTS=1 pnpm test:auth:provider`；
- 真实 Hosted Supabase Provider 验证通过：5 tests passed；覆盖真实登录、
  真实 Access Token 验证、无效 Token 稳定错误契约、未映射身份拒绝、
  显式 Creator 映射和网络失败脱敏；
- CR-01 的代码、错误契约、显式 Creator 映射、Creator 资源归属检查和未认证 /
  错误映射自动化覆盖已完成；未新增组织、团队、SSO 或复杂权限对象；
- 本次凭据仅存在于当前 PowerShell 的 `Process` scope，未持久化到 User 或
  Machine scope；重新启动 Codex 或其他进程前，必须在其父进程中重新注入，
  或改用受控 CI Secret 注入。

**禁止事项**

- 不把测试 Token 暴露给生产 Web 页面；
- 不通过静态默认 Token 伪造真实登录；
- 不将任意 Provider 用户自动视为 Creator。

### CR-02 — Authenticated Creator Desk

**对应 Cutline**：C1  
**优先级**：Must
**状态**：Completed — controlled real browser acceptance verified

**目标**

让 Creator 工作台从开发凭据驱动切换为真实 Session 驱动。

**任务**

- 移除 Web Creator 页面中的默认开发 Token 输入和自动注入；
- 增加最小登录、注册、登出和 Session 恢复入口；
- 将真实 Session Token 接入现有 API Client；
- 处理未登录、Session 过期和映射失败状态；
- 保持现有 Creator Identity、Capability、Offering、Request 操作不变；
- 保持 Creator-owned 资源隔离和现有 API Contract。

**完成证据**

- 浏览器验收覆盖注册、登录、刷新、登出和受保护 Creator 路由；
- 真实 Provider + 真实数据库环境下，登录用户可读取和保存自己的身份；
- Session 恢复后不需要开发 Token；
- 未登录用户不能执行 Creator 管理操作；
- 既有 VS-01 浏览器验收全部通过。

**当前执行记录**

- 已移除 Creator 页面中的 `test-creator-token` 默认凭据输入和自动注入；
- 新增基于 Supabase Auth REST Contract 的 Web Session Adapter，支持登录、
  注册、Session 持久化 / 恢复、Access Token 临期刷新、登出和跨标签页状态同步；
- 真实 Session Access Token 已通过现有 `AccessTokenProvider` 接入生成的 API Client；
- 未登录状态只显示认证入口；认证失败、Session 刷新失败和 Creator 映射失败会
  清理本地 Session 并返回登录入口；
- 已新增 `NEXT_PUBLIC_SUPABASE_URL` 和
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` 配置示例；Web 页面只使用公共 Supabase
  Auth 配置，不导入 Supabase SDK、不接触 Service Role Key；
- Playwright 已新增受控 CR-02 浏览器验收入口 `pnpm test:cr02:real`；该脚本
  自动启动临时 PostgreSQL、执行 Migration、解析受控 Supabase User Subject、
  生成显式 Creator Mapping、运行 CR-02 浏览器验收并清理容器；非真实模式使用
  独立测试 Session Fixture，不再依赖页面中的开发 Token；
- 为避免浏览器直连 Hosted Supabase 时的跨域 / 网络阻断，Web Creator Desk 的
  Auth 请求现在通过同源 `/api/auth/*` Route Handler 转发到 Supabase；公共 Web
  配置仍只包含 Supabase URL 与 anon / publishable key；
- Session Adapter 自动化测试通过：4 passed；认证 Adapter 测试、Web 类型检查、
  Lint、格式检查、Production Build 和全仓测试均通过；全仓测试结果为
  147 passed、8 skipped；浏览器验收结果为 16 passed、2 CR-02 real tests
  skipped；
- 已在受控 PowerShell 中执行 `pnpm test:cr02:real`，真实浏览器验收通过
  `2 passed`；覆盖真实登录、Session 刷新恢复、登出、受保护 Creator 路由和
  未认证 Creator 管理请求拒绝；脚本自动完成临时 PostgreSQL Migration、真实
  Supabase User Subject 解析、显式 Creator Mapping 和容器清理。

**禁止事项**

- 不新增账号中心、组织、团队成员和复杂角色系统；
- 不修改现有 VS-01 的 Request、Confirm、Decline 语义。

### CR-03 — Commerce Identity Productization

**对应 Cutline**：C2  
**优先级**：Must
**状态**：Completed — structure and public metadata verified

**目标**

把现有 Identity、Introduction、Capabilities、Offerings、Availability 和
Commerce Actions 收敛为稳定的个人商业首页。

**任务**

- 审查 Creator Identity 与 Public Surface 的信息层级；
- 完成第二轮 `apps/web` 结构化 UI/UX 收敛；
- 确认 Identity、Capability、Offering 的编辑、发布、下线和公开边界；
- 确认 Public URL 的稳定生成和访问行为；
- 完善空状态、加载状态、错误状态和下一步引导；
- 使桌面端与移动端都能清楚表达身份、供给和请求入口；
- 增加必要的页面 metadata / share preview，但不引入渠道管理平台。

**完成证据**

- Creator 页面和 Public Surface 的信息结构通过 UI 审查；
- 真实数据下可创建、编辑、发布、下线并重新访问；
- Draft / Published / Unpublished 边界保持不变；
- Public Surface 不暴露内部凭据、内部状态或非公开字段；
- 现有 API、状态机、权限和浏览器验收不回归。

**禁止事项**

- 不新增 Marketplace、搜索、推荐、会员或 CRM；
- 不把 Commerce Identity 扩展为新的复杂领域 Primitive。

**当前执行记录**

- Creator Desk、Identity、Capability、Offering、Availability、Request 入口均
  保持现有 API Contract 和状态机；未新增 Commerce Identity 领域 Primitive；
- 动态 Public Offering 页面已增加基于真实公开响应的页面标题、描述和 Open Graph
  metadata；不可访问或下线内容使用不可索引的通用错误 metadata，不泄露内部字段；
- Creator / Public Surface 的空状态、加载状态、错误状态和下一步引导保持可见；
- Web Production Build 通过，Creator Identity / Offering / Customer Request 相关
  应用集成测试通过：26 passed；既有浏览器验收保持通过。

### CR-04 — Real Distribution Readiness

**对应 Cutline**：C3  
**优先级**：Must
**状态**：Completed — product-approved local deployment acceptance

**目标**

保证 Commerce Identity 可以脱离内部工作台被外部渠道承载。

**任务**

- 验证公开 URL 在真实部署环境可访问；
- 验证未登录外部访问、移动端访问和刷新行为；
- 验证分享入口指向正确的 Published Offering；
- 验证外部访问可以进入现有 Request Flow；
- 验证 Unpublished Offering 阻止新 Request 并保留既有记录；
- 验证分享 metadata、页面标题和预览信息不泄露内部数据；
- 保留 Creator 记录外部分发的现有能力，不建设渠道集成。

**完成证据**

- 使用产品负责人批准的本地部署地址完成 Public Surface → Request 浏览器验证；
- 桌面和移动视口验证通过；
- 未登录访问不要求 Creator 认证；
- 公开页面的边界和请求入口符合现有 VS-01 Contract；
- 公开 URL、错误页面和恢复路径具备可复现证据。

**禁止事项**

- 不建设抖音、小红书、B 站、微博、微信等渠道 API 集成；
- 不建设社交传播、推荐或增长系统。

**当前执行记录**

- 2026-08-14 产品最高负责人批准本地部署和本地验收作为 CR-04 的完成证据；该
  证据明确属于 localhost / local deployment acceptance，不代表外部生产部署；
- 专用 System Edge 浏览器验收在 390 × 844 移动视口通过，覆盖未登录公开访问、
  刷新、Published Offering、动态 title / description / Open Graph metadata、
  Public Surface → Request、Unpublished 阻断新 Request 和既有结果保留；
- 既有桌面浏览器套件继续覆盖 Public Surface → Request；公开页面未暴露 Creator
  Token、Result Token 字段名或内部 capability ID；
- 本地生产镜像构建和 `pnpm test:deployment` 通过，覆盖 Migration Job、API/Web
  Smoke、Backup/Restore、优雅停机和应用回滚；未新增渠道 API 或增长系统。

### CR-05 — First Commerce Boundary Design

**对应 Cutline**：C4  
**优先级**：Must（设计门槛）
**状态**：Completed — design frozen pending product approval

**目标**

在不改变 VS-01 的前提下，明确 Creator-direct Commerce 的最小变更边界。

**任务**

- 对 `Request → Confirm → External Payment → Fulfillment` 做领域和 Contract 影响分析；
- 明确是否新增对象、状态、事件、权限或 API；
- 明确 External Payment 和 Fulfillment 的事实记录与证据引用；
- 明确 Creator、Customer、Pilot Operations Actor 的权限边界；
- 明确幂等、审计、脱敏和错误处理；
- 形成独立 `DEV-###` 或产品变更单元；
- 在产品负责人批准前保持实现冻结。

**完成证据**

- 独立变更单元已登记；
- 变更范围、状态转换、事件、权限、API 和验收条件明确；
- 明确说明对 VS-01 的兼容性和不变项；
- 未在未批准状态下修改生产产品行为。

**禁止事项**

- 不建设支付平台、资金托管、退款、多方结算或大型订单系统；
- 不把“记录外部事实”扩展成平台资金流。

**当前执行记录**

- 已登记独立设计变更单元 `CR-05-DESIGN-001`；该单元只输出边界设计，不修改
  VS-01 生产行为；
- 影响分析明确：现有 `Request → Confirm` 保持不变；External Payment 和
  Fulfillment 只能作为后续独立产品变更中的外部事实记录，不进入当前 Request
  状态机；
- 设计冻结的候选最小记录字段为：关联 Request、外部事实类型、发生时间、操作者、
  证据引用和脱敏备注；不记录支付凭据、不托管资金、不实现退款或结算；
- Creator 只能处理其拥有的 Request；Customer 只能查看现有结果入口；Pilot
  Operations Actor 若未来获批准，只能记录已发生的外部事实，不能改变 VS-01 的
  Confirm / Decline 语义；
- 幂等键、审计关联、敏感信息脱敏和错误契约必须在批准后的独立 DEV 变更中落地；
  当前保持实现冻结。

### CR-06 — First Commerce Slice

**对应 Cutline**：C4  
**优先级**：Conditional Must
**状态**：Completed — approved observation-only First Commerce Slice

**启动条件**

- `CR-05` 已完成；
- 产品负责人已批准独立产品变更；
- DEV 编号、验收条件和回滚边界已登记。

**目标**

实现最小 Creator-direct Commerce 承载：

```text
Request → Confirm → External Payment Recorded → Fulfillment Recorded
```

**任务**

- 仅实现批准的最小状态和事件；
- 仅允许授权角色记录外部付款和履约事实；
- 保留证据引用、时间、操作者和关联 Request；
- 实现幂等和重复操作保护；
- 增加 API、集成、浏览器和审计验证；
- 更新运行手册和回滚说明。

**完成证据**

- 新增变更的所有自动化和浏览器验收通过；
- 未改变 VS-01 已有路径；
- 未出现资金托管、支付凭据处理或退款行为；
- 事件和日志不泄露敏感支付信息。

**未满足启动条件时**

本任务保持 `Deferred / Not Started`，不得以 Mock 或测试点击宣称 First Commerce
已完成。

**当前执行记录**

- 2026-08-14 产品最高负责人批准 CR-06，`DEV-005` 已登记并关闭验证；实现只允许
  Pilot Operations 对 Confirmed Request 记录 `external_paid_verified` 和
  `fulfillment_observed`，且付款事实必须先于履约事实；
- `CommerceAction.state` 始终保持 `confirmed`；未新增已付款 / 已履约状态，未实现
  支付处理、支付凭据、托管、退款、结算或履约执行；
- PostgreSQL 通过 partial unique index 保证每个 Action / 外部事实类型最多一条，
  In-Memory 与 PostgreSQL Store 对重复请求幂等返回既有事实；
- 新增受控 Operations API 和 `/operations` Reference Client，仅接受 Access Token、
  Action ID、证据引用和外部发生时间；响应保留事实类型、操作者和审计关联；
- 应用、配置、API 集成、数据库迁移、OpenAPI 和专用 System Edge 浏览器验收通过；
  浏览器证据覆盖错误令牌、履约顺序、付款幂等、履约记录及 Customer 结果仍为
  `confirmed` 的边界。

### CR-07 — Repeat Supply Support

**对应 Cutline**：C5  
**优先级**：Should
**状态**：Completed — existing supply lifecycle and ownership verified

**目标**

为 Creator 后续更新、补充和再次发布供给提供稳定的系统承载，不伪造业务结果。

**任务**

- 确认现有 Offering 编辑、复制或新增路径能支持后续供给；
- 确认已完成或已关闭 Request 不阻断新的合法供给；
- 保留 Creator 对 Identity、Capability 和 Offering 的所有权；
- 为后续供给事件保留最小可审计记录；
- 如需要新增行为，先登记独立变更；
- 不建设 Analytics Dashboard，只保留必要的查询和审计能力。

**完成证据**

- 自动化测试证明同一 Creator 可安全维护多个 Offering；
- 旧 Request、已下线 Offering 和新 Offering 的边界清晰；
- 重复发布不会产生非预期状态覆盖或权限穿透；
- 文档明确：Repeat Supply 是否发生由业务事实决定，不能由测试伪造。

**当前执行记录**

- 现有 Offering 创建、编辑、发布、下线和重新创建路径保持稳定；同一 Creator
  通过 Creator-owned 查询维护多个供给，不共享其他 Creator 的所有权；
- Unpublished Offering 阻止新 Request 但保留既有 Request 结果；已完成或关闭的
  Request 不阻断新的合法 Offering；
- 重复 Confirm / Decline 和越权操作已有冲突 / 授权测试，未发现状态覆盖或权限
  穿透；相关应用和浏览器验收保持通过；
- C5 的业务事实仍未被测试伪造；系统只提供后续供给的编辑、发布和审计承载。

### CR-08 — Cutline Verification

**对应 Cutline**：C1–C5  
**优先级**：Must
**状态**：Completed — product-approved local cutline verification

**目标**

在阶段结束时形成技术 Cutline 判断，不代替业务对 Creator 使用结果的判断。

**任务**

- 汇总 C1–C4 的实现、测试、真实环境和部署证据；
- 标记 C5 的系统承载状态与业务事实状态；
- 重跑现有 Preflight、API、数据库、浏览器和部署验证；
- 复核 Deferred 清单没有被隐式引入；
- 复核所有产品行为变化都有独立变更记录；
- 给出 `Ready / Not Ready / Ready with Explicit Exceptions` 判断。

**Cutline 通过条件**

```text
真实身份可用
→ Commerce Identity 稳定
→ Public URL 可分发
→ 真实 Request 可进入
→ 数据、权限、状态和审计可追踪
→ 部署、恢复和回归验证可复现
```

该判断只说明系统是否具备技术承载条件，不说明商业成功或 Creator 采用结果。

**当前执行记录**

- C1 Real Identity：Ready；CR-01 真实 Hosted Supabase Provider 5/5 通过，CR-02
  真实浏览器验收 2/2 通过；
- C2 Commerce Identity：Ready；Creator / Public Surface 结构、状态边界、公开
  metadata 和现有 API / 浏览器回归通过；
- C3 Real Distribution：Ready under approved local acceptance；移动与桌面 Public →
  Request、刷新、metadata、Published / Unpublished 边界和既有结果保留均已验证；
- C4 First Commerce：Ready；CR-05 设计冻结，产品负责人批准 `DEV-005`，CR-06
  observation-only 外部付款 / 履约事实记录及幂等、鉴权、审计和浏览器边界通过；
- C5 Repeat Supply：System Ready, Business Fact Unverified；系统承载、所有权、
  下线边界和重复操作保护已有测试，但没有用测试伪造真实复购或重复供给事实；
- 本地生产镜像、Migration、Readiness、Smoke、Backup/Restore、优雅停机和回滚
  演练通过；Preflight 与完整回归结果记录在本阶段最终验证中；
- 综合技术判断为 `Ready`，依据产品最高负责人批准的 localhost / local deployment
  acceptance。该判断明确不等同于外部生产部署通过，也不证明商业成功；C5 仍为
  System Ready, Business Fact Unverified，不以测试伪造真实重复供给事实。

## 5. 阶段门禁

### Gate A — Identity Ready

必须完成 `CR-01`、`CR-02`：

- 真实 Provider 配置可用；
- Web 不再依赖开发 Token；
- Session 生命周期可验证；
- Creator Mapping 和资源隔离通过。

### Gate B — Identity Surface Ready

必须完成 `CR-03`、`CR-04`：

- Commerce Identity 可稳定编辑和公开；
- Public URL 可从外部访问；
- Request Flow 保持现有 VS-01 语义；
- 桌面端和移动端验证通过。

### Gate C — Commerce Boundary Ready

必须完成 `CR-05`：

- First Commerce 是否启动已有明确业务决策；
- 若启动，独立变更已登记；
- 若不启动，C4 明确保持 Deferred；
- 不得以未批准代码替代决策。

### Gate D — Real Product Cutline Ready

必须完成 `CR-08`，并满足技术 Cutline Definition of Done。

`CR-06` 若未获批准，可以保持未启动，不阻塞 C1–C3 的技术收敛，但必须明确记录
为 `Deferred / Not Started`。

## 6. Deferred 清单

本阶段明确不做：

- Marketplace；
- Creator 搜索和推荐；
- 多垂直扩展；
- CRM 和粉丝会员；
- AI Agent；
- 复杂日历和自动排期；
- 多方结算、平台资金托管和大规模支付基础设施；
- 大型运营后台和 Analytics Dashboard；
- SaaS Pro、组织、团队和复杂协作；
- 生态开放平台；
- 任何未登记的 VS-02 产品能力。

## 7. 阶段完成输出

阶段完成时只需要形成：

- C1–C4 的实现和验证证据；
- C5 系统承载与业务事实的明确区分；
- First Commerce 是否启动的业务决策记录；
- Preflight、浏览器、数据库、部署和恢复验证结果；
- `Ready / Not Ready / Ready with Explicit Exceptions` 技术判断；
- 下一阶段是否需要独立产品变更的明确入口。

不要求新增大型路线图、平台架构或商业运营计划。
