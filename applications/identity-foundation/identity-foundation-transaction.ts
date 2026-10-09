import type { CommerceProfileRepository } from '../../modules/identity-infrastructure/commerce-profile-repository.js';
import type { CommerceReferenceRepository } from '../../modules/identity-infrastructure/commerce-reference-repository.js';
import type { CommerceRelationshipRepository } from '../../modules/identity-infrastructure/commerce-relationship-repository.js';

export interface IdentityFoundationTransactionScope {
  readonly commerceProfileRepository: CommerceProfileRepository;
  readonly commerceReferenceRepository: CommerceReferenceRepository;
  readonly commerceRelationshipRepository: CommerceRelationshipRepository;
}

export interface IdentityFoundationTransaction {
  execute<Result>(
    operation: (scope: IdentityFoundationTransactionScope) => Promise<Result>,
  ): Promise<Result>;
}
