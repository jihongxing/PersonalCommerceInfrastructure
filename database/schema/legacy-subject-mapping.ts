import { sql } from 'drizzle-orm';
import { check, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { commerceProfiles } from './commerce-profile.js';
import { identities } from './identity.js';

export const legacySubjectMappings = pgTable(
  'legacy_subject_mappings',
  {
    mappingId: varchar('mapping_id', { length: 128 }).primaryKey(),
    legacySubjectReference: varchar('legacy_subject_reference', { length: 128 }).notNull(),
    identityId: varchar('identity_id', { length: 128 })
      .notNull()
      .references(() => identities.identityId, { onDelete: 'restrict' }),
    initialCommerceProfileId: varchar('initial_commerce_profile_id', { length: 128 })
      .notNull()
      .references(() => commerceProfiles.commerceProfileId, { onDelete: 'restrict' }),
    state: varchar('state', { length: 32 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    verifiedAt: timestamp('verified_at', { mode: 'string', withTimezone: true }),
    mappingFailureCode: varchar('mapping_failure_code', { length: 64 }),
  },
  (table) => [
    uniqueIndex('legacy_subject_mappings_legacy_subject_reference_unique').on(
      table.legacySubjectReference,
    ),
    uniqueIndex('legacy_subject_mappings_initial_commerce_profile_unique').on(
      table.initialCommerceProfileId,
    ),
    uniqueIndex('legacy_subject_mappings_identity_profile_unique').on(
      table.identityId,
      table.initialCommerceProfileId,
    ),
    check(
      'legacy_subject_mappings_state_check',
      sql`${table.state} IN ('ACTIVE', 'VERIFIED', 'AMBIGUOUS', 'FAILED', 'RETIRED')`,
    ),
    check(
      'legacy_subject_mappings_failure_code_check',
      sql`((${table.state} IN ('AMBIGUOUS', 'FAILED') AND ${table.mappingFailureCode} IS NOT NULL) OR (${table.state} NOT IN ('AMBIGUOUS', 'FAILED') AND ${table.mappingFailureCode} IS NULL))`,
    ),
    check(
      'legacy_subject_mappings_verified_at_check',
      sql`((${table.state} = 'VERIFIED' AND ${table.verifiedAt} IS NOT NULL) OR (${table.state} <> 'VERIFIED' AND ${table.verifiedAt} IS NULL))`,
    ),
  ],
);

export type LegacySubjectMappingRow = typeof legacySubjectMappings.$inferSelect;
