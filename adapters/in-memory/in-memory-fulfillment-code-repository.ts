/**
 * In-Memory Fulfillment Code Repository for Testing
 */

import { FulfillmentCode } from '../../domain/fulfillment-code.js';
import type { IFulfillmentCodeRepository } from '../../applications/fulfillment/fulfillment-repositories.js';

export class InMemoryFulfillmentCodeRepository implements IFulfillmentCodeRepository {
  private codes: Map<string, FulfillmentCode> = new Map();

  async save(fulfillmentCode: FulfillmentCode): Promise<void> {
    const record = fulfillmentCode.toRecord();
    this.codes.set(record.id, fulfillmentCode);
  }

  async findByCode(code: string): Promise<FulfillmentCode | null> {
    for (const fc of this.codes.values()) {
      if (fc.getCode() === code) {
        return fc;
      }
    }
    return null;
  }

  async findByActionId(actionId: string): Promise<FulfillmentCode | null> {
    for (const fc of this.codes.values()) {
      const record = fc.toRecord();
      if (record.action_id === actionId) {
        return fc;
      }
    }
    return null;
  }

  async findById(id: string): Promise<FulfillmentCode | null> {
    return this.codes.get(id) ?? null;
  }

  // Test helper
  clear(): void {
    this.codes.clear();
  }
}
