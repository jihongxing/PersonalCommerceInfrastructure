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
