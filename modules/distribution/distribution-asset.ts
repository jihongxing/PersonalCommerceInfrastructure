import { DomainTransitionError } from '../shared/domain-error.js';

export type DistributionAssetState = 'generated' | 'distributed';

export interface DistributionAsset {
  readonly offeringId: string;
  readonly publicUrl: string;
  readonly state: DistributionAssetState;
}

export function generateDistributionAsset(
  offeringId: string,
  publicUrl: string,
): DistributionAsset {
  if (offeringId.trim().length === 0) {
    throw new Error('Distribution Asset offering ID is required');
  }

  try {
    new URL(publicUrl);
  } catch (cause) {
    throw new Error('Distribution Asset public URL must be valid', { cause });
  }

  return {
    offeringId: offeringId.trim(),
    publicUrl,
    state: 'generated',
  };
}

export function recordExternalDistribution(asset: DistributionAsset): DistributionAsset {
  if (asset.state !== 'generated') {
    throw new DomainTransitionError('DistributionAsset', asset.state, 'recordExternalDistribution');
  }

  return { ...asset, state: 'distributed' };
}
