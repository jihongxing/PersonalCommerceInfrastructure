# 10 — Business Model & Unit Economics

> 状态：Decision v1 + Economic Assumptions v1  
> 决策日期：2026-08-11  
> 阶段：Commercial Definition Phase  
> 文档角色：定义 MVP 如何捕获价值，并建立可复算的 Creator 与平台单位经济模型  
> 核心问题：平台对什么收费、由谁付费、一个活跃 Creator 能产生多少收入，以及何时具备可持续商业价值？

## 1. Purpose

前九份文档已经冻结了项目战略、市场楔子和 MVP 产品边界。

本文件首次将产品行为转化为经济模型，负责定义：

- Business Model Thesis；
- 收费原则；
- Commerce Monetization Matrix；
- Transaction Take Rate 模型；
- Creator Unit Economics；
- Platform Unit Economics；
- Revenue Scenarios；
- SaaS-later 的进入条件；
- Marketplace 与长期基础设施收入；
- Economic Flywheel；
- 核心经济指标；
- Economic Experiment；
- Decision 与 Revisit Trigger。

本文件不是财务预测或融资承诺。

所有未由真实交易证明的数字均为：

> 用于检验模型敏感性的情景变量，而不是市场事实。

## 2. Business Model Thesis

项目的初始商业模式是：

> 先帮助 Creator 产生真实商业结果，再从平台实际承接并创造价值的交易中获取收入。

当前收入演化路径：

```text
MVP
Transaction Revenue
    ↓
Mid-term
Transaction + Creator SaaS
    ↓
Marketplace
Fan / Customer / Business Demand Commission
    ↓
Infrastructure
Payments / Financial / Business Services
```

阶段关系为：

- **Transaction-first**：先证明平台能产生和承接交易；
- **SaaS-later**：当 Creator 产生持续经营复杂度后出售经营能力；
- **Marketplace-after-supply**：拥有足够结构化供给后再聚合需求；
- **Infrastructure-after-data**：拥有真实收入、订单和履约数据后再讨论金融与基础设施。

## 3. Monetization Principles

### 3.1 Charge for Realized Value

平台优先对已经产生的商业价值收费，而不是对 Creator 建立页面收费。

含义：

- 建立 Creator Commercial Identity 应低门槛；
- 免费发布不代表所有交易永久免费；
- Creator 与平台在收入结果上保持一致；
- 页面访问、Upcoming 展示和无成交 Inquiry 不应被过早货币化。

### 3.2 Monetization Follows Platform Responsibility

费率应与平台承担的责任相匹配。

平台承担越多，潜在收费空间越高：

- 支付；
- 订单；
- 库存；
- 提醒；
- 退款；
- 核销；
- 风控；
- 客服；
- 争议处理；
- 税务或结算责任。

平台只提供导流或 Inquiry 时，不应按完整交易价值收取高额佣金。

### 3.3 Different Primitive, Different Economics

Event、Experience、Service 和 Inquiry 不应默认使用完全相同的费率与成本模型。

差异来自：

- 客单价；
- 交易频率；
- 退款率；
- 履约风险；
- 是否需要 Creator 确认；
- 平台支付成本；
- 客服成本；
- 替代工具；
- Creator 毛利结构。

### 3.4 Free Is a Strategic Tool

免费用于：

- 降低 Creator Activation 门槛；
- 获得供给；
- 观察真实行为；
- 建立 Creator 习惯；
- 让非标准交易逐步结构化。

免费必须有明确目的，不能成为永久无法货币化的模糊承诺。

### 3.5 Take Rate Is Not Contribution Margin

平台收入不是平台最终保留价值。

```text
Gross Platform Revenue
− Payment Cost
− Refund / Chargeback Loss
− Creator Payout Cost
− Transaction Support
− Risk and Trust Cost
− Variable Infrastructure
= Contribution Margin
```

所有费率决策必须同时观察 Creator 接受度与平台贡献毛利。

### 3.6 Do Not Tax Off-platform Value Without Creating It

如果平台仅展示 Creator 的外部链接，无法确认成交，也未承担交易责任，则不应假装拥有对应 GMV 或收入。

平台需要区分：

- 页面访问；
- 外部跳转；
- 有效意向；
- 已确认交易；
- 已支付交易；
- 已履约交易。

## 4. Who Pays

### 4.1 Creator-paid

平台从 Creator 应收收入中扣除费用。

#### 优势

- 购买者看到的价格简单；
- 平台与 Creator 收入直接绑定；
- 适合 Service 和 Experience；
- 易于表达为“成交后付费”。

#### 风险

- Creator 对名义 Take Rate 更敏感；
- 高客单服务可能产生绕开平台的动机；
- Creator 需要感知平台带来的新增价值。

### 4.2 Buyer-paid

平台向 Fan / Customer 收取服务费。

#### 优势

- Creator 获得其设定价格；
- Event 票务市场已有类似心智；
- 费用可以与支付、安全或票务服务关联。

#### 风险

- 提高结账价格；
- 可能降低转化；
- 费用透明度影响信任；
- 不一定适合高客单 Service。

### 4.3 Split Fee

Creator 与购买者共同承担费用。

#### 优势

- 降低单侧费率感知；
- 可以覆盖支付与平台服务；
- 适应不同 Primitive。

#### 风险

