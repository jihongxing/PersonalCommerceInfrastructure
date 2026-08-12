# 17 — Core Product Objects

> 状态：Decision v1  
> 决策日期：2026-08-11  
> 阶段：Productization Phase  
> 文档角色：定义稳定的产品对象、对象关系与生命周期边界；不是数据库 Schema、API 设计或页面 PRD  
> 核心问题：Creator Commerce 产品究竟由哪些对象组成，这些对象如何形成一条可运行的商业路径？

## 1. Purpose

16 Product Architecture 定义了产品的五层架构。本文件进一步把架构中的概念收敛为可被产品、设计和工程共同使用的对象模型。

本文件解决：

1. 哪些是产品对象；
2. 哪些是对象的状态；
3. 哪些是系统事件；
4. 每个对象由谁拥有、如何产生、如何变化；
5. VS-01 实现哪些对象，暂不实现哪些对象；
6. 后续功能如何避免变成功能集合。

本文件不解决：

- 数据库表、字段、索引或 API；
- 技术栈、服务拆分或部署；
- 页面布局、视觉规范或具体文案；
- 支付渠道、法律实体与真实结算政策；
- 需求是否存在的再次验证。

## 2. Object Model Thesis

产品对象不是页面，也不是功能名称。对象代表产品中具有稳定含义、归属、生命周期和关系的实体。

完整产品对象链为：

```text
Creator
→ Commerce Identity
→ Capability
→ Offering
→ Inventory / Availability
→ Distribution Asset
→ Customer
→ Commerce Action
→ Confirmed Commerce
→ Paid Transaction
→ Fulfillment
→ Relationship
```

其中：

- `Creator` 是供给主体；
- `Commerce Identity` 是统一商业入口与聚合表面；
- `Capability` 描述 Creator 能做什么；
- `Offering` 将能力表达为具体商业供给；
- `Inventory` 与 `Availability` 描述供给当前是否可行动；
- `Distribution Asset` 将供给带到外部渠道；
- `Customer` 是商业关系中的需求方；
- `Commerce Action` 是需求方发起的商业动作；
- `Confirmed Commerce`、`Paid Transaction` 和 `Fulfillment` 是商业结果层；
- `Relationship` 是交易后沉淀的持续关系。

## 3. Object / State / Event Distinction

### 3.1 Product Object

产品对象是可以被创建、归属、引用、更新或持续存在的产品实体。

例子：

- `Creator`
- `Offering`
- `Customer`
- `Commerce Action`
- `Distribution Asset`

### 3.2 State

状态描述对象在生命周期中的当前位置，不应被误建模为新的对象。

例子：

- `Offering: Draft / Published / Unpublished`
- `Commerce Action: Submitted / Confirmed / Declined`
- `Transaction: Pending / Paid / Cancelled`

`Confirmed Commerce` 是一个重要的商业状态，而不是与 `Commerce Action` 平行的新用户入口对象。它表示 Action 已被 Creator 接受。

### 3.3 Event

事件描述某个业务事实在某一时刻发生。事件不可用来替代当前对象状态。

例子：

- `creator_published`
- `commerce_action_submitted`
- `commerce_confirmed`
- `commerce_declined`
- `fulfillment_observed`

事件用于记录历史、驱动指标和支持审计；对象状态用于表达当前产品行为。

## 4. Core Object Catalog

### 4.1 Creator

**定义**

`Creator` 是拥有个人商业身份，并以自己的能力、时间、影响力或个人品牌提供商业价值的主体。

**产品责任**

- 拥有并管理 `Commerce Identity`；
- 创建、编辑、发布或撤下 `Offering`；
- 处理 Customer 发起的 `Commerce Action`；
- 确认、拒绝或履行商业约定。

**拥有者**

Creator 自己拥有其商业身份与供给内容。平台提供管理能力，但不替 Creator 定义其商业价值。

**生命周期**

```text
Registered → Qualified → Activated → Published → Retained
```

