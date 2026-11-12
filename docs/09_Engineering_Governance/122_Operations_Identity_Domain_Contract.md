# 122 - Operations Identity Domain Contract

> **Decision:** `PCI-ENG-014_ARCHITECTURE = APPROVED`
> **Implementation unit:** `PCI-ENG-015-A_DOMAIN_CONTRACT = ACCEPTED`
> **Persistence follow-on:** `PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTANCE_PENDING`
> **Effective date:** 2026-11-12
> **Scope:** pure Human Operations and Machine Service Principal domain contracts only

This document adopts the final PCI-ENG-014 Operations identity architecture and records the first
bounded implementation unit. Principal persistence is recorded separately in
[`123_Operations_Identity_Persistence_Baseline.md`](./123_Operations_Identity_Persistence_Baseline.md).
This document does not authorize authentication, Session runtime, BFF, permissions, Admin API
integration, deployment or production use.

## 1. Adopted architecture

Human Operations and machine identities are separate domains:

```text
Human Management Domain
OperationsHumanPrincipal -> OperationsAccount -> credential metadata
                         -> OperationsSession
                         -> MFA factor metadata

Machine Identity Domain
ServicePrincipal -> ProviderServicePrincipal | PlatformSystemPrincipal
                 -> service credential metadata
```

`OperationsHumanPrincipal` represents only a human administrator. The initial contract is one
Human Principal to one Operations Account. A Service Principal has no Login Account, Human Session,
Human MFA factor or Human Catalog Role. Provider and Platform System are discriminated subtypes and
cannot be substituted for each other.

The domain module is intentionally separate from `modules/shared/actors.ts`. The current runtime
`Actor` union, including `pilot_operations`, remains unchanged until a separately authorized runtime
integration unit.

## 2. Canonical Session boundary

Operations uses the approved single opaque Session Credential direction. The domain contract contains
only a non-secret `OperationsSessionId` and Session lifecycle metadata. It does not contain a password
hash, Access Token, Refresh Token, opaque Session Credential, Service Secret or private key.

The future authentication adapter owns credential hashing, Cookie transport, rotation, replay
detection, BFF-to-API trust and revocation. Session metadata records Human Principal and Account
references, credential version, principal security epoch, idle expiry, absolute expiry and MFA time.
There is no independent 15-minute Credential TTL in this contract.

Creator authentication remains unchanged. In particular, this unit does not modify:

- `local_auth_accounts`;
- `local_auth_sessions`;
- `local_creator_mappings`;
- `account_identity_memberships`;
- `modules/shared/actors.ts`;
- the Static Operations Provider or any API route.

## 3. Implemented module

The pure domain module is:

`modules/operations-identity/operations-identity-contract.ts`

It provides:

- branded IDs for Human Principal, Account, Credential, Session, MFA factor, Service Principal,
  Service Credential, Provider and Platform System;
- Human Principal, Account, Credential Metadata, Session and MFA Metadata;
- Provider Service Principal and Platform System Principal;
- Service Credential Metadata;
- discriminated Human, Provider and Platform System authenticated subjects;
- discriminated execution attribution for human-direct, human-initiated-system,
  provider-fact-system and system-autonomous execution;
- pure constructors and invariant validators;
- `normalizeOperationsLoginIdentifier`, which trims, NFC-normalizes and preserves case for the
  bounded Operations persistence login identifier contract (maximum 320 Unicode characters);
- explicit `OperationsDomainInvariantError` failures.

Credential and secret material are deliberately excluded from every domain entity.

## 4. Domain invariants

- Human Account `principalId` is an `OperationsHumanPrincipalId`; it cannot be a Creator or Service ID.
- A Human Session is constructed from one Account and derives the matching Human Principal reference.
- Session expiry ordering is `createdAt <= lastActivityAt <= idleExpiresAt <= absoluteExpiresAt`.
- Active and revoked Session/Credential/MFA states have the required timestamp rules.
- Principal and Account lifecycle state remain separate; an active Account does not grant permissions.
- Provider and Platform System principals require their own branded Provider/System IDs.
- Service Credentials reference only Service Principals.
- Human subjects require Principal, Account and Session IDs; Provider subjects require Provider identity;
  System subjects require System identity.
