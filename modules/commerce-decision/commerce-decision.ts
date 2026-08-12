import type { CommerceAction } from '../customer-request/commerce-action.js';
import { assertCreatorOwnership } from '../shared/actors.js';
import { DomainTransitionError } from '../shared/domain-error.js';

export function confirmCommerceAction(
  action: CommerceAction,
  actorCreatorId: string,
): CommerceAction {
  assertCreatorOwnership({ kind: 'creator', creatorId: actorCreatorId }, action.creatorId);

  if (action.state !== 'submitted') {
    throw new DomainTransitionError('CommerceAction', action.state, 'confirm');
  }

  return { ...action, state: 'confirmed' };
}

export function declineCommerceAction(
  action: CommerceAction,
  actorCreatorId: string,
): CommerceAction {
  assertCreatorOwnership({ kind: 'creator', creatorId: actorCreatorId }, action.creatorId);

  if (action.state !== 'submitted') {
    throw new DomainTransitionError('CommerceAction', action.state, 'decline');
  }

  return { ...action, state: 'declined' };
}
