# 52 — VS-02L02 Photographer Session Reservation Design

> **Status**: Founder Approved — Implementation Complete
> **Decision Date**: 2026-08-17
> **Change Unit**: `DEV-024` — Closed
> **Build Authorization**: Granted
> **Real Money**: Not authorized

## 1. Purpose and Decision Boundary

VS-02L02 prepares the minimum Reservation Commerce contract for an independent photographer selling
a portrait/photo session to an individual client. It is the first proposed new Commerce Pattern after
two cross-vertical Request Commerce slices:

```text
Dancer Private Lesson                  → Request Commerce
Cosplayer Convention Appearance        → Request Commerce
Photographer Session Reservation        → Reservation Commerce candidate
```

This document compares the required lifecycle, object, availability, payment, fulfillment and
settlement semantics. It does **not** authorize Reservation implementation. No current Request
Commerce, Order, Payment, Settlement, Ledger, Wallet, Withdrawal, Provider Port or Provider Adapter
contract is changed by this document.

The fixed v1 business scenario is:

| Term         | Decision-preparation definition                                                              |
| ------------ | -------------------------------------------------------------------------------------------- |
| Creator      | Independent Photographer                                                                     |
| Customer     | Individual Client                                                                            |
| Commerce     | Portrait / Photo Session                                                                     |
| Example      | One 60-minute portrait session                                                               |
| Price        | A fixed price may be configured after approval; no deposit or multi-stage price in v1        |
| Distribution | Existing Creator Commerce Identity and creator-owned public URL                              |
| Non-goals    | Studio SaaS, client CRM, gallery/file-delivery platform, room management and team scheduling |

## 2. Existing Core Fact Base

The current implemented Paid Service flow is:

```text
Service Offering
→ Customer Request
→ Creator Confirm
→ Order
→ one full Payment
→ Fulfillment
→ Settlement
→ Earnings Ledger
→ Wallet
→ Withdrawal
```

Only Request Commerce is implemented today. The existing Money model is intentionally
provider-neutral and fact-driven:

- Payment confirmation is not an Available Earnings credit.
- Settlement releases Earnings only after the applicable fulfillment trigger and no active resolution.
- Ledger entries, Wallet projection and historical Withdrawal facts are immutable.
- Refund, reversal, restricted earnings and Recovery Obligation follow the frozen DEC-013-A/B
  lifecycle; no Reservation rule may override them.

Reservation Commerce must add scarce-time allocation semantics without creating a second Order or
Money system.

## 3. Reservation Commerce Definition

A customer is not “booked” merely by viewing a time or submitting an intent. A successful
Reservation requires all of the following facts:

1. a creator-published slot is eligible at the requested time;
2. the slot is atomically allocated to one customer or returned to availability;
3. a Reservation confirmation fact exists;
4. an Order is created only after the Reservation is confirmed;
5. Payment, Fulfillment, Settlement and Wallet continue as separate fact lifecycles.

The candidate conceptual flow is therefore:

```text
Availability Slot
→ temporary Reservation Hold
→ Reservation Confirmed
→ existing Order
→ existing Payment
→ Session Fulfilled
→ existing Settlement
→ existing Ledger / Wallet
```

This is a candidate model, not a state machine authorized for implementation.

## 4. Lifecycle Model Comparison

### 4.1 Model A — Hold then Confirm

```text
Available Slot
→ Customer selects slot
→ time-bounded Hold
→ Creator or permitted system confirms
→ Reservation Confirmed
→ Order
→ Payment
```

| Dimension        | Analysis                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Creator control  | High. The creator can review the customer/context before committing scarce time.                                   |
| Double-booking   | Explicit Hold and expiry give a clear concurrency boundary; confirmation atomically consumes the slot.             |
| Customer UX      | Slightly slower, but accurately communicates that a session is pending confirmation rather than already booked.    |
| Payment timing   | Recommended only after Reservation Confirmed. A Hold must not create a Payment obligation.                         |
| Cancellation     | Before confirmation, expiry/release has no Payment fact. After confirmation, cancellation follows approved policy. |
| Expiry           | Native, explicit behavior: an unconfirmed Hold returns capacity at a deterministic expiry.                         |
| Refund           | Only applies after a Payment fact; existing Refund / Recovery model remains authoritative.                         |
| Settlement       | Candidate release after Payment Confirmed + Session Completed + no active cancellation/refund/resolution.          |
| Request relation | Similar creator-control intent to Request Commerce, but adds time allocation as a first-class commercial fact.     |

