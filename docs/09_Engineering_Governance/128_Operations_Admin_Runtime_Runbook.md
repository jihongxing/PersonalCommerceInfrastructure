# Operations Admin Runtime Runbook

Scope: PCI-ENG-018-B / R1 local and disposable internal validation only. Awaiting Main Controller
acceptance. This procedure does not authorize a real/shared database bootstrap, Production,
external Pilot or real money. The earlier blocked implementation and evidence remain in
[129](129_Operations_Admin_Runtime_Completion.md) and its original blocker JSON.

## 1. Prepare an isolated validation database

- Use a disposable PostgreSQL 17.10 fixture. Keep database credentials in the operator's protected
  process environment, never a committed file, URL in a browser, or a public Next.js variable.
- Use the accepted six-role model. The initializer connects as `pci_ops_migration`; API Runtime
  connects separately as `pci_ops_runtime`. Do not start the API with Migration/DBA credentials.
- Install the reviewed Operations migration subset 0036–0041 through the controlled wrapper.
  The wrapper accepts only loopback `pci_ops_migration_fixture_*` validation databases, fixed
  tags/hashes and owner phases. This is not a general 0000–0041 deployment migration strategy.
- The disposable DBA performs the previously approved temporary two-table MAINTAIN grant/revoke
  around 0040. The wrapper never grants itself privileges. See
  [126](126_Operations_Activation_History_Migration_Runbook.md). Confirm the grant has been revoked
  before Runtime validation; do not change a real database ACL.
- Check all six Operations Journal entries, installed 0041 functions, restricted EXECUTE/column ACL
  and trusted `public` schema. No untrusted role may have public CREATE. No Principal or Account
  may already exist. Do not delete existing identities to make the initializer pass.

The repeatable automated fixture is `scripts/test/operations-admin-fixture.ts`. Its integration
entrypoint is `tests/integration/operations-human-authentication-postgres.integration.test.ts`.
It generates disposable URLs, captures SQL/roles/PIDs/Journal/cleanup and destroys the container.
If explicitly rerunning this local verification later, unset any inherited `DATABASE_URL`, then use:

```powershell
$env:PCI_RUN_OPERATIONS_AUTH_POSTGRES = '1'
pnpm exec vitest run tests/integration/operations-human-authentication-postgres.integration.test.ts
```

The completed R1 execution is already retained in [the evidence index](evidence/PCI-ENG-018-B-R1-index.md);
following this runbook is not required to recreate acceptance evidence.

## 2. Initialize the first account in an interactive terminal

After separately preparing an approved disposable fixture, provide its Migration LOGIN URL through
the protected `DATABASE_URL` environment. Do not paste an actual URL or password into a command
history, report or ticket. Provide nonsecret trace references identifying the approval and actual
controlled execution:

```powershell
# DATABASE_URL must already contain the protected disposable Migration LOGIN connection.
$env:OPERATIONS_BOOTSTRAP_LOGIN = 'operator@example.invalid'
$env:OPERATIONS_BOOTSTRAP_EVIDENCE_REF = 'local-validation/execution-record'
$env:OPERATIONS_BOOTSTRAP_DECISION_REF = 'FD-018-B-BOOTSTRAP-01/PCI-ENG-018-B-R1'
pnpm db:initialize:first-operations-account
```

The command requires `session_user = current_user = pci_ops_migration`. Password and confirmation
are read without echo from a real TTY; redirected/non-TTY input fails closed. No password argument
or password environment variable is accepted. Whitespace and Unicode are preserved without
trim/normalization/truncation. The minimum is 15 Unicode code points and the explicit maximum is
4096 UTF-16 code units. Backspace/DEL edit by code point; cancellation/control sequences abort.
Only an encoded Operations Argon2id verifier reaches PostgreSQL.

One transaction acquires the fixed first-bootstrap guard, refuses existing subjects, creates a
pending Principal/Epoch 0 and invited Account with never_activated histories, first activates
Principal, then Account, links each explicit activation Audit to its History, and inserts active
Credential version 1. Epoch remains 0. There are four Audits (two creation, two activation), one
Principal, one Account, two History rows, one Credential and no Session. See
[130](130_Operations_Initial_Admin_Bootstrap.md) for the precise SQL/owner contract.

The CLI reports success only after transaction completion. Repetition reports already initialized
and does not overwrite Credential or History. Any intermediate failure rolls back the transaction.
If the client reports an uncertain outcome, reconcile identifiers/counts/History/Audit links through
an authorized independent database session before retrying. Do not assume a network failure means
the server did not COMMIT. Never copy password/verifier/digest/raw Session values into evidence.

## 3. Start local API and Admin Web

In the API terminal, provide the same disposable database using its **Runtime LOGIN** URL:

```powershell
# DATABASE_URL must already contain the protected disposable Runtime LOGIN connection.
$env:APP_ENV = 'development'
pnpm dev:api
```

In a separate Admin Web terminal:

```powershell
$env:ADMIN_API_ORIGIN = 'http://localhost:8080'
$env:ADMIN_WEB_ORIGIN = 'http://localhost:3002'
pnpm dev:admin-web
```

Both origins are mandatory server-only configuration. Open exactly `http://localhost:3002/login`;
`localhost` and `127.0.0.1` are different Origins. If using another loopback host/port, set the
browser origin to that exact origin. Never expose the API origin through a `NEXT_PUBLIC_*` token,
put credentials in URLs, or configure an arbitrary upstream from browser input.

The BFF forwards only the opaque Session credential to the fixed API. API independently validates
identity, active states, histories, Credential Version, Principal Epoch and expiry. Browser-supplied
Principal/Permission headers are ignored. The sole host-only `pci_operations_session` cookie is
HttpOnly and SameSite=Lax, without Domain. Secure is disabled only on HTTP loopback; otherwise it
is enabled. Browser JavaScript receives no raw Session credential. The database stores its SHA-256
digest. The only server-side permissions are `catalog:read` and `audit:read`.

## 4. Validate login, Session and logout

1. Anonymous protected navigation redirects to Login without displaying the protected shell.
2. Unknown account and wrong password receive generic failure. Valid credentials reach the shell
   with the actual account identity and Session status. Catalog/Audit entries remain placeholders.
3. Page/route validation checks and touches the Session through API. Idle timeout is 8 hours;
   absolute timeout is 24 hours and cannot be extended by touch.
4. Confirm the cookie attributes and absence of credentials from `document.cookie`, LocalStorage
   and SessionStorage. Do not export the actual cookie value.
5. Logout first revokes the server Session. Only confirmed success (including confirmed absent or
   already-revoked Session) clears the cookie and redirects. API/network failure must visibly fail,
   retain the protected state and permit retry; do not display a false successful logout.
6. After successful retry/logout, verify the server row is revoked and the old opaque credential
   receives 401. Reopening the protected route returns to Login.

The retained browser test exercises real Next/BFF/Fastify/Argon2id/PostgreSQL; only the controlled
logout fault is injected. Component mocks alone are not end-to-end evidence.

## 5. Stop and clean up

Stop the API and Admin process trees, remove only the named disposable container and its volumes,
then record actual process exits and an exact-name residual-container query. Remove protected
credential variables from the test terminals. The automated fixture performs container cleanup in
its finalization path. Preserve failed attempts with their failure/cleanup records.

LOCAL_DEVELOPMENT / INTERNAL_VALIDATION do not require MFA in this bounded unit. Production API
composition omits Human Operations Runtime until separately approved and accepted MFA exists;
there is no bypass switch. This runbook does not authorize deployment, real account initialization,
018-C business data screens, general lifecycle/recovery, RBAC, MFA or business writes.
