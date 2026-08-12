import { defineConfig, devices } from '@playwright/test';

const apiPort = 45100;
const webPort = 45101;

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
        APP_ENV: 'test',
        LOG_LEVEL: 'error',
        WEB_REFERENCE_CLIENT_ORIGIN: `http://127.0.0.1:${webPort}`,
      },
      reuseExistingServer: false,
      timeout: 60_000,
      url: `http://127.0.0.1:${apiPort}/api/v1/health`,
    },
    {
      command: `pnpm --filter @personal-commerce/web build && pnpm --filter @personal-commerce/web exec next start -H 127.0.0.1 -p ${webPort}`,
      env: {
        NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
      },
      reuseExistingServer: false,
      timeout: 60_000,
      url: `http://127.0.0.1:${webPort}`,
    },
  ],
});
