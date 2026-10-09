# 27 — Private Self-Service MVP Decision Package

> **Decision package**: `PRIVATE-MVP-SELF-SERVICE-001`
> **Date**: 2026-08-27
> **Authority**: Founder / Main Control
> **Status**: `READY FOR FOUNDER IMPLEMENTATION DECISION`
> **Purpose**: Define the architecture, policy, security gates, and implementation sequence for
> `PRIVATE_PRODUCT_MVP = SELF_SERVICE_COMPLETE_CLOSURE`.
> **Implementation authorization**: This document authorizes no code, API, UI, migration, generator,
> OAuth integration, platform API, or verification runtime by itself.

## 1. Decision Result

```text
PRIVATE-MVP-SELF-SERVICE-001 = COMPLETE
PRIVATE_PRODUCT_MVP = SELF_SERVICE_COMPLETE_CLOSURE
CURRENT_IMPLEMENTATION = READ_ONLY_AND_PARTIAL_SELF_SERVICE_FOUNDATION
```

The target self-service journey is:

```text
Register / Login
        ↓
Account active
        ↓
Idempotently initialize Internal Identity + OWNER AccountIdentityBinding
        ↓
Create Commerce Profile
        ↓
Atomically assign Commerce Reference (C号)
        ↓
Declare External Platform Account
        ↓
Create self-declared OWNER Commerce Relationship
        ↓
View an understandable completed private workspace
```

`SELF_SERVICE_COMPLETE_CLOSURE` means a new authenticated user, without operator-preseeded
commercial facts, can create PCI's internal commercial facts and clearly understand their status.
It does **not** mean PCI has externally verified platform ownership.

## 2. Non-Negotiable Semantic Separation

The implementation must preserve four separate fact classes:

| Fact class                 | Meaning                                                                                   | Authority                             | Must not be rendered as     |
| -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------- |
| User Claim                 | A user says an external account is theirs or related to their Profile.                    | Authenticated user                    | Platform proof              |
| Internal Relationship Fact | PCI durably records that a user made a claim and created an internal relationship record. | PCI system                            | External verification       |
| External Platform Evidence | Evidence received from an approved platform-specific proof mechanism.                     | External platform / approved verifier | A mere user input           |
| Verified Relationship      | A relationship that has passed an approved verification policy using valid evidence.      | PCI verification policy               | Default self-service result |

The following equations are forbidden:

```text
user-entered platformAccountId = platform ownership
SELF_DECLARED = VERIFIED
CommerceRelationship.role = CommerceProfile.ownerIdentityId
Commerce Reference = Internal Identity
External Platform Account = Commerce Profile
```

The existing canonical graph remains:

```text
Authentication Account
        ↓ ACTIVE AccountIdentityBinding
Internal Identity
        ↓ owns
Commerce Profile
        ├── 0..1 immutable Commerce Reference
        └── 0..N Commerce Relationships
                    ↕
             External Platform Account
```

No direct `InternalIdentity → ExternalPlatformAccount` ownership relation is introduced.

## 3. MVP Definition and Two Delivery Levels

### 3.1 Self-Service MVP without External Proof

This is the recommended first self-service implementation.

```text
Identity initialization = automated and idempotent
Profile creation = self-service
Commerce Reference assignment = automated and atomic
External Platform Account = user-declared internal record
Commerce Relationship = self-declared, initially PROPOSED
Verified label = unavailable
```

It delivers a complete internal PCI workflow while honestly preserving the absence of platform
evidence. The completed desk must show both `Relationship status: Proposed` and
`Provenance: Self-declared`.

### 3.2 Self-Service MVP with External Proof

This version additionally permits a relationship to become externally verified after an approved
platform-specific evidence path.

```text
External evidence acquisition = platform-specific
Evidence validation = approved verification runtime
Relationship provenance = PLATFORM_VERIFIED
Relationship lifecycle transition = PROPOSED → VERIFIED → ACTIVE
```

This requires a separate Founder decision. OAuth is one possible evidence acquisition mechanism,
not the definition of verification and not automatically required by the first self-service MVP.

### 3.3 Recommendation

```text
SELF_SERVICE_MVP_RECOMMENDATION = WITHOUT_EXTERNAL_PROOF_FIRST
```

Reasoning:

