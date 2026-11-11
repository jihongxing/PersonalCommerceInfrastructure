import { describe, expect, it } from 'vitest';

import { createActorContext } from '../../applications/core/actor-context.js';
import { createServicePolicyAdminService } from '../../applications/service-policy/service-policy-admin-service.js';
import { InMemoryServicePolicyCatalogRepository } from '../../adapters/in-memory/in-memory-service-policy-catalog-repository.js';
import { initialServicePolicyCatalog } from '../../modules/service-policy/catalog-seed.js';

const operationsContext = createActorContext({
  actor: { kind: 'pilot_operations', operatorId: 'operator-1' },
  correlationId: 'service-policy-admin-test',
});

describe('service policy administration', () => {
  it('supports pause, restore, retire and emergency publication disable with audit records', async () => {
    const repository = new InMemoryServicePolicyCatalogRepository(initialServicePolicyCatalog);
    const service = createServicePolicyAdminService({ repository });

    await service.updateCapability(
      'capability-dance-teaching',
      { status: 'paused', reason: 'Emergency policy review' },
      operationsContext,
    );
    await service.updateCapability(
      'capability-dance-teaching',
      { status: 'active', reason: 'Review complete' },
      { ...operationsContext, correlationId: 'service-policy-restore' },
    );
    await service.updateTemplate(
      'template-dance-private-lesson',
      { status: 'retired', reason: 'Template replaced' },
      { ...operationsContext, correlationId: 'service-policy-retire' },
    );
    await service.updateTemplate(
      'template-dance-private-lesson',
      { publishEnabled: false, reason: 'Emergency public stop' },
      { ...operationsContext, correlationId: 'service-policy-emergency-stop' },
    );

    const snapshot = await repository.getSnapshot();
    expect(
      snapshot.capabilities.find((item) => item.id === 'capability-dance-teaching'),
    ).toMatchObject({
      status: 'active',
    });
    expect(
      snapshot.templates.find((item) => item.id === 'template-dance-private-lesson'),
    ).toMatchObject({
      status: 'retired',
      publishEnabled: false,
    });
    expect(await repository.listAudit()).toHaveLength(4);
  });

  it('requires Operations authorization and an audit reason', async () => {
    const service = createServicePolicyAdminService({
      repository: new InMemoryServicePolicyCatalogRepository(initialServicePolicyCatalog),
    });
    const creatorContext = createActorContext({
      actor: { kind: 'creator', creatorId: 'creator-1' },
      correlationId: 'service-policy-unauthorized',
    });

    await expect(
      service.updateCapability(
        'capability-dance-teaching',
        { status: 'paused', reason: 'test' },
        creatorContext,
      ),
    ).rejects.toMatchObject({
      category: 'authorization',
      code: 'service_policy_operations_required',
    });
    await expect(
      service.updateCapability(
        'capability-dance-teaching',
        { status: 'paused', reason: ' ' },
        operationsContext,
      ),
    ).rejects.toMatchObject({
      category: 'validation',
      code: 'service_policy_reason_required',
    });

    await expect(
      service.publishVersion('v2', 'Publish before import', operationsContext),
    ).rejects.toMatchObject({
      category: 'validation',
      code: 'service_policy_version_not_loaded',
    });
  });
});
