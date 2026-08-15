# 36 — Engineering Governance Delta: VS-01 → VS-02

> **Status**：Frozen  
> **Product Increment**：VS-02 — Paid Service + Earnings  
> **Product Contract**：`35_VS02_Paid_Service_PRD.md`  
> **Upstream Money Model**：`34_Commerce_Pattern_Settlement_and_Wallet_Model.md`  
> **External Constraint Track**：`35A_Provider_Qualification_Dossier.md`  
> **Decision**：D-MCL-GATE-01 — Provider Qualification does not block Provider-neutral VS-02 build  
> **Implementation Authority**：本文件冻结 VS-02 的工程不变量、Adapter 边界、测试证据与运行安全要求

## 1. Purpose

本 Delta 只描述 VS-01 → VS-02 新增的工程约束。它不重写 VS-01 工程治理，也不选择
任何真实 Payment Provider。

```text
35 VS-02 Product Contract
→ 36 Engineering Governance Delta
→ Provider-neutral Money Domain Build
→ Provider Adapter
→ Controlled Real-money Pilot
```

Provider Qualification 是外部约束轨道：

- 它决定某个真实 Provider Adapter 是否可以进入受控 Pilot；
- 它不阻止 VS-02 产品对象、领域规则、持久化、API、受控 UI、测试和验收骨架的开发；
- Provider SDK、真实密钥、真实 Payment、真实账户、Webhook 生产接入和真实 Withdrawal
  必须在对应 Provider 资格和运行门禁满足后才可启用。

## 2. Scope and Change Classification

VS-02 引入以下新的产品对象和工程能力：

```text
Order
Payment
Fulfillment
Settlement
Creator Earnings Ledger
Wallet Projection
Withdrawal
Cancellation / Refund minimum closure
Provider-neutral External Facts
```

在开始代码变更前，必须创建一个 VS-02 根 `DEV-###`，并为任何以下变化建立独立
`DEV-###` 或子项：

- 新增或改变产品对象、状态、权限、Canonical Event、API Contract；
- 改变 VS-01 `Confirmed Commerce` 或 `external_paid_verified` 的兼容语义；
- 引入 Payment / Settlement / Withdrawal Provider Adapter；
- 引入真实 Provider 配置、Secret、Webhook、账户资料或资金事件；
- 改变金额计算、Ledger Projection、Refund / Reversal 或审计规则；
- 扩展到第二 Commerce Pattern、第二垂直、第二币种或第二 Withdrawal Provider。

没有 `DEV-###`、35 PRD、36 Delta 和对应测试计划的代码变更不得声称为 VS-02。

## 3. Domain Boundaries

### 3.1 Money Domain Ownership

VS-02 的业务能力必须具有清晰归属：

| Capability | Domain responsibility | Prohibited shortcut |
| --- | --- | --- |
| Order | Snapshot、关联、可支付承诺、Commerce lifecycle | 从可变 Offering 读取历史价格 |
| Payment | Attempt、可信确认、失败、退款/反转事实 | 客户端直接标记成功 |
| Fulfillment | Paid Service 的履约责任和证据 | 未付款 Order 完成履约 |
| Settlement | 收入归属、费用、扣减、Creator Net | 直接改 Wallet Balance |
| Ledger | 不可变金额事实 | 覆盖、删除或静默修正历史 |
| Wallet Projection | 从 Ledger 派生 Creator 收益视图 | 作为独立可写余额存储 |
| Withdrawal | Intent、保留、结果、幂等 | 重复扣减或自行打款 |
| Provider Adapter | 验证外部事实、转换为 Provider-neutral Port | Provider SDK 类型泄漏到 Domain |

### 3.2 Dependency Rule

业务层依赖显式 Port，不依赖 Provider SDK、Webhook payload、商户号、账户类型或 Provider
枚举。Domain / Application 层只使用 Provider-neutral 输入：

```text
VerifiedPaymentFact
VerifiedSettlementFact
VerifiedRefundOrReversalFact
VerifiedWithdrawalFact
VerifiedAccountRestrictionFact
```

Adapter 负责：

- Provider 签名、来源、时间戳与重放验证；
- Provider 事件解析、版本适配与脱敏；
- Provider Reference 与业务 Correlation Reference 映射；
- 不可识别 / 重复 / 过期 / 不一致事件隔离；
- 将已验证事实提交给 Application Port。

## 4. Money and State Invariants

### 4.1 Order Invariants

