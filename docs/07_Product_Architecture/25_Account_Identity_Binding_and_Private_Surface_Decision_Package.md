# 25 — Account–Identity Binding and Private Product Surface Decision Package

> **Status**: `APPROVED`; `SURFACE-001 = IMPLEMENTED`
> **Decision Package**: `PRIVATE-SURFACE-ENTRY-001`
> **Date**: 2026-08-27
> **Authority**: Main Control / Founder
> **Nature**: Architecture Decision Preparation only
> **Implementation Authorization**: `SURFACE-001 = AUTHORIZED AND IMPLEMENTED`; later private surfaces remain separately authorized

## 1. Purpose and Hard Stop

This package answers two architecture questions:

```text
Authentication Account
        ↓
?
        ↓
Internal Identity
```

and:

```text
Authenticated User
        ↓
Private Product Surface
```

It is not an implementation plan. It authorizes no migration, schema change, runtime binding,
authentication provider, session work, API, UI, OAuth, resolver, QR flow, verification, event,
outbox, payment, or real-money capability.

The current working tree contains uncommitted Stage 2 Identity Foundation implementation
artifacts. This package does not modify, endorse as newly authorized, or expand those artifacts.
The architectural decision below is the gate for any future implementation.

## 2. Current SSOT and Frozen Vocabulary

The following distinction is mandatory:

| Concept | Responsibility | Not responsible for |
| --- | --- | --- |
| Authentication Account | Login, credentials, authentication subject, session association | Durable PCI subject ownership, commercial self-expression |
| Internal Identity | Durable PCI subject root and authorization anchor | Credentials, email, phone, OAuth subject, username, platform handle |
| Commerce Profile | Commercial self-expression owned by an Internal Identity | Login, credentials, canonical Identity replacement |

The current frozen graph remains:

```text
Authentication Account
        ≠
Internal Identity
        │
        └── 1:N Commerce Profiles
                    ├── 0..1 Commerce Reference
                    └── 0..N Commerce Relationships
                              ▲
                              │
                        External Platform Account
```

Already-frozen Identity Foundation invariants are not reopened:

- Identity ID, Profile ID, Profile owner, Commerce Reference, External Account ID, platform
  namespace, and relationship targets are canonical facts, not presentation fields.
- One Internal Identity may own many Commerce Profiles.
- A Commerce Profile has at most one Commerce Reference; a reference is immutable, unique,
  permanently reserved, and never reused.
- External Platform Account identity is immutable and `(platform, platform account id)` is unique.
- Commerce Relationship is a durable historical binding between an External Platform Account and
  a Commerce Profile; relationship history is retained and active uniqueness is domain-controlled.
- Identity, Profile, External Account, and Relationship lifecycles are independent unless an
  explicit approved orchestration says otherwise.

## 3. Account–Identity Binding Recommendation

### 3.1 Canonical relationship

The recommended relationship is:

```text
Authentication Account
        │
        │ AccountIdentityBinding
        ▼
Internal Identity
        │
        └── owns
            Commerce Profiles
```

An `AccountIdentityBinding` is an explicit durable authorization fact. It is not a login
credential, not an email address, and not an account-provider subject. The authenticated account
is first resolved to an active binding; the binding then resolves the Internal Identity; private
authorization is evaluated against that Identity and the target Profile.

### 3.2 Cardinality

Recommended cardinality:

```text
1 Authentication Account → 0..N binding records over time
1 Authentication Account → at most 1 ACTIVE binding at a time
1 Internal Identity ← 0..N Authentication Accounts
1 Internal Identity → 1..N login accounts when multiple login methods are approved
```

The first approved runtime slice allows multiple active `OWNER` account bindings for the same
Identity. This supports account replacement and multiple approved login methods without making an
Authentication Account the durable subject root. `MANAGER` and `DELEGATED_MANAGER` remain outside
`AccountIdentityBinding`; they are not binding roles in this slice.

An account must not belong to multiple active Identities. A second Identity association requires
an explicit, audited binding command; it must never be inferred from matching email, phone,
provider subject, username, or platform handle.

### 3.3 Binding ownership and immutability

The binding is owned by the Identity authorization boundary, not by an ordinary Profile editor.
Creation, replacement, suspension, and revocation require a dedicated security-controlled command.

Immutable binding facts:

