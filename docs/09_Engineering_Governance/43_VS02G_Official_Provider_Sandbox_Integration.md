# 43 — VS-02G Official Provider Sandbox Integration

> **Status**: Conditional — Adapter Boundary Complete / Official Sandbox External Blocked
> **Decision Date**: 2026-08-17
> **Primary Provider Candidate**: WeChat Pay — Conditional
> **Real-money Status**: Disabled — No Real Money Evidence

## 1. Objective

VS-02G must connect the first Primary Provider's official Sandbox or Test Environment through the
existing Provider-neutral Payment, Settlement and Withdrawal Ports without changing the Money
Domain. Official Sandbox evidence must remain distinct from Local Simulator evidence and Live
Provider evidence.

The current auditable result is:

```text
SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY
```

As of 2026-08-17, the repository has no Provider-issued Sandbox endpoint, test account, test
credentials, official test-signature material or official webhook test channel. The public WeChat
Pay documentation confirms candidate production product capabilities, but the reviewed evidence
does not provide an auditable, generally obtainable official Sandbox environment for this account
and business case. The project must not invent one.

## 2. Three Distinct Provider Environments

| Environment                      | Provider identity                                                               | Evidence class                | Current status                       |
| -------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------ |
| Local Simulator                  | `local_commerce_simulator`                                                      | `origin = simulation`         | Implemented                          |
| Controlled WeChat Test Transport | `wechat_pay_platform_collection_and_disbursement` + `controlled_test_transport` | local contract evidence only  | Implemented; not official Sandbox    |
| WeChat Pay Official Sandbox      | same Provider candidate + `official_sandbox`                                    | Provider-issued test evidence | Unavailable — external dependency    |
| Live Provider                    | Founder-approved production adapter                                             | real Provider evidence        | Disabled; `REAL_MONEY_ENABLED=false` |

The controlled WeChat transport must use `wechat-pay-controlled-test:*` references. It must never
be described as official Sandbox evidence. Official Sandbox operations must never fall back to the
controlled transport or Local Simulator.

## 3. Official Sandbox Configuration Contract

An evidence-backed official Sandbox configuration would require all of the following:

- official Provider endpoint;
- Provider-issued test account reference;
- securely loaded test credential reference;
- official webhook signature-verification reference;
- Provider environment explicitly identified as `official_sandbox`;
- currency `CNY` and region `CN`.

No value may be guessed from production documentation. Until the Provider supplies the complete
set, `UnavailableWeChatPayOfficialSandboxTransport` rejects Payment, Settlement, Withdrawal,
status-query and Provider-event verification with
`wechat_pay_official_sandbox_unavailable` / `SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY`.

## 4. Adapter Boundary

The existing Provider-neutral Ports remain unchanged. Provider-specific concerns stay below the
Port:

- request and response mapping;
- official webhook signature verification;
- Provider event normalization;
- Provider error mapping;
- Creator / merchant account mapping.

No Provider-specific state enters the Money Domain. The adapter cannot write Wallet or Ledger
directly. A future official event must still flow through Signature Verification, Provider Fact
normalization, receipt/replay protection, Application Policy and the Money Domain.

## 5. Capability Matrix

| Capability                        | Official Sandbox status                   | Allowed current verification                                 |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Payment success / failure         | Unavailable                               | Local Simulator and controlled adapter contract only         |
| Duplicate / replay / out-of-order | Unavailable as official evidence          | Provider Fact receipt guards and local contract harness      |
| Invalid signature                 | Unavailable as Provider-specific evidence | Generic rejecting webhook boundary                           |
| Settlement                        | Unavailable                               | Local Simulator; must not be called Provider Settlement Fact |
| Withdrawal                        | Unavailable                               | Local Simulator; must not be called Provider Withdrawal Fact |
| Refund                            | Unavailable                               | Local Simulator; DEC-013-B remains unchanged                 |
| Provider webhook                  | Unavailable                               | Generic webhook runtime structure only                       |
| Test account / credentials        | Unavailable                               | None; no fabricated secret or account                        |

## 6. Official Evidence Reviewed

The 2026-08-17 review used current official WeChat Pay documentation already tracked by the
Provider Qualification Dossier, including:

- platform collection-and-disbursement product documentation and account-fund capabilities:
  `https://pay.wechatpay.cn/doc/v3/partner/4012069859`;
- sub-merchant onboarding documentation:
  `https://pay.wechatpay.cn/doc/v3/partner/4012062365`;
- related platform payment, refund, settlement and withdrawal product pages referenced by `35A`.

These pages support Provider candidacy, not Sandbox availability or qualification approval. No
Provider-issued test credential, official test account, official test endpoint or test webhook
evidence is stored in the repository.

## 7. Sandbox Evidence Rules

If official Sandbox access becomes available, evidence must record:

- Provider and environment;
- test account and merchant/account mapping references;
- Order, Payment and Provider references;
- webhook event identifier and signature-verification result;
- normalized Provider Fact and receipt decision;
- Settlement, Withdrawal or Refund capability outcome;
- timestamps and audit references;
- explicit `sandbox` classification.

Sandbox Evidence is not Real Money Evidence, Real GMV, Real Revenue, First Completed Paid
Commerce, real Creator Earnings or Provider Qualification Evidence. Secrets, private keys and
sensitive authentication material must never be written to evidence records.

## 8. External Exit Conditions

VS-02G can move from Conditional to Implemented only when all applicable items are supplied and
verified:

1. Provider-issued official Sandbox/Test access;
2. official endpoint and test-account documentation;
3. test credentials loaded through secret management;
4. official signature and webhook test contract;
5. documented Payment test flow;
6. explicit Settlement, Withdrawal and Refund Sandbox capability decisions;
7. complete technical-chain evidence through the unchanged Provider Ports.

Provider Qualification remains a separate external track. Official Sandbox access would not by
itself approve the business model, Creator eligibility, money flow or Live activation.

## 9. Final State

```text
VS-02G Engineering Boundary = COMPLETE
VS-02G Official Sandbox Integration = CONDITIONAL
SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY
Provider Qualification = CONDITIONAL
REAL_MONEY_ENABLED = false
No Real Money Evidence
```
