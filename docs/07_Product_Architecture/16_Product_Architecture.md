# 16 — Product Architecture

> 状态：Decision v1  
> 决策日期：2026-08-11  
> 阶段：Productization Phase  
> 文档角色：定义产品本体、稳定产品层级与对象之间的关系；不是技术架构或 PRD  
> 核心问题：Creator Commerce 产品到底由哪些稳定部分组成，Commerce Identity 在其中是什么位置？

## 1. Purpose

01–15 已经回答：

- 为什么存在；
- 服务谁；
- 从哪里切入；
- 交易如何形成；
- 如何收费；
- 如何获得 Creator；
- 如何判断 PMF；
- 如何构建第一条受控 Vertical Slice。

本文件不再讨论需求是否存在，也不定义 API、数据库、框架、部署或页面像素。

它回答：

1. 产品由哪些稳定层组成；
2. 哪些对象是长期产品本体，哪些只是 MVP 表现；
3. `Commerce Identity` 是产品核心还是入口；
4. Offering、Inventory、Availability、Action、Transaction、Fulfillment 与 Relationship 如何连接；
5. Distribution 为什么是产品架构的一层；
6. VS-01 在完整架构中实现了哪一个子集；
7. 未来如何扩展而不把产品变成功能集合。

## 2. Product Architecture Thesis

产品不是：

- Link-in-Bio；
- Calendar；
- Booking System；
- Ticketing System；
- Creator Marketplace；
- Creator CRM；
- 多个工具的菜单。

产品本体是：

> Creator 将自己的商业身份、能力和可售供给组织为 Offerings，通过 Distribution 触达已有受众，使 Customer 发起 Commerce Action，并由此形成 Transaction、Fulfillment 与可持续商业 Relationship 的系统。

压缩为：

```text
Creator
→ Commerce Identity
→ Offering + Inventory
→ Distribution
→ Commerce Action
→ Transaction
→ Fulfillment
→ Relationship
```

### 2.1 Architecture Decision

> `Commerce Identity` 是产品的统一入口、归属与对外聚合表面；它不是产品唯一的核心对象。

完整产品的最小本体是：

```text
Creator
+ Identity
+ Offering
+ Inventory / Availability
+ Distribution
+ Commerce Action
+ Relationship
```

Transaction 与 Fulfillment 是这些对象在商业事实层上的结果。

因此：

```text
Commerce Identity
≠ Entire Product

Commerce Identity
= Creator Commerce 的入口与聚合面
```

## 3. Five-layer Product Architecture

```text
Layer 1  Identity
Layer 2  Commerce Supply
Layer 3  Relationship
Layer 4  Transaction & Fulfillment
Layer 5  Distribution
```

这些层不是严格的用户界面层，而是产品理解和对象归属层。

### 3.1 Layer 1 — Identity

回答：

> 谁在提供商业价值，为什么值得被信任？

核心对象：

- Creator；
- Commerce Identity；
- Capability；
- Proof；
- Location / Service Area；
- External Social Presence。

Identity 为 Offering、Transaction、Relationship 和 Distribution 提供统一归属。

### 3.2 Layer 2 — Commerce Supply

回答：

> Creator 当前可以提供什么，在什么条件下可以提供？

核心对象：

- Offering；
- Inventory；
- Availability；
- Price；
- Capacity；
- Location；
- Rules；
- Commerce Primitive。

这一层是产品的商业供给核心。

### 3.3 Layer 3 — Relationship

回答：

> 谁与 Creator 发生或可能发生商业关系？

核心对象：

- Customer；
- Buyer Contact；
- Audience Relationship；
- Consent；
- Interaction History；
- Entitlement（未来）。

首版不需要 CRM，但 Customer 不应被建模为匿名的“订单字段集合”。

### 3.4 Layer 4 — Transaction & Fulfillment

回答：

> 对某项供给发起的商业行动发生了什么，最终是否被履约？

核心对象：

