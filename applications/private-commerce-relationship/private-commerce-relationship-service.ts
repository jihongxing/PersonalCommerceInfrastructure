import type { CurrentUserIdentityService } from '../account-identity-membership/current-user-identity-service.js';
import type { CanonicalCommerceProfileService } from '../canonical-commerce-profile/canonical-commerce-profile-service.js';
import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CommerceRelationshipRepository } from '../../modules/identity-infrastructure/commerce-relationship-repository.js';
import type {
  CommerceRelationship,
  ExternalPlatformAccount,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import type { ExternalPlatformAccountRepository } from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import { createCommerceRelationshipId } from '../../modules/identity-infrastructure/external-platform-contract.js';
import { createInternalIdentityId } from '../../modules/identity-infrastructure/identity-contract.js';

export interface PrivateCommerceRelationshipView {
  readonly relationshipId: string;
  readonly profile: {
    readonly commerceProfileId: string;
    readonly displayName: string;
  };
  readonly externalPlatformAccount: {
    readonly platform: string;
    readonly platformAccountId: string;
    readonly lifecycle: ExternalPlatformAccount['lifecycle'];
  };
  readonly role: CommerceRelationship['role'];
  readonly provenance: CommerceRelationship['provenance'];
  readonly lifecycle: CommerceRelationship['lifecycle'];
  readonly effectiveAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PrivateCommerceRelationshipService {
  listMyCommerceRelationships(
    accountContext: AccountContext,
    filters?: {
      readonly commerceProfileId?: string;
      readonly externalPlatformAccountId?: string;
    },
  ): Promise<readonly PrivateCommerceRelationshipView[]>;
  getMyCommerceRelationship(
    accountContext: AccountContext,
    relationshipId: string,
  ): Promise<PrivateCommerceRelationshipView>;
}

export function createPrivateCommerceRelationshipService(dependencies: {
  readonly currentUserIdentityService: CurrentUserIdentityService;
  readonly commerceProfileService: CanonicalCommerceProfileService;
  readonly commerceRelationshipRepository: CommerceRelationshipRepository;
  readonly externalPlatformAccountRepository: ExternalPlatformAccountRepository;
}): PrivateCommerceRelationshipService {
  return {
    async listMyCommerceRelationships(accountContext, filters) {
      const profiles = await listOwnedProfiles(dependencies, accountContext);
      const scopedProfiles = filters?.commerceProfileId === undefined
        ? profiles
        : profiles.filter((profile) => profile.commerceProfileId === filters.commerceProfileId);
      const relationshipGroups = await Promise.all(
        scopedProfiles.map((profile) =>
          dependencies.commerceRelationshipRepository.listByCommerceProfile(
            profile.commerceProfileId,
          ),
        ),
      );
      const profileById = new Map(scopedProfiles.map((profile) => [profile.commerceProfileId, profile]));
      const relationships = relationshipGroups.flat();
      const filteredRelationships = filters?.externalPlatformAccountId === undefined
        ? relationships
        : relationships.filter(
            (relationship) =>
              relationship.externalPlatformAccountId === filters.externalPlatformAccountId,
          );
      return toViews(dependencies, filteredRelationships, profileById);
    },

    async getMyCommerceRelationship(accountContext, relationshipId) {
      const profiles = await listOwnedProfiles(dependencies, accountContext);
      const profileById = new Map(profiles.map((profile) => [profile.commerceProfileId, profile]));
      const relationship = await dependencies.commerceRelationshipRepository.getById(
        createCommerceRelationshipId(relationshipId),
      );
      if (relationship === undefined || !profileById.has(relationship.commerceProfileId)) {
        throw privateCommerceRelationshipNotFound();
      }
      const views = await toViews(dependencies, [relationship], profileById);
      const view = views[0];
      if (view === undefined) {
        throw privateCommerceRelationshipNotFound();
      }
      return view;
    },
  };
}

async function listOwnedProfiles(
  dependencies: {
    readonly currentUserIdentityService: CurrentUserIdentityService;
    readonly commerceProfileService: CanonicalCommerceProfileService;
  },
  accountContext: AccountContext,
) {
  const identity = await dependencies.currentUserIdentityService.getCurrentIdentity(accountContext);
  return dependencies.commerceProfileService.listOwnedByIdentity(
    createInternalIdentityId(identity.identityId),
  );
}

async function toViews(
  dependencies: {
    readonly externalPlatformAccountRepository: ExternalPlatformAccountRepository;
  },
  relationships: readonly CommerceRelationship[],
  profileById: ReadonlyMap<string, { readonly commerceProfileId: string; readonly presentation: { readonly displayName: string } }>,
): Promise<readonly PrivateCommerceRelationshipView[]> {
  const views = await Promise.all(
    relationships.map(async (relationship) => {
      const profile = profileById.get(relationship.commerceProfileId);
      const account = await dependencies.externalPlatformAccountRepository.getById(
        relationship.externalPlatformAccountId,
      );
      if (profile === undefined || account === undefined) {
        return undefined;
      }
      const view: PrivateCommerceRelationshipView = {
        relationshipId: String(relationship.commerceRelationshipId),
        profile: {
          commerceProfileId: String(profile.commerceProfileId),
          displayName: profile.presentation.displayName,
        },
        externalPlatformAccount: {
          platform: String(account.platform.namespace),
          platformAccountId: String(account.platformAccountId),
          lifecycle: account.lifecycle,
        },
        role: relationship.role,
        provenance: relationship.provenance,
        lifecycle: relationship.lifecycle,
        effectiveAt: relationship.effectiveAt,
        createdAt: relationship.createdAt,
        updatedAt: relationship.updatedAt,
      };
      return view;
    }),
  );
  return views
    .filter((view): view is PrivateCommerceRelationshipView => view !== undefined)
    .sort(
      (left, right) =>
        left.effectiveAt.localeCompare(right.effectiveAt) ||
        left.createdAt.localeCompare(right.createdAt) ||
        left.relationshipId.localeCompare(right.relationshipId),
    );
}

function privateCommerceRelationshipNotFound(): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: 'private_commerce_relationship_not_found',
    message: 'Commerce Relationship is not available to the current authenticated Identity.',
  });
}
