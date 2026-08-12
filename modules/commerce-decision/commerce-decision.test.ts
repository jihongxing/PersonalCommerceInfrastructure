import { describe, expect, it } from 'vitest';

import type { CommerceAction } from '../customer-request/commerce-action.js';
import { DomainTransitionError } from '../shared/domain-error.js';
import { confirmCommerceAction, declineCommerceAction } from './commerce-decision.js';

function createAction(state: CommerceAction['state'] = 'submitted'): CommerceAction {
  return {
    id: 'action-1',
    customerId: 'customer-1',
    creatorId: 'creator-1',
    offeringId: 'offering-1',
    requestMessage: 'I would like a weekend lesson.',
    resultAccessToken: 'result-token-1',
    state,
  };
}

describe('CommerceDecision state machine', () => {
  it('confirms a submitted action by the owning creator', () => {
    expect(confirmCommerceAction(createAction(), 'creator-1').state).toBe('confirmed');
  });

  it('declines a submitted action by the owning creator', () => {
    expect(declineCommerceAction(createAction(), 'creator-1').state).toBe('declined');
  });

  it('rejects declined to confirmed', () => {
    expect(() => confirmCommerceAction(createAction('declined'), 'creator-1')).toThrow(
      DomainTransitionError,
    );
  });

  it('rejects a decision by a different creator', () => {
    expect(() => confirmCommerceAction(createAction(), 'creator-2')).toThrow('owning Creator');
  });
});
