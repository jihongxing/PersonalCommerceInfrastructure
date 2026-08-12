import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { CommerceActionRepository } from '../customer-request/customer-request-repositories.js';

export type ExternalObservationType = 'external_paid_verified' | 'fulfillment_observed';

export interface RecordExternalObservationCommand {
  readonly actionId: string;
  readonly type: ExternalObservationType;
  readonly evidenceReference: string;
}

export class RecordExternalObservationUseCase {
  public constructor(
    private readonly dependencies: {
      readonly commerceActionRepository: CommerceActionRepository;
      readonly canonicalEventRecorder: CanonicalEventRecorder;
    },
  ) {}

  public async execute(
    command: RecordExternalObservationCommand,
    context: ActorContext,
  ): Promise<void> {
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

    const action = await this.dependencies.commerceActionRepository.findById(command.actionId);
    if (action === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'commerce_action_not_found',
        message: 'Commerce Action not found.',
      });
    }

    await this.dependencies.canonicalEventRecorder.record({
      actorId: context.actor.operatorId,
      correlationId: context.correlationId,
      name: command.type,
      objectId: action.id,
      source: 'pilot_operations',
      payload: {
        evidenceReference: command.evidenceReference.trim(),
      },
    });
  }
}