- 定价解释更复杂；
- 可能同时伤害 Creator 接受度和 Buyer Conversion；
- 首版测试变量增加。

### 4.4 Business-paid

B2B 客户支付平台服务费、撮合费或采购服务费。

适用于未来：

- Creator Booking Marketplace；
- 品牌采购；
- 活动供给匹配；
- 托管合同和结算。

首版 Inquiry 免费，不冻结 B2B 费率。

### Decision

> MVP 默认测试 **Creator-paid Transaction Fee**，Event 同时保留测试 Buyer-paid Service Fee 的可能性。

该决策不是最终费率政策。实际扣费前必须验证：

- Creator 是否理解；
- Creator 是否接受；
- Buyer 转化是否受影响；
- 平台实际承担哪些成本；
- 当地支付、税务与消费者规则。

## 5. Commerce Monetization Matrix

| Commerce Primitive | 主要用户            | 商业结果              | MVP 收费策略                                 | 中期可能模式                             |
| ------------------ | ------------------- | --------------------- | -------------------------------------------- | ---------------------------------------- |
| Upcoming           | Fan / Customer      | 信息、导流、提醒      | 免费                                         | Pro 展示、推广或 Discovery               |
| Event              | Fan                 | Ticket / Registration | 已确认付费交易可测试 Take Rate；外部跳转免费 | Ticket Fee、Buyer Service Fee、Marketing |
| Experience         | Fan                 | Reservation / Booking | 已确认付费交易测试 Take Rate                 | Take Rate、Premium Protection            |
| Service            | Customer            | Booking / Payment     | 已确认付费交易测试 Take Rate                 | Take Rate 或 Pro + Lower Take Rate       |
| Inquiry            | Business / Customer | Qualified Lead        | MVP 免费                                     | Lead Fee、Success Fee、B2B SaaS          |

### 5.1 Upcoming

Upcoming 的主要作用是：

- 提高页面新鲜度；
- 驱动分享；
- 连接 Creator 的时间和地点；
- 引导到可交易 Primitive。

MVP 不对发布 Upcoming 收费。

未来只有在平台提供额外价值时才考虑收入，例如：

- 平台 Discovery；
- 付费推广；
- 高级自动同步；
- 受众通知能力。

### 5.2 Event

平台只有在承接以下部分能力时才测试交易收费：

- 平台内报名或支付；
- 容量管理；
- 订单确认；
- 基础通知；
- 必要退款或取消处理。

如果仅跳转第三方票务：

- 不计平台内 GMV；
- 不收交易 Take Rate；
- 只记录 Referral；
- 未来可讨论 Affiliate 或 SaaS 价值。

### 5.3 Experience

Experience 对 Creator 本人的时间和关系稀缺性进行交易。

其潜在收费空间来自：

- 名额；
- 预订；
- 支付；
- 确认；
- 安全规则；
- 取消管理。

但平台必须控制：

- 高风险互动；
- 未成年人；
- 隐私；
- 线下安全；
- 争议和未履约。

风险成本可能使 Experience 的名义 Take Rate 高于 Service，但在数据出现前不冻结。

### 5.4 Service

Service 的平台价值主要是：

- Availability；
- Booking；
- 定金或支付；
- 改期和取消；
- 订单记录；
- 复购关系。

高客单 Service 对百分比费率更敏感，未来可能演化为：

```text
Free
Higher Take Rate

Pro
Subscription + Lower Take Rate
```

### 5.5 Inquiry

MVP Inquiry 免费，因为：

- 尚未证明 Lead 质量；
- 平台未完成交易；
- 商业合作成交周期较长；
- 需要先理解需求与 Creator 处理方式。

未来货币化候选：

- Verified Lead Fee；
- Success Fee；
- Business Subscription；
- Managed Marketplace Commission；
- 合同和结算服务。

## 6. Transaction Take Rate Model

### 6.1 Definitions

#### GMV

通过平台内被确认的商品交易总额。

外部跳转、未确认 Inquiry 和未完成意向不计入平台 GMV。

#### Gross Take Rate

```text
Gross Take Rate
= Gross Platform Revenue / GMV
```

Gross Platform Revenue 包括：

- Creator Transaction Fee；
- Buyer Service Fee；
- 固定每单费用；
- 与交易直接关联的平台收费。

不包括：

- 代收后支付给 Creator 的金额；
- 税费；
- 不属于平台收入的支付通道费用。

#### Net Take Rate

```text
Net Take Rate
= Net Platform Revenue / GMV
```

Net Platform Revenue 在 Gross Platform Revenue 基础上扣除：

- 优惠和返还；
- Revenue Share；
- 不可收回交易费；
- 直接冲减收入的项目。

#### Creator Net Earnings

```text
Creator Net Earnings
= GMV
− Creator-paid Platform Fee
− Creator-paid Payment Cost
− Refunds / Adjustments
− Taxes or Withholding
```

具体税务与支付责任尚未确定。

### 6.2 Fee Structure Candidates

#### Percentage Only

```text
Fee = GMV × Take Rate
```

优点：易理解，与 Creator 收入一致。  
风险：低客单订单覆盖不了固定支付和客服成本。

#### Percentage + Fixed Fee

```text
Fee = GMV × Take Rate + Fixed Fee per Order
```