1. Order 必须来自一个合法 Confirmed Request；
2. 同一业务承诺只能产生一个逻辑 Order，重复命令必须幂等；
3. Order 必须保存不可变 Offering Snapshot、价格、币种、Creator、Customer 和履约条件；
4. Offering 后续编辑、下架、删除或价格变化不得修改既有 Order；
5. Order 所属 Creator 与 Customer 不可在创建后变更；
6. 未付款、已取消、已退款或 Pending Resolution 的 Order 不得完成 Fulfillment。

### 4.2 Payment Invariants

1. Payment Confirmation 只能来自已验证的外部事实或明确标记的受控测试事实；
2. 客户端重定向、页面文案、截图、查询参数或人工 UI 输入不能构成 Payment Confirmation；
3. 同一 Provider / Correlation Reference 重复到达不得重复确认或重复记账；
4. Payment Amount、Currency、Order Reference、Provider Reference 必须一致；
5. Payment Failed、Refund、Reversal 与 Payment Confirmed 均为可审计事实，不得通过覆盖
   Payment State 隐藏；
6. VS-01 `external_paid_verified` 保持 observation-only，除非单独 DEV 规定迁移、
   兼容与审计策略。

### 4.3 Fulfillment Invariants

1. 只有 Order 的 owning Creator 可记录 Fulfillment；
2. Fulfillment 必须发生在 Payment Confirmed 后；
3. Fulfillment 必须具备时间、操作者、证据或受控说明；
4. Fulfillment 不自动释放 Earnings，不自动完成 Settlement；
5. Fulfillment 被撤销、争议或退款时必须建立新事实，不删除历史证据。

### 4.4 Settlement Invariants

1. Settlement 必须关联一个有效 Order、Payment 与 Settlement Trigger；
2. 金额公式必须可重算：

```text
Creator Net
= Gross
- Provider Fee
- Platform Fee
- Refund / Reserve / Approved Adjustment
```

3. 每个输入必须具备来源、计算版本、Currency 和审计 Reference；
4. Settlement 不得把未知 Provider Fee、未知 Platform Fee 或未决 Refund 猜测为零；
5. Settlement Released 必须经合法 Trigger；它不是银行清算、提现或完成状态的同义词；
6. Settlement Reversal 必须通过新的 Settlement / Ledger 事实表达；
7. 任何单笔 Settlement 的 Creator Net 不得在未登记的异常策略下造成不可解释余额。

### 4.5 Ledger Immutability Invariants

1. Ledger Entry 追加写入，绝不更新金额、删除历史或通过 SQL 修正余额；
2. 每个 Entry 必须有 Stable Identifier、Entry Type、Signed Amount、Currency、Effective Time、
   Aggregate References、Correlation Reference 与审计 Source；
3. 修正必须使用 Compensation / Reversal Entry；
4. 同一 External Fact 或业务命令只能生成一次逻辑 Ledger Effect；
5. Ledger 能够从事件顺序重放，并重建相同 Balance Projection；
6. 任何 Ledger Entry 不可脱离对应 Order / Payment / Settlement / Withdrawal 或明确
   Adjustment Authority；
7. 负余额、Reserved Balance 或 Restricted Balance 必须具有显式政策和审计原因，
   不得作为偶然算术结果。

### 4.6 Wallet Projection Invariants

1. Wallet 不拥有可写的 Authoritative Balance；
2. Pending、Available、Restricted、Withdrawal In Progress 与 Withdrawn 都是 Ledger
   Projection；
3. 任一展示余额必须可在给定时间点从 Ledger Entries 重建；
4. 余额投影必须按 Creator、Currency 和账户范围隔离；
5. Available 不得超过可用的已结算净收入；
6. Wallet UI / API 必须显示金额的可解释状态，不得用单一“总余额”隐藏限制、保留或
   提现处理中金额；
7. Projection 失败不得导致直接手工覆盖余额；必须可重放或进入受控修复流程。

### 4.7 Withdrawal Invariants

1. Withdrawal 是 Creator 的 Intent 与受控结果，不是平台自主打款；
2. Withdrawal Request 必须携带 Idempotency Key、Creator、Currency、Amount 与脱敏目标
   Reference；
3. Requested Amount 必须小于等于可用 Projection；
4. 请求成功后金额必须通过 Ledger Entry 进入 Reserved / In Progress，防止并发双提；
5. 同一 Idempotency Key、Provider Reference 或 External Fact 不得产生重复 Withdrawal；
6. Success、Failure、Reversal、Restriction 均通过新事实和新的 Ledger Entry 表达；
7. Provider Adapter 未资格确认时，可以构建 Provider-neutral Withdrawal State，但不得
   发送真实资金转出请求。

