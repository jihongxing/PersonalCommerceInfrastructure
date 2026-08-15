import { timingSafeEqual } from 'node:crypto';

import { createActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';

export interface OperationsAuthConfiguration {
  readonly accessToken: string;
  readonly operatorId: string;
}

export class StaticOperationsAuthContextProvider implements OperationsAuthContextProvider {
  public constructor(private readonly configuration: OperationsAuthConfiguration) {}

  public resolveActorContext(request: {
    readonly accessToken: string;
    readonly correlationId: string;
  }): Promise<ReturnType<typeof createActorContext>> {
    const provided = Buffer.from(request.accessToken);
    const expected = Buffer.from(this.configuration.accessToken);
    const verified = provided.length === expected.length && timingSafeEqual(provided, expected);

    if (!verified) {
      throw new ApplicationError({
        category: 'authentication',
        code: 'invalid_operations_access_token',
        message: 'Operations authentication could not be verified.',
      });
    }

    return Promise.resolve(
      createActorContext({
        actor: {
          kind: 'pilot_operations',
          operatorId: this.configuration.operatorId,
        },
        correlationId: request.correlationId,
      }),
    );
  }
}
