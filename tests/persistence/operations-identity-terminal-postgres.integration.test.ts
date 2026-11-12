import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  createOperationsAccountId,
  createOperationsHumanPrincipalId,
  createServicePrincipalId,
  type OperationsAccountStatus,
  type OperationsHumanPrincipalStatus,
  type ServicePrincipalStatus,
} from '../../modules/operations-identity/operations-identity-contract.js';
import { OperationsTerminalStatusTransitionError } from '../../applications/operations-identity/operations-identity-repositories.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
  type ProductDatabase,
} from '../../adapters/persistence/postgres/postgres-database.js';
import {
  PostgresOperationsAccountRepository,
  PostgresOperationsHumanPrincipalRepository,
  PostgresServicePrincipalRepository,
} from '../../adapters/persistence/postgres/postgres-operations-identity-repositories.js';
import { PostgresOperationsIdentityTransaction } from '../../adapters/persistence/postgres/postgres-operations-identity-transaction.js';
import { PostgresOperationsSecurityEpochRepository } from '../../adapters/persistence/postgres/postgres-operations-security-epoch-repository.js';
import { createOperationsPrincipalSecurityEpoch } from '../../applications/operations-identity/operations-session-repositories.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const changedAt = new Date('2026-11-13T10:00:00.000Z');
const terminalMessage = 'Terminal Operations identity history cannot be changed.';
const terminalSqlError = { cause: { code: '23514', message: terminalMessage } };
const identities = [
  {
    label: 'Human Principal',
    table: 'operations_human_principals',
    key: 'principal_id',
    id: 'terminal-human',
    terminal: 'tombstoned',
    states: ['pending', 'active', 'suspended', 'disabled', 'tombstoned'],
    recoverable: ['suspended', 'disabled'],
  },
  {
    label: 'Operations Account',
    table: 'operations_accounts',
    key: 'account_id',
    id: 'terminal-account',
    terminal: 'revoked',
    states: ['invited', 'active', 'locked', 'disabled', 'revoked'],
    recoverable: ['locked', 'disabled'],
  },
  {
    label: 'Provider Service Principal',
    table: 'service_principals',
    key: 'service_principal_id',
    id: 'terminal-provider',
    terminal: 'revoked',
    states: ['active', 'suspended', 'disabled', 'revoked'],
    recoverable: ['suspended', 'disabled'],
  },
  {
    label: 'Platform System Principal',
    table: 'service_principals',
    key: 'service_principal_id',
    id: 'terminal-system',
    terminal: 'revoked',
    states: ['active', 'suspended', 'disabled', 'revoked'],
    recoverable: ['suspended', 'disabled'],
  },
] as const;
type IdentityCase = (typeof identities)[number];

