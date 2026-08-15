# 35 — China Creator Settlement Infrastructure Map

> **研究状态**：Gate 0A Expansion — Evidence Mapped; D-MCL-01 Still Pending  
> **建立日期**：2026-08-14  
> **适用阶段**：Minimum Commercial Loop / VS-02 Paid Service + Earnings  
> **实现授权**：None

## 1. Research Question

本研究不选择支付 Provider，也不批准任何法律或资金结构。它回答更高层的问题：

> 中国平台如何把 Creator 的商业收入从交易事实转换为可结算、可提现、可审计的
> Creator Earnings？

研究重点不是“平台是否自己做支付”，而是识别以下角色是否分离：

```text
Commerce Platform
    ↓
Payment / Collection Institution
    ↓
Settlement Account / Provider Ledger
    ↓
Platform Fee / Service Fee / Tax Handling
    ↓
Creator Earnings
    ↓
Withdrawal Account
```

## 2. Core Finding

当前官方证据支持一个重要修正：

```text
Creator Wallet
≠
Platform-created money pool

Creator Wallet
=
Creator Earnings Ledger + Provider-backed available balance + Withdrawal UX
```

平台可以拥有订单、费用、结算和收益账本的产品事实；底层收款、资金分配、结算账户、
提现和税务处理，则可能由支付机构、结算服务机构、MCN 或其他合规合作方承担。

这使 `Settlement Infrastructure` 成为比单一 `Payment Adapter` 更准确的研究对象。

## 3. Verified Reference — 巨量星图

巨量星图官方达人帮助中心提供了两种不同的 Creator 收益路径。

### 3.1 Individual Creator Direct Withdrawal

官方页面《个体达人/MCN达人结算》明确说明：

- 个体达人完成任务后，可将收益自行提现至个人账户；
- 首次提现前需要绑定提现信息并完成实名认证；
- 支持绑定个人支付宝账户和银行卡账户；
- 实名认证应与提现账户实名认证主体一致；
- 达人可以在财务管理中发起提现，平台展示预计到账时间。

这证明了一种 `Creator-direct Settlement`：

```text
Task Completed
    ↓
Platform Earnings Balance
    ↓
Creator Identity / Withdrawal Account Binding
    ↓
Creator Withdrawal
```

### 3.2 MCN Creator Institutional Settlement

同一官方页面明确说明：

- MCN 达人完成任务后，平台将任务收益打款至 MCN 机构账号；
- 平台与 MCN 机构进行对公结算；
- 如果机构与达人设置分账比例，平台可按照生效比例分别结算；
- 未设置分账比例时，默认可能先将收益结算给机构，再由机构处理与达人的结算；
- MCN 与达人之间的款项结算由机构处理。

这证明了另一种 `Institution-mediated Settlement`：

```text
Task Completed
    ↓
Platform Settlement
    ↓
MCN / Institution Account
    ↓
MCN ↔ Creator Internal Settlement
    ↓
Creator Receives Funds
```

因此，“一个 Creator 必须直接绑定自己的收款账户”不是唯一产品模式。Creator 可以直接
提现，也可以通过已绑定的机构完成收入结算；这两种模式的 Seller、KYC、税务、退款和
负余额责任都不同。

### 3.3 Platform Fee and Tax Evidence

巨量星图官方结算帮助内容还显示：

- 企业达人对公结算可在任务结算时扣除平台信息技术管理服务费；
- 自然人提现规则包含实名认证、预扣税金和后续税务处理说明；
- 平台公开说明自然人提现的实际到账金额可能扣除相关税费。

这证明三个产品事实：

1. Platform Fee 可以在结算时从 Creator 应收金额中扣除；
2. Creator Earnings 不是简单的订单 Gross Amount 镜像；
3. 自然人、企业/机构 Creator 可能需要不同的结算与税务流程。

这些事实不能直接推导出本项目可以复制巨量星图的法律结构，但足以证明我们的
`Settlement → Earnings Ledger → Withdrawal` 抽象具有现实参照。

## 4. Reference Architecture Map

### 4.1 Direct Creator Settlement

```text
Customer
    ↓ payment
Commerce Platform / Payment Institution
    ↓ fee + settlement rule
Creator Settlement Account / Provider Ledger
    ↓
Creator Earnings Ledger
    ↓
Creator-bound Alipay / Bank Account
```

适用候选：自然人或个体工商户直接收款，但必须逐项确认 Provider 的进件、结算、税务和
退款规则。

### 4.2 Institutional Creator Settlement

```text
Customer
    ↓ payment
Commerce Platform / Payment Institution
    ↓ platform fee + institutional settlement
MCN / Specialized Settlement Institution
    ↓ internal agreement / split / tax handling
Creator Earnings
    ↓
Creator Withdrawal
```

适用候选：Creator 通过 MCN、专项服务机构或其他合规合作机构完成收入结算。当前不能
把“海握科技”或任何具体机构写成已批准合作方；必须取得对应官方协议、Provider 合同或
商务确认。

### 4.3 Platform Ledger with Provider-backed Funds

```text
Commerce Pattern
    ↓
Order / Payment / Fulfillment
    ↓
Settlement Engine
    ├─ Provider Fee
    ├─ Platform Fee
    ├─ Creator Net Earnings
    └─ Tax / Reserve / Adjustment
    ↓
Creator Earnings Ledger
    ├─ Pending
    ├─ Available
    ├─ Restricted / Reserved
    └─ Withdrawn
    ↓
Provider Withdrawal Capability
```

