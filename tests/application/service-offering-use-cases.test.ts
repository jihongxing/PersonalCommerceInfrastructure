import { describe, expect, it } from 'vitest';

import { createActorContext } from '../../applications/core/actor-context.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import type { EntityCollectionRepository } from '../../applications/core/ports/entity-repository.js';
import type { ProductEventStore } from '../../applications/core/ports/product-event-store.js';
import type { UnitOfWork, UnitOfWorkScope } from '../../applications/core/ports/unit-of-work.js';
import { createServiceOfferingService } from '../../applications/service-offering/offering-service.js';
import {
  createDraftCommerceIdentity,
  type Capability,
  type CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';
import type { Offering } from '../../modules/service-offering/offering.js';
import type { CanonicalEvent } from '../../modules/product-facts/canonical-events.js';
import type { DistributionAsset } from '../../modules/distribution/distribution-asset.js';

async function createFixture() {
  const identityRepository = new TestCollectionRepository<CommerceIdentity>(
    (identity) => identity.creatorId,
    (identity) => identity.creatorId,
  );
  const capabilityRepository = new TestCollectionRepository<Capability>(
    (capability) => capability.id,
    (capability) => capability.creatorId,
  );
  const offeringRepository = new TestCollectionRepository<Offering>(
    (offering) => offering.id,
    (offering) => offering.creatorId,
  );
  const distributionAssetRepository = new TestEntityRepository<DistributionAsset>(
    (asset) => asset.offeringId,
  );
  const productEventStore = new TestProductEventStore();
  await identityRepository.save(
    createDraftCommerceIdentity('creator-1', {
      displayName: 'Dancer One',
      bio: 'Private dance lessons',
      socialLinks: [],
    }),
  );
  await capabilityRepository.save({
    id: 'capability-1',
    creatorId: 'creator-1',
    name: 'Dance lesson',
    description: 'One-on-one dance instruction',
  });

  return {
    context: createActorContext({
      actor: { kind: 'creator', creatorId: 'creator-1' },
      correlationId: 'test-correlation-id',
    }),
    service: createServiceOfferingService({
      identityRepository,
      capabilityRepository,
      offeringRepository,
      distributionAssetRepository,
      idGenerator: {
        generate: () => 'offering-1',
      },
      publicOfferingUrlGenerator: {
        generate: (offeringId) => `https://commerce.example/public/${offeringId}`,
      },
      canonicalEventRecorder: new CanonicalEventRecorder({
        clock: { now: () => '2026-08-12T09:00:00.000Z' },
        eventStore: productEventStore,
        idGenerator: {
          generate: () => `event-${String(productEventStore.size + 1)}`,
        },
      }),
      unitOfWork: new TestUnitOfWork({
        identityRepository,
        capabilityRepository,
        offeringRepository,
        distributionAssetRepository,
        productEventStore,
      }),
    }),
    identityRepository,
    distributionAssetRepository,
    productEventStore,
  };
}

class TestEntityRepository<Entity> {
  private readonly entities = new Map<string, Entity>();

  public constructor(private readonly getId: (entity: Entity) => string) {}

  public findById(id: string): Promise<Entity | undefined> {
    return Promise.resolve(this.entities.get(id));
  }

  public save(entity: Entity): Promise<void> {
    this.entities.set(this.getId(entity), entity);
    return Promise.resolve();
  }
}

class TestProductEventStore implements ProductEventStore {
  private readonly events: CanonicalEvent[] = [];

  public get size(): number {
    return this.events.length;
  }

  public append(event: CanonicalEvent): Promise<void> {
    this.events.push(event);
    return Promise.resolve();
  }

  public list(): Promise<readonly CanonicalEvent[]> {
    return Promise.resolve([...this.events]);
  }
}

class TestUnitOfWork implements UnitOfWork {
  public constructor(private readonly scope: UnitOfWorkScope) {}

  public execute<Result>(operation: (scope: UnitOfWorkScope) => Promise<Result>): Promise<Result> {
    return operation(this.scope);
  }
}

class TestCollectionRepository<Entity> implements EntityCollectionRepository<Entity> {
  private readonly entities = new Map<string, Entity>();

  public constructor(
    private readonly getId: (entity: Entity) => string,
    private readonly getOwnerId: (entity: Entity) => string,
  ) {}

  public findById(id: string): Promise<Entity | undefined> {
    return Promise.resolve(this.entities.get(id));
  }

  public findByOwnerId(ownerId: string): Promise<readonly Entity[]> {
    return Promise.resolve(
      [...this.entities.values()].filter((entity) => this.getOwnerId(entity) === ownerId),
    );
  }

  public save(entity: Entity): Promise<void> {
    this.entities.set(this.getId(entity), entity);
    return Promise.resolve();
  }
}

describe('Service Offering application use cases', () => {
  it('creates and updates a Creator-owned draft offering with availability', async () => {
    const { context, service } = await createFixture();
    const created = await service.create(
      {
        capabilityIds: ['capability-1'],
        title: 'Dance lesson',
        description: '',
        requestInstructions: '',
      },
      context,
    );

    const updated = await service.update(
      {
        offeringId: created.id,
        capabilityIds: ['capability-1'],
        title: 'Private dance lesson',
        description: 'One hour of one-on-one instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time and experience level.',
      },
      context,
    );

    expect(created).toMatchObject({ id: 'offering-1', state: 'draft' });
    expect(updated).toMatchObject({
      id: 'offering-1',
      state: 'draft',
      availability: { description: 'Weekends by request.' },
    });
    await expect(service.list(context)).resolves.toEqual([updated]);
  });

  it('allows a Creator to save an incomplete draft before selecting a Capability', async () => {
    const { context, service } = await createFixture();

    await expect(
      service.create(
        {
          capabilityIds: [],
          title: 'Dance lesson',
          description: '',
          requestInstructions: '',
        },
        context,
      ),
    ).resolves.toMatchObject({
      capabilityIds: [],
      state: 'draft',
    });
  });

  it('rejects an Offering associated with another Creator capability', async () => {
    const { context, service } = await createFixture();

    await expect(
      service.create(
        {
          capabilityIds: ['capability-not-owned'],
          title: 'Dance lesson',
          description: 'One-on-one instruction.',
          availabilityDescription: 'Weekends by request.',
          requestInstructions: 'Share your preferred time.',
        },
        context,
      ),
    ).rejects.toMatchObject({
      code: 'service_offering_capability_invalid',
      category: 'validation',
    });
  });

  it('publishes an eligible Offering, makes the Identity public, and generates an Asset', async () => {
    const { context, service, identityRepository, distributionAssetRepository, productEventStore } =
      await createFixture();
    await service.create(
      {
        capabilityIds: ['capability-1'],
        title: 'Private dance lesson',
        description: 'One hour of one-on-one instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time and experience level.',
      },
      context,
    );

    const result = await service.publish({ offeringId: 'offering-1' }, context);

    expect(result.offering.id).toBe('offering-1');
    expect(result.offering.state).toBe('published');
    expect(result.distributionAsset).toEqual({
      offeringId: 'offering-1',
      publicUrl: 'https://commerce.example/public/offering-1',
      state: 'generated',
    });
    await expect(identityRepository.findById('creator-1')).resolves.toMatchObject({
      state: 'published',
    });
    await expect(distributionAssetRepository.findById('offering-1')).resolves.toEqual(
      result.distributionAsset,
    );
    expect(await productEventStore.list()).toEqual([
      expect.objectContaining({
        name: 'creator_published',
        objectId: 'creator-1',
        actorId: 'creator-1',
      }),
    ]);
  });

  it('rejects publishing an incomplete Offering without changing state or recording events', async () => {
    const { context, service, productEventStore } = await createFixture();
    await service.create(
      {
        capabilityIds: [],
        title: 'Dance lesson',
        description: '',
        requestInstructions: '',
      },
      context,
    );

    await expect(service.publish({ offeringId: 'offering-1' }, context)).rejects.toMatchObject({
      category: 'validation',
      code: 'service_offering_publish_conditions_missing',
    });
    await expect(service.list(context)).resolves.toEqual([
      expect.objectContaining({ state: 'draft' }),
    ]);
    expect(await productEventStore.list()).toEqual([]);
  });

  it('records real external distribution only after the Creator explicitly confirms it', async () => {
    const { context, service, productEventStore } = await createFixture();
    await service.create(
      {
        capabilityIds: ['capability-1'],
        title: 'Private dance lesson',
        description: 'One hour of one-on-one instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time and experience level.',
      },
      context,
    );
    const published = await service.publish({ offeringId: 'offering-1' }, context);

    expect(published.distributionAsset.state).toBe('generated');
    expect(await productEventStore.list()).toHaveLength(1);

    const distributed = await service.recordExternalDistribution(
      { offeringId: 'offering-1' },
      context,
    );

    expect(distributed.state).toBe('distributed');
    expect(await productEventStore.list()).toEqual([
      expect.objectContaining({ name: 'creator_published' }),
      expect.objectContaining({
        name: 'creator_distributed',
        objectId: 'offering-1',
        actorId: 'creator-1',
      }),
    ]);
  });

  it('unpublishes a Creator-owned Offering without deleting its Distribution Asset', async () => {
    const { context, service, distributionAssetRepository } = await createFixture();
    await service.create(
      {
        capabilityIds: ['capability-1'],
        title: 'Private dance lesson',
        description: 'One hour of one-on-one instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time and experience level.',
      },
      context,
    );
    await service.publish({ offeringId: 'offering-1' }, context);

    await expect(service.unpublish({ offeringId: 'offering-1' }, context)).resolves.toMatchObject({
      state: 'unpublished',
    });
    await expect(distributionAssetRepository.findById('offering-1')).resolves.toMatchObject({
      offeringId: 'offering-1',
      state: 'generated',
    });
  });
});
