import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { createInMemoryGoodsStore } from '../../adapters/in-memory/in-memory-goods-store.js';
import { createGoodsService } from '../../applications/goods/goods-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const seller = { authorization: 'Bearer goods-seller-token' };
const otherSeller = { authorization: 'Bearer goods-other-seller-token' };
const buyer = { authorization: 'Bearer goods-buyer-token' };
const otherBuyer = { authorization: 'Bearer goods-other-buyer-token' };

describe('Goods first-slice HTTP business paths', () => {
  const store = createInMemoryGoodsStore(() => '2026-11-20T12:00:00.000Z');
  store.setIntakeOpen(true);
  const service = createGoodsService(store);
  let api: Awaited<ReturnType<typeof createApiServer>>;

  beforeAll(async () => {
    api = await createApiServer({
      goodsService: service,
      authContextProvider: new InMemoryAuthContextProvider([
        {
          accessToken: 'goods-seller-token',
          actor: { kind: 'creator', creatorId: 'goods-seller' },
        },
        {
          accessToken: 'goods-other-seller-token',
          actor: { kind: 'creator', creatorId: 'other-seller' },
        },
        {
          accessToken: 'goods-buyer-token',
          actor: { kind: 'customer', customerId: 'goods-buyer' },
        },
        {
          accessToken: 'goods-other-buyer-token',
          actor: { kind: 'customer', customerId: 'other-buyer' },
        },
      ]),
    });
  });

  afterAll(async () => api.close());

  it('publishes, discovers on the public Goods path, snapshots and processes one-unit orders', async () => {
    const created = await api.inject({
      method: 'POST',
      url: '/api/v1/creator/goods/offerings',
      headers: seller,
      payload: {
        title: 'Handmade notebook',
        description: 'A single made-to-order notebook.',
        priceMinor: '2500',
        currency: 'CNY',
        fulfillmentDescription: 'Seller-arranged handover or shipping.',
        preparationDescription: 'Prepared within five days.',
      },
    });
    expect(created.statusCode).toBe(201);
    const draft = created.json<{ id: string; revision: number; state: string }>();
    expect(draft.state).toBe('draft');

    const published = await api.inject({
      method: 'POST',
      url: `/api/v1/creator/goods/offerings/${draft.id}/publish`,
      headers: seller,
      payload: { expectedRevision: draft.revision },
    });
    expect(published.statusCode).toBe(200);
    const publicOffering = await api.inject({
      method: 'GET',
      url: `/api/v1/public/goods/offerings/${draft.id}`,
    });
    expect(publicOffering.statusCode).toBe(200);
    expect(publicOffering.json()).toMatchObject({
      id: draft.id,
      state: 'published',
      sellerId: 'goods-seller',
    });

    const unauthenticatedOrder = await api.inject({
      method: 'POST',
      url: `/api/v1/private/goods/offerings/${draft.id}/orders`,
      payload: { idempotencyKey: 'anonymous-order' },
    });
    expect(unauthenticatedOrder.statusCode).toBe(401);

    const submitted = await api.inject({
      method: 'POST',
      url: `/api/v1/private/goods/offerings/${draft.id}/orders`,
      headers: buyer,
      payload: { idempotencyKey: 'buyer-order-1' },
    });
    expect(submitted.statusCode).toBe(201);
    const pending = submitted.json<{
      order: { id: string; state: string; snapshot: { priceMinor: string } };
      commitment?: unknown;
    }>();
    expect(pending.order.state).toBe('pending');
    expect(pending.commitment).toBeUndefined();
    expect(pending.order.snapshot.priceMinor).toBe('2500');

    const duplicate = await api.inject({
      method: 'POST',
      url: `/api/v1/private/goods/offerings/${draft.id}/orders`,
      headers: buyer,
      payload: { idempotencyKey: 'buyer-order-1' },
    });
    expect(duplicate.statusCode).toBe(201);
    expect(duplicate.json<{ order: { id: string } }>().order.id).toBe(pending.order.id);

    const updated = await api.inject({
      method: 'PATCH',
      url: `/api/v1/creator/goods/offerings/${draft.id}`,
      headers: seller,
      payload: {
        expectedRevision: 2,
        terms: {
          title: 'Handmade notebook updated',
          description: 'Updated description.',
          priceMinor: '3000',
          currency: 'CNY',
          fulfillmentDescription: 'Seller-arranged handover or shipping.',
          preparationDescription: 'Prepared within seven days.',
        },
      },
    });
    expect(updated.statusCode).toBe(200);

    const foreignAccept = await api.inject({
      method: 'POST',
      url: `/api/v1/creator/goods/orders/${pending.order.id}/accept`,
      headers: otherSeller,
    });
    expect(foreignAccept.statusCode).toBe(403);

    const accepted = await api.inject({
      method: 'POST',
      url: `/api/v1/creator/goods/orders/${pending.order.id}/accept`,
      headers: seller,
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.json()).toMatchObject({
      order: { state: 'accepted', snapshot: { priceMinor: '2500', offeringRevision: 2 } },
      acceptance: { orderId: pending.order.id },
      commitment: { orderId: pending.order.id },
    });

    const delivery = await api.inject({
      method: 'POST',
      url: `/api/v1/creator/goods/orders/${pending.order.id}/delivery`,
      headers: seller,
      payload: { method: 'in_person_handover', note: 'Handed over at the agreed location.' },
    });
    expect(delivery.statusCode).toBe(200);
    expect(delivery.json()).toMatchObject({
      delivery: { orderId: pending.order.id },
      commitment: { orderId: pending.order.id },
    });

    const receipt = await api.inject({
      method: 'POST',
      url: `/api/v1/private/goods/orders/${pending.order.id}/receipt`,
      headers: buyer,
      payload: { note: 'Received.' },
    });
    expect(receipt.statusCode).toBe(200);
    expect(receipt.json()).toMatchObject({
      delivery: { orderId: pending.order.id },
      buyerReceipt: { orderId: pending.order.id },
    });

    const cancellation = await api.inject({
      method: 'POST',
      url: `/api/v1/creator/goods/orders/${pending.order.id}/cancel-proposal`,
      headers: seller,
      payload: { reason: 'Material became unavailable after acceptance.' },
    });
    expect(cancellation.statusCode).toBe(200);
    expect(cancellation.json()).toMatchObject({
      order: { state: 'accepted' },
      commitment: { orderId: pending.order.id },
      sellerCancellationProposal: { reason: 'Material became unavailable after acceptance.' },
    });

    const buyerView = await api.inject({
      method: 'GET',
      url: `/api/v1/private/goods/orders/${pending.order.id}`,
      headers: buyer,
    });
    expect(buyerView.statusCode).toBe(200);
    expect(buyerView.json()).toMatchObject({
      sellerCancellationProposal: { orderId: pending.order.id },
    });
  });

  it('keeps pending orders on offering pause and rejects new orders', async () => {
    const created = await api.inject({
      method: 'POST',
      url: '/api/v1/creator/goods/offerings',
      headers: seller,
      payload: {
        title: 'Paused Goods',
        description: 'A paused offering.',
        priceMinor: '100',
        currency: 'CNY',
        fulfillmentDescription: 'Seller arranged.',
        preparationDescription: 'Prepared on request.',
      },
    });
    const draft = created.json<{ id: string; revision: number }>();
    const published = await api.inject({
      method: 'POST',
      url: `/api/v1/creator/goods/offerings/${draft.id}/publish`,
      headers: seller,
      payload: { expectedRevision: draft.revision },
    });
    const publishedOffering = published.json<{ revision: number }>();
    const pending = await api.inject({
      method: 'POST',
      url: `/api/v1/private/goods/offerings/${draft.id}/orders`,
      headers: otherBuyer,
      payload: { idempotencyKey: 'pending-before-offering-pause' },
    });
    expect(pending.statusCode).toBe(201);
    const pendingId = pending.json<{ order: { id: string } }>().order.id;
    expect(
      (
        await api.inject({
          method: 'POST',
          url: `/api/v1/creator/goods/offerings/${draft.id}/pause`,
          headers: seller,
          payload: { expectedRevision: publishedOffering.revision },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await api.inject({
          method: 'POST',
          url: `/api/v1/private/goods/offerings/${draft.id}/orders`,
          headers: buyer,
          payload: { idempotencyKey: 'blocked-after-offering-pause' },
        })
      ).json(),
    ).toMatchObject({ error: { code: 'goods_offering_paused' } });
    expect(
      (
        await api.inject({
          method: 'GET',
          url: `/api/v1/creator/goods/orders`,
          headers: seller,
        })
      )
        .json<{ orders: { order: { id: string; state: string } }[] }>()
        .orders.some((item) => item.order.id === pendingId && item.order.state === 'pending'),
    ).toBe(true);
  });
});
