# 05 — Personal Commerce Infrastructure Product Direction

> **状态**：Frozen Product Direction v0.3 — Formally Aligned
> **文档角色**：Personal Commerce Infrastructure 的产品方向层 SSOT
> **上游文档**：[`01 — Project Thesis`](./01_Project_Thesis.md)、[`02 — Vision & Endgame`](./02_Vision_and_Endgame.md)、[`03 — Core Abstraction`](./03_Core_Abstraction.md)、[`04 — North Star & End State`](./04_North_Star_End_State.md)
> **下游文档**：[`20 — MVP PRD: VS-01`](../07_Product_Architecture/20_MVP_PRD_VS01.md)、[`22 — Project Handoff / Suspend Baseline`](../08_Execution/22_Project_Handoff.md)、[`06 — Commerce Reference 跨平台传播研究`](./06_Commerce_Reference_Research.md)、[`07 — Commerce Reference 产品规范`](./07_Commerce_Reference_Product_Spec.md)
> **最后更新**：2026-08-26

本文档定义 Personal Commerce Infrastructure（PCI）的产品定义、方向模型、领域词汇、产品楔子、长期演进和非目标。它不替代阶段性产品合同，不自动授权实现，也不改变当前项目暂停状态。

## 1. Authority & Scope

权威关系如下：

```text
Product Direction SSOT
        ↓
阶段性 Product Contract（VS-01 / 后续经批准的 VS）
        ↓
Product Architecture
        ↓
Domain Model / Execution Plan
        ↓
Implementation / Tests / Evidence
```

- 当前 VS-01 的实现合同仍是 [`20_MVP_PRD_VS01.md`](../07_Product_Architecture/20_MVP_PRD_VS01.md)。
- 当前执行状态、`DEV-###` 记录和验收证据仍以 [`21_Prototype_Execution.md`](../08_Execution/21_Prototype_Execution.md) 为准。
- 当前暂停状态与恢复入口仍以 [`22_Project_Handoff.md`](../08_Execution/22_Project_Handoff.md) 为准。
- 本文档不修改当前产品对象、状态转换、Canonical Event、权限、API contract 或验收标准。
- 任何产品行为变化必须登记独立的 `DEV-###` 变更单元，并获得相应产品与工程批准。
- 当前保持：

```text
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
PRODUCT_STAGE = STAGE_0
STAGE_2 = AUTHORIZED (IDENTITY-001, IDENTITY-002, and IDENTITY-003 scopes only)
STAGE_3 = NOT AUTHORIZED
STAGE_2_IMPLEMENTATION = AUTHORIZED (approved scoped change units only)
```

本文档是产品方向完成物，不是 Identity Foundation、Commerce ID、OAuth、External Platform Binding 或 Reputation 的实现授权。

## 2. Product Definition

PCI 是面向个人经济参与者的商业基础设施。它把原本分散在社交平台、聊天工具、私信、日历和临时交易记录中的商业意图，组织成由个人控制的、可迁移的商业系统。

PCI 的本质不是替个人建立一个新的流量平台，而是让个人拥有：

- 可持续维护的内部 Identity；
- 面向客户的 Commerce Profile；
- 结构化的 Capability 与 Offer；
- 可管理的 Availability、Time 和 Capacity Inventory；
- 可追踪的 Commerce Commitment 与 Fulfillment；
- 基于真实商业事件的 Reputation。

PCI 解决的结构性问题是：平台掌握分发、账号、交易关系和用户数据时，个人无法稳定管理跨平台的商业身份、供给、客户关系和履约证据。

### PCI 不是什么

- **不是 Marketplace**：不以平台撮合买方和卖方、开放竞价或平台统一供给池为核心。
- **不是 CRM**：客户关系来自 Commerce Commitment 和实际履约，不是通用销售线索或 Deal Pipeline。
- **不是 Payment Platform**：支付、结算、退款和真实资金移动不是当前 Product Core。
- **不是 Creator Social Platform**：不以 Feed、关注、互动或内容分发为主要价值。
- **不是 Creator Store**：不是单纯的商品展示页或链接集合。
- **不是工具箱**：核心价值是统一的商业对象、库存、承诺、履约和信用语义。

## 3. Product Positioning

PCI 的长期定位是：

```text
Personal Economic Infrastructure
Personal Business OS
```

