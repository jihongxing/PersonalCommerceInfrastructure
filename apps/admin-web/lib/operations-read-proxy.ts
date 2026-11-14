import type { AdminServerConfiguration } from './server-configuration';

const CREDENTIAL_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

/** Forward only allowlisted server-side read requests with the opaque Session credential. */
export async function proxyOperationsReadRequest(
  request: Request,
  path: string,
  configuration: AdminServerConfiguration,
  credential: string | undefined,
  upstreamFetch: typeof fetch = fetch,
): Promise<Response> {
  const origin = request.headers.get('origin');
  if (
    (origin !== null && origin !== configuration.webOrigin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return failure(403);
  if (credential === undefined || !CREDENTIAL_PATTERN.test(credential)) return failure(401);

  try {
    const upstream = await upstreamFetch(`${configuration.apiOrigin}${path}`, {
      method: 'GET',
      headers: { accept: 'application/json', authorization: `Bearer ${credential}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
    const body = await upstream.arrayBuffer();
    const headers = new Headers({ 'cache-control': 'no-store' });
    const contentType = upstream.headers.get('content-type');
    if (contentType !== null) headers.set('content-type', contentType);
    const correlationId = upstream.headers.get('x-correlation-id');
    if (correlationId !== null) headers.set('x-correlation-id', correlationId);
    return new Response(body, { status: upstream.status, headers });
  } catch {
    return failure(503);
  }
}

function failure(status: number): Response {
  return Response.json(
    { error: 'Request could not be confirmed. Please retry.' },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}
