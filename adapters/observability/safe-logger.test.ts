import { describe, expect, it } from 'vitest';
import { context, ROOT_CONTEXT, trace, TraceFlags } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';

import { createSafeLogger } from './safe-logger.js';

describe('safe logger', () => {
  it('redacts contact and secret values', () => {
    const messages: string[] = [];
    const logger = createSafeLogger('debug', (message) => {
      messages.push(message);
    });

    logger.info('request_received', {
      correlationId: 'correlation-1',
      customerEmail: 'buyer@example.test',
      accessToken: 'secret-token',
      offeringId: 'offering-1',
    });

    const output = messages.at(0);

    expect(output).toBeDefined();
    expect(output).not.toContain('buyer@example.test');
    expect(output).not.toContain('secret-token');
    expect(output).toContain('correlation-1');
    expect(output).toContain('offering-1');
  });

  it('honors the minimum log level', () => {
    const messages: string[] = [];
    const logger = createSafeLogger('warn', (message) => {
      messages.push(message);
    });

    logger.info('ignored');
    logger.warn('recorded');

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('recorded');
  });

  it('redacts nested secrets and URLs', () => {
    const messages: string[] = [];
    createSafeLogger('info', (line) => messages.push(line)).info('test', {
      nested: [{ credentials: { password: 'private-password' }, value: 'person@example.test' }],
      path: 'https://example.test/path?token=private-token',
    });
    expect(messages[0]).not.toContain('private-password');
    expect(messages[0]).not.toContain('person@example.test');
    expect(messages[0]).not.toContain('private-token');
  });

  it('derives trace fields only from the current valid span context', () => {
    const messages: string[] = [];
    const logger = createSafeLogger('info', (line) => messages.push(line));
    const supplied = {
      correlationId: 'request-1',
      trace_id: 'stale-trace',
      span_id: 'stale-span',
      trace_sampled: true,
    };
    const spanContext = {
      traceId: '1'.repeat(32),
      spanId: '2'.repeat(16),
      traceFlags: TraceFlags.NONE,
    };
    const manager = new AsyncLocalStorageContextManager().enable();
    expect(context.setGlobalContextManager(manager)).toBe(true);
    try {
      context.with(ROOT_CONTEXT, () => logger.info('without_span', supplied));
      context.with(trace.setSpanContext(ROOT_CONTEXT, spanContext), () =>
        logger.info('with_span', supplied),
      );
    } finally {
      context.disable();
      manager.disable();
    }

    const entries = messages.map((message) => JSON.parse(message) as { context: unknown });
    expect(entries[0].context).toEqual({ correlationId: 'request-1' });
    expect(entries[1].context).toEqual({
      correlationId: 'request-1',
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
      trace_sampled: false,
    });
    expect(supplied.trace_id).toBe('stale-trace');
  });
});
