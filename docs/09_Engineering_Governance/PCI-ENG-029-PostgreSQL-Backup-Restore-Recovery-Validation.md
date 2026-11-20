# PCI-ENG-029 — PostgreSQL Backup, Restore & Recovery Validation

## Authorization and Provenance

- Task ID: `PCI-ENG-029`
- Authorization: `AUTHORIZED — READY TO START`
- Authorization date: `2026-11-21`
- Approval source: Main Controller authorization supplied for this task; this is a newly authorized engineering task, not an older Founder Decision.
- Task owner: Codex Engineering Execution
- Main Controller: Task Governance, Scope Control and Acceptance
- Formal baseline: `ce954a799e141b2e5c0a5b6e8747b520e8ffa1ea` / Tree `395516d74a9de6dd4424d36fc6a34073db375621`
- Task branch: `codex/pci-eng-029-postgres-backup-restore-recovery-validation`
- Task Worktree: `D:/codeSpace/PersonalCommerceInfrastructure-PCI-ENG-029`

This record synchronizes the authorized task definition into the repository execution and governance record. It does not change the product contract, identity boundary, payment boundary, RPO/RTO, production authorization or external-pilot authorization.

## Scope

1. Assess the existing PostgreSQL backup and restore scripts and deployment/runbook assumptions.
2. Add the smallest reusable full-recovery tooling needed to preserve database data, cluster roles, ownership, grants, extensions and migration history.
3. Run a source-to-clean-target recovery drill in isolated PostgreSQL 17 containers without production data or public exposure.
4. Verify the recovered database with the existing integration checks and the existing runtime role boundary.
5. Document tested commands, evidence, limitations and remaining production-readiness gaps.

The task does not authorize production deployment, external Pilot, production secrets, external backup storage, real-money operations, a new database architecture or numerical RPO/RTO commitments.

## Existing Mechanism Assessment

The pre-existing `backup-postgres.ps1` writes plain SQL using `pg_dump --no-owner`; the pre-existing `restore-postgres.ps1` restores into a new database but does not capture or restore cluster globals. Those scripts are retained for their existing bounded use. PCI-ENG-029 adds a separate full-recovery path using a custom-format database dump plus `pg_dumpall --globals-only`.

## Implementation and Verification Record

This section is updated only with observed results. Untested procedures remain explicitly marked `NOT_VERIFIED`; a successful isolated drill does not establish production readiness.

## Execution Results

### Isolated Environment

- Source: task-controlled PostgreSQL `17.10` container `pci-eng-029-source`, database
  `personal_commerce_integration`, loopback-only host port.
- Target: separate clean PostgreSQL `17.10` container `pci-eng-029-target`, restored database
  `personal_commerce_integration_restore`, loopback-only host port.
- All credentials were generated for this drill, kept outside the repository, and excluded from
  the archived evidence. No production connection, production data, public port, or real-money
  operation was used.
- The source was provisioned with the existing Operations role names and schema prerequisites,
  then populated through the repository migration path and service-policy seed path. The ordinary
  `db:migrate` command alone does not provision the Operations schemas required by migrations 0040+
  on a pristine database; that prerequisite was supplied consistently with the existing
  production installer contract.

### Backup and Restore

- `backup-postgres-full.ps1` produced a PostgreSQL custom-format dump, `pg_dumpall
--globals-only` output, and a non-secret manifest. The source manifest recorded PostgreSQL
  `17.10`, database owner `pci_eng029_source_admin`, 46 Migration Journal rows, the `btree_gist`
  and `plpgsql` extensions, and database ACL entries.
- Backup artifact integrity: `PASS`. `database.dump` was 329,392 bytes with SHA-256
  `5a74ddafa8ddf7272ae1be94b04df0af90afe1871c5132dd52c85d2216c07f0e`; `globals.sql` was 3,066
  bytes with SHA-256 `10e7fa470c6526ccd3521581915cd9ada060dbf3182c86b1650c08d328319782`.
- `pg_restore --list` independently parsed the custom dump with 716 archive entries: `PASS`.
- `restore-postgres-full.ps1` restored globals first, created the new target database with the
  captured owner, restored the custom dump without `--no-owner`, and reapplied database ACLs:
  `PASS`.
- During the drill, the scripts were corrected for manifest byte counting, single-expression ACL
  query ordering, explicit `pg_restore` authentication, PostgreSQL `char` casting, and exclusion
  of extension-owned functions from application-function owner comparison. The final run was
  executed against a freshly recreated target after those corrections.

### Verification Results

- Source `pnpm db:integration:check`: `PASS`.
- Restored target `pnpm db:integration:check`: `PASS`; migration manifest and schema checks passed
  on PostgreSQL `17.10`.
- Source-to-target recovery comparison: `PASS` for server version, database owner and ACLs,
  extensions, role attributes and password-presence metadata, memberships, schema/relation and
  application-function owners/ACLs, columns, Migration Journal, and table row counts.
- Restricted runtime check: `pci_api_runtime` connected as both `current_user` and `session_user`,
  could read the permitted service-policy relation and Goods order relation, and had no `drizzle`
  schema usage. A direct Journal read failed with PostgreSQL permission denied: `PASS`.
- Evidence is archived under
  `D:/codeSpace/_PCI_ARCHIVE/evidence/PCI-ENG-029-PostgreSQL-Backup-Restore-Recovery-Validation-20261121/`.
  The archive contains the manifest, artifact integrity record, source/target integration-check
  logs, recovery comparison output, and runtime allow/deny checks. Dump and globals artifacts are
  not archived or committed.

## Remaining Limitations

- This validates only an isolated local recovery drill. External backup storage, durability,
  retention, production secret management, TLS, monitoring, restore automation, and production
  database compatibility remain `NOT_VERIFIED`.
- RPO/RTO remain pending Founder decision; this task creates no numerical objective or SLA.
- Production deployment, external Pilot, Goods enablement, and real-money operations remain out of
  scope. `REAL_MONEY_ENABLED=false` remains unchanged.
- A failed restore can create cluster roles before a later database restore step fails; the script
  removes the newly-created target database, while a clean target/container is required before a
  retry. This limitation is documented rather than represented as transactional rollback of
  cluster-global role creation.

Final status: `COMPLETED — RECOVERY VALIDATED / AWAITING MAIN CONTROLLER ACCEPTANCE`.

## Final Cleanup and Acceptance — 2026-11-21

- The environment administrator confirmed physical absence of the three exact task-generated
  sensitive-artifact paths: `E:\User\jihx\AppData\Local\Temp\pci-eng-029-secrets.json`,
  `E:\User\jihx\AppData\Local\Temp\pci-eng-029-bootstrap.sql`, and
  `E:\User\jihx\AppData\Local\Temp\pci-eng-029-recovery`.
- The sensitive-artifact cleanup status is `COMPLETED`. The earlier denied cleanup attempt remains
  preserved in the chronological task record; no credential values or database contents are
  included here.
- Main Controller accepted the administrator cleanup confirmation and accepted the isolated
  PostgreSQL recovery validation deliverable.
- Final task status: `COMPLETED — ACCEPTED`.
- This acceptance does not authorize production deployment, external Pilot, real-money operations,
  production storage, external backup retention, or numerical RPO/RTO commitments.
