export type AppEnvironment = 'development' | 'test' | 'production';

export interface AppConfiguration {
  readonly apiHost: string;
  readonly apiPort: number;
  readonly environment: AppEnvironment;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly webReferenceClientOrigin: string;
}

export interface DatabaseConfiguration {
  readonly databaseUrl: string;
}

export interface AuthConfiguration {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly creatorActorMappings: ReadonlyMap<string, string>;
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

  const creatorActorMappings = parseCreatorActorMappings(
    environment.CREATOR_ACTOR_MAPPINGS ?? '{}',
  );

  return {
    supabaseUrl,
    supabaseAnonKey,
    creatorActorMappings,
  };
}

function parseCreatorActorMappings(value: string): ReadonlyMap<string, string> {
  try {
    const parsed: unknown = JSON.parse(value);

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Creator actor mappings must be a JSON object.');
    }

    const entries = Object.entries(parsed as Record<string, unknown>);
    if (
      entries.some(
        ([providerIdentity, creatorId]) =>
          providerIdentity.trim().length === 0 ||
          typeof creatorId !== 'string' ||
          creatorId.trim().length === 0,
      )
    ) {
      throw new Error('Creator actor mappings must contain non-empty string values.');
    }

    return new Map(entries.map(([key, creatorId]) => [key, (creatorId as string).trim()]));
  } catch (cause) {
    throw new Error('CREATOR_ACTOR_MAPPINGS must be a valid JSON object.', { cause });
  }
}
