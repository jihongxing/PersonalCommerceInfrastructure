import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  creatorWebSessionStore,
  type CreatorWebSession,
} from '@/lib/server/creator-session-store';

const CSRF_COOKIE = 'pci_creator_csrf';
const DEV_SESSION_COOKIE = 'pci_creator_session';
const HOST_SESSION_COOKIE = '__Host-pci_creator_session';
const refreshInFlight = new Map<string, Promise<CreatorWebSession | undefined>>();

type RouteContext = { params: Promise<{ path: string[] }> };

function sessionCookieName(): string {
  return process.env.NODE_ENV === 'production' || process.env.CREATOR_BFF_COOKIE_SECURE === '1'
    ? HOST_SESSION_COOKIE
    : DEV_SESSION_COOKIE;
}

function secureCookies(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.CREATOR_BFF_COOKIE_SECURE === '1';
}

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function apiBaseUrl(): string {
  return (
    process.env.CREATOR_BFF_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:8080'
  ).replace(/\/$/u, '');
}

function allowedOrigins(request: NextRequest): readonly string[] {
  const configured = process.env.CREATOR_BFF_ALLOWED_ORIGINS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return configured?.length ? configured : [request.nextUrl.origin];
}

function originAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (origin === null) return !isMutation(request.method);
  return allowedOrigins(request).includes(origin);
}

function sameValue(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) return false;
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function csrfValid(request: NextRequest): boolean {
  return sameValue(
    request.cookies.get(CSRF_COOKIE)?.value,
    request.headers.get('x-csrf-token') ?? undefined,
  );
}

function isMutation(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}

function isProtectedPath(path: string): boolean {
  return (
    path.startsWith('/api/v1/creator/') ||
    path.startsWith('/api/v1/private/') ||
    path === '/api/v1/auth/workspace/initialize'
  );
}

function isAuthPath(path: string): boolean {
  return path.startsWith('/api/v1/auth/');
}

