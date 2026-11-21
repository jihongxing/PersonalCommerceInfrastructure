/**
 * In-Memory Fulfillment Code Repository for Testing
 */

import { FulfillmentCode } from '../../modules/customer-request/fulfillment-code.js';
import type { IFulfillmentCodeRepository } from '../../applications/fulfillment/fulfillment-repositories.js';
import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryFulfillmentCodeRepository
  implements IFulfillmentCodeRepository, TransactionParticipant
{
  private codes: Map<string, FulfillmentCode> = new Map();

  save(fulfillmentCode: FulfillmentCode): Promise<void> {
    const record = fulfillmentCode.toRecord();
    this.codes.set(record.id, fulfillmentCode);
    return Promise.resolve();
  }

  findByCode(code: string): Promise<FulfillmentCode | null> {
    for (const fc of this.codes.values()) {
      if (fc.getCode() === code) {
        return Promise.resolve(fc);
      }
    }
    return Promise.resolve(null);
  }

  findByActionId(actionId: string): Promise<FulfillmentCode | null> {
    for (const fc of this.codes.values()) {
      const record = fc.toRecord();
      if (record.action_id === actionId) {
        return Promise.resolve(fc);
      }
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<FulfillmentCode | null> {
    return Promise.resolve(this.codes.get(id) ?? null);
  }

  markFulfilledIfPending(code: string): Promise<FulfillmentCode | null> {
    const current = [...this.codes.values()].find((entry) => entry.getCode() === code) ?? null;
    if (current === null || !current.isValid()) return Promise.resolve(null);
    const updated = current.markFulfilled();
    this.codes.set(updated.getId(), updated);
    return Promise.resolve(updated);
  }

  // Test helper
  clear(): void {
    this.codes.clear();
  }

  public createSnapshot(): unknown {
    return [...this.codes.values()].map((code) => code.toRecord());
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (!Array.isArray(snapshot)) {
      throw new TypeError('Fulfillment code repository snapshot must be an array.');
    }

    type FulfillmentCodeRecord = ReturnType<FulfillmentCode['toRecord']>;
    const records = snapshot as FulfillmentCodeRecord[];
    this.codes = new Map(
      records.map((record) => [
        record.id,
        FulfillmentCode.fromRecord({
          ...record,
          created_at: record.created_at,
          expires_at: record.expires_at,
          fulfilled_at: record.fulfilled_at,
        }),
      ]),
    );
  }
}
