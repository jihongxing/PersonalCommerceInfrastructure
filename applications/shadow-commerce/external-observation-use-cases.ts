import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { CommerceActionRepository } from '../customer-request/customer-request-repositories.js';
import type { CanonicalEvent } from '../../modules/product-facts/canonical-events.js';
import type { ExternalObservationStore } from './external-observation-store.js';

export type ExternalObservationType = 'external_paid_verified' | 'fulfillment_observed';

export interface RecordExternalObservationCommand {
  readonly actionId: string;
  readonly type: ExternalObservationType;
  readonly evidenceReference: string;
  readonly occurredAt: string;
}

export class RecordExternalObservationUseCase {
  public constructor(
    private readonly dependencies: {
      readonly commerceActionRepository: CommerceActionRepository;
      readonly canonicalEventRecorder: CanonicalEventRecorder;
      readonly productEventStore: ExternalObservationStore;
    },
  ) {}

  public async execute(
    command: RecordExternalObservationCommand,
    context: ActorContext,
  ): Promise<CanonicalEvent> {
    if (context.actor.kind !== 'pilot_operations') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'pilot_operations_actor_required',
        message: 'A Pilot Operations actor is required.',
      });
    }
    if (command.evidenceReference.trim().length === 0) {
      throw new ApplicationError({
        category: 'validation',
        code: 'external_observation_evidence_required',
        message: 'A verifiable evidence reference is required.',
      });
    }
    if (Number.isNaN(Date.parse(command.occurredAt))) {
      throw new ApplicationError({
        category: 'validation',
        code: 'external_observation_occurred_at_invalid',
        message: 'External observation occurredAt must be a valid timestamp.',
      });
    }

    const action = await this.dependencies.commerceActionRepository.findById(command.actionId);
    if (action === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'commerce_action_not_found',
        message: 'Commerce Action not found.',
      });
    }
    if (action.state !== 'confirmed') {
      throw new ApplicationError({
        category: 'conflict',
        code: 'external_observation_requires_confirmed_action',
        message: 'External observations require a Confirmed Commerce Action.',
      });
    }

    const existing = await this.dependencies.productEventStore.findByNameAndObjectId(
      command.type,
      action.id,
    );
    if (existing !== undefined) {
      return existing;
    }

    if (command.type === 'fulfillment_observed') {
      const payment = await this.dependencies.productEventStore.findByNameAndObjectId(
        'external_paid_verified',
        action.id,
      );
      if (payment === undefined) {
        throw new ApplicationError({
          category: 'conflict',
          code: 'fulfillment_requires_external_payment',
          message: 'Fulfillment observation requires a recorded external payment fact.',
        });
      }
    }

    return this.dependencies.canonicalEventRecorder.record({
      actorId: context.actor.operatorId,
      correlationId: context.correlationId,
      name: command.type,
      objectId: action.id,
      source: 'pilot_operations',
      payload: {
        evidenceReference: command.evidenceReference.trim(),
        occurredAt: new Date(command.occurredAt).toISOString(),
      },
    });
  }
}
