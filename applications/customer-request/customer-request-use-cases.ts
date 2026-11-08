import { FulfillmentCode } from '../../domain/fulfillment-code.js';
import type { IFulfillmentCodeRepository } from '../fulfillment/fulfillment-repositories.js';
import {
  createCustomer,
  createDraftCommerceAction,
  submitCommerceAction,
  type CommerceAction,
  type CustomerRequestInput,
} from '../../modules/customer-request/commerce-action.js';
import {
  confirmCommerceAction,
  declineCommerceAction,
} from '../../modules/commerce-decision/commerce-decision.js';
import { ApplicationError } from '../core/application-error.js';
import { deliverBestEffortNotification } from '../core/best-effort-notification.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { NotificationPort } from '../core/ports/notification-port.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type { ContractRepository } from '../contract-commerce/contract-repositories.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../creator-identity/creator-identity-repositories.js';
import type { OfferingRepository } from '../service-offering/offering-repositories.js';
import type { AppearanceOfferingMetadata } from '../../modules/service-offering/offering.js';
import { assertCreatorOwnership } from '../../modules/shared/actors.js';
import { DomainTransitionError } from '../../modules/shared/domain-error.js';
import type { ActorContext } from '../core/actor-context.js';
import type {
  CommerceActionRepository,
  CustomerRepository,
} from './customer-request-repositories.js';

export interface PublicRequestContext {
  readonly correlationId: string;
}

export interface SubmitCustomerRequestCommand extends CustomerRequestInput {
  readonly offeringId: string;
}

export interface PublicOfferingDetails {
  readonly creator: {
    readonly displayName: string;
    readonly bio: string;
    readonly capabilityNames: readonly string[];
  };
  readonly offering: {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly availabilityDescription: string;
    readonly appearance?: AppearanceOfferingMetadata;
    readonly requestInstructions: string;
  };
}

export interface CustomerRequestUseCaseDependencies {
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
}

export interface CreatorRequestDetails {
  readonly action: CommerceAction;
  readonly customer: {
    readonly id: string;
    readonly contactName: string;
    readonly contactMethod: string;
  };
  readonly offering: {
    readonly id: string;
    readonly title: string;
  };
}

export interface CreatorConfirmedRequestDetails {
  readonly action: CommerceAction;
  readonly customer: {
    readonly id: string;
    readonly contactName: string;
    readonly contactMethod: string;
  };
  readonly offering: {
    readonly id: string;
    readonly title: string;
  };
}

export interface CustomerResult {
  readonly actionId: string;
  readonly state: CommerceAction['state'];
  readonly message: string;
  readonly fulfillmentCode?: {
    readonly code: string;
    readonly status: 'pending' | 'fulfilled' | 'expired';
    readonly expiresAt: string;
    readonly confirmedAt?: string;
  };
}

export class GetPublicOfferingUseCase {
  public constructor(private readonly dependencies: CustomerRequestUseCaseDependencies) {}

  public async execute(
    offeringId: string,
    context: PublicRequestContext,
  ): Promise<PublicOfferingDetails> {
    const offering = await requireRequestableOffering(
      offeringId,
      this.dependencies.offeringRepository,
    );
    const identity = await this.dependencies.identityRepository.findById(offering.creatorId);

    if (identity === undefined || identity.state !== 'published') {
      throw unavailableOffering();
    }
    const capabilities = await Promise.all(
      offering.capabilityIds.map((capabilityId) =>
        this.dependencies.capabilityRepository.findById(capabilityId),
      ),
    );

    const details = {
      creator: {
        displayName: identity.profile.displayName,
        bio: identity.profile.bio,
        capabilityNames: capabilities.flatMap((capability) =>
          capability === undefined ? [] : [capability.name],
        ),
      },
      offering: {
        id: offering.id,
        title: offering.title,
        description: offering.description,
        availabilityDescription: offering.availability?.description ?? '',
        ...(offering.appearance === undefined ? {} : { appearance: offering.appearance }),
        requestInstructions: offering.requestInstructions,
      },
    };
    await this.dependencies.canonicalEventRecorder.record({
      actorId: context.correlationId,
      correlationId: context.correlationId,
      name: 'storefront_viewed',
      objectId: identity.creatorId,
      source: 'customer',
    });
    return details;
  }
}

export class SubmitCustomerRequestUseCase {
  public constructor(private readonly dependencies: CustomerRequestUseCaseDependencies) {}

