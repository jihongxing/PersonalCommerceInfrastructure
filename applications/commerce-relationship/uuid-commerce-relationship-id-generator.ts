import { randomUUID } from 'node:crypto';

import { createCommerceRelationshipId } from '../../modules/identity-infrastructure/external-platform-contract.js';
import type { CommerceRelationshipIdGenerator } from './commerce-relationship-service.js';

export class UuidCommerceRelationshipIdGenerator implements CommerceRelationshipIdGenerator {
  public generate() {
    return createCommerceRelationshipId(`relationship_${randomUUID()}`);
  }
}