这些是 Creator 的运营状态，不代表全部 Creator 都已经产生交易。

**MVP**

只支持具备自主商业决策权、能够提供至少一种真实服务的舞者 Creator。

**未来**

扩展到其他 Creator 与更广泛的 Individual Commerce 主体。

### 4.2 Commerce Identity

**定义**

`Commerce Identity` 是 Creator 对外统一表达“我是谁、我能提供什么、如何开始商业行动”的商业身份。

**包含关系**

它聚合：

- Creator 的身份表达；
- Capability；
- 已发布 Offering；
- 相关 Availability 或 Upcoming；
- Commerce Action 入口；
- Distribution Asset。

**边界**

它不是：

- 社交主页；
- 粉丝关系数据库；
- 单一 Offering；
- Marketplace 发现页；
- 完整 Creator OS。

**生命周期**

```text
Draft → Published → Unpublished / Updated
```

**MVP**

作为 Creator 的公开 Storefront，至少能承载一项可行动的 Service Offering。

**未来**

成为多种 Offering、Event、Experience、Service 与 Inquiry 的统一聚合入口。

### 4.3 Capability

**定义**

`Capability` 是 Creator 可以交付的能力、专业技能、表演能力或商业能力。

例如：

- 舞蹈教学；
- 私教指导；
- 商演；
- 约拍；
- 活动参与。

**与 Offering 的关系**

Capability 回答“能做什么”；Offering 回答“以什么具体形式提供并接受商业行动”。

同一个 Capability 可以产生多个 Offering；没有具体 Offering 时，Capability 本身不等于可交易商品。

**MVP**

用于帮助 Creator 和 Customer 理解 Service Offering，但不建立复杂能力认证或评级体系。

**未来**

可支持能力标签、Proof、推荐模板与跨垂直复用。

### 4.4 Offering

**定义**

`Offering` 是 Creator 将某项 Capability 表达为可被 Customer 理解、请求、预约或购买的具体商业供给。

例如：

> 舞蹈私教，60 分钟，线下或线上，需提前预约。

**核心关系**

```text
Capability
→ Offering
→ Availability / Inventory
→ Commerce Action
```

**所有权**

Creator 创建并维护 Offering。平台只提供结构化约束、默认模板和交易动作，不替 Creator 预设行业商品目录。

**生命周期**

```text
Draft → Published → Unpublished → Archived
```

只有 `Published` 的 Offering 才能被外部 Customer 发起 Commerce Action。

**MVP**

VS-01 只实现一个可请求的 `Service Offering`。

**未来**

扩展为 Event、Experience、Service、Inquiry 等 Commerce Primitive；对象模型保持稳定，主要变化在动作、约束和履约方式。

### 4.5 Inventory

**定义**

`Inventory` 是 Creator 当前可被商业化的供给集合。

它不是传统电商库存的同义词，也不只表示数量。它可以包含：

- 可出售的时间；
- 可预约的服务能力；
- 活动名额；
- 可提供的地点；
- 可接受的商业合作机会。

**边界**

Inventory 是 Offering 的可供给表现，不是独立的 Creator 商品类型。

```text
Offering = 卖什么
Inventory = 当前有哪些可交易供给
```

**MVP**

只表达 Service Offering 是否存在可被请求的供给，不实现完整库存、自动锁定或复杂容量管理。

**未来**

支持容量、配额、批次、活动名额和多资源组合。

### 4.6 Availability

**定义**

`Availability` 是 Offering 可以被提供的时间、地点、容量或条件约束。

它回答：

> 这个 Offering 在什么条件下可以发生？

**关系**

```text
Offering + Availability → Actionable Offering
```

**MVP**

使用 Creator 可表达的 Requestable Availability，让 Customer 在请求中提出期望时间或条件；不要求首版提供完整 Calendar。

**未来**

扩展为：

- Calendar；
- recurring availability；
- conflict detection；
- capacity；
- blackout dates；
- 自动预约。

