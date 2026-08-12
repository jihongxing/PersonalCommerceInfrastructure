# 19 — MVP Product Specification

> 状态：Decision v1  
> 决策日期：2026-08-11  
> 阶段：Productization Phase  
> 文档角色：VS-01 的最终产品行为规格；为 20 MVP PRD 提供唯一界面与交互输入  
> 上游定义：17 Core Product Objects、18 MVP Product Flow  
> 核心问题：Creator 与 Buyer 在 VS-01 中实际看到什么、能做什么，系统必须如何响应？

## 1. Purpose

17 定义了稳定产品对象，18 定义了唯一的 VS-01 动态流程。

本文件将该流程翻译为：

```text
Product Surface
→ Screen / Surface Behavior
→ Action
→ State-aware UI
→ Rule
→ Notification
→ Acceptance Criteria
```

本文件是最后一份产品定义型文档。完成后不再扩展产品架构，而进入：

```text
20 MVP PRD
→ Codex Build
→ VS-01 Controlled Prototype
→ Product Usability / Behavioral Feedback
→ Product Iteration
```

本文件不：

- 新增 17 未定义的核心对象；
- 新增 18 未定义的 Canonical Flow；
- 设计 API、数据库、技术栈或部署方案；
- 引入支付、结算、退款、平台佣金、Marketplace、CRM、Membership、AI 或自动排期。

## 2. Specification Principles

### 2.1 One Flow, One Commercial Action

VS-01 只支持一个商业动作：

```text
Customer Request
```

不是：

- Buy；
- Book；
- Reserve；
- Inquire；
- 订单支付。

### 2.2 Commerce Identity-first

公开页面首先帮助 Buyer 理解：

1. Creator 是谁；
2. Creator 正在提供什么；
3. Buyer 现在可以采取什么商业动作。

它不是普通社交主页，也不是商品搜索页。

### 2.3 State is visible and enforceable

界面必须反映对象真实状态；按钮、入口与结果不能让用户误以为平台已付款、已排期或已担保履约。

### 2.4 Shadow Commerce is explicit

VS-01 的 Confirm 仅代表 Creator 接受 Request：

```text
Confirmed Commerce
≠ Paid Transaction
≠ Settlement
≠ Fulfillment
```

所有界面、通知和结果文案都不得暗示平台已经收款、扣款、结算或担保服务完成。

### 2.5 Minimal but complete

每个 Surface 只服务于 VS-01 的下一步合法动作。没有直接支持：

```text
Identity
→ Offering
→ Publish
→ Distribution
→ Request
→ Confirm / Decline
```

的界面元素不应进入首版。

## 3. Product Surface Map

### 3.1 Creator Side

| Surface                        | Primary User | Purpose                                 | Primary Objects                                       | Primary States                                                               |
| ------------------------------ | ------------ | --------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| Creator Home                   | Creator      | 查看当前商业化准备与下一步              | Creator、Commerce Identity、Offering、Commerce Action | Activated / Published；Draft / Published / Unpublished；Submitted / terminal |
| Commerce Identity Editor       | Creator      | 创建或完善公开商业身份                  | Commerce Identity、Capability                         | Draft / Published / Updated                                                  |
| Create / Edit Service Offering | Creator      | 创建或修改一个可请求的 Service Offering | Capability、Offering、Inventory、Availability         | Draft / Published / Unpublished                                              |
| Offering Management            | Creator      | 发布、撤下、分享已创建的 Offering       | Offering、Distribution Asset                          | Draft / Published / Unpublished；Generated / Distributed                     |
| Commerce Requests              | Creator      | 查看并处理 Submitted Request            | Customer、Commerce Action、Confirmed Commerce         | Submitted / Confirmed / Declined                                             |

### 3.2 Public and Customer Side

| Surface                       | Primary User     | Purpose                             | Primary Objects                                   | Primary States                   |
| ----------------------------- | ---------------- | ----------------------------------- | ------------------------------------------------- | -------------------------------- |
| Public Commerce Identity Page | Buyer / Customer | 理解 Creator 与其当前公开供给       | Commerce Identity、Capability、Published Offering | Identity / Offering: Published   |
| Service Offering Page         | Buyer / Customer | 理解单项服务及其请求条件            | Offering、Availability                            | Offering: Published              |
| Request Flow                  | Buyer / Customer | 为一个 Offering 提交明确 Request    | Customer、Commerce Action                         | Draft → Submitted                |
| Request Result                | Buyer / Customer | 知道 Request 已提交、被确认或被拒绝 | Commerce Action、Confirmed Commerce               | Submitted / Confirmed / Declined |

### 3.3 Out of Scope Surfaces

VS-01 不创建以下页面或中心：

