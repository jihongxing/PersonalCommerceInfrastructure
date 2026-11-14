# 130 — Operations Initial Admin Bootstrap

Authority: Founder PCI-ENG-018-B / FD-018-B-BOOTSTRAP-01 and Main Controller PCI-ENG-018-B-R1.
Status: bounded implementation verified in Disposable PostgreSQL 17.10; awaiting acceptance.
This is not general lifecycle Runtime, account administration or production authorization.

## Necessity and immutable baseline

The preserved original 23514 error comes from 0040's `validate_identity_lifecycle_audit`, not a
PostgreSQL inability to perform atomic activation. 0040:33,82,86 admits creation/backfill only;
History updates at 0040:121-146 require an Audit describing the resulting History and subject.
Reusing creation/backfill would misrepresent first activation. R1 category B therefore authorizes
additive 0041; 0036–0040 are unchanged. [129](129_Operations_Admin_Runtime_Completion.md) retains
the original SQL/error/rollback probe and explains the exact invariants.

```text
Migration: 0041_operations_initial_admin_bootstrap.sql
SHA256: a4f9445de19f685e0386826a565ba2c4d469818507d0f1686675a5a395ff3aec
```

The Drizzle schema CHECK adds only `principal_first_activated` and `account_first_activated` to
existing operation types. Snapshot 0041 and Journal entry 0041 reflect this; no new table is added.
The existing Account subject discriminator is `operations_account` (R1 prose calls this account).

## Fixed installation phases and ownership

The wrapper accepts the fixed SQL hash/tag and exactly six statement-breakpoint phases
(`scripts/database/migrate-with-role-context.ts:280-290`). It uses explicit SET membership with
INHERIT FALSE and does not take arbitrary role names from callers.

| Phase | SET LOCAL ROLE         | Fixed work                                                                                 |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------ |
| 1     | pci_ops_legacy_owner   | Fixed bootstrap guard over legacy parents; narrow Function Owner account/credential grants |
| 2     | pci_ops_table_owner    | Extend Audit operation CHECK; grant named History update columns                           |
| 3     | pci_ops_function_owner | Replace Audit validator with explicit first-activation checks                              |
| 4     | pci_ops_function_owner | Create dedicated initialize_first_admin; revoke PUBLIC; grant Migration EXECUTE            |
| 5     | pci_ops_legacy_owner   | Named Runtime reads/row-lock columns/Session columns                                       |
| 6     | pci_ops_table_owner    | Runtime History reads                                                                      |

Legacy tables retain Legacy Owner. The Journal INSERT and SQL share the migration transaction;
success is reported after confirmed COMMIT. Real SQL (`P0001`) and deferred COMMIT (`23503`) failures
exit 1, leave no fixture marker tables or Journal rows, and preserve process stdout/stderr.
Lost connection/unknown commit requires explicit reconciliation; no automatic retry is claimed safe.
The controlled wrapper still accepts only loopback `pci_ops_migration_fixture_*` validation databases.

## Security Definer boundary

`public.operations_first_bootstrap_guard()` is parameterless, lends only fixed Principal then
Account SHARE ROW EXCLUSIVE transaction locks, has `pg_catalog, pg_temp` search_path, and grants
EXECUTE only to Function Owner. Runtime cannot invoke it.

`operations_api.initialize_first_admin` has fixed schema-qualified objects and requires the actual
session_user `pci_ops_migration`. PUBLIC EXECUTE is revoked; only that Migration login receives it.
CLI additionally requires current_user to match Migration before invocation. Runtime lacks EXECUTE
and owner membership; no public HTTP entrypoint exists.

The initializer fixes search_path to `pg_catalog, public, pg_temp`. The accepted frozen 0037
Credential INSERT trigger resolves its tables through public; removing public would break that
trigger. Therefore bootstrap explicitly refuses untrusted public CREATE. Its own relations remain
schema-qualified and temporary names cannot shadow public. The trusted privileged owner roles and
DB owner/superuser boundary remain administrative powers, not untrusted Runtime roles.

Validate nonempty/bounded IDs and evidence/decision references, canonical login, and the exact
Operations Argon2id encoding before acquiring the guard. Do not interpret this dedicated
initializer's PHC check as a generic change to Credential Persistence's algorithm-neutral text port.

## One transaction, four Audits, no Session

After the guard, any existing Principal or Account yields `ALREADY_INITIALIZED`, without writes.
Otherwise the function calls accepted 0040 creation, then performs these fixed transitions:

| Subject / operation       | Status           | History                                | Epoch        | History link                        |
| ------------------------- | ---------------- | -------------------------------------- | ------------ | ----------------------------------- |
| Principal creation        | pending          | never_activated                        | 0            | Principal creation Audit            |
| Account creation          | invited          | never_activated                        | parent 0     | Account creation Audit              |
| principal_first_activated | pending → active | never_activated → previously_activated | 0 → 0        | Separate Principal activation Audit |
| account_first_activated   | invited → active | never_activated → previously_activated | parent 0 → 0 | Separate Account activation Audit   |

The validator checks the persisted resulting subject, correct subject association, new-subject
never_activated History, exact before/after status/History/Epoch, evidence/decision references and
active/previously_activated parent for Account activation. History updates then link each Audit.
Append-only Audits, immutable History origin/recorded_at/subject and no-delete/truncate protections
from 0040 remain. Unknown histories are never silently converted.

Credential active/version 1 is inserted last. Final identity/history/Credential checks precede
return and outer COMMIT. A credential insertion failure rolls back all seven table categories;
there is no partial Principal, Account, History, Audit, Credential or Session. Bootstrap creates no
Session. No DBA is fabricated as a Human Operations Actor; actual authorization/execution is
linked through evidence_ref and decision_ref. The first operator logs in separately.

## Runtime ACL and validation boundary

Runtime receives SELECT on identity/Credential/Session/History, UPDATE(updated_at) for legacy
repository row locks, and explicit Session INSERT/UPDATE columns. It cannot set arbitrary creation,
absolute expiry, Credential snapshot or Epoch columns via a broad UPDATE grant. It has no
table-wide INSERT/UPDATE, DELETE, TRUNCATE, MAINTAIN, initializer/guard EXECUTE or owner membership.
This is not generic Operations Role/RBAC administration. Superuser/DB administrators can bypass
ordinary database guards; this delivery is not a production security certificate.

The final 12-test PostgreSQL run covers actual 0036–0041 SQL and restricted roles, malformed verifier,
trusted-schema refusal, concurrent/repeated bootstrap, credential fault rollback, four Audit links,
Runtime ACL, real Argon2id/login/digest/timeouts, eligibility/snapshot/CAS/expiry denials, repeat logout,
concurrent login, child-process failure rollback and HTTP spoof denial. It is an Operations-subset
install, not all-repository empty-database migration acceptance or a formal concurrency proof.

See [the evidence index](evidence/PCI-ENG-018-B-R1-index.md) for exact commands/process exits,
JSON provenance/cleanup and disclosed full-suite/lint failures. Use only the disposable procedure
in [128](128_Operations_Admin_Runtime_Runbook.md). No real business database bootstrap, general
Credential Recovery, MFA/RBAC, Production, external Pilot, business write or Real Money is authorized.