### 4.2 Model B — Instant Reservation

```text
Available Slot
→ Customer selects slot
→ Reservation / Order immediately confirmed
→ Payment
```

| Dimension        | Analysis                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Creator control  | Low. It assumes every published slot can be committed without review.                                                     |
| Double-booking   | Requires fully reliable atomic allocation at the instant of selection; failures become customer-facing booking conflicts. |
| Customer UX      | Fastest path, but risks overstating confirmation when creator eligibility or preparation still needs review.              |
| Payment timing   | Usually immediate, increasing refund/cancellation exposure if creator cannot honor the booking.                           |
| Cancellation     | More Payment and Refund facts occur before creator review; policy must be stronger before launch.                         |
| Expiry           | Requires a payment/checkout timeout design to avoid a permanently consumed slot.                                          |
| Refund           | More frequent by design because cancellations can occur after immediate charge.                                           |
| Settlement       | Can reuse a session-complete trigger but creates the largest operational exception surface in v1.                         |
| Request relation | Bypasses the creator decision boundary proven by Request Commerce.                                                        |

### 4.3 Model C — Request then Reserve

```text
Customer Request
→ Creator accepts
→ creator/customer chooses and locks a Slot
→ Reservation Confirmed
→ Order
→ Payment
```

| Dimension        | Analysis                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Creator control  | High, but the existing Request decision and Reservation decision are separated.                                           |
| Double-booking   | Solvable with an explicit Slot allocation, but the allocation happens later and can disappoint an accepted requester.     |
| Customer UX      | Highest coordination cost: request, acceptance, slot selection and payment are multiple steps.                            |
| Payment timing   | Naturally after the final slot confirmation.                                                                              |
| Cancellation     | Clear after confirmation; however, acceptance without a remaining slot needs a new failure/resolution explanation.        |
| Expiry           | Requires expiry for both the request and the post-acceptance slot-selection window.                                       |
| Refund           | Reuses existing post-payment Refund semantics.                                                                            |
| Settlement       | Can reuse session-complete trigger.                                                                                       |
| Request relation | Reuses current Request Commerce most directly, but may duplicate intent/acceptance semantics inside Reservation Commerce. |

### 4.4 Recommendation for Founder Approval

**Recommended candidate: Model A — Hold then Confirm, with full Payment only after Reservation
Confirmed.**

It retains creator control, introduces the minimum new architecture needed to prevent double booking,
and avoids treating an expiring Hold as a paid commercial fact. It also avoids v1 deposits and a
second payment phase, both outside the current Money model.

This is a recommendation only. Founder approval is required before this model, its state transitions,
or its payment timing can be frozen.

## 5. Reservation Object Decision Preparation

### 5.1 Object Options

| Option | Definition                                                                                                                  | Lifecycle / audit assessment                                                                                                       | Decision-preparation assessment |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| A      | Reservation is only Pattern-specific state on an existing Commerce Action.                                                  | Ownership, Hold expiry, concurrency and cancellation become implicit; difficult to audit independently from Request or Order.      | Not recommended.                |
| B      | Independent `Reservation` object associated with Creator, Offering, Customer, Availability Slot and, once confirmed, Order. | Holds a durable allocation history; can own Hold/expiry/confirmation/cancellation/reschedule facts and correlation.                | Recommended candidate.          |
| C      | Availability + Order alone express Reservation.                                                                             | No durable representation for a temporary Hold, expiry, allocation conflict or pre-Order cancellation; Order is created too early. | Not recommended.                |

### 5.2 Recommended Candidate

**Option B — independent `Reservation` object** is recommended for approval. It is not a
photographer-specific object: its purpose is to represent the generic commercial allocation of a
scarce creator-controlled slot.

