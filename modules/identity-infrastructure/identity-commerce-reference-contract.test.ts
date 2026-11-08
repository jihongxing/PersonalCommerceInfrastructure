import { describe, expect, it } from 'vitest';
import { createCommerceReference } from './commerce-reference-contract.js';
import { assignIdentityCommerceReference } from './identity-commerce-reference-contract.js';
import { createInternalIdentityId } from './identity-contract.js';

const identityId = createInternalIdentityId('identity-1');
const commerceReference = createCommerceReference('3C7M4Q9RDFHJKNTWVY');
const assignedAt = '2026-11-08T00:00:00.000Z';

describe('Identity-owned Commerce Reference', () => {
  it('assigns the canonical reference to an Identity', () => {
    expect(
      assignIdentityCommerceReference({ identityId, commerceReference, assignedAt, existing: [] }),
    ).toEqual({ identityId, commerceReference, assignedAt, lifecycle: 'ASSIGNED' });
  });

  it('rejects a second reference for an Identity even when the old one is reserved', () => {
    const existing = [
      { identityId, commerceReference, assignedAt, lifecycle: 'PERMANENTLY_RESERVED' as const },
    ];
    expect(() =>
      assignIdentityCommerceReference({
        identityId,
        commerceReference: createCommerceReference('4C7M4Q9RDFHJKNTWVY'),
        assignedAt,
        existing,
      }),
    ).toThrow('Identity already has a Commerce Reference.');
  });

  it('never reassigns a reference to another Identity', () => {
    const existing = [
      { identityId, commerceReference, assignedAt, lifecycle: 'PERMANENTLY_RESERVED' as const },
    ];
    expect(() =>
      assignIdentityCommerceReference({
        identityId: createInternalIdentityId('identity-2'),
        commerceReference,
        assignedAt,
        existing,
      }),
    ).toThrow('Commerce Reference is already reserved.');
  });
});
