# 34 — Commerce Pattern, Settlement and Wallet Model

> **状态**：Frozen Product Model — No Implementation Authority  
> **阶段**：Minimum Commercial Loop / Gate 0  
> **建立日期**：2026-08-14  
> **前置文档**：32 Minimum Commercial Loop；33 Money Flow Decision  
> **后续文档**：35 VS-02 Paid Service PRD；36 Engineering Governance Delta  
> **实现状态**：Prohibited until D-MCL-01 and downstream contracts are approved

## 1. 目的

本文件冻结一个 Provider-neutral、跨垂直但不过度泛化的 Creator Commerce Money Layer。

它解决三个问题：

1. 不同 Creator Commerce Type 是否必须共享同一条交易流程；
2. 不同流程如何共享 Payment、Settlement、Wallet 和 Withdrawal；
3. 产品账本与现实资金托管、分账和提现之间如何保持清晰边界。

本文件不选择微信支付、支付宝、Stripe、PayPal 或任何具体 Provider，不批准 Money
Flow Model，也不授权创建生产对象、数据库、API 或 UI。

## 2. 核心判断

### 2.1 Commerce Pattern，不是 Universal Commerce Flow

以下流程：

```text
Request → Confirm → Order → Payment → Fulfillment → Settlement
```

只属于 `Service Commerce Pattern`，不能被提升为所有 Creator Commerce 的通用协议。

不同 Commerce Type 可以拥有不同的 Demand、Acceptance、Commitment 和 Fulfillment
节点，但应共享一个上层 Commerce Lifecycle 和统一 Money Layer。

### 2.2 统一 Commerce Lifecycle

跨 Pattern 的共同生命周期是：

```text
Demand
→ Offer
→ Acceptance
→ Commitment
→ Payment
→ Allocation
→ Fulfillment
→ Settlement
→ Wallet
→ Withdrawal
```

并非每个 Pattern 都必须显式实现所有节点。具体 Pattern 可以跳过、合并或多次进入某些
节点，但不能绕过金额、责任、Settlement 和 Ledger 不变量。

### 2.3 统一 Money Layer

所有 Commerce Pattern 最终汇聚到：

```text
Payment
→ Settlement
→ Creator Earnings Ledger
→ Available Balance
→ Withdrawal
```

统一 Money Layer 是 Personal Commerce Infrastructure 的核心经济层。

## 3. Commerce Pattern Registry

本 Registry 是产品研究边界，不是当前 Build Scope。VS-02 只实现 Pattern A。

### Pattern A — Request Commerce

```text
Request
→ Accept / Decline
→ Order
→ Payment
→ Fulfill Service
→ Complete
→ Settlement
→ Wallet
```

适用候选：

- 一对一 Service；
- 私教、咨询、预约型服务；
- 需要 Creator 逐单确认的服务。

VS-02 Paid Service 只实现该 Pattern。

### Pattern B — Reservation Commerce

```text
Reserve Slot
→ Payment
→ Attend / Check-in
→ Fulfill Experience
→ Complete
→ Settlement
→ Wallet
```

适用候选：Experience、限额活动、时段预约。

当前状态：Deferred。

### Pattern C — Ticket Commerce

```text
Purchase
→ Payment
→ Ticket Issued
→ Check-in / Event Occurs
→ Complete
→ Settlement
→ Wallet
```

适用候选：Event、演出、展会活动。

当前状态：Deferred。

### Pattern D — Contract Commerce

```text
Inquiry
→ Quote
→ Contract
→ Deposit
→ Fulfillment
→ Final Payment
→ Settlement
→ Wallet
```

适用候选：Performance、品牌合作、定制 Content、长周期交付。

该 Pattern 可能包含多次 Payment、阶段性 Fulfillment 和多次 Settlement。

当前状态：Deferred。

### Pattern E — Instant Commerce

```text
Select Product
→ Payment
→ Deliver
→ Complete
→ Settlement
→ Wallet
```

适用候选：Merchandise、Digital Product、即时交付内容。

当前状态：Deferred。

## 4. Shared Commerce Objects

### 4.1 Commerce Commitment

不同 Pattern 的 Commitment 形式可以不同：

- Service：Accepted Request / Order；
- Reservation：Reserved Slot；
- Ticket：Ticket Purchase；
- Contract：Signed Contract / Accepted Quote；
- Instant：Purchase Order。

Commitment 是 Payment 可以合法关联的商业承诺，不等于 Payment 本身。

### 4.2 Order

Order 是一个具体 Commerce Commitment 的交易合同与金额快照。

Order 必须冻结：

- Seller；
- Buyer；
- Commerce Pattern；
- Offering / Product Snapshot；
- Gross Amount；
- Currency；
- Quantity、Duration、Location 或交付条件；
- Platform Fee Rule Version；
- Refund / Cancellation Rule Version。