Candidate relationships:

```text
Creator
└─ Offering
   └─ Availability Slot
      └─ Reservation
         ├─ Customer
         └─ Order (only after Reservation Confirmed)
```

Candidate ownership and audit requirements:

- A Reservation has one creator, offering, customer and slot reference.
- A Hold has an explicit `expiresAt` and correlation/idempotency boundary.
- A Confirmation consumes capacity exactly once.
- Cancellation, expiry, reschedule and conflict are recorded as facts; they do not overwrite history.
- An Order remains an independent commercial and monetary fact; a Reservation must not contain
  Payment, Ledger or Wallet balances.

**Founder decision required:** approve or reject the introduction of generic `Reservation` as a new
core Commerce Object. It must not be introduced as `PhotographerReservation`.

## 6. Availability and Slot Semantics

Existing Availability is adequate for creator-facing descriptive availability but is not yet proven
to safely express atomic scarce-time allocation. A Reservation build candidate requires the following
minimal, generic Slot semantics:

| Semantic           | Minimum candidate meaning                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Start / end        | Bounded slot window in a declared time zone.                                                          |
| Capacity           | Start with capacity `1`; multi-capacity/group booking is out of scope.                                |
| Available          | The slot can accept a Hold.                                                                           |
| Held               | Capacity is temporarily allocated to one Reservation until `expiresAt`.                               |
| Reserved           | Capacity is committed by a confirmed Reservation.                                                     |
| Blocked            | The creator removes the slot from new allocation; an existing Reservation is not silently rewritten.  |
| Remaining capacity | Derived from capacity, active Hold and confirmed Reservation facts; not manually edited as a balance. |

The following are explicitly not required:

- generic Calendar, EventCalendar or TourSchedule objects;
- Google Calendar replacement or synchronization;
- staff, equipment, room or studio resource planning;
- recurring rule engine, team scheduling or multi-location optimization.

**Architecture decision required:** determine whether this minimal Slot capability belongs in the
existing generic Availability abstraction or needs a separate generic `AvailabilitySlot` object.
The answer cannot be implemented through vertical-specific photographer fields.

## 7. Candidate State Separation

Reservation Commerce must not place all commercial and monetary states in one aggregate. The
candidate separation is:

| Lifecycle         | Candidate states / facts                                             | Does not own                            |
| ----------------- | -------------------------------------------------------------------- | --------------------------------------- |
| Availability Slot | Available, Held, Reserved, Blocked; derived remaining capacity       | Payment, fulfillment, earnings          |
| Reservation       | Held, Confirmed, Expired, Cancelled, Rescheduled                     | Money balances, settlement              |
| Order             | Created/confirmed/cancelled according to the existing Order contract | Slot capacity or payment provider state |
| Payment           | Pending, Confirmed, Failed, Refunded                                 | Reservation allocation or fulfillment   |
| Fulfillment       | Session Completed candidate                                          | Payment confirmation, Wallet balance    |
| Settlement        | Pending, Released, Failed, Resolved, Reversed                        | Slot allocation or creator availability |

Candidate normal path:

```text
Slot Available
→ Reservation Held
→ Reservation Confirmed
→ existing Order created
→ Payment Confirmed
→ Session Completed
→ Settlement Released
→ Earnings Available
```

Candidate exception paths:

```text
Reservation Held        → Reservation Expired       → Slot Available
Reservation Confirmed   → Reservation Cancelled     → Order / Payment consequences by approved policy
Reservation Confirmed   → Reservation Rescheduled   → atomic release/reallocate policy required
Payment Confirmed       → Payment Refunded          → existing Refund / Recovery lifecycle
Slot                    → Blocked                   → no new Hold; existing confirmed facts remain auditable
```

No state in this table is frozen for implementation until Founder approves `DEV-024`.

## 8. Payment Timing Comparison