外部平台（TikTok / Douyin、Instagram、YouTube、X、微信、Etsy、WhatsApp 等）是分发、发现和交互渠道，不是 PCI 的：

- System of Record；
- Identity Authority；
- Commerce Profile Authority；
- Reputation Authority。

Creator 是第一批用户，但长期范围是 `Individual Economic Actors`。PCI 不要求个人放弃外部平台，而是补足外部平台无法稳定提供的商业基础设施。

## 4. First User & Product Wedge

当前冻结：

```text
FIRST_USER = DANCER
PRIMARY_SEGMENT = TIER-1 CREATOR
LONG_TERM_SCOPE = INDIVIDUAL ECONOMIC ACTORS
```

选择 Dancer / Tier-1 Creator 的原因：

- 已经拥有外部平台分发和真实商业意图；
- 商业供给高度依赖个人能力、时间和稀缺可用窗口；
- 当前通常通过私信、表格、聊天和手工日历完成承接；
- 需要在不建立 Marketplace 的前提下，拥有自己的商业入口和履约记录。

第一核心商业行为是：

```text
External Distribution
→ Commercial Intent
→ Offer
→ Availability
→ Request
→ Commerce Commitment
→ Fulfillment
→ Reputation
```

产品楔子正式冻结为：

```text
Identity-first
Availability as core inventory
Commerce workflow as execution layer
```

VS-01 的第一验证切片是：

```text
Creator Identity
→ Service Offering
→ Publish / Share
→ Request
→ Confirm / Decline
```

VS-01 是验证切片，不等于 PCI Product Direction 的完整实现，也不证明所有长期对象已经存在。

## 5. Structural Problem

当前个人商业行为存在四类结构性断裂：

1. **Identity 断裂**：不同平台账号无法表达一个可迁移的内部商业主体。
2. **Offer 断裂**：能力通过碎片化内容和私信表达，无法形成结构化供给。
3. **Inventory 断裂**：时间、容量和可用窗口没有成为可管理库存。
4. **Commerce 断裂**：Request、承诺、履约、结果和信用无法形成可追踪链路。

PCI 的方向是把这些断裂组织成个人可控制的商业基础设施，而不是把平台流量重新包装成 PCI 自有资产。

## 6. Commerce Identity Model

### 6.1 词汇边界

| 术语                             | Product Direction 语义                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Authentication User / Account    | 登录、认证和访问控制主体；不是完整商业身份                                                                                          |
| Identity                         | PCI 内部永久身份根；长期代表“这个主体是谁”                                                                                          |
| Commerce Profile                 | 面向客户展示和经营的商业身份                                                                                                        |
| Commerce ID / Commerce Reference | 分配给 Commerce Profile 的稳定、公开、平台中立引用；技术名称为 `Commerce Reference`，中文人类用语为 `C号`；不是页面、凭证或登录账号 |
| External Platform Account        | 第三方平台命名空间中的具体账号                                                                                                      |
| Commerce Object                  | Offer、Availability、Commitment、Fulfillment、Reputation 等商业对象                                                                 |
| Relationship                     | 由商业互动形成的广义持续关系                                                                                                        |
| Commerce Relationship            | Commerce Profile 与 External Platform Account 之间的专用绑定关系                                                                    |

严格关系：

```text
Authentication User / Account
        ↓
Identity
        ↓
N Commerce Profiles
        ↓
Commerce Objects
```

```text
Platform Account ≠ Identity
Platform Account ≠ Commerce Profile
Commerce ID ≠ Public Page
Commerce Relationship ≠ Identity
Commerce Relationship ≠ broad Relationship
```

### 6.2 Identity 与 Commerce Profile

正式模型：

```text
1 Identity : N Commerce Profiles
```

- Identity 是 PCI 内部长期身份根。
- Commerce Profile 是面向客户的商业主体。
- Commerce Profile 必须依附 Identity。
- 一个 Identity 可以创建多个 Profile，例如个人 Creator、舞团 / Studio、品牌或业务主体。
- Profile 不允许脱离 Identity 独立存在。

本阶段不实现 Identity runtime、Profile runtime、身份迁移或新的认证流程。

## 7. Commerce Profile Model

Commerce Profile 是客户看到、理解并与之发生商业互动的主体。它承载商业展示、Offer、Availability、Commerce Relationship 和历史 Commerce Objects 的归属表达。