- Commerce Action；
- Confirmed Commerce；
- Paid Transaction；
- Fulfillment；
- Cancellation；
- Refund（未来）；
- Settlement（未来）。

这一层是商业事实层。

### 3.5 Layer 5 — Distribution

回答：

> Creator 如何把商业供给带到已有受众面前？

核心对象：

- Distribution Asset；
- Share Link；
- QR Code；
- Commerce Card；
- Social / Group / Offline Channel；
- Attribution Source。

Distribution 不是 marketing afterthought。

在 Creator-first 模型中：

```text
Distribution
= Product capability
= GTM mechanism
= Commerce precondition
```

## 4. Architecture Map

```text
                         ┌─────────────────────┐
                         │       Creator       │
                         └──────────┬──────────┘
                                    │ owns
                                    ▼
                    ┌──────────────────────────────┐
                    │     Commerce Identity         │
                    │  identity / capability / proof│
                    └──────────┬───────────────────┘
                               │ presents
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│       Offerings          │         │   Distribution Assets    │
│ what Creator provides    │         │ link / QR / card/channel │
└──────────┬──────────────┘         └──────────┬──────────────┘
           │ constrained by                       │ reach
           ▼                                      ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│ Inventory / Availability │         │     Customer / Buyer    │
│ time / capacity / rules  │         │ commercial relationship │
└──────────┬──────────────┘         └──────────┬──────────────┘
           └────────────────┬──────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │  Commerce Action    │
                 │ request / reserve   │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │ Transaction State   │
                 │ confirm / paid      │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │    Fulfillment      │
                 │ service / attendance│
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │    Relationship     │
                 │ history / repeat    │
                 └─────────────────────┘
```

## 5. Core Object Relationships

### 5.1 Creator and Commerce Identity

一个 Creator 拥有一个主要 Commerce Identity。

Commerce Identity 聚合：

- Identity；
- Capability；
- Proof；
- Offerings；
- Upcoming；
- Distribution Assets；
- 商业入口。

未来一个 Creator 可能拥有多个 Brand、Team 或 Locale 身份，但不进入 MVP。

### 5.2 Capability and Offering

```text
Capability
→ describes what Creator can do

Offering
→ describes a commercial proposition based on one or more capabilities
```

示例：

```text
Capability: 舞蹈教学
Offering: K-pop 舞蹈私教（60 分钟）
```

Capability 可以存在而没有 Offering；Offering 必须关联至少一个 Capability。

### 5.3 Offering and Inventory

```text
Offering
→ what is being offered

Inventory
→ what is currently sellable for that offering
```

示例：

```text
Offering: K-pop 舞蹈私教
Inventory:
- 8 月 20 日 19:00–20:00
- 上海
- 1 个名额
- 需 Creator 确认
```

一个 Offering 可以拥有：

- 多个可用时段；
- 多个城市；
- 多个容量单元；
- 不同价格或规则；
- 没有时间库存的异步供给。

MVP 不要求实现所有组合，但对象关系必须保留。

### 5.4 Availability and Inventory

```text
Availability
→ Creator / Offering 在什么条件下可以被提供

Inventory
→ 在具体条件下可被出售的供给单位
```

Availability 可以是：

- 某个具体时间；
- 一个日期窗口；
- 周期性时段；
- 城市可用范围；
- 异步产能；
- Creator 手工确认的开放状态。

VS-01 只需支持：

> `Requestable Availability`：Buyer 可申请的日期或时间窗口，最终由 Creator 确认。

### 5.5 Offering and Commerce Primitive

Commerce Primitive 表达 Offering 的商业形态，而不是 Creator 的职业。

```text
Offering
→ Primitive
```

当前 Primitive：

- Upcoming；
- Event；
- Experience；
- Service；
- Inquiry。

未来可能增加：

- Merchandise；
- Membership；
- Content Commission；
- Performance Hire。

产品对象不应按“舞者商品”“摄影师商品”分叉，而应由 Primitive 和约束组合表达。

