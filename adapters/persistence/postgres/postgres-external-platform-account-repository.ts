import { and, eq } from 'drizzle-orm';

import { externalPlatformAccounts } from '../../../database/schema/external-platform-account.js';
import {
  createExternalPlatform,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
  rehydrateExternalPlatformAccount,
  transitionExternalPlatformAccount,
  type ExternalPlatformAccount,
  type ExternalPlatformAccountId,
  type ExternalPlatformAccountLifecycle,
  type ExternalPlatformNamespace,
  type PlatformAccountIdentifier,
} from '../../../modules/identity-infrastructure/external-platform-contract.js';
import {
  ExternalPlatformAccountAlreadyExistsError,
  ExternalPlatformAccountLifecycleConflictError,
  ExternalPlatformAccountNotFoundError,
  type ExternalPlatformAccountRepository,
} from '../../../modules/identity-infrastructure/external-platform-account-repository.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresExternalPlatformAccountRepository implements ExternalPlatformAccountRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(account: ExternalPlatformAccount): Promise<void> {
    try {
      const inserted = await this.database
        .insert(externalPlatformAccounts)
        .values({
          externalPlatformAccountId: account.externalPlatformAccountId,
          platform: account.platform.namespace,
          platformAccountId: account.platformAccountId,
          lifecycle: account.lifecycle,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        })
        .onConflictDoNothing()
        .returning({
          externalPlatformAccountId: externalPlatformAccounts.externalPlatformAccountId,
        });
      if (inserted.length === 0) {
        throw new ExternalPlatformAccountAlreadyExistsError(
          account.platform.namespace,
          account.platformAccountId,
        );
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ExternalPlatformAccountAlreadyExistsError(
          account.platform.namespace,
          account.platformAccountId,
        );
      }
      throw error;
    }
  }

  public async getById(
    accountId: ExternalPlatformAccountId,
  ): Promise<ExternalPlatformAccount | undefined> {
    const rows = await this.database
      .select()
      .from(externalPlatformAccounts)
      .where(eq(externalPlatformAccounts.externalPlatformAccountId, accountId));
    const row = rows[0];
    return row === undefined ? undefined : rehydrateExternalPlatformAccountRow(row);
  }

  public async getByPlatformAccount(
    platform: ExternalPlatformNamespace,
    platformAccountId: PlatformAccountIdentifier,
  ): Promise<ExternalPlatformAccount | undefined> {
    const rows = await this.database
      .select()
      .from(externalPlatformAccounts)
      .where(
        and(
          eq(externalPlatformAccounts.platform, platform),
          eq(externalPlatformAccounts.platformAccountId, platformAccountId),
        ),
      );
    const row = rows[0];
    return row === undefined ? undefined : rehydrateExternalPlatformAccountRow(row);
  }

  public async exists(accountId: ExternalPlatformAccountId): Promise<boolean> {
    return (await this.getById(accountId)) !== undefined;
  }

  public async updateLifecycle(input: {
    readonly accountId: ExternalPlatformAccountId;
    readonly expectedLifecycle: ExternalPlatformAccountLifecycle;
    readonly nextLifecycle: ExternalPlatformAccountLifecycle;
    readonly updatedAt: string;
  }): Promise<void> {
    const account = await this.getById(input.accountId);
    if (account === undefined) {
      throw new ExternalPlatformAccountNotFoundError(input.accountId);
    }
    if (account.lifecycle !== input.expectedLifecycle) {
      throw new ExternalPlatformAccountLifecycleConflictError(input.accountId);
    }

    const transitioned = transitionExternalPlatformAccount(
      account,
      input.nextLifecycle,
      input.updatedAt,
    );
    const result = await this.database
      .update(externalPlatformAccounts)
      .set({ lifecycle: transitioned.lifecycle, updatedAt: transitioned.updatedAt })
      .where(
        and(
          eq(externalPlatformAccounts.externalPlatformAccountId, input.accountId),
          eq(externalPlatformAccounts.lifecycle, input.expectedLifecycle),
        ),
      )
      .returning({ accountId: externalPlatformAccounts.externalPlatformAccountId });

    if (result.length === 1) {
      return;
    }
    throw new ExternalPlatformAccountLifecycleConflictError(input.accountId);
  }
}

export function rehydrateExternalPlatformAccountRow(row: {
  readonly externalPlatformAccountId: string;
  readonly platform: string;
  readonly platformAccountId: string;
  readonly lifecycle: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}): ExternalPlatformAccount {
  return rehydrateExternalPlatformAccount({
    externalPlatformAccountId: createExternalPlatformAccountId(row.externalPlatformAccountId),
    platform: createExternalPlatform(createExternalPlatformNamespace(row.platform)),
    platformAccountId: createPlatformAccountIdentifier(row.platformAccountId),
    lifecycle: row.lifecycle,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
