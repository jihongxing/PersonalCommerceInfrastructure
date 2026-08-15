# 35 — VS-02 Paid Service PRD

> **Status**：Frozen  
> **Product**：Personal Commerce Infrastructure  
> **Version**：VS-02 — Paid Service + Earnings  
> **Wedge**：Independent Dancer / Dance Teacher  
> **Commerce Pattern**：Request Commerce  
> **Money Model**：Provider-neutral `Provider-backed Creator Settlement`  
> **Implementation Target**：Controlled Product Build; real-money Pilot follows Provider Adapter qualification  
> **Upstream Definitions**：`32_Minimum_Commercial_Loop.md`、`34_Commerce_Pattern_Settlement_and_Wallet_Model.md`  
> **Parallel External Constraint Track**：`35A_Provider_Qualification_Dossier.md`  
> **Implementation Authority**：本 PRD 是 VS-02 产品、领域、状态、权限、事件、验收和范围的冻结实现合同

## 1. PRD Status

### 1.1 D-MCL-GATE-01 — Unblocked Productization Decision

本 PRD 根据产品最高负责人于 2026-08-14 批准的 `D-MCL-GATE-01` 建立。

```text
Provider Qualification
    = External Constraint / Parallel Track

not a prerequisite for:
    VS-02 Product Design
    VS-02 Engineering Governance Delta
    Provider-neutral Money Domain Build
```

因此：

- VS-02 产品设计、工程治理与 Provider-neutral Domain Build 已解除 Gate 0C 阻塞；
- `35A_Provider_Qualification_Dossier.md` 继续作为并行的外部事实、业务资格和 Adapter
  约束轨道；
- Provider 未回复不得阻止本 PRD、36 Engineering Governance Delta 或 Provider-neutral
  实现；
- 真实 Provider Adapter、真实资金账户配置、Controlled Real-money Pilot 仍必须遵守
  Provider Qualification、法律、合规、运营和安全约束；
- 本 PRD 不把任何微信、支付宝、机构结算、Stripe、PayPal 或其他 Provider 的能力写入
  Product Domain。

本 PRD 显式覆盖早期文件中“D-MCL-01 未批准前不得创建 VS-02 对象或状态机”的临时
实现门禁；该覆盖仅限 VS-02 的 Provider-neutral 产品化与工程开发，**不构成真实资金
流、真实 Payment Provider 或真实 Withdrawal 的上线授权**。

### 1.2 PRD Precedence

| Document | Role | VS-02 use |
| --- | --- | --- |
| `32_Minimum_Commercial_Loop.md` | Phase objective, scope and North Star | Phase scope and completion boundary |
| `34_Commerce_Pattern_Settlement_and_Wallet_Model.md` | Provider-neutral money model | Object semantics, lifecycle separation and invariants |
| `35A_Provider_Qualification_Dossier.md` | External constraint track | Provider Adapter eligibility, not product-object definition |
| This PRD | VS-02 implementation contract | Product scope, rules, states, permissions, events and acceptance |
| `36_Engineering_Governance_Delta.md` | Next contract | Engineering invariants and implementation governance |

如文档存在冲突：

1. `35_VS02_Paid_Service_PRD.md` 决定 VS-02 产品对象、状态、用户权限、规范事件和验收；
2. `34` 决定 Provider-neutral Money Layer 的语义和不可变账本边界；
3. `35A` 只能限制或选择 Provider Adapter，不能反向重定义 Commerce Domain；
4. 真实 Provider 限制导致产品不可执行时，登记 `DEV-###` 并更新对应 Decision Record，
   不得静默改写本 PRD。

## 2. Product Objective

让一个真实 Creator 通过一个真实 `Service Offering`，与一个真实 Customer 完成可追踪的：

```text
Request
→ Confirm
→ Order
→ Payment
→ Fulfillment
→ Settlement
→ Creator Earnings Ledger
→ Wallet
→ Withdrawal
→ Completed Commerce
```

VS-02 要把 VS-01 的 `Request Commerce` 扩展为第一个完整的 `Paid Commerce + Earnings
Loop`。

