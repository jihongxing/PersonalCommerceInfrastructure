import { randomUUID } from 'node:crypto';

import { createInternalIdentityId } from '../../modules/identity-infrastructure/identity-contract.js';
import type { InternalIdentityIdGenerator } from './internal-identity-service.js';

export class UuidInternalIdentityIdGenerator implements InternalIdentityIdGenerator {
  public generate() {
    return createInternalIdentityId(`identity_${randomUUID()}`);
  }
}
