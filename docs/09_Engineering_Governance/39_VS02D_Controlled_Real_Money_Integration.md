# 39 — VS-02D Controlled Real-money Integration

> **Status**: Blocked — Live Integration Readiness is not established  
> **Product Increment**: VS-02D — Controlled Real-money Integration  
> **Upstream SSOT**: `34_Commerce_Pattern_Settlement_and_Wallet_Model.md`,
> `35_VS02_Paid_Service_PRD.md`, `35A_Provider_Qualification_Dossier.md`,
> `36_Engineering_Governance_Delta.md`, `37_VS02B_Provider_Integration_Readiness.md`,
> `38_VS02C_Provider_Adapter_Qualification.md`  
> **Implementation Authority**: 本文件冻结首笔真实资金切片、Live Readiness、Go / No-Go、
> Kill Switch 与证据包要求。当前不授权真实 Provider 调用、真实资金、生产凭据或真实账户操作。

## 1. Purpose

VS-02D 的唯一目标是验证第一条真实资金连接：

```text
Real Creator
→ Real Service Offering
→ Real Customer
→ Real Request
→ Creator Confirm
→ Real Order
→ Real Payment
→ verified Provider Fact
→ Real Settlement / Earnings Fact
→ Ledger Entry
→ Wallet Projection
```

VS-02D 不验证真实 Fulfillment、Completed Commerce 或真实 Withdrawal。它完成后只能声明：

```text
First Real Payment Connectivity Verified
```

不得声明：

```text
First Completed Paid Commerce
First Verified Earnings Withdrawal
Commercial Launch
```

## 2. Fixed First-transaction Boundary

首笔真实交易只能固定为：

| Dimension | Fixed value |
| --- | --- |
| Provider | 一个已 `QUALIFIED` 的 Primary Provider |
| Creator | 1 |
| Service Offering | 1 |
| Customer | 1 |
| Currency | CNY |
| Price | 一个预先书面批准的固定 CNY minor-unit 金额 |
| Transaction | 1 次真实支付 |

禁止多 Provider、多 Creator、多价格、多币种、多商品、多垂直、Marketplace、订阅、SaaS 或
金融能力扩展。

## 3. Current No-Go Decision

截至 **2026-08-15**，VS-02D 为 `NO-GO / BLOCKED`。

依据：

1. `38_VS02C_Provider_Adapter_Qualification.md` 将微信支付“平台收付通”标记为
   `CONDITIONAL`，而非 `QUALIFIED`；
2. `35A_Provider_Qualification_Dossier.md` 仍将 Service Commerce 适用性、Creator 主体、
   Platform Fee、退款/回退、争议、负余额和 Pilot 准入列为 `Unknown — Blocking` 或待
   Provider 书面确认；
3. 当前仓库仅存在 `.env.example`，没有可审计的 Live Credential 运行时配置、官方 Sandbox /
   Test 环境凭据或 Provider 账户资格证据；
4. 没有 Provider 合同、产品审核、商务邮件、工单或正式书面确认覆盖 CNY 399 Creator
   Service Commerce Pilot；
5. 当前 WeChat Pay Adapter 仅连接本地受控 Test Transport，明确不代表官方 Sandbox、真实
   签名验证、真实 Webhook 或真实资金。

因此，任何 Live Payment、Live Settlement、Live Withdrawal、真实 Webhook、生产 Secret、
真实 KYC/KYB 或账户进件均继续禁止。

## 4. Live Integration Readiness Gate

以下所有证据必须由指定负责人审阅并留档；任一项缺失即 `NO-GO`。

### 4.1 Provider and Account Readiness

- [ ] Provider 产品、商务、合同或工单书面确认目标 CNY Service Commerce；
- [ ] Platform legal entity、Provider role 和产品模式已批准；
- [ ] Creator 的 Seller / sub-merchant / equivalent account model 已书面确认；
- [ ] 一个真实 Creator 的账户映射完成，且最小资料处理符合已批准流程；
- [ ] Provider 的 Platform Fee、Provider Fee、Settlement、退款、争议和负余额责任已确认；
- [ ] 首批 1 Creator / 1 Customer 受控 Pilot 已获 Provider 准入。

### 4.2 Live Credential and Environment Readiness

- [ ] Live credential 只通过批准的 runtime Secret mechanism 注入；
- [ ] Secret 不在 Repository、测试 Fixture、Canonical Event、Ledger、数据库、日志、错误或
  Client 中出现；
- [ ] Live、Sandbox / Test、local 的数据库、callback URL、Secret 与操作权限完全分离；
- [ ] 生产 Provider API 域名、证书、签名与时间校验参数经 Provider 官方材料确认；
- [ ] 支付、结算和提现权限仅覆盖首笔固定范围，或已有等效 Provider 侧限制；
- [ ] 审计日志、监控和告警已启用且经过非资金路径演练。

### 4.3 Webhook and Provider Fact Readiness

