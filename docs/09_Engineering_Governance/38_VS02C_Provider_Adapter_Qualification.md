# 38 — VS-02C Provider Adapter Qualification

> **Status**: Frozen — Engineering qualification complete; external controlled-integration
> authorization remains conditional  
> **Product Increment**: VS-02C — Provider Adapter Qualification  
> **Upstream SSOT**: `34_Commerce_Pattern_Settlement_and_Wallet_Model.md`,
> `35_VS02_Paid_Service_PRD.md`, `35A_Provider_Qualification_Dossier.md`,
> `36_Engineering_Governance_Delta.md`, `37_VS02B_Provider_Integration_Readiness.md`  
> **Implementation Authority**: 本文件授权一个 Provider-specific Adapter Skeleton、受控 Test
> Contract 与资格证据映射；不授权真实资金、生产接入或 Provider 账户操作。

## 1. Purpose

VS-02C 将 VS-02B 已验证的 Provider-neutral Money Layer 连接到第一个真实 Provider
候选的**隔离 Adapter 设计**：

```text
Provider Qualification Evidence
→ Primary Provider Candidate
→ Provider-specific Adapter Skeleton
→ Sandbox / Test Contract
→ Verified Provider Fact
→ existing Application Policy
→ existing Money Domain
```

VS-02C 不代表 `Provider Integrated`，更不代表 `Real-money`。它只证明一个具体 Provider 的
协议差异可被隔离在 Adapter Layer，且缺失的外部事实会被清晰保留。

## 2. Primary Provider Candidate

| Field | Value |
| --- | --- |
| Provider | WeChat Pay — Platform Collection and Disbursement (`平台收付通`) |
| Region | Mainland China |
| Currency | CNY |
| Product / payment model | Platform / service-provider candidate with Creator sub-merchant candidate |
| Account model | Candidate Provider Settlement Account / sub-merchant mapping |
| Settlement model | Candidate provider freeze → release / split → Creator provider balance |
| Withdrawal model | Candidate Creator provider balance → provider withdrawal |
| Qualification status | `CONDITIONAL` |

选择理由：`35A` 的公开官方资料底稿显示，微信支付“平台收付通”是唯一同时具有二级商户、
冻结/解冻、平台佣金、分账、余额和提现强候选信号的中国大陆路径。它被选择为**工程候选**，
不构成对舞蹈私教 Service Commerce、Creator 主体、平台资质或 Pilot 准入的确认。

### 2.1 Qualification status vocabulary

| Status | Meaning |
| --- | --- |
| `RESEARCHED` | 有公开或初步资料，尚未完成工程/业务适用性核验 |
| `QUALIFIED` | Provider 书面确认范围覆盖目标业务和受控 Test / Sandbox 入口 |
| `CONDITIONAL` | 工程 Adapter 可隔离并通过本地 Contract；外部业务、测试环境或操作条件仍有缺口 |
| `REJECTED` | Provider 明确不支持目标结构 |
| `BLOCKED` | 缺失阻断性证据或测试访问条件 |

微信支付当前为 `CONDITIONAL`。没有 Provider 的产品、商务、合同或工单书面确认前，它不得
升级为 `QUALIFIED`，也不得进入 VS-02D。

## 3. Capability Evidence and Applicability Matrix

| Capability | Evidence state from `35A` | Project applicability | Adapter requirement | VS-02C status |
| --- | --- | --- | --- | --- |
| CNY Customer Payment | Product capability confirmed; Service Commerce path unconfirmed | CNY 399 Payment Fact | payment request / response / event mapping | `CONDITIONAL` |
| Service Commerce | Target business category not confirmed | 1:1 dance lesson | preserve business-category constraint outside Domain | `BLOCKED` |
| Creator Account | sub-merchant / Creator account is a strong candidate | Creator earnings destination | provider account mapping only | `CONDITIONAL` |
| Platform Fee | platform commission / split is a strong candidate | platform fee and Creator net | Settlement calculation mapping and amount validation | `CONDITIONAL` |
| Split / delayed settlement | freeze / split public capability is a strong candidate | fulfillment-gated release | settlement fact mapping | `CONDITIONAL` |
| Refund / reversal | public mechanism exists; Service path and recovery rules unconfirmed | adjustment / reversal closure | map Fact, do not alter Domain pending approved flow | `BLOCKED` |
| Withdrawal | provider balance withdrawal is a strong candidate | Creator withdrawal result | withdrawal request / result mapping | `CONDITIONAL` |
| Provider event verification | signed event / query verification requirements require official test access | trusted external Fact | verifier boundary and replay guard | `CONDITIONAL` |
| Creator onboarding / Pilot | specific Creator type and 5–10 pilot eligibility unconfirmed | controlled Pilot | account-mapping metadata only | `BLOCKED` |

`35A_Provider_Qualification_Dossier.md` remains the evidence register. This matrix is an
engineering applicability view, not a substitute for Provider confirmation.

