# 53 — VS-02L03 Commercial Appearance Contract Design

> **Status**: Founder Approved — Build Authorized
> **Decision Date**: 2026-08-17
> **Implementation Change Unit**: `DEV-026` — Closed
> **Decision Reference**: `DEV-025` — Founder / Controller approval
> **Build Authorization**: Granted
> **Real Money**: Not authorized

## 1. Purpose and Decision Boundary

This document records the approved minimum `Contract Commerce` implementation for a single
commercial appearance engagement sold by a Dance Troupe or Independent Singer to a Business Buyer.
It is the applied product and engineering contract for `DEV-026`.

Current implemented cross-vertical facts are:

```text
Dancer Private Lesson                  → Request Commerce
Cosplayer Convention Appearance        → Request Commerce
Photographer Session                   → Reservation Commerce
Dance Troupe / Independent Singer      → Contract Commerce candidate
```

The design must preserve the existing infrastructure boundary:

```text
Creator Identity
→ Offering
→ Commerce Action / Pattern-specific acceptance
→ Order
→ Payment
→ Fulfillment
→ Settlement
→ Earnings Ledger
→ Wallet
→ Withdrawal
```

`REAL_MONEY_ENABLED = false` and `No Real Money Evidence` remain unchanged.

The implementation does not connect a Provider, create real payment, create real settlement or
create real withdrawal. Local Payment Simulation remains the only executable money path.

## 2. Minimum Business Scenario

| Term            | Decision-preparation definition                                                     |
| --------------- | ----------------------------------------------------------------------------------- |
| Creator         | Dance Troupe or Independent Singer                                                  |
| Buyer           | Brand, Venue, Event Organizer or Commercial Client                                  |
| Commerce        | One commercial performance / commercial appearance engagement                       |
| Example         | A brand invites a troupe to perform for 30–60 minutes on a specified date           |
| Initial pattern | Contract Commerce candidate                                                         |
| Distribution    | Creator Commerce Identity, Offering and creator-owned external channels             |
| Scope           | One Creator ↔ one Business Buyer ↔ one engagement                                   |
| Currency        | CNY candidate; multi-currency remains deferred                                      |
| Non-goals       | CRM, deal pipeline, agency management, roster, touring, rider, travel and venue CRM |

The first slice is not a marketplace. A Business Buyer must be an identified requester or approved
external party; the platform does not discover, rank or match Buyers and Creators.

## 3. Why Contract Commerce Is Not Request Commerce

`Request Commerce` treats the primary commercial decision as a Creator decision over a request:

```text
Buyer Request
→ Creator Confirm / Decline
→ Order
→ Payment
→ Fulfillment
→ Settlement
```

The request may contain free-form context, but confirmation generally accepts the existing Offering
and the Creator's response does not require a bilateral structured agreement.

The candidate Contract lifecycle is materially different:

```text
Buyer Request
→ Scope / Quote
→ Counter-offer or revision
→ Acceptance
→ Contract Formed
→ Order
→ Payment
→ Fulfillment / Acceptance
→ Settlement
```

The difference is not merely a longer UI flow:

| Decision surface | Request Commerce                              | Contract Commerce candidate                                  |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------ |
| Buyer scope      | Context for a request                         | Structured commercial scope may be proposed                  |
| Creator response | Confirm or decline                            | Quote, counter-offer, accept or decline                      |
| Price            | Often Offering-defined or entered once        | May be quoted and snapshot-frozen                            |
| Commitment       | Creator confirms a request                    | Both parties accept the same scope and price                 |
| Scope snapshot   | Existing Order Snapshot is usually sufficient | Immutable scope may need to exist before Order               |
| Acceptance       | Usually Creator-side decision                 | Potentially bilateral acceptance                             |
| Fulfillment      | One service completion fact may suffice       | Performance and deliverable obligations may be checked       |
| Settlement       | Existing single release path                  | Could be final acceptance or approved milestones             |
| Exceptions       | Cancellation / refund                         | Scope amendment, buyer dispute, non-performance and recovery |