优点：覆盖固定成本。  
风险：低价 Event 和 Experience 费率感知较高。

#### Tiered Take Rate

费率随：

- Primitive；
- Creator 计划；
- 月度 GMV；
- 平台服务深度；
- 退款与风险；
- 平台带来的需求来源

发生变化。

首版不应同时引入过多费率层级。

### 6.3 MVP Testing Range

MVP 不冻结正式费率，采用以下假设区间进行测试：

| 模型                    | 假设区间 | 用途                       |
| ----------------------- | -------: | -------------------------- |
| Creator-paid Percentage |   5%–10% | Event、Experience、Service |
| Buyer Service Fee       |    0%–5% | Event 对照实验             |
| Fixed Fee per Order     |    ¥0–¥3 | 测试低客单固定成本覆盖     |
| Inquiry Fee             |       ¥0 | MVP                        |
| SaaS Subscription       |       ¥0 | MVP                        |

以上区间不包含或不代表支付通道成本，实际展示方式必须在支付方案确认后重新计算。

### 6.4 Take Rate Decision Rule

费率不能只根据竞品或 Creator 口头反馈决定。

至少同时观察：

1. Creator Published Rate；
2. Creator Distributed Rate；
3. Paid Transaction Conversion；
4. Creator Net Earnings；
5. Off-platform Leakage；
6. Refund and Cancellation Rate；
7. Support Cost per Order；
8. Contribution Margin；
9. Repeat Supply；
10. Creator Retention。

## 7. Creator Unit Economics

### 7.1 Active Creator Definitions

#### Published Creator

拥有公开 Storefront 和有效商业动作。

#### Commerce Activated Creator

获得至少一个可归因商业动作。

#### Transaction Active Creator

在观察周期内拥有至少一个已确认付费交易。

#### Monthly Active Commerce Creator

在一个自然月内满足至少一个条件：

- 创建或更新有效供给；
- 分享 Storefront；
- 获得商业动作；
- 处理订单或 Inquiry；
- 完成交易或履约。

收入模型应优先使用：

> Transaction Active Creator 或 Monthly Active Commerce Creator

而不是注册 Creator。

### 7.2 Core Formula

```text
Monthly GMV per Active Creator
= Paid Orders per Creator per Month
× Average Order Value
```

```text
Monthly Platform Revenue per Active Creator
= Monthly GMV per Active Creator
× Net Take Rate
+ SaaS Revenue per Active Creator
+ Other Net Revenue per Active Creator
```

MVP 阶段：

```text
SaaS Revenue = 0
Other Net Revenue = 0
```

### 7.3 Primitive-level Formula

由于不同 Primitive 经济不同，应分别计算：

```text
Creator Monthly GMV
= Event Orders × Event AOV
+ Experience Orders × Experience AOV
+ Service Orders × Service AOV
```

```text
Platform Revenue
= Event GMV × Event Net Take Rate
+ Experience GMV × Experience Net Take Rate
+ Service GMV × Service Net Take Rate
```

Inquiry 在 MVP 只记录：

- Qualified Inquiries；
- Creator Response；
- Estimated Deal Value；
- Confirmed Off-platform Outcome。

不将 Estimated Deal Value 计入 GMV。

### 7.4 Hypothetical Creator Scenarios

以下仅用于展示模型敏感性：

| 情景   | 付费订单/月 |  AOV | 月 GMV / Creator | Net Take Rate | 月平台收入 / Creator |
| ------ | ----------: | ---: | ---------------: | ------------: | -------------------: |
| 低活跃 |           6 | ¥180 |           ¥1,080 |            5% |                  ¥54 |
| 基础   |          20 | ¥300 |           ¥6,000 |            8% |                 ¥480 |
| 高活跃 |          50 | ¥500 |          ¥25,000 |           10% |               ¥2,500 |

这些情景并不预测舞者实际表现。

模型最敏感的变量是：

- 付费订单频率；
- 活跃 Creator 比例；
- AOV；
- Net Take Rate；
- Creator 交易留存。

### 7.5 Creator Earnings

平台必须同时观察 Creator 的经济结果：

```text
Creator Revenue Lift
= Platform-attributed Creator Net Earnings
− Baseline Creator Net Earnings
```

平台 GMV 增长可能来自：

- 新增交易；
- 更高转化；
- 更高价格；
- 更多商品；
- 更高复购；
- 原本线下交易迁移。

其中只有新增价值最能支持长期费率。

如果平台只是迁移原有交易，却增加 Creator 成本和管理负担，留存会较弱。

## 8. Platform Unit Economics

### 8.1 Gross Platform Revenue

```text
Gross Platform Revenue
= GMV × Gross Take Rate
+ Fixed Transaction Fees
+ SaaS Revenue
+ Marketplace Revenue
+ Infrastructure Revenue
```

MVP 主要观察第一项。

### 8.2 Variable Costs

每笔交易可能产生：

- 支付处理成本；
- 付款或提现成本；
- 退款和不可退支付费用；
- 拒付、欺诈和坏账；
- 短信、邮件和通知；
- 客服与争议处理；
- 身份、风控或内容审核；
- 与交易直接相关的云资源；
- Creator Onboarding 的可变人工成本；
- 补贴和促销。

### 8.3 Contribution Margin

