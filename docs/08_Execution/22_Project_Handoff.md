# Project Handoff — PersonalCommerceInfrastructure

> **Project Restart SSOT**: This document is the authoritative re-entry and suspension baseline.
> **Effective date**: 2026-08-18
> **Architecture update**: `PROJECT-SUSPEND-002` — Identity Anchor / Commerce ID / External Platform Binding

## 1. Project Identity

| Field            | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| Project          | `PersonalCommerceInfrastructure`                               |
| Current Status   | **SUSPENDED — DEVELOPMENT PAUSED**                             |
| Reason           | Founder temporarily reallocating attention to other projects   |
| Project Decision | **NOT CANCELLED**                                              |
| Current Baseline | `CLIENT-002 — Commerce Golden Path Closure = COMPLETE`         |
| Next Task        | `RESUME-001 — Identity & External Platform Binding Foundation` |

This is a clean project pause, not a product or repository termination. No new business capability
is authorized by this handoff. The identity architecture below is a documented discovery and
restart direction only; it is not implementation authorization.

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
structured commercial actions. It is not a content distribution platform or a new social network:
third-party platforms such as Xiaohongshu, Douyin, WeChat Channels, X, YouTube and Instagram provide
discovery, traffic and audience; PCI provides the platform-neutral commercial handoff. It is also
not a marketplace, calendar product, CRM, ticketing platform or real-money payment network.

```text
Third-party Content / Distribution Platforms
    ↓
Discovery / Traffic / Audience
    ↓
PersonalCommerceInfrastructure
    ↓
Identity → Commerce Profile → Commerce ID
    ↓
Commerce Objects
    ↓
Request / Reservation / Contract / future approved Objects
    ↓
Execution / Completion
    ↓
Earnings / Wallet Projection
```

The product therefore has two explicit infrastructure layers:

```text
PersonalCommerceInfrastructure
│
├── Identity Infrastructure
│   ├── Identity
│   ├── Commerce Profile
│   ├── Commerce ID / C号
│   └── External Platform Account + Commerce Relationship
│
└── Commerce Infrastructure
    ├── Request
    ├── Reservation
    ├── Contract
    ├── Completion
    ├── Earnings
    └── Wallet
```

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

### Identity anchor model

```text
Identity
    ↓
Commerce Profile
    ↓
Commerce ID / C号
    ↓
External Platform Accounts + Commerce Relationships
    ↓
Commerce Objects
```

`Identity ID` is the internal permanent identity root. It is private, non-enumerable and stable
across nickname, brand, platform handle and profile changes. It is not a public business number,
authentication credential or container for PII. UUIDv7 or an equivalent non-guessable, time-ordered
identifier is the recommended direction; no implementation is included in the suspended baseline.

`Commerce Profile` is the commercial identity represented to customers. It is not forced to equal a
natural person: one internal Identity may own multiple Profiles, such as a Personal Creator, Dance
Group / Studio and Brand / Business identity.

```text
1 Identity : N Commerce Profiles
1 Commerce Profile : 1 stable Commerce ID
1 Commerce Profile : N External Platform Accounts
1 Platform : N External Platform Accounts per Commerce Profile
1 External Platform Account : 1 active verified owner / manager relationship by default
```

Each `External Platform Account` is a separate account object, not a single Profile field and not a
single account slot per platform. One Commerce Profile may bind multiple accounts on the same
platform, for example multiple Douyin accounts, and multiple accounts across different platforms.
Its future conceptual facts are `platform`, `platform_account_id`, `platform_handle`, `profile_url`,
`verification_status`, `bound_at`, `unbound_at`, `status` and a role such as `primary` or `secondary`.

The account relationship remains explicit rather than assuming that an external account directly
equals a Commerce Profile:

```text
External Platform Account
        ↓
Commerce Relationship
        ↓
Commerce Profile
```

The relationship is the future boundary for ownership, management, verification and role. By
default, one external account has one active verified owner / manager relationship to prevent
conflicting commercial claims. Shared or managed team accounts may eventually require multiple
Profiles or internal Identities, but that is a separately approved capability and is not opened by
this handoff. Binding and unbinding never change the Commerce ID.

Example:

```text
Commerce Profile: Alice Dance Studio
├── Douyin @alice_dance       (primary / verified)
├── Douyin @alice_live        (secondary / verified)
├── Xiaohongshu @alice_dance  (primary / verified)
└── YouTube Alice Dance Studio (secondary / verified)
```

### Commerce ID / C号

`Commerce ID / C号` is a platform-neutral public identifier for a Commerce Profile and a stable
commercial entry anchor. It is not a password, API key, session token, OAuth credential, payment
credential or authorization credential.

Recommended display format:

```text
C-XXXXXXXX
```

