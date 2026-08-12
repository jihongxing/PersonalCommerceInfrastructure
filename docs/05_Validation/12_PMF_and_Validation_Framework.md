# 12 — PMF & Validation Framework

> 状态：Decision v1 + Validation Framework v1  
> 决策日期：2026-08-11  
> 阶段：GTM & PMF Validation Phase  
> 文档角色：定义什么证据算作 PMF、什么结果触发修改，以及如何把 Experiment 转化为 Decision  
> 核心问题：如何区分“有人喜欢”“有人使用”“有人交易”和“形成可持续商业关系”？

## 1. PMF Thesis

本项目不是通过问卷或口头偏好证明 PMF。

项目的核心 PMF 命题是：

> 独立 Creator 愿意把自己的商业供给持续迁移到统一 Commercial Identity 中，并通过 Creator 自有分发获得可重复的商业交易；购买者愿意通过该身份页再次购买，Creator 因此持续维护供给并推荐其他 Creator。

这条命题包含四个相互依赖的部分：

```text
Identity Adoption
→ Distribution
→ Commerce
→ Workflow Retention
```

如果只有 Identity Adoption，没有 Distribution，产品可能只是资料工具。

如果有 Distribution，没有 Commerce，产品可能只是内容链接页。

如果有 First Transaction，没有 Repeat Supply，产品可能只是一次性活动工具。

如果有 Creator Retention，没有经济可持续性，可能存在 Product PMF，但 Business Model 尚未成立。

## 2. PMF Definition

### 2.1 PMF 不是一个数字

PMF 不是：

- 100 个 Creator 注册；
- 80% 访谈者表示喜欢；
- 某个头部 Creator 产生高 GMV；
- 某个月有大量页面访问；
- 一次活动集中产生很多订单。

PMF 是一组持续、重复、跨样本的行为证据。

### 2.2 PMF 三个阶段

#### Pre-PMF

证明：

- 目标 Creator 愿意尝试；
- 能够建立商业身份；
- 部分 Creator 愿意分发；
- 至少出现早期商业动作。

Pre-PMF 允许大量人工协助，不代表产品已经可规模化。

#### Emerging PMF

证明：

- Creator 持续发布和更新供给；
- 交易持续发生；
- Creator 产生可感知收入或效率价值；
- 部分购买者发生复购；
- Creator 开始形成工作流习惯。

Emerging PMF 说明产品可能进入真实使用，但仍需验证留存、成本和渠道复制。

#### Strong PMF

证明：

- Creator Retention 稳定；
- Transaction Active Creator Retention 稳定；
- Fan / Customer Repeat Transaction 稳定；
- Creator Referral 和 Organic Acquisition 出现；
- 单位经济支持可重复获客；
- 跨多个 Cohort 和主要 Segment 复现。

Strong PMF 才接近可规模化商业机器，但仍不等于最终市场规模已被证明。

## 3. Three-sided PMF Model

项目存在三个相关但不同的 PMF。

### 3.1 Creator PMF

问题：

> Creator 是否愿意把自己的商业经营迁移到这里？

行为证据：

- 建立 Commercial Identity；
- 发布真实供给；
- 主动分发；
- 处理商业动作；
- 更新第二个供给；
- 持续维护；
- 推荐同行。

### 3.2 Consumer PMF

问题：

> Fan / Customer 是否愿意通过 Creator Storefront 购买、预约或报名？

行为证据：

- 点击供给；
- 提交商业动作；
- 完成付款或确认；
- 参加 Event / Experience；
- 完成 Service；
- 再次购买；
- 主动保存或返回 Creator 页面。

### 3.3 Commerce PMF

问题：

> Creator 与 Fan / Customer 是否形成可重复的交易关系？

行为证据：

- 真实订单；
- 已确认交易；
- 实际履约；
- 复购；
- Creator 重复发布；
- 交易留在平台；
- 每笔交易具备正向或可改善的贡献毛利。

### 3.4 Platform / Business Fit

Platform Fit 不是独立用户 PMF，但决定项目能否成为生意。

问题：

> 平台是否能以可接受成本获得、服务并留住 Transaction Active Creator？

