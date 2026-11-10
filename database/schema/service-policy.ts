import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const servicePolicyReleases = pgTable('service_policy_releases', {
  policyVersion: varchar('policy_version', { length: 32 }).primaryKey(),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  reason: varchar('reason', { length: 1_024 }).notNull(),
  publishedBy: varchar('published_by', { length: 128 }),
  publishedAt: timestamp('published_at', { mode: 'string', withTimezone: true }),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export const servicePolicyCapabilities = pgTable(
  'service_policy_capabilities',
  {
    id: varchar('id', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    vertical: varchar('vertical', { length: 120 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: varchar('description', { length: 2_000 }).notNull(),
    riskTier: varchar('risk_tier', { length: 32 }).notNull(),
    releaseScope: varchar('release_scope', { length: 32 }).notNull(),
    aliases: jsonb('aliases').$type<string[]>().notNull().default([]),
    version: varchar('version', { length: 32 }).notNull(),
    policyVersion: varchar('policy_version', { length: 32 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('draft'),
    creatorSelectable: boolean('creator_selectable').notNull().default(true),
    publishEnabled: boolean('publish_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.policyVersion] }),
    index('service_policy_capabilities_status_idx').on(table.status, table.policyVersion),
  ],
);

export const servicePolicyTemplates = pgTable(
  'service_policy_templates',
  {
    id: varchar('id', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    capabilityCatalogItemId: varchar('capability_catalog_item_id', { length: 128 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: varchar('description', { length: 2_000 }).notNull(),
    riskTier: varchar('risk_tier', { length: 32 }).notNull(),
    releaseScope: varchar('release_scope', { length: 32 }).notNull(),
    requiredFields: jsonb('required_fields').$type<string[]>().notNull().default([]),
    version: varchar('version', { length: 32 }).notNull(),
    policyVersion: varchar('policy_version', { length: 32 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('draft'),
    creatorSelectable: boolean('creator_selectable').notNull().default(true),
    publishEnabled: boolean('publish_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.policyVersion] }),
    index('service_policy_templates_capability_idx').on(table.capabilityCatalogItemId),
    index('service_policy_templates_status_idx').on(table.status, table.policyVersion),
  ],
);

export const servicePolicyAudits = pgTable(
  'service_policy_audits',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    actorId: varchar('actor_id', { length: 128 }).notNull(),
    entityType: varchar('entity_type', { length: 32 }).notNull(),
    entityId: varchar('entity_id', { length: 128 }).notNull(),
    action: varchar('action', { length: 32 }).notNull(),
    beforeState: jsonb('before_state').$type<Record<string, unknown>>().notNull().default({}),
    afterState: jsonb('after_state').$type<Record<string, unknown>>().notNull().default({}),
    reason: varchar('reason', { length: 1_024 }).notNull(),
    policyVersion: varchar('policy_version', { length: 32 }).notNull(),
    occurredAt: timestamp('occurred_at', { mode: 'string', withTimezone: true }).notNull(),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('service_policy_audits_entity_idx').on(
      table.entityType,
      table.entityId,
      table.occurredAt,
    ),
    index('service_policy_audits_actor_idx').on(table.actorId, table.occurredAt),
  ],
);
