# 22 — 工程治理

> **状态**：Decision v1 — M2 基础实现已通过门禁
> **阶段**：执行阶段
> **范围**：VS-01 受控原型
> **文档角色**：连接冻结 PRD 与代码实现的工程事实源
> **产品方向上游**：[05 — Personal Commerce Infrastructure Product Direction](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)
> **产品合同**：[20 MVP PRD: VS-01](../07_Product_Architecture/20_MVP_PRD_VS01.md)
> **执行台账**：[21 Prototype Execution](../08_Execution/21_Prototype_Execution.md)
> **最后更新**：2026-08-11

## 1. 目的

本文件定义如何把冻结的产品事实转换成可治理的工程事实：

```text
产品事实
→ 工程治理
→ 代码
→ 测试
→ 执行证据
→ 验收
```

治理目标不是提前决定技术栈，而是保证：

1. 产品对象、业务模块、代码边界和测试边界可以追溯；
2. 状态机和规范事件不会因实现便利而漂移；
3. PRD、代码、测试和验收测试保持一致；
4. 依赖、配置、环境、安全和可观测性具有明确边界；
5. 产品行为变化必须经过偏差与产品决策流程。

本文件不实现 VS-01，不新增产品对象，也不修改 17–20 的产品定义。

## 2. 工程状态

### 2.1 仓库审计基线

审计日期：2026-08-11。

| 领域         | 当前发现                                         | 治理决策                                                   |
| ------------ | ------------------------------------------------ | ---------------------------------------------------------- |
| 仓库版本控制 | Git repository 已初始化                          | 后续变更使用正式版本控制；本次未创建 Commit                |
| 应用代码     | 已建立 `apps/prototype` 组合根与 M2 Identity Service | 只实现已批准 M2 用例，不实现完整 VS-01                      |
| 业务模块     | 已建立 Creator Identity 领域模块                   | 后续 Offering、分发、请求和决策继续按业务能力归属            |
| Adapter      | 已建立 Auth、PostgreSQL、API 与安全日志 Adapter     | 外部能力继续通过 Port / Adapter 边界进入                    |
| Package      | 仍未建立共享 Package                                | 只有出现两个真实使用方时才允许抽取                          |
| 基础设施     | PostgreSQL Schema、Migration 与事务 Repository 已建立 | 后续数据变化继续通过版本化 Migration 与 Persistence Adapter |
| 依赖         | `package.json` 与 `pnpm-lock.yaml` 已建立        | 工程工具依赖已锁定；业务 Provider 仍需单独登记             |
| 测试         | Vitest、PostgreSQL 集成测试和 Edge Acceptance 已建立 | M2 子流程通过；AT-001–AT-013 完整链路继续按里程碑解除 Skip |
| CI           | GitHub Actions 已执行完整 Preflight              | 合并前必须保持治理、格式、Lint、类型、测试和构建通过       |
| 环境         | 配置 Bootstrap 与 `.env.example` 已建立          | 环境读取只允许发生在 Bootstrap 边界                        |

### 2.2 构建状态

| 层级         | 状态                                 |
| ------------ | ------------------------------------ |
| 工程治理基线 | **完成**                             |
| VS-01 实现   | M1 / M1.5 完成；M2 FR-001–FR-004 已实现，FR-005 Partial；M3–M7 未开始 |
| 自动化测试   | M2 及基础门禁通过；91 项通过，21 项 Skip |
| 验收测试     | M2 Identity 子流程已通过 Edge；完整 VS-01 验收仍未开始 |
| 真实支付能力 | 不允许                               |

## 3. 事实源映射

