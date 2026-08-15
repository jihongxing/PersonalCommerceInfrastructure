# 32 — Minimum Commercial Loop

> **状态**：Frozen Phase Contract  
> **阶段**：Phase 4 — Minimum Commercial Loop  
> **产品增量**：VS-02 — Paid Service + Earnings  
> **建立日期**：2026-08-14  
> **前置阶段**：Commercialization Readiness / Real Product Cutline — Completed  
> **实现状态**：Not Started — D-MCL-01 approval, VS-02 PRD and governance delta required

## 1. 阶段目标

本阶段只有一个目标：

> 让一个真实 Creator 通过一个真实 Service Offering，从一个真实 Customer 获得一笔
> 真实付款，完成真实履约，完成收入分配并进入 Creator Wallet / Earnings Ledger，
> 最终形成可提现收入，由平台准确记录这笔不可自欺的商业事实。

本阶段不再证明系统“能够承载商业行为”，而是第一次证明系统实际产生了完整的
`Paid + Fulfilled` 商业结果。

```text
Real Identity
→ Commerce Identity
→ Service Offering
→ Availability
→ Public Distribution
→ Customer Request
→ Creator Confirm
→ Order
→ Payment
→ Fulfillment
→ Settlement
→ Creator Wallet
→ Withdrawal
→ Commerce Completion
→ Repeat Supply
```

该链路第一次完整跑通后，项目才从 `Reference Product / Real Product Foundation`
进入 `Commercial Product`。

## 2. 阶段 North Star

### 2.1 Primary Outcome

```text
First Completed Paid Commerce
```

定义：

> 一笔关联真实 Creator、真实 Customer、真实 Service Offering 和真实价格的 Order，
> 已发生真实付款，付款结果得到可信确认，对应服务完成真实履约，平台完成 Platform
> Fee、Provider Fee、Refund / Adjustment 和 Creator Net Earnings 的准确计算，收入进入
> Creator Wallet / Earnings Ledger 并具备可提现路径，平台保存了可追踪、可审计且不
> 泄露支付凭据的完成记录。

仅有 Request、Confirm、Payment Attempt、Payment Success、Fulfillment Observation、
Settlement Calculation、Wallet Credit 或 Withdrawal 中的任意单一事实，都不能单独
宣称阶段目标完成。

### 2.2 Metric Tree

```text
Transaction Active Creator
        ↓
Paid Commerce
        ↓
Fulfilled Commerce
        ↓
Settled Commerce
        ↓
Creator Earnings Available
        ↓
Completed Paid Commerce
        ↓
Repeat Supply
        ↓
Repeat Commerce
        ↓
Revenue per Active Creator
```

本阶段只以 `First Completed Paid Commerce` 作为完成门槛。Repeat Supply 和 Repeat
Commerce 是下一阶段扩张闸门，不得通过测试、Mock 或内部账号伪造。

## 3. 产品范围

### 3.1 唯一 Commerce 类型

本阶段只支持：

```text
Service Offering
```

首个受控使用场景为舞者 / 舞蹈老师提供的一对一付费服务，例如：

```text
舞蹈私教
固定价格
固定或明确约定的服务时长
明确地点或交付方式
Request → Confirm → Pay → Fulfill → Complete
```

第一笔真实收入必须来自 Service，不得在本阶段引入 Ticket、Event、Experience、
Merchandise 或其他垂直对象。

### 3.2 Canonical Commerce Flow

以下流程是 `Service Commerce Pattern`，不是所有 Creator Commerce 的 Universal Flow：

```text
Offering
→ Request
→ Creator Confirm
→ Order Created
→ Payment
→ Payment Confirmed
→ Fulfillment
→ Settlement
→ Wallet Credit
→ Withdrawal Available
→ Completed
```

失败闭环至少必须能表达：

```text
Pending
Paid
Cancelled
Refunded
Completed
```