### 4.7 Distribution Asset

**定义**

`Distribution Asset` 是 Creator 用于把 Commerce Identity 或 Offering 带到外部渠道的传播资产。

典型形式：

- Share Link；
- QR Code；
- Commerce Card；
- 可复制的商品信息；
- 线下展示素材。

**产品意义**

Distribution 是产品对象，而不只是营销行为，因为它连接了：

```text
Creator-controlled channel → Commerce Identity / Offering → Customer
```

**生命周期**

```text
Generated → Distributed → Attributed / Expired
```

“Generated”不等于“Distributed”。只有 Creator 实际将资产带到外部渠道，才算发生分发。

**MVP**

生成一个可分享的公开入口，并记录可归因的分发行为；不做 Marketplace Discovery 或付费投放。

### 4.8 Customer

**定义**

`Customer` 是与 Creator 的 Offering 发生商业关系或尝试发生商业关系的个人。

在不同场景中，Customer 可以是：

- Fan；
- 课程购买者；
- 预约者；
- 商业合作需求方。

**边界**

Customer 不是泛化的平台注册 User，也不是 Creator 的完整 CRM 联系人。

成为 Customer 的依据是商业互动，而不是关注、浏览或社交关系。

**MVP**

Buyer 无需先注册完整账户即可提交 Request；系统仍需为该商业动作保留可联系、可识别和可追踪的最小 Customer 关系。

**未来**

支持 Customer Identity、同 Creator 的历史订单、权益、重复购买和隐私同意管理。

### 4.9 Commerce Action

**定义**

`Commerce Action` 是 Customer 针对某个 Published Offering 发起的明确商业动作。

MVP 的主要动作是：

```text
Request
```

未来可能包括：

- Reserve；
- Book；
- Buy；
- Apply；
- Inquire。

**前置条件**

- Offering 已 Published；
- Offering 当前允许该动作；
- Customer 提供完成动作所需的最小信息；
- 动作能够被 Creator 接收并处理。

**生命周期**

```text
Draft → Submitted → Confirmed / Declined / Cancelled
```

**边界**

Commerce Action 不等于 Transaction：

```text
Commerce Action ≠ Paid Transaction
```

提交 Request 只代表 Customer 表达了商业意图。

### 4.10 Confirmed Commerce

**定义**

`Confirmed Commerce` 是 Creator 接受 Commerce Action 后形成的商业确认状态。

它表示双方已经对当前商业事项达成了产品层面的确认，但不必然代表已付款。

**MVP**

VS-01 的终点是 Creator Confirm / Decline，并记录该结果。Prototype 使用 `Confirmed Commerce` 作为商业闭环结果。

**未来**

Confirmed Commerce 可以进入：

```text
Paid Transaction → Fulfillment
```

### 4.11 Paid Transaction

**定义**

`Paid Transaction` 是已经确认收到付款的商业交易事实。

付款来源可以是：

- 平台确认的付款；
- 受控流程中可验证的外部付款。

Prototype 阶段不把普通口头承诺或未核实的外部交易计为 Paid Transaction。

**与指标的关系**

```text
Paid Transaction → Transaction Active Creator
```

**MVP**

产品对象模型保留该对象，但 VS-01 不实现平台收款、自动结算、退款或 Take Rate。

### 4.12 Fulfillment

**定义**

`Fulfillment` 是 Creator 实际交付 Offering，或 Customer 实际参加、接受或完成该商业事项的结果。

例如：

- 私教实际完成；
- 活动实际参加；
- 约拍实际交付。

**边界**

Confirmed 不等于 Fulfilled；Paid 也不等于 Fulfilled。

```text
Confirmed Commerce
→ Paid Transaction
→ Fulfillment
```

某些场景可以先履约后付款，但仍必须分别记录确认、付款与履约事实。

**MVP**

只保留手动或事件级记录能力，不做自动核销、复杂争议处理或履约担保。