| 事实类型       | 产品事实源                                                                                                         | 工程事实                  | 验证方式       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------- | -------------- |
| 产品范围与规则 | `20_MVP_PRD_VS01.md`                                                                                               | 业务模块命令、查询与策略  | FR 测试 + AT   |
| 产品对象       | `17_Core_Product_Objects.md`                                                                                       | 领域模型映射              | 领域测试       |
| 状态转换       | `18_MVP_Product_Flow.md` / `20`                                                                                    | 状态转换策略              | 状态机测试     |
| 表面行为       | `19_MVP_Product_Specification.md`                                                                                  | 应用组合与界面测试        | 集成测试 + AT  |
| 规范事件       | `20` 与本文事件注册表                                                                                              | 事件生产者与合同          | 事件测试       |
| 功能需求       | `20` 的 FR-001–FR-053                                                                                              | `21` 中的追溯矩阵         | 需求测试       |
| 验收路径       | `20`、`21` 的 AT-001–AT-013                                                                                        | 验收测试套件              | 验收证据       |
| 实现状态       | `21_Prototype_Execution.md`                                                                                        | 代码与测试证据            | 执行复审       |
| 架构边界       | 本文、`23_Technology_Architecture_Decision.md`、`24_Technology_Architecture_Implementation_Plan.md` 及配套治理文档 | 目录、模块与导入检查      | 治理预检       |
| 配置与密钥     | `configuration-and-secrets.md`                                                                                     | 配置 Bootstrap            | 架构与安全检查 |
| 外部能力       | `external-dependencies.md`                                                                                         | Port、Adapter、真实性级别 | 集成测试与预检 |
| 代码约定       | `code-style-and-naming.md`                                                                                         | Formatter / Linter 配置   | 约定检查       |

## 4. 仓库与架构治理

### 4.1 以业务为中心的边界模型

目标架构是治理模型，不是要求提前创建空目录：

```text
apps/       应用组合根与可运行应用
modules/    业务能力与业务规则
adapters/   外部服务与基础设施实现
packages/   真正跨应用复用的能力
infra/      环境、交付与运行资产
database/   数据迁移与持久化资产
scripts/    仓库自动化与治理检查
docs/       产品、工程与执行事实
```

### 4.2 边界规则

1. `apps/` 负责组合，不拥有可复用业务规则；
2. `modules/` 负责业务术语、命令、查询、策略和状态转换；
3. `adapters/` 实现显式 Port，Provider SDK 类型不得泄漏到领域模块；
4. `packages/` 只有在存在两个真实使用方时才能共享；
5. `infra/` 与 `database/` 不定义产品行为；
6. UI 和传输层通过应用层命令与查询访问业务能力；
7. 页面、API 资源、数据库表和产品对象是独立建模决策；
8. 不得让 `utils`、`helpers`、`common` 或 `misc` 成为业务规则归属处。

### 4.3 VS-01 初始模块映射

| 业务能力         | 模块责任                            | 主要 FR       |
| ---------------- | ----------------------------------- | ------------- |
| Creator 商业身份 | 身份归属、公开状态、Capability 关联 | FR-001–FR-005 |
| 服务型供给       | Offering 生命周期与发布条件         | FR-006–FR-013 |
| 分发             | 分发资产生成与真实分享记录          | FR-014–FR-022 |
| 客户请求         | Customer 关联与 Request 提交规则    | FR-023–FR-033 |
| 商业决策         | Confirm / Decline 与 Action 终态    | FR-034–FR-042 |
| 产品事实         | 规范事件注册、生产与审计上下文      | FR-043–FR-053 |

该映射是工程责任建议，不是新增产品对象模型。

## 5. 产品 → 领域 → 代码 → 测试 → 验收追溯

### 5.1 必须存在的追溯链

每项 Must Build 需求必须能够追溯：

```text
FR
→ 业务模块能力
→ 命令 / 查询 / 策略
→ 实现位置
→ 领域或集成测试
→ AT 路径
→ 执行证据
```

权威 FR 状态仍维护在 `21_Prototype_Execution.md`。没有同步证据的代码变更不视为完成。

### 5.2 追溯规则

1. 每个改变产品状态的命令必须声明所属模块；
2. 每个状态变更命令必须有领域测试或应用测试；
3. 每个规范事件必须有生产者测试，以及适用时的重复触发和非法触发测试；
4. 每个 AT 必须标明覆盖的 FR；
5. 测试必须断言业务结果，而不只是 HTTP 状态码或渲染文本；
6. Mock 或 Fixture 只能验证应用行为，不能证明真实外部能力；
7. 一个实现覆盖多条 FR 时，追溯记录必须列出全部 FR，不得复制业务逻辑。