| Dimension            | Self-declared first                            | External proof first                                        |
| -------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Truthfulness         | Honest when visibly labelled                   | Honest only if evidence policy is complete                  |
| Security             | No false ownership claim if labels are correct | Depends on provider, token, callback, and evidence controls |
| User experience      | Immediate and platform-neutral                 | Fragmented by platform availability                         |
| Platform dependency  | None                                           | High                                                        |
| Implementation scope | Internal capability only                       | OAuth/API/challenge runtimes and credential security        |
| Launch risk          | Bounded to internal claims                     | High and provider-specific                                  |

The first version must never market `SELF_DECLARED` as ownership verification.

## 4. Account-to-Identity Onboarding Policy

### 4.1 Policy

```text
ACCOUNT_IDENTITY_SELF_SERVICE_POLICY
FIRST_AUTHENTICATED_ACCOUNT_WITHOUT_ACTIVE_BINDING
        → create one Internal Identity
        → create one ACTIVE OWNER AccountIdentityBinding
        → return the resolved Identity
```

The flow is permitted only through a dedicated security-controlled application command. It is not
implemented by a client-supplied `identityId`, email match, platform handle, or arbitrary binding
request.

### 4.2 Atomicity and Idempotency Requirements

1. The command uses the authenticated Account from server-side auth context only.
2. It must be transactionally atomic: either Identity and ACTIVE OWNER binding both exist, or neither
   exists.
3. Repeated requests for the same Account return the same active binding and Identity.
4. A concurrent first-login race must resolve to one active binding, not two Identities.
5. If a valid active binding already exists, no replacement, transfer, or new Identity is created.
6. If the active binding is missing, suspended, or revoked, the result fails closed unless a later
   separately approved recovery policy applies.

### 4.3 UX

The authenticated desk must make the first next action explicit:

```text
Welcome
→ Your PCI Identity is ready
→ Create your first Commerce Profile
```

An implementation must preserve `1 Internal Identity → N Commerce Profiles`; onboarding creates
neither an implicit single permanent Profile nor a Profile-owner editing capability.

## 5. Commerce Profile and C号 Self-Service Policy

### 5.1 Policy Name

```text
COMMERCE-REFERENCE-SELF-SERVICE-POLICY
```

### 5.2 Options Assessed

| Option                            | Outcome                                                                              | Decision                                              |
| --------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| A. System-generated reference     | CSPRNG candidate, canonical validation, durable uniqueness, retry, atomic assignment | **Recommended**                                       |
| B. User-selected reference        | Squatting, moderation, availability probing, collision UX, irreversible typo risk    | Rejected                                              |
| C. Operator-controlled assignment | Accurate control but breaks self-service closure and creates manual dependency       | Retained only as exceptional future operations policy |

### 5.3 Frozen Assignment Rules

```text
WHO_GENERATES = PCI server-side assignment service only
WHEN = inside initial Commerce Profile creation transaction
USER_CHOICE = NOT ALLOWED
REGENERATION = NOT ALLOWED
REASSIGNMENT = NOT ALLOWED
RELEASE = NOT ALLOWED
DELETE = NOT ALLOWED
REUSE = NEVER
```

The generated stored canonical value must retain the frozen contract:

```text
length = 18
alphabet = 3479ACDEFHJKMNPQRTVWXY
canonical = uppercase ASCII only
display = 6-6-6 grouping only
example canonical = 3C7M4Q9RDFHJKNTWVY
example display = 3C7M4Q-9RDFHJ-KNTWVY
```

### 5.4 Transaction Contract

The future Profile-creation use case must create Profile and assign its Reference in one durable
transaction:

```text
create Profile
        +
generate candidate with CSPRNG
        +
canonical domain validation
        +
database UNIQUE enforcement
        +
atomic reference assignment
        =
one success or no Profile
```

If generation, validation, persistence, or assignment fails, Profile creation must fail as a whole.
There must be no successful self-service Profile that was expected to receive a Reference but was
left in an accidental half-created state.

Collision policy:

1. Generate a new CSPRNG candidate after a unique-conflict result.
2. Retry only a bounded number of times.
3. Never reveal collision candidates to the client.
4. If the bounded retry budget is exhausted, fail safely with a generic retryable error; do not
   create a partial Profile and do not fall back to user selection.
5. The database unique constraint remains authoritative under concurrency.

### 5.5 Archive Policy

