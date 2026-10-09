# 24 — Private Product Surface Decision Package

> **状态**：`READY_FOR_FOUNDER_DECISION`
> **决策包编号**：`PCI-STAGE2-NEXT-SURFACE-001`
> **日期**：2026-08-27
> **权威**：Main Control / Founder
> **性质**：Stage 2 Runtime Foundation Closure / Next-Surface Decision Preparation
> **实现授权**：`PRIVATE_PRODUCT_SURFACE = NOT AUTHORIZED`
> **Public Product Surface**：`NOT AUTHORIZED`

## 1. Purpose and Non-Authorization Boundary

This package records the decision boundary that follows completion of the Stage 2 Identity Runtime
Foundation. It is a Founder decision package only. It does not authorize implementation, API
publication, UI work, authentication binding, public distribution, or any external-platform
integration.

The completed foundation is:

```text
Internal Identity
+ Commerce Profile
+ Commerce Reference
+ External Platform Account
+ Commerce Relationship
        ↓
Durable PostgreSQL
        ↓
Private Application Runtime
        ↓
Real PostgreSQL Integration Verified
```

```text
PCI-STAGE2-RUNTIME-CLOSURE-001 = COMPLETE
STAGE_2_RUNTIME_FOUNDATION = COMPLETE

RUNTIME-007 = COMPLETE
POSTGRES_APPLICATION_INTEGRATION = VERIFIED
```

Completion of the private runtime is not authorization for a product surface:

```text
Public API = NOT AUTHORIZED
Public Resolver = NOT AUTHORIZED
QR Runtime = NOT AUTHORIZED
OAuth = NOT AUTHORIZED
External Platform Binding Runtime = NOT AUTHORIZED
Verification Runtime = NOT AUTHORIZED
Event / Outbox = NOT AUTHORIZED
Real Money = NOT AUTHORIZED
```

## 2. Confirmed Foundation Boundary

The canonical graph remains:

```text
Authentication Account
        ≠
Internal Identity
        │
        └── 1:N
            Commerce Profile
                │
                ├── 0..1 Commerce Reference
                │
                └── 0..N Commerce Relationships
                          ▲
                          │
                    External Platform Account
```

```text
Commerce Relationship
= External Platform Account ↔ Commerce Profile historical binding
```

An External Platform Account is not itself an Internal Identity or a Commerce Profile. A direct
`Account → Profile` shortcut is not the canonical relationship model.

The following Stage 2 foundation evidence is complete:

| Layer | Status |
| --- | --- |
| Domain Contracts | COMPLETE |
| Durable Persistence | COMPLETE |
| Repository Ports | COMPLETE |
| PostgreSQL Adapters | COMPLETE |
| Private Application Runtime | COMPLETE |
| Real PostgreSQL Integration | VERIFIED |

## 3. Surface Boundary

The next Founder decision must distinguish two different categories:

| Surface category | Meaning | Current status |
| --- | --- | --- |
| Private authenticated user surface | A controlled surface for an authenticated subject to invoke approved private use cases. | NOT AUTHORIZED |
| Public anonymous surface | A publicly reachable API, resolver, URL, QR flow, or anonymous lookup surface. | NOT AUTHORIZED |

An authenticated user viewing an approved fact that they are authorized to access would still be a
private product-surface capability. It does not authorize anonymous lookup, `/c/{commerce_reference}`,
or any public resolver.

## 4. Candidate Private Product Surfaces

The recommended decision order is intentionally narrow and sequential. Each candidate requires a
separate Founder approval before implementation.

