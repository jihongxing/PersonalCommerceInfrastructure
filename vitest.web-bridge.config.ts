import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('./apps/web-v2/', import.meta.url)),
  resolve: {
    alias: { '@': fileURLToPath(new URL('./apps/web-v2/', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    include: [
      '../../tests/auth-integration-e2e.test.ts',
      '../../tests/optimization.test.ts',
      '../../tests/security.test.ts',
    ],
  },
});
