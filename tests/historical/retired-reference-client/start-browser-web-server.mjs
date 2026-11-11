import { spawn } from 'node:child_process';
import { existsSync, rmSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

linkDirectory('apps/web/.next/static', 'apps/web/.next/standalone/apps/web/.next/static');
if (existsSync('apps/web/public')) {
  linkDirectory('apps/web/public', 'apps/web/.next/standalone/apps/web/public');
}

const server = spawn(process.execPath, ['apps/web/.next/standalone/apps/web/server.js'], {
  env: process.env,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopServer();
  });
}

const exitCode = await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.once('exit', (code) => resolve(code ?? 1));
});

process.exitCode = exitCode;

function linkDirectory(source, target) {
  rmSync(target, { force: true, recursive: true });
  symlinkSync(resolve(source), target, process.platform === 'win32' ? 'junction' : 'dir');
}

function stopServer() {
  if (server.exitCode !== null || server.signalCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill.exe', ['/pid', String(server.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
    return;
  }

  server.kill('SIGTERM');
}
