import { describe, expect, it } from 'vitest';

import {
  loadAuthConfiguration,
  loadConfiguration,
  loadDatabaseConfiguration,
  loadRealMoneyRuntimeConfiguration,
  loadOperationsAuthConfiguration,
} from '../../apps/prototype/src/configuration/bootstrap.js';

describe('configuration bootstrap', () => {
  it('loads supported configuration', () => {
    expect(
      loadConfiguration({
        API_HOST: '0.0.0.0',
        API_PORT: '4100',
        APP_ENV: 'test',
        LOG_LEVEL: 'debug',
      }),
    ).toEqual({
      apiHost: '0.0.0.0',
      apiPort: 4100,
      environment: 'test',
      logLevel: 'debug',
      usePostgresTestComposition: false,
      webReferenceClientOrigin: 'http://127.0.0.1:43125',
    });
  });

  it('uses safe local API defaults', () => {
    expect(loadConfiguration({ APP_ENV: 'test' })).toMatchObject({
      apiHost: '127.0.0.1',
      apiPort: 3000,
      webReferenceClientOrigin: 'http://127.0.0.1:43125',
    });
  });

  it('loads production configuration only with an explicit public origin', () => {
    expect(
      loadConfiguration({
        APP_ENV: 'production',
        WEB_REFERENCE_CLIENT_ORIGIN: 'https://commerce.example.test',
      }),
    ).toMatchObject({
      environment: 'production',
      webReferenceClientOrigin: 'https://commerce.example.test',
    });

    expect(() => loadConfiguration({ APP_ENV: 'production' })).toThrow(
      'WEB_REFERENCE_CLIENT_ORIGIN is required in production.',
    );
  });

  it('rejects unsupported environment values', () => {
    expect(() => loadConfiguration({ APP_ENV: 'staging' })).toThrow('Unsupported APP_ENV');
  });

  it('rejects invalid API binding configuration', () => {
    expect(() => loadConfiguration({ API_HOST: ' ' })).toThrow('Unsupported API_HOST');
    expect(() => loadConfiguration({ API_PORT: '0' })).toThrow('Unsupported API_PORT');
    expect(() => loadConfiguration({ API_PORT: 'not-a-number' })).toThrow('Unsupported API_PORT');
    expect(() => loadConfiguration({ WEB_REFERENCE_CLIENT_ORIGIN: 'not-a-url' })).toThrow(
      'WEB_REFERENCE_CLIENT_ORIGIN must be a valid URL.',
    );
  });
});

describe('database configuration bootstrap', () => {
  it('loads a trimmed PostgreSQL connection string', () => {
    expect(
      loadDatabaseConfiguration({
        DATABASE_URL: ' postgresql://postgres:postgres@127.0.0.1:5432/personal_commerce ',
      }),
    ).toEqual({
      databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:5432/personal_commerce',
    });
  });

  it('fails safely when DATABASE_URL is unavailable', () => {
    expect(() => loadDatabaseConfiguration({})).toThrow(
      'DATABASE_URL is required for PostgreSQL operations.',
    );
    expect(() => loadDatabaseConfiguration({ DATABASE_URL: '   ' })).toThrow(
      'DATABASE_URL is required for PostgreSQL operations.',
    );
  });
});

