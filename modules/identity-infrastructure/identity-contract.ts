import { DomainTransitionError } from '../shared/domain-error.js';

declare const authenticationAccountIdBrand: unique symbol;
declare const internalIdentityIdBrand: unique symbol;
declare const commerceProfileIdBrand: unique symbol;
declare const commerceReferenceBrand: unique symbol;

export type AuthenticationAccountId = string & {
  readonly [authenticationAccountIdBrand]: 'AuthenticationAccountId';
};

export type InternalIdentityId = string & {
  readonly [internalIdentityIdBrand]: 'InternalIdentityId';
};

export type CommerceProfileId = string & {
  readonly [commerceProfileIdBrand]: 'CommerceProfileId';
};

export type CommerceReference = string & {
  readonly [commerceReferenceBrand]: 'CommerceReference';
};

export type IdentityLifecycle = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export type CommerceProfileLifecycle = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface InternalIdentity {
  readonly internalIdentityId: InternalIdentityId;
  readonly lifecycle: IdentityLifecycle;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CommerceProfilePresentation {
  readonly displayName: string;
}

export interface CommerceProfile {
  readonly commerceProfileId: CommerceProfileId;
  readonly owningIdentityId: InternalIdentityId;
  readonly lifecycle: CommerceProfileLifecycle;
  readonly presentation: CommerceProfilePresentation;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function createAuthenticationAccountId(value: string): AuthenticationAccountId {
  return createBrandedId(value, 'Authentication Account ID') as AuthenticationAccountId;
}

export function createInternalIdentityId(value: string): InternalIdentityId {
  return createBrandedId(value, 'Internal Identity ID') as InternalIdentityId;
}

export function createCommerceProfileId(value: string): CommerceProfileId {
  return createBrandedId(value, 'Commerce Profile ID') as CommerceProfileId;
}

export function createInternalIdentity(input: {
  readonly internalIdentityId: InternalIdentityId;
  readonly createdAt: string;
}): InternalIdentity {
  assertNonEmpty(input.internalIdentityId, 'Internal Identity ID');
  assertNonEmpty(input.createdAt, 'Internal Identity creation timestamp');

  return {
    internalIdentityId: input.internalIdentityId,
    lifecycle: 'ACTIVE',
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

export function rehydrateInternalIdentity(input: {
  readonly internalIdentityId: InternalIdentityId;
  readonly lifecycle: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}): InternalIdentity {
  assertNonEmpty(input.internalIdentityId, 'Internal Identity ID');
  assertIdentityLifecycle(input.lifecycle);
  assertNonEmpty(input.createdAt, 'Internal Identity creation timestamp');
  assertNonEmpty(input.updatedAt, 'Internal Identity update timestamp');

  return {
    internalIdentityId: input.internalIdentityId,
    lifecycle: input.lifecycle,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export function transitionInternalIdentity(
  identity: InternalIdentity,
  lifecycle: IdentityLifecycle,
  updatedAt: string,
): InternalIdentity {
  assertNonEmpty(updatedAt, 'Internal Identity update timestamp');
  assertLifecycleTransition('InternalIdentity', identity.lifecycle, lifecycle);

  return {
    ...identity,
    lifecycle,
    updatedAt,
  };
}

export function createCommerceProfile(input: {
  readonly commerceProfileId: CommerceProfileId;
  readonly owningIdentityId: InternalIdentityId;
  readonly presentation: CommerceProfilePresentation;
  readonly createdAt: string;
}): CommerceProfile {
  assertNonEmpty(input.commerceProfileId, 'Commerce Profile ID');
  assertNonEmpty(input.owningIdentityId, 'Internal Identity ID');
  assertNonEmpty(input.createdAt, 'Commerce Profile creation timestamp');

  return {
    commerceProfileId: input.commerceProfileId,
    owningIdentityId: input.owningIdentityId,
    lifecycle: 'ACTIVE',
    presentation: normalizePresentation(input.presentation),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

export function rehydrateCommerceProfile(input: {
  readonly commerceProfileId: CommerceProfileId;
  readonly owningIdentityId: InternalIdentityId;
  readonly lifecycle: string;
  readonly presentation: CommerceProfilePresentation;
  readonly createdAt: string;
  readonly updatedAt: string;
}): CommerceProfile {
  assertNonEmpty(input.commerceProfileId, 'Commerce Profile ID');
  assertNonEmpty(input.owningIdentityId, 'Internal Identity ID');
  assertCommerceProfileLifecycle(input.lifecycle);
  assertNonEmpty(input.createdAt, 'Commerce Profile creation timestamp');
  assertNonEmpty(input.updatedAt, 'Commerce Profile update timestamp');

  return {
    commerceProfileId: input.commerceProfileId,
    owningIdentityId: input.owningIdentityId,
    lifecycle: input.lifecycle,
    presentation: normalizePresentation(input.presentation),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export function transitionCommerceProfile(
  profile: CommerceProfile,
  lifecycle: CommerceProfileLifecycle,
  updatedAt: string,
): CommerceProfile {
  assertNonEmpty(updatedAt, 'Commerce Profile update timestamp');
  assertLifecycleTransition('CommerceProfile', profile.lifecycle, lifecycle);

  return {
    ...profile,
    lifecycle,
    updatedAt,
  };
}

export function updateCommerceProfilePresentation(
  profile: CommerceProfile,
  presentation: CommerceProfilePresentation,
  updatedAt: string,
): CommerceProfile {
  assertNonEmpty(updatedAt, 'Commerce Profile update timestamp');
  if (profile.lifecycle !== 'ACTIVE') {
    throw new DomainTransitionError('CommerceProfile', profile.lifecycle, 'update presentation');
  }

  return {
    ...profile,
    presentation: normalizePresentation(presentation),
    updatedAt,
  };
}

export function listOwnedCommerceProfiles(
  identity: InternalIdentity,
  profiles: readonly CommerceProfile[],
): readonly CommerceProfile[] {
  return profiles.filter((profile) => profile.owningIdentityId === identity.internalIdentityId);
}

function createBrandedId(value: string, label: string): string {
  assertNonEmpty(value, label);
  return value;
}

function normalizePresentation(
  presentation: CommerceProfilePresentation,
): CommerceProfilePresentation {
  const displayName = presentation.displayName.trim();
  if (displayName.length === 0) {
    throw new TypeError('Commerce Profile display name is required.');
  }

  return { displayName };
}

function assertLifecycleTransition(
  aggregate: 'InternalIdentity' | 'CommerceProfile',
  current: IdentityLifecycle | CommerceProfileLifecycle,
  next: IdentityLifecycle | CommerceProfileLifecycle,
): void {
  if (
    current === next ||
    !(
      (current === 'ACTIVE' && (next === 'SUSPENDED' || next === 'ARCHIVED')) ||
      (current === 'SUSPENDED' && (next === 'ACTIVE' || next === 'ARCHIVED'))
    )
  ) {
    throw new DomainTransitionError(aggregate, current, next.toLowerCase());
  }
}

function assertIdentityLifecycle(value: string): asserts value is IdentityLifecycle {
  if (value !== 'ACTIVE' && value !== 'SUSPENDED' && value !== 'ARCHIVED') {
    throw new TypeError(`Internal Identity lifecycle ${value} is invalid.`);
  }
}

function assertCommerceProfileLifecycle(value: string): asserts value is CommerceProfileLifecycle {
  if (value !== 'ACTIVE' && value !== 'SUSPENDED' && value !== 'ARCHIVED') {
    throw new TypeError(`Commerce Profile lifecycle ${value} is invalid.`);
  }
}

function assertNonEmpty(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} cannot be empty.`);
  }
}
