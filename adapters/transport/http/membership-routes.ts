import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { MembershipService } from '../../../applications/membership/membership-service.js';
import {
  MembershipActivityParameters,
  MembershipAdmissionSchema,
  MembershipApplySchema,
  MembershipCorrectionSchema,
  MembershipIdParameters,
  MembershipIdentityCheckSchema,
  MembershipPublishSchema,
  MembershipReviseSchema,
  MembershipTermsSchema,
  type MembershipAdmissionBody,
  type MembershipApplyBody,
  type MembershipCorrectionBody,
  type MembershipIdentityCheckBody,
  type MembershipPublishBody,
  type MembershipReviseBody,
  type MembershipTermsBody,
} from '../../../contracts/api/v1/membership-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

type Id = { id: string };
type Activity = Id & { memberId: string };

export function registerMembershipRoutes(
  server: FastifyInstance,
  service: MembershipService,
  auth: AuthContextProvider,
) {
  const publicPath = '/api/v1/public/membership-offerings';
  const privatePath = '/api/v1/private/membership';
  const creatorPath = '/api/v1/creator/membership';

  const credentials = (request: FastifyRequest) => ({
    accessToken: extractBearerToken(request.headers.authorization),
    correlationId: request.id,
  });
  const provider = async (request: FastifyRequest) => {
    const context = await auth.resolveActorContext(credentials(request));
    if (context.actor.kind !== 'creator' || !context.accountId) {
      throw new ApplicationError({
        category: 'authorization',
        code: 'membership_provider_required',
        message: 'An authorized Creator is required.',
      });
    }
    return { providerId: context.actor.creatorId, actorAccountId: context.accountId };
  };
  const providerActivity = async (request: FastifyRequest<{ Params: Activity }>) => ({
    ...(await provider(request)),
    offeringId: request.params.id,
    membershipId: request.params.memberId,
    correlationId: request.id,
  });

  server.get<{ Params: Id }>(
    `${publicPath}/:id`,
    { schema: { operationId: 'getPublicMembershipOffering', params: MembershipIdParameters } },
    (request, reply) => {
      reply.header('cache-control', 'no-store');
      return service.publicOffering(request.params.id);
    },
  );
  server.get(
    privatePath,
    { schema: { operationId: 'listMyMembershipApplications' } },
    async (request, reply) => {
      const account = await auth.resolveAccountContext(credentials(request));
      reply.header('cache-control', 'no-store');
      return service.myApplications(account.accountId);
    },
  );
  server.post<{ Params: Id; Body: MembershipApplyBody }>(
    `${privatePath}/:id/applications`,
    {
      schema: {
        operationId: 'applyForMembership',
        params: MembershipIdParameters,
        body: MembershipApplySchema,
      },
    },
    async (request, reply) => {
      const account = await auth.resolveAccountContext(credentials(request));
      const application = await service.apply({
        version: request.body.version,
        accepted: request.body.accepted,
        offeringId: request.params.id,
        accountId: account.accountId,
        correlationId: request.id,
      });
      return reply.code(201).send(application);
    },
  );
  server.get(
    `${creatorPath}/offerings`,
    { schema: { operationId: 'listProviderMembershipOfferings' } },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return service.providerOfferings((await provider(request)).providerId);
    },
  );
  server.post<{ Body: MembershipTermsBody }>(
    `${creatorPath}/offerings`,
    { schema: { operationId: 'createMembershipOffering', body: MembershipTermsSchema } },
    async (request, reply) =>
      reply
        .code(201)
        .send(await service.createOffering((await provider(request)).providerId, request.body)),
  );
  server.patch<{ Params: Id; Body: MembershipReviseBody }>(
    `${creatorPath}/offerings/:id`,
    {
      schema: {
        operationId: 'reviseMembershipOffering',
        params: MembershipIdParameters,
        body: MembershipReviseSchema,
      },
    },
    async (request) =>
      service.reviseOffering(
        (await provider(request)).providerId,
        request.params.id,
        request.body.expectedRevision,
        request.body.terms,
      ),
  );
  server.post<{ Params: Id; Body: MembershipPublishBody }>(
    `${creatorPath}/offerings/:id/publish`,
    {
      schema: {
        operationId: 'publishMembershipOffering',
        params: MembershipIdParameters,
        body: MembershipPublishSchema,
      },
    },
    async (request) =>
      service.publishOffering(
        (await provider(request)).providerId,
        request.params.id,
        request.body.expectedRevision,
      ),
  );
  server.get<{ Params: Id }>(
    `${creatorPath}/offerings/:id/applications`,
    {
      schema: { operationId: 'listProviderMembershipApplications', params: MembershipIdParameters },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return service.providerApplications((await provider(request)).providerId, request.params.id);
    },
  );
  server.post<{ Params: Id; Body: MembershipIdentityCheckBody }>(
    `${creatorPath}/applications/:id/approve`,
    {
      schema: {
        operationId: 'approveMembershipApplication',
        params: MembershipIdParameters,
        body: MembershipIdentityCheckSchema,
      },
    },
    async (request) =>
      service.approve({
        ...(await provider(request)),
        applicationId: request.params.id,
        identityChecked: request.body.identityChecked,
        correlationId: request.id,
      }),
  );
  const activityPath = `${creatorPath}/offerings/:id/members/:memberId`;
  server.get<{ Params: Activity }>(
    activityPath,
    { schema: { operationId: 'getMembershipActivity', params: MembershipActivityParameters } },
    async (request, reply) => {
      const context = await providerActivity(request);
      reply.header('cache-control', 'no-store');
      return service.activity(context.providerId, context.offeringId, context.membershipId);
    },
  );
  server.post<{ Params: Activity; Body: MembershipIdentityCheckBody }>(
    `${activityPath}/verifications`,
    {
      schema: {
        operationId: 'verifyMembership',
        params: MembershipActivityParameters,
        body: MembershipIdentityCheckSchema,
      },
    },
    async (request, reply) =>
      reply.code(201).send(
        await service.record({
          ...(await providerActivity(request)),
          identityChecked: request.body.identityChecked,
          kind: 'verification',
        }),
      ),
  );
  server.post<{ Params: Activity; Body: MembershipAdmissionBody }>(
    `${activityPath}/admissions`,
    {
      schema: {
        operationId: 'recordMembershipAdmission',
        params: MembershipActivityParameters,
        body: MembershipAdmissionSchema,
      },
    },
    async (request, reply) =>
      reply.code(201).send(
        await service.record({
          ...(await providerActivity(request)),
          verificationId: request.body.verificationId,
          occurred: request.body.occurred,
          kind: 'admission',
        }),
      ),
  );
  server.post<{ Params: Activity; Body: MembershipCorrectionBody }>(
    `${activityPath}/corrections`,
    {
      schema: {
        operationId: 'correctMembershipAdmission',
        params: MembershipActivityParameters,
        body: MembershipCorrectionSchema,
      },
    },
    async (request, reply) =>
      reply.code(201).send(
        await service.record({
          ...(await providerActivity(request)),
          admissionId: request.body.admissionId,
          reason: request.body.reason,
          kind: 'admission_correction',
        }),
      ),
  );
}
