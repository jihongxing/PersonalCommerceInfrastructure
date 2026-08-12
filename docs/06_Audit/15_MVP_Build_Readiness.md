# 15 — MVP Build Readiness

> 状态：Decision v1  
> 决策日期：2026-08-11  
> 文档角色：开工许可证；将 13 Document Audit 的 P1 Build Blockers 收敛为可执行的 Prototype 与 Pilot 条件  
> 核心问题：我们是否已经足够明确，可以开始构建第一条可运行的 Creator Commerce Vertical Slice？

## 1. Purpose

本文件不是 PRD，也不继续扩展战略。

它只回答：

1. 第一条可运行 Build Slice 是什么；
2. 何种交易模式允许现在开始；
3. 哪些责任、状态和事件必须固定；
4. Cohort 0 / 1 需要满足什么条件；
5. 哪些条件满足后可以进入 Controlled Pilot；
6. 哪些条件满足前禁止 Real-money Public Launch；
7. Codex 是否可以开始构建。

本文件把项目阶段明确切换为：

```text
Build Readiness
→ Controlled Prototype
→ Controlled Pilot
→ Real Transaction Pilot
→ Evidence
→ Decision Revision
```

## 2. Build Readiness Decision

### 2.1 Readiness Status

| 许可层级                    | 状态            | 允许事项                                                       | 禁止事项                                                 |
| --------------------------- | --------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| Controlled Prototype        | **READY**       | 构建页面、创建供给、分享、收集申请、Creator 确认、记录事件     | 平台代收款、自动退款、公开大规模招募                     |
| Cohort 0 / 1 Pilot          | **CONDITIONAL** | 对已筛选 Creator 运行 Concierge、测试分发和 Confirmed Commerce | 未确定城市 / 名单前启动；将确认意向视为 Paid Transaction |
| Real-money Controlled Pilot | **NOT READY**   | 仅在支付、责任、退款、安全和数据条件完成后启用                 | 未完成 P1 条件前收款或收取 Take Rate                     |
| Real-money Public Launch    | **NOT READY**   | 无                                                             | 公众支付、公开交易市场、自动结算、宣传已验证商业模式     |

### 2.2 Frozen Build Decision

> Codex 可以开始构建 Controlled Prototype 的第一条 Vertical Slice。该 Slice 使用 **Shadow Commerce / Confirmed Commerce**，不由平台收款、不计算平台 GMV、不收取 Take Rate。

> 真实付款、平台收入和 Transaction Active Creator 只在 Real-money Controlled Pilot 的准入条件全部满足后启用。

## 3. Current Frozen Decisions

本 Build Slice 必须遵循以下既有 Decision：

| Decision                          | 来源       | Build 含义                                                                     |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| 舞者是主 Wedge                    | 07、08     | 默认 Creator 模板与 Cohort 面向舞者                                            |
| Commerce Identity-first           | 08、09     | Storefront 先表达身份与供给，不是单纯日历                                      |
| Creator-first, Fan-usable         | 08、09、11 | Creator 创建与分享；Buyer 无需浏览注册                                         |
| Transaction-first, SaaS-later     | 08、10     | 产品围绕商业动作与结果，不先卖订阅                                             |
| 统一产品、主垂直加对照组          | 08、09     | 先为舞者构建；不创建舞者专用数据模型                                           |
| Creator 自定义商品                | 08、09     | Creator 选择 Offer 名称与描述；系统强制最小约束                                |
| Calendar 是 Inventory             | 03、08、09 | Availability 服务 Offer，不成为独立产品终局                                    |
| MVP Operating North Star 是 TAC   | 13         | Prototype 使用 Confirmed Commerce 代理；真实 Pilot 使用 Paid Transaction / TAC |
| 第一 Slice 只自动化一个 Primitive | 13         | 不同时开发 Event、Experience、Service 完整闭环                                 |

## 4. Build Blockers

### 4.1 Blocker Status

| P1 Blocker                         | Prototype 状态           | Real-money Pilot 状态 | 本文解决方式                                           |
| ---------------------------------- | ------------------------ | --------------------- | ------------------------------------------------------ |
| 支付 / 结算 / 外部归因             | 已收敛为 Shadow Commerce | 未完成                | 冻结 Prototype Transaction Mode 和升级门槛             |
| 首发城市与 Cohort 名单             | 未完成                   | 未完成                | 冻结筛选标准、人数和名单准入模板；真实姓名不可凭空生成 |
| 履约、取消、退款、安全责任         | Prototype 最小政策已定义 | 真实支付政策未完成    | 冻结 Minimum Commerce Policy                           |
| Event Dictionary / Analytics Owner | 已定义                   | 需在 Pilot 前执行     | 冻结事件字典与角色责任                                 |

