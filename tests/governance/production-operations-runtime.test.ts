import { describe, expect, it } from 'vitest';
import { productionOperationsDatabaseUrl } from '../../adapters/persistence/postgres/production-operations-runtime.js';

describe('production Operations runtime configuration', () => {
  const operationsUrl =
    'postgresql://pci_ops_runtime:fixture%40password@postgres:5432/personal_commerce';

  it('is disabled unless explicitly enabled and never falls back to DATABASE_URL', () => {
    expect(
      productionOperationsDatabaseUrl({ OPERATIONS_DATABASE_URL: operationsUrl }),
    ).toBeUndefined();
    expect(productionOperationsDatabaseUrl({ OPERATIONS_HUMAN_ENABLED: 'false' })).toBeUndefined();
    expect(() => productionOperationsDatabaseUrl({ OPERATIONS_HUMAN_ENABLED: 'yes' })).toThrow();
    expect(() =>
      productionOperationsDatabaseUrl({
        OPERATIONS_HUMAN_ENABLED: 'true',
        DATABASE_URL: operationsUrl,
      }),
    ).toThrow();
  });

  it('only accepts the dedicated Compose login and never includes the supplied URL in errors', () => {
    expect(
      productionOperationsDatabaseUrl({
        OPERATIONS_HUMAN_ENABLED: 'true',
        OPERATIONS_DATABASE_URL: operationsUrl,
      }),
    ).toBe(operationsUrl);
    for (const invalid of [
      operationsUrl.replace('pci_ops_runtime', 'pci_api_runtime'),
      operationsUrl.replace('pci_ops_runtime', 'pci_ops_migration'),
      operationsUrl.replace('@postgres', '@other'),
      operationsUrl + '?options=-csearch_path=public',
      operationsUrl.replace('fixture%40password', '%invalid'),
    ]) {
      expect(() =>
        productionOperationsDatabaseUrl({
          OPERATIONS_HUMAN_ENABLED: 'true',
          OPERATIONS_DATABASE_URL: invalid,
        }),
      ).toThrow(/^OPERATIONS_DATABASE_URL [^.]+\.$/u);
    }
  });
});
