export type Actor =
  | {
      readonly kind: 'creator';
      readonly creatorId: string;
    }
  | {
      readonly kind: 'customer';
      readonly customerId: string;
    }
  | {
      readonly kind: 'platform';
    }
  | {
      readonly kind: 'pilot_operations';
      readonly operatorId: string;
    };

export function assertCreatorOwnership(
  actor: Actor,
  ownedCreatorId: string,
): asserts actor is Extract<Actor, { readonly kind: 'creator' }> {
  if (actor.kind !== 'creator' || actor.creatorId !== ownedCreatorId) {
    throw new Error('Actor is not the owning Creator');
  }
}

export function assertCustomerOwnership(
  actor: Actor,
  ownedCustomerId: string,
): asserts actor is Extract<Actor, { readonly kind: 'customer' }> {
  if (actor.kind !== 'customer' || actor.customerId !== ownedCustomerId) {
    throw new Error('Actor is not the owning Customer');
  }
}
