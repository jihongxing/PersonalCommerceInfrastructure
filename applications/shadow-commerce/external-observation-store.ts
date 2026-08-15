import type {
  CanonicalEvent,
  CanonicalEventName,
} from '../../modules/product-facts/canonical-events.js';

export interface ExternalObservationStore {
  findByNameAndObjectId(
    name: CanonicalEventName,
    objectId: string,
  ): Promise<CanonicalEvent | undefined>;
}
