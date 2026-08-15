import type { ActorContext } from '../actor-context.js';

export interface OperationsAuthContextProvider {
  resolveActorContext(request: {
    readonly accessToken: string;
    readonly correlationId: string;
  }): Promise<ActorContext>;
}