正式生命周期：

```text
DRAFT
→ ACTIVE
→ SUSPENDED
→ ARCHIVED
```

规则：

- Profile 创建必须依附一个 Identity。
- Profile 进入 `ACTIVE` 前必须满足后续阶段定义的最小商业完整性要求。
- `SUSPENDED` 表示暂时不可开展新的商业活动，但历史对象必须保留。
- `ARCHIVED` 是逻辑终止，不等于删除历史记录。
- Profile 默认不支持 Identity-to-Identity transfer。
- Profile 不支持 merge。
- 本阶段不实现 transfer、merge 或 ownership migration。
- Profile 归档后，其历史 Commerce Objects 必须可追溯。

## 8. Commerce Relationship Model

正式模型：

```text
External Platform Account
  ↓
Commerce Relationship
  ↓
Commerce Profile
```

一个 Commerce Profile 可以拥有多个外部平台账号：

```text
1 Commerce Profile : N External Platform Accounts
1 Platform : N External Platform Accounts per Commerce Profile
```

Relationship 生命周期：

```text
PROPOSED
→ VERIFIED
→ ACTIVE
→ SUSPENDED
→ REVOKED
→ HISTORICAL
```

规则：

- Relationship 不产生 Identity。
- Relationship 不拥有 Profile。
- External Platform Account 只是外部锚点，不是 PCI 身份权威。
- 同一 External Platform Account 同一时刻原则上只允许一个 `ACTIVE` binding。
- 解绑后保留历史关系。
- 当前阶段不实现多个 Identity 共同管理一个 Relationship。
- Commerce Profile 对 Relationship 具有 PCI 内部控制关系。
- 平台账号的外部 ownership 不得被解释为 PCI Identity ownership。

## 9. Commerce Object Taxonomy

所有长期核心对象使用统一 object contract：

| Object                           | Identity           | Owner                       | Lifecycle                                                       | Relationship              | Source of Truth |
| -------------------------------- | ------------------ | --------------------------- | --------------------------------------------------------------- | ------------------------- | --------------- |
| Commerce Profile                 | Profile ID         | Identity                    | Draft → Active → Suspended → Archived                           | Identity                  | PCI             |
| Commerce Relationship            | Relationship ID    | Commerce Profile            | Proposed → Verified → Active → Suspended → Revoked → Historical | External Platform Account | PCI             |
| Offer                            | Offer ID           | Commerce Profile            | Draft → Published → Retired                                     | Profile                   | PCI             |
| Availability                     | Availability ID    | Commerce Profile            | Scheduled → Open → Reserved → Closed                            | Offer / Inventory         | PCI             |
| Commerce Commitment              | Commitment ID      | Commerce Profile + Customer | Requested → Confirmed → Fulfilled / Cancelled                   | Offer + Customer          | PCI             |
| Fulfillment / Deliverable        | Fulfillment ID     | Provider / Customer         | Pending → Fulfilled / Failed                                    | Commitment                | PCI             |
| Commerce Reputation              | Reputation ID      | Commerce Profile            | Pending → Published / Disputed                                  | Fulfilled Commitment      | PCI             |
| Commerce ID / Commerce Reference | Commerce Reference | Commerce Profile            | Assigned → Permanently Reserved                                 | Profile                   | PCI             |

这里的 `Identity` 列表示对象使用的稳定身份锚点，不代表所有对象都等同于 Identity。

### 9.1 Commerce Commitment 统一方向

Reservation、Booking、Order、Paid Order、Contract 不应在 Product Direction 层被当作互相割裂的商业本体。它们是不同 Offer Type 或阶段合同下的具体 Commitment 表达。

统一抽象方向：

```text
Commerce Commitment
```

具体状态、持久化形式、API 资源和代码类型留给后续 Product Architecture 决定。

## 10. Offer & Capability Model

Capability 表达个人能提供的能力、技能、知识、资源或影响力。Offer 是 Capability 被组织成可交易表达后的商业对象。

六类 Offer Type：

| Offer Type | 出售对象                   | 典型机制                      |
| ---------- | -------------------------- | ----------------------------- |
| Service    | 人的时间与能力             | Time Inventory + Booking      |
| Goods      | 实体或数字商品             | Quantity Inventory + Order    |
| Program    | 1→N 的课程或训练过程       | Enrollment + Cohort / Session |
| Membership | 持续 Access / Relationship | Subscription + Access         |
| Project    | 定制结果                   | Scope + Request + Milestone   |
| Right      | 使用权或授权权             | Terms + Grant + Usage         |

