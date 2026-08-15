# 37 — VS-02B Provider Integration Readiness

> **Status**: Frozen  
> **Product Increment**: VS-02B — Provider Integration Readiness  
> **Upstream SSOT**: `35_VS02_Paid_Service_PRD.md`, `36_Engineering_Governance_Delta.md`  
> **External Constraint Track**: `35A_Provider_Qualification_Dossier.md`  
> **Implementation Authority**: 本文件冻结 Provider-neutral Port、Provider Fact、Adapter Boundary、
> Contract Test Harness 与验证规则；不授权任何真实 Provider 或真实资金操作。

## 1. Purpose and Scope

VS-02A 已验证：

```text
Confirmed Request
→ Order
→ controlled Payment Fact
→ Fulfillment
→ Settlement
→ Earnings Ledger
→ Wallet Projection
→ Withdrawal Intent
```

VS-02B 只建立未来资金基础设施的可替换接入边界：

```text
Commerce / Money Domain
→ Application Policy
→ Provider Ports
→ Provider Adapters
→ verified Provider Fact
→ Canonical Product Event
```

Provider 可以分别承担下列角色，亦可以由同一机构承担：

| Role | Responsibility |
| --- | --- |
| Payment Provider | Payment Intent、Payment Status、Payment Fact verification |
| Settlement Provider | Settlement creation、Settlement Status、Settlement Fact verification |
| Withdrawal Provider | Withdrawal Intent submission、Withdrawal Status、Withdrawal Fact verification |

本阶段完成 Port、Contract、Adapter Boundary、Capability Registry、Reference Provider Adapter
及验证 Harness；不改变已冻结的 Commerce / Money Domain 产品对象或状态。

## 2. Provider-neutral Boundary

### 2.1 Core principle

```text
Provider API ≠ Domain Model
```

Domain 只认识：

```text
Order
Payment
Settlement
Withdrawal
Ledger Entry
Wallet Projection
```

禁止将 `WeChatPayment`、`AlipayPayment`、`StripePayment`、Provider SDK 类型、Provider
状态字符串、商户号、账户类型、签名字段或 Provider Secret 作为 Domain Entity、Domain State、
Canonical Product Event 或 Ledger 数据。

Provider-specific payload 只可存在于 Adapter Runtime 的短暂输入；Adapter 必须验证并转换为
Provider-neutral Fact。Application 再依据已冻结 Policy 调用 Money Domain，并记录既有
Canonical Product Event。

### 2.2 Provider Ports

Application Port 必须以产品领域语言表达，并至少覆盖：

| Capability | Required Port Operation |
| --- | --- |
| Payment | create payment intent, get payment status, verify payment fact |
| Settlement | create settlement, get settlement status, verify settlement fact |
| Withdrawal | create withdrawal intent, get withdrawal status, verify withdrawal fact |

Port 的输入和输出只能包含 Provider ID、Provider-neutral resource reference、金额、币种、
idempotency key、验证结果和规范化事实；不得泄漏具体 Provider API request/response 类型。

## 3. Provider Fact and Event Normalization

```text
Provider Event
→ Adapter verification
→ Provider Fact
→ Application policy / replay guard
→ Money Domain transition
→ Canonical Product Event
```

Provider Event 不是 Canonical Product Event。Provider Event 的原始名称、签名及 payload 绝不
离开 Adapter Runtime。Adapter 成功验证后，只能产生下列规范化 Provider Fact：

```text
PaymentSucceeded
PaymentFailed
RefundSucceeded
SettlementSucceeded
WithdrawalSucceeded
WithdrawalFailed
```

每个 Provider Fact 必须包含：

- `providerId`、不可变 `providerEventId`、Provider resource reference；
- 对应的内部 Order / Payment / Settlement / Withdrawal reference；
- `occurredAt`、单调版本或 sequence；
- 若涉及资金，精确 `amountMinor` 与 `currency`；
- 不含 Secret、原始签名、原始 payload、银行卡、KYC/KYB 或账户敏感资料。

Application Policy 仅接受 `verified` Fact。客户端、Creator、Customer 或普通 HTTP Request
不能声明 Payment、Settlement 或 Withdrawal 已成功。

## 4. Idempotency, Replay and Conflict

Provider Fact Receipt Guard 必须满足：

1. 相同 `providerId + providerEventId` 且内容相同，返回 idempotent，不产生第二次领域写入；
2. 同一资源的同终态重复事实（例如 `PaymentSucceeded → PaymentSucceeded`）可幂等；
3. 同一资源的冲突终态（例如 `PaymentSucceeded → PaymentFailed`）必须标记 conflict，不能
   覆盖既有事实；
