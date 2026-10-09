import { and, eq } from 'drizzle-orm';

import {
  AccountIdentityMembershipAlreadyExistsError,
  type AccountIdentityMembershipRepository,
} from '../../../applications/account-identity-membership/account-identity-membership-repositories.js';
import type {
  AccountIdentityMembership,
  AccountIdentityMembershipState,
} from '../../../modules/account-identity-membership/account-identity-membership.js';
import { accountIdentityMemberships } from '../../../database/schema/account-identity-membership.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresAccountIdentityMembershipRepository implements AccountIdentityMembershipRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(membership: AccountIdentityMembership): Promise<void> {
    try {
      await this.database.insert(accountIdentityMemberships).values({
        membershipId: membership.membershipId,
        accountId: membership.accountId,
        identityId: membership.identityId,
        authority: membership.authority,
        state: membership.state,
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
        revokedAt: membership.revokedAt,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AccountIdentityMembershipAlreadyExistsError(membership.accountId);
      }
      throw error;
    }
  }

  public async findById(membershipId: string): Promise<AccountIdentityMembership | undefined> {
    const rows = await this.database
      .select()
      .from(accountIdentityMemberships)
      .where(eq(accountIdentityMemberships.membershipId, membershipId));
    return rows[0] === undefined ? undefined : toMembership(rows[0]);
  }

  public async findActiveByAccountAndIdentity(
    accountId: string,
    identityId: string,
  ): Promise<AccountIdentityMembership | undefined> {
    const rows = await this.database
      .select()
      .from(accountIdentityMemberships)
      .where(
        and(
          eq(accountIdentityMemberships.accountId, accountId),
          eq(accountIdentityMemberships.identityId, identityId),
          eq(accountIdentityMemberships.authority, 'OWNER'),
          eq(accountIdentityMemberships.state, 'ACTIVE'),
        ),
      );
    return rows[0] === undefined ? undefined : toMembership(rows[0]);
  }

  public async findActiveByAccount(
    accountId: string,
  ): Promise<AccountIdentityMembership | undefined> {
    const rows = await this.database
      .select()
      .from(accountIdentityMemberships)
      .where(
        and(
          eq(accountIdentityMemberships.accountId, accountId),
          eq(accountIdentityMemberships.authority, 'OWNER'),
          eq(accountIdentityMemberships.state, 'ACTIVE'),
        ),
      );
    return rows[0] === undefined ? undefined : toMembership(rows[0]);
  }

  public async listByIdentity(identityId: string): Promise<readonly AccountIdentityMembership[]> {
    const rows = await this.database
      .select()
      .from(accountIdentityMemberships)
      .where(eq(accountIdentityMemberships.identityId, identityId));
    return rows.map(toMembership);
  }

  public async listByAccount(accountId: string): Promise<readonly AccountIdentityMembership[]> {
    const rows = await this.database
      .select()
      .from(accountIdentityMemberships)
      .where(eq(accountIdentityMemberships.accountId, accountId));
    return rows.map(toMembership);
  }

  public async countActiveOwners(identityId: string): Promise<number> {
    const rows = await this.database
      .select({ membershipId: accountIdentityMemberships.membershipId })
      .from(accountIdentityMemberships)
      .where(
        and(
          eq(accountIdentityMemberships.identityId, identityId),
          eq(accountIdentityMemberships.authority, 'OWNER'),
          eq(accountIdentityMemberships.state, 'ACTIVE'),
        ),
      );
    return rows.length;
  }

  public async updateState(
    membershipId: string,
    state: AccountIdentityMembershipState,
    updatedAt: string,
    revokedAt?: string,
  ): Promise<void> {
    await this.database
      .update(accountIdentityMemberships)
      .set({
        state,
        updatedAt,
        revokedAt: state === 'REVOKED' || state === 'HISTORICAL' ? revokedAt ?? updatedAt : null,
      })
      .where(eq(accountIdentityMemberships.membershipId, membershipId));
  }
}

function toMembership(
  row: typeof accountIdentityMemberships.$inferSelect,
): AccountIdentityMembership {
  return {
    membershipId: row.membershipId,
    accountId: row.accountId,
    identityId: row.identityId,
    authority: row.authority as 'OWNER',
    state: row.state as AccountIdentityMembershipState,
    createdAt: toCanonicalTimestamp(row.createdAt),
    updatedAt: toCanonicalTimestamp(row.updatedAt),
    ...(row.revokedAt === null ? {} : { revokedAt: toCanonicalTimestamp(row.revokedAt) }),
  };
}

function isUniqueViolation(error: unknown): boolean {
  const databaseError = unwrapDatabaseError(error);
  return (
    typeof databaseError === 'object' &&
    databaseError !== null &&
    'code' in databaseError &&
    databaseError.code === '23505'
  );
}

function unwrapDatabaseError(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    return error.cause;
  }
  return error;
}

function toCanonicalTimestamp(value: string): string {
  return new Date(value).toISOString();
}
