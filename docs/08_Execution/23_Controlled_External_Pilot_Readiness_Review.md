# PCI-Controlled External Pilot Readiness Review

> **Task**: `PCI-CONTROLLED-EXTERNAL-PILOT-READINESS-001`
> **Review Date**: 2026-08-28
> **Authority Boundary**: Founder / Main Control decisions remain required for Pilot authorization
> **Scope**: Readiness review only; no Pilot activation, Commercial Launch, or Real Money activation

## 1. Decision Summary

The accepted Private Self-Service MVP is technically ready to be considered for a controlled
external Pilot. The Pilot itself is not authorized or started.

```text
SELF_SERVICE_COMPLETE_CLOSURE = READY_FOR_PILOT
CONTROLLED_EXTERNAL_PILOT_READINESS = BLOCKED
PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT DECLARED
REAL_MONEY_ENABLED = false
```

The Readiness Package is prepared. Execution remains blocked by external deployment, isolation,
operator, participant, evidence-retention, and Founder activation inputs.

## 2. State Separation

```text
READY_FOR_PILOT
    ≠ PILOT_AUTHORIZED
    ≠ PILOT_STARTED
    ≠ COMMERCIAL_LAUNCH
    ≠ REAL_MONEY_ENABLED
```

This review does not change `PROJECT_STATUS`, `PAYMENT_STATUS`, `SETTLEMENT_STATUS`,
`COMMERCIAL_LAUNCH`, or `REAL_MONEY_ENABLED`.

## 3. Minimum Pilot Scope

| Area | Controlled boundary |
| --- | --- |
| Participants | One to three Founder-approved real Creators; at least one coordinated real Customer where a Request path is used |
| Creator onboarding | Independent Auth signup/login, session restore, Identity mapping, owned Commerce Profile, server-generated C号, external account declaration |
| External platform context | Creator-declared context only; no OAuth, Platform API, or Platform Verification |
| Commerce Profile | Creator may create and operate only Profiles owned by the current Internal Identity |
| Commerce patterns | Existing `Request`, `Reservation`, and `Contract` patterns only |
| Completion | Existing completion facts and lifecycle controls only |
| Earnings / Wallet | Existing projection or simulation surfaces only; no real funds, Payment, Settlement, Withdrawal, or Refund |
| Visibility | Protected Creator/Customer surfaces plus authorized Operations observation; no new public resolver or public profile |
| Retention | Preserve Pilot records, audit references, correlation IDs, and evidence register; do not reuse Test cleanup |
| Failure handling | Fail closed, preserve durable facts, record failure reason, and escalate according to stop conditions |
| Exit | Explicit close, freeze evidence, preserve Pilot data, and do not infer commercial success automatically |

## 4. Real Creator Golden Path

```text
Authenticated Account
→ ACTIVE AccountIdentityBinding
→ Internal Identity
→ Owned Commerce Profile
→ Server-generated C号
→ SELF_DECLARED External Platform Account / OWNER Relationship / PROPOSED
→ Existing Offering / Availability surface
→ Request, Reservation, or Contract
→ Existing confirmation and completion lifecycle
→ Earnings Projection / Wallet Projection where already supported
```

The first six identity and self-service closure steps have real Supabase Auth, real private API,
real PostgreSQL, and real authenticated browser evidence from Acceptance-004. The downstream
Commerce Pattern journey has repository application, API, browser simulation, fixture, and
operations-preparation evidence as applicable, but no evidence from a real external Creator using
the deployed Pilot environment. Simulation evidence is not reported as real commerce evidence.

## 5. Evidence Matrix