阶段最终目标是：

> First Completed Paid Commerce + First Verified Creator Earnings Cycle

该目标在真实 Pilot 中要求一笔真实 Creator、真实 Customer、真实 Service Offering、真实
价格、真实 Payment、真实 Fulfillment、真实 Settlement、Creator Earnings 与真实或
Provider 等价验证的 Withdrawal。Provider-neutral Build、测试 Provider、Mock、Fixture、
Sandbox、人工数据库修改或内部自买自卖均不能作为这一最终商业证据。

## 3. Scope

### 3.1 Must Build

#### Creator-facing

- 查看已确认 Request 并创建或触发对应 Order；
- 查看每个 Service Order 的 Payment、Fulfillment、Settlement 和 Earnings 状态；
- 对已付款、可履约的 Order 记录 Fulfillment；
- 查看 Creator Earnings Ledger 的可审计收入明细；
- 查看由 Ledger 投影出的 Pending、Available、Restricted、Withdrawal In Progress 和
  Withdrawn 余额；
- 对 Available Earnings 创建 Withdrawal Intent；
- 查看 Withdrawal 的请求、处理中、成功、失败或撤销结果；
- 查看最低 Cancellation / Refund / Pending Resolution 状态；
- 只能访问自身 Creator、Order、Earnings Ledger 和 Withdrawal。

#### Customer-facing

- 对 Creator 已 Confirm 的 Request 进入 Order；
- 查看 Order 的价格、服务快照、Payment 状态、Fulfillment 状态、Completion 状态与
  可用的退款 / 解决结果；
- 只能为自身 Customer 身份创建或访问对应 Request、Order、Payment 和 Customer Result；
- 不暴露 Creator 结算账户、Provider 密钥、完整收款目标、内部 Ledger Entry 或平台
  风控信息。

#### Operations-facing

- 查看 Order、Payment、Fulfillment、Settlement、Ledger 与 Withdrawal 的关联审计链；
- 在受控权限下记录或处理需要人工干预的 Pending Resolution；
- 不得通过覆盖余额、伪造 Payment Success、人工添加 Wallet Credit 或绕过 Provider
  事实来关闭商业闭环；
- 任何受控人工动作必须产生操作者、原因、时间、证据引用和 Canonical Event。

#### System behavior

- 从 Confirmed Request 创建不可变的 Order 商业快照；
- Provider-neutral Payment Attempt / Confirmation / Failure / Refund Fact 生命周期；
- Paid Order 的 Fulfillment 权限与合法状态校验；
- Settlement 计算与结果记录；
- 不可覆盖的 Creator Earnings Ledger；
- Wallet 余额投影；
- Withdrawal Intent 幂等与余额保留；
- 最低 Cancellation、Refund、Reversal、Dispute / Pending Resolution 闭环；
- 可信外部 Payment / Settlement / Withdrawal 事件的 Adapter 入口；
- 可审计的 Canonical Event 与关联 Reference；
- 金额、币种、时间、身份与权限完整性校验。

### 3.2 Explicitly Not Build

VS-02 不建设：

- Marketplace、搜索排序、平台撮合、跨 Creator 购物车或多 Seller Checkout；
- Event、Ticket、Experience、Performance、Content、Merchandise、Membership 或第二垂直；
- Subscription、Recurring Billing、Deposit + Final Payment、分期、部分付款或多币种；
- Creator Wallet 充值、消费、转账、借贷、信用、余额宝式储值或平台自建资金池；
- Platform custody、银行账户、支付牌照能力、自建清算或自建反洗钱系统；
- 多方复杂分账、跨 Order 轧差、批量结算、自动税务、发票中心、Creator 财务 Dashboard；
- 完整 CRM、运营 Marketplace、对账后台、风控平台或争议中心；
- 将微信、支付宝、机构结算、Stripe、PayPal 或其他 Provider 绑定为 Product Domain；
- 未经 Provider 与合规确认的真实账户进件、真实 KYC、真实 Payment、真实 Payout 或
  真实 Withdrawal 上线。

### 3.3 Scope Guard