```text
Contribution Margin
= Net Platform Revenue
− Variable Transaction Cost
− Variable Creator Support Cost
− Variable Buyer Support Cost
− Fraud / Refund Loss
− Variable Infrastructure Cost
```

```text
Contribution Margin %
= Contribution Margin / Net Platform Revenue
```

### 8.4 Contribution per Active Creator

```text
Monthly Contribution per Active Creator
= Monthly Platform Revenue per Active Creator
× Contribution Margin %
```

假设情景：

| 情景   | 月平台收入 / Creator | 假设贡献毛利率 | 月贡献毛利 / Creator |
| ------ | -------------------: | -------------: | -------------------: |
| 低活跃 |                  ¥54 |            55% |               ¥29.70 |
| 基础   |                 ¥480 |            65% |                 ¥312 |
| 高活跃 |               ¥2,500 |            75% |               ¥1,875 |

贡献毛利率只是情景变量。真实数据出现前，不应将其视为目标承诺。

### 8.5 Creator Acquisition Cost

```text
Creator CAC
= Creator Acquisition Spend
+ Attributable Sales / Community Labor
+ Creator Onboarding Cost
+ Incentives
────────────────────────────────
New Activated Creators
```

应同时观察：

- CAC per Registered Creator；
- CAC per Creator Published；
- CAC per Creator Distributed；
- CAC per Transaction Active Creator。

最重要的是最后一项。

Founder-led Discovery 人工成本应单独记录，不能因未支付现金而视为零。

### 8.6 Payback

```text
CAC Payback Months
= CAC per Transaction Active Creator
/ Monthly Contribution per Active Creator
```

MVP 阶段不冻结正式 Payback 目标，但需要判断模型是否可能趋向合理。

建议进入规模化 GTM 前满足：

- 基础情景下能够估算 Payback；
- 不依赖永久补贴产生交易；
- Creator 在 Payback 前仍有足够留存概率；
- Onboarding 人工成本呈下降趋势。

### 8.7 Creator LTV

简化模型：

```text
Creator LTV
= Monthly Contribution per Active Creator
× Expected Active Lifetime in Months
```

更稳健的模型应按月度 Cohort 计算实际贡献毛利，而不是使用过度乐观的永久留存假设。

```text
LTV / CAC
= Creator LTV
/ CAC per Transaction Active Creator
```

在缺少 6–12 个月留存数据前，不冻结 LTV/CAC 结论。

## 9. Revenue Scenarios

### 9.1 Scale Scenarios

以下假设所有 Creator 都是 Transaction Active Creator，不代表注册量。

#### Low Activity Scenario

每位 Creator：

- 月 GMV：¥1,080；
- 月平台收入：¥54；
- 月贡献毛利：¥29.70。

| 活跃 Creator |      月 GMV | 月平台收入 | 月贡献毛利 |
| -----------: | ----------: | ---------: | ---------: |
|          100 |    ¥108,000 |     ¥5,400 |     ¥2,970 |
|        1,000 |  ¥1,080,000 |    ¥54,000 |    ¥29,700 |
|       10,000 | ¥10,800,000 |   ¥540,000 |   ¥297,000 |

#### Base Scenario

每位 Creator：

- 月 GMV：¥6,000；
- 月平台收入：¥480；
- 月贡献毛利：¥312。

| 活跃 Creator |      月 GMV | 月平台收入 | 月贡献毛利 |
| -----------: | ----------: | ---------: | ---------: |
|          100 |    ¥600,000 |    ¥48,000 |    ¥31,200 |
|        1,000 |  ¥6,000,000 |   ¥480,000 |   ¥312,000 |
|       10,000 | ¥60,000,000 | ¥4,800,000 | ¥3,120,000 |

#### High Activity Scenario

每位 Creator：

- 月 GMV：¥25,000；
- 月平台收入：¥2,500；
- 月贡献毛利：¥1,875。

| 活跃 Creator |       月 GMV |  月平台收入 |  月贡献毛利 |
| -----------: | -----------: | ----------: | ----------: |
|          100 |   ¥2,500,000 |    ¥250,000 |    ¥187,500 |
|        1,000 |  ¥25,000,000 |  ¥2,500,000 |  ¥1,875,000 |
|       10,000 | ¥250,000,000 | ¥25,000,000 | ¥18,750,000 |

### 9.2 What These Scenarios Show

该模型说明：

1. 注册 Creator 数量没有直接经济意义；
2. 低交易活跃度下，即使 Creator 数量较多，收入仍可能不足；
3. Revenue per Active Creator 是关键变量；
4. 高频 Service 与高价值 Experience / Event 的商品组合可能比单一商品更重要；
5. 贡献毛利必须足以覆盖 Creator CAC 和固定团队成本；
6. venture-scale 结果需要活跃 Creator 数量、每 Creator GMV 和留存同时成立。

### 9.3 Venture-scale Test

项目是否具备大规模商业潜力，不能只看 TAM。

需要逐步证明：

```text
Enough Eligible Creators
× High Activation
× Meaningful GMV per Active Creator
× Sustainable Take Rate
× Strong Retention
× Efficient CAC
= Scalable Platform Revenue
```

其中任何一项过低，都可能使模型成为小型工具或垂直 SaaS，而不是大型交易基础设施。

## 10. Primitive-level Economics

### 10.1 Event

潜在特点：

