import { pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const identities = pgTable('identities', {
  identityId: varchar('identity_id', { length: 128 }).primaryKey(),
  lifecycle: varchar('lifecycle', { length: 32 }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).notNull().defaultNow(),
});

export type IdentityRow = typeof identities.$inferSelect;