- Marketplace / Discovery；
- Search；
- Customer Account Center；
- Order Center；
- Payment / Checkout；
- Calendar；
- Notification Center；
- CRM；
- Analytics Dashboard；
- Creator Referral；
- Customer Chat；
- Admin payment / settlement console。

## 4. Screen and Surface Specification

### 4.1 Creator Home

**Purpose**

让 Creator 立即理解其商业身份当前是否已公开、是否已有可请求 Offering、是否有待处理 Request，以及下一步应该完成什么。

**User**

Creator。

**Must show**

- Commerce Identity 当前公开状态；
- 当前 Service Offering 列表及其 `Draft / Published / Unpublished` 状态；
- 是否存在可分享的 Published Offering；
- Submitted Request 数量与入口；
- 一个优先级明确的下一步动作。

**Allowed actions**

- Create / Edit Commerce Identity；
- Create Service Offering；
- Edit Offering；
- Publish / Unpublish Offering；
- Share Published Offering；
- Open Commerce Requests；
- Confirm / Decline a Submitted Request（可通过 Requests Surface 完成）。

**State-aware behavior**

| Condition                       | Primary UI behavior                                               |
| ------------------------------- | ----------------------------------------------------------------- |
| 没有可公开 Commerce Identity    | 引导 Creator 完成 Identity；不把“创建 Offering”伪装为已可对外交易 |
| 有 Identity、无 Offering        | 显示空状态，主动作是 Create Service Offering                      |
| 有 Draft Offering               | 显示 Draft 与缺失发布条件；主动作是 Edit / Publish                |
| 有 Published Offering、尚未分发 | 显示 Share；明确“已发布”不等于“已分发”                            |
| 有 Published Offering 且已分发  | 显示分享状态与 Requests 入口                                      |
| 有 Submitted Request            | 突出待处理 Request，不自动确认                                    |
| 所有 Offering 均 Unpublished    | 不展示为外部可请求供给；引导 Publish 或继续编辑                   |

**Must not show**

- 平台 GMV；
- 平台收入；
- Take Rate；
- “已付款”或“订单完成”；
- Marketplace 推荐；
- CRM 标签、粉丝管理或复杂数据报表。

### 4.2 Commerce Identity Editor

**Purpose**

让 Creator 建立一个足以支撑公开商业入口的 Identity，而不是创建完整个人网站。

**User**

Creator。

**Must show**

- 身份信息编辑入口；
- Creator 的公开介绍；
- 至少一个可关联到 Offering 的 Capability；
- 已发布 Offering 将如何出现在公开 Commerce Identity 中的清晰预期；
- 保存与继续创建 Offering 的下一步。

**Allowed actions**

- Create / Edit Identity；
- Add / Edit Capability；
- Save；
- Continue to Create Offering。

**Minimum information rule**

界面只要求能够让 Buyer 识别 Creator 并理解其服务能力的最小 Identity 信息。具体字段由 20 PRD 固定，但不得将完整社交档案、粉丝数据或复杂认证作为首版门槛。

**State-aware behavior**

| Identity state        | Creator sees                       | Creator can do                             |
| --------------------- | ---------------------------------- | ------------------------------------------ |
| Draft                 | 未公开提示；尚无公开入口           | Edit / Save / Continue to Offering         |
| Published             | 当前公开状态与已聚合 Offering      | Edit；继续管理 Offering                    |
| Updated after publish | 已公开但存在未保存编辑时的明确提示 | Save update；不创建第二个 Identity         |
| Unpublished           | 公开入口不可访问的明确提示         | Edit；在存在符合条件的 Offering 后重新公开 |

**Must not show**

- Team roles；
- 多品牌或多 Identity 管理；
- 粉丝导入；
- Creator verification marketplace；
- 复杂视觉主题系统。

### 4.3 Create / Edit Service Offering

**Purpose**

让 Creator 将一个 Capability 表达为一个 Buyer 能理解并可发起 Request 的 Service Offering。

**User**

Creator。

**Corresponding objects**

Capability、Offering、Inventory、Availability。

**Must show**

- Offering 的服务名称；
- 服务说明；
- 可关联的 Capability；
- Requestable Availability 或等价服务条件；
- 对 Buyer 的 Request Instructions；
- 当前 Offering 状态；
- 保存 Draft 与 Publish 行为。

**Allowed actions**

- Create Offering；
- Edit Offering；
- Associate / change Capability；
- Set / edit Requestable Availability；
- Save Draft；
- Publish（仅满足最低发布条件时）；
- Unpublish（仅 Published 时）；
- Archive（非 VS-01 必须 UI；若实现，必须遵循 18 的状态规则）。

**Input behavior**

