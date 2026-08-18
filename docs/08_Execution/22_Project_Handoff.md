# Project Handoff — PersonalCommerceInfrastructure

> **Project Restart SSOT**: This document is the authoritative re-entry and suspension baseline.
> **Effective date**: 2026-08-18

## 1. Project Identity

| Field            | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| Project          | `PersonalCommerceInfrastructure`                             |
| Current Status   | **SUSPENDED — DEVELOPMENT PAUSED**                           |
| Reason           | Founder temporarily reallocating attention to other projects |
| Project Decision | **NOT CANCELLED**                                            |
| Current Baseline | `CLIENT-002 — Commerce Golden Path Closure = COMPLETE`       |
| Next Task        | `RESUME-001 — Project Re-entry Audit & Reopening Decision`   |

This is a clean project pause, not a product or repository termination. No new business capability
is authorized by this handoff.

## 2. Suspend Point

```text
SUSPEND POINT

CLIENT-002 — Commerce Golden Path Closure = COMPLETE

Pattern-first Commerce Client
        ↓
Generic Request Commerce
Generic Reservation Commerce
Generic Contract Commerce
        ↓
Creator Commerce Desk
        ↓
Creator Execution
        ↓
Completion
        ↓
Earnings Projection
        ↓
Wallet Projection

REAL_MONEY_ENABLED = false
apps/app = DEFERRED
External Money Provider = NONE
```

The project must remain at this suspend point until the Resume Gate is satisfied and Founder
explicitly approves a new implementation change.

## 3. Current Product Definition

PersonalCommerceInfrastructure is a provider-neutral Web commerce infrastructure for creators and
other individuals who want to publish a Commerce Identity and turn creator-owned distribution into
structured commercial actions. It is not a marketplace, calendar product, CRM, ticketing platform or
real-money payment network.

The current product relationship is:

```text
Customer Commerce Action
        ↓
Request / Reservation / Contract
        ↓
Creator Commerce Desk
        ↓
Creator decision and execution
        ↓
Completion fact
        ↓
Shared Order → Payment → Fulfillment → Settlement
        ↓
Earnings Ledger projection → Wallet projection
```

`Request`, `Reservation` and `Contract` retain separate Pattern lifecycles. They converge only on
the approved shared commercial and Money infrastructure. `Earnings` and `Wallet` are projections
driven by domain facts; they are not manually editable or a second accounting state machine.

## 4. Completed Stages

### CLIENT-001 — Web Commerce Pattern Convergence

**Status: COMPLETE**

- Pattern-first Commerce Client established on Web;
- Generic Request Commerce, Reservation Commerce and Contract Commerce surfaces established;
- Shared Creator Commerce Desk established;
- Unified Customer Commerce Action Router established;
- Mobile Web surface converged and verified;
- `apps/app` explicitly deferred by decision.

### CLIENT-002 — Commerce Golden Path Closure

**Status: COMPLETE**

The three verified paths are:

#### Request

```text
Customer Request
→ Creator Confirm
→ Order
→ Fulfillment
→ Settlement
→ Wallet
```

#### Reservation

```text
Hold
→ Creator Confirm
→ Session Completed
→ Settlement
→ Wallet
```

#### Contract

```text
Quote / Scope
→ Buyer Accept
→ Contracted
→ Performance Completed
→ Settlement
→ Wallet
```

Duplicate completion is rejected. It does not create duplicate Earnings or duplicate Wallet
accounting.

## 5. Engineering Baseline

The following results are the recorded engineering baseline for the suspend point:

| Check              | Result                     |
| ------------------ | -------------------------- |
| Browser Acceptance | **50 passed, 2 skipped**   |
| Unit               | **240 passed, 10 skipped** |
| Lint               | **PASS**                   |
| Typecheck          | **PASS**                   |
| Build              | **PASS**                   |
| OpenAPI            | **PASS**                   |
| `pnpm preflight`   | **PASS**                   |
| `git diff --check` | **PASS**                   |

These results represent the CLIENT-002 Suspend Point engineering baseline. On resume, they must be
re-run rather than assumed to remain valid.

## 6. Stable Architecture Boundaries

### Customer Action Router

```text
Customer intent/action
→ Commerce Pattern
→ corresponding entry/use case
```

The Router is an entry and classification boundary. It must not own Request, Reservation or
Contract business rules, Order creation semantics, Earnings calculation or Wallet accounting.

### Creator Commerce Desk

The Desk organizes Creator-side actionable commerce work from existing domain facts. It must not
introduce a parallel Dashboard state machine or replace Pattern lifecycles with a merged state.

### Completion

Completion must be caused through the existing domain/application/event chain. The resulting fact
drives downstream fulfillment, settlement eligibility and projections. A UI must never directly
edit Earnings or Wallet.

### Earnings and Wallet

```text
Commerce completion
→ canonical/domain event
→ existing settlement and ledger flow
→ Earnings projection
→ Wallet projection
```

There is one shared Money boundary. Do not create Pattern-specific Payment, Settlement, Ledger,
Earnings or Wallet models.

### Client Boundary

