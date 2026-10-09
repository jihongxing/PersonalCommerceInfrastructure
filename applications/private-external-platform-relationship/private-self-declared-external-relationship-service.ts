import type { CurrentUserIdentityService } from '../account-identity-membership/current-user-identity-service.js';
import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CanonicalCommerceProfileService } from '../canonical-commerce-profile/canonical-commerce-profile-service.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type {
  CommerceRelationship,
  ExternalPlatformAccount,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import {
  createCommerceRelationship,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import {
  createCommerceProfileId,
  createInternalIdentityId,
} from '../../modules/identity-infrastructure/identity-contract.js';
import type { CommerceProfile } from '../../modules/identity-infrastructure/identity-contract.js';
import type { ExternalPlatformAccountIdGenerator } from '../external-platform-account/external-platform-account-service.js';
import type { CommerceRelationshipIdGenerator } from '../commerce-relationship/commerce-relationship-service.js';
import { ExternalPlatformAccountAlreadyExistsError } from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import type { CommerceRelationshipRepository } from '../../modules/identity-infrastructure/commerce-relationship-repository.js';
import { CommerceRelationshipAlreadyExistsError } from '../../modules/identity-infrastructure/commerce-relationship-repository.js';

export interface SelfDeclaredExternalRelationshipResult {
  readonly externalPlatformAccount: ExternalPlatformAccount;
  readonly commerceRelationship: CommerceRelationship;
}

export interface PrivateSelfDeclaredExternalRelationshipService {
  createMySelfDeclaredExternalRelationship(
    accountContext: AccountContext,
    input: {
      readonly platform: string;
      readonly platformAccountId: string;
      readonly commerceProfileId: string;
    },
  ): Promise<SelfDeclaredExternalRelationshipResult>;
}

export function createPrivateSelfDeclaredExternalRelationshipService(dependencies: {
  readonly currentUserIdentityService: CurrentUserIdentityService;
  readonly commerceProfileService: CanonicalCommerceProfileService;
  readonly unitOfWork: UnitOfWork;
  readonly externalPlatformAccountIdGenerator: ExternalPlatformAccountIdGenerator;
  readonly commerceRelationshipIdGenerator: CommerceRelationshipIdGenerator;
  readonly clock: { now(): string };
}): PrivateSelfDeclaredExternalRelationshipService {
  return {
    async createMySelfDeclaredExternalRelationship(accountContext, input) {
      const currentIdentity =
        await dependencies.currentUserIdentityService.getCurrentIdentity(accountContext);
      const identityId = createInternalIdentityId(currentIdentity.identityId);
      const platform = createExternalPlatform(createExternalPlatformNamespace(input.platform));
      const platformAccountId = createPlatformAccountIdentifier(input.platformAccountId);

      return dependencies.unitOfWork.execute(async (scope) => {
        if (
          scope.externalPlatformAccountRepository === undefined ||
          scope.commerceRelationshipRepository === undefined
        ) {
          throw new Error('Self-declared external relationship transaction is not configured.');
        }

        const profileRepository = scope.commerceProfileRepository;
        if (profileRepository === undefined) {
          throw new Error(
            'Self-declared external relationship profile transaction is not configured.',
          );
        }
        const profile = await profileRepository.getById(
          createCommerceProfileId(input.commerceProfileId),
        );
        if (profile === undefined) {
          throw new ApplicationError({
            category: 'not_found',
            code: 'private_commerce_profile_not_found',
            message: 'Commerce Profile was not found.',
          });
        }
        assertOwnedActiveProfile(profile, identityId);
        const ownedProfiles = await profileRepository.listOwnedByIdentity(identityId);

        const existingAccount = await scope.externalPlatformAccountRepository.getByPlatformAccount(
          platform.namespace,
          platformAccountId,
        );
        const account =
          existingAccount ??
          createExternalPlatformAccount({
            externalPlatformAccountId: dependencies.externalPlatformAccountIdGenerator.generate(),
            platform,
            platformAccountId,
            createdAt: dependencies.clock.now(),
          });
        let persistedAccount = existingAccount;
        let accountCreated = false;
        if (existingAccount === undefined) {
          try {
            await scope.externalPlatformAccountRepository.create(account);
            accountCreated = true;
          } catch (error) {
            if (!(error instanceof ExternalPlatformAccountAlreadyExistsError)) {
              throw error;
            }
          }
          persistedAccount = await scope.externalPlatformAccountRepository.getByPlatformAccount(
            platform.namespace,
            platformAccountId,
          );
          if (persistedAccount === undefined) {
            throw new ApplicationError({
              category: 'unavailable',
              code: 'external_platform_account_unavailable',
              message: 'The external platform account could not be declared.',
            });
          }
        }
        if (persistedAccount === undefined) {
          throw new ApplicationError({
            category: 'unavailable',
            code: 'external_platform_account_unavailable',
            message: 'The external platform account could not be declared.',
          });
        }
        const canonicalAccount: ExternalPlatformAccount = persistedAccount;
        if (
          !accountCreated &&
          !(await accountIsAuthorizedForIdentity(
            scope.commerceRelationshipRepository,
            canonicalAccount.externalPlatformAccountId,
            ownedProfiles.map((ownedProfile) => ownedProfile.commerceProfileId),
          ))
        ) {
          throw new ApplicationError({
            category: 'conflict',
            code: 'external_platform_account_conflict',
            message: 'The external platform account cannot be declared.',
          });
        }

        const relationships = await scope.commerceRelationshipRepository.listByCommerceProfile(
          profile.commerceProfileId,
        );
        const existingRelationship = relationships.find(
          (relationship) =>
            relationship.externalPlatformAccountId === canonicalAccount.externalPlatformAccountId &&
            relationship.role === 'OWNER' &&
            relationship.provenance === 'SELF_DECLARED' &&
            relationship.lifecycle === 'PROPOSED',
        );
        if (existingRelationship !== undefined) {
          return {
            externalPlatformAccount: canonicalAccount,
            commerceRelationship: existingRelationship,
          };
        }

        const relationship = createCommerceRelationship({
          commerceRelationshipId: dependencies.commerceRelationshipIdGenerator.generate(),
          externalPlatformAccountId: canonicalAccount.externalPlatformAccountId,
          commerceProfileId: profile.commerceProfileId,
          role: 'OWNER',
          effectiveAt: dependencies.clock.now(),
          createdAt: dependencies.clock.now(),
        });
        try {
          await scope.commerceRelationshipRepository.create(relationship);
        } catch (error) {
          if (!(error instanceof CommerceRelationshipAlreadyExistsError)) {
            throw error;
          }
          const concurrentRelationship = (
            await scope.commerceRelationshipRepository.listByCommerceProfile(
              profile.commerceProfileId,
            )
          ).find(
            (candidate) =>
              candidate.externalPlatformAccountId === canonicalAccount.externalPlatformAccountId &&
              candidate.role === 'OWNER' &&
              candidate.provenance === 'SELF_DECLARED' &&
              candidate.lifecycle === 'PROPOSED',
          );
          if (concurrentRelationship === undefined) {
            throw error;
          }
          return {
            externalPlatformAccount: canonicalAccount,
            commerceRelationship: concurrentRelationship,
          };
        }
        return { externalPlatformAccount: canonicalAccount, commerceRelationship: relationship };
      });
    },
  };
}

async function accountIsAuthorizedForIdentity(
  repository: CommerceRelationshipRepository,
  accountId: ExternalPlatformAccount['externalPlatformAccountId'],
  profileIds: readonly string[],
): Promise<boolean> {
  const relationships = await repository.listByExternalPlatformAccount(accountId);
  return relationships.some((relationship) => profileIds.includes(relationship.commerceProfileId));
}

function assertOwnedActiveProfile(
  profile: CommerceProfile,
  identityId: ReturnType<typeof createInternalIdentityId>,
): void {
  if (
    profile.owningIdentityId !== identityId ||
    (profile.lifecycle !== 'ACTIVE' && profile.lifecycle !== 'SUSPENDED')
  ) {
    throw new ApplicationError({
      category: 'not_found',
      code: 'private_commerce_profile_not_found',
      message: 'Commerce Profile was not found.',
    });
  }
}
