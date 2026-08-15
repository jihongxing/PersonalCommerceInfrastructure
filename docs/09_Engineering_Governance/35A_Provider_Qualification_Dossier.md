# 35A — Provider Qualification Dossier

> **Track**：External Constraint / Provider-specific Adapter Qualification  
> **状态**：Active — does not block VS-02 productization or Provider-neutral build  
> **建立日期**：2026-08-14  
> **实现授权**：None

## 1. Gate Question

Gate 0C 不再回答“微信支付还是支付宝”，而回答：

> 哪一个中国 Creator Settlement Infrastructure 能够在真实的 Creator Service Commerce
> 场景中，完成 Creator 入驻、Customer 支付、Platform Fee、延迟结算、Creator Earnings、
> 退款、争议处理和提现？

候选必须同时满足：

```text
Creator onboarding
→ recipient / sub-merchant account
→ customer payment
→ platform fee
→ settlement / split
→ creator earnings
→ refund / reversal
→ withdrawal
```

公开通用能力只能建立候选，不能替代 Provider 针对本业务结构的产品、商务、合同、工单或
合规确认。

## 2. Three Qualification Gates

Gate 0C 只有在以下三个子门全部达到 `Confirmed` 后才能通过：

| Sub-gate | Question | Required result |
| --- | --- | --- |
| Gate 0C-1 — Business Model Eligibility | 舞蹈私教等 Creator Service Commerce 是否属于 Provider 可承载的业务类别？ | Provider 明确确认 Seller、平台角色、业务类别、资质和 Pilot 规模 |
| Gate 0C-2 — Money Flow Eligibility | CNY 399 的钱如何支付、冻结、扣费、分账、结算、退款和提现？ | Provider 明确确认资金路径、Platform Fee、Creator Net、回退和责任 |
| Gate 0C-3 — Operational Eligibility | 5–10 个 Creator Pilot 能否按该结构实际进件、收款、结算和提现？ | Provider 明确确认资料、审核、时效、操作、失败处理和账户限制 |

批准规则：

```text
Business Model Eligibility = Confirmed
        AND Money Flow Eligibility = Confirmed
        AND Operational Eligibility = Confirmed
        AND 至少一个 Provider 支持 CNY 399 Service Commerce Pilot
        ⇒ D-MCL-01 可进入 Approved 评审
```

任一关键问题为 `Unknown — Blocking`、`Rejected`，或仅有通用公开文档而没有本业务结构的
Provider-specific 确认，选定 Provider Adapter 和 Controlled Real-money Pilot 必须保持
`Pending`；VS-02 产品化与 Provider-neutral Build 不受阻塞。

## 3. Qualification Status

| Capability | WeChat Pay | Alipay | Evidence state |
| --- | --- | --- | --- |
| Creator onboarding | `Candidate` — 小微/特约商户进件能力存在；目标业务与平台分类未确认 | `Candidate` — 个人/企业认证与第三方应用入口存在；目标商户路径未确认 | `Unknown — Blocking` |
| Natural-person Creator | `Candidate` — 小微商户资料和个人接收方能力有公开线索；小微进件灰度且电商平台限制需核验 | `Candidate` — 个人商户实名认证入口存在；线上服务卖家/收款资格未证实 | `Unknown — Blocking` |
| Individual-business Creator | `Candidate` — 特约商户进件支持个体工商户；Service Commerce 适用性未确认 | `Candidate` — 企业类服务商代签约公开资料存在；个体工商户线上结算路径未证实 | `Unknown — Blocking` |
| Sub-merchant / recipient account | `Candidate — Strong` — 平台收付通支持二级商户入驻和二级商户账户 | `Unknown — Blocking` | `Unknown — Blocking` |
| Customer payment | `Confirmed — Product capability` — JSAPI、小程序、Native 等支付产品存在 | `Candidate — Product entry` — WAP、APP、当面付等入口存在 | 业务场景仍需确认 |
| Platform Fee | `Candidate — Strong` — 平台收付通公开支持平台佣金/分账 | `Candidate` — 服务商协作费不等于订单平台手续费 | `Unknown — Blocking` |
| Delayed settlement | `Candidate — Strong` — 二级商户资金可冻结并按条件解冻 | `Unknown — Blocking` | `Unknown — Blocking` |
| Split / allocation | `Candidate — Strong` — 订单分账和参与方分账能力存在 | `Unknown — Blocking` | `Unknown — Blocking` |
| Creator earnings / balance | `Candidate — Strong` — 二级商户余额查询和结算资金路径存在 | `Unknown — Blocking` | `Unknown — Blocking` |
| Withdrawal | `Candidate — Strong` — 官方文档描述二级商户余额提现 | `Unknown — Blocking` | `Unknown — Blocking` |
| Refund before settlement | `Candidate` — 官方存在退款、补差和冻结资金规则；本 Service 路径未确认 | `Unknown — Blocking` | `Unknown — Blocking` |
| Refund after settlement / reversal | `Unknown — Blocking` — 接收方类型、回退条件和责任需确认 | `Unknown — Blocking` | `Unknown — Blocking` |
| Dispute / chargeback | `Unknown — Blocking` | `Unknown — Blocking` | 必须书面确认 |
| Negative balance / recovery | `Unknown — Blocking` | `Unknown — Blocking` | 必须书面确认 |
| KYC / merchant onboarding owner | `Candidate` — Provider/服务商进件资料存在 | `Candidate` — 开放平台认证与服务商代签约资料存在 | 本项目 owner 未确认 |
| Server-side payment fact | `Candidate — Strong` — 回调/查单官方指引存在 | `Candidate` — API/回调能力存在，但具体支付产品事件未确认 | 必须绑定最终产品 |
| Creator Service Offering eligibility | `Unknown — Blocking` | `Unknown — Blocking` | 两家均需 Provider-specific confirmation |
| Platform Creator Commerce eligibility | `Unknown — Blocking` | `Unknown — Blocking` | 两家均需 Provider-specific confirmation |

