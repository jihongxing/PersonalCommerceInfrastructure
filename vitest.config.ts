import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
    include: [
      'adapters/**/*.test.ts',
      'apps/web/**/*.test.ts',
      'modules/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
  },
});
