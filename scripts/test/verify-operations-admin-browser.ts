import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  OperationsAdminFixture,
  runProcess,
  type ProcessEvidence,
} from './operations-admin-fixture.js';
import { initializeFirstOperationsAccount } from '../database/initialize-first-operations-account.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { createPostgresOperationsIdentityComposition } from '../../adapters/persistence/postgres/postgres-operations-identity-composition.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

// All browser actions use the repository-mandated gstack /browse driver.
// Authentication, Next BFF, Fastify and PostgreSQL are real. Only logout transport
// failures are injected in an external test proxy, never in production code.
const browser = process.env.PCI_BROWSE_EXECUTABLE;
assert(browser, 'Set PCI_BROWSE_EXECUTABLE to the installed gstack browse binary.');
const fixture = new OperationsAdminFixture();
const secrets = [randomBytes(32).toString('base64url')];
const password = secrets[0]!;
const evidence: Record<string, unknown> = {
  startedAt: new Date().toISOString(),
  driver: 'gstack /browse',
  commands: [],
  checks: [],
  proxy: [],
};
const redact = (text: string) =>
  secrets.reduce((result, secret) => result.split(secret).join('[REDACTED]'), text);
async function browse(...args: string[]) {
  const result = await runProcess(browser!, args);
  (evidence.commands as ProcessEvidence[]).push(
    JSON.parse(redact(JSON.stringify(result))) as ProcessEvidence,
  );
  assert.equal(result.exitCode, 0, redact(result.stderr));
  return result.stdout.trim();
}
async function js(expression: string) {
  return JSON.parse(await browse('js', expression)) as unknown;
}
function check(name: string, value: unknown) {
  (evidence.checks as unknown[]).push({ name, value });
}
async function listen(server: Server) {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const address = server.address();
  assert(address && typeof address !== 'string');
  return address.port;
}
async function poll(expression: string, expected: unknown) {
  for (let i = 0; i < 40; i++) {
    if (JSON.stringify(await js(expression)) === JSON.stringify(expected)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Browser state not reached: ${expression}`);
}
let connection: PostgresDatabaseConnection | undefined;
let next: ChildProcess | undefined;
let proxy: Server | undefined;
let api: Awaited<ReturnType<typeof createApiServer>> | undefined;
let nextStdout = '',
  nextStderr = '';
let fault: 'none' | '503' | 'network' = 'none';
let loginCredential: string | undefined;
let failure: unknown;
try {
  await fixture.start();
  const db = await fixture.database();
  await initializeFirstOperationsAccount({
    databaseUrl: db.url,
    loginIdentifier: 'browser-operator@example.test',
    password,
    evidenceRef: 'PCI-ENG-018-B-R1/browser-disposable',
    decisionRef: 'FD-018-B-BOOTSTRAP-01',
  });
  connection = createPostgresDatabase(db.runtimeUrl);
  const composition = createPostgresOperationsIdentityComposition(connection.database);
  api = await createApiServer({
    operationsHumanAuthenticationRuntime: composition.humanAuthenticationRuntime,
  });
  const apiOrigin = await api.listen({ host: '127.0.0.1', port: 0 });
  proxy = createServer((request, response) => {
    void (async () => {
      const path = request.url!;
      if (path.endsWith('/logout') && fault !== 'none') {
        (evidence.proxy as unknown[]).push({ path, fault });
        if (fault === 'network') {
          request.socket.destroy();
          return;
        }
        response.writeHead(503);
        response.end();
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        const bytes: unknown = chunk;
        if (typeof bytes === 'string') chunks.push(Buffer.from(bytes));
        else if (Buffer.isBuffer(bytes)) chunks.push(bytes);
        else throw new Error('Unsupported proxy request chunk.');
      }
      const headers = new Headers();
      for (const name of ['authorization', 'content-type']) {
        const value = request.headers[name];
        if (typeof value === 'string') headers.set(name, value);
      }
      const upstream = await fetch(apiOrigin + path, {
        method: request.method,
        headers,
        body: chunks.length ? Buffer.concat(chunks) : undefined,
      });
      (evidence.proxy as unknown[]).push({ path, status: upstream.status });
      const body = Buffer.from(await upstream.arrayBuffer());
      if (path.endsWith('/login') && upstream.status === 200) {
        const result = JSON.parse(body.toString()) as { credential: string };
        loginCredential = result.credential;
        secrets.push(loginCredential);
      }
      response.writeHead(upstream.status, Object.fromEntries(upstream.headers));
      response.end(body);
    })().catch(() => {
      response.writeHead(503);
      response.end();
    });
  });
  const proxyPort = await listen(proxy);
  const portProbe = createServer();
  const nextPort = await listen(portProbe);
  await new Promise<void>((r) => portProbe.close(() => r()));
  const origin = `http://127.0.0.1:${nextPort}`;
  next = spawn(
    process.execPath,
    [
      resolve('apps/admin-web/node_modules/next/dist/bin/next'),
      'dev',
      '--hostname',
      '127.0.0.1',
      '--port',
      String(nextPort),
    ],
    {
      cwd: resolve('apps/admin-web'),
      windowsHide: true,
      env: {
        ...process.env,
        ADMIN_API_ORIGIN: `http://127.0.0.1:${proxyPort}`,
        ADMIN_WEB_ORIGIN: origin,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  );
  next.stdout!.on('data', (b: Buffer) => {
    nextStdout += b.toString();
  });
  next.stderr!.on('data', (b: Buffer) => {
    nextStderr += b.toString();
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin + '/login', { signal: AbortSignal.timeout(10000) })).ok) break;
    } catch {
      /* Next is starting. */
    }
    assert(next.exitCode === null, redact(nextStderr));
    if (i === 99) throw new Error('Next did not become ready');
    await new Promise((r) => setTimeout(r, 250));
  }
  evidence.origins = { api: apiOrigin, proxy: `http://127.0.0.1:${proxyPort}`, admin: origin };
  check('browser', await js('JSON.stringify({userAgent:navigator.userAgent})'));
  await browse('goto', origin + '/');
  await poll('JSON.stringify(location.pathname)', '/login');
  check(
    'anonymous redirect',
    await js(
      'JSON.stringify({path:location.pathname,protectedShell:!!document.querySelector("nav")})',
    ),
  );
  const spoof = (await js(
    `JSON.stringify(await fetch('/api/operations/auth/session',{headers:{'x-principal-id':'forged','x-permissions':'catalog:write'}}).then(async r=>({status:r.status,body:await r.json()})))`,
  )) as { status: number };
  assert.equal(spoof.status, 401);
  check('forged headers without Session', spoof);
  await browse('fill', 'input[autocomplete="username"]', 'browser-operator@example.test');
  await browse('fill', 'input[type="password"]', password);
  await browse('click', 'button[type="submit"]');
  await poll('JSON.stringify(!!document.querySelector("nav[aria-label]"))', true);
  check(
    'authenticated shell',
    await js(
      'JSON.stringify({path:location.pathname,navigation:!!document.querySelector("nav"),identity:document.querySelector(".session-state")?.textContent})',
    ),
  );
  const cookies = JSON.parse(await browse('cookies')) as {
    name: string;
    value: string;
    httpOnly: boolean;
    domain: string;
    path: string;
    sameSite: string;
  }[];
  const cookie = cookies.find((c) => c.name === 'pci_operations_session');
  assert(cookie);
  assert(loginCredential);
  // Replace the just-recorded cookie output before any evidence is written.
  evidence.commands = JSON.parse(redact(JSON.stringify(evidence.commands))) as unknown;
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.domain, '127.0.0.1');
  assert.equal(cookie.path, '/');
  check('cookie metadata', { ...cookie, value: '[REDACTED]' });
  const storage = (await js(
    'JSON.stringify({cookie:document.cookie,local:Object.keys(localStorage),session:Object.keys(sessionStorage)})',
  )) as { cookie: string; local: string[]; session: string[] };
  assert(!storage.cookie.includes('pci_operations_session'));
  assert.deepEqual(storage.local, []);
  assert.deepEqual(storage.session, []);
  check('JavaScript/storage isolation', storage);
  const session = (await js(
    `JSON.stringify(await fetch('/api/operations/auth/session',{headers:{'x-principal-id':'forged','x-permissions':'catalog:write'}}).then(async r=>({status:r.status,body:await r.json()})))`,
  )) as { status: number; body: { sessionId: string; principalId: string; permissions: string[] } };
  assert.equal(session.status, 200);
  assert.notEqual(session.body.principalId, 'forged');
  assert.deepEqual(session.body.permissions, ['catalog:read', 'audit:read']);
  check('authoritative identity', session);
  for (const mode of ['503', 'network'] as const) {
    fault = mode;
    await browse('click', 'button.logout-button');
    await poll('JSON.stringify(!!document.querySelector("[role=alert]"))', true);
    const state = (await js(
      'JSON.stringify({path:location.pathname,shell:!!document.querySelector("nav"),alert:document.querySelector("[role=alert]")?.textContent})',
    )) as { shell: boolean };
    assert.equal(state.shell, true);
    const active =
      await db.admin`SELECT status FROM operations_sessions WHERE session_id=${session.body.sessionId}`;
    assert.equal(active[0]!.status, 'active');
    const remaining = JSON.parse(await browse('cookies')) as { name: string; value: string }[];
    assert(remaining.some((c) => c.name === cookie.name && c.value === cookie.value));
    check(`logout ${mode} preserves UI/cookie/server Session`, {
      state,
      database: active,
      cookieRetained: true,
    });
  }
  fault = 'none';
  await browse('click', 'button.logout-button');
  await poll('JSON.stringify(location.pathname)', '/login');
  const revoked =
    await db.admin`SELECT status FROM operations_sessions WHERE session_id=${session.body.sessionId}`;
  assert.equal(revoked[0]!.status, 'revoked');
  const cleared = JSON.parse(await browse('cookies')) as { name: string }[];
  assert(!cleared.some((c) => c.name === cookie.name));
  // The browse driver deliberately redacts cookie values. Replay the credential
  // observed in memory at the test proxy, never the driver's redaction marker.
  const stale = await fetch(apiOrigin + '/api/v1/operations/auth/session', {
    headers: { authorization: `Bearer ${loginCredential}` },
  });
  assert.equal(stale.status, 401);
  check('confirmed retry revokes and clears', {
    database: revoked,
    cookieCleared: true,
    oldCredentialStatus: stale.status,
  });
  await browse('goto', origin + '/');
  await poll('JSON.stringify(location.pathname)', '/login');
  check('postlogout protected access', 'redirect /login');
  evidence.result = 'PASS';
} catch (error) {
  failure = error;
  evidence.result = 'FAIL';
  evidence.failure = redact(error instanceof Error ? error.message : String(error));
} finally {
  if (next?.pid) {
    const cleanup = await runProcess('taskkill', ['/PID', String(next.pid), '/T', '/F']);
    evidence.nextCleanup = cleanup;
    evidence.next = { stdout: redact(nextStdout), stderr: redact(nextStderr) };
  }
  if (proxy) {
    proxy.closeAllConnections();
    await new Promise<void>((r) => proxy!.close(() => r()));
  }
  if (api) await api.close();
  if (connection) await connection.close();
  await fixture.close();
  evidence.postgresEvidence = `PCI-ENG-018-B-R1-${fixture.name}.json`;
  evidence.finishedAt = new Date().toISOString();
  const serialized = redact(JSON.stringify(evidence, null, 2));
  await writeFile(
    `docs/09_Engineering_Governance/evidence/PCI-ENG-018-B-R1-browser-${Date.now()}.json`,
    serialized + '\n',
    { flag: 'wx' },
  );
}
if (failure) {
  console.error(redact(failure instanceof Error ? failure.message : 'Browser acceptance failed.'));
  process.exitCode = 1;
} else console.log('Real Admin Web + BFF + API + restricted PostgreSQL browser acceptance PASS.');
