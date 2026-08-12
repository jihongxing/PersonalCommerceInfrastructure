import { describe, expect, it } from 'vitest';

import { createSafeLogger } from '../observability/safe-logger.js';
import { InMemoryNotificationAdapter } from './in-memory-notification-adapter.js';
import { LogNotificationAdapter } from './log-notification-adapter.js';

describe('Notification adapters', () => {
  it('captures notifications in memory without adding product state', async () => {
    const adapter = new InMemoryNotificationAdapter();

    await adapter.deliver({
      kind: 'creator_request_submitted',
      recipientCreatorId: 'creator-1',
      actionId: 'action-1',
      offeringId: 'offering-1',
      offeringTitle: 'Private lesson',
    });

    expect(adapter.list()).toEqual([
      {
        kind: 'creator_request_submitted',
        recipientCreatorId: 'creator-1',
        actionId: 'action-1',
        offeringId: 'offering-1',
        offeringTitle: 'Private lesson',
      },
    ]);
  });

  it('logs notification metadata without exposing Customer contact or result token', async () => {
    const messages: string[] = [];
    const adapter = new LogNotificationAdapter(
      createSafeLogger('info', (message) => {
        messages.push(message);
      }),
    );

    await adapter.deliver({
      kind: 'customer_request_confirmed',
      recipientCustomerId: 'customer-1',
      contactMethod: 'buyer@example.test',
      actionId: 'action-1',
      resultAccessToken: 'secret-result-token',
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('customer_request_confirmed');
    expect(messages[0]).toContain('customer-1');
    expect(messages[0]).toContain('action-1');
    expect(messages[0]).not.toContain('buyer@example.test');
    expect(messages[0]).not.toContain('secret-result-token');
  });
});