Contract Commerce is therefore justified only if bilateral scope and acceptance are real product
facts. If the actual scenario can be expressed as one Creator confirmation plus an Order Snapshot,
it should remain Request Commerce.

## 4. Candidate Contract Models

### 4.1 Model A — Fixed Engagement

```text
Published Performance Package
→ Buyer Request
→ Creator Confirm
→ Contract Formed
→ Order
```

The Creator publishes a sufficiently fixed package: performance type, duration, date constraints,
price and basic fulfillment terms. The Buyer accepts the package without negotiation.

| Dimension            | Assessment                                                   |
| -------------------- | ------------------------------------------------------------ |
| Product complexity   | Lowest                                                       |
| Creator control      | High; Creator defines the package                            |
| Buyer expression     | Limited to selecting or requesting a fixed package           |
| Price                | Fixed or bounded package price                               |
| Cancellation         | Policy-driven, easier to explain                             |
| Fulfillment          | Single performance completion is plausible                   |
| Settlement           | Single final release is plausible                            |
| Operations           | Similar to Request Commerce with a stronger snapshot         |
| Verticalization risk | Medium; package catalog can become an event-services catalog |

This model proves only a light Contract boundary. It may not justify a new Pattern if there is no
bilateral acceptance or negotiation.

### 4.2 Model B — Quote then Accept

```text
Buyer Request
→ Creator Quote
→ Buyer Accept
→ Contract Formed
→ Order
```

The Buyer submits an engagement request. The Creator returns one structured Quote containing scope,
date, price and terms. The Buyer accepts or rejects that Quote.

| Dimension            | Assessment                                                      |
| -------------------- | --------------------------------------------------------------- |
| Product complexity   | Medium                                                          |
| Creator control      | High; Creator controls price and feasibility                    |
| Buyer expression     | Good; Buyer can describe the engagement                         |
| Price                | Creator-proposed and snapshot-frozen                            |
| Cancellation         | Requires quote/contract policy                                  |
| Fulfillment          | Single performance plus optional deliverable facts              |
| Settlement           | Final release is the minimum candidate                          |
| Operations           | Needs proposal expiry, acceptance audit and conflict visibility |
| Verticalization risk | Medium-high if quote revisions become a sales pipeline          |

This model introduces a genuine bilateral acceptance fact while keeping the first implementation
small. It does not require arbitrary negotiation threads or a CRM.

### 4.3 Model C — Scope Negotiation

```text
Buyer Request
→ Scope Proposal
→ Creator Counter-offer
→ Buyer Counter-offer
→ Agreement
→ Contract Formed
→ Order
```

The Buyer and Creator negotiate structured Date, Location, Duration, Deliverables, Headcount,
Price and Cancellation Terms until both parties accept one version.

| Dimension            | Assessment                                      |
| -------------------- | ----------------------------------------------- |
| Product complexity   | Highest                                         |
| Creator control      | Shared; Creator can reject or counter           |
| Buyer expression     | Highest                                         |
| Price                | Iterative and versioned                         |
| Cancellation         | Requires amendment and dispute rules            |
| Fulfillment          | May require multiple obligations                |
| Settlement           | May require milestone or acceptance policy      |
| Operations           | High audit, expiry, conflict and support burden |
| Verticalization risk | High; easily becomes CRM / Deal Pipeline        |

Model C is strategically expressive but is too broad for the first Contract slice unless Founder
explicitly wants a negotiation product.

### 4.4 Recommendation for Founder Review

**Recommended candidate: Model B — Quote then Accept.**

Reasons:

1. It proves Contract Commerce is bilateral rather than a renamed Creator confirmation.
2. It supports real commercial appearance variability without building a negotiation inbox.
3. It creates one immutable quoted Scope Snapshot before Order creation.
4. It keeps the initial Money interaction compatible with the existing full-payment model.
5. It gives Operations a finite lifecycle: request, quote, accept/reject, expiry, cancel and dispute.

This recommendation is not frozen until Founder / Controller approval.

