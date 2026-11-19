import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { createInMemoryGoodsStore } from '../../adapters/in-memory/in-memory-goods-store.js';
import { InMemoryScenarioOperationsStore } from '../../adapters/in-memory/in-memory-scenario-operations-store.js';
import { InMemoryServicePolicyCatalogRepository } from '../../adapters/in-memory/in-memory-service-policy-catalog-repository.js';
import { createGoodsService } from '../../applications/goods/goods-service.js';
import { createScenarioOperationsService } from '../../applications/operations-admin/scenario-operations.js';
import type { OperationsHumanAuthenticationRuntime } from '../../applications/operations-identity/operations-human-authentication.js';
import { OperationsSessionNotAuthenticatedError } from '../../applications/operations-identity/operations-session-repositories.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { initialServicePolicyCatalog } from '../../modules/service-policy/catalog-seed.js';
import type { ScenarioOperationsResponse } from '../../contracts/api/v1/scenario-operations-contracts.js';

const seller = { authorization: 'Bearer goods-admin-seller-token' };
const buyer = { authorization: 'Bearer goods-admin-buyer-token' };
const secondBuyer = { authorization: 'Bearer goods-admin-second-buyer-token' };
const operations = { authorization: 'Bearer goods-admin-operator-token' };

const operationsRuntime: OperationsHumanAuthenticationRuntime = {
  resolveActorContext({ accessToken, correlationId }) {
    if (accessToken !== 'goods-admin-operator-token')
      return Promise.reject(new OperationsSessionNotAuthenticatedError());
    return Promise.resolve({
      actor: {
        kind: 'operations_human',
        principalId: 'goods-admin-principal',
        accountId: 'goods-admin-account',
        sessionId: 'goods-admin-session',
        permissions: ['catalog:read', 'catalog:policy:activate'],
      },
      accountId: 'goods-admin-account',
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

describe('Goods Admin scenario control', () => {
  let api: Awaited<ReturnType<typeof createApiServer>>;

  beforeAll(async () => {
    const scenarioStore = new InMemoryScenarioOperationsStore();
    const goodsStore = createInMemoryGoodsStore(
      () => '2026-11-20T12:00:00.000Z',
      async () => (await scenarioStore.latest('Goods'))?.open === true,
    );
    const scenarioOperationsService = createScenarioOperationsService(
      scenarioStore,
      new InMemoryServicePolicyCatalogRepository(initialServicePolicyCatalog),
      false,
      false,
      true,
    );
    api = await createApiServer({
      goodsService: createGoodsService(goodsStore),
      scenarioOperationsService,
      operationsHumanAuthenticationRuntime: operationsRuntime,
      authContextProvider: new InMemoryAuthContextProvider([
        {
          accessToken: 'goods-admin-seller-token',
          actor: { kind: 'creator', creatorId: 'goods-admin-seller' },
        },
        {
          accessToken: 'goods-admin-buyer-token',
          actor: { kind: 'customer', customerId: 'goods-admin-buyer' },
        },
        {
          accessToken: 'goods-admin-second-buyer-token',
          actor: { kind: 'customer', customerId: 'goods-admin-second-buyer' },
        },
      ]),
    });
  });

  afterAll(async () => api.close());

  it('pauses new Goods intake while preserving pending order continuity', async () => {
    const created = await api.inject({
      method: 'POST',
      url: '/api/v1/creator/goods/offerings',
      headers: seller,
      payload: {
        title: 'Admin controlled Goods',
        description: 'A Goods Offering controlled by Operations.',
        priceMinor: '1200',
        currency: 'CNY',
        fulfillmentDescription: 'Seller-arranged handover.',
        preparationDescription: 'Prepared on request.',
      },
    });
    expect(created.statusCode).toBe(201);
    const draft = created.json<{ id: string; revision: number }>();
    const published = await api.inject({
      method: 'POST',
      url: '/api/v1/creator/goods/offerings/' + draft.id + '/publish',
      headers: seller,
      payload: { expectedRevision: draft.revision },
    });
    expect(published.statusCode).toBe(200);

    const initial = await api.inject({
      method: 'GET',
      url: '/api/v1/operations/admin/scenarios',
      headers: operations,
    });
    expect(initial.statusCode).toBe(200);
    expect(
      initial
        .json<ScenarioOperationsResponse>()
        .scenarios.find((item: { scenario: string }) => item.scenario === 'Goods'),
    ).toMatchObject({ status: 'paused', canManage: true });

    const opened = await api.inject({
      method: 'PATCH',
      url: '/api/v1/operations/admin/scenarios',
      headers: operations,
      payload: {
        scenario: 'Goods',
        open: true,
        expectedRevision: 0,
        reason: 'Open Goods for bounded test.',
      },
    });
    expect(opened.statusCode).toBe(200);
    const pending = await api.inject({
      method: 'POST',
      url: '/api/v1/private/goods/offerings/' + draft.id + '/orders',
      headers: buyer,
      payload: { idempotencyKey: 'admin-pause-pending' },
    });
    expect(pending.statusCode).toBe(201);
    const pendingOrder = pending.json<{ order: { id: string } }>();

    const paused = await api.inject({
      method: 'PATCH',
      url: '/api/v1/operations/admin/scenarios',
      headers: operations,
      payload: {
        scenario: 'Goods',
        open: false,
        expectedRevision: 1,
        reason: 'Pause Goods for bounded test.',
      },
    });
    expect(paused.statusCode).toBe(200);
    const blocked = await api.inject({
      method: 'POST',
      url: '/api/v1/private/goods/offerings/' + draft.id + '/orders',
      headers: secondBuyer,
      payload: { idempotencyKey: 'admin-pause-blocked' },
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json()).toMatchObject({ error: { code: 'goods_intake_paused' } });

    const accepted = await api.inject({
      method: 'POST',
      url: '/api/v1/creator/goods/orders/' + pendingOrder.order.id + '/accept',
      headers: seller,
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.json()).toMatchObject({
      order: { state: 'accepted' },
      commitment: { orderId: pendingOrder.order.id },
    });
  });
});