`Pending Resolution` 可作为已付款但履约、取消或退款尚未解决时的受控异常结果候选，
是否进入正式状态机由 VS-02 PRD 决定。

这些词首先是 Customer、Creator 和 Operations 可理解的商业生命周期结果。它们具体
归属于 Order、Payment、Fulfillment、Settlement、Wallet 或 Withdrawal 的哪一个状态机，
必须在 Money Flow 和 Commerce Pattern & Settlement Model 决策后由 VS-02 PRD 冻结，
不得由实现代码提前决定。

### 3.3 与 VS-01 的关系

VS-02 是 VS-01 的 Commerce Extension，不是新产品，也不重建现有产品架构。

保持不变：

- Commerce Identity、Capability、Service Offering 和 Availability 继续复用；
- Public Distribution 和 Customer Request 继续复用；
- `Request → Confirm / Decline` 继续表达 Creator 是否接受 Customer Request；
- Confirmed Request 不自动等于 Order、Payment 或 Completed Commerce；
- VS-01 的既有数据、状态、事件、权限和验收不得被静默重写。

新增 Commerce 只从 Confirmed Request 之后开始：

```text
Confirmed Request
→ Order
→ Payment
→ Fulfillment
→ Settlement
→ Wallet
→ Withdrawal
→ Completion
```

## 4. 新增产品对象

### 4.1 Order — 必须

Order 表达：

> Customer 对一个已被 Creator 接受的 Service Offering 所形成的明确购买承诺。

Order 必须至少关联：

- Confirmed Request；
- Creator；
- Customer 或受控 Customer 联系身份；
- Service Offering 的交易快照；
- 价格和币种；
- 创建时间；
- 当前商业生命周期结果；
- 关联 Payment 和 Fulfillment。

Order 必须保存交易时快照，后续 Offering 编辑不得重写既有 Order 的标题、价格、
服务时长、地点或交付条件。

### 4.2 Payment — 必须

Payment 表达：

> 对一个 Order 的真实资金尝试及其可信结果。

Payment 必须区分至少：

- 尚未完成；
- 成功确认；
- 失败；
- 已退款或退款处理中。

Payment 不得存储银行卡号、CVV、完整支付凭据或 Provider Secret。真实支付状态必须
来自所选 Money Flow Model 下的可信 Provider 结果，不得信任客户端自行提交
“支付成功”。

### 4.3 Fulfillment — 必须

Fulfillment 表达：

> Creator 对已付款 Service Order 的真实服务交付责任及结果。

Fulfillment 必须至少关联 Order、Creator、预期交付条件、实际完成时间和可审计证据。
Creator 不得将未付款或已取消的 Order 直接标记为 Completed，除非 VS-02 PRD 定义并
批准受控例外。

### 4.4 Settlement — 必须

Settlement 表达：

> 一笔满足结算条件的 Commerce，最终有多少钱属于 Creator、平台和 Payment Provider，
> 以及这些金额何时从 Pending 变为 Available。

Settlement 必须至少表达：

- Gross Order Amount；
- Payment Provider Fee；
- Platform Fee / Take Rate；
- Refund、Adjustment、Dispute 或其他合法扣减；
- Creator Net Earnings；
- Settlement Trigger；
- Pending / Available / Reversed 等结算结果；
- 对应 Order、Payment、Fulfillment 和 Provider Reference；
- 计算规则版本、时间和审计关联。

Platform Fee 是本阶段的必备商业事实，不得最终冻结为永久 `None / 0`。具体费率、
扣取时点、支付方和 Provider 产品能力仍由 D-MCL-01 与 VS-02 PRD 决定。

### 4.5 Creator Wallet / Earnings Ledger — 必须

Wallet 表达：

> Creator 在平台商业活动中产生的收入、扣减、待结算金额、可提现余额和提现记录的
> 统一商业账户 / Ledger。

Wallet 首先是产品与账本概念，不自动等于银行账户、支付账户、储值账户或平台自行
托管的资金池。

