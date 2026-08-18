import {
  acceptContract,
  cancelContract,
  createContract,
  createContractAcceptanceFact,
  createContractScopeVersion,
  expireContract,
  formContract,
  proposeContract,
  rejectContract,
  type Contract,
  type ContractScope,
  type ContractScopeVersion,
} from '../../modules/contract-commerce/contract.js';
import {
  beginOrderPayment,
  createPaidServiceOrder,
  createPayment,
  money,
} from '../../modules/paid-commerce/money-domain.js';
import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type { CommerceActionRepository } from '../customer-request/customer-request-repositories.js';
import type { PaidCommerceRepository } from '../paid-commerce/paid-commerce-repositories.js';
import type { OfferingRepository } from '../service-offering/offering-repositories.js';
import type {
  ContractAcceptanceFactRepository,
  ContractRepository,
  ContractScopeVersionRepository,
} from './contract-repositories.js';

export interface ContractDetails {
  readonly contract: Contract;
  readonly scopeVersion: ContractScopeVersion;
}

export interface CreateContractProposalCommand {
  readonly commerceActionId: string;
  readonly scope: ContractScope;
  readonly proposalExpiresAt: string;
}

export interface ContractService {
  createProposal(
    command: CreateContractProposalCommand,
    context: ActorContext,
  ): Promise<ContractDetails>;
  getByResultAccessToken(resultAccessToken: string): Promise<ContractDetails>;
  getById(contractId: string, context: ActorContext): Promise<ContractDetails>;
  listCreatorContracts(context: ActorContext): Promise<readonly ContractDetails[]>;
  accept(resultAccessToken: string, correlationId: string): Promise<ContractDetails>;
  reject(resultAccessToken: string, correlationId: string): Promise<ContractDetails>;
  expire(contractId: string, context: ActorContext): Promise<ContractDetails>;
  cancelByResultAccessToken(
    resultAccessToken: string,
    correlationId: string,
  ): Promise<ContractDetails>;
  cancel(
    contractId: string,
    cancelledBy: 'creator' | 'buyer',
    context: ActorContext,
  ): Promise<ContractDetails>;
}

