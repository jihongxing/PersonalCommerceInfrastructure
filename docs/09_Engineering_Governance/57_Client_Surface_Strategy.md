# 57 — Client Surface Strategy

> **Status**: Founder Approved — Web Convergence / App Deferred
> **Decision Date**: 2026-08-18
> **Change Unit**: `CLIENT-001`
> **Real Money**: `REAL_MONEY_ENABLED = false`

## 1. Product Surface Decision

The current client direction is Web-first. The Web Reference Client is being converged from a
single Dancer-focused slice into a Pattern-first Commerce Client over the existing Request,
Reservation and Contract APIs.

```text
Creator Commerce Identity
        ↓
Offering
        ↓
Pattern-specific Action
        ↓
Request / Reservation / Contract
        ↓
Existing Order / Money / Fulfillment / Earnings / Wallet
```

This is a client-surface convergence decision. It does not add a Commerce Pattern, Vertical,
Product Object, API, Money capability or Provider integration.

## 2. Surface Roles

| Surface | Product role | Current decision |
| --- | --- | --- |
| Web | Primary Pattern-first Creator Commerce Client | Continue and converge |
| Mobile Web | Independent touch-first experience of the same Web product | Validate as a first-class surface |
| `apps/app` | Future Personal Commerce Companion | Boundary only; implementation deferred |

The Web remains a replaceable Reference Client, but it now expresses the generic Core vocabulary:
Identity, Offering, Commerce Pattern, Order, Earnings and Wallet. Vertical content is supplied by
Offering metadata and Creator-authored copy.

## 3. Generic Pattern Surfaces

### 3.1 Request Commerce

The first Web target is a generic Request Commerce surface usable by Dancers, Cosplayers and future
Request Commerce Creators:

```text
Identity → Offering → Publish → Share → Request → Creator Confirm / Decline
```

The client must not contain `dancer-specific request components`, a Cosplayer request engine or a
vertical Request state machine. Appearance, service and other vertical expressions come from
Offering metadata/content.

### 3.2 Reservation Commerce

The Reservation surface is generic:

```text
Offering → Availability → Slot → Hold → Confirm → Order → Payment
```

Creator actions remain:

```text
Reservations → Confirm → Cancel → Reschedule → Fulfillment
```

The surface reuses the existing Reservation API and Domain. Photographer wording is content, not
client architecture. Hold, slot, order and payment states remain separate.

### 3.3 Contract Commerce

The Contract surface is generic:

```text
Request → Quote / Scope → Buyer Review → Accept / Reject → Contracted → Order
```

Creators create the Quote / Scope; Buyers review and accept or reject the immutable proposal. The Web
does not add Chat, CRM, Deal Pipeline or a Contract document editor.

## 4. Creator Commerce Desk

The Creator Desk converges into one navigable surface:

```text
Creator Commerce Desk
├── Identity
├── Offerings
├── Requests
├── Reservations
├── Contracts
├── Orders
├── Earnings
└── Wallet
```

The three Pattern lifecycles remain independently owned. The client navigation groups them for
discoverability; it does not merge Request, Reservation and Contract into one state machine.

Shared client components must be reused for Identity, Offering, Order, Payment, Fulfillment,
Earnings, Wallet and Operations. Pattern-specific components are limited to Request, Reservation and
Contract lifecycle actions.

## 5. Customer Surface and Pattern Router

The public Customer entry follows one mental model:

```text
Creator Commerce Identity
        ↓
Offering
        ↓
Request | Reserve | Accept Quote
        ↓
Pattern-specific Result
```

Customers may browse the public Identity and Offering without registering, under the existing product
rules. The action is determined by the Offering and its available Pattern flow; the client does not
invent a new Pattern from customer intent.

## 6. Mobile Web Contract

Mobile Web is not desktop CSS reduced in size. It must be validated independently for:

- touch targets and keyboard-safe form controls;
- Slot selection and Hold expiry visibility;
- Quote / Scope review and Accept / Reject;
- Request submission;
- Creator Confirm / Decline and Reservation decisions;
- Request, Reservation and Contract status;
- Earnings and Wallet readability.

The current implementation adds a Pattern-first navigation and action-router presentation while
preserving the existing API and state ownership. Browser acceptance remains the behavioral authority.

## 7. Client Reuse Policy

Web and future App must share:

- generated API Contract;
- Domain and Application Use Cases;
- Canonical Events;
- Money Domain;
- Auth semantics;
- permission and result-access semantics.

Neither surface may create a second business implementation. Web components may compose API
responses, but may not define Product state machines, Canonical Events, permission rules or Money
semantics.

## 8. Future `apps/app` Boundary

`apps/app` is defined as a future **Personal Commerce Companion**, not a second backend product.

Potential roles:

| Creator | Customer |
| --- | --- |
| Requests, Reservations, Contracts | Commerce Action |
| Notifications | Payment |
| Fulfillment | Result |
| Earnings, Wallet | — |

No `apps/app` directory, React Native, Flutter, Expo, native navigation, App API or App-specific
state is created by `CLIENT-001`.

## 9. App Build Start Conditions

App implementation is reconsidered only when at least these signals exist:

1. Real Creator Pilot has started;
2. Creators show stable Mobile Web behavior;
3. Notifications or Request response create a clearly high-frequency need;
4. Mobile Web has a structural performance or UX limitation;
5. App can provide material value beyond Mobile Web.

“We will need an App someday” is not a sufficient trigger.

## 10. Vertical UI Boundary

Vertical-specific UI may express Creator-authored Offering metadata, including Appearance,
availability description, service terms, Scope and other approved content. It may not create:

- Dancer-specific Request engines;
- Cosplayer-specific Request engines;
- Photographer-specific Reservation architecture;
- Dance Troupe / Singer-specific Contract architecture;
- vertical-specific Order, Payment, Settlement, Ledger or Wallet clients.

If a vertical request requires a new Pattern, API, Domain state or Money behavior, it enters
Controller Decision rather than being hidden in client code.

## 11. Definition of Done

- Generic Request, Reservation and Contract Web surfaces are represented through shared navigation
  and existing Pattern components;
- Creator Desk exposes Identity, Offering, Request, Reservation, Contract and Earnings/Wallet
  sections without merging lifecycle state;
- Customer Surface exposes a unified Pattern action concept;
- Mobile Web touch and layout boundaries are explicit and validated by existing browser checks;
- `apps/app` role and start conditions are frozen, with no implementation;
- no new Vertical, Pattern, API, Money behavior or real-money path is introduced.

```text
CLIENT-001 — Web Commerce Pattern Convergence = READY / COMPLETE
apps/app = DEFERRED BY DECISION
REAL_MONEY_ENABLED = false
No Real Money Evidence
```
