# 122 - Operations Identity Domain Contract

> **Decision:** `PCI-ENG-014_ARCHITECTURE = APPROVED`
> **Implementation unit:** `PCI-ENG-015-A_DOMAIN_CONTRACT = ACCEPTED`
> **Session contract follow-on:** `PCI-ENG-016-C0 = ACCEPTED`; `PCI-ENG-016-C1 = ACCEPTED`; `PCI-ENG-016-C1-E2 = ACCEPTED`
> **Persistence follow-on:** `PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED`; `PCI-ENG-016-B_CREDENTIAL_PERSISTENCE = ACCEPTED`
> **Effective date:** 2026-11-12
> **Session persistence follow-on:** `PCI-ENG-016-C2 = ACCEPTED`; `PCI-ENG-016-C2-E2 = ACCEPTED`
> **Acceptance ledger update:** 2026-11-13 — PCI-ENG-016-C2-E2
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
- Session Credential Version is a positive integer; Principal Security Epoch is a non-negative integer.
- Absolute Expiry must be after creation. Touch cannot move activity/idle timestamps backwards or
  extend beyond Absolute Expiry; Rotation cannot change Absolute Expiry. Revoked Sessions are terminal.
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

Database uniqueness, foreign keys and persistence constraints are implemented for the bounded
PCI-ENG-015-B Principal, PCI-ENG-016-B Credential and PCI-ENG-016-C2 Session persistence units;
they do not authorize authentication or runtime use. C2-E2 changes no accepted Domain contract.

## 5. Verification evidence

Focused tests are in:

`modules/operations-identity/operations-identity-contract.test.ts`

The focused tests cover canonical login identifier handling, branded ID separation, secret exclusion, independent lifecycle states,
Human Session ownership and expiry, MFA metadata, Provider/System separation, Service Credential
ownership and all four execution attribution forms. `@ts-expect-error` assertions cover incompatible
Human, Account and Service IDs and the absence of Human Account fields on Provider principals.

Historical verification of the accepted 015-A / 016-B domain baseline, before C1:

| Check                           | Result                              | What it proves                                        | What it does not prove                          |
| ------------------------------- | ----------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| Focused Vitest                  | PASS, 14/14                         | Pure contract behavior, including credential metadata and login canonicalization | Persistence or runtime auth                     |
| `tsconfig.build.json` typecheck | PASS                                | Production source compiles                            | Test aggregate health                           |
| Focused ESLint                  | PASS                                | New files meet lint rules                             | Full repository lint                            |
| `git diff --check`              | PASS                                | No whitespace errors                                  | Product acceptance                              |
| `tsconfig.tests.json` aggregate | BLOCKED by pre-existing diagnostics | The aggregate still contains known unrelated failures | New module correctness; use focused tests above |

The aggregate test typecheck failures include existing `apps/web-v2` path resolution, legacy auth
utility and unused-symbol diagnostics. They are not changed by this unit and are not claimed closed.

## 5.1 Accepted credential persistence follow-on

PCI-ENG-016-B, PCI-ENG-016-B-R1 and PCI-ENG-016-B-R2 are accepted bounded persistence units. They add
only Encoded Password Verifier persistence, the Operations Account Credential Repository, strict
account-scoped Credential Version sequencing, atomic replacement with Account row locking and expected
version checks, revoked-history protection, PostgreSQL constraints/triggers, composition integration,
and Domain/PostgreSQL verification. Domain verification is 14/14 PASS and the Credential plus
Operations Identity PostgreSQL verification is 19/19 PASS.

This acceptance does not authorize password generation or verification, login/logout, password reset,
Session creation, MFA, RBAC, Admin BFF/API, Creator Auth changes, Pilot, Production or real-money use.
The 108 PASS / 12 FAIL / 3 SKIPPED Full Persistence result remains recorded as a repository regression
result; the 12 failures reproduce on the source baseline and are `PROVEN PRE-EXISTING — SOURCE BASELINE`.

## 5.2 Accepted Session Domain Contract and Application Repository Port

Main Controller formally accepted C1 in the explicit PCI-ENG-016-C1-E2 instruction. C0 design acceptance
is carried forward; this ledger closure changes no accepted TypeScript contract.
The following state and verification record is historical as of C1-E2, before C2 persistence.
Current C2 acceptance is recorded in Section 5.3 and the current-state block in Section 6.

```text
PCI-ENG-016-C0 = ACCEPTED
PCI-ENG-016-C1 = ACCEPTED
OPERATIONS_SESSION_DOMAIN_CONTRACT = ACCEPTED
OPERATIONS_SESSION_REPOSITORY_PORT = ACCEPTED
OPERATIONS_SESSION_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_AUTH_RUNTIME = NOT IMPLEMENTED
```

