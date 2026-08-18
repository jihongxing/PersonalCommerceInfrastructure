# 56 — Phase 5 External Pilot Activation Gate

> **Status**: Execution Gate — Founder Activation Required
> **Decision Date**: 2026-08-18
> **Baseline**: `Infrastructure Convergence = READY`
> **Deployment Package**: VS-02K-EXT-02 reused
> **Real Money**: `REAL_MONEY_ENABLED = false`
> **Real Money Evidence**: None
> **Commercial Launch**: Not Declared

## 1. Purpose and Boundary

This document creates the single, auditable gate for starting the controlled external Pilot. It does
not add Commerce capability, change the Money Domain, connect a Provider, enable real money, add a
Vertical or create a second deployment system.

The gate authorizes entry of real Creators and Customers into a controlled Pilot environment only:

```text
Pilot Activation ≠ Real Money Activation
Pilot Activation ≠ Commercial Launch
```

`REAL_MONEY_ENABLED` must remain exactly `false` in every Pilot state, including
`FOUNDER_ACTIVATED` and `PILOT_RUNNING`.

## 2. Single Pilot Activation State Machine

The server-side Pilot state is the only authoritative activation state:

```text
UNPROVISIONED
    ↓
PROVISIONED
    ↓
PREFLIGHTED
    ↓
DEPLOYED
    ↓
PILOT_READY
    ↓
FOUNDER_ACTIVATED
    ↓
PILOT_RUNNING
    ↓
PILOT_CLOSING
    ↓
Evidence Frozen
    ↓
Pilot Data Preserved
    ↓
PILOT_CLOSED
```

Allowed transitions:

| From | To | Actor / condition |
| --- | --- | --- |
| `UNPROVISIONED` | `PROVISIONED` | Founder / Operations provision the isolated environment |
| `PROVISIONED` | `PREFLIGHTED` | Machine preflight passes |
| `PREFLIGHTED` | `DEPLOYED` | Reused external deployment package completes migration and service start |
| `DEPLOYED` | `PILOT_READY` | Health, readiness, public URL, Auth, evidence and safety checks pass |
| `PILOT_READY` | `FOUNDER_ACTIVATED` | Founder-only server-side action with explicit confirmation and audit |
| `FOUNDER_ACTIVATED` | `PILOT_RUNNING` | Founder / designated Pilot operator starts an approved cohort session |
| `PILOT_RUNNING` | `PILOT_CLOSING` | Founder / designated Pilot operator begins close |
| `PILOT_CLOSING` | `PILOT_CLOSED` | Evidence frozen and Pilot data preserved |

Codex, Creator and ordinary Operations users cannot transition into `FOUNDER_ACTIVATED`. There is no
frontend activation toggle and no default activation. The activation token is server-side only and
must never be logged, rendered or sent to a browser.

## 3. Final Machine-Executable Preflight

The existing VS-02K-EXT-02 deployment tooling remains authoritative. The final entry point is:

```text
pnpm pilot:activate:preflight
```

It reuses `scripts/operations/pilot-preflight.ps1` and additionally verifies:

- Pilot environment file and isolated state;
- HTTPS, DNS and non-loopback Public/API URLs;
- Pilot Auth configuration;
- Pilot DB isolation and state identity;
- required environment variables;
- `REAL_MONEY_ENABLED=false`;
- no Live Provider secret;
- migration, backup and restore assets;
- health and readiness;
- public URL, CORS and secure session contract inputs;
- logging, audit directory and retention configuration;
- state is eligible for activation: `PROVISIONED`, `PREFLIGHTED`, `DEPLOYED` or `PILOT_READY`.

The only valid summary outputs are:

```text
PILOT ACTIVATION = READY
```

or:

```text
PILOT ACTIVATION = BLOCKED
BLOCKER: <explicit reason>
```

No secret value is emitted. A blocked preflight cannot be bypassed by changing the Pilot state file
manually.

## 4. Founder-Only Activation Control

The server-side operational entry point is:

```text
pnpm pilot:activation -- -Action status
pnpm pilot:activation -- -Action activate -Confirm FOUNDER_ACTIVATE_PILOT
```

Activation requires all of:

1. current state is `PILOT_READY`;
2. `PILOT_ID` matches the server-side state;
3. `PILOT_FOUNDER_ACTIVATION_TOKEN` is present server-side;
4. `PILOT_ACTIVATION_ACTOR=founder`;
5. explicit confirmation string is supplied;
6. `REAL_MONEY_ENABLED=false`;
7. an append-only audit record is written.

