import { DomainTransitionError } from '../shared/domain-error.js';

export type IdentityLifecycle = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface Identity {
  readonly identityId: string;
  readonly lifecycle: IdentityLifecycle;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function createIdentity(
  identityId: string,
  createdAt: string,
  updatedAt: string = createdAt,
): Identity {
  if (identityId.trim().length === 0) {
    throw new TypeError('Identity ID cannot be empty.');
  }
  if (createdAt.trim().length === 0 || updatedAt.trim().length === 0) {
    throw new TypeError('Identity timestamps cannot be empty.');
  }

  return {
    identityId,
    lifecycle: 'ACTIVE',
    createdAt,
    updatedAt,
  };
}

export function transitionIdentity(
  identity: Identity,
  lifecycle: IdentityLifecycle,
  updatedAt: string,
): Identity {
  if (identity.lifecycle === lifecycle) {
    throw new DomainTransitionError('Identity', identity.lifecycle, lifecycle.toLowerCase());
  }

  if (!isAllowedTransition(identity.lifecycle, lifecycle)) {
    throw new DomainTransitionError('Identity', identity.lifecycle, lifecycle.toLowerCase());
  }

  return {
    ...identity,
    lifecycle,
    updatedAt,
  };
}

function isAllowedTransition(current: IdentityLifecycle, next: IdentityLifecycle): boolean {
  return (
    (current === 'ACTIVE' && (next === 'SUSPENDED' || next === 'ARCHIVED')) ||
    (current === 'SUSPENDED' && (next === 'ACTIVE' || next === 'ARCHIVED'))
  );
}
