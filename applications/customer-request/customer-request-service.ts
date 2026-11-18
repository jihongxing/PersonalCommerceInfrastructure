import type { IFulfillmentCodeRepository } from '../fulfillment/fulfillment-repositories.js';
import {
  confirmFulfillmentUseCase,
  type ConfirmFulfillmentResult,
} from '../fulfillment/confirm-fulfillment-use-case.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { NotificationPort } from '../core/ports/notification-port.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../creator-identity/creator-identity-repositories.js';
import type { OfferingRepository } from '../service-offering/offering-repositories.js';
import type { CommerceAction } from '../../modules/customer-request/commerce-action.js';
import type {
  CommerceActionRepository,
  CustomerRepository,
} from './customer-request-repositories.js';
import {
  DecideCustomerRequestUseCase,
  GetCreatorSubmittedRequestsUseCase,
  GetCreatorConfirmedRequestsUseCase,
  GetCustomerRequestResultUseCase,
  GetPublicOfferingUseCase,
  SubmitCustomerRequestUseCase,
  type CreatorRequestDetails,
  type CreatorConfirmedRequestDetails,
  type CustomerResult,
  type PublicOfferingDetails,
  type PublicRequestContext,
  type SubmitCustomerRequestCommand,
} from './customer-request-use-cases.js';
import type { ActorContext } from '../core/actor-context.js';
import type { ContractRepository } from '../contract-commerce/contract-repositories.js';
import type { ServicePolicyCatalogRepository } from '../service-policy/service-policy-repositories.js';
import type { ServiceIntakeReader } from '../operations-admin/scenario-operations.js';

export interface CustomerRequestService {
  getPublicOffering(
    offeringId: string,
    context: PublicRequestContext,
  ): Promise<PublicOfferingDetails>;
  submit(
    command: SubmitCustomerRequestCommand,
    context: PublicRequestContext,
  ): Promise<CommerceAction>;
  listCreatorSubmittedRequests(context: ActorContext): Promise<readonly CreatorRequestDetails[]>;
  listCreatorConfirmedRequests(
    context: ActorContext,
  ): Promise<readonly CreatorConfirmedRequestDetails[]>;
  confirm(actionId: string, context: ActorContext): Promise<CommerceAction>;
  decline(actionId: string, context: ActorContext): Promise<CommerceAction>;
  getResult(token: string): Promise<CustomerResult>;
  confirmFulfillment(
    actionId: string,
    fulfillmentCode: string,
    context: ActorContext,
  ): Promise<ConfirmFulfillmentResult>;
}

export function createCustomerRequestService(dependencies: {
  readonly identityRepository: CommerceIdentityRepository;
  readonly capabilityRepository: CapabilityRepository;
  readonly offeringRepository: OfferingRepository;
  readonly customerRepository: CustomerRepository;
  readonly commerceActionRepository: CommerceActionRepository;
  readonly fulfillmentCodeRepository: IFulfillmentCodeRepository;
  readonly idGenerator: IdGenerator;
  readonly canonicalEventRecorder: CanonicalEventRecorder;
  readonly notificationPort: NotificationPort;
  readonly unitOfWork: UnitOfWork;
  readonly servicePolicyCatalogRepository: ServicePolicyCatalogRepository;
  readonly serviceIntake?: ServiceIntakeReader;
  readonly contractRepository?: ContractRepository;
}): CustomerRequestService {
  const getPublicOffering = new GetPublicOfferingUseCase(dependencies);
  const submit = new SubmitCustomerRequestUseCase(dependencies);
  const listCreatorSubmittedRequests = new GetCreatorSubmittedRequestsUseCase(dependencies);
  const listCreatorConfirmedRequests = new GetCreatorConfirmedRequestsUseCase(dependencies);
  const confirm = new DecideCustomerRequestUseCase(dependencies, 'confirm');
  const decline = new DecideCustomerRequestUseCase(dependencies, 'decline');
  const getResult = new GetCustomerRequestResultUseCase(dependencies);

  return {
    getPublicOffering: (offeringId, context) => getPublicOffering.execute(offeringId, context),
    submit: (command, context) => submit.execute(command, context),
    listCreatorSubmittedRequests: (context) => listCreatorSubmittedRequests.execute(context),
    listCreatorConfirmedRequests: (context) => listCreatorConfirmedRequests.execute(context),
    confirm: (actionId, context) => confirm.execute(actionId, context),
    decline: (actionId, context) => decline.execute(actionId, context),
    getResult: (token) => getResult.execute(token),
    confirmFulfillment: (actionId, fulfillmentCode, context) => {
      if (context.actor.kind !== 'creator') {
        throw new Error('Only creators can confirm fulfillment');
      }
      const creatorId = context.actor.creatorId;
      return dependencies.unitOfWork.execute(async (scope) =>
        confirmFulfillmentUseCase(
          {
            // PostgreSQL supplies both repositories from the transaction callback. The
            // fallback keeps lightweight compositions that do not expose a scoped
            // repository compatible while ensuring the production path never uses the
            // outer, non-transactional repositories.
            fulfillmentCodeRepository:
              scope.fulfillmentCodeRepository ?? dependencies.fulfillmentCodeRepository,
            commerceActionRepository:
              scope.commerceActionRepository ?? dependencies.commerceActionRepository,
          },
          {
            actionId,
            fulfillmentCode,
            creatorId,
          },
        ),
      );
    },
  };
}