### Qualification rule

任一影响 Seller、资金路径、Platform Fee、Settlement、Refund、Dispute、Negative Balance、
Withdrawal 或 Service Commerce 适用性的字段保持 `Unknown — Blocking`，Provider 不得进入
`Qualified for D-MCL-01`。

## 4. Provider Decision Order

### 4.1 WeChat Pay — Leading Qualification Candidate

当前最值得优先申请产品/商务确认的路径是：

```text
Platform legal entity
→ WeChat service-provider / platform admission
→ Creator sub-merchant onboarding
→ Customer payment
→ Frozen provider funds
→ Platform Fee / split
→ Settlement eligibility after service completion
→ Creator provider balance
→ Creator withdrawal
```

理由：官方“平台收付通”资料同时覆盖二级商户、普通支付、冻结/解冻、分账、平台佣金、
退款、余额查询和提现等能力，已形成最接近本项目目标的候选组合。

但下列问题仍必须由微信支付产品/商务/行业解决方案确认：

- 一对一舞蹈私教是否属于该产品允许的线上 Service Offering；
- 平台应被归类为电商平台、SaaS 服务商、普通服务商或其他类型；
- Creator 应使用自然人、小微商户、个体工商户还是其他商户形态；
- 平台收付通的二级商户与该 Creator Service 场景能否同时使用；
- Platform Fee 的收取主体、费率、扣取时点、分账上限和会计凭证；
- 个人接收方与商户接收方在退款、分账回退和负余额恢复上的差异；
- Creator 无法履约或客户争议时的退款、冻结、追偿和责任主体；
- Creator 余额、提现、失败重试、账户限制和注销后的资金处理；
- 首批 5–10 个 Creator Pilot 是否可以按该结构进件。

### 4.2 Alipay — Required Second Qualification Track

支付宝不能由微信能力类推。必须单独确认：

- 第三方应用 / 支付服务商是否支持平台型 Creator Service Commerce；
- Creator 是否可以作为自然人或个体工商户卖家/收款主体；
- 是否存在子商户、收款账户或等价 Creator Account；
- Customer 支付后能否按平台规则扣取 Platform Fee；
- 是否支持延迟结算、分账、Creator Earnings 和主动提现；
- 退款发生在结算前、结算后时分别如何处理；
- Dispute、Chargeback、负余额与资金追偿由谁承担；
- 支付成功回调、结算事件、提现事件和账户限制事件能否作为可信事实源。

支付宝公开的第三方应用、支付服务商、个人/企业认证和部分支付接入资料，只能证明生态
入口存在，不能证明上述组合已通过本项目业务资格审查。

## 5. Required Provider Confirmation Package

每个 Provider 至少需要返回一份可留档的确认包：

