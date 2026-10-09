import { randomUUID } from 'node:crypto';

import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';
import type { CommerceProfileIdGenerator } from './canonical-commerce-profile-service.js';

export class UuidCommerceProfileIdGenerator implements CommerceProfileIdGenerator {
  public generate() {
    return createCommerceProfileId(`profile_${randomUUID()}`);
  }
}
