import {
  createDraftOffering,
  missingPublishConditions,
  publishOffering,
  unpublishOffering,
  updateOffering,
  type Offering,
  type OfferingDraftInput,
} from '../../modules/service-offering/offering.js';
import {
  generateDistributionAsset,
  recordExternalDistribution,
  type DistributionAsset,
} from '../../modules/distribution/distribution-asset.js';
import {
  publishCommerceIdentity,
  type CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';
import { assertCreatorOwnership } from '../../modules/shared/actors.js';
import { ApplicationError } from '../core/application-error.js';
import type { ActorContext } from '../core/actor-context.js';
import type { ApplicationUseCase } from '../core/application-use-case.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type { DistributionAssetRepository } from '../distribution/distribution-repositories.js';
import type { PublicOfferingUrlGenerator } from '../distribution/public-offering-url-generator.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../creator-identity/creator-identity-repositories.js';
import type { OfferingRepository } from './offering-repositories.js';

export type CreateServiceOfferingCommand = OfferingDraftInput;

export interface UpdateServiceOfferingCommand extends OfferingDraftInput {
  readonly offeringId: string;
}

export interface OfferingCommand {
  readonly offeringId: string;
}

export interface PublishServiceOfferingResult {
  readonly offering: Offering;
  readonly distributionAsset: DistributionAsset;
}

export interface ServiceOfferingUseCaseDependencies {
  readonly identityRepository: CommerceIdentityRepository;
  readonly capabilityRepository: CapabilityRepository;
  readonly offeringRepository: OfferingRepository;
  readonly idGenerator: IdGenerator;
  readonly distributionAssetRepository?: DistributionAssetRepository;
  readonly publicOfferingUrlGenerator?: PublicOfferingUrlGenerator;
  readonly canonicalEventRecorder?: CanonicalEventRecorder;
  readonly unitOfWork?: UnitOfWork;
}

export class CreateServiceOfferingUseCase implements ApplicationUseCase<
  CreateServiceOfferingCommand,
  Offering
> {
  public constructor(private readonly dependencies: ServiceOfferingUseCaseDependencies) {}

  public async execute(
    command: CreateServiceOfferingCommand,
    context: ActorContext,
  ): Promise<Offering> {
    const creatorId = creatorIdFromContext(context);
    await assertCreatorCanSaveOffering(creatorId, command.capabilityIds, this.dependencies);

    const offering = createDraftOffering(
      this.dependencies.idGenerator.generate(),
      creatorId,
      command,
    );
    await this.dependencies.offeringRepository.save(offering);
    return offering;
  }
}

export class UpdateServiceOfferingUseCase implements ApplicationUseCase<
  UpdateServiceOfferingCommand,
  Offering
> {
  public constructor(private readonly dependencies: ServiceOfferingUseCaseDependencies) {}

  public async execute(
    command: UpdateServiceOfferingCommand,
    context: ActorContext,
  ): Promise<Offering> {
    const creatorId = creatorIdFromContext(context);
    const existing = await this.dependencies.offeringRepository.findById(command.offeringId);

    if (existing === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'service_offering_not_found',
        message: 'Service Offering not found.',
      });
    }

    if (existing.creatorId !== creatorId) {
      throw new ApplicationError({
        category: 'authorization',
        code: 'service_offering_not_owned',
        message: 'Service Offering does not belong to the authenticated Creator.',
      });
    }

    await assertCreatorCanSaveOffering(creatorId, command.capabilityIds, this.dependencies);

    const offering = updateOffering(existing, command);
    await this.dependencies.offeringRepository.save(offering);
    return offering;
  }
}

export class GetCreatorOfferingsUseCase implements ApplicationUseCase<void, readonly Offering[]> {
  public constructor(private readonly dependencies: ServiceOfferingUseCaseDependencies) {}

  public execute(_command: void, context: ActorContext): Promise<readonly Offering[]> {
    return this.dependencies.offeringRepository.findByOwnerId(creatorIdFromContext(context));
  }
}

export class PublishServiceOfferingUseCase implements ApplicationUseCase<
  OfferingCommand,
  PublishServiceOfferingResult
