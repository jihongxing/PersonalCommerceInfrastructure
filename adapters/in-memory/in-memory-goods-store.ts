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
} from '../../applications/goods/goods-service.js';

export function createInMemoryGoodsStore(
  now = () => new Date().toISOString(),
  intakeOpen?: () => Promise<boolean>,
) {
  const offerings = new Map<string, GoodsOffering>();
  const orders = new Map<string, GoodsOrder>();
  const acceptances = new Map<string, GoodsOrderAcceptance>();
  const commitments = new Map<string, GoodsCommitment>();
  const deliveries = new Map<string, GoodsDeliveryConfirmation>();
  const buyerReceipts = new Map<string, GoodsBuyerReceiptConfirmation>();
  const cancellationProposals = new Map<string, GoodsSellerCancellationProposal>();
  const audits: GoodsAudit[] = [];
  let intake = false;

  const transaction: GoodsTransaction = {
    now: () => Promise.resolve(now()),
    intakeOpen: () => (intakeOpen === undefined ? Promise.resolve(intake) : intakeOpen()),
    offering: (id) => Promise.resolve(offerings.get(id)),
    offeringsForSeller: (sellerId) =>
      Promise.resolve([...offerings.values()].filter((item) => item.sellerId === sellerId)),
    saveOffering: (offering) => {
      offerings.set(offering.id, offering);
      return Promise.resolve();
    },
    publicOffering: (id) => {
      const offering = offerings.get(id);
      return Promise.resolve(offering?.state === 'published' ? offering : undefined);
    },
    order: (id) => Promise.resolve(orders.get(id)),
    ordersForSeller: (sellerId) =>
      Promise.resolve([...orders.values()].filter((item) => item.sellerId === sellerId)),
    ordersForBuyer: (buyerAccountId) =>
      Promise.resolve(
        [...orders.values()].filter((item) => item.buyerAccountId === buyerAccountId),
      ),
    findOrderByIdempotency: (buyerAccountId, idempotencyKey) =>
      Promise.resolve(
        [...orders.values()].find(
          (item) =>
            item.buyerAccountId === buyerAccountId && item.idempotencyKey === idempotencyKey,
        ),
      ),
    saveOrder: (order) => {
      orders.set(order.id, order);
      return Promise.resolve();
    },
    acceptance: (orderId) => Promise.resolve(acceptances.get(orderId)),
    saveAcceptance: (acceptance) => {
      acceptances.set(acceptance.orderId, acceptance);
      return Promise.resolve();
    },
    commitment: (orderId) => Promise.resolve(commitments.get(orderId)),
    saveCommitment: (commitment) => {
      commitments.set(commitment.orderId, commitment);
      return Promise.resolve();
    },
    delivery: (orderId) => Promise.resolve(deliveries.get(orderId)),
    saveDelivery: (delivery) => {
      deliveries.set(delivery.orderId, delivery);
      return Promise.resolve();
    },
    buyerReceipt: (orderId) => Promise.resolve(buyerReceipts.get(orderId)),
    saveBuyerReceipt: (receipt) => {
      buyerReceipts.set(receipt.orderId, receipt);
      return Promise.resolve();
    },
    sellerCancellationProposal: (orderId) => Promise.resolve(cancellationProposals.get(orderId)),
    saveSellerCancellationProposal: (proposal) => {
      cancellationProposals.set(proposal.orderId, proposal);
      return Promise.resolve();
    },
    audit: (audit) => {
      audits.push(audit);
      return Promise.resolve();
    },
  };

  return {
    async transact<Result>(
      work: (transaction: GoodsTransaction) => Promise<Result>,
    ): Promise<Result> {
      return work(transaction);
    },
    setIntakeOpen(open: boolean) {
      intake = open;
    },
    audits,
  } satisfies GoodsStore & { setIntakeOpen(open: boolean): void; audits: GoodsAudit[] };
}
