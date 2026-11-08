import type { IdentityReferenceRepository } from '../../applications/canonical-commerce-reference/identity-commerce-reference-service.js';
import type {
  CommerceReference,
  InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';

export class InMemoryIdentityCommerceReferenceRepository implements IdentityReferenceRepository {
  private readonly references = new Map<InternalIdentityId, CommerceReference>();

  find(identityId: InternalIdentityId): Promise<CommerceReference | undefined> {
    return Promise.resolve(this.references.get(identityId));
  }

  tryAssign(identityId: InternalIdentityId, reference: CommerceReference): Promise<boolean> {
    if (this.references.has(identityId) || [...this.references.values()].includes(reference))
      return Promise.resolve(false);
    this.references.set(identityId, reference);
    return Promise.resolve(true);
  }
}
