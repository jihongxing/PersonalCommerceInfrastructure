import type { ActorContext } from '../core/actor-context.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type { CommerceActionRepository } from '../customer-request/customer-request-repositories.js';
import type { OfferingRepository } from '../service-offering/offering-repositories.js';
import type {
  PaidServiceOrder,
  WalletProjection,
  Withdrawal,
} from '../../modules/paid-commerce/money-domain.js';
import {
  BeginOrderPaymentUseCase,
  CompleteControlledWithdrawalUseCase,
  CreatePaidServiceOrderUseCase,
  FailControlledWithdrawalUseCase,
  FailControlledSettlementUseCase,
  ExpireControlledPaymentUseCase,
  GetCreatorWalletUseCase,
  GetPublicPaidServiceOrderStatusUseCase,
  ListCreatorPaidServiceOrdersUseCase,
  RecordControlledPaymentFactUseCase,
  RecordControlledPaymentFailureUseCase,
  RecordControlledRefundUseCase,
  RecordPaidServiceFulfillmentUseCase,
  RetryPaymentUseCase,
  PrepareControlledSettlementUseCase,
  ReleaseControlledSettlementUseCase,
  RequestCreatorWithdrawalUseCase,
  RetryWithdrawalUseCase,
  type CompleteControlledWithdrawalCommand,
  type CreatePaidServiceOrderCommand,
  type FailControlledWithdrawalCommand,
  type FailControlledSettlementCommand,
  type ExpireControlledPaymentCommand,
  type RecordControlledPaymentFactCommand,
  type RecordControlledPaymentFailureCommand,
  type RecordControlledRefundCommand,
  type RecordFulfillmentCommand,
  type RetryPaymentCommand,
  type PrepareControlledSettlementCommand,
  type ReleaseControlledSettlementCommand,
  type RequestWithdrawalCommand,
  type RetryWithdrawalCommand,
} from './paid-commerce-use-cases.js';
import type { PaidCommerceRepository } from './paid-commerce-repositories.js';
import type { ContractRepository } from '../contract-commerce/contract-repositories.js';

export interface PaidCommerceService {
  createOrder(
    command: CreatePaidServiceOrderCommand,
    context: ActorContext,
  ): Promise<PaidServiceOrder>;
  beginPayment(
    orderId: string,
    context: ActorContext,
  ): ReturnType<BeginOrderPaymentUseCase['execute']>;
  recordControlledPayment(
    command: RecordControlledPaymentFactCommand,
    context: ActorContext,
  ): ReturnType<RecordControlledPaymentFactUseCase['execute']>;
  recordControlledPaymentFailure(
    command: RecordControlledPaymentFailureCommand,
    context: ActorContext,
  ): ReturnType<RecordControlledPaymentFailureUseCase['execute']>;
  retryPayment(
    command: RetryPaymentCommand,
    context: ActorContext,
  ): ReturnType<RetryPaymentUseCase['execute']>;
  expireControlledPayment(
    command: ExpireControlledPaymentCommand,
    context: ActorContext,
  ): ReturnType<ExpireControlledPaymentUseCase['execute']>;
  recordControlledRefund(
    command: RecordControlledRefundCommand,
    context: ActorContext,
  ): ReturnType<RecordControlledRefundUseCase['execute']>;
  recordFulfillment(
    command: RecordFulfillmentCommand,
    context: ActorContext,
  ): ReturnType<RecordPaidServiceFulfillmentUseCase['execute']>;
  releaseControlledSettlement(
    command: ReleaseControlledSettlementCommand,
    context: ActorContext,
  ): ReturnType<ReleaseControlledSettlementUseCase['execute']>;
  prepareControlledSettlement(
    command: PrepareControlledSettlementCommand,
    context: ActorContext,
  ): ReturnType<PrepareControlledSettlementUseCase['execute']>;
  failControlledSettlement(
    command: FailControlledSettlementCommand,
    context: ActorContext,
  ): ReturnType<FailControlledSettlementUseCase['execute']>;
  getCreatorWallet(context: ActorContext): Promise<WalletProjection>;
  listCreatorOrders(context: ActorContext): Promise<readonly PaidServiceOrder[]>;
  getPublicOrderStatus(
    resultAccessToken: string,
  ): ReturnType<GetPublicPaidServiceOrderStatusUseCase['execute']>;
  requestWithdrawal(command: RequestWithdrawalCommand, context: ActorContext): Promise<Withdrawal>;
  retryWithdrawal(
    command: RetryWithdrawalCommand,
    context: ActorContext,
  ): ReturnType<RetryWithdrawalUseCase['execute']>;
  completeControlledWithdrawal(
    command: CompleteControlledWithdrawalCommand,
    context: ActorContext,
  ): ReturnType<CompleteControlledWithdrawalUseCase['execute']>;
  failControlledWithdrawal(
    command: FailControlledWithdrawalCommand,
    context: ActorContext,
  ): ReturnType<FailControlledWithdrawalUseCase['execute']>;
}