## 4. Adapter Boundary

```text
Provider Account Mapping
→ WeChat Pay Adapter
→ Provider Request / Response / Event / Error Mapping
→ Provider-neutral Port
→ Verified Provider Fact
→ Application Policy
→ Payment / Settlement / Withdrawal / Ledger / Wallet
```

Provider-specific fields such as `sub_merchant_id`, merchant account identifiers, certificates,
signatures, serial numbers and raw event payloads are Adapter Integration Metadata only. They must
not be added to `Order`, `Payment`, `Settlement`, `Wallet`, Ledger Entry, Canonical Product Event
or public API Contract.

### 4.1 Required skeleton responsibilities

The conditional WeChat Pay Adapter Skeleton must contain:

- request mapping for Payment, Settlement and Withdrawal;
- response mapping into existing `ProviderOperation`;
- event mapping into existing `VerifiedProviderFact`;
- error normalization with no raw Provider payload or secret leakage;
- Creator → Provider Account Mapping kept only in Adapter Integration Metadata;
- a test-only Sandbox Transport Contract.

The skeleton must not import a WeChat SDK, open a network connection, expose an HTTP webhook
endpoint, decrypt a live event or access a live Provider Secret.

## 5. Sandbox / Test Contract

The Adapter can be tested only through an explicit `WeChatPaySandboxTransport` Port:

```text
Adapter Skeleton
→ Sandbox Transport Contract
→ controlled test transport
```

The controlled test transport validates mapping and verification behavior. It is **not** an official
WeChat Pay Sandbox proof, a Provider account, a real callback or a real-money proof.

To mark Sandbox readiness as `QUALIFIED`, the Provider must supply an officially approved Sandbox,
test environment, test merchant path or written equivalent that covers the selected model.

## 6. Provider Event and Error Normalization

Provider-specific event names are Adapter input only. The adapter may map a documented or
Provider-confirmed event into:

```text
PaymentSucceeded
PaymentFailed
RefundSucceeded
SettlementSucceeded
WithdrawalSucceeded
WithdrawalFailed
```

The Provider Event remains distinct from a Canonical Product Event. A Fact must first be verified,
must satisfy amount/currency/resource integrity, and must pass the VS-02B idempotency, replay and
conflict guard before Application Policy may invoke the existing Money Domain transition.

Provider Error Mapping must emit a neutral adapter error code and safe message only. Raw response
payloads, signatures, secret material and personal account data may not enter logs, events, errors,
ledger records, database persistence or client responses.

## 7. Refund / Reversal Boundary

VS-02C maps a verified Provider refund signal to `RefundSucceeded` only. Existing VS-02 policy
intentionally opens no settlement reversal automatically: the actual refund / adjustment / settlement
reversal write path remains subject to the approved product closure and Provider-specific money-flow
qualification. This avoids a Sandbox fixture silently redefining Refund semantics.

## 8. Promotion Gate to VS-02D

The WeChat Pay candidate may be promoted from `CONDITIONAL` to `QUALIFIED` only when all are
retained as written evidence:

1. business eligibility for CNY 399 Creator Service Commerce;
2. Creator seller / sub-merchant account model and platform role;
3. Platform Fee, Settlement, Refund / reversal, dispute and negative-balance responsibility;
4. Creator withdrawal and account limitation process;
5. an approved Sandbox / Test or controlled-integration entry point;
6. Pilot eligibility for the intended 5–10 Creator scope;
7. test credentials and event-verification materials stored only through approved runtime Secret
   governance.

## 9. Explicitly Prohibited

VS-02C does not allow:

- real money, live Payment, Platform Fee, Settlement or Withdrawal;
- production credentials, production webhook, live Checkout or live API calls;
- real KYC/KYB, bank / settlement account onboarding or Creator submission;
- Customer payment, Creator payout or Provider account mutation;
- WeChat-specific Domain Entity or business rule;
- change to Money Domain, Wallet Projection, Ledger immutability or Commerce Pattern.

## 10. Definition of Done

VS-02C engineering qualification is complete when:

- [x] Primary Provider Candidate selected as an engineering candidate;
- [x] qualification evidence and constraints recorded;
- [x] Provider-specific Adapter Skeleton implemented;
- [x] Payment, Settlement and Withdrawal mapping covered;
- [x] Refund signal mapping covered without changing refund product semantics;
- [x] Provider Contract Tests, event verification, error normalization, idempotency/replay/conflict,
  amount/currency and secret-isolation tests pass;
- [x] controlled Sandbox / Test Contract wired;
- [x] VS-02A and VS-02B regressions pass;
- [x] no live money exists.

External promotion remains blocked until the Section 8 evidence package is complete. The resulting
state is:

```text
VS-02C — Provider Adapter Qualification:
Engineering complete / Controlled Integration conditional
```

It is not:

```text
Provider Integrated
Real-money qualified
```
