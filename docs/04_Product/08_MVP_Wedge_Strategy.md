# 08 — MVP Wedge Strategy

> 状态：Decision v1  
> 决策日期：2026-08-11  
> 文档角色：第一份正式产品方向决策文件  
> 核心问题：Personal Commerce Infrastructure 应通过哪个用户、哪个场景和哪组交易能力进入市场？

## 1. Purpose

前七份文档已经定义：

- 项目为什么存在；
- 长期终局是什么；
- 平台管理什么；
- Creator 可以出售什么；
- 哪些 Creator 属于目标市场；
- MVP 需要验证什么；
- 哪些 Creator × Commerce 交叉点优先级更高。

本文件不再继续扩大战略边界，而是冻结第一个产品楔子。

它需要回答：

1. 为什么以舞者作为主验证 Creator；
2. 从舞者的哪个商业行为切入；
3. 产品入口是 Calendar 还是 Commerce Identity；
4. 首先服务 Creator、Fan 还是 Business；
5. 首版采用单垂直产品还是统一产品；
6. 楔子如何扩张到 Creator Commerce 与长期终局。

## 2. Current Strategic Position

当前项目层级已经冻结为：

```text
Market Entry
Creator
    ↓
Product Abstraction
Individual Commerce
    ↓
Endgame
Personal Commerce Infrastructure
```

Creator 是市场切入口，而不是 Personal Commerce Infrastructure 的永久边界。

当前价值链为：

```text
Social Attention
→ Creator Commercial Identity
→ Structured Inventory
→ Product
→ Transaction
→ Relationship
```

Opportunity Matrix 给出的关键信号是：

> 舞者并非因为市场规模最大而优先，而是因为单个舞者天然拥有多种商业资产和商品，最适合验证 Creator Commerce 的统一抽象。

## 3. Wedge Selection Principle

市场楔子不是“理论上最大的市场”，而是能够以最小产品成本获得最大验证信息的起点。

一个合格的 Wedge 应同时满足：

1. **供给已存在**：Creator 已经在出售或尝试出售相关商品；
2. **流量已存在**：单个 Creator 可以从自己的社交渠道带来第一批用户；
3. **交易可发生**：不依赖 Marketplace 冷启动即可产生商业行为；
4. **问题足够具体**：Creator 能立即理解产品解决什么；
5. **产品足够克制**：首版只需少量 Commerce Primitive；
6. **抽象信息量高**：成功或失败都能验证核心领域模型；
7. **扩张路径自然**：首个商品能够自然增加第二个商品；
8. **不会锁死终局**：不需要把产品永久做成垂直行业 SaaS。

因此，本项目优化的不是短期总市场规模，而是：

> Time to First Transaction × Strategic Learning × Expansion Optionality

## 4. Why Dancer

### 4.1 舞者同时拥有多种商业资产

一个独立舞者通常可以同时拥有：

- Identity：个人形象、风格和作品；
- Capability：舞蹈、编舞、教学、表演；
- Time：课程、私教、活动和商演档期；
- Influence：社交平台粉丝和垂直圈层影响；
- Audience：学员、粉丝、活动参与者和商业客户。

这些资产可以自然形成：

```text
舞者
├── 公开活动 / 演出
├── Workshop / 舞蹈课
├── 1v1 私教
├── 粉丝见面 / 限量体验
├── 约拍 / 联合创作
├── 商业演出
├── 品牌内容
└── 活动出席
```

舞者不是单商品供给，因此能验证产品究竟是在管理一个预约项目，还是在管理 Creator 的商业资产。

### 4.2 舞者横跨三类需求方

```text
Fan
→ 看演出、参加活动、见面与体验

Customer
→ 课程、私教、约拍

Business
→ 商演、活动、品牌内容
```

首版不需要同时完成三种市场关系，但舞者能够证明同一 Creator Identity 是否可以承接不同商业关系。

### 4.3 舞者能够自带第一批流量

舞者的首批用户可以来自：

- 抖音、小红书、B站等内容平台；
- 微信和学员群；
- 舞团、工作室和同城舞圈；
- 演出、比赛、Workshop 和活动现场；
- Creator 自己的社交关系。

