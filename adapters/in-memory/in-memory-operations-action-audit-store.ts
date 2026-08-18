import type {
  OperationsActionAuditRecord,
  OperationsActionAuditStore,
} from '../../applications/paid-commerce/commercial-pilot-operations.js';

export class InMemoryOperationsActionAuditStore implements OperationsActionAuditStore {
  private readonly records: OperationsActionAuditRecord[] = [];

  public append(record: OperationsActionAuditRecord): Promise<void> {
    this.records.push(structuredClone(record));
    return Promise.resolve();
  }

  public list(): Promise<readonly OperationsActionAuditRecord[]> {
    return Promise.resolve(structuredClone(this.records));
  }
}
