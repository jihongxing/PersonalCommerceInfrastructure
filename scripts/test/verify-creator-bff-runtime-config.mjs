import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';

const compose = await readFile(
  new URL('../../deploy/compose.production.yml', import.meta.url),
  'utf8',
);
const envExample = await readFile(
  new URL('../../deploy/.env.production.example', import.meta.url),
  'utf8',
);
const dockerfile = await readFile(
  new URL('../../deploy/Dockerfile.web-v2', import.meta.url),
  'utf8',
);

const required = [
  'CREATOR_BFF_DATABASE_URL',
  'CREATOR_BFF_SESSION_SECRET',
  'CREATOR_BFF_API_BASE_URL',
  'CREATOR_BFF_ALLOWED_ORIGINS',
  'CREATOR_BFF_REVOCATION_SECRET',
];

for (const name of required) {
  if (!compose.includes(`${name}: \${${name}:?${name} is required}`)) {
    throw new Error(`Compose production configuration does not require ${name}.`);
  }
  if (!envExample.match(new RegExp(`^${name}=`, 'm'))) {
    throw new Error(`Production environment example does not document ${name}.`);
  }
}

const webBlock = compose.slice(compose.indexOf('\n  web:'));
if (!required.every((name) => webBlock.includes(`${name}:`))) {
  throw new Error(
    'Creator BFF runtime settings are not all present in the web service environment.',
  );
}
if (!compose.match(/\n\x20\x20api:[\s\S]*?CREATOR_BFF_REVOCATION_SECRET:/)) {
  throw new Error('API service is missing the shared Creator BFF revocation secret.');
}
const webEnvironment = webBlock.slice(
  webBlock.indexOf('    environment:'),
  webBlock.indexOf('    ports:'),
);
if (webEnvironment.includes('NEXT_PUBLIC_')) {
  throw new Error('A public build variable was found in the web runtime environment block.');
}
if (dockerfile.includes('CREATOR_BFF_')) {
  throw new Error(
    'Server-only Creator BFF settings must be injected at runtime, not baked into the image.',
  );
}

process.stdout.write('Creator BFF runtime configuration structure: PASS\n');