export function createContractService(dependencies: {
  readonly contractRepository: ContractRepository;
  readonly scopeVersionRepository: ContractScopeVersionRepository;
  readonly acceptanceFactRepository: ContractAcceptanceFactRepository;
  readonly commerceActionRepository: CommerceActionRepository;
  readonly offeringRepository: OfferingRepository;
  readonly paidCommerceRepository: PaidCommerceRepository;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
  readonly canonicalEventRecorder: CanonicalEventRecorder;
  readonly unitOfWork: UnitOfWork;
}): ContractService {
  const now = (): string => dependencies.clock.now();

  return {
    createProposal: async (command, context) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const creatorId = requireCreator(context);
        const contractRepository = scope.contractRepository ?? dependencies.contractRepository;
        const scopeVersionRepository =
          scope.contractScopeVersionRepository ?? dependencies.scopeVersionRepository;
        const acceptanceFactRepository =
          scope.contractAcceptanceFactRepository ?? dependencies.acceptanceFactRepository;
        const actionRepository =
          scope.commerceActionRepository ?? dependencies.commerceActionRepository;
        const offeringRepository = scope.offeringRepository ?? dependencies.offeringRepository;
        const action = await actionRepository.findById(command.commerceActionId);
        if (
          action === undefined ||
          action.creatorId !== creatorId ||
          action.state !== 'submitted'
        ) {
          throw conflict(
            'contract_request_not_proposable',
            'A submitted owned Buyer Request is required.',
          );
        }
        const offering = await offeringRepository.findById(action.offeringId);
        if (offering === undefined || offering.creatorId !== creatorId) {
          throw conflict('contract_offering_not_found', 'Contract Proposal requires its Offering.');
        }
        const existing = await contractRepository.findByCommerceActionId(action.id);
        if (existing !== undefined) {
          const existingScope = await requireScopeVersion(
            scopeVersionRepository,
            existing.currentScopeVersionId,
          );
          assertProposalReplay(existing, existingScope, command);
          return { contract: existing, scopeVersion: existingScope };
        }
        const contract = createContract({
          id: dependencies.idGenerator.generate(),
          commerceActionId: action.id,
          creatorId,
          buyerId: action.customerId,
          offeringId: offering.id,
          resultAccessToken: action.resultAccessToken,
        });
        const scopeVersion = createContractScopeVersion({
          id: dependencies.idGenerator.generate(),
          contractId: contract.id,
          version: 1,
          scope: command.scope,
          createdAt: now(),
          createdBy: creatorId,
        });
        const proposed = proposeContract(contract, {
          scopeVersionId: scopeVersion.id,
          proposedAt: now(),
          proposalExpiresAt: command.proposalExpiresAt,
        });
        await scopeVersionRepository.append(scopeVersion);
        await contractRepository.save(proposed);
        await acceptanceFactRepository.appendAcceptanceFact(
          createContractAcceptanceFact({
            id: `contract-acceptance:${proposed.id}:${scopeVersion.id}:${creatorId}`,
            contractId: proposed.id,
            scopeVersionId: scopeVersion.id,
            actorId: creatorId,
            actorKind: 'creator',
            acceptedAt: proposed.proposedAt as string,
          }),
        );
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: creatorId,
            correlationId: context.correlationId,
            name: 'contract_proposed',
            objectId: proposed.id,
            source: 'creator',
            payload: {
              commerceActionId: action.id,
              scopeVersionId: scopeVersion.id,
              proposalExpiresAt: proposed.proposalExpiresAt,
            },
          },
          scope.productEventStore,
        );
        return { contract: proposed, scopeVersion };
      }),

    getByResultAccessToken: async (resultAccessToken) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const repository = scope.contractRepository ?? dependencies.contractRepository;
        const contract = await repository.findByResultAccessToken(resultAccessToken);
        const current = await expireIfRequired(contract, repository, now());
        return requireDetails(
          current,
          scope.contractScopeVersionRepository ?? dependencies.scopeVersionRepository,
        );
      }),

    getById: async (contractId, context) => {
      const contract = await requireContract(dependencies.contractRepository, contractId);
      assertCreator(context, contract.creatorId);
      return requireDetails(contract, dependencies.scopeVersionRepository);
    },

    listCreatorContracts: async (context) => {
      const creatorId = requireCreator(context);
      const contracts = await dependencies.contractRepository.findByCreatorId(creatorId);
      return Promise.all(
        contracts.map((contract) => requireDetails(contract, dependencies.scopeVersionRepository)),
      );
    },

    accept: async (resultAccessToken, correlationId) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const contractRepository = scope.contractRepository ?? dependencies.contractRepository;
        const scopeVersionRepository =
          scope.contractScopeVersionRepository ?? dependencies.scopeVersionRepository;
        const acceptanceFactRepository =
          scope.contractAcceptanceFactRepository ?? dependencies.acceptanceFactRepository;
        const paidCommerceRepository =
          scope.paidCommerceRepository ?? dependencies.paidCommerceRepository;
        const contract = await contractRepository.findByResultAccessToken(resultAccessToken);
        if (contract === undefined) {
          throw notFound('contract_not_found', 'Contract was not found.');
        }
        await contractRepository.lock(contract.id);
        const current = await expireIfRequired(
          await requireContract(contractRepository, contract.id),
          contractRepository,
          now(),
        );
        if (current?.state === 'expired') {
          throw conflict('contract_proposal_expired', 'Contract Proposal has expired.');
        }
        const scopeVersion = await requireScopeVersion(
          scopeVersionRepository,
          current?.currentScopeVersionId,
        );
        if (current?.state === 'contracted') {
          const existingOrder = await paidCommerceRepository.findOrderByContractId(current.id);
          if (existingOrder === undefined) {
            throw conflict(
              'contract_order_missing',
              'Contracted Contract is missing its initial Order.',
            );
          }
          return { contract: current, scopeVersion };
        }
        if (current === undefined) {
          throw notFound('contract_not_found', 'Contract was not found.');
        }
        const accepted = acceptContract(current, {
          acceptedAt: now(),
          acceptedBy: current.buyerId,
        });
        const acceptanceFact = createContractAcceptanceFact({
          id: `contract-acceptance:${accepted.id}:${scopeVersion.id}:${accepted.buyerId}`,
          contractId: accepted.id,
          scopeVersionId: scopeVersion.id,
          actorId: accepted.buyerId,
          actorKind: 'buyer',
          acceptedAt: accepted.acceptedAt as string,
        });
        await acceptanceFactRepository.appendAcceptanceFact(acceptanceFact);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: accepted.buyerId,
            correlationId,
            name: 'contract_accepted',
            objectId: accepted.id,
            source: 'customer',
            payload: { scopeVersionId: scopeVersion.id },
          },
          scope.productEventStore,
        );
        const existingOrder = await paidCommerceRepository.findOrderByContractId(accepted.id);
        const orderId = existingOrder?.id ?? dependencies.idGenerator.generate();
        const contracted = formContract(accepted, { contractedAt: now(), orderId });
        await contractRepository.save(contracted);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: contracted.buyerId,
            correlationId,
            name: 'contract_formed',
            objectId: contracted.id,
            source: 'customer',
            payload: { orderId, scopeVersionId: scopeVersion.id },
          },
          scope.productEventStore,
        );
        if (existingOrder === undefined) {
          const order = beginOrderPayment(
            createPaidServiceOrder({
              id: orderId,
              contractId: accepted.id,
              creatorId: accepted.creatorId,
              customerId: accepted.buyerId,
              offeringId: accepted.offeringId,
              snapshot: {
                offeringTitle: `${scopeVersion.scope.performanceType} engagement`,
                offeringDescription: scopeVersion.scope.deliverables,
                serviceTerms: serializeScope(scopeVersion),
                grossPrice: money(scopeVersion.scope.currency, scopeVersion.scope.priceMinor),
              },
            }),
          );
          await paidCommerceRepository.saveOrder(order);
          await paidCommerceRepository.savePayment(
            createPayment({
              id: dependencies.idGenerator.generate(),
              order,
              correlationId: `order:${order.id}:payment-attempt`,
            }),
          );
          await dependencies.canonicalEventRecorder.record(
            {
              actorId: accepted.buyerId,
              correlationId,
              name: 'order_created',
              objectId: order.id,
              source: 'customer',
              payload: {
                contractId: accepted.id,
                scopeVersionId: scopeVersion.id,
                currency: scopeVersion.scope.currency,
                grossPriceMinor: String(scopeVersion.scope.priceMinor),
              },
            },
            scope.productEventStore,
          );
        }
        return { contract: contracted, scopeVersion };
      }),

    reject: async (resultAccessToken, correlationId) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const repository = scope.contractRepository ?? dependencies.contractRepository;
        const contract = await repository.findByResultAccessToken(resultAccessToken);
        if (contract === undefined) {
          throw notFound('contract_not_found', 'Contract was not found.');
        }
        await repository.lock(contract.id);
        const current = await expireIfRequired(
          await requireContract(repository, contract.id),
          repository,
          now(),
        );
        if (current === undefined) {
          throw notFound('contract_not_found', 'Contract was not found.');
        }
        if (current.state === 'expired') {
          throw conflict('contract_proposal_expired', 'Contract Proposal has expired.');
        }
        const rejected = rejectContract(current, now());
        await repository.save(rejected);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: rejected.buyerId,
            correlationId,
            name: 'contract_rejected',
            objectId: rejected.id,
            source: 'customer',
          },
          scope.productEventStore,
        );
        return requireDetails(
          rejected,
          scope.contractScopeVersionRepository ?? dependencies.scopeVersionRepository,
        );
      }),

    expire: async (contractId, context) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const repository = scope.contractRepository ?? dependencies.contractRepository;
        const contract = await requireContract(repository, contractId);
        assertCreator(context, contract.creatorId);
        await repository.lock(contract.id);
        const expired = expireContract(await requireContract(repository, contract.id), now());
        await repository.save(expired);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: contract.creatorId,
            correlationId: context.correlationId,
            name: 'contract_expired',
            objectId: expired.id,
            source: 'creator',
          },
          scope.productEventStore,
        );
        return requireDetails(
          expired,
          scope.contractScopeVersionRepository ?? dependencies.scopeVersionRepository,
        );
      }),

    cancelByResultAccessToken: async (resultAccessToken, correlationId) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const repository = scope.contractRepository ?? dependencies.contractRepository;
        const contract = await repository.findByResultAccessToken(resultAccessToken);
        if (contract === undefined) {
          throw notFound('contract_not_found', 'Contract was not found.');
        }
        return cancelAndRecord(
          contract,
          'buyer',
          { actorId: contract.buyerId, correlationId },
          repository,
          scope.contractScopeVersionRepository ?? dependencies.scopeVersionRepository,
          scope.productEventStore,
          dependencies,
        );
      }),

    cancel: async (contractId, cancelledBy, context) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const repository = scope.contractRepository ?? dependencies.contractRepository;
        const contract = await requireContract(repository, contractId);
        if (cancelledBy === 'creator') {
          assertCreator(context, contract.creatorId);
        } else if (
          context.actor.kind !== 'customer' ||
          context.actor.customerId !== contract.buyerId
        ) {
          throw forbidden('contract_buyer_not_owned', 'Buyer does not own this Contract.');
        }
        return cancelAndRecord(
          contract,
          cancelledBy,
          {
            actorId: cancelledBy === 'creator' ? contract.creatorId : contract.buyerId,
            correlationId: context.correlationId,
          },
          repository,
          scope.contractScopeVersionRepository ?? dependencies.scopeVersionRepository,
          scope.productEventStore,
          dependencies,
        );
      }),
  };
}