证据：

- CAC 可测；
- Onboarding 成本下降；
- Revenue per Active Creator 可测；
- Contribution Margin 可改善；
- Creator Retention 支撑 LTV；
- 渠道可以复制。

## 4. Creator Workflow PMF

### 4.1 Why It Matters

本项目和普通 Link-in-Bio 的核心区别，不是页面更漂亮，而是是否进入 Creator 的经营工作流。

工具使用：

```text
想起来时创建一次页面
```

Workflow Adoption：

```text
有新活动
→ 在这里发布
→ 分享
→ 接收订单 / 预约
→ 处理履约
→ 更新结果
```

### 4.2 Workflow PMF Definition

Creator Workflow PMF 成立的早期迹象：

1. Creator 新供给优先发布到平台；
2. Creator 在收到外部需求时主动使用页面；
3. Creator 通过平台处理订单或预约；
4. Creator 在首个结果后再次更新；
5. Creator 认为平台是商业经营的一部分，而不是单次活动工具；
6. Creator 即使没有平台推荐，也愿意保留页面。

### 4.3 Workflow Events

需要记录：

- New Supply Created；
- Supply Updated；
- Storefront Distributed；
- Commercial Action Received；
- Creator Action Taken；
- Transaction Confirmed；
- Fulfillment Completed；
- Repeat Supply Created；
- Repeat Transaction Received；
- Referral Sent。

## 5. Evidence Hierarchy

证据阶梯从弱到强：

```text
Level 0  Creator Interest
    ↓
Level 1  Creator Published
    ↓
Level 2  Creator Distributed
    ↓
Level 3  Commerce Activated
    ↓
Level 4  First Transaction
    ↓
Level 5  Repeat Supply
    ↓
Level 6  Repeat Transaction
    ↓
Level 7  Creator Retention
    ↓
Level 8  Creator Referral
```

### Level 0 — Creator Interest

表现：

- 口头表示有兴趣；
- 愿意参加演示；
- 愿意留下联系方式；
- 认为页面概念不错。

价值：

- 用于筛选语言；
- 用于发现问题；
- 不能证明需求、使用或 PMF。

### Level 1 — Creator Published

表现：

- 创建公开 Commercial Identity；
- 发布至少一个有效 Upcoming 或 Product；
- 配置明确商业动作。

价值：

- 证明产品能被初步采用；
- 证明 Onboarding 有可行路径；
- 不能证明 Creator 会分发或交易。

### Level 2 — Creator Distributed

表现：

- Creator 主动将页面、二维码或 Product 素材分享到真实外部渠道。

价值：

- 证明 Creator 愿意将产品带入自己的商业关系；
- 是 Creator-first GTM 成立的必要条件；
- 仍不能证明购买者愿意交易。

### Level 3 — Commerce Activated

表现：

- 访客提交报名、预约、预订、Inquiry 或订单；
- 该动作可以归因到 Creator Storefront。

价值：

- 证明存在真实商业意图；
- 但未必代表付款或履约。

### Level 4 — First Transaction

表现：

- 首笔真实付款；
- 或在支付未上线时形成 Creator 确认的真实交易。

价值：

- 第一个强需求证据；
- 必须区分付款、确认、外部成交和预估价值。

### Level 5 — Repeat Supply

表现：

- Creator 发布第二项供给；
- 更新新的档期；
- 再次分发；
- 首次履约后继续使用。

价值：

- 证明产品可能进入工作流；
- 对 Creator PMF 的价值通常高于单次首单。

### Level 6 — Repeat Transaction

表现：

- 同一个 Fan / Customer 再次购买；
- 或同一 Creator 的不同商品产生后续交易。

价值：

- 开始证明 Commerce 本身可重复；
- 需要区分季节性活动和真正复购。

### Level 7 — Creator Retention

表现：

- Creator 在 30 / 60 / 90 天仍维护供给；
- Transaction Active Creator 在后续周期继续交易。

价值：

- 证明产品进入持续工作流；
- 是从一次性工具向基础设施升级的核心证据。

### Level 8 — Creator Referral

表现：

