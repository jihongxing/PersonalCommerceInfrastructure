import { describe, expect, it } from 'vitest';

import { DomainTransitionError } from '../shared/domain-error.js';
import { recordExternalDistribution, type DistributionAsset } from './distribution-asset.js';

describe('DistributionAsset state machine', () => {
  it('records actual external distribution', () => {
    const asset: DistributionAsset = {
      offeringId: 'offering-1',
      publicUrl: 'https://example.test/creator/offering',
      state: 'generated',
    };

    expect(recordExternalDistribution(asset).state).toBe('distributed');
  });

  it('rejects recording the same distribution twice', () => {
    const asset: DistributionAsset = {
      offeringId: 'offering-1',
      publicUrl: 'https://example.test/creator/offering',
      state: 'distributed',
    };

    expect(() => recordExternalDistribution(asset)).toThrow(DomainTransitionError);
  });
});
