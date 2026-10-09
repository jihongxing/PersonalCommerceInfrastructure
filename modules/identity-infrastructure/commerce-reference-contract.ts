import { DomainTransitionError } from '../shared/domain-error.js';
import type { CommerceProfileId, CommerceReference } from './identity-contract.js';

export type { CommerceReference } from './identity-contract.js';

export const COMMERCE_REFERENCE_ALPHABET = '3479ACDEFHJKMNPQRTVWXY';
export const COMMERCE_REFERENCE_LENGTH = 18;

export type CommerceReferenceLifecycle = 'ASSIGNED' | 'PERMANENTLY_RESERVED';

export interface AssignedCommerceReference {
  readonly commerceReference: CommerceReference;
  readonly commerceProfileId: CommerceProfileId;
  readonly lifecycle: CommerceReferenceLifecycle;
  readonly assignedAt: string;
  readonly updatedAt: string;
}

export function createCommerceReference(value: string): CommerceReference {
  if (value.length !== COMMERCE_REFERENCE_LENGTH) {
    throw new TypeError(
      `Commerce Reference must contain exactly ${COMMERCE_REFERENCE_LENGTH} canonical characters.`,
    );
  }

  for (const character of value) {
    if (!COMMERCE_REFERENCE_ALPHABET.includes(character)) {
      throw new TypeError('Commerce Reference must use the canonical uppercase ASCII alphabet.');
    }
  }

  return value as CommerceReference;
}

export function formatCommerceReferenceForDisplay(value: CommerceReference): string {
  return `${value.slice(0, 6)}-${value.slice(6, 12)}-${value.slice(12, 18)}`;
}

export function assignCommerceReference(input: {
  readonly commerceReference: CommerceReference;
  readonly commerceProfileId: CommerceProfileId;
  readonly assignedAt: string;
  readonly assignedReferences: readonly AssignedCommerceReference[];
}): AssignedCommerceReference {
  assertNonEmpty(input.commerceReference, 'Commerce Reference');
  assertNonEmpty(input.commerceProfileId, 'Commerce Profile ID');
  assertNonEmpty(input.assignedAt, 'Commerce Reference assignment timestamp');
  assertReferenceValueIsUnique(input.commerceReference, input.assignedReferences);
  assertProfileHasNoCommerceReference(input.commerceProfileId, input.assignedReferences);

  return {
    commerceReference: input.commerceReference,
    commerceProfileId: input.commerceProfileId,
    lifecycle: 'ASSIGNED',
    assignedAt: input.assignedAt,
    updatedAt: input.assignedAt,
  };
}

export function rehydrateAssignedCommerceReference(input: {
  readonly commerceReference: CommerceReference;
  readonly commerceProfileId: CommerceProfileId;
  readonly lifecycle: string;
  readonly assignedAt: string;
  readonly updatedAt: string;
}): AssignedCommerceReference {
  assertNonEmpty(input.commerceReference, 'Commerce Reference');
  assertNonEmpty(input.commerceProfileId, 'Commerce Profile ID');
  assertCommerceReferenceLifecycle(input.lifecycle);
  assertNonEmpty(input.assignedAt, 'Commerce Reference assignment timestamp');
  assertNonEmpty(input.updatedAt, 'Commerce Reference update timestamp');

  return {
    commerceReference: input.commerceReference,
    commerceProfileId: input.commerceProfileId,
    lifecycle: input.lifecycle,
    assignedAt: input.assignedAt,
    updatedAt: input.updatedAt,
  };
}

export function permanentlyReserveCommerceReference(
  assignedReference: AssignedCommerceReference,
  updatedAt: string,
): AssignedCommerceReference {
  assertNonEmpty(updatedAt, 'Commerce Reference update timestamp');

  if (assignedReference.lifecycle !== 'ASSIGNED') {
    throw new DomainTransitionError(
      'CommerceReference',
      assignedReference.lifecycle,
      'permanently_reserved',
    );
  }

  return {
    ...assignedReference,
    lifecycle: 'PERMANENTLY_RESERVED',
    updatedAt,
  };
}

function assertCommerceReferenceLifecycle(
  value: string,
): asserts value is CommerceReferenceLifecycle {
  if (value !== 'ASSIGNED' && value !== 'PERMANENTLY_RESERVED') {
    throw new TypeError(`Commerce Reference lifecycle ${value} is invalid.`);
  }
}

function assertReferenceValueIsUnique(
  commerceReference: CommerceReference,
  assignedReferences: readonly AssignedCommerceReference[],
): void {
  if (
    assignedReferences.some(
      (assignedReference) => assignedReference.commerceReference === commerceReference,
    )
  ) {
    throw new Error('Commerce Reference is already assigned.');
  }
}

function assertProfileHasNoCommerceReference(
  commerceProfileId: CommerceProfileId,
  assignedReferences: readonly AssignedCommerceReference[],
): void {
  if (
    assignedReferences.some(
      (assignedReference) => assignedReference.commerceProfileId === commerceProfileId,
    )
  ) {
    throw new Error('Commerce Profile already has a Commerce Reference.');
  }
}

function assertNonEmpty(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} cannot be empty.`);
  }
}