## 6. 领域模型治理

### 6.1 产品对象到工程模型

| 产品对象           | 工程责任               | 持久化 / 传输决策                          |
| ------------------ | ---------------------- | ------------------------------------------ |
| Creator            | 归属与 Actor 身份      | 独立决策，不自动等于表或 API 资源          |
| Commerce Identity  | 公开商业身份与可见性   | 可按实现选择聚合或投影                     |
| Capability         | Creator 能力关联       | 必须与 Offering 语义保持区分               |
| Offering           | 商业供给锚点与生命周期 | 拥有发布资格策略                           |
| Inventory          | 当前供给上下文         | 不默认等于数值库存表                       |
| Availability       | 可请求条件             | 不默认等于完整 Calendar                    |
| Distribution Asset | 可分享公开入口         | 必须区分 Generated 与 Distributed          |
| Customer           | 最小商业关系           | 不等于通用平台 User                        |
| Commerce Action    | 请求生命周期与归属     | 拥有 Submitted / Confirmed / Declined 策略 |
| Confirmed Commerce | 已接受的 Action 事实   | 可表示为状态或结果，不重复创建订单对象     |
| Paid Transaction   | 未来支付事实           | 仅建模，VS-01 不实现                       |
| Fulfillment        | 未来履约事实           | Prototype 仅允许观察记录                   |
| Relationship       | 未来持续商业关系       | 仅保留最小上下文，不做 CRM                 |

### 6.2 映射规则

- 产品对象不等于数据库表；
- 产品对象不等于 API 资源；
- 产品对象不等于 UI 页面；
- 产品对象不等于代码类；
- 一个聚合可以包含多个产品对象；
- 一个产品对象可以由状态、投影或值对象表达；
- 映射必须保留归属、生命周期、不变量和审计语义。

任何改变产品语义的映射都必须登记 `DEV-###`。

## 7. 状态机治理

### 7.1 必须实现的状态机

#### Commerce Identity

```text
Draft → Published
Published → Unpublished
Unpublished → Published
```

#### Offering

```text
Draft → Published
Published → Unpublished
Unpublished → Published
Draft / Published / Unpublished → Archived
```

Archive 转换仍受 18 与 20 中既有 Request 处理规则约束。

#### Distribution Asset

```text
Generated → Distributed
```

#### Commerce Action

```text
Draft → Submitted
Submitted → Confirmed
Submitted → Declined
```

### 7.2 不变量

1. 非法转换必须失败且不得修改状态；
2. 修改前必须校验 Actor 权限；
3. Offering 不满足发布条件时不得进入 Published；
4. 非 Published Offering 不得接受新 Action；
5. 只有归属 Creator 可以 Confirm / Decline；
6. Action 终态不得再次决策；
7. Confirmed 不得创建 Paid Transaction；
8. Generated 不等于 Distributed；
9. 外部观察事件不得修改 VS-01 状态；
10. 每个已接受转换必须对应一个明确的产品事实。

### 7.3 实现要求

状态转换必须位于显式领域或应用策略之后。仅在 UI 中隐藏按钮不够；持久化、命令处理和集成路径必须执行同样的不变量。

## 8. 规范事件治理

### 8.1 事件注册表

以下注册表是 VS-01 产品事实的唯一来源：