## 5. Contract Object Boundary

### Option A — Confirmed Commerce + Order Snapshot

The confirmed Commerce Action stores the accepted quote and the existing Order Snapshot stores the
commercial facts. No independent Contract object exists.

**Advantages:** lowest object count and maximum reuse.
**Risks:** bilateral acceptance, amendment history and pre-Order contract audit may be awkward;
the Order becomes responsible for facts that exist before an Order.

### Option B — Independent Contract Object

```text
Contract
├── Buyer
├── Creator
├── Offering
├── Scope Snapshot
├── Price
├── Acceptance Facts
├── Fulfillment Obligations
└── Order
```

**Advantages:** clear ownership, immutable scope, bilateral acceptance, amendment linkage and
contract-specific audit.
**Risks:** a new core-adjacent object, additional lifecycle and risk of document-management scope.

### Option C — Contract as an Order Pattern Extension

The Order remains the commercial commitment, with pattern-specific Contract fields and acceptance
facts attached to the Order.

**Advantages:** direct Money and Order linkage.
**Risks:** Order is created before Contract acceptance or becomes overloaded with proposal and
amendment state; pre-commitment audit becomes less clear.

### Applied Build Decision

Founder / Controller approved **Option B — an independent generic `Contract` object** under
`DEV-026`. The approved first slice requires bilateral acceptance, an immutable Scope Version before
Order creation, proposal expiry, acceptance facts and an explicit Contract lifecycle.

`Contract` must remain generic. Prohibited objects include `PerformanceContract`,
`DanceTroupeContract`, `SingerContract` and `EventOrganizerContract`.

## 6. Scope Snapshot

Once a Contract is formed, the following facts must be immutable:

| Scope fact           | Required v1 meaning                                              |
| -------------------- | ---------------------------------------------------------------- |
| Performance type     | Performance / appearance category and plain-language description |
| Duration             | Contracted duration or bounded duration                          |
| Date                 | Contracted date or approved date range                           |
| Location             | Venue / location description; no venue-management object         |
| Creator headcount    | Number or named Creator unit included in the engagement          |
| Deliverables         | Performance and any explicitly included deliverables             |
| Price                | Gross amount, currency and pricing basis                         |
| Cancellation terms   | Accepted cancellation and refund conditions                      |
| Fulfillment criteria | What evidence makes the engagement complete                      |

The Snapshot must include source version, accepted-at timestamps, actor identities and correlation
metadata. Editing the Offering after Contract formation must not change the Contract or Order
Snapshot.

No document suite, signature-image workflow, legal template engine or file repository is required
for the minimum slice.

## 7. Acceptance Lifecycle

Candidate states are separate from Order, Payment and Fulfillment states:

```text
Draft
  ↓
Proposed
  ├──→ Expired
  ├──→ Rejected
  └──→ Accepted by Creator
             ↓
       Accepted by Buyer
             ↓
         Contracted
```

Alternative ordering must be considered:

```text
Buyer Proposed
→ Creator Accepted
→ Buyer Accepted
→ Contracted
```

The applied acceptance rule is:

1. Creator owns and publishes the Quote / Scope proposal.
2. Buyer accepts the exact proposed version.
3. The platform records both acceptance facts against the same immutable version.
4. Only then does `Contracted` become true.
5. Only a Contracted version may create an Order.

Creator may propose. Buyer may accept or reject. An unaccepted proposal may expire. Counter-offers,
negotiation threads, arbitrary amendments and multi-round negotiation are not implemented.

No acceptance state may be stored by mutating `Order.state`, `Payment.state` or `Fulfillment.state`.

## 8. Fulfillment and Settlement Candidates

### Model A — Performance Completed

The Creator records a fact that the contracted performance occurred, with evidence reference,
occurred-at timestamp and actor.

**Benefit:** smallest implementation and strongest reuse.
**Risk:** Buyer disputes are handled after completion through Operations / Recovery.

### Model B — Performance Completed + Buyer Acceptance

The Creator records completion; the Buyer accepts the completion before Settlement release.