这允许产品从 `Creator → Existing Audience` 启动，而不是要求平台先建立发现市场。

### 4.4 舞者具有良好的横向迁移能力

舞者模型成功后，可以较自然迁移到：

- 歌手；
- DJ；
- 演员；
- 主持人；
- 模特；
- Cosplayer；
- 健身和技能教练；
- 摄影师和其他独立专业 Creator。

其迁移基础不是职业相似，而是共享：

```text
Identity + Capability + Time + Influence
→ Multi-product Commerce
```

### 4.5 舞者的主要风险

- 商品类型过多，容易造成 MVP 范围失控；
- 商演、课程、活动和体验具有不同履约流程；
- 部分舞者主要依赖机构、舞室或经纪关系；
- 商业收入、交易频率和公开报价意愿尚无一手数据；
- 如果产品表达不清，Creator 可能把它理解成作品集或排课工具。

因此，选择舞者不等于首版支持舞者的全部商业行为。

## 5. Why Not Cosplayer First

Cosplayer 是当前最强的 Fan Commerce 候选。

它特别适合验证：

- Creator 自带流量；
- 行程与活动传播；
- 合影、签名和见面体验；
- 粉丝对 Creator 本人的直接付费。

但暂不作为唯一首发主楔子，原因是：

1. 商品结构更偏向 Fan Economy，较难单独验证 Service 与 B2B Commerce；
2. 活动和交易频率可能依赖漫展周期；
3. 容易将产品认知锁定为二次元活动、行程或粉丝工具；
4. 线下互动涉及隐私、安全、骚扰和未成年人边界；
5. 部分活动权益受漫展或主办方规则约束；
6. 单独成功后，向技能型 Creator 迁移仍需再次证明。

结论：

> Cosplayer 不作为主产品定义，但作为首批实验对照组，用于检验 Creator → Fan Commerce。

## 6. Why Not Photographer First

摄影师是当前最强的 Service Commerce 候选之一。

它特别适合验证：

- Portfolio 驱动的 Commercial Identity；
- Availability；
- 套餐和价格；
- 约拍 Booking；
- 商业 Content Commission。

但暂不作为唯一首发主楔子，原因是：

1. 产品容易退化为预约工具、作品集或自由职业接单页；
2. Photographer 的粉丝流量通常弱于强 IP Creator；
3. 大量需求在下单前仍需要沟通 Brief、地点、风格和交付；
4. 市场已有作品集、预约和自由职业工具；
5. 对 Event、Fan Experience 和 Influence Commerce 的验证较弱。

结论：

> 摄影师作为 Service Commerce 对照组，用于检验 Product Schema 的标准化与迁移能力。

## 7. Three Wedge Hypotheses

### Wedge A — Dancer Multi-product Commerce

#### 核心假设

一个舞者愿意在统一商业身份下，同时表达并经营多种商品。

#### 验证内容

- Identity；
- Calendar / Availability；
- Event；
- Service Booking；
- Experience；
- 后续 Performance / Content 扩展。

#### 最大信息价值

验证 Creator OS 的核心抽象是否成立。

### Wedge B — Cosplayer Fan Commerce

#### 核心假设

具有粉丝关系的 Creator 能够通过自有流量，把行程、活动和限量互动转化为直接交易。

#### 验证内容

- Upcoming Schedule；
- Event；
- Experience；
- Creator 自传播；
- Fan Conversion。

#### 最大信息价值

验证 `Creator → Fan` 是否可以绕开 Marketplace 冷启动产生首单。

### Wedge C — Photographer Service Commerce

#### 核心假设

具有明确专业能力的 Creator 能够将时间、套餐和交付物结构化为可预约服务。

#### 验证内容

- Capability；
- Portfolio；
- Availability；
- Service；
- Booking；
- Commission Inquiry。

#### 最大信息价值

验证 `Capability → Inventory → Service → Booking` 的标准工作流。

## 8. Recommended Wedge

### 8.1 正式定义

> 以舞者为首批核心 Creator，以 Creator Commercial Identity 为产品入口，以 Calendar / Event / Booking 为第一组 Commerce Primitive，通过 Creator 自有社交流量获得第一批真实商业行为。