### 4.2 Important Constraint

本文档可以冻结决策、政策与准入标准，但不能虚构：

- 首发城市；
- 真实 Creator 姓名；
- Creator 联系方式；
- 实际活动时间；
- 支付提供商；
- 法律实体和税务身份。

这些是执行事实，必须由创始团队在启动 Cohort 前填写并验证。

因此：

> 当前项目通过 **Build Readiness for Controlled Prototype**，但尚未通过 **Pilot Readiness for Real-money Transactions**。

## 5. Blocker Resolution Requirements

### 5.1 Before Controlled Prototype

必须具备：

- 本文定义的 Vertical Slice 01；
- Shadow Commerce 交易状态；
- 最小责任边界；
- Event Dictionary；
- Analytics Owner 角色；
- 内部测试 Creator 或模拟数据；
- 不收款声明；
- 不使用真实敏感 Buyer 数据的测试方式。

### 5.2 Before Cohort 0

必须具备：

- 首发城市；
- 至少 5 位已同意参与的 Design Partner Creator；
- 每位 Creator 至少一个未来 30 天内的真实 Offer；
- 每位 Creator 的分享渠道；
- Creator 参与说明；
- Concierge Owner；
- 数据记录 Owner；
- 首个 Offer 的取消与变更规则；
- Buyer Contact Data 的最小收集说明。

### 5.3 Before Cohort 1

必须具备：

- Cohort 0 结果；
- 已验证的 Creator Setup 路径；
- 已验证的 Creator Distributed 路径；
- 一个可重复的 Share Asset；
- 一个可比较的主 Primitive；
- Creator Prospect → Published → Distributed 的漏斗记录；
- 明确的 Cohort 1 交易观察窗口；
- 不依赖个人记忆的 Experiment Log 更新流程。

### 5.4 Before Real-money Controlled Pilot

必须具备：

- Payment / Settlement Model；
- 平台法律和商业角色审查；
- 退款、取消、No-show 与争议政策；
- Creator 与 Buyer 的必要条款和授权；
- 支付确认与对账方法；
- 平台费率展示方式；
- Personal Data 最小化和访问控制；
- Experience 安全边界；
- 支持与升级联系人；
- 真实 Paid Transaction 与 Confirmed Commerce 的数据分离；
- 贡献毛利成本记录；
- 每日交易异常处理流程。

本文件不提供法律、税务、支付或消费者保护建议。真实收款前必须由具备相应资格的法律、财税和支付专业人士审查当地适用要求。

## 6. Cohort 0 Definition

### 6.1 Purpose

Cohort 0 是 Design Partner Cohort，用于：

- 验证 Creator Setup；
- 验证 Storefront 表达；
- 验证第一个 Offer；
- 验证 Creator Distribution；
- 观察 Confirmed Commerce；
- 记录所有人工步骤；
- 修正 Build Slice 与后续 PRD。

它不用于：

- 证明市场规模；
- 计算可规模化 CAC；
- 宣布 PMF；
- 推出公开支付；
- 开始大规模 Creator Acquisition。

### 6.2 Size

建议：

- 5–8 位舞者；
- 0–1 位 Cosplayer；
- 0–1 位摄影师。

对照组只在主 Slice 可被同一 Schema 表达时纳入。

### 6.3 Design Partner Criteria

每位 Cohort 0 Creator 必须：

1. 未来 30 天内拥有至少一个真实 Offer；
2. 能自行决定至少一种 Offer 或开放至少一个 Inquiry；
3. 拥有一个可直接触达的受众渠道；
4. 同意创建并发布 Storefront；
5. 同意分享至少一次；
6. 同意 Creator 手工确认申请；
7. 愿意提供 30–45 分钟 Concierge 时间；
8. 愿意在 14–30 天内反馈结果；
9. 接受 Prototype 阶段不由平台收款；
10. 不涉及高风险、未定义边界或受强监管交易。

### 6.4 Cohort 0 Roster Template

在启动前将以下表格由创始团队填入。空白名单意味着 Cohort 0 尚未 Ready。