1. 推荐产品名称与业务分类；
2. 平台主体资格和 Creator Seller / Sub-merchant 资格；
3. Customer 支付方式与适用终端；
4. Platform Fee / Split / Delayed Settlement 规则；
5. Provider Fee、结算时间、余额状态和提现规则；
6. 退款前后、分账回退、争议、拒付、欺诈与负余额处理；
7. KYC/KYB 资料清单、数据责任和审核时长；
8. 回调、查单、对账和事件幂等要求；
9. Provider 合同、产品审核、商务邮件、工单或正式书面确认；
10. 首批 5–10 Creator Pilot 的准入限制和人工操作要求。

## 6. Provider Qualification Outreach Pack

以下问题应以同一份业务说明分别发送给微信支付和支付宝的产品、商务或行业解决方案团队，
不得只询问“是否支持 Creator 收款”。本节是问题包，不是 Provider 回复，也不构成资格确认。

### 6.1 Common Business Context

```text
We are building a Mainland-China Creator Commerce Platform.
Initial product: a one-time 1:1 dance lesson sold by an independent Creator to an individual Customer.
Example order: CNY 399.
The platform provides Creator Commerce Identity, Service Offering, Order, fulfillment records,
Platform Fee, Settlement Orchestration and a Creator Earnings Ledger / Wallet UX.
The platform does not intend to build an unregulated stored-value pool.
Pilot size: 5–10 Creators, one Service Offering per Creator initially.
```

### 6.2 Gate 0C-1 — Business Model Eligibility Questions

1. Can this `Creator Service Commerce` model be accepted under the Provider's platform,
   service-provider, sub-merchant or equivalent product?
2. Is a one-time online or offline 1:1 dance lesson an eligible business category?
3. What is the required role of the platform: e-commerce platform, ordinary service provider, SaaS
   provider, agent/intermediary, merchant or another category?
4. Who must be the Seller / Merchant: the Creator, the platform, an individual business, an
   institutional settlement partner or another entity?
5. Can a natural-person Creator be onboarded for this exact service category?
6. Can an individual-business Creator be onboarded for this exact service category?
7. Does the platform need ICP, EDI, industry, operating, tax, or other special qualification?
8. Can 5–10 Creators be onboarded for a controlled Pilot under the same product path?
9. Are there restrictions on Creator location, Customer location, service delivery location, or
   online/offline fulfillment?

### 6.3 Gate 0C-2 — Money Flow Eligibility Questions

1. For a CNY 399 order, who receives the Customer payment first?
2. Can Provider funds be frozen or held pending a service-completion condition?
3. Can the Provider deduct a Platform Fee from the same transaction?
4. Can the Provider deduct Provider Fees and calculate Creator Net Earnings in the same flow?
5. Can the Provider split or allocate funds to the Creator and platform under the approved roles?
6. When does the Creator balance become `Pending`, `Available`, `Restricted`, or `Withdrawable`?
7. Is the Creator balance a Provider account balance, a sub-merchant balance, a settlement account,
   or another account type?
8. Can the platform query balance and settlement status without becoming the owner of Creator funds?
9. What happens when the Customer requests a refund before settlement?
10. What happens when the Customer requests a refund after settlement?
11. If the Creator is a natural person, can a completed split be reversed or recovered?
12. If reversal is restricted for a personal recipient, what is the supported recovery mechanism?
13. Who owns refund, dispute, fraud, chargeback, negative-balance and recovery responsibility?
14. Can the Creator initiate withdrawal, and what are the limits, fees, timing and failure states?
15. Which Provider callbacks, queries, settlement records and withdrawal records can be used as
    trusted server-side facts?

### 6.4 Gate 0C-3 — Operational Eligibility Questions

1. What exact KYC/KYB documents are required for each Creator type?
2. Who collects, verifies and stores those documents?
3. What is the normal and exceptional onboarding review time?
4. After approval, how soon can the Creator accept an order and receive payment?
5. Does each Creator need a separate Provider account, sub-merchant account, settlement account,
   bank account or wallet account?
6. How does the Creator bind or change a withdrawal account?
7. Can the Creator withdraw voluntarily after funds become available?
8. How are Payment Failed, Creator Declined, Creator Unable to Fulfill, Refund, Dispute and
   Provider Account Restricted handled operationally?
9. What happens to pending orders and Creator balances when an account is restricted, suspended or
   terminated?
10. Can the platform reconcile payment, fee, split, settlement, refund and withdrawal events by a
    stable Provider identifier?
