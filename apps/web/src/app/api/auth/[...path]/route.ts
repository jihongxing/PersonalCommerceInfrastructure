import { NextResponse } from 'next/server';

import { loadWebAuthConfiguration } from '@/configuration/bootstrap';

const authPathPattern = /^[a-z]+(?:\/[a-z]+)*$/u;

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const pathValue = path.join('/');

  if (!authPathPattern.test(pathValue)) {
    return NextResponse.json({ error: 'invalid_auth_path' }, { status: 400 });
  }

  try {
    const configuration = loadWebAuthConfiguration();
    const response = await fetch(
      `${configuration.supabaseUrl.replace(/\/$/u, '')}/auth/v1/${pathValue}${new URL(request.url).search}`,
      {
        method: 'POST',
        headers: {
          apikey: configuration.supabaseAnonKey,
          authorization: request.headers.get('authorization') ?? '',
          'content-type': 'application/json',
        },
        body: await request.text(),
        cache: 'no-store',
      },
    );

    return new Response(response.body, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'auth_provider_unavailable' }, { status: 503 });
  }
}