| Creator ID | 名称 / 别名 | 城市 | Segment | 30 天内 Offer | 主 Primitive | 分享渠道 | 自主决策 | 已同意  | Owner |
| ---------- | ----------- | ---- | ------- | ------------- | ------------ | -------- | -------- | ------- | ----- |
| C0-01      | 待填        | 待填 | 待填    | 待填          | Service      | 待填     | 是 / 否  | 是 / 否 | 待填  |
| C0-02      | 待填        | 待填 | 待填    | 待填          | Service      | 待填     | 是 / 否  | 是 / 否 | 待填  |
| C0-03      | 待填        | 待填 | 待填    | 待填          | Service      | 待填     | 是 / 否  | 是 / 否 | 待填  |
| C0-04      | 待填        | 待填 | 待填    | 待填          | Service      | 待填     | 是 / 否  | 是 / 否 | 待填  |
| C0-05      | 待填        | 待填 | 待填    | 待填          | Service      | 待填     | 是 / 否  | 是 / 否 | 待填  |

## 7. Cohort 1 Definition

### 7.1 Purpose

Cohort 1 是 Transaction Validation Cohort，用于：

- 比较 Creator Segment；
- 验证 Creator Published；
- 验证 Creator Distributed；
- 观察 Commerce Action；
- 观察 Confirmed Commerce；
- 在满足条件后测试受控付款；
- 识别 Repeat Supply；
- 对比 Direct、Community、Studio / Crew、Event 渠道。

### 7.2 Size

建议：

- 20–30 位舞者；
- 3–5 位 Cosplayer；
- 3–5 位摄影师。

若 Cohort 0 未完成 Slice Acceptance，不启动 Cohort 1。

### 7.3 Entry Criteria

启动 Cohort 1 前：

- Cohort 0 至少 5 位 Creator Published；
- 至少 3 位 Creator Distributed；
- 至少 3 个 Confirmed Commerce；
- 已发现最常用主 Primitive；
- Creator Setup 的中位人工时间已记录；
- 事件字典在实际使用中可执行；
- 至少一个 Channel 能产生 Qualified Creator；
- Slice Acceptance Criteria 已通过。

### 7.4 Cohort 1 Roster Template

| Creator ID | Channel | Segment | City | Offer | Primitive | Published | Distributed | Commerce Action | Confirmed | Paid | Owner |
| ---------- | ------- | ------- | ---- | ----- | --------- | --------- | ----------- | --------------- | --------- | ---- | ----- |
| C1-01      | 待填    | 待填    | 待填 | 待填  | Service   | 是 / 否   | 是 / 否     | 0               | 0         | 0    | 待填  |
| C1-02      | 待填    | 待填    | 待填 | 待填  | Service   | 是 / 否   | 是 / 否     | 0               | 0         | 0    | 待填  |
| C1-03      | 待填    | 待填    | 待填 | 待填  | Service   | 是 / 否   | 是 / 否     | 0               | 0         | 0    | 待填  |

## 8. Commerce Responsibility Model

### 8.1 Prototype Role

在 Controlled Prototype 中，平台的运营角色是：

> Creator Commerce Workflow Provider：提供身份页、Offer 表达、申请记录、状态记录与 Creator 通知。

Prototype 不应自称或运营为：

- Merchant of Record；
- 票务主办方；
- 雇主；
- 经纪人；
- 保险方；
- 托管方；
- 争议仲裁方；
- Consumer Marketplace。

这是一项产品与运营边界，不构成法律身份结论。

### 8.2 Responsibility Matrix

| 环节                        | Creator                | Platform               | Buyer                     |
| --------------------------- | ---------------------- | ---------------------- | ------------------------- |
| Identity / Offer 信息真实性 | 主责                   | 提供字段与最小审核     | 基于页面决定              |
| 价格、地点、时间与规则      | 主责                   | 结构化展示与记录       | 阅读并确认                |
| Offer 发布与暂停            | 主责                   | 提供操作与状态         | 无                        |
| Commerce Action 提交        | 接收                   | 记录与通知             | 主责提交真实信息          |
| Confirmed Commerce          | 主责确认 / 拒绝        | 记录状态与时间         | 等待结果                  |
| 付款（Prototype）           | Creator / 外部渠道处理 | 不收款、不结算         | 按 Creator 指引完成       |
| 付款（Real-money Pilot）    | 待冻结                 | 待冻结                 | 待冻结                    |
| 履约                        | 主责                   | 记录结果、提供升级入口 | 到场 / 接收服务           |
| 取消与变更                  | 按 Offer 规则处理      | 展示并记录             | 按规则提出                |
| 退款（Prototype）           | Creator / 外部渠道处理 | 不承诺、不处理资金     | 向 Creator / 外部渠道申请 |
| 安全与行为边界              | 主责                   | 设置最低规则与报告入口 | 遵守规则                  |

### 8.3 Creator Requirement

Prototype Creator 必须：