describeWithDatabase('Operations identity terminal history integrity', () => {
  let connection: PostgresDatabaseConnection;

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, { migrationsFolder: 'database/migrations' });
  });

  beforeEach(async () => {
    // Disposable fixture cleanup only. The three new row guards stay enabled.
    await connection.database.transaction(async (tx) => {
      await tx.execute(
        sql`ALTER TABLE operations_sessions DISABLE TRIGGER operations_sessions_reject_truncate_trigger`,
      );
      await tx.execute(
        sql`ALTER TABLE operations_credentials DISABLE TRIGGER operations_credentials_reject_truncate_trigger`,
      );
      await tx.execute(
        sql`TRUNCATE operations_sessions, operations_credentials, operations_accounts, service_principals, operations_human_principals`,
      );
      await tx.execute(
        sql`ALTER TABLE operations_sessions ENABLE TRIGGER operations_sessions_reject_truncate_trigger`,
      );
      await tx.execute(
        sql`ALTER TABLE operations_credentials ENABLE TRIGGER operations_credentials_reject_truncate_trigger`,
      );
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  async function seed(identity: IdentityCase): Promise<void> {
    if (identity.table === 'operations_human_principals') {
      await connection.database.execute(
        sql`INSERT INTO operations_human_principals (principal_id, status) VALUES (${identity.id}, 'active')`,
      );
    } else if (identity.table === 'operations_accounts') {
      await connection.database.execute(
        sql`INSERT INTO operations_human_principals (principal_id, status) VALUES ('account-owner', 'active')`,
      );
      await connection.database.execute(
        sql`INSERT INTO operations_accounts (account_id, principal_id, login_identifier_normalized, status) VALUES (${identity.id}, 'account-owner', 'terminal@example.test', 'active')`,
      );
    } else if (identity.id === 'terminal-provider') {
      await connection.database.execute(
        sql`INSERT INTO service_principals (service_principal_id, kind, provider_id, status) VALUES (${identity.id}, 'provider_service', 'terminal-provider-id', 'active')`,
      );
    } else {
      await connection.database.execute(
        sql`INSERT INTO service_principals (service_principal_id, kind, system_id, status) VALUES (${identity.id}, 'platform_system', 'terminal-system-id', 'active')`,
      );
    }
  }

  async function read(identity: IdentityCase) {
    return connection.database.execute<Record<string, unknown>>(
      sql`SELECT * FROM ${sql.identifier(identity.table)} WHERE ${sql.identifier(identity.key)} = ${identity.id}`,
    );
  }

  async function updateStatus(
    identity: IdentityCase,
    status: string,
    database: ProductDatabase = connection.database,
  ): Promise<void> {
    if (identity.table === 'operations_human_principals') {
      return new PostgresOperationsHumanPrincipalRepository(database).updateStatus(
        createOperationsHumanPrincipalId(identity.id),
        status as OperationsHumanPrincipalStatus,
        changedAt,
      );
    }
    if (identity.table === 'operations_accounts') {
      return new PostgresOperationsAccountRepository(database).updateStatus(
        createOperationsAccountId(identity.id),
        status as OperationsAccountStatus,
        changedAt,
      );
    }
    return new PostgresServicePrincipalRepository(database).updateStatus(
      createServicePrincipalId(identity.id),
      status as ServicePrincipalStatus,
    );
  }

  async function enterTerminalBySql(identity: IdentityCase): Promise<void> {
    await connection.database.execute(
      sql`UPDATE ${sql.identifier(identity.table)} SET status = ${identity.terminal} WHERE ${sql.identifier(identity.key)} = ${identity.id}`,
    );
  }

  for (const identity of identities) {
    describe(identity.label, () => {
      it('allows entry to terminal and rejects every subsequent Repository status or timestamp update', async () => {
        await seed(identity);
        await updateStatus(identity, identity.terminal);
        const before = await read(identity);
        expect(before[0]?.status).toBe(identity.terminal);
        for (const target of identity.states) {
          await expect(updateStatus(identity, target)).rejects.toBeInstanceOf(
            OperationsTerminalStatusTransitionError,
          );
          expect(await read(identity)).toEqual(before);
        }
      });

      it('preserves each existing suspended locked or disabled recovery to active', async () => {
        await seed(identity);
        for (const state of identity.recoverable) {
          await updateStatus(identity, state);
          expect((await read(identity))[0]?.status).toBe(state);
          await updateStatus(identity, 'active');
          expect((await read(identity))[0]?.status).toBe('active');
        }
      });

      it('blocks terminal mutation through the identity transaction scope', async () => {
        await seed(identity);
        await enterTerminalBySql(identity);
        const transaction = new PostgresOperationsIdentityTransaction(connection.database);
        const attempt = transaction.execute(async (scope) => {
          if (identity.table === 'operations_human_principals') {
            return scope.humanPrincipalRepository.updateStatus(
              createOperationsHumanPrincipalId(identity.id),
              'disabled',
              changedAt,
            );
          }
          if (identity.table === 'operations_accounts') {
            return scope.accountRepository.updateStatus(
              createOperationsAccountId(identity.id),
              'locked',
              changedAt,
            );
          }
          return scope.servicePrincipalRepository.updateStatus(
            createServicePrincipalId(identity.id),
            'suspended',
          );
        });
        await expect(attempt).rejects.toBeInstanceOf(OperationsTerminalStatusTransitionError);
        expect((await read(identity))[0]?.status).toBe(identity.terminal);
      });

      it('allows SQL terminal entry but rejects SQL conversion to every state including itself', async () => {
        await seed(identity);
        await enterTerminalBySql(identity);
        const before = await read(identity);
        for (const target of identity.states) {
          await expect(
            connection.database.execute(
              sql`UPDATE ${sql.identifier(identity.table)} SET status = ${target} WHERE ${sql.identifier(identity.key)} = ${identity.id}`,
            ),
          ).rejects.toMatchObject(terminalSqlError);
          expect(await read(identity)).toEqual(before);
        }
      });

      it('rejects SQL changes to every terminal column including ordinary fields and no-op writes', async () => {
        await seed(identity);
        await enterTerminalBySql(identity);
        const before = await read(identity);
        for (const column of Object.keys(before[0] ?? {})) {
          const value =
            column === 'security_epoch'
              ? 1
              : column.endsWith('_at')
                ? changedAt.toISOString()
                : `changed-${column}`;
          await expect(
            connection.database.execute(
              sql`UPDATE ${sql.identifier(identity.table)} SET ${sql.identifier(column)} = ${value} WHERE ${sql.identifier(identity.key)} = ${identity.id}`,
            ),
          ).rejects.toMatchObject(terminalSqlError);
          await expect(
            connection.database.execute(
              sql`UPDATE ${sql.identifier(identity.table)} SET ${sql.identifier(column)} = ${sql.identifier(column)} WHERE ${sql.identifier(identity.key)} = ${identity.id}`,
            ),
          ).rejects.toMatchObject(terminalSqlError);
          expect(await read(identity)).toEqual(before);
        }
      });

      it('rejects deletion of terminal history', async () => {
        await seed(identity);
        await enterTerminalBySql(identity);
        const before = await read(identity);
        await expect(
          connection.database.execute(
            sql`DELETE FROM ${sql.identifier(identity.table)} WHERE ${sql.identifier(identity.key)} = ${identity.id}`,
          ),
        ).rejects.toMatchObject(terminalSqlError);
        expect(await read(identity)).toEqual(before);
      });

      it('preserves nonterminal deletion where existing foreign keys permit it', async () => {
        await seed(identity);
        await connection.database.execute(
          sql`DELETE FROM ${sql.identifier(identity.table)} WHERE ${sql.identifier(identity.key)} = ${identity.id}`,
        );
        expect(await read(identity)).toHaveLength(0);
      });

      it('rereads terminal state after waiting for a concurrent SQL terminal transition', async () => {
        await seed(identity);
        const applicationName = `pci_017_b_${identity.id}`;
        const raceUrl = new URL(databaseUrl as string);
        raceUrl.searchParams.set('application_name', applicationName);
        const waiter = createPostgresDatabase(raceUrl.toString());
        let markLocked!: () => void;
        let release!: () => void;
        const locked = new Promise<void>((resolve) => {
          markLocked = resolve;
        });
        const released = new Promise<void>((resolve) => {
          release = resolve;
        });
        const terminalize = connection.database.transaction(async (tx) => {
          await tx.execute(
            sql`UPDATE ${sql.identifier(identity.table)} SET status = ${identity.terminal} WHERE ${sql.identifier(identity.key)} = ${identity.id}`,
          );
          markLocked();
          await released;
        });
        let waiting: Promise<void> | undefined;
        try {
          await locked;
          waiting = updateStatus(identity, identity.recoverable[0], waiter.database);
          const settled = waiting.then(
            () => undefined,
            (error: unknown) => error,
          );
          let observedWait = false;
          for (let attempt = 0; attempt < 200; attempt += 1) {
            const rows = await connection.database.execute<{ blocked: boolean }>(
              sql`SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE application_name = ${applicationName} AND wait_event_type = 'Lock') AS blocked`,
            );
            if (rows[0]?.blocked) {
              observedWait = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
          expect(observedWait).toBe(true);
          release();
          await terminalize;
          expect(await settled).toBeInstanceOf(OperationsTerminalStatusTransitionError);
          expect((await read(identity))[0]?.status).toBe(identity.terminal);
        } finally {
          release();
          await terminalize;
          await waiting?.catch(() => undefined);
          await waiter.close();
        }
      });
    });
  }

  it('rejects terminal Principal Epoch writes through the unchanged Epoch Repository', async () => {
    const identity = identities[0];
    await seed(identity);
    await enterTerminalBySql(identity);
    const before = await read(identity);
    const epochs = new PostgresOperationsSecurityEpochRepository(connection.database);
    await expect(
      epochs.incrementSecurityEpoch({
        principalId: createOperationsHumanPrincipalId(identity.id),
        expectedEpoch: createOperationsPrincipalSecurityEpoch(0),
        updatedAt: changedAt,
      }),
    ).rejects.toMatchObject({ name: 'OperationsSessionPersistenceError', code: '23514' });
    expect(await read(identity)).toEqual(before);
  });

  it('confirms row guards do not protect TRUNCATE of terminal Service Principals', async () => {
    await seed(identities[2]);
    await seed(identities[3]);
    await enterTerminalBySql(identities[2]);
    await enterTerminalBySql(identities[3]);
    await connection.database.execute(sql`TRUNCATE service_principals`);
    expect(await read(identities[2])).toHaveLength(0);
    expect(await read(identities[3])).toHaveLength(0);
  });

  for (const identity of [identities[0], identities[1]]) {
    it(`documents FK and dependent TRUNCATE guards for ${identity.label}`, async () => {
      await seed(identity);
      await enterTerminalBySql(identity);
      const before = await read(identity);
      await expect(
        connection.database.execute(sql`TRUNCATE ${sql.identifier(identity.table)}`),
      ).rejects.toMatchObject({ cause: { code: '0A000' } });
      const cascade = connection.database.execute(
        sql`TRUNCATE ${sql.identifier(identity.table)} CASCADE`,
      );
      await expect(cascade).rejects.toMatchObject({ cause: { code: 'P0001' } });
      await expect(cascade).rejects.toHaveProperty(
        'cause.message',
        expect.stringMatching(/Operations (Session|credential) history cannot be truncated/),
      );
      expect(await read(identity)).toEqual(before);
    });
  }

  it('retains exactly three enabled row guards without claiming table-level TRUNCATE protection', async () => {
    const rows = await connection.database.execute<{
      tgname: string;
      definition: string;
      tgenabled: string;
    }>(
      sql`SELECT tgname, pg_get_triggerdef(oid) AS definition, tgenabled FROM pg_trigger WHERE tgname IN ('operations_human_principals_protect_terminal_history_trigger', 'operations_accounts_protect_terminal_history_trigger', 'service_principals_protect_terminal_history_trigger') ORDER BY tgname`,
    );
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.tgenabled).toBe('O');
      expect(row.definition).toContain('BEFORE DELETE OR UPDATE');
      expect(row.definition).toContain('FOR EACH ROW');
      expect(row.definition).not.toContain('TRUNCATE');
    }
  });
});
