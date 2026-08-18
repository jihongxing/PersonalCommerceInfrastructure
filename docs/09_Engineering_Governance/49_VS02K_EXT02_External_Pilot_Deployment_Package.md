# 49 — VS-02K-EXT-02 External Pilot Deployment Package

> **Status**: Engineering Package In Progress
> **Change Unit**: `DEV-021`
> **Target State**: External Pilot Deployment Package = READY
> **Deployment State**: Not Deployed
> **REAL_MONEY_ENABLED**: `false`
> **Real Money Evidence**: None

## 1. Boundary

This package prepares a repeatable deployment contract for a future Controlled External Pilot. It
does not provision infrastructure, create DNS, load credentials, create real accounts, connect a
Provider or execute real money.

The package reuses the repository's existing Compose, migration and deployment smoke tooling. It
does not create a second application deployment system.

## 2. Environment Architecture

```text
Controlled External Pilot
├── Web                 public HTTPS through an external TLS proxy
├── API                 private service, public only through the proxy
├── PostgreSQL          dedicated Pilot database and volume
├── Auth Provider       dedicated Supabase project or isolated tenant
├── Object / Asset      not required by the current VS-01/VS-02K flow
├── Logging             isolated structured application logs
└── Secrets             external secret manager or protected env file
```

| Component              | Environment / data boundary            | Secret boundary                                   | Exposure                          | Backup / health                            |
| ---------------------- | -------------------------------------- | ------------------------------------------------- | --------------------------------- | ------------------------------------------ |
| Web                    | Controlled Pilot only; no Test data    | Public runtime config only                        | HTTPS public URL                  | Web smoke; no database access              |
| API                    | Controlled Pilot only                  | Database/Auth/Operations values from secret store | Proxy only; no direct public port | `/api/v1/health`, `/api/v1/readiness`      |
| PostgreSQL             | Dedicated Pilot database and volume    | `DATABASE_URL` never committed                    | Private network only              | Migration, backup and restore verification |
| Auth Provider          | Dedicated Pilot project/tenant         | URL, anon key and redirect configuration          | Provider HTTPS endpoints          | Auth sign-up/login/session checks          |
| Object / Asset Storage | Not required for current scope         | N/A                                               | Not provisioned                   | N/A                                        |
| Logging                | Pilot-only retention                   | No tokens or secrets                              | Operations access only            | Structured log and audit review            |
| Secrets                | Pilot-specific; never Development/Test | Secret manager or protected file                  | Not exposed to Web                | Rotation and revocation ownership recorded |

## 3. Environment Variable Manifest

The canonical sample is `deploy/external-pilot.env.example`. Values in that file are placeholders
only and must be replaced through a protected deployment mechanism.

### Required

| Variable                      | Rule                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `RUNTIME_ENV`                 | Must be `controlled`                                                             |
| `APP_ENV`                     | Must be `production` for the deployed application                                |
| `DATABASE_URL`                | Must identify the dedicated Pilot database; Development/Test hosts are forbidden |
| `POSTGRES_PASSWORD`           | Required by the Compose database service and must be Pilot-specific              |
| `SUPABASE_URL`                | Pilot Auth project URL                                                           |
| `SUPABASE_ANON_KEY`           | Pilot Auth public client key; never substitute a test key                        |
| `CREATOR_ACTOR_MAPPINGS`      | Only approved Pilot Auth-to-Creator mappings                                     |
| `WEB_PUBLIC_URL`              | Must be an `https://` public Creator URL                                         |
| `API_PUBLIC_URL`              | Must be an `https://` public API URL                                             |
| `WEB_REFERENCE_CLIENT_ORIGIN` | Must equal the HTTPS Web origin                                                  |
| `NEXT_PUBLIC_API_BASE_URL`    | Must equal the HTTPS API URL                                                     |
| `OPERATIONS_ACCESS_TOKEN`     | Protected Operations credential                                                  |
| `OPERATIONS_OPERATOR_ID`      | Auditable Operations actor                                                       |
| `LOG_LEVEL`                   | `info`, `warn` or `error` for Pilot                                              |
| `AUDIT_LOG_RETENTION_DAYS`    | Positive retention policy value                                                  |
| `SUPABASE_SITE_URL`           | HTTPS Pilot Web URL                                                              |
| `SUPABASE_ALLOWED_ORIGINS`    | Explicit HTTPS origin allow-list                                                 |

### Disabled / Forbidden

| Variable or value                                             | Rule                                            |
| ------------------------------------------------------------- | ----------------------------------------------- |
| `REAL_MONEY_ENABLED=true`                                     | Deployment must be rejected                     |
| `LIVE_PROVIDER_ID` and all `LIVE_PROVIDER_*` values           | Must be absent or empty                         |
| Live Payment endpoint                                         | Must not be configured                          |
| Live Withdrawal endpoint                                      | Must not be configured                          |
| `http://localhost`, `http://127.0.0.1` or development origins | Forbidden in public URL/configuration variables |
| Development/Test `DATABASE_URL` or Auth project               | Forbidden                                       |

Missing Required variables or a forbidden value must produce `BLOCKED`; there is no fallback to
Development or Test configuration.

## 4. Database Isolation Contract

```text
Development DB ≠ Test DB ≠ Pilot DB
```

