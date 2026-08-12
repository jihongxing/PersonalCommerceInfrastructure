import type { ActorContext } from '../core/actor-context.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type {
  Capability,
  CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';
import type {
  AddCapabilityCommand,
  CreatorIdentityUseCaseDependencies,
  CreateCommerceIdentityCommand,
  UpdateCommerceIdentityCommand,
} from './creator-identity-use-cases.js';
import {
  AddCapabilityUseCase,
  CreateCommerceIdentityUseCase,
  GetCommerceIdentityUseCase,
  UpdateCommerceIdentityUseCase,
} from './creator-identity-use-cases.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from './creator-identity-repositories.js';

export interface CreatorIdentityService {
  create(command: CreateCommerceIdentityCommand, context: ActorContext): Promise<CommerceIdentity>;
  get(
    context: ActorContext,
  ): Promise<CommerceIdentity & { readonly capabilities: readonly Capability[] }>;
  update(command: UpdateCommerceIdentityCommand, context: ActorContext): Promise<CommerceIdentity>;
  addCapability(command: AddCapabilityCommand, context: ActorContext): Promise<CommerceIdentity>;
}

export function createCreatorIdentityService(dependencies: {
  readonly identityRepository: CommerceIdentityRepository;
  readonly capabilityRepository: CapabilityRepository;
  readonly idGenerator: IdGenerator;
  readonly unitOfWork?: UnitOfWork;
}): CreatorIdentityService {
  const useCaseDependencies: CreatorIdentityUseCaseDependencies = dependencies;
  const create = new CreateCommerceIdentityUseCase(useCaseDependencies);
  const get = new GetCommerceIdentityUseCase(useCaseDependencies);
  const update = new UpdateCommerceIdentityUseCase(useCaseDependencies);
  const addCapability = new AddCapabilityUseCase(useCaseDependencies);

  return {
    create: (command, context) => create.execute(command, context),
    update: (command, context) => update.execute(command, context),
    addCapability: (command, context) => addCapability.execute(command, context),
    async get(context) {
      const identity = await get.execute(undefined, context);
      const capabilities = await dependencies.capabilityRepository.findByOwnerId(
        identity.creatorId,
      );
      return {
        ...identity,
        capabilityIds: capabilities.map((capability) => capability.id),
        capabilities,
      };
    },
  };
}