async function expireIfRequired(
  contract: Contract | undefined,
  repository: ContractRepository,
  currentTime: string,
): Promise<Contract | undefined> {
  if (
    contract?.state !== 'proposed' ||
    contract.proposalExpiresAt === undefined ||
    Date.parse(currentTime) < Date.parse(contract.proposalExpiresAt)
  ) {
    return contract;
  }
  const expired = expireContract(contract, currentTime);
  await repository.save(expired);
  return expired;
}

async function cancelAndRecord(
  contract: Contract,
  cancelledBy: 'creator' | 'buyer',
  actor: { readonly actorId: string; readonly correlationId: string },
  repository: ContractRepository,
  scopeRepository: ContractScopeVersionRepository,
  productEventStore: Parameters<CanonicalEventRecorder['record']>[1],
  dependencies: {
    readonly clock: Clock;
    readonly canonicalEventRecorder: CanonicalEventRecorder;
  },
): Promise<ContractDetails> {
  const cancelled = cancelContract(contract, {
    cancelledAt: dependencies.clock.now(),
    cancelledBy,
  });
  await repository.save(cancelled);
  await dependencies.canonicalEventRecorder.record(
    {
      actorId: actor.actorId,
      correlationId: actor.correlationId,
      name: 'contract_cancelled',
      objectId: cancelled.id,
      source: cancelledBy === 'creator' ? 'creator' : 'customer',
      payload: { orderId: cancelled.orderId ?? null },
    },
    productEventStore,
  );
  await dependencies.canonicalEventRecorder.record(
    {
      actorId: actor.actorId,
      correlationId: actor.correlationId,
      name: 'cancellation_recorded',
      objectId: cancelled.orderId ?? cancelled.id,
      source: cancelledBy === 'creator' ? 'creator' : 'customer',
      payload: { contractId: cancelled.id },
    },
    productEventStore,
  );
  return requireDetails(cancelled, scopeRepository);
}

