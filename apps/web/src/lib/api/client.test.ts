import { describe, expect, it } from 'vitest';

import { loadWebConfiguration } from '../../configuration/bootstrap.js';
import { createApiClient } from './client.js';

describe('Web API client foundation', () => {
  it('uses a replaceable API base URL', () => {
    const client = createApiClient({
      apiBaseUrl: 'https://api.example.test/',
    });

    expect(client).toBeDefined();
  });

  it('loads a replaceable API base URL through the client bootstrap', () => {
    expect(
      loadWebConfiguration({
        NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test/',
        NEXT_PUBLIC_RUNTIME_ENV: 'controlled',
      }),
    ).toEqual({
      apiBaseUrl: 'https://api.example.test',
      runtimeEnvironment: 'controlled',
    });
  });

  it('uses a safe local API default', () => {
    expect(loadWebConfiguration({})).toEqual({
      apiBaseUrl: 'http://127.0.0.1:3000',
      runtimeEnvironment: 'local',
    });
  });

  it('identifies production so local simulation controls can remain absent', () => {
    expect(
      loadWebConfiguration({
        NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test',
        NEXT_PUBLIC_RUNTIME_ENV: 'production',
      }),
    ).toMatchObject({ runtimeEnvironment: 'production' });
  });
});
