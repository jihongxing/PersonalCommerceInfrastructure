import {
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
  transitionExternalPlatformAccount,
  type ExternalPlatformAccount,
  type ExternalPlatformAccountId,
  type ExternalPlatformAccountLifecycle,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import {
  ExternalPlatformAccountNotFoundError,
  type ExternalPlatformAccountRepository,
} from '../../modules/identity-infrastructure/external-platform-account-repository.js';

export interface ExternalPlatformAccountIdGenerator {
  generate(): ExternalPlatformAccountId;
}

export interface ExternalPlatformAccountClock {
  now(): string;
}

export interface ExternalPlatformAccountService {
  register(input: {
    readonly platform: string;
    readonly platformAccountId: string;
  }): Promise<ExternalPlatformAccount>;
  get(accountId: ExternalPlatformAccountId): Promise<ExternalPlatformAccount>;
  getByPlatformAccount(input: {
    readonly platform: string;
    readonly platformAccountId: string;
  }): Promise<ExternalPlatformAccount>;
  changeLifecycle(
    accountId: ExternalPlatformAccountId,
    lifecycle: ExternalPlatformAccountLifecycle,
  ): Promise<ExternalPlatformAccount>;
}

export function createExternalPlatformAccountService(dependencies: {
  readonly repository: ExternalPlatformAccountRepository;
  readonly idGenerator: ExternalPlatformAccountIdGenerator;
  readonly clock: ExternalPlatformAccountClock;
}): ExternalPlatformAccountService {
  return {
    async register(input) {
      const createdAt = dependencies.clock.now();
      const platform = createExternalPlatform(createExternalPlatformNamespace(input.platform));
      const account = createExternalPlatformAccount({
        externalPlatformAccountId: dependencies.idGenerator.generate(),
        platform,
        platformAccountId: createPlatformAccountIdentifier(input.platformAccountId),
        createdAt,
      });
      await dependencies.repository.create(account);
      return account;
    },

    async get(accountId) {
      const account = await dependencies.repository.getById(accountId);
      if (account === undefined) {
        throw new ExternalPlatformAccountNotFoundError(accountId);
      }
      return account;
    },

    async getByPlatformAccount(input) {
      const platform = createExternalPlatformNamespace(input.platform);
      const platformAccountId = createPlatformAccountIdentifier(input.platformAccountId);
      const account = await dependencies.repository.getByPlatformAccount(
        platform,
        platformAccountId,
      );
      if (account === undefined) {
        throw new ExternalPlatformAccountNotFoundError(
          `${platform}/${platformAccountId}` as ExternalPlatformAccountId,
        );
      }
      return account;
    },

    async changeLifecycle(accountId, lifecycle) {
      const account = await this.get(accountId);
      const updated = transitionExternalPlatformAccount(
        account,
        lifecycle,
        dependencies.clock.now(),
      );
      await dependencies.repository.updateLifecycle({
        accountId,
        expectedLifecycle: account.lifecycle,
        nextLifecycle: updated.lifecycle,
        updatedAt: updated.updatedAt,
      });
      return updated;
    },
  };
}