- Creator 主动推荐同行；
- 推荐对象成为 Qualified、Published 或 Transaction Active Creator。

价值：

- 极强的价值信号；
- 只有有效推荐产生后续行为时才计入强证据。

## 6. PMF Metrics

### 6.1 Leading Indicators

早期用于判断产品是否能被采用：

- Qualified Creator Rate；
- Creator Activated Rate；
- Creator Published Rate；
- Median Time to Publish；
- Creator Distributed Rate；
- Storefront Visit Rate；
- Commerce Activated Rate。

这些指标用于定位漏斗，不单独证明 PMF。

### 6.2 Core PMF Indicators

中期必须观察：

- First Transaction Rate；
- Transaction Active Creator Rate；
- Time to First Transaction；
- Repeat Supply Rate；
- Transaction Active Creator Retention；
- Revenue per Transaction Active Creator；
- Contribution per Transaction Active Creator；
- Creator Workflow Event Frequency；
- Consumer Confirmation Rate。

### 6.3 Strong PMF Signals

后期观察：

- Repeat Transaction Rate；
- Creator 30 / 60 / 90-day Retention；
- Transaction Active Creator M1 / M2 / M3 Retention；
- Creator Referral Rate；
- Organic Qualified Creator Rate；
- Referred Transaction Active Rate；
- Platform-acquired Demand；
- LTV / CAC；
- Contribution-positive Cohort。

## 7. Core Definitions

### 7.1 Transaction Active Creator

在观察周期内至少拥有一笔已确认付费交易的 Creator。

### 7.2 Transaction Active Creator Retention

定义 Cohort：

```text
M0 = Creator 首次完成确认付费交易的月份
```

计算：

```text
TAC Retention M1
= M0 Cohort 中 M1 仍产生确认付费交易的 Creator
/ M0 Cohort 的 Transaction Active Creator
```

同理计算 M2、M3。

该指标比普通 Creator Retention 更严格，因为它要求 Creator 持续产生商业结果。

### 7.3 Repeat Supply

首个有效供给发布后，在定义窗口内再次：

- 创建 Product；
- 更新 Upcoming；
- 开放新 Availability；
- 重新分发；

不把仅修改头像或 Bio 计入。

### 7.4 Repeat Transaction

可分为：

- **Buyer Repeat**：同一个 Buyer 再次购买；
- **Creator Repeat**：同一个 Creator 的另一个商品产生交易；
- **Cycle Repeat**：同一 Creator 在不同周期持续产生交易。

三个指标不能混为一谈。

### 7.5 Creator Referral

只有推荐对象满足至少 Qualified Creator 才计入有效 Referral。

推荐对象进一步成为 Transaction Active Creator，才计入强 Referral。

## 8. PMF Threshold Framework

### 8.1 Threshold Principles

阈值不是永恒标准，而是当前 Cohort 判定门槛。

所有阈值应满足：

1. 预先定义；
2. 标明样本量；
3. 按 Cohort 计算；
4. 报告中位数与分布；
5. 区分 Concierge 与 Self-serve；
6. 区分主样本与对照组；
7. 包含时间窗口；
8. 记录证据等级；
9. 不被单一头部 Creator 主导；
10. 允许结果触发“修改”，而不只有成功或失败。

### 8.2 Pre-PMF Gate

建议至少满足：

- 20–30 位合格 Creator 进入观察；
- ≥60% Creator Published；
- ≥50% Creator Distributed；
- ≥30% Commerce Activated；
- 至少 10 个 First Transaction 或 Confirmed Commerce；
- 至少 30% 首单 Creator 产生 Repeat Supply；
- 至少一个 Primitive 在不同 Creator 中重复出现。

解释：

这证明产品具备早期采用和交易可能，但不代表 PMF 已成立。

### 8.3 Emerging PMF Gate

建议在至少两个连续 Cohort 中观察：

- ≥70% Creator Published；
- ≥60% Creator Distributed；
- ≥40% Creator 获得 First Transaction；
- ≥50% 首单 Creator 在 30 天内产生 Repeat Supply；
- ≥25% 首单 Creator 在下一个观察周期继续产生交易；
- ≥20% Buyer Repeat 或 Creator Repeat；
- Transaction Active Creator 的收入和贡献毛利可测；
- 至少一个非 Founder Direct 渠道产生有效 Transaction Active Creator。

