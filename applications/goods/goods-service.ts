import { randomUUID } from 'node:crypto';

import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';

export type GoodsOfferingState = 'draft' | 'published' | 'paused';
export type GoodsOrderState = 'pending' | 'accepted' | 'rejected';

export interface GoodsOfferingTerms {
  readonly title: string;
  readonly description: string;
  readonly priceMinor: string;
  readonly currency: string;
  readonly fulfillmentDescription: string;
  readonly preparationDescription: string;
  readonly imageUrl?: string;
}

export interface GoodsOffering {
  readonly id: string;
  readonly sellerId: string;
  readonly revision: number;
  readonly state: GoodsOfferingState;
  readonly terms: GoodsOfferingTerms;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface GoodsOrderSnapshot extends GoodsOfferingTerms {
  readonly offeringRevision: number;
}

export interface GoodsOrder {
  readonly id: string;
  readonly offeringId: string;
  readonly sellerId: string;
  readonly buyerAccountId: string;
  readonly idempotencyKey: string;
  readonly state: GoodsOrderState;
  readonly snapshot: GoodsOrderSnapshot;
  readonly submittedAt: string;
  readonly updatedAt: string;
}

export interface GoodsOrderAcceptance {
  readonly id: string;
  readonly orderId: string;
  readonly sellerId: string;
  readonly actorAccountId: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface GoodsCommitment {
  readonly id: string;
  readonly orderId: string;
  readonly sellerId: string;
  readonly buyerAccountId: string;
  readonly createdAt: string;
  readonly correlationId: string;
}

export interface GoodsDeliveryConfirmation {
  readonly id: string;
  readonly orderId: string;
  readonly sellerId: string;
  readonly method: string;
  readonly note: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface GoodsBuyerReceiptConfirmation {
  readonly id: string;
  readonly orderId: string;
  readonly buyerAccountId: string;
  readonly note: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface GoodsSellerCancellationProposal {
  readonly id: string;
  readonly orderId: string;
  readonly sellerId: string;
  readonly reason: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface GoodsAudit {
  readonly id: string;
  readonly targetType: 'goods_offering' | 'goods_order';
  readonly targetId: string;
  readonly action: string;
  readonly beforeState: unknown;
  readonly afterState: unknown;
  readonly reason: string;
  readonly actorId: string;
  readonly actorAccountId?: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface GoodsOrderView {
  readonly order: GoodsOrder;
  readonly acceptance?: GoodsOrderAcceptance;
  readonly commitment?: GoodsCommitment;
  readonly delivery?: GoodsDeliveryConfirmation;
  readonly buyerReceipt?: GoodsBuyerReceiptConfirmation;
  readonly sellerCancellationProposal?: GoodsSellerCancellationProposal;
}

export interface GoodsTransaction {
  now(): Promise<string>;
  intakeOpen(): Promise<boolean>;
  offering(id: string): Promise<GoodsOffering | undefined>;
  offeringsForSeller(sellerId: string): Promise<GoodsOffering[]>;
  saveOffering(offering: GoodsOffering): Promise<void>;
  publicOffering(id: string): Promise<GoodsOffering | undefined>;
  order(id: string): Promise<GoodsOrder | undefined>;
  ordersForSeller(sellerId: string): Promise<GoodsOrder[]>;
  ordersForBuyer(buyerAccountId: string): Promise<GoodsOrder[]>;
  findOrderByIdempotency(
    buyerAccountId: string,
    idempotencyKey: string,
  ): Promise<GoodsOrder | undefined>;
  saveOrder(order: GoodsOrder): Promise<void>;
  acceptance(orderId: string): Promise<GoodsOrderAcceptance | undefined>;
  saveAcceptance(acceptance: GoodsOrderAcceptance): Promise<void>;
  commitment(orderId: string): Promise<GoodsCommitment | undefined>;
  saveCommitment(commitment: GoodsCommitment): Promise<void>;
  delivery(orderId: string): Promise<GoodsDeliveryConfirmation | undefined>;
  saveDelivery(delivery: GoodsDeliveryConfirmation): Promise<void>;
  buyerReceipt(orderId: string): Promise<GoodsBuyerReceiptConfirmation | undefined>;
  saveBuyerReceipt(receipt: GoodsBuyerReceiptConfirmation): Promise<void>;
  sellerCancellationProposal(orderId: string): Promise<GoodsSellerCancellationProposal | undefined>;
  saveSellerCancellationProposal(proposal: GoodsSellerCancellationProposal): Promise<void>;
  audit(audit: GoodsAudit): Promise<void>;
}

export interface GoodsStore {
  transact<Result>(work: (transaction: GoodsTransaction) => Promise<Result>): Promise<Result>;
}

export type GoodsOfferingInput = GoodsOfferingTerms;

function fail(
  category: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'conflict',
  code: string,
  message: string,
): never {
  throw new ApplicationError({ category, code, message });
}

function requireInput(condition: boolean, code: string, message: string): asserts condition {
  if (!condition) fail('validation', code, message);
}

function normalizeTerms(input: GoodsOfferingInput): GoodsOfferingTerms {
  const priceMinor = input.priceMinor.trim();
  const currency = input.currency.trim().toUpperCase();
  requireInput(
    /^\d+$/u.test(priceMinor),
    'goods_price_invalid',
    'Price must be a non-negative integer string.',
  );
  requireInput(BigInt(priceMinor) >= 0n, 'goods_price_invalid', 'Price must be non-negative.');
  requireInput(
    /^[A-Z]{3}$/u.test(currency),
    'goods_currency_invalid',
    'Currency must be a three-letter code.',
  );
  const terms = {
    title: input.title.trim(),
    description: input.description.trim(),
    priceMinor: BigInt(priceMinor).toString(),
    currency,
    fulfillmentDescription: input.fulfillmentDescription.trim(),
    preparationDescription: input.preparationDescription.trim(),
    ...(input.imageUrl === undefined || input.imageUrl.trim().length === 0
      ? {}
      : { imageUrl: input.imageUrl.trim() }),
  };
  requireInput(
    terms.title.length > 0 && terms.title.length <= 160,
    'goods_title_required',
    'A Goods title is required.',
  );
  requireInput(
    terms.description.length > 0 && terms.description.length <= 2_000,
    'goods_description_required',
    'A Goods description is required.',
  );
  requireInput(
    terms.fulfillmentDescription.length > 0 && terms.fulfillmentDescription.length <= 1_000,
    'goods_fulfillment_required',
    'A fulfillment description is required.',
  );
  requireInput(
    terms.preparationDescription.length > 0 && terms.preparationDescription.length <= 1_000,
    'goods_preparation_required',
    'A preparation description is required.',
  );
  requireInput(
    terms.imageUrl === undefined || terms.imageUrl.length <= 2_048,
    'goods_image_url_invalid',
    'The image URL is too long.',
  );
  return terms;
}

function creatorId(context: ActorContext): string {
  if (context.actor.kind !== 'creator')
    fail('authorization', 'creator_actor_required', 'A Creator actor is required.');
  return context.actor.creatorId;
}

function accountId(context: ActorContext): string {
  if (context.accountId === undefined || context.accountId.trim().length === 0) {
    fail('authentication', 'account_context_required', 'An authenticated account is required.');
  }
  return context.accountId;
}

async function ownedOffering(transaction: GoodsTransaction, id: string, sellerId: string) {
  const offering = await transaction.offering(id);
  if (offering === undefined)
    fail('not_found', 'goods_offering_not_found', 'Goods Offering not found.');
  if (offering.sellerId !== sellerId)
    fail(
      'authorization',
      'goods_offering_not_owned',
      'Goods Offering does not belong to the authenticated Creator.',
    );
  return offering;
}

async function ownedOrder(transaction: GoodsTransaction, id: string, sellerId: string) {
  const order = await transaction.order(id);
  if (order === undefined) fail('not_found', 'goods_order_not_found', 'Goods Order not found.');
  if (order.sellerId !== sellerId)
    fail(
      'authorization',
      'goods_order_not_owned',
      'Goods Order does not belong to the authenticated Creator.',
    );
  return order;
}

async function orderView(
  transaction: GoodsTransaction,
  order: GoodsOrder,
): Promise<GoodsOrderView> {
  const [acceptance, commitment, delivery, buyerReceipt, sellerCancellationProposal] =
    await Promise.all([
      transaction.acceptance(order.id),
      transaction.commitment(order.id),
      transaction.delivery(order.id),
      transaction.buyerReceipt(order.id),
      transaction.sellerCancellationProposal(order.id),
    ]);
  return {
    order,
    ...(acceptance === undefined ? {} : { acceptance }),
    ...(commitment === undefined ? {} : { commitment }),
    ...(delivery === undefined ? {} : { delivery }),
    ...(buyerReceipt === undefined ? {} : { buyerReceipt }),
    ...(sellerCancellationProposal === undefined ? {} : { sellerCancellationProposal }),
  };
}

function audit(input: {
  targetType: GoodsAudit['targetType'];
  targetId: string;
  action: string;
  beforeState: unknown;
  afterState: unknown;
  reason: string;
  actorId: string;
  actorAccountId?: string;
  occurredAt: string;
  correlationId: string;
}): GoodsAudit {
  return { id: randomUUID(), ...input };
}

export function createGoodsService(store: GoodsStore) {
  return {
    async createOffering(sellerId: string, input: GoodsOfferingInput, correlationId: string) {
      return store.transact(async (transaction) => {
        const now = await transaction.now();
        const offering: GoodsOffering = {
          id: randomUUID(),
          sellerId,
          revision: 1,
          state: 'draft',
          terms: normalizeTerms(input),
          createdAt: now,
          updatedAt: now,
        };
        await transaction.saveOffering(offering);
        await transaction.audit(
          audit({
            targetType: 'goods_offering',
            targetId: offering.id,
            action: 'create_goods_offering',
            beforeState: null,
            afterState: offering,
            reason: 'Goods Offering created',
            actorId: sellerId,
            occurredAt: now,
            correlationId,
          }),
        );
        return offering;
      });
    },

    async updateOffering(
      sellerId: string,
      offeringId: string,
      expectedRevision: number,
      input: GoodsOfferingInput,
      correlationId: string,
    ) {
      return store.transact(async (transaction) => {
        const current = await ownedOffering(transaction, offeringId, sellerId);
        if (current.revision !== expectedRevision)
          fail(
            'conflict',
            'goods_offering_revision_conflict',
            'The Goods Offering changed. Reload before updating.',
          );
        const now = await transaction.now();
        const updated: GoodsOffering = {
          ...current,
          revision: current.revision + 1,
          terms: normalizeTerms(input),
          updatedAt: now,
        };
        await transaction.saveOffering(updated);
        await transaction.audit(
          audit({
            targetType: 'goods_offering',
            targetId: offeringId,
            action: 'update_goods_offering',
            beforeState: current,
            afterState: updated,
            reason: 'Goods Offering updated',
            actorId: sellerId,
            occurredAt: now,
            correlationId,
          }),
        );
        return updated;
      });
    },

    async listOfferings(sellerId: string) {
      return store.transact((transaction) => transaction.offeringsForSeller(sellerId));
    },

    async publishOffering(
      sellerId: string,
      offeringId: string,
      expectedRevision: number,
      correlationId: string,
    ) {
      return changeOfferingState(
        store,
        sellerId,
        offeringId,
        expectedRevision,
        'published',
        correlationId,
      );
    },

    async pauseOffering(
      sellerId: string,
      offeringId: string,
      expectedRevision: number,
      correlationId: string,
    ) {
      return changeOfferingState(
        store,
        sellerId,
        offeringId,
        expectedRevision,
        'paused',
        correlationId,
      );
    },

    async resumeOffering(
      sellerId: string,
      offeringId: string,
      expectedRevision: number,
      correlationId: string,
    ) {
      return changeOfferingState(
        store,
        sellerId,
        offeringId,
        expectedRevision,
        'published',
        correlationId,
      );
    },

    async publicOffering(offeringId: string) {
      return store.transact((transaction) => transaction.publicOffering(offeringId));
    },

    async submitOrder(
      buyerAccountId: string,
      offeringId: string,
      idempotencyKey: string,
      correlationId: string,
    ) {
      return store.transact(async (transaction) => {
        const key = idempotencyKey.trim();
        requireInput(
          key.length > 0 && key.length <= 128,
          'goods_idempotency_key_required',
          'An idempotency key is required.',
        );
        const existing = await transaction.findOrderByIdempotency(buyerAccountId, key);
        if (existing !== undefined) return orderView(transaction, existing);
        if (!(await transaction.intakeOpen()))
          fail('conflict', 'goods_intake_paused', 'Goods is not accepting new orders.');
        const offering = await transaction.offering(offeringId);
        if (offering === undefined)
          fail('not_found', 'goods_offering_not_found', 'Goods Offering not found.');
        if (offering.state !== 'published')
          fail('conflict', 'goods_offering_paused', 'Goods Offering is not accepting new orders.');
        const now = await transaction.now();
        const order: GoodsOrder = {
          id: randomUUID(),
          offeringId,
          sellerId: offering.sellerId,
          buyerAccountId,
          idempotencyKey: key,
          state: 'pending',
          snapshot: { ...offering.terms, offeringRevision: offering.revision },
          submittedAt: now,
          updatedAt: now,
        };
        await transaction.saveOrder(order);
        await transaction.audit(
          audit({
            targetType: 'goods_order',
            targetId: order.id,
            action: 'submit_goods_order',
            beforeState: null,
            afterState: order,
            reason: 'Goods Order submitted',
            actorId: buyerAccountId,
            actorAccountId: buyerAccountId,
            occurredAt: now,
            correlationId,
          }),
        );
        return orderView(transaction, order);
      });
    },

    async buyerOrders(buyerAccountId: string) {
      return store.transact(async (transaction) =>
        Promise.all(
          (await transaction.ordersForBuyer(buyerAccountId)).map((order) =>
            orderView(transaction, order),
          ),
        ),
      );
    },

    async sellerOrders(sellerId: string) {
      return store.transact(async (transaction) =>
        Promise.all(
          (await transaction.ordersForSeller(sellerId)).map((order) =>
            orderView(transaction, order),
          ),
        ),
      );
    },

    async getBuyerOrder(buyerAccountId: string, orderId: string) {
      return store.transact(async (transaction) => {
        const order = await transaction.order(orderId);
        if (order === undefined || order.buyerAccountId !== buyerAccountId)
          fail('not_found', 'goods_order_not_found', 'Goods Order not found.');
        return orderView(transaction, order);
      });
    },

    async acceptOrder(
      sellerId: string,
      orderId: string,
      actorAccountId: string,
      correlationId: string,
    ) {
      return store.transact(async (transaction) => {
        const order = await ownedOrder(transaction, orderId, sellerId);
        if (order.state === 'accepted') return orderView(transaction, order);
        if (order.state !== 'pending')
          fail(
            'conflict',
            'goods_order_not_pending',
            'Only a pending Goods Order can be accepted.',
          );
        const now = await transaction.now();
        const updated: GoodsOrder = { ...order, state: 'accepted', updatedAt: now };
        const acceptance: GoodsOrderAcceptance = {
          id: randomUUID(),
          orderId,
          sellerId,
          actorAccountId,
          occurredAt: now,
          correlationId,
        };
        const commitment: GoodsCommitment = {
          id: randomUUID(),
          orderId,
          sellerId,
          buyerAccountId: order.buyerAccountId,
          createdAt: now,
          correlationId,
        };
        await transaction.saveOrder(updated);
        await transaction.saveAcceptance(acceptance);
        await transaction.saveCommitment(commitment);
        await transaction.audit(
          audit({
            targetType: 'goods_order',
            targetId: orderId,
            action: 'accept_goods_order',
            beforeState: order,
            afterState: updated,
            reason: 'Goods Order accepted and Commitment created',
            actorId: sellerId,
            actorAccountId,
            occurredAt: now,
            correlationId,
          }),
        );
        return orderView(transaction, updated);
      });
    },

    async rejectOrder(
      sellerId: string,
      orderId: string,
      actorAccountId: string,
      reason: string,
      correlationId: string,
    ) {
      return store.transact(async (transaction) => {
        const order = await ownedOrder(transaction, orderId, sellerId);
        if (order.state === 'rejected') return orderView(transaction, order);
        if (order.state !== 'pending')
          fail(
            'conflict',
            'goods_order_not_pending',
            'Only a pending Goods Order can be rejected.',
          );
        const normalizedReason = reason.trim();
        requireInput(
          normalizedReason.length > 0 && normalizedReason.length <= 500,
          'goods_rejection_reason_required',
          'A rejection reason is required.',
        );
        const now = await transaction.now();
        const updated: GoodsOrder = { ...order, state: 'rejected', updatedAt: now };
        await transaction.saveOrder(updated);
        await transaction.audit(
          audit({
            targetType: 'goods_order',
            targetId: orderId,
            action: 'reject_goods_order',
            beforeState: order,
            afterState: updated,
            reason: normalizedReason,
            actorId: sellerId,
            actorAccountId,
            occurredAt: now,
            correlationId,
          }),
        );
        return orderView(transaction, updated);
      });
    },

    async recordDelivery(
      sellerId: string,
      orderId: string,
      method: string,
      note: string,
      correlationId: string,
    ) {
      return store.transact(async (transaction) => {
        const order = await ownedOrder(transaction, orderId, sellerId);
        if (order.state !== 'accepted')
          fail(
            'conflict',
            'goods_order_not_accepted',
            'Delivery requires an accepted Goods Order.',
          );
        const existing = await transaction.delivery(orderId);
        if (existing !== undefined) return orderView(transaction, order);
        const normalizedMethod = method.trim();
        const normalizedNote = note.trim();
        requireInput(
          normalizedMethod.length > 0 && normalizedMethod.length <= 240,
          'goods_delivery_method_required',
          'A delivery method is required.',
        );
        requireInput(
          normalizedNote.length <= 2_000,
          'goods_delivery_note_invalid',
          'The delivery note is too long.',
        );
        const now = await transaction.now();
        await transaction.saveDelivery({
          id: randomUUID(),
          orderId,
          sellerId,
          method: normalizedMethod,
          note: normalizedNote,
          occurredAt: now,
          correlationId,
        });
        await transaction.audit(
          audit({
            targetType: 'goods_order',
            targetId: orderId,
            action: 'record_goods_delivery',
            beforeState: order,
            afterState: { order, delivery: await transaction.delivery(orderId) },
            reason: normalizedMethod,
            actorId: sellerId,
            occurredAt: now,
            correlationId,
          }),
        );
        return orderView(transaction, order);
      });
    },

    async recordBuyerReceipt(
      buyerAccountId: string,
      orderId: string,
      note: string,
      correlationId: string,
    ) {
      return store.transact(async (transaction) => {
        const order = await transaction.order(orderId);
        if (order === undefined || order.buyerAccountId !== buyerAccountId)
          fail('not_found', 'goods_order_not_found', 'Goods Order not found.');
        if (order.state !== 'accepted')
          fail('conflict', 'goods_order_not_accepted', 'Receipt requires an accepted Goods Order.');
        const existing = await transaction.buyerReceipt(orderId);
        if (existing !== undefined) return orderView(transaction, order);
        const normalizedNote = note.trim();
        requireInput(
          normalizedNote.length <= 2_000,
          'goods_receipt_note_invalid',
          'The receipt note is too long.',
        );
        const now = await transaction.now();
        await transaction.saveBuyerReceipt({
          id: randomUUID(),
          orderId,
          buyerAccountId,
          note: normalizedNote,
          occurredAt: now,
          correlationId,
        });
        return orderView(transaction, order);
      });
    },

    async proposeCancellation(
      sellerId: string,
      orderId: string,
      reason: string,
      correlationId: string,
    ) {
      return store.transact(async (transaction) => {
        const order = await ownedOrder(transaction, orderId, sellerId);
        if (order.state !== 'accepted')
          fail(
            'conflict',
            'goods_order_not_accepted',
            'A seller cancellation proposal requires an accepted Goods Order.',
          );
        const existing = await transaction.sellerCancellationProposal(orderId);
        if (existing !== undefined) return orderView(transaction, order);
        const normalizedReason = reason.trim();
        requireInput(
          normalizedReason.length > 0 && normalizedReason.length <= 2_000,
          'goods_cancellation_reason_required',
          'A cancellation reason is required.',
        );
        const now = await transaction.now();
        await transaction.saveSellerCancellationProposal({
          id: randomUUID(),
          orderId,
          sellerId,
          reason: normalizedReason,
          occurredAt: now,
          correlationId,
        });
        await transaction.audit(
          audit({
            targetType: 'goods_order',
            targetId: orderId,
            action: 'propose_goods_order_cancellation',
            beforeState: order,
            afterState: {
              order,
              sellerCancellationProposal: await transaction.sellerCancellationProposal(orderId),
            },
            reason: normalizedReason,
            actorId: sellerId,
            occurredAt: now,
            correlationId,
          }),
        );
        return orderView(transaction, order);
      });
    },

    actorSellerId(context: ActorContext) {
      return creatorId(context);
    },
    actorAccountId(context: ActorContext) {
      return accountId(context);
    },
  };
}

async function changeOfferingState(
  store: GoodsStore,
  sellerId: string,
  offeringId: string,
  expectedRevision: number,
  state: GoodsOfferingState,
  correlationId: string,
) {
  return store.transact(async (transaction) => {
    const current = await ownedOffering(transaction, offeringId, sellerId);
    if (current.revision !== expectedRevision)
      fail(
        'conflict',
        'goods_offering_revision_conflict',
        'The Goods Offering changed. Reload before updating.',
      );
    if (state === 'published' && current.state === 'published') return current;
    if (state === 'paused' && current.state === 'paused') return current;
    if (state === 'published' && current.state === 'draft') normalizeTerms(current.terms);
    if (state === 'paused' && current.state !== 'published')
      fail(
        'conflict',
        'goods_offering_not_published',
        'Only a published Goods Offering can be paused.',
      );
    const now = await transaction.now();
    const updated: GoodsOffering = {
      ...current,
      state,
      revision: current.revision + 1,
      updatedAt: now,
    };
    await transaction.saveOffering(updated);
    await transaction.audit(
      audit({
        targetType: 'goods_offering',
        targetId: offeringId,
        action: `goods_offering_${state}`,
        beforeState: current,
        afterState: updated,
        reason: `Goods Offering changed to ${state}`,
        actorId: sellerId,
        occurredAt: now,
        correlationId,
      }),
    );
    return updated;
  });
}

export type GoodsService = ReturnType<typeof createGoodsService>;
