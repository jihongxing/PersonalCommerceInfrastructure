import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import { createIdentity, transitionIdentity } from './identity.js';

const createdAt = '2026-08-26T00:00:00.000Z';

describe('Identity domain', () => {
  it('creates an active identity with an independent identity id', () => {
    expect(createIdentity('identity-1', createdAt)).toEqual({
      identityId: 'identity-1',
      lifecycle: 'ACTIVE',
      createdAt,
      updatedAt: createdAt,
    });
  });

  it('allows only the approved lifecycle transitions', () => {
    const identity = createIdentity('identity-1', createdAt);
    const suspended = transitionIdentity(identity, 'SUSPENDED', '2026-08-26T01:00:00.000Z');

    expect(suspended.lifecycle).toBe('SUSPENDED');
    expect(transitionIdentity(suspended, 'ACTIVE', '2026-08-26T02:00:00.000Z').lifecycle).toBe(
      'ACTIVE',
    );
    expect(transitionIdentity(suspended, 'ARCHIVED', '2026-08-26T03:00:00.000Z').lifecycle).toBe(
      'ARCHIVED',
    );
  });

  it('rejects illegal transitions and archive reactivation', () => {
    const identity = createIdentity('identity-1', createdAt);
    const archived = transitionIdentity(identity, 'ARCHIVED', '2026-08-26T01:00:00.000Z');

    expect(() => transitionIdentity(identity, 'ACTIVE', '2026-08-26T01:00:00.000Z')).toThrow(
      DomainTransitionError,
    );
    expect(() => transitionIdentity(archived, 'ACTIVE', '2026-08-26T02:00:00.000Z')).toThrow(
      DomainTransitionError,
    );
  });
});
