import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import type { OperationsHumanAuthenticationRuntime } from '../../applications/operations-identity/operations-human-authentication.js';
import { OperationsSessionNotAuthenticatedError } from '../../applications/operations-identity/operations-session-repositories.js';
import type { ScenarioOperationsResponse } from '../../contracts/api/v1/scenario-operations-contracts.js';

const adminPath = '/api/v1/operations/admin/scenarios';
const admin = { authorization: 'Bearer scenario-admin-test' };
const observer = { authorization: 'Bearer scenario-observer-test' };
const creator = { authorization: 'Bearer test-creator-token' };

const runtime: OperationsHumanAuthenticationRuntime = {
  resolveActorContext({ accessToken, correlationId }) {
    if (!['scenario-admin-test', 'scenario-observer-test'].includes(accessToken)) {
      return Promise.reject(new OperationsSessionNotAuthenticatedError());
    }
    return Promise.resolve({
      actor: {
        kind: 'operations_human',
        principalId: 'scenario-operator-test',
        accountId: 'operations-account-test',
        sessionId: 'operations-session-test',
        permissions:
          accessToken === 'scenario-admin-test'
            ? ['catalog:read', 'catalog:policy:activate']
            : ['catalog:read'],
      },
      correlationId,
    });
  },
  login() {
    return Promise.reject(new Error('not used'));
  },
  logout() {
    return Promise.reject(new Error('not used'));
  },
};

describe('Admin scenario intake controls', () => {
  let api: Awaited<ReturnType<typeof createApiServer>>;
  beforeAll(async () => {
    api = await createApiServer({
      operationsHumanAuthenticationRuntime: runtime,
      rateLimitMax: 1000,
    });
  });
  afterAll(async () => api.close());

  it('persists only authorized Service changes and gates new work without blocking existing Requests', async () => {
    const change = (
      scenario: string,
      open: boolean,
      expectedRevision: number,
      headers = admin,
      reason = 'Operator decision',
    ) =>
      api.inject({
        method: 'PATCH',
        url: adminPath,
        headers,
        payload: { scenario, open, expectedRevision, reason },
      });
    const initial = await api.inject({ method: 'GET', url: adminPath, headers: observer });
    expect(initial.statusCode).toBe(200);
    expect(
      initial
        .json<ScenarioOperationsResponse>()
        .scenarios.map(({ scenario, status, canManage }) => [scenario, status, canManage]),
    ).toEqual([
      ['Service', 'open', false],
      ['Goods', 'not_integrated', false],
      ['Program', 'not_integrated', false],
      ['Membership', 'not_integrated', false],
      ['Project', 'not_integrated', false],
      ['Right', 'not_integrated', false],
    ]);
    expect((await api.inject({ method: 'GET', url: adminPath })).statusCode).toBe(401);
    expect((await change('Service', false, 0, observer)).statusCode).toBe(403);
    expect((await change('Service', false, 0, creator)).statusCode).toBe(401);
    expect((await change('Goods', true, 0)).json()).toMatchObject({
      error: { code: 'scenario_not_integrated' },
    });
    expect((await change('Service', false, 0, admin, '   ')).statusCode).toBe(400);

    const identity = await api.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers: creator,
      payload: {
        profile: { displayName: 'Scenario Creator', bio: 'Test service', socialLinks: [] },
      },
    });
    expect(identity.statusCode).toBe(201);
    const capability = await api.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers: creator,
      payload: {
        name: 'Dance Teaching',
        catalogItemId: 'capability-dance-teaching',
        description: 'Test service',
      },
    });
    expect(capability.statusCode).toBe(201);
    const draft = async () => {
      const response = await api.inject({
        method: 'POST',
        url: '/api/v1/creator/offerings',
        headers: creator,
        payload: {
          capabilityIds: capability.json<{ capabilityIds: string[] }>().capabilityIds,
          templateId: 'template-dance-private-lesson',
          title: 'Dance lesson',
          description: 'One hour of dance teaching',
          availabilityDescription: 'Weekend',
          requestInstructions: 'Share a time.',
        },
      });
      expect(response.statusCode).toBe(201);
      return response.json<{ id: string }>().id;
    };
    const publish = (id: string) =>
      api.inject({
        method: 'POST',
        url: `/api/v1/creator/offerings/${id}/publish`,
        headers: creator,
      });
    const published = await draft();
    const unpublished = await draft();
    expect((await publish(published)).statusCode).toBe(200);
    const publicPath = `/api/v1/public/offerings/${published}`;
    const submit = (contactMethod: string) =>
      api.inject({
        method: 'POST',
        url: `${publicPath}/requests`,
        payload: {
          contactName: 'Test Customer',
          contactMethod,
          requestMessage: 'Saturday please.',
        },
      });
    const before = await submit('first@example.test');
    expect(before.statusCode).toBe(201);

    const racingChanges = await Promise.all([
      change('Service', false, 0),
      change('Service', false, 0),
    ]);
    expect(racingChanges.map((response) => response.statusCode).sort()).toEqual([200, 409]);
    const paused = await api.inject({ method: 'GET', url: adminPath, headers: admin });
    expect(paused.json<ScenarioOperationsResponse>().scenarios[0]).toMatchObject({
      status: 'paused',
      revision: 1,
      canManage: true,
      lastChange: { actorId: 'scenario-operator-test', reason: 'Operator decision' },
    });
    expect((await publish(unpublished)).json()).toMatchObject({
      error: { code: 'service_intake_paused' },
    });
    expect((await api.inject({ method: 'GET', url: publicPath })).statusCode).toBe(422);
    expect((await submit('second@example.test')).statusCode).toBe(422);
    const request = before.json<{ actionId: string; resultAccessToken: string }>();
    expect(
      (
        await api.inject({
          method: 'POST',
          url: `/api/v1/creator/requests/${request.actionId}/confirm`,
          headers: creator,
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await api.inject({
          method: 'GET',
          url: `/api/v1/public/requests/${request.resultAccessToken}`,
        })
      ).json(),
    ).toMatchObject({ state: 'confirmed' });

    expect((await change('Service', true, 0)).statusCode).toBe(409);
    expect((await change('Service', true, 1)).statusCode).toBe(200);
    expect((await publish(unpublished)).statusCode).toBe(200);
    expect((await submit('second@example.test')).statusCode).toBe(201);
  });
});
