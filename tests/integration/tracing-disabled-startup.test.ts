import { createServer } from 'node:net';
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startApi } from '../../apps/api/src/main.js';

const disposableDatabaseUrl = process.env.TRACING_DISPOSABLE_DATABASE_URL;

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const address = listener.address();
  if (!address || typeof address === 'string') throw new Error('No loopback port available');
  await new Promise<void>((resolve, reject) =>
    listener.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}

describe('tracing rollback startup', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('starts the formal API with tracing disabled even when unused exporter settings are invalid', async () => {
    const port = await availablePort();
    for (const [name, value] of Object.entries({
      APP_ENV: 'test',
      API_HOST: '127.0.0.1',
      API_PORT: String(port),
      USE_POSTGRES_TEST_COMPOSITION: '0',
      WEB_REFERENCE_CLIENT_ORIGIN: 'http://127.0.0.1:43125',
      RUNTIME_ENV: 'test',
      REAL_MONEY_ENABLED: 'false',
      OTEL_TRACING_ENABLED: 'false',
      OTEL_BROWSER_TRACING_ENABLED: 'false',
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'invalid endpoint',
      OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: 'invalid protocol',
      OTEL_TRACES_SAMPLER_ARG: 'invalid',
      OTEL_BSP_MAX_QUEUE_SIZE: 'invalid',
      OTEL_BSP_EXPORT_TIMEOUT: 'invalid',
      OTEL_SHUTDOWN_TIMEOUT_MS: 'invalid',
    }))
      vi.stubEnv(name, value);
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((message: unknown) => logs.push(String(message)));
    const runtime = await startApi();
    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`, {
        headers: {
          'x-correlation-id': 'disabled-with-parent',
          traceparent: '00-11111111111111111111111111111111-2222222222222222-01',
        },
      });
      const readiness = await fetch(`http://127.0.0.1:${port}/api/v1/readiness`);
      expect(health.status).toBe(200);
      expect(readiness.status).toBe(200);
      expect(health.headers.get('x-correlation-id')).toBeTruthy();
      const requestLog = logs
        .map((line) => JSON.parse(line) as { event: string; context: Record<string, unknown> })
        .find(
          (entry) =>
            entry.event === 'api_request_completed' &&
            entry.context.correlationId === 'disabled-with-parent',
        );
      expect(requestLog?.context).not.toHaveProperty('trace_id');
    } finally {
      await runtime.close();
    }
  });

  it.skipIf(!disposableDatabaseUrl)(
    'retains local authentication and workspace access with tracing disabled',
    async () => {
      const database = new URL(disposableDatabaseUrl!);
      if (
        !['postgres:', 'postgresql:'].includes(database.protocol) ||
        !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) ||
        database.pathname !== '/pci_tracing_disposable'
      )
        throw new Error('The tracing rollback test requires a local disposable database.');
      const port = await availablePort();
      for (const [name, value] of Object.entries({
        APP_ENV: 'development',
        API_HOST: '127.0.0.1',
        API_PORT: String(port),
        DATABASE_URL: disposableDatabaseUrl!,
        WEB_REFERENCE_CLIENT_ORIGIN: 'http://localhost:13000',
        JWT_SECRET: 'tracing-rollback-test-secret-at-least-32-bytes',
        OPERATIONS_ACCESS_TOKEN: 'tracing-rollback-operations-token',
        OPERATIONS_OPERATOR_ID: 'tracing-rollback-test',
        RUNTIME_ENV: 'test',
        REAL_MONEY_ENABLED: 'false',
        OTEL_TRACING_ENABLED: 'false',
        OTEL_BROWSER_TRACING_ENABLED: 'false',
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'invalid endpoint',
      }))
        vi.stubEnv(name, value);
      const logs: string[] = [];
      vi.spyOn(console, 'log').mockImplementation((message: unknown) => logs.push(String(message)));
      const runtime = await startApi();
      const base = `http://127.0.0.1:${port}`;
      const email = `${randomUUID()}@example.test`;
      const password = 'rollback-test-password';
      try {
        const signup = await fetch(`${base}/api/v1/auth/signup`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-correlation-id': 'rollback-signup' },
          body: JSON.stringify({ email, password, name: 'Rollback test' }),
        });
        expect(signup.status).toBe(201);
        expect(signup.headers.get('x-correlation-id')).toBe('rollback-signup');
        const signedUp = (await signup.json()) as { setupPending: boolean };
        expect(signedUp.setupPending).toBe(false);
        const login = await fetch(`${base}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        expect(login.status).toBe(200);
        const session = (await login.json()) as { accessToken: string };
        const headers = { authorization: `Bearer ${session.accessToken}` };
        expect(
          (await fetch(`${base}/api/v1/auth/workspace/initialize`, { method: 'POST', headers }))
            .status,
        ).toBe(200);
        expect((await fetch(`${base}/api/v1/creator/identity`, { headers })).status).toBe(200);
        expect((await fetch(`${base}/health`)).status).toBe(200);
        expect((await fetch(`${base}/api/v1/readiness`)).status).toBe(200);
        const signupLog = logs
          .map((line) => JSON.parse(line) as { event: string; context: Record<string, unknown> })
          .find(
            (entry) =>
              entry.event === 'api_request_completed' &&
              entry.context.correlationId === 'rollback-signup',
          );
        expect(signupLog?.context).toMatchObject({ statusCode: 201 });
        expect(signupLog?.context).not.toHaveProperty('trace_id');
        expect(logs.join('\n')).not.toContain(email);
        expect(logs.join('\n')).not.toContain(password);
        expect(logs.join('\n')).not.toContain(session.accessToken);
      } finally {
        await runtime.close();
      }
    },
  );
});
