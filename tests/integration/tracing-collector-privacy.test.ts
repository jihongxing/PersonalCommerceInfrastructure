import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createSafeLogger } from '../../adapters/observability/safe-logger.js';
import { startTracing } from '../../adapters/observability/tracing.js';
import { createPostgresCreatorIdentityComposition } from '../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const otlpEndpoint = process.env.TRACING_OTLP_TEST_ENDPOINT;
const jaegerEndpoint = process.env.TRACING_JAEGER_TEST_URL;
const databaseEndpoint = process.env.TRACING_DISPOSABLE_DATABASE_URL;

function loopbackUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Tracing acceptance endpoints must use loopback HTTP.');
  }
  return url;
}

describe('real collector tracing privacy', () => {
  it.skipIf(!otlpEndpoint || !jaegerEndpoint)(
    'retains the parent relationship without exporting untrusted request data',
    async () => {
      const otlp = loopbackUrl(otlpEndpoint!);
      const jaeger = loopbackUrl(jaegerEndpoint!);
      if (databaseEndpoint) {
        const database = new URL(databaseEndpoint);
        if (
          !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) ||
          database.pathname !== '/pci_tracing_disposable'
        )
          throw new Error('The tracing privacy test requires a local disposable database.');
      }
      const messages: string[] = [];
      const logger = createSafeLogger('info', (line) => messages.push(line));
      const tracing = startTracing(
        {
          enabled: true,
          serviceName: 'pci-api-privacy-acceptance',
          environment: 'test',
          endpoint: otlp.href,
          samplingRate: 1,
          queueSize: 32,
          exportTimeoutMs: 2000,
          shutdownTimeoutMs: 3000,
        },
        logger,
      );
      const origin = 'http://localhost:13000';
      const composition = databaseEndpoint
        ? createPostgresCreatorIdentityComposition(
            { databaseUrl: databaseEndpoint },
            { localAuthSecret: 'integration-test-secret-at-least-32-bytes' },
            origin,
            { deliver: async () => {} },
            { operationsAccessToken: 'test-token', operationsOperatorId: 'test' },
            undefined,
            logger,
          )
        : undefined;
      const api = await createApiServer({
        logger,
        localAuthService: composition?.localAuthService,
        browserTracingEndpoint: otlp.href,
        corsAllowedOrigins: [origin],
      });
      const traceId = randomUUID().replaceAll('-', '');
      const parentId = '123456789abcdef0';
      const markers = [
        'query-secret-marker',
        'state-secret-marker',
        'baggage-secret-marker',
        'authorization-secret-marker',
        'cookie-secret-marker',
        'result-access-marker',
        'browser-extra-secret-marker',
        'browser-person@example.test',
      ];
      try {
        const address = await api.listen({ port: 0, host: '127.0.0.1' });
        if (composition) {
          const email = `private-${randomUUID()}@example.test`;
          const password = 'private-password-tracing-acceptance';
          const name = 'private-sql-parameter-tracing-acceptance';
          markers.push(email, password, name);
          const signup = await fetch(`${address}/api/v1/auth/signup`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              traceparent: `00-${traceId}-${parentId}-01`,
            },
            body: JSON.stringify({ email, password, name }),
          });
          expect(signup.status).toBe(201);
          const session = (await signup.json()) as {
            accessToken: string;
            refreshToken: string;
            setupPending: boolean;
          };
          expect(session.setupPending).toBe(false);
          markers.push(session.accessToken, session.refreshToken);
          const rows = await composition.database.client<{ name: string }[]>`
            select name from local_auth_accounts where email = ${email}
          `;
          expect(rows[0]?.name).toBe(name);
        }
        const response = await fetch(
          `${address}/api/v1/public/requests/${markers[5]}?token=${markers[0]}`,
          {
            headers: {
              traceparent: `00-${traceId}-${parentId}-01`,
              tracestate: `vendor=${markers[1]}`,
              baggage: `secret=${markers[2]}`,
              authorization: `Bearer ${markers[3]}`,
              cookie: `session=${markers[4]}`,
            },
          },
        );
        expect(response.status).toBe(404);
        const browserResponse = await fetch(`${address}/api/v1/telemetry/browser-traces`, {
          method: 'POST',
          headers: { origin, 'content-type': 'application/json' },
          body: JSON.stringify({
            spans: [
              {
                traceId,
                spanId: parentId,
                startMs: Date.now() - 5,
                durationMs: 5,
                method: 'GET',
                route: '/api/v1/*',
                status: 404,
                links: [],
                secret: markers[6],
                nested: { email: markers[7] },
              },
            ],
          }),
        });
        expect(browserResponse.status).toBe(202);
        await api.close();
        await tracing.shutdown();

        type JaegerTrace = {
          data: Array<{
            spans: Array<{
              traceID: string;
              operationName: string;
              references: Array<{ traceID: string; spanID: string; refType: string }>;
            }>;
          }>;
        };
        let result: JaegerTrace | undefined;
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
          const query = await fetch(new URL(`/api/traces/${traceId}`, jaeger), {
            signal: AbortSignal.timeout(2000),
          });
          if (query.ok) {
            const value = (await query.json()) as JaegerTrace;
            const names = value.data[0]?.spans.map((item) => item.operationName) ?? [];
            if (
              names.includes('GET /api/v1/*') &&
              names.includes('GET /api/v1/public/requests/:resultAccessToken') &&
              (!composition ||
                [
                  'POST /api/v1/auth/signup',
                  'auth.signup',
                  'auth.workspace.initialize',
                  'postgres.account.create',
                  'postgres.transaction',
                ].every((name) => names.includes(name)))
            ) {
              result = value;
              break;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (!result)
          throw new Error('Trace was not available from local Jaeger within 15 seconds.');
        const span = result?.data[0]?.spans.find(
          (item) => item.operationName === 'GET /api/v1/public/requests/:resultAccessToken',
        );
        expect(result.data[0]?.spans.some((item) => item.operationName === 'GET /api/v1/*')).toBe(
          true,
        );
        expect(span?.traceID).toBe(traceId);
        expect(span?.references).toContainEqual({
          traceID: traceId,
          spanID: parentId,
          refType: 'CHILD_OF',
        });
        const telemetry = JSON.stringify({ result, messages });
        for (const marker of markers) expect(telemetry).not.toContain(marker);
      } finally {
        await api.close();
        await composition?.database.close();
        await tracing.shutdown();
      }
    },
    20000,
  );
});