11. Can a 5–10 Creator Pilot operate with documented manual review or support steps?
12. What customer support and escalation channel is available during the Pilot?

### 6.5 Provider Response Record

For each Provider, every answer must be recorded with:

```text
Provider:
Product / Contract:
Provider contact or channel:
Question ID:
Answer:
Evidence type: Official documentation / Product review / Contract / Ticket / Email / Other
Evidence reference:
Confirmation date:
Scope limitation:
Status: Confirmed / Candidate / Rejected / Unknown — Blocking
Owner:
```

No verbal or generic sales statement is sufficient for a `Confirmed` result unless the Provider
confirms the exact business scope and the confirmation is retained in an auditable record.

### 6.6 External Outreach Letters

以下三封问题信应分别发送给微信支付和支付宝。每一轮只解决一个资格问题，避免用完整
产品故事替代 Provider 对具体业务 Case 的判断。

#### Letter 1 — Business Model Eligibility

**Subject**：中国大陆 Creator Service Commerce（CNY 399 舞蹈私教）业务资格确认

```text
您好，我们正在建设一个面向中国大陆市场的 Creator Commerce Platform。

首个受控 Pilot Case 如下：

- Creator：独立舞者 / 舞蹈老师；
- Customer：中国大陆个人消费者；
- Service：一次性一对一舞蹈私教；
- Price：CNY 399；
- Pilot：5–10 位 Creator；
- Platform：提供 Creator Commercial Identity、Service Offering、Order、Payment、
  Fulfillment Record、Settlement Orchestration、Platform Fee 和 Creator Earnings Ledger；
- Creator：希望通过贵方支持的商户 / 子商户 / 收款或结算账户获得净收入并提现；
- Platform：不自建无监管储值资金池。

请确认：

1. 该 Creator Service Commerce 业务类别是否可以使用贵方的具体产品或模式？
2. 一次性线上或线下一对一舞蹈私教是否属于允许的交易场景？
3. Creator 可以采用自然人、个体工商户还是必须采用其他主体？
4. 平台应被认定为电商平台、普通服务商、SaaS 服务商、代理/中介、商户或其他角色？
5. 平台和 Creator 分别需要哪些营业、ICP、EDI、行业、税务或其他资质？
6. 5–10 位 Creator 是否可以按同一产品路径进行受控 Pilot？
7. Creator、Customer、服务地点和线上/线下履约是否存在地域或场景限制？

请提供：

- 推荐产品名称和业务分类；
- 适用主体类型；
- 必需资质清单；
- 不能适用的限制；
- 可引用的官方产品文档、产品审核结果、工单或书面确认。
```

**本轮输出**：`Business Model Eligibility = Confirmed / Candidate / Rejected / Unknown — Blocking`

#### Letter 2 — Money Flow Eligibility

**Subject**：CNY 399 Creator Service Commerce 资金路径、分账与退款资格确认

```text
基于上一轮业务资格 Case，请确认以下 CNY 399 资金路径：

Customer pays CNY 399
    → Provider payment / settlement infrastructure
    → Provider Fee（如有）
    → Platform Fee（平台必须收取服务费）
    → Creator Net Earnings
    → Provider-backed Creator Settlement Account / Balance
    → Creator Withdrawal

请逐项确认：

1. Customer 付款首先进入谁控制的账户或余额？
2. 是否支持订单资金冻结或延迟结算？触发条件是什么？
3. Platform Fee 是否可以从同一笔交易中扣取？由谁收取、如何记录？
4. Provider Fee、Platform Fee 和 Creator Net 是否可以在同一结算流程中计算并执行？
5. 是否支持向 Creator 和平台进行分账 / 分配？
6. Creator 的资金何时处于 Pending、Available、Restricted、Withdrawable 状态？
7. Creator 账户是二级商户、收款账户、结算账户、Provider Balance 还是其他类型？
8. Customer 在结算前退款时，资金如何回退？谁可以发起？谁承担？
9. Customer 在结算后退款时，资金如何回退？
10. 如果 Creator 是自然人，已完成分账是否可以回退或追偿？
11. 如果自然人分账回退受限，推荐的合规替代路径是什么？
12. 如果 Creator 是个体工商户，退款、回退和负余额处理是否不同？
13. Dispute、Chargeback、欺诈、无法履约和负余额分别由谁负责？
14. Creator 如何提现？提现限额、手续费、到账时效和失败状态是什么？
15. 哪些支付、分账、结算、退款、余额和提现事件可以作为平台的可信服务端事实？

请提供：

- 完整资金流图或产品流程说明；
- 分账、冻结、结算、退款、回退和提现规则；
- 个人与个体工商户差异；
- 责任边界和限制；
- 官方文档、合同、工单或正式书面确认。
```

