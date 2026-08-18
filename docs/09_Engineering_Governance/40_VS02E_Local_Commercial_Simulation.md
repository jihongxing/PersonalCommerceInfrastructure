# 40 — VS-02E Local Commercial Simulation

> **Status**: Frozen — Complete
> **Decision Date**: 2026-08-16
> **Scope**: Provider-neutral local commercial simulation only
> **Real-money Status**: Disabled — No Real Money Evidence

## 1. Decision Boundary

VS-02E establishes a `LocalCommerceSimulator` so the existing VS-02 Payment, Settlement, Earnings
Ledger, Wallet, Withdrawal and minimum Refund / Reversal paths can be exercised without a real
Provider or real funds.

The Simulator:

- implements the existing Provider Port without changing its contract;
- may run only in `local`, `test` and `controlled` environments;
- must not be registered, routed or rendered in `production`;
- emits Provider-neutral verified facts whose Provider identity is `local_commerce_simulator`;
- does not bypass Application Policy or mutate the Money Domain directly;
- does not enable `REAL_MONEY_ENABLED` and does not satisfy Founder Activation requirements.

## 2. Simulation Fact Classification

Every simulated operation, event and evidence record is classified as:

```text
origin = simulation
providerId = local_commerce_simulator
environment = local | test | controlled
```

A Simulation Fact is not a Real Provider Fact. It must not be counted as:

- Real GMV;
- Real Revenue;
- Real Completed Paid Commerce;
- Real Creator Earnings;
- Provider Qualification evidence;
- First Real Payment, Settlement, Withdrawal or Refund evidence.

Simulation evidence references use a `simulation:` prefix. Real-commerce evidence and activation
records must reject or separately classify that prefix.

## 3. Simulation Environments and Controls

The Simulation Control is an Operations-only engineering surface. It is available only when the
runtime environment is `local`, `test` or `controlled` and the configured Provider is the Local
Simulator.

- Customer and Creator actors cannot configure or advance scenarios.
- Browser controls are a thin client over HTTP and never call the Simulator directly.
- Production composition does not expose Simulation routes or UI.
- Configuring a scenario never enables real money and never changes the real-money kill switch.

## 4. Scenarios and Fault Injection

The frozen scenario vocabulary is:

| Capability | Scenarios                                                                          |
| ---------- | ---------------------------------------------------------------------------------- |
| Payment    | `success`, `failed`, `delayed`, `expired`, `duplicate_event`, `out_of_order_event` |
| Settlement | `immediate`, `delayed`, `failed`, `duplicate`, `conflicting_terminal_event`        |
| Withdrawal | `success`, `failed`, `delayed`, `duplicate`                                        |
| Refund     | `before_settlement`, `after_settlement`, `failed_refund`                           |

The supported fault-injection outcomes are webhook delay, duplicate webhook, out-of-order webhook,
Provider timeout, Payment failure, Settlement failure, Withdrawal failure and Refund failure.

`delayed` and Provider timeout leave an operation pending until an authorized Simulation Control
advances it. A failed Settlement or failed Refund does not fabricate a success fact. Duplicate,
out-of-order and conflicting terminal events are processed through the existing receipt and conflict
guards.

## 5. Simulation Fee Profile

Simulation settlement uses integer minor units and an explicit configuration record containing:

- Gross Amount;
- Simulated Provider Fee;
- Simulated Platform Fee;
- Simulated Adjustment / Reserve;
- Creator Net Earnings;
- Currency;
- Calculation Version;
- `classification = simulation_configuration`.

These values are test configuration, not production pricing, a Provider quote or a commercial fee
decision. Creator Net must reconcile exactly to Gross minus all configured deductions.

## 6. Application and Money Boundary

The required execution path is:

```text
Browser
→ HTTP
→ Simulation Application Service
→ Provider Port
→ LocalCommerceSimulator
→ Provider Fact Application Policy
→ Money Domain
→ Repository / PostgreSQL
→ HTTP / UI
```

The Simulator cannot write Orders, Payments, Settlements, Ledger Entries, Wallet projections or
Withdrawals. Wallet remains a projection of append-only Ledger Entries. Refund and reversal behavior
must use the already frozen FR-202, FR-204, FR-205 and FR-208 semantics and must preserve all prior
facts.

## 7. Simulation Evidence

Simulation evidence must preserve, where applicable:

- Simulation operation and event IDs;
- Scenario and fault injection;
- Runtime environment;
- Provider-neutral internal and Provider references;
- Order, Payment, Settlement or Withdrawal reference;
- Amount and currency;
- Fee-profile version and calculation inputs;
- Event sequence and occurrence time;
- replay, stale or conflict decision;
- resulting Ledger and Wallet projection references.

It must never contain card data, CVV, Provider secrets, webhook secrets, access tokens or real account
credentials.

## 8. Completion Rule

VS-02E may be declared complete only when all required scenarios and fault injections pass through the
unchanged Provider Port, the full local browser flow reaches PostgreSQL and UI, Ledger and Wallet
invariants pass, production exposes no Simulator control, all regressions pass, and execution evidence
states:

```text
VS-02E — Local Commercial Simulation = COMPLETE
Simulation Only
No Real Money Evidence
```

Completion does not start VS-02D real-money activation and does not qualify any external Provider.