- account identifier;
- Identity identifier;
- authority/role for the binding;
- creation timestamp;
- effective timestamp once the binding is effective.

Mutable only through an explicit lifecycle command:

- binding state;
- revocation metadata;
- future security-review metadata.

The binding target is never edited in place. Replacement creates a new binding fact and revokes or
historicalizes the prior fact.

### 3.4 Lifecycle

Binding lifecycle is independent from both Account and Identity lifecycle:

```text
ACTIVE ↔ SUSPENDED → REVOKED → HISTORICAL
```

`HISTORICAL` is a retention/read-model status for a revoked fact, not a reactivation state.
`createdAt`, `effectiveAt`, and `revokedAt` are recommended durable timestamps. `revokedAt` is
required when the binding becomes revoked; the original fact is retained.

The following distinctions are mandatory:

```text
Account disabled   ≠ Identity deleted
Account replaced   ≠ Identity replaced
Binding revoked    ≠ Identity deleted
Profile archived   ≠ Identity archived
```

An account-level suspension blocks access through that account. It does not erase or archive the
Identity. Identity suspension blocks Identity-authorized private operations regardless of which
bound account authenticated. Identity archival is a separate terminal domain decision.

### 3.5 Alternatives

| Option | Model | Security | Recovery | Multi-login / replacement | Privacy | Authorization | Complexity / migration |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | `1 Account ↔ 1 Identity` | Simple, but encourages credential/subject conflation and makes takeover/replacement dangerous | Weak: account loss tends to look like Identity loss | Poor; replacement often requires identity mutation | High risk of email/provider leakage into durable Identity | Easy initially, brittle later | Lowest now, highest future migration risk |
| B | `N Accounts → 1 Identity` implicit shared foreign key | Better separation, but lifecycle/history and authority semantics are underspecified | Better than A, but ambiguous proof and revocation | Supports multiple logins, weak account replacement audit | Good if identifiers stay private | Risks accidental “same person” inference | Medium now; migration ambiguity later |
| C | Explicit `AccountIdentityBinding` object | Strongest separation, least implicit trust, supports revocation and audit | Supports controlled replacement without changing Identity | Supports future multi-login and explicit replacement | Keeps provider identifiers at the Account boundary | Clear subject chain and object-level checks | Highest initial design cost; lowest semantic migration risk |

**Recommendation: Option C.** The current first operational slice should constrain it to one active
`OWNER` binding per Identity and no delegated roles. This preserves the long-term model without
authorizing multi-login runtime today.

### 3.6 Recovery, merge, and split boundary

Loss of an Authentication Account must not automatically create a new Identity. Future recovery
must prove continuity of the same durable subject using a separately approved security/recovery
policy. “Change email” is an Account credential operation, not an Identity replacement rule.

```text
Account merge = provider/account administration operation; never automatic Identity merge.
Identity merge = high-risk domain operation; not authorized in this package.
Identity split = high-risk historical correction; not authorized in this package.
```

Two accounts must never be auto-merged because their email, phone, provider subject, or profile
metadata match. Any merge or split would require explicit Founder/security approval, impact analysis,
audit evidence, and a separate change unit.

## 4. Private Product Surface Architecture

`Authenticated` proves access to an Authentication Account. It does not prove authorization for
every Identity, Profile, Reference, External Account, or Relationship. The required subject chain is:

```text
Authenticated Account
        ↓
Active Account–Identity Binding
        ↓
Internal Identity
        ↓
Owned Commerce Profile
```

The Internal Identity is the recommended private-surface authorization subject. A Profile mutation
also requires that the target Profile's immutable owner equals the resolved Identity.

### 4.1 Surface A — Identity

| Question | Decision |
| --- | --- |
| Who enters? | Authenticated account with an active binding to the requested Identity |
| View | Own Identity ID, lifecycle/status, creation/update timestamps, and linked account summary permitted by security policy |
| Modify | No ordinary user edit; no rename, transfer, merge, or delete |
| Immutable | Identity ID, canonical subject fact, creation timestamp |
| Extra authorization | Binding administration, suspension, archival, recovery, merge, and split require dedicated security/admin authorization |
| Application use cases | Future `ResolveAuthenticatedIdentity`, `ReadIdentity`, `ListIdentityBindings`; no new use case is implemented here |
| API | Private adapter may be approved later; no public API |
| Database | No new database change for this decision package; a durable binding object is a future schema recommendation only |