这些是六类 Offer Type，不是六套彼此割裂的产品 domain。

共同 Offer abstraction：

```text
Offer
├── What
├── Provider
├── Price
├── Availability Requirement
├── Capacity
└── Fulfillment Expectation
```

## 11. Time / Availability / Capacity Inventory

正式冻结：

```text
Time / Availability / Capacity = Commerce Inventory Primitive
```

必须区分：

```text
Calendar UI ≠ Availability ≠ Inventory
```

- Calendar UI 是表现形式。
- Availability 是某个 Offer 在特定条件下可被请求或承诺的窗口。
- Inventory 是可出售的时间、数量、席位或容量。

Service 的核心库存是 Time Inventory；Goods 使用 Quantity Inventory；Program 使用 Cohort / Seat Capacity。未来可以统一为跨 Offer 的 Inventory abstraction，但当前不得重构已有 Reservation implementation。

时间库存方向包括：

- `AVAILABLE`：可出售；
- `HOLD`：交易流程临时占用，带过期时间；
- `COMMITTED`：已经形成商业承诺，不可重复出售。

未来要求支持可变服务时长、Provider 自定义窗口、Hold + Expiration、Buffer、准备 / 交通 / 后处理时间和个人保留时间。

## 12. Commerce Commitment & Fulfillment

Commerce Commitment 是 Provider 与 Customer 对某个 Offer 形成的可追踪商业承诺。

| Offer Type | Commitment 前置形态             | Fulfillment                       |
| ---------- | ------------------------------- | --------------------------------- |
| Service    | Booking / Purchase              | Service Delivery                  |
| Goods      | Purchase / Order                | Shipment / Digital Delivery       |
| Program    | Enrollment                      | Session / Attendance / Completion |
| Membership | Subscription                    | Access / Renewal                  |
| Project    | Request → Scope → Agreement     | Milestone / Acceptance            |
| Right      | License Request → Terms → Grant | Usage / Expiry                    |

Product Direction 只冻结语义，不冻结具体 API、数据库表、队列、框架或实现状态机。

Provider-controlled allocation 可以考虑：

- Economic Value；
- Relationship Value；
- Strategic Value；
- Completion Confidence；
- Fulfillment Cost；
- Risk。

PCI 不以公开 Auction / 实时竞价盘口作为默认机制，也不替 Provider 取得最终定价和稀缺机会分配权。

## 13. Trust & Reputation

正式 Reputation 必须尽可能来自真实购买者和真实商业事件。

最低资格模型：

```text
Authenticated participant
+
Completed / Fulfilled Commerce Commitment
+
Payment-confirmed purchase
```

规则：

- 未购买者不能产生正常购买评价。
- Synthetic / Test commerce 不进入正式 Reputation。
- 未完成履约不能自动产生正常评价资格。
- Reputation 必须能够追溯到原 Commerce Commitment。
- Reputation 的主要归属对象是 Commerce Profile。
- External Platform Account 不是 PCI Reputation owner。
- Commerce Facts 与主观反馈分开保存和解释。
- Payment captured、Completed、Delivered、Fulfilled 等事实不因评价编辑而改变。

后续仍需独立产品决策的 Reputation extensions：

- editing window；
- dispute flow；
- deletion policy；
- provider reciprocal review；
- partial fulfillment；
- chargeback / refund interaction。

本任务不实现 Reputation backend。

## 14. Platform Neutrality

第三方平台的产品角色冻结为：

```text
External Platform = Distribution / Discovery / Interaction Channel
```

PCI 不把任何平台视为：

- Identity Authority；
- Commerce Profile Authority；
- Reputation Authority；
- PCI 的唯一客户或关系数据库。

必须支持：

```text
1 Identity
→ N Commerce Profiles
→ each Profile
→ N External Platform Accounts
```

一个平台可以拥有同一个人的多个外部账号。平台账号的数量、名称、内容和外部 ownership 不能改变 PCI 内部 Identity、Commerce Profile 和 Commerce Relationship 的语义。

## 15. Monetization Direction

PCI sells commerce infrastructure capability, not marketplace access.

长期可能收费的 capability 包括：

