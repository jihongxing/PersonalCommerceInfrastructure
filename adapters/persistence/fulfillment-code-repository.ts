/**
 * Fulfillment Code Repository
 * 
 * Persistence layer for fulfillment codes
 */

import { FulfillmentCode } from '../../domain/fulfillment-code.js';
import type { IFulfillmentCodeRepository } from '../../applications/fulfillment/fulfillment-repositories.js';

export interface IDatabaseClient {
  query(sql: string, params: unknown[]): Promise<{ rows: unknown[] }>;
}

export class PostgresFulfillmentCodeRepository implements IFulfillmentCodeRepository {
  constructor(private readonly db: IDatabaseClient) {}

  async save(fulfillmentCode: FulfillmentCode): Promise<void> {
    const record = fulfillmentCode.toRecord();

    const query = `
      INSERT INTO fulfillment_codes (id, code, action_id, status, created_at, expires_at, fulfilled_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = $4,
        fulfilled_at = $7,
        updated_at = NOW()
    `;

    await this.db.query(query, [
      record.id,
      record.code,
      record.action_id,
      record.status,
      record.created_at,
      record.expires_at,
      record.fulfilled_at,
    ]);
  }

  async findByCode(code: string): Promise<FulfillmentCode | null> {
    const query = `
      SELECT id, code, action_id, status, created_at, expires_at, fulfilled_at
      FROM fulfillment_codes
      WHERE code = $1
      LIMIT 1
    `;

    const result = await this.db.query(query, [code]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return FulfillmentCode.fromRecord(result.rows[0] as any);
  }

  async findByActionId(actionId: string): Promise<FulfillmentCode | null> {
    const query = `
      SELECT id, code, action_id, status, created_at, expires_at, fulfilled_at
      FROM fulfillment_codes
      WHERE action_id = $1
      LIMIT 1
    `;

    const result = await this.db.query(query, [actionId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return FulfillmentCode.fromRecord(result.rows[0] as any);
  }

  async findById(id: string): Promise<FulfillmentCode | null> {
    const query = `
      SELECT id, code, action_id, status, created_at, expires_at, fulfilled_at
      FROM fulfillment_codes
      WHERE id = $1
      LIMIT 1
    `;

    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return FulfillmentCode.fromRecord(result.rows[0] as any);
  }
}
