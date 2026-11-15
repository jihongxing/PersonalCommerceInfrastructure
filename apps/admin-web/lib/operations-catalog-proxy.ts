import type { AdminServerConfiguration } from './server-configuration';

const CREDENTIAL_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

/** Forward catalog mutations through the BFF; the browser never supplies an API credential. */
export async function proxyOperationsCatalogRequest(
  request: Request,
  path: string,
  configuration: AdminServerConfiguration,
  credential: string | undefined,
): Promise<Response> {
  const origin = request.headers.get('origin');
  if (
    (origin !== null && origin !== configuration.webOrigin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return failure(403);
  if (credential === undefined || !CREDENTIAL_PATTERN.test(credential)) return failure(401);
  try {
    const requestBody = request.method === 'GET' ? undefined : await request.text();
    const requestHeaders = {
      accept: 'application/json',
      authorization: `Bearer ${credential}`,
      ...(requestBody !== undefined && requestBody.length > 0
        ? { 'content-type': 'application/json' }
        : {}),
    };
    const upstream = await fetch(`${configuration.apiOrigin}${path}`, {
      method: request.method,
      headers: requestHeaders,
      body: requestBody === undefined || requestBody.length === 0 ? undefined : requestBody,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
    // Response forbids a body for these status codes. Preserve the upstream
    // no-content semantics instead of turning a successful 204 into a 503.
    const responseBody = [204, 205, 304].includes(upstream.status)
      ? undefined
      : await upstream.arrayBuffer();
    const responseHeaders = new Headers({ 'cache-control': 'no-store' });
    const contentType = upstream.headers.get('content-type');
    if (contentType !== null) responseHeaders.set('content-type', contentType);
    const correlationId = upstream.headers.get('x-correlation-id');
    if (correlationId !== null) responseHeaders.set('x-correlation-id', correlationId);
    return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
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
