import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  deploymentRoles,
  internalDatabasePassword,
  membershipMigrationIndex,
  phaseRanges,
  previousFinalMigrationCount,
  productionMigrations,
  productionPhaseRoles,
  supportsReadyMigrationCount,
  verifyProductionHistory,
} from '../../scripts/database/production-migration-policy.js';

describe('production migration policy', () => {
  const fixtures: string[] = [];
  const journal = JSON.parse(readFileSync('database/migrations/meta/_journal.json', 'utf8')) as {
    entries: { idx: number; tag: string; when: number }[];
  };
  function fixture() {
    const folder = mkdtempSync(join(tmpdir(), 'pci-production-migrations-'));
    fixtures.push(folder);
    cpSync('database/migrations', folder, { recursive: true });
    return folder;
  }
  afterEach(() => {
    for (const folder of fixtures.splice(0)) rmSync(folder, { recursive: true });
  });
  const migrations = productionMigrations();
  const history = migrations.map((migration) => ({
    hash: migration.hash,
    created_at: migration.folderMillis,
  }));

  it('normalizes only CRLF/LF and retains the exact approved historical Journal hashes', () => {
    const folder = fixture();
    for (const format of ['lf', 'crlf', 'mixed']) {
      for (const entry of journal.entries) {
        const sql = readFileSync(`database/migrations/${entry.tag}.sql`, 'utf8').replaceAll(
          '\r\n',
          '\n',
        );
        const formatted = sql.replaceAll('\n', (_, offset: number) =>
          format === 'crlf' || (format === 'mixed' && offset % 2 === 0) ? '\r\n' : '\n',
        );
        writeFileSync(join(folder, `${entry.tag}.sql`), formatted);
      }
      expect(productionMigrations(folder)).toEqual(migrations);
    }
    expect(migrations[0]!.hash).toBe(
      '226505224d5ae075d980eb1eef9e17ea62127afdcc3c44e3c25c2b024c0d0f36',
    );
    expect(migrations[41]!.hash).toBe(
      'a4f9445de19f685e0386826a565ba2c4d469818507d0f1686675a5a395ff3aec',
    );
    const identity = (count: number) =>
      journal.entries
        .slice(0, count)
        .map((entry, index) => `${entry.idx}:${entry.tag}:${entry.when}:${migrations[index]!.hash}`)
        .join('\n');
    expect(createHash('sha256').update(identity(43)).digest('hex')).toBe(
      '0d00481825e4bb5e731826eb6d4689b8a668d8ac12f9a88f4fa8150a34301d50',
    );
    expect(createHash('sha256').update(identity(44)).digest('hex')).toBe(
      '3a0ddca1b9a8000ecfb4c05f56d8abd9ba4e483d0a5d3a4ae3b264083d91bafb',
    );
    expect(createHash('sha256').update(identity(45)).digest('hex')).toBe(
      '308cb862603fe5b7e890fa601508f697b1a18a7b60631bc0dac9d922233720d1',
    );
    expect(migrations[45]!.hash).toMatch(/^[0-9a-f]{64}$/u);
    expect(migrations.every((migration) => migration.sql.every((sql) => !sql.includes('\r')))).toBe(
      true,
    );
  });

  it('rejects an unreviewed SQL change in every migration before returning executable SQL', () => {
    const folder = fixture();
    for (const entry of journal.entries) {
      const path = join(folder, `${entry.tag}.sql`);
      const original = readFileSync(path);
      writeFileSync(path, `${original.toString()}\nSELECT 'unreviewed';`);
      expect(() => productionMigrations(folder)).toThrow(
        'unreviewed production migration manifest',
      );
      writeFileSync(path, original);
    }
  });

  it('does not normalize bare CR, BOM, whitespace, encoding or final-newline changes', () => {
    const folder = fixture();
    const path = join(folder, `${journal.entries[0]!.tag}.sql`);
    const original = readFileSync(path);
    for (const changed of [
      Buffer.from(original.toString().replace(/\r?\n/, '\r')),
      Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), original]),
      Buffer.concat([original, Buffer.from(' ')]),
      Buffer.concat([original, Buffer.from([0xff])]),
      Buffer.concat([original, Buffer.from('\n')]),
    ]) {
      writeFileSync(path, changed);
      expect(() => productionMigrations(folder)).toThrow();
    }
  });

  it('still pins every Journal identity field, order and migration count', () => {
    const folder = fixture();
    const path = join(folder, 'meta/_journal.json');
    const original = readFileSync(path, 'utf8');
    for (const change of [
      (copy: typeof journal) => (copy.entries[0]!.idx = 1),
      (copy: typeof journal) => (copy.entries[0]!.when += 1),
      (copy: typeof journal) => copy.entries.reverse(),
      (copy: typeof journal) => copy.entries.pop(),
      (copy: typeof journal) => (copy.entries[0]!.tag = copy.entries[1]!.tag),
    ]) {
      const copy = JSON.parse(original) as typeof journal;
      change(copy);
      writeFileSync(path, JSON.stringify(copy));
      expect(() => productionMigrations(folder)).toThrow();
    }
  });

  it('does not accept a new checkout hash in place of an existing historical Journal hash', () => {
    const changed = history.map((row, index) =>
      index === 0
        ? {
            ...row,
            hash: createHash('sha256')
              .update(migrations[0]!.sql.join('--> statement-breakpoint'))
              .digest('hex'),
          }
        : row,
    );
    expect(() => verifyProductionHistory(history.slice(0, 43), migrations, 43)).not.toThrow();
    expect(() => verifyProductionHistory(changed, migrations, 46)).toThrow('index 0');
  });

  it('accepts exactly the reviewed Journal order, including both historical timestamp inversions', () => {
    expect(history).toHaveLength(46);
    expect(history[24]!.created_at).toBeGreaterThan(history[25]!.created_at);
    expect(history[35]!.created_at).toBeGreaterThan(history[36]!.created_at);
    expect(() => verifyProductionHistory(history, migrations, 46)).not.toThrow();
    expect(() => verifyProductionHistory(history.slice(0, 45), migrations, 45)).not.toThrow();
    expect(() => verifyProductionHistory(history.slice(0, 40), migrations, 40)).not.toThrow();
    expect(() =>
      verifyProductionHistory(
        [...history].sort((left, right) => left.created_at - right.created_at),
        migrations,
        46,
      ),
    ).toThrow();
    expect(() => verifyProductionHistory(history.slice(1), migrations, 45)).toThrow();
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
    expect(checkpoints).toEqual([40, 41, 46]);
    expect(membershipMigrationIndex).toBe(43);
    for (const count of [0, ...checkpoints, 44, 45]) {
      expect(() =>
        verifyProductionHistory(history.slice(0, count), migrations, count),
      ).not.toThrow();
    }
    const missing = history.filter((_, index) => index !== 36);
    expect(() => verifyProductionHistory(missing, migrations, missing.length)).toThrow('index 36');
    const wrongTimestamp = history.map((row, index) =>
      index === 25 ? { ...row, created_at: row.created_at + 1 } : row,
    );
    expect(() => verifyProductionHistory(wrongTimestamp, migrations, 46)).toThrow('index 25');
  });

  it('accepts the reviewed 43-row checkpoint and historical 44/45-row ready baselines', () => {
    expect(previousFinalMigrationCount).toBe(45);
    expect(supportsReadyMigrationCount(43, 46)).toBe(true);
    expect(supportsReadyMigrationCount(44, 46)).toBe(true);
    expect(supportsReadyMigrationCount(45, 46)).toBe(true);
    expect(supportsReadyMigrationCount(46, 46)).toBe(true);
    expect(supportsReadyMigrationCount(42, 46)).toBe(false);
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
