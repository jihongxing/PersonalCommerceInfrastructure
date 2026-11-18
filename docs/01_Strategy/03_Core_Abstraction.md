# 03 — Core Abstraction

> 状态：Frozen v1  
> 核心问题：平台到底在管理什么？

## 1. 核心答案

平台管理的不是单一活动、行程或票务，而是：

> Creator 的商业资产，以及由这些资产形成的可交易库存。

Creator 的商业资产首先可以抽象为：

```text
Creator
= Identity
+ Capability
+ Time
+ Influence
+ Audience
```

当这些资产被放入具体地点、时间、规则和供给条件中，就形成 Creator Inventory；当库存被包装、定价并定义履约方式后，就形成 Product；当购买者接受该商品条件，就形成 Transaction。

## 2. 核心领域对象

### 2.1 Identity

描述“这个人是谁”。

可能包括：

- 名称与头像；
- 简介；
- Creator 类型；
- 所在城市；
- 社交平台身份；
- 作品与证明；
- 商业联系方式；
- 可信度与认证。

Identity 是所有商品和交易的统一归属。

### 2.2 Capability

描述“这个人能够提供什么价值”。

例如：

- 舞蹈；
- 演唱；
- 摄影；
- 化妆；
- 教学；
- 咨询；
- 内容制作；
- 活动主持；
- 商业出席。

Capability 不等于 Product。能力只有在被定义价格、时间、地点、容量和履约方式后，才成为可购买商品。

### 2.3 Time

描述 Creator 可投入商业活动的时间资源。

时间可能表现为：

- 确定活动时间；
- 可预约时间段；
- 全天档期；
- 周期性可用时间；
- 交付截止时间；
- 异步工作容量。

时间通常是 Creator 最稀缺的资源，也是库存管理的重要底层。

### 2.4 Influence

描述 Creator 对注意力、信任和购买决策的影响能力。

可能表现为：

- 平台受众规模；
- 特定垂直领域影响；
- 内容表现；
- 社群关系；
- 品牌适配度；
- 历史转化能力。

粉丝数只是 Influence 的一个信号，不能作为唯一度量。

### 2.5 Audience

描述与 Creator 建立或可能建立商业关系的人。

包括：

- 粉丝；
- 服务客户；
- 活动参与者；
- 品牌与商业客户；
- 会员；
- 历史购买者。

Audience 不是从社交平台复制来的关注者列表，而是通过授权、购买、预约或主动订阅形成的直接关系。

### 2.6 Location

描述供给或履约发生的位置。

包括：

- 线下具体地点；
- 城市或服务范围；
- 上门区域；
- Creator 工作室；
- 客户指定地点；
- 线上交付。

Location 与 Time 共同决定大量线下商品是否可售。

### 2.7 Inventory

Inventory 是被约束后的可售供给。

可以表示为：

```text
Inventory
= Resource
+ Availability
+ Location
+ Capacity
+ Constraints
```

典型示例：

- 8 月 20 日上海活动的 100 个入场名额；
- 8 月 21 日 14:00–15:00 的一小时私教；
- 9 月整月可接受的 3 个品牌内容合作；
- 一场漫展中的 20 个合影名额；
- 现货 50 份签名摄影集。

### 2.8 Product

Product 是面向购买者表达的交易提议。

一个通用商品至少需要回答：

- 谁提供；
- 卖什么；
- 谁可以购买；
- 价格是什么；
- 何时、何地履约；
- 有多少供给；
- 如何下单；
- 如何确认；
- 如何取消或退款；
- 最终如何交付。

候选通用结构：

```text
Product
├── Creator
├── Type
├── Title
├── Description
├── Capability
├── Price
├── Capacity
├── Duration
├── Location
├── Availability
├── Booking Rule
├── Fulfillment
└── Cancellation Policy
```

该结构是后续 Product Schema 设计的起点，不是已经确认的数据库模型。

### 2.9 Transaction

Transaction 表示购买者接受某个商品在某个库存条件下的交易。

交易可能是：

- Ticket；
- Reservation；
- Booking；
- Hire；
- Commission；
- Order；
- Subscription。

所有交易都应能关联 Creator、Product、Inventory、Buyer、Price、Status 和 Fulfillment。

### 2.10 Relationship

一次交易结束后，平台需要保留 Creator 与购买者之间的可经营关系，包括：

- 购买历史；
- 参与或履约记录；
- 复购资格；
- 会员状态；
- 偏好与授权；
- 后续沟通入口。

Relationship 是产品从交易工具走向 Creator OS 的关键。

## 3. 从资产到收入

```text
Identity
    ↓
Capability + Time + Influence
    ↓
Inventory
    ↓
Product
    ↓
Transaction
    ↓
Fulfillment
    ↓
Relationship
    ↓
Analytics
    ↓
Creator Income
```

该链路是当前最重要的领域主干。

## 4. 商品是资产组合的结果

