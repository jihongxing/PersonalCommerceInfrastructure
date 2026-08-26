# 05 — Personal Commerce Infrastructure Product Direction

> **状态**：Frozen Product Direction v0.1  
> **文档角色**：Personal Commerce Infrastructure 的产品方向层 SSOT  
> **上游文档**：[`01 — Project Thesis`](./01_Project_Thesis.md)、[`02 — Vision & Endgame`](./02_Vision_and_Endgame.md)、[`03 — Core Abstraction`](./03_Core_Abstraction.md)、[`04 — North Star & End State`](./04_North_Star_End_State.md)  
> **下游文档**：[`20 — MVP PRD: VS-01`](../07_Product_Architecture/20_MVP_PRD_VS01.md)、[`22 — Project Handoff / Suspend Baseline`](../08_Execution/22_Project_Handoff.md)  
> **实现边界**：本文档不替代 VS-01 实现合同，不修改当前产品对象、状态转换、Canonical Event、权限、验收标准或 Deferred Capability；任何产品行为变化必须通过 `DEV-###` 变更单元登记。  
> **日期**：2026-08-22

## 文档权威边界

本文档定义 Personal Commerce Infrastructure 的长期产品方向、产品命题、领域词汇和商业闭环。它是战略层与产品方向层的 SSOT，不是当前版本的实现授权，也不是下一阶段的自动开发清单。

权威关系如下：

```text
本产品方向 SSOT
        ↓
阶段性产品合同（VS-01 / 后续经批准的 VS）
        ↓
执行台账、代码、测试与验收证据
```

- 当前 VS-01 的实现合同仍是 [`20_MVP_PRD_VS01.md`](../07_Product_Architecture/20_MVP_PRD_VS01.md)。
- 当前执行状态、`DEV-###` 记录和验收证据仍以 [`21_Prototype_Execution.md`](../08_Execution/21_Prototype_Execution.md) 为准。
- 当前项目暂停状态与恢复入口仍以 [`22_Project_Handoff.md`](../08_Execution/22_Project_Handoff.md) 为准；本文档不自动恢复开发。
- `Goods`、`Program`、`Membership`、`Project`、`Right`、真实支付、结算、履约和 Reputation 等方向，只有在形成独立的阶段性产品合同并完成治理登记后，才能进入实现范围。

## 1. 产品命题

互联网长期形成“平台拥有流量、账号、交易关系与用户数据”的结构。普通个人虽然可以在多个平台赚钱，却缺少一个独立于平台、统一管理身份、能力、商业 Offer、客户关系、交易、履约与信用的商业基础设施。

本产品的命题是：**让个人成为互联网中的独立商业节点。**

外部平台（TikTok、Instagram、YouTube、微信、抖音、Etsy、WhatsApp 等）主要是分发、发现和交互渠道，而不是个人商业系统的 System of Record。

## 2. 产品定位

- **Personal Economic Infrastructure / Personal Business OS**
- 不是 Creator Store
- 不是 Marketplace
- 不是“大工具箱”
- 不是公开拍卖平台
- Creator 只是第一批用户之一，长期目标是 Individual Economic Actors

## 3. 产品目标

1. 让个人以统一 Identity 表达“我是谁”。
2. 让个人以 Capability 表达“我能提供什么”。
3. 用少数通用 Offer Types 覆盖不同职业和商业场景。
4. 把个人时间和其他有限产能变成可管理库存。
5. 让 Provider 控制定价、报价与稀缺机会分配。
6. 让真实交易形成履约证据和 Personal Commerce Reputation。
7. 让商业身份、关系和信用不依赖单一平台。

## 4. 核心领域模型

| 对象                 | 语义                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| Identity             | PCI 内部的永久身份根；不等同于客户可见的 Commerce Profile                              |
| Capability           | 能力、技能、知识、资源或影响力                                                         |
| Offer                | 商业化后的可交易对象                                                                   |
| Relationship         | 产品范围内由商业互动形成的广义持续关系；不等同于平台账号绑定用的 Commerce Relationship |
| Commerce Commitment  | 双方形成的商业承诺                                                                     |
| Fulfillment          | 承诺履行、交付、参与、使用或完成                                                       |
| Reputation           | 基于真实经济关系形成的商业信用                                                         |
| Inventory / Capacity | 可出售的数量、时间或容量                                                               |