| Model                  | Timing                                                        | Benefits                                                                           | Risks / required policy                                                                                                                                        | Recommendation            |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Pay on Reservation     | Customer pays when the slot is held or instant-reserved.      | Strongest customer commitment.                                                     | Payment during a temporary Hold creates expiry/refund complexity; immediate charges amplify cancellation, recovery and operational exceptions.                 | Do not use for v1.        |
| Pay after Confirmation | Customer pays after Reservation Confirmed and Order creation. | Clear fact boundary: no Payment for a Hold; reuses one full existing Payment path. | Requires payment-expiry policy after confirmation if customer never pays.                                                                                      | Recommended v1 candidate. |
| Deposit                | Customer pays a deposit, then a later balance.                | Can reduce no-show exposure.                                                       | Requires split payment, deposit refund/forfeit, balance collection, settlement allocation and recovery policy. Current Money contract does not authorize this. | Explicitly out of scope.  |

**Recommended candidate:** one full Payment after Reservation Confirmed. This preserves the current
single-Payment Money model and avoids creating a deposit/remaining-balance financial product.

**Founder decision required:** confirm whether payment is required after confirmation, and approve the
customer payment-expiry/cancellation policy before Build.

## 9. Fulfillment and Settlement Trigger Preparation

### 9.1 Fulfillment Options

| Option | Definition                                  | Product and Money implications                                                                        |
| ------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A      | `Session Completed`                         | Minimal v1. The creator records that the scheduled session occurred. No delivery platform is implied. |
| B      | `Session Completed + Deliverables Provided` | Introduces post-session photo delivery evidence and risks a gallery/file-delivery product.            |
| C      | `Session Completed + Customer Acceptance`   | Adds acceptance timeout/dispute policy and can hold Earnings beyond the actual service session.       |

**Recommended candidate:** Option A — `Session Completed`.

Portrait file delivery may happen later, but v1 must not make file hosting, review workflow or customer
acceptance a prerequisite for the first Reservation Pattern. A future approved product decision can
consider delivery/acceptance only with an explicit content/deliverables contract.

### 9.2 Settlement Trigger Candidate

The candidate Settlement release condition is:

```text
Payment Confirmed
+ Session Completed
+ no active Cancellation / Refund / Settlement Resolution
→ Settlement eligible for release
```

This is compatible with the existing Reservation candidate in the Commerce Pattern Settlement and
Wallet Model: attendance/experience completion. It does not authorize a direct Payment-to-Wallet
credit, a new Settlement state, or an automatic earnings exception.

**Founder decision required:** approve `Session Completed` as the v1 fulfillment and Settlement
trigger, including the future evidence standard for a creator-recorded completion fact.

## 10. Cancellation, Reschedule, Expiry and No-show

The following is a policy impact matrix, not an approved cancellation policy:

| Scenario                                           | Reservation impact                                                                                  | Order impact                                                           | Payment / Refund impact                                                          | Settlement / Recovery impact                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Customer cancels before confirmation               | Held Reservation may be cancelled/released.                                                         | No Order.                                                              | No Payment or Refund.                                                            | No Settlement, Ledger or Recovery.                                                               |
| Customer cancels after confirmation before payment | Confirmed Reservation cancelled; slot release policy required.                                      | Existing Order cancellation path candidate.                            | No Payment if unpaid.                                                            | No Settlement or Earnings.                                                                       |
| Customer cancels after payment before session      | Reservation/Order cancellation recorded.                                                            | Existing cancellation fact must remain traceable.                      | Refund eligibility depends on Founder-approved policy.                           | If not settled, no Available Earnings; if settled, existing DEC-013-B reversal/Recovery applies. |
| Creator cancels before session                     | Reservation cancelled and slot removed/released according to policy.                                | Existing Order cancellation fact candidate.                            | Paid customer requires an approved refund path.                                  | Same no-silent-money rule; no earnings release before resolution.                                |
| Reschedule before payment                          | Existing confirmed Reservation is not overwritten; release/reallocate must be atomic and auditable. | Order may be retained or replaced only under an approved generic rule. | No Payment change if unpaid.                                                     | No Settlement impact.                                                                            |
| Reschedule after payment                           | Original Reservation and new allocation need immutable linkage.                                     | Order treatment requires explicit policy.                              | No new charge without a new approved commercial fact; refund only if applicable. | Settlement must remain blocked until final fulfillment/resolution.                               |
| Hold expiry                                        | Reservation expires; capacity returns.                                                              | No Order.                                                              | No Payment, Refund, Settlement or Ledger.                                        | No Money impact.                                                                                 |
| Customer no-show                                   | Reservation remains historically confirmed; fulfillment is not automatically successful.            | Order remains factual.                                                 | Refund/forfeit rule required.                                                    | Earnings release must follow approved fulfillment/no-show policy; do not silently settle.        |
| Creator no-show                                    | Reservation and Order retain facts; non-fulfillment recorded.                                       | Order must not appear completed.                                       | Paid customer refund/remedy requires policy.                                     | Available Earnings must not be created; existing Refund/Recovery model applies if necessary.     |