Profile presentation data must never be used to edit or rename the canonical Identity.

### 4.2 Surface B — Commerce Profile

| Question | Decision |
| --- | --- |
| Who enters? | Authenticated account resolved to an active Identity binding |
| View | List and view Profiles owned by that Identity, including lifecycle and editable presentation |
| Modify | Create Profile; update presentation while allowed; archive; reactivate only if domain policy permits |
| Immutable | Profile ID, owner Identity, creation timestamp, and any assigned Reference |
| Extra authorization | Archive/reactivate/suspend rules follow domain lifecycle; owner transfer is never ordinary authorization |
| Application use cases | Future list/read/create/update-presentation/archive/reactivate Profile use cases |
| API | Private API candidate only; resource authorization is mandatory |
| Database | No new database change authorized |

The user may understand Profile A, B, and C as independent commercial expressions under one
Identity. `owningIdentityId` must not be exposed as an editable field.

### 4.3 Surface C — Commerce Reference

| Question | Decision |
| --- | --- |
| Who enters? | Authenticated account with authorization for the target owned Profile |
| View | Own Profile's assigned Reference, lifecycle, and display form; copy is a presentation action |
| Modify | No ordinary edit, regeneration, transfer, release, or reuse |
| Immutable | Reference value, Profile target, uniqueness, and non-reuse fact |
| Extra authorization | Assignment requires a separately authorized controlled operation; generation is not authorized |
| Application use cases | Future read/reference-display use case; supplied assignment only after an explicit future decision |
| API | Private API may expose read only; no resolver endpoint |
| Database | No new database change authorized |

`View Reference` and `Generate Reference` are distinct. Current policy is:

```text
Generation = NOT AUTHORIZED
Assignment = FOUNDER DECISION REQUIRED before private-surface implementation
```

### 4.4 Surface D — External Platform Account

| Question | Decision |
| --- | --- |
| Who enters? | Authenticated account authorized for the owning Identity/Profile context |
| View | Platform namespace, opaque account ID, lifecycle/status, and approved non-sensitive metadata |
| Modify | No change to platform namespace or external account ID; handle/URL metadata is not trusted as ownership proof |
| Immutable | Platform namespace and external account ID; canonical external account identity |
| Extra authorization | Add/remove/update metadata requires explicit account-management authorization; verification/binding requires future capability |
| Application use cases | Future list/read External Platform Account; no OAuth or verification use case |
| API | Private adapter only after approval; never a public account-management API |
| Database | No new database change authorized |

Adding an External Platform Account does not mean `verified`, `owned`, or `bound to Profile`.
Those facts require a Commerce Relationship and, separately, a future verification capability.

### 4.5 Surface E — Commerce Relationship

| Question | Decision |
| --- | --- |
| Who enters? | Authenticated account authorized for both the resolved Identity and target Profile context |
| View | Own Profile's relationship facts, role, lifecycle, effective/revoked timestamps, and retained history as policy permits |
| Modify | No direct target editing; no ordinary transfer or “verify” toggle |
| Immutable | External Account target, Profile target, and relationship creation fact; role is immutable in-place if domain invariant remains frozen |
| Extra authorization | Create, replace, revoke, or verify requires dedicated controlled authorization; verification is not implied by creation |
| Application use cases | Future read relationship history; create/replace/revoke only after separate authorization |
| API | Private API candidate only; no public relationship mutation |
| Database | No new database change authorized |

The distinction is strict:

```text
Create Relationship Fact ≠ Prove External Platform Ownership
Relationship = durable domain fact
Verification = future runtime capability
```

## 5. Authorization Matrix

`Yes` means the prerequisite is required, not that the action is currently implemented or
authorized for release.

