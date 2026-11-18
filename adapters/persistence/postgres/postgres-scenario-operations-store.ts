import { and, desc, eq, sql } from 'drizzle-orm';
import type {
  ScenarioKind,
  ScenarioOperationsStore,
  ScenarioRevision,
} from '../../../applications/operations-admin/scenario-operations.js';
import { operationsActionAudits } from '../../../database/schema/paid-commerce.js';
import type { ProductDatabase } from './postgres-database.js';
import { membershipIntakeLock } from './postgres-membership-store.js';

const targetType = 'commercial_scenario';
const action = 'change_scenario_intake';

function revisionId(scenario: ScenarioKind, revision: number): string {
  return `${targetType}:${scenario}:${String(revision).padStart(16, '0')}`;
}

export class PostgresScenarioOperationsStore implements ScenarioOperationsStore {
  public constructor(private readonly database: ProductDatabase) {}

  private async revisions(scenario: ScenarioKind, limit: number): Promise<ScenarioRevision[]> {
    const records = await this.database
      .select()
      .from(operationsActionAudits)
      .where(
        and(
          eq(operationsActionAudits.targetType, targetType),
          eq(operationsActionAudits.targetId, scenario),
          eq(operationsActionAudits.action, action),
        ),
      )
      .orderBy(desc(operationsActionAudits.id))
      .limit(limit);
    return records.map((record) => {
      const { open, revision } = record.after;
      if (
        typeof open !== 'boolean' ||
        typeof revision !== 'number' ||
        !Number.isSafeInteger(revision) ||
        revision < 1 ||
        record.id !== revisionId(scenario, revision)
      )
        throw new Error('Invalid persisted scenario revision');
      return {
        scenario,
        open,
        revision,
        reason: record.reason,
        actorId: record.actorId,
        occurredAt: new Date(record.occurredAt).toISOString(),
        correlationId: record.correlationId,
      };
    });
  }

  public async latest(scenario: ScenarioKind): Promise<ScenarioRevision | undefined> {
    return (await this.revisions(scenario, 1))[0];
  }

  public history(scenario: ScenarioKind): Promise<ScenarioRevision[]> {
    return this.revisions(scenario, 100);
  }

  public async append(record: ScenarioRevision, previousOpen: boolean): Promise<boolean> {
    if (record.scenario === 'Membership') {
      return this.database.transaction(async (transaction) => {
        await transaction.execute(
          sql`SELECT pg_advisory_xact_lock(${membershipIntakeLock}::bigint)`,
        );
        return this.insert(transaction, record, previousOpen);
      });
    }
    return this.insert(this.database, record, previousOpen);
  }

  private async insert(
    database: Pick<ProductDatabase, 'insert'>,
    record: ScenarioRevision,
    previousOpen: boolean,
  ): Promise<boolean> {
    const inserted = await database
      .insert(operationsActionAudits)
      .values({
        id: revisionId(record.scenario, record.revision),
        actorId: record.actorId,
        action,
        targetType,
        targetId: record.scenario,
        before: { open: previousOpen, revision: record.revision - 1 },
        after: { open: record.open, revision: record.revision },
        reason: record.reason,
        occurredAt: record.occurredAt,
        correlationId: record.correlationId,
      })
      .onConflictDoNothing({ target: operationsActionAudits.id })
      .returning({ id: operationsActionAudits.id });
    return inserted.length === 1;
  }
}
