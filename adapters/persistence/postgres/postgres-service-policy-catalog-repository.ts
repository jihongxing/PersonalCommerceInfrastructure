import { and, desc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import {
  servicePolicyAudits,
  servicePolicyCapabilities,
  servicePolicyReleases,
  servicePolicyTemplates,
} from '../../../database/schema/service-policy.js';
import {
  findCapabilityCatalogItem,
  type CapabilityCatalogItem,
  type CatalogItemStatus,
  type PolicyRiskTier,
  type ServicePolicyCatalogSnapshot,
  type ServiceOfferingTemplate,
} from '../../../modules/service-policy/catalog.js';
import type {
  ServicePolicyAuditRecord,
  ServicePolicyCatalogRepository,
} from '../../../applications/service-policy/service-policy-repositories.js';
import type { ProductDatabase } from './postgres-database.js';
import { ApplicationError } from '../../../applications/core/application-error.js';

export class PostgresServicePolicyCatalogRepository implements ServicePolicyCatalogRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async getSnapshot(): Promise<ServicePolicyCatalogSnapshot> {
    return this.database.transaction((database) => this.readSnapshot(database), {
      isolationLevel: 'repeatable read',
      accessMode: 'read only',
    });
  }

  private async readSnapshot(
    database: Pick<ProductDatabase, 'select'>,
  ): Promise<ServicePolicyCatalogSnapshot> {
    const releases = await database
      .select()
      .from(servicePolicyReleases)
      .where(eq(servicePolicyReleases.status, 'published'))
      .orderBy(desc(servicePolicyReleases.publishedAt), desc(servicePolicyReleases.policyVersion))
      .limit(1);
    const policyVersion = releases[0]?.policyVersion ?? 'v1';
    const [capabilities, templates] = await Promise.all([
      database
        .select()
        .from(servicePolicyCapabilities)
        .where(eq(servicePolicyCapabilities.policyVersion, policyVersion)),
      database
        .select()
        .from(servicePolicyTemplates)
        .where(eq(servicePolicyTemplates.policyVersion, policyVersion)),
    ]);
    return {
      policyVersion,
      capabilities: capabilities.map(mapCapability),
      templates: templates.map(mapTemplate),
    };
  }

  public async findCapabilityById(id: string): Promise<CapabilityCatalogItem | undefined> {
    const snapshot = await this.getSnapshot();
    return snapshot.capabilities.find((item) => item.id === id);
  }

  public async findCapabilityByName(name: string): Promise<CapabilityCatalogItem | undefined> {
    const snapshot = await this.getSnapshot();
    return findCapabilityCatalogItem({ name }, snapshot);
  }

  public async findTemplateById(id: string): Promise<ServiceOfferingTemplate | undefined> {
    const snapshot = await this.getSnapshot();
    return snapshot.templates.find((template) => template.id === id);
  }

  public async updateCapability(
    id: string,
    input: {
      readonly status?: CatalogItemStatus;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
      readonly riskTier?: PolicyRiskTier;
      readonly reason: string;
    },
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<CapabilityCatalogItem> {
    return this.database.transaction(async (database) => {
      await database.execute(
        sql`select pg_advisory_xact_lock(hashtext('pci.service-policy.catalog'))`,
      );

      const snapshot = await this.readSnapshot(database);
      const current = snapshot.capabilities.find((item) => item.id === id);
      if (current === undefined) {
        throw new ApplicationError({
          category: 'not_found',
          code: 'service_policy_capability_not_found',
          message: 'Service policy capability was not found.',
        });
      }
      const updated = {
        ...current,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.creatorSelectable === undefined
          ? {}
          : { creatorSelectable: input.creatorSelectable }),
        ...(input.publishEnabled === undefined ? {} : { publishEnabled: input.publishEnabled }),
        ...(input.riskTier === undefined ? {} : { riskTier: input.riskTier }),
      };
      await database
        .update(servicePolicyCapabilities)
        .set({
          status: updated.status,
          creatorSelectable: updated.creatorSelectable ?? true,
          publishEnabled: updated.publishEnabled ?? true,
          riskTier: updated.riskTier,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(servicePolicyCapabilities.id, id),
            eq(servicePolicyCapabilities.policyVersion, snapshot.policyVersion),
          ),
        );
      await this.appendAudit(
        database,
        snapshot.policyVersion,
        'capability',
        id,
        current as unknown as Readonly<Record<string, unknown>>,
        updated,
        input.reason,
        context,
        'updated',
      );
      return updated;
    });
  }

  public async updateTemplate(
    id: string,
    input: {
      readonly status?: CatalogItemStatus;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
      readonly riskTier?: PolicyRiskTier;
      readonly reason: string;
    },
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<ServiceOfferingTemplate> {
    return this.database.transaction(async (database) => {
      await database.execute(
        sql`select pg_advisory_xact_lock(hashtext('pci.service-policy.catalog'))`,
      );

      const snapshot = await this.readSnapshot(database);
      const current = snapshot.templates.find((template) => template.id === id);
      if (current === undefined) {
        throw new ApplicationError({
          category: 'not_found',
          code: 'service_policy_template_not_found',
          message: 'Service policy template was not found.',
        });
      }
      const updated = {
        ...current,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.creatorSelectable === undefined
          ? {}
          : { creatorSelectable: input.creatorSelectable }),
        ...(input.publishEnabled === undefined ? {} : { publishEnabled: input.publishEnabled }),
        ...(input.riskTier === undefined ? {} : { riskTier: input.riskTier }),
      };
      await database
        .update(servicePolicyTemplates)
        .set({
          status: updated.status,
          creatorSelectable: updated.creatorSelectable ?? true,
          publishEnabled: updated.publishEnabled ?? true,
          riskTier: updated.riskTier,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(servicePolicyTemplates.id, id),
            eq(servicePolicyTemplates.policyVersion, snapshot.policyVersion),
          ),
        );
      await this.appendAudit(
        database,
        snapshot.policyVersion,
        'template',
        id,
        current as unknown as Readonly<Record<string, unknown>>,
        updated,
        input.reason,
        context,
        'updated',
      );
      return updated;
    });
  }

  public async publishVersion(
    version: string,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<void> {
    return this.database.transaction(async (database) => {
      await database.execute(
        sql`select pg_advisory_xact_lock(hashtext('pci.service-policy.catalog'))`,
      );

      const [capabilityRows, templateRows] = await Promise.all([
        database
          .select({ id: servicePolicyCapabilities.id })
          .from(servicePolicyCapabilities)
          .where(eq(servicePolicyCapabilities.policyVersion, version)),
        database
          .select({ id: servicePolicyTemplates.id })
          .from(servicePolicyTemplates)
          .where(eq(servicePolicyTemplates.policyVersion, version)),
      ]);
      if (capabilityRows.length === 0 || templateRows.length === 0) {
        throw new ApplicationError({
          category: 'validation',
          code: 'service_policy_version_not_loaded',
          message: 'The service policy version must be imported before publication.',
        });
      }
      const before = await database
        .select()
        .from(servicePolicyReleases)
        .where(eq(servicePolicyReleases.policyVersion, version));
      const now = new Date().toISOString();
      // Keep exactly one published release so runtime snapshots are deterministic.
      await database
        .update(servicePolicyReleases)
        .set({ status: 'archived' })
        .where(eq(servicePolicyReleases.status, 'published'));
      await database
        .insert(servicePolicyReleases)
        .values({
          policyVersion: version,
          status: 'published',
          reason,
          publishedBy: context.actorId,
          publishedAt: now,
        })
        .onConflictDoUpdate({
          target: servicePolicyReleases.policyVersion,
          set: { status: 'published', reason, publishedBy: context.actorId, publishedAt: now },
        });
      await this.appendAudit(
        database,
        version,
        'release',
        version,
        before[0] ?? {},
        { policyVersion: version, status: 'published', publishedBy: context.actorId },
        reason,
        context,
        'published',
      );
    });
  }

  public async listAudit(): Promise<readonly ServicePolicyAuditRecord[]> {
    const rows = await this.database
      .select()
      .from(servicePolicyAudits)
      .orderBy(desc(servicePolicyAudits.occurredAt), desc(servicePolicyAudits.recordedAt));
    return rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      entityType: row.entityType as ServicePolicyAuditRecord['entityType'],
      entityId: row.entityId,
      action: row.action as ServicePolicyAuditRecord['action'],
      before: row.beforeState,
      after: row.afterState,
      reason: row.reason,
      policyVersion: row.policyVersion,
      occurredAt: row.occurredAt,
      correlationId: row.correlationId,
    }));
  }

  private async appendAudit(
    database: Pick<ProductDatabase, 'insert'>,
    policyVersion: string,
    entityType: ServicePolicyAuditRecord['entityType'],
    entityId: string,
    before: Readonly<Record<string, unknown>>,
    after: Readonly<Record<string, unknown>>,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
    action: ServicePolicyAuditRecord['action'],
  ): Promise<void> {
    await database.insert(servicePolicyAudits).values({
      id: randomUUID(),
      actorId: context.actorId,
      entityType,
      entityId,
      action,
      beforeState: before,
      afterState: after,
      reason,
      policyVersion,
      occurredAt: new Date().toISOString(),
      correlationId: context.correlationId,
    });
  }
}

