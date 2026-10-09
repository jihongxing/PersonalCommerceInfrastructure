import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  createAccountIdentityMembership,
  transitionAccountIdentityMembership,
} from './account-identity-membership.js';

const createdAt = '2026-08-26T00:00:00.000Z';

function createMembership() {
  return createAccountIdentityMembership({
    membershipId: 'membership-1',
    accountId: 'supabase:account-1',
    identityId: 'identity-1',
    authority: 'OWNER',
    createdAt,
  });
}

describe('AccountIdentityMembership domain', () => {
  it('creates an active OWNER membership', () => {
    expect(createMembership()).toEqual({
      membershipId: 'membership-1',
      accountId: 'supabase:account-1',
      identityId: 'identity-1',
      authority: 'OWNER',
      state: 'ACTIVE',
      createdAt,
      updatedAt: createdAt,
    });
  });

  it('rejects authorities outside the Stage 2 OWNER-only model', () => {
    expect(() =>
      createAccountIdentityMembership({
        membershipId: 'membership-1',
        accountId: 'supabase:account-1',
        identityId: 'identity-1',
        authority: 'ADMIN' as never,
        createdAt,
      }),
    ).toThrow('authority must be OWNER');
  });

  it('allows approved lifecycle transitions and records revocation', () => {
    const active = createMembership();
    const suspended = transitionAccountIdentityMembership(
      active,
      'SUSPENDED',
      '2026-08-26T01:00:00.000Z',
    );
    const reactivated = transitionAccountIdentityMembership(
      suspended,
      'ACTIVE',
      '2026-08-26T02:00:00.000Z',
    );
    const revoked = transitionAccountIdentityMembership(
      reactivated,
      'REVOKED',
      '2026-08-26T03:00:00.000Z',
    );

    expect(revoked).toMatchObject({
      state: 'REVOKED',
      revokedAt: '2026-08-26T03:00:00.000Z',
    });
  });

  it('rejects revoked membership reactivation and invalid transitions', () => {
    const membership = createMembership();
    const revoked = transitionAccountIdentityMembership(
      membership,
      'REVOKED',
      '2026-08-26T01:00:00.000Z',
    );

    expect(() =>
      transitionAccountIdentityMembership(membership, 'ACTIVE', '2026-08-26T02:00:00.000Z'),
    ).toThrow(DomainTransitionError);
    expect(() =>
      transitionAccountIdentityMembership(revoked, 'ACTIVE', '2026-08-26T02:00:00.000Z'),
    ).toThrow(DomainTransitionError);
  });
});
