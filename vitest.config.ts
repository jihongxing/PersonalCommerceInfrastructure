import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
    fileParallelism: false,
    maxWorkers: 1,
    include: ['adapters/**/*.test.ts', 'modules/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'tests/historical/**'],
  },
});