至少必须区分：

- Pending Earnings：Payment 已确认但尚未满足结算条件；
- Available Balance：已完成 Settlement、当前可申请提现的金额；
- Withdrawn Amount：已经完成提现的金额；
- Restricted / Reserved Amount：因 Refund、Dispute、Chargeback 或风险原因暂不可用；
- Lifetime Earnings：历史累计 Creator Net Earnings。

Wallet 必须由不可变或可完整追踪的 Ledger Entry 支撑，不得仅以一个可直接覆盖的
`balance` 数值作为事实源。

底层资金可由合规支付 Provider 的商户账户、分账账户、余额账户或其他受监管设施托管。
平台是否法律上持有、控制或沉淀资金仍属于 D-MCL-01 的阻塞决策。

### 4.6 Withdrawal — 必须

Withdrawal 表达 Creator 将 Available Balance 转移到其可控制结算账户的请求与结果。

最低要求：

- 只能从 Available Balance 发起；
- 不得造成负余额；
- 必须关联 Creator、金额、币种、收款目标的脱敏引用和 Provider Reference；
- 必须区分 Requested、Processing、Succeeded、Failed 或 Reversed 等最低结果；
- 提现失败不得丢失 Creator Earnings；
- 提现时间可由 Creator 自由选择，但具体频率、最低金额和 Provider 限制由后续合同冻结。

### 4.7 Cancellation — 最低责任能力

本阶段必须能处理付款前取消和无法继续履约的责任边界，但不预设 Cancellation 必须
成为独立 Aggregate。VS-02 PRD 应根据 Money Flow 决策确定它是 Order 状态转换、
Cancellation Record 还是 Canonical Event。

最低要求：

- 谁可以取消；
- 在什么时间点可以取消；
- 是否已付款；
- 取消原因；
- 对 Payment、Fulfillment 和 Customer 结果的影响；
- 操作者、时间和审计关联。

### 4.8 Refund — 最低资金异常能力

本阶段必须能处理“已付款但交易不能继续完成”的最小退款路径，但不建设退款平台。
Refund 是否成为独立对象、Payment 子记录或 Provider 事实，由 Money Flow 决策和
VS-02 PRD 冻结。

最低要求：

- Refund 只能关联已确认的真实 Payment；
- Refund 金额不得超过可退金额；
- Refund 必须来自可信 Provider 或经批准的受控资金事实；
- Refund 不得被误记为 Completed Paid Commerce；
- 退款原因、操作者、Provider Reference、发生时间和最终结果必须可审计。

## 5. Provider Qualification External Constraint Track

平台如何接触真实资金仍由外部 Provider、法律和运营事实决定。根据
`D-MCL-GATE-01`，该事实不再阻塞 VS-02 产品化、36 Engineering Governance Delta 或
Provider-neutral Money Domain Build。

```text
D-MCL-01 — Money Flow Model
```

`D-MCL-01` 是 Provider-specific Adapter 和 Controlled Real-money Pilot 的外部约束决策，
不再是 MCL-02、MCL-03 或 Provider-neutral Build 的前置 Gate。

候选模型：

- Model A — Creator-direct；
- Model B — Platform Checkout；
- Model C — Provider-backed Creator Settlement。

比较框架和决策门槛定义于：

`docs/09_Engineering_Governance/33_Money_Flow_Decision.md`

在 Provider-specific Adapter 获得资格确认和 Pilot 批准前，禁止：

- 集成真实支付 Provider；
- 发起真实 Creator KYC/KYB、真实商户进件或真实账户绑定；
- 发送真实资金 Payment、Refund、Payout 或 Withdrawal；
- 将平台声明为 Merchant、Seller、Agent 或资金接收方；
- 将 Provider-specific Platform Fee、Settlement、Wallet / balance 或 Withdrawal 规则
  作为已确认的真实世界能力；
- 以测试支付或外部付款观察宣称 Minimum Commercial Loop 完成。

