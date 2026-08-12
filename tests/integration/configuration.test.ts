import { describe, expect, it } from 'vitest';

import {
  loadAuthConfiguration,
  loadConfiguration,
  loadDatabaseConfiguration,
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
        CREATOR_ACTOR_MAPPINGS: '[]',
      }),
    ).toThrow('CREATOR_ACTOR_MAPPINGS must be a valid JSON object.');
  });
});
