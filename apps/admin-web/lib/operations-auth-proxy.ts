/** Server-only BFF transport. Browser headers never supply identity or permissions. */
export async function proxyOperationsAuthRequest(
  request: Request,
  operation: 'login' | 'session' | 'logout',
  configuration: AdminServerConfiguration,
  credential?: string,
  upstreamFetch: typeof fetch = fetch,
): Promise<Response> {
  // Compare the browser Origin against the configured public origin. Next's
  // internal Request URL may use localhost even when the browser uses 127.0.0.1.
  const origin = configuration.webOrigin;
  if (
    (operation !== 'session' && request.headers.get('origin') !== origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return failure(403);
  const url = new URL(origin);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const cookieSuffix = `; Path=/; HttpOnly; SameSite=Lax${url.protocol === 'https:' || configuration.production || !local ? '; Secure' : ''}`;
  if (operation === 'logout' && credential === undefined) {
    return signedOut(cookieSuffix);
  }
  try {
    const headers = new Headers({ accept: 'application/json' });
    if (credential !== undefined) headers.set('authorization', `Bearer ${credential}`);
    if (operation === 'login') headers.set('content-type', 'application/json');
    const upstream = await upstreamFetch(
      `${configuration.apiOrigin}/api/v1/operations/auth/${operation}`,
      {
        method: operation === 'session' ? 'GET' : 'POST',
        headers,
        body: operation === 'login' ? await request.text() : undefined,
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!upstream.ok)
      return failure([400, 401, 403, 429].includes(upstream.status) ? upstream.status : 503);
    // Only an explicit successful revocation/confirmed absence clears the cookie.
    if (operation === 'logout')
      return upstream.status === 204 ? signedOut(cookieSuffix) : failure(503);
    const payload = (await upstream.json()) as Record<string, unknown>;
    if (
      typeof payload.principalId !== 'string' ||
      typeof payload.accountId !== 'string' ||
      typeof payload.sessionId !== 'string' ||
      !Array.isArray(payload.permissions)
    )
      return failure(503);
    const response = Response.json(
      {
        principalId: payload.principalId,
        accountId: payload.accountId,
        sessionId: payload.sessionId,
        permissions: payload.permissions,
        ...(operation === 'login' ? { absoluteExpiresAt: payload.absoluteExpiresAt } : {}),
      },
      { headers: { 'cache-control': 'no-store' } },
    );
    if (operation === 'login') {
      if (
        typeof payload.credential !== 'string' ||
        !/^[A-Za-z0-9_-]{43}$/u.test(payload.credential)
      )
        return failure(503);
      response.headers.set(
        'set-cookie',
        `pci_operations_session=${payload.credential}${cookieSuffix}; Max-Age=86400`,
      );
    }
    return response;
  } catch {
    return failure(503);
  }
}

function failure(status: number) {
  return Response.json(
    { error: 'Request could not be confirmed. Please retry.' },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}
function signedOut(suffix: string) {
  return new Response(null, {
    status: 204,
    headers: {
      'cache-control': 'no-store',
      'set-cookie': `pci_operations_session=${suffix}; Max-Age=0`,
    },
  });
}
import type { AdminServerConfiguration } from './server-configuration';
