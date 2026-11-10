import type { EntityRepository } from '../core/ports/entity-repository.js';
import type { DistributionAsset } from '../../modules/distribution/distribution-asset.js';

export interface DistributionAssetRepository extends EntityRepository<DistributionAsset> {
  // Transactional repositories lock the row until the enclosing unit of work completes.
  findByIdForUpdate?(id: string): Promise<DistributionAsset | undefined>;
}
