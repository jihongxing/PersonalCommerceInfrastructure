import type {
  ProviderCapabilityRecord,
  ProviderCapabilityRegistry,
} from '../../applications/paid-commerce/provider-ports.js';

export class InMemoryProviderCapabilityRegistry implements ProviderCapabilityRegistry {
  private readonly records = new Map<string, ProviderCapabilityRecord>();

  public register(record: ProviderCapabilityRecord): Promise<void> {
    this.records.set(record.providerId, cloneRecord(record));
    return Promise.resolve();
  }

  public findByProviderId(providerId: string): Promise<ProviderCapabilityRecord | undefined> {
    const record = this.records.get(providerId);
    return Promise.resolve(record === undefined ? undefined : cloneRecord(record));
  }

  public list(): Promise<readonly ProviderCapabilityRecord[]> {
    return Promise.resolve(
      [...this.records.values()]
        .map(cloneRecord)
        .sort((left, right) => left.providerId.localeCompare(right.providerId)),
    );
  }
}

function cloneRecord(record: ProviderCapabilityRecord): ProviderCapabilityRecord {
  return Object.freeze({
    ...record,
    constraints: Object.freeze([...record.constraints]),
  });
}