| Action | Authentication | Identity Ownership | Profile Ownership | Extra Authorization |
| --- | --- | --- | --- | --- |
| View own Identity | Yes | Active binding to target Identity | N/A | No, unless sensitive linked-account data is requested |
| Create Profile | Yes | Active binding to Identity | N/A | No beyond approved Profile command policy |
| View own Profile | Yes | Active binding to owner Identity | Target Profile owner matches resolved Identity | No |
| Archive own Profile | Yes | Active binding to owner Identity | Target Profile owner matches resolved Identity | Domain lifecycle command; confirmation/control may be required |
| View C号 | Yes | Active binding to owner Identity | Target Profile owner matches resolved Identity | No; public resolution remains unauthorized |
| Assign C号 | Yes | Active binding to owner Identity | Target Profile owner matches resolved Identity | Yes: controlled assignment authorization; generation remains unauthorized |
| Add External Account | Yes | Active binding to owner Identity | Target Profile context must be authorized if association is requested | Yes: explicit account-management policy; no verification implied |
| Create Relationship | Yes | Active binding to owner Identity | Authorized target Profile and External Account context | Yes: controlled relationship command; no ownership proof |
| Change Relationship | Yes | Active binding to owner Identity | Authorized target Profile context | Yes: replace/revoke command; targets are not edited in place |

Object-level authorization is mandatory. User A must not read or mutate User B's Identity, Profile,
Reference, External Platform Account, or Relationship even when User A knows the corresponding ID or
Reference. URL/request-parameter substitution must not change the resolved ownership context.

## 6. Mutable / Immutable Matrix

| Fact | Mutable by user | Mutable by application | Immutable |
| --- | --- | --- | --- |
| Internal Identity ID | No | No | Yes |
| Commerce Profile ID | No | No | Yes |
| Profile owner | No | No ordinary mutation | Yes |
| Commerce Reference | No | No ordinary mutation; controlled assignment only | Yes |
| External Account ID | No | No | Yes |
| Platform namespace | No | No | Yes |
| Relationship target | No | No in-place mutation; replacement creates a new fact | Yes |
| Relationship role | No ordinary edit | Only through an explicit future domain command | Yes for an existing fact |
| Lifecycle | No direct field edit | Yes, through domain command and authorization | No |
| Presentation metadata | Yes within domain limits | Yes through approved Profile command | No |
| Account–Identity binding state | No ordinary edit | Yes through security-controlled lifecycle command | No |
| Account–Identity binding target | No | No in-place edit; replacement/revocation only | Yes |

## 7. Security and Boundary Requirements

The future private adapter must enforce, at minimum:

- object-level authorization on every Identity/Profile/Reference/External Account/Relationship
  read and write;
- no ID enumeration as an authorization mechanism; opaque IDs do not replace ownership checks;
- protection against authorization leakage in errors, list endpoints, logs, and response shaping;
- session fixation and CSRF protections at the eventual authentication/web adapter boundary;
- no trust in client-supplied Identity ID, Profile ID, account ID, or role without server-side context
  resolution.

Private API and private UI are adapters over application use cases. They are not domain truth and
must remain separate from any future Public API or public resolver. A private API, if approved,
must not imply a public `/c/{commerce_reference}` route.

## 8. Surface Dependency Graph

```text
Authentication
        ↓
Account–Identity Binding
        ↓
Identity Surface
        ↓
Commerce Profile Surface
        ↓
Commerce Reference Surface

Commerce Profile
        ↑
Commerce Relationship Surface
        ↑
External Platform Account Surface
```

Required dependency order:

- Identity Surface depends on authenticated binding resolution.
- Profile Surface depends on Identity authorization.
- Reference Surface depends on Profile ownership.
- Relationship Surface depends on both Profile authorization and External Account context.
- External Account read-only cataloging can be designed in parallel with Profile UI, but relationship
  operations cannot proceed without both contexts.
- No surface may create public resolver, OAuth, QR, verification, or external runtime binding as a
  side effect.

## 9. Recommended MVP Order

```text
Phase 0  Founder approval of Account–Identity Binding and private authorization boundary
Phase 1  Surface A — Identity read-only
Phase 2  Surface B — Commerce Profile list/view/create/approved lifecycle
Phase 3  Surface C — Commerce Reference read-only
Phase 4  Surface D — External Platform Account read-only
Phase 5  Surface E — Commerce Relationship read-only
```

This order follows dependency and minimizes security blast radius. Surface A proves the subject
chain; Surface B delivers immediate user value without public exposure; Surface C exposes an already
assigned immutable fact without enabling generation; Surface D and E remain read-only until the
system has a safe way to distinguish catalog facts, relationship facts, and external verification.
Relationship creation, reference assignment, and account addition remain separate future commands.

## 10. Founder Decision List

Each item is intended for `APPROVE`, `MODIFY`, or `REJECT`.

### Account–Identity Decisions

