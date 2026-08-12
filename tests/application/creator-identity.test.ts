import { describe, expect, it } from 'vitest';

import { InMemoryEntityCollectionRepository } from '../../adapters/in-memory/in-memory-entity-collection-repository.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { ApplicationError } from '../../applications/core/application-error.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import {
  AddCapabilityUseCase,
  CreateCommerceIdentityUseCase,
  GetCommerceIdentityUseCase,
  UpdateCommerceIdentityUseCase,
} from '../../applications/creator-identity/creator-identity-use-cases.js';
import type {
  Capability,
  CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';

function setup() {
  const identityRepository = new InMemoryEntityCollectionRepository<CommerceIdentity>(
    (identity) => identity.creatorId,
    (identity) => identity.creatorId,
  );
  const capabilityRepository = new InMemoryEntityCollectionRepository<Capability>(
    (capability) => capability.id,
    (capability) => capability.creatorId,
  );
  const dependencies = {
    identityRepository,
    capabilityRepository,
    idGenerator: new SequentialIdGenerator('capability'),
  };
  const creatorContext = createActorContext({
    actor: { kind: 'creator', creatorId: 'creator-1' },
    correlationId: 'correlation-1',
  });

  return {
    identityRepository,
    capabilityRepository,
    dependencies,
    creatorContext,
    create: new CreateCommerceIdentityUseCase(dependencies),
    get: new GetCommerceIdentityUseCase(dependencies),
    update: new UpdateCommerceIdentityUseCase(dependencies),
    addCapability: new AddCapabilityUseCase(dependencies),
  };
}

const profile = {
  displayName: 'Dancer One',
  bio: 'Private dance lessons',
  socialLinks: [],
};

describe('Creator Identity application use cases', () => {
  it('creates and reads a draft Commerce Identity for the authenticated Creator', async () => {
    const context = setup();

    await expect(
      context.create.execute({ profile }, context.creatorContext),
    ).resolves.toMatchObject({
      creatorId: 'creator-1',
      state: 'draft',
      capabilityIds: [],
    });
    await expect(context.get.execute(undefined, context.creatorContext)).resolves.toMatchObject({
      profile,
    });
  });

  it('rejects duplicate identity creation and allows profile editing', async () => {
    const context = setup();
    await context.create.execute({ profile }, context.creatorContext);

    await expect(context.create.execute({ profile }, context.creatorContext)).rejects.toMatchObject(
      {
        category: 'conflict',
        code: 'commerce_identity_already_exists',
      },
    );
    await expect(
      context.update.execute(
        {
          profile: {
            ...profile,
            displayName: 'Updated Dancer',
          },
        },
        context.creatorContext,
      ),
    ).resolves.toMatchObject({
      profile: {
        displayName: 'Updated Dancer',
      },
    });
  });

  it('adds a Capability to the Creator Identity without creating a parallel identity', async () => {
    const context = setup();
    await context.create.execute({ profile }, context.creatorContext);

    await expect(
      context.addCapability.execute(
        {
          name: 'Private Dance Lesson',
          description: 'One-on-one dance instruction',
        },
        context.creatorContext,
      ),
    ).resolves.toMatchObject({
      capabilityIds: ['capability-1'],
    });
    await expect(context.capabilityRepository.findById('capability-1')).resolves.toMatchObject({
      creatorId: 'creator-1',
      name: 'Private Dance Lesson',
    });
  });

  it('rejects non-Creator actors before accessing Creator identity state', async () => {
    const context = setup();
    const customerContext = createActorContext({
      actor: { kind: 'customer', customerId: 'customer-1' },
      correlationId: 'correlation-customer',
    });

    await expect(context.get.execute(undefined, customerContext)).rejects.toMatchObject({
      category: 'authorization',
      code: 'creator_actor_required',
    });
    await expect(context.update.execute({ profile }, customerContext)).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });
});
