import { describe, expect, it } from 'vitest';

import { loadIntegrationEnvironmentConfiguration } from '../../scripts/database/check-integration-environment.js';

describe('PostgreSQL integration environment preflight configuration', () => {
  it('fails closed when DATABASE_URL is absent', () => {
    expect(() => loadIntegrationEnvironmentConfiguration({})).toThrow(
      'DATABASE_URL is required for PostgreSQL integration preflight.',
    );
  });

  it('requires an explicit integration database marker', () => {
    expect(() =>
      loadIntegrationEnvironmentConfiguration({
        DATABASE_URL: 'postgresql://127.0.0.1:5432/pci_integration',
      }),
    ).toThrow('PCI_INTEGRATION_DATABASE=1 is required for PostgreSQL integration preflight.');
  });

  it('rejects a database name that does not identify a dedicated integration database', () => {
    expect(() =>
      loadIntegrationEnvironmentConfiguration({
        DATABASE_URL: 'postgresql://127.0.0.1:5432/personal_commerce',
        PCI_INTEGRATION_DATABASE: '1',
      }),
    ).toThrow(
      'DATABASE_URL must target a dedicated non-production database whose name includes "integration".',
    );
  });

  it('accepts a PostgreSQL URL for an explicitly marked integration database', () => {
    expect(
      loadIntegrationEnvironmentConfiguration({
        DATABASE_URL: 'postgresql://127.0.0.1:5432/pci_integration',
        PCI_INTEGRATION_DATABASE: '1',
      }),
    ).toEqual({
      databaseUrl: 'postgresql://127.0.0.1:5432/pci_integration',
      databaseName: 'pci_integration',
    });
  });

  it('rejects a non-PostgreSQL connection URL', () => {
    expect(() =>
      loadIntegrationEnvironmentConfiguration({
        DATABASE_URL: 'mysql://127.0.0.1:3306/pci_integration',
        PCI_INTEGRATION_DATABASE: '1',
      }),
    ).toThrow('DATABASE_URL must use the PostgreSQL protocol.');
  });
});