function setCsrfCookie(response: NextResponse, value: string): void {
  response.cookies.set(CSRF_COOKIE, value, {
    httpOnly: false,
    secure: secureCookies(),
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

function setSessionCookie(response: NextResponse, value: string): void {
  response.cookies.set(sessionCookieName(), value, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(sessionCookieName(), '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(CSRF_COOKIE, '', { httpOnly: false, path: '/', maxAge: 0 });
}

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  const correlationId = upstream.headers.get('x-correlation-id');
  if (contentType) headers.set('content-type', contentType);
  if (correlationId) headers.set('x-correlation-id', correlationId);
  return headers;
}

async function readJson(response: Response): Promise<Record<string, unknown> | undefined> {
  try {
    const value: unknown = await response.json();
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function authPayload(data: Record<string, unknown>): Record<string, unknown> {
  const user = data.user;
  return {
    ...(user && typeof user === 'object' ? { user } : {}),
    ...(typeof data.expiresIn === 'number' ? { expiresIn: data.expiresIn } : {}),
    ...(typeof data.setupPending === 'boolean' ? { setupPending: data.setupPending } : {}),
  };
}

async function upstreamRequest(
  request: NextRequest,
  path: string,
  session: CreatorWebSession | undefined,
  body?: BodyInit,
): Promise<Response> {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  for (const name of ['traceparent', 'tracestate', 'x-correlation-id']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (session) headers.set('authorization', `Bearer ${session.accessToken}`);
  return fetch(`${apiBaseUrl()}${path}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    ...(body === undefined ? {} : { body }),
    cache: 'no-store',
  });
}

async function refreshSession(session: CreatorWebSession): Promise<CreatorWebSession | undefined> {
  const existing = refreshInFlight.get(session.id);
  if (existing) return existing;
  const operation = (async () => {
    const latest = await creatorWebSessionStore.get(session.id);
    if (!latest) return undefined;
    if (latest.accessToken !== session.accessToken || latest.refreshToken !== session.refreshToken)
      return latest;

    const refreshResponse = await fetch(`${apiBaseUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: latest.refreshToken }),
      cache: 'no-store',
    });
    const data = await readJson(refreshResponse);
    if (!refreshResponse.ok) {
      const after = await creatorWebSessionStore.get(session.id);
      if (after && after.refreshToken !== latest.refreshToken) return after;
      await creatorWebSessionStore.revoke(session.id);
      return undefined;
    }
    if (typeof data?.accessToken !== 'string' || typeof data.refreshToken !== 'string') {
      return undefined;
    }
    const updated = await creatorWebSessionStore.updateTokens(
      session.id,
      data.accessToken,
      data.refreshToken,
      latest.refreshToken,
    );
    if (!updated) return creatorWebSessionStore.get(session.id);
    return { ...latest, accessToken: data.accessToken, refreshToken: data.refreshToken };
  })().finally(() => refreshInFlight.delete(session.id));
  refreshInFlight.set(session.id, operation);
  return operation;
}

async function requireSession(request: NextRequest): Promise<CreatorWebSession | undefined> {
  const value = request.cookies.get(sessionCookieName())?.value;
  return value ? creatorWebSessionStore.get(value) : undefined;
}

async function handleAuth(request: NextRequest, path: string): Promise<NextResponse | undefined> {
  if (path === '/api/v1/auth/session' && request.method === 'GET') {
    const session = await requireSession(request);
    const response = session
      ? NextResponse.json({ authenticated: true, user: { id: session.accountId, email: session.email } })
      : NextResponse.json({ authenticated: false, user: null });
    if (!request.cookies.get(CSRF_COOKIE)) setCsrfCookie(response, randomBytes(32).toString('base64url'));
    return response;
  }

  if (path === '/api/v1/auth/login' || path === '/api/v1/auth/signup') {
    if (request.method !== 'POST') return errorResponse(405, 'method_not_allowed', 'Method not allowed.');
    if (!originAllowed(request)) return errorResponse(403, 'origin_rejected', 'Origin is not allowed.');
    const upstream = await upstreamRequest(request, path, undefined, await request.arrayBuffer());
    const data = await readJson(upstream);
    if (!upstream.ok || !data) {
      return NextResponse.json(data ?? { error: { code: 'authentication_failed', message: 'Authentication failed.' } }, {
        status: upstream.status,
        headers: responseHeaders(upstream),
      });
    }
    if (
      typeof data.accessToken !== 'string' ||
      typeof data.refreshToken !== 'string' ||
      !data.user ||
      typeof data.user !== 'object' ||
      typeof (data.user as { id?: unknown }).id !== 'string' ||
      typeof (data.user as { email?: unknown }).email !== 'string'
    ) {
      return errorResponse(502, 'invalid_auth_response', 'Authentication response was invalid.');
    }
    const response = NextResponse.json(authPayload(data), {
      status: upstream.status,
      headers: responseHeaders(upstream),
    });
    const session = await creatorWebSessionStore.create({
      accountId: (data.user as { id: string }).id,
      email: (data.user as { email: string }).email,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    setSessionCookie(response, session.id);
    setCsrfCookie(response, request.cookies.get(CSRF_COOKIE)?.value ?? randomBytes(32).toString('base64url'));
    return response;
  }

  if (path === '/api/v1/auth/refresh') {
    if (request.method !== 'POST') return errorResponse(405, 'method_not_allowed', 'Method not allowed.');
    if (!originAllowed(request) || !csrfValid(request))
      return errorResponse(403, 'csrf_rejected', 'Request origin or CSRF token is invalid.');
    const session = await requireSession(request);
    if (!session) return errorResponse(401, 'invalid_session', '登录已过期，请重新登录。');
    const refreshed = await refreshSession(session);
    if (!refreshed) {
      const response = errorResponse(401, 'invalid_session', '登录已过期，请重新登录。');
      clearSessionCookies(response);
      return response;
    }
    return NextResponse.json({
      authenticated: true,
      user: { id: refreshed.accountId, email: refreshed.email },
    });
  }

  if (path === '/api/v1/auth/logout') {
    if (request.method !== 'POST') return errorResponse(405, 'method_not_allowed', 'Method not allowed.');
    if (!originAllowed(request) || !csrfValid(request))
      return errorResponse(403, 'csrf_rejected', 'Request origin or CSRF token is invalid.');
    const session = await requireSession(request);
    if (session) {
      await upstreamRequest(request, path, session).catch(() => undefined);
      await creatorWebSessionStore.revoke(session.id);
    }
    const response = NextResponse.json({ ok: true });
    clearSessionCookies(response);
    return response;
  }

  if (path === '/api/v1/auth/forgot-password' || path === '/api/v1/auth/reset-password') {
    if (request.method !== 'POST') return errorResponse(405, 'method_not_allowed', 'Method not allowed.');
    if (!originAllowed(request)) return errorResponse(403, 'origin_rejected', 'Origin is not allowed.');
    const upstream = await upstreamRequest(request, path, undefined, await request.arrayBuffer());
    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders(upstream),
    });
    if (path === '/api/v1/auth/reset-password' && upstream.ok) {
      const session = await requireSession(request);
      if (session) await creatorWebSessionStore.revoke(session.id);
      clearSessionCookies(response);
    }
    return response;
  }

  return undefined;
}

async function handler(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const rawPath = `/${segments.join('/')}`;
  // The Next catch-all route strips the outer /api prefix from the URL.
  const path = rawPath.startsWith('/api/v1/') ? rawPath : `/api${rawPath}`;
  if (!path.startsWith('/api/v1/')) return errorResponse(404, 'not_found', 'Not found.');
  if (!originAllowed(request)) return errorResponse(403, 'origin_rejected', 'Origin is not allowed.');

  if (isAuthPath(path)) {
    const authResponse = await handleAuth(request, path);
    if (authResponse) return authResponse;
  }

  if (isMutation(request.method) && !isAuthPath(path) && !csrfValid(request)) {
    return errorResponse(403, 'csrf_rejected', 'Request origin or CSRF token is invalid.');
  }

  const protectedPath = isProtectedPath(path);
  let session = protectedPath ? await requireSession(request) : undefined;
  if (protectedPath && !session) return errorResponse(401, 'invalid_session', '登录已过期，请重新登录。');
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();
  let upstream = await upstreamRequest(request, path, session, body);
  if (protectedPath && upstream.status === 401 && session) {
    session = await refreshSession(session);
    if (!session) {
      const response = errorResponse(401, 'invalid_session', '登录已过期，请重新登录。');
      clearSessionCookies(response);
      return response;
    }
    upstream = await upstreamRequest(request, path, session, body);
  }
  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders(upstream),
  });
  if (!request.cookies.get(CSRF_COOKIE)) setCsrfCookie(response, randomBytes(32).toString('base64url'));
  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
