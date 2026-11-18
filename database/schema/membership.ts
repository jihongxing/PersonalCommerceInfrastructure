import { sql } from 'drizzle-orm';
import {
  check,
  type AnyPgColumn,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const membershipOfferings = pgTable(
  'membership_offerings',
  {
    id: uuid('id').primaryKey(),
    providerId: text('provider_id').notNull(),
    data: jsonb('data').notNull(),
  },
  (table) => [index('membership_offerings_provider_idx').on(table.providerId, table.id)],
);

export const membershipApplications = pgTable(
  'membership_applications',
  {
    id: uuid('id').primaryKey(),
    offeringId: uuid('offering_id')
      .notNull()
      .references(() => membershipOfferings.id),
    accountId: text('account_id').notNull(),
    data: jsonb('data').notNull(),
  },
  (table) => [
    unique('membership_applications_offering_id_account_id_key').on(
      table.offeringId,
      table.accountId,
    ),
    index('membership_applications_account_idx').on(table.accountId, table.id),
  ],
);

export const commercialMemberships = pgTable('commercial_memberships', {
  id: uuid('id').primaryKey(),
  applicationId: uuid('application_id')
    .notNull()
    .unique('commercial_memberships_application_id_key')
    .references(() => membershipApplications.id),
  data: jsonb('data').notNull(),
});

export const membershipFacts = pgTable(
  'membership_facts',
  {
    id: uuid('id').primaryKey(),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => commercialMemberships.id),
    kind: text('kind').notNull(),
    referenceId: uuid('reference_id').references((): AnyPgColumn => membershipFacts.id),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    data: jsonb('data').notNull(),
  },
  (table) => [
    check(
      'membership_facts_kind_check',
      sql`${table.kind} IN ('verification', 'admission', 'admission_correction')`,
    ),
    check(
      'membership_facts_check',
      sql`(${table.kind} = 'verification') = (${table.referenceId} IS NULL)`,
    ),
    unique('membership_facts_kind_reference_id_key').on(table.kind, table.referenceId),
    index('membership_facts_member_idx').on(table.membershipId, table.occurredAt, table.id),
  ],
);