- Commerce Profile 管理；
- Offer 与 Availability 管理；
- Commerce workflow；
- 履约证据与历史记录；
- 跨平台关系管理；
- 商业信用和经营工具。

以下内容尚未冻结，保留为 Founder Decision Required：

- Free baseline；
- Paid capabilities；
- Pricing unit；
- Usage pricing；
- Profile pricing；
- Object pricing；
- Relationship pricing；
- Transaction pricing。

本方向不授权真实支付、结算、退款或资金移动实现。任何收费方案必须经过独立产品合同、商业决策和工程治理。

## 16. Explicit Non-goals

以下内容当前不属于 PCI Core Implementation：

- Payment；
- Settlement；
- Refund；
- Marketplace；
- CRM；
- Social Feed；
- Advertising；
- Creator Analytics Platform；
- Full ERP；
- Platform API Aggregation；
- OAuth；
- Public `/c/{commerce_id}`；
- Real-money enablement；
- Native `apps/app`。

未来可以重新评估，但必须有独立 Product / Architecture decision 和治理登记。

当前继续保持：

```text
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```

## 17. Product Evolution Stages

Product Direction 的阶段模型为：

```text
Stage 0
Product Direction & Domain Vocabulary

Stage 1
Prototype Validation

Stage 2
Commerce Identity & Profile Foundation

Stage 3
Commerce ID & Public Commerce Entry

Stage 4
External Platform Relationships

Stage 5
Expanded Commerce Infrastructure

Future
Platform / Network Extensions
```

阶段定义：

- **Stage 0**：冻结产品命题、第一用户、核心词汇、对象 taxonomy 和边界。
- **Stage 1**：用 VS-01 等受控切片验证 Identity、Offer、Availability、Request 和 Commitment workflow。
- **Stage 2**：在明确授权后完成 Commerce Identity 与 Commerce Profile 的产品架构和基础实现。
- **Stage 3**：在 Commerce ID 语义和公共入口边界获批后实现 Commerce ID 与 Public Commerce Entry。
- **Stage 4**：在关系生命周期、验证和多账号边界获批后实现 External Platform Relationships。
- **Stage 5**：扩展跨 Offer Inventory、Fulfillment、Reputation 和其他经批准的 Commerce Infrastructure。
- **Future**：仅在 PCI 核心基础设施成熟且有独立决策后评估平台、网络和生态扩展。

```text
RESUME-001 = Recovery / Governance workflow
```

`RESUME-001` 不是 Product Stage。

当前状态：

```text
PRODUCT_STAGE = STAGE_0
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
```

本阶段不修改旧 Handoff 的历史 Stage 命名；阶段治理重构留给后续独立任务。

## 18. Product Direction vs Product Architecture

方向层决定：

- 产品服务谁；
- 解决什么结构性问题；
- 核心对象的业务语义；
- 对象之间的关系；
- 生命周期方向；
- 产品边界；
- 阶段顺序；
- 未来能力的进入条件。

架构层决定：

- 数据库 schema；
- API endpoint；
- table structure；
- framework；
- queue；
- persistence；
- service boundary；
- code type；
- deployment topology。

产品方向不得把技术方案提前伪装成产品语义。产品对象、数据库表、API resource 和代码类型不默认一一对应。

## 19. Product Direction vs Current VS-01

当前 prototype / validation evidence 包括：

```text
Creator Identity
→ Service Offering
→ Availability / Reservation
→ Customer Request
→ Confirmation
→ Contract / Paid Commerce validation
```

这些验证说明：

- Creator 可以组织商业身份和能力；
- Service Offering 可以结构化表达；
- Availability / Reservation 可以承载时间型商业库存；
- Request 可以将外部商业意图转成受控动作；
- Confirmation 可以形成非支付的商业决策边界；
- 后续 Contract / Paid Commerce 切片可以验证更完整的 Commitment 和 Money boundary。

它们不证明以下未来对象已经完成：

```text
Commerce Profile
Commerce ID
External Platform Account
Commerce Relationship
Commerce Reputation
Unified Commerce Object model
Unified Inventory abstraction
```

Prototype != Product Direction completeness。

## 20. Future Expansion Criteria

未来能力只有同时满足以下条件，才可进入正式 Product / Architecture work：

