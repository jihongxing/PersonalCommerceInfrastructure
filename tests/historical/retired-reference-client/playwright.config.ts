import { defineConfig, devices } from '@playwright/test';

const apiPort = 41000;
const webPort = 41001;
const realCr02BrowserTests = process.env.RUN_REAL_CR02_BROWSER_TESTS === '1';
const postgresSimulationBrowserTests = process.env.RUN_VS02E_POSTGRES_BROWSER_TESTS === '1';
const controlledEnvironment = Object.fromEntries(
  Object.entries({
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    CREATOR_ACTOR_MAPPINGS: process.env.CREATOR_ACTOR_MAPPINGS,
    OPERATIONS_ACCESS_TOKEN: process.env.OPERATIONS_ACCESS_TOKEN,
    OPERATIONS_OPERATOR_ID: process.env.OPERATIONS_OPERATOR_ID,
  }).filter((entry): entry is [string, string] => entry[1] !== undefined),
);
const controlledWebEnvironment = Object.fromEntries(
  Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  }).filter((entry): entry is [string, string] => entry[1] !== undefined),
);

export default defineConfig({
  testDir: './tests/acceptance/browser',
  outputDir: './output/playwright/test-results',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'output/playwright/report' }]],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    storageState: realCr02BrowserTests
      ? undefined
      : 'tests/acceptance/browser/fixtures/auth-state.json',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'system-edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
  ],
  webServer: [
    {
      command: 'node dist/apps/api/src/main.js',
      env: {
        API_HOST: '127.0.0.1',
        API_PORT: String(apiPort),
        APP_ENV: realCr02BrowserTests ? 'development' : 'test',
        ...(postgresSimulationBrowserTests ? { USE_POSTGRES_TEST_COMPOSITION: '1' } : {}),
        LOG_LEVEL: 'error',
        WEB_REFERENCE_CLIENT_ORIGIN: `http://127.0.0.1:${webPort}`,
        ...(realCr02BrowserTests ? controlledEnvironment : {}),
      },
      reuseExistingServer: false,
      timeout: 60_000,
      url: `http://127.0.0.1:${apiPort}/api/v1/health`,
    },
    {
      command: 'node scripts/test/start-browser-web-server.mjs',
      env: {
        HOSTNAME: '127.0.0.1',
        PORT: String(webPort),
        NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
        NEXT_PUBLIC_RUNTIME_ENV: realCr02BrowserTests ? 'controlled' : 'test',
        ...(realCr02BrowserTests
          ? controlledWebEnvironment
          : {
              NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
              NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
            }),
        ...(realCr02BrowserTests ? controlledEnvironment : {}),
      },
      reuseExistingServer: false,
      timeout: 60_000,
      url: `http://127.0.0.1:${webPort}`,
    },
  ],
});
