import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres, { type Sql } from 'postgres';
import { OperationsAdminFixture } from '../../scripts/test/operations-admin-fixture.js';
import { PostgresOperationsQueryRepository } from '../../adapters/persistence/postgres/postgres-operations-query-repository.js';
import { createOperationsWorkspaceReadService } from '../../applications/operations-admin/operations-workspace-read-service.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { ApplicationError } from '../../applications/core/application-error.js';
import type { OperationsHumanAuthenticationRuntime } from '../../applications/operations-identity/operations-human-authentication.js';
import type { FastifyInstance } from 'fastify';

const enabled = process.env.PCI_RUN_OPERATIONS_WORKSPACE_POSTGRES === '1';
describe.skipIf(!enabled)('Operations workspace and exception PostgreSQL query acceptance', () => {
  const fixture = new OperationsAdminFixture({
    taskLabel:
      process.env.PCI_RUN_OPERATIONS_ADMIN_019_A === '1' ? 'PCI-ENG-019-A' : 'PCI-ENG-018-F',
    includeCatalogFixture: true,
    includeFlowFixture: true,
  });
  let db: Awaited<ReturnType<OperationsAdminFixture['database']>>;
  let client: Sql, repository: PostgresOperationsQueryRepository, server: FastifyInstance;
  const queries: { query: string; parameters: unknown[] }[] = [];
  const actor = (permissions: string[]) =>
    createActorContext({
      actor: {
        kind: 'operations_human',
        principalId: 'p',
        accountId: 'a',
        sessionId: 's',
        permissions,
      },
      accountId: 'a',
      correlationId: 'f-test',
    });
  let before: unknown;
  const snapshot = () =>
    db.admin.unsafe(
      "SELECT rel,md5(string_agg(data,'' ORDER BY data)) hash FROM (SELECT 'offering' rel,row_to_json(t)::text data FROM service_offerings t UNION ALL SELECT 'request',row_to_json(t)::text FROM commerce_actions t UNION ALL SELECT 'audit',row_to_json(t)::text FROM service_policy_audits t UNION ALL SELECT 'capability',row_to_json(t)::text FROM service_policy_capabilities t UNION ALL SELECT 'template',row_to_json(t)::text FROM service_policy_templates t) s GROUP BY rel ORDER BY rel",
    );
  beforeAll(async () => {
    await fixture.start();
    db = await fixture.database();
    await db.admin.unsafe(`
      INSERT INTO service_policy_capabilities (id,slug,vertical,name,description,risk_tier,release_scope,version,policy_version,status)
      SELECT 'scale-'||lpad(n::text,3,'0'),'scale-'||n,'general','Scale capability '||n,'Safe description','low','vs01','v1','v1','active' FROM generate_series(1,137) n;
      INSERT INTO service_policy_templates (id,slug,capability_catalog_item_id,name,description,risk_tier,release_scope,required_fields,version,policy_version,status)
      SELECT 'scale-'||lpad(n::text,3,'0'),'scale-template-'||n,'scale-'||lpad(n::text,3,'0'),'Scale template '||n,'Safe template','low','vs01','[]','v1','v1','active' FROM generate_series(1,137) n;
      INSERT INTO service_offerings (id,creator_id,capability_ids,title,description,request_instructions,state,updated_at)
      SELECT 'scale-'||lpad(n::text,3,'0'),'creator-flow-fixture','["capability-flow-fixture"]','Scale offering '||n,'Safe description','Request', (ARRAY['draft','published','unpublished','archived'])[1+n%4],'2030-01-01' FROM generate_series(1,137) n;
      INSERT INTO commerce_actions (id,customer_id,creator_id,offering_id,request_message,result_access_token,state,updated_at)
      SELECT 'scale-'||lpad(n::text,3,'0'),'customer-flow-fixture','creator-flow-fixture','scale-'||lpad(n::text,3,'0'),'DO-NOT-SEARCH-PRIVATE','private-token-'||n,(ARRAY['draft','submitted','confirmed','declined'])[1+n%4],'2030-01-01' FROM generate_series(1,137) n;
      INSERT INTO service_policy_audits (id,actor_id,entity_type,entity_id,action,before_state,after_state,reason,policy_version,occurred_at,correlation_id,recorded_at)
      SELECT 'scale-'||lpad(n::text,3,'0'),(ARRAY['human-operator','provider-service','platform-system'])[1+n%3],'capability','scale-'||lpad(n::text,3,'0'),'updated','{"password":"not-returned"}','{"status":"active","sessionDigest":"not-returned"}','DO-NOT-SEARCH-PRIVATE','v1','2030-01-01','scale-correlation-'||n,'2031-01-01'::timestamptz-n*interval '1 second' FROM generate_series(1,137) n;
      INSERT INTO service_offerings (id,creator_id,capability_ids,title,description,request_instructions,state,updated_at)
      VALUES ('exception-published-no-distribution','creator-flow-fixture','["capability-flow-fixture"]','Published without distribution','Evidence fixture','Submit a request','published','2030-02-01');
      INSERT INTO service_policy_audits (id,actor_id,entity_type,entity_id,action,before_state,after_state,reason,policy_version,occurred_at,correlation_id,recorded_at)
      VALUES
        ('exception-activation-failed','operations-test','release','draft-exception','activation_failed','{}','{}','Fixture validation failure','v1','2030-02-02','exception-correlation-failed','2031-02-02'),
        ('exception-unknown-actor','mystery-actor','capability','capability-flow-fixture','updated','{}','{}','Unclassified actor fixture','v1','2030-02-03','exception-correlation-unknown','2031-02-03');
    `);
    before = await snapshot();
    client = postgres(db.runtimeUrl, {
      max: 1,
      prepare: false,
      debug: (_connection, query, parameters) =>
        queries.push({ query, parameters: parameters.map((value: unknown) => value) }),
    });
    repository = new PostgresOperationsQueryRepository(client);
    const runtime = {
      async resolveActorContext({ accessToken }: { accessToken: string }) {
        await Promise.resolve();
        if (accessToken === 'none') return actor([]);
        if (accessToken === 'provider')
          return createActorContext({
            actor: { kind: 'pilot_operations', operatorId: 'provider-service' },
            correlationId: 'f',
          });
        if (accessToken === 'platform')
          return createActorContext({ actor: { kind: 'platform' }, correlationId: 'f' });
        if (!['catalog', 'offering', 'request', 'audit', 'all'].includes(accessToken))
          throw new ApplicationError({
            category: 'authentication',
            code: 'invalid_session',
            message: 'Login required.',
          });
        return actor(
          accessToken === 'all'
            ? ['catalog:read', 'offering:read', 'request:read', 'audit:read']
            : [accessToken + ':read'],
        );
      },
      login: () => Promise.reject(new Error('unused')),
      logout: () => Promise.reject(new Error('unused')),
    } satisfies OperationsHumanAuthenticationRuntime;
    server = await createApiServer({
      operationsQueryRepository: repository,
      operationsHumanAuthenticationRuntime: runtime,
    });
  }, 180000);
  afterAll(async () => {
    if (db) {
      const after = await snapshot();
      fixture.evidence.businessReadIntegrity = {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after),
      };
      expect(after).toEqual(before);
    }
    fixture.evidence.queries = queries;
    if (server) await server.close();
    if (client) await client.end({ timeout: 0 });
    await fixture.close();
  }, 60000);
  it.each(['catalog', 'templates', 'offering', 'request', 'audit'] as const)(
    'database pagination, filtering and count for %s over 137 rows',
    async (module) => {
      const seen: string[] = [];
      const perPageSelects: number[] = [];
      for (let page = 1; page <= 7; page++) {
        const start = queries.length;
        const result =
          module === 'catalog' || module === 'templates'
            ? await repository.listCatalog(module === 'catalog' ? 'capabilities' : 'templates', {
                page,
                pageSize: 20,
                query: 'scale-',
              })
            : module === 'offering'
              ? await repository.listOfferings({ page, pageSize: 20, query: 'scale-' })
              : module === 'request'
                ? await repository.listRequests({ page, pageSize: 20, query: 'scale-' })
                : await repository.listAudit({ page, pageSize: 20, query: 'scale-' });
        expect(result.total).toBe(137);
        expect(result.items).toHaveLength(page === 7 ? 17 : 20);
        seen.push(...result.items.map((item) => item.id));
        const selects = queries.slice(start).filter((entry) => /^SELECT /i.test(entry.query));
        expect(
          selects.some(
            (entry) => entry.query.includes('LIMIT $') && entry.query.includes('OFFSET $'),
          ),
        ).toBe(true);
        perPageSelects.push(selects.length);
      }
      expect(new Set(seen).size).toBe(137);
      expect(seen).toEqual(
        [...seen].sort((a, b) => (module === 'audit' ? b.localeCompare(a) : a.localeCompare(b))),
      );
      expect(new Set(perPageSelects).size).toBe(1);
      fixture.evidence[module + 'Pagination'] = {
        rows: 137,
        pages: 7,
        pageSize: 20,
        unique: seen.length,
        perPageSelects,
        order: module === 'audit' ? 'occurred_at DESC,id DESC' : 'id ASC',
      };
      const beyond =
        module === 'audit'
          ? await repository.listAudit({ page: 100, pageSize: 20, query: 'scale-' })
          : await repository.listOfferings({ page: 100, pageSize: 20, query: 'scale-' });
      expect(beyond.items).toEqual([]);
      expect(beyond.total).toBe(137);
    },
  );
  it('filters states in SQL and projects associations without private Request fields', async () => {
    const result = await repository.listRequests({
      page: 1,
      pageSize: 100,
      query: 'scale-',
      state: 'submitted',
    });
    expect(result.total).toBe(35);
    expect(
      result.items.every(
        (item) => item.state === 'submitted' && item.offering?.id === item.offeringId,
      ),
    ).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(
      /DO-NOT-SEARCH-PRIVATE|private-token|requestMessage|resultAccessToken/,
    );
    expect(
      (
        await repository.listOfferings({
          page: 1,
          pageSize: 100,
          query: 'scale-',
          state: 'published',
        })
      ).total,
    ).toBe(35);
    const catalog = await repository.listCatalog('templates', {
      page: 1,
      pageSize: 20,
      status: 'paused',
    });
    expect(catalog.total).toBe(0);
    const audit = await repository.listAudit({
      page: 1,
      pageSize: 20,
      query: 'scale-',
      action: 'published',
    });
    expect(audit.total).toBe(0);
  });
  it('uses one exact snapshot and actual Domain state counts, with module permission isolation', async () => {
    const service = createOperationsWorkspaceReadService(repository);
    const overview = await service.overview(actor(['request:read']));
    expect(Object.keys(overview.modules)).toEqual(['request']);
    expect(overview.recentActivity).toBeUndefined();
    expect(overview.modules.request?.total).toBe(140);
    expect(overview.modules.request?.states).toEqual({
      draft: 34,
      submitted: 36,
      confirmed: 35,
      declined: 35,
    });
    expect(overview.consistency).toBe('repeatable_read_snapshot');
    expect(Date.parse(overview.queriedAt)).not.toBeNaN();
    const all = await service.overview(
      actor(['catalog:read', 'offering:read', 'request:read', 'audit:read']),
    );
    expect(all.recentActivity).toHaveLength(5);
    expect(all.recentActivity?.every((item) => item.occurredAt && !item.updatedAt)).toBe(true);
    expect(all.modules.offering?.total).toBe(139);
    expect(all.recentActivity?.every((item) => item.kind === 'audit' && item.actorCategory)).toBe(
      true,
    );
    fixture.evidence.overview = all;
  });
  it('discovers only explicit failure and integrity evidence with rule metadata', async () => {
    const result = await repository.listExceptions(
      [
        'AUDIT_OPERATION_FAILURE',
        'AUDIT_UNKNOWN_ACTOR',
        'PUBLISHED_OFFERING_WITHOUT_DISTRIBUTION',
        'REQUEST_OFFERING_UNRESOLVED',
      ],
      { page: 1, pageSize: 100 },
    );
    expect(result.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'audit-failure:exception-activation-failed',
        'audit-unknown-actor:exception-unknown-actor',
        'offering-no-distribution:exception-published-no-distribution',
      ]),
    );
    expect(result.items.find((item) => item.ruleId === 'AUDIT_OPERATION_FAILURE')).toMatchObject({
      classification: 'confirmed_fact',
      source: 'audit',
      evidence: { action: 'activation_failed' },
    });
    expect(result.items.find((item) => item.ruleId === 'AUDIT_UNKNOWN_ACTOR')).toMatchObject({
      classification: 'needs_review',
      evidence: { actorId: 'mystery-actor' },
    });
    expect(result.rules.map((rule) => rule.id)).toEqual([
      'AUDIT_OPERATION_FAILURE',
      'AUDIT_UNKNOWN_ACTOR',
      'PUBLISHED_OFFERING_WITHOUT_DISTRIBUTION',
      'REQUEST_OFFERING_UNRESOLVED',
    ]);
    fixture.evidence.exceptionDiscovery = {
      rules: result.rules.map((rule) => ({
        id: rule.id,
        classification: rule.classification,
        source: rule.source,
        requiredModules: rule.requiredModules,
      })),
      signals: result.items.map((item) => ({
        id: item.id,
        ruleId: item.ruleId,
        classification: item.classification,
        source: item.source,
        evidence: item.evidence,
        related: item.related,
      })),
      total: result.total,
      safeFieldsOnly: true,
    };
  });
  it('searches all safe modules, retains kind+ID, protects sensitive fields, and counts across pages', async () => {
    const all = await repository.search(['catalog', 'offering', 'request', 'audit'], {
      query: 'scale-',
      page: 1,
      pageSize: 100,
    });
    expect(all.total).toBe(685);
    const found = new Set<string>();
    for (let page = 1; page <= 7; page++)
      for (const item of (
        await repository.search(['catalog', 'offering', 'request', 'audit'], {
          query: 'scale-',
          page,
          pageSize: 100,
        })
      ).items)
        found.add(item.kind + ':' + item.id);
    expect(found.size).toBe(685);
    expect(
      (
        await repository.search(['request', 'audit'], {
          query: 'DO-NOT-SEARCH-PRIVATE',
          page: 1,
          pageSize: 20,
        })
      ).total,
    ).toBe(0);
    expect(JSON.stringify(all)).not.toMatch(
      /not-returned|private-token|requestMessage|sessionDigest/,
    );
    expect(
      (await repository.search(['request'], { query: "' OR 1=1 --", page: 1, pageSize: 20 })).total,
    ).toBe(0);
    fixture.evidence.search = {
      total: all.total,
      unique: found.size,
      pages: 7,
      safeFieldsOnly: true,
    };
  });
  it('API enforces authentication, per-module authorization, input bounds, no-store and no write routes', async () => {
    const get = (path: string, token?: string) =>
      server.inject({
        method: 'GET',
        url: '/api/v1/operations/admin/' + path,
        headers: {
          ...(token ? { authorization: 'Bearer ' + token } : {}),
          'x-permissions': 'catalog:read,audit:read',
          'x-principal-id': 'forged',
        },
      });
    expect((await get('overview')).statusCode).toBe(401);
    for (const token of ['none', 'provider', 'platform'])
      expect([401, 403]).toContain((await get('overview', token)).statusCode);
    const overview = await get('overview', 'catalog');
    expect(overview.statusCode).toBe(200);
    expect(Object.keys(overview.json<{ modules: Record<string, unknown> }>().modules)).toEqual([
      'catalog',
    ]);
    expect(overview.headers['cache-control']).toBe('no-store');
    const exceptions = await get('exceptions', 'all');
    expect(exceptions.statusCode).toBe(200);
    expect(exceptions.headers['cache-control']).toBe('no-store');
    expect(exceptions.json<{ items: { ruleId: string }[] }>().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: 'AUDIT_OPERATION_FAILURE' }),
        expect.objectContaining({ ruleId: 'PUBLISHED_OFFERING_WITHOUT_DISTRIBUTION' }),
      ]),
    );
    const auditOnly = await get('exceptions', 'audit');
    expect(auditOnly.statusCode).toBe(200);
    expect(auditOnly.json<{ rules: { source: string }[] }>().rules).toEqual(
      expect.arrayContaining([expect.objectContaining({ source: 'audit' })]),
    );
    expect(auditOnly.json<{ rules: { source: string }[] }>().rules).toHaveLength(2);
    const offeringOnly = await get('exceptions', 'offering');
    expect(offeringOnly.statusCode).toBe(200);
    expect(offeringOnly.json<{ rules: { source: string }[] }>().rules).toEqual([
      expect.objectContaining({ source: 'offering' }),
    ]);
    expect((await get('exceptions', 'request')).statusCode).toBe(403);
    for (const [path, token] of [
      ['catalog/capabilities', 'catalog'],
      ['catalog/templates', 'catalog'],
      ['offerings', 'offering'],
      ['requests', 'request'],
      ['audit', 'audit'],
    ] as const) {
      const list = await get(path + '?q=scale-&page=2&pageSize=20', token);
      expect(list.statusCode).toBe(200);
      expect(list.json<{ total: number }>().total).toBe(137);
      expect(list.json<{ items: unknown[] }>().items).toHaveLength(20);
      expect((await get(path, 'none')).statusCode).toBe(403);
    }
    const search = await get('search?q=scale-&module=all', 'request');
    expect(search.statusCode).toBe(200);
    expect(
      search.json<{ items: { kind: string }[] }>().items.every((item) => item.kind === 'request'),
    ).toBe(true);
    expect((await get('search?q=scale-&module=audit', 'request')).statusCode).toBe(403);
    for (const query of [
      'q=x&pageSize=101',
      'q=x&page=10001',
      'q= ',
      'q=x&module=invalid',
      'q=' + 'x'.repeat(161),
    ])
      expect((await get('search?' + query, 'all')).statusCode).toBe(400);
    expect((await get('exceptions?ruleId=UNKNOWN_RULE', 'all')).statusCode).toBe(400);
    for (const path of ['overview', 'search'])
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/operations/admin/' + path,
            headers: { authorization: 'Bearer all' },
          })
        ).statusCode,
      ).toBe(404);
  });
  it('retains existing indexes and captures actual query plans; does not require a migration', async () => {
    const indexes = await db.admin.unsafe(
      "SELECT tablename,indexname,indexdef FROM pg_indexes WHERE tablename IN ('service_policy_capabilities','service_policy_templates','service_policy_audits','service_offerings','commerce_actions') ORDER BY tablename,indexname",
    );
    const plan = await db.admin.unsafe(
      "EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id FROM service_offerings WHERE state='published' ORDER BY id LIMIT 20 OFFSET 20",
    );
    fixture.evidence.queryPlans = { indexes, plan };
    expect(indexes.length).toBeGreaterThan(5);
  });
});
