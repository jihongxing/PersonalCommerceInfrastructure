import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';
import { eq, and } from 'drizzle-orm';

import type { ProductDatabase } from '../../persistence/postgres/postgres-database.js';
import { commerceReferences } from '../../../database/schema/commerce-reference.js';
import { commerceProfiles } from '../../../database/schema/commerce-profile.js';
import { serviceOfferings } from '../../../database/schema/creator-identity.js';
import {
  PublicCreatorProfileResponseSchema,
} from '../../../contracts/api/v1/public-creator-profile-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { ApplicationError } from '../../../applications/core/application-error.js';

const CommerceRefParamsSchema = Type.Object(
  {
    commerceRef: Type.String({ minLength: 18, maxLength: 18 }),
  },
  { additionalProperties: false },
);

export function registerPublicCreatorProfileRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly database: ProductDatabase;
  },
): void {
  /**
   * GET /api/v1/public/creator-profile/:commerceRef
   * 
   * 通过 C号 获取 Creator Profile 和其公开的 Offerings
   */
  server.get(
    '/api/v1/public/creator-profile/:commerceRef',
    {
      schema: {
        operationId: 'getPublicCreatorProfile',
        params: CommerceRefParamsSchema,
        response: {
          200: PublicCreatorProfileResponseSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['public-creator-profile'],
      },
    },
    async (request, reply) => {
      const { commerceRef } = request.params as { commerceRef: string };

      // 1. 通过 commerce_reference 查找 commerce_profile
      const referenceRows = await dependencies.database
        .select({
          commerceProfileId: commerceReferences.commerceProfileId,
        })
        .from(commerceReferences)
        .where(eq(commerceReferences.commerceReference, commerceRef));

      if (referenceRows.length === 0) {
        throw new ApplicationError({
          category: 'not_found',
          code: 'CREATOR_NOT_FOUND',
          message: `Creator with commerce reference ${commerceRef} not found`,
        });
      }

      const { commerceProfileId } = referenceRows[0]!;

      // 2. 查找 commerce_profile
      const profileRows = await dependencies.database
        .select({
          displayName: commerceProfiles.displayName,
        })
        .from(commerceProfiles)
        .where(eq(commerceProfiles.commerceProfileId, commerceProfileId));

      if (profileRows.length === 0) {
        throw new ApplicationError({
          category: 'not_found',
          code: 'CREATOR_NOT_FOUND',
          message: `Creator profile ${commerceProfileId} not found`,
        });
      }

      const { displayName } = profileRows[0]!;

      // 3. 查找该 Creator 的 published offerings
      // 注意：commerce_profile_id 需要映射到 creator_id
      // 假设 commerce_profile_id === creator_id（需要确认数据模型）
      const offeringRows = await dependencies.database
        .select({
          id: serviceOfferings.id,
          title: serviceOfferings.title,
          description: serviceOfferings.description,
        })
        .from(serviceOfferings)
        .where(
          and(
            eq(serviceOfferings.creatorId, commerceProfileId),
            eq(serviceOfferings.state, 'published')
          )
        );

      const offerings = offeringRows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
      }));

      return reply.send({
        profile: {
          commerceReference: commerceRef,
          displayName,
        },
        offerings,
      });
    },
  );
}