### 8.2 更精确的产品表达

第一版不是：

- 舞者排课软件；
- 舞者票务平台；
- 舞者 Marketplace；
- 舞者社交网络；
- 通用预约工具。

第一版是：

> 一个让舞者集中展示“我是谁、我何时在哪里、我提供什么，以及如何购买或预约我”的统一商业主页。

### 8.3 第一组 Commerce Primitive

首版优先验证三种表达，但不一定实现三套完整交易系统：

| Primitive           | 解决的问题                 | 候选商业动作               |
| ------------------- | -------------------------- | -------------------------- |
| Calendar / Upcoming | 我什么时候在哪里           | 查看详情、报名、外部购票   |
| Event / Experience  | 可以参加或购买什么现场活动 | 报名、预订名额、购买       |
| Service Booking     | 哪些时间可以预约我的能力   | 预约、申请、支付或提交意向 |

Performance 和 Content 在首版可以先作为结构化商务能力与询盘入口，不立即建设完整合同和交付系统。

### 8.4 Wedge 边界

主楔子是：

```text
Dancer
→ Commercial Identity
→ Upcoming + Bookable Offer
→ Creator-owned Distribution
→ Transaction / Qualified Intent
```

不是：

```text
All Creators
→ All Commerce Types
→ Marketplace
→ Full Creator OS
```

## 9. Calendar-first vs Commerce-first

### Path A — Calendar-first

产品核心承诺：

> 告诉粉丝我什么时候在哪里。

#### 优势

- 非常接近项目最初观察；
- Creator 容易理解；
- 输入成本低；
- 页面结构简单；
- 适合传播近期活动。

#### 风险

- 容易被定义为 Creator 行程工具；
- 没有商品时难以证明交易价值；
- 对 Service、Performance 和 Content 扩张支撑较弱；
- Creator 可能只在活动前临时使用；
- 商业模式容易被压缩为票务导流。

### Path B — Commerce-first

产品核心承诺：

> 建立一个可以展示、预约和购买我的商业主页。

#### 优势

- 与 Creator Commerce 战略一致；
- 可以同时容纳多种商品；
- 页面价值直接关联收入；
- 更容易扩展 Audience、Order 和 Analytics；
- 不被单一 Calendar 心智锁定。

#### 风险

- 概念比行程工具更抽象；
- 商品创建成本更高；
- 如果首版商品类型太多，产品会复杂化；
- 需要更清晰的 onboarding 和示例。

### Decision

> 采用 **Commerce Identity-first**，Calendar 作为第一种核心 Inventory 和高频内容入口。

产品信息层级应为：

```text
Creator Commercial Identity
├── Upcoming
├── Available to Book
├── Experiences / Events
└── Business Inquiry
```

而不是：

```text
Calendar
└── 偶尔附带购买链接
```

Calendar 必须服务于 Commerce，而不能成为项目定义。

## 10. Creator-first vs Fan-first

### Creator-first

先解决：

- 如何表达商业身份；
- 如何结构化供给；
- 如何发布商品；
- 如何分享；
- 如何接收商业动作。

优势：

- Creator 已拥有首批流量；
- 单边价值成立；
- 可直接观察供给创建；
- 不依赖平台发现和推荐。

### Fan-first

先解决：

- 发现 Creator；
- 搜索城市与活动；
- 浏览推荐；
- 比较和购买。

风险：

- 需要足够密集和新鲜的供给；
- 形成双边冷启动；
- 可能提前建设 Marketplace；
- 无法先证明 Creator 愿意维护 Inventory。

### Decision

> 采用 **Creator-first，Fan-usable**。

含义：

- 产品设计首先保证 Creator 能创建和分享供给；
- 购买页面必须对 Fan / Customer 足够简单可信；
- 首版不建设平台级 Fan Discovery；
- Fan 流量来自 Creator 自有渠道；
- 平台不要求 Fan 为浏览和理解商品先建立复杂账户。

## 11. Transaction-first vs SaaS-first

### SaaS-first

Creator 为工具能力付费，例如高级主页、日历和管理功能。

问题：