### 4.8 Refund, Reversal and Resolution Invariants

1. Refund 只能针对可信 Payment Confirmed 的可退金额；
2. 总退款、反转和扣减不得超过受规则约束的可退 / 可回收金额；
3. Refund、Dispute、Chargeback、Provider Restriction 与 Creator Unable to Fulfill 必须
   打开可审计的 Pending Resolution 或相应异常状态；
4. 退款 / 反转必须影响 Payment、Settlement、Ledger 与 Wallet Projection 的关联链；
5. 不得用删除 Order、Payment、Settlement 或 Ledger Entry 关闭资金异常；
6. 任何尚未由 Provider Qualification 或批准策略定义的责任归属必须保留为显式的
   `Unknown — Blocking` / Pending Resolution，而非代码猜测。

## 5. Precision, Currency and Time

### 5.1 Money Precision

- VS-02 首发币种为 CNY；
- 内部金额必须使用整数最小货币单位或等价 decimal-safe 表示；
- 禁止用 IEEE 754 浮点数保存、累加、比较、结算或生成 Ledger Entry；
- 任何舍入策略必须由明确的 Money Policy 标识并可重放；
- API / UI 转换必须保留精度，显示格式不是金额事实；
- Currency 不得从浏览器 locale、Provider 文案或页面字符串隐式推断。

### 5.2 Time and Ordering

- 记录 `occurredAt`、`receivedAt`、`effectiveAt` 与必要的 Provider 时间；
- Provider 到达顺序不得假定等于资金或业务发生顺序；
- 事件处理必须能应对延迟、重复、乱序、重放与部分失败；
- 一切可变 Deadline、Settlement Delay、Reserve 与 Provider 时限必须有策略版本和
  可审计输入；
- 使用 UTC 保存工程时间；产品展示可本地化，但不得改变事实排序。

## 6. Event, Webhook and Replay Safety

### 6.1 Canonical Event Registration

35 PRD 定义的 VS-02 Canonical Events 必须在实现前登记到事件注册表，并为每个事件定义：

- Aggregate Type / Identifier；
- Actor or Source；
- Occurred Time；
- Correlation / Causation Reference；
- Payload Schema；
- Idempotency Semantics；
- Authorization / Authenticity Requirement；
- Audit Retention Requirement。

新增、重命名、删除或改变事件语义必须登记 `DEV-###`。

### 6.2 Webhook / External Event Authenticity

真实 Provider Webhook 必须：

1. 通过 Provider 指定的签名、证书、密钥、时间戳或等价验证；
2. 先验证来源与 payload，再读取业务字段；
3. 保存脱敏原始证据或可验证摘要；
4. 通过 Provider Event ID 与业务 Correlation Reference 去重；
5. 将验证失败、未知事件、无法关联事件隔离；
6. 不允许未验证 Webhook 改变 Payment、Settlement、Ledger 或 Withdrawal；
7. 支持安全重试、死信隔离与人工审计，但不能重复生成金额事实。

### 6.3 Replay and Reconciliation

系统必须支持：

- 从 Ledger / Canonical Events 重放 Wallet Projection；
- 从 Provider-neutral Facts 重放 Payment / Settlement / Withdrawal 业务状态；
- 按 Order、Payment、Settlement、Ledger、Withdrawal 与 Provider Reference 交叉对账；
- 检测并隔离重复、缺失、金额不一致、币种不一致和非法状态跳跃；
- 将任何修复记录为新的受控事实或补偿 Entry，而不是原地修改历史。

## 7. Security, Privacy and Auditability

### 7.1 Sensitive Data Boundary

禁止存储：

- 完整银行卡号、CVV、支付口令、支付二维码原文；
- Provider Secret、私钥、签名原文或未脱敏账户凭据；
- 未经批准的 KYC/KYB、身份证、银行账户或税务资料。

只允许存储最小化、脱敏、加密或 Provider Reference 形式的数据，并遵守后续 Provider、
法律和数据治理约束。

### 7.2 Audit Chain

每个 Money Layer 事实必须可以追溯：

```text
Actor / Source
→ Request or External Fact
→ Canonical Event
→ Aggregate State
→ Settlement / Ledger Effect
→ Wallet Projection
→ Audit Evidence
```

审计记录至少保留操作者、来源、时间、原因、Correlation Reference、Provider Reference
（如有）、结果与失败信息。

### 7.3 Authorization

