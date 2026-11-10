import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import { loadDatabaseConfiguration } from '../../apps/prototype/src/configuration/bootstrap.js';
import seed from '../../database/seeds/capability-service-catalog.json' with { type: 'json' };
import {
  servicePolicyCapabilities,
  servicePolicyReleases,
  servicePolicyTemplates,
} from '../../database/schema/service-policy.js';

const catalog = seed as typeof seed & {
  readonly policyVersion: string;
  readonly capabilities: readonly {
    readonly id: string;
    readonly slug: string;
    readonly vertical: string;
    readonly name: string;
    readonly description: string;
    readonly riskTier: string;
    readonly releaseScope: string;
    readonly aliases: readonly string[];
    readonly version: string;
    readonly status: string;
    readonly creatorSelectable?: boolean;
    readonly publishEnabled?: boolean;
  }[];
  readonly templates: readonly {
    readonly id: string;
    readonly slug: string;
    readonly capabilityCatalogItemId: string;
    readonly name: string;
    readonly description: string;
    readonly riskTier: string;
    readonly releaseScope: string;
    readonly requiredFields: readonly string[];
    readonly version: string;
    readonly status: string;
    readonly creatorSelectable?: boolean;
    readonly publishEnabled?: boolean;
  }[];
};

const connection = createPostgresDatabase(loadDatabaseConfiguration().databaseUrl);
const now = new Date().toISOString();

try {
  await connection.database.transaction(async (database) => {
    await database
      .insert(servicePolicyReleases)
      .values({
        policyVersion: catalog.policyVersion,
        status: 'published',
        reason: 'Idempotent service policy catalog import',
        publishedAt: now,
      })
      .onConflictDoNothing();

    for (const capability of catalog.capabilities) {
      await database
        .insert(servicePolicyCapabilities)
        .values({
          id: capability.id,
          slug: capability.slug,
          vertical: capability.vertical,
          name: capability.name,
          description: capability.description,
          riskTier: capability.riskTier,
          releaseScope: capability.releaseScope,
          aliases: [...capability.aliases],
          version: capability.version,
          policyVersion: catalog.policyVersion,
          status: capability.status,
          creatorSelectable: capability.creatorSelectable ?? true,
          publishEnabled: capability.publishEnabled ?? true,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [servicePolicyCapabilities.id, servicePolicyCapabilities.policyVersion],
          set: {
            slug: capability.slug,
            vertical: capability.vertical,
            name: capability.name,
            description: capability.description,
            riskTier: capability.riskTier,
            releaseScope: capability.releaseScope,
            aliases: [...capability.aliases],
            version: capability.version,
            policyVersion: catalog.policyVersion,
            updatedAt: now,
          },
        });
    }

    for (const template of catalog.templates) {
      await database
        .insert(servicePolicyTemplates)
        .values({
          id: template.id,
          slug: template.slug,
          capabilityCatalogItemId: template.capabilityCatalogItemId,
          name: template.name,
          description: template.description,
          riskTier: template.riskTier,
          releaseScope: template.releaseScope,
          requiredFields: [...template.requiredFields],
          version: template.version,
          policyVersion: catalog.policyVersion,
          status: template.status,
          creatorSelectable: template.creatorSelectable ?? true,
          publishEnabled: template.publishEnabled ?? true,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [servicePolicyTemplates.id, servicePolicyTemplates.policyVersion],
          set: {
            slug: template.slug,
            capabilityCatalogItemId: template.capabilityCatalogItemId,
            name: template.name,
            description: template.description,
            riskTier: template.riskTier,
            releaseScope: template.releaseScope,
            requiredFields: [...template.requiredFields],
            version: template.version,
            policyVersion: catalog.policyVersion,
            updatedAt: now,
          },
        });
    }
  });
} finally {
  await connection.close();
}

process.stdout.write(`Imported service policy catalog ${catalog.policyVersion}.`);