- 在创造收入前要求 Creator 付费；
- 容易优化功能数量而非交易结果；
- 尚未证明工具具有持续经营价值。

### Transaction-first

平台先帮助 Creator 获得真实订单、预约或有效商业意向，再从交易中建立价值。

优势：

- 平台与 Creator 收入一致；
- 能直接验证 Commerce Thesis；
- 更容易衡量首个商业结果；
- 为未来 Take Rate 提供真实依据。

风险：

- 支付、退款和履约更复杂；
- 低 GMV 阶段收入有限；
- 如果使用第三方支付，交易归因可能不完整。

### Decision

> 采用 **Transaction-first，SaaS-later**。

首版可以根据合规和开发成本使用平台内支付、定金、预约申请或受控第三方跳转，但必须记录可归因的商业结果。

是否收取真实佣金由 `10 Business Model & Unit Economics` 决定。

## 12. Single Vertical vs Cross-vertical

### 方案 A — 只服务舞者

优势：

- 产品表达集中；
- 获取种子用户更容易；
- 示例和术语一致。

风险：

- 容易为舞者工作流定制；
- 无法证明抽象可以迁移；
- 团队可能把市场入口误当长期边界。

### 方案 B — 同时做三个垂直产品

风险：

- 产品和运营范围过大；
- 需要三套 onboarding、模板与获客策略；
- 学习信号被功能差异污染；
- 无法保持 MVP 克制。

### Decision

> 采用 **一个统一产品、一个主垂直、两个小型对照组**。

具体为：

- 主样本：舞者；
- Fan Commerce 对照：Cosplayer；
- Service Commerce 对照：摄影师。

所有样本使用相同核心对象：

```text
Identity
Capability
Availability
Product
Commercial Action
```

允许示例文案和默认模板不同，但不得为对照组开发独立垂直工作流。

## 13. Initial Creator Cohort

### 13.1 建议规模

Opportunity Matrix 提出的 20 / 10 / 10 结构适合作为后续扩大目标，但对第一轮产品发现过大。

第一轮建议：

| Cohort    |  人数 | 角色                  |
| --------- | ----: | --------------------- |
| 舞者      |  8–12 | 主楔子样本            |
| Cosplayer |   3–5 | Fan Commerce 对照     |
| 摄影师    |   3–5 | Service Commerce 对照 |
| 合计      | 14–22 | Founder-led Discovery |

完成第一轮信号后，再扩展到：

- 20 位舞者；
- 10 位 Cosplayer；
- 10 位摄影师。

### 13.2 舞者筛选条件

优先选择：

- 以个人身份经营，而非完全依附机构；
- 至少有一个活跃社交渠道；
- 近期存在真实活动、课程、私教或合作档期；
- 至少拥有两类潜在商品；
- 当前依靠私信、群聊或多个工具完成商业沟通；
- 愿意公开或半公开表达价格与购买规则；
- 愿意将页面分享给真实受众。

### 13.3 样本组合

舞者样本应尽量覆盖：

- 有粉丝但商品少；
- 有教学收入；
- 有商演收入；
- 同时经营教学与演出；
- 独立舞者；
- 舞团或工作室成员但拥有个人商业身份。

目标不是人口统计代表性，而是覆盖不同 Commerce 组合。

## 14. Wedge → Expansion → Endgame

### Stage 1 — Wedge

```text
Dancer Commercial Identity
├── Profile
├── Upcoming
├── Bookable Offer
└── Commercial Action
```

目标：获得第一批真实预约、报名、购买或商业询盘。

### Stage 2 — Product Expansion

在同一舞者身份下增加：

```text
Private Lesson
→ Workshop
→ Experience
→ Performance Inquiry
→ Content Collaboration
```

目标：证明一个 Creator 可以持续经营多个商品。

### Stage 3 — Creator Expansion

复用同一 Commerce Primitive 到：

```text
Cosplayer
Photographer
Singer
DJ
Coach
Beauty Creator
```

目标：证明产品抽象不是舞者专用 SaaS。

### Stage 4 — Demand Aggregation

当供给足够结构化和新鲜后，增加：

- Location-based Discovery；
- Time-based Discovery；
- Capability Search；
- Creator Collections；
- Fan Follow / Subscribe；
- Business Search。

