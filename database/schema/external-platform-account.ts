import { pgTable, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

export const externalPlatformAccounts = pgTable(
  'external_platform_accounts',
  {
    externalPlatformAccountId: varchar('external_platform_account_id', {
      length: 128,
    }).primaryKey(),
    platform: varchar('platform', { length: 64 }).notNull(),
    platformAccountId: varchar('platform_account_id', { length: 256 }).notNull(),
    lifecycle: varchar('lifecycle', { length: 32 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('external_platform_accounts_platform_platform_account_id_unique').on(
      table.platform,
      table.platformAccountId,
    ),
  ],
);
