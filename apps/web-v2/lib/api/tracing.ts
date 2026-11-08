'use client';

import {
  context,
  ROOT_CONTEXT,
  SpanKind,
  SpanStatusCode,
  trace,
  type Span,
  type SpanContext,
} from '@opentelemetry/api';
import { W3CTraceContextPropagator, ExportResultCode } from '@opentelemetry/core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  type ReadableSpan,
  type SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';

const enabled = process.env.NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const propagator = new W3CTraceContextPropagator();
const knownRoutes = new Set([
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/workspace/initialize',
  '/api/v1/creator/identity',
]);
let initialized = false;

class BrowserExporter implements SpanExporter {
  private pending = 0;

  export(spans: ReadableSpan[], callback: (result: { code: ExportResultCode }) => void): void {
    if (this.pending >= 32) {
      callback({ code: ExportResultCode.FAILED });
      return;
    }
    this.pending += 1;
    try {
      const payload = spans.map((span) => ({
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
        startMs: span.startTime[0] * 1000 + span.startTime[1] / 1e6,
        durationMs: span.duration[0] * 1000 + span.duration[1] / 1e6,
        ...(span.name === 'auth.refresh.wait'
          ? { operation: 'auth.refresh.wait', outcome: span.attributes['pci.refresh.outcome'] }
          : {
              method: span.attributes['http.request.method'],
              route: span.attributes['http.route'],
              status: span.attributes['http.response.status_code'] ?? 0,
              failed: span.status.code === SpanStatusCode.ERROR,
            }),
        links: span.links
          .slice(0, 16)
          .map(({ context: link }) => ({ traceId: link.traceId, spanId: link.spanId })),
      }));
      void fetch(`${apiUrl}/api/v1/telemetry/browser-traces`, {
        method: 'POST',
        redirect: 'error',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        keepalive: true,
        signal: AbortSignal.timeout(2000),
        body: JSON.stringify({ spans: payload }),
      })
        .then(
          (response) =>
            callback({ code: response.ok ? ExportResultCode.SUCCESS : ExportResultCode.FAILED }),
          () => callback({ code: ExportResultCode.FAILED }),
        )
        .finally(() => {
          this.pending -= 1;
        });
    } catch {
      this.pending -= 1;
      callback({ code: ExportResultCode.FAILED });
    }
  }
  async shutdown(): Promise<void> {}
}

function initialize(): void {
  if (!enabled || initialized || typeof window === 'undefined') return;
  initialized = true;
  new WebTracerProvider({
    resource: resourceFromAttributes({ 'service.name': 'pci-web' }),
    spanProcessors: [
      new BatchSpanProcessor(new BrowserExporter(), {
        maxQueueSize: 256,
        maxExportBatchSize: 8,
        scheduledDelayMillis: 1000,
        exportTimeoutMillis: 2500,
      }),
    ],
  }).register();
}

export function startRequestSpan(
  method: string,
  path: string,
  links: SpanContext[] = [],
): Span | undefined {
  initialize();
  if (!enabled || typeof window === 'undefined') return undefined;
  const route = knownRoutes.has(path) ? path : '/api/v1/*';
  return trace.getTracer('pci-web').startSpan(
    `${method} ${route}`,
    {
      kind: SpanKind.CLIENT,
      links: links.map((link) => ({ context: link })),
      attributes: { 'http.request.method': method, 'http.route': route },
    },
    ROOT_CONTEXT,
  );
}

export function startRefreshWaitSpan(links: SpanContext[]): Span | undefined {
  initialize();
  if (!enabled || typeof window === 'undefined') return undefined;
  return trace
    .getTracer('pci-web')
    .startSpan(
      'auth.refresh.wait',
      { kind: SpanKind.INTERNAL, links: links.map((link) => ({ context: link })) },
      ROOT_CONTEXT,
    );
}

export function finishRefreshWaitSpan(
  span: Span | undefined,
  outcome: 'success' | 'rejected' | 'error',
): void {
  if (!span) return;
  span.setAttribute('pci.refresh.outcome', outcome);
  if (outcome !== 'success') span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();
}

export function injectRequestTrace(span: Span | undefined, headers: Headers, target: string): void {
  if (!span) return;
  try {
    if (
      new URL(target, window.location.href).origin !== new URL(apiUrl, window.location.href).origin
    )
      return;
    propagator.inject(trace.setSpan(context.active(), span), headers, {
      set: (carrier, key, value) => carrier.set(key, value),
    });
  } catch {
    /* Invalid targets receive no tracing headers. */
  }
}

export function finishRequestSpan(span: Span | undefined, status: number, failed = false): void {
  if (!span) return;
  span.setAttribute('http.response.status_code', status);
  if (failed || status === 0 || status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();
}
