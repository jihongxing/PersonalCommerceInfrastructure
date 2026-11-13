# 126 - Operations Activation History Migration Runbook

Status: REV1 implementation runbook - awaiting Main Controller review
Authority: FD-C2-1-R2-01 and PCI-ENG-017-C2-1-R2-REV1
Scope: disposable or separately approved non-production Migration 0040 window only

This runbook describes the external DBA authorization boundary for Migration 0040. It does not authorize a shared, production, Pilot or real-money database. Do not place passwords, connection strings with passwords, private keys or DBA credentials in the repository, shell history, CI variables or evidence files.

## Fixed identities and objects

The external DBA grants only these two temporary privileges:

```sql
GRANT MAINTAIN
ON TABLE public.operations_human_principals, public.operations_accounts
TO pci_ops_table_owner;
```

The recipient is only pci_ops_table_owner. Bootstrap, pci_ops_migration, pci_ops_runtime and pci_ops_function_owner must not receive GRANT/REVOKE capability. Runtime must not receive MAINTAIN or membership in pci_ops_table_owner. The existing legacy owner of both target tables remains unchanged.

Migration 0040 obtains locks in this order, under pci_ops_table_owner and one transaction/backend PID:

```text
public.operations_human_principals  EXCLUSIVE
public.operations_accounts          EXCLUSIVE
History/Audit backfill
Journal insert
COMMIT or ROLLBACK
```

Ordinary SELECT remains allowed while these locks are held. Migrations 0036-0039 are not changed.

## Phase A - authorization preflight

The DBA must use an independent, authenticated DBA session and record a redacted evidence object containing database name, session_user, current_user, backend PID, UTC timestamps, object owners, ACL snapshots, role attributes and command exit codes.

Run these read-only checks before any grant:

```sql
SELECT current_database(), session_user, current_user, pg_backend_pid();

SELECT c.relname, pg_get_userbyid(c.relowner) AS owner,
       coalesce(c.relacl::text, '<default>') AS acl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('operations_human_principals', 'operations_accounts')
ORDER BY c.relname;

SELECT rolname, rolcanlogin, rolinherit, rolsuper, rolcreatedb,
       rolcreaterole, rolreplication, rolbypassrls
FROM pg_roles
WHERE rolname IN (
  'pci_ops_legacy_owner', 'pci_ops_table_owner', 'pci_ops_migration',
  'pci_ops_runtime', 'pci_ops_function_owner', 'pci_ops_journal_owner'
)
ORDER BY rolname;

SELECT member.rolname AS member, granted.rolname AS granted_role,
       m.inherit_option, m.set_option
FROM pg_auth_members m
JOIN pg_roles member ON member.oid = m.member
JOIN pg_roles granted ON granted.oid = m.roleid
WHERE member.rolname IN ('pci_ops_table_owner', 'pci_ops_migration', 'pci_ops_runtime')
   OR granted.rolname IN ('pci_ops_table_owner', 'pci_ops_legacy_owner')
ORDER BY member.rolname, granted.rolname;

SELECT has_table_privilege(
         'pci_ops_table_owner',
         'public.operations_human_principals',
         'MAINTAIN'
       ) AS principal_maintain,
       has_table_privilege(
         'pci_ops_table_owner',
         'public.operations_accounts',
         'MAINTAIN'
       ) AS account_maintain;
```

The two MAINTAIN values must both be false before this window. If either is true, if an owner/ACL cannot be established, or if any unexpected membership is present, stop with ACL_STATE_UNKNOWN. Do not issue a cleanup REVOKE against an unknown historical grant.

The recursive effective-membership check used by the wrapper is:

```sql
SELECT pg_has_role('pci_ops_runtime', 'pci_ops_table_owner', 'MEMBER') AS runtime_table_member,
       pg_has_role('pci_ops_runtime', 'pci_ops_legacy_owner', 'MEMBER') AS runtime_legacy_member,
       pg_has_role('pci_ops_runtime', 'pci_ops_function_owner', 'MEMBER') AS runtime_function_member;
```