并行外部工作面是：

```text
Money Flow Decision Input Pack
```

必须先补齐首发部署市场、首发币种、交易主体、Provider 候选、Creator Onboarding 和
资金责任六类真实事实。Decision Input Sheet 定义于 `33_Money_Flow_Decision.md`。

当前已冻结的架构约束：

```text
China-first
CNY-first
WeChat Pay + Alipay launch candidates
Provider Adapter architecture
Regional legal / merchant model
Mandatory Platform Fee
Settlement + Creator Wallet / Earnings Ledger
Global-ready, not Global Product
```

未来 Stripe、PayPal 或其他区域 Provider 只能作为 Adapter 候选，不进入中国首版 Scope。
多币种 UI、多国家税务、多语言支付和国际退款规则继续 Deferred。

## 6. 五个 Workstream

### MCL-01 — Money Flow

决定：

- 谁向谁付款；
- 谁是交易主体；
- 谁持有或控制资金；
- 平台如何获得可信 Payment Confirmation；
- Creator 如何完成必要的支付账户 / KYC Onboarding；
- Cancellation、Refund、Dispute 和 Chargeback 由谁负责；
- Platform Fee 如何收取，以及收费发生在哪个环节；
- Settlement、Wallet 和 Withdrawal 的资金权属与 Provider 责任。

完成输出：批准的 `D-MCL-01`。

### MCL-02 — Paid Commerce Model

在不修改 VS-01 既有语义的前提下，先由 Commerce Pattern & Settlement Model 冻结：

- Commerce Lifecycle 的共同阶段；
- Service、Reservation、Ticket、Contract 和 Instant Commerce 的 Pattern 差异；
- Payment、Settlement、Wallet 和 Withdrawal 的统一出口；
- 不同 Pattern 的 Settlement Trigger、Refund 和 Completion 语义。

完成输出：`34_Commerce_Pattern_Settlement_and_Wallet_Model.md`。

随后由 VS-02 Paid Service PRD 冻结：

- Order、Payment、Fulfillment 的定义和归属；
- Settlement、Wallet Ledger 和 Withdrawal 的最小实现范围；
- Confirmed Request → Order 的创建规则；
- 最小状态机和非法转换；
- Cancellation、Refund 和 Pending Resolution 的表示；
- 幂等、金额、币种、时间、所有权和审计不变量；
- Canonical Event 和 API Contract。

完成输出：`35_VS02_Paid_Service_PRD.md`。

### MCL-03 — Real Commerce UX

只设计和实现：

```text
Creator Confirm
→ Customer Pay
→ Payment Result
→ Creator Fulfill
→ Customer / Creator Completion Result
```

不得借本 Workstream 重做整个 Creator OS、Public Surface 或 Design System。

### MCL-04 — Controlled Commercial Pilot

目标 Pilot Cohort：

```text
5–10 个真实舞者 / 舞蹈老师 Creator
```

Pilot 只验证一对一付费 Service。Creator、Customer、Offering、价格、付款、履约和收入
必须全部是真实业务事实。

工程测试账号、团队成员自买自卖、无实际资金移动的 Provider Sandbox 或事后手工补写
不能作为 First Completed Paid Commerce 的完成证据。

### MCL-05 — Commercial Evidence

平台至少记录：

- Order；
- Payment；
- Fulfillment；
- Settlement；
- Wallet Ledger Entry；
- Withdrawal；
- Cancellation；
- Refund；
- Creator Revenue；
- Platform Fee / Revenue；
- Repeat Supply；
- Repeat Commerce。

Platform Fee 是商业模型必备项；如果受控 Pilot 的第一笔交易因 Provider 审核或运营
限制不能自动扣取，必须记录应收 Platform Fee、批准的临时处理方式和后续追收结果，
不得把该例外改写为“平台不收费”。

商业证据必须区分：

- 系统记录；
- Provider 事实；
- Pilot Operations 事实；
- 真实业务结果；
- 推断或分析指标。