### 5.6 Customer and Relationship

Customer 是与 Creator 发生直接商业关系的人，不等于平台泛用户。

Relationship 由以下事实累积：

- 浏览或明确兴趣；
- Commerce Action；
- Confirmed Commerce；
- Paid Transaction；
- Fulfillment；
- Repeat Transaction；
- Consent；
- Referral（未来）。

MVP 仅需保留足够 Customer 信息以处理 Request 和结果；不构建完整 CRM。

### 5.7 Commerce Action and Transaction

```text
Commerce Action
→ Buyer 对 Offering 发起的动作

Confirmed Commerce
→ Creator 接受该动作

Paid Transaction
→ 确认收到付款
```

它们不是同义词。

```text
Commerce Action
→ Confirmed Commerce
→ Paid Transaction
→ Fulfillment
```

VS-01 的主要终点是 `Confirmed Commerce`；真实收款以后才使用 `Paid Transaction` 计算 GMV、Take Rate 和 TAC。

### 5.8 Transaction and Fulfillment

Transaction 表示商业条件被接受或付款已发生；Fulfillment 表示服务、活动或交付真的发生。

二者分离，因为：

- 已付款不等于已履约；
- 已确认申请不等于已付款；
- 取消、No-show 和改期可能发生；
- Creator Workflow 和 PMF 需要观察真实履约。

### 5.9 Distribution and Commerce

Distribution Asset 不是 Offering 的附属图片。

它是将 Commerce Identity 和具体 Offering 带到外部渠道的独立产品对象。

```text
Commerce Identity + Offering
→ Distribution Asset
→ External Channel
→ Attributed Visit / Action
```

一个 Offering 可以有多个 Distribution Asset；一个 Asset 可以聚合整个 Storefront 或只指向某个 Offering。

## 6. Product Architecture Rules

### Rule 1 — Identity is Stable; Offerings are Dynamic

Creator Identity 通常长期存在；Offerings、Inventory 和 Availability 高频变化。

产品不能把每次新服务或新活动当成新 Creator 页面。

### Rule 2 — Offering is the Commercial Unit

页面、链接、卡片和订单都应最终关联到一个 Offering。

不能只记录：

```text
someone clicked a profile
```

而应能理解：

```text
which customer acted on which offering,
through which asset and channel,
under which availability and rules.
```

### Rule 3 — Inventory is Not Always a Calendar Slot

Calendar 是 Availability 的一种表现。

Inventory 还可以是：

- 名额；
- 城市；
- 异步产能；
- 物理库存；
- Creator 可接受请求的开放状态。

这保证产品不会退化为排课工具。

### Rule 4 — Action Precedes Transaction

Commerce Action 是用户意图；Transaction 是商业事实。

产品必须保留两者之间的状态，而不能把：

- 点击；
- 提交；
- 确认；
- 付款；
- 履约

混为一个“订单”。

### Rule 5 — Distribution is First-class

Creator-first 模式中，没有 Distribution 就没有外部商业流量。

因此：

- 分享资产；
- 链接；
- 二维码；
- 渠道；
- 归因

属于产品架构，不是运营补丁。

### Rule 6 — Relationship Is Created by Commerce, Not Imported Followers

平台不需要复制社交平台粉丝列表。

真正的 Customer Relationship 从授权、请求、交易和履约中形成。

### Rule 7 — Primitive Is Configurable; Object Model Is Stable

Primitive 可以扩展；Creator、Offering、Inventory、Customer、Action、Transaction、Fulfillment 和 Distribution 的主关系应保持稳定。

### Rule 8 — MVP Uses a Strict Subset

MVP 不实现完整架构。

它应：

- 采用稳定对象名称；
- 只实现满足 VS-01 的最小关系；
- 不为了未来实现空功能；
- 不引入会阻断扩展的职业专用概念。

## 7. Commerce Identity: Core Object or Entry Point?

### 7.1 Why It Feels Like the Core