VS-02 只实现：

```text
One Service Offering
→ One Customer Request
→ One Creator Confirmation
→ One Order
→ One full Payment
→ One Fulfillment
→ One Settlement
→ Creator Earnings Ledger credit
→ One Withdrawal path
```

对任何新增 Primitive、支付方式、币种、资金责任、Wallet 能力、结算参与方、Order 状态、
Refund 规则或 Provider-specific 行为，必须先登记 `DEV-###`，并由产品最高负责人批准。

## 4. User and Permission Model

### 4.1 Creator

Creator 是 Service Offering 的供给和 Fulfillment 责任主体。

Creator 可以：

- 创建和管理 VS-01 Commerce Identity、Offering 与 Availability；
- Confirm / Decline Request；
- 查看自身 Confirmed Request 产生的 Order；
- 对合法 Paid Order 记录 Fulfillment；
- 查看自身 Settlement、Ledger Entry、Wallet Projection 与 Withdrawal；
- 发起自身 Available Earnings 的 Withdrawal Intent；
- 在规则允许范围内发起 Cancellation / Refund Request 或补充履约证据。

Creator 不可以：

- 创建他人的 Order、Payment、Settlement、Ledger Entry 或 Withdrawal；
- 将未付款、已取消、已退款或 Pending Resolution 的 Order 标记为 Fulfilled / Completed；
- 直接修改 Payment Confirmation、Settlement 金额、Ledger Balance 或 Withdrawal Result；
- 绕过 Provider Adapter 或受控 Operations 将 Earnings 标记为 Available。

### 4.2 Customer

Customer 是 Request 与 Payment 的需求主体。

Customer 可以：

- 创建 Request；
- 查看自身 Request、Order、Payment 和结果；
- 在产品规则允许时取消未付款 Order 或请求退款；
- 查看与自身 Order 关联的服务、Payment、Fulfillment 与 Completion 结果。

Customer 不可以：

- 查看 Creator Wallet、净收入、Platform Fee、Provider Fee、结算账户或内部审计记录；
- 标记 Payment 成功、Fulfillment 完成、Settlement 完成或 Withdrawal 成功；
- 直接修改价格快照或退款金额。

### 4.3 Platform

Platform 是 Commerce / Settlement Orchestrator，不默认是 Service Seller、Merchant of
Record、资金托管方或 Creator 收款账户所有者。

Platform 必须：

- 维护对象关联、权限、状态、Canonical Event 和审计证据；
- 接收并验证 Provider Adapter 的可信事实；
- 依据冻结规则计算或记录 Settlement；
- 从 Ledger Entry 投影 Wallet；
- 将 Provider 限制作为 Adapter Constraint，而不是隐式改写产品对象；
- 阻止无授权的资金、状态或余额变更。

### 4.4 Pilot Operations Owner

Pilot Operations Owner 仅在受控权限和审计条件下：

- 查看异常链路；
- 处理 Pending Resolution；
- 记录人工 Evidence；
- 发起经过批准的 Cancellation、Refund、Adjustment 或 Reversal 流程；
- 对 Provider 事件、对账差异或风险限制进行升级。

Operations Owner 不拥有任意改写余额、伪造 Provider Result 或跳过 Creator / Customer 权限
的权限。

## 5. Product Object Requirements

### 5.1 Existing VS-01 Objects

VS-02 保留并不静默重写：

- Creator；
- Commerce Identity；
- Capability；
- Offering；
- Inventory；
- Availability；
- Customer；
- Commerce Action；
- Confirmed Commerce。

`Confirmed Commerce` 仍表示 Creator 已接受 Request；它不自动等于 Order、Payment、Paid、
Fulfillment、Settlement、Wallet Credit 或 Completed Commerce。

### 5.2 New VS-02 Objects

#### Order

Order 表达一次具体的商业购买承诺。

Order 必须关联：

- Confirmed Request；
- Creator；
- Customer；
- Creator Commerce Identity；
- Service Offering；
- Currency；
- Gross Price；
- Service 时间、地点或其他履约条件；
- 交易时 Offering Snapshot；
- Payment、Fulfillment、Settlement、Cancellation / Refund 关联。