C1 refines the existing `OperationsSession`; no parallel Domain or database fields are introduced.
It binds each Session to one Operations Account and its matching Human Principal, rejects mismatched
ownership, and excludes Provider Service, Platform System and Creator identity reuse. The transition
validators preserve identity, Credential Version/Security Epoch snapshots, creation time and Absolute
Expiry, and reject reactivation or updates after revocation.

`applications/operations-identity/operations-session-repositories.ts` defines:

- `OperationsSessionCredentialDigest`: a branded 64-character lowercase hexadecimal representation
  of a 32-byte digest, separate from `EncodedPasswordVerifier`; no digest generation is implemented.
- Independent branded Credential Version, Session Version and Principal Security Epoch values.
  Credential Version is positive, Epoch allows zero, and Session Version is positive CAS metadata
  held only by `OperationsSessionPersistenceRecord`, outside the Domain entity.
- `OperationsSessionSnapshot`, refining existing snapshot field types without adding Domain fields.
- Seven Repository operations: Create, Find Active by Digest, Validate/Touch, Strict CAS Rotate,
  Revoke Single, Revoke All for Account and Revoke All for Principal.
- A separate expectedEpoch-controlled Security Epoch Increment Port; no decrement/reset/setter.
- Contract, Conflict, NotFound, NotAuthenticated and sanitized Persistence errors; no delete,
  reactivation, arbitrary update or raw opaque credential input.

Future persistence must initialize Session Version at 1 and increment it by exactly one on successful
Digest + expectedSessionVersion CAS. It must follow Human Principal -> Operations Account ->
Operations Credential -> Operations Session lock order, validate active owners and current Credential
Version/Epoch snapshots, and fail closed at expiry or invalidation. Touch must merge timestamps
monotonically. A single CAS conflict does not revoke the winner; a lost rotation response requires
reauthentication. There is no grace window, default successor recovery or independent credential TTL.
BFF single-flight cannot replace database CAS. These remain persistence obligations, not SQL/runtime
implementation or database concurrency evidence.

Accepted C1 verification:

| Check | Result | Scope and limit |
| --- | --- | --- |
| Domain Contract Tests | 21 PASS | Existing identity/credential checks plus Session ownership, versions, time and terminal-state invariants |
| Session Repository Contract Tests | 7 PASS | Digest/Verifier and version type separation, port surface, pure CAS/Epoch arithmetic; no database concurrency |
| Focused total | 28/28 PASS | Two test files; existing 14 Domain tests retained within the expanded 21 |
| Production TypeScript | PASS | `tsconfig.build.json`, no emit |
| Active Backend Test TypeScript | PASS | `tsconfig.active-tests.json`; distinct from the historical aggregate above |
| Changed-file ESLint / Prettier | PASS / PASS | Four C1 engineering files |
| `git diff --check` | PASS | Accepted C1 difference whitespace check |
| PostgreSQL Session tests | NOT EXECUTED | No Session persistence implementation exists |

Evidence is the accepted C1 report; E2 records it without rerunning database verification. Historical
13/13, 14/14 and PostgreSQL counts belong to their original units and are not rewritten as C1 results.
Idle Timeout, Absolute Lifetime, maximum concurrent Sessions, Device Management, Touch frequency,
Rotation triggers, Cookie/CSRF, Session history retention and MFA Session semantics remain unfrozen
Founder policies. Test Fixture dates do not approve timeout values.

## 5.3 Accepted Session Persistence follow-on

Authority: Main Controller's explicit PCI-ENG-016-C2-E2 acceptance instruction, dated 2026-11-13.
It accepts the existing C2 implementation and this documentation/Git closure, without changing the
Domain/C1 Port, Credential Persistence logic, runtime behavior or product authorization.

```text
PCI-ENG-016-C0 = ACCEPTED
PCI-ENG-016-C1 = ACCEPTED
PCI-ENG-016-C1-E2 = ACCEPTED
PCI-ENG-016-C2 = ACCEPTED
PCI-ENG-016-C2-E2 = ACCEPTED
OPERATIONS_SESSION_DOMAIN_CONTRACT = ACCEPTED
OPERATIONS_SESSION_REPOSITORY_PORT = ACCEPTED
OPERATIONS_SESSION_PERSISTENCE = ACCEPTED
OPERATIONS_SESSION_AUTH_RUNTIME = NOT IMPLEMENTED
```