When an assigned Profile is archived, its Reference must be permanently reserved according to the
existing domain contract:

```text
ASSIGNED → PERMANENTLY_RESERVED
```

The reference never moves to another Profile and is never reused. Archive does not physically
delete the Profile or Reference.

### 5.6 Existing Profiles without a Reference

This decision targets a **new** self-service Profile. It does not silently assign references to
already existing `NOT_ASSIGNED` Profiles. Any remediation for historic Profiles requires a
separate, explicit rollout policy that preserves immutable and never-reuse semantics.

## 6. External Platform Account Self-Service Policy

### 6.1 Policy Name

```text
EXTERNAL-ACCOUNT-PROVENANCE-POLICY
```

### 6.2 Options Assessed

| Option                                      | What it establishes                                                | First-MVP decision     |
| ------------------------------------------- | ------------------------------------------------------------------ | ---------------------- |
| A. Manual platform account identifier entry | User claim only                                                    | **Approved candidate** |
| B. OAuth                                    | Authorization/evidence only if provider data and policy support it | Future decision        |
| C. Platform API lookup                      | Provider data only; not automatically ownership proof              | Future decision        |
| D. OAuth plus Platform API                  | Potential evidence path, provider-specific                         | Future decision        |

The minimal self-service input is:

```text
platform
platformAccountId
```

For this policy, the required provenance terms mean:

| Term                | Applies to                                        | Meaning                                                                                       |
| ------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `USER_DECLARED`     | Account intake and the initial Relationship claim | The authenticated user supplied the identifier and asserted the commercial connection.        |
| `PLATFORM_VERIFIED` | Relationship evidence only                        | An approved verifier has confirmed evidence for a particular account-to-Profile relationship. |

`PLATFORM_VERIFIED` must **not** be stored or presented as a generic property of an External
Platform Account. The same Account can have historical Relationships, and external-account
existence alone proves neither the current claimant nor a Profile relationship. The first
self-service Account intake is therefore always `USER_DECLARED`; any future verification result is
attached to the relevant Relationship evidence and provenance policy.

It creates an internal External Platform Account fact only after canonical platform/identifier
validation and database enforcement of the existing `(platform, platformAccountId)` uniqueness.
It must not persist credentials, authorization codes, access tokens, refresh tokens, provider
secrets, sessions, or platform responses.

### 6.3 Duplicate and Privacy Policy

`(platform, platformAccountId)` is globally canonical. A duplicate submission must not disclose
whether another user, Profile, or Relationship already exists.

```text
same authenticated flow + same Profile relationship = idempotent return of own existing state
different or unknown scope = generic non-disclosing conflict
```

The service must not attach an existing Account to a new Profile merely because the user submits
the same identifier.

### 6.4 Presentation Rules

For manual creation, the UI must say:

```text
Platform account declared by you
```

It must not say:

```text
Verified account
Official platform identity
Platform-owned account
```

## 7. Commerce Relationship Provenance Policy

### 7.1 Policy Name

```text
COMMERCE-RELATIONSHIP-PROVENANCE-POLICY
```

### 7.2 Required Provenance Model

The current Relationship lifecycle does not encode provenance. A future implementation must add an
explicit, immutable creation provenance fact rather than overload `lifecycle` or use `VERIFIED` as
a default.

Minimum proposed values:

```text
SELF_DECLARED
PLATFORM_VERIFIED
```

Optional future values may only be introduced by a later decision package, for example
`OPERATOR_ATTESTED`. They are not approved by this document.

`SELF_DECLARED` means the authenticated user made the declaration. It does not establish that the
external platform recognizes, controls, or verifies the Account.

`PLATFORM_VERIFIED` means an approved verification runtime has validated durable external evidence
under an explicit provider policy. It must never be client-selectable.

### 7.3 Self-Service Creation Contract

For first-MVP onboarding:

```text
select owned Commerce Profile
        +
declare platform / platformAccountId
        +
create external account fact if absent
        +
create Commerce Relationship
        +
role = OWNER
        +
provenance = SELF_DECLARED
        +
lifecycle = PROPOSED
```

`MANAGER` and `DELEGATED_MANAGER` are not opened in initial self-service onboarding. They require
a future delegation policy because they assert a materially different commercial authority.

The new relationship must retain the existing target immutability, history retention, and
maximum-one-`ACTIVE`-relationship-per-External-Platform-Account invariant.

