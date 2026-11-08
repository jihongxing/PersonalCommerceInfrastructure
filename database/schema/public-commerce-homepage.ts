import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { commerceProfiles } from './commerce-profile.js';
import { identities } from './identity.js';

export const publicCommerceHomepages = pgTable(
  'public_commerce_homepages',
  {
    identityId: varchar('identity_id', { length: 128 })
      .primaryKey()
      .references(() => identities.identityId, { onDelete: 'restrict' }),
    commerceProfileId: varchar('commerce_profile_id', { length: 128 }),
    state: varchar('state', { length: 32 }).notNull().default('UNPUBLISHED'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: 'public_commerce_homepages_owned_profile_fk',
      columns: [table.identityId, table.commerceProfileId],
      foreignColumns: [commerceProfiles.owningIdentityId, commerceProfiles.commerceProfileId],
    }).onDelete('restrict'),
    check(
      'public_commerce_homepages_state_check',
      sql`${table.state} in ('UNPUBLISHED', 'PUBLISHED', 'PAUSED')`,
    ),
    check(
      'public_commerce_homepages_published_profile_check',
      sql`${table.state} = 'UNPUBLISHED' or ${table.commerceProfileId} is not null`,
    ),
  ],
);

export const publicCommerceHomepageAudit = pgTable('public_commerce_homepage_audit', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  identityId: varchar('identity_id', { length: 128 })
    .notNull()
    .references(() => identities.identityId, { onDelete: 'restrict' }),
  actorAccountId: varchar('actor_account_id', { length: 256 }).notNull(),
  oldState: varchar('old_state', { length: 32 }),
  newState: varchar('new_state', { length: 32 }).notNull(),
  oldProfileId: varchar('old_profile_id', { length: 128 }),
  newProfileId: varchar('new_profile_id', { length: 128 }),
  occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const publicCommerceHomepageVersions = pgTable(
  'public_commerce_homepage_versions',
  {
    homepageId: varchar('homepage_id', { length: 128 }).primaryKey(),
    identityId: varchar('identity_id', { length: 128 })
      .notNull()
      .references(() => identities.identityId, { onDelete: 'restrict' }),
    commerceProfileId: varchar('commerce_profile_id', { length: 128 }),
    state: varchar('state', { length: 32 }).notNull().default('UNPUBLISHED'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: 'public_commerce_homepage_versions_owned_profile_fk',
      columns: [table.identityId, table.commerceProfileId],
      foreignColumns: [commerceProfiles.owningIdentityId, commerceProfiles.commerceProfileId],
    }).onDelete('restrict'),
    check(
      'public_commerce_homepage_versions_state_check',
      sql`${table.state} in ('UNPUBLISHED', 'PUBLISHED', 'PAUSED', 'ARCHIVED')`,
    ),
    check(
      'public_commerce_homepage_versions_published_profile_check',
      sql`${table.state} = 'UNPUBLISHED' or ${table.commerceProfileId} is not null`,
    ),
    check(
      'public_commerce_homepage_versions_default_state_check',
      sql`not ${table.isDefault} or ${table.state} = 'PUBLISHED'`,
    ),
    uniqueIndex('public_commerce_homepage_versions_default_unique')
      .on(table.identityId)
      .where(sql`${table.isDefault}`),
    unique('public_commerce_homepage_versions_identity_homepage_unique').on(
      table.identityId,
      table.homepageId,
    ),
    index('public_commerce_homepage_versions_identity_idx').on(table.identityId),
  ],
);

export const publicCommerceHomepageWindows = pgTable(
  'public_commerce_homepage_windows',
  {
    windowId: varchar('window_id', { length: 128 }).primaryKey(),
    identityId: varchar('identity_id', { length: 128 }).notNull(),
    homepageId: varchar('homepage_id', { length: 128 }).notNull(),
    startsAt: timestamp('starts_at', { mode: 'string', withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { mode: 'string', withTimezone: true }).notNull(),
    timeZone: varchar('time_zone', { length: 64 }).notNull(),
    state: varchar('state', { length: 32 }).notNull().default('ENABLED'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: 'public_commerce_homepage_windows_version_fk',
      columns: [table.identityId, table.homepageId],
      foreignColumns: [
        publicCommerceHomepageVersions.identityId,
        publicCommerceHomepageVersions.homepageId,
      ],
    }).onDelete('cascade'),
    check(
      'public_commerce_homepage_windows_state_check',
      sql`${table.state} in ('ENABLED', 'DISABLED')`,
    ),
    check('public_commerce_homepage_windows_range_check', sql`${table.startsAt} < ${table.endsAt}`),
    index('public_commerce_homepage_windows_identity_idx').on(table.identityId),
  ],
);

export const publicCommerceHomepageVersionAudit = pgTable(
  'public_commerce_homepage_version_audit',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    identityId: varchar('identity_id', { length: 128 })
      .notNull()
      .references(() => identities.identityId, { onDelete: 'restrict' }),
    homepageId: varchar('homepage_id', { length: 128 }),
    windowId: varchar('window_id', { length: 128 }),
    actorAccountId: varchar('actor_account_id', { length: 256 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);
