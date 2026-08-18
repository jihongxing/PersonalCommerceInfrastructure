# 58 — CLIENT-002 Commerce Golden Path Closure

> **Status**: Complete
> **Change Unit**: `CLIENT-002`
> **Previous Baseline**: `CLIENT-001 = COMPLETE`
> **Real Money**: `REAL_MONEY_ENABLED = false`
> **Real Money Evidence**: None
> **App**: `apps/app = DEFERRED`

## 1. Audit Conclusion

The Web Client now has one shared Golden Path boundary:

```text
Customer Intent
→ Customer Commerce Action
→ Request / Reservation / Contract
→ Creator Commerce Desk
→ Creator Execution
→ Completion
→ Earnings Projection
→ Wallet Projection
```

The three Patterns keep independent commitment lifecycles. After an Order exists, all three use the
same provider-neutral Payment, Fulfillment, Settlement, Ledger and Wallet infrastructure. No second
Earnings or Wallet accounting model is introduced.

## 2. Commerce Golden Path Matrix

| Pattern     | Customer Entry                                                   | Domain Object                   | Creator Action                                                     | Completion                                            | Earnings                                        | Wallet                               |
| ----------- | ---------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------- | ------------------------------------ |
| Request     | Public Offering → `POST /public/offerings/{offeringId}/requests` | `CommerceAction` / Request      | Creator Confirm / Decline → existing Order                         | `POST /creator/paid-orders/{orderId}/fulfillment`     | Settlement release produces shared Ledger entry | Wallet projection from shared Ledger |
| Reservation | Public Offering → Availability Slot → Reservation Hold           | `Reservation` → Confirmed Order | Confirm / Cancel / Reschedule / Session Completed                  | Shared Fulfillment use case with session evidence     | Settlement release produces shared Ledger entry | Wallet projection from shared Ledger |
| Contract    | Request → Creator Quote / Scope → Buyer Accept                   | `Contract` → Contracted Order   | Creator Quote / Scope; Buyer Accept; shared Fulfillment completion | Shared Fulfillment use case with performance evidence | Settlement release produces shared Ledger entry | Wallet projection from shared Ledger |

Every matrix cell maps to an existing route/action, application use case, domain state, canonical
event, UI state and acceptance boundary. No cell is documented as complete solely because a page
renders.

## 3. Completion Semantics

| Question                     | Answer                                                                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What constitutes completion? | Existing Order Fulfillment becomes `fulfilled` after a valid Creator evidence reference                                                                                                  |
| Who causes completion?       | Creator through the authenticated `recordPaidServiceFulfillment` use case                                                                                                                |
| What event is emitted?       | `fulfillment_recorded` with Actor, Order ID, evidence reference and correlation ID                                                                                                       |
| What becomes immutable?      | Fulfillment fact and the Order's fulfilled transition; replay cannot create a second completion fact                                                                                     |
| What changes downstream?     | Settlement becomes eligible only when Payment is confirmed, Fulfillment is fulfilled and no active Resolution exists; released settlement appends Ledger, then Wallet projection changes |

Reservation-specific `Session Completed` and Contract-specific `Performance Completed` are UI/content
labels for the same shared Fulfillment capability. Request uses the same capability for the confirmed
service. No Pattern-specific completion state machine exists.

## 4. Customer Action Router Boundary

The Customer Action Router is a presentation and entry-point concern only:

```text
intent / Offering metadata
→ Request | Reserve | Quote / Accept
→ existing Pattern route
```

It does not calculate price, enforce Request/Reservation/Contract rules, create Order facts, calculate
Earnings or project Wallet balances. Those responsibilities remain in existing application use cases
and Domain rules.

## 5. Creator Commerce Desk Boundary

The Creator Desk exposes the existing Pattern workspaces and shared Order/Earnings/Wallet workspace.
The lifecycle views are derived from domain facts:

| Derived view | Source                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Needs Action | Request submitted, Reservation held, Contract proposed                                           |
| In Progress  | Reservation confirmed, Contracted Order awaiting Payment/Fulfillment, Order payment pending/paid |
| Completed    | Fulfillment recorded, Settlement released, Wallet projection available                           |

This is a view grouping, not a new Dashboard domain or merged state machine. A Pattern-specific
object remains visible in its own workspace and its downstream Order remains visible in the shared
Earnings workspace.

## 6. Event and Projection Boundary

Pattern events describe commitment facts:

```text
commerce_action_submitted / commerce_confirmed / commerce_declined
reservation_held / reservation_confirmed / reservation_expired / ...
contract_proposed / contract_accepted / contract_formed / ...
```

Shared commercial and earnings facts describe the downstream lifecycle:

```text
order_created
payment_confirmed
fulfillment_recorded
settlement_released
ledger_entry_appended
wallet_availability_changed
```

Completion does not directly edit Earnings or Wallet. The event and existing settlement/ledger
pipeline drive the projection.

## 7. Duplicate Completion / Idempotency

The same Order cannot produce duplicate completion accounting:

- a second fulfillment attempt is rejected by the existing Order/Fulfillment transition boundary;
- the first `fulfillment_recorded` fact remains the only completion fact;
- Settlement and Ledger idempotency remain protected by existing correlation/idempotency rules;
- Wallet is projected from Ledger, not incremented by the client;
- the Creator UI continues to show one Order and one completion state.

The acceptance suite includes a duplicate completion assertion on the Request Golden Path and verifies
that the shared Wallet projection does not gain a second credit.

## 8. Golden Path Acceptance Coverage

| Acceptance                  | Route / Action                                                                  | Domain / Event                                                       | UI evidence                                                                          | Result |
| --------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| Golden Path A — Request     | Public Request → Creator Confirm → Paid Order → Fulfillment                     | Commerce Action → Order → `fulfillment_recorded` → Settlement/Ledger | Creator actionable Request, Order `fulfilled`, Earnings `available`, Wallet increase | PASS   |
| Golden Path B — Reservation | Public Slot → Hold → Creator Confirm → Session Completed                        | Reservation → Order → `fulfillment_recorded` → Settlement/Ledger     | Creator actionable Reservation, completion, Earnings/Wallet projection               | PASS   |
| Golden Path C — Contract    | Request → Quote/Scope → Buyer Accept → Contracted Order → Performance Completed | Contract → Order → `fulfillment_recorded` → Settlement/Ledger        | Creator Contract state, shared Order completion and projection                       | PASS   |
| Duplicate Completion        | Repeat Fulfillment on same Order                                                | Existing transition/idempotency boundary                             | One completion and one Wallet credit                                                 | PASS   |

## 9. Architecture Decisions / Follow-ups

No Founder Decision is required for the current Golden Path closure.

| Decision ID | Question                     | Current state                               | Recommended decision  | Why                                                           |
| ----------- | ---------------------------- | ------------------------------------------- | --------------------- | ------------------------------------------------------------- |
| None        | No unresolved Core gap found | Shared lifecycle and projections are intact | No follow-up decision | All three Patterns use the existing Core and Money boundaries |

## 10. Scope Guard

This change unit does not create `apps/app`, a fourth Vertical, a new Commerce Pattern, a second
Request/Reservation/Contract lifecycle, a second Earnings/Wallet model, real Payment, real
Settlement, real Withdrawal, Provider integration, CRM, Marketplace or Calendar.

```text
CLIENT-001 = COMPLETE
CLIENT-002 = COMPLETE
apps/app = DEFERRED
REAL_MONEY_ENABLED = false
No Real Money Evidence
```
