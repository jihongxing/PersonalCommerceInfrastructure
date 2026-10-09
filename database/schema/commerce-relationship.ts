import { sql } from 'drizzle-orm';
import { pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { commerceProfiles } from './commerce-profile.js';
import { externalPlatformAccounts } from './external-platform-account.js';

export const commerceRelationships = pgTable(
  'commerce_relationships',
  {
    commerceRelationshipId: varchar('commerce_relationship_id', { length: 128 }).primaryKey(),
    externalPlatformAccountId: varchar('external_platform_account_id', { length: 128 })
      .notNull()
      .references(() => externalPlatformAccounts.externalPlatformAccountId, {
        onDelete: 'restrict',
        onUpdate: 'no action',
      }),
    commerceProfileId: varchar('commerce_profile_id', { length: 128 })
      .notNull()
      .references(() => commerceProfiles.commerceProfileId, {
        onDelete: 'restrict',
        onUpdate: 'no action',
      }),
    role: varchar('role', { length: 32 }).notNull(),
    provenance: varchar('provenance', { length: 32 }).notNull().default('SELF_DECLARED'),
    lifecycle: varchar('lifecycle', { length: 32 }).notNull().default('PROPOSED'),
    effectiveAt: timestamp('effective_at', { mode: 'string', withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('commerce_relationships_one_active_account_unique')
      .on(table.externalPlatformAccountId)
      .where(sql`${table.lifecycle} = 'ACTIVE'`),
    uniqueIndex('commerce_relationships_one_proposed_target_unique')
      .on(table.externalPlatformAccountId, table.commerceProfileId)
      .where(sql`${table.lifecycle} = 'PROPOSED' AND ${table.provenance} = 'SELF_DECLARED'`),
  ],
);
