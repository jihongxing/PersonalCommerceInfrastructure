# 44 — VS-02H Commercial Pilot Operations Readiness

> **Status**: Completed
> **Decision Date**: 2026-08-17
> **Scope**: Minimum Operations capability for a future 5–10 Creator controlled pilot
> **Money Status**: Simulation Only / No Real Money Evidence
> **Provider Qualification**: External Parallel Track

## 1. Objective and Pilot Scope

VS-02H establishes the minimum protected Operations capability needed to inspect and safely operate
the existing Provider-neutral paid-commerce lifecycle. It supports Order, Payment, Settlement,
Earnings, Wallet, Withdrawal, Recovery and exception handling for a future small controlled pilot.

It does not authorize CRM, broadcast tools, Marketplace Operations, enterprise multi-tenancy,
Analytics expansion, a new Commerce Pattern or any new Money Domain object.

## 2. Operations Role and Permission Boundary

- only an authenticated `pilot_operations` Actor may access the Commercial Pilot Operations
  Workspace, evidence export and controlled action routes;
- Creator and Customer actors cannot access these routes or enable Operations actions;
- the Web Reference Client requires a separately supplied Operations access token and does not
  infer Operations authority from Creator authentication;
- no frontend state or ordinary Creator administration can grant the role.

## 3. Operations Workspace

For each Paid Service Order, the Workspace exposes:

- Order ID, Creator, Customer, immutable Offering snapshot, amount, currency and Order state;
- Payment state, Provider or Simulation reference and observed timestamp;
- Settlement state, Gross, Provider Fee, Platform Fee, Creator Net and observed timestamp;
- Order Earnings projection: Pending, Available, Restricted and Recovery Outstanding;
- Creator Wallet projection: Pending, Available, Restricted, Recovery Outstanding, Withdrawal in
  progress and Withdrawn;
- related Withdrawal state and Provider or Simulation reference;
- related Ledger Entries, Canonical Events and Provider Fact observations.

Order Earnings and Creator Wallet are explicitly separate projections. A Withdrawal may consume
earnings accumulated from more than one Order; Operations must not invent a per-Order Withdrawal
allocation or project a cross-Order Withdrawal as a negative Order balance.

## 4. Reconciliation Model

The Workspace traces the existing relationship:

```text
Order → Payment → Settlement → Ledger → Wallet → Withdrawal
```

It reports the following reconciliation conditions without rewriting balances:

- `missing_fact`;
- `duplicate_fact`;
- `conflicting_fact`;
- `pending_resolution`;
- `recovery_outstanding`.

Provider Fact receipt observations preserve accepted, idempotent, stale and conflicting decisions.
Duplicate or conflicting observations remain visible to Operations but cannot create a second Money
fact.

## 5. Controlled Action Boundary

Operations may:

- retry a failed Settlement through the existing Simulation/Application Policy path;
- retry a failed Withdrawal through the existing Creator-owned retry Use Case and a new verified
  Simulation Fact;
- record Reconciliation, Manual Resolution or Recovery Resolution notes.

Operations may not:

- assign or edit a Wallet balance;
- edit, replace or delete Ledger Entries;
- directly mark Payment, Settlement or Withdrawal successful;
- use a Manual Resolution note as a Provider Fact or Approved Simulation Fact.

Every Money mutation continues to originate from the frozen Application Use Cases, Domain rules and
verified facts. A Manual Resolution changes only Operations audit state.

## 6. Operations Action Audit

Every controlled action records:

- Actor;
- Action;
- Target type and ID;
- non-sensitive Before and After snapshots;
- Reason;
- Timestamp;
- Correlation ID.

Audit snapshots exclude payment credentials, secrets, authentication tokens, complete bank/card
data, Withdrawal destination references and idempotency keys.

## 7. Commercial Evidence Package

Operations may export a non-sensitive `commercial_evidence_summary` for an Order containing:

- Order, Payment, Settlement and fee trace;
- Order Earnings and Creator Wallet projections;
- related Withdrawal summaries;
- Ledger Entries and Canonical Events;
- Provider references, origin and timestamps;
- reconciliation issues.

Current evidence is always `realCommerceEvidence = false`. Local Simulator facts are labeled
`origin = simulation` and `providerId = local_commerce_simulator`. A future verified Provider fact
may use `origin = provider`, but the Operations layer uses the same read/reconciliation policy and
does not create a Provider-specific Money path.

## 8. Environment Separation

- Local, Test and Controlled compositions may provide the Local Simulator action executor.
- Production composition does not provide a Simulator action executor; a Retry action therefore
  safely rejects rather than falling back to test transport.
- Read, evidence and audit boundaries remain Provider-neutral.
- `REAL_MONEY_ENABLED=false` remains frozen for this change unit.
- Official Sandbox remains Conditional / Unavailable and is not used as VS-02H evidence.

## 9. Acceptance Contract

| Acceptance | Frozen expectation |
| ---------- | ------------------ |
| OPS-01 | View complete Order → Payment → Settlement → Earnings evidence |
| OPS-02 | Settlement Failed displays Pending Resolution and no Order Available Earnings |
| OPS-03 | Settlement Retry is controlled and Ledger credit occurs once |
| OPS-04 | Post-Settlement Refund displays Recovery Outstanding |
| OPS-05 | Failed Withdrawal is visible and retries safely through existing Use Cases |
| OPS-06 | Duplicate Provider Event is visible without a second Money fact |
| OPS-07 | Unknown Fact source cannot be manually marked successful |
| OPS-08 | Simulation Evidence remains labeled and excluded from real commerce evidence |

## 10. Implementation Evidence

- Application read, reconciliation, evidence and audit policy:
  `applications/paid-commerce/commercial-pilot-operations.ts`;
- controlled Local action executor:
  `applications/paid-commerce/local-commercial-pilot-operations-action-executor.ts`;
- HTTP and OpenAPI contracts:
  `adapters/transport/http/commercial-pilot-operations-routes.ts` and
  `contracts/api/v1/commercial-pilot-operations-contracts.ts`;
- protected Web workspace:
  `apps/web/src/components/commercial-pilot-operations-workspace.tsx`;
- persistent audit and Provider observation schema:
  `database/migrations/0012_v02h_operations_audit.sql`;
- focused Browser acceptance:
  `tests/acceptance/browser/zz-vs02h-commercial-pilot-operations.spec.ts`;
- API authorization, Manual Resolution and evidence-redaction regressions:
  `tests/integration/paid-commerce-api.test.ts`.

Final verification and deployment evidence is maintained in
`docs/08_Execution/21_Prototype_Execution.md`, Section 20.

```text
VS-02H — Commercial Pilot Operations Readiness = COMPLETE
Simulation Only / No Real Money Evidence
Provider Qualification = External Parallel Track
REAL_MONEY_ENABLED = false
```