### 7.4 Lifecycle and Authority

```text
SELF_DECLARED / PROPOSED
        → may be shown as “Declared — awaiting verification”

PLATFORM_VERIFIED / VERIFIED
        → requires approved external evidence

PLATFORM_VERIFIED / ACTIVE
        → requires approved transition policy and existing active uniqueness enforcement
```

The future verification runtime decides whether a self-declared `PROPOSED` relationship can become
`VERIFIED`; ordinary user input cannot do so.

Self-service revocation, unbind, reassignment, profile movement, role change, and deletion are
not authorized by this design. Any future withdrawal or dispute handling must preserve history
and be separately designed; it must not rewrite the original claim.

### 7.5 Verification Failure and Unavailability

| Condition                                | Required behavior                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Verification unavailable                 | Retain accurate `SELF_DECLARED` / `PROPOSED` state; do not imply retry completed                   |
| Verification fails                       | Record only an approved failure/dispute fact in a future verification design; do not promote state |
| Another active relationship exists       | Fail closed and do not disclose the target Profile or claimant                                     |
| Submitted Profile is foreign or archived | Deny before Account/Relationship mutation                                                          |
| User seeks a verified label              | Explain that verification is unavailable; do not route to OAuth or a platform login                |

## 8. Completed Private Workspace

The final private desk must teach the user the data model without exposing internals:

```text
My PCI Identity
        ↓ owns
My Commerce Profile
        ↓ has
My C号: canonical value and formatted display value
        ↓ has declared relationship with
Instagram Account: 12345
Role: Owner
Relationship status: Proposed
Provenance: Self-declared
```

The following semantic labels are required:

| Surface          | Correct framing                   | Incorrect framing                     |
| ---------------- | --------------------------------- | ------------------------------------- |
| Identity         | My PCI Identity                   | My platform identity                  |
| Profile          | My Commerce Profile               | My login account                      |
| C号              | This Profile's Commerce Reference | My Identity ID                        |
| External account | Instagram Account                 | Verified Instagram Identity           |
| Relationship     | Relationship to this Profile      | Profile ownership                     |
| Provenance       | Self-declared / Platform verified | Verified, when only user input exists |

Navigation must be intentional:

```text
Identity → Profiles → Profile C号 → Declared accounts / relationships → status and provenance
```

The desk must keep valid empty and error states intelligible; it must not render five unrelated
pages or force users to infer missing facts from raw identifiers.

## 9. Failure-State and Idempotency Matrix

| Condition                                              | Safe result                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Account already has active binding                     | Return current Identity; no second Identity                                                                   |
| No active binding after failed initialization          | Fail closed; do not accept client Identity selection                                                          |
| Profile archived                                       | Cannot create a new relationship against it; no implicit reactivation                                         |
| C号 generation failure                                 | Abort Profile transaction; return retryable generic error                                                     |
| C号 collision                                          | Server-side bounded regeneration retry; database uniqueness remains final guard                               |
| Duplicate platform account identifier                  | Idempotent own result only, otherwise non-disclosing conflict                                                 |
| Duplicate relationship request                         | Idempotent own pending relationship only; never create duplicate history blindly                              |
| Existing active account relationship                   | Fail closed without leaking foreign Profile identity                                                          |
| Verification unavailable                               | Retain declared/pending state; no OAuth fallback                                                              |
| Platform account suspended/revoked                     | Present lifecycle accurately; do not claim verification or change ownership                                   |
| Client sends identity/profile/account/relationship IDs | Server uses current Account → active binding → Identity for authorization; supplied IDs remain selectors only |

## 10. Authorization Requirements

Every self-service mutation must independently enforce:

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Current Internal Identity
        ↓
Owned Commerce Profile
        ↓
