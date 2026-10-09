import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const realCr02BrowserTests = process.env.RUN_REAL_CR02_BROWSER_TESTS === '1';
const apiPort = 41000;
const webPort = 41001;

if (!realCr02BrowserTests) {
  mkdirSync('tests/acceptance/browser/fixtures', { recursive: true });
  writeFileSync(
    'tests/acceptance/browser/fixtures/auth-state.json',
    `${JSON.stringify(
      {
        cookies: [],
        origins: [
          {
            origin: `http://127.0.0.1:${webPort}`,
            localStorage: [
              {
                name: 'personal-commerce.auth-session',
                value: JSON.stringify({
                  accessToken: 'test-creator-token',
                  refreshToken: 'test-refresh-token',
                  expiresAt: null,
                  userEmail: 'creator@test.local',
                }),
              },
            ],
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
}

const child = spawn(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['--filter', '@personal-commerce/web', 'build'],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
      NEXT_PUBLIC_RUNTIME_ENV: realCr02BrowserTests ? 'controlled' : 'test',
      NEXT_PUBLIC_SUPABASE_URL: realCr02BrowserTests
        ? process.env.SUPABASE_URL
        : 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: realCr02BrowserTests
        ? process.env.SUPABASE_ANON_KEY
        : 'test-anon-key',
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  },
);

const exitCode = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', (code) => resolve(code ?? 1));
});

process.exitCode = exitCode;