这是本项目当前最值得研究的 Provider-neutral 产品模型，但不代表平台可以自行持有、
沉淀或支配用户资金。

## 5. Role Map

| Role | Possible responsibility | Must be confirmed for D-MCL-01 |
| --- | --- | --- |
| Commerce Platform | Offering、Order、Commerce Pattern、Platform Fee、Settlement orchestration、Ledger projection | 平台法律角色、是否为 Seller、是否承担退款/争议 |
| Payment Institution | Customer payment、payment fact、fund custody、allocation、provider settlement、withdrawal | 产品资格、商户主体、资金路径、Provider liability |
| Settlement / Service Institution | Creator onboarding、income settlement、tax handling、institutional payout | 是否存在、资质、合同关系、负余额和争议责任 |
| MCN | 机构收款、与 Creator 的内部结算、可能的任务管理 | 是否允许作为 Pilot 结算主体 |
| Creator | Service seller / provider、fulfillment、identity、withdrawal recipient | 自然人、个体工商户或机构内 Creator |
| Customer | Payment、cancellation、refund/dispute request | 消费者保护和争议入口 |

## 6. Impact on D-MCL-01

D-MCL-01 的问题应从：

```text
WeChat Pay or Alipay?
```

升级为：

```text
Which China Creator Settlement Infrastructure Model can legally and operationally
complete one CNY 399 Service transaction?
```

至少比较：

| Model | Creator receives through | Platform owns | Main blocker |
| --- | --- | --- | --- |
| Direct Creator | Provider-backed Creator account | Commerce records and Ledger projection | Natural person vs individual business, Provider onboarding, tax and refund responsibility |
| Institutional | MCN / settlement institution | Commerce records and settlement instructions | Institution qualification, contract chain, Creator internal settlement, dispute responsibility |
| Platform Merchant / Sub-merchant | Provider sub-merchant or connected merchant | Commerce orchestration and platform fee rule | Platform legal role, provider product admission, funds and consumer liability |

当前不选择其中任何一个。第一笔 CNY 399 Pilot 需要先确定最小可执行路径，而不是因为
“钱包必须存在”就默认平台自建钱包或资金池。

## 7. Required Research Inputs

### 7.1 Platform Reference Evidence

- 抖音生活服务 / 巨量星图最新平台协议中，合作支付服务机构的正式定义；
- “收款账户”“结算账户”“可提现余额”的合同主体与资金控制主体；
- 平台费、达人费、服务商费和税费的扣取顺序；
- 自然人、个体工商户、企业、MCN 的不同结算路径；
- 退款、取消、争议、账户限制和负余额处理；
- 专项服务机构的真实资质、职责和合同关系。

### 7.2 Provider Confirmation

- 微信支付平台收付通 / 服务商 / 二级商户的具体适用产品；
- 支付宝第三方应用 / 服务商 / 线上服务商品牌与结算产品；
- 是否支持 Creator 直接结算或机构代结算；
- 是否允许平台收取 Platform Fee；
- 提现、退款、争议、拒付、税务数据和负余额责任；
- Provider 是否接受 5–10 Creator Pilot 的业务结构。

### 7.3 Project Decision Inputs

- Pilot Creator 采用自然人、个体工商户还是机构模式；
- 平台是否需要先与支付/结算机构签约，而不是直接接支付 API；
- Wallet 的 `Pending / Available / Restricted / Withdrawn` 如何映射 Provider 状态；
- 第一笔交易是否必须走机构结算，还是可以先走个体达人直提现；
- Platform Fee 是否在 Provider 分配阶段扣除；
- 税务、发票、消费者保护与退款责任的 owner。

## 8. Current Decision

```text
Gate 0A: Expanded Research Required
Gate 0B: Existing CNY 399 Simulation Remains Valid
Gate 0C: Pending
D-MCL-01: Pending
Selected Model: Not Selected
```

本研究没有批准：

- 抖音式专项服务机构模式；
- MCN 代收代结模式；
- 任意具体中间公司；
- 平台自建 Wallet / 资金池；
- 微信支付或支付宝的最终产品路径；
- 35 VS-02 PRD 或任何支付实现。

## 9. Official Evidence Index

以下为本轮核对的官方页面，核对日期为 2026-08-14：

- 巨量星图《个体达人/MCN达人结算》：
  `https://www.xingtu.cn/help-center/author/109200`
- 巨量星图《个体达人提现税务规则介绍》：
  `https://www.xingtu.cn/help-center/author/148107`
- 巨量星图《企业达人对公结算》：
  `https://www.xingtu.cn/help-center/author/109201`
- 巨量星图《达人平台协议》入口：
  `https://www.xingtu.cn/help-center/author/21762`
- 巨量星图服务商帮助中心：
  `https://www.xingtu.cn/help-center/facilitator`
- 抖音开放平台 / 资产中心的具体资金能力，需要通过登录后的官方文档或商务确认继续核验；
  目前不作为已证实的公共证据。

## 10. Research Boundary

本文是 Gate 0A 的现实世界研究输入，不是产品 PRD、法律意见或支付实现合同。任何
Provider-specific 账户、结算、钱包、提现或税务能力，必须在 D-MCL-01 取得官方产品、
合同、工单或合规确认后，才能进入 35 VS-02 PRD。
