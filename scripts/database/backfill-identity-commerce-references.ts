import { isNull, eq } from 'drizzle-orm';
import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresIdentityCommerceReferenceRepository } from '../../adapters/persistence/postgres/postgres-identity-commerce-reference-repository.js';
import { createIdentityCommerceReferenceService } from '../../applications/canonical-commerce-reference/identity-commerce-reference-service.js';
import { CsprngCommerceReferenceGenerator } from '../../applications/canonical-commerce-reference/commerce-reference-generator.js';
import { loadDatabaseConfiguration } from '../../apps/prototype/src/configuration/bootstrap.js';
import { identities } from '../../database/schema/identity.js';
import { commerceReferences } from '../../database/schema/commerce-reference.js';

const connection = createPostgresDatabase(loadDatabaseConfiguration().databaseUrl);
const apply = process.argv.includes('--apply');
try {
  const missing = await connection.database
    .select({ identityId: identities.identityId })
    .from(identities)
    .leftJoin(commerceReferences, eq(commerceReferences.identityId, identities.identityId))
    .where(isNull(commerceReferences.identityId));
  const service = createIdentityCommerceReferenceService(
    new PostgresIdentityCommerceReferenceRepository(connection.database),
    new CsprngCommerceReferenceGenerator(),
  );
  let failed = 0;
  if (apply) {
    for (const { identityId } of missing) {
      try {
        await service.ensure(identityId);
        console.log(JSON.stringify({ event: 'identity_reference_backfilled', identityId }));
      } catch {
        failed += 1;
        console.error(JSON.stringify({ event: 'identity_reference_backfill_failed', identityId }));
      }
    }
  }
  console.log(
    JSON.stringify({
      event: 'identity_reference_backfill_summary',
      mode: apply ? 'apply' : 'dry_run',
      inspected: missing.length,
      failed,
    }),
  );
  if (failed > 0) process.exitCode = 1;
} finally {
  await connection.close();
}
