declare const operationsHumanPrincipalIdBrand: unique symbol;
declare const operationsAccountIdBrand: unique symbol;
declare const operationsCredentialIdBrand: unique symbol;
declare const operationsSessionIdBrand: unique symbol;
declare const operationsMfaFactorIdBrand: unique symbol;
declare const servicePrincipalIdBrand: unique symbol;
declare const serviceCredentialIdBrand: unique symbol;
declare const providerIdBrand: unique symbol;
declare const platformSystemIdBrand: unique symbol;

export type OperationsHumanPrincipalId = string & {
  readonly [operationsHumanPrincipalIdBrand]: 'OperationsHumanPrincipalId';
};

export type OperationsAccountId = string & {
  readonly [operationsAccountIdBrand]: 'OperationsAccountId';
};

export type OperationsCredentialId = string & {
  readonly [operationsCredentialIdBrand]: 'OperationsCredentialId';
};

export type OperationsSessionId = string & {
  readonly [operationsSessionIdBrand]: 'OperationsSessionId';
};

export type OperationsMfaFactorId = string & {
  readonly [operationsMfaFactorIdBrand]: 'OperationsMfaFactorId';
};

export type ServicePrincipalId = string & {
  readonly [servicePrincipalIdBrand]: 'ServicePrincipalId';
};

export type ServiceCredentialId = string & {
  readonly [serviceCredentialIdBrand]: 'ServiceCredentialId';
};

export type ProviderId = string & {
  readonly [providerIdBrand]: 'ProviderId';
};

export type PlatformSystemId = string & {
  readonly [platformSystemIdBrand]: 'PlatformSystemId';
};

export type OperationsHumanPrincipalStatus =
  'pending' | 'active' | 'suspended' | 'disabled' | 'tombstoned';

export type OperationsAccountStatus = 'invited' | 'active' | 'locked' | 'disabled' | 'revoked';

export type OperationsCredentialStatus = 'active' | 'revoked';

export type OperationsSessionStatus = 'active' | 'revoked';

export type OperationsMfaFactorKind = 'webauthn' | 'totp' | 'recovery_code';

export type OperationsMfaFactorStatus = 'pending' | 'active' | 'revoked';

export type ServicePrincipalStatus = 'active' | 'suspended' | 'disabled' | 'revoked';

export type ServiceCredentialKind = 'provider_signature' | 'api_key' | 'mtls' | 'workload_identity';

export type ServiceCredentialStatus = 'active' | 'revoked';