1. 明确服务于个人可控制的 Commerce Infrastructure；
2. 不把外部平台重新设为 PCI 的 System of Record；
3. 不模糊 Identity、Commerce Profile、Commerce Relationship 和 Commerce Object；
4. 有清晰的生命周期、权限和 Source of Truth；
5. 能与现有 Commerce Commitment 和 Fulfillment 语义衔接；
6. 有独立 Product Contract、Architecture Decision 和 `DEV-###` 记录；
7. 不绕过项目暂停、Real Money kill switch 或阶段授权。

## 21. Founder Decisions Register

以下事项仍然需要 Founder 后续决定：

### Monetization

- Free / Paid baseline；
- pricing unit；
- usage / profile / object / relationship / transaction strategy；
- 收费能力的进入阶段和治理边界。

### Reputation Extensions

- editing window；
- dispute flow；
- deletion policy；
- provider reciprocal review；
- partial fulfillment；
- chargeback / refund interaction。

已冻结事项不再重复列为 open decision，包括：

- First User；
- Identity / Commerce Profile 语义；
- Commerce Profile 生命周期；
- Commerce Relationship 生命周期；
- Commerce ID 基本语义；
- Reputation 最低资格；
- Offer Type taxonomy；
- Inventory 方向；
- Product Evolution Stage model。

## 22. Frozen Product Direction Narrative

PCI 让 Dancer 和 Tier-1 Creator 不再把商业身份、服务能力、可用时间、客户请求、履约记录和商业信用完全寄托在外部平台上。

个人先拥有 PCI 内部的 Identity，并可以从该 Identity 建立多个 Commerce Profiles。每个 Profile 以 Offer 表达能力，以 Availability 和 Capacity 管理有限库存，以 Commerce Commitment 承接真实商业意图，以 Fulfillment 记录交付结果，并最终从真实完成的商业事件中形成可追溯的 Commerce Reputation。

外部平台仍然重要，但它们只是分发、发现和交互渠道。一个 Identity 可以拥有多个 Commerce Profiles，每个 Profile 可以关联多个平台和多个平台账号；这些账号通过 Commerce Relationship 连接到 PCI，但不取代 PCI 的 Identity、Commerce Profile 或 Reputation。

PCI 的核心不是拥有流量，而是拥有个人可控制、可迁移、可验证的商业基础设施。VS-01 是这一方向的第一验证切片，后续阶段必须在产品语义、架构边界和治理授权清晰后逐步推进。

当前停止于 Product Direction Completion：

```text
PRIMARY_WORKSTREAM = PRODUCT_DIRECTION_COMPLETION
PRODUCT_STAGE = STAGE_0
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
```

## 23. PCI-DIRECTION-001 — 语义对齐基线

> **状态**：`PRODUCT_DIRECTION_ALIGNMENT = PASS`
> **日期**：2026-08-26
> **目的**：将长期产品叙事与 Identity Architecture、Commerce Reference 冻结设计、VS-01 历史验证边界和未来阶段授权边界对齐。
> **非授权声明**：本节不授权 Stage 2、Stage 3、Commerce Reference runtime、QR runtime、resolver、OAuth、外部账号绑定、真实资金或任何新的产品实现。

### 23.1 正式层级与叙事规则

PCI 的身份层级必须始终保持：

```text
Authentication Account
        ≠
Internal Identity
        ≠
Commerce Profile
        ≠
Commerce Reference / C号
```

```text
1 Internal Identity : N Commerce Profiles
```

- **Authentication Account**：登录、认证与访问控制主体；不等于长期商业主体。
- **Internal Identity**：PCI 内部稳定、长期存在的主体根；不因昵称、品牌、平台 handle 或 Profile 变化而改变。
- **Commerce Profile**：面向客户表达和经营的商业身份；必须依附一个 Internal Identity，但不等于自然人，也不等于 Account。
- **Commerce Reference / C号**：属于 Commerce Profile 的公开、平台中立引用；不等于 Identity、Account、External Platform Account、Commerce Relationship 或 Commerce Object。

Product Direction 可以使用“个人商业身份”“商业主体”等面向用户的叙事语言；除非明确标注为
`Internal Identity` 或 `Commerce Profile`，这些产品表达不得重新定义或新增第三套内部 Identity 模型。

`VS-01 Creator Identity` 是已验证产品能力 / 历史模型，不自动成为 canonical Internal Identity。
它与未来 Internal Identity、Commerce Profile 的兼容、迁移和归属映射属于 Future Design，不在本节实现。

