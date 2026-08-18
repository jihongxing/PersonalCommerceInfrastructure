# 48 — VS-02K-EXT-READY Controlled External Pilot Environment

> **Status**: Blocked — External Deployment Gap
> **Decision Date**: 2026-08-17
> **Change Unit**: `DEV-020`
> **Target State**: Controlled External Pilot Ready
> **Current State**: Not Yet Executable in Current Environment
> **REAL_MONEY_ENABLED**: `false`
> **Real Money Evidence**: None
> **Commercial Launch**: Not Declared

## 1. Purpose and Boundary

This change unit prepares the existing VS-01 / VS-02K product for controlled external use by real
Creators and Customers. It does not add a Commerce Pattern, Product Object, API Contract, Provider
Adapter or Money capability. It does not authorize Payment, Settlement or Withdrawal.

The required external flow is:

```text
Real Creator
→ Commerce Identity
→ Capability
→ Offering
→ Publish
→ Share
→ Public URL
→ Real Customer Request
→ Creator Confirm / Decline
→ Customer Result
```

Money remains:

```text
REAL_MONEY_ENABLED = false
Payment / Settlement / Withdrawal = Simulation Only or Not Executed
```

## 2. Environment Contract

The controlled Pilot must be isolated from Development and Test:

| Boundary    | Required Pilot property                                   | Current evidence                                                                     |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Deployment  | Separate controlled deployment                            | Deployment configuration exists; no externally provisioned Pilot deployment evidence |
| Database    | Dedicated Pilot database                                  | Not supplied; current repository has no external Pilot database evidence             |
| Environment | Separate variables and secrets                            | Not supplied                                                                         |
| Auth        | Dedicated real Auth project/tenant                        | Supabase integration exists; no Pilot project or credentials supplied                |
| Session     | Independent Creator sessions                              | Runtime support exists; real session evidence is pending                             |
| Domain      | Stable public domain                                      | Not supplied                                                                         |
| TLS         | HTTPS with valid certificate                              | Not supplied                                                                         |
| Logs        | Isolated Pilot logs and retention                         | Not supplied                                                                         |
| Data        | Pilot data isolated from Test and Simulation Fixture data | Requires dedicated database/project before execution                                 |

The existing production-like Compose configuration is not evidence of a Controlled External Pilot:
it exposes locally mapped ports and does not establish DNS, TLS, an isolated database, or a dedicated
Auth project.

## 3. Required External Setup

Before the Pilot can be activated, the Controller or authorized Operations owner must provide:

1. a controlled deployment target and stable HTTPS domain;
2. DNS and TLS termination evidence;
3. a dedicated Pilot PostgreSQL database and backup/restore ownership;
4. a dedicated Supabase Auth project or explicitly isolated Auth tenant;
5. environment-specific secrets loaded outside the repository;
6. logging, request/correlation ID retention and audit access;
7. one to three independently controlled real Creator accounts;
8. at least one real Customer coordinated for a Request;
9. Creator-owned distribution evidence after the Creator publishes the Public URL.

No value in this list may be replaced by a test token, fixture, shared account, local simulation,
manual database write or Founder/Codex impersonation.

## 4. Authentication and Session Boundary

The existing Supabase Auth integration and Creator Desk are the technical harness for the Pilot.
External acceptance requires each real Creator to independently:

- sign up or log in;
- establish and restore a session after reload and a second login;
- map to the correct Creator identity;
- log out without retaining another Creator's session.

The following are prohibited as Pilot evidence: `test-token`, fixture identity, shared Creator account,
database-injected identity and an automated test session presented as a real user session.

## 5. Data Isolation Contract

The Pilot must prove all of the following using separate Creator accounts and a dedicated Pilot data
store:

- Creator A cannot read or modify Creator B's private Offering;
- Creator A cannot read Creator B's Requests;
- Customer cannot access private Creator or Operations data;
- automated Test cleanup cannot delete Pilot data;
- Simulation Fixture data cannot be presented as Pilot data.