- Execution attribution permits only these combinations:
  - Human directly executes as Human;
  - Human initiates and Platform System executes;
  - Provider submits a fact and Platform System processes it;
  - Platform System executes autonomously.
- A System subject cannot create a Human initiator, and a Provider subject cannot become a Human subject
  through a type cast supported by the contract.

Database uniqueness, foreign keys and persistence constraints are implemented only for the bounded
PCI-ENG-015-B Principal persistence unit; they do not authorize authentication or runtime use.

## 5. Verification evidence

Focused tests are in:

`modules/operations-identity/operations-identity-contract.test.ts`

The focused tests cover canonical login identifier handling, branded ID separation, secret exclusion, independent lifecycle states,
Human Session ownership and expiry, MFA metadata, Provider/System separation, Service Credential
ownership and all four execution attribution forms. `@ts-expect-error` assertions cover incompatible
Human, Account and Service IDs and the absence of Human Account fields on Provider principals.

Verification of the accepted domain contract on the R2 closure branch:

| Check                           | Result                              | What it proves                                        | What it does not prove                          |
| ------------------------------- | ----------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| Focused Vitest                  | PASS, 13/13                         | Pure contract behavior, including login canonicalization | Persistence or runtime auth                     |
| `tsconfig.build.json` typecheck | PASS                                | Production source compiles                            | Test aggregate health                           |
| Focused ESLint                  | PASS                                | New files meet lint rules                             | Full repository lint                            |
| `git diff --check`              | PASS                                | No whitespace errors                                  | Product acceptance                              |
| `tsconfig.tests.json` aggregate | BLOCKED by pre-existing diagnostics | The aggregate still contains known unrelated failures | New module correctness; use focused tests above |

The aggregate test typecheck failures include existing `apps/web-v2` path resolution, legacy auth
utility and unused-symbol diagnostics. They are not changed by this unit and are not claimed closed.

## 6. Not implemented by this unit

The current Operations implementation values are:

```text
OPERATIONS_HUMAN_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTANCE_PENDING
OPERATIONS_ACCOUNT_PERSISTENCE = IMPLEMENTED / ACCEPTANCE_PENDING
SERVICE_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTANCE_PENDING
OPERATIONS_AUTHENTICATION = NOT IMPLEMENTED
OPERATIONS_SESSION_RUNTIME = NOT IMPLEMENTED
OPERATIONS_BFF = NOT IMPLEMENTED
OPERATIONS_PERMISSION_ENFORCEMENT = NOT IMPLEMENTED
OPERATIONS_PROVIDER_SYSTEM_RUNTIME_MIGRATION = NOT IMPLEMENTED
OPERATIONS_ADMIN_API_INTEGRATION = NOT IMPLEMENTED
```

No Credential, Session, MFA factor, Role or Permission was created or assigned. PCI-ENG-015-B adds
only the three Principal persistence tables, repositories and disposable PostgreSQL verification
described in the persistence baseline. No Cookie, BFF, MFA, CSRF, mTLS, API route, Actor runtime,
Webhook, Catalog, Commercial Pilot, Paid Commerce or Admin Web behavior was changed.

## 7. Dependencies and remaining decisions

The next bounded engineering units must be separately authorized:

1. persistence and database constraints;
2. Operations authentication and the canonical opaque Session Credential runtime;
3. BFF and Shared API trust boundary;
4. Permission registry and enforcement;
5. Provider/System runtime Actor migration;
6. transactional and proposed append-only audit implementation;
7. read-only Admin integration, followed by any separately approved Catalog mutation integration.

Founder / governance decisions remain required for the first Operations Principal, Bootstrap
Authority, administrator invitation, high-risk permission grants, dual control, Break-glass access,
Commercial Pilot/Paid Commerce/Withdrawal administration and any Manual Review or Adjudication power.

## 8. Control state

This contract does not alter project governance:

```text
PROJECT_CONTROL_MODE = CONTROLLED_RECOVERY
FORMAL_RESUME_GATE = NOT_FULLY_CLOSED
VS-01 = FROZEN
STAGE_2 = BOUNDED_APPROVED_CHANGE_UNITS_ONLY
FULL_STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED
EXTERNAL_PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

The implementation commit is `e2acf7b` (`feat: add operations identity domain contract
(PCI-ENG-015-A)`). Documentation synchronization is a separate change unit and does not imply
runtime or product authorization.
