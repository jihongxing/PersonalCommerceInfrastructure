import { randomUUID } from 'node:crypto';

import { createExternalPlatformAccountId } from '../../modules/identity-infrastructure/external-platform-contract.js';
import type { ExternalPlatformAccountIdGenerator } from './external-platform-account-service.js';

export class UuidExternalPlatformAccountIdGenerator implements ExternalPlatformAccountIdGenerator {
  public generate() {
    return createExternalPlatformAccountId(`external_platform_account_${randomUUID()}`);
  }
}