> {
  public constructor(private readonly dependencies: ServiceOfferingUseCaseDependencies) {}

  public async execute(
    command: OfferingCommand,
    context: ActorContext,
  ): Promise<PublishServiceOfferingResult> {
    const creatorId = creatorIdFromContext(context);
    const offering = await requireOwnedOffering(
      command.offeringId,
      creatorId,
      this.dependencies.offeringRepository,
    );
    const missingConditions = missingPublishConditions(offering);

    if (missingConditions.length > 0) {
      throw new ApplicationError({
        category: 'validation',
        code: 'service_offering_publish_conditions_missing',
        message: `Service Offering cannot be published until these conditions are complete: ${missingConditions.join(', ')}.`,
      });
    }
    if (offering.state === 'published') {
      throw new ApplicationError({
        category: 'conflict',
        code: 'service_offering_already_published',
        message: 'Service Offering is already published.',
      });
    }

    const distributionAssetRepository = requireM4Dependency(
      this.dependencies.distributionAssetRepository,
      'Distribution Asset repository',
    );
    const publicOfferingUrlGenerator = requireM4Dependency(
      this.dependencies.publicOfferingUrlGenerator,
      'Public Offering URL generator',
    );
    const canonicalEventRecorder = requireM4Dependency(
      this.dependencies.canonicalEventRecorder,
      'Canonical Event recorder',
    );
    const unitOfWork = requireM4Dependency(this.dependencies.unitOfWork, 'Unit of Work');

    return unitOfWork.execute(async (scope) => {
      const scopedOfferingRepository =
        scope.offeringRepository ?? this.dependencies.offeringRepository;
      const scopedIdentityRepository =
        scope.identityRepository ?? this.dependencies.identityRepository;
      const scopedAssetRepository =
        scope.distributionAssetRepository ?? distributionAssetRepository;
      const identity = await requireIdentity(creatorId, scopedIdentityRepository);
      const publishedOffering = publishOffering(offering);
      const existingAsset = await scopedAssetRepository.findById(offering.id);
      const distributionAsset =
        existingAsset ??
        generateDistributionAsset(offering.id, publicOfferingUrlGenerator.generate(offering.id));

      await scopedOfferingRepository.save(publishedOffering);
      if (identity.state !== 'published') {
        await scopedIdentityRepository.save(publishCommerceIdentity(identity));
        await canonicalEventRecorder.record(
          {
            actorId: creatorId,
            correlationId: context.correlationId,
            name: 'creator_published',
            objectId: identity.creatorId,
            source: 'creator',
          },
          scope.productEventStore,
        );
      }
      await scopedAssetRepository.save(distributionAsset);

      return {
        offering: publishedOffering,
        distributionAsset,
      };
    });
  }
}

export class UnpublishServiceOfferingUseCase implements ApplicationUseCase<
  OfferingCommand,
  Offering
> {
  public constructor(private readonly dependencies: ServiceOfferingUseCaseDependencies) {}

  public async execute(command: OfferingCommand, context: ActorContext): Promise<Offering> {
    const creatorId = creatorIdFromContext(context);
    const offering = await requireOwnedOffering(
      command.offeringId,
      creatorId,
      this.dependencies.offeringRepository,
    );
    if (offering.state !== 'published') {
      throw new ApplicationError({
        category: 'conflict',
        code: 'service_offering_not_published',
        message: 'Service Offering is not published.',
      });
    }
    const unpublishedOffering = unpublishOffering(offering);

    if (this.dependencies.unitOfWork === undefined) {
      await this.dependencies.offeringRepository.save(unpublishedOffering);
    } else {
      await this.dependencies.unitOfWork.execute(async (scope) => {
        await (scope.offeringRepository ?? this.dependencies.offeringRepository).save(
          unpublishedOffering,
        );
      });
    }

    return unpublishedOffering;
  }
}

export class RecordExternalDistributionUseCase implements ApplicationUseCase<
  OfferingCommand,
  DistributionAsset