export function createPaidCommerceService(dependencies: {
  readonly commerceActionRepository: CommerceActionRepository;
  readonly offeringRepository: OfferingRepository;
  readonly paidCommerceRepository: PaidCommerceRepository;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
  readonly canonicalEventRecorder: CanonicalEventRecorder;
  readonly unitOfWork: UnitOfWork;
  readonly contractRepository?: ContractRepository;
}): PaidCommerceService {
  const createOrder = new CreatePaidServiceOrderUseCase(dependencies);
  const beginPayment = new BeginOrderPaymentUseCase(dependencies);
  const recordControlledPayment = new RecordControlledPaymentFactUseCase(dependencies);
  const recordControlledPaymentFailure = new RecordControlledPaymentFailureUseCase(dependencies);
  const retryPayment = new RetryPaymentUseCase(dependencies);
  const expireControlledPayment = new ExpireControlledPaymentUseCase(dependencies);
  const recordControlledRefund = new RecordControlledRefundUseCase(dependencies);
  const recordFulfillment = new RecordPaidServiceFulfillmentUseCase(dependencies);
  const releaseControlledSettlement = new ReleaseControlledSettlementUseCase(dependencies);
  const prepareControlledSettlement = new PrepareControlledSettlementUseCase(dependencies);
  const failControlledSettlement = new FailControlledSettlementUseCase(dependencies);
  const getCreatorWallet = new GetCreatorWalletUseCase(dependencies);
  const listCreatorOrders = new ListCreatorPaidServiceOrdersUseCase(dependencies);
  const getPublicOrderStatus = new GetPublicPaidServiceOrderStatusUseCase(dependencies);
  const requestWithdrawal = new RequestCreatorWithdrawalUseCase(dependencies);
  const retryWithdrawal = new RetryWithdrawalUseCase(dependencies);
  const completeControlledWithdrawal = new CompleteControlledWithdrawalUseCase(dependencies);
  const failControlledWithdrawal = new FailControlledWithdrawalUseCase(dependencies);

  return {
    createOrder: (command, context) => createOrder.execute(command, context),
    beginPayment: (orderId, context) => beginPayment.execute(orderId, context),
    recordControlledPayment: (command, context) =>
      recordControlledPayment.execute(command, context),
    recordControlledPaymentFailure: (command, context) =>
      recordControlledPaymentFailure.execute(command, context),
    retryPayment: (command, context) => retryPayment.execute(command, context),
    expireControlledPayment: (command, context) =>
      expireControlledPayment.execute(command, context),
    recordControlledRefund: (command, context) => recordControlledRefund.execute(command, context),
    recordFulfillment: (command, context) => recordFulfillment.execute(command, context),
    releaseControlledSettlement: (command, context) =>
      releaseControlledSettlement.execute(command, context),
    prepareControlledSettlement: (command, context) =>
      prepareControlledSettlement.execute(command, context),
    failControlledSettlement: (command, context) =>
      failControlledSettlement.execute(command, context),
    getCreatorWallet: (context) => getCreatorWallet.execute(context),
    listCreatorOrders: (context) => listCreatorOrders.execute(context),
    getPublicOrderStatus: (resultAccessToken) => getPublicOrderStatus.execute(resultAccessToken),
    requestWithdrawal: (command, context) => requestWithdrawal.execute(command, context),
    retryWithdrawal: (command, context) => retryWithdrawal.execute(command, context),
    completeControlledWithdrawal: (command, context) =>
      completeControlledWithdrawal.execute(command, context),
    failControlledWithdrawal: (command, context) =>
      failControlledWithdrawal.execute(command, context),
  };
}
