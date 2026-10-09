import type { CurrentUserIdentityService } from '../account-identity-membership/current-user-identity-service.js';
import type { CanonicalCommerceProfileService } from '../canonical-commerce-profile/canonical-commerce-profile-service.js';
import type { AccountContext } from '../core/account-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CommerceRelationshipRepository } from '../../modules/identity-infrastructure/commerce-relationship-repository.js';
import type { ExternalPlatformAccountRepository } from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import { createExternalPlatformAccountId } from '../../modules/identity-infrastructure/external-platform-contract.js';
import { createInternalIdentityId } from '../../modules/identity-infrastructure/identity-contract.js';

export interface PrivateExternalPlatformAccountView {
  readonly externalPlatformAccountId: string;
  readonly platform: string;
  readonly platformAccountId: string;
  readonly lifecycle: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
}

export interface PrivateExternalPlatformAccountService {
  listMyExternalPlatformAccounts(
    accountContext: AccountContext,
  ): Promise<readonly PrivateExternalPlatformAccountView[]>;
  getMyExternalPlatformAccount(
    accountContext: AccountContext,
    externalPlatformAccountId: string,
  ): Promise<PrivateExternalPlatformAccountView>;
}

export function createPrivateExternalPlatformAccountService(dependencies: {
  readonly currentUserIdentityService: CurrentUserIdentityService;
  readonly commerceProfileService: CanonicalCommerceProfileService;
  readonly commerceRelationshipRepository: CommerceRelationshipRepository;
  readonly externalPlatformAccountRepository: ExternalPlatformAccountRepository;
}): PrivateExternalPlatformAccountService {
  return {
    async listMyExternalPlatformAccounts(accountContext) {
      const accountIds = await listAuthorizedAccountIds(dependencies, accountContext);
      const accounts = await Promise.all(
        accountIds.map(async (accountId) =>
          dependencies.externalPlatformAccountRepository.getById(accountId),
        ),
      );

      return accounts
        .filter((account): account is NonNullable<typeof account> => account !== undefined)
        .map(toPrivateView);
    },

    async getMyExternalPlatformAccount(accountContext, externalPlatformAccountId) {
      const accountId = createExternalPlatformAccountId(externalPlatformAccountId);
      const accountIds = await listAuthorizedAccountIds(dependencies, accountContext);
      if (!accountIds.includes(accountId)) {
        throw privateExternalPlatformAccountNotFound();
      }

      const account = await dependencies.externalPlatformAccountRepository.getById(accountId);
      if (account === undefined) {
        throw privateExternalPlatformAccountNotFound();
      }
      return toPrivateView(account);
    },
  };
}

async function listAuthorizedAccountIds(
  dependencies: {
    readonly currentUserIdentityService: CurrentUserIdentityService;
    readonly commerceProfileService: CanonicalCommerceProfileService;
    readonly commerceRelationshipRepository: CommerceRelationshipRepository;
  },
  accountContext: AccountContext,
) {
  const currentIdentity = await dependencies.currentUserIdentityService.getCurrentIdentity(
    accountContext,
  );
  const profiles = await dependencies.commerceProfileService.listOwnedByIdentity(
    createInternalIdentityId(currentIdentity.identityId),
  );
  const relationships = await Promise.all(
    profiles.map(async (profile) =>
      dependencies.commerceRelationshipRepository.listByCommerceProfile(profile.commerceProfileId),
    ),
  );
  return [
    ...new Set(
      relationships.flatMap((profileRelationships) =>
        profileRelationships.map((relationship) => relationship.externalPlatformAccountId),
      ),
    ),
  ].sort();
}

function toPrivateView(account: {
  readonly externalPlatformAccountId: string;
  readonly platform: { readonly namespace: string };
  readonly platformAccountId: string;
  readonly lifecycle: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
}): PrivateExternalPlatformAccountView {
  return {
    externalPlatformAccountId: account.externalPlatformAccountId,
    platform: account.platform.namespace,
    platformAccountId: account.platformAccountId,
    lifecycle: account.lifecycle,
  };
}

function privateExternalPlatformAccountNotFound(): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: 'private_external_platform_account_not_found',
    message: 'External Platform Account is not available to the current authenticated Identity.',
  });
}
