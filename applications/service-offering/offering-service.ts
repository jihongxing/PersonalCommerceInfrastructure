import type { ActorContext } from '../core/actor-context.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type { DistributionAssetRepository } from '../distribution/distribution-repositories.js';
import type { PublicOfferingUrlGenerator } from '../distribution/public-offering-url-generator.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../creator-identity/creator-identity-repositories.js';
import type { Offering } from '../../modules/service-offering/offering.js';
import type { DistributionAsset } from '../../modules/distribution/distribution-asset.js';
import {
  CreateServiceOfferingUseCase,
  GetCreatorOfferingsUseCase,
  PublishServiceOfferingUseCase,
  RecordExternalDistributionUseCase,
  UnpublishServiceOfferingUseCase,
  UpdateServiceOfferingUseCase,
  type CreateServiceOfferingCommand,
  type OfferingCommand,
  type PublishServiceOfferingResult,
  type ServiceOfferingUseCaseDependencies,
  type UpdateServiceOfferingCommand,
} from './offering-use-cases.js';
import type { OfferingRepository } from './offering-repositories.js';

export interface ServiceOfferingService {
  create(command: CreateServiceOfferingCommand, context: ActorContext): Promise<Offering>;
  update(command: UpdateServiceOfferingCommand, context: ActorContext): Promise<Offering>;
  list(context: ActorContext): Promise<readonly Offering[]>;
  publish(command: OfferingCommand, context: ActorContext): Promise<PublishServiceOfferingResult>;
  unpublish(command: OfferingCommand, context: ActorContext): Promise<Offering>;
  recordExternalDistribution(
    command: OfferingCommand,
    context: ActorContext,
  ): Promise<DistributionAsset>;
}

export function createServiceOfferingService(dependencies: {
  readonly identityRepository: CommerceIdentityRepository;
  readonly capabilityRepository: CapabilityRepository;
  readonly offeringRepository: OfferingRepository;
  readonly idGenerator: IdGenerator;
  readonly distributionAssetRepository?: DistributionAssetRepository;
  readonly publicOfferingUrlGenerator?: PublicOfferingUrlGenerator;
  readonly canonicalEventRecorder?: CanonicalEventRecorder;
  readonly unitOfWork?: UnitOfWork;
}): ServiceOfferingService {
  const useCaseDependencies: ServiceOfferingUseCaseDependencies = dependencies;
  const create = new CreateServiceOfferingUseCase(useCaseDependencies);
  const update = new UpdateServiceOfferingUseCase(useCaseDependencies);
  const list = new GetCreatorOfferingsUseCase(useCaseDependencies);
  const publish = new PublishServiceOfferingUseCase(useCaseDependencies);
  const unpublish = new UnpublishServiceOfferingUseCase(useCaseDependencies);
  const recordExternalDistribution = new RecordExternalDistributionUseCase(useCaseDependencies);

  return {
    create: (command, context) => create.execute(command, context),
    update: (command, context) => update.execute(command, context),
    list: (context) => list.execute(undefined, context),
    publish: (command, context) => publish.execute(command, context),
    unpublish: (command, context) => unpublish.execute(command, context),
    recordExternalDistribution: (command, context) =>
      recordExternalDistribution.execute(command, context),
  };
}