function mapCapability(row: typeof servicePolicyCapabilities.$inferSelect): CapabilityCatalogItem {
  return {
    id: row.id,
    slug: row.slug,
    vertical: row.vertical,
    name: row.name,
    description: row.description,
    riskTier: row.riskTier as CapabilityCatalogItem['riskTier'],
    releaseScope: row.releaseScope as CapabilityCatalogItem['releaseScope'],
    aliases: row.aliases,
    version: row.version,
    status: row.status as CapabilityCatalogItem['status'],
    creatorSelectable: row.creatorSelectable,
    publishEnabled: row.publishEnabled,
  };
}

function mapTemplate(row: typeof servicePolicyTemplates.$inferSelect): ServiceOfferingTemplate {
  return {
    id: row.id,
    slug: row.slug,
    capabilityCatalogItemId: row.capabilityCatalogItemId,
    name: row.name,
    description: row.description,
    riskTier: row.riskTier as ServiceOfferingTemplate['riskTier'],
    releaseScope: row.releaseScope as ServiceOfferingTemplate['releaseScope'],
    requiredFields: row.requiredFields,
    version: row.version,
    status: row.status as ServiceOfferingTemplate['status'],
    creatorSelectable: row.creatorSelectable,
    publishEnabled: row.publishEnabled,
  };
}
