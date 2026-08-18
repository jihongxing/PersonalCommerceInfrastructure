# 45 — VS-02I First Commerce Pilot Preparation

> **Status**: Preparation
> **Decision Date**: 2026-08-17
> **Result**: Founder Activation Ready
> **Real Commerce Status**: Not Real Commerce Ready
> **REAL_MONEY_ENABLED**: `false`
> **Provider Qualification**: External Parallel Track

## 1. Boundary

VS-02I prepares a single controlled Pilot Package for a possible first Creator Commerce
transaction. It does not perform Live Money Integration, activate a Provider, create a real
Payment, Settlement or Withdrawal, or declare Commercial Launch.

```text
Preparation = configuration, scope, evidence, runbook and stop controls
Founder Activation = separate explicit decision
Real Commerce = not started
```

Provider Qualification remains external and does not block this preparation work. It remains a
hard prerequisite for any future Live Provider activation.

## 2. Frozen Pilot Transaction Template

The first Pilot allows exactly:

| Dimension | Frozen value |
| --------- | ------------ |
| Creator | One Creator |
| Service | One Service Offering |
| Customer | One Customer |
| Currency | `CNY` |
| Price | One Founder-confirmed fixed price |
| Pattern | `Request Commerce` only |
| Transaction count | One transaction |

The only allowed flow is:

```text
Request → Confirm → Order → Payment → Fulfillment → Settlement → Earnings → Wallet → Withdrawal
```

Event, Experience, Ticket, Merchandise, Marketplace, Subscription and other Commerce Patterns
are outside this Pilot Package.

## 3. Centralized Business Configuration

The Pilot Business Configuration is a configurable policy input, not a Money Domain constant. It
contains:

- Service Price;
- Platform Fee;
- CNY currency;
- Cancellation Rule;
- Refund Rule;
- Fulfillment Rule;
- Settlement Rule;
- Withdrawal Rule;
- Recovery Policy.

Provider Fee is not pre-populated as a production fact. It must come from a verified Provider Fact
when a real Provider exists. Simulation fee values remain simulation configuration only.

## 4. Founder Go / No-Go Package

The checklist is a runtime condition and governance artifact, not a frontend control. Codex and
ordinary Creator or Customer roles cannot set `FOUNDER_GO` or enable `REAL_MONEY_ENABLED`.

### Product

- [ ] Offering confirmed
- [ ] Price confirmed
- [ ] Platform Fee confirmed
- [ ] Cancellation / Refund Policy confirmed

### Creator

- [ ] Creator confirmed
- [ ] Creator qualification confirmed
- [ ] Creator payout path confirmed

### Customer

- [ ] Customer confirmed
- [ ] Customer knows this is a controlled Pilot

### Provider

- [ ] Provider confirmed
- [ ] Account Mapping confirmed
- [ ] Payment Path confirmed
- [ ] Settlement Path confirmed
- [ ] Withdrawal Path confirmed

### Engineering

- [ ] Live Guard remains off
- [ ] Kill Switch verified
- [ ] Webhook verified
- [ ] Evidence Capture verified
- [ ] Monitoring / Audit ready

Final field:

```text
FOUNDER_GO = TRUE / FALSE
```

Default and current value remains `FALSE`.

## 5. First Transaction Runbook v2

