import { sql } from 'drizzle-orm';
import { check, pgTable, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

import { commerceProfiles } from './commerce-profile.js';
import { identities } from './identity.js';

export const commerceReferences = pgTable(
  'commerce_references',
  {
    commerceReference: varchar('commerce_reference', { length: 18 }).primaryKey().notNull(),
    identityId: varchar('identity_id', { length: 128 })
      .notNull()
      .references(() => identities.identityId, { onDelete: 'restrict' }),
    commerceProfileId: varchar('commerce_profile_id', { length: 128 }).references(
      () => commerceProfiles.commerceProfileId,
      {
        onDelete: 'restrict',
        onUpdate: 'no action',
      },
    ),
    lifecycle: varchar('lifecycle', { length: 32 }).notNull().default('ASSIGNED'),
    assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('commerce_references_commerce_profile_id_unique').on(table.commerceProfileId),
    unique('commerce_references_identity_id_unique').on(table.identityId),
    check(
      'commerce_references_format_check',
      sql`${table.commerceReference} ~ '^[3479ACDEFHJKMNPQRTVWXY]{18}$'`,
    ),
    check(
      'commerce_references_lifecycle_check',
      sql`${table.lifecycle} IN ('ASSIGNED', 'PERMANENTLY_RESERVED')`,
    ),
  ],
);