**Benefit:** bilateral commercial closure.
**Risk:** Buyer silence, acceptance timeout and dispute policy become mandatory.

### Model C — Milestone Completion

The Contract contains multiple obligations, each with its own completion and possible acceptance.

**Benefit:** supports complex commercial engagements.
**Risk:** introduces milestone pricing, partial settlement, amendment and dispute complexity.

### Applied Build Decision

**Fulfillment trigger: Performance Completed.**
**Settlement trigger: Payment Confirmed + Performance Completed + no active Resolution.**

Buyer Acceptance may be recorded as an additional fact when supplied, but should not block the
minimum first settlement path unless Founder chooses Model B. Milestones and staged settlement are
Deferred. This preserves DEC-013-A/B and avoids creating a second Money model.

For a disputed performance, Settlement must remain Pending Resolution or otherwise follow the
existing Refund / Recovery semantics. Operations cannot mark Payment, Fulfillment or Settlement
successful without the corresponding approved fact.

## 9. Cancellation, Dispute and Recovery

| Situation                              | Contract fact                               | Order / Payment                   | Fulfillment                   | Settlement / Recovery                    |
| -------------------------------------- | ------------------------------------------- | --------------------------------- | ----------------------------- | ---------------------------------------- |
| Buyer cancels before Contracted        | Proposal / request cancelled                | No Order should exist             | None                          | No Money mutation                        |
| Buyer cancels after Contracted, unpaid | Contract cancelled under policy             | Payment remains absent or pending | No completion                 | No Available Earnings                    |
| Buyer cancels after Payment            | Cancellation fact is appended               | Existing Refund path only         | No silent completion          | Refund / Recovery policy applies         |
| Creator cancels before performance     | Contract cancellation / responsibility fact | Existing Order remains factual    | Not fulfilled                 | Refund / Recovery or Resolution          |
| Date change                            | Amendment or rescope candidate              | No silent Order overwrite         | Pending                       | Requires approved policy                 |
| Creator no-show                        | Non-fulfillment / Resolution fact           | Order remains factual             | Not completed                 | No Available Earnings; Refund / Recovery |
| Buyer dispute                          | Resolution fact                             | Payment remains independent       | Fulfillment evidence retained | Pending Resolution until resolved        |
| Quote expiry                           | Proposal expires                            | No Order                          | None                          | No Money mutation                        |

The minimum slice should not implement arbitrary Buyer claims or automated legal adjudication.
Dispute and Recovery must use existing Operations, Refund and Recovery facts. A future policy may
add Buyer Acceptance or milestones, but that is a Founder decision.

## 10. Money Layer Reuse Audit

| Core Capability  | Reuse                        | Change                    | Contract-specific extension                                     |
| ---------------- | ---------------------------- | ------------------------- | --------------------------------------------------------------- |
| Creator Identity | Yes                          | None                      | Business appearance context only                                |
| Offering         | Yes                          | None                      | Performance package / quote source                              |
| Request          | Yes                          | None                      | Buyer request carries engagement context                        |
| Reservation      | Deferred / optional          | None in minimum candidate | Date constraint may reference an existing slot only if approved |
| Contract         | Candidate new generic object | Founder decision          | Scope, quote and bilateral acceptance facts                     |
| Order            | Yes                          | None preferred            | Created only after Contracted                                   |
| Payment          | Yes                          | None                      | One full payment candidate; no deposit in preparation           |
| Fulfillment      | Yes                          | None preferred            | Performance Completed fact                                      |
| Settlement       | Yes                          | None preferred            | Existing eligibility plus no active Resolution                  |
| Ledger           | Yes                          | None                      | Immutable Earnings entries                                      |
| Wallet           | Yes                          | None                      | Ledger projection only                                          |
| Withdrawal       | Yes                          | None                      | Existing Withdrawal lifecycle                                   |
| Operations       | Yes                          | None preferred            | Quote expiry, conflict, dispute and Resolution view             |