The suffix uses an 8-character Crockford Base32-style alphabet with confusing presentation
characters removed (`O / 0 / I / 1 / L`). It is uppercase, fixed-length, URL-safe, easy to speak,
QR/OCR-friendly and carries no region, year, tier, platform, gender or Creator-type meaning.

```text
C-7K4M2Q9R
```

`32^8 = 1,099,511,627,776`, approximately **1.10 trillion** theoretical combinations. This is a
capacity estimate, not a security guarantee. Allocation must use random generation, database
uniqueness enforcement and collision retry; it must not use `next_user_number++`.

Once assigned, a C号 is immutable and non-reusable. Profile edits, renamed brands, platform binding
changes, unbinding, suspension, closure or deletion do not change it, and it is never reassigned
because historical Commerce Objects, Orders, Contracts, Events, Earnings and Wallet facts may refer
to it. `Identity ID ≠ Commerce ID ≠ Commerce Object ID`.

The future public entry concept is `/c/{commerce_id}`, for example `/c/C-7K4M2Q9R`. It resolves to a
Commerce Profile, not a social-profile mirror or content publishing surface. The format of specific
Commerce Object IDs is not frozen by this handoff.

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

### RESUME-001 — Identity & External Platform Binding Foundation

`RESUME-001` starts with a re-entry audit and then defines the first Founder-authorized direction for
the identity gap. It does not grant automatic implementation permission.

### Stage 1 — Re-entry Audit

1. Read this Handoff SSOT and `59_Identity_Anchor_and_Commerce_ID.md`;
2. Check the current Git commit and `suspend/client-002-complete-identity-reentry` tag;
3. Run the complete engineering preflight;
4. Verify CLIENT-001 and CLIENT-002 regressions remain PASS;
5. Check code, dependency and documentation drift;
6. Reconfirm the current commercial objective.

### Stage 2 — Identity Model Finalization

Finalize `Identity`, `Commerce Profile`, `Commerce ID`, `External Platform Account` and `Commerce
Relationship`, preserving multiple accounts per platform and explicit ownership / management rules.

### Stage 3 — Commerce ID Foundation

Design and, only after explicit authorization, implement generation, uniqueness, collision retry,
immutability, non-reuse, lookup and public resolution for `C-XXXXXXXX`.

### Stage 4 — External Platform Binding

Establish a platform-neutral binding abstraction first. Add individual platform integrations only as
separately approved bounded work; do not begin with all-platform OAuth or a social platform.

### Stage 5 — Public Commerce Entry

Establish `/c/{commerce_id}` only after the preceding identity boundaries are approved.

Finally, produce candidate implementation units and wait for Founder Decision before writing code.

Do not interpret `RESUME-001` as authorization to start Payment, App, Provider, a new Pattern, a
new Vertical, Social Graph, content publishing, content recommendation or multi-platform content
synchronization.

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

| Area                     | Status     | Notes                                           |
| ------------------------ | ---------- | ----------------------------------------------- |
| Pattern-first Web Client | COMPLETE   | CLIENT-001                                      |
| Request Commerce         | COMPLETE   | Golden Path PASS                                |
| Reservation Commerce     | COMPLETE   | Golden Path PASS                                |
| Contract Commerce        | COMPLETE   | Golden Path PASS                                |
| Creator Commerce Desk    | COMPLETE   | Shared execution surface                        |
| Customer Action Router   | COMPLETE   | Routing only                                    |
| Completion               | COMPLETE   | Domain-driven                                   |
| Earnings Projection      | COMPLETE   | Completion-driven                               |
| Wallet Projection        | COMPLETE   | Completion-driven                               |
| Idempotency              | COMPLETE   | Duplicate completion rejected                   |
| Real Money               | DISABLED   | `REAL_MONEY_ENABLED=false`                      |
| Payment Provider         | DEFERRED   | None connected                                  |
| Native App               | DEFERRED   | `apps/app` not implemented                      |
| Current Development      | SUSPENDED  | Founder temporary pause                         |
| Next Task                | RESUME-001 | Identity & External Platform Binding Foundation |

## 12. Handoff Authority

This document is the unique Project Restart SSOT. Historical handoff and commercialization records
remain useful evidence, but they do not supersede this file for current project status, restart
sequence or suspension boundaries. `59_Identity_Anchor_and_Commerce_ID.md` is the linked governance
record for the identity architecture direction; it is not a second Restart SSOT.

```text
PERSONALCOMMERCEINFRASTRUCTURE

STATUS: SUSPENDED
SUSPEND BASELINE: CLIENT-002 — Commerce Golden Path Closure
BASELINE: Pattern-first Web Commerce + Request + Reservation + Contract + Creator Execution
          + Completion + Earnings Projection + Wallet Projection
REAL_MONEY_ENABLED: false
NATIVE APP: DEFERRED
REAL PAYMENT: NOT IMPLEMENTED
NEXT TASK: RESUME-001 — Identity & External Platform Binding Foundation
```