Requested account / relationship operation
```

Required protections:

1. `identityId`, `ownerIdentityId`, `accountId`, `profileId`, and `relationshipId` are never trusted
   as authorization subjects.
2. Profile owner, Profile ID, C号, Reference assignment target, Relationship target, and
   provenance are server-controlled canonical facts.
3. New self-service External Account / Relationship creation must be atomically scoped to an owned
   Profile, so a failed authorization cannot leave an orphan or cross-user durable fact.
4. Object-level authorization must be repeated for subsequent read, mutation, and lifecycle paths.
5. A future verified transition requires both current private authorization and approved verifier
   authority; user authorization alone is insufficient.

## 11. Security Gates

| Gate                                                                                               | Required before                           |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Transactional and idempotent Account → Identity initializer                                        | Self-service onboarding implementation    |
| CSPRNG, canonical validation, unique constraint, collision retry, atomic Profile + C号 transaction | C号 self-service implementation           |
| Non-disclosing duplicate-account and active-relationship conflict behavior                         | External Account / Relationship creation  |
| Explicit immutable provenance model and UI labels                                                  | Self-declared relationship implementation |
| IDOR, horizontal escalation, concurrency, retry, and protected-field tests                         | Any mutation surface                      |
| Real PostgreSQL integration for each new write flow                                                | Implementation completion                 |
| Authenticated browser journey against real private API / PostgreSQL                                | Self-service pilot readiness              |
| Session, CSRF, brute-force, rate-limit, and credential-security review                             | Public exposure or meaningful pilot scale |
| Provider evidence policy, credential security, callback integrity, and dispute handling            | Platform verification or OAuth decision   |

## 12. Founder Decision Classification

### 12.1 Approved Now — Architecture Direction Only

```text
PRIVATE_PRODUCT_MVP = SELF_SERVICE_COMPLETE_CLOSURE
ACCOUNT_TO_IDENTITY = automatic initialization if atomic and idempotent
PROFILE_TO_REFERENCE = automatic C号 assignment inside Profile creation transaction
C号 user selection = NOT AUTHORIZED
REFERENCE regenerate/reassign/release/delete = NOT AUTHORIZED
EXTERNAL_ACCOUNT = may be self-declared if visibly unverified
RELATIONSHIP = may be self-declared if provenance is explicit and immutable
INITIAL_SELF_SERVICE_ROLE = OWNER only
VERIFIED = never a default self-service result
```

### 12.2 Implementation Status

The Account-to-Identity onboarding package is implemented:

```text
SELF-SERVICE-ONBOARDING-IMPLEMENTATION-DECISION
SELF-SERVICE-ONBOARDING = IMPLEMENTED
COMMERCE-REFERENCE-GENERATION-IMPLEMENTATION-DECISION
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-IMPLEMENTATION-DECISION
```

The implemented onboarding scope is limited to authenticated Account → one ACTIVE Internal
Identity → one ACTIVE OWNER binding. It is transactional, idempotent, concurrency-safe through
the existing active-account uniqueness constraint, and does not create Profiles, Commerce
References, External Platform Accounts, or Relationships.

The Commerce Reference implementation is now complete for new self-service Commerce Profiles:

```text
COMMERCE-REFERENCE-GENERATION-IMPLEMENTATION-DECISION
COMMERCE-REFERENCE-GENERATION = IMPLEMENTED
```

New Profile creation resolves the current Identity from the authenticated Account, generates one
server-side canonical C号 using the approved CSPRNG alphabet and length, and persists the Profile
and ASSIGNED Commerce Reference in one bounded-retry transaction. Users cannot choose, regenerate,
reassign, release, or otherwise mutate the generated C号. This does not create External Platform
Accounts or Relationships and does not remediate historical Profiles without References.

The self-declared External Account / Relationship architecture decision is now complete:

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-DECISION-001 = COMPLETE
SELF_SERVICE_EXTERNAL_RELATIONSHIP_MODEL = COMPOSITE_COMMAND
COMPOSITE_COMMAND_IMPLEMENTATION = NOT STARTED
```

The approved model uses one explicit user intent and one application transaction:

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Current Internal Identity
        ↓
Owned Commerce Profile
        ↓
CreateMySelfDeclaredExternalRelationship
        ├── create or reuse External Platform Account
        └── create Commerce Relationship