### 23.2 Relationship 术语规则

术语 `Relationship` 与 `Commerce Relationship` 不得互换：

| 术语                    | 正式含义                                                                                                                                                                                    | 禁止解释为                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `Relationship`          | 由商业互动形成的广义持续关系，例如 follower、lead、customer、client、member、collaborator 或 partner。                                                                                      | 外部平台账号的所有权 / 绑定记录。                   |
| `Commerce Relationship` | `External Platform Account → Commerce Relationship → Commerce Profile` 的专用绑定关系，负责 ownership、management、verification、role、binding / unbinding、effective time 与历史生命周期。 | 广义客户关系、CRM lead，或 Internal Identity 本身。 |

如未来发现专用绑定关系需要更适合的名称，必须通过独立 Architecture / Founder decision 提出候选和
rationale；本 Product Direction 不擅自重命名已存在的正式概念。

### 23.3 Commerce Reference / C号 与 QR 冻结语义

`Commerce ID` 在长期叙事中指向已冻结技术名称 `Commerce Reference`；中文用户用语为 `C号`。

```text
Commerce Profile
      ↓
Commerce Reference / C号
      ├── Canonical Text Form
      └── QR Representation
```

```text
Commerce Reference / C号
≠ Internal Identity
≠ Authentication Account
≠ External Platform Account
≠ Commerce Relationship
≠ Commerce Object ID
≠ URL
≠ Public Page
≠ credential
≠ authentication factor
≠ authorization proof

QR
≠ Commerce Reference
≠ Identity
≠ Commerce Profile
≠ credential
```

冻结的 Commerce Reference 事实：

```text
Canonical = 18 uppercase ASCII characters, no punctuation
Alphabet = 3479ACDEFHJKMNPQRTVWXY
Grouped display = 6-6-6 only; hyphens are not canonical
Generation direction = CSPRNG + UNIQUE constraint + collision retry
Public = YES
Stable = YES
Immutable = YES
Permanent = YES
Reusable = NEVER
Sequential = NO
Transferable = NO by default
Credential = NO
```

QR 是 C号的 machine-readable representation，而不是新的身份或对象。推荐的未来 QR payload 是
raw canonical C号；QR 不自动携带 URL、resolver、tracking、session、authentication 或 authorization
语义。QR 的存在不将 C号演变为 URL object。

已知 C号可以成为未来获授权 lookup 的输入；但其随机空间、非顺序分配和大容量只降低大规模猜测成本，
不是安全认证或 anti-enumeration 机制。rate limiting、unknown-ID response policy、bulk discovery
protection、enumeration detection、resolver access control 和公开数据最小化均为 Future Security Boundary，
尚未获实现授权。

### 23.4 长期方向、现有验证与未来授权的语义映射

