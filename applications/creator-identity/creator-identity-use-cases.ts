import {
  addCapabilityToIdentity,
  createDraftCommerceIdentity,
  updateCommerceIdentity,
  type Capability,
  type CommerceIdentity,
  type CommerceIdentityProfile,
} from '../../modules/creator-commerce-identity/commerce-identity.js';
import { assertCreatorOwnership } from '../../modules/shared/actors.js';
import { ApplicationError } from '../core/application-error.js';
import type { ActorContext } from '../core/actor-context.js';
import type { ApplicationUseCase } from '../core/application-use-case.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from './creator-identity-repositories.js';

export interface CreateCommerceIdentityCommand {
  readonly profile: CommerceIdentityProfile;
}

export interface UpdateCommerceIdentityCommand {
  readonly profile: CommerceIdentityProfile;
}

export interface AddCapabilityCommand {
  readonly name: string;
  readonly description: string;
}

export interface CreatorIdentityUseCaseDependencies {
  readonly identityRepository: CommerceIdentityRepository;
  readonly capabilityRepository: CapabilityRepository;
  readonly idGenerator: IdGenerator;
  readonly unitOfWork?: UnitOfWork;
}

export class CreateCommerceIdentityUseCase implements ApplicationUseCase<
  CreateCommerceIdentityCommand,
  CommerceIdentity
> {
  public constructor(private readonly dependencies: CreatorIdentityUseCaseDependencies) {}

  public async execute(
    command: CreateCommerceIdentityCommand,
    context: ActorContext,
  ): Promise<CommerceIdentity> {
    const creatorId = creatorIdFromContext(context);
    const existing = await this.dependencies.identityRepository.findById(creatorId);

    if (existing !== undefined) {
      throw new ApplicationError({
        category: 'conflict',
        code: 'commerce_identity_already_exists',
        message: 'Commerce Identity already exists.',
      });
    }

    const identity = createDraftCommerceIdentity(creatorId, command.profile);
    if (this.dependencies.unitOfWork === undefined) {
      await this.dependencies.identityRepository.save(identity);
    } else {
      await this.dependencies.unitOfWork.execute(async ({ identityRepository }) => {
        await (identityRepository ?? this.dependencies.identityRepository).save(identity);
      });
    }

    return identity;
  }
}

export class GetCommerceIdentityUseCase implements ApplicationUseCase<void, CommerceIdentity> {
  public constructor(private readonly dependencies: CreatorIdentityUseCaseDependencies) {}

  public async execute(_command: void, context: ActorContext): Promise<CommerceIdentity> {
    const creatorId = creatorIdFromContext(context);
    const identity = await this.dependencies.identityRepository.findById(creatorId);

    if (identity === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'commerce_identity_not_found',
        message: 'Commerce Identity not found.',
      });
    }

    return identity;
  }
}

export class UpdateCommerceIdentityUseCase implements ApplicationUseCase<
  UpdateCommerceIdentityCommand,
  CommerceIdentity
> {
  public constructor(private readonly dependencies: CreatorIdentityUseCaseDependencies) {}

  public async execute(
    command: UpdateCommerceIdentityCommand,
    context: ActorContext,
  ): Promise<CommerceIdentity> {
    const creatorId = creatorIdFromContext(context);
    const existing = await this.dependencies.identityRepository.findById(creatorId);

    if (existing === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'commerce_identity_not_found',
        message: 'Commerce Identity not found.',
      });
    }

    const identity = updateCommerceIdentity(existing, command.profile);
    await this.dependencies.identityRepository.save(identity);
    return identity;
  }
}

export class AddCapabilityUseCase implements ApplicationUseCase<
  AddCapabilityCommand,
  CommerceIdentity
> {
  public constructor(private readonly dependencies: CreatorIdentityUseCaseDependencies) {}

  public async execute(
    command: AddCapabilityCommand,
    context: ActorContext,
  ): Promise<CommerceIdentity> {
    const creatorId = creatorIdFromContext(context);
    const identity = await this.dependencies.identityRepository.findById(creatorId);

    if (identity === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'commerce_identity_not_found',
        message: 'Commerce Identity not found.',
      });
    }

    const capability: Capability = {
      id: this.dependencies.idGenerator.generate(),
      creatorId,
      name: command.name.trim(),
      description: command.description.trim(),
    };

    if (capability.name.length === 0 || capability.description.length === 0) {
      throw new ApplicationError({
        category: 'validation',
        code: 'invalid_capability',
        message: 'Capability name and description are required.',
      });
    }

    const updatedIdentity = addCapabilityToIdentity(identity, capability);
    if (this.dependencies.unitOfWork === undefined) {
      await this.dependencies.capabilityRepository.save(capability);
      await this.dependencies.identityRepository.save(updatedIdentity);
    } else {
      await this.dependencies.unitOfWork.execute(
        async ({ identityRepository, capabilityRepository }) => {
          await (capabilityRepository ?? this.dependencies.capabilityRepository).save(capability);
          await (identityRepository ?? this.dependencies.identityRepository).save(updatedIdentity);
        },
      );
    }
    return updatedIdentity;
  }
}

function creatorIdFromContext(context: ActorContext): string {
  if (context.actor.kind !== 'creator') {
    throw new ApplicationError({
      category: 'authorization',
      code: 'creator_actor_required',
      message: 'A Creator actor is required.',
    });
  }

  assertCreatorOwnership(context.actor, context.actor.creatorId);
  return context.actor.creatorId;
}