- 对 Offer 的真实性、可用性和履约负责；
- 在可承诺的时间内处理申请；
- 使用明确地点与时间；
- 不发布高风险或非法 Offer；
- 提供至少一条取消或变更规则；
- 不将未确认申请视为已成交；
- 不要求平台处理其外部收款争议。

## 9. Payment / Settlement Model

### 9.1 Prototype Transaction Mode — Shadow Commerce

第一条 Build Slice 采用：

> **Shadow Commerce / Creator-direct Settlement**

流程：

```text
Buyer submits Commerce Action
→ Platform records action
→ Creator confirms or declines
→ Buyer and Creator complete any payment outside the platform
→ Creator / Ops records outcome when known
```

平台在此模式下：

- 不收取 Buyer 资金；
- 不代 Creator 收款；
- 不自动向 Creator 结算；
- 不收取 Take Rate；
- 不把外部付款计入 Platform GMV；
- 不将 Confirmed Commerce 计为 Paid Transaction；
- 只将证据充分的外部付款标记为 `external_paid_verified`。

### 9.2 Transaction Mode Comparison

| 模式                        | 平台收款 | 可计 Platform GMV | 可计 Paid Transaction              | 当前状态                  |
| --------------------------- | -------- | ----------------- | ---------------------------------- | ------------------------- |
| Shadow Commerce             | 否       | 否                | 仅记录外部已验证付款，不计平台 GMV | **Prototype 默认**        |
| External Attribution        | 否       | 否                | 可记录 `external_paid_verified`    | Cohort 0 / 1 可用         |
| Controlled Platform Payment | 是       | 是                | 是                                 | Real-money Pilot 后续候选 |
| Public Marketplace Payment  | 是       | 是                | 是                                 | 明确不进入当前阶段        |

### 9.3 Upgrade Conditions

从 Shadow Commerce 升级到 Controlled Platform Payment 前，必须完成：

- 第 5.4 节全部条件；
- 选择支付提供商；
- 明确法律和结算角色；
- 明确退款责任；
- 明确费用展示；
- 完成至少一个 Primitive 的风险评估；
- 完成最小隐私与数据访问控制；
- 完成真实对账与异常处理演练；
- 获得相关专业审查。

### 9.4 Revenue Recognition Rule

Prototype：

```text
Platform Revenue = ¥0
Platform GMV = ¥0
Take Rate = 0%
```

可记录：

- Commerce Action；
- Confirmed Commerce；
- External Paid Verified；
- Estimated Deal Value（仅供内部研究，不计 GMV）；
- Creator-reported Revenue（单独标记，不计平台收入）。

## 10. Transaction State Definitions

### 10.1 Canonical State Ladder

```text
Draft
→ Published
→ Commerce Action
→ Confirmed Commerce / Declined
→ Paid Transaction
→ Fulfillment Observed
→ Completed / Cancelled
```

### 10.2 Definitions

| 状态 / 事件            | 定义                                               | 可用于                      |
| ---------------------- | -------------------------------------------------- | --------------------------- |
| Draft                  | Offer 尚未公开                                     | Creator Setup               |
| Published              | Storefront 或 Offer 对外可见且具备商业动作         | Creator Published           |
| Commerce Action        | Buyer 提交报名、预约申请、预订、购买意向或 Inquiry | Commerce Activated          |
| Confirmed Commerce     | Creator 接受该具体商业动作，可能仍未付款           | Prototype 代理商业证据      |
| Declined               | Creator 拒绝、Offer 无效或 Buyer 不符合规则        | 漏斗诊断                    |
| Paid Transaction       | 平台内或可验证外部渠道确认收到付款                 | TAC、GMV、Take Rate 的前提  |
| External Paid Verified | Creator / Buyer 提供足够付款证据的外部付款         | 研究指标；不计 Platform GMV |
| Fulfillment Observed   | Creator、Buyer 或 Ops 确认服务 / 活动已实际发生    | PMF 与风险观察              |
| Completed              | 履约结束且无待处理事项                             | Lifecycle 记录              |
| Cancelled              | 在履约前取消，需记录发起方和原因                   | 取消率与政策                |

### 10.3 Metric Eligibility

| 指标                       | 最低状态要求                                   |
| -------------------------- | ---------------------------------------------- |
| Creator Published          | Published                                      |
| Creator Distributed        | Published + 分享证据                           |
| Commerce Activated         | Commerce Action                                |
| Confirmed Commerce Creator | Confirmed Commerce                             |
| Transaction Active Creator | Paid Transaction                               |
| Platform GMV               | Controlled Platform Payment + Paid Transaction |
| Platform Revenue           | 平台实际收取费用                               |
| External Paid Research     | External Paid Verified                         |
| Fulfillment Rate           | Fulfillment Observed / Confirmed Commerce      |
| Repeat Supply              | 新 Offer 或新 Availability 发布                |

