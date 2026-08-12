import { randomUUID } from 'node:crypto';

import type { IdGenerator } from '../../applications/core/ports/id-generator.js';

export class UuidIdGenerator implements IdGenerator {
  public generate(): string {
    return randomUUID();
  }
}
