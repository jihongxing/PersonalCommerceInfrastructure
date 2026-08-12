# 18 — MVP Product Flow

> 状态：Decision v1  
> 决策日期：2026-08-11  
> 阶段：Productization Phase  
> 文档角色：将 17 的静态产品对象转化为 VS-01 的动态用户流、状态流与事件流；不是页面 PRD、技术设计或支付方案  
> 核心问题：舞者 Creator 和 Buyer 如何通过一个 Service Offering 完成第一条受控 Commerce Loop？

## 1. Purpose

17 Core Product Objects 已经定义产品中有什么，以及 Object、State、Event 的边界。

本文件只定义一个 Canonical MVP Flow：

> **VS-01 — Dancer Private Lesson Request**

```text
Creator Identity
→ Service Offering
→ Requestable Availability
→ Publish
→ Distribution Asset
→ Buyer Request
→ Creator Confirm / Decline
→ Event Recording
```

本文件解决：

1. VS-01 中每一步由谁发起；
2. 每一步需要满足哪些前置条件；
3. 每一步产生或更新哪个既有产品对象；
4. 每一步导致哪些合法状态变化；
5. 每一步记录哪些业务事件；
6. 正常、失败与边界路径如何处理；
7. VS-01 在哪里停止，哪些对象明确不进入实现。

本文件不新增 17 未定义的核心对象，不引入支付、结算、退款、Marketplace、CRM、自动排期或完整履约流程。

## 2. Flow Thesis

VS-01 不是“做一个舞蹈预约系统”，也不是“验证一个完整订单系统”。

它是 Creator Commerce 最小可运行路径：

```text
Creator creates a real offer
→ publishes a public commerce entry
→ distributes it through an existing channel
→ Buyer makes a concrete request
→ Creator makes a commercial decision
→ system records the result
```

第一条 Flow 的完成标准是：

> Creator 能把一个真实服务从商业身份中发布出去；Buyer 能对它提交真实 Request；Creator 能明确 Confirm 或 Decline；系统能将整个路径记录为可追溯的商业事实。

`Confirmed Commerce` 是 VS-01 的终点，不是 `Paid Transaction` 的替代名称。

## 3. Scope and Stop Boundary

### 3.1 Included Objects

VS-01 只使用以下 17 已定义对象：

```text
Creator
→ Commerce Identity
→ Capability
→ Service Offering
→ Inventory / Requestable Availability
→ Distribution Asset
→ Customer
→ Commerce Action
→ Confirmed Commerce / Declined
```

### 3.2 Explicit Stop Boundary

VS-01 在 Creator 对 Submitted Request 作出 `Confirmed` 或 `Declined` 决定后停止。

```text
Commerce Action
→ Submitted
→ Confirmed / Declined

STOP
```

以下能力不属于 VS-01：

- Platform Payment；
- Paid Transaction；
- Settlement；
- Take Rate；
- Refund；
- Cancellation after confirmation；
- Automated Fulfillment；
- Calendar conflict detection；
- automatic slot locking；
- Event / Experience flows；
- Marketplace discovery；
- Customer CRM；
- Membership；
- AI recommendation。

Prototype 如观察到外部付款或实际履约，只能依照 15 的事件字典作为受控事实记录；不得把该事实变成平台支付、GMV 或 Take Rate 收入。

## 4. Actors and Responsibilities

| Actor                  | 在 VS-01 中的责任                                                                                       | 不能做什么                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Creator                | 创建 Identity、Capability 与 Offering；表达 Availability；发布和分发；Confirm / Decline Request         | 不能把 Confirm 视为系统收款或平台担保                  |
| Buyer / Customer       | 查看公开 Storefront；阅读 Offering；提交 Request 和必要联系信息                                         | 不能直接修改 Offering、Availability 或确认自身 Request |
| System                 | 维护状态合法性；生成 Distribution Asset；保存 Customer 与 Commerce Action；记录事件；向相应角色反馈结果 | 不代收款、不自动承诺履约、不推断外部付款               |
| Pilot Operations Owner | 在受控 Prototype 中协助 Creator Onboarding，并按既有规则补录可观察事实                                  | 不替 Creator 伪造 Request、Confirm 或外部付款          |

`Customer` 是 17 中定义的关系对象；“Buyer”仅指该 Customer 在本条 Flow 中的角色，不新增对象。

## 5. Canonical User Flow

### 5.1 Happy Path