解释：

这表示产品开始进入 Creator 工作流，并产生可重复商业行为。

### 8.4 Strong PMF Gate

建议在三个以上独立 Cohort 中观察：

- ≥70% Transaction Active Creator 在 M1 仍交易；
- ≥50% Transaction Active Creator 在 M2 仍交易；
- ≥35% Transaction Active Creator 在 M3 仍交易；
- ≥35% Buyer Repeat 或 Creator Repeat；
- ≥20% 新 Qualified Creator 来自 Creator Referral 或 Organic；
- 至少两个 Acquisition Channel 可产生可接受的 Transaction Active CAC；
- 至少一个主要 Primitive Cohort 贡献毛利为正；
- Creator 能独立完成大部分发布和更新；
- Creator 认为平台是日常商业工作流的一部分。

这些是起始判定门槛，不是行业基准或融资承诺。

### 8.5 Threshold Confidence

当前阈值属于：

> Validation Starting Threshold

置信度为 Low–Medium，因为尚无本项目一手 Cohort 数据。

阈值应在首轮数据后校准，但不能在看到结果后随意移动。

## 9. Failure Interpretation Matrix

| 观察结果                                    | 可能含义                                       | 首要检查                         | 触发动作                                    |
| ------------------------------------------- | ---------------------------------------------- | -------------------------------- | ------------------------------------------- |
| Creator Interest 高，Published 低           | 价值表达或 Onboarding 有问题                   | Setup 时间、字段、Concierge      | 修改 09 Product Definition / 11 GTM Message |
| Published 高，Distributed 低                | Commercial Identity 价值不足或分享困难         | 分享素材、渠道限制、Creator 动机 | 修改 08 / 09 Distribution Decision          |
| Distributed 高，Commerce Activated 低       | 商品、价格、页面或需求不匹配                   | Primitive、AOV、规则、流量来源   | 运行 Product / Pricing Experiment           |
| Commerce Activated 高，First Transaction 低 | 支付、信任、确认或履约摩擦                     | Buyer 信息、支付、Creator 响应   | 修改 Transaction Scope                      |
| First Transaction 高，Repeat Supply 低      | 一次性工具或首单非真实价值                     | 履约后访谈、更新行为、商品周期   | 重新评估 Workflow PMF                       |
| Repeat Supply 高，Repeat Transaction 低     | Creator 供给有持续性，但需求或商品不成立       | Buyer 复购、供给质量、价格       | 修改 Commerce / Demand 假设                 |
| Repeat Transaction 高，Creator Retention 低 | 交易可能发生但平台未进入工作流                 | 平台外复购、管理成本、结果记录   | 评估 Workflow 与留存能力                    |
| Creator Retention 高，TAC Retention 低      | 页面被维护但没有持续交易                       | 交易频率、商品质量、需求         | 重新评估 Commerce PMF                       |
| TAC Retention 高，Contribution Margin 低    | Product PMF 可能存在，但 Business Model 不成立 | 支付、客服、退款、费率、CAC      | 修改 10 Business Model                      |
| Contribution Margin 高，CAC 高              | 经济成立但 GTM 不可规模化                      | 渠道、Referral、Onboarding       | 修改 11 GTM                                 |
| CAC 低，TAC Retention 低                    | 获客便宜但带来低质量 Creator                   | ICP、渠道质量、激励              | 修改 ICP / Channel                          |
| 单一头部 Creator 贡献大部分 GMV             | 样本不可泛化                                   | 中位数、分位数、去头部结果       | 暂停规模化结论                              |

## 10. Experiment → Evidence → Decision

### 10.1 Required Chain

每个实验必须完成：

```text
Experiment
→ Observed Evidence
→ Evidence Strength
→ Interpretation
→ Decision Impact
→ Document Update
```

### 10.2 Interpretation Rules

#### Example A — Low Distribution

错误结论：

> Experiment Failed。

正确分析：

