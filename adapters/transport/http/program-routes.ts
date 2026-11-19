import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { ProgramService } from '../../../applications/program/program-service.js';
import {
  ProgramApplicationParameters,
  ProgramAttendanceSchema,
  ProgramCancelSchema,
  ProgramCompletionSchema,
  ProgramIdParameters,
  ProgramEnrollmentParameters,
  ProgramOfferingTermsSchema,
  ProgramPublishOfferingSchema,
  ProgramRunCreateSchema,
  ProgramSessionParameters,
  ProgramSessionSchema,
  type ProgramAttendanceBody,
  type ProgramCancelBody,
  type ProgramCompletionBody,
  type ProgramOfferingTermsBody,
  type ProgramRunCreateBody,
  type ProgramSessionBody,
} from '../../../contracts/api/v1/program-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

type Id = { id: string };
type SessionId = { sessionId: string };
type ApplicationId = { applicationId: string };
type EnrollmentId = { enrollmentId: string };

export function registerProgramRoutes(server: FastifyInstance, service: ProgramService, auth: AuthContextProvider): void {
  const publicPath = '/api/v1/public/program-runs';
  const privatePath = '/api/v1/private/program';
  const creatorPath = '/api/v1/creator/program';
  const credentials = (request: FastifyRequest) => ({
    accessToken: extractBearerToken(request.headers.authorization),
    correlationId: request.id,
  });
  const account = async (request: FastifyRequest) => (await auth.resolveAccountContext(credentials(request))).accountId;
  const provider = async (request: FastifyRequest) => {
    const context = await auth.resolveActorContext(credentials(request));
    if (context.actor.kind !== 'creator')
      throw new ApplicationError({ category: 'authorization', code: 'program_provider_required', message: 'An authorized Creator is required.' });
    return { providerId: context.actor.creatorId, actorAccountId: context.accountId ?? context.actor.creatorId };
  };

  server.get(publicPath, { schema: { operationId: 'listPublicProgramRuns' } }, async (_request, reply) => {
    reply.header('cache-control', 'no-store');
    return service.publicRuns();
  });
  server.get<{ Params: Id }>(`${publicPath}/:id`, { schema: { operationId: 'getPublicProgramRun', params: ProgramIdParameters } }, async (request, reply) => {
    reply.header('cache-control', 'no-store');
    return service.publicRun(request.params.id);
  });

  server.get(`${privatePath}/applications`, { schema: { operationId: 'listMyProgramApplications' } }, async (request) => service.myApplications(await account(request)));
  server.get(`${privatePath}/enrollments`, { schema: { operationId: 'listMyProgramEnrollments' } }, async (request) => service.myEnrollments(await account(request)));
  server.post<{ Params: Id }>(`${privatePath}/runs/:id/applications`, { schema: { operationId: 'submitProgramApplication', params: ProgramIdParameters } }, async (request, reply) => reply.code(201).send(await service.apply(await account(request), request.params.id, request.id)));
  server.post<{ Params: ApplicationId }>(`${privatePath}/applications/:applicationId/withdraw`, { schema: { operationId: 'withdrawProgramApplication', params: ProgramApplicationParameters } }, async (request) => service.withdrawApplication(await account(request), request.params.applicationId, request.id));
  server.post<{ Params: EnrollmentId }>(`${privatePath}/enrollments/:enrollmentId/withdraw`, { schema: { operationId: 'withdrawProgramEnrollment', params: ProgramEnrollmentParameters } }, async (request) => service.withdrawEnrollment(await account(request), request.params.enrollmentId, request.id));

  server.get(`${creatorPath}/offerings`, { schema: { operationId: 'listCreatorProgramOfferings' } }, async (request) => service.providerOfferings((await provider(request)).providerId));
  server.post<{ Body: ProgramOfferingTermsBody }>(`${creatorPath}/offerings`, { schema: { operationId: 'createCreatorProgramOffering', body: ProgramOfferingTermsSchema } }, async (request, reply) => reply.code(201).send(await service.createOffering((await provider(request)).providerId, request.body)));
  server.post<{ Params: Id; Body: { expectedRevision: number } }>(`${creatorPath}/offerings/:id/publish`, { schema: { operationId: 'publishCreatorProgramOffering', params: ProgramIdParameters, body: ProgramPublishOfferingSchema } }, async (request) => service.publishOffering((await provider(request)).providerId, request.params.id, request.body.expectedRevision));
  server.get(`${creatorPath}/runs`, { schema: { operationId: 'listCreatorProgramRuns' } }, async (request) => service.providerRuns((await provider(request)).providerId));
  server.post<{ Body: ProgramRunCreateBody }>(`${creatorPath}/runs`, { schema: { operationId: 'createCreatorProgramRun', body: ProgramRunCreateSchema } }, async (request, reply) => reply.code(201).send(await service.createRun((await provider(request)).providerId, request.body)));
  server.post<{ Params: Id }>(`${creatorPath}/runs/:id/publish`, { schema: { operationId: 'publishCreatorProgramRun', params: ProgramIdParameters } }, async (request) => service.publishRun((await provider(request)).providerId, request.params.id));
  server.get<{ Params: Id }>(`${creatorPath}/runs/:id/applications`, { schema: { operationId: 'listCreatorProgramApplications', params: ProgramIdParameters } }, async (request) => service.providerApplications((await provider(request)).providerId, request.params.id));
  server.post<{ Params: ApplicationId }>(`${creatorPath}/applications/:applicationId/approve`, { schema: { operationId: 'approveCreatorProgramApplication', params: ProgramApplicationParameters } }, async (request) => { const actor = await provider(request); return service.approveApplication(actor.providerId, request.params.applicationId, actor.actorAccountId, request.id); });
  server.post<{ Params: ApplicationId }>(`${creatorPath}/applications/:applicationId/reject`, { schema: { operationId: 'rejectCreatorProgramApplication', params: ProgramApplicationParameters } }, async (request) => { const actor = await provider(request); return service.rejectApplication(actor.providerId, request.params.applicationId, actor.actorAccountId, request.id); });
  server.post<{ Params: Id; Body: ProgramSessionBody }>(`${creatorPath}/runs/:id/sessions`, { schema: { operationId: 'createCreatorProgramSession', params: ProgramIdParameters, body: ProgramSessionSchema } }, async (request, reply) => reply.code(201).send(await service.addSession((await provider(request)).providerId, request.params.id, request.body, request.id)));
  server.patch<{ Params: SessionId; Body: ProgramSessionBody }>(`${creatorPath}/sessions/:sessionId`, { schema: { operationId: 'changeCreatorProgramSession', params: ProgramSessionParameters, body: ProgramSessionSchema } }, async (request) => service.changeSession((await provider(request)).providerId, request.params.sessionId, request.body, request.id));
  server.post<{ Params: SessionId; Body: ProgramAttendanceBody }>(`${creatorPath}/sessions/:sessionId/attendance`, { schema: { operationId: 'recordCreatorProgramAttendance', params: ProgramSessionParameters, body: ProgramAttendanceSchema } }, async (request) => service.recordAttendance((await provider(request)).providerId, request.params.sessionId, request.body.entries, request.id));
  server.get<{ Params: Id }>(`${creatorPath}/runs/:id/attendance`, { schema: { operationId: 'listCreatorProgramAttendance', params: ProgramIdParameters } }, async (request) => service.runAttendance((await provider(request)).providerId, request.params.id));
  server.post<{ Params: Id; Body: ProgramCancelBody }>(`${creatorPath}/runs/:id/cancel`, { schema: { operationId: 'cancelCreatorProgramRun', params: ProgramIdParameters, body: ProgramCancelSchema } }, async (request) => service.cancelRun((await provider(request)).providerId, request.params.id, request.body.reason, request.id));
  server.post<{ Params: Id; Body: ProgramCompletionBody }>(`${creatorPath}/runs/:id/complete`, { schema: { operationId: 'completeCreatorProgramRun', params: ProgramIdParameters, body: ProgramCompletionSchema } }, async (request) => { const actor = await provider(request); return service.completeRun(actor.providerId, request.params.id, request.body.entries, actor.actorAccountId, request.id); });
}