Commerce Identity 是：

- Creator 的统一对外地址；
- 跨社交平台的商业归属；
- 所有 Offerings 的聚合面；
- Buyer 识别与信任起点；
- Distribution 的主要落地页。

因此它是 MVP 中最容易被看见的核心。

### 7.2 Why It Is Not the Whole Core

没有 Offering、Inventory、Action 和 Relationship 的 Commerce Identity 只是静态 Profile。

一个能形成交易的产品至少需要：

```text
Identity
+ Supply
+ Action
+ Result
```

因此：

> Commerce Identity 是 Creator Commerce 的入口对象；Offering 是商业供给对象；Commerce Action 是需求对象；Transaction / Fulfillment 是商业事实对象；Relationship 是长期经营对象。

### 7.3 Architecture Decision

> 将 `Commerce Identity` 视为产品的 **Primary Entry Object** 和 **Aggregation Surface**；将 `Offering` 视为产品的 **Primary Commercial Object**。

这两个对象共同定义产品上限：

```text
Commerce Identity
answers: Who is this Creator?

Offering
answers: What can I buy or request now?
```

## 8. MVP Implementation Subset

### 8.1 VS-01 Object Subset

VS-01 只实现：

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

### 8.2 VS-01 Deliberately Defers

- 多 Offering；
- 多 Availability Slot；
- 实时 Calendar；
- Event Ticket；
- Experience Reservation；
- Platform Payment；
- Settlement；
- Refund；
- Customer CRM；
- Membership；
- Marketplace Discovery；
- Team / Organization；
- Creator Recommendation；
- AI-generated Offering；
- 完整 Analytics。

### 8.3 Upgrade Paths

| 下一步能力   | 复用对象                                 | 不需要改变的架构                   |
| ------------ | ---------------------------------------- | ---------------------------------- |
| 多个私教时段 | Offering、Availability、Inventory        | Identity、Action、Relationship     |
| Workshop     | Offering、Event Primitive、Capacity      | Distribution、Transaction          |
| 合影体验     | Offering、Experience Primitive、Capacity | Customer、Action、Fulfillment      |
| 商演询盘     | Offering、Inquiry Primitive              | Identity、Capability、Distribution |
| 平台收款     | Transaction、Payment State、Settlement   | Offering、Action、Relationship     |
| 会员         | Relationship、Entitlement                | Identity、Offering                 |
| Marketplace  | Distribution、Discovery Index            | Creator、Offering、Inventory       |

## 9. Architecture Boundaries

### Included Product Architecture

- 产品对象；
- 对象关系；
- 稳定产品层；
- 语义状态；
- MVP 子集；
- 演化路径；
- 产品规则。

### Excluded Technical Architecture

- API；
- 数据库表；
- 服务边界；
- 编程语言；
- 前端框架；
- 身份认证方案；
- 支付提供商；
- 部署；
- 监控；
- 具体埋点实现。

### Excluded Detailed Interaction Specification

- 表单字段；
- 页面布局；
- 文案；
- 错误提示；
- 交互状态；
- 可访问性细节；
- 设计系统。

这些应在后续 `17 Core Product Objects`、`18 MVP Product Flow` 和 `19 MVP Product Specification` 中继续收敛。

## 10. Architecture Evolution

### Phase A — Commerce Identity Prototype

```text
Identity
→ One Offering
→ One Action
→ Confirm / Decline
```

### Phase B — Creator Commerce

```text
Identity
→ Multiple Offerings
→ Inventory / Availability
→ Actions
→ Transactions
→ Basic Relationships
```

### Phase C — Creator OS

```text
Creator Commerce
→ Customer History
→ Analytics
→ Automation
→ Membership
→ Team Operations
```

### Phase D — Personal Commerce Infrastructure

```text
Creator OS
→ Marketplace
→ Business Matching
→ Payments
→ Financial Services
→ Infrastructure APIs
```

每个 Phase 只能在前一层对象和事实已经稳定后进入。

