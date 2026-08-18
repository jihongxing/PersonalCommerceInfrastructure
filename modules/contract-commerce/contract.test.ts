import { describe, expect, it } from 'vitest';

import {
  acceptContract,
  createContract,
  createContractScopeVersion,
  expireContract,
  formContract,
  proposeContract,
  rejectContract,
} from './contract.js';

const contract = createContract({
  id: 'contract-1',
  commerceActionId: 'action-1',
  creatorId: 'creator-1',
  buyerId: 'buyer-1',
  offeringId: 'offering-1',
  resultAccessToken: 'result-1',
});

const scope = {
  performanceType: 'Commercial dance performance',
  performanceDate: '2026-09-20T12:00:00.000Z',
  location: 'Shanghai venue',
  durationMinutes: 60,
  creatorHeadcount: 6,
  deliverables: 'One 60-minute live performance.',
  priceMinor: 39900n,
  currency: 'CNY' as const,
  cancellationTerms: 'Cancellation requires the approved refund policy.',
  fulfillmentCriteria: 'Performance Completed.',
};

describe('Contract Commerce Domain', () => {
  it('forms one Contract from an accepted immutable Scope Version', () => {
    const version = createContractScopeVersion({
      id: 'scope-1',
      contractId: contract.id,
      version: 1,
      scope,
      createdAt: '2026-08-17T10:00:00.000Z',
      createdBy: contract.creatorId,
    });
    const proposed = proposeContract(contract, {
      scopeVersionId: version.id,
      proposedAt: '2026-08-17T10:00:00.000Z',
      proposalExpiresAt: '2026-08-18T10:00:00.000Z',
    });
    const accepted = acceptContract(proposed, {
      acceptedAt: '2026-08-17T11:00:00.000Z',
      acceptedBy: contract.buyerId,
    });
    const formed = formContract(accepted, {
      contractedAt: '2026-08-17T11:00:00.000Z',
      orderId: 'order-1',
    });

    expect(formed).toMatchObject({
      state: 'contracted',
      currentScopeVersionId: version.id,
      orderId: 'order-1',
    });
    expect(formContract(formed, { contractedAt: formed.contractedAt!, orderId: 'order-1' })).toBe(
      formed,
    );
    expect(version.scope).toEqual(scope);
    expect(Object.isFrozen(version.scope)).toBe(true);
  });

  it('rejects or expires a Proposal and never accepts an expired Proposal', () => {
    const proposed = proposeContract(contract, {
      scopeVersionId: 'scope-1',
      proposedAt: '2026-08-17T10:00:00.000Z',
      proposalExpiresAt: '2026-08-18T10:00:00.000Z',
    });

    expect(rejectContract(proposed, '2026-08-17T12:00:00.000Z').state).toBe('rejected');
    const expired = expireContract(proposed, '2026-08-18T10:00:00.000Z');
    expect(expired.state).toBe('expired');
    expect(() =>
      acceptContract(expired, {
        acceptedAt: '2026-08-18T10:00:00.000Z',
        acceptedBy: contract.buyerId,
      }),
    ).toThrow();
  });
});
