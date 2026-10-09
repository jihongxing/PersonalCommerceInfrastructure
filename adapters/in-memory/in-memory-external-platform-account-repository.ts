import type {
  ExternalPlatformAccount,
  ExternalPlatformAccountId,
  ExternalPlatformAccountLifecycle,
  ExternalPlatformNamespace,
  PlatformAccountIdentifier,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import { transitionExternalPlatformAccount } from '../../modules/identity-infrastructure/external-platform-contract.js';
import {
  ExternalPlatformAccountAlreadyExistsError,
  ExternalPlatformAccountLifecycleConflictError,
  ExternalPlatformAccountNotFoundError,
  type ExternalPlatformAccountRepository,
} from '../../modules/identity-infrastructure/external-platform-account-repository.js';
import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryExternalPlatformAccountRepository
  implements ExternalPlatformAccountRepository, TransactionParticipant
{
  private readonly accountsById = new Map<ExternalPlatformAccountId, ExternalPlatformAccount>();
  private readonly accountIdsByPlatformAccount = new Map<string, ExternalPlatformAccountId>();

  public create(account: ExternalPlatformAccount): Promise<void> {
    const namespaceKey = createNamespaceKey(account.platform.namespace, account.platformAccountId);
    if (
      this.accountsById.has(account.externalPlatformAccountId) ||
      this.accountIdsByPlatformAccount.has(namespaceKey)
    ) {
      return Promise.reject(
        new ExternalPlatformAccountAlreadyExistsError(
          account.platform.namespace,
          account.platformAccountId,
        ),
      );
    }

    this.accountsById.set(account.externalPlatformAccountId, account);
    this.accountIdsByPlatformAccount.set(namespaceKey, account.externalPlatformAccountId);
    return Promise.resolve();
  }

  public getById(
    accountId: ExternalPlatformAccountId,
  ): Promise<ExternalPlatformAccount | undefined> {
    return Promise.resolve(this.accountsById.get(accountId));
  }

  public getByPlatformAccount(
    platform: ExternalPlatformNamespace,
    platformAccountId: PlatformAccountIdentifier,
  ): Promise<ExternalPlatformAccount | undefined> {
    const accountId = this.accountIdsByPlatformAccount.get(
      createNamespaceKey(platform, platformAccountId),
    );
    return Promise.resolve(accountId === undefined ? undefined : this.accountsById.get(accountId));
  }

  public exists(accountId: ExternalPlatformAccountId): Promise<boolean> {
    return Promise.resolve(this.accountsById.has(accountId));
  }

  public updateLifecycle(input: {
    readonly accountId: ExternalPlatformAccountId;
    readonly expectedLifecycle: ExternalPlatformAccountLifecycle;
    readonly nextLifecycle: ExternalPlatformAccountLifecycle;
    readonly updatedAt: string;
  }): Promise<void> {
    const account = this.accountsById.get(input.accountId);
    if (account === undefined) {
      return Promise.reject(new ExternalPlatformAccountNotFoundError(input.accountId));
    }
    if (account.lifecycle !== input.expectedLifecycle) {
      return Promise.reject(new ExternalPlatformAccountLifecycleConflictError(input.accountId));
    }

    try {
      this.accountsById.set(
        input.accountId,
        transitionExternalPlatformAccount(account, input.nextLifecycle, input.updatedAt),
      );
    } catch (error) {
      return Promise.reject(
        error instanceof Error
          ? error
          : new Error('External Platform Account lifecycle update failed.'),
      );
    }
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return {
      accountsById: structuredClone(this.accountsById),
      accountIdsByPlatformAccount: structuredClone(this.accountIdsByPlatformAccount),
    };
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (
      typeof snapshot !== 'object' ||
      snapshot === null ||
      !('accountsById' in snapshot) ||
      !('accountIdsByPlatformAccount' in snapshot) ||
      !(snapshot.accountsById instanceof Map) ||
      !(snapshot.accountIdsByPlatformAccount instanceof Map)
    ) {
      throw new TypeError('External Platform Account repository snapshot is invalid.');
    }
    this.accountsById.clear();
    this.accountIdsByPlatformAccount.clear();
    const accountsById = snapshot.accountsById as Map<
      ExternalPlatformAccountId,
      ExternalPlatformAccount
    >;
    const accountIdsByPlatformAccount = snapshot.accountIdsByPlatformAccount as Map<
      string,
      ExternalPlatformAccountId
    >;
    for (const [accountId, account] of structuredClone(accountsById)) {
      this.accountsById.set(accountId, account);
    }
    for (const [key, accountId] of structuredClone(accountIdsByPlatformAccount)) {
      this.accountIdsByPlatformAccount.set(key, accountId);
    }
  }
}

function createNamespaceKey(
  platform: ExternalPlatformNamespace,
  platformAccountId: PlatformAccountIdentifier,
): string {
  return `${platform}\u0000${platformAccountId}`;
}