- 较低至中等 AOV；
- 单次活动可能产生较多订单；
- 交易集中在活动前；
- 退款、改期和客服风险较高；
- 可测试 Buyer Service Fee；
- Creator 复购取决于持续活动频率。

重点指标：

- Tickets per Event；
- Event GMV；
- Checkout Conversion；
- Refund Rate；
- Support per 100 Orders；
- Event Repeat Rate。

### 10.2 Experience

潜在特点：

- 名额少；
- 稀缺性高；
- AOV 可能高于普通 Event；
- Creator 时间成本高；
- 安全和取消风险重要；
- 粉丝支付意愿是关键。

重点指标：

- Capacity Utilization；
- Experience AOV；
- Confirm Rate；
- Cancellation / No-show；
- Incident Rate；
- Repeat Purchase。

### 10.3 Service

潜在特点：

- 交易频率更稳定；
- AOV 差异大；
- 预约和改期是主要成本；
- 高客单时 Creator 对 Take Rate 更敏感；
- 复购能够显著提高 LTV。

重点指标：

- Bookings per Creator；
- Service AOV；
- Confirmation Time；
- Reschedule Rate；
- Repeat Booking；
- Off-platform Repeat Leakage。

### 10.4 Inquiry

潜在特点：

- 成交周期长；
- AOV 可能较高；
- 交易不标准；
- 初期平台无法确认价值；
- 可能产生未来 B2B Marketplace。

重点指标：

- Qualified Inquiry Rate；
- Creator Response Rate；
- Meeting / Negotiation Rate；
- Confirmed Deal Rate；
- Estimated and Verified Deal Value；
- Time to Close。

## 11. SaaS-later Strategy

### 11.1 SaaS Thesis

Creator 不应因为“拥有一个页面”而被要求订阅。

SaaS 应在以下链路出现：

```text
Transactions
→ More Products and Customers
→ Operating Complexity
→ Willingness to Pay for Tools
→ Creator Pro
```

### 11.2 Potential Pro Value

未来 Creator Pro 可以包括：

- 高级 Calendar；
- 外部日历同步；
- 多商品管理；
- 高级 Analytics；
- Customer History；
- CRM；
- 自动提醒和营销；
- 自定义页面；
- 团队协作；
- Membership；
- 更快结算；
- 更低 Take Rate；
- 高级支持。

这些不是 MVP Scope。

### 11.3 SaaS Entry Triggers

只有出现以下信号，才应进入 Pro 定义：

1. Creator 连续 2–3 个月产生交易；
2. Creator 管理多个商品或档期；
3. Creator 主动要求高级经营功能；
4. 交易 Creator 对费率表现敏感；
5. 降低 Take Rate 可以与订阅形成清晰交换；
6. 免费 Creator 与高价值 Creator 的服务成本明显不同；
7. 至少一个 Pro 能力能够量化提高 Creator 收入或节省时间。

### 11.4 Candidate Hybrid Model

未来候选：

| Plan     | Subscription | Take Rate | 目标                       |
| -------- | -----------: | --------: | -------------------------- |
| Free     |           ¥0 |      较高 | 新 Creator、低风险试用     |
| Pro      |       待验证 |      较低 | 稳定交易 Creator           |
| Business |       待验证 |      定制 | 团队、机构或高 GMV Creator |

当前不冻结价格与费率。

## 12. Marketplace Revenue Model

### 12.1 Marketplace Preconditions

平台只有在拥有以下条件后才进入 Marketplace：

- 足够数量的活跃 Creator；
- 新鲜 Availability；
- 可比较 Capability；
- 真实价格或报价范围；
- 履约与信誉信号；
- 某个城市或垂直中的供给密度；
- 已验证的买方需求。

### 12.2 Fan / Customer Marketplace

未来收入可能来自：

- Transaction Take Rate；
- Buyer Service Fee；
- Promoted Placement；
- Marketplace-acquired Order 的更高费率。

必须区分：

```text
Creator-owned Demand
vs
Platform-acquired Demand
```

平台带来增量买家时，收费空间可能更高。

### 12.3 B2B Marketplace

未来可能采用：

- Success Commission；
- Buyer Subscription；
- Verified Lead Fee；
- Managed Service Fee；
- Contract / Payment Fee。

首版 Inquiry 免费，以理解真实 B2B 流程。

### 12.4 Marketplace Revisit Trigger

如果出现：

- 大量购买者主动搜索非特定 Creator；
- Inquiry 中重复出现相似需求；
- Creator 供给在某城市形成密度；
- 平台能够显著缩短匹配时间；
- Platform-acquired Demand 的转化可被测量；

则可以提前定义 Marketplace Experiment。

## 13. Long-term Infrastructure Revenue

长期收入候选：

- Payment Processing；
- Instant / Scheduled Payout；
- Escrow；
- Insurance；
- Revenue Advance；
- Creator Credit；
- Tax and Compliance；
- Contracting；
- Venue and Equipment；
- Business Infrastructure API。

进入条件：

1. 平台掌握真实交易；
2. 拥有稳定 Creator 收入数据；
3. 能观察履约、退款和风险；
4. Creator 对平台形成经营依赖；
5. 相关服务具备合法、合规和风险能力。

这些是 Long-term Possibility，不计入当前商业模型。

## 14. Economic Flywheel

