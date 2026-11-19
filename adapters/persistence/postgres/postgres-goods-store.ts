import type { Sql, TransactionSql } from 'postgres';

import type {
  GoodsAudit,
  GoodsBuyerReceiptConfirmation,
  GoodsCommitment,
  GoodsDeliveryConfirmation,
  GoodsOffering,
  GoodsOrder,
  GoodsOrderAcceptance,
  GoodsSellerCancellationProposal,
  GoodsStore,
  GoodsTransaction,
} from '../../../applications/goods/goods-service.js';

export const goodsIntakeLock = 71017215;

interface DataRow<Data> {
  data: Data;
}

export async function verifyGoodsPersistence(sql: Sql): Promise<void> {
  const [result] = await sql<{ ready: boolean }[]>`
    SELECT (
      has_table_privilege(current_user, 'public.goods_offerings', 'SELECT, INSERT, UPDATE')
      AND has_table_privilege(current_user, 'public.goods_orders', 'SELECT, INSERT, UPDATE')
      AND has_table_privilege(current_user, 'public.goods_order_acceptances', 'SELECT, INSERT')
      AND has_table_privilege(current_user, 'public.goods_commitments', 'SELECT, INSERT')
      AND has_table_privilege(current_user, 'public.goods_deliveries', 'SELECT, INSERT')
      AND has_table_privilege(current_user, 'public.goods_buyer_receipts', 'SELECT, INSERT')
      AND has_table_privilege(current_user, 'public.goods_cancellation_proposals', 'SELECT, INSERT')
      AND has_table_privilege(current_user, 'public.goods_audits', 'INSERT')
    ) AS ready`;
  if (!result?.ready) throw new Error('Goods persistence grants are required.');
}