#### ACCOUNT-IDENTITY-DECISION-001

- **Question**: Is Authentication Account distinct from Internal Identity?
- **Recommended Decision**: Approve the distinction; Account is a login entry, Identity is the durable PCI subject root.
- **Alternative**: Treat Account as the durable subject.
- **Why**: Prevents credential/provider identifiers from becoming canonical commerce identity.
- **Impact**: All private authorization must resolve Account → Binding → Identity.

#### ACCOUNT-IDENTITY-DECISION-002

- **Question**: What is the canonical relationship and cardinality?
- **Recommended Decision**: Explicit durable `AccountIdentityBinding`; at most one active binding per Account in the first slice; one Identity may have multiple Accounts only through explicit approved bindings.
- **Alternative**: Strict 1:1 or implicit N:1.
- **Why**: Preserves recovery, replacement, revocation, and audit semantics.
- **Impact**: Binding is a separate security-controlled fact; no automatic multi-account merge.

#### ACCOUNT-IDENTITY-DECISION-003

- **Question**: Can a binding be changed or removed?
- **Recommended Decision**: Never edit the target in place; revoke/historicalize the old fact and create a new effective binding when explicitly authorized.
- **Alternative**: Mutable foreign key or hard delete.
- **Why**: Retains durable history and prevents silent subject switching.
- **Impact**: Requires lifecycle and timestamp policy before implementation.

#### ACCOUNT-IDENTITY-DECISION-004

- **Question**: What happens when an Account is disabled or lost?
- **Recommended Decision**: Account disablement blocks that login path but does not delete Identity; recovery requires a future security decision proving continuity.
- **Alternative**: Account loss creates a new Identity.
- **Why**: Identity continuity must not depend on an email or provider credential.
- **Impact**: Recovery is not part of this package or current runtime.

#### ACCOUNT-IDENTITY-DECISION-005

- **Question**: Are merge and split automatic?
- **Recommended Decision**: No. Account merge, Identity merge, and Identity split are separate high-risk operations.
- **Alternative**: Metadata-based automatic merge.
- **Why**: Matching credentials or profile data is not proof of subject continuity.
- **Impact**: No implicit merge behavior may be added.

#### ACCOUNT-IDENTITY-DECISION-006

- **Question**: Is Internal Identity the private-surface authorization subject?
- **Recommended Decision**: Yes, after active binding resolution; Profile checks additionally require immutable owner equality.
- **Alternative**: Authorize directly from Account IDs.
- **Why**: Centralizes durable ownership and avoids scattered account-specific rules.
- **Impact**: Every private object read/write requires object-level authorization.

### Private Surface Decisions

#### PRIVATE-SURFACE-DECISION-001

- **Question**: What is the first private surface?
- **Recommended Decision**: Surface A read-only Identity view.
- **Alternative**: Start with Profile editing or public C号.
- **Why**: Validates the subject chain before mutable commercial data.
- **Impact**: No public surface is enabled.

#### PRIVATE-SURFACE-DECISION-002

- **Question**: What does Surface B allow?
- **Recommended Decision**: List/view/create owned Profiles and approved lifecycle/presentation operations; never change owner.
- **Alternative**: Allow owner transfer or one Profile per Identity.
- **Why**: Matches the frozen `1 Identity : N Profiles` model.
- **Impact**: Profile owner remains a durable immutable fact.

#### PRIVATE-SURFACE-DECISION-003

- **Question**: Is Reference assignment part of the first private surface?
- **Recommended Decision**: Read/copy only; assignment and generation are not authorized until separately decided.
- **Alternative**: Let users generate or replace References.
- **Why**: Reference permanence and non-reuse make generation/assignment security-sensitive.
- **Impact**: No Reference mutation command is authorized.

#### PRIVATE-SURFACE-DECISION-004

- **Question**: Does adding an External Platform Account establish verification or Profile binding?
- **Recommended Decision**: No. External Account catalog facts, Relationship facts, and verification are separate.
- **Alternative**: Treat account addition as verified ownership.
- **Why**: Metadata and handles do not prove control of an external account.
- **Impact**: OAuth, external binding, and verification remain unauthorized.

#### PRIVATE-SURFACE-DECISION-005