**核心闭环：Identity → Capability → Offer → Commerce Commitment → Fulfillment → Reputation → More Commerce**

Identity 与 Commerce Profile 的关系遵循：

```text
1 Identity : N Commerce Profiles
```

其中，Identity 是 PCI 内部永久身份根，Commerce Profile 是面向客户表达的商业身份。
外部平台账号与 Commerce Profile 之间的所有权、管理、验证和角色关系，专称为
`Commerce Relationship`，不得与产品范围内由交易形成的广义 `Relationship` 混用。

## 5. 六类通用 Offer Type

| 类型       | 出售对象                   | 典型场景                           | 核心机制                    |
| ---------- | -------------------------- | ---------------------------------- | --------------------------- |
| Service    | 人的时间与能力             | 摄影、咨询、教练、陪伴、翻译       | Time Inventory + Booking    |
| Goods      | 实体或数字商品             | 手工品、服装、模板、Preset、电子书 | Quantity Inventory + Order  |
| Program    | 1→N 的课程/训练过程        | 课程、训练营、工作坊               | Enrollment + Cohort/Session |
| Membership | 持续 Access / Relationship | 会员社群、付费 Newsletter、VIP     | Subscription + Access       |
| Project    | 定制结果                   | 品牌项目、建站、商业视频、婚礼     | Scope + Request + Milestone |
| Right      | 使用权/授权权              | 图片、音乐、肖像/IP 授权           | Terms + Grant + Usage       |

抽象原则：Digital Product = Goods；Coaching/Consulting 通常 = Service；Sponsorship 通常 = Service/Project；Affiliate = Referral/Commission Mechanism，而不是新的 Offer Type。

## 6. Time is Inventory

涉及时间的 Offer 不以普通 Calendar 为核心，而以 **Time Inventory** 为核心。

时间库存状态：

- `AVAILABLE`：可出售
- `HOLD`：交易流程临时占用，带过期时间
- `COMMITTED`：已形成商业承诺，不可重复出售

要求：

- 支持可变服务时长
- 支持 Provider 自定义可出售时间窗口
- 支持 Hold + Expiration
- 支持 Buffer、准备、交通、后处理等容量
- 支持个人保留时间
- 时间交易最终必须产生明确 Commitment

底层可以统一 Inventory：

- Goods → Quantity Inventory
- Service → Time Inventory
- Program → Cohort / Seat Capacity

## 7. Provider-Controlled Pricing & Allocation

### 7.1 三种核心模式

| 模式                  | 说明                                                    |
| --------------------- | ------------------------------------------------------- |
| Fixed / Dynamic Price | 直接给出当前价格                                        |
| Private Offer / Bid   | 买家私密报价，Provider Accept / Reject / Counter        |
| Request / Counter     | 买家提交需求、时间范围、预算，Provider 决定报价或反报价 |

### 7.2 明确排除

**不采用公开 Auction / 实时竞价盘口作为默认机制。**

### 7.3 Provider 定价权

- Base Price
- Minimum Acceptable Price / Minimum Effective Value
- Premium / Prime Time
- 基于提前预订、需求、紧急程度等的动态价格
- 决定是否开放 Request / Offer / Counter
- 平台可以提供建议价格与市场信息，但不强制 Provider 定义价格

### 7.4 Effective Time Yield

价格不能只按表面服务时长计算，应考虑：

- Service Duration
- Preparation Time
- Travel Time
- Post-processing Time
- Communication Cost

**Effective Time Yield = 实际收入 ÷ Total Effort Time**

该指标用于个人经营与机会比较，不是平台强制定价公式。

### 7.5 Opportunity Value / Allocation

同一稀缺时间出现多个买家时，不应简单采用最高价获胜。Provider 的分配应能够综合：

- Economic Value
- Relationship Value
- Strategic Value
- Completion Confidence
- Fulfillment Cost
- Risk

目标是：**选择最值得把这个时间给出去的机会。**

## 8. Commerce Commitment

Order 是重要记录，但不是所有商业形态都天然是同一种 Order。统一抽象为 **Commerce Commitment**。

