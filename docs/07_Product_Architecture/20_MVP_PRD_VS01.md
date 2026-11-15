# 20 — MVP PRD: VS-01

> **Status**：Frozen
> **Product**：Personal Commerce Infrastructure
> **Version**：VS-01 — Dancer Private Lesson Request
> **Wedge**：Independent Dancer
> **Commerce Primitive**：Service Offering / Request
> **Commerce Model**：Shadow Commerce / Creator-direct Settlement
> **Implementation Target**：Controlled Prototype
> **产品方向上游**：[05 — Personal Commerce Infrastructure Product Direction](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)
> **Upstream Product Definitions**：[17 Core Product Objects](./17_Core_Product_Objects.md)、[18 MVP Product Flow](./18_MVP_Product_Flow.md)、[19 MVP Product Specification](./19_MVP_Product_Specification.md)
> **Implementation Authority**：本 PRD 是 Codex 构建 VS-01 的产品实现依据；如与上游文档冲突，以本 PRD 的显式范围与规则为当前实现合同
> **已批准修订**：2026-11-08 DEV-062；本文件末尾的明确修订条款优先于本版中与之冲突的原条款，未涉及内容继续有效。

## 1. PRD Status

### 1.1 Frozen Implementation Contract

本 PRD 将 17–19 已冻结的产品定义收束为 VS-01 的可开发、可验收、不可歧义的实现合同。

它不重新讨论：

- Creator 市场切入；
- 商业战略；
- 长期 Creator OS；
- Personal Commerce Infrastructure 终局；
- 新的 Commerce Primitive；
- 需求是否存在。

构建目标是一个受控 Prototype，而不是公开商业平台。

### 1.2 PRD Precedence

| 文档                         | 作用                                           | 本 PRD 如何使用                 |
| ---------------------------- | ---------------------------------------------- | ------------------------------- |
| 17 Core Product Objects      | 稳定对象、状态和事件边界                       | 作为对象语义的唯一来源          |
| 18 MVP Product Flow          | VS-01 Canonical Flow、状态流、事件流和停止边界 | 作为端到端行为的唯一来源        |
| 19 MVP Product Specification | Surface、界面行为、规则、通知、异常和验收意图  | 作为体验与产品规则的唯一来源    |
| 20 MVP PRD                   | 实现范围、功能要求、强制规则和交付验收         | 作为 Codex Build 的当前执行合同 |

本 PRD 不得通过实现细节变相新增核心对象、流程或商业能力。

## 2. Product Objective

让一位独立舞者 Creator 在几分钟内建立自己的 `Commerce Identity`，发布一项可被请求的 `Service Offering`，并让 Customer 完成：

```text
Request
→ Creator Confirm / Decline
→ Confirmed Commerce / Declined
```

完整 VS-01 目标为：

```text
Creator Identity
→ Service Offering
→ Requestable Availability
→ Publish
→ Share
→ Customer Request
→ Creator Confirm / Decline
→ Canonical Event Recording
```

VS-01 在 `Confirmed Commerce` 或 `Declined` 后结束。

```text
Confirmed Commerce
≠ Paid Transaction
≠ Settlement
≠ Fulfillment
```

## 3. Scope

### 3.1 Must Build

#### Creator-facing

- Creator Home；
- Commerce Identity 创建与编辑；
- Capability 的最小创建或关联；
- 单项 Service Offering 创建与编辑；
- Requestable Availability 的最小表达；
- Offering Draft 保存；
- Offering Publish；
- Offering Unpublish；
- Published Offering 的最小 Distribution Asset 生成；
- Creator 对外分享状态的记录；
- Creator Requests 列表；
- Creator 对 Submitted Request 的 Confirm / Decline；
- Creator 对当前结果的状态反馈。

#### Public / Customer-facing

- Public Commerce Identity Page；
- Published Service Offering Page；
- Buyer / Customer Request Flow；
- Request Submitted Result；
- Confirmed Result；
- Declined Result；
- Offering unavailable state。

#### System behavior

- 合法状态转换校验；
- 对象归属与权限校验；
- Request 最小信息校验；
- Creator Request 通知；
- Buyer Confirm / Decline 结果通知；
- Canonical Event 记录；
- Generated 与 Distributed 的严格区分；
- Shadow Commerce 事实层边界保护。

### 3.2 Explicitly Not Build

以下能力不得进入 VS-01，即使其技术实现成本较低：

- Payment；
- Checkout；
- Platform Payment；
- Paid Transaction 操作流程；
- Settlement；
- Refund；
- Take Rate；
- GMV / Revenue 面板；
- Merchant of Record 能力；
- Marketplace；
- Search；
- Discovery；
- 推荐；
- Customer Account Center；
- Customer CRM；
- Fan Relationship System；
- Membership；
- Customer Chat；
- 自动预约；
- 高级 Calendar；
- Calendar conflict detection；
- slot locking；
- 多人协作；
- 多品牌 / 多 Identity；
- Event、Experience、Inquiry 的独立 Flow；
- Multi-vertical customization；
- AI；
- 广告；
- Analytics Dashboard；
- 自动履约、核销、争议处理。

### 3.3 Scope Guard

如果一个候选功能不能直接服务于以下链路之一，则不得进入 VS-01：

```text
Identity
→ Offering
→ Publish
→ Distribution
→ Request
→ Confirm / Decline
→ Event Recording
```

## 4. User and Permission Model

### 4.1 Creator

Creator 是拥有商业身份和 Service Offering 的供给主体。

Creator 可以：

- 创建和编辑自己的 Commerce Identity；
- 创建、编辑、发布、撤下自己的 Offering；
- 表达 Offering 的 Requestable Availability；
- 获取和分发自己的 Distribution Asset；
- 查看归属于自己 Offering 的 Submitted Request；
- Confirm 或 Decline 归属于自己 Offering 的 Submitted Request；
- 查看自身 Offering 和 Commerce Action 的当前状态。