- **Question**: Can a user create or change a Commerce Relationship from the private surface?
- **Recommended Decision**: Read-only first; create/replace/revoke require a separate controlled authorization decision.
- **Alternative**: Ordinary Profile-owner mutation.
- **Why**: Relationship is a durable domain fact, not a presentation toggle.
- **Impact**: No relationship mutation is authorized by this package.

#### PRIVATE-SURFACE-DECISION-006

- **Question**: Is a Private API required, and what is its role?
- **Recommended Decision**: A Private API may be introduced later as an adapter over approved application use cases; it is not domain truth and is separate from Public API.
- **Alternative**: Expose domain repositories directly or reuse a public resolver.
- **Why**: Keeps transport and public exposure boundaries explicit.
- **Impact**: No API or OpenAPI change in this package.

#### PRIVATE-SURFACE-DECISION-007

- **Question**: What is the recommended MVP sequence?
- **Recommended Decision**: A read-only → B managed Profiles → C read-only Reference → D read-only External Accounts → E read-only Relationships.
- **Alternative**: Start with public C号 or relationship creation.
- **Why**: Follows authorization dependencies and limits irreversible operations.
- **Impact**: Each phase requires separate Founder approval before implementation.

## 11. Frozen and Not Authorized

Frozen and not reopened:

```text
Authentication Account ≠ Internal Identity
Internal Identity → N Commerce Profiles
Commerce Reference belongs to Commerce Profile
Commerce Relationship binds External Platform Account ↔ Commerce Profile
```

Still not authorized:

```text
SURFACE-001 Account–Identity Runtime Binding = IMPLEMENTED
SURFACE-001 Private API = IMPLEMENTED
SURFACE-001 Private UI = IMPLEMENTED
SURFACE-002 Commerce Profile Management = IMPLEMENTED
REAL_POSTGRESQL_SURFACE_002_INTEGRATION = VERIFIED
Public API = NOT AUTHORIZED
Public Resolver = NOT AUTHORIZED
QR Runtime = NOT AUTHORIZED
OAuth = NOT AUTHORIZED
External Platform Binding Runtime = NOT AUTHORIZED
External Verification Runtime = NOT AUTHORIZED
Event / Outbox = NOT AUTHORIZED
Real Money = NOT AUTHORIZED
```

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
RUNTIME-008 = NOT AUTHORIZED
COMMITTED = NO
```

## 12. Semantic Alignment and Scope Notes

The Product Direction's Identity/Profile/Reference/External Platform boundaries are consistent with
this package. No strategic direction, VS-01 contract, Commerce Pattern, canonical event, or existing
permission was rewritten.

The current working tree contains Stage 2 persistence and application artifacts, including account
identity membership and private runtime code. That repository state is recorded for transparency.
Founder approval subsequently authorized `SURFACE-001`; its bounded implementation record appears
in Section 14. This does not authorize any additional surface, migration, public runtime, or
identity-recovery capability.

## 13. Decision Gate

Founder approval initially authorized only `SURFACE-001`: Account–Identity Binding and the Private
Identity Read-Only Surface. Subsequent Founder approval authorized `SURFACE-002`: Private Commerce
Profile Management. All later surfaces and all capabilities outside those narrow scopes remain gated:

- do not implement `SURFACE-003` through `SURFACE-005`;
- do not begin Runtime-008;
- do not implement public API, resolver, QR, OAuth, external verification, or external-platform
  binding runtime;
- do not infer verification, public distribution, or external ownership from private facts.

## 14. SURFACE-001 Implementation Record

`SURFACE-001` implements only the approved Account–Identity Binding and Private Identity
Read-Only Surface:

```text
Authenticated Account
        ↓
Active AccountIdentityBinding
        ↓
Internal Identity
        ↓
