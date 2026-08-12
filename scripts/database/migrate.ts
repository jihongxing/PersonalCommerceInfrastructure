import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import { loadDatabaseConfiguration } from '../../apps/prototype/src/configuration/bootstrap.js';

const configuration = loadDatabaseConfiguration();
const connection = createPostgresDatabase(configuration.databaseUrl);

try {
  await migrate(connection.database, {
    migrationsFolder: 'database/migrations',
  });
} finally {
  await connection.close();
}