不同商品可以由相同商业资产组合产生：

| 资产组合                      | 可能商品                 |
| ----------------------------- | ------------------------ |
| Time + Capability             | 私教、摄影、化妆、咨询   |
| Time + Influence              | 粉丝见面、商务出席       |
| Capability + Influence        | 品牌内容、联合创作       |
| Time + Capability + Influence | 商业演出、VIP 体验       |
| Influence                     | 会员、品牌推荐、数字内容 |
| Identity + Physical Inventory | 周边、签名商品           |

因此底层系统不应为每个垂直领域建立完全独立的数据模型。

## 5. Calendar 的正确位置

Calendar 不是项目本身，而是 Inventory 的一种关键视图和操作方式。

它连接：

```text
Time
→ Availability
→ Inventory
→ Product
→ Booking
→ Transaction
```

并非所有商品都严格依赖 Calendar，例如现货周边或异步数字内容；因此 Calendar 应是重要基础能力，而不是统治所有商品的唯一抽象。

## 6. Creator Page 的正确位置

Creator Page 不只是 Profile，而是：

> Creator Storefront

它应聚合：

- 商业身份；
- 即将发生的活动；
- 可预约服务；
- 商务合作能力；
- 作品与可信度；
- 商品和会员；
- 明确的购买或联系入口。

它在产品层是统一入口，在领域层则是 Identity、Inventory 和 Product 的组合展示。

## 7. 核心设计原则

1. **一个 Creator，一个统一商业身份**。
2. **一种能力，可以形成多个商品**。
3. **一个商品，可以消耗一种或多种库存**。
4. **不同垂直共享 Commerce Primitive**。
5. **交易必须回到 Creator 与客户关系**。
6. **Calendar 服务于库存，而不是定义整个产品**。
7. **Schema 优先表达真实商业约束，而不是追求抽象完美**。

## 8. 待验证问题

1. 七类 Commerce Product 是否足以覆盖首批目标 Creator 的 80% 场景？
2. Event 与 Performance、Experience 与 Service 的边界是否对 Creator 易于理解？
3. 是否需要把 Influence 建模为资产，还是只作为展示与搜索信号？
4. Inventory 是否应统一管理时间、容量、实物和异步产能？
5. Creator 是否愿意维护结构化 Availability？
6. 第一版交易需要平台内支付，还是允许第三方履约与跳转？
7. 不同商品的退款、取消和确认流程能否共享状态模型？

这些问题应通过实例建模、访谈和 MVP 使用数据解决，不能仅靠概念推演决定。

## 9. FD-C4A-R1-01 Amendment — 全球供给概念边界

> Founder 决策日期：2026-11-17；F01–F04 `FROZEN / ACCEPTED — CONCEPTUAL DECISIONS ONLY`。
> 权威记录：[FD-C4A-R1-01](../07_Product_Architecture/36_Global_Commercial_Supply_Foundation_Decisions.md)。
> 本节仅追加修订当前解释，原§1–8、历史候选结构和研究问题保留。

1. **F01**：§2.8的Product保留面向客户的广义价值产品化语言，不等于Goods，不据此新增与Offering重复对象。
   Commercial Offering/Offering是同一持续供给概念；具体Proposal/Terms Version与其分开，Commitment按领域有效接受形成。
   §1/§3的历史价值链不冻结统一Request→Confirm→Fulfilled流程；历史Offer不追溯解释为法律要约。
2. **F02/F03**：§2.2和§2.8/§3候选结构中的Capability不构成全球必需关联。
   全球Capability采用“主体创造、组织或交付价值的能力”的窄义定义，以Value Source为上位分析概念。
   Resource（可部署/使用/受约束的输入）、Asset（可识别/控制/承载价值的事物或成果）、Right（特定对象/行为/范围的权能或许可）与Capability是可重叠但不能混同的视角。
   依领域规则，Asset/Right可成为主要来源；这不取消实际能力、资格、执照、合法来源、交付能力或责任主体要求，也不证明权属或授予权限。
3. **F04**：§2.1“Identity是所有商品和交易的统一归属”不能继续被用来确定全球Offering的最终Owner Anchor或归属基数。
   Provider、Offering Owner、资产/权利人、操作者、合同当事人、履行者、Grantor及Beneficiary需分别解释，角色可兼任或分属不同主体。
   Identity持C号及1 Identity:N Profiles规则不变，历史creatorId保留原语义。最终owner、独立Provider实体、共同归属/委托/转移及法律责任结构未定。
4. Right的上游授权依据、面向客户的Right-type Offering/Proposal与下游Grant须区分；Grant不自动转移资产所有权或证明完整权利链。

本修订只影响上述全球概念解释，不决定实体/表、API、版本模型、状态机、库存统一或任何实施。
VS-01受控Capability/Template链及既有合同不变。
F05–F11为OPEN / NOT DECIDED，C4-A Model B不是已批准架构；本节不启动下一轮研究。