Creator 不可以：

- 代表 Customer 提交 Request；
- 处理其他 Creator 的 Request；
- 将 Confirm 解释为支付、结算或履约；
- 对 Confirmed / Declined Action 再次做终态决策。

### 4.2 Customer

Customer 是对 Creator 的 Published Service Offering 发起商业动作的人；在 VS-01 中也可称 Buyer。

Customer 可以：

- 查看 Published Commerce Identity；
- 查看 Published、可请求的 Service Offering；
- 提交一个完整 Request；
- 查看自身 Request 的 Submitted / Confirmed / Declined 结果；
- 接收状态变化通知。

Customer 不可以：

- 创建或编辑 Creator Identity、Capability、Offering 或 Availability；
- Publish / Unpublish Offering；
- Confirm / Decline 自己的 Request；
- 在 VS-01 内付款、取消、改期、要求退款或发起争议。

### 4.3 Platform

Platform 在 VS-01 中负责：

- 保存既有核心对象；
- 强制执行权限、前置条件和状态规则；
- 生成最小 Distribution Asset；
- 记录 Canonical Events；
- 将 Request 与决策结果通知对应角色；
- 呈现符合状态的界面与结果。

Platform 在 VS-01 中不是：

- Merchant of Record；
- Payment Processor；
- Settlement Provider；
- Fulfillment Guarantor；
- Marketplace Operator；
- Creator 或 Customer 的代理决策者。

### 4.4 Pilot Operations Owner

Pilot Operations Owner 可协助 Creator Onboarding，并在既有政策下补录可观察的外部付款或履约事实。

不得：

- 伪造 Creator Publish、Share、Confirm 或 Decline；
- 伪造 Customer Request；
- 将外部付款录入为平台 Payment；
- 将人工观察替代系统状态转换。

## 5. Product Object Requirements

对象完整定义以 17 为准。VS-01 的实现对象范围如下。

### 5.1 Implemented Objects

| Object             | VS-01 Requirement                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Creator            | 作为 Commerce Identity、Offering 与 Request 决策的归属主体                                     |
| Commerce Identity  | Creator 的公开商业入口与 Published Offering 聚合面                                             |
| Capability         | Creator 能力的最小表达；至少能被一个 Offering 关联                                             |
| Offering           | 仅实现 Service Offering；作为 Request 的唯一商业供给锚点                                       |
| Inventory          | 仅作为 Offering 当前可供给条件的概念承载，不实现传统库存管理                                   |
| Availability       | 仅实现 Requestable Availability 或等价服务条件；不实现完整 Calendar                            |
| Distribution Asset | 生成可公开分享的入口，并区分 Generated 与 Distributed                                          |
| Customer           | 在 Request 提交时创建或关联的最小商业关系对象                                                  |
| Commerce Action    | Customer 对 Published Offering 提交的 Request；状态为 Draft / Submitted / Confirmed / Declined |
| Confirmed Commerce | Creator Confirm Submitted Action 后形成的确认事实                                              |

### 5.2 Modelled but Not Implemented

| Object / Capability             | VS-01 Treatment                                                              |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Paid Transaction                | 仅保留产品模型语义；不创建任何可操作支付状态                                 |
| Fulfillment                     | 仅可由受控观察事件记录；不提供履约工作流                                     |
| Relationship                    | 仅通过 Customer 与 Commerce Action 保留最小上下文；不构建 CRM 或关系管理界面 |
| Settlement                      | 不实现                                                                       |
| Refund                          | 不实现                                                                       |
| Cancellation after confirmation | 不实现                                                                       |

### 5.3 Object Constraints

1. 每个 Offering 必须归属于唯一 Creator；
2. 每个 Offering 必须通过该 Creator 的 Commerce Identity 对外展示；
3. 每个 Commerce Action 必须归属于唯一 Published Offering；
4. 每个 Submitted Action 必须只能由该 Offering 的 Creator 处理；
5. Confirmed Commerce 只能来自一个合法的 Submitted Commerce Action；
6. Distribution Asset 可以指向 Commerce Identity 或 Published Offering，但 Generated 不等于 Distributed；
7. Customer 仅在实际 Request 中形成最小商业关系，不由页面浏览自动创建。

## 6. Canonical Flow and State Transitions

### 6.1 Canonical Flow

```text
Creator completes Commerce Identity
→ Creator adds Capability
→ Creator creates Service Offering
→ Creator sets Requestable Availability
→ Creator publishes Offering
→ System generates Distribution Asset
→ Creator shares externally
→ Customer opens public Storefront
→ Customer views Published Offering
→ Customer submits Request
→ Creator reviews Submitted Action
→ Creator confirms or declines
→ System records result and notifies Customer
```

### 6.2 Flow Termination

```text
Commerce Action: Submitted
  ├─ Creator Confirm → Confirmed Commerce → STOP
  └─ Creator Decline → Declined → STOP
```

VS-01 不允许：

```text
Confirmed
→ Paid
→ Settled
→ Fulfilled
```

### 6.3 Required State Transitions

#### Commerce Identity

```text
Draft
  └─ first eligible Offering is published → Published

Published
  └─ public supply is removed → Unpublished

Unpublished
  └─ eligible supply is republished → Published
```

#### Offering

```text
Draft
  ├─ Publish (all conditions satisfied) → Published
  └─ Archive → Archived

Published
  ├─ Unpublish → Unpublished
  └─ Archive (only when no active request handling is required) → Archived

Unpublished
  ├─ Publish (all conditions satisfied) → Published
  └─ Archive → Archived
```

#### Distribution Asset

```text
Generated
  └─ Creator records actual external sharing → Distributed
```

#### Commerce Action

