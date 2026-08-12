export interface WebConfiguration {
  readonly apiBaseUrl: string;
}

export type WebEnvironment = Readonly<Record<string, string | undefined>>;

const defaultApiBaseUrl = 'http://127.0.0.1:3000';
const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export function loadWebConfiguration(
  environment: WebEnvironment = {
    NEXT_PUBLIC_API_BASE_URL: configuredApiBaseUrl,
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
  };
}
