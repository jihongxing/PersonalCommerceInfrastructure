import { DomainTransitionError } from '../shared/domain-error.js';
import type { CommerceProfileId } from './identity-contract.js';

declare const externalPlatformAccountIdBrand: unique symbol;
declare const commerceRelationshipIdBrand: unique symbol;
declare const externalPlatformNamespaceBrand: unique symbol;
declare const platformAccountIdentifierBrand: unique symbol;

export type ExternalPlatformAccountId = string & {
  readonly [externalPlatformAccountIdBrand]: 'ExternalPlatformAccountId';
};

export type CommerceRelationshipId = string & {
  readonly [commerceRelationshipIdBrand]: 'CommerceRelationshipId';
};

export type ExternalPlatformNamespace = string & {
  readonly [externalPlatformNamespaceBrand]: 'ExternalPlatformNamespace';
};

export type PlatformAccountIdentifier = string & {
  readonly [platformAccountIdentifierBrand]: 'PlatformAccountIdentifier';
};

export type ExternalPlatformAccountLifecycle = 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export type CommerceRelationshipLifecycle =
  'PROPOSED' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'HISTORICAL';

export type CommerceRelationshipRole = 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER';
export type CommerceRelationshipProvenance =
  | 'SELF_DECLARED'
  | 'PLATFORM_VERIFIED'
  | 'UNKNOWN';

export interface ExternalPlatform {
  readonly namespace: ExternalPlatformNamespace;
}

