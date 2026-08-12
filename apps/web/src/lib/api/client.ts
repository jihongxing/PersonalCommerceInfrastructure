import createClient, { type Middleware } from 'openapi-fetch';

import { applyBearerAuthentication, type AccessTokenProvider } from './authentication';
import type { paths } from './generated';

export interface ApiClientOptions {
  readonly apiBaseUrl: string;
  readonly accessTokenProvider?: AccessTokenProvider;
}

export function createApiClient(options: ApiClientOptions) {
  const client = createClient<paths>({
    baseUrl: options.apiBaseUrl.replace(/\/$/u, ''),
  });

  if (options.accessTokenProvider !== undefined) {
    const authenticationMiddleware: Middleware = {
      onRequest: ({ request }) =>
        applyBearerAuthentication(request, options.accessTokenProvider as AccessTokenProvider),
    };
    client.use(authenticationMiddleware);
  }

  return client;
}