## 11. Minimum Commerce Policy

### 11.1 Scope

本政策仅适用于 Controlled Prototype 的主 Primitive：

> 舞蹈私教预约申请（Service Request Booking）。

它不自动适用于：

- Event 票务；
- 限量 Experience；
- 未成年人场景；
- 商演；
- Content Commission；
- 夜间或私人住宅活动；
- 任何平台收款交易。

### 11.2 Allowed Offer

Prototype 首批 Offer 必须：

- 明确描述服务内容；
- 明确时长；
- 明确城市或地点范围；
- 提供可预约日期或申请窗口；
- 指明价格、起价或“确认后报价”；
- 明确 Creator 确认规则；
- 提供取消或改期规则；
- 使用低风险、可观察的履约方式。

### 11.3 Disallowed Offer

Prototype 不允许：

- 不明确边界的私人陪伴；
- 涉及未成年人且无额外保护的线下单独互动；
- 违法、侵权、成人或高风险内容；
- 医疗、法律、金融等受监管服务；
- 平台无法合理记录或判断的现金众筹；
- 多方复杂票务；
- 平台无法确认责任归属的团体服务；
- 需要平台托管、保险或复杂合同才能安全履约的 Offer。

### 11.4 Cancellation and Change

每个 Offer 必须提供：

- 谁可以取消；
- 取消通知方式；
- 最晚通知时间；
- 改期是否允许；
- Creator 取消时的处理方式；
- 外部付款后的退款责任归属。

Prototype 默认：

> 平台只展示并记录规则；Creator 与 Buyer 按 Creator 公布规则及外部支付渠道规则处理款项。

### 11.5 Safety

最低安全要求：

- 地点必须公开、可识别或由双方明确确认；
- Creator 可拒绝任何不符合规则的申请；
- Buyer 不应被要求提交超出交易必要范围的敏感信息；
- 平台提供问题报告入口；
- 对任何安全事件，Ops 先暂停相关 Offer 并记录；
- 高风险或不明确场景默认不进入 Prototype。

## 12. Event Dictionary Requirements

### 12.1 Canonical Events

| Event                          | Trigger                        | Actor                 | Preconditions              | Required Data                           | Business Meaning           | Evidence |
| ------------------------------ | ------------------------------ | --------------------- | -------------------------- | --------------------------------------- | -------------------------- | -------- |
| `creator_registered`           | 创建 Creator 账户              | Creator / Ops         | 无                         | creator_id、timestamp、source           | 获得账户                   | 3        |
| `creator_qualified`            | Creator 满足 ICP 并同意观察    | Ops                   | Prospect 已评估            | creator_id、channel、segment、city      | 合格供给                   | 2–3      |
| `creator_activated`            | 开始 Setup                     | Creator / Ops         | Qualified                  | creator_id、owner、timestamp            | 进入 Onboarding            | 3        |
| `creator_published`            | 公开页有 Offer 和商业动作      | Creator / Ops         | Identity + Published Offer | creator_id、offer_id、primitive         | 可对外交易                 | 3–4      |
| `creator_distributed`          | 分享给真实渠道                 | Creator / Ops         | Published                  | creator_id、channel、asset、timestamp   | Creator-owned Distribution | 4        |
| `storefront_viewed`            | 页面被访问                     | Buyer / System        | Published URL              | creator_id、source、timestamp           | 初步访问                   | 3–4      |
| `commerce_action_submitted`    | Buyer 提交申请                 | Buyer                 | Offer 可用                 | creator_id、offer_id、primitive、source | Commerce Activated         | 5        |
| `commerce_confirmed`           | Creator 接受申请               | Creator / Ops         | Action 已提交              | action_id、creator_id、timestamp        | Confirmed Commerce         | 5        |
| `commerce_declined`            | Creator 拒绝申请               | Creator / Ops         | Action 已提交              | action_id、reason                       | 漏斗损失                   | 5        |
| `external_paid_verified`       | 收到充分外部付款证据           | Creator / Buyer / Ops | Confirmed Commerce         | action_id、proof_type、amount           | 外部付款研究信号           | 6        |
| `payment_confirmed`            | 平台支付确认                   | System                | Platform Payment           | payment_id、amount、currency            | Paid Transaction           | 6        |
| `fulfillment_observed`         | 实际服务或活动已发生           | Creator / Buyer / Ops | Confirmed / Paid           | action_id、method、timestamp            | 履约信号                   | 6–7      |
| `repeat_supply_created`        | 发布新 Offer 或新 Availability | Creator / Ops         | 已 Published               | creator_id、offer_id                    | Workflow Adoption          | 7        |
| `repeat_transaction_completed` | 后续付款交易完成               | System / Ops          | Prior Transaction          | creator_id、buyer_id、action_id         | Repeat Commerce            | 7        |
| `creator_retained`             | 在观察期持续经营               | System / Ops          | 时间窗口结束               | creator_id、window、activity            | Workflow Retention         | 7        |
| `creator_referred`             | Creator 推荐合格 Prospect      | Creator / Ops         | Referral 可验证            | referrer_id、prospect_id                | Organic Growth Signal      | 8        |

