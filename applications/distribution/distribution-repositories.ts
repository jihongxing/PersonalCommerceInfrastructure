import type { EntityRepository } from '../core/ports/entity-repository.js';
import type { DistributionAsset } from '../../modules/distribution/distribution-asset.js';

export type DistributionAssetRepository = EntityRepository<DistributionAsset>;
