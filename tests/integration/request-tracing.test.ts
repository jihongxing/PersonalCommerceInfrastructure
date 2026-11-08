import { NodeSDK } from '@opentelemetry/sdk-node';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { createConnection, createServer, type Socket } from 'node:net';
import { createPostgresCreatorIdentityComposition } from '../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { createSafeLogger } from '../../adapters/observability/safe-logger.js';
import { traceContextPropagator } from '../../adapters/observability/tracing.js';
import { createServerSampler } from '../../adapters/observability/tracing.js';
import { withTraceSpan } from '../../adapters/observability/tracing.js';
import { PostgresLocalAuthRepository } from '../../adapters/persistence/postgres/postgres-local-auth-repository.js';
import { LocalAuthService } from '../../applications/account-identity-membership/local-auth-service.js';
import { ROOT_CONTEXT, SpanKind, SpanStatusCode, TraceFlags, trace } from '@opentelemetry/api';
import { SamplingDecision } from '@opentelemetry/sdk-trace-base';
import postgres from 'postgres';

describe('request tracing', () => {
  const exporter = new InMemorySpanExporter();
  const processor = new SimpleSpanProcessor(exporter);
  const sdk = new NodeSDK({
    spanProcessors: [processor],
    textMapPropagator: traceContextPropagator,
  });
  beforeAll(() => sdk.start());
  afterAll(async () => sdk.shutdown());

  it('does not allow remote sampling flags to override server policy and honors local parents', () => {
    const spanContext = {
      traceId: '1'.repeat(32),
      spanId: '2'.repeat(16),
      traceFlags: TraceFlags.SAMPLED,
      isRemote: true,
    };
    const remote = trace.setSpanContext(ROOT_CONTEXT, spanContext);
    const local = trace.setSpanContext(ROOT_CONTEXT, { ...spanContext, isRemote: false });
    const decide = (rate: number, parent: typeof ROOT_CONTEXT) =>
      createServerSampler(rate).shouldSample(
        parent,
        spanContext.traceId,
        'test',
        SpanKind.SERVER,
        {},
        [],
      ).decision;
    expect(decide(0, remote)).toBe(SamplingDecision.NOT_RECORD);
    expect(
      decide(
        1,
        trace.setSpanContext(ROOT_CONTEXT, { ...spanContext, traceFlags: TraceFlags.NONE }),
      ),
    ).toBe(SamplingDecision.RECORD_AND_SAMPLED);
    expect(decide(0, local)).toBe(SamplingDecision.RECORD_AND_SAMPLED);
  });

  it('propagates valid trace context, isolates concurrent requests and redacts unknown paths', async () => {
    const messages: string[] = [];
    const server = await createApiServer({
      logger: createSafeLogger('info', (line) => messages.push(line)),
    });
    try {
      const [first, second, unknown] = await Promise.all([
        server.inject({
          url: '/health',
          headers: {
            traceparent: '00-11111111111111111111111111111111-2222222222222222-01',
            'x-correlation-id': 'valid-id',
          },
        }),
        server.inject({
          url: '/health',
          headers: { traceparent: 'invalid', 'x-correlation-id': 'invalid id' },
        }),
        server.inject({ url: '/private-secret-path?token=secret-token' }),
      ]);
      expect(first.statusCode).toBe(200);
      expect(first.headers['x-correlation-id']).toBe('valid-id');
      expect(second.headers['x-correlation-id']).not.toBe('invalid id');
      expect(unknown.statusCode).toBe(404);
      await processor.forceFlush();
      const spans = exporter.getFinishedSpans();
      const firstSpan = spans.find(
        (span) => span.spanContext().traceId === '11111111111111111111111111111111',
      );
      expect(firstSpan?.parentSpanContext?.spanId).toBe('2222222222222222');
      expect(new Set(spans.map((span) => span.spanContext().traceId)).size).toBe(3);
      const serialized = JSON.stringify({
        spans: spans.map((span) => ({ name: span.name, attributes: span.attributes })),
        messages,
      });
      expect(serialized).not.toContain('secret-token');
      expect(serialized).not.toContain('private-secret-path');
      const firstLog = messages
        .map(
          (line) =>
            JSON.parse(line) as {
              context: { correlationId: string; trace_id: string; span_id: string };
            },
        )
        .find((line) => line.context.correlationId === 'valid-id');
      expect(firstLog.context.trace_id).toBe(firstSpan?.spanContext().traceId);
      expect(firstLog.context.span_id).toBe(firstSpan?.spanContext().spanId);
    } finally {
      await server.close();
    }
  });

  it('keeps dynamic route values, credentials and query data out of request telemetry', async () => {
    const messages: string[] = [];
    const server = await createApiServer({
      logger: createSafeLogger('info', (line) => messages.push(line)),
    });
    const traceId = 'cccccccccccccccccccccccccccccccc';
    const secrets = [
      'result-access-marker',
      'query-secret-marker',
      'authorization-secret-marker',
      'cookie-secret-marker',
    ];
    try {
      const response = await server.inject({
        method: 'GET',
        url: `/api/v1/public/requests/${secrets[0]}?token=${secrets[1]}`,
        headers: {
          authorization: `Bearer ${secrets[2]}`,
          cookie: `session=${secrets[3]}`,
          traceparent: `00-${traceId}-dddddddddddddddd-01`,
        },
      });
      expect(response.statusCode).toBe(404);
      await processor.forceFlush();
      const span = exporter
        .getFinishedSpans()
        .find((item) => item.spanContext().traceId === traceId);
      expect(span?.name).toBe('GET /api/v1/public/requests/:resultAccessToken');
      const telemetry = JSON.stringify({
        messages,
        span: span && {
          name: span.name,
          attributes: span.attributes,
          events: span.events,
          status: span.status,
          resource: span.resource.attributes,
        },
      });
      for (const secret of secrets) expect(telemetry).not.toContain(secret);
    } finally {
      await server.close();
    }
  });

  it('ends the server span when a client disconnects during a request body', async () => {
    let notifyStarted: (() => void) | undefined;
    const messages: string[] = [];
    const started = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    const server = await createApiServer({
      logger: createSafeLogger('info', (line) => {
        messages.push(line);
        const entry = JSON.parse(line) as { event: string; context: { trace_id?: string } };
        if (
          entry.event === 'api_request_started' &&
          entry.context.trace_id === 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        ) {
          notifyStarted?.();
        }
      }),
    });
    let request: ReturnType<typeof httpRequest> | undefined;
    try {
      const address = await server.listen({ port: 0, host: '127.0.0.1' });
      request = httpRequest(`${address}/api/v1/creator/identity/capabilities`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': '256',
          traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
        },
      });
      request.on('error', () => {});
      request.write('{');
      request.flushHeaders();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          started,
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error('Request did not start')), 3000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
      request.destroy();
      let span = exporter
        .getFinishedSpans()
        .find((item) => item.spanContext().traceId === 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      const deadline = Date.now() + 3000;
      while (!span && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        span = exporter
          .getFinishedSpans()
          .find((item) => item.spanContext().traceId === 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      }
      expect(span?.parentSpanContext?.spanId).toBe('bbbbbbbbbbbbbbbb');
      expect(span?.status.code).toBe(SpanStatusCode.ERROR);
      expect(span?.name).toBe('POST /api/v1/creator/identity/capabilities');
      expect(span?.attributes).toMatchObject({
        'http.request.method': 'POST',
        'http.route': '/api/v1/creator/identity/capabilities',
      });
      const abortLog = messages
        .map((line) => JSON.parse(line) as { event: string; context: Record<string, unknown> })
        .find((entry) => entry.event === 'api_request_aborted');
      expect(abortLog?.context).toMatchObject({
        trace_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        span_id: span?.spanContext().spanId,
        path: '/api/v1/creator/identity/capabilities',
      });
      expect(abortLog?.context.durationMs).toEqual(expect.any(Number));
    } finally {
      request?.destroy();
      await server.close();
    }
  });

  it('ends the server span when a client disconnects while the handler is running', async () => {
    let notifyStarted: (() => void) | undefined;
    let releaseHandler: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    const handlerWait = new Promise<void>((resolve) => {
      releaseHandler = resolve;
    });
    const messages: string[] = [];
    const server = await createApiServer({
      checkReadiness: async () => {
        notifyStarted?.();
        await handlerWait;
      },
      logger: createSafeLogger('info', (line) => messages.push(line)),
    });
    const traceId = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    let request: ReturnType<typeof httpRequest> | undefined;
    try {
      const address = await server.listen({ port: 0, host: '127.0.0.1' });
      request = httpRequest(`${address}/api/v1/readiness`, {
        headers: { traceparent: `00-${traceId}-ffffffffffffffff-01` },
      });
      request.on('error', () => {});
      request.end();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          started,
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error('Handler did not start')), 3000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
      request.destroy();
      await vi.waitFor(
        () => {
          expect(
            exporter.getFinishedSpans().filter((span) => span.spanContext().traceId === traceId),
          ).toHaveLength(1);
        },
        { timeout: 3000 },
      );
      const span = exporter
        .getFinishedSpans()
        .find((item) => item.spanContext().traceId === traceId);
      expect(span?.name).toBe('GET /api/v1/readiness');
      expect(span?.parentSpanContext?.spanId).toBe('ffffffffffffffff');
      expect(span?.status.code).toBe(SpanStatusCode.ERROR);
      expect(span?.attributes['http.response.status_code']).toBeUndefined();
      const abortLogs = messages
        .map((line) => JSON.parse(line) as { event: string; context: Record<string, unknown> })
        .filter((entry) => entry.event === 'api_request_aborted');
      expect(abortLogs).toHaveLength(1);
      expect(abortLogs[0]?.context).toMatchObject({
        trace_id: traceId,
        span_id: span?.spanContext().spanId,
        path: '/api/v1/readiness',
      });
      releaseHandler?.();
      await server.close();
      expect(
        exporter.getFinishedSpans().filter((item) => item.spanContext().traceId === traceId),
      ).toHaveLength(1);
      expect(messages.filter((line) => line.includes('api_request_completed'))).toHaveLength(0);
    } finally {
      releaseHandler?.();
      request?.destroy();
      await server.close();
    }
  });

  it.skipIf(!process.env.LOCAL_AUTH_TEST_DATABASE_URL)(
    'traces signup and real PostgreSQL transactions',
    async () => {
      const messages: string[] = [];
      const logger = createSafeLogger('info', (line) => messages.push(line));
      const composition = createPostgresCreatorIdentityComposition(
        { databaseUrl: process.env.LOCAL_AUTH_TEST_DATABASE_URL! },
        { localAuthSecret: 'integration-test-secret-at-least-32-bytes' },
        'http://localhost:3000',
        { deliver: async () => {} },
        { operationsAccessToken: 'test-token', operationsOperatorId: 'test' },
      );
      const server = await createApiServer({
        localAuthService: composition.localAuthService,
        authContextProvider: composition.authContextProvider,
        creatorIdentityService: composition.service,
        serviceOfferingService: composition.offeringService,
        logger,
      });
      try {
        const email = `${randomUUID()}@example.test`;
        const password = 'private-password-for-trace-test';
        const name = 'private-sql-parameter-for-trace-test';
        const response = await server.inject({
          method: 'POST',
          url: '/api/v1/auth/signup',
          headers: { 'x-correlation-id': 'signup-trace-test' },
          payload: { email, password, name },
        });
        expect(response.statusCode).toBe(201);
        expect(response.json<{ setupPending: boolean }>().setupPending).toBe(false);
        await processor.forceFlush();
        const spans = exporter.getFinishedSpans();
        const serverSpan = spans.find((span) => span.name === 'POST /api/v1/auth/signup');
        expect(serverSpan).toBeDefined();
        const sameTrace = spans.filter(
          (span) => span.spanContext().traceId === serverSpan!.spanContext().traceId,
        );
        for (const name of [
          'auth.signup',
          'auth.session.create',
          'auth.workspace.initialize',
          'postgres.account.create',
          'postgres.transaction',
        ]) {
          expect(sameTrace.some((span) => span.name === name)).toBe(true);
        }
        const signup = sameTrace.find((span) => span.name === 'auth.signup');
        expect(signup?.parentSpanContext?.spanId).toBe(serverSpan?.spanContext().spanId);
        expect(JSON.stringify(sameTrace.map((span) => span.attributes))).not.toContain(email);

        const { accessToken: token, refreshToken } = response.json<{
          accessToken: string;
          refreshToken: string;
        }>();
        const headers = { authorization: `Bearer ${token}` };
        const capability = await server.inject({
          method: 'POST',
          url: '/api/v1/creator/identity/capabilities',
          headers,
          payload: { name: 'Test capability', description: 'Test description' },
        });
        expect(capability.statusCode).toBe(201);
        const offering = await server.inject({
          method: 'POST',
          url: '/api/v1/creator/offerings',
          headers,
          payload: {
            capabilityIds: capability.json<{ capabilityIds: string[] }>().capabilityIds,
            title: 'Test offering',
            description: 'Test description',
            availabilityDescription: 'By appointment',
            requestInstructions: 'Request an appointment',
          },
        });
        expect(offering.statusCode).toBe(201);
        expect(
          (
            await server.inject({
              method: 'PATCH',
              url: '/api/v1/creator/identity',
              headers,
              payload: {
                profile: { displayName: 'Test creator', bio: 'Test bio', socialLinks: [] },
              },
            })
          ).statusCode,
        ).toBe(200);
        const correlationId = `publish-${randomUUID()}`;
        const publish = await server.inject({
          method: 'POST',
          url: `/api/v1/creator/offerings/${offering.json<{ id: string }>().id}/publish`,
          headers: { ...headers, 'x-correlation-id': correlationId },
        });
        expect(publish.statusCode).toBe(200);
        const events = await composition.database.client<
          { name: string; correlation_id: string }[]
        >`
          select name, correlation_id from product_events where correlation_id = ${correlationId}
        `;
        expect(events.map((event) => event.name)).toContain('creator_published');
        expect(events.every((event) => event.correlation_id === correlationId)).toBe(true);
        const telemetry = JSON.stringify({
          messages,
          spans: exporter.getFinishedSpans().map((span) => ({
            name: span.name,
            attributes: span.attributes,
            events: span.events,
            status: span.status,
          })),
        });
        for (const secret of [email, password, name, token, refreshToken]) {
          expect(telemetry).not.toContain(secret);
        }
      } finally {
        await server.close();
        await composition.database.close();
      }
    },
  );

  it.skipIf(!process.env.LOCAL_AUTH_TEST_DATABASE_URL)(
    'preserves restricted identity and historical membership rules with trace evidence',
    async () => {
      const messages: string[] = [];
      const logger = createSafeLogger('info', (line) => messages.push(line));
      const composition = createPostgresCreatorIdentityComposition(
        { databaseUrl: process.env.LOCAL_AUTH_TEST_DATABASE_URL! },
        { localAuthSecret: 'integration-test-secret-at-least-32-bytes' },
        'http://localhost:3000',
        { deliver: async () => {} },
        { operationsAccessToken: 'test-token', operationsOperatorId: 'test' },
        undefined,
        logger,
      );
      const server = await createApiServer({
        localAuthService: composition.localAuthService,
        logger,
      });
      try {
        for (const restriction of ['identity', 'membership'] as const) {
          const email = `${randomUUID()}@example.test`;
          const signup = await server.inject({
            method: 'POST',
            url: '/api/v1/auth/signup',
            payload: { email, password: 'correct-password' },
          });
          expect(signup.statusCode).toBe(201);
          const accountId = signup.json<{ user: { id: string } }>().user.id;
          const accountKey = `local:${accountId}`;
          if (restriction === 'identity') {
            await composition.database.client`
              update identities set lifecycle = 'SUSPENDED' where identity_id =
              (select identity_id from account_identity_memberships where account_id = ${accountKey})
            `;
          } else {
            await composition.database.client`
              update account_identity_memberships set state = 'HISTORICAL', revoked_at = now()
              where account_id = ${accountKey}
            `;
          }
          const correlationId = `restricted-${randomUUID()}`;
          const login = await server.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            headers: { 'x-correlation-id': correlationId },
            payload: { email, password: 'correct-password' },
          });
          expect(login.statusCode).toBe(200);
          expect(login.json<{ setupPending: boolean }>().setupPending).toBe(true);
          const retry = await server.inject({
            method: 'POST',
            url: '/api/v1/auth/workspace/initialize',
            headers: {
              authorization: `Bearer ${login.json<{ accessToken: string }>().accessToken}`,
            },
          });
          expect(retry.statusCode).toBe(403);
          const memberships = await composition.database.client<{ state: string }[]>`
            select state from account_identity_memberships where account_id = ${accountKey}
          `;
          expect(memberships.map((item) => item.state)).toEqual([
            restriction === 'identity' ? 'ACTIVE' : 'HISTORICAL',
          ]);
          const failure = messages
            .map(
              (line) =>
                JSON.parse(line) as {
                  event: string;
                  context: { correlationId: string; trace_id: string };
                },
            )
            .find(
              (line) =>
                line.event === 'workspace_initialization_failed' &&
                line.context.correlationId === correlationId,
            );
          expect(failure).toBeDefined();
          const failedSpan = exporter
            .getFinishedSpans()
            .find(
              (span) =>
                span.name === 'auth.workspace.initialize' &&
                span.spanContext().traceId === failure?.context.trace_id,
            );
          expect(failedSpan?.status.code).toBe(SpanStatusCode.ERROR);
        }
      } finally {
        await server.close();
        await composition.database.close();
      }
    },
  );

  it.skipIf(!process.env.LOCAL_AUTH_TEST_DATABASE_URL)(
    'correlates workspace initialization failure and successful retry without exposing its cause',
    async () => {
      const messages: string[] = [];
      const logger = createSafeLogger('info', (line) => messages.push(line));
      const composition = createPostgresCreatorIdentityComposition(
        { databaseUrl: process.env.LOCAL_AUTH_TEST_DATABASE_URL! },
        { localAuthSecret: 'integration-test-secret-at-least-32-bytes' },
        'http://localhost:3000',
        { deliver: async () => {} },
        { operationsAccessToken: 'test-token', operationsOperatorId: 'test' },
      );
      let attempts = 0;
      const auth = new LocalAuthService(
        new PostgresLocalAuthRepository(composition.database.client),
        'integration-test-secret-at-least-32-bytes',
        () => {
          attempts += 1;
          return attempts === 1
            ? Promise.reject(new Error('private-database-error'))
            : Promise.resolve();
        },
        {
          trace: withTraceSpan,
          workspaceFailure: (requestContext) =>
            logger.error('workspace_initialization_failed', {
              correlationId: requestContext.correlationId,
              errorCategory: 'initialization_failed',
            }),
        },
      );
      const server = await createApiServer({ localAuthService: auth, logger });
      try {
        const correlationId = `failed-workspace-${randomUUID()}`;
        const response = await server.inject({
          method: 'POST',
          url: '/api/v1/auth/signup',
          headers: { 'x-correlation-id': correlationId },
          payload: { email: `${randomUUID()}@example.test`, password: 'correct-password' },
        });
        expect(response.statusCode).toBe(201);
        expect(response.json<{ setupPending: boolean }>().setupPending).toBe(true);
        const retry = await server.inject({
          method: 'POST',
          url: '/api/v1/auth/workspace/initialize',
          headers: {
            authorization: `Bearer ${response.json<{ accessToken: string }>().accessToken}`,
          },
        });
        expect(retry.statusCode).toBe(200);
        expect(attempts).toBe(2);
        const failureLog = messages
          .map((line) => JSON.parse(line) as { event: string; context: { trace_id: string } })
          .find((line) => line.event === 'workspace_initialization_failed');
        expect(failureLog?.context).toMatchObject({
          correlationId,
          errorCategory: 'initialization_failed',
        });
        const failedSpan = exporter
          .getFinishedSpans()
          .find(
            (span) =>
              span.name === 'auth.workspace.initialize' &&
              span.spanContext().traceId === failureLog?.context.trace_id,
          );
        expect(failedSpan?.status.code).toBe(SpanStatusCode.ERROR);
        expect(JSON.stringify({ messages, attributes: failedSpan?.attributes })).not.toContain(
          'private-database-error',
        );
      } finally {
        await server.close();
        await composition.database.close();
      }
    },
  );

  it.skipIf(!process.env.TRACING_DISPOSABLE_DATABASE_URL)(
    'recovers workspace initialization after an injected PostgreSQL network interruption',
    async () => {
      const databaseUrl = new URL(process.env.TRACING_DISPOSABLE_DATABASE_URL!);
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname) ||
        databaseUrl.pathname !== '/pci_tracing_disposable'
      ) {
        throw new Error('The tracing network test requires a local disposable database.');
      }

      const admin = postgres(databaseUrl.toString(), { max: 1 });
      const sockets = new Set<Socket>();
      let interrupted = false;
      let listening = false;
      const proxy = createServer((incoming) => {
        if (interrupted) {
          incoming.destroy();
          return;
        }
        const outgoing = createConnection({
          host: databaseUrl.hostname.replace(/^\[|\]$/gu, ''),
          port: Number(databaseUrl.port || 5432),
        });
        for (const socket of [incoming, outgoing]) {
          sockets.add(socket);
          socket.on('error', () => {});
          socket.on('close', () => sockets.delete(socket));
        }
        incoming.on('close', () => outgoing.destroy());
        outgoing.on('close', () => incoming.destroy());
        incoming.pipe(outgoing).pipe(incoming);
      });
      await new Promise<void>((resolve, reject) => {
        proxy.once('error', reject);
        proxy.listen(0, '127.0.0.1', resolve);
      });
      listening = true;
      const address = proxy.address();
      if (!address || typeof address === 'string') throw new Error('TCP proxy failed to listen.');
      const proxyUrl = new URL(databaseUrl);
      proxyUrl.hostname = '127.0.0.1';
      proxyUrl.port = String(address.port);
      const messages: string[] = [];
      const logger = createSafeLogger('info', (line) => messages.push(line));
      const composition = createPostgresCreatorIdentityComposition(
        { databaseUrl: proxyUrl.toString() },
        { localAuthSecret: 'integration-test-secret-at-least-32-bytes' },
        'http://localhost:3000',
        { deliver: async () => {} },
        { operationsAccessToken: 'test-token', operationsOperatorId: 'test' },
        undefined,
        logger,
      );
      const server = await createApiServer({
        localAuthService: composition.localAuthService,
        logger,
      });
      // The original method is invoked with its repository instance below.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalFindCreatorId = PostgresLocalAuthRepository.prototype.findCreatorId;
      const fault = vi.spyOn(PostgresLocalAuthRepository.prototype, 'findCreatorId');
      fault.mockImplementationOnce(async function (this: PostgresLocalAuthRepository, accountId) {
        interrupted = true;
        for (const socket of sockets) socket.destroy();
        await new Promise<void>((resolve, reject) =>
          proxy.close((error) => (error ? reject(error) : resolve())),
        );
        listening = false;
        return originalFindCreatorId.call(this, accountId);
      });
      try {
        const correlationId = `db-network-${randomUUID()}`;
        const signup = await server.inject({
          method: 'POST',
          url: '/api/v1/auth/signup',
          headers: { 'x-correlation-id': correlationId },
          payload: { email: `${randomUUID()}@example.test`, password: 'correct-password' },
        });
        expect(fault).toHaveBeenCalledOnce();
        expect(signup.statusCode).toBe(201);
        const session = signup.json<{
          accessToken: string;
          setupPending: boolean;
          user: { id: string };
        }>();
        expect(session.setupPending).toBe(true);
        const accountKey = `local:${session.user.id}`;
        const before = await admin<{ count: string }[]>`
          select count(*) from account_identity_memberships where account_id = ${accountKey}
        `;
        expect(Number(before[0]?.count)).toBe(0);
        const failure = messages
          .map((line) => JSON.parse(line) as { event: string; context: { trace_id: string } })
          .find((line) => line.event === 'workspace_initialization_failed');
        expect(failure?.context).toMatchObject({
          correlationId,
          errorCategory: 'initialization_failed',
        });
        const failedSpan = exporter
          .getFinishedSpans()
          .find(
            (span) =>
              span.name === 'auth.workspace.initialize' &&
              span.spanContext().traceId === failure?.context.trace_id,
          );
        expect(failedSpan?.status.code).toBe(SpanStatusCode.ERROR);
        expect(JSON.stringify({ messages, attributes: failedSpan?.attributes })).not.toContain(
          proxyUrl.password,
        );

        interrupted = false;
        await new Promise<void>((resolve, reject) => {
          proxy.once('error', reject);
          proxy.listen(address.port, '127.0.0.1', resolve);
        });
        listening = true;
        const retry = await server.inject({
          method: 'POST',
          url: '/api/v1/auth/workspace/initialize',
          headers: { authorization: `Bearer ${session.accessToken}` },
        });
        expect(retry.statusCode).toBe(200);
        const after = await admin<{ count: string }[]>`
          select count(*) from account_identity_memberships
          where account_id = ${accountKey} and state = 'ACTIVE'
        `;
        expect(Number(after[0]?.count)).toBe(1);
      } finally {
        fault.mockRestore();
        interrupted = false;
        await server.close();
        const closeStarted = performance.now();
        await composition.database.close();
        const closeDuration = performance.now() - closeStarted;
        for (const socket of sockets) socket.destroy();
        if (listening) {
          await new Promise<void>((resolve, reject) =>
            proxy.close((error) => (error ? reject(error) : resolve())),
          );
        }
        await admin.end();
        expect(closeDuration).toBeLessThan(10000);
      }
    },
    30000,
  );

  it.skipIf(!process.env.TRACING_DISPOSABLE_DATABASE_URL)(
    'traces a real PostgreSQL permission failure and a successful workspace retry',
    async () => {
      const databaseUrl = new URL(process.env.TRACING_DISPOSABLE_DATABASE_URL!);
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname) ||
        databaseUrl.pathname !== '/pci_tracing_disposable'
      ) {
        throw new Error('The tracing permission test requires a local disposable database.');
      }

      const admin = postgres(databaseUrl.toString(), { max: 1 });
      const role = `tracing_fault_${randomUUID().replaceAll('-', '')}`;
      let roleCreated = false;
      try {
        await admin`create role ${admin(role)} login password 'tracing-fault-test-password'`;
        roleCreated = true;
        await admin`grant usage on schema public to ${admin(role)}`;
        await admin`grant select, insert, update, delete on all tables in schema public to ${admin(role)}`;
        await admin`grant usage, select on all sequences in schema public to ${admin(role)}`;
        await admin`revoke insert on public.identities from ${admin(role)}`;
        const privilegeBefore = await admin<{ allowed: boolean }[]>`
          select has_table_privilege(${role}, 'public.identities', 'INSERT') as allowed
        `;
        expect(privilegeBefore[0]?.allowed).toBe(false);

        databaseUrl.username = role;
        databaseUrl.password = 'tracing-fault-test-password';
        const messages: string[] = [];
        const logger = createSafeLogger('info', (line) => messages.push(line));
        const composition = createPostgresCreatorIdentityComposition(
          { databaseUrl: databaseUrl.toString() },
          { localAuthSecret: 'integration-test-secret-at-least-32-bytes' },
          'http://localhost:3000',
          { deliver: async () => {} },
          { operationsAccessToken: 'test-token', operationsOperatorId: 'test' },
          undefined,
          logger,
        );
        const server = await createApiServer({
          localAuthService: composition.localAuthService,
          logger,
        });
        try {
          await expect(
            composition.database.client`insert into identities default values`,
          ).rejects.toMatchObject({
            code: '42501',
          });
          const correlationId = `db-permission-${randomUUID()}`;
          const signup = await server.inject({
            method: 'POST',
            url: '/api/v1/auth/signup',
            headers: { 'x-correlation-id': correlationId },
            payload: { email: `${randomUUID()}@example.test`, password: 'correct-password' },
          });
          expect(signup.statusCode).toBe(201);
          const session = signup.json<{
            accessToken: string;
            setupPending: boolean;
            user: { id: string };
          }>();
          expect(session.setupPending).toBe(true);
          const accountKey = `local:${session.user.id}`;
          const before = await admin<{ count: string }[]>`
            select count(*) from account_identity_memberships where account_id = ${accountKey}
          `;
          expect(Number(before[0]?.count)).toBe(0);

          const failure = messages
            .map((line) => JSON.parse(line) as { event: string; context: { trace_id: string } })
            .find((line) => line.event === 'workspace_initialization_failed');
          expect(failure?.context).toMatchObject({
            correlationId,
            errorCategory: 'initialization_failed',
          });
          const failedSpans = exporter
            .getFinishedSpans()
            .filter((span) => span.spanContext().traceId === failure?.context.trace_id);
          expect(
            failedSpans.find((span) => span.name === 'auth.workspace.initialize')?.status.code,
          ).toBe(SpanStatusCode.ERROR);
          expect(
            failedSpans.find((span) => span.name === 'postgres.transaction')?.status.code,
          ).toBe(SpanStatusCode.ERROR);
          const telemetry = JSON.stringify({
            messages,
            spans: failedSpans.map(({ name, attributes, events, status }) => ({
              name,
              attributes,
              events,
              status,
            })),
          });
          expect(telemetry).not.toContain('permission denied');

          await admin`grant insert on public.identities to ${admin(role)}`;
          const retryCorrelationId = `db-retry-${randomUUID()}`;
          const retry = await server.inject({
            method: 'POST',
            url: '/api/v1/auth/workspace/initialize',
            headers: {
              authorization: `Bearer ${session.accessToken}`,
              'x-correlation-id': retryCorrelationId,
            },
          });
          expect(retry.statusCode).toBe(200);
          const retryLog = messages
            .map(
              (line) =>
                JSON.parse(line) as {
                  event: string;
                  context: { correlationId: string; trace_id: string };
                },
            )
            .find(
              (line) =>
                line.event === 'api_request_completed' &&
                line.context.correlationId === retryCorrelationId,
            );
          expect(retryLog?.context.trace_id).toBeDefined();
          const retrySpans = exporter
            .getFinishedSpans()
            .filter((span) => span.spanContext().traceId === retryLog?.context.trace_id);
          expect(
            retrySpans.find((span) => span.name === 'auth.workspace.initialize'),
          ).toBeDefined();
          expect(
            retrySpans.find((span) => span.name === 'postgres.transaction')?.status.code,
          ).not.toBe(SpanStatusCode.ERROR);
          const after = await admin<{ count: string }[]>`
            select count(*) from account_identity_memberships
            where account_id = ${accountKey} and state = 'ACTIVE'
          `;
          expect(Number(after[0]?.count)).toBe(1);
        } finally {
          await server.close();
          await composition.database.close();
        }
      } finally {
        if (roleCreated) {
          await admin`drop owned by ${admin(role)}`;
          await admin`drop role ${admin(role)}`;
        }
        await admin.end();
      }
    },
    30000,
  );
});
