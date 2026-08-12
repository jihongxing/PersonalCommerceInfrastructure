import type { CanonicalEvent } from '../../../modules/product-facts/canonical-events.js';

export interface ProductEventStore {
  append(event: CanonicalEvent): Promise<void>;
}
