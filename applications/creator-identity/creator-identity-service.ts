import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
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
  CapabilityManagementRepository,
  CommerceIdentityRepository,
} from './creator-identity-repositories.js';
import { resolveCapabilitySelection } from '../../modules/service-policy/catalog.js';
import type { ServicePolicyCatalogRepository } from '../service-policy/service-policy-repositories.js';

export interface CreatorIdentityService {
  create(command: CreateCommerceIdentityCommand, context: ActorContext): Promise<CommerceIdentity>;
  get(
    context: ActorContext,
  ): Promise<CommerceIdentity & { readonly capabilities: readonly Capability[] }>;
  update(command: UpdateCommerceIdentityCommand, context: ActorContext): Promise<CommerceIdentity>;
  addCapability(command: AddCapabilityCommand, context: ActorContext): Promise<CommerceIdentity>;
  getCapability(id: string, context: ActorContext): Promise<Capability>;
  updateCapability(
    id: string,
    command: AddCapabilityCommand,
    context: ActorContext,
  ): Promise<Capability>;
  deleteCapability(id: string, context: ActorContext): Promise<void>;
}

export function createCreatorIdentityService(dependencies: {
  readonly identityRepository: CommerceIdentityRepository;
  readonly capabilityRepository: CapabilityRepository;
  readonly capabilityManagement?: CapabilityManagementRepository;
  readonly idGenerator: IdGenerator;
  readonly servicePolicyCatalogRepository: ServicePolicyCatalogRepository;
  readonly unitOfWork?: UnitOfWork;
}): CreatorIdentityService {
  const useCaseDependencies: CreatorIdentityUseCaseDependencies = dependencies;
  const create = new CreateCommerceIdentityUseCase(useCaseDependencies);
  const get = new GetCommerceIdentityUseCase(useCaseDependencies);
  const update = new UpdateCommerceIdentityUseCase(useCaseDependencies);
  const addCapability = new AddCapabilityUseCase(useCaseDependencies);

  function creatorId(context: ActorContext): string {
    if (context.actor.kind !== 'creator')
      throw new ApplicationError({
        category: 'authorization',
        code: 'creator_actor_required',
        message: 'A Creator actor is required.',
      });
    return context.actor.creatorId;
  }
  function missing(): ApplicationError {
    return new ApplicationError({
      category: 'not_found',
      code: 'capability_not_found',
      message: '能力不存在。',
    });
  }
  function management(): CapabilityManagementRepository {
    if (!dependencies.capabilityManagement)
      throw new ApplicationError({
        category: 'unavailable',
        code: 'capability_management_unavailable',
        message: '能力管理暂不可用。',
      });
    return dependencies.capabilityManagement;
  }

  return {
    create: (command, context) => create.execute(command, context),
    update: (command, context) => update.execute(command, context),
    addCapability: (command, context) => addCapability.execute(command, context),
    async getCapability(id, context) {
      const owner = creatorId(context);
      const capability = await dependencies.capabilityRepository.findById(id);
      if (!capability || capability.creatorId !== owner) throw missing();
      return capability;
    },
    async updateCapability(id, command, context) {
      const name = command.name.trim();
      const description = command.description.trim();
      if (!name || !description || name.length > 120 || description.length > 1000)
        throw new ApplicationError({
          category: 'validation',
          code: 'invalid_capability',
          message: '请填写有效的能力名称和描述。',
        });
      const existing = await dependencies.capabilityRepository.findById(id);
      if (existing === undefined || existing.creatorId !== creatorId(context)) throw missing();
      const selection =
        command.catalogItemId === undefined && existing.catalogItemId !== undefined
          ? {
              item: undefined,
              status: existing.catalogStatus ?? ('active' as const),
            }
      : resolveCapabilitySelection(
          { catalogItemId: command.catalogItemId, name },
          await dependencies.servicePolicyCatalogRepository.getSnapshot(),
        );
      if (command.catalogItemId !== undefined && selection.item === undefined)
        throw new ApplicationError({
          category: 'validation',
          code: 'capability_catalog_item_invalid',
          message: '请选择有效的平台能力类型。',
        });
      const result = await management().updateOwned(creatorId(context), id, {
        name,
        description,
        ...(existing.catalogItemId !== undefined && command.catalogItemId === undefined
          ? { catalogItemId: existing.catalogItemId }
          : selection.item === undefined
            ? {}
            : { catalogItemId: selection.item.id }),
        catalogStatus: selection.status,
        ...(existing.policyVersion !== undefined && command.catalogItemId === undefined
          ? { policyVersion: existing.policyVersion }
          : selection.item === undefined
            ? {}
            : { policyVersion: selection.item.version }),
      });
      if (!result) throw missing();
      return result;
    },
    async deleteCapability(id, context) {
      const result = await management().deleteOwnedIfUnused(creatorId(context), id);
      if (result === 'not_found') throw missing();
      if (result === 'in_use')
        throw new ApplicationError({
          category: 'conflict',
          code: 'capability_in_use',
          message: '该能力已关联服务，请先在服务中移除关联。',
        });
    },
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