| 事件                        | 生产事实                                | 必须禁止的触发方式        |
| --------------------------- | --------------------------------------- | ------------------------- |
| `creator_registered`        | Creator 注册完成（如果实现注册）        | 浏览或保存 Draft          |
| `creator_qualified`         | Creator 完成资格判定（如果 Pilot 需要） | 编辑资料                  |
| `creator_activated`         | 首次满足最小激活条件                    | 每次保存                  |
| `creator_published`         | 首次通过合格 Offering 获得公开商业身份  | 保存 Draft 或后续重新发布 |
| `creator_distributed`       | 记录真实外部分发                        | 仅生成资产                |
| `storefront_viewed`         | Buyer 打开公开 Storefront               | 内部预览                  |
| `commerce_action_submitted` | 合法 Request 变为 Submitted             | 浏览或未完成表单          |
| `commerce_confirmed`        | 归属 Creator 确认 Submitted Action      | 通知发送或付款观察        |
| `commerce_declined`         | 归属 Creator 拒绝 Submitted Action      | 撤下 Offering 或关闭页面  |
| `external_paid_verified`    | 受证据支持的外部付款观察                | 口头声称或 Confirm        |
| `fulfillment_observed`      | 观察到服务完成                          | Confirm 或付款观察        |

### 8.2 事件规则

1. 一个产品事实只能有一个规范事件名称；
2. 内部日志可以有技术名称，但必须映射到注册表；
3. 事件名称必须使用登记的业务术语；
4. 事件必须绑定已提交的业务事实，而不是按钮点击；
5. 非法命令不得产生规范事件；
6. 重复投递不得产生第二个业务事实；
7. 事件上下文必须足以记录 Actor、对象、状态变化、时间、来源和关联 / 幂等标识；
8. 新增或重命名规范事件必须登记 `DEV-###` 并经过产品决策。

## 9. 测试治理

### 9.1 测试分层

| 层级               | 目的                         | VS-01 最低覆盖            |
| ------------------ | ---------------------------- | ------------------------- |
| 领域测试           | 不变量、策略、状态转换       | 每个状态机及非法转换      |
| 应用测试           | 命令 / 查询编排与权限        | 每个改变状态的 FR         |
| Adapter / 集成测试 | 持久化、通知和 Provider 边界 | 通知与存储合同            |
| 端到端测试         | 跨应用边界的完整用户路径     | Creator → Customer 主流程 |
| 验收测试           | PRD 级商业完成度             | AT-001–AT-013             |
| 治理检查           | 文档、架构、约定和追溯       | 实现交接前的预检          |

### 9.2 需求测试规则

- FR-001–FR-053 必须都有实现状态和证据；
- 每项 Must Build FR 至少有一个合适层级的测试；
- 每条负向规则都必须有负向测试；
- 状态测试必须覆盖合法与非法转换；
- 规范事件测试必须覆盖合法触发和禁止触发；
- 通知测试必须断言收件人和语义；
- AT 必须断言完整业务结果，而不只是页面渲染成功。

### 9.3 验收边界

原型不是在单元测试通过后就完成。只有同时满足以下条件才算完成：

1. 所有必需 FR 均已实现或有明确批准；
2. AT-001–AT-013 全部通过，或存在获批准的受控替代；
3. 没有 P0 / P1 阻塞项；
4. 没有未解决的行为变更偏差；
5. 没有进入 PRD 明确排除的能力。

## 10. 变更与偏差治理

### 10.1 变更分类

| 变更                             | 分类            | 必须执行的流程                  |
| -------------------------------- | --------------- | ------------------------------- |
| 产品行为不变的内部重构           | 普通工程变更    | 测试 + 执行证据                 |
| 恢复 PRD 行为的缺陷修复          | 普通工程变更    | 回归测试 + 执行证据             |
| 不改变产品行为的新模块或 Adapter | 工程变更        | 架构审查 + 测试                 |
| 产品状态、权限、事件或范围变化   | 产品影响变更    | `DEV-###` → 产品决策 → PRD 修订 |
| 改变产品事实的数据迁移           | 产品影响变更    | Schema 审查 + 必要时登记偏差    |
| 改变运行时或 Provider 行为的依赖 | 风险变更        | 依赖登记 + 集成证据             |
| 配置或密钥边界变化               | 安全 / 运行变更 | 配置审查 + 预检                 |

### 10.2 偏差流程

使用 `21_Prototype_Execution.md` 中的流程：

```text
实现问题
→ DEV-###
→ 产品决策
→ PRD 修订
→ 代码与测试更新
→ 验收证据
```

工程可以提出方案，但不得静默批准产品行为变化。