**本轮输出**：`Money Flow Eligibility = Confirmed / Candidate / Rejected / Unknown — Blocking`

#### Letter 3 — Operational Eligibility

**Subject**：5–10 位 Creator CNY 399 Pilot 的进件、开通、结算和提现操作确认

```text
基于前两轮确认的产品路径，请确认一个 5–10 位 Creator 的受控 Pilot 如何实际开通。

请逐项说明：

1. 自然人 Creator 和个体工商户 Creator 分别需要哪些 KYC/KYB 资料？
2. 谁收集、审核和保存这些资料？
3. 正常审核和异常审核分别需要多久？
4. 审核通过后，Creator 多久可以接受 CNY 399 订单？
5. 每位 Creator 是否需要单独的 Provider 账户、二级商户、结算账户、银行卡或余额账户？
6. Creator 如何绑定、修改和验证提现账户？
7. Creator 是否可以主动提现？最低金额、频率、手续费和到账时间是多少？
8. Payment Failed、Creator Declined、Creator Unable to Fulfill、Refund、Dispute 和
   Provider Account Restricted 分别如何处理？
9. Provider 账户被冻结、限制或关闭时，未完成订单和 Creator 余额如何处理？
10. 平台能否通过稳定的 Provider ID 对 Payment、Fee、Split、Settlement、Refund 和
    Withdrawal 进行对账？
11. Pilot 是否需要人工审核、人工提现、人工退款或 Provider 客服介入？
12. Pilot 的正式支持联系人、工单渠道、升级时效和生产开通步骤是什么？

请提供：

- 进件资料清单；
- 审核和开通时效；
- 提现、退款、限制和失败恢复流程；
- Pilot 操作手册或支持说明；
- 产品、商务、合同、工单或正式邮件确认。
```

**本轮输出**：`Operational Eligibility = Confirmed / Candidate / Rejected / Unknown — Blocking`

### 6.7 Qualification Evidence Classification

Provider 回复必须按以下规则记录：

| Status | Definition | Can satisfy Gate 0C? |
| --- | --- | --- |
| `CONFIRMED` | Provider 官方明确确认，且范围覆盖本项目 CNY 399 Creator Service Commerce Case | Yes |
| `CANDIDATE` | Provider 表示理论上可行，但仍需产品、商务、审核、合同或具体进件确认 | No |
| `REJECTED` | Provider 明确表示不支持，或业务类别 / 主体 / 资金路径不符合 | No |
| `UNKNOWN — BLOCKING` | 没有明确答案、答案泛化、仅口头推测或证据范围不覆盖本 Case | No |

以下内容不能单独产生 `CONFIRMED`：

- 客户经理口头表示“应该可以”；
- 通用支付 API 文档；
- 与电商实物、游戏分账或线下收款不同场景的资料；
- 搜索结果、第三方文章或未经 Provider 确认的二手材料；
- Provider 说“可以申请”，但未确认最终业务资格和责任边界。

### 6.8 Evidence Update Protocol

外部回复到达后，只更新本节和 `## 9. Current Decision`，不修改 34 Provider-neutral Model。
35 PRD、36 Governance Delta 与 Provider-neutral Build 已由 D-MCL-GATE-01 解除阻塞。

每一条回填必须包含：

```text
Provider:
Round: Business / Money Flow / Operational
Question ID:
Raw answer summary:
Normalized answer:
Status:
Evidence reference:
Scope limitation:
Follow-up required:
Recorded by:
Recorded date:
```

## 8. Required Decision Output

Gate 0C 通过时，必须从以下结构中选择一个已被 Provider 资格确认的方案：

```text
Direct Creator Settlement
Institution-mediated Settlement
Provider Sub-merchant / Platform Settlement
```

并明确：

```text
Seller / Merchant
Platform legal role
Provider and product
Provider account / sub-merchant model
Customer payment path
Platform Fee rule
Settlement trigger
Creator Earnings Ledger mapping
Available balance rule
Withdrawal capability
Refund / reversal owner
Dispute / chargeback owner
Negative balance owner
KYC owner
Pilot constraints
```

