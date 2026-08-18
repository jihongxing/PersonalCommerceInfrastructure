# 47 — VS-02K Real Creator Pilot / Non-Money

> **Status**: Execution Preparation
> **Decision Date**: 2026-08-17
> **Result**: Real Creator Pilot Ready — External Execution Required
> **Commercial Launch**: Not Declared
> **First Completed Paid Commerce**: Not Declared
> **REAL_MONEY_ENABLED**: `false`
> **Real Money Evidence**: None

## 1. Boundary

VS-02K prepares a controlled external-use Pilot for one to three real Creators. The Pilot validates
real product usage of Commerce Identity, Offering, Public Distribution, Customer Request and Creator
Confirm / Decline. It is not a demand-validation or PMF experiment and does not authorize real
Payment, Settlement or Withdrawal.

Money-related surfaces remain explicitly:

```text
Payment / Settlement / Withdrawal = Simulation Only or Not Executed
REAL_MONEY_ENABLED = false
```

## 2. Pilot Scope

The first Pilot may include:

- one to three real Creator accounts;
- priority for real dancers or dance teachers;
- at least one Creator-authored Service Offering per Creator;
- a real Commerce Identity and Public URL;
- Creator-owned external distribution channels;
- real Customers submitting Requests;
- Creator Confirm or Decline decisions.

It does not include real Payment, real Settlement, real Withdrawal, Provider Qualification,
Marketplace, Subscription, CRM, large Analytics, a second vertical or a second Commerce Pattern.

## 3. Environment and Access Requirements

The Pilot must use a controlled externally reachable deployment with:

- HTTPS;
- stable Public URL;
- Creator authentication through the configured Supabase Auth provider;
- session persistence across reload and a second login session;
- public Offering access without Creator login;
- Customer Request and Customer Result access;
- Creator Request Management;
- `REAL_MONEY_ENABLED=false` enforced in the API runtime.

The repository contains deployment configuration and a real Supabase browser acceptance harness,
but no real Pilot URL, Creator account, Customer account, or external distribution evidence is
stored in this document.

## 4. Real Creator Identity Rules

Each Pilot Creator must use an independent real account. The following are prohibited:

- test tokens;
- shared Creator accounts;
- Founder acting as the Creator;
- Codex acting as the Creator;
- database-created identities or Requests;
- fixture data presented as Pilot evidence.

The Creator must personally register or receive an approved account, log in, complete the Commerce
Identity, create the Capability and Offering, publish, inspect Requests, and Confirm or Decline.

## 5. Creator-Authored Product Content

Each Creator must personally provide:

- Creator display name;
- personal introduction;
- Capability;
- Service Offering title and description;
- availability or service terms;
- Public Call To Action.

Engineering and Operations may provide instructions and observe evidence, but may not invent or
substitute commercial content for the Creator.

## 6. Distribution and Customer Request

The Creator must distribute the Public Commerce Identity URL through a Creator-owned channel such
as Douyin, Xiaohongshu, Bilibili, WeChat or a private fan group. The platform does not claim control
over that channel.

The required path is:

```text
Creator-owned channel
→ Public Commerce Identity
→ Offering
→ Customer Request
→ Customer Result
```

At least one real Customer must open the Public URL and submit a Request through the product. A
Customer may remain anonymous where the existing product rule permits it. Engineering must not
submit the Request on the Customer's behalf.

## 7. Non-Money Fact Separation

Real Product Usage Evidence includes:

- real Creator account reference;
- Commerce Identity;
- Offering;
- Publish timestamp;
- distribution channel and Public URL;
- real Customer Request;
- Creator decision;
- Customer Result.

Simulation Money Evidence is separate and remains labeled:

```text
origin = simulation
provider = local_commerce_simulator
```

A real Request or Creator decision must never be described as a Paid Transaction. Simulation Payment
must never be described as Real Payment. No Pilot Usage Evidence enters Real GMV, Real Revenue,
Real Creator Revenue, First Completed Paid Commerce or Provider Qualification Evidence.

## 8. Minimal Operations Boundary

Operations may view:

- Creator;
- Commerce Identity;
- Offering;
- real Request;
- Request state;
- error and audit records.

Operations may handle non-money operational exceptions and document observations. Operations may not:

- modify Creator business facts;
- impersonate or replace Creator Confirm / Decline;
- manufacture a Customer Request;
- modify Ledger or Wallet;
- create Payment, Settlement or Withdrawal facts.

## 9. Data Governance

Pilot data must remain independently identifiable, auditable and protected from automated test
cleanup. Before external execution, Operations must record a Pilot ID and maintain a mapping between
Pilot Creator, Auth account, Creator Identity, Offering, Public URL, Request and Result.

The current schema and runtime do not provide a repository-wide explicit `test / simulation / pilot`
dataset discriminator for all VS-01 objects. This is a governance risk, not a reason to silently
add a temporary cleanup bypass. Until a Controller-approved data-isolation decision exists, real
Pilot data must use an isolated controlled database/project and must not share the automated test
database.

## 10. Acceptance Matrix

| Acceptance | Required actor / evidence | Current repository status |
| ---------- | ------------------------- | ------------------------- |
| PILOT-K01 Real Creator Sign Up | Real Creator and Auth evidence | External execution required |
| PILOT-K02 Login / Session Restore | Real Creator second-session evidence | External execution required |
| PILOT-K03 Creates Commerce Identity | Creator-authored Identity | External execution required |
| PILOT-K04 Creates Service Offering | Creator-authored Offering | External execution required |
| PILOT-K05 Publishes Offering | Published timestamp and URL | External execution required |
| PILOT-K06 Public URL without Creator login | Public browser evidence | External deployment required |
| PILOT-K07 Real Customer Request | Customer-submitted Request | External execution required |
| PILOT-K08 Creator sees Request | Creator session evidence | External execution required |
| PILOT-K09 Creator Confirm / Decline | Creator action and event evidence | External execution required |
| PILOT-K10 Customer sees Result | Customer Result evidence | External execution required |
| PILOT-K11 Simulation Money separation | Existing VS-02E/F evidence | Repository regression available |
| PILOT-K12 Creator second-session recovery | Real account session evidence | External execution required |

Automated tests using `test-*` tokens, fixtures, local simulation or in-memory composition cannot
close PILOT-K01–K10 or K12. They can only verify the technical contract and regression boundary.

## 11. Exit Conditions

VS-02K may be marked `COMPLETE` only after all of the following are attached to a controlled Pilot
Evidence Package:

1. externally reachable HTTPS deployment;
2. one to three independent real Creator accounts;
3. Creator-authored Identity and Offering evidence;
4. real Public URL and Creator-owned distribution evidence;
5. at least one real Customer Request;
6. Creator Confirm / Decline evidence;
7. Customer Result evidence;
8. isolated database/project evidence showing no automated test cleanup overlap;
9. existing money separation and regression evidence;
10. `REAL_MONEY_ENABLED=false` runtime evidence.

Until then the honest state is `Execution Preparation` / `External Execution Required`, not
Commercial Launch and not First Completed Paid Commerce.

## 12. Final State

```text
VS-02K — Real Creator Pilot / Non-Money = EXECUTION PREPARATION
Real Creator Pilot Ready = TECHNICAL PACKAGE READY / EXTERNAL EXECUTION REQUIRED
Commercial Launch = Not Declared
First Completed Paid Commerce = Not Declared
REAL_MONEY_ENABLED = false
No Real Money Evidence
```