| Input concept        | Product purpose                       | Minimum rule                          |
| -------------------- | ------------------------------------- | ------------------------------------- |
| Title                | 告诉 Buyer 提供的是什么服务           | 必须清晰表达单项 Service Offering     |
| Description          | 解释 Creator 将提供什么               | 必须让 Buyer 理解服务基本内容         |
| Capability           | 将 Offering 归属到 Creator 可交付能力 | 至少关联一个 Capability               |
| Availability         | 表达何时或在何种条件下可请求          | 必须足以支持 Buyer 提交 Request       |
| Request instructions | 告诉 Buyer 需要提供哪些信息或条件     | 必须避免 Buyer 不知道如何发起 Request |

价格可以作为 Creator 的服务信息存在，但 VS-01 不将其解释为可支付价格、结算金额或平台订单金额。

**State-aware behavior**

| Offering state | Creator sees                     | Allowed actions                     | Forbidden actions                          |
| -------------- | -------------------------------- | ----------------------------------- | ------------------------------------------ |
| Draft          | 未公开、可继续完善、缺失条件提示 | Edit / Save / Publish（条件满足后） | Share as public supply；接受 Buyer Request |
| Published      | 当前对外可请求状态、Share 入口   | Edit / Share / Unpublish            | 将其标记为已付款或已履约                   |
| Unpublished    | 不再接受新 Request 的提示        | Edit / Publish / Archive            | 作为公开可请求供给分享                     |
| Archived       | 历史供给提示                     | 无 VS-01 恢复流程要求               | Publish；接受 Request                      |

**Edit rule**

Creator 可以编辑 Published Offering 的对外信息；编辑不会改变已存在 Commerce Action 的历史记录。

若 Offering 被 Unpublished，已 Submitted Request 仍由原 Creator 在 Commerce Requests 中处理；系统不允许新的 Request。

**Must not show**

- 自动排期；
- 日历冲突提示；
- 容量锁定；
- Coupon；
- Checkout；
- 自动退款；
- 平台佣金设置；
- 多 Primitive 模板中心。

### 4.4 Offering Management

**Purpose**

让 Creator 对已创建 Offering 执行 Publish、Unpublish、Share 与查看当前分发状态等管理动作。

**User**

Creator。

**Must show**

- Offering 名称与当前状态；
- 发布条件是否满足；
- Publish / Unpublish 动作；
- 对 Published Offering 的 Share 入口；
- Distribution Asset 是否 `Generated` 或 `Distributed`；
- 与该 Offering 相关的 Submitted Request 数量或入口。

**Allowed actions**

- Publish；
- Unpublish；
- Generate / copy / open Distribution Asset；
- Record or confirm external sharing；
- Open Commerce Requests。

**State-aware behavior**

| Offering / Asset state        | UI requirement                                                   |
| ----------------------------- | ---------------------------------------------------------------- |
| Draft Offering                | 显示 Publish 条件与 Edit，不显示 Buyer-facing Share              |
| Published + no Asset          | System 生成最小可分享 Asset；Creator 可取得它                    |
| Published + Generated Asset   | 显示 Share；不将 Creator 标记为 Distributed                      |
| Published + Distributed Asset | 显示已分发状态；仍允许再次分享                                   |
| Unpublished Offering          | 隐藏或禁用面向 Buyer 的 Request 入口；不允许作为公开供给继续推广 |

**Distribution rule**

系统生成链接、二维码或卡片时，`Distribution Asset = Generated`。

只有 Creator 实际分享到至少一个外部真实渠道，才变为 `Distributed` 并触发 `creator_distributed`。首版可使用 Creator 明确确认的方式记录分享，但不得在生成时自动计为分发。

### 4.5 Commerce Requests

**Purpose**

让 Creator 可靠地查看并处理归属于自己 Published Offering 的 Submitted Commerce Action。

**User**

Creator。

**Must show**

- Request 关联的 Offering；
- Customer 提交的最小联系信息与请求内容；
- 当前 Commerce Action 状态；
- Submitted Request 的 Confirm / Decline 操作；
- Confirmed 或 Declined 后的不可变结果状态；
- 与当前结果一致的操作反馈。

**Allowed actions**

| Commerce Action state | Creator actions   |
| --------------------- | ----------------- |
| Submitted             | Confirm / Decline |
| Confirmed             | View result only  |
| Declined              | View result only  |

**Rules**

- Creator 只能处理归属于自己 Offering 的 Submitted Request；
- Confirm 和 Decline 必须是明确、不可静默发生的动作；
- 一个 Action 只能到达一个终态；
- Confirm 后不能在 VS-01 内改为 Declined；
- Decline 后不能在 VS-01 内改为 Confirmed；
- 系统不提供收款、日程锁定、聊天、重新协商或撤销确认。

**Must not show**

- “Accept payment”；
- “Order fulfilled”；
- 平台担保；
- 自动退款；
- Customer 历史 CRM；
- 分配给团队成员处理。

### 4.6 Public Commerce Identity Page

**Purpose**

让来自 Creator 自有渠道的 Buyer 理解 Creator，并找到当前可行动的 Service Offering。

