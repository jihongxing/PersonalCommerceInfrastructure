# 122 - Operations Identity Domain Contract

> **Decision:** `PCI-ENG-014_ARCHITECTURE = APPROVED`
> **Implementation unit:** `PCI-ENG-015-A_DOMAIN_CONTRACT = ACCEPTED`
> **Session contract follow-on:** `PCI-ENG-016-C0 = ACCEPTED`; `PCI-ENG-016-C1 = ACCEPTED`; `PCI-ENG-016-C1-E2 = ACCEPTED`
> **Persistence follow-on:** `PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED`; `PCI-ENG-016-B_CREDENTIAL_PERSISTENCE = ACCEPTED`
> **Effective date:** 2026-11-12
> **Session persistence follow-on:** `PCI-ENG-016-C2 = ACCEPTED`; `PCI-ENG-016-C2-E2 = ACCEPTED`
> **Acceptance ledger update:** 2026-11-13 — PCI-ENG-017-B-E2
> **Terminal integrity acceptance:** `PCI-ENG-017-B = ACCEPTED`; `PCI-ENG-017-B-E2 = ACCEPTED` (UPDATE/DELETE only)
> **Scope:** pure Human Operations and Machine Service Principal domain contracts only
> **Lifecycle contract update:** 2026-11-13 — PCI-ENG-017-C0 ACCEPTED; PCI-ENG-017-C1 IMPLEMENTATION COMPLETED / AWAITING MAIN CONTROLLER REVIEW

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

## 5.4 Accepted terminal identity integrity closure

Authority: Main Controller's explicit PCI-ENG-017-B-E2 instruction, dated 2026-11-13. It accepts
the existing 017-B delivery and authorizes documentation/Git closure only; E2 changes no Domain,
Repository, Schema, Migration or test logic and reruns no Migration or PostgreSQL tests.

```text
PCI-ENG-017-A = ACCEPTED_READ_ONLY_ASSESSMENT
PCI-ENG-017-B = ACCEPTED
PCI-ENG-017-B-E2 = ACCEPTED
OPERATIONS_TERMINAL_STATE_UPDATE_PROTECTION = ACCEPTED
OPERATIONS_TERMINAL_STATE_DELETE_PROTECTION = ACCEPTED
```

The irreversible terminal states are Human Principal `tombstoned`, Operations Account `revoked`
and Service Principal `revoked`, covering both Provider and Platform System. After terminal entry,
every field/status UPDATE, including no-op updates and intermediate-state reactivation, is rejected;
terminal rows cannot be deleted. The transition into terminal itself remains allowed. Nonterminal
Principal/Service suspended or disabled and Account locked or disabled recovery remains unchanged.

The existing Domain entity shapes and enums are unchanged. Repository status setters read current
state under a row lock in the same update transaction; Migration 0039 independently protects ordinary
SQL UPDATE/DELETE. Drizzle Snapshot v7 does not encode these triggers; the versioned SQL and actual
PostgreSQL verification are their evidence. No Credential or Session lifecycle contract is expanded.

Retained accepted verification: focused and Operations regressions 107/107 PASS; full Persistence
168 PASS / 12 FAIL / 3 SKIPPED. The same 12 failed names/files/error summaries match accepted
source-baseline evidence, with no new failures or prior test-status changes. Classification remains
`PROVEN PRE-EXISTING — SOURCE BASELINE`; the prior source proof shared dependencies without an
independent rebuild. Production TypeScript, Active Backend Test TypeScript, changed-file ESLint,
Prettier, Build and Migration Check PASS. Migration 0039 upgrade, rerun and empty install PASS.
These are retained 017-B results, not new E2 execution or a fully green Persistence claim.

Limits remain explicit: Service Principal TRUNCATE succeeded in the test environment because these
guards cover only UPDATE/DELETE. Principal/Account TRUNCATE is blocked by foreign keys and existing
child-table guards, not its own independent TRUNCATE triggers. Migration/Runtime Roles are not
separated and database administration can bypass triggers. Prior illegal historical restoration has
not been audited. This unit implements no Security Epoch/Session state linkage, Authentication
Runtime, Password Hash/Verify, login, Bootstrap, MFA, RBAC or BFF. Full lint is not newly verified.
No identity creation, permission grant, Pilot, production or real-money authority follows. Section 8
control values remain unchanged. Detailed provenance is in the Persistence Baseline, Section 3.4,
and the original 017-B execution ledger followed by its separate E2 acceptance entry.

## 5.5 PCI-ENG-017-C1 Human lifecycle and security generation contract

Authority: Main Controller's explicit PCI-ENG-017-C1 instruction accepts C0 and freezes the listed
security requirements. C1 adds pure Domain/Application contracts and tests only. It does not change
the already accepted entity definitions, seven Session Port signatures, PostgreSQL adapters or
Migrations 0036-0039. C1 itself is not accepted; C2 and C3 are NOT AUTHORIZED.

Sources: `modules/operations-identity/operations-identity-lifecycle-contract.ts` and
`applications/operations-identity/operations-identity-lifecycle-transactions.ts`. These reuse the
existing Human Principal, Account, Credential Metadata and Session types. No Service Principal
Epoch, Human Account for Service, or second identity model is introduced.

```text
PCI-ENG-017-C0 = ACCEPTED
PCI-ENG-017-C1 = IMPLEMENTATION COMPLETED — AWAITING MAIN CONTROLLER REVIEW
OPERATIONS_LIFECYCLE_TRANSACTION_PERSISTENCE = NOT IMPLEMENTED
PCI-ENG-017-C2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
```