## 9. Current Decision

```text
WeChat Pay: Leading Qualification Candidate — Not Qualified Yet
Alipay: Required Qualification Candidate — Not Qualified Yet
Provider-specific Adapter Decision: Pending
External Qualification: Active — Awaiting Provider Responses
35 VS-02 PRD: Frozen
36 Engineering Governance Delta: Frozen
Provider-neutral Payment / Settlement / Ledger / Wallet / Withdrawal Build: Authorized
Real Provider Adapter / Real-money Pilot: Blocked pending qualification evidence
```

当前动作已经从内部研究切换为外部 Provider Qualification Outreach。Provider 资格只约束
Provider Adapter 与真实资金 Pilot；它不阻塞已冻结的 VS-02 产品化与 Provider-neutral
工程实现。

## 10. Parallel Preparation Without Decision Dependency

以下准备项不构成 Provider 资格假设，不会越过 Gate 0C，也不授权产品或工程实现。

### 10.1 Provider Response Intake

所有外部回复统一经过：

```text
Evidence → Scope → Status → Gap → Next Question
```

只允许使用：

```text
CONFIRMED
CANDIDATE
REJECTED
UNKNOWN — BLOCKING
```

外部回复不得凭印象直接转为产品决策；必须保留原始证据、适用范围和 Provider 限制。

### 10.2 Pilot Business Case

未来第一笔真实交易的业务样本先固定为：

```text
Creator: Independent dancer / dance teacher
Service: 1v1 dance lesson
Price: CNY 399
Duration: 60 minutes
Location: Shanghai or online, subject to Provider confirmation
Customer: Mainland-China individual consumer
Cancellation: Pending D-MCL-01
Refund: Pending Provider money-flow confirmation
Platform Fee: Mandatory; rate and collection pending D-MCL-01
Creator Net: Pending Provider settlement formula
Pilot Size: 5–10 Creators
```

该 Case 仅用于 Provider Qualification Outreach、后续 Decision Review 和未来 PRD 输入，
当前不公开、不收款、不申请真实 Creator 账户，也不启动运营。

### 10.3 D-MCL-01 Decision Review Trigger

收到首批 Provider 正式回复后，直接进入 Decision Review，不重新开启一轮宏观产品推演。

Review 只判断：

```text
Business Eligibility
+ Money Flow Eligibility
+ Operational Eligibility
→ Approved / Conditional Approval / Rejected
```

其中：

- `Approved`：至少一个 Provider 对 CNY 399 Service Commerce Pilot 的三道资格门均为
  `CONFIRMED`，且责任和资金路径无未解释的阻塞项；
- `Conditional Approval`：Provider 明确可行，但必须先满足已知条件，例如个体工商户、
  特定平台资质、特定结算机构或限定 Pilot 范围；条件必须可执行、可验证并被产品最高负责人
  明确接受；
- `Rejected`：当前业务结构没有可接受的 Provider 路径；转向已定义的其他 Settlement
  Infrastructure 候选，不回到支付 API 猜测。

## 11. Official Evidence Index

核对日期：2026-08-14。

- 微信支付《接入模式》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012081931`
- 微信支付《各主体可申请的基础支付权限列表》：
  `https://pay.wechatpay.cn/doc/v3/merchant/4015420731`
- 微信支付《小微商户进件 — 开发接入准备》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012165177`
- 微信支付《特约商户进件 — 产品介绍》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012062365`
- 微信支付《平台收付通 — 电商交易解决方案》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012086891`
- 微信支付《服务商模式 JSAPI 支付开发指引》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012069859`
- 支付宝开放平台《接入流程》：
  `https://open.alipay.com/platform/accessProcessPage.htm`
- 支付宝开放平台《支付服务商》：
  `https://open.alipay.com/paymentServicer/paymentServicer.htm`
- 支付宝开放平台《第三方应用》：
  `https://open.alipay.com/module/isvApp`
- 巨量星图《个体达人/MCN达人结算》：
  `https://www.xingtu.cn/help-center/author/109200`
- 巨量星图《个体达人提现税务规则介绍》：
  `https://www.xingtu.cn/help-center/author/148107`

## 12. Boundary

本文是 D-MCL-01 的 Provider Qualification 输入，不是法律意见、产品 PRD、支付实现合同
或 Provider 资格证明。不得把公开文档的通用能力升级为本项目的已批准资金结构。
