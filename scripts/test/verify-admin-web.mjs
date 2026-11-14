import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const app = resolve(root, 'apps/admin-web');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? files(path) : [path];
    }),
  );
  return nested.flat();
}

// Admin may use a same-origin BFF. Browser code may call only the BFF; server route handlers may
// call the shared API and must not import persistence or hold static Operations credentials.
const runtimeFiles = (
  await Promise.all(['app', 'components', 'lib'].map((dir) => files(resolve(app, dir))))
)
  .flat()
  .filter((path) => /[.][cm]?[jt]sx?$/.test(path) && !/[.]test[.]/.test(path));
const clientFiles = runtimeFiles.filter(
  (path) => !path.includes('app\\api\\') && !path.includes('app/api/'),
);
const clientForbidden =
  /\b(?:XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB)\b|NEXT_PUBLIC_|\b(?:postgres|drizzle-orm|OPERATIONS_ACCESS_TOKEN|JWT_SECRET|DATABASE_URL)\b/;
const serverForbidden =
  /\b(?:postgres|drizzle-orm|OPERATIONS_ACCESS_TOKEN|JWT_SECRET|DATABASE_URL)\b/;
for (const path of clientFiles) {
  if (clientForbidden.test(await readFile(path, 'utf8'))) {
    throw new Error(`Admin browser boundary violation: ${path}`);
  }
}
for (const path of runtimeFiles) {
  if (serverForbidden.test(await readFile(path, 'utf8'))) {
    throw new Error(`Admin server boundary violation: ${path}`);
  }
}

// Only fabricated sentinels are used. No existing server credentials are printed or compared.
const sentinel = `ENG012_SERVER_ONLY_${randomUUID()}`;
const result = spawnSync('pnpm --filter admin-web build', {
  cwd: root,
  shell: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
    ADMIN_API_ORIGIN: 'http://127.0.0.1:8080',
    ADMIN_WEB_ORIGIN: 'https://admin.example.invalid',
    OPERATIONS_ACCESS_TOKEN: sentinel,
    JWT_SECRET: sentinel,
    DATABASE_URL: sentinel,
  },
});
if (result.error || result.status !== 0) throw new Error('Admin production build failed');
const browserFiles = await files(resolve(app, '.next/static'));
for (const path of browserFiles) {
  if ((await readFile(path)).includes(Buffer.from(sentinel))) {
    throw new Error(`Server-only sentinel leaked into browser asset: ${path}`);
  }
}
console.log(
  `Admin shell security check passed: ${runtimeFiles.length} runtime source files, ${browserFiles.length} browser assets; no server sentinel found.`,
);
