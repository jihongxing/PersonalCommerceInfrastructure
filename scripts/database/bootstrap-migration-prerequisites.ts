import type { Sql } from 'postgres';

import { approvedInstallationHashes } from './migrate-with-role-context.js';

import {
  installationRoles,
  requireInstallation,
  requireInstallationIdentity,
  verifyJournal,
} from './operations-migration-permissions.js';

/** A separately provisioned disposable Bootstrap session; never provisions roles or repairs existing data. */
export async function bootstrapMigrationPrerequisites(bootstrap: Sql): Promise<void> {
  await requireInstallationIdentity(bootstrap, installationRoles.bootstrap);
  const allowed = await bootstrap<
    { valid: boolean }[]
  >`SELECT NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolinherit) AS valid
    FROM pg_roles WHERE rolname=session_user`;
  requireInstallation(allowed[0]?.valid, 'restricted temporary Bootstrap attributes');
  const memberships = await bootstrap<{ valid: boolean }[]>`SELECT
    EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid
      WHERE m.member=(SELECT oid FROM pg_roles WHERE rolname=session_user)
        AND r.rolname='pci_ops_journal_owner' AND NOT m.inherit_option AND m.set_option)
    AND NOT EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname NOT IN ('pci_ops_bootstrap','pci_ops_journal_owner')
      AND pg_has_role(session_user,r.oid,'MEMBER')) AS valid`;
  requireInstallation(memberships[0]?.valid, 'Bootstrap SET membership limited to Journal Owner');
  await bootstrap.begin(async (tx) => {
    await tx.unsafe('SET LOCAL ROLE pci_ops_journal_owner');
    await tx.unsafe('SELECT pg_advisory_xact_lock(71017211)');
    const existing = await tx<
      { present: boolean }[]
    >`SELECT to_regnamespace('drizzle') IS NOT NULL AS present`;
    if (!existing[0]!.present) {
      const canCreate = await tx<
        { allowed: boolean }[]
      >`SELECT has_database_privilege(current_user,current_database(),'CREATE') AS allowed`;
      requireInstallation(
        canCreate[0]!.allowed,
        'Bootstrap needs temporary Journal Owner database CREATE',
      );
      await tx.unsafe('CREATE SCHEMA drizzle AUTHORIZATION pci_ops_journal_owner');
      await tx.unsafe(
        'CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)',
      );
      await tx.unsafe('REVOKE ALL ON SCHEMA drizzle FROM PUBLIC');
      await tx.unsafe('REVOKE ALL ON TABLE drizzle.__drizzle_migrations FROM PUBLIC');
      await tx.unsafe('REVOKE ALL ON SEQUENCE drizzle.__drizzle_migrations_id_seq FROM PUBLIC');
      await tx.unsafe('GRANT USAGE ON SCHEMA drizzle TO pci_ops_migration');
      await tx.unsafe('GRANT SELECT, INSERT ON drizzle.__drizzle_migrations TO pci_ops_migration');
      await tx.unsafe(
        'GRANT USAGE ON SEQUENCE drizzle.__drizzle_migrations_id_seq TO pci_ops_migration',
      );
    }
    // Existing objects are inspected, never adopted, rebuilt, or silently re-granted.
    await verifyJournal(tx, approvedInstallationHashes);
    await tx.unsafe('RESET ROLE');
    await requireInstallationIdentity(tx, installationRoles.bootstrap);
  });
  await requireInstallationIdentity(bootstrap, installationRoles.bootstrap);
}
