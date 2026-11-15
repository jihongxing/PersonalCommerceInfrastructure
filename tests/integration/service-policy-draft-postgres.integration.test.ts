import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPostgresCreatorIdentityComposition } from '../../adapters/persistence/postgres/postgres-creator-identity-composition.js';

describe.skipIf(!process.env.CATALOG_TEST_DATABASE_URL)(
  'controlled Catalog drafts with PostgreSQL',
  () => {
    const context = { actorId: 'principal-draft-pg', correlationId: 'catalog-draft-pg' };
    let composition: ReturnType<typeof createPostgresCreatorIdentityComposition>;

    beforeAll(() => {
      composition = createPostgresCreatorIdentityComposition(
        { databaseUrl: process.env.CATALOG_TEST_DATABASE_URL! },
        { localAuthSecret: 'catalog-draft-test-secret-at-least-32-bytes' },
        'http://localhost:3000',
        { deliver: async () => {} },
        { operationsAccessToken: 'unused', operationsOperatorId: 'unused' },
      );
    });

    afterAll(async () => {
      await composition.database.client.unsafe(
        `delete from service_policy_audits where policy_version like 'draft-%'`,
      );
      await composition.database.client.unsafe(
        `delete from service_policy_capabilities where policy_version like 'draft-%'`,
      );
      await composition.database.client.unsafe(
        `delete from service_policy_templates where policy_version like 'draft-%'`,
      );
      await composition.database.client.unsafe(
        `delete from service_policy_releases where policy_version like 'draft-%'`,
      );
      await composition.database.client.unsafe(
        `update service_policy_releases set status = case when policy_version = 'v1' then 'published' else 'archived' end where policy_version = 'v1'`,
      );
      await composition.database.close();
    });

    it('isolates a draft, enforces revision checks, previews changes, and atomically activates', async () => {
      const repository = composition.servicePolicyCatalogRepository;
      const active = await repository.getSnapshot();
      const draft = await repository.createDraft('PostgreSQL draft', context);
      const updated = await repository.updateDraftItem(
        draft.policyVersion,
        'capability',
        draft.capabilities[0]!.id,
        { riskTier: 'review', expectedRevision: draft.revision, reason: 'PostgreSQL edit' },
        context,
      );
      expect((await repository.getSnapshot()).policyVersion).toBe(active.policyVersion);
      expect((await repository.previewDraft(draft.policyVersion, context)).changes).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'riskTier' })]),
      );
      await expect(
        repository.activateDraft(
          draft.policyVersion,
          { expectedRevision: draft.revision, reason: 'Stale activation' },
          context,
        ),
      ).rejects.toMatchObject({ code: 'service_policy_draft_stale_revision' });
      await repository.activateDraft(
        draft.policyVersion,
        { expectedRevision: updated.revision, reason: 'PostgreSQL activation' },
        context,
      );
      expect((await repository.getSnapshot()).policyVersion).toBe(draft.policyVersion);
    });

    it('serializes concurrent draft updates and policy activation', async () => {
      const repository = composition.servicePolicyCatalogRepository;
      const draft = await repository.createDraft('PostgreSQL concurrency', context);
      const itemId = draft.capabilities[0]!.id;
      const updateResults = await Promise.allSettled([
        repository.updateDraftItem(
          draft.policyVersion,
          'capability',
          itemId,
          { riskTier: 'review', expectedRevision: draft.revision, reason: 'Concurrent edit A' },
          context,
        ),
        repository.updateDraftItem(
          draft.policyVersion,
          'capability',
          itemId,
          { riskTier: 'low', expectedRevision: draft.revision, reason: 'Concurrent edit B' },
          context,
        ),
      ]);
      expect(updateResults.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(updateResults.filter((result) => result.status === 'rejected')).toHaveLength(1);

      const updated = await repository.getDraft(draft.policyVersion);
      const activationResults = await Promise.allSettled([
        repository.activateDraft(
          draft.policyVersion,
          { expectedRevision: updated.revision, reason: 'Concurrent activation A' },
          context,
        ),
        repository.activateDraft(
          draft.policyVersion,
          { expectedRevision: updated.revision, reason: 'Concurrent activation B' },
          context,
        ),
      ]);
      expect(activationResults.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(activationResults.filter((result) => result.status === 'rejected')).toHaveLength(1);
      const published = await composition.database.client<{ count: string }[]>`
        select count(*)::text as count from service_policy_releases where status = 'published'
      `;
      expect(published[0]?.count).toBe('1');

      const raceDraft = await repository.createDraft('PostgreSQL update activation race', context);
      const raceResults = await Promise.allSettled([
        repository.updateDraftItem(
          raceDraft.policyVersion,
          'template',
          raceDraft.templates[0]!.id,
          {
            status: 'paused',
            expectedRevision: raceDraft.revision,
            reason: 'Race edit',
          },
          context,
        ),
        repository.activateDraft(
          raceDraft.policyVersion,
          { expectedRevision: raceDraft.revision, reason: 'Race activation' },
          context,
        ),
      ]);
      expect(raceResults.some((result) => result.status === 'fulfilled')).toBe(true);
      const raceSnapshot = await repository.getSnapshot();
      if (raceResults[1]?.status === 'fulfilled') {
        expect(raceSnapshot.policyVersion).toBe(raceDraft.policyVersion);
      } else {
        expect(raceSnapshot.policyVersion).not.toBe(raceDraft.policyVersion);
      }

      const versionA = await repository.createDraft('PostgreSQL version race A', context);
      const versionB = await repository.createDraft('PostgreSQL version race B', context);
      await Promise.all([
        repository.activateDraft(
          versionA.policyVersion,
          { expectedRevision: versionA.revision, reason: 'Version race A' },
          context,
        ),
        repository.activateDraft(
          versionB.policyVersion,
          { expectedRevision: versionB.revision, reason: 'Version race B' },
          context,
        ),
      ]);
      const publishedVersions = await composition.database.client<{ policy_version: string }[]>`
        select policy_version from service_policy_releases where status = 'published'
      `;
      expect(publishedVersions).toHaveLength(1);
      expect([versionA.policyVersion, versionB.policyVersion]).toContain(
        publishedVersions[0]?.policy_version,
      );
    });
  },
);
