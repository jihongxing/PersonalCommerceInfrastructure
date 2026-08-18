export type AppEnvironment = 'development' | 'test' | 'production';

export interface AppConfiguration {
  readonly apiHost: string;
  readonly apiPort: number;
  readonly environment: AppEnvironment;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly webReferenceClientOrigin: string;
  readonly usePostgresTestComposition: boolean;
}

export interface DatabaseConfiguration {
  readonly databaseUrl: string;
}

export interface AuthConfiguration {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly creatorActorMappings: ReadonlyMap<string, string>;
}

export interface OperationsAuthConfiguration {
  readonly operationsAccessToken: string;
  readonly operationsOperatorId: string;
}

export type RuntimeEnvironment = 'local' | 'test' | 'controlled' | 'production';

export interface LiveProviderConfiguration {
  readonly providerId: string;
  readonly providerUrl: string;
  readonly merchantAccountMapping: string;
  readonly apiCredential: string;
  readonly webhookSecret: string;
  readonly providerEnvironment: 'production';
  readonly currency: 'CNY';
  readonly region: string;
}

export interface RealMoneyRuntimeConfiguration {
  readonly runtimeEnvironment: RuntimeEnvironment;
  readonly realMoneyEnabled: boolean;
  readonly founderActivationReference?: string;
  readonly provider?: LiveProviderConfiguration;
}

const supportedEnvironments = new Set<AppEnvironment>(['development', 'test', 'production']);
const supportedLogLevels = new Set<AppConfiguration['logLevel']>([
  'debug',
  'info',
  'warn',
  'error',
]);

export function loadConfiguration(environment: NodeJS.ProcessEnv = process.env): AppConfiguration {
  const appEnvironment = environment.APP_ENV ?? 'development';
  const apiHost = environment.API_HOST ?? '127.0.0.1';
  const apiPort = Number(environment.API_PORT ?? '3000');
  const logLevel = environment.LOG_LEVEL ?? 'info';
  const defaultWebReferenceClientOrigin =
    appEnvironment === 'test' ? 'http://127.0.0.1:43125' : 'http://127.0.0.1:3001';
  const webReferenceClientOrigin =
    environment.WEB_REFERENCE_CLIENT_ORIGIN?.trim() ?? defaultWebReferenceClientOrigin;

  if (!supportedEnvironments.has(appEnvironment as AppEnvironment)) {
    throw new Error(`Unsupported APP_ENV: ${appEnvironment}`);
  }

  if (!supportedLogLevels.has(logLevel as AppConfiguration['logLevel'])) {
    throw new Error(`Unsupported LOG_LEVEL: ${logLevel}`);
  }

  if (apiHost.trim().length === 0) {
    throw new Error('Unsupported API_HOST: empty value');
  }

  if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65_535) {
    throw new Error(`Unsupported API_PORT: ${String(environment.API_PORT ?? '3000')}`);
  }

  try {
    new URL(webReferenceClientOrigin);
  } catch (cause) {
    throw new Error('WEB_REFERENCE_CLIENT_ORIGIN must be a valid URL.', { cause });
  }

  if (
    appEnvironment === 'production' &&
    environment.WEB_REFERENCE_CLIENT_ORIGIN?.trim() === undefined
  ) {
    throw new Error('WEB_REFERENCE_CLIENT_ORIGIN is required in production.');
  }

  return {
    apiHost: apiHost.trim(),
    apiPort,
    environment: appEnvironment as AppEnvironment,
    logLevel: logLevel as AppConfiguration['logLevel'],
    webReferenceClientOrigin: webReferenceClientOrigin.replace(/\/$/u, ''),
    usePostgresTestComposition: environment.USE_POSTGRES_TEST_COMPOSITION === '1',
  };
}

export function loadDatabaseConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseConfiguration {
  const databaseUrl = environment.DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error('DATABASE_URL is required for PostgreSQL operations.');
  }

  return {
    databaseUrl,
  };
}

export function loadAuthConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): AuthConfiguration {
  const supabaseUrl = environment.SUPABASE_URL?.trim();
  const supabaseAnonKey = environment.SUPABASE_ANON_KEY?.trim();

  if (supabaseUrl === undefined || supabaseUrl.length === 0) {
    throw new Error('SUPABASE_URL is required for Supabase Auth operations.');
  }

  try {
    new URL(supabaseUrl);
  } catch (cause) {
    throw new Error('SUPABASE_URL must be a valid URL.', { cause });
  }

  if (supabaseAnonKey === undefined || supabaseAnonKey.length === 0) {
    throw new Error('SUPABASE_ANON_KEY is required for Supabase Auth operations.');
  }

  const creatorActorMappings = parseCreatorActorMappings(environment.CREATOR_ACTOR_MAPPINGS);

  return {
    supabaseUrl,
    supabaseAnonKey,
    creatorActorMappings,
  };
}

export function loadOperationsAuthConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): OperationsAuthConfiguration {
  const operationsAccessToken = environment.OPERATIONS_ACCESS_TOKEN?.trim();
  const operationsOperatorId = environment.OPERATIONS_OPERATOR_ID?.trim();

  if (operationsAccessToken === undefined || operationsAccessToken.length < 16) {
    throw new Error('OPERATIONS_ACCESS_TOKEN must contain at least 16 characters.');
  }
  if (operationsOperatorId === undefined || operationsOperatorId.length === 0) {
    throw new Error('OPERATIONS_OPERATOR_ID is required for Pilot Operations records.');
  }

  return { operationsAccessToken, operationsOperatorId };
}

export function loadRealMoneyRuntimeConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): RealMoneyRuntimeConfiguration {
  const runtimeEnvironment = parseRuntimeEnvironment(environment.RUNTIME_ENV);
  const realMoneyEnabled = parseBoolean(environment.REAL_MONEY_ENABLED, false);
  const founderActivationReference = optionalTrimmed(environment.FOUNDER_ACTIVATION_REFERENCE);
  const provider = parseLiveProviderConfiguration(environment);

  if (
    realMoneyEnabled &&
    runtimeEnvironment !== 'controlled' &&
    runtimeEnvironment !== 'production'
  ) {
    throw new Error('REAL_MONEY_ENABLED requires controlled or production runtime.');
  }

  if (realMoneyEnabled && founderActivationReference === undefined) {
    throw new Error('FOUNDER_ACTIVATION_REFERENCE is required when real money is enabled.');
  }

  if (realMoneyEnabled && provider === undefined) {
    throw new Error('Live Provider configuration is incomplete.');
  }

  return {
    runtimeEnvironment,
    realMoneyEnabled,
    ...(founderActivationReference === undefined ? {} : { founderActivationReference }),
    ...(provider === undefined ? {} : { provider }),
  };
}

function parseRuntimeEnvironment(value: string | undefined): RuntimeEnvironment {
  const normalized = value?.trim() ?? 'local';
  if (
    normalized !== 'local' &&
    normalized !== 'test' &&
    normalized !== 'controlled' &&
    normalized !== 'production'
  ) {
    throw new Error(`Unsupported RUNTIME_ENV: ${normalized}`);
  }
  return normalized;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (normalized === undefined || normalized.length === 0) {
    return defaultValue;
  }
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  throw new Error('REAL_MONEY_ENABLED must be true or false.');
}

function parseLiveProviderConfiguration(
  environment: NodeJS.ProcessEnv,
): LiveProviderConfiguration | undefined {
  const values = {
    providerId: optionalTrimmed(environment.LIVE_PROVIDER_ID),
    providerUrl: optionalTrimmed(environment.LIVE_PROVIDER_URL),
    merchantAccountMapping: optionalTrimmed(environment.LIVE_PROVIDER_MERCHANT_ACCOUNT),
    apiCredential: optionalTrimmed(environment.LIVE_PROVIDER_API_CREDENTIAL),
    webhookSecret: optionalTrimmed(environment.LIVE_PROVIDER_WEBHOOK_SECRET),
    providerEnvironment: optionalTrimmed(environment.LIVE_PROVIDER_ENVIRONMENT),
    currency: optionalTrimmed(environment.LIVE_PROVIDER_CURRENCY),
    region: optionalTrimmed(environment.LIVE_PROVIDER_REGION),
  };
  const configuredValues = Object.values(values).filter((value) => value !== undefined);
  if (configuredValues.length === 0) {
    return undefined;
  }
  if (configuredValues.length !== Object.keys(values).length) {
    throw new Error('Live Provider configuration is incomplete.');
  }

  try {
    new URL(values.providerUrl!);
  } catch (cause) {
    throw new Error('LIVE_PROVIDER_URL must be a valid URL.', { cause });
  }
  if (values.providerEnvironment !== 'production') {
    throw new Error('LIVE_PROVIDER_ENVIRONMENT must be production for Live Provider use.');
  }
  if (values.currency !== 'CNY') {
    throw new Error('LIVE_PROVIDER_CURRENCY must be CNY for the current Money Domain.');
  }

  return {
    providerId: values.providerId!,
    providerUrl: values.providerUrl!,
    merchantAccountMapping: values.merchantAccountMapping!,
    apiCredential: values.apiCredential!,
    webhookSecret: values.webhookSecret!,
    providerEnvironment: values.providerEnvironment,
    currency: values.currency,
    region: values.region!,
  };
}

function optionalTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

function parseCreatorActorMappings(value: string | undefined): ReadonlyMap<string, string> {
  if (value === undefined || value.trim().length === 0) {
    throw new Error('CREATOR_ACTOR_MAPPINGS is required for Supabase Auth operations.');
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Creator actor mappings must be a JSON object.');
    }

    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length === 0) {
      throw new Error('Creator actor mappings must contain at least one mapping.');
    }

    if (
      entries.some(
        ([providerIdentity, creatorId]) =>
          !isSupabaseProviderIdentity(providerIdentity) ||
          typeof creatorId !== 'string' ||
          creatorId.trim().length === 0,
      )
    ) {
      throw new Error(
        'Creator actor mappings must use non-empty "supabase:<provider-user-id>" keys and values.',
      );
    }

    return new Map(entries.map(([key, creatorId]) => [key, (creatorId as string).trim()]));
  } catch (cause) {
    throw new Error('CREATOR_ACTOR_MAPPINGS must be a valid JSON object.', { cause });
  }
}

function isSupabaseProviderIdentity(value: string): boolean {
  const prefix = 'supabase:';

  return value.startsWith(prefix) && value.slice(prefix.length).trim().length > 0;
}