| Offer      | Commitment 前置形态             | 履约                              |
| ---------- | ------------------------------- | --------------------------------- |
| Service    | Booking / Purchase              | Service Delivery                  |
| Goods      | Purchase / Order                | Shipment / Digital Delivery       |
| Program    | Enrollment                      | Session / Attendance / Completion |
| Membership | Subscription                    | Access / Renewal                  |
| Project    | Request → Scope → Agreement     | Milestone / Acceptance            |
| Right      | License Request → Terms → Grant | Usage / Expiry                    |

## 9. Personal Commerce Reputation

### 9.1 评价资格

评价必须来自真实经济关系。冻结原则：

**Verified Buyer + Verified Transaction + Eligible Completion State**

仅付款但未达到可评价条件、退款、争议、欺诈支付、未履约等状态，需依据交易治理规则判定资格。

### 9.2 评价必须绑定交易

评价必须绑定具体 Commerce Commitment / Order，并可追溯：

- Buyer Identity
- Provider Identity
- Offer
- Transaction
- Timestamp

### 9.3 Reputation ≠ Star Rating

Reputation 由两类信息共同形成：

**Transaction Facts**：完成订单数、履约率、取消率、争议率、重复购买率、交易规模等。  
**Customer Feedback**：评分、结构化评价、可选文字。

### 9.4 双边信用

Buyer 可以评价 Provider，Provider 也可以形成 Buyer Reputation。双方评价应独立提交，避免互相胁迫。

### 9.5 事实与主观反馈分离

Payment captured、Completed、Delivered、Fulfilled 等属于 Commerce Facts，不应因评价修改而改变。

## 10. Platform Neutrality

- 外部账号 = External Account / Channel Identity
- Personal Commerce Identity = 核心主体
- 同一人可以拥有多个平台、多个账号，但可以归属于一个个人商业身份
- 外部平台变化不应抹掉个人商业主体、交易记录和 Reputation

在 PCI 的身份架构中，外部平台账号绑定边界使用以下术语：

```text
External Platform Account
        ↓
Commerce Relationship
        ↓
Commerce Profile
```

这里的 `Commerce Relationship` 专指平台账号与 Commerce Profile 的绑定关系；
产品范围内由 Customer、Provider 和商业事实形成的持续关系仍称为广义
`Relationship`。

## 11. Relationship

本产品要让个人拥有 Relationship，而不仅是平台拥有 Audience。

关系可以演化为：follower、lead、customer、client、member、collaborator、partner。

Relationship Value 可以进入 Opportunity Value / Allocation。

## 12. 三大核心 Engine

### Commerce Engine

Offer → Commitment → Payment → Fulfillment

### Time & Capacity Engine

Availability → Time Inventory → Hold → Commitment → Release

### Value Allocation Engine

Pricing → Offer → Counter → Priority → Opportunity Value → Allocation

Identity、Relationship、Reputation 横向贯穿三者。

## 13. 用户体验原则

1. 从个人 Identity 开始，而不是从行业模板开始。
2. 用 Capability 创建 Offer。
3. 根据 Offer Type 展示最少必要字段。
4. 服务类重点配置时间、价格和交付。
5. 买家路径保持：选择 Offer → 选择/提出时间 → 查看/提交价格 → Commitment。
6. 交易完成后自动沉淀履约事实和 Reputation。

## 14. 明确暂不纳入本次冻结

以下三个方向暂不进入本 PRD 核心冻结：

1. Asset / Resource Rental 是否独立成型。
2. Audience Monetization 是否需要独立 Primitive。
3. Multi-party Commerce / Collaboration 的完整角色与分账模型。

## 15. Frozen Narrative

> **让个人成为互联网中的独立商业节点。**

个人拥有商业身份，基于 Capability 创建 Offer；Offer 被抽象成六类通用经济对象；时间以 Time Inventory 管理；Provider 控制定价和稀缺机会分配；真实交易形成 Commerce Commitment 与 Fulfillment 证据；最终沉淀为跨平台、可迁移的 Personal Commerce Reputation。

**产品终局不是“帮个人开店”，而是建立个人经济基础设施。**
