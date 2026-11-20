import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createInMemoryProgramStore } from '../../adapters/in-memory/in-memory-program-store.js';
import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { createProgramService } from '../../applications/program/program-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const creator = { authorization: 'Bearer program-creator-token' };
const customer = { authorization: 'Bearer program-customer-token' };

describe('Program HTTP business paths', () => {
  const store = createInMemoryProgramStore(() => '2026-12-01T08:00:00.000Z') as ReturnType<typeof createInMemoryProgramStore> & { setIntakeOpen(open: boolean): void };
  store.setIntakeOpen(true);
  const service = createProgramService(store);
  let api: Awaited<ReturnType<typeof createApiServer>>;

  beforeAll(async () => {
    api = await createApiServer({
      programService: service,
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'program-creator-token', actor: { kind: 'creator', creatorId: 'provider-a' } },
        { accessToken: 'other-creator-token', actor: { kind: 'creator', creatorId: 'provider-b' } },
        { accessToken: 'program-customer-token', actor: { kind: 'customer', customerId: 'customer-a' } },
      ]),
    });
  });
  afterAll(async () => api.close());

  it('runs offering, run, application, approval, attendance and completion APIs', async () => {
    const offeringResponse = await api.inject({ method: 'POST', url: '/api/v1/creator/program/offerings', headers: creator, payload: { title: 'Saturday workshop', description: 'A real offline cohort', location: 'Hall A' } });
    expect(offeringResponse.statusCode).toBe(201);
    const offering = offeringResponse.json<{ id: string; revision: number }>();
    expect((await api.inject({ method: 'POST', url: `/api/v1/creator/program/offerings/${offering.id}/publish`, headers: creator, payload: { expectedRevision: offering.revision } })).statusCode).toBe(200);
    const runResponse = await api.inject({ method: 'POST', url: '/api/v1/creator/program/runs', headers: creator, payload: { offeringId: offering.id, startsAt: '2026-12-10T09:00:00.000Z', endsAt: '2026-12-10T12:00:00.000Z', location: 'Hall A', capacity: 2 } });
    expect(runResponse.statusCode).toBe(201);
    const run = runResponse.json<{ id: string }>();
    const sessionResponse = await api.inject({ method: 'POST', url: `/api/v1/creator/program/runs/${run.id}/sessions`, headers: creator, payload: { scheduledStart: '2026-12-10T09:00:00.000Z', scheduledEnd: '2026-12-10T10:00:00.000Z', location: 'Hall A' } });
    expect(sessionResponse.statusCode).toBe(201);
    expect((await api.inject({ method: 'POST', url: `/api/v1/creator/program/runs/${run.id}/publish`, headers: creator })).statusCode).toBe(200);
    const publicRuns = await api.inject({ method: 'GET', url: '/api/v1/public/program-runs' });
    expect(publicRuns.statusCode).toBe(200);
    expect(publicRuns.json<{ id: string }[]>()[0]?.id).toBe(run.id);
    const applicationResponse = await api.inject({ method: 'POST', url: `/api/v1/private/program/runs/${run.id}/applications`, headers: customer, payload: {} });
    expect(applicationResponse.statusCode).toBe(201);
    const application = applicationResponse.json<{ id: string }>();
    const outsider = { authorization: 'Bearer other-creator-token' };
    expect((await api.inject({ method: 'POST', url: `/api/v1/creator/program/applications/${application.id}/approve`, headers: outsider })).statusCode).toBe(404);
    const approvalResponse = await api.inject({ method: 'POST', url: `/api/v1/creator/program/applications/${application.id}/approve`, headers: creator });
    expect(approvalResponse.statusCode).toBe(200);
    const enrollment = approvalResponse.json<{ id: string }>();
    const mine = await api.inject({ method: 'GET', url: '/api/v1/private/program/enrollments', headers: customer });
    expect(mine.statusCode).toBe(200);
    expect(mine.json<{ id: string }[]>()[0]?.id).toBe(enrollment.id);
    const session = sessionResponse.json<{ id: string }>();
    const publicDetail = await api.inject({ method: 'GET', url: `/api/v1/public/program-runs/${run.id}` });
    expect(publicDetail.statusCode).toBe(200);
    const expectedPublicRun = {
      id: run.id,
      location: 'Hall A',
      startsAt: '2026-12-10T09:00:00.000Z',
      endsAt: '2026-12-10T12:00:00.000Z',
      remainingCapacity: 1,
      acceptsApplications: true,
      sessions: [{ id: session.id, sequence: 1, scheduledStart: '2026-12-10T09:00:00.000Z', scheduledEnd: '2026-12-10T10:00:00.000Z', location: 'Hall A' }],
    };
    expect(publicDetail.json()).toEqual(expectedPublicRun);
    expect((await api.inject({ method: 'GET', url: '/api/v1/public/program-runs' })).json()).toEqual([expectedPublicRun]);
    store.setIntakeOpen(false);
    expect((await api.inject({ method: 'GET', url: `/api/v1/public/program-runs/${run.id}` })).json()).toMatchObject({ acceptsApplications: false });
    const attendance = await api.inject({ method: 'POST', url: `/api/v1/creator/program/sessions/${session.id}/attendance`, headers: creator, payload: { entries: [{ enrollmentId: enrollment.id, status: 'attended' }] } });
    expect(attendance.statusCode).toBe(200);
    const privateRun = async () => (await api.inject({ url: '/api/v1/creator/program/runs', headers: creator })).json<unknown[]>()[0];
    expect(await privateRun()).toMatchObject({ sessions: [{ status: 'planned' }], attendance: [{ status: 'attended' }], completions: [] });
    const deliveryPath = `/api/v1/creator/program/sessions/${session.id}/delivery`;
    expect((await api.inject({ method: 'POST', url: deliveryPath, headers: outsider, payload: { status: 'held' } })).statusCode).toBe(404);
    expect((await api.inject({ method: 'POST', url: deliveryPath, headers: creator, payload: { status: 'planned' } })).statusCode).toBe(400);
    const held = await api.inject({ method: 'POST', url: deliveryPath, headers: creator, payload: { status: 'held' } });
    expect(held.statusCode).toBe(200);
    expect(held.json()).toMatchObject({ status: 'held', delivery: { actorId: 'provider-a', recordedAt: '2026-12-01T08:00:00.000Z' } });
    expect((await api.inject({ method: 'POST', url: deliveryPath, headers: creator, payload: { status: 'held' } })).json()).toEqual(held.json());
    expect((await api.inject({ method: 'POST', url: deliveryPath, headers: creator, payload: { status: 'cancelled' } })).statusCode).toBe(409);
    expect(await privateRun()).toMatchObject({ status: 'published', sessions: [{ status: 'held' }], attendance: [{ status: 'attended' }], completions: [] });
    const participantHistory = (await api.inject({ url: '/api/v1/private/program/enrollments', headers: customer })).json<{ sessions: object[] }[]>();
    expect(participantHistory[0]?.sessions[0]).toMatchObject({ status: 'held' });
    expect(participantHistory[0]?.sessions[0]).not.toHaveProperty('delivery');
    expect((await api.inject(`/api/v1/public/program-runs/${run.id}`)).json()).toEqual({ ...expectedPublicRun, acceptsApplications: false });
  });
});
