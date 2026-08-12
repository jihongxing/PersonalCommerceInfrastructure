import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  dialect: 'postgresql',
  out: './database/migrations',
  schema: './database/schema/index.ts',
  strict: true,
  verbose: true,
  ...(databaseUrl === undefined
    ? {}
    : {
        dbCredentials: {
          url: databaseUrl,
        },
      }),
});
