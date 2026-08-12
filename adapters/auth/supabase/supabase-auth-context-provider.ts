import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  ApplicationError,
  type ApplicationErrorDetails,
} from '../../../applications/core/application-error.js';
import type {
  AuthContextProvider,
  CreatorActorResolver,
  ProviderIdentity,
  ProviderTokenVerifier,
} from '../../../applications/core/ports/auth-context-provider.js';
import { createAuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';

export interface SupabaseAuthConfiguration {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
}

function authenticationError(details: Pick<ApplicationErrorDetails, 'code' | 'message'>) {
  return new ApplicationError({
    category: 'authentication',
    ...details,
  });
}

export class SupabaseTokenVerifier implements ProviderTokenVerifier {
  public constructor(private readonly client: SupabaseClient) {}

  public async verifyAccessToken(accessToken: string): Promise<ProviderIdentity> {
    if (accessToken.trim().length === 0) {
      throw authenticationError({
        code: 'missing_access_token',
        message: 'Authentication is required.',
      });
    }

    const { data, error } = await this.client.auth.getUser(accessToken);

    if (error !== null || data.user === null) {
      throw authenticationError({
        code: 'invalid_access_token',
        message: 'Authentication could not be verified.',
      });
    }

    return {
      provider: 'supabase',
      subject: data.user.id,
    };
  }
}

export function createSupabaseTokenVerifier(
  configuration: SupabaseAuthConfiguration,
): SupabaseTokenVerifier {
  const client = createClient(configuration.supabaseUrl, configuration.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return new SupabaseTokenVerifier(client);
}

export function createSupabaseAuthContextProvider(
  configuration: SupabaseAuthConfiguration,
  creatorActorResolver: CreatorActorResolver,
): AuthContextProvider {
  return createAuthContextProvider({
    tokenVerifier: createSupabaseTokenVerifier(configuration),
    creatorActorResolver,
  });
}
