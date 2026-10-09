import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { InMemoryLegacySubjectMappingRepository } from '../../adapters/in-memory/in-memory-legacy-subject-mapping-repository.js';
import { legacySubjectMappings } from '../../database/schema/legacy-subject-mapping.js';
import { createLegacySubjectMapping } from '../../modules/legacy-subject-mapping/legacy-subject-mapping.js';

const mapping = createLegacySubjectMapping({
  mappingId: 'mapping-1',
  legacySubjectReference: 'creator-1',
  identityId: 'identity-1',
  initialCommerceProfileId: 'profile-1',
  createdAt: '2026-08-26T00:00:00.000Z',
});

describe('Legacy Subject Mapping persistence contract', () => {
  it('defines an independent mapping table with new-model foreign keys', () => {
    const config = getTableConfig(legacySubjectMappings);

    expect(config.name).toBe('legacy_subject_mappings');
    expect(config.columns.map((column) => column.name)).toEqual([
      'mapping_id',
      'legacy_subject_reference',
      'identity_id',
      'initial_commerce_profile_id',
      'state',
      'created_at',
      'updated_at',
      'verified_at',
      'mapping_failure_code',
    ]);
  });

  it('creates and reads effective mappings by each stable reference', async () => {
    const repository = new InMemoryLegacySubjectMappingRepository();
    await expect(repository.create(mapping)).resolves.toEqual(mapping);
    await expect(repository.findByLegacySubject('creator-1')).resolves.toEqual(mapping);
    await expect(repository.findByIdentity('identity-1')).resolves.toEqual([mapping]);
    await expect(repository.findByInitialCommerceProfile('profile-1')).resolves.toEqual([mapping]);
  });

  it('makes identical creation idempotent and rejects a different target', async () => {
    const repository = new InMemoryLegacySubjectMappingRepository();
    await repository.create(mapping);

    await expect(repository.create({ ...mapping, mappingId: 'mapping-retry' })).resolves.toEqual(
      mapping,
    );
    await expect(repository.create({ ...mapping, identityId: 'identity-2' })).rejects.toThrow(
      'conflicts with the requested target',
    );
  });

  it('keeps historical rows while effective lookup fails closed', async () => {
    const repository = new InMemoryLegacySubjectMappingRepository();
    await repository.create(mapping);
    await repository.updateState('mapping-1', 'AMBIGUOUS', '2026-08-26T01:00:00.000Z', {
      mappingFailureCode: 'MANUAL_REVIEW_REQUIRED',
    });

    await expect(repository.findByLegacySubject('creator-1')).resolves.toBeUndefined();
    await expect(repository.findHistoricalByLegacySubject('creator-1')).resolves.toMatchObject({
      state: 'AMBIGUOUS',
      legacySubjectReference: 'creator-1',
    });
  });

  it('preserves mappings when identity or profile lifecycle is archived', async () => {
    const repository = new InMemoryLegacySubjectMappingRepository();
    await repository.create(mapping);

    await expect(repository.findByIdentity('identity-1')).resolves.toHaveLength(1);
    await expect(repository.findByInitialCommerceProfile('profile-1')).resolves.toHaveLength(1);
  });

  it('does not alter legacy commerce schema or records', async () => {
    const migration = await readFile(
      resolve('database/migrations/0019_stage2_legacy_subject_mapping.sql'),
      'utf8',
    );

    expect(migration).toContain('FOREIGN KEY ("identity_id") REFERENCES "public"."identities"');
    expect(migration).toContain(
      'FOREIGN KEY ("initial_commerce_profile_id") REFERENCES "public"."commerce_profiles"',
    );
    expect(migration).not.toContain('commerce_identities');
    expect(migration).not.toContain('creator_id');
  });
});