All values must be false.

## Phase B - temporary grant

From the same independent DBA session, issue only:

```sql
GRANT MAINTAIN
ON TABLE public.operations_human_principals, public.operations_accounts
TO pci_ops_table_owner;
```

Immediately verify both effective privileges are true and capture a post-grant ACL snapshot. The post-grant ACL may differ from the pre-grant snapshot only by the two expected MAINTAIN entries. Do not grant schema, database, role membership or any other table privilege.

Set operation state to DBA_GRANT_READY only after this verification passes.

## Phase C - Migration execution

Run the reviewed disposable wrapper with the dedicated pci_ops_migration connection. Do not use the generic production migrator and do not run against a shared or production database.

The wrapper checks the fixed table owners, role attributes, recursive Runtime isolation, Migration SET membership and both temporary MAINTAIN privileges before sending any Migration 0040 SQL. A failed check is CONTRACT_REJECTED and must leave Migration 0040 SQL and its Journal row unapplied.

On success, retain:

- wrapper evidence for the permission-preflight-before/after events;
- session_user, current_user and backend PID for the lock, backfill and Journal insert;
- the Journal row and History/Audit counts;
- process exit code.

Set operation state to MIGRATION_COMMITTED or MIGRATION_ROLLED_BACK only after the transaction outcome is independently confirmed.

## Phase D - revoke and close

After the Migration connection is closed or confirmed to hold no locks, issue from the independent DBA session:

```sql
REVOKE MAINTAIN
ON TABLE public.operations_human_principals, public.operations_accounts
FROM pci_ops_table_owner;
```

Verify both effective privileges are false, object owners are unchanged, Runtime has no new privilege, memberships are unchanged, and the final ACL equals the pre-grant baseline. Record the DBA session identity, PID, timestamp, command exit code and final ACL.

Only then set ACL_RESTORED and OPERATION_COMPLETE.

## Failure states and stop rules

Use these states in the execution record:

```text
NOT_STARTED -> DBA_GRANT_READY -> MIGRATION_RUNNING
    -> MIGRATION_COMMITTED or MIGRATION_ROLLED_BACK
    -> DBA_REVOKE_PENDING -> ACL_RESTORED -> OPERATION_COMPLETE

MIGRATION_FAILED
PERMISSION_CLEANUP_FAILED
MIGRATION_COMMITTED_PERMISSION_CLEANUP_PENDING
ACL_STATE_UNKNOWN
```

If Migration fails before or during execution, first prove rollback/lock release, then revoke and verify the ACL. A committed Migration cannot be undone by a later rollback.

If REVOKE fails after a successful commit, record MIGRATION_COMMITTED_PERMISSION_CLEANUP_PENDING, stop all later Migrations, preserve the warning and have the DBA restore both ACLs. Do not close the operation until both MAINTAIN checks are false. If connection identity, lock release or ACL state is uncertain, stop with ACL_STATE_UNKNOWN and require manual reconciliation.

## Verification command

For the disposable evidence run, use the explicit test gate and retain the JSON output outside the repository:

```text
$env:PCI_RUN_C2_1_TESTS='1'
$env:PCI_OPERATIONS_ROLE_IMAGE='docker.io/library/postgres:17-alpine'
$env:PCI_C2_1_EVIDENCE_PATH='<redacted-local-path>'
node node_modules/vitest/vitest.mjs run tests/persistence/operations-activation-history-postgres.integration.test.ts
```

The test must report the real process exit code, PostgreSQL image digest/version, Podman client/server versions, dynamic loopback ports, container IDs, migration Journal state, ACL grant/revoke checks, lock evidence and cleanup result. Disposable containers must be removed and a task-label query must show no remaining containers.

No test result or runbook step grants Authentication Runtime, MFA, RBAC, BFF, Pilot, Production or real-money authorization.
