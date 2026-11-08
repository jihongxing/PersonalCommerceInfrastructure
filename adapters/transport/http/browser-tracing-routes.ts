import type { FastifyInstance } from 'fastify';
import type { SafeLogger } from '../../observability/safe-logger.js';

interface BrowserSpanBase {
  traceId: string;
  spanId: string;
  startMs: number;
  durationMs: number;
  links: { traceId: string; spanId: string }[];
}

type BrowserSpan = BrowserSpanBase &
  (
    | { method: string; route: string; status: number; failed?: boolean; operation?: never }
    | { operation: 'auth.refresh.wait'; outcome: 'success' | 'rejected' | 'error' }
  );

const id = (value: unknown, length: number): value is string =>
  typeof value === 'string' && new RegExp(`^(?!0+$)[0-9a-f]{${length}}$`, 'u').test(value);
const routes = new Set([
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/workspace/initialize',
  '/api/v1/creator/identity',
  '/api/v1/*',
]);
const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const maxConcurrentExports = 16;
const maxCollectorResponseBytes = 16384;

async function readCollectorResponse(response: Response): Promise<unknown> {
  if (!response.body) throw new Error('Missing collector response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxCollectorResponseBytes) throw new Error('Collector response too large');
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode()) as unknown;
  } finally {
    void reader.cancel().catch(() => undefined);
  }
}

function validSpan(value: unknown): value is BrowserSpan {
  if (!value || typeof value !== 'object') return false;
  const span = value as BrowserSpan;
  return (
    id(span.traceId, 32) &&
    id(span.spanId, 16) &&
    Number.isFinite(span.startMs) &&
    Math.abs(Date.now() - span.startMs) < 86400000 &&
    Number.isFinite(span.durationMs) &&
    span.durationMs >= 0 &&
    span.durationMs <= 300000 &&
    (span.operation === 'auth.refresh.wait'
      ? ['success', 'rejected', 'error'].includes(span.outcome)
      : span.operation === undefined &&
        methods.has(span.method) &&
        routes.has(span.route) &&
        Number.isInteger(span.status) &&
        span.status >= 0 &&
        span.status <= 599 &&
        (span.failed === undefined || typeof span.failed === 'boolean')) &&
    Array.isArray(span.links) &&
    span.links.length <= 16 &&
    span.links.every((link) => link && id(link.traceId, 32) && id(link.spanId, 16))
  );
}

export function registerBrowserTracingRoutes(
  server: FastifyInstance,
  options: { endpoint: string; origins: readonly string[]; logger?: SafeLogger },
): void {
  let activeExports = 0;
  server.post(
    '/api/v1/telemetry/browser-traces',
    {
      bodyLimit: 16384,
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      if (!request.headers.origin || !options.origins.includes(request.headers.origin))
        return reply.code(403).send();
      const body = request.body as { spans?: unknown } | undefined;
      if (
        !body ||
        !Array.isArray(body.spans) ||
        body.spans.length < 1 ||
        body.spans.length > 20 ||
        !body.spans.every(validSpan)
      )
        return reply.code(400).send();
      if (activeExports >= maxConcurrentExports) {
        options.logger?.warn('trace_browser_export_failed', {
          reason: 'collector_concurrency_limit',
        });
        return reply.code(503).send();
      }
      activeExports += 1;
      const controller = new AbortController();
      try {
        const spans = body.spans.map((span: BrowserSpan) => ({
          traceId: span.traceId,
          spanId: span.spanId,
          name:
            span.operation === 'auth.refresh.wait'
              ? span.operation
              : `${span.method} ${span.route}`,
          kind: span.operation === 'auth.refresh.wait' ? 1 : 3,
          startTimeUnixNano: String(Math.round(span.startMs * 1000000)),
          endTimeUnixNano: String(Math.round((span.startMs + span.durationMs) * 1000000)),
          attributes:
            span.operation === 'auth.refresh.wait'
              ? [{ key: 'pci.refresh.outcome', value: { stringValue: span.outcome } }]
              : [
                  { key: 'http.request.method', value: { stringValue: span.method } },
                  { key: 'http.route', value: { stringValue: span.route } },
                  { key: 'http.response.status_code', value: { intValue: String(span.status) } },
                ],
          links: span.links.map((link) => ({ traceId: link.traceId, spanId: link.spanId })),
          ...((
            span.operation === 'auth.refresh.wait'
              ? span.outcome !== 'success'
              : span.failed === true || span.status === 0 || span.status >= 500
          )
            ? { status: { code: 2 } }
            : {}),
        }));
        const response = await fetch(options.endpoint, {
          method: 'POST',
          redirect: 'error',
          headers: { 'content-type': 'application/json' },
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2000)]),
          body: JSON.stringify({
            resourceSpans: [
              {
                resource: {
                  attributes: [{ key: 'service.name', value: { stringValue: 'pci-web' } }],
                },
                scopeSpans: [{ scope: { name: 'pci-web' }, spans }],
              },
            ],
          }),
        });
        if (!response.ok) {
          options.logger?.warn('trace_browser_export_failed', { reason: 'collector_http_error' });
          return reply.code(503).send();
        }
        const result = await readCollectorResponse(response);
        if (!result || typeof result !== 'object' || Array.isArray(result))
          throw new Error('Invalid collector response');
        const acknowledgement = result as { partialSuccess?: unknown; partial_success?: unknown };
        if (
          acknowledgement.partialSuccess !== undefined &&
          acknowledgement.partial_success !== undefined
        )
          throw new Error('Invalid collector response');
        const partial =
          acknowledgement.partialSuccess !== undefined
            ? acknowledgement.partialSuccess
            : acknowledgement.partial_success;
        if (partial !== undefined) {
          if (!partial || typeof partial !== 'object' || Array.isArray(partial))
            throw new Error('Invalid collector response');
          const fields = partial as {
            rejectedSpans?: unknown;
            rejected_spans?: unknown;
            errorMessage?: unknown;
            error_message?: unknown;
          };
          if (
            (fields.rejectedSpans !== undefined && fields.rejected_spans !== undefined) ||
            (fields.errorMessage !== undefined && fields.error_message !== undefined)
          )
            throw new Error('Invalid collector response');
          const rejected =
            fields.rejectedSpans !== undefined
              ? fields.rejectedSpans
              : fields.rejected_spans === undefined
                ? '0'
                : fields.rejected_spans;
          const errorMessage =
            fields.errorMessage !== undefined ? fields.errorMessage : fields.error_message;
          if (
            !(
              (typeof rejected === 'string' && /^\d+$/u.test(rejected)) ||
              (typeof rejected === 'number' && Number.isSafeInteger(rejected) && rejected >= 0)
            ) ||
            (errorMessage !== undefined && typeof errorMessage !== 'string')
          )
            throw new Error('Invalid collector response');
          if (Number(rejected) > 0) {
            options.logger?.warn('trace_browser_export_failed', {
              reason: 'collector_rejected_spans',
            });
            return reply.code(503).send();
          }
          if (errorMessage) options.logger?.warn('trace_browser_export_warning');
        }
        return reply.code(202).send();
      } catch {
        options.logger?.warn('trace_browser_export_failed', {
          reason: 'collector_transport_or_response_error',
        });
        return reply.code(503).send();
      } finally {
        controller.abort();
        activeExports -= 1;
      }
    },
  );
}