function transactionPort(sql: TransactionSql): GoodsTransaction {
  return {
    async now() {
      const [row] = await sql<{ epoch_milliseconds: string }[]>`
        SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::text AS epoch_milliseconds`;
      if (!row) throw new Error('Database clock unavailable');
      return new Date(Number(row.epoch_milliseconds)).toISOString();
    },
    async intakeOpen() {
      const [revision] = await sql<{ state: { open?: unknown } }[]>`
        SELECT after_state AS state FROM public.operations_action_audits
        WHERE target_type='commercial_scenario' AND target_id='Goods' AND action='change_scenario_intake'
        ORDER BY id DESC LIMIT 1`;
      return revision?.state.open === true;
    },
    async offering(id) {
      const [row] = await sql<DataRow<GoodsOffering>[]>`
        SELECT data FROM public.goods_offerings WHERE id=${id}`;
      return row?.data;
    },
    async offeringsForSeller(sellerId) {
      return (
        await sql<DataRow<GoodsOffering>[]>`
        SELECT data FROM public.goods_offerings WHERE seller_id=${sellerId} ORDER BY created_at, id
      `
      ).map((row) => row.data);
    },
    async saveOffering(offering) {
      await sql`INSERT INTO public.goods_offerings
        (id, seller_id, revision, state, data, created_at, updated_at)
        VALUES (${offering.id}, ${offering.sellerId}, ${offering.revision}, ${offering.state},
          ${JSON.stringify(offering)}::jsonb, ${offering.createdAt}, ${offering.updatedAt})
        ON CONFLICT (id) DO UPDATE SET seller_id=excluded.seller_id, revision=excluded.revision,
          state=excluded.state, data=excluded.data, updated_at=excluded.updated_at`;
    },
    async publicOffering(id) {
      const [row] = await sql<DataRow<GoodsOffering>[]>`
        SELECT data FROM public.goods_offerings WHERE id=${id} AND state='published'`;
      return row?.data;
    },
    async order(id) {
      const [row] = await sql<DataRow<GoodsOrder>[]>`
        SELECT data FROM public.goods_orders WHERE id=${id}`;
      return row?.data;
    },
    async ordersForSeller(sellerId) {
      return (
        await sql<DataRow<GoodsOrder>[]>`
        SELECT data FROM public.goods_orders WHERE seller_id=${sellerId} ORDER BY submitted_at, id
      `
      ).map((row) => row.data);
    },
    async ordersForBuyer(buyerAccountId) {
      return (
        await sql<DataRow<GoodsOrder>[]>`
        SELECT data FROM public.goods_orders WHERE buyer_account_id=${buyerAccountId} ORDER BY submitted_at, id
      `
      ).map((row) => row.data);
    },
    async findOrderByIdempotency(buyerAccountId, idempotencyKey) {
      const [row] = await sql<DataRow<GoodsOrder>[]>`
        SELECT data FROM public.goods_orders WHERE buyer_account_id=${buyerAccountId} AND idempotency_key=${idempotencyKey}`;
      return row?.data;
    },
    async saveOrder(order) {
      await sql`INSERT INTO public.goods_orders
        (id, offering_id, seller_id, buyer_account_id, idempotency_key, state, snapshot, data, submitted_at, updated_at)
        VALUES (${order.id}, ${order.offeringId}, ${order.sellerId}, ${order.buyerAccountId}, ${order.idempotencyKey},
          ${order.state}, ${JSON.stringify(order.snapshot)}::jsonb, ${JSON.stringify(order)}::jsonb,
          ${order.submittedAt}, ${order.updatedAt})
        ON CONFLICT (id) DO UPDATE SET state=excluded.state, data=excluded.data,
          updated_at=excluded.updated_at`;
    },
    async acceptance(orderId) {
      const [row] = await sql<DataRow<GoodsOrderAcceptance>[]>`
        SELECT data FROM public.goods_order_acceptances WHERE order_id=${orderId}`;
      return row?.data;
    },
    async saveAcceptance(acceptance) {
      await sql`INSERT INTO public.goods_order_acceptances
        (id, order_id, seller_id, data, occurred_at)
        VALUES (${acceptance.id}, ${acceptance.orderId}, ${acceptance.sellerId},
          ${JSON.stringify(acceptance)}::jsonb, ${acceptance.occurredAt})
        ON CONFLICT (order_id) DO NOTHING`;
    },
    async commitment(orderId) {
      const [row] = await sql<DataRow<GoodsCommitment>[]>`
        SELECT data FROM public.goods_commitments WHERE order_id=${orderId}`;
      return row?.data;
    },
    async saveCommitment(commitment) {
      await sql`INSERT INTO public.goods_commitments
        (id, order_id, seller_id, buyer_account_id, data, created_at)
        VALUES (${commitment.id}, ${commitment.orderId}, ${commitment.sellerId}, ${commitment.buyerAccountId},
          ${JSON.stringify(commitment)}::jsonb, ${commitment.createdAt})
        ON CONFLICT (order_id) DO NOTHING`;
    },
    async delivery(orderId) {
      const [row] = await sql<DataRow<GoodsDeliveryConfirmation>[]>`
        SELECT data FROM public.goods_deliveries WHERE order_id=${orderId}`;
      return row?.data;
    },
    async saveDelivery(delivery) {
      await sql`INSERT INTO public.goods_deliveries
        (id, order_id, seller_id, data, occurred_at)
        VALUES (${delivery.id}, ${delivery.orderId}, ${delivery.sellerId},
          ${JSON.stringify(delivery)}::jsonb, ${delivery.occurredAt})
        ON CONFLICT (order_id) DO NOTHING`;
    },
    async buyerReceipt(orderId) {
      const [row] = await sql<DataRow<GoodsBuyerReceiptConfirmation>[]>`
        SELECT data FROM public.goods_buyer_receipts WHERE order_id=${orderId}`;
      return row?.data;
    },
    async saveBuyerReceipt(receipt) {
      await sql`INSERT INTO public.goods_buyer_receipts
        (id, order_id, buyer_account_id, data, occurred_at)
        VALUES (${receipt.id}, ${receipt.orderId}, ${receipt.buyerAccountId},
          ${JSON.stringify(receipt)}::jsonb, ${receipt.occurredAt})
        ON CONFLICT (order_id) DO NOTHING`;
    },
    async sellerCancellationProposal(orderId) {
      const [row] = await sql<DataRow<GoodsSellerCancellationProposal>[]>`
        SELECT data FROM public.goods_cancellation_proposals WHERE order_id=${orderId}`;
      return row?.data;
    },
    async saveSellerCancellationProposal(proposal) {
      await sql`INSERT INTO public.goods_cancellation_proposals
        (id, order_id, seller_id, data, occurred_at)
        VALUES (${proposal.id}, ${proposal.orderId}, ${proposal.sellerId},
          ${JSON.stringify(proposal)}::jsonb, ${proposal.occurredAt})
        ON CONFLICT (order_id) DO NOTHING`;
    },
    async audit(record: GoodsAudit) {
      await sql`INSERT INTO public.goods_audits
        (id, target_type, target_id, action, before_state, after_state, reason,
          actor_id, actor_account_id, occurred_at, correlation_id)
        VALUES (${record.id}, ${record.targetType}, ${record.targetId}, ${record.action},
          ${JSON.stringify(record.beforeState)}::jsonb, ${JSON.stringify(record.afterState)}::jsonb,
          ${record.reason}, ${record.actorId}, ${record.actorAccountId ?? null},
          ${record.occurredAt}, ${record.correlationId})`;
    },
  };
}

export function createPostgresGoodsStore(sql: Sql): GoodsStore {
  return {
    async transact<Result>(
      work: (transaction: GoodsTransaction) => Promise<Result>,
    ): Promise<Result> {
      const result = await sql.begin('isolation level read committed', async (transaction) => {
        await transaction`SELECT pg_advisory_xact_lock(${goodsIntakeLock}::bigint)`;
        return { value: await work(transactionPort(transaction)) };
      });
      return result.value;
    },
  };
}
