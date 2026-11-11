import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const rootCompiler = createRequire(import.meta.url).resolve('typescript/bin/tsc');

// Run every historical scope even when an earlier compiler fails.
for (const [name, compiler, config] of [
  ['backend', rootCompiler, 'tsconfig.historical.json'],
  ['tests', rootCompiler, 'tsconfig.historical-tests.json'],
]) {
  console.log(`Historical ${name}: ${config}`);
  const result = spawnSync(
    process.execPath,
    [compiler, '--noEmit', '-p', resolve(repositoryRoot, config)],
    {
      cwd: repositoryRoot,
      stdio: 'inherit',
    },
  );
  if (result.error) throw result.error;
  const code = result.status ?? 1;
  console.log(`Historical ${name}: exit ${code}`);
  if (code !== 0) process.exitCode = process.exitCode || code;
}
