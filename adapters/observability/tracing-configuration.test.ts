import { describe, expect, it } from 'vitest';
import { loadTracingConfiguration } from './tracing.js';

describe('tracing configuration', () => {
  it('defaults to disabled tracing and accepts the supported protocol', () => {
    expect(loadTracingConfiguration({})).toMatchObject({ enabled: false, browserEnabled: false });
    expect(
      loadTracingConfiguration({
        OTEL_TRACING_ENABLED: 'true',
        OTEL_BROWSER_TRACING_ENABLED: 'true',
        OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: 'http/json',
      }),
    ).toMatchObject({ enabled: true, browserEnabled: true });
  });

  it('rejects unsupported protocols whenever either exporter is enabled', () => {
    for (const setting of ['OTEL_TRACING_ENABLED', 'OTEL_BROWSER_TRACING_ENABLED']) {
      expect(() =>
        loadTracingConfiguration({
          [setting]: 'true',
          OTEL_EXPORTER_OTLP_PROTOCOL: 'grpc',
        }),
      ).toThrow('Only OTLP http/json tracing is supported.');
    }
    expect(() =>
      loadTracingConfiguration({
        OTEL_TRACING_ENABLED: 'true',
        OTEL_EXPORTER_OTLP_PROTOCOL: 'http/json',
        OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: 'http/protobuf',
      }),
    ).toThrow('Only OTLP http/json tracing is supported.');
    expect(
      loadTracingConfiguration({
        OTEL_EXPORTER_OTLP_PROTOCOL: 'grpc',
        OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: 'http/json',
        OTEL_TRACING_ENABLED: 'true',
      }).enabled,
    ).toBe(true);
  });

  it('allows an unused protocol when tracing is disabled and rejects invalid switches', () => {
    expect(loadTracingConfiguration({ OTEL_EXPORTER_OTLP_PROTOCOL: 'grpc' }).enabled).toBe(false);
    expect(() => loadTracingConfiguration({ OTEL_BROWSER_TRACING_ENABLED: 'yes' })).toThrow(
      'OTEL_BROWSER_TRACING_ENABLED must be true or false.',
    );
    expect(() => loadTracingConfiguration({ OTEL_TRACING_ENABLED: 'yes' })).toThrow(
      'OTEL_TRACING_ENABLED must be true or false.',
    );
  });

  it('ignores unused exporter settings but validates each enabled collection path', () => {
    const invalid = {
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'not a url',
      OTEL_TRACES_SAMPLER_ARG: 'invalid',
      OTEL_BSP_MAX_QUEUE_SIZE: 'invalid',
      OTEL_BSP_EXPORT_TIMEOUT: 'invalid',
      OTEL_SHUTDOWN_TIMEOUT_MS: 'invalid',
    };
    expect(loadTracingConfiguration(invalid)).toMatchObject({
      enabled: false,
      browserEnabled: false,
    });
    expect(() =>
      loadTracingConfiguration({ ...invalid, OTEL_BROWSER_TRACING_ENABLED: 'true' }),
    ).toThrow();
    expect(() => loadTracingConfiguration({ ...invalid, OTEL_TRACING_ENABLED: 'true' })).toThrow();
    expect(
      loadTracingConfiguration({
        ...invalid,
        OTEL_BROWSER_TRACING_ENABLED: 'true',
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
      }),
    ).toMatchObject({ enabled: false, browserEnabled: true });
    expect(() =>
      loadTracingConfiguration({
        ...invalid,
        OTEL_TRACING_ENABLED: 'true',
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'http://127.0.0.1:4318/v1/traces',
      }),
    ).toThrow();
    for (const [name, value] of Object.entries(invalid)) {
      expect(() =>
        loadTracingConfiguration({ OTEL_TRACING_ENABLED: 'true', [name]: value }),
      ).toThrow();
    }
  });
});