```text
Draft
  └─ Customer submits valid request → Submitted

Submitted
  ├─ Creator Confirm → Confirmed
  └─ Creator Decline → Declined

Confirmed / Declined
  └─ STOP
```

### 6.4 Transition Prohibitions

- Draft、Unpublished 或 Archived Offering 不得接收新 Request；
- Customer 不得 Confirm 或 Decline；
- 非归属 Creator 不得处理 Request；
- Confirmed Action 不得回到 Submitted 或变为 Declined；
- Declined Action 不得回到 Submitted 或变为 Confirmed；
- Generated Asset 不得自动升级为 Distributed；
- Confirmed Action 不得自动成为 Paid Transaction；
- 外部付款或履约观察不得改变 VS-01 的状态机。

## 7. Functional Requirements

### 7.1 Creator Identity and Capability

| ID     | Requirement                                                                              |
| ------ | ---------------------------------------------------------------------------------------- |
| FR-001 | 系统必须允许 Creator 创建并保存一个 Commerce Identity。                                  |
| FR-002 | 系统必须允许 Creator 编辑自己的 Commerce Identity。                                      |
| FR-003 | 系统必须允许 Creator 创建或关联至少一个 Capability。                                     |
| FR-004 | 系统必须向 Creator 明确显示 Commerce Identity 当前是 Draft、Published 还是 Unpublished。 |
| FR-005 | 系统不得允许 Customer 访问 Draft 或 Unpublished Commerce Identity 的公开商业入口。       |

### 7.2 Service Offering and Availability

| ID     | Requirement                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| FR-006 | 系统必须允许 Creator 创建一个 Service Offering。                                                                  |
| FR-007 | 系统必须允许 Creator 保存 Service Offering 为 Draft。                                                             |
| FR-008 | Service Offering 必须关联至少一个 Capability，才能满足 Publish 前置条件。                                         |
| FR-009 | 系统必须允许 Creator 表达该 Offering 的 Requestable Availability 或等价服务条件。                                 |
| FR-010 | Offering 必须包含足以让 Customer 理解服务内容及如何发起 Request 的最小公开信息。                                  |
| FR-011 | 系统必须在 Creator 尝试 Publish 不完整 Offering 时阻止操作，并明确提示缺失条件。                                  |
| FR-012 | 系统必须允许 Creator 编辑 Draft、Published 或 Unpublished Offering；编辑不得重写既有 Commerce Action 的历史事实。 |
| FR-013 | 系统必须向 Creator 区分 Draft、Published、Unpublished 与 Archived Offering。                                      |

### 7.3 Publish and Distribution

| ID     | Requirement                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------- |
| FR-014 | 满足 18 Minimum Publish Conditions 时，系统必须允许 Creator Publish Offering。                    |
| FR-015 | Publish 必须将 Offering 从 Draft 或 Unpublished 变为 Published。                                  |
| FR-016 | Creator 首次通过合格 Offering 获得公开 Commerce Identity 时，系统必须将 Identity 变为 Published。 |
| FR-017 | 系统必须为 Published Offering 生成至少一种可公开分享的 Distribution Asset。                       |
| FR-018 | 系统必须允许 Creator 取得并使用 Generated Distribution Asset。                                    |
| FR-019 | 系统必须允许 Creator 记录一次实际外部分发，并将 Asset 从 Generated 变为 Distributed。             |
| FR-020 | 系统不得因生成链接、二维码或卡片自动将 Asset 视为 Distributed。                                   |
| FR-021 | 系统必须允许 Creator Unpublish Published Offering；Unpublish 后不得接受新的 Request。             |
| FR-022 | Unpublish 不得删除或使既有 Submitted、Confirmed、Declined Commerce Action 不可追溯。              |

### 7.4 Public Storefront and Request

| ID     | Requirement                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| FR-023 | 系统必须使 Published Commerce Identity 可以通过公开入口访问。                                                |
| FR-024 | Public Commerce Identity Page 必须展示 Creator 身份、Capability 表达和当前 Published Service Offering。      |
| FR-025 | Service Offering Page 必须展示 Offering 信息、Requestable Availability / 服务条件以及 Request Instructions。 |
| FR-026 | 系统必须仅在 Offering Published 且当前可请求时展示可操作 Request 入口。                                      |
| FR-027 | 系统必须在 Offering Unpublished、Archived 或不可请求时展示不可用状态，并阻止新 Request。                     |
| FR-028 | 系统必须允许 Customer 无需完整平台账号注册即可进入并提交 Request Flow。                                      |
| FR-029 | Request Flow 必须收集 Customer 的最小可联系信息与 Creator 处理 Request 所需的最小内容。                      |
| FR-030 | 系统必须在 Request 信息不完整或 Offering 不再可请求时阻止 Submit。                                           |
| FR-031 | 合法 Submit 必须创建或关联 Customer，并将 Commerce Action 从 Draft 变为 Submitted。                          |
| FR-032 | 系统必须让 Customer 在 Submit 后看到“已提交、等待 Creator 处理”的结果；不得显示付款、预约已完成或履约完成。  |
| FR-033 | 若系统能够可靠识别同一 Customer 对同一 Published Offering 的未解决重复 Request，应警告并阻止意外重复提交。   |

### 7.5 Creator Request Decision and Result