| Evidence | Current state | Required for controlled Pilot |
| --- | --- | --- |
| Real Authentication | `PASS` | `PASS` |
| Identity onboarding | `PASS` | `PASS` |
| Profile creation | `PASS` | `PASS` |
| C号 issuance | `PASS` | `PASS` |
| External Account declaration | `PASS` | `PASS` |
| Self-declared Relationship | `PASS` | `PASS` |
| Request | `PASS` in existing application/API/browser simulation evidence; real external usage not verified | Required where selected |
| Reservation | `PASS` in existing application/API/browser simulation evidence; real external usage not verified | Required where selected |
| Contract | `PASS` in existing application/API/browser simulation evidence; real external usage not verified | Required where selected |
| Completion | `PASS` in existing lifecycle evidence; real external usage not verified | Required for selected path |
| Earnings Projection | `PASS` in simulation/application evidence; real external usage not verified | Required only where selected path exposes it |
| Wallet Projection | `PASS` in simulation/application evidence; real external usage not verified | Required only where selected path exposes it |
| Real Creator usage | `NOT_VERIFIED` | Required |
| Real commercial transaction | `NOT_VERIFIED` | Not required by this non-money Pilot |
| Real Money | `BLOCKED` by governance | Must remain disabled and unauthorized |

## 6. Product, Operations, and Environment Gaps

### 6.1 Product Gaps

```text
REQUIRED_PRODUCT_GAP = NONE IDENTIFIED FOR THIS READINESS REVIEW
```

No product implementation is authorized by this review. Any newly requested Pattern, public
surface, verification path, manager capability, or money behavior requires a separate decision and
change unit.

### 6.2 Operations Gaps

```text
REQUIRED_OPERATIONS_GAP = PRESENT
```

- Name the Pilot operator and Founder-approved cohort.
- Maintain the Pilot cohort registry and per-session evidence record.
- Provide protected audit/log access and retention ownership.
- Coordinate a real Customer for the selected non-money Commerce Pattern.
- Define support escalation and evidence-freeze ownership.
- Verify backup/restore ownership before external execution.

### 6.3 Environment Gaps

```text
REQUIRED_ENVIRONMENT_GAP = PRESENT
```

- Separate controlled deployment with stable HTTPS and DNS/TLS evidence.
- Dedicated Pilot PostgreSQL database isolated from Development, Test, and Simulation data.
- Dedicated non-production Supabase Auth project/tenant for Pilot participants.
- Environment-specific secrets injected outside Git-tracked files.
- Isolated logs, request/correlation ID retention, health/readiness, CORS, and cookie/session evidence.
- Demonstrated backup and restore procedure for the Pilot database.

The existing local Podman PostgreSQL acceptance database is valid Acceptance evidence but is not a
Controlled External Pilot environment.

## 7. Observability Contract

The Pilot must be able to reconstruct, at minimum:

- onboarding success/failure, Identity creation, Profile creation, and C号 assignment;
- External Account declaration and Relationship creation;
- Request creation and acceptance/decline;
- Reservation lifecycle, Contract lifecycle, and Completion;
- Earnings and Wallet projection state where applicable;
- authorization denial, duplicate submission, retry, and failure reason;
- request/correlation IDs and authorized Operations audit references.

Existing observation mechanisms may be reused. No Event / Outbox architecture is added by this
review. Any missing observation for a selected path is an `OBSERVABILITY GAP`, not an implicit
implementation authorization.

## 8. Safety Boundaries

The following remain prohibited during this Pilot:

```text
production platform credentials
OAuth
Platform Verification
Public Resolver
Public Profile
QR
Manager
Delegated Manager
Marketplace
CRM
Payment
Settlement
Refund
Real Money
```

Participants may operate only their own Identity, Commerce Profiles, External Account declarations,
and permitted Commerce Objects. Cross-owner access must continue to fail closed. A
`SELF_DECLARED` relationship must never be presented as `PLATFORM_VERIFIED` or `VERIFIED`.

## 9. Success Criteria

Pilot success is evaluated by evidence quality and usability, not participant count, code volume,
feature count, revenue, or GMV:

1. Creator onboarding completion;
2. time-to-first-Commerce-Object;
3. Request acceptance behavior where selected;
4. completion rate;
5. cancellation and failure behavior;
6. Creator operational friction;
7. Commerce Profile usability;
8. External Account declaration understandability;
9. Commerce Desk usability;
10. Earnings/Wallet projection understandability where exposed;
11. evidence completeness;
12. correctness of authorization failures.

No commercial revenue target is introduced by this review.

## 10. Stop and Exit Criteria

### Stop Immediately

Stop new Pilot actions and escalate to Founder / Main Control for any:

- cross-owner data exposure or authorization boundary violation;
- incorrect ownership, provenance, or lifecycle semantics;
- durable data corruption or duplicate commercial fact creation;
- unexpected public exposure;
- live Provider secret, live webhook, Payment, Settlement, Refund, or Real Money path;
- Pilot data overlap with Test, Development, fixture, or automated cleanup state;
- inability to reconstruct required evidence;
- security incident or suspected credential exposure.

### Investigate / Continue

Investigate without automatic shutdown when the issue is isolated and no safety boundary is
violated, such as:

- non-sensitive UI wording or usability friction;
- recoverable network timeout with no incorrect durable write;
- missing non-critical observation annotation that can be recorded manually;
- operator scheduling or support-process delay.

Continue only after the named operator records the issue, impact, evidence references, and
disposition.

## 11. Founder / Main Control Decisions Required

This review does not make these decisions:

- authorize the actual Pilot and approve the cohort;
- select participants and named operator;
- approve the external deployment target and domain;
- approve the dedicated Pilot PostgreSQL and Supabase Auth environments;
- approve production or production-like deployment;
- authorize any public exposure beyond the selected existing surface;
- authorize Platform Verification, OAuth, Manager, Marketplace, or CRM;
- authorize Payment, Settlement, Refund, Provider integration, or Real Money activation.

## 12. Existing Readiness Assets

The repository already contains the minimum governance and operational assets:

- `47_VS02K_Real_Creator_Pilot_Non_Money.md`;
- `48_VS02K_EXT_READY_Controlled_External_Pilot_Environment.md`;
- `49_VS02K_EXT02_External_Pilot_Deployment_Package.md`;
- `55_Phase5_Real_Creator_Pilot_Execution.md`;
- `56_Phase5_External_Pilot_Activation_Gate.md`;
- `scripts/operations/pilot-preflight.ps1`;
- `scripts/operations/pilot-activation-preflight.ps1`;
- `scripts/operations/pilot-activation-control.ps1`;
- `scripts/operations/deploy-external-pilot.ps1`;
- `scripts/operations/backup-restore-external-pilot.ps1`.

Observed current preflight result:

```text
pilot-preflight = BLOCKED
pilot:activate:preflight = BLOCKED
```

The current local shell lacks the external Pilot deployment environment file, Pilot state,
dedicated URLs, audit directory, and Founder activation inputs. The scripts emit no secret values.

## 13. Final Readiness Decision

```text
CONTROLLED_EXTERNAL_PILOT_READINESS = BLOCKED
PILOT_TECHNICAL_PACKAGE = READY
PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT DECLARED
REAL_MONEY_ENABLED = false
```

This means the package is executable in principle once the external inputs and Founder decision
are supplied. It does not mean the Pilot has started, Commercial Launch has begun, or any money or
verification capability is enabled.

## 14. Exact Next Action

Founder / authorized Operations owner must, in order:

1. provision the isolated external Pilot deployment, database, Auth project, domain, TLS, logs,
   retention, and backup/restore ownership;
2. prepare a protected Pilot env file and state file outside Git;
3. run `pnpm pilot-preflight` with the Pilot environment;
4. run `pnpm pilot:activate:preflight`;
5. review the emitted evidence and resolve every `BLOCKER`;
6. obtain explicit Founder activation authorization;
7. only then run the approved non-money Creator/Customer sessions and preserve the evidence pack.

No business logic or product implementation change is authorized by this document.

## 15. Provisioning Review — PCI-CONTROLLED-EXTERNAL-PILOT-PROVISIONING-001

> **Review Date**: 2026-08-28
> **Scope**: External environment provisioning only; no activation or Pilot start

The repository has executable provisioning tooling, but no external Pilot environment was
provisioned in this review because the required Founder / Operations inputs are absent from the
current shell session.

```text
PILOT_ENVIRONMENT_PROVISIONED = BLOCKED
PILOT_TECHNICAL_ENVIRONMENT = BLOCKED
PILOT_AUTHORIZED = NOT_VERIFIED
PILOT_STARTED = NOT_VERIFIED
COMMERCIAL_LAUNCH = NOT_DECLARED
REAL_MONEY_ENABLED = false
```