export interface OperationsHumanPrincipal {
  readonly id: OperationsHumanPrincipalId;
  readonly status: OperationsHumanPrincipalStatus;
  readonly securityEpoch: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OperationsAccount {
  readonly id: OperationsAccountId;
  readonly principalId: OperationsHumanPrincipalId;
  readonly loginIdentifierNormalized: string;
  readonly status: OperationsAccountStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OperationsCredentialMetadata {
  readonly id: OperationsCredentialId;
  readonly accountId: OperationsAccountId;
  readonly kind: 'password';
  readonly status: OperationsCredentialStatus;
  readonly version: number;
  readonly createdAt: Date;
  readonly revokedAt?: Date;
}

export interface OperationsSession {
  readonly id: OperationsSessionId;
  readonly principalId: OperationsHumanPrincipalId;
  readonly accountId: OperationsAccountId;
  readonly status: OperationsSessionStatus;
  readonly credentialVersion: number;
  readonly principalSecurityEpoch: number;
  readonly createdAt: Date;
  readonly lastActivityAt: Date;
  readonly idleExpiresAt: Date;
  readonly absoluteExpiresAt: Date;
  readonly mfaVerifiedAt?: Date;
  readonly revokedAt?: Date;
}

export interface OperationsMfaFactorMetadata {
  readonly id: OperationsMfaFactorId;
  readonly principalId: OperationsHumanPrincipalId;
  readonly kind: OperationsMfaFactorKind;
  readonly status: OperationsMfaFactorStatus;
  readonly enrolledAt?: Date;
  readonly revokedAt?: Date;
}

export interface ProviderServicePrincipal {
  readonly id: ServicePrincipalId;
  readonly kind: 'provider_service';
  readonly providerId: ProviderId;
  readonly status: ServicePrincipalStatus;
  readonly createdAt: Date;
}

export interface PlatformSystemPrincipal {
  readonly id: ServicePrincipalId;
  readonly kind: 'platform_system';
  readonly systemId: PlatformSystemId;
  readonly status: ServicePrincipalStatus;
  readonly createdAt: Date;
}

export type ServicePrincipal = ProviderServicePrincipal | PlatformSystemPrincipal;

export interface ServiceCredentialMetadata {
  readonly id: ServiceCredentialId;
  readonly servicePrincipalId: ServicePrincipalId;
  readonly kind: ServiceCredentialKind;
  readonly status: ServiceCredentialStatus;
  readonly createdAt: Date;
  readonly expiresAt?: Date;
  readonly revokedAt?: Date;
}

export interface HumanOperationsSubject {
  readonly kind: 'operations_human';
  readonly principalId: OperationsHumanPrincipalId;
  readonly accountId: OperationsAccountId;
  readonly sessionId: OperationsSessionId;
}

export interface ProviderServiceSubject {
  readonly kind: 'provider_service';
  readonly servicePrincipalId: ServicePrincipalId;
  readonly providerId: ProviderId;
}

export interface PlatformSystemSubject {
  readonly kind: 'platform_system';
  readonly servicePrincipalId: ServicePrincipalId;
  readonly systemId: PlatformSystemId;
  readonly jobRunId?: string;
}

export type OperationsAuthenticatedSubject =
  HumanOperationsSubject | ProviderServiceSubject | PlatformSystemSubject;

export interface HumanDirectExecutionAttribution {
  readonly kind: 'human_direct';
  readonly initiatingSubject: HumanOperationsSubject;
  readonly executingSubject: HumanOperationsSubject;
  readonly operationId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface HumanInitiatedSystemExecutionAttribution {
  readonly kind: 'human_initiated_system';
  readonly initiatingSubject: HumanOperationsSubject;
  readonly executingSubject: PlatformSystemSubject;
  readonly operationId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface ProviderFactSystemExecutionAttribution {
  readonly kind: 'provider_fact_system';
  readonly initiatingSubject: ProviderServiceSubject;
  readonly executingSubject: PlatformSystemSubject;
  readonly operationId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface SystemAutonomousExecutionAttribution {
  readonly kind: 'system_autonomous';
  readonly executingSubject: PlatformSystemSubject;
  readonly operationId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export type ExecutionAttribution =
  | HumanDirectExecutionAttribution
  | HumanInitiatedSystemExecutionAttribution
  | ProviderFactSystemExecutionAttribution
  | SystemAutonomousExecutionAttribution;

export function createOperationsHumanPrincipalId(value: string): OperationsHumanPrincipalId {
  return createBrandedId(value, 'Operations Human Principal ID') as OperationsHumanPrincipalId;
}

export function createOperationsAccountId(value: string): OperationsAccountId {
  return createBrandedId(value, 'Operations Account ID') as OperationsAccountId;
}

export function createOperationsCredentialId(value: string): OperationsCredentialId {
  return createBrandedId(value, 'Operations Credential ID') as OperationsCredentialId;
}

export function createOperationsSessionId(value: string): OperationsSessionId {
  return createBrandedId(value, 'Operations Session ID') as OperationsSessionId;
}

export function createOperationsMfaFactorId(value: string): OperationsMfaFactorId {
  return createBrandedId(value, 'Operations MFA Factor ID') as OperationsMfaFactorId;
}

export function createServicePrincipalId(value: string): ServicePrincipalId {
  return createBrandedId(value, 'Service Principal ID') as ServicePrincipalId;
}

export function createServiceCredentialId(value: string): ServiceCredentialId {
  return createBrandedId(value, 'Service Credential ID') as ServiceCredentialId;
}

export function createProviderId(value: string): ProviderId {
  return createBrandedId(value, 'Provider ID') as ProviderId;
}

export function createPlatformSystemId(value: string): PlatformSystemId {
  return createBrandedId(value, 'Platform System ID') as PlatformSystemId;
}

export function createOperationsHumanPrincipal(input: {
  readonly id: OperationsHumanPrincipalId;
  readonly status: OperationsHumanPrincipalStatus;
  readonly securityEpoch: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}): OperationsHumanPrincipal {
  assertOperationsHumanPrincipal(input);
  return { ...input };
}

export function createOperationsAccount(input: {
  readonly id: OperationsAccountId;
  readonly principalId: OperationsHumanPrincipalId;
  readonly loginIdentifierNormalized: string;
  readonly status: OperationsAccountStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}): OperationsAccount {
  const account: OperationsAccount = {
    ...input,
    loginIdentifierNormalized: normalizeOperationsLoginIdentifier(input.loginIdentifierNormalized),
  };
  assertOperationsAccount(account);
  return account;
}

/** Canonical storage form for Operations account login identifiers. */
export function normalizeOperationsLoginIdentifier(value: string): string {
  if (typeof value !== 'string') {
    throw new OperationsDomainInvariantError('Operations login identifier must be a string.');
  }
  const normalized = value.trim().normalize('NFC');
  if (normalized.length === 0) {
    throw new OperationsDomainInvariantError('Operations login identifier cannot be empty.');
  }
  if ([...normalized].length > 320) {
    throw new OperationsDomainInvariantError(
      'Operations login identifier cannot exceed 320 characters.',
    );
  }
  return normalized;
}

export function createOperationsCredentialMetadata(input: {
  readonly id: OperationsCredentialId;
  readonly accountId: OperationsAccountId;
  readonly kind: 'password';
  readonly status: OperationsCredentialStatus;
  readonly version: number;
  readonly createdAt: Date;
  readonly revokedAt?: Date;
}): OperationsCredentialMetadata {
  assertOperationsCredentialMetadata(input);
  return { ...input };
}

export function createOperationsSession(input: {
  readonly id: OperationsSessionId;
  readonly account: OperationsAccount;
  readonly status: OperationsSessionStatus;
  readonly credentialVersion: number;
  readonly principalSecurityEpoch: number;
  readonly createdAt: Date;
  readonly lastActivityAt: Date;
  readonly idleExpiresAt: Date;
  readonly absoluteExpiresAt: Date;
  readonly mfaVerifiedAt?: Date;
  readonly revokedAt?: Date;
}): OperationsSession {
  const session: OperationsSession = {
    id: input.id,
    principalId: input.account.principalId,
    accountId: input.account.id,
    status: input.status,
    credentialVersion: input.credentialVersion,
    principalSecurityEpoch: input.principalSecurityEpoch,
    createdAt: input.createdAt,
    lastActivityAt: input.lastActivityAt,
    idleExpiresAt: input.idleExpiresAt,
    absoluteExpiresAt: input.absoluteExpiresAt,
    ...(input.mfaVerifiedAt === undefined ? {} : { mfaVerifiedAt: input.mfaVerifiedAt }),
    ...(input.revokedAt === undefined ? {} : { revokedAt: input.revokedAt }),
  };
  assertOperationsSession(session);
  return session;
}

export function createOperationsMfaFactorMetadata(input: {
  readonly id: OperationsMfaFactorId;
  readonly principalId: OperationsHumanPrincipalId;
  readonly kind: OperationsMfaFactorKind;
  readonly status: OperationsMfaFactorStatus;
  readonly enrolledAt?: Date;
  readonly revokedAt?: Date;
}): OperationsMfaFactorMetadata {
  assertOperationsMfaFactorMetadata(input);
  return { ...input };
}

export function createProviderServicePrincipal(input: {
  readonly id: ServicePrincipalId;
  readonly providerId: ProviderId;
  readonly status: ServicePrincipalStatus;
  readonly createdAt: Date;
}): ProviderServicePrincipal {
  const principal: ProviderServicePrincipal = { ...input, kind: 'provider_service' };
  assertProviderServicePrincipal(principal);
  return principal;
}

export function createPlatformSystemPrincipal(input: {
  readonly id: ServicePrincipalId;
  readonly systemId: PlatformSystemId;
  readonly status: ServicePrincipalStatus;
  readonly createdAt: Date;
}): PlatformSystemPrincipal {
  const principal: PlatformSystemPrincipal = { ...input, kind: 'platform_system' };
  assertPlatformSystemPrincipal(principal);
  return principal;
}

export function createServiceCredentialMetadata(input: {
  readonly id: ServiceCredentialId;
  readonly servicePrincipalId: ServicePrincipalId;
  readonly kind: ServiceCredentialKind;
  readonly status: ServiceCredentialStatus;
  readonly createdAt: Date;
  readonly expiresAt?: Date;
  readonly revokedAt?: Date;
}): ServiceCredentialMetadata {
  assertServiceCredentialMetadata(input);
  return { ...input };
}

export function createHumanOperationsSubject(input: {
  readonly principalId: OperationsHumanPrincipalId;
  readonly accountId: OperationsAccountId;
  readonly sessionId: OperationsSessionId;
}): HumanOperationsSubject {
  const subject: HumanOperationsSubject = { kind: 'operations_human', ...input };
  assertHumanOperationsSubject(subject);
  return subject;
}

export function createProviderServiceSubject(input: {
  readonly servicePrincipalId: ServicePrincipalId;
  readonly providerId: ProviderId;
}): ProviderServiceSubject {
  const subject: ProviderServiceSubject = { kind: 'provider_service', ...input };
  assertProviderServiceSubject(subject);
  return subject;
}

export function createPlatformSystemSubject(input: {
  readonly servicePrincipalId: ServicePrincipalId;
  readonly systemId: PlatformSystemId;
  readonly jobRunId?: string;
}): PlatformSystemSubject {
  const subject: PlatformSystemSubject = { kind: 'platform_system', ...input };
  assertPlatformSystemSubject(subject);
  return subject;
}

export function createHumanDirectExecutionAttribution(input: {
  readonly initiatingSubject: HumanOperationsSubject;
  readonly executingSubject: HumanOperationsSubject;
  readonly operationId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}): HumanDirectExecutionAttribution {
  const attribution: HumanDirectExecutionAttribution = { kind: 'human_direct', ...input };
  assertExecutionAttribution(attribution);
  return attribution;
}

export function createHumanInitiatedSystemExecutionAttribution(input: {
  readonly initiatingSubject: HumanOperationsSubject;
  readonly executingSubject: PlatformSystemSubject;
  readonly operationId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}): HumanInitiatedSystemExecutionAttribution {
  const attribution: HumanInitiatedSystemExecutionAttribution = {
    kind: 'human_initiated_system',
    ...input,
  };
  assertExecutionAttribution(attribution);
  return attribution;
}

export function createProviderFactSystemExecutionAttribution(input: {
  readonly initiatingSubject: ProviderServiceSubject;
  readonly executingSubject: PlatformSystemSubject;
  readonly operationId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}): ProviderFactSystemExecutionAttribution {
  const attribution: ProviderFactSystemExecutionAttribution = {
    kind: 'provider_fact_system',
    ...input,
  };
  assertExecutionAttribution(attribution);
  return attribution;
}

export function createSystemAutonomousExecutionAttribution(input: {
  readonly executingSubject: PlatformSystemSubject;
  readonly operationId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}): SystemAutonomousExecutionAttribution {
  const attribution: SystemAutonomousExecutionAttribution = {
    kind: 'system_autonomous',
    ...input,
  };
  assertExecutionAttribution(attribution);
  return attribution;
}

export function assertOperationsHumanPrincipal(value: OperationsHumanPrincipal): void {
  assertBrandedId(value.id, 'Operations Human Principal ID');
  assertStatus(value.status, operationsHumanPrincipalStatuses, 'Operations Principal status');
  assertNonNegativeInteger(value.securityEpoch, 'Operations Principal security epoch');
  assertDate(value.createdAt, 'Operations Principal creation date');
  assertDate(value.updatedAt, 'Operations Principal update date');
  assertDateOrder(value.createdAt, value.updatedAt, 'Operations Principal dates');
}

export function assertOperationsAccount(value: OperationsAccount): void {
  assertBrandedId(value.id, 'Operations Account ID');
  assertBrandedId(value.principalId, 'Operations Human Principal ID');
  assertNormalizedIdentifier(value.loginIdentifierNormalized);
  assertStatus(value.status, operationsAccountStatuses, 'Operations Account status');
  assertDate(value.createdAt, 'Operations Account creation date');
  assertDate(value.updatedAt, 'Operations Account update date');
  assertDateOrder(value.createdAt, value.updatedAt, 'Operations Account dates');
}

export function assertOperationsCredentialMetadata(value: OperationsCredentialMetadata): void {
  assertBrandedId(value.id, 'Operations Credential ID');
  assertBrandedId(value.accountId, 'Operations Account ID');
  if (value.kind !== 'password') {
    throw new OperationsDomainInvariantError('Operations Credential kind must be password.');
  }
  assertStatus(value.status, operationsCredentialStatuses, 'Operations Credential status');
  assertPositiveInteger(value.version, 'Operations Credential version');
  assertDate(value.createdAt, 'Operations Credential creation date');
  if (value.revokedAt !== undefined)
    assertDate(value.revokedAt, 'Operations Credential revoke date');
  if (value.status === 'active' && value.revokedAt !== undefined) {
    throw new OperationsDomainInvariantError('Active Operations Credential cannot have revokedAt.');
  }
  if (value.status === 'revoked' && value.revokedAt === undefined) {
    throw new OperationsDomainInvariantError('Revoked Operations Credential requires revokedAt.');
  }
}

export function assertOperationsSession(value: OperationsSession): void {
  assertBrandedId(value.id, 'Operations Session ID');
  assertBrandedId(value.principalId, 'Operations Human Principal ID');
  assertBrandedId(value.accountId, 'Operations Account ID');
  assertStatus(value.status, operationsSessionStatuses, 'Operations Session status');
  assertNonNegativeInteger(value.credentialVersion, 'Operations Session credential version');
  assertNonNegativeInteger(
    value.principalSecurityEpoch,
    'Operations Session principal security epoch',
  );
  assertDate(value.createdAt, 'Operations Session creation date');
  assertDate(value.lastActivityAt, 'Operations Session activity date');
  assertDate(value.idleExpiresAt, 'Operations Session idle expiry');
  assertDate(value.absoluteExpiresAt, 'Operations Session absolute expiry');
  assertDateOrder(value.createdAt, value.lastActivityAt, 'Operations Session activity dates');
  assertDateOrder(value.lastActivityAt, value.idleExpiresAt, 'Operations Session idle dates');
  assertDateOrder(value.idleExpiresAt, value.absoluteExpiresAt, 'Operations Session expiry dates');
  if (value.mfaVerifiedAt !== undefined) assertDate(value.mfaVerifiedAt, 'Operations MFA date');
  if (value.revokedAt !== undefined) assertDate(value.revokedAt, 'Operations Session revoke date');
  if (value.status === 'revoked' && value.revokedAt === undefined) {
    throw new OperationsDomainInvariantError('Revoked Operations Session requires revokedAt.');
  }
  if (value.status === 'active' && value.revokedAt !== undefined) {
    throw new OperationsDomainInvariantError('Active Operations Session cannot have revokedAt.');
  }
}

export function assertOperationsSessionBelongsToAccount(
  session: OperationsSession,
  account: OperationsAccount,
): void {
  assertOperationsSession(session);
  assertOperationsAccount(account);
  if (session.accountId !== account.id || session.principalId !== account.principalId) {
    throw new OperationsDomainInvariantError(
      'Operations Session must reference the same Human Principal as its Account.',
    );
  }
}

export function assertOperationsMfaFactorMetadata(value: OperationsMfaFactorMetadata): void {
  assertBrandedId(value.id, 'Operations MFA Factor ID');
  assertBrandedId(value.principalId, 'Operations Human Principal ID');
  assertStatus(value.kind, operationsMfaFactorKinds, 'Operations MFA factor kind');
  assertStatus(value.status, operationsMfaFactorStatuses, 'Operations MFA factor status');
  if (value.enrolledAt !== undefined)
    assertDate(value.enrolledAt, 'Operations MFA enrollment date');
  if (value.revokedAt !== undefined) assertDate(value.revokedAt, 'Operations MFA revoke date');
  if (value.status === 'active' && value.enrolledAt === undefined) {
    throw new OperationsDomainInvariantError('Active Operations MFA factor requires enrolledAt.');
  }
  if (value.status === 'revoked' && value.revokedAt === undefined) {
    throw new OperationsDomainInvariantError('Revoked Operations MFA factor requires revokedAt.');
  }
}

export function assertProviderServicePrincipal(value: ProviderServicePrincipal): void {
  assertBrandedId(value.id, 'Service Principal ID');
  assertBrandedId(value.providerId, 'Provider ID');
  assertStatus(value.status, servicePrincipalStatuses, 'Service Principal status');
  assertDate(value.createdAt, 'Provider Service Principal creation date');
}

export function assertPlatformSystemPrincipal(value: PlatformSystemPrincipal): void {
  assertBrandedId(value.id, 'Service Principal ID');
  assertBrandedId(value.systemId, 'Platform System ID');
  assertStatus(value.status, servicePrincipalStatuses, 'Service Principal status');
  assertDate(value.createdAt, 'Platform System Principal creation date');
}

export function assertServiceCredentialMetadata(value: ServiceCredentialMetadata): void {
  assertBrandedId(value.id, 'Service Credential ID');
  assertBrandedId(value.servicePrincipalId, 'Service Principal ID');
  assertStatus(value.kind, serviceCredentialKinds, 'Service Credential kind');
  assertStatus(value.status, serviceCredentialStatuses, 'Service Credential status');
  assertDate(value.createdAt, 'Service Credential creation date');
  if (value.expiresAt !== undefined) assertDate(value.expiresAt, 'Service Credential expiry');
  if (value.revokedAt !== undefined) assertDate(value.revokedAt, 'Service Credential revoke date');
  if (value.status === 'revoked' && value.revokedAt === undefined) {
    throw new OperationsDomainInvariantError('Revoked Service Credential requires revokedAt.');
  }
}

export function assertHumanOperationsSubject(value: HumanOperationsSubject): void {
  if (value.kind !== 'operations_human') {
    throw new OperationsDomainInvariantError('Expected a Human Operations subject.');
  }
  assertBrandedId(value.principalId, 'Operations Human Principal ID');
  assertBrandedId(value.accountId, 'Operations Account ID');
  assertBrandedId(value.sessionId, 'Operations Session ID');
}

export function assertProviderServiceSubject(value: ProviderServiceSubject): void {
  if (value.kind !== 'provider_service') {
    throw new OperationsDomainInvariantError('Expected a Provider Service subject.');
  }
  assertBrandedId(value.servicePrincipalId, 'Service Principal ID');
  assertBrandedId(value.providerId, 'Provider ID');
}

export function assertPlatformSystemSubject(value: PlatformSystemSubject): void {
  if (value.kind !== 'platform_system') {
    throw new OperationsDomainInvariantError('Expected a Platform System subject.');
  }
  assertBrandedId(value.servicePrincipalId, 'Service Principal ID');
  assertBrandedId(value.systemId, 'Platform System ID');
  if (value.jobRunId !== undefined) assertNonEmpty(value.jobRunId, 'Job Run ID');
}

export function assertOperationsAuthenticatedSubject(value: OperationsAuthenticatedSubject): void {
  switch (value.kind) {
    case 'operations_human':
      assertHumanOperationsSubject(value);
      return;
    case 'provider_service':
      assertProviderServiceSubject(value);
      return;
    case 'platform_system':
      assertPlatformSystemSubject(value);
      return;
    default:
      return assertNever(value);
  }
}

export function assertExecutionAttribution(value: ExecutionAttribution): void {
  assertNonEmpty(value.operationId, 'Operation ID');
  assertNonEmpty(value.correlationId, 'Correlation ID');
  if (value.causationId !== undefined) assertNonEmpty(value.causationId, 'Causation ID');

  switch (value.kind) {
    case 'human_direct':
      assertHumanOperationsSubject(value.initiatingSubject);
      assertHumanOperationsSubject(value.executingSubject);
      return;
    case 'human_initiated_system':
      assertHumanOperationsSubject(value.initiatingSubject);
      assertPlatformSystemSubject(value.executingSubject);
      return;
    case 'provider_fact_system':
      assertProviderServiceSubject(value.initiatingSubject);
      assertPlatformSystemSubject(value.executingSubject);
      return;
    case 'system_autonomous':
      assertPlatformSystemSubject(value.executingSubject);
      return;
    default:
      return assertNever(value);
  }
}

export class OperationsDomainInvariantError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'OperationsDomainInvariantError';
  }
}

const operationsHumanPrincipalStatuses = [
  'pending',
  'active',
  'suspended',
  'disabled',
  'tombstoned',
] as const;
const operationsAccountStatuses = ['invited', 'active', 'locked', 'disabled', 'revoked'] as const;
const operationsCredentialStatuses = ['active', 'revoked'] as const;
const operationsSessionStatuses = ['active', 'revoked'] as const;
const operationsMfaFactorKinds = ['webauthn', 'totp', 'recovery_code'] as const;
const operationsMfaFactorStatuses = ['pending', 'active', 'revoked'] as const;
const servicePrincipalStatuses = ['active', 'suspended', 'disabled', 'revoked'] as const;
const serviceCredentialKinds = [
  'provider_signature',
  'api_key',
  'mtls',
  'workload_identity',
] as const;
const serviceCredentialStatuses = ['active', 'revoked'] as const;

function createBrandedId(value: string, label: string): string {
  assertNonEmpty(value, label);
  return value;
}

function assertBrandedId(value: string, label: string): void {
  assertNonEmpty(value, label);
}

function assertNonEmpty(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new OperationsDomainInvariantError(`${label} cannot be empty.`);
  }
}

function assertNormalizedIdentifier(value: string): void {
  const normalized = normalizeOperationsLoginIdentifier(value);
  if (value !== normalized) {
    throw new OperationsDomainInvariantError(
      'Operations login identifier must already be normalized.',
    );
  }
}

function assertDate(value: Date, label: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new OperationsDomainInvariantError(`${label} must be a valid Date.`);
  }
}

function assertDateOrder(first: Date, second: Date, label: string): void {
  if (first.getTime() > second.getTime()) {
    throw new OperationsDomainInvariantError(`${label} are out of order.`);
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new OperationsDomainInvariantError(`${label} must be a non-negative integer.`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new OperationsDomainInvariantError(`${label} must be a positive integer.`);
  }
}

function assertStatus<T extends string>(value: string, allowed: readonly T[], label: string): void {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new OperationsDomainInvariantError(`${label} is invalid.`);
  }
}

function assertNever(value: never): never {
  throw new OperationsDomainInvariantError(`Unsupported Operations subject: ${String(value)}`);
}
