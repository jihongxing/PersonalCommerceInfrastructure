export interface WebConfiguration {
  readonly apiBaseUrl: string;
  readonly runtimeEnvironment: 'local' | 'test' | 'controlled' | 'production';
}

export interface WebAuthConfiguration {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
}

export type WebEnvironment = Readonly<Record<string, string | undefined>>;

const defaultApiBaseUrl = 'http://127.0.0.1:3000';
const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const configuredRuntimeEnvironment = process.env.NEXT_PUBLIC_RUNTIME_ENV;
const configuredSupabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const configuredSupabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function loadWebConfiguration(
  environment: WebEnvironment = {
    NEXT_PUBLIC_API_BASE_URL: configuredApiBaseUrl,
    NEXT_PUBLIC_RUNTIME_ENV: configuredRuntimeEnvironment,
  },
): WebConfiguration {
  const apiBaseUrl = environment.NEXT_PUBLIC_API_BASE_URL?.trim() ?? defaultApiBaseUrl;

  try {
    new URL(apiBaseUrl);
  } catch (cause) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must be a valid URL.', { cause });
  }

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/$/u, ''),
    runtimeEnvironment: parseRuntimeEnvironment(environment.NEXT_PUBLIC_RUNTIME_ENV),
  };
}

function parseRuntimeEnvironment(
  value: string | undefined,
): 'local' | 'test' | 'controlled' | 'production' {
  const normalized = value?.trim() ?? 'local';
  if (
    normalized !== 'local' &&
    normalized !== 'test' &&
    normalized !== 'controlled' &&
    normalized !== 'production'
  ) {
    throw new Error(`NEXT_PUBLIC_RUNTIME_ENV is unsupported: ${normalized}`);
  }
  return normalized;
}

export function loadWebAuthConfiguration(
  environment: Readonly<Record<string, string | undefined>> = {
    SUPABASE_URL: configuredSupabaseUrl,
    SUPABASE_ANON_KEY: configuredSupabaseAnonKey,
  },
): WebAuthConfiguration {
  const supabaseUrl = environment.SUPABASE_URL?.trim();
  const supabaseAnonKey = environment.SUPABASE_ANON_KEY?.trim();

  if (supabaseUrl === undefined || supabaseUrl.length === 0) {
    throw new Error('SUPABASE_URL is required for the Creator Desk.');
  }
  if (supabaseAnonKey === undefined || supabaseAnonKey.length === 0) {
    throw new Error('SUPABASE_ANON_KEY is required for the Creator Desk.');
  }

  try {
    new URL(supabaseUrl);
  } catch (cause) {
    throw new Error('SUPABASE_URL must be a valid URL.', { cause });
  }

  return { supabaseUrl, supabaseAnonKey };
}