**Founder decisions required:** cancellation window, creator-cancel remedy, reschedule behavior,
no-show treatment, and whether a post-confirmation unpaid Reservation expires automatically.

## 11. Core Reuse and Money Interaction Audit

| Core Capability  | Reuse                         | Change Required                                                           | Pattern-specific Addition                                                       |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Creator Identity | Reuse existing                | No                                                                        | Photographer is a capability/presentation expression, not a new identity model. |
| Offering         | Reuse existing                | Possible structured session-duration/price expression only after approval | Portrait session offering expression.                                           |
| Availability     | Reuse concept                 | Yes, only if generic bounded Slot/atomic allocation semantics are absent  | Slot availability, hold expiry, capacity one.                                   |
| Reservation      | Not currently implemented     | Yes, Founder approval for generic object/state boundary                   | Generic Reservation lifecycle, not photographer-specific.                       |
| Order            | Reuse existing                | No expected change for recommended model                                  | Created only after Reservation Confirmed.                                       |
| Payment          | Reuse existing                | No expected change                                                        | One full Payment after confirmation; no deposit.                                |
| Fulfillment      | Reuse existing fact lifecycle | Possible generic fulfillment label/evidence mapping after approval        | `Session Completed` expression.                                                 |
| Settlement       | Reuse existing                | No expected Money-core change                                             | Eligibility trigger uses session completion.                                    |
| Earnings Ledger  | Reuse existing                | No                                                                        | Existing immutable fact-derived entries.                                        |
| Wallet           | Reuse existing projection     | No                                                                        | No Reservation balance or negative Wallet.                                      |
| Withdrawal       | Reuse existing                | No                                                                        | Only Available Earnings can enter existing Withdrawal flow.                     |
| Operations       | Reuse existing                | Possible generic Reservation fact visibility after approval               | View/reconcile facts; no manual balance edit.                                   |

### 11.1 Required Money Interaction

For the recommended candidate:

```text
Reservation Hold             → no Money fact
Reservation Confirmed        → existing Order fact
Payment Confirmed            → existing Payment fact; Earnings remain pending
Session Completed            → existing fulfillment fact
Settlement Released          → existing Ledger credit / Wallet projection
Cancellation / Refund        → existing Refund / reversal / Recovery facts when applicable
```

No Money Domain Core change is expected **only if** all of the following remain true:

- exactly one full payment is used;
- no deposit, late balance, penalty, or forfeiture rule is introduced;
- settlement is released only after the approved fulfillment trigger;
- Refund and Recovery continue to use DEC-013-A/B semantics.

If an approved Reservation policy requires deposits, cancellation fees, no-show forfeiture, split
payments, partial credits, or a new settlement release rule, this becomes a **Core Architecture
Decision Required** and must not be implemented as Reservation-specific Money code.

## 12. Architecture Leverage Audit

| Core area   | Expected effect                                                             | Architecture assessment                                     |
| ----------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Order       | Reused after Reservation Confirmed.                                         | No Order redesign expected.                                 |
| Payment     | One full Payment is reused after an Order exists.                           | No Payment redesign expected.                               |
| Settlement  | Uses an approved `Session Completed` trigger.                               | Existing Settlement state model remains authoritative.      |
| Wallet      | Continues to project immutable Ledger facts.                                | No Wallet model change permitted.                           |
| Operations  | Needs generic fact-chain visibility when Reservation is later implemented.  | Must not become photographer office management.             |
| Concurrency | Requires atomic Hold/confirm/release behavior and idempotent expiry/replay. | Primary technical risk; cannot be solved by UI-only checks. |