**User**

Buyer / Customer。

**Must show**

- Creator 的公开身份与介绍；
- 相关 Capability 或服务能力表达；
- 当前 Published Service Offering；
- 对应 Availability / Request Conditions；
- 清晰的 Request 入口；
- Offering 当前不可用时的替代性不可用状态。

**State-aware behavior**

| Public state                               | Buyer sees                                    | Buyer can do            |
| ------------------------------------------ | --------------------------------------------- | ----------------------- |
| Identity Published + Published Offering    | Creator 信息、Offer、Request 入口             | Open Offering / Request |
| Identity Published + no Published Offering | Creator Identity 与“当前暂无可请求服务”空状态 | 无 Request              |
| Identity Unpublished / invalid entry       | 不可用状态                                    | 无 Request              |
| Offering Unpublished / Archived            | 该 Offering 不可请求                          | 无 Request              |

**Must not show**

- 平台内 Creator 推荐；
- 搜索；
- 关注、Feed 或社交互动；
- 平台收款承诺；
- 其他 Creator 的商品；
- Creator 完整 CRM 或内部 Requests。

### 4.7 Service Offering Page

**Purpose**

让 Buyer 理解单项 Service Offering 是否适合自己，并能在条件明确时提交 Request。

**User**

Buyer / Customer。

**Must show**

- Creator 身份入口；
- Offering 标题；
- Offering 描述；
- Capability 表达；
- Requestable Availability / service conditions；
- Request Instructions；
- Request 动作；
- 清晰的“提交 Request 不等于付款或预约已完成”提示。

**Allowed actions**

- Return to Commerce Identity；
- Start Request；
- Submit Request；
- View Request Result。

**State-aware behavior**

| Offering state                            | Buyer sees                 | Buyer can do           |
| ----------------------------------------- | -------------------------- | ---------------------- |
| Published and requestable                 | 完整服务信息与 Request CTA | Start / submit Request |
| Published but temporarily not requestable | 暂不可请求说明             | 无 Request             |
| Unpublished / Archived / unavailable link | Offer unavailable state    | 无 Request             |

“temporarily not requestable”是对 Availability 条件的展示，不新增 Offering 状态。

### 4.8 Request Flow

**Purpose**

让 Buyer 对一个 Published、可请求的 Offering 提交完整且可由 Creator 处理的 Commerce Action。

**User**

Buyer / Customer。

**Must show**

- 正在请求的 Creator 与 Offering；
- Buyer 需要提供的最小联系信息；
- 与服务相关的 Request 信息；
- Request Instructions；
- 提交前的状态说明；
- 提交成功或失败的结果。

**Allowed actions**

- Enter / edit Request information；
- Submit Request；
- Return to Offering。

**On submit**

```text
Valid Request
→ Customer created or associated
→ Commerce Action: Draft → Submitted
→ commerce_action_submitted
→ Buyer sees Submitted result
→ Creator receives notification
```

**Must not show**

- Payment fields；
- Credit card / wallet；
- Final order total；
- Instant booking confirmation；
- Automatic time slot selection；
- Buyer account dashboard；
- Messaging thread。

### 4.9 Request Result

**Purpose**

让 Buyer 不依赖猜测而知道 Request 已提交，以及 Creator 后续 Confirm / Decline 的实际结果。

**User**

Buyer / Customer。

**State-aware behavior**

| Commerce Action state | Buyer sees                                       | Buyer can do                            |
| --------------------- | ------------------------------------------------ | --------------------------------------- |
| Submitted             | 已提交、等待 Creator 处理的说明                  | 查看当前 Request 信息；无支付或取消入口 |
| Confirmed             | Creator 已确认的明确结果；后续联络或人工安排提示 | 查看结果；不显示 Paid / Fulfilled       |
| Declined              | Creator 未接受当前 Request 的明确结果            | 查看结果；不自动推荐替代供给            |

**Must not show**

- “Payment successful”；
- “Booking confirmed”；
- “Service completed”；
- 自动重新请求；
- 客服争议或退款入口。

## 5. Action Specification

### 5.1 Creator Actions