export interface ExternalPlatformAccount {
  readonly externalPlatformAccountId: ExternalPlatformAccountId;
  readonly platform: ExternalPlatform;
  readonly platformAccountId: PlatformAccountIdentifier;
  readonly lifecycle: ExternalPlatformAccountLifecycle;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CommerceRelationship {
  readonly commerceRelationshipId: CommerceRelationshipId;
  readonly externalPlatformAccountId: ExternalPlatformAccountId;
  readonly commerceProfileId: CommerceProfileId;
  readonly role: CommerceRelationshipRole;
  readonly provenance: CommerceRelationshipProvenance;
  readonly lifecycle: CommerceRelationshipLifecycle;
  readonly effectiveAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function createExternalPlatformNamespace(value: string): ExternalPlatformNamespace {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{0,63}$/u.test(normalized)) {
    throw new TypeError(
      'External Platform namespace must use lowercase letters, digits, and hyphens.',
    );
  }

  return normalized as ExternalPlatformNamespace;
}

export function createExternalPlatform(namespace: ExternalPlatformNamespace): ExternalPlatform {
  assertNonEmpty(namespace, 'External Platform namespace');
  return { namespace };
}

export function createExternalPlatformAccountId(value: string): ExternalPlatformAccountId {
  return createBrandedId(value, 'External Platform Account ID') as ExternalPlatformAccountId;
}

export function createCommerceRelationshipId(value: string): CommerceRelationshipId {
  return createBrandedId(value, 'Commerce Relationship ID') as CommerceRelationshipId;
}

export function createPlatformAccountIdentifier(value: string): PlatformAccountIdentifier {
  return createBrandedId(value, 'Platform account identifier') as PlatformAccountIdentifier;
}

export function createExternalPlatformAccount(input: {
  readonly externalPlatformAccountId: ExternalPlatformAccountId;
  readonly platform: ExternalPlatform;
  readonly platformAccountId: PlatformAccountIdentifier;
  readonly createdAt: string;
}): ExternalPlatformAccount {
  assertNonEmpty(input.externalPlatformAccountId, 'External Platform Account ID');
  assertNonEmpty(input.platform.namespace, 'External Platform namespace');
  assertNonEmpty(input.platformAccountId, 'Platform account identifier');
  assertNonEmpty(input.createdAt, 'External Platform Account creation timestamp');

  return {
    externalPlatformAccountId: input.externalPlatformAccountId,
    platform: input.platform,
    platformAccountId: input.platformAccountId,
    lifecycle: 'ACTIVE',
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

export function rehydrateExternalPlatformAccount(input: {
  readonly externalPlatformAccountId: ExternalPlatformAccountId;
  readonly platform: ExternalPlatform;
  readonly platformAccountId: PlatformAccountIdentifier;
  readonly lifecycle: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}): ExternalPlatformAccount {
  assertNonEmpty(input.externalPlatformAccountId, 'External Platform Account ID');
  assertNonEmpty(input.platform.namespace, 'External Platform namespace');
  assertNonEmpty(input.platformAccountId, 'Platform account identifier');
  assertExternalPlatformAccountLifecycle(input.lifecycle);
  assertNonEmpty(input.createdAt, 'External Platform Account creation timestamp');
  assertNonEmpty(input.updatedAt, 'External Platform Account update timestamp');

  return {
    externalPlatformAccountId: input.externalPlatformAccountId,
    platform: input.platform,
    platformAccountId: input.platformAccountId,
    lifecycle: input.lifecycle,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export function transitionExternalPlatformAccount(
  account: ExternalPlatformAccount,
  lifecycle: ExternalPlatformAccountLifecycle,
  updatedAt: string,
): ExternalPlatformAccount {
  assertNonEmpty(updatedAt, 'External Platform Account update timestamp');
  assertLifecycleTransition(
    'ExternalPlatformAccount',
    account.lifecycle,
    lifecycle,
    isExternalPlatformAccountTransitionAllowed,
  );

  return {
    ...account,
    lifecycle,
    updatedAt,
  };
}

export function createCommerceRelationship(input: {
  readonly commerceRelationshipId: CommerceRelationshipId;
  readonly externalPlatformAccountId: ExternalPlatformAccountId;
  readonly commerceProfileId: CommerceProfileId;
  readonly role: CommerceRelationshipRole;
  readonly effectiveAt: string;
  readonly createdAt: string;
}): CommerceRelationship {
  assertNonEmpty(input.commerceRelationshipId, 'Commerce Relationship ID');
  assertNonEmpty(input.externalPlatformAccountId, 'External Platform Account ID');
  assertNonEmpty(input.commerceProfileId, 'Commerce Profile ID');
  assertCommerceRelationshipRole(input.role);
  assertNonEmpty(input.effectiveAt, 'Commerce Relationship effective timestamp');
  assertNonEmpty(input.createdAt, 'Commerce Relationship creation timestamp');

  return {
    commerceRelationshipId: input.commerceRelationshipId,
    externalPlatformAccountId: input.externalPlatformAccountId,
    commerceProfileId: input.commerceProfileId,
    role: input.role,
    provenance: 'SELF_DECLARED',
    lifecycle: 'PROPOSED',
    effectiveAt: input.effectiveAt,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

export function rehydrateCommerceRelationship(input: {
  readonly commerceRelationshipId: CommerceRelationshipId;
  readonly externalPlatformAccountId: ExternalPlatformAccountId;
  readonly commerceProfileId: CommerceProfileId;
  readonly role: string;
  readonly provenance?: string;
  readonly lifecycle: string;
  readonly effectiveAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}): CommerceRelationship {
  assertNonEmpty(input.commerceRelationshipId, 'Commerce Relationship ID');
  assertNonEmpty(input.externalPlatformAccountId, 'External Platform Account ID');
  assertNonEmpty(input.commerceProfileId, 'Commerce Profile ID');
  assertCommerceRelationshipRole(input.role);
  assertCommerceRelationshipProvenance(input.provenance ?? 'SELF_DECLARED');
  assertCommerceRelationshipLifecycle(input.lifecycle);
  assertNonEmpty(input.effectiveAt, 'Commerce Relationship effective timestamp');
  assertNonEmpty(input.createdAt, 'Commerce Relationship creation timestamp');
  assertNonEmpty(input.updatedAt, 'Commerce Relationship update timestamp');

  return {
    commerceRelationshipId: input.commerceRelationshipId,
    externalPlatformAccountId: input.externalPlatformAccountId,
    commerceProfileId: input.commerceProfileId,
    role: input.role,
    provenance: (input.provenance ?? 'UNKNOWN') as CommerceRelationshipProvenance,
    lifecycle: input.lifecycle,
    effectiveAt: input.effectiveAt,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export function transitionCommerceRelationship(input: {
  readonly relationship: CommerceRelationship;
  readonly lifecycle: CommerceRelationshipLifecycle;
  readonly updatedAt: string;
  readonly relationships: readonly CommerceRelationship[];
}): CommerceRelationship {
  assertNonEmpty(input.updatedAt, 'Commerce Relationship update timestamp');
  assertLifecycleTransition(
    'CommerceRelationship',
    input.relationship.lifecycle,
    input.lifecycle,
    isCommerceRelationshipTransitionAllowed,
  );

  if (input.lifecycle === 'ACTIVE') {
    assertNoOtherActiveRelationship(input.relationship, input.relationships);
  }

  return {
    ...input.relationship,
    lifecycle: input.lifecycle,
    updatedAt: input.updatedAt,
  };
}

function assertNoOtherActiveRelationship(
  relationship: CommerceRelationship,
  relationships: readonly CommerceRelationship[],
): void {
  const hasOtherActiveRelationship = relationships.some(
    (candidate) =>
      candidate.commerceRelationshipId !== relationship.commerceRelationshipId &&
      candidate.externalPlatformAccountId === relationship.externalPlatformAccountId &&
      candidate.lifecycle === 'ACTIVE',
  );

  if (hasOtherActiveRelationship) {
    throw new Error(
      'External Platform Account cannot have more than one active Commerce Relationship.',
    );
  }
}

function isExternalPlatformAccountTransitionAllowed(
  current: ExternalPlatformAccountLifecycle,
  next: ExternalPlatformAccountLifecycle,
): boolean {
  return (
    (current === 'ACTIVE' && (next === 'SUSPENDED' || next === 'REVOKED')) ||
    (current === 'SUSPENDED' && (next === 'ACTIVE' || next === 'REVOKED'))
  );
}

function assertExternalPlatformAccountLifecycle(
  lifecycle: string,
): asserts lifecycle is ExternalPlatformAccountLifecycle {
  if (lifecycle !== 'ACTIVE' && lifecycle !== 'SUSPENDED' && lifecycle !== 'REVOKED') {
    throw new TypeError(`External Platform Account lifecycle ${lifecycle} is invalid.`);
  }
}

function isCommerceRelationshipTransitionAllowed(
  current: CommerceRelationshipLifecycle,
  next: CommerceRelationshipLifecycle,
): boolean {
  return (
    (current === 'PROPOSED' && next === 'VERIFIED') ||
    (current === 'VERIFIED' && next === 'ACTIVE') ||
    (current === 'ACTIVE' && (next === 'SUSPENDED' || next === 'REVOKED')) ||
    (current === 'SUSPENDED' &&
      (next === 'ACTIVE' || next === 'REVOKED' || next === 'HISTORICAL')) ||
    (current === 'REVOKED' && next === 'HISTORICAL')
  );
}

function assertCommerceRelationshipRole(role: string): asserts role is CommerceRelationshipRole {
  if (role !== 'OWNER' && role !== 'MANAGER' && role !== 'DELEGATED_MANAGER') {
    throw new TypeError('Commerce Relationship role is invalid.');
  }
}

function assertCommerceRelationshipProvenance(
  provenance: string,
): asserts provenance is CommerceRelationshipProvenance {
  if (
    provenance !== 'SELF_DECLARED' &&
    provenance !== 'PLATFORM_VERIFIED' &&
    provenance !== 'UNKNOWN'
  ) {
    throw new TypeError(`Commerce Relationship provenance ${provenance} is invalid.`);
  }
}

function assertCommerceRelationshipLifecycle(
  lifecycle: string,
): asserts lifecycle is CommerceRelationshipLifecycle {
  if (
    lifecycle !== 'PROPOSED' &&
    lifecycle !== 'VERIFIED' &&
    lifecycle !== 'ACTIVE' &&
    lifecycle !== 'SUSPENDED' &&
    lifecycle !== 'REVOKED' &&
    lifecycle !== 'HISTORICAL'
  ) {
    throw new TypeError(`Commerce Relationship lifecycle ${lifecycle} is invalid.`);
  }
}

function assertLifecycleTransition<TLifecycle extends string>(
  aggregate: string,
  current: TLifecycle,
  next: TLifecycle,
  isAllowed: (current: TLifecycle, next: TLifecycle) => boolean,
): void {
  if (current === next || !isAllowed(current, next)) {
    throw new DomainTransitionError(aggregate, current, next.toLowerCase());
  }
}

function createBrandedId(value: string, label: string): string {
  assertNonEmpty(value, label);
  return value;
}

function assertNonEmpty(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} cannot be empty.`);
  }
}
