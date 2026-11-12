import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const operationsHumanPrincipals = pgTable(
  'operations_human_principals',
  {
    principalId: varchar('principal_id', { length: 128 }).primaryKey(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    securityEpoch: integer('security_epoch').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'operations_human_principals_status_check',
      sql`${table.status} in ('pending', 'active', 'suspended', 'disabled', 'tombstoned')`,
    ),
    check('operations_human_principals_security_epoch_check', sql`${table.securityEpoch} >= 0`),
  ],
);

export const operationsAccounts = pgTable(
  'operations_accounts',
  {
    accountId: varchar('account_id', { length: 128 }).primaryKey(),
    principalId: varchar('principal_id', { length: 128 })
      .notNull()
      .references(() => operationsHumanPrincipals.principalId, { onDelete: 'restrict' }),
    loginIdentifierNormalized: varchar('login_identifier_normalized', { length: 320 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('invited'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('operations_accounts_principal_id_unique').on(table.principalId),
    unique('operations_accounts_login_identifier_normalized_unique').on(
      table.loginIdentifierNormalized,
    ),
    check(
      'operations_accounts_status_check',
      sql`${table.status} in ('invited', 'active', 'locked', 'disabled', 'revoked')`,
    ),
  ],
);

export const operationsCredentials = pgTable(
  'operations_credentials',
  {
    credentialId: varchar('credential_id', { length: 128 }).primaryKey(),
    accountId: varchar('account_id', { length: 128 })
      .notNull()
      .references(() => operationsAccounts.accountId, { onDelete: 'restrict' }),
    kind: varchar('kind', { length: 32 }).notNull().default('password'),
    status: varchar('status', { length: 16 }).notNull().default('active'),
    verifier: text('verifier').notNull(),
    version: integer('version').notNull(),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp('revoked_at', { mode: 'string', withTimezone: true }),
  },
  (table) => [
    unique('operations_credentials_account_kind_version_unique').on(
      table.accountId,
      table.kind,
      table.version,
    ),
    uniqueIndex('operations_credentials_active_account_unique')
      .on(table.accountId)
      .where(sql`${table.kind} = 'password' and ${table.status} = 'active'`),
    index('operations_credentials_account_id_idx').on(table.accountId),
    check('operations_credentials_kind_check', sql`${table.kind} = 'password'`),
    check('operations_credentials_status_check', sql`${table.status} in ('active', 'revoked')`),
    check(
      'operations_credentials_verifier_check',
      sql`length(regexp_replace(${table.verifier}, '[[:space:]]', '', 'g')) > 0`,
    ),
    check('operations_credentials_version_check', sql`${table.version} >= 1`),
    check(
      'operations_credentials_lifecycle_check',
      sql`(${table.status} = 'active' and ${table.revokedAt} is null)
        or (${table.status} = 'revoked' and ${table.revokedAt} is not null)`,
    ),
  ],
);

export const servicePrincipals = pgTable(
  'service_principals',
  {
    servicePrincipalId: varchar('service_principal_id', { length: 128 }).primaryKey(),
    kind: varchar('kind', { length: 32 }).notNull(),
    providerId: varchar('provider_id', { length: 128 }),
    systemId: varchar('system_id', { length: 128 }),
    status: varchar('status', { length: 32 }).notNull().default('active'),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('service_principals_provider_id_unique').on(table.providerId),
    unique('service_principals_system_id_unique').on(table.systemId),
    check(
      'service_principals_status_check',
      sql`${table.status} in ('active', 'suspended', 'disabled', 'revoked')`,
    ),
    check(
      'service_principals_kind_discriminator_check',
      sql`(
        (${table.kind} = 'provider_service' and ${table.providerId} is not null and ${table.systemId} is null)
        or
        (${table.kind} = 'platform_system' and ${table.providerId} is null and ${table.systemId} is not null)
      )`,
    ),
  ],
);

export type OperationsHumanPrincipalRow = typeof operationsHumanPrincipals.$inferSelect;
export type OperationsAccountRow = typeof operationsAccounts.$inferSelect;
export type OperationsCredentialRow = typeof operationsCredentials.$inferSelect;
export type ServicePrincipalRow = typeof servicePrincipals.$inferSelect;