function serializeScope(version: ContractScopeVersion): string {
  const scope = version.scope;
  return [
    `Contract Scope Version: ${version.version}`,
    `Performance Type: ${scope.performanceType}`,
    `Date: ${scope.performanceDate}`,
    `Location: ${scope.location}`,
    `Duration Minutes: ${scope.durationMinutes}`,
    `Creator Headcount: ${scope.creatorHeadcount}`,
    `Deliverables: ${scope.deliverables}`,
    `Cancellation Terms: ${scope.cancellationTerms}`,
    `Fulfillment Criteria: ${scope.fulfillmentCriteria}`,
  ].join('\n');
}

function assertProposalReplay(
  contract: Contract,
  scopeVersion: ContractScopeVersion,
  command: CreateContractProposalCommand,
): void {
  if (
    contract.state !== 'proposed' ||
    contract.proposalExpiresAt !== command.proposalExpiresAt ||
    !sameScope(scopeVersion.scope, command.scope)
  ) {
    throw conflict(
      'contract_proposal_replay_conflict',
      'Contract Proposal conflicts with the existing immutable Scope Version.',
    );
  }
}

function sameScope(left: ContractScope, right: ContractScope): boolean {
  return (
    left.performanceType === right.performanceType &&
    left.performanceDate === right.performanceDate &&
    left.location === right.location &&
    left.durationMinutes === right.durationMinutes &&
    left.creatorHeadcount === right.creatorHeadcount &&
    left.deliverables === right.deliverables &&
    left.priceMinor === right.priceMinor &&
    left.currency === right.currency &&
    left.cancellationTerms === right.cancellationTerms &&
    left.fulfillmentCriteria === right.fulfillmentCriteria
  );
}

async function requireDetails(
  contract: Contract | undefined,
  scopeRepository: ContractScopeVersionRepository,
): Promise<ContractDetails> {
  if (contract === undefined) {
    throw notFound('contract_not_found', 'Contract was not found.');
  }
  return {
    contract,
    scopeVersion: await requireScopeVersion(scopeRepository, contract.currentScopeVersionId),
  };
}

async function requireContract(
  repository: ContractRepository,
  contractId: string,
): Promise<Contract> {
  const contract = await repository.findById(contractId);
  if (contract === undefined) {
    throw notFound('contract_not_found', 'Contract was not found.');
  }
  return contract;
}

async function requireScopeVersion(
  repository: ContractScopeVersionRepository,
  scopeVersionId: string | undefined,
): Promise<ContractScopeVersion> {
  if (scopeVersionId === undefined) {
    throw conflict('contract_scope_missing', 'Contract Scope Version is missing.');
  }
  const scopeVersion = await repository.findVersionById(scopeVersionId);
  if (scopeVersion === undefined) {
    throw conflict('contract_scope_missing', 'Contract Scope Version was not found.');
  }
  return scopeVersion;
}

function requireCreator(context: ActorContext): string {
  if (context.actor.kind !== 'creator') {
    throw forbidden('creator_required', 'Creator authentication is required.');
  }
  return context.actor.creatorId;
}

function assertCreator(context: ActorContext, creatorId: string): void {
  if (requireCreator(context) !== creatorId) {
    throw forbidden('contract_creator_not_owned', 'Creator does not own this Contract.');
  }
}

function conflict(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'conflict', code, message });
}

function forbidden(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'authorization', code, message });
}

function notFound(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'not_found', code, message });
}