## 7. Completion Criteria

Minimum Commercial Loop 只有在以下条件全部满足时才可完成：

1. `D-MCL-01` 已批准，Money Flow、交易主体、资金责任、Platform Fee 和退款责任明确；
2. Commerce Pattern、Settlement、Wallet 和 Withdrawal 的上层模型已冻结；
3. VS-02 Paid Service PRD、状态机、权限、事件和验收条件已冻结；
4. 一个真实 Creator 完成支付所需 Onboarding，并发布一个真实有价 Service Offering；
5. 一个真实 Customer 对该 Offering 提交 Request，Creator 真实 Confirm；
6. 平台创建一个真实 Order，保存不可变交易快照；
7. Customer 支付真实资金，Payment 由可信 Provider 或批准的 Money Flow 事实确认；
8. Creator 完成真实服务履约，Fulfillment 结果可审计；
9. Settlement 准确计算 Gross、Provider Fee、Platform Fee 和 Creator Net Earnings；
10. Creator Net Earnings 进入 Wallet Ledger，并从 Pending 转为 Available；
11. Creator 至少完成一次真实 Withdrawal 或完成 Provider 可提现能力的真实验证；
12. Order 进入 Completed，并且该结果满足 `Paid + Fulfilled + Settled`；
13. Creator Revenue、Platform Fee / Revenue 和 Provider Fee 被准确记录；
14. 失败路径至少验证 Payment Failed、Cancellation、Refund 和 Withdrawal Failed 中与
    所选模型相关的路径；
15. 数据、权限、金额、状态、Webhook / Provider Event、日志和审计可追踪；
16. 真实交易证据经过产品负责人确认，未使用 Mock、Fixture 或 Sandbox 替代。

完成声明必须使用：

```text
First Completed Paid Commerce Verified
```

不得仅使用 `Payment Integrated`、`Checkout Works` 或 `Order Created` 作为阶段完成声明。

## 8. Expansion Gate

完成第一笔 Paid Commerce 后，项目仍不得立即扩展为 Marketplace 或多垂直平台。

只有出现以下真实事实，才允许评估下一产品阶段：

```text
Repeat Supply
+ Repeat Commerce
```

即：至少一个真实 Creator 在完成真实 Commerce 后，主动更新、重新发布或补充供给，
并再次产生一笔真实 Completed Paid Commerce。

在此之前，优先修复真实闭环中的失败、责任、信任和履约问题，不增加更多功能、
更多垂直或更复杂的 Commerce Primitive。

## 9. Explicit Non-goals

本阶段明确不建设：

- Payment Platform；
- Marketplace；
- Ticket、Event、Experience 或 Merchandise；
- Subscription；
- 多币种和多支付方式；
- 平台自行托管的资金池、无监管储值或自建支付清算系统；
- Wallet Credit、贷款、保险、理财、税务工具或 Expense Management；
- 分账、多方结算和 Marketplace Payout；
- 发票和复杂税务系统；
- 大型 Order Management System；
- 搜索、推荐、CRM、会员和大型运营后台；
- 多组织、团队、生态开放平台；
- 与 First Completed Paid Commerce 无关的 UI 重构或工程扩张。

## 10. 阶段执行顺序

```text
1. Freeze 32 Minimum Commercial Loop
2. Freeze 34 Commerce Pattern, Settlement and Wallet Model
3. Freeze 35 VS-02 Paid Service PRD
4. Freeze 36 Engineering Governance Delta
5. Provider-neutral VS-02 Build
6. Provider Integration Adapter
7. Controlled Real-money Pilot
8. Verify First Completed Paid Commerce
9. Observe Repeat Supply and Repeat Commerce
```

当前已完成步骤 1–4。Provider Qualification 作为并行 External Constraint Track 继续推进；
它决定后续 Provider Adapter 和 Controlled Real-money Pilot，不阻塞 Provider-neutral
VS-02 Build。