describe('auth configuration bootstrap', () => {
  it('loads and trims Supabase Auth configuration', () => {
    expect(
      loadAuthConfiguration({
        SUPABASE_URL: ' https://example.supabase.co ',
        SUPABASE_ANON_KEY: ' anon-key ',
        CREATOR_ACTOR_MAPPINGS: '{"supabase:user-1":"creator-1"}',
      }),
    ).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
      creatorActorMappings: new Map([['supabase:user-1', 'creator-1']]),
    });
  });

  it('fails safely when Auth configuration is unavailable or malformed', () => {
    expect(() => loadAuthConfiguration({})).toThrow(
      'SUPABASE_URL is required for Supabase Auth operations.',
    );
    expect(() =>
      loadAuthConfiguration({
        SUPABASE_URL: 'not-a-url',
        SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toThrow('SUPABASE_URL must be a valid URL.');
    expect(() =>
      loadAuthConfiguration({
        SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toThrow('SUPABASE_ANON_KEY is required for Supabase Auth operations.');
    expect(() =>
      loadAuthConfiguration({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toThrow('CREATOR_ACTOR_MAPPINGS is required for Supabase Auth operations.');
    expect(() =>
      loadAuthConfiguration({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
        CREATOR_ACTOR_MAPPINGS: '   ',
      }),
    ).toThrow('CREATOR_ACTOR_MAPPINGS is required for Supabase Auth operations.');
    expect(() =>
      loadAuthConfiguration({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
        CREATOR_ACTOR_MAPPINGS: '[]',
      }),
    ).toThrow('CREATOR_ACTOR_MAPPINGS must be a valid JSON object.');
    expect(() =>
      loadAuthConfiguration({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
        CREATOR_ACTOR_MAPPINGS: '{}',
      }),
    ).toThrow('CREATOR_ACTOR_MAPPINGS must be a valid JSON object.');
    expect(() =>
      loadAuthConfiguration({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
        CREATOR_ACTOR_MAPPINGS: '{"other:user-1":"creator-1"}',
      }),
    ).toThrow('CREATOR_ACTOR_MAPPINGS must be a valid JSON object.');
    expect(() =>
      loadAuthConfiguration({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
        CREATOR_ACTOR_MAPPINGS: '{"supabase: ":"creator-1"}',
      }),
    ).toThrow('CREATOR_ACTOR_MAPPINGS must be a valid JSON object.');
  });
});

describe('operations auth configuration bootstrap', () => {
  it('loads controlled Pilot Operations authentication configuration', () => {
    expect(
      loadOperationsAuthConfiguration({
        OPERATIONS_ACCESS_TOKEN: ' controlled-operations-token ',
        OPERATIONS_OPERATOR_ID: ' pilot-operator-1 ',
      }),
    ).toEqual({
      operationsAccessToken: 'controlled-operations-token',
      operationsOperatorId: 'pilot-operator-1',
    });
  });

  it('rejects missing or weak Operations configuration', () => {
    expect(() => loadOperationsAuthConfiguration({})).toThrow(
      'OPERATIONS_ACCESS_TOKEN must contain at least 16 characters.',
    );
    expect(() =>
      loadOperationsAuthConfiguration({
        OPERATIONS_ACCESS_TOKEN: 'short',
        OPERATIONS_OPERATOR_ID: 'pilot-operator-1',
      }),
    ).toThrow('OPERATIONS_ACCESS_TOKEN must contain at least 16 characters.');
    expect(() =>
      loadOperationsAuthConfiguration({
        OPERATIONS_ACCESS_TOKEN: 'controlled-operations-token',
      }),
    ).toThrow('OPERATIONS_OPERATOR_ID is required for Pilot Operations records.');
  });
});

describe('real-money runtime configuration bootstrap', () => {
  it('defaults to a disabled local runtime without a live Provider', () => {
    expect(loadRealMoneyRuntimeConfiguration({})).toEqual({
      runtimeEnvironment: 'local',
      realMoneyEnabled: false,
      founderActivationReference: undefined,
      provider: undefined,
    });
  });

  it('loads a complete founder-approved controlled Provider configuration', () => {
    expect(
      loadRealMoneyRuntimeConfiguration({
        RUNTIME_ENV: 'controlled',
        REAL_MONEY_ENABLED: 'true',
        FOUNDER_ACTIVATION_REFERENCE: 'founder-go-2026-001',
        LIVE_PROVIDER_ID: 'future-provider',
        LIVE_PROVIDER_URL: 'https://provider.example.test',
        LIVE_PROVIDER_MERCHANT_ACCOUNT: 'merchant-redacted',
        LIVE_PROVIDER_API_CREDENTIAL: 'credential-loaded-at-runtime',
        LIVE_PROVIDER_WEBHOOK_SECRET: 'webhook-secret-loaded-at-runtime',
        LIVE_PROVIDER_ENVIRONMENT: 'production',
        LIVE_PROVIDER_CURRENCY: 'CNY',
        LIVE_PROVIDER_REGION: 'CN',
      }),
    ).toEqual({
      runtimeEnvironment: 'controlled',
      realMoneyEnabled: true,
      founderActivationReference: 'founder-go-2026-001',
      provider: {
        providerId: 'future-provider',
        providerUrl: 'https://provider.example.test',
        merchantAccountMapping: 'merchant-redacted',
        apiCredential: 'credential-loaded-at-runtime',
        webhookSecret: 'webhook-secret-loaded-at-runtime',
        providerEnvironment: 'production',
        currency: 'CNY',
        region: 'CN',
      },
    });
  });

  it('rejects activation outside controlled or production runtime', () => {
    expect(() =>
      loadRealMoneyRuntimeConfiguration({
        RUNTIME_ENV: 'local',
        REAL_MONEY_ENABLED: 'true',
        FOUNDER_ACTIVATION_REFERENCE: 'founder-go-2026-001',
      }),
    ).toThrow('REAL_MONEY_ENABLED requires controlled or production runtime.');
  });

  it('rejects activation without founder approval and complete Provider configuration', () => {
    expect(() =>
      loadRealMoneyRuntimeConfiguration({
        RUNTIME_ENV: 'controlled',
        REAL_MONEY_ENABLED: 'true',
      }),
    ).toThrow('FOUNDER_ACTIVATION_REFERENCE is required');

    expect(() =>
      loadRealMoneyRuntimeConfiguration({
        RUNTIME_ENV: 'controlled',
        REAL_MONEY_ENABLED: 'true',
        FOUNDER_ACTIVATION_REFERENCE: 'founder-go-2026-001',
      }),
    ).toThrow('Live Provider configuration is incomplete');
  });

  it('rejects partial Provider configuration instead of falling back to test transport', () => {
    expect(() =>
      loadRealMoneyRuntimeConfiguration({
        RUNTIME_ENV: 'controlled',
        LIVE_PROVIDER_ID: 'future-provider',
      }),
    ).toThrow('Live Provider configuration is incomplete');
  });
});