### 12.2 Event Rules

1. 每个事件必须有唯一 `creator_id`；
2. 与供给相关的事件必须有 `offer_id` 与 `primitive`；
3. 与商业动作相关的事件必须有 `action_id`；
4. 所有时间使用统一时区和不可变时间戳；
5. 手工事件必须标明 `recorded_by` 与 `evidence_source`；
6. `external_paid_verified` 不得自动升级为 `payment_confirmed`；
7. `payment_confirmed` 只用于平台实际确认的付款；
8. 每个事件必须可关联 Acquisition Channel 和 Distribution Source；
9. 未经证据支持的 Creator 口头描述必须标记为 self-reported；
10. 不收集非交易必需的敏感个人信息。

## 13. Analytics Ownership

### 13.1 Roles

| 角色                          | 责任                                                   |
| ----------------------------- | ------------------------------------------------------ |
| Product Owner                 | 拥有指标定义、North Star、状态语义和 Decision 回写     |
| Engineering Owner             | 实现系统事件、数据质量检查、事件版本控制               |
| Pilot Operations Owner        | 记录 Concierge、外部分享、人工确认、外部付款与履约证据 |
| Business Owner                | 记录 Creator 收入、费用、成本、退款和贡献毛利假设      |
| Privacy / Compliance Reviewer | 在真实付款与敏感数据前审查最小数据与责任边界           |

### 13.2 Single Source of Truth

Prototype 阶段：

- `Experiment Log`：Hypothesis、Result、Decision Impact；
- 事件表或受控运营表：原始事件；
- Product Owner：指标定义唯一解释权。

任何仪表板、表格或报告必须引用同一 Event Dictionary。

### 13.3 Ownership Gate

Cohort 0 启动前必须为每个角色填入真实负责人。

未指定 Owner 时：

- 不运行需要人工确认的交易；
- 不记录付款；
- 不宣布任何 PMF 或经济结论。

## 14. Vertical Slice 01

### 14.1 Name

> **VS-01 — Dancer Private Lesson Request**

### 14.2 Why This Slice

选择 `Service Request Booking`，而不是 Event 或 Experience：

- 服务内容和价值较容易描述；
- 一对一私教的 Time、Availability 和确认流程清晰；
- 不需要座位、票种、核销或多人容量；
- 风险低于开放式 Experience；
- 可以测试 Creator Capability → Offer → Request → Confirmation；
- 能迁移到摄影、教练和其他技能型 Creator；
- 仍能承接舞者的核心商业资产。

这不是最终唯一 Primitive，也不意味着项目变成预约 SaaS。

### 14.3 End-to-end Loop

```text
Creator
→ creates Commercial Identity
→ creates one Dance Private Lesson Offer
→ publishes Storefront
→ shares link / QR / card
→ Buyer opens Storefront
→ Buyer submits lesson request
→ Creator confirms or declines
→ both receive confirmation
→ Ops records external payment / fulfillment only when evidenced
→ Creator publishes or updates next supply
```

### 14.4 In-scope Capabilities

#### Creator

- 创建身份；
- 添加舞蹈教学 Capability；
- 创建一项私教 Offer；
- 设置时长、城市 / 地点、价格方式、可预约日期或申请窗口；
- 设置简单取消 / 改期规则；
- 发布和分享；
- 查看申请；
- 确认或拒绝；
- 暂停或更新 Offer。

#### Buyer

- 无账号浏览；
- 阅读 Creator 和 Offer；
- 提交姓名、联系方式、期望日期与必要备注；
- 查看提交状态；
- 收到 Creator 确认或拒绝的下一步说明。

#### Operations

- 查看事件；
- 记录人工确认；
- 记录外部付款证据；
- 记录履约；
- 暂停风险 Offer；
- 导出 Cohort 数据。

### 14.5 Explicitly Out of Scope