C2 implements `operations_sessions`, Migration 0038 and corresponding Snapshot/Journal, the
Account/Principal composite RESTRICT foreign key, 32-byte Digest persistence, independent Session
Version, Credential Version and Principal Security Epoch snapshots, all seven PostgreSQL Session
Repository operations, a separate Epoch CAS Repository and Operations Persistence Composition.
Strict CAS Rotation increments Session Version by one without extending Absolute Expiry; Touch
is monotonic and bounded. Single/bulk revocation and INSERT/UPDATE, DELETE and TRUNCATE trigger
protection enforce the accepted persistence lifecycle. No Domain secret or new Domain field is added.

Accepted C2 verification: Domain 21 PASS; Session Repository Port 7 PASS; Identity PostgreSQL 11 PASS;
Credential PostgreSQL 8 PASS; Session PostgreSQL 23 PASS; focused total 70/70 PASS. Full Persistence
is 131 PASS / 12 FAIL / 3 SKIPPED. All 12 failed names/files/error summaries individually match the
accepted source baseline and are `PROVEN PRE-EXISTING — SOURCE BASELINE`; the comparison shares the
existing dependency tree and is not an independent dependency reconstruction. Migration 0037 -> 0038
and fresh install succeeded; formal rerun retains the identical 39 Journal rows. Production TypeScript,
Active Backend Test TypeScript, changed-file ESLint, Prettier, Build and Migration Check pass. No new
full lint verification was completed; the historical 458 errors lack a clean parent comparison.
These are retained C2 results, not tests or database operations performed by C2-E2.

Migration Role / Runtime Role are not separated; Compose uses the same `DATABASE_URL` for Migration
and API, and database administration can bypass ordinary triggers. MFA Runtime is not implemented;
`mfa_verified_at` has no Step-up update interface. The 12 source-baseline failures and 3 skips remain
open. Concurrency tests demonstrate exercised schedules, not a formal proof for all schedules.
C2 excludes login, Session Credential issuance/verification Runtime, Cookie and BFF. Persistence
acceptance is not production security certification. Unfrozen Founder Session policies in Section 5.2
remain unresolved; technical and evidence details are recorded in the Persistence Baseline, Section 3.3.

## 6. Current implementation and excluded runtime

The current Operations implementation values are:

```text
OPERATIONS_HUMAN_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED
OPERATIONS_ACCOUNT_PERSISTENCE = IMPLEMENTED / ACCEPTED
SERVICE_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED
OPERATIONS_SESSION_DOMAIN_CONTRACT = ACCEPTED
OPERATIONS_SESSION_REPOSITORY_PORT = ACCEPTED
OPERATIONS_SESSION_PERSISTENCE = ACCEPTED
OPERATIONS_SESSION_AUTH_RUNTIME = NOT IMPLEMENTED
OPERATIONS_AUTH_RUNTIME = NOT IMPLEMENTED
OPERATIONS_AUTHENTICATION = NOT IMPLEMENTED
OPERATIONS_SESSION_RUNTIME = NOT IMPLEMENTED
OPERATIONS_BFF = NOT IMPLEMENTED
OPERATIONS_PERMISSION_ENFORCEMENT = NOT IMPLEMENTED
OPERATIONS_PROVIDER_SYSTEM_RUNTIME_MIGRATION = NOT IMPLEMENTED
OPERATIONS_ADMIN_API_INTEGRATION = NOT IMPLEMENTED
```

PCI-ENG-016-B adds only bounded Credential persistence; no Session, MFA factor, Role or Permission
was created or assigned by that historical unit. C2 separately accepts Session persistence only,
without issuing a Session Credential or creating a real Operations Principal/Account. No Cookie, BFF,
MFA, CSRF, mTLS, API route, Actor runtime, Webhook, Catalog,
Commercial Pilot, Paid Commerce or Admin Web behavior was changed. Credential persistence acceptance
does not authorize Operations Authentication Runtime.

## 7. Dependencies and remaining decisions

Session persistence and the C1 PostgreSQL Adapter are accepted in C2; they are no longer an
unimplemented follow-on. New implementation still requires a separately authorized named unit:

1. Operations authentication and the canonical opaque Session Credential runtime;
2. BFF and Shared API trust boundary;
3. Permission registry and enforcement;
4. Provider/System runtime Actor migration;
5. transactional and proposed append-only audit implementation;
6. read-only Admin integration, followed by any separately approved Catalog mutation integration.

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

The original PCI-ENG-015-A implementation commit is `e2acf7b` (`feat: add operations identity domain contract
(PCI-ENG-015-A)`). Documentation synchronization is a separate change unit and does not imply
runtime or product authorization.