1. Creator 是否完成 Published？
2. 是否理解如何分享？
3. 是否有合适分享素材？
4. 分享渠道是否受限？
5. Creator 是否认为页面有商业价值？
6. 是否有供给但没有真实分享时机？

可能 Decision：

- 修改 Value Proposition；
- 增加 Distribution Asset；
- 修改 09 Storefront；
- 选择更合适的 Creator Segment；
- 触发 08 的 Creator Distribution Revisit Trigger。

#### Example B — No Buyer Purchase

应区分：

- 没有访问；
- 有访问无点击；
- 有点击无提交；
- 有提交无支付；
- 支付失败；
- Creator 未确认；
- 履约信任不足；
- 商品本身无需求。

不同问题对应不同文档更新，不能统称为 Demand Failed。

#### Example C — No Repeat Supply

应检查：

- Creator 是否真的完成过履约；
- 首单是否由人工推动；
- 商品是否是一次性 Event；
- Creator 是否知道如何发布第二项供给；
- 平台是否提供持续经营价值；
- Creator 是否把复购迁移到外部。

## 11. PMF Decision States

| 状态            | 定义                                       | 下一步                     |
| --------------- | ------------------------------------------ | -------------------------- |
| Explore         | 证据不足，继续发现                         | 运行定向 Experiment        |
| Iterate         | 某层级有信号，但关键漏斗断裂               | 修改产品、Message 或渠道   |
| Narrow          | 仅部分 Segment / Primitive 成立            | 收窄 ICP 或商品范围        |
| Continue        | 达到当前阶段门槛，进入下一 Cohort          | 扩大但保持控制             |
| Scale Carefully | 出现跨 Cohort、跨渠道的持续证据            | 试点扩大 Acquisition       |
| Pivot           | 核心假设被反复否定                         | 修改 Wedge、用户或交易模型 |
| Stop            | 经过足够实验仍无商业证据，且无合理修正路径 | 暂停该方向                 |

## 12. PMF + Unit Economics

### 12.1 Combined Chain

```text
Creator Acquisition
→ Creator Activation
→ Creator Distribution
→ Commerce Activation
→ First Transaction
→ Revenue per Creator
→ Contribution per Creator
→ Creator Retention
→ Creator LTV
→ CAC
```

### 12.2 Product PMF vs Business PMF

#### Product PMF

Creator 和 Buyer 持续使用，并形成重复交易。

#### Business PMF

在 Product PMF 基础上：

- Transaction Active Creator 可以被有效获得；
- Revenue per Creator 可测；
- Contribution Margin 可为正或有明确改善路径；
- Creator LTV 能支持 CAC；
- 渠道具备复制性。

可能出现：

```text
Product PMF = Yes
Business PMF = No
```

例如：

- Creator 留存高；
- 交易重复发生；
- 但支付、客服和人工 Onboarding 成本吞噬全部收入。

此时不能直接规模化，应优先修正 Business Model。

### 12.3 Economic PMF Gate

Economic PMF 不要求第一天达到最终利润，但至少要求：

1. Revenue per Transaction Active Creator 可测；
2. Contribution per Transaction Active Creator 可测；
3. 贡献毛利不是随着交易增长线性恶化；
4. Creator CAC 有可解释的上限；
5. Repeat Supply 或 Retention 能支持 LTV；
6. 至少一个渠道在规模化假设下具备 Payback 路径；
7. 费率不会显著破坏 Creator 分发和留存。

## 13. Validation Cohorts

### Cohort 0 — Design Partners

目标：

- 验证 Creator Published；
- 验证 Primitive 表达；
- 验证 Concierge；
- 允许大量人工；
- 不作规模化结论。

### Cohort 1 — Transaction Validation

目标：

- 验证 Creator Distributed；
- 验证 Commerce Activated；
- 获得 First Transaction；
- 观察支付、确认和履约。

### Cohort 2 — Channel Validation

目标：

- 比较 Direct、Community、Studio、Event；
- 观察 CAC；
- 验证非 Founder 渠道；
- 观察首批 Repeat Supply。

### Cohort 3 — Repeatability

目标：