### 14.1 MVP Flywheel

MVP 没有 Marketplace 网络效应。

第一阶段飞轮是：

```text
Creator Publishes
→ Creator Shares Own Traffic
→ Commercial Action
→ Creator Revenue
→ Creator Updates More Supply
→ More Transactions
→ Creator Retention
```

关键变量：

- Creator 能否自带流量；
- 页面能否转化；
- Creator 能否真实赚钱；
- 收入能否推动 Repeat Supply。

### 14.2 Product Flywheel

```text
More Creator Transactions
→ Better Understanding of Products
→ Better Templates and Workflows
→ Faster Creator Activation
→ More Active Creators
→ More Transactions
```

这是数据与产品学习飞轮，不是需求网络效应。

### 14.3 Marketplace Flywheel

供给密度形成后：

```text
More Active Creators
→ More Structured Inventory
→ More Buyer Choice
→ More Platform Demand
→ More Transactions
→ More Creator Revenue
→ More Active Creators
```

### 14.4 B2B Flywheel

```text
More Verified Creator Supply
→ Faster Business Matching
→ More Business Demand
→ More Creator Revenue
→ Better Availability and Pricing Data
→ More Verified Creator Supply
```

MVP 阶段不得使用后两种飞轮解释当前增长。

## 15. Core Economic Metrics

### 15.1 Creator Funnel

- Registered Creators；
- Creator Published；
- Creator Distributed；
- Commerce Activated Creator；
- Transaction Active Creator；
- Monthly Active Commerce Creator；
- Repeat Supply Creator；
- 30 / 60 / 90-day Creator Retention。

### 15.2 Commerce

- Paid Orders；
- Orders per Active Creator；
- GMV；
- GMV per Active Creator；
- AOV；
- Primitive Mix；
- Repeat Transaction Rate；
- Confirmation Rate；
- Fulfillment Rate；
- Refund / Cancellation / No-show Rate。

### 15.3 Revenue

- Gross Take Rate；
- Net Take Rate；
- Revenue per Active Creator；
- Revenue per Paid Order；
- SaaS Attach Rate；
- Marketplace Revenue；
- Revenue Mix。

### 15.4 Cost

- Payment Cost per Order；
- Support Cost per Order；
- Refund and Fraud Loss；
- Creator Onboarding Cost；
- Creator CAC；
- CAC per Transaction Active Creator；
- Variable Infrastructure per Order。

### 15.5 Efficiency

- Contribution Margin；
- Contribution per Active Creator；
- CAC Payback；
- Creator LTV；
- LTV / CAC；
- Burn per Activated Creator；
- GMV and Revenue per Employee。

## 16. Economic Assumptions

当前假设：

1. Creator 更愿意接受成交后收费，而非发布前订阅；
2. 5%–10% 可以作为初始费率实验区间；
3. 不同 Primitive 最终需要不同有效费率；
4. Upcoming 免费能够提高供给和分享；
5. Inquiry 免费有助于理解 B2B 需求；
6. Creator 自有流量能够显著降低 Buyer CAC；
7. 平台能够产生相对私信流程的增量交易或效率；
8. 多商品 Creator 的 GMV 与留存高于单商品 Creator；
9. Creator 收入增长会推动 Repeat Supply；
10. 交易数据会产生后续 SaaS 和 Marketplace 机会；
11. 支付、退款和客服成本不会吞噬全部 Take Rate；
12. Creator 不会大规模在首单后绕开平台；
13. 足够多 Creator 可以达到基础或更高活跃情景；
14. Founder-led Onboarding 能逐步产品化并降低成本。

以上均需 Experiment 和真实 Cohort 数据验证。

## 17. Economic Experiment Candidates

### E-10-01 — Willingness to Share Revenue

**Hypothesis**：Creator 更愿意接受成交后 5%–10% 的平台费用，而不是首次发布时订阅。  
**Method**：向真实 Creator 展示不同收费模式，并在有真实交易时测试选择。  
**Primary Signal**：Paid Activation、Creator Acceptance、Transaction Completion。  
**Guardrail**：不能只记录口头偏好。  
**Decision Use**：确认 Transaction-first。

### E-10-02 — Take Rate Sensitivity

**Hypothesis**：5%、8% 和 10% 对 Creator 发布和交易行为产生可测差异。  
**Method**：按 Cohort 或明确报价实验，不对同类用户隐藏收费。  
**Primary Signal**：Transaction Conversion、Creator Net Earnings、Repeat Supply。  
**Guardrail**：样本必须控制 Primitive 和服务深度差异。  
**Decision Use**：确定费率区间。

### E-10-03 — Fee Bearer

**Hypothesis**：Event 可以接受 Buyer Service Fee，而 Service 更适合 Creator-paid。  
**Method**：分别测试 Creator-paid、Buyer-paid 和 Split Fee。  
**Primary Signal**：Checkout Conversion、Creator Acceptance、Effective Take Rate。  
**Guardrail**：费用必须透明。  
**Decision Use**：定义不同 Primitive 的付费方。

### E-10-04 — Platform Value Lift

**Hypothesis**：平台能够产生新增交易或明显减少 Creator 经营成本。  
**Method**：记录 Creator 使用前后的询问、成交、处理时间和收入。  
**Primary Signal**：Incremental GMV、Time Saved、Conversion Lift。  
**Guardrail**：区分迁移交易与新增交易。  
**Decision Use**：判断 Take Rate 是否可持续。

