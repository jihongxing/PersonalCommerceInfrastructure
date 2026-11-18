import { and, desc, eq } from 'drizzle-orm';
import type {
  ScenarioKind,
  ScenarioOperationsStore,
  ScenarioRevision,
} from '../../../applications/operations-admin/scenario-operations.js';
import { operationsActionAudits } from '../../../database/schema/paid-commerce.js';
import type { ProductDatabase } from './postgres-database.js';

const targetType = 'commercial_scenario';
const action = 'change_scenario_intake';

function revisionId(scenario: ScenarioKind, revision: number): string {
  return `${targetType}:${scenario}:${String(revision).padStart(16, '0')}`;
}

export class PostgresScenarioOperationsStore implements ScenarioOperationsStore {
  public constructor(private readonly database: ProductDatabase) {}

  public async latest(scenario: ScenarioKind): Promise<ScenarioRevision | undefined> {
    const [record] = await this.database
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
      .limit(1);
    if (record === undefined) return undefined;
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
  }

  public async append(record: ScenarioRevision, previousOpen: boolean): Promise<boolean> {
    const inserted = await this.database
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