| ID     | Requirement                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------------- |
| FR-034 | 系统必须向 Creator 展示仅归属于其 Offering 的 Submitted Commerce Action。                                            |
| FR-035 | Creator 必须能够查看处理 Request 所需的 Offering、Customer 最小联系信息和 Request 内容。                             |
| FR-036 | 系统必须允许归属 Creator 对 Submitted Action 执行明确 Confirm。                                                      |
| FR-037 | Confirm 必须将 Commerce Action 从 Submitted 变为 Confirmed，并形成 Confirmed Commerce。                              |
| FR-038 | 系统必须允许归属 Creator 对 Submitted Action 执行明确 Decline。                                                      |
| FR-039 | Decline 必须将 Commerce Action 从 Submitted 变为 Declined。                                                          |
| FR-040 | Confirmed 或 Declined Action 不得再显示 Confirm / Decline 操作。                                                     |
| FR-041 | 系统必须向 Buyer 显示或送达 Confirmed / Declined 的正确结果。                                                        |
| FR-042 | Confirmed 和 Declined 结果页面不得显示 Payment Successful、Booking Confirmed、Order Completed 或 Service Fulfilled。 |

### 7.6 System Rules and Notifications

| ID     | Requirement                                                                       |
| ------ | --------------------------------------------------------------------------------- |
| FR-043 | 系统必须在每个状态变化前校验当前对象状态、Actor 权限和对象归属。                  |
| FR-044 | 无效状态、无效权限或不完整输入不得改变对象状态，也不得产生对应业务事件。          |
| FR-045 | 当 Action 变为 Submitted 时，系统必须通知归属 Creator 有新的待处理 Request。      |
| FR-046 | 当 Action 变为 Confirmed 或 Declined 时，系统必须通知对应 Buyer 当前结果。        |
| FR-047 | 通知投递失败不得回滚已发生的合法状态转换或业务事件。                              |
| FR-048 | 系统不得提供 Notification Center、读状态、偏好设置或营销推送作为 VS-01 前置条件。 |

### 7.7 Shadow Commerce Boundaries

| ID     | Requirement                                                                                 |
| ------ | ------------------------------------------------------------------------------------------- |
| FR-049 | 系统不得在任何 VS-01 Surface 收集支付工具、银行卡、钱包或结算信息。                         |
| FR-050 | 系统不得创建 Payment Pending、Paid、Refunded、Settled 或 Fulfilled 的可操作状态。           |
| FR-051 | 系统不得计算或展示平台 GMV、平台收入、佣金或 Take Rate。                                    |
| FR-052 | 平台外付款如被受控观察到，只能记录 `external_paid_verified` 事实，且不得改变 VS-01 状态机。 |
| FR-053 | 平台外履约如被受控观察到，只能记录 `fulfillment_observed` 事实，且不得产生自动履约体验。    |

## 8. Product Rules and Canonical Events

### 8.1 Product Rules

1. `Commerce Identity` 是 Creator 的公开商业入口，不是社交主页、Marketplace 或完整 Creator OS；
2. `Offering` 是 VS-01 唯一商业供给单元，且只实现 Service Offering；
3. 只有 Published Offering 可以被公开展示和提交 Request；
4. Availability 是 Offering 的可请求条件，不是独立 Calendar 产品；
5. Customer Submit 只产生 Commerce Action，不产生 Payment 或 Booking；
6. Confirm 只产生 Confirmed Commerce，不产生 Paid Transaction、Settlement 或 Fulfillment；
7. Decline 不等于 Cancellation、Refund 或履约失败；
8. Creator 可以撤下 Offering，但不能通过撤下行为消除既有 Commerce Action；
9. 分发必须由真实外部分享记录；资产生成不等于分发；
10. Platform 只能执行规则、记录事实和通知，不代替 Creator 或 Customer 制造商业行为；
11. 已存在的外部付款和履约事实不得被包装为平台交易、GMV 或收入；
12. 任何新增能力都必须通过 Scope Guard，否则不进入 VS-01。

### 8.2 Canonical Event Requirements

事件是产品事实，不是 UI 点击日志。以下事件必须遵循 15、17、18 的既有语义：

| Event                       | Required Trigger                                         | Must Not Trigger On                   | Business Fact                 |
| --------------------------- | -------------------------------------------------------- | ------------------------------------- | ----------------------------- |
| `creator_registered`        | Creator 注册完成（如本实现包含注册）                     | 浏览、保存 Draft                      | Creator 已成为可识别主体      |
| `creator_qualified`         | Creator 通过 Cohort / 资格判定（如受控 Prototype 需要）  | Creator 自行编辑资料                  | Creator 可进入目标 Pilot 范围 |
| `creator_activated`         | Creator 首次满足最小 Identity / 供给准备条件             | 每次保存 Identity                     | Creator 已具备开始商业化准备  |
| `creator_published`         | Creator 首次通过合格 Offering 获得公开 Commerce Identity | 保存 Draft、后续重新 Publish Offering | Creator 已拥有公开商业入口    |
| `creator_distributed`       | Creator 实际将 Asset 分享到至少一个外部真实渠道          | 生成 Asset、复制链接但未确认分享      | Creator 已进行外部传播        |
| `storefront_viewed`         | Buyer 打开公开 Commerce Identity                         | 内部 Creator 预览、后台编辑           | 外部受众进入商业入口          |
| `commerce_action_submitted` | Buyer 合法提交 Request，Action 变为 Submitted            | 浏览 Offering、填写未提交 Draft       | Customer 已发起明确商业动作   |
| `commerce_confirmed`        | 归属 Creator 明确 Confirm Submitted Action               | 通知发送、外部付款观察                | 已形成 Confirmed Commerce     |
| `commerce_declined`         | 归属 Creator 明确 Decline Submitted Action               | Offering Unpublish、页面关闭          | Creator 拒绝当前商业动作      |
| `external_paid_verified`    | Pilot Operations Owner 依据可验证证据记录平台外付款      | Creator / Buyer 口头声称、Confirm     | 仅记录受控外部付款事实        |
| `fulfillment_observed`      | Pilot Operations Owner 依据可观察事实记录服务完成        | Confirm、外部付款                     | 仅记录履约事实                |

实现不得创建以下平行 Event 作为 Canonical Event：