| Action             | Actor   | Preconditions                               | Result                                  | State Change                                                             | Event                                                                         |
| ------------------ | ------- | ------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Save Identity      | Creator | Creator 可管理自身 Identity                 | Identity 创建或更新                     | Draft / Published remains according to current public state              | `creator_activated` only when first minimum activation condition becomes true |
| Add Capability     | Creator | Commerce Identity exists                    | Capability 可被 Offering 关联           | 无需独立核心状态                                                         | 无必需事件                                                                    |
| Create Offering    | Creator | Commerce Identity exists                    | 新 Service Offering                     | Offering: Draft                                                          | 无必需事件                                                                    |
| Save Draft         | Creator | Offering 为 Draft / Published / Unpublished | Offering 信息更新                       | 保持当前 Offering 状态                                                   | 无必需事件                                                                    |
| Set Availability   | Creator | Offering exists                             | Availability / Inventory 条件被表达     | Offering 状态不自动变化                                                  | 无必需事件                                                                    |
| Publish Offering   | Creator | 满足 18 的 Minimum Publish Conditions       | Offering 对外可请求；最小分享资产可生成 | Offering: Draft / Unpublished → Published；Identity 可首次变为 Published | 首次使 Identity 公开时：`creator_published`；后续重新 Publish 无新增必需事件  |
| Unpublish Offering | Creator | Offering 为 Published                       | 停止接受新 Request                      | Offering: Published → Unpublished                                        | 无新增必需事件                                                                |
| Share Asset        | Creator | Published Offering 且 Asset 已 Generated    | 外部分享被记录                          | Asset: Generated → Distributed                                           | `creator_distributed`                                                         |
| Confirm Request    | Creator | Action 为 Submitted，且归属 Creator         | Confirmed Commerce 形成                 | Action: Submitted → Confirmed                                            | `commerce_confirmed`                                                          |
| Decline Request    | Creator | Action 为 Submitted，且归属 Creator         | 当前 Request 被拒绝                     | Action: Submitted → Declined                                             | `commerce_declined`                                                           |

### 5.2 Buyer Actions

| Action          | Actor | Preconditions                   | Result                                    | State Change              | Event                       |
| --------------- | ----- | ------------------------------- | ----------------------------------------- | ------------------------- | --------------------------- |
| Open Storefront | Buyer | Public Identity is Published    | 浏览公开 Commerce Identity                | 无状态变化                | `storefront_viewed`         |
| View Offering   | Buyer | Offering is Published           | 阅读单项服务供给                          | 无状态变化                | 无必需独立事件              |
| Start Request   | Buyer | Offering 为 Published 且可请求  | 进入 Request Flow                         | 无状态变化                | 无事件                      |
| Submit Request  | Buyer | 最小信息完整；Offering 仍可请求 | Customer 创建或关联；Commerce Action 创建 | Action: Draft → Submitted | `commerce_action_submitted` |

### 5.3 System Actions

| Action                      | Actor  | Preconditions                                   | Result                     | State Change     | Event                                                    |
| --------------------------- | ------ | ----------------------------------------------- | -------------------------- | ---------------- | -------------------------------------------------------- |
| Generate Distribution Asset | System | Published Offering exists                       | 生成可分享入口             | Asset: Generated | 无必需事件                                               |
| Notify Creator of Request   | System | Action becomes Submitted                        | Creator 得知待处理 Request | 无对象状态变化   | 可由通知投递日志实现；不替代 `commerce_action_submitted` |
| Notify Buyer of Decision    | System | Action becomes Confirmed / Declined             | Buyer 得知实际结果         | 无对象状态变化   | 不替代 `commerce_confirmed` / `commerce_declined`        |
| Prevent invalid transition  | System | Actor / state / ownership does not satisfy rule | 拒绝操作并保留原状态       | 无状态变化       | 无业务事件                                               |

## 6. State-aware UI Matrix

### 6.1 Offering

| Offering State | Creator Home / Management                         | Public Identity / Offering Page              | Request Flow        |
| -------------- | ------------------------------------------------- | -------------------------------------------- | ------------------- |
| Draft          | 显示 Edit、缺失发布条件、Publish（若满足）        | 不显示为公开供给                             | 不可进入            |
| Published      | 显示 Edit、Unpublish、Share、Requests             | 显示并允许 Request（若 Availability 可请求） | 可进入并提交        |
| Unpublished    | 显示 Edit、Publish、Archive；提示不接收新 Request | 不显示或显示不可用状态                       | 不可进入 / 不可提交 |
| Archived       | 仅历史管理语义；无需恢复 Flow                     | 不显示或显示不可用状态                       | 不可进入            |

### 6.2 Distribution Asset

| Asset State | Creator sees                              | Product meaning                  |
| ----------- | ----------------------------------------- | -------------------------------- |
| Generated   | Link / QR / card 已可使用；明确引导 Share | 资产可用，尚无实际外部分发       |
| Distributed | 已记录至少一次真实外部分发；允许再次分享  | Creator 已将商业入口带到外部渠道 |

### 6.3 Commerce Action

| Action State | Creator sees                     | Buyer sees                         | Allowed next action       |
| ------------ | -------------------------------- | ---------------------------------- | ------------------------- |
| Draft        | 不应出现在 Creator Requests 列表 | 不应作为已提交 Request 显示        | Buyer 完成并提交或离开    |
| Submitted    | 完整请求信息、Confirm / Decline  | 已提交、等待 Creator 处理          | Creator Confirm / Decline |
| Confirmed    | 明确确认结果；无再次决策按钮     | Creator 已确认；非付款、非履约结果 | VS-01 STOP                |
| Declined     | 明确拒绝结果；无再次决策按钮     | 当前 Request 未被接受              | VS-01 STOP                |

