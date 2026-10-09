import { sql } from 'drizzle-orm';
import { pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { identities } from './identity.js';

export const accountIdentityMemberships = pgTable(
  'account_identity_memberships',
  {
    membershipId: varchar('membership_id', { length: 128 }).primaryKey(),
    accountId: varchar('account_id', { length: 256 }).notNull(),
    identityId: varchar('identity_id', { length: 128 })
      .notNull()
      .references(() => identities.identityId, { onDelete: 'restrict' }),
    authority: varchar('authority', { length: 32 }).notNull().default('OWNER'),
    state: varchar('state', { length: 32 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp('revoked_at', { mode: 'string', withTimezone: true }),
  },
  (table) => [
    uniqueIndex('account_identity_memberships_active_owner_account_unique')
      .on(table.accountId)
      .where(sql`${table.state} = 'ACTIVE'`),
  ],
);

export type AccountIdentityMembershipRow = typeof accountIdentityMemberships.$inferSelect;
