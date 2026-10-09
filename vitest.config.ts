import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
    },
  },
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
    fileParallelism: false,
    maxWorkers: 1,
    include: [
      'adapters/**/*.test.ts',
      'apps/web/**/*.test.ts',
      'modules/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
  },
});
