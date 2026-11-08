import { randomInt } from 'node:crypto';
import {
  context,
  diag,
  DiagLogLevel,
  isSpanContextValid,
  ROOT_CONTEXT,
  SpanStatusCode,
  trace,
  type Span,
} from '@opentelemetry/api';
import {
  ExportResultCode,
  W3CTraceContextPropagator,
  type ExportResult,
} from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  SamplingDecision,
  type ReadableSpan,
  type Sampler,
  type SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import type { SafeLogger } from './safe-logger.js';

export const traceContextPropagator = new W3CTraceContextPropagator();

export function createServerSampler(rate: number): Sampler {
  const independentSampler: Sampler = {
    shouldSample: () => ({
      decision:
        rate === 1 || (rate > 0 && randomInt(0, 2 ** 32) / 2 ** 32 < rate)
          ? SamplingDecision.RECORD_AND_SAMPLED
          : SamplingDecision.NOT_RECORD,
    }),
    toString: () => `ServerProbabilitySampler(${rate})`,
  };
  return new ParentBasedSampler({
    root: independentSampler,
    remoteParentSampled: independentSampler,
    remoteParentNotSampled: independentSampler,
  });
}

export interface TracingConfiguration {
  readonly enabled: boolean;
  readonly serviceName: string;
  readonly environment: string;
  readonly endpoint: string;
  readonly samplingRate: number;
  readonly queueSize: number;
  readonly exportTimeoutMs: number;
  readonly shutdownTimeoutMs: number;
}

export function loadTracingConfiguration(
  env: NodeJS.ProcessEnv = process.env,
): TracingConfiguration & { readonly browserEnabled: boolean } {
  const enabled = env.OTEL_TRACING_ENABLED ?? 'false';
  if (enabled !== 'true' && enabled !== 'false')
    throw new Error('OTEL_TRACING_ENABLED must be true or false.');
  const browserEnabled = env.OTEL_BROWSER_TRACING_ENABLED ?? 'false';
  if (browserEnabled !== 'true' && browserEnabled !== 'false')
    throw new Error('OTEL_BROWSER_TRACING_ENABLED must be true or false.');
  const protocol =
    env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL ?? env.OTEL_EXPORTER_OTLP_PROTOCOL ?? 'http/json';
  if ((enabled === 'true' || browserEnabled === 'true') && protocol !== 'http/json')
    throw new Error('Only OTLP http/json tracing is supported.');
  const samplingRate = Number(enabled === 'true' ? (env.OTEL_TRACES_SAMPLER_ARG ?? '1') : '1');
  const queueSize = Number(enabled === 'true' ? (env.OTEL_BSP_MAX_QUEUE_SIZE ?? '2048') : '2048');
  const exportTimeoutMs = Number(
    enabled === 'true' ? (env.OTEL_BSP_EXPORT_TIMEOUT ?? '5000') : '5000',
  );
  const shutdownTimeoutMs = Number(
    enabled === 'true' ? (env.OTEL_SHUTDOWN_TIMEOUT_MS ?? '6000') : '6000',
  );
  if (!Number.isFinite(samplingRate) || samplingRate < 0 || samplingRate > 1)
    throw new Error('OTEL_TRACES_SAMPLER_ARG must be between 0 and 1.');
  for (const value of [queueSize, exportTimeoutMs, shutdownTimeoutMs]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 60000)
      throw new Error('Invalid tracing queue size or timeout.');
  }
  const endpoint =
    enabled === 'true' || browserEnabled === 'true'
      ? (env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? 'http://127.0.0.1:4318/v1/traces')
      : 'http://127.0.0.1:4318/v1/traces';
  const parsed = new URL(endpoint);
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  )
    throw new Error('Invalid OTLP traces endpoint.');
  const serviceName = env.OTEL_SERVICE_NAME?.trim() || 'pci-api';
  return {
    enabled: enabled === 'true',
    browserEnabled: browserEnabled === 'true',
    serviceName,
    environment: env.APP_ENV ?? 'development',
    endpoint,
    samplingRate,
    queueSize,
    exportTimeoutMs,
    shutdownTimeoutMs,
  };
}

export function startTracing(
  config: TracingConfiguration,
  logger?: SafeLogger,
): { shutdown(): Promise<void> } {
  if (!config.enabled) return { shutdown: async () => {} };
  if (logger)
    diag.setLogger(
      {
        error: () => context.with(ROOT_CONTEXT, () => logger.error('trace_sdk_error')),
        warn: (message: string) => {
          const dropped = /^Dropped (\d+) spans because maxQueueSize reached/u.exec(message);
          context.with(ROOT_CONTEXT, () => {
            if (dropped) logger.warn('trace_queue_dropped', { count: Number(dropped[1]) });
            else if (message === 'Received Partial Success response:')
              logger.warn('trace_export_partial_success');
            else logger.warn('trace_sdk_warning');
          });
        },
        info: () => {},
        debug: (message: string) => {
          if (message === 'maxQueueSize reached, dropping spans')
            context.with(ROOT_CONTEXT, () => logger.warn('trace_queue_full'));
        },
        verbose: () => {},
      },
      DiagLogLevel.DEBUG,
    );
  const otlp = new OTLPTraceExporter({
    url: config.endpoint,
    timeoutMillis: config.exportTimeoutMs,
  });
  const exporter: SpanExporter = {
    export: (spans: ReadableSpan[], callback: (result: ExportResult) => void) =>
      otlp.export(spans, (result) => {
        if (result.code !== ExportResultCode.SUCCESS)
          context.with(ROOT_CONTEXT, () =>
            logger?.warn('trace_export_failed', { count: spans.length }),
          );
        callback(result);
      }),
    shutdown: () => otlp.shutdown(),
    forceFlush: () => otlp.forceFlush(),
  };
  const sdk = new NodeSDK({
    autoDetectResources: false,
    resource: resourceFromAttributes({
      'service.name': config.serviceName,
      'service.version': '0.1.0',
      'deployment.environment.name': config.environment,
    }),
    textMapPropagator: traceContextPropagator,
    sampler: createServerSampler(config.samplingRate),
    spanProcessors: [
      new BatchSpanProcessor(exporter, {
        maxQueueSize: config.queueSize,
        maxExportBatchSize: Math.min(config.queueSize, 512),
        exportTimeoutMillis: config.exportTimeoutMs,
      }),
    ],
  });
  sdk.start();
  let closing: Promise<void> | undefined;
  return {
    shutdown: () => {
      closing ??= Promise.race([
        sdk.shutdown(),
        new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, config.shutdownTimeoutMs);
          timer.unref();
        }),
      ]);
      return closing;
    },
  };
}

export async function withTraceSpan<T>(name: string, operation: () => Promise<T>): Promise<T> {
  return trace.getTracer('pci-api').startActiveSpan(name, async (span: Span) => {
    try {
      return await operation();
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function activeTraceFields(): Record<string, string | boolean> {
  const spanContext = trace.getSpan(context.active())?.spanContext();
  if (!spanContext || !isSpanContextValid(spanContext)) return {};
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
    trace_sampled: (spanContext.traceFlags & 1) === 1,
  };
}
