# 41 — VS-02E Commercial Lifecycle Hardening

> **Status**: Completed — Model Consistent
> **Controller Decision**: DEC-013-A / DEC-013-B Approved
> **Decision Date**: 2026-08-17
> **Scope**: Local Commercial Simulator lifecycle and accounting consistency
> **Real-money Status**: Disabled — No Real Money Evidence

## 1. Frozen Decision

DEC-013 closes the two product ambiguities found by the VS-02E lifecycle audit.

### DEC-013-A — Settlement Failure

Settlement Failure is independent from Payment Failure and Order Failure. The system
must preserve these facts together:

```text
Payment = Confirmed
Order = Fulfilled or Pending Resolution
Settlement = Failed
```

A failed Settlement:

- never creates Available Earnings;
- opens Pending Resolution;
- preserves the frozen Settlement calculation;
- supports an idempotent retry against the same Settlement;
- rejects a retry that changes Provider Fee, Platform Fee, deductions or calculation version;
- resolves only through Retry Success, Reconciliation or Reversal;
- never requires a Creator to modify Settlement, Ledger or Wallet.

The frozen lifecycle is:

```text
Payment Confirmed
→ Settlement Pending
→ Settlement Failed
→ Pending Resolution
→ Retry Success / Reconcile / Reverse
→ Settlement Resolved
→ Earnings Ledger
→ Available
```

### DEC-013-B — Post-Settlement Refund / Recovery

Historical Payment, Settlement, Withdrawal and Ledger entries are immutable. A Refund
creates a new reverse Ledger fact.

If the Refund exceeds current Available Earnings:

```text
Available Earnings → 0
Recovery Obligation → outstanding difference
```

The Wallet does not become negative. Historical Withdrawal remains unchanged. Later
Settlement Earnings first reduce `Recovery Outstanding`; only the remaining amount
becomes Available.

Recovery Obligation is an auditable Ledger projection. It is not a loan, credit balance,
insurance product or new Commerce Pattern.

## 2. Applied Model

The related fact lifecycles remain separate:

```text
PAYMENT
Pending → Confirmed / Failed → Refunded

SETTLEMENT
Pending → Released
Pending → Failed → Resolved
Pending / Failed / Released / Resolved → Reversed

EARNINGS
Pending → Available / Restricted / Withdrawn
Refund Debit → Recovery Outstanding
Later Earnings → Recovery Applied → Available remainder

WITHDRAWAL
Requested → Completed / Failed / Reversed
```

These are related fact lifecycles, not one combined state machine.

## 3. Implementation

### Settlement Failure and Resolution

- A Settlement attempt is persisted as `pending` before the Simulator outcome.
- A failed Simulator operation changes Settlement to `failed`.
- The Order enters `pending_resolution`.
- Canonical events record `settlement_failed` and `pending_resolution_opened`.
- Retry reuses the persisted Settlement and frozen calculation.
- Retry success changes Settlement to `resolved`, completes the Order, appends one
  `settlement_released` Ledger entry and records `pending_resolution_resolved`.
- Duplicate retry produces no second Ledger credit.
- Conflicting retry is rejected before Provider simulation.
- Refund / reversal can close a failed Settlement without fabricating Available Earnings.

No new Provider Fact kind was added. Settlement failure is derived from the verified
Provider Operation result because the Provider-neutral Port does not define a
`SettlementFailed` fact.

### Recovery Obligation

- A post-Settlement Refund appends `refund_debited` for the verified Refund amount.
- Existing Ledger, Settlement and Withdrawal facts remain unchanged.
- Wallet projection consumes Available Earnings first and projects the remainder as
  `recoveryOutstanding`.
- Later `settlement_released` entries reduce Recovery Outstanding before increasing
  Available Earnings.
- A pre-Settlement Refund reverses Pending Earnings without creating Available Earnings.
- Refund replay is idempotent by the original Simulator Provider Event.
- Reusing a Refund Provider Reference with conflicting facts is rejected.

## 4. Accounting Invariants

The implementation verifies:

1. `Wallet = Projection(Ledger)`.
2. Wallet balances never become negative.
3. Creator Net cannot exceed Gross Order Amount.
4. Provider Fee and Platform Fee are independent frozen inputs.
5. Refund / Reversal links to an original Payment or Settlement.
6. Settlement release is recorded once.
7. Withdrawal requires prior Available Earnings and reservation.
8. Completed Withdrawal remains immutable after Refund.
9. Recovery replay does not duplicate an obligation.
10. Later Earnings cannot bypass Recovery Outstanding.
11. Controllers and UI cannot directly mutate money.

## 5. CNY 399 Simulation Trace

```text
Gross Order Amount       39,900 minor units
- Simulated Provider Fee    240
- Simulated Platform Fee  3,990
- Simulated Adjustment        0
= Creator Net Earnings   35,670 minor units
```

If a full Refund of `39,900` occurs after only `35,670` remains available:

```text
Available Earnings        35,670
Refund Debit             -39,900
Available Earnings             0
Recovery Outstanding       4,230
```

These values are Simulation configuration, not production fee claims.

## 6. Canonical Events

DEC-013 adds one non-duplicative Canonical Event:

- `settlement_failed`

Existing events continue to express resolution:

- `pending_resolution_opened`
- `pending_resolution_resolved`
- `settlement_released`
- `settlement_reversed`
- `refund_confirmed`
- `ledger_entry_appended`
- `wallet_availability_changed`

Migration `0011_dec013_commercial_lifecycle.sql` updates the PostgreSQL event constraint.

## 7. Verification Scope

The test suite covers:

- Payment Confirmed → Settlement Failed;
- Settlement Failed → Retry Success;
- duplicate Retry;
- conflicting Retry;
- zero Available Earnings while Settlement is failed;
- one Ledger release after resolution;
- Refund before Settlement;
- Refund after Settlement with sufficient Available Earnings;
- Refund after Settlement with insufficient Available Earnings;
- Refund after Creator Withdrawal;
- Recovery Obligation plus later Earnings;
- Recovery replay and conflict;
- immutable Withdrawal history;
- Wallet reconstruction from Ledger.

## 8. Boundary

This decision does not authorize:

- real Provider integration or real funds;
- VS-02D activation;
- changes to Provider-neutral Ports;
- negative Wallet money objects;
- lending, credit, insurance or custody products;
- Marketplace, CRM, Subscription, Multi-currency or another Commerce Pattern.

```text
VS-02E Commercial Lifecycle = HARDENED
DEV-013 = Completed — DEC-013-A/B Applied
No Real Money Evidence
```
