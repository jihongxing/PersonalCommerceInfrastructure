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
import { PostgresServicePolicyCatalogRepository } from '../../adapters/persistence/postgres/postgres-service-policy-catalog-repository.js';
import {
  PostgresCommerceActionRepository,
  PostgresCommerceIdentityRepository,
  PostgresCapabilityRepository,
  PostgresDistributionAssetRepository,
  PostgresOfferingRepository,
} from '../../adapters/persistence/postgres/postgres-creator-identity-repositories.js';
import { createOperationsFlowReadService } from '../../applications/operations-admin/operations-flow-read-service.js';
import { PostgresOperationsQueryRepository } from '../../adapters/persistence/postgres/postgres-operations-query-repository.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

// All browser actions use the repository-mandated gstack /browse driver.
// Authentication, Next BFF, Fastify and PostgreSQL are real. Only logout transport
// failures are injected in an external test proxy, never in production code.
const browser = process.env.PCI_BROWSE_EXECUTABLE;
assert(browser, 'Set PCI_BROWSE_EXECUTABLE to the installed gstack browse binary.');
const runWorkspace = process.env.PCI_RUN_OPERATIONS_ADMIN_F === '1';
const runCatalogControl = runWorkspace || process.env.PCI_RUN_OPERATIONS_ADMIN_D === '1';
const runCatalogAudit =
  runCatalogControl ||
  process.env.PCI_RUN_OPERATIONS_ADMIN_C === '1' ||
  process.env.PCI_RUN_OPERATIONS_ADMIN_E === '1';
const runFlow = runWorkspace || process.env.PCI_RUN_OPERATIONS_ADMIN_E === '1';
const fixture = new OperationsAdminFixture({
  taskLabel: runWorkspace
    ? 'PCI-ENG-018-F'
    : runFlow
      ? 'PCI-ENG-018-E'
      : runCatalogControl
        ? 'PCI-ENG-018-D'
        : runCatalogAudit
          ? 'PCI-ENG-018-C'
          : 'PCI-ENG-018-B-R1',
  includeCatalogFixture: runCatalogAudit,
  includeFlowFixture: runFlow,
});
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
  const bodyText = await js('JSON.stringify(document.body.innerText.slice(-1_000))');
  throw new Error(`Browser state not reached: ${expression}; body=${bodyText}`);
}
let connection: PostgresDatabaseConnection | undefined;
let next: ChildProcess | undefined;
let proxy: Server | undefined;
let api: Awaited<ReturnType<typeof createApiServer>> | undefined;
let nextStdout = '',
  nextStderr = '';
