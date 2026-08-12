import { describe, expect, it } from 'vitest';

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
});
