import { and, eq, inArray } from 'drizzle-orm';

import {
  LegacySubjectMappingConflictError,
  LegacySubjectMappingAlreadyExistsError,
  type LegacySubjectMappingRepository,
} from '../../../applications/legacy-subject-mapping/legacy-subject-mapping-repositories.js';
import {
  isEffectiveLegacySubjectMapping,
  type LegacySubjectMapping,
  type LegacySubjectMappingFailureCode,
  type LegacySubjectMappingState,
  transitionLegacySubjectMapping,
} from '../../../modules/legacy-subject-mapping/legacy-subject-mapping.js';
import { legacySubjectMappings } from '../../../database/schema/legacy-subject-mapping.js';
import type { ProductDatabase } from './postgres-database.js';

const effectiveStates: LegacySubjectMappingState[] = ['ACTIVE', 'VERIFIED'];

export class PostgresLegacySubjectMappingRepository implements LegacySubjectMappingRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async create(mapping: LegacySubjectMapping): Promise<LegacySubjectMapping> {
    try {
      const rows = await this.database
        .insert(legacySubjectMappings)
        .values(toRow(mapping))
        .onConflictDoNothing({ target: legacySubjectMappings.legacySubjectReference })
        .returning();
      if (rows[0] !== undefined) {
        return toMapping(rows[0]);
      }
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new LegacySubjectMappingAlreadyExistsError(mapping.legacySubjectReference);
      }
      throw error;
    }

    const existing = await this.findHistoricalByLegacySubject(mapping.legacySubjectReference);
    if (
      existing !== undefined &&
      existing.identityId === mapping.identityId &&
      existing.initialCommerceProfileId === mapping.initialCommerceProfileId
    ) {
      return existing;
    }
    throw new LegacySubjectMappingConflictError(mapping.legacySubjectReference);
  }

  public async findByLegacySubject(
    legacySubjectReference: string,
  ): Promise<LegacySubjectMapping | undefined> {
    const rows = await this.database
      .select()
      .from(legacySubjectMappings)
      .where(
        and(
          eq(legacySubjectMappings.legacySubjectReference, legacySubjectReference),
          inArray(legacySubjectMappings.state, effectiveStates),
        ),
      );
    return rows[0] === undefined ? undefined : toMapping(rows[0]);
  }

  public async findByIdentity(identityId: string): Promise<readonly LegacySubjectMapping[]> {
    const rows = await this.database
      .select()
      .from(legacySubjectMappings)
      .where(eq(legacySubjectMappings.identityId, identityId));
    return rows.map(toMapping);
  }

  public async findByInitialCommerceProfile(
    commerceProfileId: string,
  ): Promise<readonly LegacySubjectMapping[]> {
    const rows = await this.database
      .select()
      .from(legacySubjectMappings)
      .where(eq(legacySubjectMappings.initialCommerceProfileId, commerceProfileId));
    return rows.map(toMapping);
  }

  public async findHistoricalByLegacySubject(
    legacySubjectReference: string,
  ): Promise<LegacySubjectMapping | undefined> {
    const rows = await this.database
      .select()
      .from(legacySubjectMappings)
      .where(eq(legacySubjectMappings.legacySubjectReference, legacySubjectReference));
    return rows[0] === undefined ? undefined : toMapping(rows[0]);
  }

  public async updateState(
    mappingId: string,
    state: LegacySubjectMappingState,
    updatedAt: string,
    metadata: {
      readonly verifiedAt?: string;
      readonly mappingFailureCode?: LegacySubjectMappingFailureCode;
    } = {},
  ): Promise<LegacySubjectMapping> {
    const current = await this.findById(mappingId);
    if (current === undefined) {
      throw new Error(`Legacy subject mapping ${mappingId} not found.`);
    }
    const updated = transitionLegacySubjectMapping(current, state, updatedAt, metadata);
    const rows = await this.database
      .update(legacySubjectMappings)
      .set({
        state: updated.state,
        updatedAt: updated.updatedAt,
        verifiedAt: updated.verifiedAt ?? null,
        mappingFailureCode: updated.mappingFailureCode ?? null,
      })
      .where(eq(legacySubjectMappings.mappingId, mappingId))
      .returning();
    if (rows[0] === undefined) {
      throw new Error(`Legacy subject mapping ${mappingId} was not updated.`);
    }
    return toMapping(rows[0]);
  }

  private async findById(mappingId: string): Promise<LegacySubjectMapping | undefined> {
    const rows = await this.database
      .select()
      .from(legacySubjectMappings)
      .where(eq(legacySubjectMappings.mappingId, mappingId));
    return rows[0] === undefined ? undefined : toMapping(rows[0]);
  }
}

function toRow(mapping: LegacySubjectMapping) {
  return {
    mappingId: mapping.mappingId,
    legacySubjectReference: mapping.legacySubjectReference,
    identityId: mapping.identityId,
    initialCommerceProfileId: mapping.initialCommerceProfileId,
    state: mapping.state,
    createdAt: mapping.createdAt,
    updatedAt: mapping.updatedAt,
    verifiedAt: mapping.verifiedAt ?? null,
    mappingFailureCode: mapping.mappingFailureCode ?? null,
  };
}

function toMapping(row: typeof legacySubjectMappings.$inferSelect): LegacySubjectMapping {
  const mapping = {
    mappingId: row.mappingId,
    legacySubjectReference: row.legacySubjectReference,
    identityId: row.identityId,
    initialCommerceProfileId: row.initialCommerceProfileId,
    state: row.state as LegacySubjectMappingState,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.verifiedAt === null ? {} : { verifiedAt: row.verifiedAt }),
    ...(row.mappingFailureCode === null
      ? {}
      : { mappingFailureCode: row.mappingFailureCode as LegacySubjectMappingFailureCode }),
  };
  if (isEffectiveLegacySubjectMapping(mapping)) {
    return mapping;
  }
  return mapping;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