The Architecture Leverage goal is high: this slice would demonstrate a distinct Commerce Pattern
while retaining the existing commercial and money infrastructure. The principal risk is generic
scarce-time allocation, not photography semantics.

If Slot allocation, expiry, replay, cancellation or reschedule cannot be represented generically
without leaking vertical rules into Core, stop Build and raise **Core Architecture Decision Required**.

## 13. Verticalization Guard

This Reservation slice must prove creator-controlled booking, not build a photography vertical SaaS.
The following remain out of scope:

- photographer studio CRM, customer database, sales pipeline or messaging workspace;
- equipment, room, venue, assistant or team management;
- editing, retouching, gallery, proofing, file-delivery or licensing platform;
- package bundles, subscriptions, dynamic pricing or complex deposits;
- Ticket Commerce, event admission, Marketplace or discovery;
- generic Calendar product, recurring booking engine or external calendar synchronization;
- multi-currency, multi-provider, insurance, credit or loan functionality.

Verticalization Risk is **Medium**. Photography naturally pulls toward client CRM, post-production
and gallery tooling; scope remains safe only while the product stops at a creator-controlled session
allocation, a single Order and the existing fulfillment/money chain.

## 14. Acceptance Candidates

These are specification candidates for a future approved Build. They are not implemented acceptance
tests and do not assert present product behavior.

| ID      | Actor                       | Object                          | Candidate state / result                                              | Candidate canonical event                                                            | Money impact                                                           |
| ------- | --------------------------- | ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| RES-D01 | Customer                    | Availability Slot               | Publicly visible Available Slot is viewed.                            | No new fact required for read.                                                       | None.                                                                  |
| RES-D02 | Customer                    | Availability Slot / Reservation | Customer selects an eligible slot.                                    | `reservation_hold_requested` candidate, only if a durable command fact is needed.    | None.                                                                  |
| RES-D03 | System                      | Reservation                     | Atomic Hold exists with expiry.                                       | `reservation_held` candidate.                                                        | None.                                                                  |
| RES-D04 | Creator or approved policy  | Reservation                     | Reservation becomes Confirmed; only then may an Order be created.     | `reservation_confirmed` candidate.                                                   | No direct credit; enables existing Order/Payment path.                 |
| RES-D05 | System / competing Customer | Availability Slot               | Same capacity cannot be confirmed twice; conflict is safely rejected. | No duplicate success event; conflict/rejection must be auditable.                    | None.                                                                  |
| RES-D06 | System                      | Reservation                     | Unconfirmed Hold expires and capacity returns.                        | `reservation_expired` candidate.                                                     | None.                                                                  |
| RES-D07 | Customer / Creator          | Reservation                     | Cancellation is recorded without overwriting prior facts.             | `reservation_cancelled` candidate.                                                   | Depends on Payment; existing Refund/Recovery only if paid.             |
| RES-D08 | Customer / Creator          | Reservation / Slot              | Reschedule atomically links old and new allocation.                   | `reservation_rescheduled` candidate.                                                 | No automatic new charge; settlement remains policy-bound.              |
| RES-D09 | Customer / Provider         | Order / Payment                 | Confirmed Reservation enters the existing Payment flow.               | Reuse existing Payment facts.                                                        | Payment pending/confirmed/failed/refunded only through existing model. |
| RES-D10 | Creator                     | Fulfillment                     | Session Completed is recorded.                                        | Reuse existing fulfillment-completed fact, with an approved generic label if needed. | Earnings remain pending until Settlement.                              |
| RES-D11 | System / Provider           | Settlement                      | Eligible completed session reaches existing Settlement lifecycle.     | Reuse existing Settlement facts.                                                     | One immutable Ledger credit only after Settlement release.             |
| RES-D12 | Creator / Operations        | Ledger / Wallet                 | Earnings and Wallet reconstruct from existing Ledger.                 | Reuse Ledger/Wallet projection facts.                                                | No direct balance mutation.                                            |
| RES-D13 | Creator / Provider          | Withdrawal                      | Available Earnings use the existing Withdrawal lifecycle.             | Reuse existing Withdrawal facts.                                                     | Immutable Withdrawal; retry/recovery follows existing model.           |