```text
1. Creator creates or completes Commerce Identity
2. Creator adds a relevant Capability
3. Creator creates one Service Offering
4. Creator sets Requestable Availability
5. Creator publishes the Offering through Commerce Identity
6. System generates a Distribution Asset
7. Creator shares the asset in an existing external channel
8. Buyer opens the public Storefront
9. Buyer views the Published Service Offering
10. Buyer submits a Request
11. Creator reviews the Submitted Commerce Action
12. Creator confirms the Request
13. System records Confirmed Commerce and relevant events
```

该路径的首版商业状态为：

```text
Published Offering
→ Submitted Commerce Action
→ Confirmed Commerce
```

### 5.2 Alternate Decision Path

第 12 步中，Creator 可以 Decline，而非 Confirm：

```text
Published Offering
→ Submitted Commerce Action
→ Declined Commerce Action
```

`Declined` 不产生 Confirmed Commerce，不产生 Paid Transaction，也不表示履约取消。

### 5.3 Creator-side Flow

```text
Prepare identity
→ create one service offer
→ express requestable availability
→ publish
→ share
→ receive request
→ confirm or decline
→ see recorded outcome
```

Creator 的首要价值不是填完档案，而是完成：

```text
Creator Published
→ Creator Distributed
→ Commerce Action received
→ Commercial decision made
```

### 5.4 Buyer-side Flow

```text
Open Creator-distributed entry
→ understand Creator and service offer
→ understand requestable conditions
→ submit request
→ receive submission acknowledgement
→ await Creator decision
→ receive confirmed or declined result
```

Buyer 无需 Marketplace Discovery，也不应被强制完成完整平台账号注册后才能提交 Request。

## 6. Canonical Action Table

| Step | Action                       | Actor            | Preconditions                                                                      | Object Effect                                      | State Effect                                                                         | Required Event                                                                             |
| ---- | ---------------------------- | ---------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1    | Create / complete Identity   | Creator          | Creator 已 Registered 且可进入管理流程                                             | 创建或更新 Commerce Identity                       | Identity: Draft / Updated                                                            | `creator_activated`（首次满足最小 Identity 条件时）                                        |
| 2    | Add Capability               | Creator          | Commerce Identity 存在                                                             | 创建或关联 Capability                              | Capability 可被 Offering 引用                                                        | 无新增必需事件                                                                             |
| 3    | Create Service Offering      | Creator          | Commerce Identity 存在；至少有一个相关 Capability                                  | 创建 Offering                                      | Offering: Draft                                                                      | 无新增必需事件                                                                             |
| 4    | Set Requestable Availability | Creator          | Service Offering 为 Draft；Creator 已提供最小服务条件                              | 为 Offering 表达 Inventory / Availability          | Offering 仍为 Draft，但具备发布条件的一部分                                          | 无新增必需事件                                                                             |
| 5    | Publish Offering             | Creator          | Identity 满足公开展示条件；Offering 满足最小发布条件；Availability 可被 Buyer 理解 | Offering 被加入公开 Commerce Identity              | Offering: Draft / Unpublished → Published；Identity: Draft → Published（如首次公开） | 首次使 Identity 公开时：`creator_published`；后续 Offering 重新 Publish 不触发新增必需事件 |
| 6    | Generate Distribution Asset  | System / Creator | 至少有一个 Published Offering                                                      | 创建或更新 Distribution Asset                      | Asset: Generated                                                                     | 无新增必需事件                                                                             |
| 7    | Share Distribution Asset     | Creator          | Asset 已 Generated；Creator 选择外部真实渠道                                       | 关联真实分发来源或记录分发行为                     | Asset: Generated → Distributed                                                       | `creator_distributed`                                                                      |
| 8    | Open Storefront              | Buyer            | Storefront 与 Offering 均为 Published                                              | 无需创建新核心对象                                 | 无对象状态改变                                                                       | `storefront_viewed`                                                                        |
| 9    | View Offering                | Buyer            | Offering 为 Published                                                              | Buyer 可进入 Request 决策                          | 无对象状态改变                                                                       | 不要求独立事件                                                                             |
| 10   | Submit Request               | Buyer            | Offering 为 Published；Offering 允许 Request；Buyer 提供最小联系与请求信息         | 创建或关联 Customer；创建 Commerce Action          | Commerce Action: Draft → Submitted                                                   | `commerce_action_submitted`                                                                |
| 11   | Review Request               | Creator          | Commerce Action 为 Submitted 且归属该 Creator 的 Offering                          | 无需创建新核心对象                                 | 状态不变                                                                             | 无新增必需事件                                                                             |
| 12A  | Confirm Request              | Creator          | Commerce Action 为 Submitted；Creator 有处理权限                                   | 更新 Commerce Action；形成 Confirmed Commerce 事实 | Commerce Action: Submitted → Confirmed                                               | `commerce_confirmed`                                                                       |
| 12B  | Decline Request              | Creator          | Commerce Action 为 Submitted；Creator 有处理权限                                   | 更新 Commerce Action                               | Commerce Action: Submitted → Declined                                                | `commerce_declined`                                                                        |
| 13   | Show Result                  | System           | Action 已 Confirmed 或 Declined                                                    | 向 Buyer 与 Creator 显示当前结果                   | 状态不变                                                                             | 无新增必需事件                                                                             |

