# 23 — Stage 2 Runtime Entry Decision Package

> **状态**：`READY_FOR_FOUNDER_DECISION`
>
> **决策包编号**：`PCI-STAGE2-RUNTIME-ENTRY-001`
>
> **日期**：2026-08-26
>
> **权威**：Main Control / Founder
>
> **性质**：Runtime Transition Architecture / Founder Decision Preparation
>
> **实现授权**：本文件不授权 Runtime、schema、migration、repository、API 或 integration 实现。

## 1. Purpose and Authority

本文件将已完成的 Stage 2 Identity Foundation 从纯领域合同进入 Durable Runtime 的问题，
整理为 Founder 可逐项 `APPROVE`、`MODIFY` 或 `REJECT` 的决策包。

```text
Domain Truth
    ↓
Durable Truth
    ↓
Application Runtime
```

本文件基于当前 SSOT、`STAGE2-DECISION-001` 至 `009` 的已批准结果，以及
`modules/identity-infrastructure/*` 的完整 domain contracts / graph tests。

```text
IDENTITY-001 = COMPLETE
IDENTITY-002 = COMPLETE
IDENTITY-003 = COMPLETE
PCI-STAGE2-CLOSURE-001 = COMPLETE
STAGE_2_CLOSURE = READY
STAGE2_RUNTIME_ENTRY = READY_FOR_FOUNDER_DECISION

VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
STAGE_3 = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

当前工作区中出现的未提交 application、adapter、database schema 与 migration 草稿不属于
本决策包授权范围；它们不是已批准实现、不是已审计 Runtime evidence，也不得被视为本包的
预先结论。

## 2. Canonical Foundation and Principles

唯一 canonical graph：

```text
Authentication Account
        ≠
Internal Identity
        │ owns 1:N
        ▼
Commerce Profile
        ├── 0..1 Commerce Reference
        └── N External Platform Accounts through Commerce Relationships
                     │
                     └── 0..N historical Commerce Relationships
                            └── max 1 ACTIVE per External Platform Account
```

### 2.1 Domain Truth First

Persistence stores and enforces canonical domain semantics. Database schema, ORM shape, legacy
`creatorId`, Authentication Account, or external-platform identifiers must not redefine any
canonical Identity Foundation concept.

### 2.2 Persistence Is Not Runtime Activation

```text
Domain Contract
    ≠ Persistence
    ≠ Application Runtime
    ≠ Private/Internal API
    ≠ Public Exposure
    ≠ External Integration
```

Durable storage alone never authorizes a public Profile, resolver, OAuth flow, external verification
fact, QR runtime, or customer-facing capability.

### 2.3 Durable Invariants Need Defense in Depth

For facts affected by concurrency or future multi-writer access:

```text
domain invariant
    + application transaction
    + database constraint