Frozen requirements from C0/C1 authority are distinct from permissive historical setters: departure
from active and recovery into active each consume exactly one expected Principal Epoch; Account
changes consume the owning Principal's Epoch. Terminal entry and its Epoch change are atomic.
Credential Version, Principal Epoch and Session Version remain separate. Counter capacity is the
accepted integer maximum 2147483647; overflow rejects, never resets.
New Application commands and receipts retain the existing branded Epoch and Credential Version
types rather than interchangeable numbers. Existing Domain entities remain unchanged.

### Complete transition matrices

N = nonterminal same-state no-op with matching expected status/Epoch; E = active departure;
R = recovery with authoritative prior-activation history; T = terminal entry; P =
`PENDING_FOUNDER_DECISION`, no executable plan; X = terminal rejection, including no-op.

| Principal current / target | pending | active | suspended | disabled | tombstoned |
| -------------------------- | ------- | ------ | --------- | -------- | ---------- |
| pending                    | N       | R or P | P         | P        | T          |
| active                     | P       | N      | E         | E        | T          |
| suspended                  | P       | R or P | N         | P        | T          |
| disabled                   | P       | R or P | P         | N        | T          |
| tombstoned                 | X       | X      | X         | X        | X          |

| Account current / target | invited | active | locked | disabled | revoked |
| ------------------------ | ------- | ------ | ------ | -------- | ------- |
| invited                  | N       | R or P | P      | P        | T       |
| active                   | P       | N      | E      | E        | T       |
| locked                   | P       | R or P | N      | P        | T       |
| disabled                 | P       | R or P | P      | N        | T       |
| revoked                  | X       | X      | X      | X        | X       |

R is available only for `previously_activated` history read authoritatively inside the future
transaction. `never_activated` and `unknown` produce P. Current state or a nonzero Epoch cannot prove
prior activation: historical creation accepted arbitrary initial Epochs, and old setters allowed
state regression. The command does not contain an activation-history approval field; the future
adapter must supply facts from an approved durable source. Pending/invited with confirmed prior
activation is recovery, not first activation.

First activation's Epoch increment (zero or one) remains PENDING_FOUNDER_DECISION. It has no
executable activation plan in C1. Until approved, pending/invited cannot become active through this
Port and cannot create an eligible Session. This closes the initial reuse window without silently
choosing a Founder policy. After any future first-activation approval, creation must still require
both active parents, current active Password Credential/version, current Epoch and valid expiry.

### Security effects, failure and audit matrix

| Class         | Epoch                                           | Session invalidation                                             | Credential revocation                | Reauthentication        | Audit outcome           |
| ------------- | ----------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------ | ----------------------- | ----------------------- |
| N             | unchanged                                       | none                                                             | none                                 | no new requirement      | no_op                   |
| Principal E/R | +1 CAS                                          | all Principal Sessions                                           | none                                 | required before new use | deactivated / recovered |
| Account E/R   | owning Principal +1 CAS                         | all Account Sessions; all old Principal snapshots logically fail | none                                 | required before new use | deactivated / recovered |
| Principal T   | +1 CAS in terminal transaction                  | all Principal Sessions                                           | active Password Credentials in scope | recovery forbidden      | terminal                |
| Account T     | owning Principal +1 CAS in terminal transaction | all Account Sessions                                             | active Password Credential in scope  | recovery forbidden      | terminal                |
| P             | no writes                                       | no writes                                                        | no writes                            | no activation granted   | policy-pending failure  |
| X             | no writes                                       | no writes                                                        | no writes                            | recovery forbidden      | terminal failure        |

Every allowed operation checks expected current status and expected Principal Epoch, including N.
CAS/status conflict, missing owner, ownership mismatch, terminal state, overflow or invalid metadata
rejects the whole operation. Account lifecycle changes cannot append an Epoch write after its
Principal has become tombstoned; such operations reject. A terminal Principal workflow must finish
all required effects in its own transaction.

Audit context requires operationId, correlationId, bounded reasonCode and occurredAt. Successful
technical audit facts combine target IDs, before/after status and Epoch, effect counts and outcome.
They are engineering audit records, not new canonical product events; no event publishing or audit
store is implemented. Never serialize a Credential command, Verifier or Digest into audit records.
C2 must persist required status/Credential audit facts in the same transaction as their effects.

### Pending Founder policy and implementation boundaries

- FD-C1-01: first-activation Epoch policy; first activation stays blocked pending approval.
- FD-C1-02: authoritative activation-history evidence and treatment of unknown legacy history.
- FD-C1-03: active-to-pending/invited regression; blocked rather than inferred from old setters.
- FD-C1-04: changes between distinct non-active, nonterminal states; blocked pending policy.
- FD-C1-05: privileged Credential recovery while parents are inactive. C1 replacement requires
  active parents; it grants no recovery/reset or administrative bypass.

Temporary suspension/locking does not automatically mean password compromise. Terminal Credential
revocation and scoped Session revocation are explicit C1 contract effects for Main Controller review,
not evidence of database implementation. Password replacement atomically revokes the previous
Credential, creates version+1 and revokes old-version Sessions without an Epoch bump.

Domain/Application tests validate pure plans, eligibility and both ordered outcomes of the fourteen
specified races. They use existing entities and no database, fake lock or scheduling model. They
cannot prove PostgreSQL atomicity, lock acquisition, trigger behavior, runtime privileges or all
possible schedules. C2/C3 constraints and failure taxonomy are recorded in Persistence Baseline 3.5.

## 6. Current implementation and excluded runtime

The current Operations implementation values are:

```text
OPERATIONS_HUMAN_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED
OPERATIONS_ACCOUNT_PERSISTENCE = IMPLEMENTED / ACCEPTED
SERVICE_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED
OPERATIONS_TERMINAL_STATE_UPDATE_PROTECTION = ACCEPTED
OPERATIONS_TERMINAL_STATE_DELETE_PROTECTION = ACCEPTED
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