**Current conclusion:** no Core Money change is required for the recommended minimum candidate.
If milestones, deposits, split payments, staged settlement or Buyer Acceptance gating are required,
that must become a separate Controller / Core Architecture Decision before implementation.

## 11. Architecture Pressure Test

The three patterns can remain on one infrastructure:

```text
Request Commerce
    Request → Creator Decision → Order

Reservation Commerce
    Availability → Hold → Confirmed Reservation → Order

Contract Commerce
    Request → Quote / Scope → Bilateral Acceptance → Contract → Order

Shared:
    Identity → Offering → Order → Payment → Fulfillment → Settlement
    → Earnings Ledger → Wallet → Withdrawal → Operations
```

### Core

- Creator Identity and public Commerce Identity;
- Offering and Offering Snapshot;
- Commerce Action / request origin;
- Order and immutable Order Snapshot;
- Payment, Fulfillment, Settlement;
- Earnings Ledger, Wallet Projection and Withdrawal;
- Operations, audit, idempotency and fact-source boundaries.

### Pattern-specific

- Request confirmation;
- Reservation slot allocation, Hold and expiry;
- Contract quote, Scope Snapshot, bilateral acceptance and proposal expiry.

### Deferred

- Contract amendments;
- Milestones and staged settlement;
- Deposits, installment and split payment;
- Buyer acceptance as a universal settlement gate;
- Legal document/signature management;
- Deal pipeline, CRM, agency operations and touring.

Contract Commerce can therefore test a new acceptance/commitment Pattern without changing the
Money Domain, provided the first approved scope remains one-time payment and final performance
completion.

## 12. Verticalization Guard

The first Contract slice must not become:

- CRM Deal Pipeline;
- Lead Management;
- Sales Funnel;
- Agency Management;
- Artist Roster;
- Tour Management;
- Rider Management;
- Travel Management;
- Staff Scheduling;
- Venue CRM;
- Contract Document Management Suite;
- Ticketing, Ticket Inventory or Marketplace.

Touring may appear only as Creator-owned Upcoming / Distribution context. A performance date is a
Contract Date Constraint, not a Calendar Product. External ticket links may be displayed, but the
platform must not own ticket inventory, admission or check-in.

## 13. Acceptance Candidates

| ID      | Actor                  | Object                    | Candidate state / event                                  | Money impact                                       |
| ------- | ---------------------- | ------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| CON-D01 | Buyer                  | Commerce Action / Request | Buyer submits commercial engagement request              | No Money fact                                      |
| CON-D02 | Creator                | Quote / Scope version     | Creator proposes price and immutable candidate Scope     | No Order or Money fact                             |
| CON-D03 | Buyer                  | Quote / Scope version     | Buyer accepts exact proposed version                     | No Order or Money fact                             |
| CON-D04 | System / both parties  | Contract                  | Contract formed after required acceptance facts          | Commitment fact; no Wallet mutation                |
| CON-D05 | System                 | Scope Snapshot            | Accepted Scope is immutable and versioned                | Determines future Order amount                     |
| CON-D06 | System                 | Order                     | One existing Order created exactly once after Contracted | Creates existing Payment-pending path              |
| CON-D07 | Customer / simulator   | Payment                   | Existing Payment reaches confirmed / failed / expired    | Payment fact only; no direct Available Earnings    |
| CON-D08 | Creator                | Fulfillment               | Performance Completed recorded through existing use case | Makes Settlement eligible only with Payment        |
| CON-D09 | Buyer / system         | Completion fact           | Buyer acceptance or completion observation, if approved  | No direct Ledger mutation                          |
| CON-D10 | Operations / simulator | Settlement                | Existing Settlement released / failed / resolved         | One Ledger credit only after release               |
| CON-D11 | Creator                | Earnings / Wallet         | Ledger Projection shows Pending / Available / Restricted | No writable balance                                |
| CON-D12 | Buyer / Creator        | Contract                  | Cancellation fact with policy outcome                    | Existing Refund / Recovery only                    |
| CON-D13 | Operations             | Resolution                | Dispute / Recovery fact and resolution                   | Pending Resolution / Recovery Obligation semantics |