const apiLogs: unknown[] = [];
let fault: 'none' | '503' | 'network' = 'none';
let loginCredential: string | undefined;
let failure: unknown;
try {
  await fixture.start();
  const db = await fixture.database();
  const flowSnapshot = async () => db.admin`
    SELECT 'offerings' AS relation, count(*)::int AS count, md5(string_agg(row_to_json(t)::text, '' ORDER BY id)) AS hash FROM public.service_offerings t
    UNION ALL SELECT 'requests', count(*)::int, md5(string_agg(row_to_json(t)::text, '' ORDER BY id)) FROM public.commerce_actions t
    UNION ALL SELECT 'distribution', count(*)::int, md5(string_agg(row_to_json(t)::text, '' ORDER BY offering_id)) FROM public.distribution_assets t
  `;
  const catalogSnapshot = async () => db.admin`
    SELECT 'releases' AS relation, count(*)::int AS count, md5(string_agg(row_to_json(t)::text, '' ORDER BY policy_version)) AS hash FROM public.service_policy_releases t
    UNION ALL SELECT 'capabilities', count(*)::int, md5(string_agg(row_to_json(t)::text, '' ORDER BY id, policy_version)) FROM public.service_policy_capabilities t
    UNION ALL SELECT 'templates', count(*)::int, md5(string_agg(row_to_json(t)::text, '' ORDER BY id, policy_version)) FROM public.service_policy_templates t
    UNION ALL SELECT 'audits', count(*)::int, md5(string_agg(row_to_json(t)::text, '' ORDER BY id)) FROM public.service_policy_audits t
  `;
  const flowBefore = runFlow ? await flowSnapshot() : undefined;
  await initializeFirstOperationsAccount({
    databaseUrl: db.url,
    loginIdentifier: 'browser-operator@example.test',
    password,
    evidenceRef: `${fixture.taskLabel}/browser-disposable`,
    decisionRef: 'FD-018-B-BOOTSTRAP-01',
  });
  connection = createPostgresDatabase(db.runtimeUrl);
  const composition = createPostgresOperationsIdentityComposition(connection.database);
  const operationsQueryRepository = new PostgresOperationsQueryRepository(connection.client);
  const operationsFlowReadService = createOperationsFlowReadService({
    queries: operationsQueryRepository,
    offeringRepository: new PostgresOfferingRepository(connection.database),
    distributionAssetRepository: new PostgresDistributionAssetRepository(connection.database),
    identityRepository: new PostgresCommerceIdentityRepository(connection.database),
    capabilityRepository: new PostgresCapabilityRepository(connection.database),
    commerceActionRepository: new PostgresCommerceActionRepository(connection.database),
  });
  api = await createApiServer({
    operationsHumanAuthenticationRuntime: composition.humanAuthenticationRuntime,
    servicePolicyCatalogRepository: new PostgresServicePolicyCatalogRepository(connection.database),
    operationsFlowReadService,
    operationsQueryRepository,
    logger: {
      debug() {},
      info() {},
      warn() {},
      error(event, context) {
        apiLogs.push({ event, context });
      },
    },
  });
  const apiOrigin = await api.listen({ host: '127.0.0.1', port: 0 });
  if (runCatalogControl) {
    const legacyRoutes = [
      { method: 'GET', path: '/api/v1/operations/service-policy/workspace' },
      { method: 'GET', path: '/api/v1/operations/service-policy/audit' },
      {
        method: 'PATCH',
        path: '/api/v1/operations/service-policy/capabilities/capability-dance-teaching',
        body: { status: 'paused', reason: 'retired-route-probe' },
      },
      {
        method: 'PATCH',
        path: '/api/v1/operations/service-policy/templates/template-dance-private-lesson',
        body: { status: 'paused', reason: 'retired-route-probe' },
      },
      {
        method: 'POST',
        path: '/api/v1/operations/service-policy/releases',
        body: { version: 'v1', reason: 'retired-route-probe' },
      },
    ] as const;
    const before = await catalogSnapshot();
    const results: unknown[] = [];
    for (const route of legacyRoutes) {
      for (const authorization of ['Bearer test-operations-token', 'Bearer invalid-token']) {
        const response = await fetch(apiOrigin + route.path, {
          method: route.method,
          headers: {
            authorization,
            ...(route.body === undefined ? {} : { 'content-type': 'application/json' }),
          },
          ...(route.body === undefined ? {} : { body: JSON.stringify(route.body) }),
        });
        const body = (await response.json()) as { error?: { code?: string } };
        assert.equal(response.status, 410);
        assert.equal(body.error?.code, 'legacy_catalog_operations_route_retired');
        results.push({
          method: route.method,
          path: route.path,
          authorization,
          status: response.status,
          code: body.error?.code,
        });
      }
      const forged = await fetch(apiOrigin + route.path, {
        method: route.method,
        headers: {
          'x-principal-id': 'forged-principal',
          'x-permissions': 'catalog:policy:activate',
          ...(route.body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(route.body === undefined ? {} : { body: JSON.stringify(route.body) }),
      });
      const body = (await forged.json()) as { error?: { code?: string } };
      assert.equal(forged.status, 410);
      assert.equal(body.error?.code, 'legacy_catalog_operations_route_retired');
      results.push({
        method: route.method,
        path: route.path,
        authorization: 'forged-headers',
        status: forged.status,
        code: body.error?.code,
      });
    }
    const after = await catalogSnapshot();
    assert.deepEqual(after, before);
    check('legacy Catalog routes retired', { results, before, after, unchanged: true });
  }
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
      const body = Buffer.from(await upstream.arrayBuffer());
      const proxyEvidence: Record<string, unknown> = { path, status: upstream.status };
      if (upstream.status >= 400) proxyEvidence.body = body.toString('utf8').slice(0, 2_000);
      (evidence.proxy as unknown[]).push(proxyEvidence);
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
  assert.deepEqual(session.body.permissions, [
    'catalog:read',
    'audit:read',
    'offering:read',
    'request:read',
    'catalog:draft:create',
    'catalog:draft:update',
    'catalog:policy:activate',
  ]);
  check('authoritative identity', session);
  if (runWorkspace) {
    await poll('JSON.stringify(!!document.querySelector(".metric-number"))', true);
    const overview = (await js(
      "JSON.stringify(await fetch('/api/operations/overview').then(async r=>({status:r.status,body:await r.json()})))",
    )) as {
      status: number;
      body: { modules: { offering: { total: number }; request: { total: number } } };
    };
    assert.equal(overview.status, 200);
    assert.equal(overview.body.modules.offering.total, 1);
    assert.equal(overview.body.modules.request.total, 3);
    check('Overview real snapshot', overview);
    await browse('viewport', '390x844');
    assert.equal(
      await js('JSON.stringify(document.documentElement.scrollWidth<=innerWidth)'),
      true,
    );
    check('responsive overview', { width: 390, noHorizontalOverflow: true });
    await browse('viewport', '1280x900');
    const searches = [
      ['Catalog', 'capability-dance-teaching', 'capabilities'],
      ['Offering', 'offering-flow-fixture', 'offerings'],
      ['Request', 'request-flow-fixture', 'requests'],
      ['Audit', 'catalog-browser-audit', 'audit'],
    ] as const;
    for (const [module, id, path] of searches) {
      await browse('goto', origin + '/search');
      await poll(
        'JSON.stringify(!!document.querySelector("input[placeholder=\\"业务 ID、名称或状态\\"]"))',
        true,
      );
      await browse('fill', 'input[placeholder="业务 ID、名称或状态"]', id);
      await browse('click', 'button[type="submit"]');
      await poll(`JSON.stringify(!!document.querySelector('a[href="/${path}?id=${id}"]'))`, true);
      await browse('click', `a[href="/${path}?id=${id}"]`);
      await poll('JSON.stringify(!!document.querySelector("aside[aria-label]"))', true);
      check(
        'Search to ' + module + ' detail',
        await js(
          'JSON.stringify({path:location.pathname,search:location.search,detail:document.querySelector("aside[aria-label]")?.textContent})',
        ),
      );
    }
  }
  if (runCatalogControl) {
    await browse('goto', origin + '/policy-versions');
    await poll('JSON.stringify(location.pathname)', '/policy-versions');
    await poll('JSON.stringify(!!document.querySelector("button"))', true);
    await browse(
      'js',
      `(() => {
        const button = [...document.querySelectorAll('button')].find((candidate) =>
          candidate.textContent?.includes('新建草稿'),
        );
        if (!button) throw new Error('Create draft button not found');
        button.click();
        return 'created';
      })()`,
    );
    await poll('JSON.stringify(document.body.innerText.includes("草稿版本"))', true);
    check(
      'catalog draft created',
      await js(
        'JSON.stringify({path:location.pathname,version:document.querySelector("strong")?.textContent,activeMessage:document.body.innerText.includes("活动版本保持不变")})',
      ),
    );
    await browse(
      'js',
      `(() => {
        const select = [...document.querySelectorAll('select')].find((candidate) =>
          [...candidate.options].some((option) => option.value === 'review'),
        );
        if (!select) throw new Error('Catalog risk selector not found');
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
        setter?.call(select, 'review');
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return 'edited';
      })()`,
    );
    await poll('JSON.stringify(document.body.innerText.includes("草稿变更已保存"))', true);
    const beforePreview = await catalogSnapshot();
    await browse(
      'js',
      `(() => {
        const button = [...document.querySelectorAll('button')].find((candidate) =>
          candidate.textContent?.includes('预览'),
        );
        if (!button) throw new Error('Preview button not found');
        button.click();
        return 'preview';
      })()`,
    );
    await poll('JSON.stringify(document.body.innerText.includes("相对当前有效版本的差异"))', true);
    const afterPreview = await catalogSnapshot();
    assert.deepEqual(afterPreview, beforePreview);
    check('preview data invariance', { before: beforePreview, after: afterPreview, unchanged: true });
    await browse(
      'js',
      `(() => {
        const button = [...document.querySelectorAll('button')].find((candidate) =>
          candidate.textContent?.includes('校验'),
        );
        if (!button) throw new Error('Validate button not found');
        button.click();
        return 'validated';
      })()`,
    );
    await poll('JSON.stringify(document.body.innerText.includes("校验通过"))', true);
    await browse('js', 'window.confirm = () => true');
    await browse(
      'js',
      `(() => {
        const button = [...document.querySelectorAll('button')].find((candidate) =>
          candidate.textContent?.includes('确认激活'),
        );
        if (!button) throw new Error('Activate button not found');
        button.click();
        return 'activated';
      })()`,
    );
    await poll('JSON.stringify(document.body.innerText.includes("Catalog 政策已激活"))', true);
    check('catalog policy activated', await js('JSON.stringify({path:location.pathname})'));
    await browse('goto', origin + '/audit');
    await poll('JSON.stringify(location.pathname)', '/audit');
    await poll('JSON.stringify(!!document.querySelector("table"))', true);
    await browse(
      'js',
      `(() => {
        const select = [...document.querySelectorAll('select')].find((candidate) =>
          [...candidate.options].some((option) => option.value === 'activated'),
        );
        if (!select) throw new Error('Audit action selector not found');
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
        setter?.call(select, 'activated');
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return 'filtered';
      })()`,
    );
    await browse('click', 'button[type="submit"]');
    await poll('JSON.stringify(document.body.innerText.includes("activated"))', true);
    check('activation audit visible', await js('JSON.stringify({path:location.pathname})'));
  }
  if (runCatalogAudit) {
    await browse('goto', origin + '/capabilities');
    await poll('JSON.stringify(location.pathname)', '/capabilities');
    await poll('JSON.stringify(!!document.querySelector("table"))', true);
    check(
      'catalog list',
      await js(
        'JSON.stringify({path:location.pathname,rows:document.querySelectorAll("tbody tr").length,writeControls:[...document.querySelectorAll("button")].map(b=>b.textContent)})',
      ),
    );
    await browse('click', 'tbody tr:first-child button.text-button');
    await poll('JSON.stringify(!!document.querySelector("[aria-label=\\"Catalog 详情\\"]"))', true);
    check(
      'catalog detail',
      await js(
        'JSON.stringify({detail:!!document.querySelector("[aria-label=\\"Catalog 详情\\"]")})',
      ),
    );
    await browse('goto', origin + '/audit');
    await poll('JSON.stringify(location.pathname)', '/audit');
    await poll('JSON.stringify(!!document.querySelector("table"))', true);
    await browse('click', 'tbody tr:first-child button.text-button');
    await poll('JSON.stringify(!!document.querySelector("[aria-label=\\"Audit 详情\\"]"))', true);
    const auditView = (await js(
      'JSON.stringify({path:location.pathname,detail:!!document.querySelector("[aria-label=\\"Audit 详情\\"]"),platform:document.body.innerText.includes("Platform System")})',
    )) as { path: string; detail: boolean; platform: boolean };
    assert.equal(auditView.platform, true);
    check('audit list and detail', auditView);
  }
  if (runFlow) {
    await browse('goto', origin + '/offerings');
    await poll('JSON.stringify(location.pathname)', '/offerings');
    await poll('JSON.stringify(!!document.querySelector("table"))', true);
    check(
      'offering list',
      await js(
        'JSON.stringify({path:location.pathname,rows:document.querySelectorAll("tbody tr").length,writeMethods:[...document.querySelectorAll("button")].map(b=>b.textContent)})',
      ),
    );
    await browse('click', 'tbody tr:first-child button.text-button');
    await poll(
      'JSON.stringify(!!document.querySelector("[aria-label=\\"Offering 详情\\"]"))',
      true,
    );
    check(
      'offering detail',
      await js(
        'JSON.stringify({detail:!!document.querySelector("[aria-label=\\"Offering 详情\\"]"),published:document.body.innerText.includes("published")})',
      ),
    );
    await browse('goto', origin + '/requests?state=submitted');
    await poll('JSON.stringify(location.pathname)', '/requests');
    await poll('JSON.stringify(!!document.querySelector("table"))', true);
    check(
      'request list',
      await js(
        'JSON.stringify({path:location.pathname,rows:document.querySelectorAll("tbody tr").length})',
      ),
    );
    await browse('click', 'tbody tr:first-child button.text-button');
    await poll(
      'JSON.stringify(!!document.querySelector("[aria-label=\\"Customer Request 详情\\"]"))',
      true,
    );
    check(
      'request detail and creator decision',
      await js(
        'JSON.stringify({detail:!!document.querySelector("[aria-label=\\"Customer Request 详情\\"]"),submitted:document.body.innerText.includes("submitted"),decision:document.body.innerText.includes("not_recorded")})',
      ),
    );
    const relation = (await js(
      'JSON.stringify({link:document.querySelector("[aria-label=\\"Customer Request 详情\\"] a")?.getAttribute("href"),contentWithheld:document.body.innerText.includes("不返回原文")})',
    )) as { link: string; contentWithheld: boolean };
    assert.equal(relation.link, '/offerings?id=offering-flow-fixture');
    assert.equal(relation.contentWithheld, true);
    await browse('click', '[aria-label="Customer Request 详情"] a');
    await poll(
      'JSON.stringify(!!document.querySelector("[aria-label=\\"Offering 详情\\"]"))',
      true,
    );
    check(
      'Request to Offering to Capability association',
      await js(
        'JSON.stringify({path:location.pathname,capability:document.body.innerText.includes("capability-flow-fixture"),catalog:document.body.innerText.includes("capability-dance-teaching")})',
      ),
    );
    for (const decision of ['confirmed', 'declined']) {
      await browse('goto', origin + '/requests?state=' + decision);
      await poll('JSON.stringify(!!document.querySelector("table"))', true);
      await browse('click', 'tbody tr:first-child button.text-button');
      await poll(
        'JSON.stringify(!!document.querySelector("[aria-label=\\"Customer Request 详情\\"]"))',
        true,
      );
      const state = (await js(
        'JSON.stringify({text:document.querySelector("[aria-label=\\"Customer Request 详情\\"]")?.textContent})',
      )) as { text: string };
      assert(state.text.includes(decision));
      check('persisted Creator decision ' + decision, { recordedState: decision, shown: true });
    }
    const dto = (await js(
      "JSON.stringify(await fetch('/api/operations/requests/request-flow-fixture').then(async r=>({status:r.status,body:await r.json()})))",
    )) as { status: number; body: Record<string, unknown> };
    assert.equal(dto.status, 200);
    assert(!('requestMessage' in dto.body) && !('resultAccessToken' in dto.body));
    check('sensitive Request fields omitted', {
      status: dto.status,
      responseKeys: Object.keys(dto.body),
    });
    await browse('goto', origin + '/audit');
    await poll('JSON.stringify(!!document.querySelector("table"))', true);
    const flowAfter = await flowSnapshot();
    assert.deepEqual(flowAfter, flowBefore);
    check('business rows unchanged by reads', { before: flowBefore, after: flowAfter });
  }
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
  evidence.postgresEvidence = fixture.postgresEvidenceFileName;
  evidence.apiLogs = apiLogs;
  evidence.processExitCode = failure ? 1 : 0;
  evidence.finishedAt = new Date().toISOString();
  const serialized = redact(JSON.stringify(evidence, null, 2));
  await writeFile(
    `docs/09_Engineering_Governance/evidence/${fixture.taskLabel}-browser-${Date.now()}.json`,
    serialized + '\n',
    { flag: 'wx' },
  );
}
if (failure) {
  console.error(redact(failure instanceof Error ? failure.message : 'Browser acceptance failed.'));
  process.exitCode = 1;
} else console.log('Real Admin Web + BFF + API + restricted PostgreSQL browser acceptance PASS.');
