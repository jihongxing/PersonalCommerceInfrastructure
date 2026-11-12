import { readFileSync } from 'node:fs';
import { sql, type SQL } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { createPostgresOperationsIdentityComposition } from '../../adapters/persistence/postgres/postgres-operations-identity-composition.js';
import {
  PostgresOperationsSessionRepository,
  mapOperationsSessionPersistenceError,
} from '../../adapters/persistence/postgres/postgres-operations-session-repository.js';
import { createEncodedPasswordVerifier } from '../../applications/operations-identity/operations-credential-repositories.js';
import { OperationsHumanPrincipalNotFoundError } from '../../applications/operations-identity/operations-identity-repositories.js';
import {
  createOperationsPrincipalSecurityEpoch,
  createOperationsSessionCredentialDigest,
  createOperationsSessionCredentialVersion,
  createOperationsSessionVersion,
  OperationsSessionConflictError,
  OperationsSessionContractError,
  OperationsSessionNotAuthenticatedError,
  OperationsSessionNotFoundError,
  OperationsSessionPersistenceError,
  OperationsPrincipalSecurityEpochConflictError,
  type OperationsSessionCredentialDigest,
  type OperationsSessionPersistenceRecord,
  type OperationsSessionRepository,
} from '../../applications/operations-identity/operations-session-repositories.js';
import {
  createOperationsAccountId,
  createOperationsCredentialId,
  createOperationsHumanPrincipalId,
  createOperationsSession,
  createOperationsSessionId,
} from '../../modules/operations-identity/operations-identity-contract.js';

const databaseUrl = process.env.DATABASE_URL;
const databaseDescribe = databaseUrl === undefined ? describe.skip : describe;
// Arbitrary fixtures only; these times are not timeout or retention policies.
const now = new Date('2030-01-01T00:00:00.000Z');
const at = (milliseconds: number) => new Date(now.getTime() + milliseconds);
let sequence = 0;
const digest = () =>
  createOperationsSessionCredentialDigest((++sequence).toString(16).padStart(64, '0'));

