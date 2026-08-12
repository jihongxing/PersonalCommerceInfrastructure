import { describe, expect, it } from 'vitest';

import { assertCreatorOwnership, assertCustomerOwnership, type Actor } from './actors.js';

describe('actor ownership policies', () => {
  it('allows the owning creator', () => {
    const actor: Actor = { kind: 'creator', creatorId: 'creator-1' };

    expect(() => assertCreatorOwnership(actor, 'creator-1')).not.toThrow();
  });

  it('rejects another creator or actor kind', () => {
    const actor: Actor = { kind: 'customer', customerId: 'customer-1' };

    expect(() => assertCreatorOwnership(actor, 'creator-1')).toThrow('owning Creator');
  });

  it('allows the owning customer', () => {
    const actor: Actor = { kind: 'customer', customerId: 'customer-1' };

    expect(() => assertCustomerOwnership(actor, 'customer-1')).not.toThrow();
  });
});
