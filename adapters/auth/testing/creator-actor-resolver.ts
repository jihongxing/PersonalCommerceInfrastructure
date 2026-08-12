import type {
  CreatorActorResolver,
  ProviderIdentity,
} from '../../../applications/core/ports/auth-context-provider.js';

export class InMemoryCreatorActorResolver implements CreatorActorResolver {
  public constructor(private readonly mappings: ReadonlyMap<string, string>) {}

  public resolveCreatorId(identity: ProviderIdentity): Promise<string | undefined> {
    return Promise.resolve(this.mappings.get(`${identity.provider}:${identity.subject}`));
  }
}