- `creator_identity_created`；
- `offering_created`；
- `offering_published`；
- `distribution_created`；
- `commerce_action_created`。

如工程需要内部日志，可记录，但不得替代或篡改上述 Canonical Event 的产品语义。

### 8.3 Notification Requirements

| State Change             | Recipient | Required Message Meaning                       | Forbidden Meaning                |
| ------------------------ | --------- | ---------------------------------------------- | -------------------------------- |
| Action becomes Submitted | Creator   | 有新的 Request，需查看并决定                   | 已付款、已排期、平台担保         |
| Action becomes Confirmed | Customer  | Creator 已确认当前 Request；后续由双方人工协调 | 支付成功、订单完成、平台履约承诺 |
| Action becomes Declined  | Customer  | Creator 未接受当前 Request                     | 自动退款、替代匹配、平台归责     |

## 9. Acceptance Criteria

### 9.1 Identity and Supply

- [ ] Creator 能创建并保存 Commerce Identity；
- [ ] Creator 能创建或关联至少一个 Capability；
- [ ] Creator 能创建、编辑和保存一个 Service Offering Draft；
- [ ] Creator 能表达 Requestable Availability；
- [ ] 不完整 Identity 或 Offering 无法 Publish，且系统明确显示缺失条件；
- [ ] 合格 Offering 可以从 Draft / Unpublished 变为 Published；
- [ ] Creator 首次发布合格 Offering 时拥有可公开访问的 Commerce Identity；
- [ ] Creator 能 Unpublish Offering，且 Offering 停止接受新 Request；
- [ ] 已存在的 Commerce Action 在 Offering Unpublish 后仍可追溯和处理。

### 9.2 Distribution and Public Access

- [ ] Published Offering 至少生成一种 Distribution Asset；
- [ ] Creator 可获取并使用该 Asset；
- [ ] Asset 生成后为 Generated，而非自动 Distributed；
- [ ] 记录真实外部分发后，Asset 变为 Distributed 并记录 `creator_distributed`；
- [ ] Buyer 可通过公开入口查看 Published Commerce Identity；
- [ ] Buyer 可查看 Published Service Offering、Availability / 服务条件和 Request Instructions；
- [ ] Buyer 无法通过公开 Surface 请求 Unpublished、Archived 或不可请求 Offering。

### 9.3 Request and Decision

- [ ] Customer 可无需完整平台账号提交有效 Request；
- [ ] 完整 Request 创建或关联 Customer，并使 Action 变为 Submitted；
- [ ] 合法 Submit 记录 `commerce_action_submitted`；
- [ ] Creator 仅能看到归属于自己 Offering 的 Submitted Action；
- [ ] Creator 能 Confirm Submitted Action，使其变为 Confirmed 并记录 `commerce_confirmed`；
- [ ] Creator 能 Decline Submitted Action，使其变为 Declined 并记录 `commerce_declined`；
- [ ] Confirmed / Declined Action 无法再次 Confirm 或 Decline；
- [ ] Customer 能看到或收到 Submitted、Confirmed、Declined 的正确结果；
- [ ] Creator 与 Customer 界面均不会将 Confirmed 显示为付款、预约完成或履约完成。

### 9.4 State, Permission, Event and Boundary Integrity

- [ ] 所有状态转换都校验 Actor、对象归属和当前状态；
- [ ] 非法操作不改变状态且不产生对应 Canonical Event；
- [ ] `creator_published` 仅在首次公开 Commerce Identity 时产生；
- [ ] `creator_distributed` 不因 Asset 生成自动产生；
- [ ] `commerce_action_submitted` 不因浏览、开始填写或未完成提交产生；
- [ ] `commerce_confirmed` / `commerce_declined` 仅由归属 Creator 的明确终态操作产生；
- [ ] Notification 失败不回滚合法状态转换；
- [ ] 产品不出现 Payment、Checkout、Settlement、Refund、Take Rate、GMV、Marketplace、Search、CRM、Membership、自动排期或履约工作流；
- [ ] 外部付款或履约如被受控记录，不改变 VS-01 状态机、界面承诺或平台经济指标。

当且仅当全部 9.1–9.4 条目满足时：

> **VS-01 Product Complete for Controlled Prototype**

## 10. Explicit Non-goals

VS-01 不试图：

1. 证明或重新定义 Creator 市场需求；
2. 构建完整 Creator OS；
3. 构建 Creator Marketplace；
4. 为 Customer 提供平台内发现、搜索、关注或社交网络；
5. 替代外部支付、票务、日历或履约系统；
6. 提供商业主体、税务、合同、退款、争议或风险管理能力；
7. 以付款、GMV、Take Rate 或平台收入衡量 Prototype 成功；
8. 同时支持 Event、Experience、Service、Inquiry 的完整多 Primitive 流程；
9. 替 Creator 做商业判断；
10. 因为未来可能有用而扩展任何未列入 Must Build 的能力。

## PRD Freeze Decision

> VS-01 的产品对象、Flow、Surface、功能要求、状态转换、事件、通知、验收标准与 Non-goals 已冻结。

下一阶段：

```text
Codex Build
→ VS-01 Controlled Prototype
→ Product Usability / Behavioral Feedback
→ PRD Amendment only when evidence requires a change
```

后续实现偏差、产品决定、缺陷和 PRD 修订应记录到未来的 `21_Prototype_Execution_Log.md`；不再通过新增产品架构文档扩展范围。

## DEV-062 Amendment — C 号公开商业主页

> 批准日期：2026-11-08；依据 [产品决策 30](./30_Public_Commerce_Homepage_Decision.md)
> Founder 已确认产品方向及无服务空态，并授权确定状态和事件细则。
> 本节是对冻结合同的显式修订，优先于上文冲突的对象表述、流程、状态、FR、事件、验收和 Non-goal；其他规则不变。

