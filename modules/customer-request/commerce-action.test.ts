import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import {
  createCustomer,
  createDraftCommerceAction,
  submitCommerceAction,
  type CommerceAction,
} from './commerce-action.js';

function createAction(state: CommerceAction['state'] = 'draft'): CommerceAction {
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

describe('CommerceAction state machine', () => {
  it('creates the minimum Customer and draft Action details for a Request', () => {
    expect(
      createDraftCommerceAction(
        'action-1',
        createCustomer('customer-1', {
          contactName: 'Buyer One',
          contactMethod: 'buyer@example.test',
        }).id,
        'creator-1',
        'offering-1',
        'I would like a weekend lesson.',
        'result-token-1',
      ),
    ).toMatchObject({
      id: 'action-1',
      customerId: 'customer-1',
      requestMessage: 'I would like a weekend lesson.',
      state: 'draft',
    });
  });

  it('submits a draft action', () => {
    expect(submitCommerceAction(createAction()).state).toBe('submitted');
  });

  it('rejects confirmed to submitted', () => {
    expect(() => submitCommerceAction(createAction('confirmed'))).toThrow(DomainTransitionError);
  });
});
