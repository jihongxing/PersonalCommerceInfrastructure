import { readFile } from 'node:fs/promises';
import process from 'node:process';

import { loadWebTokenCss, outputPath } from './generate-web-token-adapter.mjs';

const original = await readFile(outputPath, 'utf8')
  .then((content) => content.replace(/\r\n/gu, '\n'))
  .catch(() => undefined);
const generated = (await loadWebTokenCss()).replace(/\r\n/gu, '\n');

if (original === undefined) {
  console.error('Web Token Adapter is missing. Run "pnpm design:generate-web-tokens".');
  process.exit(1);
}

if (original !== generated) {
  console.error('Web Token Adapter is stale. Run "pnpm design:generate-web-tokens".');
  process.exit(1);
}

console.log('Web Token Adapter is current.');