### A. 范围和状态

新增以 Identity 持有的 C 号为稳定地址的公开商业主页，以及仅按完整 C 号精确查询的匿名入口；
这不包括目录、模糊搜索、推荐、Marketplace 或社交发现。C 号、身份、公开资料和服务的权限及
隐私边界以产品决策 30 为准。注册和分配号码不自动公开资料。

主页具有独立状态 `UNPUBLISHED → PUBLISHED → PAUSED → PUBLISHED`。拥有授权的创作者
在已选择本 Identity 所有、有效且满足最小公开展示条件的资料后可主动发布；无需已发布服务。
暂停后主页对访客不可访问，创作者可授权预览并恢复。重复相同命令幂等；非法或无权限操作不
改变状态。主页发布、暂停和恢复不直接改变 Commerce Identity 或 Offering 的状态。

保留第 6.3 节既有 Commerce Identity 和 Offering 状态转换及合格服务条件。服务下架，包括最后
一个已发布服务下架，不改变主页状态；已发布主页的服务列表为空时显示“尚无服务”。暂停主页
不会撤下独立服务链接、改变服务请求资格或删除既有请求；独立链接继续执行既有 Identity、
Offering 和可请求条件。资料归档或失去归属时不得继续公开该资料。

### B. 对功能要求和验收的修订

- **FR-005**：Draft 或 Unpublished Commerce Identity 不得作为已发布 Commerce Identity
  或可请求服务公开；已独立发布的 C 号主页可展示经创作者选择的公开资料，即使此时既有
  Commerce Identity 尚非 Published。主页未发布或暂停时不得匿名访问主页内容。
- **FR-016** 保留首次合格 Offering 发布与 Commerce Identity 发布的关系；它不再是 C 号
  主页首次发布的前提。首次发布合格 Offering 不自动发布 C 号主页。
- **FR-023**：已发布 C 号主页可通过公开查询或稳定链接匿名访问；Published Commerce
  Identity 的既有独立服务入口继续可按既有条件访问，主页暂停不自动关闭该入口。
- **FR-024**：已发布 C 号主页展示创作者选定的公开资料及符合条件的已发布服务；无服务时
  显示“尚无服务”。Capability 仅在已选择公开且实际存在时展示，不要求凭空创建。
- 第 9.1 节的不完整 Identity / Offering 发布条件继续适用于对应的既有对象；C 号主页按本节
  独立的资料和归属条件发布。第 9.1、9.2 节中首次发布服务与公开入口的验收，按上述主页与
  独立服务入口的区别执行。第 10 节和 9.4 节的 Search 排除不禁止完整 C 号精确查询。
- 新增验收：无服务可发布主页并显示空态；最后服务下架后主页保持发布且显示空态；草稿、
  下架和归档服务不可见；暂停主页后匿名主页不可访问而独立服务仍按原条件判断；恢复后 C 号
  与主页地址不变；未经授权不能预览或管理；历史请求不受影响。

### C. 规范事件

- `creator_published` 仍仅在首个合格 Offering 使既有 Commerce Identity 首次 Published 时
  产生；其业务事实是首次具备合格公开服务，不表示 C 号主页一定已发布。单独发布、暂停或
  恢复主页不能产生或重发该事件。第 9.4 节相关验收按此解释。
- `storefront_viewed` 在访客成功打开已发布的 C 号主页或符合条件的既有独立公开服务入口时
  产生，即使主页没有服务；内部预览、后台、错误和不可访问响应不产生。相同页面视图不得重复
  记录；访客随后独立打开服务详情是另一页面视图。
- 发布、暂停、恢复和选择资料应记录可审计状态变化，不新增 Canonical Event；生成或复制
  链接/二维码和预览不等于实际外部分发，不触发 `creator_distributed`。

