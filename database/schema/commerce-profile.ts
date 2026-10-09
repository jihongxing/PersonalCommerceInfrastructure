import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

import { identities } from './identity.js';

export const commerceProfiles = pgTable('commerce_profiles', {
  commerceProfileId: varchar('commerce_profile_id', { length: 128 }).primaryKey(),
  owningIdentityId: varchar('owning_identity_id', { length: 128 })
    .notNull()
    .references(() => identities.identityId, { onDelete: 'restrict' }),
  lifecycle: varchar('lifecycle', { length: 32 }).notNull().default('ACTIVE'),
  displayName: varchar('display_name', { length: 256 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export type CommerceProfileRow = typeof commerceProfiles.$inferSelect;
