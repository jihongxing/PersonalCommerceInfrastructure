import type { EntityCollectionRepository } from '../core/ports/entity-repository.js';
import type {
  Capability,
  CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';

export type CommerceIdentityRepository = EntityCollectionRepository<CommerceIdentity>;

export type CapabilityRepository = EntityCollectionRepository<Capability>;

export interface CapabilityManagementRepository {
  updateOwned(
    creatorId: string,
    capabilityId: string,
    input: {
      readonly name: string;
      readonly description: string;
      readonly catalogItemId?: string;
      readonly catalogStatus?: Capability['catalogStatus'];
      readonly policyVersion?: string;
    },
  ): Promise<Capability | undefined>;
  deleteOwnedIfUnused(
    creatorId: string,
    capabilityId: string,
  ): Promise<'deleted' | 'not_found' | 'in_use'>;
}