> {
  public constructor(private readonly dependencies: ServiceOfferingUseCaseDependencies) {}

  public async execute(
    command: OfferingCommand,
    context: ActorContext,
  ): Promise<DistributionAsset> {
    const creatorId = creatorIdFromContext(context);
    const offering = await requireOwnedOffering(
      command.offeringId,
      creatorId,
      this.dependencies.offeringRepository,
    );

    if (offering.state !== 'published') {
      throw new ApplicationError({
        category: 'conflict',
        code: 'service_offering_not_published',
        message: 'Service Offering must be published before external distribution is recorded.',
      });
    }

    const distributionAssetRepository = requireM4Dependency(
      this.dependencies.distributionAssetRepository,
      'Distribution Asset repository',
    );
    const canonicalEventRecorder = requireM4Dependency(
      this.dependencies.canonicalEventRecorder,
      'Canonical Event recorder',
    );
    const unitOfWork = requireM4Dependency(this.dependencies.unitOfWork, 'Unit of Work');
    const asset = await distributionAssetRepository.findById(offering.id);

    if (asset === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'distribution_asset_not_found',
        message: 'Distribution Asset not found.',
      });
    }
    if (asset.state === 'distributed') {
      throw new ApplicationError({
        category: 'conflict',
        code: 'distribution_asset_already_distributed',
        message: 'External distribution has already been recorded for this Distribution Asset.',
      });
    }

    return unitOfWork.execute(async (scope) => {
      const scopedAssetRepository =
        scope.distributionAssetRepository ?? distributionAssetRepository;
      const distributedAsset = recordExternalDistribution(asset);
      await scopedAssetRepository.save(distributedAsset);
      await canonicalEventRecorder.record(
        {
          actorId: creatorId,
          correlationId: context.correlationId,
          name: 'creator_distributed',
          objectId: offering.id,
          source: 'creator',
        },
        scope.productEventStore,
      );
      return distributedAsset;
    });
  }
}

async function assertCreatorCanSaveOffering(
  creatorId: string,
  capabilityIds: readonly string[],
  dependencies: ServiceOfferingUseCaseDependencies,
): Promise<void> {
  const identity = await dependencies.identityRepository.findById(creatorId);

  if (identity === undefined) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'commerce_identity_not_found',
      message: 'Commerce Identity not found.',
    });
  }

  const normalizedCapabilityIds = [
    ...new Set(capabilityIds.map((capabilityId) => capabilityId.trim())),
  ].filter((capabilityId) => capabilityId.length > 0);

  const capabilities = await Promise.all(
    normalizedCapabilityIds.map((capabilityId) =>
      dependencies.capabilityRepository.findById(capabilityId),
    ),
  );

  if (
    capabilities.some(
      (capability) => capability === undefined || capability.creatorId !== creatorId,
    )
  ) {
    throw new ApplicationError({
      category: 'validation',
      code: 'service_offering_capability_invalid',
      message: 'Service Offering capabilities must belong to the authenticated Creator.',
    });
  }
}

async function requireOwnedOffering(
  offeringId: string,
  creatorId: string,
  offeringRepository: OfferingRepository,
): Promise<Offering> {
  const offering = await offeringRepository.findById(offeringId);

  if (offering === undefined) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'service_offering_not_found',
      message: 'Service Offering not found.',
    });
  }

  if (offering.creatorId !== creatorId) {
    throw new ApplicationError({
      category: 'authorization',
      code: 'service_offering_not_owned',
      message: 'Service Offering does not belong to the authenticated Creator.',
    });
  }

  return offering;
}

async function requireIdentity(
  creatorId: string,
  identityRepository: CommerceIdentityRepository,
): Promise<CommerceIdentity> {
  const identity = await identityRepository.findById(creatorId);

  if (identity === undefined) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'commerce_identity_not_found',
      message: 'Commerce Identity not found.',
    });
  }

  return identity;
}

function requireM4Dependency<Dependency>(
  dependency: Dependency | undefined,
  name: string,
): Dependency {
  if (dependency === undefined) {
    throw new ApplicationError({
      category: 'internal',
      code: 'm4_dependency_missing',
      message: `${name} is not configured.`,
    });
  }

  return dependency;
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