目标：从 Creator 自带流量演化为平台提供增量需求。

### Stage 5 — Marketplace

形成：

```text
Fan / Customer / Business
→ Search and Match
→ Creator Inventory
→ Transaction
```

### Stage 6 — Endgame

从 Creator Commerce 扩展到：

> Personal Commerce Infrastructure

服务所有拥有个人 IP、专业能力、技能、影响力或个人品牌的独立商业主体。

## 15. MVP Success Criteria

本文件定义 Wedge 成功，而不是完整 PMF。

### 15.1 Creator Adoption

- 至少 60% 的核心样本愿意建立可公开商业身份；
- 至少 50% 愿意分享给真实受众；
- 至少 50% 能提供两类潜在商品；
- 创建首个可用页面的人工辅助时间可逐步降至 15 分钟以内。

### 15.2 Inventory and Product

- 至少 80% 的真实商品可由统一候选 Schema 表达；
- 每位激活 Creator 至少发布一个近期有效供给；
- 至少 30% 的舞者发布第二种商品或第二个档期；
- Calendar 信息能够直接关联商业动作，而不是孤立展示。

### 15.3 Commerce

- 至少 30% 的激活 Creator 获得一项有效商业行为；
- 第一轮出现至少 10 个可归因的预约、报名、订单或高意向询盘；
- 至少出现一笔真实付款，或有明确证据说明首版不应优先内建支付；
- Creator 认为页面减少了重复私信、说明或排期工作。

### 15.4 Expansion Signal

- 舞者主动提出添加第二种商品；
- Cosplayer 与摄影师无需独立产品即可使用核心 Schema；
- 至少一个核心工作流可以跨三个样本组复用；
- 用户将产品理解为商业身份或商业主页，而不仅是行程表。

## 16. Wedge Failure / Reconsideration Criteria

出现以下情况，应重新评估舞者优先或 Wedge 定义：

1. 舞者普遍没有独立商业决策权；
2. 舞者只愿意发布活动，不愿表达可售服务或合作；
3. Creator 无法通过自有渠道带来有效访问；
4. 商品差异导致统一 Schema 无法覆盖 80% 样本；
5. 大部分交易必须在私信中重新从头沟通；
6. 舞者使用意愿明显弱于 Cosplayer 或摄影师；
7. Creator 只需要排课、票务或作品集中的单点工具；
8. 安全、退款或线下履约风险使轻量验证不可行；
9. 首个商业结果无法在合理时间内产生；
10. 对照组证明另一个 Wedge 具有显著更快的首单和留存。

## 17. Wedge Non-goals

MVP Wedge 阶段明确不做：

- Creator Marketplace；
- 平台级 Creator Discovery；
- 社交 Feed 或 Creator Social Network；
- AI Creator Agent；
- AI 自动商品化；
- 复杂 CRM；
- 完整会员系统；
- 动态定价；
- Creator Financing；
- 广告系统；
- 数据交易市场；
- B2B Creator Marketplace；
- 复杂座位票务；
- 大型主办方后台；
- 全自动合同与结算；
- 门店 ERP；
- 多垂直独立定制；
- 为所有七类商品提供完整履约。

任何新增能力都必须回答：

> 它是否直接帮助首批 Creator 把商业供给变成真实商业行为？

不能直接回答的功能进入后续阶段。

## 18. Decision Record

### D-08-01 — Market Entry

**Decision**：Creator 是市场切入口；Individual Commerce 是产品抽象；Personal Commerce Infrastructure 是长期终局。  
**Reason**：Creator 拥有更显性的个人商业意图、受众和自带流量。  
**Revisit Trigger**：非 Creator 个人商业主体表现出显著更高的激活和交易效率。

### D-08-02 — Primary Creator

**Decision**：舞者作为首批核心 Creator。  
**Reason**：舞者是跨商品验证器，能够同时测试 Capability、Time 与 Influence 的商品化。  
**Revisit Trigger**：舞者缺少独立供给、自带流量或真实商品维护意愿。

### D-08-03 — Product Entry