The following event names are **candidate canonical events only** and must not be created before
approval and an event-inventory review:

```text
availability_slot_opened
availability_slot_blocked
reservation_held
reservation_expired
reservation_confirmed
reservation_cancelled
reservation_rescheduled
```

Existing Payment, Fulfillment, Settlement, Ledger, Wallet, Refund, Recovery and Withdrawal events
must be reused. No duplicate event may be created merely to add a Reservation label.

## 15. Founder Decisions Required

Founder / Controller must explicitly decide:

1. **Lifecycle model** — approve Model A Hold then Confirm, select another model, or request a revised
   comparison.
2. **Reservation object** — approve a generic independent Reservation object, or reject it.
3. **Availability boundary** — approve the minimum generic Slot/Hold/Capacity semantics and whether
   they extend existing Availability or require a generic AvailabilitySlot object.
4. **Confirmation actor** — define whether confirmation is creator-only or can be an explicitly
   approved system policy; instant confirmation is not assumed.
5. **Payment timing** — approve one full Payment after Reservation Confirmed and reject deposits for
   v1, or provide a separately approved Money-model decision.
6. **Fulfillment and settlement** — approve `Session Completed` as the v1 candidate trigger, or
   define a different evidence/acceptance policy.
7. **Cancellation, reschedule and no-show** — freeze refund eligibility, slot release, unpaid expiry
   and exception handling before any build.
8. **Canonical event inventory** — approve only non-duplicative Reservation/Slot fact events after
   comparison with the existing canonical event set.

## 16. Final Decision Preparation Output

| Required output               | Decision-preparation result                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recommended Reservation Model | Model A — Hold then Confirm; one full Payment after Reservation Confirmed.                                                                                            |
| Required New Objects          | Recommended candidate: generic `Reservation`; generic `AvailabilitySlot` only if existing Availability cannot safely own bounded atomic slots.                        |
| Required New States           | Candidate Slot: Available/Held/Reserved/Blocked; candidate Reservation: Held/Confirmed/Expired/Cancelled/Rescheduled.                                                 |
| Required New Canonical Events | Candidate Slot/Reservation facts only; reuse existing Payment, Fulfillment, Settlement, Ledger, Wallet and Withdrawal facts.                                          |
| Required Money Interaction    | No new Money model for the recommended single-payment/session-complete path; existing Settlement, Refund, Recovery, Ledger and Wallet semantics remain authoritative. |
| Reused Core Components        | Creator Identity, Offering, Order, Payment, Fulfillment, Settlement, Earnings Ledger, Wallet, Withdrawal and Operations.                                              |
| Architecture Risks            | Atomic allocation, expiry, idempotency, replay, reschedule linkage, and generic Availability boundary.                                                                |
| Verticalization Risks         | Drift into studio CRM, calendar/scheduling, gallery/file delivery, room/staff management or deposits.                                                                 |
| Founder Decisions Required    | Lifecycle, generic object boundary, slot semantics, confirmation actor, payment timing, fulfillment/settlement trigger, cancellation/no-show, event inventory.        |

```text
VERTICAL-02L-02-DESIGN = HISTORICAL DECISION PREPARATION
DEV-024 = Superseded by Closed Build
BUILD AUTHORIZATION = See Section 17
REAL_MONEY_ENABLED = false
No Real Money Evidence
```

## 17. Build Execution Closure

Founder / Controller subsequently approved the Reservation Commerce build decisions:

| Decision               | Applied implementation                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pattern                | Reservation Commerce; no new Commerce Pattern was introduced.                                                                                               |
| Lifecycle              | `Available → Held → Confirmed → Order → Payment → Fulfillment → Settlement`.                                                                                |
| Order creation         | A Confirmed Reservation creates exactly one existing `PaidServiceOrder`; a Held Reservation never creates an Order.                                         |
| Payment                | One full Payment after confirmation through the existing Local Simulator only.                                                                              |
| Fulfillment            | `Session Completed` uses the existing Fulfillment use case.                                                                                                 |
| Settlement eligibility | Existing Money Domain requires confirmed Payment, fulfilled Order and no active resolution.                                                                 |
| Reservation            | Generic independent `Reservation`; generic bounded `AvailabilitySlot` supports capacity-one allocation.                                                     |
| Exceptions             | Cancel, expiry, reschedule and no-show remain independent Reservation/Fulfillment/Resolution facts; they do not create a Photographer-specific Money model. |

The implementation reuses the existing Creator Identity, Offering, Order, Payment, Fulfillment,
Settlement, Earnings Ledger, Wallet, Withdrawal and Operations capabilities. No
`PhotographerOrder`, `ReservationPayment`, `ReservationSettlement`, `PhotographerWallet`,
Calendar Object, Studio SaaS, Gallery, CRM, Ticketing or Provider-specific branch was added.

### 17.1 Architecture Reuse Audit

| Core Capability  | Reused | Modified                         | New Vertical Logic                  | Reason                                                                            |
| ---------------- | ------ | -------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| Creator Identity | Yes    | No                               | No                                  | Existing creator ownership and public identity.                                   |
| Offering         | Yes    | No                               | No                                  | Existing Offering remains the commercial source.                                  |
| Availability     | Yes    | Minimal generic slot persistence | Yes, generic Reservation allocation | Capacity-one time-bound slots are pattern infrastructure, not photographer logic. |
| Reservation      | No     | New generic object               | Yes                                 | Holds, confirmation, expiry, cancellation and reschedule facts.                   |
| Order            | Yes    | Generic source discriminator     | No                                  | Existing Order Snapshot and one-order invariant.                                  |
| Payment          | Yes    | No                               | No                                  | Existing Local Simulator and Payment lifecycle.                                   |
| Fulfillment      | Yes    | No                               | No                                  | Existing `Session Completed` Fulfillment use case.                                |
| Settlement       | Yes    | No                               | No                                  | Existing Payment + Fulfillment eligibility and settlement flow.                   |
| Ledger           | Yes    | No                               | No                                  | Existing immutable Earnings Ledger.                                               |
| Wallet           | Yes    | No                               | No                                  | Existing Ledger Projection only.                                                  |
| Withdrawal       | Yes    | No                               | No                                  | Existing immutable Withdrawal lifecycle.                                          |
| Operations       | Yes    | No                               | No                                  | Existing operations/reconciliation surface; no photographer-specific version.     |

### 17.2 Implementation Evidence

- Domain, application and persistence tests cover Hold TTL, expiry, confirmation idempotency,
  replay conflict, cancellation, reschedule, no-show and capacity-one concurrency.
- API integration covers Hold → Confirm → one Order → Local Simulation Payment → Fulfillment →
  Settlement → Wallet, including rejection of early Settlement.
- Browser acceptance covers `RES-01` through `RES-15`; `RES-16` is covered by the existing
  VS-01, VS-02F, VS-02H and cross-vertical browser regression suites.
- PostgreSQL migration `0014_vs02l02_reservation_commerce.sql` defines slot validity, capacity-one,
  active Reservation uniqueness, one Reservation Order and single Order source constraints.
- Cancellation records the Reservation fact and does not directly mutate Payment, Ledger or Wallet.
  Any paid cancellation remains subject to the existing Refund / Recovery fact pipeline.
- Reschedule atomically releases the prior Reservation allocation and acquires the new generic Slot
  while retaining the same Reservation and Order relationship.

```text
VERTICAL-02L-02 — Photographer Session Reservation = COMPLETE
DEV-024 = Closed — Founder Approved Build Applied
BUILD AUTHORIZATION = GRANTED
REAL_MONEY_ENABLED = false
No Real Money Evidence
Contract Commerce = Not Started
```