Each candidate must remain replayable, idempotent and auditable. UI clicks are not canonical facts
unless they create the corresponding approved Application Use Case fact.

## 14. Applied Architecture Reuse Audit

| Capability      | Core reused | Contract-specific addition                           | Money Domain change |
| --------------- | ----------- | ---------------------------------------------------- | ------------------- |
| Identity        | Yes         | None                                                 | None                |
| Offering        | Yes         | Scope is sourced from the proposal                   | None                |
| Request         | Yes         | Contract proposal is linked to the submitted request | None                |
| Order           | Yes         | Created only after Contracted; one initial Order     | None                |
| Payment         | Yes         | Local Simulator only                                 | None                |
| Fulfillment     | Yes         | Performance Completed uses existing use case         | None                |
| Settlement      | Yes         | Existing eligibility rule                            | None                |
| Earnings Ledger | Yes         | None                                                 | None                |
| Wallet          | Yes         | None                                                 | None                |
| Withdrawal      | Yes         | None                                                 | None                |
| Operations      | Yes         | Existing operations views and audit                  | None                |

Contract-specific capabilities are limited to Quote / Scope Version, bilateral acceptance,
proposal expiry and the generic Contract lifecycle. No Contract-specific Payment, Settlement,
Ledger, Wallet or Provider branch exists.

## 15. Applied Acceptance Evidence

The implementation covers the approved `CON-01` through `CON-20` boundary through domain,
application, API, persistence and browser regression suites. The evidence boundary includes:

- Buyer Request → Creator Quote / Scope → Buyer Accept → Contracted;
- immutable append-only Scope Version and frozen Order Snapshot;
- exactly one initial Order after Contracted, including retry/idempotency;
- Local Simulator Payment and existing Fulfillment / Settlement / Earnings / Wallet path;
- rejection, expiry, cancellation, Pending Resolution and Recovery reuse;
- duplicate acceptance, duplicate Contracted and replay-safe canonical events;
- Dancer Request Commerce, Cosplayer Request Commerce and Photographer Reservation regression.

The implementation remains Provider-neutral and does not create real-money evidence.

## 15. Final Decision Preparation Output

| Applied output            | Result                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Contract Model            | Model B — Quote then Accept                                                                                                |
| Contract Object Boundary  | Independent generic `Contract`                                                                                             |
| Acceptance Flow           | Creator proposes Quote / Scope → Buyer accepts exact version → Contracted → one Order                                      |
| Fulfillment Trigger       | Performance Completed                                                                                                      |
| Settlement Trigger        | Payment Confirmed + Performance Completed + no active Resolution                                                           |
| Required New Objects      | Generic Contract, Scope Version, Acceptance Fact                                                                           |
| Required New States       | Draft, Proposed, Accepted, Contracted, Rejected, Expired, Cancelled                                                        |
| Required Canonical Events | `contract_proposed`, `contract_accepted`, `contract_rejected`, `contract_expired`, `contract_formed`, `contract_cancelled` |
| Core Reuse Audit          | Identity, Offering, Request, Order, Payment, Fulfillment, Settlement, Ledger, Wallet, Withdrawal and Operations reused     |
| Architecture Risk         | No unresolved Core Money Architecture Gap in the approved one-time-payment slice                                           |
| Verticalization Risk      | Scope guard remains active; no CRM, Deal Pipeline, Touring or venue operations                                             |
| Founder Decision          | Applied under `DEV-025`; implementation closed under `DEV-026`                                                             |

```text
VERTICAL-02L-03 — Commercial Appearance Contract = COMPLETE
DEV-025 = Approved — Decision Closed
DEV-026 = Closed — Build Applied
BUILD AUTHORIZATION = GRANTED
REAL_MONEY_ENABLED = false
No Real Money Evidence
Contract Commerce = Complete
Fourth Vertical = Not Started
```

This change unit is complete. It does not authorize a fourth Vertical or real-money activation.
