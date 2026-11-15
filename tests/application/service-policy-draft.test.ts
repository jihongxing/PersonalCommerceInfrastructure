import { describe, expect, it } from 'vitest';

import { createActorContext } from '../../applications/core/actor-context.js';
import { createServicePolicyAdminService } from '../../applications/service-policy/service-policy-admin-service.js';
import { InMemoryServicePolicyCatalogRepository } from '../../adapters/in-memory/in-memory-service-policy-catalog-repository.js';
import { initialServicePolicyCatalog } from '../../modules/service-policy/catalog-seed.js';

const human = createActorContext({
  actor: {
    kind: 'operations_human',
    principalId: 'principal-1',
    accountId: 'account-1',
    sessionId: 'session-1',
    permissions: [
      'catalog:read',
      'catalog:draft:create',
      'catalog:draft:update',
      'catalog:policy:activate',
    ],
  },
  correlationId: 'catalog-draft-test',
});

describe('controlled catalog draft lifecycle', () => {
  it('keeps the active snapshot isolated until explicit activation', async () => {
    const repository = new InMemoryServicePolicyCatalogRepository(initialServicePolicyCatalog);
    const service = createServicePolicyAdminService({ repository });
    const activeVersion = (await repository.getSnapshot()).policyVersion;
    const draft = await service.createDraft('Prepare policy change', human);

    const changed = await service.updateDraftItem(
      draft.policyVersion,
      'capability',
      draft.capabilities[0]!.id,
      { riskTier: 'review', expectedRevision: draft.revision, reason: 'Reclassify risk' },
      human,
    );
    expect((await repository.getSnapshot()).policyVersion).toBe(activeVersion);
    expect(changed.capabilities[0]?.riskTier).toBe('review');

    const preview = await service.previewDraft(draft.policyVersion, human);
    expect(preview.status).toBe('VALID');
    await service.activateDraft(
      draft.policyVersion,
      { expectedRevision: changed.revision, reason: 'Confirm policy change', confirm: true },
      human,
    );
    expect((await repository.getSnapshot()).policyVersion).toBe(draft.policyVersion);
    expect((await repository.getSnapshot()).capabilities[0]?.riskTier).toBe('review');
  });

  it('rejects stale updates and missing activation confirmation', async () => {
    const repository = new InMemoryServicePolicyCatalogRepository(initialServicePolicyCatalog);
    const service = createServicePolicyAdminService({ repository });
    const draft = await service.createDraft('Prepare policy change', human);
    await expect(
      service.updateDraftItem(
        draft.policyVersion,
        'template',
        draft.templates[0]!.id,
        { status: 'paused', expectedRevision: 'stale', reason: 'Stale edit' },
        human,
      ),
    ).rejects.toMatchObject({ category: 'conflict', code: 'service_policy_draft_stale_revision' });
    await expect(
      service.activateDraft(
        draft.policyVersion,
        { expectedRevision: draft.revision, reason: 'No confirmation', confirm: false },
        human,
      ),
    ).rejects.toMatchObject({
      category: 'validation',
      code: 'service_policy_activation_confirmation_required',
    });
  });

  it('requires the new human permissions for draft operations', async () => {
    const repository = new InMemoryServicePolicyCatalogRepository(initialServicePolicyCatalog);
    const service = createServicePolicyAdminService({ repository });
    const readOnly = createActorContext({
      actor: {
        kind: 'operations_human',
        principalId: 'principal-1',
        accountId: 'account-1',
        sessionId: 'session-1',
        permissions: ['catalog:read'],
      },
      correlationId: 'catalog-draft-denied',
    });
    await expect(service.createDraft('Denied', readOnly)).rejects.toMatchObject({
      category: 'authorization',
      code: 'operations_permission_denied',
    });
  });

  it('records a failed activation without changing the active snapshot', async () => {
    const repository = new InMemoryServicePolicyCatalogRepository(initialServicePolicyCatalog);
    const service = createServicePolicyAdminService({ repository });
    const draft = await service.createDraft('Prepare invalid policy', human);
    const changed = await service.updateDraftItem(
      draft.policyVersion,
      'capability',
      draft.capabilities[0]!.id,
      { status: 'paused', expectedRevision: draft.revision, reason: 'Pause capability' },
      human,
    );
    await expect(
      service.activateDraft(
        draft.policyVersion,
        { expectedRevision: changed.revision, reason: 'Reject invalid policy', confirm: true },
        human,
      ),
    ).rejects.toMatchObject({ code: 'service_policy_draft_invalid' });
    expect((await repository.getSnapshot()).policyVersion).toBe(
      initialServicePolicyCatalog.policyVersion,
    );
    expect(
      (await repository.listAudit()).some((record) => record.action === 'activation_failed'),
    ).toBe(true);
  });
});