The control changes only the Pilot activation state. It does not change `REAL_MONEY_ENABLED`, load
Provider credentials, create Payment facts or change any Order, Settlement, Ledger, Wallet or
Withdrawal state.

The activation audit records event, Pilot ID, previous state, next state, Founder actor, timestamp and
the money-disabled result. It does not record the activation token or other secret values.

## 5. Pilot Cohort Registry

The minimum registry is operational evidence, not a CRM:

| Field | Rule |
| --- | --- |
| Pilot ID | Unique controlled Pilot identifier |
| Creator | Real Creator identity and approved Pattern |
| Pattern | `Request`, `Reservation` or `Contract` only |
| Account | Independent Pilot Auth account |
| Public URL | Creator-owned public Commerce Identity URL |
| Start Date | Founder-approved session start |
| Status | `PLANNED`, `READY`, `RUNNING`, `CLOSED`, `BLOCKED` |
| Operator | Named Pilot operator |
| Evidence Location | Protected evidence reference |

The first cohort supports one to three Creators and never more than five. The registry must not
contain test tokens, fixture users, simulated identities or a fourth Pattern.

## 6. Pilot Session Evidence Capture

Each session may produce a structured evidence record:

```text
Pilot Session
├── Creator
├── Pattern
├── Environment
├── Publish
├── Distribution
├── Customer Action
├── Creator Action
├── Result
├── Friction
├── Support Intervention
└── Evidence References
```

Behavior capture is evidence collection only. It must not automatically infer PMF, Revenue, GMV,
Retention, Product-Market Fit or any other commercial conclusion. Money-related fields remain
`not executed` or `origin = simulation`.

## 7. Three-Pattern Pilot Guard

The registry and session evidence must accept only:

```text
Request
Reservation
Contract
```

Ticket, Instant, Membership, Marketplace and any fourth Pattern are out of scope. A request to cross
Pattern boundaries is a `Pilot Scope Exception` and must enter Controller Review before any product
or data-model change.

## 8. Pilot Close Procedure

Closing is explicit and evidence-preserving:

```text
PILOT_RUNNING
    ↓
PILOT_CLOSING
    ↓
Evidence Frozen
    ↓
Pilot Data Preserved
    ↓
PILOT_CLOSED
```

Close requirements:

- freeze the evidence register and observation log;
- preserve real Pilot database and Auth records;
- retain audit and correlation references;
- do not delete real Pilot data;
- do not convert Pilot records into Test Fixtures;
- do not rewrite historical facts;
- do not generate an automatic success conclusion.

The server-side close control requires `PILOT_RUNNING` or `PILOT_CLOSING`; it cannot close an
unactivated or merely provisioned Pilot.

## 9. Safety and Stop Conditions

Immediately block activation or stop new Pilot sessions if:

- `REAL_MONEY_ENABLED` is not exactly `false`;
- any Live Provider secret, webhook or live endpoint is present;
- Pilot DB/Auth/data overlaps with Development, Test or Simulation Fixture state;
- HTTPS, DNS, Auth, cookie/session, CORS, health or readiness evidence is missing;
- Creator or Customer actions require substitution by Founder or Operations;
- a new Pattern or vertical-specific Money behavior is requested;
- an operator would need to modify Order, Ledger, Wallet or Settlement facts manually.

No manual balance repair or fabricated evidence can clear a blocker.

## 10. Definition of Done

- `56_Phase5_External_Pilot_Activation_Gate.md` is frozen as `Execution Gate — Founder Activation Required`;
- `pnpm pilot:activate:preflight` is executable and returns explicit READY/BLOCKED results;
- Founder-only activation control is server-side, explicit and audited;
- cohort registry fields and limits are frozen;
- session evidence structure is ready without PMF or revenue inference;
- Request / Reservation / Contract Pattern guard is active;
- close procedure preserves evidence and Pilot data;
- `REAL_MONEY_ENABLED=false` remains enforced;
- no Live Provider exists;
- deployment package VS-02K-EXT-02 is reused unchanged in scope;
- existing regression remains green.

```text
PHASE5-002 — External Pilot Activation Gate = READY
Pilot Activation = Not Executed
Real Creator Pilot = Not Yet Executed
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

## 11. Explicit Non-Goals

This gate does not authorize a fourth Vertical, new Commerce Pattern, Provider integration, real
Payment, real Settlement, real Withdrawal, Marketplace, CRM, Calendar, Analytics Dashboard or
Commercial Launch.
