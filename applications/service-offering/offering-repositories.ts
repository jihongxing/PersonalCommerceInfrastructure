import type { EntityCollectionRepository } from '../core/ports/entity-repository.js';
import type { Offering } from '../../modules/service-offering/offering.js';

export type OfferingRepository = EntityCollectionRepository<Offering>;
