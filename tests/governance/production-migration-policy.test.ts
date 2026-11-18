import { describe, expect, it } from 'vitest';
import {
  deploymentRoles,
  internalDatabasePassword,
  membershipMigrationIndex,
  phaseRanges,
  productionMigrations,
  productionPhaseRoles,
  verifyProductionHistory,
} from '../../scripts/database/production-migration-policy.js';

describe('production migration policy', () => {
  const migrations = productionMigrations();
  const history = migrations.map((migration) => ({
    hash: migration.hash,
    created_at: migration.folderMillis,
  }));

  it('accepts exactly the reviewed Journal order, including both historical timestamp inversions', () => {
    expect(history).toHaveLength(44);
    expect(history[24]!.created_at).toBeGreaterThan(history[25]!.created_at);
    expect(history[35]!.created_at).toBeGreaterThan(history[36]!.created_at);
    expect(() => verifyProductionHistory(history, migrations, 44)).not.toThrow();
    expect(() => verifyProductionHistory(history.slice(0, 40), migrations, 40)).not.toThrow();
    expect(() =>
      verifyProductionHistory(
        [...history].sort((left, right) => left.created_at - right.created_at),
        migrations,
        44,
      ),
    ).toThrow();
    expect(() => verifyProductionHistory(history.slice(1), migrations, 44)).toThrow();
  });

  it('binds the Operations chunks to the reviewed owners and isolates the Creator session table', () => {
    expect(productionPhaseRoles(36, migrations[36]!.sql.length)).toContain(
      deploymentRoles.legacyFixture,
    );
    expect(productionPhaseRoles(40, migrations[40]!.sql.length)).toContain(
      deploymentRoles.function,
    );
    expect(productionPhaseRoles(41, migrations[41]!.sql.length)).toEqual([
      deploymentRoles.legacyFixture,
      deploymentRoles.table,
      deploymentRoles.function,
      deploymentRoles.function,
      deploymentRoles.legacyFixture,
      deploymentRoles.table,
    ]);
    expect(new Set(productionPhaseRoles(42, migrations[42]!.sql.length))).toEqual(
      new Set([deploymentRoles.applicationOwner]),
    );
    expect(() => productionPhaseRoles(40, 1)).toThrow();
  });

  it('distinguishes phase boundaries from a missing or altered historical Journal entry', () => {
    const checkpoints = Object.values(phaseRanges).map(([, end]) => end);
    expect(checkpoints).toEqual([40, 41, 43]);
    expect(membershipMigrationIndex).toBe(43);
    for (const count of [0, ...checkpoints, 44]) {
      expect(() =>
        verifyProductionHistory(history.slice(0, count), migrations, count),
      ).not.toThrow();
    }
    const missing = history.filter((_, index) => index !== 36);
    expect(() => verifyProductionHistory(missing, migrations, missing.length)).toThrow('index 36');
    const wrongTimestamp = history.map((row, index) =>
      index === 25 ? { ...row, created_at: row.created_at + 1 } : row,
    );
    expect(() => verifyProductionHistory(wrongTimestamp, migrations, 44)).toThrow('index 25');
  });

  it('accepts only role-specific internal URLs, without logging supplied credentials', () => {
    const role = deploymentRoles.bff;
    const syntheticUrl = `postgresql://${role}:not%40a%2Fsecret@postgres:5432/personal_commerce`;
    expect(internalDatabasePassword(syntheticUrl, role)).toBe('not@a/secret');
    expect(() => internalDatabasePassword(syntheticUrl, deploymentRoles.api)).toThrow();
    expect(() =>
      internalDatabasePassword(syntheticUrl.replace('@postgres:', '@example.invalid:'), role),
    ).toThrow();
    expect(() => internalDatabasePassword(`${syntheticUrl}?options=test`, role)).toThrow();
    expect(() => internalDatabasePassword('synthetic malformed secret', role)).toThrow(
      'database URL is missing or invalid',
    );
  });
});