## 7. Minimum Publish Conditions

Creator 只能 Publish 一个 Service Offering，当且仅当：

1. 该 Offering 归属于一个 Creator；
2. Creator 已有可公开展示的 Commerce Identity；
3. Offering 明确表达 Creator 提供的服务；
4. Offering 与至少一个 Capability 相关；
5. Buyer 能理解其最低商业条件；
6. Offering 具有可请求的 Availability 或等价服务条件；
7. Creator 可以接收并处理 Request；
8. Offering 未处于 Archived 或 Unpublished 状态。

“最低商业条件”是产品规则，不要求首版完成价格、自动排期、付款或复杂库存系统。

## 8. Canonical State Transitions

### 8.1 Commerce Identity

```text
Draft
  └─ Creator publishes first eligible Offering → Published

Published
  └─ Creator removes all public supply or unpublishes → Unpublished

Unpublished
  └─ Creator republishes eligible supply → Published
```

VS-01 不要求实现复杂 Identity 审核流、团队协作或多身份管理。

### 8.2 Service Offering

```text
Draft
  ├─ Publish (all publish conditions satisfied) → Published
  └─ Archive → Archived

Published
  ├─ Unpublish → Unpublished
  └─ Archive (only when no active request handling is required) → Archived

Unpublished
  ├─ Publish (conditions still satisfied) → Published
  └─ Archive → Archived

Archived
  └─ No VS-01 restore flow is required
```

状态规则：

- 只有 `Published` Offering 可被 Buyer 查看和 Request；
- `Draft`、`Unpublished`、`Archived` Offering 不能产生新的 Commerce Action；
- VS-01 不允许将 `Offering` 状态直接修改为 Paid、Confirmed 或 Fulfilled；这些是商业动作或结果层的状态。

### 8.3 Distribution Asset

```text
Generated
  └─ Creator records or performs actual external sharing → Distributed
```

`Generated` 只表示资产可用；`Distributed` 才表示 Creator 将它带到至少一个真实外部渠道。

VS-01 不要求归因每一次复制、每一个社交平台或每一个点击来源，但必须保留“生成”和“分发”不可混同的规则。

### 8.4 Commerce Action

```text
Draft
  └─ Buyer submits complete request → Submitted

Submitted
  ├─ Creator confirms → Confirmed
  └─ Creator declines → Declined

Confirmed
  └─ STOP for VS-01

Declined
  └─ STOP for VS-01
```

状态规则：

- `Submitted` 是 Creator 唯一可处理的 Request 状态；
- 同一 Commerce Action 只能由归属 Offering 的 Creator Confirm 或 Decline；
- `Confirmed` 和 `Declined` 为 VS-01 终态；
- VS-01 不实现 Buyer 自行取消、Creator 撤销确认、重新开启 Request、支付失败、退款或争议状态；
- `Confirmed` 不等于 `Paid Transaction`；
- `Declined` 不等于 Cancellation、Refund 或 Fulfillment failure。

### 8.5 Transaction and Fulfillment Boundary

完整对象模型允许：

```text
Commerce Action
→ Confirmed Commerce
→ Paid Transaction
→ Fulfillment
```

VS-01 只实现：

```text
Commerce Action
→ Confirmed Commerce / Declined
```

因此，以下状态在 VS-01 不得出现为可操作流程：

- Payment Pending；
- Paid；
- Refunded；
- Settled；
- Fulfilled；
- Disputed。

如果 Pilot Operations Owner 观察到 Creator 与 Buyer 在平台外完成付款或服务，仅可依照 15 的既有事件定义记录 `external_paid_verified` 或 `fulfillment_observed`；这些观察不改变 VS-01 的产品状态机。

## 9. Product Flow and Event Flow

### 9.1 Principle

每一个用户 Action 都必须分别回答：

```text
Who acts?
→ What object changes?
→ Which state changes?
→ What event is recorded?
```

事件记录事实；状态决定下一步允许什么操作。

### 9.2 Required Event Mapping