```

The command input is limited to `platform`, `platformAccountId`, and the selected
`commerceProfileId`. Identity, Account, owner, role, lifecycle, provenance, and verification
authority are server-controlled. The command must persist the External Platform Account and
Relationship as separate durable facts in the same transaction. A newly created External Account
must roll back when Relationship creation fails; an existing External Account must remain intact.

The approved model does not add an owner or scope column to `external_platform_accounts`, does not
introduce `InternalIdentity → ExternalPlatformAccount`, and does not create an ownership,
scope, reservation, or allocation table. The current operation's authenticated Account,
active Identity binding, owned Profile, and explicit Relationship intent provide the authorization
boundary. Existing global External Account uniqueness, duplicate privacy, Relationship target
immutability, and active-Relationship database invariants remain authoritative.

The first self-service Relationship is fixed to:

```text
role = OWNER
provenance = SELF_DECLARED
lifecycle = PROPOSED
PLATFORM_VERIFIED = FUTURE ONLY
```

No client field may select or promote these values. OAuth, Platform API, verification runtime,
credential persistence, Relationship mutation, Manager roles, and public surfaces remain outside
this decision.

### 12.3 Approved Composite Self-Service Decision

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-DECISION-001 = IMPLEMENTED
SELF_SERVICE_EXTERNAL_RELATIONSHIP_MODEL = OPTION_A
COMPOSITE_COMMAND = APPROVED_FOR_NEXT_IMPLEMENTATION
EXTERNAL_PLATFORM_ACCOUNT_OWNERSHIP_FIELD = NOT INTRODUCED
INTERNAL_IDENTITY_TO_EXTERNAL_ACCOUNT_RELATION = NOT INTRODUCED
```

The implementation package must add only the minimum application, transport, UI, provenance
persistence, and PostgreSQL verification needed for this composite command. It must not implement
any verification or external-platform evidence path.

### 12.4 Future Decision

```text
OAUTH-MVP-DECISION
PLATFORM-VERIFICATION-DECISION
PLATFORM-API-EVIDENCE-DECISION
OPERATOR-ATTESTATION-DECISION
RELATIONSHIP-WITHDRAWAL-AND-DISPUTE-DECISION
MANAGER_AND_DELEGATED_MANAGER_SELF_SERVICE_POLICY
HISTORIC_PROFILE_REFERENCE_REMEDIATION_POLICY
```

### 12.5 Not Authorized

```text
SURFACE-006 = NOT STARTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
PUBLIC_PROFILE = NOT AUTHORIZED
QR = NOT AUTHORIZED
OAUTH = NOT AUTHORIZED
EXTERNAL_PLATFORM_BINDING = NOT AUTHORIZED
EXTERNAL_PLATFORM_VERIFICATION = NOT AUTHORIZED
PLATFORM_API = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
PAYMENT = NOT AUTHORIZED
SETTLEMENT = NOT AUTHORIZED
REFUND = NOT AUTHORIZED
MARKETPLACE = NOT AUTHORIZED
CRM = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
```

## 13. Implementation Sequence

The required order prevents half-created facts and semantic overclaiming:

1. **Onboarding foundation** — transactional, idempotent automatic Identity + OWNER binding
   initialization, with fail-closed recovery behavior.
2. **C号 generation foundation** — server-only CSPRNG generator, canonical validation,
   persistence uniqueness, collision policy, and atomic Profile + Reference transaction.
3. **Profile onboarding UX** — make the resolved Identity, first Profile, and automatic assigned
   C号 understandable without allowing canonical field edits.
4. **Declared account/relationship model** — introduce explicit immutable provenance only if
   separately authorized; preserve current lifecycle and historical invariants.
5. **Self-declared creation flow** — owned Profile selection, platform account input, OWNER-only
   `SELF_DECLARED` / `PROPOSED` Relationship creation, duplicate privacy behavior, and read UI.
6. **Pilot validation** — complete authenticated browser journey through real private API and
   PostgreSQL; verify all failure, IDOR, and concurrency cases.
7. **Optional external proof** — only after a separate OAuth/platform-evidence/verification
   decision. It is not a prerequisite for truthful self-declared self-service closure.

## 14. Pilot Readiness Preconditions

`SELF_SERVICE_COMPLETE_CLOSURE` may be declared ready for pilot only when:

```text
new Account → Identity initialization = real PostgreSQL VERIFIED
Profile + automatic C号 assignment = real PostgreSQL VERIFIED
declared Account + declared Relationship = real PostgreSQL VERIFIED
authenticated browser full journey = VERIFIED
all self-declared states are visibly labelled and never called verified
IDOR / horizontal escalation / duplicate privacy / concurrency = PASS
public boundary remains closed
```

Until then:

```text
PRIVATE_PRODUCT_MVP = SELF_SERVICE_COMPLETE_CLOSURE (TARGET ARCHITECTURE)
SELF_SERVICE_PILOT_READY = NOT YET VERIFIED
```

