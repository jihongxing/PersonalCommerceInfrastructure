import type { AccountContext } from './account-context.js';
import { ApplicationError } from './application-error.js';
import type {
  IdentityApplicationContext,
  IdentityProfileContextResolver,
  ProfileApplicationContext,
} from './identity-profile-context.js';

export type IdentityMutationOperation =
  'SUSPEND_IDENTITY' | 'ARCHIVE_IDENTITY' | 'REACTIVATE_IDENTITY' | 'CREATE_COMMERCE_PROFILE';

export type ProfileMutationOperation =
  | 'UPDATE_PRESENTATION'
  | 'ACTIVATE_PROFILE'
  | 'SUSPEND_PROFILE'
  | 'ARCHIVE_PROFILE'
  | 'LEGACY_COMPATIBILITY_MUTATION';

export interface IdentityProfileAuthorizationPolicy {
  authorizeIdentityRead(
    accountContext: AccountContext,
    identityId: string,
  ): Promise<IdentityApplicationContext>;
  authorizeProfileRead(
    accountContext: AccountContext,
    identityId: string,
    commerceProfileId: string,
  ): Promise<ProfileApplicationContext>;
  authorizeIdentityMutation(
    accountContext: AccountContext,
    identityId: string,
    operation: IdentityMutationOperation,
  ): Promise<IdentityApplicationContext>;
  authorizeProfileMutation(
    accountContext: AccountContext,
    identityId: string,
    commerceProfileId: string,
    operation: ProfileMutationOperation,
  ): Promise<ProfileApplicationContext>;
}

export function createIdentityProfileAuthorizationPolicy(dependencies: {
  readonly contextResolver: IdentityProfileContextResolver;
}): IdentityProfileAuthorizationPolicy {
  return {
    authorizeIdentityRead(accountContext, identityId) {
      return dependencies.contextResolver.resolveIdentityContext(accountContext, identityId);
    },

    authorizeProfileRead(accountContext, identityId, commerceProfileId) {
      return dependencies.contextResolver.resolveProfileContext(
        accountContext,
        identityId,
        commerceProfileId,
      );
    },

    async authorizeIdentityMutation(accountContext, identityId, operation) {
      const context = await dependencies.contextResolver.resolveIdentityContext(
        accountContext,
        identityId,
      );
      assertOperationalIdentity(context, operation);
      return context;
    },

    async authorizeProfileMutation(accountContext, identityId, commerceProfileId, operation) {
      const context = await dependencies.contextResolver.resolveProfileContext(
        accountContext,
        identityId,
        commerceProfileId,
      );
      assertOperationalIdentity(context.identity, operation);
      assertProfileOperationAllowed(context, operation);
      return context;
    },
  };
}

function assertOperationalIdentity(
  context: IdentityApplicationContext,
  operation: IdentityMutationOperation | ProfileMutationOperation,
): void {
  if (context.identityLifecycle !== 'ACTIVE') {
    throw new ApplicationError({
      category: 'conflict',
      code: 'identity_not_operational',
      message: `Identity must be active to authorize ${operation}.`,
    });
  }
}

function assertProfileOperationAllowed(
  context: ProfileApplicationContext,
  operation: ProfileMutationOperation,
): void {
  const allowedOperations = profileOperationsByLifecycle[context.profileLifecycle];
  if (allowedOperations.has(operation)) {
    return;
  }
  throw new ApplicationError({
    category: 'conflict',
    code: 'commerce_profile_not_operational',
    message: `Commerce Profile in ${context.profileLifecycle} state cannot authorize ${operation}.`,
  });
}

const profileOperationsByLifecycle: Readonly<
  Record<ProfileApplicationContext['profileLifecycle'], ReadonlySet<ProfileMutationOperation>>
> = {
  DRAFT: new Set(['UPDATE_PRESENTATION', 'ACTIVATE_PROFILE', 'ARCHIVE_PROFILE']),
  ACTIVE: new Set([
    'UPDATE_PRESENTATION',
    'SUSPEND_PROFILE',
    'ARCHIVE_PROFILE',
    'LEGACY_COMPATIBILITY_MUTATION',
  ]),
  SUSPENDED: new Set(),
  ARCHIVED: new Set(),
};