不同 Pattern 可以使用不同 Order subtype 或关联对象，但不得复制一套独立 Payment、
Settlement 或 Wallet 基础设施。

### 4.3 Payment

Payment 是资金尝试和可信资金结果，不是 Provider API Response 的别名。

Payment 产品对象统一表达：

- Order；
- Amount / Currency；
- Payment Purpose，例如 full payment、deposit、final payment；
- Provider-neutral status；
- Provider Reference；
- Confirmed Amount；
- Refund / Dispute 关联；
- 可信 Provider Event / Query Source。

Provider-specific 字段只能位于 Adapter 或受控 Provider Metadata 中。

### 4.4 Fulfillment

Fulfillment 表达 Seller 对 Commerce Commitment 的交付责任与结果。

不同 Pattern 的 Fulfillment 证据不同：

- Service：课程 / 服务完成；
- Reservation：到场并完成体验；
- Ticket：Ticket 使用 / Check-in / Event 完成；
- Contract：里程碑或最终交付；
- Instant：实物发货、签收或数字内容交付。

Fulfillment 不得直接修改资金余额。它只能作为 Settlement Trigger 或异常处理输入。

## 5. Settlement Model

### 5.1 Settlement 定义

Settlement 回答：

> 一笔或一组已满足结算条件的 Commerce，最终多少钱属于 Creator、平台和 Provider，
> 这些金额何时可用，以及后续退款、争议或调整如何反映。

Settlement 是 Payment 与 Wallet 之间的正式产品边界。

### 5.2 Settlement Formula

基础公式：

```text
Gross Order Amount
- Refunds
- Payment Provider Fee
- Platform Fee
- Approved Adjustments / Reserves
= Creator Net Earnings
```

所有金额必须：

- 使用明确 Currency；
- 使用最小货币单位或等价无浮点精度表示；
- 保存计算规则版本；
- 可从原始 Ledger Entry 重建；
- 不允许通过直接覆盖余额修正历史。

### 5.3 Platform Fee

Platform Fee 是产品商业模型的必备事实。

必须冻结：

- Fee Payer；
- Fixed / Percentage / Hybrid；
- Rate；
- Fee Base；
- Rounding Rule；
- Collection Timing；
- Refund 对 Platform Fee 的影响；
- Provider Fee 是否由 Creator、平台或双方承担；
- Fee Rule Version。

具体费率不由本文件决定，但不得将 Platform Fee 永久设为 `None / 0`。

### 5.4 Settlement Trigger by Pattern

候选 Trigger：

| Pattern | Settlement Trigger Candidate |
| --- | --- |
| Request Commerce | Paid + Service Fulfilled + no active resolution |
| Reservation Commerce | Attendance / Experience Complete |
| Ticket Commerce | Event Completed or check-in policy satisfied |
| Contract Commerce | Milestone accepted or final delivery accepted |
| Instant Commerce | Delivery / receipt / digital access policy satisfied |

具体 Trigger、延迟期和 Reserve Policy 必须由对应 VS PRD 冻结。

### 5.5 Settlement Result

Settlement 至少区分：

```text
Pending
Eligible
Settled
Partially Reversed
Reversed
Restricted
```

Settlement 不是银行清算状态；它表达平台产品账本对金额权属和可用性的判断。

## 6. Creator Wallet / Earnings Ledger

### 6.1 Wallet 定义

Creator Wallet 是：

> Creator 在 Personal Commerce Infrastructure 中所有商业收入、费用、扣减、冻结、
> 可提现金额和提现结果的统一 Earnings Ledger 与产品入口。

Wallet 是跨 Pattern 的统一出口：

```text
Service Revenue
Event Revenue
Experience Revenue
Performance Revenue
Content Revenue
Merchandise Revenue
Membership Revenue
        ↓
Creator Earnings Ledger
        ↓
Available Balance
        ↓
Withdrawal
```

除 Service 外的收入类型当前均为 Deferred，但 Ledger 语言不得把 Wallet 锁死为 Service
专用余额。

### 6.2 Wallet 不等于资金账户

必须区分：

- Product Wallet：Creator 可理解和操作的商业收入账户；
- Ledger：平台可审计的金额变化事实；
- Provider Balance / Settlement Account：支付基础设施中的现实资金位置；
- Bank Account / Payment Account：Creator 最终可控制的提现目标。

平台可以拥有 Wallet 产品与 Ledger，而不一定法律上自行托管资金。

### 6.3 Ledger Entry

每一次金额变化必须形成 Ledger Entry，例如：

- Payment Confirmed / Pending Earnings；
- Platform Fee Charged；
- Provider Fee Charged；
- Settlement Released；
- Refund Debited；
- Dispute Reserve；
- Adjustment；
- Withdrawal Requested；
- Withdrawal Succeeded；
- Withdrawal Failed / Reversed。

Ledger Entry 必须至少包含：

