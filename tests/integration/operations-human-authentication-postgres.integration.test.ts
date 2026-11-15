import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { OperationsAdminFixture } from '../../scripts/test/operations-admin-fixture.js';
import { initializeFirstOperationsAccount } from '../../scripts/database/initialize-first-operations-account.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { createPostgresOperationsIdentityComposition } from '../../adapters/persistence/postgres/postgres-operations-identity-composition.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { Argon2idOperationsPasswordVerifier } from '../../adapters/auth/operations/argon2id-password-hasher.js';
import { createOperationsSessionVersion } from '../../applications/operations-identity/operations-session-repositories.js';
import { createOperationsHumanAuthenticationRuntime } from '../../applications/operations-identity/operations-human-authentication.js';
import { PostgresOperationsHumanAuthenticationStore } from '../../adapters/persistence/postgres/postgres-operations-human-authentication-store.js';

const enabled = process.env.PCI_RUN_OPERATIONS_AUTH_POSTGRES === '1';
const suite = enabled ? describe : describe.skip;
suite('Operations Admin restricted PostgreSQL 17.10 acceptance', () => {
  const fixture = new OperationsAdminFixture();
  let db: Awaited<ReturnType<OperationsAdminFixture['database']>>;
  let runtimeConnection: PostgresDatabaseConnection;
  let composition: ReturnType<typeof createPostgresOperationsIdentityComposition>;
  const password = ' correct horse battery staple ';
  const loginIdentifier = 'operator@example.test';
  const bootstrap = () =>
    initializeFirstOperationsAccount({
      databaseUrl: db.url,
      loginIdentifier,
      password,
      evidenceRef: 'PCI-ENG-018-B-R1/disposable',
      decisionRef: 'FD-018-B-BOOTSTRAP-01',
    });
  const login = () =>
    composition.humanAuthenticationRuntime.login({
      loginIdentifier,
      password,
      correlationId: 'test-login',
    });
  const counts = () =>
    db.admin`SELECT (SELECT count(*)::int FROM operations_human_principals) AS principals,(SELECT count(*)::int FROM operations_accounts) AS accounts,(SELECT count(*)::int FROM operations_human_principal_activation_histories) AS principal_histories,(SELECT count(*)::int FROM operations_account_activation_histories) AS account_histories,(SELECT count(*)::int FROM operations_identity_lifecycle_audits) AS audits,(SELECT count(*)::int FROM operations_credentials) AS credentials,(SELECT count(*)::int FROM operations_sessions) AS sessions`;
  beforeAll(async () => {
    await fixture.start();
    db = await fixture.database();
    runtimeConnection = createPostgresDatabase(db.runtimeUrl);
    composition = createPostgresOperationsIdentityComposition(runtimeConnection.database);
  }, 180000);
  afterAll(async () => {
    if (runtimeConnection) await runtimeConnection.close();
    await fixture.close();
  }, 60000);
  it('rejects malformed bootstrap Argon2id encoding before any identity mutation', async () => {
    let failure: { code?: string; message?: string } = {};
    try {
      await db.migration`SELECT operations_api.initialize_first_admin('bad-p','bad-a','bad-c',${loginIdentifier},'$argon2id$invalid','bad-op','bad-correlation','disposable-evidence','FD-018-B-BOOTSTRAP-01')`;
    } catch (error) {
      const pg = error as { code: string; message: string };
      failure = { code: pg.code, message: pg.message };
    }
    expect(failure).toEqual({ code: '22023', message: 'Invalid initial admin parameters' });
    expect((await counts())[0]).toEqual({
      principals: 0,
      accounts: 0,
      principal_histories: 0,
      account_histories: 0,
      audits: 0,
      credentials: 0,
      sessions: 0,
    });
    fixture.evidence.malformedVerifier = { failure, mutations: 0 };
  });
  it('rolls back all first-activation work on an actual credential INSERT failure', async () => {
    await db.admin.unsafe(
      `CREATE FUNCTION public.fail_bootstrap_credential() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected credential failure' USING ERRCODE='P0B01'; END $$; CREATE TRIGGER fail_bootstrap BEFORE INSERT ON public.operations_credentials FOR EACH ROW EXECUTE FUNCTION public.fail_bootstrap_credential()`,
    );
    const encoded = await new Argon2idOperationsPasswordVerifier().hash(password);
    let failure: { code?: string; message?: string } = {};
    try {
      await db.migration.begin(
        (tx) =>
          tx`SELECT operations_api.initialize_first_admin('fault-p','fault-a','fault-c',${loginIdentifier},${encoded},'fault-op','fault-correlation','disposable-fault-evidence','FD-018-B-BOOTSTRAP-01')`,
      );
    } catch (error) {
      const pg = error as { code: string; message: string };
      failure = { code: pg.code, message: pg.message };
    }
    expect(failure).toEqual({ code: 'P0B01', message: 'Injected credential failure' });
    await expect(bootstrap()).rejects.toThrow('reconcile');
    const state = await counts();
    expect(state[0]).toEqual({
      principals: 0,
      accounts: 0,
      principal_histories: 0,
      account_histories: 0,
      audits: 0,
      credentials: 0,
      sessions: 0,
    });
    fixture.evidence.bootstrapRollback = { fault: 'credential BEFORE INSERT', failure, state };
    await db.admin.unsafe(
      'DROP TRIGGER fail_bootstrap ON public.operations_credentials; DROP FUNCTION public.fail_bootstrap_credential()',
    );
  });
  it('fails closed if public schema becomes writable by an untrusted role', async () => {
    await db.admin.unsafe('GRANT CREATE ON SCHEMA public TO PUBLIC');
    try {
      await expect(bootstrap()).rejects.toThrow('reconcile');
      expect((await counts())[0]!.principals).toBe(0);
    } finally {
      await db.admin.unsafe('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    }
    fixture.evidence.schemaTrust = {
      untrustedPublicCreate: 'refused without identity writes',
      fixtureGrantRevoked: true,
    };
  });
  it('serializes first bootstrap, records ordered creation and first activation, repeats without effects', async () => {
    const results = await Promise.allSettled([bootstrap(), bootstrap()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      results.filter(
        (r) =>
          r.status === 'rejected' &&
          r.reason instanceof Error &&
          r.reason.message === 'ALREADY_INITIALIZED',
      ),
    ).toHaveLength(1);
    const before = await counts();
    expect(before[0]).toEqual({
      principals: 1,
      accounts: 1,
      principal_histories: 1,
      account_histories: 1,
      audits: 4,
      credentials: 1,
      sessions: 0,
    });
    const state = await db.admin<
      { pa: string; aa: string }[]
    >`SELECT p.status,p.security_epoch,a.status AS account_status,ph.activation_history AS principal_history,ah.activation_history AS account_history,ph.last_history_audit_id AS pa,ah.last_history_audit_id AS aa,c.version,c.verifier LIKE '$argon2id$%' AS argon2id FROM operations_human_principals p JOIN operations_accounts a USING(principal_id) JOIN operations_human_principal_activation_histories ph USING(principal_id) JOIN operations_account_activation_histories ah USING(account_id) JOIN operations_credentials c USING(account_id)`;
    expect(state[0]).toMatchObject({
      status: 'active',
      security_epoch: 0,
      account_status: 'active',
      principal_history: 'previously_activated',
      account_history: 'previously_activated',
      version: 1,
      argon2id: true,
    });
    const audits = await db.admin<
      { operation_type: string }[]
    >`SELECT audit_id,operation_id,correlation_id,subject_type,operation_type,before_status,after_status,before_activation_history,after_activation_history,before_principal_epoch,after_principal_epoch,evidence_ref,decision_ref FROM operations_identity_lifecycle_audits ORDER BY recorded_at`;
    expect(audits.map((a) => a.operation_type)).toEqual([
      'principal_created',
      'account_created',
      'principal_first_activated',
      'account_first_activated',
    ]);
    expect(audits[0]).toMatchObject({
      after_status: 'pending',
      after_activation_history: 'never_activated',
    });
    expect(audits[1]).toMatchObject({
      after_status: 'invited',
      after_activation_history: 'never_activated',
    });
    expect(audits[2]).toMatchObject({
      audit_id: state[0]!.pa,
      before_status: 'pending',
      after_status: 'active',
      before_principal_epoch: 0,
      after_principal_epoch: 0,
    });
    expect(audits[3]).toMatchObject({
      audit_id: state[0]!.aa,
      before_status: 'invited',
      after_status: 'active',
      before_principal_epoch: 0,
      after_principal_epoch: 0,
    });
    await expect(bootstrap()).rejects.toThrow('ALREADY_INITIALIZED');
    expect(await counts()).toEqual(before);
    fixture.evidence.bootstrap = {
      state,
      audits,
      counts: before,
      concurrency: 'one success / one ALREADY_INITIALIZED',
      repeat: 'no effects',
    };
  });
  it('enforces restricted owner/initializer ACL and column-only Runtime session writes', async () => {
    const acl =
      await db.admin`SELECT session_user,current_user, has_function_privilege('pci_ops_runtime','operations_api.initialize_first_admin(text,text,text,text,text,text,text,text,text)','EXECUTE') AS runtime_bootstrap,has_function_privilege('pci_ops_runtime','public.operations_first_bootstrap_guard()','EXECUTE') AS runtime_guard,has_function_privilege('pci_ops_migration','operations_api.initialize_first_admin(text,text,text,text,text,text,text,text,text)','EXECUTE') AS initializer,pg_has_role('pci_ops_runtime','pci_ops_function_owner','MEMBER') AS runtime_member`;
    expect(acl[0]).toMatchObject({
      runtime_bootstrap: false,
      runtime_guard: false,
      initializer: true,
      runtime_member: false,
    });
    const tables =
      await db.admin`SELECT c.relname,pg_get_userbyid(c.relowner) AS owner,has_table_privilege('pci_ops_runtime',c.oid,'INSERT') AS insert_table,has_table_privilege('pci_ops_runtime',c.oid,'UPDATE') AS update_table,has_table_privilege('pci_ops_runtime',c.oid,'DELETE') AS delete_table,has_table_privilege('pci_ops_runtime',c.oid,'TRUNCATE') AS truncate_table,has_table_privilege('pci_ops_runtime',c.oid,'MAINTAIN') AS maintain FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('operations_human_principals','operations_accounts','operations_credentials','operations_sessions') ORDER BY c.relname`;
    for (const row of tables)
      expect(row).toMatchObject({
        insert_table: false,
        update_table: false,
        delete_table: false,
        truncate_table: false,
        maintain: false,
      });
    fixture.evidence.acl = {
      acl,
      tables,
      runtimeIdentity: await runtimeConnection.database.execute(
        sql`SELECT session_user,current_user,pg_backend_pid()`,
      ),
    };
  });
  it('authenticates with Argon2id, keeps password bytes, stores only digest and fixed timeouts', async () => {
    const result = await login();
    expect(result.permissions).toEqual([
      'catalog:read',
      'audit:read',
      'offering:read',
      'request:read',
      'catalog:draft:create',
      'catalog:draft:update',
      'catalog:policy:activate',
    ]);
    const digest = createHash('sha256').update(result.credential).digest('hex');
    const rows =
      await db.admin`SELECT encode(credential_digest,'hex')=${digest} AS digest_matches,status,session_version,extract(epoch FROM idle_expires_at-created_at)::int AS idle_seconds,extract(epoch FROM absolute_expires_at-created_at)::int AS absolute_seconds FROM operations_sessions WHERE session_id=${result.sessionId}`;
    expect(rows[0]).toEqual({
      digest_matches: true,
      status: 'active',
      session_version: 1,
      idle_seconds: 28800,
      absolute_seconds: 86400,
    });
    await expect(
      composition.humanAuthenticationRuntime.resolveActorContext({
        accessToken: result.credential,
        correlationId: 'valid',
      }),
    ).resolves.toMatchObject({ actor: { kind: 'operations_human' } });
    for (const [identifier, secret] of [
      [loginIdentifier, password.trim()],
      [loginIdentifier, 'incorrect password value'],
      ['unknown@example.test', password],
    ]) {
      await expect(
        composition.humanAuthenticationRuntime.login({
          loginIdentifier: identifier!,
          password: secret!,
          correlationId: 'invalid',
        }),
      ).rejects.toThrow('could not be verified');
    }
    fixture.evidence.authentication = { digestOnly: rows, fixedPermissions: result.permissions };
  });
  it('denies invalid Principal/Account and unknown history without treating Creator auth as Operations auth', async () => {
    await db.admin`UPDATE operations_human_principals SET status='suspended'`;
    await expect(login()).rejects.toThrow();
    await db.admin`UPDATE operations_human_principals SET status='active'`;
    await db.admin`UPDATE operations_accounts SET status='locked'`;
    await expect(login()).rejects.toThrow();
    await db.admin`UPDATE operations_accounts SET status='active'`;
    const encoded = await new Argon2idOperationsPasswordVerifier().hash(password);
    const unknown = await fixture.database(async (admin) => {
      await admin`INSERT INTO operations_human_principals(principal_id,status) VALUES ('legacy','active')`;
      await admin`INSERT INTO operations_accounts(account_id,principal_id,status,login_identifier_normalized) VALUES ('legacy-account','legacy','active','legacy@example.test')`;
      await admin`INSERT INTO operations_credentials(credential_id,account_id,kind,status,verifier,version) VALUES ('legacy-credential','legacy-account','password','active',${encoded},1)`;
    });
    const connection = createPostgresDatabase(unknown.runtimeUrl);
    try {
      await expect(
        createPostgresOperationsIdentityComposition(
          connection.database,
        ).humanAuthenticationRuntime.login({
          loginIdentifier: 'legacy@example.test',
          password,
          correlationId: 'unknown',
        }),
      ).rejects.toThrow();
    } finally {
      await connection.close();
    }
    fixture.evidence.denials = {
      principal: 'suspended',
      account: 'locked',
      history: 'legacy backfill unknown',
    };
  }, 120000);
  it('rejects stale Epoch / Credential Version and expired sessions; enforces CAS', async () => {
    const epochSession = await login();
    await db.admin`UPDATE operations_human_principals SET security_epoch=security_epoch+1`;
    await expect(
      composition.humanAuthenticationRuntime.resolveActorContext({
        accessToken: epochSession.credential,
        correlationId: 'epoch',
      }),
    ).rejects.toThrow();
    const versionSession = await login();
    await db.admin`UPDATE operations_credentials SET status='revoked',revoked_at=now(),updated_at=now()`;
    const encoded = await new Argon2idOperationsPasswordVerifier().hash(password);
    await db.admin`INSERT INTO operations_credentials(credential_id,account_id,kind,status,verifier,version) SELECT 'next-credential',account_id,'password','active',${encoded},2 FROM operations_accounts`;
    await expect(
      composition.humanAuthenticationRuntime.resolveActorContext({
        accessToken: versionSession.credential,
        correlationId: 'version',
      }),
    ).rejects.toThrow();
    const stale = await login();
    await expect(
      composition.sessionRepository.revokeSession({
        sessionId: stale.sessionId,
        principalId: stale.principalId,
        accountId: stale.accountId,
        expectedSessionVersion: createOperationsSessionVersion(99),
        revokedAt: new Date(),
      }),
    ).rejects.toThrow();
    const start = new Date();
    let clock = start;
    const timed = createOperationsHumanAuthenticationRuntime({
      store: new PostgresOperationsHumanAuthenticationStore(runtimeConnection.database),
      passwordVerifier: new Argon2idOperationsPasswordVerifier(),
      sessionRepository: composition.sessionRepository,
      now: () => clock,
    });
    const idle = await timed.login({ loginIdentifier, password, correlationId: 'idle' });
    const absolute = await timed.login({ loginIdentifier, password, correlationId: 'absolute' });
    for (const hours of [7, 14, 21, 23]) {
      clock = new Date(start.getTime() + hours * 3600000);
      await timed.resolveActorContext({ accessToken: absolute.credential, correlationId: 'touch' });
    }
    const touched =
      await db.admin`SELECT idle_expires_at=absolute_expires_at AS capped,extract(epoch FROM absolute_expires_at-created_at)::int AS absolute_seconds FROM operations_sessions WHERE session_id=${absolute.sessionId}`;
    expect(touched[0]).toEqual({ capped: true, absolute_seconds: 86400 });
    await expect(
      timed.resolveActorContext({ accessToken: idle.credential, correlationId: 'idle-expiry' }),
    ).rejects.toThrow();
    clock = new Date(start.getTime() + 24 * 3600000);
    await expect(
      timed.resolveActorContext({
        accessToken: absolute.credential,
        correlationId: 'absolute-expiry',
      }),
    ).rejects.toThrow();
    fixture.evidence.sessionDenials = {
      epoch: true,
      credentialVersion: true,
      staleSessionVersion: true,
      idleExpiry: true,
      absoluteExpiry: true,
      touched,
    };
  });
  it('revokes server sessions and safely repeats logout for already revoked / absent credentials', async () => {
    const result = await login();
    await composition.humanAuthenticationRuntime.logout({
      credential: result.credential,
      correlationId: 'logout',
    });
    await composition.humanAuthenticationRuntime.logout({
      credential: result.credential,
      correlationId: 'logout-retry',
    });
    await composition.humanAuthenticationRuntime.logout({
      credential: 'Z'.repeat(43),
      correlationId: 'absent',
    });
    expect(
      (
        await db.admin`SELECT status FROM operations_sessions WHERE session_id=${result.sessionId}`
      )[0]!.status,
    ).toBe('revoked');
    await expect(
      composition.humanAuthenticationRuntime.resolveActorContext({
        accessToken: result.credential,
        correlationId: 'revoked',
      }),
    ).rejects.toThrow();
  });
  it('creates independent digest-only Sessions for concurrent valid logins', async () => {
    const sessions = await Promise.all([login(), login()]);
    expect(sessions[0].credential).not.toBe(sessions[1].credential);
    expect(sessions[0].sessionId).not.toBe(sessions[1].sessionId);
    const rows =
      await db.admin`SELECT session_id,status FROM operations_sessions WHERE session_id IN (${sessions[0].sessionId},${sessions[1].sessionId})`;
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === 'active')).toBe(true);
    fixture.evidence.concurrentLogin = { sessions: rows, distinctCredentials: true };
  });
  it('returns nonzero child process exit codes for SQL and COMMIT failures with SQL+Journal rollback', async () => {
    for (const kind of ['sqlFailure', 'commitFailure'] as const) {
      const result = await fixture.failureDatabase(kind);
      expect(result.process.exitCode).toBe(1);
      expect(result.process.stdout.includes('confirmed-success')).toBe(false);
      expect(result.state[0]).toEqual({ marker: null, child: null, journal_count: 0 });
    }
    const repeat = await fixture.migrate(db.name, join(fixture.folder, 'complete'));
    expect(repeat.exitCode).toBe(0);
    expect(repeat.stdout).toContain('"applied":0,"skipped":6');
  }, 60000);
  it('runs real HTTP authentication and refuses spoofed identity headers', async () => {
    const server = await createApiServer({
      operationsHumanAuthenticationRuntime: composition.humanAuthenticationRuntime,
    });
    try {
      const anonymous = await server.inject({
        method: 'GET',
        url: '/api/v1/operations/auth/session',
        headers: { 'x-principal-id': 'fake', 'x-operations-permissions': 'catalog:write' },
      });
      expect(anonymous.statusCode).toBe(401);
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/operations/auth/login',
        payload: { loginIdentifier, password },
      });
      expect(response.statusCode).toBe(200);
      const data = response.json<{ credential: string }>();
      const session = await server.inject({
        method: 'GET',
        url: '/api/v1/operations/auth/session',
        headers: { authorization: `Bearer ${data.credential}`, 'x-principal-id': 'fake' },
      });
      expect(session.statusCode).toBe(200);
      expect(session.json<{ principalId: string }>().principalId).not.toBe('fake');
      const logout = await server.inject({
        method: 'POST',
        url: '/api/v1/operations/auth/logout',
        headers: { authorization: `Bearer ${data.credential}` },
      });
      expect(logout.statusCode).toBe(204);
      fixture.evidence.http = {
        anonymous: anonymous.statusCode,
        login: response.statusCode,
        session: session.statusCode,
        logout: logout.statusCode,
      };
    } finally {
      await server.close();
    }
  });
});
