/**
 * PostgreSQL Fulfillment Code Repository Implementation
 */

import { sql } from 'drizzle-orm';
import { FulfillmentCode } from '../../../domain/fulfillment-code.js';
import type { IFulfillmentCodeRepository } from '../../../applications/fulfillment/fulfillment-repositories.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresFulfillmentCodeRepository implements IFulfillmentCodeRepository {
  constructor(private readonly db: ProductDatabase) {}

  async save(fulfillmentCode: FulfillmentCode): Promise<void> {
    const record = fulfillmentCode.toRecord();

    await this.db.execute(sql`
      INSERT INTO fulfillment_codes (id, code, action_id, status, created_at, expires_at, fulfilled_at, updated_at)
      VALUES (${record.id}, ${record.code}, ${record.action_id}, ${record.status}, ${record.created_at.toISOString()}, ${record.expires_at.toISOString()}, ${record.fulfilled_at?.toISOString() ?? null}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = ${record.status},
        fulfilled_at = ${record.fulfilled_at?.toISOString() ?? null},
        updated_at = NOW()
    `);
  }

  async findByCode(code: string): Promise<FulfillmentCode | null> {
    const result = await this.db.execute<{
      id: string;
      code: string;
      action_id: string;
      status: string;
      created_at: string;
      expires_at: string;
      fulfilled_at: string | null;
    }>(sql`
      SELECT id, code, action_id, status, created_at, expires_at, fulfilled_at
      FROM fulfillment_codes
      WHERE code = ${code}
      LIMIT 1
    `);
    
    if (result.length === 0) {
      return null;
    }

    return FulfillmentCode.fromRecord(result[0] as any);
  }

  async findByActionId(actionId: string): Promise<FulfillmentCode | null> {
    const result = await this.db.execute<{
      id: string;
      code: string;
      action_id: string;
      status: string;
      created_at: string;
      expires_at: string;
      fulfilled_at: string | null;
    }>(sql`
      SELECT id, code, action_id, status, created_at, expires_at, fulfilled_at
      FROM fulfillment_codes
      WHERE action_id = ${actionId}
      LIMIT 1
    `);
    
    if (result.length === 0) {
      return null;
    }

    return FulfillmentCode.fromRecord(result[0] as any);
  }

  async findById(id: string): Promise<FulfillmentCode | null> {
    const result = await this.db.execute<{
      id: string;
      code: string;
      action_id: string;
      status: string;
      created_at: string;
      expires_at: string;
      fulfilled_at: string | null;
    }>(sql`
      SELECT id, code, action_id, status, created_at, expires_at, fulfilled_at
      FROM fulfillment_codes
      WHERE id = ${id}
      LIMIT 1
    `);
    
    if (result.length === 0) {
      return null;
    }

    return FulfillmentCode.fromRecord(result[0] as any);
  }
}
