import { index, jsonb, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const commerceIdentities = pgTable(
  'commerce_identities',
  {
    creatorId: varchar('creator_id', { length: 128 }).primaryKey(),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    bio: varchar('bio', { length: 2_000 }).notNull(),
    avatarUrl: varchar('avatar_url', { length: 2_048 }),
    location: varchar('location', { length: 120 }),
    socialLinks: jsonb('social_links').$type<string[]>().notNull().default([]),
    state: varchar('state', { length: 32 }).notNull().default('draft'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('commerce_identities_creator_id_idx').on(table.creatorId)],
);

export const creatorCapabilities = pgTable('creator_capabilities', {
  id: varchar('id', { length: 128 }).primaryKey(),
  creatorId: varchar('creator_id', { length: 128 }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  description: varchar('description', { length: 1_000 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export const serviceOfferings = pgTable(
  'service_offerings',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    capabilityIds: jsonb('capability_ids').$type<string[]>().notNull().default([]),
    title: varchar('title', { length: 160 }).notNull(),
    description: varchar('description', { length: 2_000 }).notNull(),
    availabilityDescription: varchar('availability_description', { length: 1_000 }),
    appearance: jsonb('appearance').$type<{
      appearanceType: 'convention' | 'guest' | 'brand' | 'photo' | 'signing';
      startsOn: string;
      endsOn?: string;
      locationDescription: string;
      buyerType: 'organizer' | 'brand' | 'fan_group' | 'approved_external_requester';
      pricingRule?: string;
      requestCallToAction: string;
      upcomingTitle: string;
      externalUrl?: string;
    }>(),
    requestInstructions: varchar('request_instructions', { length: 1_000 }).notNull(),
    state: varchar('state', { length: 32 }).notNull().default('draft'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('service_offerings_id_idx').on(table.id),
    uniqueIndex('service_offerings_creator_id_id_idx').on(table.creatorId, table.id),
  ],
);

export const distributionAssets = pgTable('distribution_assets', {
  offeringId: varchar('offering_id', { length: 128 }).primaryKey(),
  publicUrl: varchar('public_url', { length: 2_048 }).notNull(),
  state: varchar('state', { length: 32 }).notNull().default('generated'),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable(
  'customers',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    contactName: varchar('contact_name', { length: 160 }).notNull(),
    contactMethod: varchar('contact_method', { length: 320 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('customers_contact_method_idx').on(table.contactMethod)],
);

export const commerceActions = pgTable(
  'commerce_actions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    customerId: varchar('customer_id', { length: 128 }).notNull(),
    creatorId: varchar('creator_id', { length: 128 }).notNull(),
    offeringId: varchar('offering_id', { length: 128 }).notNull(),
    requestMessage: varchar('request_message', { length: 2_000 }).notNull(),
    resultAccessToken: varchar('result_access_token', { length: 128 }).notNull(),
    state: varchar('state', { length: 32 }).notNull().default('draft'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('commerce_actions_id_idx').on(table.id),
    uniqueIndex('commerce_actions_result_access_token_idx').on(table.resultAccessToken),
    index('commerce_actions_customer_offering_state_idx').on(
      table.customerId,
      table.offeringId,
      table.state,
    ),
  ],
);

export type CommerceIdentityRow = typeof commerceIdentities.$inferSelect;
export type CreatorCapabilityRow = typeof creatorCapabilities.$inferSelect;
export type ServiceOfferingRow = typeof serviceOfferings.$inferSelect;
export type DistributionAssetRow = typeof distributionAssets.$inferSelect;
export type CustomerRow = typeof customers.$inferSelect;
export type CommerceActionRow = typeof commerceActions.$inferSelect;