### 15.1 Acceptance-003 Status

`SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-003` completed the Founder-approved
local real PostgreSQL acceptance path. Identity onboarding, Profile plus automatic C号 assignment,
External Platform Account creation, SELF_DECLARED / PROPOSED OWNER Relationship behavior,
transactionality, idempotency, duplicate privacy, IDOR, horizontal escalation, concurrency, and
provenance semantics have PostgreSQL or focused private API evidence. The public boundary remains
closed and no unauthorized product capability was introduced.

The task remains blocked because the authenticated browser full journey is not verified. The real
browser configuration is missing a dedicated non-production Supabase URL, anon key, acceptance email,
and acceptance password. Fixture-backed browser tests are not accepted as evidence for this gate.

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-003 = BLOCKED
REAL_POSTGRES_INTEGRATION = PASS
AUTHENTICATED_BROWSER_FULL_JOURNEY = NOT_VERIFIED
SELF_SERVICE_PILOT_READY = NOT YET VERIFIED
COMMITTED = NO
```

## 15. Compatibility and Hard Stop

```text
SURFACE-001 THROUGH SURFACE-005 = PRESERVED
RUNTIME-001 THROUGH RUNTIME-007 = PRESERVED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMITTED = NO
```

This package stops after architecture and Founder decision preparation. It does not implement
C号 generation, external account creation, relationship creation, OAuth, verification, public
product, resolver, QR, event/outbox, payment, settlement, refund, marketplace, CRM, or real money.

### 12.4 Self-Declared External Relationship Implementation

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-IMPLEMENTATION-002 = BLOCKED
SELF_SERVICE_EXTERNAL_RELATIONSHIP_MODEL = COMPOSITE_COMMAND
```

The private self-service endpoint and workspace contain one composite command: the authenticated
Account resolves through its active Identity binding to an owned Commerce Profile, then creates or
reuses an External Platform Account and creates the OWNER / SELF_DECLARED / PROPOSED Relationship
in one Unit of Work transaction. External Platform Accounts retain no Identity or Account ownership
field; the Relationship remains the authorization boundary. The command is idempotent for the same
platform, platform account identifier, and Profile, uses database uniqueness for concurrent requests,
and does not expose foreign-account existence.

Historical Relationship provenance is represented as `UNKNOWN` when it cannot be established; no
historical record is inferred to be verified. `PLATFORM_VERIFIED` remains future-only and cannot be
produced by this implementation. OAuth, Platform API, verification, credentials, Manager roles,
and public surfaces remain outside scope.

### 12.5 Acceptance-004 Closure Evidence

`SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-004` completed the remaining real
authenticated browser acceptance blocker. The run used dedicated non-production Supabase Auth,
the real private API, and the Founder-approved local Podman PostgreSQL acceptance database.
Credentials, keys, user identifiers, and tokens are not recorded.

```text
SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-004 = COMPLETE
REAL_POSTGRES_INTEGRATION = PASS
AUTHENTICATED_BROWSER_FULL_JOURNEY = PASS
IDENTITY_ONBOARDING = PASS
PROFILE_PLUS_C号 = PASS
EXTERNAL_ACCOUNT = PASS
SELF_DECLARED_RELATIONSHIP = PASS
TRANSACTIONALITY = PASS
IDEMPOTENCY = PASS
DUPLICATE_PRIVACY = PASS
IDOR = PASS
HORIZONTAL_ESCALATION = PASS
CONCURRENCY = PASS
PROVENANCE_SEMANTICS = PASS
PUBLIC_BOUNDARY = PRESERVED
NO_UNAUTHORIZED_EXPANSION = PASS
SELF_SERVICE_COMPLETE_CLOSURE = READY_FOR_PILOT
```

The real `system-edge` browser run passed all three tests: session login/restore/sign-out,
unauthenticated management rejection, and the complete private self-service commerce closure.
The closure verified server-generated C号 display and durable OWNER / PROPOSED /
SELF_DECLARED Relationship visibility. Self-declared state was not presented as verified.

`ENGINEERING_PREFLIGHT = FAIL` remains separate from product acceptance because the repository has
pre-existing broad Prettier issues in 42 files and an unrelated Surface-005 fixture regression.
Neither issue is an Acceptance-004 product blocker. No product capability beyond the frozen Private
Self-Service MVP was enabled.
