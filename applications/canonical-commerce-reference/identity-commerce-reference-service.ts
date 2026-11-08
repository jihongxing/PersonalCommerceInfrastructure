import {
  createInternalIdentityId,
  type CommerceReference,
  type InternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import type { CommerceReferenceGenerator } from './commerce-reference-generator.js';

export interface IdentityReferenceRepository {
  find(identityId: InternalIdentityId): Promise<CommerceReference | undefined>;
  tryAssign(
    identityId: InternalIdentityId,
    reference: CommerceReference,
    assignedAt: string,
  ): Promise<boolean>;
}

export function createIdentityCommerceReferenceService(
  repository: IdentityReferenceRepository,
  generator: CommerceReferenceGenerator,
) {
  return {
    async find(identityId: string): Promise<CommerceReference | undefined> {
      return repository.find(createInternalIdentityId(identityId));
    },
    async ensure(identityId: string): Promise<CommerceReference> {
      const owner = createInternalIdentityId(identityId);
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const existing = await repository.find(owner);
        if (existing !== undefined) return existing;
        const candidate = generator.generate();
        if (await repository.tryAssign(owner, candidate, new Date().toISOString()))
          return candidate;
      }
      const existing = await repository.find(owner);
      if (existing !== undefined) return existing;
      throw new Error('Commerce Reference allocation failed after repeated collisions.');
    },
  };
}

export type IdentityCommerceReferenceService = ReturnType<
  typeof createIdentityCommerceReferenceService
>;