Web and any future App must share API contracts, Domain, Application Use Cases, canonical events,
Money semantics and Auth semantics. `apps/app` has no implementation and must remain absent until a
new Founder decision authorizes it.

## 7. Explicitly Not Implemented / Deferred

| Boundary                     | Status                                              |
| ---------------------------- | --------------------------------------------------- |
| Native App                   | **DEFERRED** — `apps/app` is not implemented        |
| `REAL_MONEY_ENABLED`         | **NOT ENABLED** — must remain `false`               |
| Real Payment Provider        | **NOT IMPLEMENTED** — no live provider is connected |
| Real Withdrawal              | **NOT IMPLEMENTED**                                 |
| Real Settlement Network      | **NOT IMPLEMENTED**                                 |
| Production Money Movement    | **NOT IMPLEMENTED**                                 |
| Additional Commerce Patterns | **NOT IN CURRENT SCOPE** unless separately decided  |
| Marketplace                  | **NOT IMPLEMENTED**                                 |
| CRM / Deal Pipeline          | **NOT IMPLEMENTED**                                 |
| Calendar Product / Ticketing | **NOT IMPLEMENTED**                                 |

These are boundary statements, not roadmap commitments. They require a new Founder / Controller
decision before implementation.

## 8. Anti-Misstart Rules

Do not begin implementation merely because the repository contains Provider adapters, simulation
controls, deployment assets, or future App references. The following require fresh Founder / main
controller approval:

```text
apps/app
Payment Provider activation
Real Wallet or Real Settlement
Additional Commerce Pattern
REAL_MONEY_ENABLED = true
```

The current required value remains:

```text
REAL_MONEY_ENABLED = false
```

No real Provider Secret, real Payment, real Settlement, real Withdrawal or external-money evidence
is created by this suspension task.

## 9. Resume Task

### RESUME-001 — Project Re-entry Audit & Reopening Decision

`RESUME-001` is not an implementation task. It restores context and reopens the product decision
gate:

1. Read this Handoff SSOT;
2. Check the current Git commit and Suspend Baseline tag;
3. Run the complete engineering preflight;
4. Verify CLIENT-001 and CLIENT-002 regressions remain PASS;
5. Check for code, dependency and documentation drift;
6. Reconfirm the current commercial objective;
7. Produce candidate next tasks;
8. Wait for Founder Decision before starting implementation.

Do not interpret `RESUME-001` as authorization to start Payment, App, Provider, a new Pattern or a
new Vertical.

## 10. Resume Gate

The project may move from `SUSPENDED` to `ACTIVE DEVELOPMENT` only when every item is true:

```text
[ ] Handoff SSOT has been read
[ ] Current commit matches or is reconciled with Suspend Baseline
[ ] Engineering preflight PASS
[ ] CLIENT-001 regression PASS
[ ] CLIENT-002 regression PASS
[ ] REAL_MONEY_ENABLED state confirmed as false or explicitly re-decided
[ ] apps/app state confirmed as deferred or explicitly re-decided
[ ] Current commercial objective reconfirmed
[ ] Founder explicitly approves the next implementation unit
```

Until then:

```text
PROJECT_STATUS = SUSPENDED
```

## 11. Current Status Overview

| Area                     | Status     | Notes                         |
| ------------------------ | ---------- | ----------------------------- |
| Pattern-first Web Client | COMPLETE   | CLIENT-001                    |
| Request Commerce         | COMPLETE   | Golden Path PASS              |
| Reservation Commerce     | COMPLETE   | Golden Path PASS              |
| Contract Commerce        | COMPLETE   | Golden Path PASS              |
| Creator Commerce Desk    | COMPLETE   | Shared execution surface      |
| Customer Action Router   | COMPLETE   | Routing only                  |
| Completion               | COMPLETE   | Domain-driven                 |
| Earnings Projection      | COMPLETE   | Completion-driven             |
| Wallet Projection        | COMPLETE   | Completion-driven             |
| Idempotency              | COMPLETE   | Duplicate completion rejected |
| Real Money               | DISABLED   | `REAL_MONEY_ENABLED=false`    |
| Payment Provider         | DEFERRED   | None connected                |
| Native App               | DEFERRED   | `apps/app` not implemented    |
| Current Development      | SUSPENDED  | Founder temporary pause       |
| Next Task                | RESUME-001 | Re-entry audit                |

## 12. Handoff Authority

This document is the unique Project Restart SSOT. Historical handoff and commercialization records
remain useful evidence, but they do not supersede this file for current project status, restart
sequence or suspension boundaries.

```text
PERSONALCOMMERCEINFRASTRUCTURE

STATUS: SUSPENDED
SUSPEND BASELINE: CLIENT-002 — Commerce Golden Path Closure
BASELINE: Pattern-first Web Commerce + Request + Reservation + Contract + Creator Execution
          + Completion + Earnings Projection + Wallet Projection
REAL_MONEY_ENABLED: false
NATIVE APP: DEFERRED
REAL PAYMENT: NOT IMPLEMENTED
NEXT TASK: RESUME-001 — Project Re-entry Audit & Reopening Decision
```
