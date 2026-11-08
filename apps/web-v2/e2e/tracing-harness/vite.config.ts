import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('../../', import.meta.url)) } },
  define: {
    'process.env.NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED': JSON.stringify('true'),
    'process.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify('http://localhost:18080'),
  },
  server: { host: 'localhost', port: 13000, strictPort: true },
});
