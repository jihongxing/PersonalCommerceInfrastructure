import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import * as schema from '../../../database/schema/index.js';

export type ProductDatabase = PostgresJsDatabase<typeof schema>;

export interface PostgresDatabaseConnection {
  readonly client: Sql;
  readonly database: ProductDatabase;
  checkReadiness(): Promise<void>;
  close(): Promise<void>;
}

export function createPostgresDatabase(databaseUrl: string): PostgresDatabaseConnection {
  const client = postgres(databaseUrl, {
    max: 10,
    prepare: false,
  });

  return {
    client,
    database: drizzle(client, { schema }),
    checkReadiness: async () => {
      await client`select 1`;
    },
    close: async () => {
      await client.end();
    },
  };
}