Order Snapshot 至少冻结标题、描述、价格、币种、Creator、Customer、服务条件和适用规则。
后续编辑 Offering 不得重写既有 Order。

#### Payment

Payment 表达一个 Order 的资金尝试、可信确认、失败、退款或反转事实。

Payment 必须关联：

- Order；
- Amount 与 Currency；
- Payment Attempt；
- Payment State；
- Provider-neutral Payment Reference；
- Provider Adapter / Source；
- 已验证的 External Fact 或测试受控事实；
- 退款、反转或争议关联。

Payment 不存储银行卡号、CVV、完整支付凭据、Provider Secret 或未脱敏结算账户信息。

#### Fulfillment

Fulfillment 表达 Creator 对 Paid Service Order 的服务交付责任和结果。

Fulfillment 必须关联：

- Order；
- Creator；
- Customer；
- 预期服务条件；
- 实际完成时间；
- 证据或受控说明；
- Fulfillment State；
- 操作者和审计引用。

#### Settlement

Settlement 表达 Order 的收入归属与分配事实。

Settlement 必须关联：

- Order；
- Payment；
- Fulfillment；
- Creator；
- Currency；
- Gross Order Amount；
- Provider Fee；
- Platform Fee；
- Refund、Adjustment、Reserve、Dispute 或其他合法扣减；
- Creator Net Earnings；
- Settlement Trigger；
- Provider-neutral Settlement Reference；
- Settlement State。

Settlement 公式为：

```text
Creator Net Earnings
= Gross Order Amount
- Provider Fee
- Platform Fee
- Refund / Reserve / Approved Adjustment
```

任何未知的 Provider Fee、Platform Fee、Refund、Reserve 或 Adjustment 必须显式记录为未知
或待处理，不得用猜测金额生成 Available Earnings。

#### Creator Earnings Ledger

Creator Earnings Ledger 表达 Creator 应得收入的不可覆盖账本。

每一笔 Ledger Entry 至少包含：

- Entry Identifier；
- Creator；
- Currency；
- Signed Amount；
- Entry Type；
- Effective Time；
- Order / Payment / Fulfillment / Settlement / Withdrawal Reference；
- Source Fact；
- Correlation / Idempotency Reference；
- Provider Reference（若有）；
- Actor / System Source；
- Audit Evidence。

Ledger Entry 只追加。修正、退款、保留、释放、Withdrawal 或反转必须创建新的 Entry；
不得覆盖、删除或静默修改历史金额事实。

#### Wallet

Wallet 是 Creator Earnings Ledger 的产品化收益账户视图。

Wallet 至少投影：

- Pending Earnings；
- Available Earnings；
- Restricted / Reserved Earnings；
- Withdrawal In Progress；
- Withdrawn Amount；
- 可追溯的 Ledger 明细。

Wallet Balance 不是独立事实源，必须始终能由 Ledger Entries 重建。

#### Withdrawal

Withdrawal 表达 Creator 将 Available Earnings 提取至外部结算目标的商业 Intent 与结果。

Withdrawal 必须关联：

- Creator；
- Currency；
- Requested Amount；
- 脱敏 Withdrawal Destination Reference；
- Idempotency Key；
- Requested Time；
- Processing / Completion / Failure Result；
- Provider-neutral Withdrawal Reference；
- Ledger Reservation 与最终 Ledger Entry；
- 审计证据。

Withdrawal 不是平台自建打款系统；它通过 Provider Adapter 或未来合规结算能力执行。

#### Cancellation and Refund

Cancellation 是最低责任能力；Refund 是最低资金异常能力。

它们可以在工程上表示为 Order / Payment / Settlement 的状态或关联记录，但产品上必须：

- 关联对应 Order；
- 区分付款前取消、付款后无法履约和退款；
- 保留原因、操作者、时间、金额、证据与 Provider Reference；
- 不把 Refund 误记为 Completed Paid Commerce；
- 不通过删除或覆盖 Payment、Settlement 或 Ledger Entry 解决异常。