Private Identity Read-Only Surface
```

The implementation adds an OWNER-only, lifecycle-controlled durable binding with account-scoped
active uniqueness; current-user resolution fails closed if no active binding exists. The private
API returns only the authenticated Account's bound Internal Identity and accepts no identity
selection parameter as an authorization input. The private UI displays the returned identity
status and creation time without mutation controls.

`SURFACE-002` and all later private surfaces remain out of scope. No public resolver, public API,
QR, OAuth, external-platform binding or verification, event/outbox, payment, recovery, account
merge, Identity merge, or Identity split is implemented by `SURFACE-001`.

## 15. SURFACE-001 Real PostgreSQL Verification Record

On August 27, 2026, `SURFACE-001` was verified against an isolated non-production PostgreSQL
17.10 database created in a temporary local Podman container. The container was removed after
verification; no connection secret, host, port, credential, or container identifier is recorded.

```text
REAL_POSTGRESQL_SURFACE_001_INTEGRATION = VERIFIED
SURFACE-001 = FULLY_VERIFIED
TEMPORARY_POSTGRESQL_CLEANUP = PASS
UI_REAL_DB_INTEGRATION = NOT VERIFIED
```

The real-database suite verified initial onboarding, rollback on binding persistence conflict,
concurrent onboarding convergence to one canonical Identity and one active Account binding,
account-scoped partial unique enforcement, lifecycle persistence and illegal transition rejection,
canonical rehydration, current Identity resolution, missing-binding fail-closed behavior, and
private API IDOR resistance. Browser-to-real-database verification was not run because this task
does not establish a stable authenticated browser fixture for the temporary database; the
authenticated API-to-application-to-PostgreSQL path is verified.

## 16. SURFACE-002 Implementation Record

`SURFACE-002` implements the approved private authenticated Commerce Profile Management surface:

```text
Authenticated Account
        ↓
Active AccountIdentityBinding
        ↓
Internal Identity
        ↓
Owned Commerce Profiles
        ↓
Private Profile Management Surface
```

The surface supports owner-scoped list, create, read, update of canonical `displayName`, suspend,
archive, and reactivation of suspended Profiles. It does not expose client-controlled ownership,
Profile ID, Commerce Reference, or timestamps. The canonical Profile owner remains immutable.

```text
SURFACE-002 = IMPLEMENTED
REAL_POSTGRESQL_SURFACE_002_INTEGRATION = VERIFIED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
```

The authenticated API routes are private only:

```text
GET    /api/v1/private/profiles
POST   /api/v1/private/profiles
GET    /api/v1/private/profiles/:profileId
PATCH  /api/v1/private/profiles/:profileId
POST   /api/v1/private/profiles/:profileId/suspend
POST   /api/v1/private/profiles/:profileId/archive
POST   /api/v1/private/profiles/:profileId/reactivate
```

Every object operation resolves the current Identity from the authenticated Account and verifies
`CommerceProfile.owningIdentityId` server-side. A foreign Profile is intentionally treated as not
found. Requests cannot supply an owner Identity as an authorization subject; protected owner
injection is rejected by the private request contract.

On August 27, 2026, the dedicated real-PostgreSQL suite passed against an isolated local
PostgreSQL 17.10 instance in a temporary Podman container. It verified Profile create, canonical
rehydration, presentation update, lifecycle persistence, same-version conditional lifecycle
concurrency, foreign Profile IDOR denial, missing-binding fail-closed behavior, and the
authenticated private API path. The temporary database container was removed after verification;
no connection secret or runtime identifier is recorded.

The private web workspace provides authorized list, create, display-name edit, suspend, archive,
and reactivate actions. It provides no owner, Profile-ID, Reference, public, platform, OAuth,
relationship, payment, or recovery control. Browser-to-temporary-database integration was not
run; focused Web type checking passed and the authenticated API-to-application-to-PostgreSQL path
is verified.

## 17. SURFACE-003 Implementation Record

`SURFACE-003` implements the approved private authenticated Commerce Reference View / Copy
surface:

```text
Authenticated Account
        ↓
Active AccountIdentityBinding
        ↓
Internal Identity
        ↓
Owned Commerce Profile
        ↓
Commerce Reference
        ↓
Private View / Copy
```

The private route is read-only:

```text
GET /api/v1/private/profiles/:profileId/reference
```

The server resolves the current Internal Identity from the authenticated Account, verifies
`CommerceProfile.owningIdentityId` before reading the Profile's Reference, and returns a
non-disclosing private not-found response for a foreign Profile. Client-supplied `identityId` has
no authorization effect. A Profile with no assigned Reference returns the explicit
`NOT_ASSIGNED` state and never triggers allocation or generation.

An assigned Reference response contains only its frozen canonical value and its approved grouped
display form. The Web workspace displays the grouped form and copies the canonical value through
the browser clipboard. Copy is a browser-only interaction and creates no durable fact, event,
outbox record, tracking record, or analytics record.

```text
SURFACE-003 = IMPLEMENTED
REAL_POSTGRESQL_SURFACE_003_INTEGRATION = VERIFIED
REAL_POSTGRESQL_SURFACE_003_UI_INTEGRATION = NOT VERIFIED