### 6.4 Commerce Identity

| Identity State | Creator sees                                 | Buyer sees             |
| -------------- | -------------------------------------------- | ---------------------- |
| Draft          | 身份未公开；可编辑和继续创建 Offer           | 无公开访问             |
| Published      | 公开入口状态、已聚合 Published Offering      | Creator 身份和公开供给 |
| Unpublished    | 公开入口不可用；可编辑与在条件满足后重新公开 | 不可用状态或无公开访问 |

## 7. Notification Model

### 7.1 Minimum Notification Loop

```text
Buyer submits Request
→ System notifies Creator
→ Creator confirms or declines
→ System notifies Buyer
```

首版不需要 Notification Center。通知的具体传输方式可由 PRD / 实现选择，但必须让正确角色能得知状态变化。

### 7.2 Required Notification Content

| Trigger                                           | Recipient | Must communicate                                 | Must not imply                             |
| ------------------------------------------------- | --------- | ------------------------------------------------ | ------------------------------------------ |
| `commerce_action_submitted`                       | Creator   | 有新的 Request、对应 Offering、可前往处理        | 已付款、已排期、平台担保                   |
| `commerce_confirmed`                              | Buyer     | Creator 已确认当前 Request、后续需人工协调的提示 | 已付款、订单完成、平台履约承诺             |
| `commerce_declined`                               | Buyer     | Creator 未接受当前 Request                       | 自动退款、平台替代匹配、服务失败归责       |
| Offering becomes unavailable while Buyer opens it | Buyer     | 当前服务无法接受新 Request                       | Creator 已永久离开、可自动推荐替代 Creator |

### 7.3 Notification Rules

1. 通知是状态变化的结果，不是新的商业状态；
2. 同一 Action 的同一终态通知不得重复制造新的业务事件；
3. 通知投递失败不得改变 Commerce Action 的已记录状态；
4. 首版不要求读状态、通知偏好、站内通知中心或营销推送；
5. 平台不应以通知替代 Creator 的实际 Confirm / Decline 决策。

## 8. Empty, Error and Edge-case Specification

### 8.1 Creator Empty States

| Situation                       | Surface             | Required response            | Primary action                |
| ------------------------------- | ------------------- | ---------------------------- | ----------------------------- |
| 没有 Commerce Identity          | Creator Home        | 说明尚未建立公开商业入口     | Create Identity               |
| 有 Identity、无 Offering        | Creator Home        | 说明尚无可请求供给           | Create Service Offering       |
| 有 Draft Offering、无法 Publish | Offering Editor     | 指明缺失最小发布条件         | Edit missing condition        |
| 有 Published Offering、未分发   | Offering Management | 明确已发布但尚未带到外部渠道 | Share                         |
| 没有 Submitted Request          | Commerce Requests   | 说明当前没有待处理商业动作   | Return to Offering Management |

### 8.2 Buyer Empty / Unavailable States

| Situation                          | Surface         | Required response          | Forbidden behavior                   |
| ---------------------------------- | --------------- | -------------------------- | ------------------------------------ |
| Creator 暂无 Published Offering    | Public Identity | 显示当前暂无可请求服务     | 推荐 Marketplace Creator             |
| Offering 已 Unpublished / Archived | Offering Page   | 显示不可用；不提供 Request | 创建 Action、显示旧价或付款入口      |
| Availability 暂不可请求            | Offering Page   | 显示当前不接受 Request     | 自动排队、自动预约                   |
| Request 已 Confirmed / Declined    | Request Result  | 显示结果                   | 再次 Confirm / Decline、显示支付状态 |

### 8.3 Validation Errors

| Trigger                                           | System response                | State / Event result                                    |
| ------------------------------------------------- | ------------------------------ | ------------------------------------------------------- |
| Identity 最小信息不完整                           | 阻止公开 Publish；指出待补内容 | 保持 Draft；无 `creator_published`                      |
| Offering 最小发布条件不完整                       | 阻止 Publish；指出未满足条件   | 保持 Draft；无 `creator_published`                      |
| Buyer Request 信息不完整                          | 阻止 Submit；指出需补充内容    | 不创建 Submitted Action；无 `commerce_action_submitted` |
| Buyer 在 Offering 不再可请求时 Submit             | 拒绝提交并显示不可用           | 不创建新 Action                                         |
| Creator 对 terminal Action 再次 Confirm / Decline | 拒绝重复操作，显示已有结果     | 原状态不变；无新事件                                    |
| 非归属 Creator 处理 Request                       | 拒绝操作                       | 原状态不变；无业务事件                                  |