## 6. Orthogonal Lifecycles

### 6.1 Commerce Lifecycle

```text
Requested
→ Confirmed
→ Paid
→ Fulfilled
→ Completed
```

最低终止或异常分支：

```text
Declined
Cancelled
Pending Resolution
Refunded
```

语义：

- `Requested`：Customer 已提交合法 Request；
- `Confirmed`：Creator 接受 Request；此时尚未付款；
- `Paid`：可信 Payment Confirmation 已关联 Order；
- `Fulfilled`：Creator 已完成服务交付并记录证据；
- `Completed`：Commerce 履约完成，且不处于未解决的退款、争议或失败状态。

### 6.2 Money Lifecycle

```text
Payment Pending
→ Payment Confirmed
→ Pending Earnings
→ Settled
→ Available
→ Withdrawal Requested
→ Withdrawn
```

最低异常分支：

```text
Payment Failed
Refund Pending
Refunded
Restricted
Settlement Reversed
Withdrawal Failed
Withdrawal Reversed
```

语义：

- `Payment Pending`：Payment Attempt 已创建，尚无可信成功事实；
- `Payment Confirmed`：可信 Payment Fact 已确认；
- `Pending Earnings`：Payment 已确认，但尚未满足 Settlement Trigger；
- `Settled`：Settlement 已计算并记录收入归属；
- `Available`：对应 Ledger 投影允许 Creator 发起 Withdrawal；
- `Withdrawn`：Provider 或受控结算路径确认外部转出完成。

### 6.3 Lifecycle Separation Rules

Commerce 与 Money Lifecycle 必须正交：

```text
Order Completed
≠ Wallet Available

Order Completed + Pending Settlement
is valid.
```

同样：

```text
Payment Confirmed
≠ Fulfilled
Payment Confirmed
≠ Creator Earnings Available
Withdrawal Requested
≠ Withdrawn
```

`Settlement` 是两个生命周期之间的连接对象，但不把两条状态链合并成单一枚举。

## 7. Canonical Flow and State Transitions

### 7.1 Canonical Paid Service Flow

```text
Creator Service Offering
→ Customer Request
→ Creator Confirm
→ Order Created
→ Payment Attempt
→ Payment Confirmed
→ Pending Earnings
→ Fulfillment Recorded
→ Settlement Calculated / Released
→ Ledger Entries Appended
→ Wallet Available
→ Withdrawal Requested
→ Withdrawal Completed
→ Completed Commerce
```

`Completed Commerce` 的显示条件必须由 36 冻结并可解释；至少不得把未付款、未履约、
未结算或存在未解决资金异常的 Order 显示为完成。

### 7.2 Required Transition Rules

| From | To | Required condition |
| --- | --- | --- |
| Confirmed Request | Order Created | Request belongs to Creator/Customer; Offering snapshot is valid |
| Order Created | Payment Pending | Order is payable and amount/currency are fixed |
| Payment Pending | Payment Confirmed | Trusted Provider-neutral Payment Fact is verified |
| Payment Pending | Payment Failed | Trusted failure/expiration/cancellation fact exists |
| Payment Confirmed | Pending Earnings | Payment amount and Order association are valid |
| Paid Order | Fulfilled | Creator owns Order; service conditions are met; evidence recorded |
| Fulfilled | Settlement Released | Settlement trigger and calculation pass invariants |
| Settlement Released | Available | Append-only Ledger Entries project an available amount |
| Available | Withdrawal Requested | Creator owns balance; amount is available; idempotency key is valid |
| Withdrawal Requested | Withdrawn | Trusted Provider-neutral completion fact is verified |
| Paid / Fulfilled / Settled | Pending Resolution | Refund, dispute, restriction, reversal or exceptional responsibility requires resolution |

### 7.3 Transition Prohibitions

The system must reject:

- Order creation from Declined, Cancelled or unauthorized Request;
- Payment confirmation from client-provided success text, screenshot or mutable UI state;
- Fulfillment before Payment Confirmed;
- Settlement before a valid Payment and Settlement Trigger;
- Available Balance without supporting Ledger Entries;
- Withdrawal above Available Earnings, duplicate Withdrawal, or another Creator's balance;
- deleting or overwriting Payment, Settlement, Ledger or Withdrawal history;
- treating `external_paid_verified` from VS-01 as VS-02 Payment Confirmed without a registered
  migration / compatibility decision;
- a Refund or Reversal being displayed as a successful Completed Commerce.

## 8. Functional Requirements

### 8.1 FR-201 — Order Creation and Snapshot

The system must create exactly one logical Order for a payable Confirmed Request under an idempotent
business key, preserve Order Snapshot data, and prevent Offering edits from modifying existing Orders.

### 8.2 FR-202 — Payment Fact

The system must support Payment Attempt, Confirmation, Failure, Refund and Reversal facts. Only a
trusted Adapter, verified event or controlled test fixture may change Payment Confirmation state.

### 8.3 FR-203 — Paid Fulfillment

The system must permit the owning Creator to record Fulfillment only for a paid, non-cancelled,
non-refunded Order, with auditable completion evidence.

### 8.4 FR-204 — Settlement Calculation

The system must create a Settlement from a valid Order, Payment and Settlement Trigger, calculate
Gross, Provider Fee, Platform Fee, Refund / Reserve / Adjustment and Creator Net Earnings with exact
currency-safe arithmetic, and preserve its inputs and references.

### 8.5 FR-205 — Immutable Earnings Ledger

The system must append Ledger Entries for all Money Layer changes. It must derive balances from those
entries and prohibit direct Wallet Balance mutation.

### 8.6 FR-206 — Wallet Projection

The system must show the owning Creator a Wallet view projected from Ledger Entries, including Pending,
Available, Restricted, Withdrawal In Progress and Withdrawn amounts.

### 8.7 FR-207 — Withdrawal

The system must allow the owning Creator to create an idempotent Withdrawal Intent for an available
amount. The system must reserve or otherwise control the amount through Ledger Entries until a trusted
completion, failure or reversal fact is recorded.

### 8.8 FR-208 — Failure, Cancellation and Refund

The system must provide the minimum closure for Payment Failed, Cancellation Before Payment, Creator
Unable to Fulfill, Refund, Settlement Reversal, Dispute / Pending Resolution, Provider Account
Restriction and Withdrawal Failure without deleting historical facts.

### 8.9 FR-209 — Provider Adapter Boundary

The product must consume Provider-neutral facts:

```text
Payment Fact
Settlement Fact
Refund / Reversal Fact
Withdrawal Fact
Account Restriction Fact
```

Provider-specific transaction identifiers, signatures, webhooks, account types and API semantics belong
to Adapter / Infrastructure layers and must not become Commerce Domain states.

### 8.10 FR-210 — Auditability

The system must enable an authorized reviewer to reconstruct:

```text
Order
→ Payment
→ Fulfillment
→ Settlement
→ Ledger Entries
→ Wallet Projection
→ Withdrawal
```

for any VS-02 transaction without relying on mutable UI values or undocumented manual database edits.

## 9. Product Rules and Canonical Events

### 9.1 Product Rules

1. All VS-02 monetary values are represented in a declared currency; VS-02 launch currency is CNY.
2. Money calculations use precise minor-unit or decimal-safe representations; floating-point display
   values are not money facts.
3. One Order has one Service Offering Snapshot, one Customer, one Creator and one gross price.
4. A Payment Fact must be idempotent by Provider-neutral correlation reference.
5. A Settlement must be reproducible from preserved inputs and its calculation version.
6. A Ledger Entry is append-only; corrections are compensating entries.
7. A Wallet balance is a projection, never a writable source of truth.
8. A Withdrawal must reserve or deduct only the amount authorized by available Ledger Projection.
9. Refund, dispute, restriction and reversal must affect availability through auditable facts.
10. Provider Qualification may constrain Adapter implementation, but may not silently change VS-02
    object semantics.
11. Real-money evidence requires real external Provider facts; controlled build evidence must be labeled
    non-production and cannot satisfy the Phase completion outcome.