### E-10-05 — Revenue per Active Creator

**Hypothesis**：首批 Transaction Active Creator 能逐步接近基础情景。  
**Method**：按月记录订单、AOV、GMV 和净收入。  
**Primary Signal**：Monthly Revenue per Active Creator。  
**Guardrail**：不以少数头部 Creator 掩盖中位数。  
**Decision Use**：判断商业规模和 GTM 可承受 CAC。

### E-10-06 — Contribution Margin

**Hypothesis**：基础交易模式在低规模下仍可产生正的订单贡献毛利。  
**Method**：记录每单支付、退款、客服、通知和风控成本。  
**Primary Signal**：Contribution per Order、Contribution Margin %。  
**Guardrail**：Founder 人工支持必须计入影子成本。  
**Decision Use**：决定支付和支持流程。

### E-10-07 — Off-platform Leakage

**Hypothesis**：平台提供的订单、提醒和关系价值足以让 Creator 将复购留在平台。  
**Method**：跟踪首单后复购与 Creator 反馈。  
**Primary Signal**：On-platform Repeat Rate、Known Leakage Rate。  
**Guardrail**：尊重用户隐私，不使用侵入式监控。  
**Decision Use**：决定 Take Rate、Pro 与 Relationship 能力。

### E-10-08 — Multi-product Economics

**Hypothesis**：发布两种以上 Primitive 的 Creator 拥有更高 GMV 和留存。  
**Method**：比较单商品与多商品 Cohort。  
**Primary Signal**：GMV / Creator、Repeat Supply、Retention。  
**Guardrail**：控制 Creator 规模和活跃度。  
**Decision Use**：验证 Multi-product Wedge。

### E-10-09 — SaaS Trigger

**Hypothesis**：持续交易 Creator 愿意为高级经营能力或更低 Take Rate 付费。  
**Method**：在满足交易门槛的 Creator 中测试 Pro Concept。  
**Primary Signal**：Qualified Willingness to Pay、Upgrade Intent、Feature Usage。  
**Guardrail**：不对未产生交易 Creator 过早测试复杂 SaaS。  
**Decision Use**：决定是否进入 Creator Pro。

### E-10-10 — Inquiry Economic Value

**Hypothesis**：免费 Inquiry 可以产生可验证的高价值商业机会。  
**Method**：跟踪 Inquiry 到回复、沟通和确认结果。  
**Primary Signal**：Qualified Rate、Confirmed Deal Rate、Verified Deal Value。  
**Guardrail**：Estimated Value 不计 GMV。  
**Decision Use**：决定 B2B Lead Fee 或 Marketplace 优先级。

## 18. Decision Record

### D-10-01 — Initial Revenue Model

**Decision**：MVP 以 Transaction Revenue 为第一收入模型。  
**Reason**：收费与 Creator 获得商业结果一致。  
**Economic Revisit Trigger**：交易链路成本过高，或 Creator 明确更愿意为经营工具订阅。

### D-10-02 — Free Supply Entry

**Decision**：Creator Identity、Upcoming、发布供给和 Inquiry 在 MVP 免费。  
**Reason**：优先建立结构化供给并降低 Activation 门槛。  
**Economic Revisit Trigger**：免费功能产生显著持续成本，或高级发布能力具有明确付费价值。

### D-10-03 — Monetized Primitive

**Decision**：Event、Experience 和 Service 的已确认付费交易可以测试 Take Rate；外部跳转和未成交 Inquiry 不收费。  
**Reason**：平台只对可归因且实际承接的价值收费。  
**Economic Revisit Trigger**：某类非支付商业动作产生稳定、可验证的平台价值。

### D-10-04 — Fee Level

**Decision**：正式 Take Rate 未冻结；MVP 使用 5%–10% 作为实验区间。  
**Reason**：需要同时验证 Creator 接受度、转化和贡献毛利。  
**Economic Revisit Trigger**：任一费率显著影响发布、成交、绕开平台或留存。

### D-10-05 — Fee Bearer

**Decision**：默认测试 Creator-paid；Event 保留 Buyer-paid 对照。  
**Reason**：Service 和 Experience 更适合从 Creator 收入中扣费，Event 存在买方服务费心智。  
**Economic Revisit Trigger**：Buyer-paid 显著降低转化，或 Creator-paid 显著降低供给。

### D-10-06 — Revenue Metric

**Decision**：核心收入指标是 Revenue per Transaction Active Creator，不是注册用户收入。  
**Reason**：只有持续产生交易的 Creator 构成经济供给。  
**Economic Revisit Trigger**：SaaS 或非交易收入成为主要收入来源。

### D-10-07 — Contribution Discipline

**Decision**：所有交易必须计算 Contribution Margin，不以 GMV 或 Gross Revenue 替代单位经济。  
**Reason**：支付、退款、客服和风险成本可能吞噬 Take Rate。  
**Economic Revisit Trigger**：平台转为纯 SaaS 或其他无交易成本模式。

### D-10-08 — SaaS Timing

**Decision**：Creator Pro 只在持续交易和经营复杂度出现后定义。  
**Reason**：SaaS 应解决已发生的经营问题，而不是提前销售假设功能。  
**Economic Revisit Trigger**：Creator 在交易前就对独立商业身份工具表现出强烈付费意愿。

