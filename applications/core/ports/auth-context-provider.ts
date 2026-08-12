import { createActorContext, type ActorContext } from '../actor-context.js';
import type { Actor } from '../../../modules/shared/actors.js';
import { ApplicationError } from '../application-error.js';

export interface ProviderIdentity {
  readonly provider: 'supabase';
  readonly subject: string;
}

export interface AuthContextRequest {
  readonly accessToken: string;
  readonly correlationId: string;
}

export interface ProviderTokenVerifier {
  verifyAccessToken(accessToken: string): Promise<ProviderIdentity>;
}

export interface CreatorActorResolver {
  resolveCreatorId(identity: ProviderIdentity): Promise<string | undefined>;
}

export interface AuthContextProvider {
  resolveActorContext(request: AuthContextRequest): Promise<ActorContext>;
}

export interface AuthContextProviderDependencies {
  readonly tokenVerifier: ProviderTokenVerifier;
  readonly creatorActorResolver: CreatorActorResolver;
}

export function createAuthContextProvider(
  dependencies: AuthContextProviderDependencies,
): AuthContextProvider {
  return {
    async resolveActorContext(request) {
      const identity = await dependencies.tokenVerifier.verifyAccessToken(request.accessToken);
      const creatorId = await dependencies.creatorActorResolver.resolveCreatorId(identity);

      if (creatorId === undefined) {
        throw new ApplicationError({
          category: 'authentication',
          code: 'creator_actor_not_mapped',
          message: 'Authenticated identity is not mapped to a Creator.',
        });
      }

      const actor: Actor = {
        kind: 'creator',
        creatorId,
      };

      return createActorContext({
        actor,
        correlationId: request.correlationId,
      });
    },
  };
}