| Product Direction Concept | Canonical Internal Meaning                                    | Existing Implementation / Validation                                                             | Future / Not Yet Authorized                                              |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Identity                  | PCI 内部稳定、长期存在的主体根。                              | VS-01 的 `Creator Identity` 是历史验证 / 兼容模型，不等同于 canonical Internal Identity。        | Internal Identity 的正式 Stage 2 产品合同、迁移与兼容设计。              |
| Commerce Profile          | 面向客户的商业身份，依附一个 Internal Identity。              | VS-01 通过 Creator-facing profile / workspace 验证商业表达，不重新定义该对象。                   | Stage 2 的正式产品授权、迁移、公开表面与 ownership policy。              |
| Commerce ID               | Commerce Profile 的公共、平台中立引用这一产品概念。           | 未作为已授权 VS-01 runtime 能力。                                                                | 以冻结的 Commerce Reference 设计实现生成、持久化与 lookup。              |
| External Platform Account | 第三方平台命名空间中的具体账号。                              | 外部平台仅作为分发 / 发现 / 交互渠道；VS-01 不将其设为 PCI authority。                           | OAuth、验证、数据同步与账号对象实现。                                    |
| Commerce Relationship     | 外部账号到 Commerce Profile 的专用绑定与历史关系。            | 未作为已授权 VS-01 runtime 能力。                                                                | Binding / unbinding、verification、role、有效时间与多账号策略。          |
| Relationship              | 广义个人商业关系，不是平台账号绑定。                          | Request、Reservation、Contract 与实际商业互动提供关系事实的历史验证入口。                        | 长期 relationship model；不授权 CRM。                                    |
| Offer                     | Capability 组织后的可交易商业表达。                           | VS-01 的 Service Offering 已验证。                                                               | Goods、Program、Membership、Project、Right 及统一 Offer 扩展须独立授权。 |
| Commerce Commitment       | Provider 与 Customer 对 Offer 形成的可追踪商业承诺。          | Request、Reservation、Contract 是已验证的具体 Commerce Pattern，不被本方向重构。                 | 统一抽象的 architecture / persistence / API 设计。                       |
| Fulfillment               | 对 Commitment 的履行、交付、参与、使用或完成。                | VS-01 已有 execution / completion 验证边界。                                                     | 统一 Fulfillment、交付事实和跨 Offer 模型。                              |
| Reputation                | `Transaction Facts + Customer Feedback`；事实与主观评价分离。 | 当前方向只保留语义和资格约束，不以用户反馈改变 Payment、Completed、Delivered 或 Fulfilled 事实。 | Reputation runtime、争议、编辑期与其他扩展。                             |
| Commerce Reference / C号  | Commerce Profile 的公开、不可变、平台中立引用。               | 设计已冻结；未生成、未持久化、未公开解析。                                                       | Generation、persistence、lookup、输入政策与公开展示表面。                |
| QR                        | C号的机器可读表示。                                           | 产品语义已冻结；未生成、未扫描、未接入。                                                         | QR rendering、generator、尺寸 / 静区 / 对比度验证和投放政策。            |

长期 Commerce Engine、Time & Capacity Engine 与 Value Allocation Engine 是产品方向层抽象。
它们不得否定、替换或要求立即重构已经验证的 `Request`、`Reservation`、`Contract`、`Order`、
`Completion`、`Earnings Projection` 和 `Wallet Projection` pattern。具体对象的统一化只可在未来
独立 Product Architecture 与授权变更单元中进行。

Reputation 的长期资格保持：

```text
Verified Buyer
    +
Verified Transaction
    +
Eligible Completion State
```

```text
Commerce Facts ≠ Subjective Feedback
```

用户反馈不能反向修改 Payment、Completed、Delivered、Fulfilled 或其他 commerce fact。

### 23.5 正式阶段边界

本方向已完成语义对齐；设计完成不等于实现授权。

```text
PRODUCT_DIRECTION = FORMALLY ALIGNED
IDENTITY_ARCHITECTURE = DESIGN BASELINE
COMMERCE_REFERENCE = FROZEN
QR_SEMANTICS = FROZEN

STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED

COMMERCE_ID_GENERATION = NOT IMPLEMENTED
COMMERCE_ID_GENERATION = NOT AUTHORIZED

PUBLIC_RESOLVER = NOT IMPLEMENTED
PUBLIC_RESOLVER = NOT AUTHORIZED

OAUTH = NOT AUTHORIZED
EXTERNAL_PLATFORM_BINDING = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
```

当前仓库工作树中可能存在尚未提交的实验性、兼容性或后续阶段相关文件；它们不构成 Founder
授权、Stage 状态变更或正式实现基线。正式实现状态、验收与执行证据仍以执行 SSOT 和经批准的
change unit 为准。

Founder 已批准 `STAGE2-DECISION-001` 至 `STAGE2-DECISION-009`，并已明确授权三个仅限纯领域的
Stage 2 change unit：`IDENTITY-001`（Internal Identity 与 Commerce Profile domain contract）、
`IDENTITY-002`（External Platform Account 与 Commerce Relationship domain contract）和
`IDENTITY-003`（Commerce Reference strict canonical value 与 Commerce Profile immutable
association domain contract）。`IDENTITY-003` 不授权 Commerce Reference generation 或 allocation。
这些授权不扩展至 persistence、migration、API、Commerce Reference runtime、OAuth、真实平台绑定或
验证、QR runtime、public resolver、Payment 或其他 Stage 2 工作。

本节不授权且不得据此实现：

```text
database migration
new domain implementation
new API / OpenAPI changes
Commerce Reference generator or persistence
QR generator or scanner
/c/{commerce_id}
Public Resolver
OAuth / external account binding
Payment / Settlement / Refund
Marketplace / CRM / apps/app
REAL_MONEY_ENABLED = true
```