### 8.4 Edge Cases

#### Duplicate Request

当系统能可靠识别：

```text
Same Customer
+ Same Published Offering
+ Same unresolved request context
```

时，应提醒并阻止意外重复提交。

若无法可靠识别，允许提交独立 Action，但每个 Action 都必须可追溯，且 Creator 分别处理。

#### Offering edited after Request

- Offering 的当前公开信息可更新；
- 已 Submitted / Confirmed / Declined Request 保留提交时可追溯的商业上下文；
- 编辑 Offering 不得重写 Customer 当时看到和提交的 Request 事实；
- 首版不提供自动通知 Buyer、重新报价或重新确认。

#### Offering unpublished with existing Request

- 停止新的 Request；
- 已 Submitted Action 仍允许归属 Creator Confirm / Decline；
- 已 Confirmed / Declined Action 保持终态；
- 不提供自动取消、退款、改期或客服工作流。

#### Creator temporarily unavailable

Creator 应通过 Offering 的 Requestable Availability 表达暂不可请求或有限条件。

首版不创建独立“休假”“暂停账户”对象，也不做自动排期冲突处理。

#### External payment or fulfillment

若平台外付款或履约被观察到：

- 可按 15 / 18 的规则记录受控事实；
- 不改变 VS-01 用户界面为支付或订单完成体验；
- 不创建平台 GMV、Take Rate 或 Settlement。

## 9. Product Rules

### 9.1 Ownership and Permissions

1. Creator 只能管理自己的 Commerce Identity、Capability、Offering 和归属 Request；
2. Buyer 只能提交与查看自己发起的 Request 结果；
3. System 可以生成资产、执行规则、记录事件、发送通知，但不能代替 Creator 做商业决定；
4. Pilot Operations Owner 只能协助 Onboarding 与受控事实补录，不能伪造任何用户行为。

### 9.2 Publishing Rules

1. Offering 只能由其 Creator Publish；
2. Publish 必须满足 18 的 Minimum Publish Conditions；
3. Published Offering 才可出现在 Public Commerce Identity 和 Service Offering Page；
4. Unpublished 与 Archived Offering 不得创建新 Request；
5. Publish 产生公开供给，不产生 Payment、GMV 或平台收入；
6. 首次发布合格 Offering 时，Commerce Identity 可以成为 Published。

### 9.3 Request Rules

1. Buyer 只能对 Published 且当前可请求的 Offering 提交 Request；
2. 提交 Request 必须先通过最小信息校验；
3. Submit 将 Commerce Action 变为 Submitted；
4. Submit 不等于 Confirm、Paid 或 Fulfilled；
5. 一个 Submitted Action 的唯一决策者是归属 Offering 的 Creator；
6. 同一 Action 只能 Confirm 或 Decline 一次；
7. Confirm 与 Decline 都是 VS-01 的终态；
8. VS-01 不支持 Buyer cancel、Creator revoke、重新提交相同 Action 的自动流程。

### 9.4 Distribution Rules

1. Published Offering 必须能生成至少一种 Distribution Asset；
2. Asset Generated 不等于 Creator Distributed；
3. `creator_distributed` 只在真实外部分发被记录时产生；
4. 外部分发是 Creator 自有渠道行为，平台不承诺流量、曝光或转化；
5. 首版不需要平台内发现、搜索或推荐。

### 9.5 Shadow Commerce Rules

1. Confirm 只代表 Confirmed Commerce；
2. Confirm 不能显示为 Payment Successful；
3. 外部付款不能自动变为平台支付；
4. 外部履约不能自动变为平台 Fulfillment；
5. VS-01 页面不得收集或显示支付工具、结算金额、佣金或退款状态；
6. 任何外部付款或履约观察不得计入平台 GMV / Take Rate。

## 10. VS-01 Acceptance Criteria

### 10.1 Creator Identity and Supply

- [ ] Creator 可以创建并保存一个 Commerce Identity；
- [ ] Creator 可以至少添加一个 Capability；
- [ ] Creator 可以创建一个 Service Offering；
- [ ] Creator 可以为 Offering 表达 Requestable Availability；
- [ ] 不满足最小发布条件时，系统阻止 Publish 并明确指出缺失条件；
- [ ] 满足条件后，Creator 可以 Publish Offering；
- [ ] Publish 后，Offering 在公开 Commerce Identity 中可见；
- [ ] Creator 可以 Unpublish Offering，且该 Offering 不再接受新 Request；
- [ ] Creator 可以区分 Draft、Published 与 Unpublished Offering。

### 10.2 Distribution

- [ ] Published Offering 生成至少一种可分享 Distribution Asset；
- [ ] Creator 可以取得并使用该 Asset；
- [ ] Generated 与 Distributed 在产品状态和指标上严格区分；
- [ ] Creator 记录实际外部分发后，系统产生 `creator_distributed`；
- [ ] 未分发的 Generated Asset 不得让 Creator 被计为 Distributed。

