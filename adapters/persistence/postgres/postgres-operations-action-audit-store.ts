import type {
  OperationsActionAuditRecord,
  OperationsActionAuditStore,
} from '../../../applications/paid-commerce/commercial-pilot-operations.js';
import { operationsActionAudits } from '../../../database/schema/paid-commerce.js';

import type { ProductDatabase } from './postgres-database.js';

export class PostgresOperationsActionAuditStore implements OperationsActionAuditStore {
  public constructor(private readonly database: ProductDatabase) {}

  public async append(record: OperationsActionAuditRecord): Promise<void> {
    await this.database.insert(operationsActionAudits).values({
      id: record.id,
      actorId: record.actorId,
      action: record.action,
      targetType: record.targetType,
      targetId: record.targetId,
      before: record.before,
      after: record.after,
      reason: record.reason,
      occurredAt: record.occurredAt,
      correlationId: record.correlationId,
    });
  }

  public async list(): Promise<readonly OperationsActionAuditRecord[]> {
    const rows = await this.database
      .select()
      .from(operationsActionAudits)
      .orderBy(operationsActionAudits.occurredAt, operationsActionAudits.id);
    return rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      action: row.action as OperationsActionAuditRecord['action'],
      targetType: row.targetType as OperationsActionAuditRecord['targetType'],
      targetId: row.targetId,
      before: row.before,
      after: row.after,
      reason: row.reason,
      occurredAt: row.occurredAt,
      correlationId: row.correlationId,
    }));
  }
}