- 观察 30 / 60 / 90 天留存；
- 验证 Transaction Active Creator Retention；
- 验证 Creator Referral；
- 测试自助 Onboarding；
- 测试经济模型。

## 14. Validation Time Windows

不同证据需要不同观察窗口：

| 证据                | 建议窗口                 |
| ------------------- | ------------------------ |
| Creator Published   | Onboarding 当日          |
| Creator Distributed | 发布后 72 小时           |
| Commerce Activated  | 分发后 14 天             |
| First Transaction   | 供给有效期内，最长 30 天 |
| Repeat Supply       | 首个结果后 14–30 天      |
| Repeat Transaction  | 首次履约后 30–60 天      |
| Creator Retention   | 30 / 60 / 90 天          |
| TAC Retention       | M1 / M2 / M3             |
| Creator Referral    | 首次价值发生后 30–60 天  |

窗口必须根据 Event 周期、Service 周期和 Creator 供给频率分层。

## 15. Measurement Rules

1. 以 Creator 和 Buyer 为分析单位，不以页面次数为单位；
2. 报告分母和分子；
3. 报告样本量；
4. 报告中位数、P25、P75，必要时报告均值；
5. 将 Concierge 与 Self-serve 分开；
6. 将主样本与对照组分开；
7. 将 Creator-owned Demand 与 Platform-acquired Demand 分开；
8. 将付款、确认、外部成交和估计成交分开；
9. 将新 Creator 与既有 Creator 分开；
10. 把人工时间计入成本；
11. 不用总 GMV 掩盖 Creator 分布；
12. 不因单个成功案例宣布 PMF；
13. 不在实验开始后任意改变成功门槛；
14. 结果必须记录限制条件。

## 16. Decision Records

### D-12-01 — PMF Evidence Standard

**Decision**：PMF 以持续、重复、跨 Cohort 的行为证据判断，不以口头偏好或单一指标判断。  
**Reason**：项目价值来自商业工作流与交易，而不是页面喜欢度。  
**Revisit Trigger**：产品转为纯展示或纯 SaaS，交易不再是核心价值。

### D-12-02 — PMF Sides

**Decision**：分别评估 Creator PMF、Consumer PMF、Commerce PMF 和 Platform / Business Fit。  
**Reason**：供给方、需求方、交易关系和平台经济不是同一个问题。  
**Revisit Trigger**：项目只服务单侧或商业模式完全改变。

### D-12-03 — Workflow PMF

**Decision**：Creator Workflow PMF 是判断基础设施价值的核心维度。  
**Reason**：持续发布、接单、履约和更新比一次性页面更能区分产品类型。  
**Revisit Trigger**：交易完全由外部系统承接，平台只提供静态身份。

### D-12-04 — Evidence Hierarchy

**Decision**：采用 Level 0–8 证据阶梯，Level 5 以上才作为强商业证据。  
**Reason**：发布和分发是必要但不充分，重复交易、留存和 Referral 更强。  
**Revisit Trigger**：核心价值从交易转为其他已验证行为。

### D-12-05 — PMF Stages

**Decision**：使用 Pre-PMF、Emerging PMF、Strong PMF 三阶段，而不使用单一 PMF 开关。  
**Reason**：项目需要区分早期采用、重复交易和可规模化商业。  
**Revisit Trigger**：产品进入成熟市场且拥有足够长期数据。

### D-12-06 — TAC Retention

**Decision**：将 Transaction Active Creator Retention 作为核心留存指标。  
**Reason**：持续登录或维护页面不等于持续产生商业结果。  
**Revisit Trigger**：收入模式转为不依赖交易的 SaaS。

### D-12-07 — Threshold Discipline

**Decision**：PMF 阈值必须预先定义，按 Cohort、Segment、Primitive 和时间窗口报告。  
**Reason**：防止事后移动门槛和头部 Creator 偏差。  
**Revisit Trigger**：样本量或交易周期使当前阈值统计上不稳定。

### D-12-08 — Failure Interpretation

**Decision**：失败结果先定位漏斗断点，再决定修改 Product、Message、Channel、Wedge 或 Business Model。  
**Reason**：没有交易可能来自多种不同根因。  
**Revisit Trigger**：同一核心假设在足够样本和多种修正后仍失败。

