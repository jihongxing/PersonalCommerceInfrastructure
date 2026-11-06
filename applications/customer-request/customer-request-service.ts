import type { IFulfillmentCodeRepository } from '../fulfillment/fulfillment-repositories.js';
import { confirmFulfillmentUseCase, type ConfirmFulfillmentResult } from '../fulfillment/confirm-fulfillment-use-case.js';
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
      return confirmFulfillmentUseCase(
        {
          fulfillmentCodeRepository: dependencies.fulfillmentCodeRepository,
          commerceActionRepository: dependencies.commerceActionRepository,
        },
        {
          actionId,
          fulfillmentCode,
          creatorId: context.actor.creatorId,
        },
      );
    },
  };
}