### D-10-09 — Marketplace Timing

**Decision**：Marketplace Revenue 不计入 MVP 商业模型。  
**Reason**：首版没有平台级需求聚合和供给密度。  
**Economic Revisit Trigger**：出现稳定平台搜索需求、重复 B2B Inquiry 或局部供给密度。

### D-10-10 — Financial Scope

**Decision**：支付之外的金融与基础设施收入均为长期可能性。  
**Reason**：缺少交易、风险和合规基础。  
**Economic Revisit Trigger**：平台拥有稳定收入、履约与风险数据，并具备合法能力。

## 19. Economic Revisit Framework

以下触发器出现时，必须重新评估商业模式：

### Revenue Triggers

- 连续 Cohort 的 Revenue per Active Creator 明显低于可支持 GTM 的水平；
- GMV 高但 Net Take Rate 过低；
- 收入高度依赖极少数 Creator；
- 免费 Inquiry 成为主要价值但无法货币化。

### Cost Triggers

- 支付、退款和客服成本持续吞噬大部分收入；
- Experience 安全和争议成本不可接受；
- Founder-led Onboarding 无法显著降低；
- Creator CAC 高于合理 Payback 能力。

### Behavior Triggers

- Creator 大规模在首单后绕开平台；
- 高费率显著降低 Creator Distributed 或 Repeat Supply；
- Buyer Service Fee 显著降低购买转化；
- Creator 更愿意购买 SaaS 而非支付 Take Rate。

### Strategic Triggers

- B2B Inquiry 远高于 C 端交易；
- Service 成为绝对主导，产品趋向 Vertical SaaS；
- Event 成为绝对主导，产品趋向 Ticketing；
- Marketplace-acquired Demand 开始显著超过 Creator-owned Demand。

## 20. Explicit Non-goals

本阶段不做：

- 冻结正式公开费率；
- 承诺固定 Take Rate；
- 制定完整财务预测；
- 把外部跳转计入平台 GMV；
- 把 Inquiry 估值计入收入；
- 以注册 Creator 数量推导收入；
- 在没有留存数据时宣称 LTV/CAC；
- 立即推出 Creator Pro；
- 立即推出 Marketplace 收费；
- 金融服务收入预测；
- 通过隐藏费用提高 Effective Take Rate；
- 忽略 Creator 收入和净收益；
- 忽略 Founder 人工运营成本；
- 假设所有 Primitive 具有相同经济模型。

## 21. Open Questions

进入 `11 GTM Strategy` 和正式 Experiment 前仍需回答：

1. 首轮交易是否真实收费，还是先记录影子费率；
2. 支付成本由 Creator、Buyer 还是平台承担；
3. 平台是交易代理、技术服务商还是其他法律角色；
4. Event、Experience 和 Service 是否使用同一支付与退款规则；
5. 低价订单是否需要固定费用；
6. Creator 是否需要最低结算门槛；
7. 退款后平台费用是否退还；
8. Creator 取消和 Buyer 取消的经济责任；
9. Inquiry 如何确认真实成交；
10. 如何计算 Founder-led Onboarding 的影子成本；
11. 何种收入水平能够支持 Founder-led、Community-led 或 Paid Acquisition；
12. Creator-owned Demand 与 Platform-acquired Demand 如何归因；
13. Creator 在中国境内收款、税务和消费者责任如何处理；
14. 哪个 Primitive 最早具备正贡献毛利；
15. 何时开始测试 Pro + Lower Take Rate。

## 22. Research References

以下公开页面于 2026-08-11 访问，仅用于观察不同商业模式结构，不直接决定本项目费率：

1. Eventbrite Pricing：`https://www.eventbrite.com/organizer/pricing/`  
   展示免费发布、付费票务按票收费、支付处理费和可选 Organizer Pro 的组合。
2. Calendly Pricing：`https://calendly.com/pricing`  
   展示免费预约入口与面向专业用户、团队和企业的 SaaS 分层。
3. Gumroad Pricing：`https://gumroad.com/pricing`  
   展示无月费、直接交易百分比收费，以及 Marketplace 获客交易采用更高费率的结构。
4. Fresha Pricing：`https://www.fresha.com/pricing`  
   用于观察 Beauty & Wellness 预约、支付与经营软件的混合收费类别。

公开定价来自不同国家、责任范围和商业模式，不可直接映射到中国市场或本项目。

## 23. Frozen Business Model

> MVP 的第一商业模式是 Transaction Take Rate：Creator 可以免费建立商业身份、发布 Upcoming、创建供给并接收 Inquiry；平台只对实际承接、可归因并完成确认的 Event、Experience 和 Service 付费交易测试收费。

> 正式费率尚未冻结。MVP 在 5%–10% 区间测试 Creator 接受度、Buyer Conversion、Creator Net Earnings、Off-platform Leakage 和 Contribution Margin。核心经济指标不是注册 Creator 数，也不是单纯 GMV，而是 Revenue 与 Contribution per Transaction Active Creator。

> SaaS 只在 Creator 持续交易并产生经营复杂度后进入；Marketplace 只在结构化供给和平台需求形成后进入；支付之外的金融与基础设施收入属于长期可能性，不计入当前商业模型。