### 4.13 Relationship

**定义**

`Relationship` 是 Creator 与 Customer 围绕商业互动逐渐形成的持续关系。

它可以由以下事实产生：

- Customer 曾发起 Action；
- Creator 曾确认或拒绝；
- 双方完成过付款或履约；
- Customer 产生重复商业行为；
- 双方形成明确的后续联系或权益。

**边界**

Relationship 不是：

- Creator 的社交粉丝数；
- 自动导入的通讯录；
- 首版 CRM；
- 一次 Action 的替代物。

**MVP**

只保留与 Request、Confirm / Decline 和后续事件相关的最小关系上下文。

**未来**

扩展为重复购买、Membership、Entitlement、CRM 和 Customer-owned history。

## 5. Object Relationship Rules

### Rule 1 — Identity owns supply

所有 Offering 必须归属于一个 Creator，并通过该 Creator 的 Commerce Identity 对外呈现。

### Rule 2 — Capability is not automatically commercial

Capability 只有被表达为 Published Offering 后，才具备商业行动入口。

### Rule 3 — Offering is the commercial unit

产品、动作、库存和后续交易都围绕 Offering 组织；不能把“某个页面”或“某个垂直”当作商品本体。

### Rule 4 — Inventory and Availability are constraints

Inventory 与 Availability 限制 Offering 何时、何地、以何种容量或条件可被行动化；它们不取代 Offering。

### Rule 5 — Action precedes outcome

Customer 必须先对 Published Offering 发起 Commerce Action，系统才能产生 Confirmed Commerce；Paid 与 Fulfillment 继续独立记录。

### Rule 6 — Distribution is attributable

生成分享资产不等于产生分发。产品需要区分资产生成、实际分享、Customer 访问与 Commerce Action。

### Rule 7 — Relationship follows commerce

Relationship 由商业互动逐渐形成，不由社交关注或单次页面访问自动推断。

### Rule 8 — Object model stays stable

Event、Experience、Service、Inquiry 是 Offering 的 Commerce Primitive，不应为每个垂直创建一套互不兼容的产品对象。

## 6. Object, State and Event Boundaries

| 类型   | 示例                                                              | 作用                             |
| ------ | ----------------------------------------------------------------- | -------------------------------- |
| Object | Creator、Offering、Customer、Commerce Action                      | 表达持续存在并可被引用的产品实体 |
| State  | Published、Confirmed、Paid、Cancelled                             | 表达对象当前生命周期位置         |
| Event  | `creator_published`、`commerce_confirmed`、`fulfillment_observed` | 记录某一时刻发生的业务事实       |

以下表达必须保持一致：

```text
Commerce Action
→ Confirmed Commerce
→ Paid Transaction
→ Fulfillment
```

不得将以下概念混用：

- Request 与 Paid Transaction；
- Published 与 Distributed；
- Confirmed 与 Fulfilled；
- Commerce Identity 与完整 Creator OS；
- Customer 与普通平台 User；
- Inventory 与单纯 Calendar。

## 7. VS-01 Object Subset

VS-01 只实现以下对象及必要状态：

```text
Creator
→ Commerce Identity
→ Capability
→ Service Offering
→ Requestable Availability
→ Published Storefront
→ Distribution Asset
→ Customer Request
→ Confirmed Commerce / Declined
→ Event Record
```

### 7.1 Implemented Product Meaning

- Creator 能建立一个可公开访问的商业身份；
- Creator 能创建一个真实的 Service Offering；
- Creator 能表达最小 Availability；
- Creator 能发布并获得分享入口；
- Customer 能查看 Offering 并提交 Request；
- Creator 能 Confirm 或 Decline；
- 系统能记录关键商业事件。

### 7.2 Deferred Object Capability

以下对象保留在产品本体中，但不在 VS-01 做完整能力：

- Paid Transaction；
- Platform Payment；
- Settlement；
- Refund；
- Fulfillment Workflow；
- Relationship / CRM；
- Event / Experience 专用流程；
- Marketplace Discovery；
- Creator Referral；
- Analytics Dashboard。