- 平台收款；
- 自动结算；
- 平台退款；
- 多时段实时日历；
- 双向即时聊天；
- 自动提醒；
- 多人 Event；
- 限量 Experience；
- 票务核销；
- Business Marketplace；
- 用户评价；
- 推荐算法；
- Membership；
- Merchandise；
- AI；
- 多 Creator 团队账户。

## 15. MVP Build Boundary

### Must Build

```text
Creator Identity
→ One Service Offer
→ Published Storefront
→ Shareable URL / QR
→ Accountless Commerce Action
→ Creator Confirm / Decline
→ Result Status
→ Event Recording
```

### May Be Manual

- Creator Onboarding；
- Offer 文案整理；
- 分享素材生成；
- 外部支付引导；
- 外部付款验证；
- 取消和改期沟通；
- 履约确认；
- Buyer Support；
- 数据导出；
- Creator 反馈。

### Must Not Build

- 完整 Creator OS；
- 全 Primitive Commerce Engine；
- 平台支付；
- Market Discovery；
- Consumer App；
- CRM；
- B2B Matching；
- 自动化财务；
- 大规模 Analytics；
- 多城市运营。

## 16. Build Non-goals

不以以下内容作为 VS-01 成功：

- 完整页面美观；
- 支持所有舞蹈品类；
- Creator 数量；
- Social 平台集成数量；
- 复杂 Calendar；
- 订单自动化程度；
- 平台收入；
- GMV；
- 获得大量 Buyer；
- 覆盖多个城市；
- 证明 Personal Commerce Infrastructure 终局。

VS-01 只验证：

> Creator 能否将一个真实的技能服务结构化、发布、分发，并获得可记录的 Buyer 商业动作与 Creator 确认。

## 17. Prototype Acceptance Criteria

VS-01 在进入 Cohort 0 前必须满足：

### Functional

1. Creator 能创建 Identity；
2. Creator 能创建一个 Service Offer；
3. Offer 必须包含明确商业动作；
4. Storefront 可在未登录状态访问；
5. Buyer 能提交 Request；
6. Creator 能确认或拒绝；
7. Buyer 和 Creator 能看到明确结果；
8. Creator 能更新或暂停 Offer；
9. 所有 Canonical Event 可被记录；
10. 系统明确显示 Prototype 不处理付款。

### Data

1. 每个 Request 关联 Creator、Offer、Primitive、Channel 和时间；
2. Confirmed Commerce 与 Paid Transaction 不混写；
3. 手工事件可标记证据来源；
4. 能按 Creator 导出完整漏斗；
5. 能按 Channel 导出 Published、Distributed 和 Confirmed Commerce；
6. 能按 Cohort 导出结果。

### Operations

1. Concierge Owner 能在一次 Session 内完成 Creator 发布；
2. Ops 能手工处理至少一个 Request；
3. Ops 知道何时暂停 Offer；
4. Creator 能理解“申请不等于已付款或已确认”；
5. Buyer 能理解付款由 Creator 或外部渠道处理；
6. 所有测试数据可被清理或归档。

### Acceptance Test

在内部或模拟 Creator 测试中，连续完成至少 3 次：

```text
Create Offer
→ Publish
→ Open externally
→ Submit Request
→ Confirm / Decline
→ Record Result
```

无 P0 数据混淆、状态丢失或责任不明确问题。

## 18. Pilot Readiness Criteria

### Cohort 0 Ready

只有同时满足才启动：

- VS-01 Acceptance Test 通过；
- 已填写至少 5 位真实 Design Partner；
- 已冻结首发城市；
- 每位 Creator 有 30 天内 Offer；
- 每位 Creator 有分享渠道；
- 角色 Owner 已指定；
- Minimum Commerce Policy 已向 Creator 解释；
- Experiment Log 的 E-09-01、E-09-02、E-11-01、E-11-02、E-11-06 已设为 Ready；
- 不收款与外部付款边界已明确。

### Cohort 1 Ready

只有同时满足才启动：

- Cohort 0 已产生 Creator Published、Distributed 和 Confirmed Commerce 证据；
- 主 Primitive 已确认仍是 Service 或有明确更优替代；
- Onboarding 流程已改进；
- Event Dictionary 已在 Cohort 0 使用；
- 负责人能稳定更新 Experiment Log；
- 至少一个 Acquisition Channel 可重复获得 Qualified Creator；
- Cohort 1 名单、时间窗口与观察指标已冻结。

### Real-money Controlled Pilot Ready

只有同时满足才启动：