### Provisioning Tooling Check

```text
podman = AVAILABLE
podman compose = AVAILABLE
external-pilot.env.example = AVAILABLE
compose.external-pilot.yml = AVAILABLE
pilot-preflight.ps1 = AVAILABLE
pilot-activation-preflight.ps1 = AVAILABLE
deploy-external-pilot.ps1 = AVAILABLE
backup-restore-external-pilot.ps1 = AVAILABLE
database migration runner = AVAILABLE
```

The tooling check is not provisioning evidence. No container, database, Auth project, domain, TLS
certificate, Pilot state file, or Pilot evidence directory was created by this task.

### Required Inputs

```text
FOUNDER_INPUT_REQUIRED = PRESENT
PILOT_ENV_FILE = MISSING
PILOT_STATE_FILE = MISSING
PILOT_ID = MISSING
PILOT_DEPLOYMENT_TARGET = MISSING
PILOT_DATABASE_AND_OWNER = MISSING
PILOT_SUPABASE_PROJECT_OR_TENANT = MISSING
PILOT_DOMAIN_DNS_OWNER = MISSING
PILOT_TLS_OWNER = MISSING
PILOT_LOGGING_OWNER = MISSING
PILOT_BACKUP_OWNER = MISSING
PILOT_RESTORE_OWNER = MISSING
PILOT_OPERATOR = MISSING
PILOT_COHORT = MISSING
```

The existing local Acceptance PostgreSQL database and Acceptance Supabase credentials are not
eligible Pilot resources. No Acceptance secret, fixture account, fixture data, or production
resource was reused.

### Preflight Evidence

The existing scripts were invoked without provisioning inputs:

```text
pilot-preflight = BLOCKED
pilot:activate:preflight = BLOCKED
```

The failures are expected and non-bypassable: the environment file, required runtime values,
dedicated URLs, audit directory, state file, and Founder-only activation inputs are absent. No
activation command, start command, deployment command, real Creator session, or backup/restore
operation was executed.

### Provisioning Checklist

| Component | Status | Evidence / blocker |
| --- | --- | --- |
| Pilot application deployment | `BLOCKED` | Deployment target and immutable source revision not supplied |
| Dedicated Pilot PostgreSQL | `BLOCKED` | Database host, owner, protected connection secret not supplied |
| Dedicated Pilot Supabase Auth | `BLOCKED` | Pilot project/tenant and credentials not supplied |
| Dedicated domain / DNS | `BLOCKED` | Domain and DNS owner not supplied |
| HTTPS / TLS | `BLOCKED` | TLS owner and certificate evidence not supplied |
| CORS / cookie / session | `BLOCKED` | Pilot origin and deployment values not supplied |
| Logs / retention / audit | `BLOCKED` | Owners, destination, and retention configuration not supplied |
| Health / readiness | `NOT_VERIFIED` | Can only be verified after deployment |
| Backup / restore | `NOT_VERIFIED` | No Pilot database exists to back up or restore |
| Pilot state file | `BLOCKED` | No Founder-approved Pilot ID or state file supplied |
| Environment isolation | `BLOCKED` | Dedicated Pilot resources not supplied |
| Real Money / Provider gate | `PASS` | No live Provider values added; `REAL_MONEY_ENABLED` remains `false` |

`PRODUCT_GAP = NOT_AUTHORIZED`. No product implementation change is required or authorized by
this provisioning review.

### Exact Provisioning Sequence After Inputs

1. Obtain Founder / Operations ownership decisions and the dedicated external resources.
2. Create a protected Pilot environment file outside Git using the existing placeholder contract.
3. Create the Founder-approved Pilot state file with status `PROVISIONED` at most.
4. Run `pnpm pilot-preflight` against the protected Pilot environment.
5. Run the existing Podman external-pilot deployment and migration procedure.
6. Verify database, Auth, domain, TLS, CORS, cookie/session, logs, audit, health/readiness, and
   backup/restore evidence.
7. Run `pnpm pilot:activate:preflight` only as a readiness check; do not activate.
8. Stop and hand off to a separate Founder-authorized Activation task.