## 11. Decision Records

### D-16-01 — Product Center

**Decision**：产品中心是 Creator Commerce，不是 Link-in-Bio、Calendar、Ticketing 或 Booking。  
**Reason**：产品需要统一表达 Identity、Supply、Action、Transaction 和 Relationship。  
**Revisit Trigger**：真实使用证明用户只需要一个稳定单点工具，且多对象架构没有创造增量价值。

### D-16-02 — Commerce Identity Role

**Decision**：Commerce Identity 是 Primary Entry Object 和 Aggregation Surface，不是唯一商业核心。  
**Reason**：静态身份没有 Offerings 与 Actions 时无法产生 Commerce。  
**Revisit Trigger**：未来产品被证明更适合由独立 Offering Marketplace 而非 Creator 身份进入。

### D-16-03 — Offering Role

**Decision**：Offering 是 Primary Commercial Object。  
**Reason**：价格、规则、库存、Action 和 Transaction 最终都需关联具体可提供供给。  
**Revisit Trigger**：大多数交易不对应任何 Creator 可识别供给。

### D-16-04 — Distribution Role

**Decision**：Distribution 是产品一等层，不只是 GTM 运营活动。  
**Reason**：Creator-first 模式中，外部传播是 Commerce 发生的前提。  
**Revisit Trigger**：平台 Discovery 成为首要需求来源。

### D-16-05 — Relationship Role

**Decision**：Relationship 在 MVP 作为最小事实对象存在，CRM 作为后续能力延后。  
**Reason**：Customer 关系来自 Commerce，但 MVP 不需要复杂客户经营系统。  
**Revisit Trigger**：Creator 无法完成核心工作流而不需要客户历史、分组或主动沟通。

### D-16-06 — MVP Subset

**Decision**：VS-01 只实现产品架构的严格子集。  
**Reason**：先实现稳定对象的最小闭环，避免架构幻觉与范围膨胀。  
**Revisit Trigger**：真实 Pilot 证明该子集无法表达首批 Creator 的有效 Offer。

## 12. Assumptions and Product Validation

本文件不重新验证需求存在。

后续真实使用只校正产品实现和表达：

- Creator 是否理解 `Offering`；
- Creator 是否理解 `Availability`；
- Buyer 是否理解 `Request`；
- Commerce Identity 是否足够表达供给；
- VS-01 的对象与流程是否过度或不足；
- Creator 是否将新供给持续放入该模型。

这些属于：

> Product Usability Validation / Product Behavior Feedback

不是：

> Demand Validation。

## 13. Open Questions for Next Documents

`17 Core Product Objects` 需要定义：

- 每个对象的产品语义；
- 对象最小属性；
- 归属关系；
- 生命周期；
- MVP / Future 边界。

`18 MVP Product Flow` 需要定义：

- Creator、Buyer、System 和 Ops 的具体流程；
- 正常、拒绝、取消、暂停路径；
- 状态转换；
- 事件触发。

`19 MVP Product Specification` 需要定义：

- 页面；
- 页面目标；
- 页面可见对象；
- 用户动作；
- 系统反馈；
- 权限与状态；
- 验收行为。

## 14. Frozen Product Architecture

> 产品本体是 Creator Commerce：Creator 用 Commerce Identity 聚合身份与供给，以 Offering 组织可商业化价值，用 Inventory / Availability 表达当前可售条件，通过 Distribution 把供给带给已有受众，Customer 发起 Commerce Action，系统记录 Transaction、Fulfillment 和 Relationship。

> `Commerce Identity` 是产品的统一入口和聚合面；`Offering` 是主要商业对象；`Distribution` 是 Creator-first 模型的一等能力；`Relationship` 是从一次交易走向 Creator OS 的长期基础。

> VS-01 只实现该架构中最小的 Service Request 子集。接下来的产品化工作应继续定义对象、流程和规格，而不是重新讨论需求或扩张新的战略终局。
