import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  foreignKey,
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
    unique('operations_accounts_account_principal_unique').on(table.accountId, table.principalId),
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

const sessionDigestBytes = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});

export const operationsSessions = pgTable(
  'operations_sessions',
  {
    sessionId: varchar('session_id', { length: 128 }).primaryKey(),
    principalId: varchar('principal_id', { length: 128 })
      .notNull()
      .references(() => operationsHumanPrincipals.principalId, { onDelete: 'restrict' }),
    accountId: varchar('account_id', { length: 128 }).notNull(),
    credentialDigest: sessionDigestBytes('credential_digest').notNull(),
    status: varchar('status', { length: 16 }).notNull().default('active'),
    credentialVersion: integer('credential_version').notNull(),
    principalSecurityEpoch: integer('principal_security_epoch').notNull(),
    sessionVersion: integer('session_version').notNull().default(1),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).notNull(),
    lastActivityAt: timestamp('last_activity_at', { mode: 'string', withTimezone: true }).notNull(),
    idleExpiresAt: timestamp('idle_expires_at', { mode: 'string', withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp('absolute_expires_at', {
      mode: 'string',
      withTimezone: true,
    }).notNull(),
    mfaVerifiedAt: timestamp('mfa_verified_at', { mode: 'string', withTimezone: true }),
    revokedAt: timestamp('revoked_at', { mode: 'string', withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: 'operations_sessions_account_principal_fk',
      columns: [table.accountId, table.principalId],
      foreignColumns: [operationsAccounts.accountId, operationsAccounts.principalId],
    }).onDelete('restrict'),
    unique('operations_sessions_credential_digest_unique').on(table.credentialDigest),
    index('operations_sessions_account_id_idx').on(table.accountId),
    index('operations_sessions_principal_id_idx').on(table.principalId),
    check(
      'operations_sessions_digest_length_check',
      sql`octet_length(${table.credentialDigest}) = 32`,
    ),
    check('operations_sessions_status_check', sql`${table.status} in ('active', 'revoked')`),
    check('operations_sessions_credential_version_check', sql`${table.credentialVersion} >= 1`),
    check('operations_sessions_security_epoch_check', sql`${table.principalSecurityEpoch} >= 0`),
    check('operations_sessions_session_version_check', sql`${table.sessionVersion} >= 1`),
    check(
      'operations_sessions_lifecycle_check',
      sql`(${table.status} = 'active' and ${table.revokedAt} is null) or (${table.status} = 'revoked' and ${table.revokedAt} is not null)`,
    ),
    check(
      'operations_sessions_time_order_check',
      sql`${table.createdAt} <= ${table.lastActivityAt} and ${table.lastActivityAt} <= ${table.idleExpiresAt} and ${table.idleExpiresAt} <= ${table.absoluteExpiresAt} and ${table.absoluteExpiresAt} > ${table.createdAt}`,
    ),
  ],
);

export const operationsIdentityLifecycleAudits = pgTable(
  'operations_identity_lifecycle_audits',
  {
    auditId: varchar('audit_id', { length: 128 }).primaryKey(),
    operationId: varchar('operation_id', { length: 128 }).notNull(),
    correlationId: varchar('correlation_id', { length: 128 }).notNull(),
    principalId: varchar('principal_id', { length: 128 }).references(
      () => operationsHumanPrincipals.principalId,
      { onDelete: 'restrict' },
    ),
    accountId: varchar('account_id', { length: 128 }).references(
      () => operationsAccounts.accountId,
      {
        onDelete: 'restrict',
      },
    ),
    subjectType: varchar('subject_type', { length: 32 }).notNull(),
    subjectId: varchar('subject_id', { length: 128 }).notNull(),
    operationType: varchar('operation_type', { length: 64 }).notNull(),
    beforeStatus: varchar('before_status', { length: 32 }),
    afterStatus: varchar('after_status', { length: 32 }).notNull(),
    beforeActivationHistory: varchar('before_activation_history', { length: 32 }),
    afterActivationHistory: varchar('after_activation_history', { length: 32 }).notNull(),
    beforePrincipalEpoch: integer('before_principal_epoch'),
    afterPrincipalEpoch: integer('after_principal_epoch'),
    credentialId: varchar('credential_id', { length: 128 }),
    credentialVersion: integer('credential_version'),
    sessionVersion: integer('session_version'),
    revokedCredentialCount: integer('revoked_credential_count').notNull().default(0),
    revokedSessionCount: integer('revoked_session_count').notNull().default(0),
    result: varchar('result', { length: 16 }).notNull(),
    reasonCode: varchar('reason_code', { length: 128 }).notNull(),
    eventOccurredAt: timestamp('event_occurred_at', {
      mode: 'string',
      withTimezone: true,
    }).notNull(),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    evidenceRef: varchar('evidence_ref', { length: 256 }),
    decisionRef: varchar('decision_ref', { length: 256 }),
  },
  (table) => [
    index('operations_identity_lifecycle_audits_principal_idx').on(
      table.principalId,
      table.eventOccurredAt,
    ),
    index('operations_identity_lifecycle_audits_account_idx').on(
      table.accountId,
      table.eventOccurredAt,
    ),
    unique('operations_identity_lifecycle_audits_operation_subject_unique').on(
      table.operationId,
      table.subjectType,
      table.subjectId,
    ),
    check(
      'operations_identity_lifecycle_audits_subject_type_check',
      sql`${table.subjectType} in ('human_principal', 'operations_account')`,
    ),
    check(
      'operations_identity_lifecycle_audits_operation_type_check',
      sql`${table.operationType} in ('principal_created', 'account_created', 'legacy_history_initialized', 'principal_first_activated', 'account_first_activated')`,
    ),
    check(
      'operations_identity_lifecycle_audits_history_check',
      sql`${table.afterActivationHistory} in ('never_activated', 'previously_activated', 'unknown')
        and (${table.beforeActivationHistory} is null or ${table.beforeActivationHistory} in ('never_activated', 'previously_activated', 'unknown'))`,
    ),
    check('operations_identity_lifecycle_audits_result_check', sql`${table.result} = 'success'`),
    check(
      'operations_identity_lifecycle_audits_epoch_check',
      sql`(${table.beforePrincipalEpoch} is null or ${table.beforePrincipalEpoch} >= 0)
        and (${table.afterPrincipalEpoch} is null or ${table.afterPrincipalEpoch} >= 0)`,
    ),
    check(
      'operations_identity_lifecycle_audits_count_check',
      sql`${table.revokedCredentialCount} >= 0 and ${table.revokedSessionCount} >= 0`,
    ),
  ],
);

export const operationsHumanPrincipalActivationHistories = pgTable(
  'operations_human_principal_activation_histories',
  {
    principalId: varchar('principal_id', { length: 128 })
      .primaryKey()
      .references(() => operationsHumanPrincipals.principalId, { onDelete: 'restrict' }),
    activationHistory: varchar('activation_history', { length: 32 }).notNull(),
    origin: varchar('origin', { length: 32 }).notNull(),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    changedAt: timestamp('changed_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    lastHistoryAuditId: varchar('last_history_audit_id', { length: 128 })
      .notNull()
      .references(() => operationsIdentityLifecycleAudits.auditId, {
        onDelete: 'restrict',
      }),
  },
  (table) => [
    check(
      'operations_human_principal_activation_histories_history_check',
      sql`${table.activationHistory} in ('never_activated', 'previously_activated', 'unknown')`,
    ),
    check(
      'operations_human_principal_activation_histories_origin_check',
      sql`${table.origin} in ('new_subject', 'legacy_backfill')`,
    ),
  ],
);

export const operationsAccountActivationHistories = pgTable(
  'operations_account_activation_histories',
  {
    accountId: varchar('account_id', { length: 128 })
      .primaryKey()
      .references(() => operationsAccounts.accountId, { onDelete: 'restrict' }),
    activationHistory: varchar('activation_history', { length: 32 }).notNull(),
    origin: varchar('origin', { length: 32 }).notNull(),
    recordedAt: timestamp('recorded_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    changedAt: timestamp('changed_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    lastHistoryAuditId: varchar('last_history_audit_id', { length: 128 })
      .notNull()
      .references(() => operationsIdentityLifecycleAudits.auditId, {
        onDelete: 'restrict',
      }),
  },
  (table) => [
    check(
      'operations_account_activation_histories_history_check',
      sql`${table.activationHistory} in ('never_activated', 'previously_activated', 'unknown')`,
    ),
    check(
      'operations_account_activation_histories_origin_check',
      sql`${table.origin} in ('new_subject', 'legacy_backfill')`,
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
export type OperationsSessionRow = typeof operationsSessions.$inferSelect;
export type OperationsIdentityLifecycleAuditRow =
  typeof operationsIdentityLifecycleAudits.$inferSelect;
export type OperationsHumanPrincipalActivationHistoryRow =
  typeof operationsHumanPrincipalActivationHistories.$inferSelect;
export type OperationsAccountActivationHistoryRow =
  typeof operationsAccountActivationHistories.$inferSelect;
export type ServicePrincipalRow = typeof servicePrincipals.$inferSelect;