### 9.2 Canonical Events

VS-02 must define and record at least:

```text
order_created
payment_attempted
payment_confirmed
payment_failed
fulfillment_recorded
settlement_calculated
settlement_released
ledger_entry_appended
wallet_availability_changed
withdrawal_requested
withdrawal_completed
withdrawal_failed
cancellation_recorded
refund_requested
refund_confirmed
settlement_reversed
pending_resolution_opened
pending_resolution_resolved
```

Each event must include its aggregate reference, actor/source, occurred time, correlation reference and
auditable reason or evidence where applicable.

### 9.3 Provider Event Boundary

A Provider event is an external fact only after Adapter authenticity, signature / source validation,
idempotency and correlation checks pass. Unverified webhooks, browser redirects, screenshots and
client claims must not create `payment_confirmed`, `settlement_released` or `withdrawal_completed`.

## 10. Acceptance Criteria

### 10.1 Order and Payment

- A Creator-confirmed Request can produce one idempotent Order with an immutable Service Snapshot.
- Customer and Creator can access only their related Order.
- Payment Pending, Confirmed and Failed are distinguishable.
- A client cannot mark Payment Confirmed without a trusted fact.
- Existing VS-01 `external_paid_verified` remains observation-only until a registered compatibility
  decision migrates it.

### 10.2 Fulfillment and Commerce Lifecycle

- Only the owning Creator can record Fulfillment for a valid Paid Order.
- Unpaid, Declined, Cancelled, Refunded or unauthorized Orders cannot be fulfilled or completed.
- Order Completed and Wallet Available are independently observable.
- Pending Resolution prevents false Completed Commerce claims.

### 10.3 Settlement, Ledger and Wallet

- Settlement calculation preserves Gross, Provider Fee, Platform Fee, deductions and Creator Net.
- A Settlement cannot create a balance without append-only Ledger Entries.
- Wallet views exactly reconcile to Ledger Entries.
- A refund, reserve, adjustment or reversal creates traceable compensating Ledger Entries.
- Direct mutation of a Wallet balance is rejected.

### 10.4 Withdrawal and Failure Closure

- A Creator can request Withdrawal only from Available Earnings.
- Duplicate Withdrawal requests with the same idempotency key do not create duplicate money movement.
- Withdrawal failure/reversal leaves a complete audit chain and an explainable balance projection.
- Payment failure, cancellation, inability to fulfill, refund, dispute/restriction and negative balance
  scenarios enter defined states without deleting historical facts.

### 10.5 Provider-neutrality and External Reality

- No Creator Commerce Domain state or API resource is named after a Provider.
- Provider Adapter can be replaced without redefining Order, Payment, Fulfillment, Settlement, Ledger,
  Wallet or Withdrawal semantics.
- A Controlled Real-money Pilot cannot start until the selected Provider Adapter satisfies the relevant
  external constraints in `35A`.
- First Completed Paid Commerce + First Verified Creator Earnings Cycle requires real external evidence,
  not test, mock or sandbox evidence.

## 11. Explicit Non-goals

VS-02 does not claim:

- universal Creator Commerce coverage;
- a complete order-management system;
- a payment platform or financial institution;
- platform custody or a legally autonomous Creator bank account;
- universal Refund, Chargeback, Dispute or tax automation;
- that Payment Confirmation alone proves commercial completion;
- that Wallet UI alone proves Creator earnings;
- that Provider-neutral Build proves real-money eligibility.

## PRD Freeze Decision

```text
VS-02 — Paid Service + Earnings
Status: Frozen

Scope:
Request → Confirm → Order → Payment → Fulfillment → Settlement
→ Creator Earnings Ledger → Wallet → Withdrawal → Completed Commerce

Provider Qualification:
External Constraint / Parallel Track

Real-money Adapter and Pilot:
Deferred until provider-specific constraint evidence is applied

Out of scope:
Marketplace, multiple verticals, subscriptions, complex financial capabilities,
self-custody, platform stored-value pool, multi-currency and multi-provider launch.
```

Any departure from this PRD requires a registered `DEV-###` before implementation.