  public async execute(
    command: SubmitCustomerRequestCommand,
    context: PublicRequestContext,
  ): Promise<CommerceAction> {
    const input = normalizeRequestInput(command);
    const offering = await requireRequestableOffering(
      command.offeringId,
      this.dependencies.offeringRepository,
    );

    const action = await this.dependencies.unitOfWork.execute(async (scope) => {
      const customerRepository = scope.customerRepository ?? this.dependencies.customerRepository;
      const commerceActionRepository =
        scope.commerceActionRepository ?? this.dependencies.commerceActionRepository;
      const existingCustomer = await customerRepository.findByContactMethod(input.contactMethod);
      const customer =
        existingCustomer ??
        createCustomer(this.dependencies.idGenerator.generate(), {
          contactName: input.contactName,
          contactMethod: input.contactMethod,
        });

      if (
        await commerceActionRepository.findSubmittedByCustomerAndOffering(customer.id, offering.id)
      ) {
        throw new ApplicationError({
          category: 'conflict',
          code: 'duplicate_unresolved_customer_request',
          message: 'A Request for this Offering is already waiting for the Creator.',
        });
      }

      const action = submitCommerceAction(
        createDraftCommerceAction(
          this.dependencies.idGenerator.generate(),
          customer.id,
          offering.creatorId,
          offering.id,
          input.requestMessage,
          this.dependencies.idGenerator.generate(),
        ),
      );

      if (existingCustomer === undefined) {
        await customerRepository.save(customer);
      }
      await commerceActionRepository.save(action);
      
      // Generate fulfillment code for offline service verification
      const fulfillmentCode = FulfillmentCode.generate(action.id);
      await (scope.fulfillmentCodeRepository ?? this.dependencies.fulfillmentCodeRepository).save(
        fulfillmentCode,
      );
      
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: customer.id,
          correlationId: context.correlationId,
          name: 'commerce_action_submitted',
          objectId: action.id,
          source: 'customer',
        },
        scope.productEventStore,
      );
      return action;
    });

    await deliverBestEffortNotification(this.dependencies.notificationPort, {
      kind: 'creator_request_submitted',
      recipientCreatorId: action.creatorId,
      actionId: action.id,
      offeringId: offering.id,
      offeringTitle: offering.title,
    });
    return action;
  }
}

export class GetCreatorSubmittedRequestsUseCase {
  public constructor(private readonly dependencies: CustomerRequestUseCaseDependencies) {}

  public async execute(context: ActorContext): Promise<readonly CreatorRequestDetails[]> {
    const creatorId = creatorIdFromContext(context);
    const actions = (
      await this.dependencies.commerceActionRepository.findByOwnerId(creatorId)
    ).filter((action) => action.state === 'submitted');

    return Promise.all(
      actions.map(async (action) => {
        const customer = await this.dependencies.customerRepository.findById(action.customerId);
        const offering = await this.dependencies.offeringRepository.findById(action.offeringId);
        if (customer === undefined || offering === undefined) {
          throw new ApplicationError({
            category: 'internal',
            code: 'customer_request_context_missing',
            message: 'Submitted Request context is incomplete.',
          });
        }
        return {
          action,
          customer,
          offering: { id: offering.id, title: offering.title },
        };
      }),
    );
  }
}

export class GetCreatorConfirmedRequestsUseCase {
  public constructor(private readonly dependencies: CustomerRequestUseCaseDependencies) {}

  public async execute(context: ActorContext): Promise<readonly CreatorConfirmedRequestDetails[]> {
    if (context.actor.kind !== 'creator') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'creator_confirmed_requests_requires_creator',
        message: 'Confirmed Requests are available only to the owning Creator.',
      });
    }

    const actions = await this.dependencies.commerceActionRepository.findByOwnerId(
      context.actor.creatorId,
    );
    const confirmedActions = actions.filter((action) => action.state === 'confirmed');

    return Promise.all(
      confirmedActions.map(async (action) => {
        const [customer, offering] = await Promise.all([
          this.dependencies.customerRepository.findById(action.customerId),
          this.dependencies.offeringRepository.findById(action.offeringId),
        ]);
        if (
          customer === undefined ||
          offering === undefined ||
          offering.creatorId !== action.creatorId
        ) {
          throw new ApplicationError({
            category: 'conflict',
            code: 'confirmed_request_references_unavailable',
            message: 'Confirmed Request references are unavailable.',
          });
        }

        return {
          action,
          customer: {
            id: customer.id,
            contactName: customer.contactName,
            contactMethod: customer.contactMethod,
          },
          offering: { id: offering.id, title: offering.title },
        };
      }),
    );
  }
}

export class DecideCustomerRequestUseCase {
  public constructor(
    private readonly dependencies: CustomerRequestUseCaseDependencies,
    private readonly decision: 'confirm' | 'decline',
  ) {}

