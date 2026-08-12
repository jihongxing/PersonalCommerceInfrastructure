import type { EntityCollectionRepository } from '../core/ports/entity-repository.js';
import type {
  Capability,
  CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';

export type CommerceIdentityRepository = EntityCollectionRepository<CommerceIdentity>;

export type CapabilityRepository = EntityCollectionRepository<Capability>;
