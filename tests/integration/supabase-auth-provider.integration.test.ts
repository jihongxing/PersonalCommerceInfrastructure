import { createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';

import { createAuthContextProvider } from '../../applications/core/ports/auth-context-provider.js';
import {
  createSupabaseTokenVerifier,
  SupabaseTokenVerifier,
} from '../../adapters/auth/supabase/supabase-auth-context-provider.js';

const requiredEnvironmentVariables = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_TEST_EMAIL',
  'SUPABASE_TEST_PASSWORD',
] as const;

const realProviderVerificationRequested = process.env.RUN_REAL_SUPABASE_AUTH_TESTS === '1';
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => process.env[name]?.trim().length === 0 || process.env[name] === undefined,
);

if (realProviderVerificationRequested && missingEnvironmentVariables.length > 0) {
  throw new Error(`Real Supabase verification requires: ${missingEnvironmentVariables.join(', ')}`);
}

const describeRealProvider =
  realProviderVerificationRequested && missingEnvironmentVariables.length === 0
    ? describe
    : describe.skip;

describeRealProvider('Real Supabase Auth provider', () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? 'http://127.0.0.1:1';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? 'provider-test-not-configured';
  const testEmail = process.env.SUPABASE_TEST_EMAIL ?? 'provider-test-not-configured';
  const testPassword = process.env.SUPABASE_TEST_PASSWORD ?? 'provider-test-not-configured';

  let accessToken: string;
  let providerSubject: string;

  beforeAll(async () => {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await client.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error !== null || data.session === null || data.user === null) {
      throw new Error('Controlled Supabase test user could not authenticate.');
    }

    accessToken = data.session.access_token;
    providerSubject = data.user.id;
  });

  it('verifies a real access token without exposing provider-specific identity upstream', async () => {
    const verifier = createSupabaseTokenVerifier({
      supabaseUrl,
      supabaseAnonKey,
    });

    await expect(verifier.verifyAccessToken(accessToken)).resolves.toEqual({
      provider: 'supabase',
      subject: providerSubject,
    });
  });

  it('rejects an invalid token through the stable authentication error contract', async () => {
    const verifier = createSupabaseTokenVerifier({
      supabaseUrl,
      supabaseAnonKey,
    });

    await expect(verifier.verifyAccessToken('invalid-provider-token')).rejects.toMatchObject({
      category: 'authentication',
      code: 'invalid_access_token',
      message: 'Authentication could not be verified.',
    });
  });

  it('does not treat a verified Supabase user as a Creator without explicit mapping', async () => {
    const provider = createAuthContextProvider({
      tokenVerifier: createSupabaseTokenVerifier({
        supabaseUrl,
        supabaseAnonKey,
      }),
      creatorActorResolver: {
        resolveCreatorId: () => Promise.resolve(undefined),
      },
    });

    await expect(
      provider.resolveActorContext({
        accessToken,
        correlationId: 'real-supabase-unmapped',
      }),
    ).rejects.toMatchObject({
      category: 'authentication',
      code: 'creator_actor_not_mapped',
    });
  });

  it('creates a Creator ActorContext only after an explicit mapping', async () => {
    const creatorId = 'creator-real-supabase-test';
    const provider = createAuthContextProvider({
      tokenVerifier: createSupabaseTokenVerifier({
        supabaseUrl,
        supabaseAnonKey,
      }),
      creatorActorResolver: {
        resolveCreatorId: (identity) =>
          Promise.resolve(identity.subject === providerSubject ? creatorId : undefined),
      },
    });

    await expect(
      provider.resolveActorContext({
        accessToken,
        correlationId: 'real-supabase-mapped',
      }),
    ).resolves.toEqual({
      actor: {
        kind: 'creator',
        creatorId,
      },
      correlationId: 'real-supabase-mapped',
    });
  });

  it('maps a real transport failure without leaking credentials or provider details', async () => {
    const verifier = new SupabaseTokenVerifier(
      createClient('http://127.0.0.1:1', supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }) as never,
    );

    const error = await verifier.verifyAccessToken(accessToken).catch((caught: unknown) => caught);
    const renderedError = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : '';

    expect(error).toMatchObject({
      category: 'authentication',
      code: 'invalid_access_token',
      message: 'Authentication could not be verified.',
    });
    expect(renderedError).not.toContain(accessToken);
    expect(renderedError).not.toContain(supabaseAnonKey);
    expect(renderedError).not.toContain(testPassword);
  });
});
