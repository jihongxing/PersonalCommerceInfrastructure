import {
  createCommerceReference,
  type CommerceReferenceLifecycle,
} from './commerce-reference-contract.js';
import type { CommerceReference, InternalIdentityId } from './identity-contract.js';

/** Ownership invariant for DEV-061. */
export interface IdentityCommerceReference {
  readonly commerceReference: CommerceReference;
  readonly identityId: InternalIdentityId;
  readonly lifecycle: CommerceReferenceLifecycle;
  readonly assignedAt: string;
}

export function assignIdentityCommerceReference(input: {
  readonly commerceReference: CommerceReference;
  readonly identityId: InternalIdentityId;
  readonly assignedAt: string;
  readonly existing: readonly IdentityCommerceReference[];
}): IdentityCommerceReference {
  const commerceReference = createCommerceReference(input.commerceReference);
  if (!input.identityId.trim() || !input.assignedAt.trim()) {
    throw new TypeError('Identity and assignment timestamp are required.');
  }
  if (input.existing.some((item) => item.commerceReference === commerceReference)) {
    throw new Error('Commerce Reference is already reserved.');
  }
  if (input.existing.some((item) => item.identityId === input.identityId)) {
    throw new Error('Identity already has a Commerce Reference.');
  }
  return {
    commerceReference,
    identityId: input.identityId,
    assignedAt: input.assignedAt,
    lifecycle: 'ASSIGNED',
  };
}