REFERENCE_GENERATION = NOT IMPLEMENTED
REFERENCE_ALLOCATION = NOT IMPLEMENTED
REFERENCE_MUTATION = NOT IMPLEMENTED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMITTED = NO
```

On August 27, 2026, the dedicated API-to-application-to-PostgreSQL suite passed against isolated
local PostgreSQL 17.10 in a temporary Podman container. It verified an owned assigned Reference,
the `NOT_ASSIGNED` empty state, ignored arbitrary Identity query input, and cross-account Profile
IDOR denial. The temporary container was removed and no connection secret, credential, host, port,
or container identifier is recorded. Browser-to-real-database verification was not run because
this task does not establish a stable authenticated browser fixture for the temporary database.

## 18. SURFACE-004 Implementation Record

`SURFACE-004` implements the approved private authenticated External Platform Account read surface:

```text
Authenticated Account
        ↓
Active AccountIdentityBinding
        ↓
Internal Identity
        ↓
Owned Commerce Profiles
        ↓
Commerce Relationships
        ↓
External Platform Accounts
```

The private read-only routes are:

```text
GET /api/v1/private/external-platform-accounts
GET /api/v1/private/external-platform-accounts/:externalPlatformAccountId
```

The server derives visibility from the current Account's active binding, the current Identity's
owned Profiles, and durable Commerce Relationships. It does not introduce a direct Account or
Identity ownership field on `ExternalPlatformAccount`. Foreign Accounts return the established
non-disclosing private not-found response; client-supplied Identity, Profile, and Relationship IDs
do not influence authorization.

The private DTO exposes only `externalPlatformAccountId`, `platform`, `platformAccountId`, and
`lifecycle`. The Web workspace is strictly read-only, including multiple-account and empty-scope
presentation. It does not expose connect, OAuth, credential, verification, discovery, bind,
unbind, transfer, creation, or lifecycle-mutation capability.

```text
SURFACE-004 = IMPLEMENTED
REAL_POSTGRESQL_SURFACE_004_INTEGRATION = VERIFIED
REAL_POSTGRESQL_SURFACE_004_UI_INTEGRATION = NOT VERIFIED

COMMERCE_RELATIONSHIP_MUTATION = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
VERIFICATION_RUNTIME = NOT IMPLEMENTED
PLATFORM_API = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMITTED = NO
```

On August 27, 2026, a dedicated authenticated private API-to-application-to-PostgreSQL suite
passed against isolated local PostgreSQL 17.10 in a temporary Podman container. It verified the
Account → active binding → Identity → owned Profile → Relationship → External Platform Account
chain, foreign-account IDOR denial, multiple authorized Accounts, and an empty authorized scope.
The temporary container was removed; no connection secret, credential, host, port, username, or
container identifier is recorded. Browser-to-real-database verification remains `NOT VERIFIED`
because this task does not establish a stable authenticated browser fixture for the temporary
database.

## 19. SURFACE-005 Implementation Record

`SURFACE-005` implements the approved private authenticated Commerce Relationship read-only
surface. Visibility follows the canonical graph:

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Internal Identity
        ↓
Owned Commerce Profiles
        ↓
Commerce Relationships
```

The private API supports listing and reading authorized Relationships, including complete durable
history across multiple owned Profiles. Foreign Relationship access fails closed, and optional
Profile or External Platform Account filters only narrow the server-derived authorized scope.
The Web workspace groups Relationships by Profile and presents platform account, role, and
lifecycle without mutation, binding, verification, OAuth, or Platform API controls.

```text
SURFACE-005 = IMPLEMENTED
REAL_POSTGRESQL_SURFACE_005_INTEGRATION = VERIFIED
REAL_POSTGRESQL_SURFACE_005_UI_INTEGRATION = NOT VERIFIED

COMMERCE_RELATIONSHIP_MUTATION = NOT IMPLEMENTED
EXTERNAL_PLATFORM_BINDING = NOT IMPLEMENTED
EXTERNAL_VERIFICATION = NOT IMPLEMENTED
OAUTH = NOT IMPLEMENTED
PLATFORM_API = NOT IMPLEMENTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMITTED = NO
```
