import type { Actor } from '../../modules/shared/actors.js';

import { ApplicationError } from './application-error.js';

export interface ActorContext {
  readonly actor: Actor;
  readonly accountId?: string;
  readonly correlationId: string;
}

export function createActorContext(context: ActorContext): ActorContext {
  if (context.correlationId.trim().length === 0) {
    throw new ApplicationError({
      category: 'validation',
      code: 'missing_correlation_id',
      message: 'Actor context requires a correlation id.',
    });
  }

  return Object.freeze({
    actor: Object.freeze({ ...context.actor }),
    ...(context.accountId === undefined ? {} : { accountId: context.accountId }),
    correlationId: context.correlationId,
  });
}
