import process from 'node:process';
import { URL } from 'node:url';

const apiBaseUrl = requiredUrl('SMOKE_API_BASE_URL');
const webBaseUrl = requiredUrl('SMOKE_WEB_BASE_URL');

await assertJson(`${apiBaseUrl}/api/v1/health`, {
  service: 'vs-01-api',
  status: 'ok',
  version: 'v1',
});
await assertJson(`${apiBaseUrl}/api/v1/readiness`, {
  service: 'vs-01-api',
  status: 'ready',
  version: 'v1',
});
await assertStatus(`${apiBaseUrl}/openapi.json`, 200);
await assertStatus(webBaseUrl, 200);
await assertStatus(`${webBaseUrl}/auth/signup`, 200);
await assertStatus(`${webBaseUrl}/auth/login`, 200);

process.stdout.write('Deployment smoke check passed.');

function requiredUrl(name) {
  const value = process.env[name]?.trim();
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} is required.`);
  }
  return new URL(value).toString().replace(/\/$/u, '');
}

async function assertStatus(url, expectedStatus) {
  const response = await globalThis.fetch(url);
  if (response.status !== expectedStatus) {
    throw new Error(`${url} returned ${response.status}; expected ${expectedStatus}.`);
  }
}

async function assertJson(url, expected) {
  const response = await globalThis.fetch(url);
  const body = await response.json();
  if (response.status !== 200 || JSON.stringify(body) !== JSON.stringify(expected)) {
    throw new Error(`${url} returned unexpected readiness payload: ${JSON.stringify(body)}.`);
  }
}