databaseDescribe('Operations Session PostgreSQL persistence', () => {
  let connection: PostgresDatabaseConnection;
  let second: PostgresDatabaseConnection;
  let composition: ReturnType<typeof createPostgresOperationsIdentityComposition>;
  let sessions: OperationsSessionRepository;
  let competing: OperationsSessionRepository;

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    second = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, { migrationsFolder: 'database/migrations' });
    composition = createPostgresOperationsIdentityComposition(connection.database);
    sessions = composition.sessionRepository;
    competing = new PostgresOperationsSessionRepository(second.database);
  });
  beforeEach(async () => {
    // Disposable test database only; restore guards in the same transaction as cleanup.
    await connection.database.transaction(async (tx) => {
      await tx.execute(
        sql`ALTER TABLE operations_sessions DISABLE TRIGGER operations_sessions_reject_truncate_trigger`,
      );
      await tx.execute(
        sql`ALTER TABLE operations_credentials DISABLE TRIGGER operations_credentials_reject_truncate_trigger`,
      );
      await tx.execute(
        sql`TRUNCATE operations_sessions, operations_credentials, operations_accounts, operations_human_principals`,
      );
      await tx.execute(
        sql`ALTER TABLE operations_credentials ENABLE TRIGGER operations_credentials_reject_truncate_trigger`,
      );
      await tx.execute(
        sql`ALTER TABLE operations_sessions ENABLE TRIGGER operations_sessions_reject_truncate_trigger`,
      );
    });
  });
  afterAll(async () => {
    await Promise.all([connection.close(), second.close()]);
  });

  it('matches the real Schema, 0038 Snapshot, composite RESTRICT foreign key and unchanged migration rerun', async () => {
    const before = await connection.database.execute(
      sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`,
    );
    expect(before).toHaveLength(39);
    await migrate(connection.database, { migrationsFolder: 'database/migrations' });
    const after = await connection.database.execute(
      sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`,
    );
    expect(after).toEqual(before);
    const snapshot = JSON.parse(
      readFileSync('database/migrations/meta/0038_snapshot.json', 'utf8'),
    ) as { tables: Record<string, { columns: Record<string, { type: string }> }> };
    const table = snapshot.tables['public.operations_sessions'];
    expect(table).toBeDefined();
    if (table === undefined) throw new Error('Session Snapshot is missing.');
    const columns = await connection.database.execute<{ column_name: string; data_type: string }>(
      sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operations_sessions'`,
    );
    expect(columns.map((column) => column.column_name).sort()).toEqual(
      Object.keys(table.columns).sort(),
    );
    expect(columns.find((column) => column.column_name === 'credential_digest')?.data_type).toBe(
      'bytea',
    );
    const constraints = await connection.database.execute<{
      conname: string;
      confdeltype: string;
      definition: string;
    }>(
      sql`SELECT conname, confdeltype, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid = 'operations_sessions'::regclass`,
    );
    expect(
      constraints.find(
        (constraint) => constraint.conname === 'operations_sessions_account_principal_fk',
      ),
    ).toMatchObject({ confdeltype: 'r' });
    expect(constraints.filter((constraint) => constraint.confdeltype === 'r')).toHaveLength(2);
    const triggers = await connection.database.execute<{ tgname: string; tgenabled: string }>(
      sql`SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'operations_sessions'::regclass AND NOT tgisinternal`,
    );
    expect(triggers.map((trigger) => trigger.tgname).sort()).toEqual([
      'operations_sessions_reject_delete_trigger',
      'operations_sessions_reject_truncate_trigger',
      'operations_sessions_validate_insert_trigger',
      'operations_sessions_validate_update_trigger',
    ]);
    expect(triggers.every((trigger) => trigger.tgenabled === 'O')).toBe(true);
  });

  it('creates and rehydrates a 32-byte Digest through the real composition without treating Session ID as a secret', async () => {
    const fixture = await seed('initial');
    fixture.input.session.id = createOperationsSessionId('f'.repeat(64));
    const record = await sessions.createSession(fixture.input);
    expect(record.session).toEqual(fixture.input.session);
    expect(record.sessionVersion).toBe(1);
    expect(record.credentialDigest).toBe(fixture.input.credentialDigest);
    const bytes = await connection.database.execute<{ size: number; encoding: string }>(
      sql`SELECT octet_length(credential_digest) AS size, encode(credential_digest, 'hex') AS encoding FROM operations_sessions`,
    );
    expect(bytes[0]?.size).toBe(32);
    expect(bytes[0]?.encoding === record.credentialDigest).toBe(true);
    expect(
      await sessions.findActiveSessionByCredentialDigest({
        credentialDigest: record.credentialDigest,
        now,
      }),
    ).toEqual(record);
    await expect(
      sessions.findActiveSessionByCredentialDigest({
        credentialDigest: createOperationsSessionCredentialDigest('f'.repeat(64)),
        now,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    expect('deleteSession' in sessions).toBe(false);
  });

  it('rejects malformed/duplicate Digests and keeps collision errors free of SQL, Digest and Verifier data', async () => {
    const fixture = await seed('digests');
    const record = await sessions.createSession(fixture.input);
    await expect(
      sessions.createSession({
        ...fixture.input,
        credentialDigest: 'short' as OperationsSessionCredentialDigest,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionContractError);
    const duplicate = {
      ...fixture.input,
      session: { ...fixture.input.session, id: createOperationsSessionId('duplicate-digest') },
    };
    let failure: unknown;
    try {
      await sessions.createSession(duplicate);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(OperationsSessionConflictError);
    const rendered = JSON.stringify(failure, Object.getOwnPropertyNames(failure));
    expect(rendered.includes(record.credentialDigest)).toBe(false);
    expect(rendered.includes('fixture-encoded-verifier')).toBe(false);
    expect(rendered).not.toMatch(/INSERT INTO|parameters|constraint_name|cause/u);
    for (const length of [0, 31, 33])
      await directReject(
        rawInsert(fixture, { sessionId: 'length-' + length, bytes: Buffer.alloc(length) }),
        '23514',
      );
  });

  it('enforces the Account/Principal association in the database and rejects missing owners', async () => {
    const a = await seed('owner-a');
    const b = await seed('owner-b');
    await directReject(
      rawInsert(a, { accountId: b.accountId }),
      '23503',
      'operations_sessions_account_principal_fk',
    );
    await expect(
      sessions.createSession({
        ...a.input,
        session: { ...a.input.session, accountId: b.accountId },
      }),
    ).rejects.toBeInstanceOf(OperationsSessionConflictError);
    await directReject(rawInsert(a, { principalId: 'missing-principal' }), '23503');
    await directReject(rawInsert(a, { accountId: 'missing-account' }), '23503');
  });

  it('rejects every non-active Principal and Account state during Session creation', async () => {
    for (const status of ['pending', 'suspended', 'disabled', 'tombstoned']) {
      const f = await seed('principal-' + status);
      await connection.database.execute(
        sql`UPDATE operations_human_principals SET status = ${status} WHERE principal_id = ${f.principalId}`,
      );
      await expect(sessions.createSession(f.input)).rejects.toBeInstanceOf(
        OperationsSessionNotAuthenticatedError,
      );
      await directReject(rawInsert(f), '23514');
    }
    for (const status of ['invited', 'locked', 'disabled', 'revoked']) {
      const f = await seed('account-' + status);
      await connection.database.execute(
        sql`UPDATE operations_accounts SET status = ${status} WHERE account_id = ${f.accountId}`,
      );
      await expect(sessions.createSession(f.input)).rejects.toBeInstanceOf(
        OperationsSessionNotAuthenticatedError,
      );
      await directReject(rawInsert(f), '23514');
    }
  });

  it('rejects missing/revoked Credentials, stale Version/Epoch snapshots and invalid initial Session Versions', async () => {
    const f = await seed('snapshot');
    for (const patch of [
      { credentialVersion: 0 },
      { credentialVersion: 2 },
      { epoch: -1 },
      { epoch: 1 },
      { version: 0 },
      { version: 2 },
      { status: 'unknown' },
      { status: 'revoked', revokedAt: now },
      { revokedAt: now },
    ])
      await directReject(rawInsert(f, patch), '23514');
    await expect(
      sessions.createSession({
        ...f.input,
        session: {
          ...f.input.session,
          credentialVersion: createOperationsSessionCredentialVersion(2),
        },
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    await expect(
      sessions.createSession({
        ...f.input,
        session: {
          ...f.input.session,
          principalSecurityEpoch: createOperationsPrincipalSecurityEpoch(1),
        },
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    await composition.credentialRepository.revokeActivePasswordCredential({
      accountId: f.accountId,
      expectedVersion: 1,
      revokedAt: at(1),
    });
    await expect(sessions.createSession(f.input)).rejects.toBeInstanceOf(
      OperationsSessionNotAuthenticatedError,
    );
    await directReject(rawInsert(f), '23514');
    const missing = await seed('no-credential', false);
    await directReject(rawInsert(missing), '23514');
    await expect(sessions.createSession(missing.input)).rejects.toBeInstanceOf(
      OperationsSessionNotAuthenticatedError,
    );
  });

  it('fails closed on each authoritative status, replaced Credential Version and changed Epoch during reads', async () => {
    const f = await seed('revalidation');
    const record = await sessions.createSession(f.input);
    for (const statement of [
      sql`UPDATE operations_human_principals SET status = 'suspended' WHERE principal_id = ${f.principalId}`,
      sql`UPDATE operations_accounts SET status = 'locked' WHERE account_id = ${f.accountId}`,
    ]) {
      await connection.database.execute(statement);
      await expect(
        sessions.findActiveSessionByCredentialDigest({
          credentialDigest: record.credentialDigest,
          now,
        }),
      ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
      await connection.database.execute(
        sql`UPDATE operations_human_principals SET status = 'active' WHERE principal_id = ${f.principalId}`,
      );
      await connection.database.execute(
        sql`UPDATE operations_accounts SET status = 'active' WHERE account_id = ${f.accountId}`,
      );
    }
    await composition.credentialRepository.replaceActivePasswordCredential({
      id: createOperationsCredentialId('replacement'),
      accountId: f.accountId,
      expectedVersion: 1,
      verifier: createEncodedPasswordVerifier('fixture-next-verifier'),
      replacedAt: at(1),
    });
    await expect(
      sessions.findActiveSessionByCredentialDigest({
        credentialDigest: record.credentialDigest,
        now,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    const next = await sessions.createSession({
      ...f.input,
      credentialDigest: digest(),
      session: {
        ...f.input.session,
        id: createOperationsSessionId('version-two'),
        credentialVersion: createOperationsSessionCredentialVersion(2),
      },
    });
    await composition.securityEpochRepository.incrementSecurityEpoch({
      principalId: f.principalId,
      expectedEpoch: createOperationsPrincipalSecurityEpoch(0),
      updatedAt: at(2),
    });
    await expect(
      sessions.findActiveSessionByCredentialDigest({
        credentialDigest: next.credentialDigest,
        now,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    await expect(
      sessions.findActiveSessionByCredentialDigest({ credentialDigest: digest(), now }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
  });

  it('merges stale Touch requests monotonically without changing Digest, snapshots, Version or Absolute Expiry', async () => {
    const f = await seed('touch');
    const initial = await sessions.createSession(f.input);
    const first = await sessions.validateAndTouchSession({
      credentialDigest: initial.credentialDigest,
      now,
      nextLastActivityAt: at(2000),
      nextIdleExpiresAt: at(80000),
    });
    const stale = await sessions.validateAndTouchSession({
      credentialDigest: initial.credentialDigest,
      now,
      nextLastActivityAt: at(1000),
      nextIdleExpiresAt: at(70000),
    });
    expect(stale).toEqual(first);
    expect(stale.sessionVersion).toBe(1);
    expect(stale.session.absoluteExpiresAt).toEqual(initial.session.absoluteExpiresAt);
    await expect(
      sessions.validateAndTouchSession({
        credentialDigest: initial.credentialDigest,
        now,
        nextLastActivityAt: at(1000),
        nextIdleExpiresAt: at(200001),
      }),
    ).rejects.toBeInstanceOf(OperationsSessionContractError);
  });

  it('rejects Idle/Absolute expiry boundaries and cannot revive expired Sessions by Touch or Rotation', async () => {
    const f = await seed('expiry');
    const record = await sessions.createSession(f.input);
    for (const expiredAt of [record.session.idleExpiresAt, record.session.absoluteExpiresAt]) {
      await expect(
        sessions.findActiveSessionByCredentialDigest({
          credentialDigest: record.credentialDigest,
          now: expiredAt,
        }),
      ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
      await expect(
        sessions.validateAndTouchSession({
          credentialDigest: record.credentialDigest,
          now: expiredAt,
          nextLastActivityAt: expiredAt,
          nextIdleExpiresAt: record.session.absoluteExpiresAt,
        }),
      ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
      await expect(
        sessions.rotateSession({ ...rotation(record), rotatedAt: expiredAt }),
      ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    }
    await expect(
      sessions.createSession({ ...f.input, now: record.session.absoluteExpiresAt }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
  });

  it('rotates strictly, increments exactly once, invalidates old Digests and preserves security snapshots', async () => {
    const f = await seed('rotation');
    const first = await sessions.createSession(f.input);
    const rotated = await sessions.rotateSession(rotation(first));
    expect(rotated.sessionVersion).toBe(2);
    expect(rotated.session).toEqual({
      ...first.session,
      lastActivityAt: at(1000),
      idleExpiresAt: at(70000),
    });
    const third = await sessions.rotateSession(rotation(rotated));
    expect(third.sessionVersion).toBe(3);
    for (const old of [first, rotated])
      await expect(
        sessions.findActiveSessionByCredentialDigest({
          credentialDigest: old.credentialDigest,
          now,
        }),
      ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    await expect(sessions.rotateSession(rotation(first))).rejects.toBeInstanceOf(
      OperationsSessionConflictError,
    );
    expect(
      (
        await sessions.findActiveSessionByCredentialDigest({
          credentialDigest: third.credentialDigest,
          now,
        })
      ).session.status,
    ).toBe('active');
    await expect(
      sessions.rotateSession({ ...rotation(third), nextCredentialDigest: third.credentialDigest }),
    ).rejects.toBeInstanceOf(OperationsSessionContractError);
  });

  it('uses two real PostgreSQL connections and permits at most one winner for the same Digest/Version', async () => {
    const pids = await Promise.all([
      connection.client`SELECT pg_backend_pid() AS pid`,
      second.client`SELECT pg_backend_pid() AS pid`,
    ]);
    expect(pids[0][0]?.pid === pids[1][0]?.pid).toBe(false);
    const f = await seed('cas-race');
    const record = await sessions.createSession(f.input);
    const outcomes = await Promise.allSettled([
      sessions.rotateSession(rotation(record)),
      competing.rotateSession(rotation(record)),
    ]);
    const winners = outcomes.filter((outcome) => outcome.status === 'fulfilled');
    expect(winners).toHaveLength(1);
    const losers = outcomes.filter((outcome) => outcome.status === 'rejected');
    expect(losers).toHaveLength(1);
    for (const loser of losers) expect(loser.reason).toBeInstanceOf(OperationsSessionConflictError);
    const winner = winners[0];
    if (winner?.status !== 'fulfilled') throw new Error('No CAS winner.');
    expect(winner.value.sessionVersion).toBe(2);
    expect(
      (
        await sessions.findActiveSessionByCredentialDigest({
          credentialDigest: winner.value.credentialDigest,
          now,
        })
      ).session.status,
    ).toBe('active');
    await expect(
      sessions.findActiveSessionByCredentialDigest({
        credentialDigest: record.credentialDigest,
        now,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
  });

  it('leaves a lost-response old Digest unusable and does not expose successor recovery', async () => {
    const f = await seed('lost-response');
    const record = await sessions.createSession(f.input);
    const request = rotation(record);
    await sessions.rotateSession(request); // Simulate discarding the response after commit.
    await expect(
      competing.findActiveSessionByCredentialDigest({
        credentialDigest: record.credentialDigest,
        now,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    await expect(competing.rotateSession(rotation(record))).rejects.toBeInstanceOf(
      OperationsSessionConflictError,
    );
    expect(
      (
        await sessions.findActiveSessionByCredentialDigest({
          credentialDigest: request.nextCredentialDigest,
          now,
        })
      ).sessionVersion,
    ).toBe(2);
    expect('recoverSuccessor' in sessions).toBe(false);
  });

  it('serializes Rotation versus Revoke and Rotation versus Touch without resurrecting or regressing state', async () => {
    const f = await seed('revoke-race');
    const record = await sessions.createSession(f.input);
    const results = await Promise.allSettled([
      sessions.rotateSession(rotation(record)),
      competing.revokeSession({
        sessionId: record.session.id,
        principalId: record.session.principalId,
        accountId: record.session.accountId,
        revokedAt: at(3000),
      }),
    ]);
    for (const result of results)
      if (result.status === 'rejected')
        expect(result.reason).toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    const stored = await connection.database.execute<{ status: string }>(
      sql`SELECT status FROM operations_sessions WHERE session_id = ${record.session.id}`,
    );
    expect(stored[0]?.status).toBe('revoked');
    const g = await seed('touch-race');
    const active = await sessions.createSession(g.input);
    const rotate = rotation(active);
    const touchResults = await Promise.allSettled([
      sessions.rotateSession(rotate),
      competing.validateAndTouchSession({
        credentialDigest: active.credentialDigest,
        now,
        nextLastActivityAt: at(2000),
        nextIdleExpiresAt: at(80000),
      }),
    ]);
    expect(touchResults[0].status).toBe('fulfilled');
    for (const result of touchResults)
      if (result.status === 'rejected')
        expect(result.reason).toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    const final = await sessions.findActiveSessionByCredentialDigest({
      credentialDigest: rotate.nextCredentialDigest,
      now,
    });
    expect(final.session.lastActivityAt.getTime()).toBeGreaterThanOrEqual(at(1000).getTime());
    expect(final.session.absoluteExpiresAt).toEqual(active.session.absoluteExpiresAt);
  });

  it('rolls back a collision during Rotation and a failed creation without partial state changes', async () => {
    const f = await seed('rollback');
    const record = await sessions.createSession(f.input);
    const another = await sessions.createSession({
      ...f.input,
      credentialDigest: digest(),
      session: { ...f.input.session, id: createOperationsSessionId('collision-target') },
    });
    await expect(
      sessions.rotateSession({
        ...rotation(record),
        nextCredentialDigest: another.credentialDigest,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionConflictError);
    expect(
      await sessions.findActiveSessionByCredentialDigest({
        credentialDigest: record.credentialDigest,
        now,
      }),
    ).toEqual(record);
    await expect(
      sessions.createSession({ ...f.input, credentialDigest: digest() }),
    ).rejects.toBeInstanceOf(OperationsSessionPersistenceError);
    const count = await connection.database.execute<{ count: number }>(
      sql`SELECT count(*)::integer AS count FROM operations_sessions`,
    );
    expect(count[0]?.count).toBe(2);
  });

  it('revokes one Session idempotently, checks administrative ownership/CAS, and rejects missing IDs', async () => {
    const f = await seed('single-revoke');
    const record = await sessions.createSession(f.input);
    const input = {
      sessionId: record.session.id,
      principalId: record.session.principalId,
      accountId: record.session.accountId,
      revokedAt: at(1000),
    };
    await expect(
      sessions.revokeSession({
        ...input,
        expectedSessionVersion: createOperationsSessionVersion(2),
      }),
    ).rejects.toBeInstanceOf(OperationsSessionConflictError);
    await expect(
      sessions.revokeSession({ ...input, principalId: createOperationsHumanPrincipalId('wrong') }),
    ).rejects.toBeInstanceOf(OperationsSessionConflictError);
    await expect(
      sessions.revokeSession({ ...input, sessionId: createOperationsSessionId('missing') }),
    ).rejects.toBeInstanceOf(OperationsSessionNotFoundError);
    await sessions.revokeSession(input);
    await sessions.revokeSession({ ...input, revokedAt: at(9000) });
    const history = await connection.database.execute<{ revoked_at: string }>(
      sql`SELECT revoked_at FROM operations_sessions`,
    );
    expect(new Date(history[0]?.revoked_at ?? '')).toEqual(at(1000));
    await expect(
      sessions.findActiveSessionByCredentialDigest({
        credentialDigest: record.credentialDigest,
        now,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
  });

  it('revokes Account and Principal Session sets atomically without affecting another identity', async () => {
    const a = await seed('bulk-a');
    const b = await seed('bulk-b');
    for (const f of [a, b]) {
      await sessions.createSession(f.input);
      await sessions.createSession({
        ...f.input,
        credentialDigest: digest(),
        session: { ...f.input.session, id: createOperationsSessionId('second-' + f.accountId) },
      });
    }
    expect(
      await sessions.revokeAllSessionsForAccount({ accountId: a.accountId, revokedAt: at(1000) }),
    ).toBe(2);
    expect(
      (
        await sessions.findActiveSessionByCredentialDigest({
          credentialDigest: b.input.credentialDigest,
          now,
        })
      ).session.status,
    ).toBe('active');
    expect(
      await sessions.revokeAllSessionsForPrincipal({
        principalId: b.principalId,
        revokedAt: at(2000),
      }),
    ).toBe(2);
    expect(
      await sessions.revokeAllSessionsForPrincipal({
        principalId: b.principalId,
        revokedAt: at(3000),
      }),
    ).toBe(0);
  });

  it('rolls back the complete bulk revoke after a mid-statement failure and still enforces a later authoritative Epoch', async () => {
    const f = await seed('bulk-rollback');
    const first = await sessions.createSession({
      ...f.input,
      session: { ...f.input.session, id: createOperationsSessionId('rollback-a') },
    });
    await sessions.createSession({
      ...f.input,
      credentialDigest: digest(),
      session: { ...f.input.session, id: createOperationsSessionId('rollback-b') },
    });
    await connection.database.execute(
      sql`CREATE FUNCTION c2_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.session_id = 'rollback-b' THEN RAISE EXCEPTION 'Injected test failure'; END IF; RETURN NEW; END $$`,
    );
    await connection.database.execute(
      sql`CREATE TRIGGER c2_test_failure_trigger BEFORE UPDATE ON operations_sessions FOR EACH ROW EXECUTE FUNCTION c2_test_failure()`,
    );
    try {
      await expect(
        sessions.revokeAllSessionsForAccount({ accountId: f.accountId, revokedAt: at(1000) }),
      ).rejects.toBeInstanceOf(OperationsSessionPersistenceError);
      await expect(
        sessions.revokeAllSessionsForPrincipal({ principalId: f.principalId, revokedAt: at(1000) }),
      ).rejects.toBeInstanceOf(OperationsSessionPersistenceError);
    } finally {
      await connection.database.execute(
        sql`DROP TRIGGER c2_test_failure_trigger ON operations_sessions`,
      );
      await connection.database.execute(sql`DROP FUNCTION c2_test_failure()`);
    }
    const counts = await connection.database.execute<{ count: number }>(
      sql`SELECT count(*)::integer AS count FROM operations_sessions WHERE status = 'active'`,
    );
    expect(counts[0]?.count).toBe(2);
    await composition.securityEpochRepository.incrementSecurityEpoch({
      principalId: f.principalId,
      expectedEpoch: createOperationsPrincipalSecurityEpoch(0),
      updatedAt: at(2000),
    });
    await expect(
      sessions.findActiveSessionByCredentialDigest({
        credentialDigest: first.credentialDigest,
        now,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
  });

  it('rejects ordinary SQL snapshot/history rewrites, illegal CAS coupling, deletion and TRUNCATE', async () => {
    const f = await seed('sql-guard');
    const record = await sessions.createSession(f.input);
    const mutations: SQL[] = [
      sql`principal_id = 'other'`,
      sql`account_id = 'other'`,
      sql`credential_version = 2`,
      sql`principal_security_epoch = 1`,
      sql`created_at = created_at - interval '1 second'`,
      sql`absolute_expires_at = absolute_expires_at + interval '1 second'`,
      sql`mfa_verified_at = now()`,
      sql`session_version = 2`,
      sql`credential_digest = ${Buffer.alloc(32, 200)}`,
      sql`credential_digest = ${Buffer.alloc(32, 201)}, session_version = 3`,
      sql`last_activity_at = created_at - interval '1 second'`,
    ];
    for (const mutation of mutations)
      await directReject(
        connection.database.execute(
          sql`UPDATE operations_sessions SET ${mutation} WHERE session_id = ${record.session.id}`,
        ),
        'P0001',
      );
    await directReject(
      connection.database.execute(
        sql`UPDATE operations_sessions SET idle_expires_at = absolute_expires_at + interval '1 second'`,
      ),
      '23514',
    );
    for (const patch of [
      { activityAt: at(-1) },
      { idleAt: at(-1) },
      { idleAt: at(200001) },
      { absoluteAt: now },
    ])
      await directReject(
        rawInsert(f, {
          sessionId: 'time-' + ++sequence,
          bytes: Buffer.from(digest(), 'hex'),
          ...patch,
        }),
        '23514',
      );
    await connection.database.execute(
      sql`UPDATE operations_sessions SET credential_digest = ${Buffer.from(digest(), 'hex')}, session_version = session_version + 1 WHERE session_id = ${record.session.id}`,
    );
    await sessions.revokeSession({
      sessionId: record.session.id,
      principalId: record.session.principalId,
      accountId: record.session.accountId,
      revokedAt: at(1000),
    });
    for (const mutation of [
      sql`status = 'active', revoked_at = NULL`,
      sql`session_version = session_version`,
      sql`credential_digest = ${Buffer.alloc(32, 202)}`,
      sql`created_at = created_at + interval '1 second'`,
    ])
      await directReject(
        connection.database.execute(sql`UPDATE operations_sessions SET ${mutation}`),
        'P0001',
      );
    await directReject(connection.database.execute(sql`DELETE FROM operations_sessions`), 'P0001');
    await directReject(connection.database.execute(sql`TRUNCATE operations_sessions`), 'P0001');
  });

  it('increments Epoch with real CAS, rejects stale/decreasing/jumped/overflowed values and preserves Account/Credential state', async () => {
    const f = await seed('epoch');
    expect(
      await composition.securityEpochRepository.incrementSecurityEpoch({
        principalId: f.principalId,
        expectedEpoch: createOperationsPrincipalSecurityEpoch(0),
        updatedAt: at(1000),
      }),
    ).toBe(1);
    await expect(
      composition.securityEpochRepository.incrementSecurityEpoch({
        principalId: f.principalId,
        expectedEpoch: createOperationsPrincipalSecurityEpoch(0),
        updatedAt: at(2000),
      }),
    ).rejects.toBeInstanceOf(OperationsPrincipalSecurityEpochConflictError);
    for (const value of [0, 3])
      await directReject(
        connection.database.execute(
          sql`UPDATE operations_human_principals SET security_epoch = ${value} WHERE principal_id = ${f.principalId}`,
        ),
        '23514',
      );
    const other = createPostgresOperationsIdentityComposition(
      second.database,
    ).securityEpochRepository;
    const outcomes = await Promise.allSettled([
      composition.securityEpochRepository.incrementSecurityEpoch({
        principalId: f.principalId,
        expectedEpoch: createOperationsPrincipalSecurityEpoch(1),
        updatedAt: at(3000),
      }),
      other.incrementSecurityEpoch({
        principalId: f.principalId,
        expectedEpoch: createOperationsPrincipalSecurityEpoch(1),
        updatedAt: at(3000),
      }),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    for (const result of outcomes)
      if (result.status === 'rejected')
        expect(result.reason).toBeInstanceOf(OperationsPrincipalSecurityEpochConflictError);
    await connection.database.execute(
      sql`INSERT INTO operations_human_principals (principal_id, status, security_epoch, created_at, updated_at) VALUES ('epoch-max', 'active', 2147483647, ${now.toISOString()}, ${now.toISOString()})`,
    );
    await expect(
      other.incrementSecurityEpoch({
        principalId: createOperationsHumanPrincipalId('epoch-max'),
        expectedEpoch: createOperationsPrincipalSecurityEpoch(2147483647),
        updatedAt: at(1000),
      }),
    ).rejects.toBeInstanceOf(OperationsSessionContractError);
    await expect(
      other.incrementSecurityEpoch({
        principalId: createOperationsHumanPrincipalId('missing'),
        expectedEpoch: createOperationsPrincipalSecurityEpoch(0),
        updatedAt: now,
      }),
    ).rejects.toBeInstanceOf(OperationsHumanPrincipalNotFoundError);
    expect((await composition.accountRepository.findById(f.accountId))?.status).toBe('active');
    expect(
      (await composition.credentialRepository.findActivePasswordByAccountId(f.accountId))?.metadata
        .version,
    ).toBe(1);
  });

  it('handles multi-connection Credential replacement and Epoch changes without a lock-order deadlock or stale success', async () => {
    const f = await seed('credential-race');
    const record = await sessions.createSession(f.input);
    const other = createPostgresOperationsIdentityComposition(second.database);
    const results = await Promise.allSettled([
      sessions.rotateSession(rotation(record)),
      other.credentialRepository.replaceActivePasswordCredential({
        id: createOperationsCredentialId('race-new'),
        accountId: f.accountId,
        expectedVersion: 1,
        verifier: createEncodedPasswordVerifier('fixture-race-verifier'),
        replacedAt: at(2000),
      }),
    ]);
    expect(results[1].status).toBe('fulfilled');
    for (const result of results)
      if (result.status === 'rejected')
        expect(result.reason).toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    const g = await seed('epoch-race');
    const active = await sessions.createSession(g.input);
    const request = rotation(active);
    const epochRace = await Promise.allSettled([
      sessions.rotateSession(request),
      other.securityEpochRepository.incrementSecurityEpoch({
        principalId: g.principalId,
        expectedEpoch: createOperationsPrincipalSecurityEpoch(0),
        updatedAt: at(3000),
      }),
    ]);
    expect(epochRace[1].status).toBe('fulfilled');
    for (const result of epochRace)
      if (result.status === 'rejected')
        expect(result.reason).toBeInstanceOf(OperationsSessionNotAuthenticatedError);
    await expect(
      sessions.findActiveSessionByCredentialDigest({
        credentialDigest: request.nextCredentialDigest,
        now,
      }),
    ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
  });

  it('blocks direct SQL from inserting expired Sessions or reviving them through Touch or Rotation', async () => {
    const f = await seed('sql-expiry');
    const clocks = await connection.database.execute<{ instant: string }>(
      sql`SELECT clock_timestamp() AS instant`,
    );
    const instant = new Date(clocks[0]?.instant ?? '').getTime();
    expect(Number.isFinite(instant)).toBe(true);
    const createdAt = new Date(instant - 2000);
    const absoluteAt = new Date(instant + 60000);
    await directReject(
      rawInsert(f, {
        createdAt,
        activityAt: createdAt,
        idleAt: new Date(instant - 1000),
        absoluteAt,
      }),
      '23514',
    );
    await rawInsert(f, {
      createdAt,
      activityAt: createdAt,
      idleAt: new Date(instant + 1000),
      absoluteAt,
    });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await directReject(
      connection.database.execute(
        sql`UPDATE operations_sessions SET idle_expires_at = ${new Date(instant + 10000).toISOString()}`,
      ),
      'P0001',
    );
    await directReject(
      connection.database.execute(
        sql`UPDATE operations_sessions SET credential_digest = ${Buffer.from(digest(), 'hex')}, session_version = session_version + 1`,
      ),
      'P0001',
    );
    await sessions.revokeSession({
      sessionId: f.input.session.id,
      principalId: f.principalId,
      accountId: f.accountId,
      revokedAt: new Date(instant + 2000),
    });
  });

  it('serializes Principal/Account status changes against Session Rotation across connections', async () => {
    for (const target of ['principal', 'account']) {
      const f = await seed('status-race-' + target);
      const active = await sessions.createSession(f.input);
      const request = rotation(active);
      const update =
        target === 'principal'
          ? sql`UPDATE operations_human_principals SET status = 'suspended' WHERE principal_id = ${f.principalId}`
          : sql`UPDATE operations_accounts SET status = 'locked' WHERE account_id = ${f.accountId}`;
      const results = await Promise.allSettled([
        sessions.rotateSession(request),
        second.database.execute(update),
      ]);
      expect(results[1].status).toBe('fulfilled');
      for (const result of results)
        if (result.status === 'rejected')
          expect(result.reason).toBeInstanceOf(OperationsSessionNotAuthenticatedError);
      for (const credentialDigest of [active.credentialDigest, request.nextCredentialDigest]) {
        await expect(
          sessions.findActiveSessionByCredentialDigest({ credentialDigest, now }),
        ).rejects.toBeInstanceOf(OperationsSessionNotAuthenticatedError);
      }
    }
  });

  it('sanitizes nested driver failures and refuses untrusted diagnostic codes without retaining causes', () => {
    const secret = 'test-only-diagnostic-sentinel';
    for (const code of ['23514', secret]) {
      const error = mapOperationsSessionPersistenceError({
        query: secret,
        params: [secret],
        cause: { code, detail: secret, message: secret },
      });
      expect(error).toBeInstanceOf(OperationsSessionPersistenceError);
      expect(JSON.stringify(error, Object.getOwnPropertyNames(error)).includes(secret)).toBe(false);
      expect('cause' in error).toBe(false);
    }
  });

  async function seed(suffix: string, withCredential = true) {
    const principalId = createOperationsHumanPrincipalId('c2-principal-' + suffix);
    const accountId = createOperationsAccountId('c2-account-' + suffix);
    await connection.database.execute(
      sql`INSERT INTO operations_human_principals (principal_id, status, security_epoch, created_at, updated_at) VALUES (${principalId}, 'active', 0, ${now.toISOString()}, ${now.toISOString()})`,
    );
    await connection.database.execute(
      sql`INSERT INTO operations_accounts (account_id, principal_id, login_identifier_normalized, status, created_at, updated_at) VALUES (${accountId}, ${principalId}, ${suffix + '@fixture.invalid'}, 'active', ${now.toISOString()}, ${now.toISOString()})`,
    );
    if (withCredential)
      await composition.credentialRepository.createPasswordCredential({
        id: createOperationsCredentialId('c2-credential-' + suffix),
        accountId,
        verifier: createEncodedPasswordVerifier('fixture-encoded-verifier'),
        createdAt: now,
      });
    const metadata = createOperationsSession({
      id: createOperationsSessionId('c2-session-' + suffix),
      account: {
        id: accountId,
        principalId,
        loginIdentifierNormalized: suffix + '@fixture.invalid',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      status: 'active',
      credentialVersion: 1,
      principalSecurityEpoch: 0,
      createdAt: now,
      lastActivityAt: now,
      idleExpiresAt: at(60000),
      absoluteExpiresAt: at(200000),
    });
    return {
      principalId,
      accountId,
      input: {
        now,
        credentialDigest: digest(),
        session: {
          ...metadata,
          credentialVersion: createOperationsSessionCredentialVersion(1),
          principalSecurityEpoch: createOperationsPrincipalSecurityEpoch(0),
        },
      },
    };
  }
  function rotation(
    record: OperationsSessionPersistenceRecord,
  ): Parameters<OperationsSessionRepository['rotateSession']>[0] {
    return {
      sessionId: record.session.id,
      principalId: record.session.principalId,
      accountId: record.session.accountId,
      credentialDigest: record.credentialDigest,
      expectedSessionVersion: record.sessionVersion,
      nextCredentialDigest: digest(),
      rotatedAt: at(1000),
      nextLastActivityAt: at(1000),
      nextIdleExpiresAt: at(70000),
    };
  }
  type InsertValues = {
    sessionId: string;
    principalId: string;
    accountId: string;
    bytes: Buffer;
    status: string;
    credentialVersion: number;
    epoch: number;
    version: number;
    createdAt: Date;
    activityAt: Date;
    idleAt: Date;
    absoluteAt: Date;
    revokedAt: Date | null;
  };
  function rawInsert(f: Awaited<ReturnType<typeof seed>>, overrides: Partial<InsertValues> = {}) {
    const v: InsertValues = {
      sessionId: f.input.session.id,
      principalId: f.principalId,
      accountId: f.accountId,
      bytes: Buffer.from(f.input.credentialDigest, 'hex'),
      status: 'active',
      credentialVersion: 1,
      epoch: 0,
      version: 1,
      createdAt: now,
      activityAt: now,
      idleAt: at(60000),
      absoluteAt: at(200000),
      revokedAt: null,
      ...overrides,
    };
    return connection.database.execute(
      sql`INSERT INTO operations_sessions (session_id, principal_id, account_id, credential_digest, status, credential_version, principal_security_epoch, session_version, created_at, last_activity_at, idle_expires_at, absolute_expires_at, revoked_at) VALUES (${v.sessionId}, ${v.principalId}, ${v.accountId}, ${v.bytes}, ${v.status}, ${v.credentialVersion}, ${v.epoch}, ${v.version}, ${v.createdAt.toISOString()}, ${v.activityAt.toISOString()}, ${v.idleAt.toISOString()}, ${v.absoluteAt.toISOString()}, ${v.revokedAt?.toISOString() ?? null})`,
    );
  }
  async function directReject(
    operation: PromiseLike<unknown>,
    expectedCode: string,
    constraint?: string,
  ) {
    // Consume raw SQL exceptions locally: assertions/logs contain only bounded SQLSTATE and name.
    const failure: unknown = await Promise.resolve(operation).then(
      () => undefined,
      (error: unknown) => error,
    );
    let driver: unknown = failure;
    if (typeof driver === 'object' && driver !== null && 'cause' in driver) driver = driver.cause;
    const code =
      typeof driver === 'object' && driver !== null && 'code' in driver ? driver.code : undefined;
    expect(code).toBe(expectedCode);
    if (constraint !== undefined)
      expect(
        typeof driver === 'object' && driver !== null && 'constraint_name' in driver
          ? driver.constraint_name
          : undefined,
      ).toBe(constraint);
  }
});