- Cohort 1 已产生足够 Confirmed Commerce；
- Payment / Settlement 与责任政策获得专业审查；
- 平台可以准确区分 Paid、Refunded、Cancelled；
- 付款、结算和退款异常已演练；
- 费率、支付成本与贡献毛利可记录；
- Buyer / Creator 提示和条款已就绪；
- 高风险 Offer 已排除；
- Support Owner 已指定；
- 平台不以未验证的功能或保障进行宣传。

## 19. Decision Records

### D-15-01 — Prototype Transaction Mode

**Decision**：VS-01 使用 Shadow Commerce / Creator-direct Settlement。  
**Reason**：先验证 Creator Commerce Loop，避免在支付、结算和退款未准备时处理资金。  
**Revisit Trigger**：Confirmed Commerce 无法有效预测真实付款，且 Real-money Pilot 条件已经满足。

### D-15-02 — First Primitive

**Decision**：第一条完整自动化链选择舞蹈私教 Service Request Booking。  
**Reason**：能以最低复杂度验证 Capability、Time、Availability、Request 和 Confirmation。  
**Revisit Trigger**：Cohort 0 显示 Event 或 Experience 显著更容易获得 Confirmed Commerce，且风险可控。

### D-15-03 — Transaction Vocabulary

**Decision**：Commerce Action、Confirmed Commerce、Paid Transaction、TAC 必须按第 10 节分层记录。  
**Reason**：避免把申请、确认、外部付款和平台收入混为一谈。  
**Revisit Trigger**：新的支付模式增加必要状态。

### D-15-04 — Pilot Responsibility

**Decision**：Prototype 中 Creator 对 Offer、履约、取消和外部付款主责；平台负责表达、记录、通知、最低安全规则和问题升级。  
**Reason**：平台尚未承担资金、托管和 Marketplace 责任。  
**Revisit Trigger**：平台开始收款、托管、提供担保或承担更高履约责任。

### D-15-05 — Cohort Scope

**Decision**：Cohort 0 只使用 5–8 位舞者 Design Partner，Cohort 1 在 Cohort 0 通过后扩展。  
**Reason**：先学习闭环，不以规模掩盖产品问题。  
**Revisit Trigger**：Cohort 0 样本不够覆盖主 Primitive 或无法获得有效商业动作。

### D-15-06 — Build Scope

**Decision**：Codex 只构建 VS-01，不构建完整 MVP 1.0。  
**Reason**：项目需要先验证端到端 Creator Commerce Loop。  
**Revisit Trigger**：VS-01 已通过 Cohort 0，但明确缺少第二项能力才能完成交易。

### D-15-07 — Readiness Gate

**Decision**：当前允许 Controlled Prototype，不允许 Real-money Public Launch。  
**Reason**：支付、城市、Cohort、履约和安全执行事实尚未全部完成。  
**Revisit Trigger**：第 18 节 Real-money Controlled Pilot Ready 条件全部满足。

## 20. Revisit Triggers

重新审视 VS-01 或 Build Boundary 的条件：

- Creator 无法理解私教 Offer；
- Creator 不愿公开或提交 Availability；
- Request 流程不比私信更清晰；
- Creator 不确认申请；
- Buyer 不愿提交最小信息；
- 外部付款无法获取可靠证据；
- 多数真实供给更适合 Event 或 Experience；
- 线下安全或取消问题过多；
- Concierge 时间无法下降；
- 主 Slice 的 Confirmed Commerce 不能预测真实付款；
- 对照组需要独立 Schema；
- Creator 不发生 Repeat Supply。

## 21. Explicit Non-goals

本文件不：

- 选择支付提供商；
- 指定法律实体；
- 声称平台不是或是某种法定支付 / 商业主体；
- 发布公众条款；
- 自动解决退款与消费者纠纷；
- 虚构 Cohort 0 / 1 成员；
- 宣布真实付款已准备就绪；
- 提前收取 Take Rate；
- 把外部付款变成 Platform GMV；
- 要求 Codex 实现所有 Primitive；
- 自动继续创建 PRD 或 Pilot Plan。

## 22. Frozen Build Readiness Verdict

> 项目已具备开始构建 **VS-01 Controlled Prototype** 的条件：舞者可以创建商业身份和一项舞蹈私教 Offer，发布并分享 Storefront，Buyer 可以提交预约申请，Creator 可以确认或拒绝，平台可以记录端到端事件。

> 项目尚未具备启动公开收款或正式交易平台的条件。Cohort 0 的真实城市、Creator 名单和 Owner 必须由创始团队填写；真实付款、结算、退款、责任和合规审查必须在 Real-money Controlled Pilot 前完成。

> 此文档完成后，不应自动新增战略文档。下一步应先填充 Cohort 0 执行事实，构建 VS-01，并以实际 Creator 行为更新 Experiment Log。