The current schema and runtime do not provide a repository-wide `test / simulation / pilot` dataset
discriminator for all VS-01 objects. This is therefore an external provisioning requirement, not a
reason to add a temporary cleanup bypass or silently change the frozen product model.

## 6. Money Safety Contract

The Controlled Pilot must deploy with:

```text
REAL_MONEY_ENABLED = false
Live Provider Secret = absent
Live Webhook = absent
Real Payment = rejected
Real Settlement = rejected
Real Withdrawal = rejected
```

Simulation controls and Simulation Evidence must not be exposed as Production Money APIs or mixed
with Real Product Usage Evidence. A real Request or Creator decision is not a Paid Transaction.

Any deployment whose defaults could enable real money must be rejected before public exposure.

## 7. Product Usage Boundary

Real Creators must personally author the Commerce Identity, Capability and Offering, publish it and
share the Public URL through a Creator-owned channel. A real Customer must open the public URL and
submit a Request without a database write, fixture or operator substitution. The Creator must make
the Confirm / Decline decision in the product, and the Customer must receive the resulting status.

Operations may observe and handle non-money operational issues, but may not create or alter these
business facts on behalf of a Creator or Customer.

## 8. Pilot Evidence Pack

The following fields are required for each Pilot case. Unknown or not-yet-occurred facts remain
`PENDING`; they must not be invented:

```text
Pilot ID
Creator Account
Commerce Identity
Offering
Public URL
Distribution Evidence
Customer Request
Creator Decision
Customer Result
Timestamp
Environment
Request ID
Correlation ID
Audit Reference
```

This package is **Real Product Usage Evidence** only. Simulation Money Evidence remains separately
labeled `origin=simulation` and `provider=local_commerce_simulator`.

## 9. Acceptance Matrix

| Acceptance                                | Required evidence                              | Current status                           |
| ----------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| EXT-K01 Real Creator Sign Up              | Dedicated Auth account and audit evidence      | PENDING — external execution             |
| EXT-K02 Login + Session Restore           | Real second-session evidence                   | PENDING — external execution             |
| EXT-K03 Creator creates Commerce Identity | Creator-authored record                        | PENDING — external execution             |
| EXT-K04 Creator creates Offering          | Creator-authored Offering                      | PENDING — external execution             |
| EXT-K05 Creator Publish                   | Published record and URL                       | PENDING — external execution             |
| EXT-K06 Public HTTPS URL                  | External browser and TLS evidence              | BLOCKED — no URL supplied                |
| EXT-K07 Real Customer Request             | Customer-submitted Request                     | PENDING — external execution             |
| EXT-K08 Creator Confirm / Decline         | Creator session and event evidence             | PENDING — external execution             |
| EXT-K09 Customer Result                   | Result from the real Request                   | PENDING — external execution             |
| EXT-K10 Creator A/B Isolation             | Authorization evidence in dedicated Pilot data | BLOCKED — no Pilot data store supplied   |
| EXT-K11 No Real Money Path                | Runtime config and rejection evidence          | PASS — repository/runtime guard evidence |
| EXT-K12 Simulation Isolation              | Separate origin/provider evidence              | PASS — existing VS-02E/F evidence        |

Local, fixture-backed and simulated browser tests may support technical regression, but cannot close
EXT-K01–K10 without real external actors and infrastructure.

## 10. Exit State

This change unit may be closed as **Controlled External Pilot Ready** only after the external setup,
isolation proof and EXT-K01–EXT-K12 evidence are attached to the Execution SSOT. Until then:

```text
VS-02K-EXT-READY = NOT YET EXECUTABLE IN CURRENT ENVIRONMENT
External Deployment Gap = OPEN
Real Creator Pilot = External Execution Required
REAL_MONEY_ENABLED = false
No Real Money Evidence
Commercial Launch = Not Declared
```

This task stops at preparation and does not execute a real Creator Pilot.
