export interface AdminServerConfiguration {
  readonly apiOrigin: string;
  readonly webOrigin: string;
  readonly production: boolean;
}

let configuration: AdminServerConfiguration | undefined;

/** Server bootstrap is the only reader of Admin BFF environment configuration. */
export function getAdminServerConfiguration(): AdminServerConfiguration {
  if (configuration !== undefined) return configuration;
  const apiOrigin = parseOrigin(process.env.ADMIN_API_ORIGIN, 'ADMIN_API_ORIGIN');
  const webOrigin = parseOrigin(process.env.ADMIN_WEB_ORIGIN, 'ADMIN_WEB_ORIGIN');
  configuration = Object.freeze({
    apiOrigin,
    webOrigin,
    production: process.env.NODE_ENV === 'production',
  });
  return configuration;
}

function parseOrigin(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required.`);
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must be an HTTP(S) origin without credentials.`);
  }
  return url.origin;
}