| User / System Occurrence                         | Object and State Result            | Required Event              | Business Meaning                     |
| ------------------------------------------------ | ---------------------------------- | --------------------------- | ------------------------------------ |
| Creator 首次满足可开始创建供给的最低条件         | Creator 可进入 Activated 运营阶段  | `creator_activated`         | Creator 已完成最小商业化准备         |
| Creator 首次发布合格 Offering 并使 Identity 公开 | Identity / Offering 进入 Published | `creator_published`         | Creator 已拥有公开商业入口           |
| Creator 将资产带到真实外部渠道                   | Distribution Asset 为 Distributed  | `creator_distributed`       | Creator 进行了实际外部传播           |
| Buyer 打开公开 Storefront                        | 状态不变                           | `storefront_viewed`         | 外部受众已进入商业入口               |
| Buyer 提交 Request                               | Commerce Action: Submitted         | `commerce_action_submitted` | Customer 已发起明确商业动作          |
| Creator Confirm                                  | Commerce Action: Confirmed         | `commerce_confirmed`        | 形成 Confirmed Commerce              |
| Creator Decline                                  | Commerce Action: Declined          | `commerce_declined`         | Creator 拒绝当前商业动作             |
| Pilot 可验证地观察到外部付款                     | 不改变 VS-01 State                 | `external_paid_verified`    | 仅记录受控外部付款事实，不计平台 GMV |
| Pilot 可观察到服务实际完成                       | 不改变 VS-01 State                 | `fulfillment_observed`      | 仅记录履约事实，不代表自动履约系统   |

`creator_registered`、`creator_qualified`、`payment_confirmed`、`repeat_supply_created`、`repeat_transaction_completed`、`creator_retained` 与 `creator_referred` 仍使用 15 的统一事件字典，但不是完成 VS-01 Flow 所必需的页面交互。

### 9.3 Event Integrity Rules

1. `creator_published` 只能在 Creator 首次获得公开 Commerce Identity 时触发，不能因保存 Draft 或后续 Offering 重新 Publish 触发；
2. `creator_distributed` 不能因生成链接或二维码自动触发；
3. `commerce_action_submitted` 不能因 Buyer 浏览 Offering 触发；
4. `commerce_confirmed` 必须由 Creator 对 Submitted Action 的明确操作触发；
5. `commerce_declined` 必须由 Creator 对 Submitted Action 的明确操作触发；
6. `external_paid_verified` 不得自动触发 `payment_confirmed`；
7. `commerce_confirmed` 不得被计为 Paid Transaction；
8. `fulfillment_observed` 不得被计为平台自动核销或平台担保履约。

## 10. Error and Edge-case Flows

### 10.1 Creator attempts to publish an incomplete Offering

```text
Creator selects Publish
→ system checks minimum publish conditions
→ one or more conditions missing
→ Offering remains Draft
→ system explains the missing condition
```

不得触发 `creator_published`，不得生成对外可行动的公开入口。

### 10.2 Buyer opens an unavailable Offering

适用情况：

- Offering is Draft；
- Offering is Unpublished；
- Offering is Archived；
- Storefront link points to no longer public supply。

处理：

```text
Buyer opens entry
→ system does not expose Request action
→ system presents an unavailable state
→ no Commerce Action is created
```

VS-01 不承诺替代 Offering、推荐其他 Creator 或引导 Marketplace 浏览。

### 10.3 Buyer submits incomplete Request

```text
Buyer selects Request
→ required information is incomplete or invalid
→ request is not submitted
→ Commerce Action remains uncreated or Draft
→ system identifies required correction
```

不得触发 `commerce_action_submitted`。

### 10.4 Duplicate Request

首版不将“重复”推断为恶意行为，也不创建新的核心对象。

最低规则：

```text
Same Buyer
+ Same Published Offering
+ Same unresolved request context
→ system warns and prevents accidental duplicate submission
```

如果无法可靠判断是否同一 Buyer 或同一上下文，允许提交，但每次提交必须形成可独立追溯的 Commerce Action。

### 10.5 Creator tries to handle an action that is no longer Submitted

```text
Creator selects Confirm / Decline
→ system verifies current action state
→ state is Confirmed or Declined
→ no new decision is applied
→ system displays current recorded result
```

同一 Action 不得重复触发 `commerce_confirmed` 或 `commerce_declined`。

### 10.6 Creator attempts to handle another Creator's Request

```text
Creator attempts action
→ system verifies ownership against Offering's Creator
→ authorization fails
→ no state changes and no business event is recorded
```

### 10.7 Creator unpublishes an Offering after Requests exist

VS-01 的最小规则：