保留对象模型不等于提前实现功能。

## 8. Product Invariants

以下规则是对象模型的稳定不变量：

1. 没有 Creator，就没有可归属的 Commerce Identity；
2. 没有 Commerce Identity，就没有 Creator 对外聚合入口；
3. 没有 Published Offering，就没有可提交的 Commerce Action；
4. Commerce Action 不能自动变成 Confirmed Commerce；
5. Confirmed Commerce 不能自动变成 Paid Transaction；
6. Paid Transaction 不能自动证明 Fulfillment；
7. 生成 Distribution Asset 不等于发生外部分发；
8. Customer 关系必须能追溯到至少一次商业互动；
9. Offering 的 Primitive 可以变化，但对象归属关系保持稳定；
10. MVP 的 Shadow Commerce 不得被计入平台 GMV 或 Take Rate 收入。

## 9. Decision Record

### D-17-01 — Commerce Identity is the primary entry object

- **Decision**：Commerce Identity 是统一商业入口与聚合表面，不是整个产品本体。
- **Reason**：它承接 Creator 对外表达，但真正产生商业价值的是其下的 Offering、Action 与结果链。
- **Consequence**：产品不能退化为 Link-in-Bio，也不能把所有能力都塞进 Identity 页面。
- **Revisit Trigger**：如果真实使用中 Creator 只需要单一 Offering 页面，且聚合入口持续增加理解成本，则重新评估入口层级。

### D-17-02 — Offering is the primary commercial object

- **Decision**：Offering 是商业供给、Action、Inventory 和未来 Transaction 的共同锚点。
- **Reason**：它能跨 Event、Experience、Service、Inquiry 复用，同时保留 Creator 自定义商品的原则。
- **Consequence**：新增功能必须说明它服务于哪个 Offering 或其商业生命周期。
- **Revisit Trigger**：如果某类 Primitive 无法用 Offering 统一表达，先记录例外，再评估是否需要扩展本体。

### D-17-03 — Action, Transaction and Fulfillment remain separate

- **Decision**：Request、Confirmed Commerce、Paid Transaction、Fulfillment 不合并。
- **Reason**：意向、确认、付款和交付是不同商业事实，责任和指标也不同。
- **Consequence**：Prototype 可以只做到 Confirmed Commerce，但不能将确认伪装成付费交易。
- **Revisit Trigger**：只有在支付、责任、退款和履约政策明确后，才开放 Real-money Commerce。

### D-17-04 — Distribution is a first-class product layer

- **Decision**：Distribution Asset 与分发行为属于产品模型的一部分。
- **Reason**：Creator-first 模式依赖 Creator 将供给带到已有渠道。
- **Consequence**：产品规格必须区分生成、分享、访问和归因，不把传播当作页面外的运营备注。
- **Revisit Trigger**：如果主要交易持续来自平台内发现而非 Creator 外部分发，再评估 Distribution 的相对优先级。

## 10. Revisit Triggers

除各 Decision 明确触发条件外，出现以下情况时重新审查对象模型：

- VS-01 无法用现有对象表达完整的 Creator → Customer 路径；
- 一个对象同时承担身份、供给、动作和交易结果，导致状态无法区分；
- 新增 Primitive 需要创建垂直专属对象才能工作；
- Product、Business 和 Analytics 对同一商业事实使用不同定义；
- Customer 关系无法从商业互动可靠建立；
- 为实现终局能力而必须提前引入 Marketplace、CRM、支付或金融对象。

## 11. Next Documents

本文件之后的产品化顺序：

1. `18 MVP Product Flow`：定义 VS-01 的端到端行为流；
2. `19 MVP Product Specification`：定义页面、状态、动作与结果；
3. 构建 VS-01 Controlled Prototype；
4. 在实现后记录 Product Usability / Behavioral Feedback。