### 10.3 变更证据

每个实现变更单元必须记录：

- 受影响的 FR；
- 受影响的模块、命令、查询或事件；
- 新增或更新的测试；
- 受影响的验收路径；
- 安全、配置和依赖影响；
- 是否需要登记偏差；
- 执行台账更新。

## 11. 配置、安全与运行治理

详细规则见：

- [架构与目录](./architecture-and-directory.md)
- [代码风格与命名](./code-style-and-naming.md)
- [配置与密钥](./configuration-and-secrets.md)
- [外部依赖](./external-dependencies.md)

VS-01 最低纪律：

1. 环境变量只能由配置 Bootstrap 边界读取；
2. 密钥不得出现在源码、文档、Fixture、日志或截图；
3. PII 必须最小化、受访问控制且不得进入普通日志；
4. 日志使用关联标识和稳定事件名，不泄露敏感数据；
5. 状态变更必须可审计；
6. 开发、测试和未来真实支付环境必须隔离；
7. Mock 或 Simulated Provider 必须明确标记，不能视为 Real-qualified；
8. 在引入持久化客户数据或支付能力前，记录备份、删除与恢复策略；
9. 依赖版本必须固定，代码存在后提交 Lockfile；
10. 错误对用户安全，对运营可诊断。

## 12. 工程治理检查

检查入口：

```powershell
powershell.exe -File scripts/test/preflight.ps1 -SkipProjectTests
```

它验证：

- 治理文档存在且已被索引；
- 架构边界已记录；
- 代码约定已记录；
- 当前实现没有违反配置边界；
- 项目尚不存在时，不虚报项目测试通过。

## 13. 决策记录

### D-22-01 — 采用业务中心模块化治理，但不制造空脚手架

- **Decision**：采用 `business-centered-modular-product` 治理原则，但当前无代码仓库不预建空 `apps/`、`modules/`、`adapters/` 或 `database/`。
- **Reason**：当前仓库只有产品文档；空目录会制造架构幻觉，而不会增加工程约束。
- **Consequence**：首次实现时必须按本文边界建立真实的应用组合根、业务模块和 Adapter。
- **Revisit Trigger**：第一条可运行应用或持久化能力进入仓库时，补齐对应目录和边界检查。

### D-22-02 — 先治理，再实现

- **Decision**：VS-01 实现必须在本治理基线和预检通过后开始。
- **Reason**：防止代码先行导致产品对象、状态、事件和测试逐渐漂移。
- **Consequence**：治理预检是 Build 入口，不代表产品功能已经实现。
- **Revisit Trigger**：治理检查无法执行或与真实技术栈冲突时，先修订治理，不得绕过检查。

### D-22-03 — 产品对象映射不要求一一对应

- **Decision**：不要求一个产品对象对应一张表、一个 API 或一个类。
- **Reason**：保持领域语义与实现结构独立，避免贫血模型和重复状态。
- **Consequence**：映射必须保留归属、生命周期、不变量和审计语义。
- **Revisit Trigger**：某对象无法在当前实现中保持语义完整时，登记 DEV，不得静默拆分。

### D-22-04 — 规范事件由注册表治理

- **Decision**：只有事件注册表中的产品事实才是规范事件。
- **Reason**：避免同一事实出现多个分析名称。
- **Consequence**：技术日志、埋点和 Provider 回调必须映射到注册表。
- **Revisit Trigger**：出现新产品事实或跨模块消费需求时，经 DEV 和产品决策扩展。

## 14. 当前工程阻塞项