```

This is enforcement of one canonical model, not a second persistence-defined model.

## 3. Durable Classification Matrix

`Must Persist = Yes` means the fact must be durable when its runtime use case is authorized. It does
not itself authorize creation, API exposure, or public behavior.

| Object                    | Domain Complete | Must Persist                           | Can Be Created in Runtime                               | API Exposed | Public                                 |
| ------------------------- | --------------- | -------------------------------------- | ------------------------------------------------------- | ----------- | -------------------------------------- |
| Internal Identity         | Yes             | Yes                                    | Conditional — private use case after Level 2 approval   | No          | No                                     |
| Commerce Profile          | Yes             | Yes                                    | Conditional — private use case after Level 2 approval   | No          | No                                     |
| Commerce Reference        | Yes             | Yes after assignment                   | Conditional — assignment only after allocation decision | No          | Yes as identifier; no resolver         |
| External Platform Account | Yes             | Yes when registration is authorized    | Conditional — private registration only                 | No          | Conditional / future disclosure policy |
| Commerce Relationship     | Yes             | Yes when binding history is authorized | Conditional — private use case only                     | No          | No                                     |

| Object                    | Durable facts                                                                                 | Remains excluded from canonical storage in this entry                              |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Internal Identity         | ID, lifecycle, creation/update timestamps                                                     | email, phone, location, credential, OAuth token, Account ID as Identity ID         |
| Commerce Profile          | ID, exactly-one owner, lifecycle, presentation, timestamps                                    | multi-owner model, relationship-derived ownership, public resolver state           |
| Commerce Reference        | canonical value, immutable Profile target, lifecycle, timestamps                              | generator sequence, normalization variants, release/reuse state                    |
| External Platform Account | PCI account ID, platform namespace, platform-scoped account identifier, lifecycle, timestamps | globally interpreted platform identifier, OAuth token, verification proof          |
| Commerce Relationship     | ID, account ID, Profile ID, role, lifecycle, effective/creation/update times                  | target/role/effective-time rewriting after history exists, implicit Identity owner |

`endedAt` is a useful future persistence candidate but is not currently part of the canonical
contract. A later task must not silently introduce it through schema design; it requires either
storing current facts only or a narrowly approved contract correction.

## 4. Recommended Persistence Boundary

### 4.1 Repository Ports

**RECOMMENDED:** future persistence work uses narrow aggregate-specific repository ports and
implements port, schema/constraints, targeted persistence tests, and migration together within each
separately approved change unit. Do not introduce a generic repository framework or a single
cross-aggregate “identity repository.”

| Port                                | Minimum responsibilities                                                                | Explicit exclusions                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `InternalIdentityRepository`        | create, get by canonical ID, exists                                                     | credentials, authentication lookup, Account-to-Identity derivation |
| `CommerceProfileRepository`         | create, get by ID, list by owning Identity, persist legal lifecycle/presentation update | owner reassignment, public Profile lookup                          |
| `CommerceReferenceRepository`       | find by Reference/Profile, insert assignment, persist reservation transition            | generator, allocator, release, resolver                            |
| `ExternalPlatformAccountRepository` | create, get by PCI ID, find by `(namespace, identifier)`, persist lifecycle             | OAuth, token storage, platform calls                               |
| `CommerceRelationshipRepository`    | create, list by account, persist legal lifecycle transition transactionally             | broad Relationship / CRM behavior, verification provider           |

`listOwnedCommerceProfiles()` does not require an Identity aggregate to embed Profiles. The durable
query remains a Profile-repository query keyed by `InternalIdentityId`.

### 4.2 Required Durable Invariants

| Fact                      | Recommended durable enforcement                                                | Reason                                  |
| ------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| Internal Identity ID      | primary key / unique canonical ID; no reuse                                    | stable PCI subject root                 |
| Profile ownership         | non-null `owning_identity_id` foreign key; no multi-owner join table           | exactly one owning Identity             |
| Profile lifecycle         | constrained value; no ordinary physical delete path                            | archive is not deletion                 |
| Commerce Reference value  | unique across all retained records, including permanently reserved             | never reuse                             |
| Profile-to-Reference      | unique Profile target across retained assignments                              | `Profile → 0..1 Reference`              |
| Reference immutability    | no ordinary update path for Reference value or target Profile                  | assignment never moves                  |
| External account identity | unique `(platform_namespace, platform_account_identifier)` tuple               | external identifier is namespace-scoped |
| Relationship history      | immutable account/Profile/role/effective facts; lifecycle transition path only | move = close old + create new           |
| Active relationship       | partial/filtered unique constraint for an account where lifecycle is `ACTIVE`  | max one simultaneous active binding     |

The exact database syntax is deliberately not chosen here. If a target database lacks a partial
unique index, implementation must design a transactionally safe equivalent before coding. An
application pre-check alone is insufficient under concurrency.

## 5. Transaction Boundaries

### 5.1 Profile and Commerce Reference

**RECOMMENDED:** `CreateCommerceProfile` and `AssignCommerceReference` remain separate use cases
and separate transactions.

Reason:

- a Profile validly has `0..1` Commerce Reference;
- C号 generation / allocation remains not authorized;
- requiring atomic Profile + C号 creation would make a valid Profile depend on a prohibited
  capability.

When assignment is separately authorized, one transaction must:

```text
validate canonical Reference
→ confirm Profile exists
→ insert immutable assignment
→ enforce unique Reference and unique Profile target
→ commit or roll back as one unit
```

Failure leaves no assignment. A later idempotency design may permit replay of the same request but
must never select, release, substitute, or reuse another C号 autonomously.

### 5.2 Account and Commerce Relationship

**RECOMMENDED:** External Platform Account registration and `PROPOSED` relationship creation may be
separate transactions. Account is a durable platform-scoped fact; a proposed binding is a distinct
historical fact.

Activation must be atomic:

```text
load target relationship
→ validate domain transition
→ inspect account relationships
→ transition lifecycle
→ commit under durable active-relationship constraint
```

A concurrent constraint rejection returns an active-relationship conflict and leaves the records
unchanged. Changing Profile is always old relationship revoke/historical transition plus new
relationship creation; it never updates an existing target Profile.

### 5.3 No Distributed ACID Assumption

Transactions apply only inside a future PCI durable store. They do not assume atomicity with OAuth,
external platforms, QR systems, resolvers, payment processors, or message brokers.

## 6. ID Generation Responsibility

| Value                       | Recommended creation authority                                                   | Repository/database responsibility                    | Prohibited                                                           |
| --------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| `InternalIdentityId`        | future private application use case creates opaque PCI ID before domain creation | persist exactly; reject duplicate                     | derive from Account ID, `creatorId`, email, external account         |
| `CommerceProfileId`         | future private application use case creates opaque PCI ID                        | persist exactly; reject duplicate                     | reuse Identity ID; derive from name/handle                           |
| `ExternalPlatformAccountId` | future private application use case creates opaque PCI ID                        | persist exactly; reject duplicate                     | use platform identifier as PCI ID                                    |
| `CommerceRelationshipId`    | future private application use case creates opaque PCI ID                        | persist exactly; reject duplicate                     | reuse account/Profile/Identity ID                                    |
| `PlatformAccountIdentifier` | platform-scoped input without claiming OAuth verification                        | persist only with namespace; enforce tuple uniqueness | global PCI identity or credential                                    |
| `CommerceReference` / C号   | future approved allocation capability only                                       | strict validation, uniqueness, immutable retention    | generation, allocation, normalization, collision retry in this entry |

Future C号 allocation architecture remains documentation only:

```text
CSPRNG
    → strict canonical validation
    → durable uniqueness attempt
    → bounded collision retry
