import { DomainTransitionError } from '../shared/domain-error.js';

export type AccountIdentityMembershipAuthority = 'OWNER';
export type AccountIdentityMembershipState =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'HISTORICAL';

export interface AccountIdentityMembership {
  readonly membershipId: string;
  readonly accountId: string;
  readonly identityId: string;
  readonly authority: AccountIdentityMembershipAuthority;
  readonly state: AccountIdentityMembershipState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revokedAt?: string;
}

export function createAccountIdentityMembership(input: {
  readonly membershipId: string;
  readonly accountId: string;
  readonly identityId: string;
  readonly authority: AccountIdentityMembershipAuthority;
  readonly createdAt: string;
  readonly updatedAt?: string;
}): AccountIdentityMembership {
  requireNonEmpty(input.membershipId, 'Membership ID');
  requireNonEmpty(input.accountId, 'Account ID');
  requireNonEmpty(input.identityId, 'Identity ID');
  requireNonEmpty(input.createdAt, 'Membership creation timestamp');
  requireNonEmpty(input.updatedAt ?? input.createdAt, 'Membership update timestamp');

  if (input.authority !== 'OWNER') {
    throw new TypeError('Account Identity Membership authority must be OWNER.');
  }

  return {
    membershipId: input.membershipId,
    accountId: input.accountId,
    identityId: input.identityId,
    authority: input.authority,
    state: 'ACTIVE',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt,
  };
}

export function transitionAccountIdentityMembership(
  membership: AccountIdentityMembership,
  state: AccountIdentityMembershipState,
  updatedAt: string,
): AccountIdentityMembership {
  requireNonEmpty(updatedAt, 'Membership update timestamp');

  if (membership.state === state || !isAllowedTransition(membership.state, state)) {
    throw new DomainTransitionError(
      'AccountIdentityMembership',
      membership.state,
      state.toLowerCase(),
    );
  }

  return {
    ...membership,
    state,
    updatedAt,
    ...(state === 'REVOKED' || state === 'HISTORICAL' ? { revokedAt: updatedAt } : {}),
  };
}

function isAllowedTransition(
  current: AccountIdentityMembershipState,
  next: AccountIdentityMembershipState,
): boolean {
  return (
    (current === 'ACTIVE' && (next === 'SUSPENDED' || next === 'REVOKED')) ||
    (current === 'SUSPENDED' && (next === 'ACTIVE' || next === 'REVOKED')) ||
    (current === 'REVOKED' && next === 'HISTORICAL')
  );
}

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new TypeError(`${field} cannot be empty.`);
  }
}