4. sequence 低于已接受事实的晚到事件必须标记 stale，不能覆盖较新事实；
5. 金额、币种、资源类型或资源 ID 不匹配必须 reject；
6. 任何被拒绝、冲突或过期 Fact 都不得产生 Canonical Product Event、Ledger Entry 或 Wallet
   变化。

Reference Harness 只验证上述规则，不等同于真实 Provider webhook、真实支付验证或真实资金证据。

## 5. Amount and Currency Invariants

所有 Provider Port、Provider Fact、Contract Test、Adapter Harness 与未来 Adapter 必须遵守：

- 金额使用 `MoneyMinor` 整数（当前 TypeScript 实现为 `bigint`），严禁浮点数；
- 当前 VS-02 仅允许 `CNY`；`¥399.00` 必须表示为 `39900`；
- Decimal scale 由 Currency 定义，当前 CNY 为 2；任何显示层转换不能进入 Domain 或 Adapter
  Fact；
- Payment、Settlement、Withdrawal 和 Refund Fact 的金额、币种必须与对应内部商业资源一致；
- Fee、deduction、creator net 和 reversal 必须由已冻结 Settlement Calculation 复算；
- Provider 不得通过字符串金额、四舍五入差异或货币不一致改变内部账本事实。

## 6. Capability Registry

Provider Capability Registry 只记录资格和能力声明，不能自动启用产品能力或 Domain State。

每个记录至少包含：

```text
Provider
Market
Currency
Payment
Settlement
Withdrawal
Refund
Dispute
Account Model
Constraints
Verification Status
Evidence Reference
```

能力状态只能为 `confirmed`、`candidate`、`rejected` 或 `unknown_blocking`。Registry 不记录
Secret，不等同于 Provider Adapter 选择；`35A` 是其外部事实输入。

## 7. Secret Isolation

```text
Provider Secret
→ Adapter Runtime only
→ never Domain / Event / Ledger / API response / Client / Error / Log / Database
```

VS-02B 不引入真实 Secret。未来 Adapter 必须通过运行时 Secret Port 获取 Secret，且 Contract
Test 必须证明验证输入、Provider Fact、错误、Canonical Event 与 API-safe 输出不泄漏 Secret。

## 8. Withdrawal Semantics

```text
Creator
→ Withdrawal Intent
→ Provider Request
→ verified Withdrawal Fact
→ Withdrawal completed / failed
→ append-only Ledger Entry
→ Wallet Projection
```

Withdrawal Intent 不等于 Withdrawal Confirmed。Wallet 不允许直接写入或直接减余额；available、
restricted、in-progress 与 withdrawn 只能由 append-only Ledger Entry 和已验证 Withdrawal Fact
投影得出。未来 Provider Adapter 只能验证或提交 Provider Request，不能覆盖 Wallet Balance 或
Ledger History。

## 9. Explicitly Prohibited

VS-02B 不允许：

- 微信、支付宝、Stripe、PayPal 或其他真实 Provider 集成；
- 真实 KYC/KYB、真实银行或结算账户、真实提现、真实资金流；
- 真实 Webhook Endpoint、生产 Checkout、Provider SDK、真实 Provider Secret；
- Provider-specific Domain Object 或 Provider-specific Business Rule 渗透到 Domain；
- Marketplace、多 Seller Checkout、多币种、订阅、税务、金融 Dashboard 或新的 Commerce Pattern。

## 10. Definition of Done

VS-02B 只有在以下全部满足后才可标记 **Provider Integration Ready**：

- [ ] Provider Ports frozen;
- [ ] Provider Adapter boundary frozen;
- [ ] Provider Fact model frozen;
- [ ] Provider Event normalization complete;
- [ ] Capability Registry complete;
- [ ] Reference Provider Adapter implemented;
- [ ] Provider Adapter Contract Tests complete;
- [ ] idempotency, replay and conflict tests complete;
- [ ] amount and currency invariants complete;
- [ ] Secret isolation verified;
- [ ] Withdrawal Intent semantics verified;
- [ ] VS-02A regression passes;
- [ ] No real Provider integration exists.

完成 VS-02B 不代表 Provider Integrated。下一阶段为 VS-02C — Provider Adapter
Qualification；Provider 选择必须以 `35A` 的外部资格事实为输入，不能反向改变 Money Domain。
