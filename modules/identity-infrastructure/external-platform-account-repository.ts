import type {
  ExternalPlatformAccount,
  ExternalPlatformAccountId,
  ExternalPlatformAccountLifecycle,
  ExternalPlatformNamespace,
  PlatformAccountIdentifier,
} from './external-platform-contract.js';

export class ExternalPlatformAccountAlreadyExistsError extends Error {
  public constructor(
    public readonly platform: ExternalPlatformNamespace,
    public readonly platformAccountId: PlatformAccountIdentifier,
  ) {
    super(`External Platform Account ${platform}/${platformAccountId} already exists.`);
    this.name = 'ExternalPlatformAccountAlreadyExistsError';
  }
}

export class ExternalPlatformAccountNotFoundError extends Error {
  public constructor(public readonly lookup: string) {
    super(`External Platform Account ${lookup} was not found.`);
    this.name = 'ExternalPlatformAccountNotFoundError';
  }
}

export class ExternalPlatformAccountLifecycleConflictError extends Error {
  public constructor(public readonly accountId: ExternalPlatformAccountId) {
    super(`External Platform Account ${accountId} changed concurrently.`);
    this.name = 'ExternalPlatformAccountLifecycleConflictError';
  }
}

export interface ExternalPlatformAccountRepository {
  create(account: ExternalPlatformAccount): Promise<void>;
  getById(accountId: ExternalPlatformAccountId): Promise<ExternalPlatformAccount | undefined>;
  getByPlatformAccount(
    platform: ExternalPlatformNamespace,
    platformAccountId: PlatformAccountIdentifier,
  ): Promise<ExternalPlatformAccount | undefined>;
  exists(accountId: ExternalPlatformAccountId): Promise<boolean>;
  updateLifecycle(input: {
    readonly accountId: ExternalPlatformAccountId;
    readonly expectedLifecycle: ExternalPlatformAccountLifecycle;
    readonly nextLifecycle: ExternalPlatformAccountLifecycle;
    readonly updatedAt: string;
  }): Promise<void>;
}
