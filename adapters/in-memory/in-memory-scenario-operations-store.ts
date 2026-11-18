import type {
  ScenarioKind,
  ScenarioOperationsStore,
  ScenarioRevision,
} from '../../applications/operations-admin/scenario-operations.js';

export class InMemoryScenarioOperationsStore implements ScenarioOperationsStore {
  private readonly revisions = new Map<ScenarioKind, ScenarioRevision>();

  public latest(scenario: ScenarioKind): Promise<ScenarioRevision | undefined> {
    return Promise.resolve(this.revisions.get(scenario));
  }

  public append(record: ScenarioRevision): Promise<boolean> {
    if ((this.revisions.get(record.scenario)?.revision ?? 0) + 1 !== record.revision) {
      return Promise.resolve(false);
    }
    this.revisions.set(record.scenario, record);
    return Promise.resolve(true);
  }
}