- Offering 不再接受新的 Buyer Request；
- 已 Submitted 的 Commerce Action 仍可被原 Creator Confirm 或 Decline；
- 已 Confirmed / Declined 的结果保持可追溯；
- 不实现批量取消、自动通知、退款或重新排期。

这确保“是否继续公开供给”与“如何处理既有商业动作”保持分离。

### 10.8 External Payment or Fulfillment occurs

```text
Creator and Buyer transact outside platform
→ Pilot Operations Owner collects verifiable evidence if appropriate
→ system may record external_paid_verified / fulfillment_observed
→ no platform payment state, GMV, settlement, or take rate is created
```

这是 Shadow Commerce 的事实记录，不是 Real-money Product Flow。

### 10.9 Distribution Asset is generated but never shared

```text
Asset: Generated
→ no external distribution evidence
→ asset remains Generated
→ Creator is not counted as Distributed
```

这不是产品错误，也不应由系统伪造 `creator_distributed`。

## 11. MVP Stop Boundary Checklist

完成 VS-01 前，产品必须满足：

- [ ] 只有一条 Canonical Commerce Flow；
- [ ] Flow 从 Creator Identity 到 Creator Confirm / Decline 端到端闭合；
- [ ] 每个 Action 都有唯一 Actor；
- [ ] 每个 Action 都有明确 Preconditions；
- [ ] 每个 Action 都有明确 Object / State 后果；
- [ ] Offering 与 Commerce Action 的状态转换均合法且可阻止非法转换；
- [ ] 每个关键状态变化都映射到统一 Event Dictionary；
- [ ] `Confirmed Commerce` 与 `Paid Transaction` 严格隔离；
- [ ] Generated 与 Distributed 严格隔离；
- [ ] Deferred Objects 未获得可操作入口；
- [ ] 外部付款与履约不会被错误计入平台经济指标。

以下内容不得因为“未来可能有用”而进入 VS-01：

- 支付按钮；
- 订单金额；
- 平台佣金；
- 自动退款；
- 自动日历排期；
- Marketplace；
- 推荐；
- Customer CRM；
- 会员；
- 广告；
- AI。

## 12. Decision Record

### D-18-01 — VS-01 has one canonical flow

- **Decision**：VS-01 只实现舞者 Service Offering 的 Request → Confirm / Decline 路径。
- **Reason**：第一条 Slice 要验证产品能否从供给创建运行至明确商业决策，而不是覆盖所有 Commerce Primitive。
- **Consequence**：Event、Experience 与 Inquiry 不获得独立流程。
- **Revisit Trigger**：只有当 VS-01 已稳定运行且新增 Primitive 能复用当前对象模型时，才评估第二条 Flow。

### D-18-02 — Confirmed Commerce is the terminal MVP outcome

- **Decision**：VS-01 的产品 Flow 在 Confirmed 或 Declined 后停止。
- **Reason**：支付、结算、退款、责任和履约未满足 Real-money Controlled Pilot 条件。
- **Consequence**：系统不创建 Paid Transaction、GMV 或 Take Rate。
- **Revisit Trigger**：15 中 Real-money Controlled Pilot 的全部准入条件完成并经责任 Owner 确认。

### D-18-03 — Each state transition has an accountable actor

- **Decision**：Creator 负责供给发布与 Request 决策；Buyer 负责发起 Request；System 只执行规则、记录状态与事件。
- **Reason**：避免平台或运营人员替代用户制造商业行为。
- **Consequence**：Concierge Onboarding 可协助输入，但不得伪造 Publish、Request、Confirm 或 Decline。
- **Revisit Trigger**：如果合法的多人协作或代理场景成为 Cohort 的真实阻塞，再扩展角色模型。

### D-18-04 — Product flow and event flow remain separate

- **Decision**：每个关键 Action 同时定义状态变化与 Event，但两者不互相替代。
- **Reason**：产品操作、指标、审计和经济定义必须共享同一事实层。
- **Consequence**：工程实现不得仅通过埋点推断状态，也不得仅靠状态丢失历史事件。
- **Revisit Trigger**：如果 Analytics Owner 发现已有事件无法支持指标判定，则在不改变业务语义的前提下补充事件字段或映射。

## 13. Next Step

18 已将 17 的对象模型转化为唯一的 VS-01 动态流程。

下一份且仅下一份产品层文档是：

> `19_MVP_Product_Specification.md`

它应将本 Flow 逐页翻译为 Screen、Component、Action、State、Rule、Notification、Empty State、Error State 与 Acceptance Criteria。

不得重新定义对象，不得再扩展 Product Philosophy；正式 PRD 应引用 17、18、19，而不是重复它们。