本修订批准产品合同变化，不表示相关代码、迁移、回归或 AT 已完成。后续状态与证据记录在
[执行台账 DEV-062](../08_Execution/21_Prototype_Execution.md#dev-062--public-commerce-homepage)。

## DEV-064 Amendment — 按日期和时间切换公开商业主页

> 登记日期：2026-11-08；依据 [产品决策 31](./31_Time_Scheduled_Public_Homepages_Decision.md)
> 本节是对 DEV-062 主页实现合同的后续显式修订；Identity、C 号、稳定 URL、公开字段、服务过滤、
> 权限、空态和事件规则继续有效，只有主页数量和激活选择规则按本节扩展。

### A. 主页版本和激活规则

一个 Identity 仍只有一个终身不变的 C 号和一个稳定的 `/r/{C号}` 地址，但可以拥有多个主页版本。
每个版本独立维护 Profile 选择、发布状态和时间窗口。访客访问 C 号地址时，服务端按当前时间选择一个
已发布且命中时间窗口的版本；同一时刻不得存在两个命中的启用窗口。没有命中窗口时使用一个已发布默认
主页；没有可用主页时返回主页不可访问。

时间窗口使用 `[startsAt, endsAt)`，结束时刻不包含在窗口内。创作者选择 IANA 时区，服务端保存 UTC
时刻并保留时区名称。第一期只支持明确的日期时间区间，不支持按周重复、节假日或访客选择版本。保存窗口
时重叠必须返回冲突错误，应用层和真实 PostgreSQL 约束都必须防止并发重叠。

主页版本仍使用 `UNPUBLISHED → PUBLISHED → PAUSED → PUBLISHED`；`ACTIVE` 是当前解析结果而不是
可手工设置的持久化状态。暂停、取消发布、资料归档或失去归属的版本不得被选中；服务发布和下架不改变
主页版本或窗口状态。无服务主页仍可显示“尚无服务”。

### B. 功能要求和验收增补

- **FR-054**：系统必须允许一个 Identity 创建多个主页版本，并且为每个版本校验 Profile 归属和权限。
- **FR-055**：系统必须保证同一时间同一 Identity 至多有一个当前公开主页；窗口重叠和并发冲突必须被拒绝。
- **FR-056**：公开 C 号解析必须使用服务端当前时间选择主页；公开请求不得使用访客提供的时间、时区或版本 ID。
- **FR-057**：系统必须支持已发布默认主页；无命中窗口时回退默认主页，无默认且无命中版本时显示主页不可访问。
- **FR-058**：创作者必须能在工作台查看当前激活版本、默认版本、下一次切换和窗口冲突，并能预览指定时间。
- **FR-059**：主页版本切换不得改变 C 号、稳定 URL、二维码、资料披露白名单、已发布服务过滤或历史请求。

新增验收覆盖多版本创建、默认回退、起止边界、时区/DST、并发冲突、跨 Identity 越权、公开不可绕过、
迁移后既有单主页行为不变和 `storefront_viewed` 去重。主页切换、默认设置和窗口维护只产生审计事实，
不产生新的 Canonical Event。

本修订登记产品行为变化，不表示 DEV-064 已实现。实施步骤、迁移、接口和验证证据记录在
[114 — 按日期和时间切换公开商业主页实施计划](../09_Engineering_Governance/114_Time_Scheduled_Public_Homepages_Implementation_Plan.md)
和 [执行台账 DEV-064](../08_Execution/21_Prototype_Execution.md#dev-064--time-scheduled-public-homepages)。

## DEV-082 Amendment — 受控能力目录与服务发布合同

> 批准日期：2026-11-10；依据 [34 — 受控能力目录与服务发布决策](./34_Controlled_Capability_Service_Publishing_Decision.md)
> Founder 已批准在实现前将 Capability、Service Offering 和 Publish 改为目录、模板和政策门禁模型。
> 本节优先于上文允许任意能力名称和自由服务类别的表述；未被本节修改的 VS-01 规则继续有效。

### A. Contract Scope

VS-01 继续只实现 `Service Offering / Request`。本次增量加入发布前的受控资格：

```text
Capability Catalog Item
→ Creator Capability
→ Service Offering Template
→ Structured Offering Draft
→ Policy Check
→ Approved Publish
→ Distribution / Request
```

能力目录项和服务模板是平台政策配置，不自动成为 Creator、Offering 或 Marketplace 对象。
目录初始化覆盖多个安全垂直领域；VS-01 首期可公开发布的模板仍为 `1 对 1 舞蹈私教`，
已有独立决策的既有垂直兼容项须按其单独合同处理，未来模板不能越过范围门禁发布。

### B. Object and State Amendments

1. `Capability` 必须引用有效、未退休的能力目录项；Creator 可编辑自己的经验、作品和描述。
2. `Offering` 必须引用与其 Capability 匹配的服务模板；自由文本不能替代模板类型和必填条件。
3. `Offering` 的业务状态仍为 `Draft / Published / Unpublished / Archived`。
4. `Offering` 增加独立政策状态：`NotChecked / AutoApproved / ReviewRequired / Approved / Rejected`。
5. 只有业务状态 `Published` 且政策状态 `Approved` 的 Offering 才能公开展示、生成可请求入口或接收新的 Request。
6. 政策状态变化不新增 Canonical Event；拒绝、审核、暂停和申诉必须可审计。
7. Offering 关键字段修改后必须重新执行政策检查；历史 Commerce Action 不因检查状态变化而删除或改写。

### C. Functional Requirement Amendments

- **FR-003**：系统必须允许 Creator 选择并创建至少一个引用有效能力目录项的 Creator Capability；任意自定义类别不能直接公开。
- **FR-003A**：系统必须提供当前可用能力目录和每项允许关联的服务模板；目录项状态为 `retired` 时不得新建关联。
- **FR-006**：系统必须允许 Creator 从与其 Capability 匹配的服务模板创建 Service Offering Draft。
- **FR-006A**：系统必须允许 Creator 保存服务模板要求的结构化条件和有限补充说明；没有模板的“其他服务”不能直接发布。
- **FR-011**：系统必须在 Offering 缺少业务条件、模板条件或政策批准时阻止 Publish，并明确显示缺失或拒绝原因。
- **FR-013A**：系统必须向 Creator 区分 Offering 业务状态与政策审核状态。
- **FR-014**：系统只有在既有 Minimum Publish Conditions 满足且政策状态为 `Approved` 时才允许 Publish。
- **FR-024**：Public Commerce Identity 只展示业务状态为 `Published` 且政策状态为 `Approved` 的 Capability / Offering 表达。
- **FR-027**：Offering 处于 `ReviewRequired`、`Rejected`、`Unpublished`、`Archived` 或不可请求时，公开入口不得接收新的 Request。

### D. Policy Rules

1. Low 风险且当前范围启用的模板可以自动检查通过；
2. Review 风险、未来范围或上下文不明确的服务必须进入 `ReviewRequired`；
3. Prohibited 类型和命中禁止规则的服务必须进入 `Rejected`；
4. 自动分类或语言模型只能辅助，不能作为高风险拒绝的唯一政策依据；
5. Creator 可以修改后重新检查或提交申诉；
6. 服务端必须执行目录、模板、归属、字段和政策状态检查，前端隐藏控件不构成门禁；
7. 已有自由文本数据必须在迁移时映射到目录或进入人工复核，不得静默宣称为已批准。

### E. Acceptance Additions

- [ ] 任意能力名称不能绕过目录直接公开；
- [ ] Offering 必须绑定有效 Capability 和匹配 Service Offering Template；
- [ ] 模板必填条件缺失时 Publish 被阻止；
- [ ] Low、Review、Prohibited 三类内容分别得到自动通过、进入审核和拒绝结果；
- [ ] 关键编辑会重新检查；
- [ ] 未批准 Offering 不出现在公开主页和服务页；
- [ ] 拒绝、审核、恢复、举报和申诉结果可追溯；
- [ ] 现有请求、分发事实和 Canonical Event 不因迁移或政策审核被静默删除；
- [ ] VS-01 的 Request、Confirm / Decline、Distribution 和 Non-goal 边界继续通过原 AT-001–AT-013 相关路径。

本节批准产品合同修订。代码、迁移、初始化数据和聚焦测试已完成；产品验收状态与剩余证据
继续记录在 [执行台账 DEV-082](../08_Execution/21_Prototype_Execution.md#dev-082--controlled-capability-and-service-publishing)。

## DEV-083 Amendment — Database-Managed Catalog Contract

能力目录、服务模板及发布版本必须持久化在数据库中；运行时禁止依赖硬编码目录数组。目录项的
`draft`、`active`、`paused`、`retired` 状态以及 `creatorSelectable`、`publishEnabled` 开关是
可审计的运营配置。Operations 角色可通过受保护管理接口进行暂停、恢复、退休、紧急下架和版本
发布；Creator 只能读取当前发布快照。JSON 初始化数据通过幂等导入命令写入数据库，不覆盖运营
状态和审计历史。目录状态变化必须重新约束 Publish、公开服务和新 Request，既有请求与事件保持
可追溯。

## FD-020-BD-01 Amendment — Fulfillment Code & Fulfillment Confirmation

> 登记日期：2026-11-16；Founder Decision：`FD-020-BD-01 — Fulfillment Workflow Retention & VS-01 Amendment`。
> 本节追加修订 VS-01，不删除此前冻结文本或 020-B2 的历史执行记录。若此前边界文字与本节冲突，
> 本节是后续批准的产品合同解释。

### A. 修订原因与产品边界

此前 VS-01 的 `Customer Request -> Creator Confirm / Decline` 终点边界没有完整记录已经存在的
履约码和履约确认能力。020-B2 因此错误地把超出旧文字的能力退役。Founder 决定保留并恢复该能力，
并将其定义为 Creator 与客户之间的履约确认工具。它不使 PCI 成为实际服务提供方，不承诺服务交付，
也不增加 Payment、Settlement、Refund、Marketplace、CRM、Automated Fulfillment 或其他商业能力。

产品生命周期为：

```text
Identity
  -> Capability
  -> Service Offering
  -> Publish / Distribution
  -> Customer Request
  -> Creator Confirm / Decline
  -> (Confirmed only) Fulfillment Code
  -> Creator Fulfillment Confirmation
```

`Confirm / Decline` 是 Creator 对 Customer Request 的业务决定；`Fulfillment Confirmation` 是
Confirmed Request 之后对已出示履约码的完成确认。后者不改变已成立的 Creator Confirm / Decline
历史决定，也不把 Declined 或 Submitted Request 变成可履约对象。

### B. Fulfillment Code 定义

1. 新 Customer Request 提交并持久化后，为该 Action 生成一个唯一 `FC-` 加 8 位大写字母或数字的
   Fulfillment Code，状态为 `pending`，有效期为生成后 90 天。代码与 Action 一对一关联；历史代码
   保留，不重新生成、不回填。
2. Customer Result 在 Request 的所有可读取状态中返回关联履约码（若该 Action 已有关联代码）及
   `pending`、`fulfilled` 或 `expired` 状态、过期时间和（如已确认）确认时间。Customer 通过结果页
   查看并向 Creator 出示代码；没有历史代码的既有 Action 仍可读取原有 Request 结果。
3. Creator Web 的 Confirmed Request 列表显示履约信息。Creator 必须在所属 Creator Session 下提交
   Action ID 和客户提供的代码；浏览器请求继续通过同源 BFF，不能使用浏览器持久化 Bearer Token。
4. QR endpoint `/api/v1/public/fulfillment-code/{code}/qrcode` 仅把同一履约码编码为二维码 Data URL，
   供 Customer 结果页展示和现场出示；扫描本身不完成履约，也不绕过 Creator 权限或代码校验。

### C. 验证和状态规则

- 代码必须匹配 `FC-[A-Z0-9]{8}`，存在且必须关联提交的 Action；代码与 Action 不匹配、代码不存在或
  格式错误均失败。
- 只有 Action 状态为 `confirmed` 且请求 Creator 与当前 Creator Session 相同，才允许确认履约。
  未授权 Creator、缺失 Action、`submitted`、`declined` 或其他无效状态均拒绝。
- 过期或已使用的代码不得再次确认。重复提交返回冲突；持久化实现以 pending 且未过期的条件更新
  原子领取代码，因此并发请求最多一个成功，其余得到已使用或冲突结果。
- 成功确认只把 Fulfillment Code 标记为 `fulfilled` 并记录确认时间；它不改写 Action 的
  `confirmed` / `declined` 决策。既有履约数据和既有 Request 结果必须继续可读。

### D. 兼容性、验收和明确排除

本修订不要求删除历史 Request、履约码或历史结果，不要求 Schema / Migration 变更；若实现需要数据库
约束，只能采用向后兼容的最小变更。新请求、Public Result、QR、Creator 确认、错误代码、权限、无效
状态、重复/并发确认以及历史数据读取均纳入 VS-01 验收。Creator Confirm / Decline 原有语义和 AT-001
至 AT-013 仍有效，履约确认是 Confirmed 之后的追加能力。

本节只批准既有 Fulfillment Code & Fulfillment Confirmation 能力的产品定义和恢复，不批准支付、结算、
退款、Marketplace、CRM、自动履约、平台保证服务交付或新的 SLA / 必经步骤。实现状态和验证证据记录在
执行台账 `PCI-ENG-020-B2-R1`。