- Creator；
- Order / Payment / Settlement / Withdrawal Reference；
- Entry Type；
- Amount / Currency；
- Debit / Credit Direction；
- Effective Time；
- Correlation / Audit Reference；
- Rule Version；
- Provider Reference（若存在）。

Ledger Entry 应追加记录；修正通过新 Entry 完成，不删除或覆盖历史金额事实。

### 6.4 Balance Views

Wallet 至少提供以下派生余额：

- Pending Earnings；
- Available Balance；
- Restricted / Reserved Balance；
- Withdrawal In Progress；
- Withdrawn Total；
- Lifetime Gross Revenue；
- Lifetime Platform Fee；
- Lifetime Creator Net Earnings。

Balance View 是 Ledger 的投影，不是独立事实源。

## 7. Withdrawal Model

Withdrawal 表达 Creator 对 Available Balance 的资金转出选择。

### 7.1 Minimum Rules

- Creator 自由选择发起时间；
- 只能使用 Available Balance；
- Amount 必须大于零且不得超过可提现余额；
- 同一 Provider Request 必须幂等；
- Processing 期间金额必须进入受控状态，防止重复提现；
- Failed / Reversed 必须恢复正确余额；
- 提现手续费、最低金额、频率和到账时间必须透明；
- Creator 只能提现自己的 Earnings。

### 7.2 Provider Boundary

Withdrawal 可以映射为：

- Provider Balance Payout；
- Sub-merchant withdrawal；
- Split receiver withdrawal；
- Transfer to bank / payment account；
- 其他受监管 Provider 能力。

产品模型不得假设所有 Provider 都有同一种提现 API 或余额语义。

## 8. Failure and Reversal Boundary

统一 Money Layer 至少必须承载：

- Payment Failed；
- Payment Partially Confirmed / Duplicate Event；
- Cancellation Before Payment；
- Cancellation After Payment；
- Full / Partial Refund；
- Creator Cannot Fulfill；
- Dispute / Chargeback；
- Settlement Reversal；
- Negative or Restricted Earnings；
- Withdrawal Failed / Reversed；
- Provider Account Restricted / Closed。

任何失败不得通过删除 Order、Payment、Settlement 或 Ledger Entry 解决。

## 9. Current VS-02 Scope

VS-02 只允许实现：

```text
Pattern A — Request Commerce
Service Offering
Single full payment
Single fulfillment
Single settlement
Platform Fee
Creator Wallet credit
Single withdrawal path
Minimum cancellation / refund
```

VS-02 不实现：

- Pattern B–E；
- Deposit + final payment；
- Partial fulfillment；
- Multi-party split beyond Creator + Platform + Provider fee；
- Cross-order netting；
- Multi-currency Wallet；
- Wallet reuse / spending；
- Credit、Advance、Insurance、Tax、Expense Management；
- Multiple withdrawal providers；
- Marketplace-wide financial operations。

## 10. Governance and Implementation Gate

本文件冻结产品抽象，不授权实现。

实现前必须依次满足：

1. D-MCL-01 Money Flow Model 获批；
2. `35_VS02_Paid_Service_PRD.md` 冻结具体 Service Pattern、状态、权限和验收；
3. `36_Engineering_Governance_Delta.md` 冻结金额、Ledger、Provider、Webhook、安全、
   合规和真实资金验证门禁；
4. 独立 `DEV-###` 登记所有新增对象、状态、事件、权限和 API；
5. 产品最高负责人批准 Build。

在此之前禁止：

- 创建生产 Order、Payment、Settlement、Wallet 或 Withdrawal 类型；
- 创建金额、余额、分账或提现数据库表；
- 接入 Provider SDK、Webhook 或真实商户配置；
- 创建 Wallet UI 或可操作余额；
- 使用模拟 Ledger 声称收入、余额或提现完成。

## 11. Frozen Decisions and Open Decisions

### Frozen

- Commerce Pattern 与 Universal Commerce Lifecycle 分离；
- VS-02 只实现 Request Commerce；
- Payment、Settlement、Wallet / Ledger、Withdrawal 是统一 Money Layer；
- Platform Fee 必须存在；
- Wallet 必须由 Ledger Entry 支撑；
- Wallet 不自动等于平台自行托管资金；
- Global-ready 使用 Regional Provider Adapter 和 Regional Legal / Merchant Model；
- 其他 Commerce Pattern 和金融扩张能力保持 Deferred。

### Open — Blocking

- 中国 Creator Seller 主体；
- 平台法律实体和角色；
- 微信 / 支付宝具体产品；
- 资金托管、分账与提现的现实法律结构；
- Platform Fee 费率与扣取规则；
- Provider Fee 承担方；
- Settlement Delay、Reserve 和 Release Rule；
- Wallet 与 Provider Balance 的映射；
- Withdrawal 产品、限制和失败责任；
- Refund、Dispute、Chargeback 和负余额责任。

该模型在 D-MCL-01 获批前不得被解释为已选择 Model C 或已确定中国支付架构。