| Blocker ID | 严重级别 | 状态          | Owner                                      | 描述                                                                                                                          | 下一步                                                                                   |
| ---------- | -------- | ------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ENG-001    | P1       | Closed        | M1 Build Owner                             | 运行时、测试框架、CI 和版本控制基线已建立                                                                                     | 通过完整 Preflight 持续验证                                                              |
| ENG-002    | P1       | Closed        | M1 Build Owner                             | 领域、应用、集成和 Playwright AT-001–AT-013 验收入口已建立；系统 Edge 基础 Harness 已通过                                     | M2–M7 逐步将 AT 从 Skip 转为真实产品验收                                                 |
| ENG-003    | P2       | Closed for M1 | M1 Build Owner                             | 配置 Bootstrap、安全结构化日志和 PII Key 脱敏已建立                                                                           | 引入持久化 Customer 数据时重新审查保留、删除与访问控制                                   |
| ENG-004    | P2       | Closed for M1 | 首次业务 Provider 引入时指定 Adapter Owner | 外部依赖登记表已建立，当前无业务 Provider                                                                                     | 任何业务 Provider 进入代码前重新打开并登记真实性证据                                     |
| ENG-007    | P1       | Closed        | Persistence Owner                          | 已使用 Podman `postgres:17` 完成真实空库 Migration、Event Store Commit / Rollback、重复 Migration 幂等性和完整 Preflight 验证 | 后续若更换 PostgreSQL Provider 或部署环境，重新登记对应真实性证据                        |
| ENG-008    | P1       | Closed        | Auth Owner                                 | 已在受控 Hosted Supabase 项目完成真实登录、Token 验证、无效 Token、Creator 显式映射、网络错误与敏感信息脱敏验证             | Provider、密钥类型或认证策略变化时重新打开                                               |

这些是工程治理阻塞项，不是产品决策。不得通过修改 PRD 规避。

## 15. 治理交接

治理阶段完成条件：

- 本文件已建立并被索引；
- 配套治理文档已建立并被索引；
- `powershell.exe -File scripts/test/preflight.ps1 -SkipProjectTests` 通过；
- ENG-001–ENG-004 已明确 Owner 与下一步；
- Codex Build 前不再修改产品定义。

治理通过后，下一步才是：

```text
M1 Foundation
→ M2 Identity
→ M3 Offering
→ M4 Publish / Share
→ M5 Request
→ M6 Confirm / Decline
→ M7 Events / Notifications
→ M8 Acceptance
```

## 16. 治理验证记录

| 日期       | 命令                                                                | 结果     | 范围                                                                                                  |
| ---------- | ------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| 2026-08-11 | `powershell.exe -File scripts/test/preflight.ps1 -SkipProjectTests` | **通过** | 文档索引、工程事实源、FR-001–FR-053、AT-001–AT-013、配置边界和治理文件完整性                          |
| 2026-08-11 | `pnpm preflight`                                                    | **通过** | 工程治理、格式、Lint、类型检查、28 项自动化测试、13 项 AT 入口和 TypeScript 构建                      |
| 2026-08-11 | `pnpm dev`                                                          | **通过** | Prototype 组合根启动并输出 `prototype_foundation_ready` 安全结构化日志                                |
| 2026-08-11 | `pnpm preflight`（CU-TA-01）                                        | **通过** | Application / Contract 边界、导入门禁、33 项自动化测试、13 项 AT 入口和构建                           |
| 2026-08-11 | `pnpm preflight`（CU-TA-02）                                        | **通过** | Application Core、Port、Canonical Event Recorder、In-memory 事务验证、40 项自动化测试和构建           |
| 2026-08-11 | `pnpm preflight`（CU-TA-03）                                        | **通过** | API v1 Contract、Fastify Runtime、错误 Envelope、OpenAPI、独立 Socket 烟雾验证、52 项自动化测试和构建 |
| 2026-08-11 | `pnpm test:auth:provider`（真实 Supabase）                           | **通过** | Hosted Supabase 登录、真实 Token、无效 Token、未映射 / 已映射 Creator、网络失败和敏感信息脱敏验证     |
| 2026-08-11 | `pnpm preflight`（ENG-008 关闭）                                    | **通过** | 工程治理、84 项自动化测试、Web Production Build、系统 Edge Acceptance Harness；13 项产品 AT 保持 Skip |

本次通过只代表工程治理基线可执行，不代表：

- VS-01 已实现；
- VS-01 的 M2–M7 产品功能已实现；
- AT-001–AT-013 已通过；
- Controlled Prototype 已达到验收测试；
- Real-money 能力已获许可。
