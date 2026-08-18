# 42 — VS-02F Local Paid Commerce Productization

> **Status**: Completed
> **Decision Date**: 2026-08-17
> **Scope**: Local / Test / Controlled paid-commerce product workflow
> **Real-money Status**: Disabled — Simulation Only / No Real Money Evidence

## 1. Objective

VS-02F turns the existing Provider-neutral Local Commerce Simulator into a complete
user-operable product workflow. A test Customer and test Creator can use the Web product
through HTTP, Application Services, Provider Ports, verified Simulation Facts, Money
Domain, PostgreSQL and Ledger-projected Wallet without database edits or direct balance
mutation.

## 2. Frozen Product Surfaces

### Customer

- confirmed Request result exposes its one immutable Order snapshot;
- Checkout displays Gross Amount, CNY, Creator, Service, Order and Payment status;
- the page is explicitly labeled `Simulation / Test Environment`;
- Customer can select Success, Failed, Delayed or Expired only outside production;
- Retry reuses the same Order and Payment aggregate and creates a new idempotent Provider
  operation, not a second Order or duplicate charge;
- every success/failure result passes through the Local Provider Adapter and Application
  Policy before changing Money state.

### Creator

- Creator sees Order, Customer, Offering snapshot, Gross Amount, Payment, Fulfillment,
  Settlement, Earnings, Recovery and Withdrawal status;
- Fulfillment uses the existing Creator-authorized Application Use Case;
- Settlement and Withdrawal simulation commands verify Creator ownership before an
  internal Operations context invokes the Simulator;
- Earnings explain Gross, simulated Provider Fee, simulated Platform Fee, simulated
  Adjustment and calculated Creator Net;
- Wallet displays Pending, Available, Restricted, Recovery Outstanding, Withdrawal in
  progress and Withdrawn, all from Ledger projection.

## 3. Payment Retry and Expiry

Payment Failed and Payment Expired remain independent from Order identity. The same
Order may retry its Payment without creating another Order.

```text
Payment Pending → Failed / Expired
Failed / Expired → Retry Pending → Confirmed / Failed / Expired
```

The Provider-neutral Port remains unchanged. The Simulator continues to emit the
existing `PaymentFailed` Provider Fact. In the explicit `expired` Simulation scenario,
the Local Productization Application boundary records the resulting Payment as
`expired`; this is Simulation UX state, not a new Provider Fact kind.

The Provider Fact receipt policy permits the controlled sequence
`PaymentFailed → PaymentSucceeded` only when sequence increases and amount/currency are
unchanged. This supports an explicit retry; it does not permit a conflicting replacement
of an already confirmed Payment.

## 4. Simulation Boundary

- Productization routes are registered only when the Local Simulation composition exists.
- Production composition exposes no Checkout simulation, settlement simulation,
  withdrawal simulation or fault-injection product controls.
- `REAL_MONEY_ENABLED=false` continues to reject Live Money operations.
- every simulated fact carries `origin = simulation` and
  `provider = local_commerce_simulator`.
- Simulation Orders, GMV, Revenue, Earnings and evidence must not be interpreted as real
  commercial evidence or Provider Qualification.

## 5. Preserved Contracts

VS-02F does not change:

- VS-01 Request / Confirm / Decline semantics;
- Money Flow Decision 34 and DEC-013-A/B;
- Provider-neutral Payment / Settlement / Withdrawal Ports;
- Ledger append-only and Wallet projection rules;
- CNY-only current scope;
- Real-money Founder activation boundary.

## 6. Explicit Non-goals

No WeChat Pay, Alipay, Stripe, PayPal, real secret, real Checkout, real Webhook, KYC,
real Withdrawal, Marketplace, Subscription, Multi-currency, financial product or new
Commerce Pattern is authorized.

## 7. Implementation Evidence

- Application product boundary:
  `applications/paid-commerce/local-paid-commerce-product-service.ts`;
- HTTP and Contract boundary:
  `adapters/transport/http/local-paid-commerce-product-routes.ts` and
  `contracts/api/v1/local-paid-commerce-product-contracts.ts`;
- Customer and Creator Reference Client:
  `apps/web/src/components/customer-request-result-workspace.tsx` and
  `apps/web/src/components/creator-earnings-workspace.tsx`;
- focused Browser acceptance:
  `tests/acceptance/browser/zz-vs02f-local-paid-commerce-productization.spec.ts` — 12 passed;
- lifecycle fixes discovered by product simulation:
  Withdrawal retry re-reservation and per-Order Pending Earnings refund projection;
- Provider-neutral Ports remain unchanged and production composition exposes no product Simulator
  routes.

Final full verification evidence is maintained in
`docs/08_Execution/21_Prototype_Execution.md`, Section 18.

```text
VS-02F — Local Paid Commerce Productization = COMPLETE
Simulation Only
No Real Money Evidence
```