```

No generator, allocator, collision loop, or schema is authorized by this package.

## 7. Runtime Authorization Levels

| Level | Capability                               | Status after this package   | Boundary                                                      |
| ----- | ---------------------------------------- | --------------------------- | ------------------------------------------------------------- |
| 0     | Domain contracts and graph tests         | COMPLETE                    | existing approved foundation                                  |
| 1     | Durable persistence                      | `FOUNDER DECISION REQUIRED` | repositories + schema/constraints + persistence tests; no API |
| 2     | Private application runtime              | `FOUNDER DECISION REQUIRED` | ordered internal use cases; no public route                   |
| 3     | Private/internal API                     | `NOT AUTHORIZED`            | separate API security/contract decision                       |
| 4     | Public API / Commerce Reference Resolver | `NOT AUTHORIZED`            | Stage 3 decision boundary                                     |
| 5     | OAuth / platform integration             | `NOT AUTHORIZED`            | separate provider, verification, security decision            |
| 6     | Real money                               | `NOT AUTHORIZED`            | outside current Runtime entry                                 |

Level 1 does not imply Level 2. Level 2 does not imply Level 3. Durable storage must never create
an implicit public or externally integrated surface.

## 8. Runtime Entry Matrix

| Capability                    | Domain   | Persistence                          | Runtime                                        | API | Public                             | Stage / Recommendation                                |
| ----------------------------- | -------- | ------------------------------------ | ---------------------------------------------- | --- | ---------------------------------- | ----------------------------------------------------- |
| Internal Identity             | COMPLETE | Recommended Level 1                  | Recommended Level 2 after persistence          | No  | No                                 | Stage 2 candidate                                     |
| Commerce Profile              | COMPLETE | Recommended Level 1                  | Recommended Level 2 after Identity persistence | No  | No                                 | Stage 2 candidate                                     |
| Commerce Reference            | COMPLETE | Recommended Level 1 association only | Assignment after allocation decision only      | No  | identifier may be shown; no lookup | Stage 2 persistence candidate; public runtime Stage 3 |
| External Platform Account     | COMPLETE | Recommended Level 1 after Profile    | Recommended Level 2 private registration       | No  | No / future policy                 | Stage 2 candidate                                     |
| Commerce Relationship         | COMPLETE | Recommended Level 1 after Account    | Recommended Level 2 lifecycle use cases        | No  | No                                 | Stage 2 candidate                                     |
| OAuth                         | N/A      | No                                   | No                                             | No  | No                                 | Future                                                |
| Public Resolver               | N/A      | No                                   | No                                             | No  | Yes                                | Stage 3, prohibited                                   |
| QR Runtime                    | N/A      | No                                   | No                                             | No  | Conditional                        | Future, prohibited                                    |
| Event / Outbox infrastructure | N/A      | No                                   | No                                             | No  | No                                 | Defer                                                 |

## 9. Minimal Application Runtime Proposal

If Level 1 and then Level 2 are independently approved, authorize use cases in this dependency
order and as individually scoped change units:

```text
1. CreateInternalIdentity
2. CreateCommerceProfile
3. AssignCommerceReference
4. RegisterExternalPlatformAccount
5. CreateCommerceRelationship
6. SuspendCommerceRelationship
7. RevokeCommerceRelationship
8. ArchiveCommerceProfile
```

This is a sequence recommendation, not implementation authorization. `AssignCommerceReference`
cannot become a production flow until a separate allocation / issuance decision exists. Relationship
verification must not claim an external proof without a separately approved verification source.

Existing Request, Reservation, Contract, Order, Completion, and Earnings / Wallet Projection
patterns are unchanged. Future commerce subject evolution may reference `CommerceProfileId` only
through an explicit separately approved compatibility/migration boundary.

## 10. Event and Outbox Boundary

**RECOMMENDED:** `NO_EVENT_INFRASTRUCTURE_YET`.

Ordinary transactional repositories and persistence tests are sufficient for initial durable facts.
Do not introduce Kafka, RabbitMQ, Redis, an outbox framework, distributed event bus, or event-sourced
Identity aggregate before an approved downstream consumer identifies delivery semantics, replay
policy, operational ownership, and post-commit reliability needs.

## 11. Founder Decision List

Each decision resolves one core question. `RECOMMENDED` becomes binding only after Founder approval.

### RUNTIME-DECISION-001 — Runtime Layering

| Field       | Content                                                                               |
| ----------- | ------------------------------------------------------------------------------------- |
| Recommended | Approve the Level 0–6 layering, with Level 1 and Level 2 requiring separate approval. |
| Alternative | Approve persistence, runtime, APIs, and external integration as one program.          |
| Impact      | Prevents durable data from silently becoming public or externally connected.          |
| Reason      | These layers have different product, security, and operational consequences.          |

### RUNTIME-DECISION-002 — Durable Persistence Program

| Field       | Content                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recommended | Authorize future Level 1 implementation for canonical facts through narrow repository ports, schema constraints, migrations, and persistence tests in separately scoped change units. |
| Alternative | Keep contracts in memory only, or retain repository interfaces without durable implementation.                                                                                        |
| Impact      | Establishes durable truth without generic infrastructure or public runtime.                                                                                                           |
| Reason      | Ownership, C号 non-reuse, and active relationship uniqueness require durable multi-writer enforcement.                                                                                |

### RUNTIME-DECISION-003 — Identity and Profile Persistence

| Field       | Content                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Recommended | Persist Identity and Profile first; enforce Profile's non-null exactly-one `owningIdentityId`; prohibit ordinary owner reassignment. |
| Alternative | Persist Profile without Identity integrity, or use Authentication Account / `creatorId` as owner key.                                |
| Impact      | Makes the `1 Internal Identity : N Commerce Profiles` graph durable.                                                                 |
| Reason      | Application checks alone cannot protect owner continuity under concurrency.                                                          |

### RUNTIME-DECISION-004 — Commerce Reference Persistence

| Field       | Content                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recommended | Persist immutable Reference-to-Profile association with unique value, unique Profile target, retention after reservation, and no ordinary reassignment/delete path. |
| Alternative | Defer storage or permit reuse after Profile closure.                                                                                                                |
| Impact      | Makes the public C号 promise durable without adding generator, allocator, resolver, or QR.                                                                          |
| Reason      | `ASSIGNED → PERMANENTLY_RESERVED` requires retention and storage-level uniqueness.                                                                                  |

### RUNTIME-DECISION-005 — External Platform Account Persistence

| Field       | Content                                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Recommended | Persist platform accounts using `(platform namespace, platform account identifier)` uniqueness while retaining a separate PCI account ID. |
| Alternative | Treat platform identifier as globally unique or canonical PCI Identity.                                                                   |
| Impact      | Supports multiple accounts and namespaces without external-ID leakage.                                                                    |
| Reason      | A platform identifier has meaning only inside its platform namespace.                                                                     |

### RUNTIME-DECISION-006 — Commerce Relationship History

| Field       | Content                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Recommended | Persist retained binding history and prohibit ordinary mutation of account, Profile, role, effective time, and historical facts. |
| Alternative | Store only a mutable current account-to-Profile pointer.                                                                         |
| Impact      | Preserves role separation, lifecycle facts, and historical binding evidence.                                                     |
| Reason      | Migration is close old + create new, not rewrite history.                                                                        |

### RUNTIME-DECISION-007 — Active Relationship Uniqueness

| Field       | Content                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recommended | Enforce max one `ACTIVE` relationship per account with domain check, application transaction, and partial/filtered database unique constraint or proven equivalent. |
| Alternative | Application pre-check only.                                                                                                                                         |
| Impact      | Prevents concurrent writers from creating two active bindings.                                                                                                      |
| Reason      | Cross-row invariants cannot remain durable through in-memory inspection alone.                                                                                      |

### RUNTIME-DECISION-008 — Transaction Boundaries

| Field       | Content                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recommended | Keep Profile creation separate from Reference assignment; make assignment atomic. Keep account registration separate from proposed relationship; make activation atomic. |
| Alternative | Require Profile + Reference atomically, or use one large account/relationship transaction.                                                                               |
| Impact      | Matches `0..1` Reference cardinality and avoids coupling facts to prohibited allocator/provider capability.                                                              |
| Reason      | C号 allocation and external verification remain unauthorized dependencies.                                                                                               |

### RUNTIME-DECISION-009 — ID Generation Responsibility

| Field       | Content                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Recommended | Future private use cases create opaque PCI IDs; database rejects duplicates; C号 creation stays exclusively in a future approved allocator. |
| Alternative | Use database/legacy/external IDs as canonical identifiers or add C号 generation now.                                                        |
| Impact      | Preserves namespace separation and frozen C号 allocation boundary.                                                                          |
| Reason      | Generation must not collapse semantics or bypass C号 collision/security design.                                                             |

### RUNTIME-DECISION-010 — Application Runtime Activation

| Field       | Content                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Recommended | After each matching persistence unit passes, authorize narrowly ordered private use cases only. |
| Alternative | Build and expose all use cases through API immediately.                                         |
| Impact      | Enables controlled runtime growth without creating a product surface.                           |
| Reason      | Each use case has different prerequisites, especially C号 allocation and verification.          |

### RUNTIME-DECISION-011 — API and VS-01 Postponement

| Field       | Content                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| Recommended | Keep API, OpenAPI, UI, public exposure, VS-01 migration, and compatibility-adapter implementation out of Runtime entry. |
| Alternative | Use persistence to introduce endpoints or map `creatorId` into canonical Identity.                                      |
| Impact      | Protects frozen VS-01 semantics and avoids public-contract churn.                                                       |
| Reason      | Durable storage is not evidence that authorization, privacy, migration, or API contracts are ready.                     |

### RUNTIME-DECISION-012 — OAuth and External Binding Postponement

| Field       | Content                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Recommended | Keep OAuth, provider APIs, ownership verification runtime, automatic discovery, and external binding runtime prohibited. |
| Alternative | Couple account persistence to provider integration.                                                                      |
| Impact      | Allows platform-scoped facts without falsely asserting verification.                                                     |
| Reason      | Provider consent, token, revocation, security, and failure policies require independent decisions.                       |

### RUNTIME-DECISION-013 — Resolver and QR Postponement

| Field       | Content                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Recommended | Keep resolver, `/c/{commerce_reference}`, lookup policy, QR renderer/scanner, tracking, and enumeration mitigation runtime prohibited. |
| Alternative | Treat durable C号 storage as approval for queryable or scannable public service.                                                       |
| Impact      | Keeps public identifier distinct from public runtime.                                                                                  |
| Reason      | Resolver exposure requires separate privacy, abuse, unknown-ID, rate-limit, authorization, and observability decisions.                |

### RUNTIME-DECISION-014 — No Event / Outbox Infrastructure Yet

| Field       | Content                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Recommended | Defer event transport, outbox, and distributed messaging until an approved consumer needs reliable post-commit delivery. |
| Alternative | Build event infrastructure with initial persistence.                                                                     |
| Impact      | Keeps Level 1 small, transactional, and testable.                                                                        |
| Reason      | No authorized runtime integration currently consumes these events.                                                       |

## 12. Proposed Sequence (Not Authorized)

| Phase           | Scope                                                               | Completion evidence before next phase                                                     |
| --------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Runtime Phase A | Internal Identity persistence                                       | repository contract, schema/constraint, targeted persistence tests; no API                |
| Runtime Phase B | Commerce Profile persistence                                        | durable exactly-one owner; list-by-owner query; no VS-01 migration                        |
| Runtime Phase C | Commerce Reference persistence                                      | immutable association, uniqueness, permanent reservation; no generator/allocator/resolver |
| Runtime Phase D | External Platform Account persistence — IMPLEMENTED (`RUNTIME-004`) | namespace-scoped uniqueness; no OAuth/provider API                                        |
| Runtime Phase E | Commerce Relationship persistence — IMPLEMENTED (`RUNTIME-005`)     | retained history, lifecycle persistence, durable max-one-active rule                      |
| Runtime Phase F | Private application orchestration — IMPLEMENTED (`RUNTIME-006`)     | explicit private use cases and narrow transactions; no HTTP/API/UI                        |

```text
RUNTIME-007 = COMPLETE
POSTGRES_APPLICATION_INTEGRATION = VERIFIED
PCI-PROVISION-001 = COMPLETE
```

`PCI-PROVISION-001` defines the non-production PostgreSQL provisioning and preflight criteria.
`RUNTIME-007` was re-entered against a temporary, isolated local PostgreSQL 17 environment:
the real application-to-repository-to-PostgreSQL path, migrations, durable-fact rehydration,
transaction rollback, foreign keys, uniqueness, lifecycle conditional writes, and cleanup were
verified without recording credentials or creating a persistent integration database.

`PCI-STAGE2-RUNTIME-CLOSURE-001` closes the completed private runtime foundation without
authorizing a product surface. The next Founder decision boundary is recorded in
[`24 — Private Product Surface Decision Package`](./24_Private_Product_Surface_Decision_Package.md).

## 13. Explicitly Not Authorized

```text
Commerce Reference Generator = NOT AUTHORIZED
Commerce Reference Allocation = NOT AUTHORIZED
Commerce Reference Public Resolver = NOT AUTHORIZED
QR Runtime / Scanner = NOT AUTHORIZED
OAuth = NOT AUTHORIZED
External Platform API = NOT AUTHORIZED
External Platform Binding / Verification Runtime = NOT AUTHORIZED
Public API / OpenAPI / UI = NOT AUTHORIZED
Enumeration Mitigation Runtime = NOT AUTHORIZED
Payment / Settlement / Refund / Marketplace / CRM = NOT AUTHORIZED
Real Money = NOT AUTHORIZED
```

## 14. Pre-existing Engineering Stability Boundary

```text
PRE-EXISTING ENGINEERING STABILITY ISSUE
    = full Vitest timeout / full Playwright failure / unrelated workspace whitespace,
      where already recorded outside scoped Identity Foundation checks
```

These issues are not evidence against the completed domain contracts and are not remediation scope
for this decision package.

## 15. Founder Approval Form

```text
RUNTIME-DECISION-001 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-002 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-003 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-004 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-005 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-006 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-007 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-008 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-009 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-010 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-011 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-012 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-013 = [APPROVE / MODIFY / REJECT]
RUNTIME-DECISION-014 = [APPROVE / MODIFY / REJECT]

PCI-STAGE2-RUNTIME-ENTRY-001 = READY_FOR_FOUNDER_DECISION
```