  public async execute(actionId: string, context: ActorContext): Promise<CommerceAction> {
    const creatorId = creatorIdFromContext(context);
    const decisionResult = await this.dependencies.unitOfWork.execute(async (scope) => {
      const actionRepository =
        scope.commerceActionRepository ?? this.dependencies.commerceActionRepository;
      const action = await actionRepository.findById(actionId);
      if (action === undefined) {
        throw new ApplicationError({
          category: 'not_found',
          code: 'commerce_action_not_found',
          message: 'Commerce Action not found.',
        });
      }
      if (action.creatorId !== creatorId) {
        throw new ApplicationError({
          category: 'authorization',
          code: 'commerce_action_not_owned',
          message: 'Commerce Action does not belong to the authenticated Creator.',
        });
      }
      const contractRepository = scope.contractRepository ?? this.dependencies.contractRepository;
      if (
        contractRepository !== undefined &&
        (await contractRepository.findByCommerceActionId(action.id)) !== undefined
      ) {
        throw new ApplicationError({
          category: 'conflict',
          code: 'commerce_action_assigned_to_contract',
          message: 'This Buyer Request is already governed by Contract Commerce.',
        });
      }

      let updated: CommerceAction;
      try {
        updated =
          this.decision === 'confirm'
            ? confirmCommerceAction(action, creatorId)
            : declineCommerceAction(action, creatorId);
      } catch (error) {
        if (error instanceof DomainTransitionError) {
          throw alreadyDecided();
        }
        throw error;
      }

      if (!(await actionRepository.saveTerminalDecision(updated))) {
        throw alreadyDecided();
      }
      const customer = await (
        scope.customerRepository ?? this.dependencies.customerRepository
      ).findById(updated.customerId);
      if (customer === undefined) {
        throw new ApplicationError({
          category: 'internal',
          code: 'customer_request_context_missing',
          message: 'Customer Request context is incomplete.',
        });
      }
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: creatorId,
          correlationId: context.correlationId,
          name: this.decision === 'confirm' ? 'commerce_confirmed' : 'commerce_declined',
          objectId: updated.id,
          source: 'creator',
        },
        scope.productEventStore,
      );
      return { updated, customer };
    });

    await deliverBestEffortNotification(this.dependencies.notificationPort, {
      kind:
        this.decision === 'confirm' ? 'customer_request_confirmed' : 'customer_request_declined',
      recipientCustomerId: decisionResult.customer.id,
      contactMethod: decisionResult.customer.contactMethod,
      actionId: decisionResult.updated.id,
      resultAccessToken: decisionResult.updated.resultAccessToken,
    });
    return decisionResult.updated;
  }
}

export class GetCustomerRequestResultUseCase {
  public constructor(private readonly dependencies: CustomerRequestUseCaseDependencies) {}

  public async execute(token: string): Promise<CustomerResult> {
    const action = await this.dependencies.commerceActionRepository.findByResultAccessToken(token);
    if (action === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'customer_request_result_not_found',
        message: 'Customer Request result not found.',
      });
    }

    const messageByState: Record<CommerceAction['state'], string> = {
      draft: 'Your Request is being prepared.',
      submitted: 'Your Request was submitted and is waiting for the Creator.',
      confirmed:
        "Your Request was confirmed by the Creator. This status records only the Creator's response to your Request.",
      declined:
        "Your Request was declined by the Creator. This status records only the Creator's response to your Request.",
    };

    // Fetch fulfillment code if exists
    const fulfillmentCode = await this.dependencies.fulfillmentCodeRepository.findByActionId(
      action.id,
    );

    return {
      actionId: action.id,
      state: action.state,
      message: messageByState[action.state],
      ...(fulfillmentCode
        ? {
            fulfillmentCode: {
              code: fulfillmentCode.getCode(),
              status: fulfillmentCode.getStatus() === 'pending' && fulfillmentCode.isExpired()
                ? 'expired' as const
                : fulfillmentCode.getStatus(),
              expiresAt: fulfillmentCode.getExpiresAt().toISOString(),
              ...(fulfillmentCode.getFulfilledAt() === undefined
                ? {}
                : { confirmedAt: fulfillmentCode.getFulfilledAt()!.toISOString() }),
            },
          }
        : {}),
    };
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

function normalizeRequestInput(command: SubmitCustomerRequestCommand): CustomerRequestInput {
  const input = {
    contactName: command.contactName.trim(),
    contactMethod: command.contactMethod.trim(),
    requestMessage: command.requestMessage.trim(),
  };

  if (
    input.contactName.length === 0 ||
    input.contactMethod.length === 0 ||
    input.requestMessage.length === 0
  ) {
    throw new ApplicationError({
      category: 'validation',
      code: 'customer_request_information_missing',
      message: 'Customer contact and Request information are required.',
    });
  }

  return input;
}

async function requireRequestableOffering(
  offeringId: string,
  offeringRepository: OfferingRepository,
) {
  const offering = await offeringRepository.findById(offeringId);

  if (offering === undefined || offering.state !== 'published') {
    throw unavailableOffering();
  }

  return offering;
}

function unavailableOffering(): ApplicationError {
  return new ApplicationError({
    category: 'unavailable',
    code: 'service_offering_unavailable',
    message: 'This Service Offering is not available for Requests.',
  });
}

function alreadyDecided(): ApplicationError {
  return new ApplicationError({
    category: 'conflict',
    code: 'commerce_action_already_decided',
    message: 'Commerce Action has already reached a terminal decision.',
  });
}
