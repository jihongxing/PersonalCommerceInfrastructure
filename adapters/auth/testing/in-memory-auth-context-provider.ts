import {
  createAccountContext,
  type AccountContext,
} from '../../../applications/core/account-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type {
  AuthContextProvider,
  AuthContextRequest,
} from '../../../applications/core/ports/auth-context-provider.js';
import { createActorContext } from '../../../applications/core/actor-context.js';
import type { Actor } from '../../../modules/shared/actors.js';

export interface TestAuthIdentity {
  readonly accessToken: string;
  readonly actor: Actor;
}

export class InMemoryAuthContextProvider implements AuthContextProvider {
  private readonly identities: ReadonlyMap<string, Actor>;

  public constructor(identities: readonly TestAuthIdentity[]) {
    this.identities = new Map(identities.map((identity) => [identity.accessToken, identity.actor]));
  }

  public resolveAccountContext(request: AuthContextRequest): Promise<AccountContext> {
    if (!this.identities.has(request.accessToken)) {
      return Promise.reject(
        new ApplicationError({
          category: 'authentication',
          code: 'invalid_access_token',
          message: 'Authentication could not be verified.',
        }),
      );
    }

    return Promise.resolve(
      createAccountContext({
        accountId: `test:${request.accessToken}`,
        correlationId: request.correlationId,
      }),
    );
  }

  public resolveActorContext(request: AuthContextRequest) {
    const actor = this.identities.get(request.accessToken);

    if (actor === undefined) {
      return Promise.reject(
        new ApplicationError({
          category: 'authentication',
          code: 'invalid_access_token',
          message: 'Authentication could not be verified.',
        }),
      );
    }

    return Promise.resolve(
      createActorContext({
        actor,
        correlationId: request.correlationId,
      }),
    );
  }
}