| Step | Actor | Expected Result | Failure Condition | Evidence | Stop Condition |
| ---- | ----- | --------------- | ----------------- | -------- | -------------- |
| 0. Preflight | Operations | Current build, guards and monitoring verified | Any required gate fails | Preflight output | Stop before Order |
| 1. Verify Creator | Operations / Founder | One approved Creator and payout path | Identity or qualification unclear | Creator reference | Stop |
| 2. Verify Offering | Creator / Operations | One published Offering matches template | Snapshot or terms mismatch | Offering snapshot | Stop |
| 3. Verify Provider | Founder / Operations | Provider, account mapping and capabilities externally verified | Provider unavailable or restricted | Provider evidence | Stop |
| 4. Verify Pricing | Founder / Operations | CNY price and Platform Fee reconcile | Amount or policy mismatch | Business Configuration | Stop |
| 5. Create Order | Customer / Application | One immutable Order snapshot created | Duplicate or wrong Order | Order ID | Stop new transaction |
| 6. Customer Payment | Customer / Provider | Provider Payment operation created | Payment rejected or amount mismatch | Payment reference | Kill switch / stop |
| 7. Verify Provider Fact | Operations | Signed, normalized Payment Fact accepted | Missing, invalid or duplicate-conflicting Fact | Provider Fact receipt | Stop |
| 8. Verify Settlement | Provider / Operations | Verified Settlement Fact matches frozen calculation | Fee, amount or reference mismatch | Settlement reference | Stop |
| 9. Verify Earnings Ledger | Application / Operations | Exactly one Ledger credit | Duplicate or untraceable mutation | Ledger entries | Stop |
| 10. Verify Wallet | Application / Operations | Wallet equals Ledger Projection | Projection mismatch | Wallet projection | Stop |
| 11. Creator Fulfillment | Creator | Service fulfilled through existing Use Case | Unpaid or cancelled fulfillment | Fulfillment evidence | Stop |
| 12. Verify Completion | Operations | Customer and Creator states agree | State contradiction | Canonical Events | Stop |
| 13. Verify Withdrawal | Creator / Provider | Verified Withdrawal Fact before Withdrawn | Missing or failed withdrawal evidence | Withdrawal reference | Stop |
| 14. Capture Evidence | Operations | Complete non-sensitive package stored | Missing reference or timestamp | Pilot Evidence Package | Stop |
| 15. Disable / Kill Switch | Founder / Operations | New Live operations blocked after review | Guard does not block | Kill-switch audit | Stop all activity |

## 6. Hard Stop Conditions

Immediately stop new transactions when any condition occurs:

- amount mismatch;
- unverifiable Provider Reference;
- missing Payment Fact;
- abnormal Settlement amount or Platform Fee;
- Creator Net cannot be recalculated;
- Ledger and Wallet mismatch;
- abnormal Withdrawal state;
- invalid Webhook signature;
- duplicate Event creates duplicate credit;
- Customer and Creator state contradiction;
- Provider account restriction;
- unexplained Refund or Recovery state.

No hard stop may be bypassed by editing Wallet or Ledger balances. Resolution must use existing
Application Use Cases, verified Facts and append-only Ledger rules.

## 7. Scope Guard and Fact Isolation

The Pilot Scope Guard allows one Creator, one Service Offering, one Customer, one Provider, one
Currency, one Price and one Transaction. It forbids a second Provider, second Commerce Pattern,
multi-currency, Marketplace, Subscription, CRM, Creator Analytics dashboard and Financial Product.

Simulation facts remain:

```text
origin = simulation
provider = local_commerce_simulator
```

They cannot satisfy First Completed Paid Commerce, Real GMV, Real Revenue, Real Creator Revenue or
Provider Qualification Evidence. Future verified Provider facts may use `origin = provider`; empty
Provider References are mandatory until that point. Simulation References must never be copied into
future real evidence.

## 8. Evidence Package

The fixed evidence structure contains:

- Pilot ID;
- Creator, Customer and Offering;
- Order ID;
- Payment and Provider references;
- Settlement reference;
- Gross, Provider Fee, Platform Fee and Creator Net;
- Ledger Entry IDs;
- Wallet Projection reference;
- Withdrawal reference;
- Fulfillment evidence;
- Audit trail;
- timestamps;
- Fact origin.

No card number, CVV, Provider Secret, webhook secret, bank credential or complete sensitive account
data may be stored.

## 9. Implementation and Acceptance Evidence

- Preparation policy and Scope Guard:
  `applications/paid-commerce/first-commerce-pilot-preparation.ts`;
- focused acceptance:
  `tests/application/first-commerce-pilot-preparation.test.ts` — PILOT-01–PILOT-10;
- prior runtime kill switch and live Provider boundary remain in:
  `applications/paid-commerce/real-money-activation-guard.ts` and `39A`;
- prior Operations, Evidence and audit boundary remains in `44` / `DEV-016`.

Final verification evidence is maintained in
`docs/08_Execution/21_Prototype_Execution.md`, Section 21.

```text
VS-02I — First Commerce Pilot Preparation = COMPLETE
Founder Activation Ready
Real Commerce Ready = NOT DECLARED
Commercial Launch = NOT DECLARED
REAL_MONEY_ENABLED = false
No Real Money Evidence
Provider Qualification = External Parallel Track
```