The deployment owner must provision the Pilot database before running `deploy/external-pilot.ps1`.
The script runs the existing migration command and never seeds Demo Creator, Test Customer or
fixture data. Automated Test cleanup must not have credentials or network access to this database.

Required operational actions:

1. provision a dedicated database and protected `DATABASE_URL`;
2. run `pnpm db:migrate` through the deployment workflow;
3. take a named backup;
4. restore into a separate verification database;
5. run migration and readiness verification;
6. record retention and restore ownership.

## 5. Auth Isolation Contract

```text
Development Auth ≠ Test Auth ≠ Pilot Auth
```

The Pilot Auth project must configure its own Site URL, redirect URL and allowed origins. It must
support real Creator sign-up, login, session restore, logout, Creator mapping and provider-supported
password recovery. Test tokens, fixture users and shared Creator accounts are prohibited.

This package does not invent Supabase project IDs or credentials. Those values are Founder/Operations
inputs at deployment time.

## 6. HTTPS and Proxy Contract

The supported public shape is either:

```text
https://<creator-domain>
https://<api-domain>
```

or one HTTPS domain with a reverse proxy routing Web and API paths. TLS termination, HSTS policy,
forwarded-host/proto headers, CORS, Secure/HttpOnly/SameSite session behavior and the public URL
variables must be configured together. The application must not be presented publicly through
localhost, loopback addresses, plain HTTP or a Development origin.

## 7. Deployment Workflow

Use `scripts/operations/deploy-external-pilot.ps1` with
`deploy/compose.external-pilot.yml`. The workflow is:

```text
Provision infrastructure
→ Load protected env file
→ pilot-preflight
→ Build API/Web images
→ Start PostgreSQL
→ Run migration
→ Start API/Web
→ Health
→ Readiness
→ OpenAPI smoke
→ Web smoke
→ Auth verification
→ Public Offering verification
→ Request verification
```

The final three checks require real Pilot accounts and a published Offering; the script must report
them as pending rather than manufacture evidence.

## 8. Pilot Preflight

`pnpm pilot-preflight` runs `scripts/operations/pilot-preflight.ps1`. It reports `READY` only when
the deployment contract is satisfied. It reports every failed check and exits non-zero for:

- missing Required variables;
- non-HTTPS public URLs or origins;
- `REAL_MONEY_ENABLED` not exactly `false`;
- any Live Provider secret/endpoint;
- Development/Test database or Auth markers;
- missing health/readiness or logging/audit configuration;
- missing migration evidence when runtime verification is requested.

The preflight does not log secret values and never changes application or database state.

## 9. Observability and Data Safety

Pilot logs must retain request ID, correlation ID, structured event name, safe error classification
and audit event references. They must not log passwords, Auth tokens, Payment credentials, Provider
secrets or unrestricted sensitive Customer data.

Creator ownership must be verified by the existing authorization boundary. The deployment acceptance
package must include a cross-Creator check proving Creator A cannot read or modify Creator B's private
Offering or Requests, and that a Customer cannot access private data.

## 10. Backup and Restore

The deployment package supplies commands for:

- `pnpm db:migrate`;
- `pnpm pilot:backup-restore`;
- PostgreSQL logical backup;
- restore into an isolated verification database;
- health/readiness verification after restore;
- migration verification.

Backup artifacts must be stored outside the repository and must not contain committed credentials.

## 11. Acceptance Package

| Acceptance                             | Evidence required                              | Package status     |
| -------------------------------------- | ---------------------------------------------- | ------------------ |
| EXT2-01 Environment variables complete | Protected manifest review and preflight output | READY TO RUN       |
| EXT2-02 Pilot DB isolated              | Dedicated DB proof and connection review       | EXTERNAL INPUT     |
| EXT2-03 Pilot Auth isolated            | Dedicated Auth project/tenant proof            | EXTERNAL INPUT     |
| EXT2-04 HTTPS configured               | TLS/DNS and public URL smoke                   | EXTERNAL INPUT     |
| EXT2-05 Real Money disabled            | `REAL_MONEY_ENABLED=false` preflight           | READY TO RUN       |
| EXT2-06 No Live Provider secrets       | Secret scan/preflight output                   | READY TO RUN       |
| EXT2-07 Health / Readiness             | Deployment smoke output                        | READY TO RUN       |
| EXT2-08 Auth flow                      | Real Creator Auth evidence                     | EXTERNAL EXECUTION |
| EXT2-09 Public Offering                | Creator-authored public Offering evidence      | EXTERNAL EXECUTION |
| EXT2-10 Request Flow                   | Real Customer Request and Result evidence      | EXTERNAL EXECUTION |
| EXT2-11 Creator ownership isolation    | Cross-Creator authorization evidence           | EXTERNAL EXECUTION |
| EXT2-12 Backup / Restore               | Backup, restore and verification evidence      | READY TO RUN       |

## 12. Final State

```text
VS-02K-EXT-02 — External Pilot Deployment Package = READY
External Pilot Deployed = NO
REAL_MONEY_ENABLED = false
No Real Money Evidence
No Live Provider
```

This package is ready for Founder/Operations deployment. It does not claim that an external Pilot
has been deployed or that real Creator/Customer acceptance has occurred.