- Creator 只可读取和发起自身 Money Layer 动作；
- Customer 只可读取自身 Order / Payment Result；
- Operations 必须最小权限、受审计且不能绕过 Ledger 不变量；
- Provider Adapter 只可通过专用端点 / Port 写入已验证外部事实；
- 管理权限不等于修改余额、伪造支付或跳过状态机权限。

## 8. Testing and Verification

### 8.1 Required Test Layers

| Layer | Required evidence |
| --- | --- |
| Domain unit | State transition, formula, precision, Ledger, balance projection, authorization |
| Application | Idempotency, orchestration, pending resolution, replay and audit chain |
| Persistence integration | Transactions, uniqueness, append-only constraints, concurrency, rollback |
| Transport / API | Authorization, schema, error contracts, idempotency and provider-neutral boundaries |
| Adapter integration | Signature/source verification, duplicate/late event behavior, Provider mapping |
| Acceptance | Creator and Customer paid-service loop, wallet visibility, withdrawal intent, failure closure |
| Real Provider | Separate controlled evidence; never replaced by mock or sandbox in phase-completion claims |

### 8.2 Minimum Test Cases

Implementation must cover at least:

1. Confirmed Request → one idempotent Order Snapshot;
2. Payment confirmation cannot be forged by Customer / Creator client input;
3. Duplicate Payment Fact creates one Payment and one Ledger effect;
4. Payment Failed creates no Creator Earnings;
5. Fulfillment before Payment Confirmed is rejected;
6. Settlement formula is exact and reproducible;
7. Ledger correction is compensating, never overwrite;
8. Wallet projection equals sum of Ledger Entries for every exposed balance bucket;
9. Concurrent / duplicate Withdrawal Intent cannot oversubscribe Available Earnings;
10. Withdrawal Failure / Reversal restores or adjusts availability through auditable Entries;
11. Refund / Reversal modifies settlement availability without deleting history;
12. Replay produces the same Wallet Projection;
13. Unauthorized Creator / Customer / Operations access is rejected;
14. Unverified, duplicate, delayed or out-of-order external events cannot create duplicate money facts;
15. Existing VS-01 Request → Confirm / Decline acceptance remains intact.

### 8.3 Real-money Evidence Boundary

Tests may use controlled fixtures, in-memory adapters and simulated Provider facts for VS-02 build
verification, but such evidence must be clearly labeled non-production. Only the selected, qualified
Provider Adapter plus a controlled real-money Pilot can satisfy the Phase 4 completion outcome.

## 9. Provider Adapter Promotion Gate

Provider-neutral VS-02 Build may proceed now. A concrete Provider Adapter may be promoted to a
Controlled Real-money Pilot only when:

1. `35A` records sufficient Provider-specific eligibility and scope evidence;
2. required legal, operations, security, configuration and secret management controls are approved;
3. Seller / Merchant, Platform Fee, settlement, refund, reversal, withdrawal and responsibility
   constraints are explicitly mapped to the selected Adapter;
4. Adapter authenticity, idempotency, reconciliation and failure tests pass;
5. Pilot scope, support escalation and stop conditions are documented;
6. product highest owner approves the Pilot release.

If an external constraint conflicts with the Provider-neutral Product Model, record a `DEV-###` and
change the narrowest affected Adapter / policy / onboarding assumption first. Do not let Provider
terminology leak into the core Domain.

## 10. Explicit Prohibitions

Until a Provider Adapter passes the promotion gate, the implementation must not:

- issue real charges, payments, refunds, payouts or withdrawals;
- submit real Creator KYC/KYB, bank or settlement account data;
- configure production Provider secrets or webhooks;
- claim mock, sandbox or manually inserted facts are real earnings;
- create a self-custodied platform balance, stored-value pool or direct bank transfer engine;
- expand to multi-currency, multiple verticals, Marketplace, subscription or complex financial flows;
- treat any `Wallet` field as a direct editable balance;
- use manual database edits to repair Money Domain state.

## 11. Freeze Decision

```text
VS-02 Engineering Governance Delta
Status: Frozen

Provider-neutral Domain Build: Authorized
Provider-specific Adapter: External-constraint gated
Controlled Real-money Pilot: Provider-qualified and separately approved

Non-negotiable invariants:
Order Snapshot
Trusted Payment Fact
Exact Money Arithmetic
Settlement Reproducibility
Append-only Ledger
Wallet as Projection
Withdrawal Idempotency
External Event Authenticity
Replay and Audit Safety
```

Any departure requires a registered `DEV-###` before implementation.