### D-12-09 — Product vs Business PMF

**Decision**：Product PMF 与 Business PMF 分开判定。  
**Reason**：有人持续使用不等于平台能够以可持续成本获客和服务。  
**Revisit Trigger**：收入主要来自非交易 SaaS 或其他模式。

### D-12-10 — Validation Log

**Decision**：所有 Experiment Result 必须进入 Experiment Log，并关联 Decision Impact。  
**Reason**：保持 Observation → Decision → Product Evolution 闭环。  
**Revisit Trigger**：实验数量或产品成熟度需要独立数据系统替代文档日志。

## 17. Revisit Triggers

### Product

- Published Rate 低；
- Distributed Rate 低；
- Primitive 创建异常率高；
- Storefront 有访问但无商业动作；
- Creator 不会创建第二项供给。

### Commerce

- First Transaction 低；
- 支付和确认摩擦高；
- Repeat Transaction 低；
- 交易集中于一次性 Event；
- 履约争议高。

### Creator Workflow

- Repeat Supply 低；
- Creator 只在团队协助下使用；
- Creator 留存与交易无关；
- Creator 将所有复购迁移平台外；
- Creator 不愿推荐同行。

### GTM

- 非 Founder 渠道无法产生 Transaction Active Creator；
- CAC 只能依赖永久人工；
- Referral 质量低；
- 单一城市或社群无法复制。

### Economics

- Revenue per Active Creator 低；
- Contribution Margin 负且无改善路径；
- Creator CAC 无 Payback；
- Take Rate 破坏分发或留存；
- Platform-acquired Demand 才能成交但成本过高。

## 18. Explicit Non-goals

本阶段不做：

- 用 NPS、满意度或问卷单独宣布 PMF；
- 用单个头部 Creator 的 GMV 宣布 PMF；
- 用平台总 GMV 替代 Creator 分布分析；
- 在没有重复交易时建设 Marketplace；
- 在没有 Creator Retention 时扩大 Paid Acquisition；
- 在没有 Economic PMF 时承诺规模化；
- 以“用户说喜欢”替代付款、履约和复购；
- 为了达到阈值而补贴虚假交易；
- 隐藏失败 Cohort；
- 事后任意调整成功门槛；
- 将产品 PMF 自动等同于 Business PMF；
- 将一次性 Event 的季节性购买自动等同于 Buyer Repeat。

## 19. Open Questions

进入 `13 Competitive Landscape` 或 `14 MVP PRD` 前仍需通过 Experiment 解决：

1. 首轮最稳定的核心 Primitive；
2. First Transaction 的最低确认标准；
3. 付费完成与 Creator 确认的取舍；
4. Repeat Supply 的合理时间窗口；
5. 舞者不同 Segment 的 TAC Retention；
6. Buyer Repeat 与 Creator Repeat 哪个更早出现；
7. 何种交易周期适合 M1 / M2 / M3；
8. Concierge 成本何时必须退出；
9. 何种经济结果足以进入 Cohort 3；
10. 何时将 Platform-acquired Demand 纳入 PMF；
11. 哪些跨垂直结果可以证明抽象迁移；
12. 哪些失败会触发 Wedge Pivot 而不是 Product Iteration。

## 20. Frozen PMF Framework

> 本项目不以“用户喜欢”定义 PMF，而以证据阶梯判断：Creator Interest → Published → Distributed → Commerce Activated → First Transaction → Repeat Supply → Repeat Transaction → Creator Retention → Creator Referral。

> PMF 分为 Pre-PMF、Emerging PMF 和 Strong PMF。分别评估 Creator PMF、Consumer PMF、Commerce PMF、Creator Workflow PMF 和 Platform / Business Fit。核心留存指标是 Transaction Active Creator Retention，而非普通登录或注册留存。

> 每个 Experiment 必须经过 Experiment → Evidence → Interpretation → Decision → Document Update。失败首先定位漏斗断点，只有在足够样本、多个 Cohort 和合理修正后仍无强证据，才触发 Wedge Pivot 或 Stop。产品 PMF 与 Business PMF 必须分开判定。