**Decision**：Commerce Identity-first，而不是 Calendar-first。  
**Reason**：Calendar 是 Inventory，不是产品终局；产品价值必须指向可交易供给。  
**Revisit Trigger**：用户只能理解和采用独立行程产品，且行程能稳定驱动后续交易。

### D-08-04 — Supply / Demand Sequence

**Decision**：Creator-first，Fan-usable。  
**Reason**：Creator 自带首批流量，避免 Marketplace 双边冷启动。  
**Revisit Trigger**：Creator 无法自带有效需求，平台发现成为交易必要条件。

### D-08-05 — Monetization Sequence

**Decision**：Transaction-first，SaaS-later。  
**Reason**：先证明平台能帮助 Creator 产生商业结果，再判断 SaaS 付费价值。  
**Revisit Trigger**：交易链路过重，而 Creator 对独立经营工具表现出明确付费意愿。

### D-08-06 — Vertical Strategy

**Decision**：一个统一产品、一个主垂直、两个小型对照组。  
**Reason**：保持 GTM 聚焦，同时验证底层抽象可迁移。  
**Revisit Trigger**：对照组需要大量独立功能，或主垂直无法形成足够样本。

### D-08-07 — Product Creation Model

**Decision**：首版由 Creator 自己定义商品，平台提供结构化原语和建议模板。  
**Reason**：避免按职业写死商品，保持 Creator OS 与跨垂直能力。  
**Revisit Trigger**：Creator 无法自主完成商品定义，标准模板显著提高激活率。

### D-08-08 — First Commerce Scope

**Decision**：优先支持 Upcoming、Event / Experience 和 Service Booking；Performance / Content 首版先采用 Inquiry。  
**Reason**：覆盖 Fan 与 Service Commerce，同时避免合同、复杂交付和 B2B 结算。  
**Revisit Trigger**：真实样本的首要收入高度集中在 Performance 或 Content，Inquiry 无法满足交易需要。

## 19. Decision Status Rules

从本文件开始，项目文档使用以下状态：

| 标签                  | 含义                                 |
| --------------------- | ------------------------------------ |
| Frozen Consensus      | 已形成稳定共识，用于解释项目         |
| Decision              | 当前执行必须遵循的选择               |
| Assumption            | 尚未被真实行为验证的判断             |
| Long-term Possibility | 长期可能性，不构成当前承诺           |
| Non-goal              | 当前阶段明确不做                     |
| Revisit Trigger       | 触发重新讨论某项 Decision 的客观条件 |

Decision 不是永久真理，但在 Revisit Trigger 出现之前，不应因个人偏好反复重启讨论。

## 20. Open Questions

以下问题作为 `09 MVP Product Definition` 的输入被提出。已冻结的答案和仍需 Experiment / PRD 解决的问题，以 `09` 文档为准：

1. 首版主要交易动作是直接购买、预约申请、定金还是外部跳转？
2. Event 和 Experience 是否共享同一创建流程？
3. Service Booking 首版需要精确时间槽，还是仅表达可预约日期和申请？
4. Creator 是否愿意公开价格，或更偏好“起价 + 询价”？
5. Creator Storefront 的默认信息层级如何避免成为普通作品集？
6. 一位舞者首版最多允许创建多少种商品？
7. Upcoming 是独立内容对象，还是 Product / Event 的视图？
8. 购买者是否需要账户才能提交商业动作？
9. 平台需要记录哪些最小订单状态？
10. 如何处理线下 Experience 的安全、隐私和行为边界？
11. 哪些流程允许人工运营，哪些状态必须产品化？
12. Creator、Customer 和 Business 是否首版共享同一种 Buyer 模型？

## 21. Frozen Wedge Statement

> Personal Commerce Infrastructure 的第一个产品楔子，是以舞者为核心样本的 Creator Commercial Identity：让舞者在一个统一页面中表达自己的身份、近期行程和可购买能力，并通过自有社交流量获得第一批活动报名、体验预订、服务预约或商业询盘。

> 产品采用 Commerce Identity-first、Creator-first、Transaction-first；Calendar 是核心 Inventory，但不是产品定义。产品只做一个，Cosplayer 与摄影师作为小型对照组验证 Fan Commerce 与 Service Commerce 的迁移能力。