### 10.3 Buyer Request

- [ ] Buyer 可以通过公开入口访问 Published Commerce Identity；
- [ ] Buyer 可以查看 Published Service Offering、Availability 与 Request Instructions；
- [ ] Buyer 可以对可请求 Offering 进入并完成 Request Flow；
- [ ] Buyer 提交完整信息后，系统创建 Customer 或关联既有 Customer；
- [ ] 系统将 Commerce Action 从 Draft 变为 Submitted；
- [ ] 系统记录 `commerce_action_submitted`；
- [ ] Buyer 看到“已提交、等待 Creator 处理”的正确状态；
- [ ] Buyer 不能对 Unpublished、Archived 或暂不可请求 Offering 创建新 Action。

### 10.4 Creator Decision and Result

- [ ] Creator 可以查看归属于自己 Offering 的 Submitted Request；
- [ ] Creator 可以对 Submitted Request Confirm；
- [ ] Confirm 将 Action 变为 Confirmed，并记录 `commerce_confirmed`；
- [ ] Creator 可以对 Submitted Request Decline；
- [ ] Decline 将 Action 变为 Declined，并记录 `commerce_declined`；
- [ ] Confirmed 和 Declined Action 均不可再次决策；
- [ ] Buyer 能收到或查看 Confirmed / Declined 的正确结果；
- [ ] Creator 和 Buyer 的结果界面均不暗示已付款、已结算或已履约。

### 10.5 Event and Boundary Integrity

- [ ] `creator_published` 仅在首次公开合格 Offering 时产生；
- [ ] `creator_distributed` 不因生成 Asset 自动产生；
- [ ] `commerce_action_submitted` 不因浏览页面自动产生；
- [ ] `commerce_confirmed` 与 `commerce_declined` 仅由归属 Creator 的明确终态操作产生；
- [ ] 非法权限、无效状态或不完整输入不会改变对象状态，也不会产生业务事件；
- [ ] 系统不提供支付、结算、退款、GMV、Take Rate、Marketplace、CRM、自动排期或履约工作流；
- [ ] 外部付款与履约如被记录，不改变 VS-01 的 State-aware UI 或平台经济指标。

当且仅当 10.1–10.5 均满足时：

> **VS-01 Product Complete for Controlled Prototype**

## 11. Decision Record

### D-19-01 — The public identity page exists to lead to a commercial action

- **Decision**：Public Commerce Identity 的首要任务是使 Buyer 理解 Creator 并进入当前 Published Offering。
- **Reason**：Commerce Identity 是入口与聚合面，不是普通个人主页或社交内容页。
- **Consequence**：页面不引入 Feed、Follower、推荐或 Marketplace 内容。
- **Revisit Trigger**：如果实际 Creator 需要将多个独立 Offering 作为主要入口，且 Identity 成为行动阻塞，再审查入口信息层级。

### D-19-02 — Request is the only Buyer action

- **Decision**：VS-01 的 Buyer 只能提交 Request。
- **Reason**：第一 Slice 需要验证商业行动与 Creator 决策，而不是提前构建支付、自动预约或多个 Primitive。
- **Consequence**：界面不得使用 Buy、Checkout、Payment Success 或 Booking Confirmed 的语言。
- **Revisit Trigger**：仅在 Real-money Controlled Pilot 前置条件完成后，才决定是否引入 Payment 或 Booking Action。

### D-19-03 — Notifications communicate, not decide

- **Decision**：首版通知只用于告知状态变化，不能代替 Creator 的 Confirm / Decline。
- **Reason**：商业结果必须来自可追溯的用户动作。
- **Consequence**：不建立复杂 Notification Center，也不由运营替用户做决策。
- **Revisit Trigger**：若 Cohort 使用中通知送达成为明确阻塞，再优先增强通知渠道或可靠性，而不是扩大产品对象。

### D-19-04 — Product specification is complete after acceptance criteria

- **Decision**：19 完成后停止新增产品架构型文档，进入 20 MVP PRD。
- **Reason**：对象、Flow、界面行为、规则和验收条件已足以支持实现范围冻结。
- **Consequence**：后续 PRD 引用 17 / 18 / 19，不重复抽象。
- **Revisit Trigger**：只有当 20 PRD 发现不可消解的对象、Flow 或状态冲突时，才回写到对应上游文档。

## 12. Next Step

产品定义在此收敛。

下一份文档是：

> `20_MVP_PRD_VS01.md`

它只负责冻结：

- Scope；
- Functional Requirements；
- Business / Product Rules；
- Acceptance Criteria；
- 对 17、18、19 的引用关系。

完成 20 后，进入 Codex Build，不再自动新增产品架构文档。