| Surface | Candidate capability, not implementation | Authentication dependency | Authorization dependency | API dependency | UI dependency | Security impact | Founder decision required |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | Authenticated Internal Identity surface: read the Internal Identity associated with the authenticated account. | A real authentication subject is required. | Account-to-Identity ownership must be resolved. | An internal transport contract may be needed only after authorization. | Optional private UI; no public page. | Prevent account-to-identity confusion and cross-identity disclosure. | `ACCOUNT-IDENTITY-BINDING` plus Surface A authorization. |
| B | Commerce Profile management: list, read, create, and approved lifecycle operations for owned Profiles. | Requires approved Surface A identity context. | Owner-only authorization and lifecycle policy are required. | Private API decision required; no public endpoint is implied. | Optional authenticated management UI. | Prevent owner transfer, cross-owner writes, and lifecycle escalation. | Surface B scope and operation list. |
| C | Commerce Reference viewing and supplied-reference assignment for an authorized Profile. | Requires approved Surface B identity/profile context. | Owner-only authorization; supplied reference remains validated by domain and persistence. | Private API decision required; no resolver endpoint. | Optional authenticated management UI. | Reference is public-identifying but not a credential; no enumeration or public lookup authorization follows. | Surface C scope, input governance, and audit needs. |
| D | External Platform Account management: register, read, list, and approved lifecycle operations. | Requires approved private account/identity context. | Explicit authorization policy is required; identity proof is not implied. | Private API decision required; no provider API. | Optional authenticated management UI. | Prevent namespace collision abuse and any implication of verified platform ownership. | Surface D scope and ownership policy. |
| E | Commerce Relationship management: create, list, lifecycle changes, and approved historical replacement. | Requires approved Profile and Account management contexts. | Authorization must cover both participating durable facts. | Private API decision required; no external binding runtime. | Optional authenticated management UI. | Preserve historical facts, target immutability, and maximum-one-active-account invariant. | Surface E scope, relationship authorization, and replacement policy. |

The order does not authorize bundling these capabilities. In particular:

```text
Create Profile
≠ automatic Commerce Reference generation or assignment

Create External Platform Account
≠ verified binding
≠ OAuth login
≠ external platform ownership proof
```

## 5. Account–Identity Authentication Boundary

`Authentication Account` and `Internal Identity` remain different objects. The runtime foundation
does not make a login account a canonical Identity and does not automatically attach a logged-in
account to an Identity.

Any future authenticated private surface therefore requires a separate Founder decision:

```text
ACCOUNT-IDENTITY-BINDING = REQUIRED_FUTURE_DECISION
```

That decision must define at least:

```text
binding authority
membership lifecycle
owner authorization semantics
account recovery and revocation behavior
audit / error disclosure policy
```

It must not be silently introduced as part of a Profile, Reference, Account, or Relationship
surface.

## 6. Explicit Non-Authorization

This decision package does not authorize:

```text
Public API / OpenAPI
Public Resolver
/c/{commerce_reference}
Anonymous Commerce Reference lookup
QR Runtime / Scanner
OAuth
External Platform API
Automatic account discovery
External Platform verification
External Platform runtime binding
Event Bus / Outbox
Payment / Settlement / Refund
Marketplace / CRM
Real Money
VS-01 migration or backfill
```

`Commerce Reference` remains a public identifier, not an authentication credential or an
authorization grant. Generation, allocation, resolver behavior, QR runtime, and enumeration
mitigation are outside this package.

## 7. Founder Decisions Required Before Implementation

Founder review must approve, modify, or reject each item independently:

```text
NEXT-SURFACE-DECISION-001 = Private authenticated user-surface entry
NEXT-SURFACE-DECISION-002 = ACCOUNT-IDENTITY-BINDING
NEXT-SURFACE-DECISION-003 = Surface A: Internal Identity
NEXT-SURFACE-DECISION-004 = Surface B: Commerce Profile
NEXT-SURFACE-DECISION-005 = Surface C: Commerce Reference
NEXT-SURFACE-DECISION-006 = Surface D: External Platform Account
NEXT-SURFACE-DECISION-007 = Surface E: Commerce Relationship
NEXT-SURFACE-DECISION-008 = Private transport/API boundary, if any
NEXT-SURFACE-DECISION-009 = Private UI boundary, if any
```

No implementation may start from this package until the relevant decision is explicitly approved
and recorded as its own scoped change unit.

## 8. Preserved Compatibility and Runtime Constraints

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED

REQUEST = UNCHANGED
RESERVATION = UNCHANGED
CONTRACT = UNCHANGED
```

The private runtime continues to use synchronous repository and transaction abstractions. Event and
outbox infrastructure are not a prerequisite for the candidate surfaces described here.
