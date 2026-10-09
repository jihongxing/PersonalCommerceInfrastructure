import { sql } from 'drizzle-orm';
import { check, pgTable, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

import { commerceProfiles } from './commerce-profile.js';

export const commerceReferences = pgTable(
  'commerce_references',
  {
    commerceReference: varchar('commerce_reference', { length: 18 }).primaryKey().notNull(),
    commerceProfileId: varchar('commerce_profile_id', { length: 128 })
      .notNull()
      .references(() => commerceProfiles.commerceProfileId, {
        onDelete: 'restrict',
        onUpdate: 'no action',
      }),
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
    check(
      'commerce_references_lifecycle_check',
      sql`${table.lifecycle} IN ('ASSIGNED', 'PERMANENTLY_RESERVED')`,
    ),
  ],
);