- [ ] Provider 官方 webhook / callback endpoint 已配置并由 Provider Test 或正式验证确认；
- [ ] 签名、证书 / key rotation、timestamp 与 payload authenticity 已验证；
- [ ] 同一 Provider Event 的 replay、重复和冲突事实通过真实 Provider Test 验证；
- [ ] 客户端、页面跳转、人工操作或截图都不能创建 Payment / Settlement success Fact；
- [ ] Provider Event → verified Provider Fact → Application Policy 的可审计链条可追溯；
- [ ] 未验证、过期、冲突或金额不一致的 Event 不改变 Domain、Ledger 或 Wallet。

## 5. Money Integrity Requirements

首笔交易强制满足：

```text
Order Amount
= Payment Amount
= Settlement Gross
```

所有金额均使用 `CNY` 与 `MoneyMinor` 整数；禁止浮点数。原始 Order 金额永不覆盖：

```text
Gross
- Provider Fee
- Platform Fee
- Approved Adjustment
= Creator Net
```

Provider Fee 与 Platform Fee 必须分别记录，不能互相替代。Payment success 不自动代表
Settlement success；即使 Provider 将二者同步返回，Adapter 仍必须形成独立的 verified
Settlement Fact。

## 6. First-transaction Go / No-Go Checklist

进行真实 Customer Payment 前，授权操作人必须对每项记录 `GO`：

- [ ] Section 4 的全部 Live Integration Readiness 项均已满足；
- [ ] 固定 Provider、Creator、Offering、Customer、CNY 金额和 Platform Fee 已确认；
- [ ] Order、Payment、Settlement 与 Provider Account Mapping 已预检；
- [ ] 失败、退款、争议与人工处理责任已记录；
- [ ] callback、监控、审计、对账和 Evidence Package 路径已演练；
- [ ] Commerce Live Kill Switch 已验证为 enabled；
- [ ] 没有未解释的 Ledger / Wallet 差异；
- [ ] 负责人明确授权本次单笔交易。

任何一个未勾选项必须使本次交易 `NO-GO`。不得通过代码、管理员界面或数据库写入绕过此
检查表。

## 7. Commerce Live Kill Switch

未来 Live Adapter 启用前必须存在一个独立、审计化的 Commerce Live Kill Switch：

```text
Enabled
→ new real Payment may begin

Disabled
→ new real Payment must be rejected before Provider request
→ existing transactions remain readable and enter manual handling
```

Kill Switch 只能阻止新的 Live Provider operation；不得删除或覆盖既有 Provider Fact、Domain
state、Ledger Entry、Wallet Projection 或审计记录。

必须在非资金 Test / officially approved Test 环境验证以下触发：

- Provider webhook / signature anomaly；
- duplicate Payment / Settlement Fact；
- amount or currency mismatch；
- Ledger / Wallet reconciliation discrepancy；
- unexpected Provider error or account restriction。

当前未实现 Live Provider operation，因此不得把 VS-02B / VS-02C 本地 Test Transport 误称为
Live Kill Switch 验证。

## 8. Transaction Evidence Package

每笔真实交易必须创建不可修改的证据包索引，至少包含：

| Fact | Allowed evidence |
| --- | --- |
| Order | internal Order ID, Offering ID, Creator ID, Customer ID |
| Payment | internal Payment ID, non-secret Provider reference, gross amount, timestamp |
| Settlement | internal Settlement ID, non-secret Provider reference, gross, Provider Fee, Platform Fee, Creator Net, timestamp |
| Earnings | Ledger Entry IDs and Wallet Projection at the observation point |
| Audit | correlation ID, verified Provider Event ID, operator approvals and reconciliation outcome |

不得保存支付凭据、银行卡信息、完整 Provider raw payload、签名、私钥、Secret、身份证件或
未脱敏账户资料。

## 9. Refund and Reversal Safety

不要求为了验证 VS-02D 而主动制造退款。但真实交易一旦出现退款条件：

- Provider refund signal 必须先被验证并规范化；
- 不得覆盖原 Order、Payment、Settlement 或 Ledger 历史；
- Adjustment、Refund 或 Settlement Reversal 必须遵守已批准的产品闭环和 Provider 书面资金规则；
- 若规则或责任未获书面确认，交易进入人工 Pending Resolution，不得由操作人伪造成功、
  失败或余额。

## 10. Definition of Done

VS-02D 只能在以下全部满足后标记完成：

- [ ] Live Provider Account Ready;
- [ ] Live Credentials Isolated;
- [ ] Real Webhook Signature Verification;
- [ ] Real Provider Event → verified Provider Fact;
- [ ] Real Payment → Payment Confirmed;
- [ ] Real Settlement → Settlement Confirmed;
- [ ] Platform Fee and Creator Net separately recorded;
- [ ] append-only Ledger Entry and Wallet Projection reconciled;
- [ ] VS-02A, VS-02B and VS-02C regressions pass;
- [ ] Transaction Evidence Package created;
- [ ] Commerce Live Kill Switch verified;
- [ ] no unexplained balance discrepancy.

Until then, the status remains:

```text
VS-02D — Blocked / No-Go
```

Only the completed checklist and real external Provider facts may change it to:

```text
VS-02D — First Real Payment Connectivity Verified
```
