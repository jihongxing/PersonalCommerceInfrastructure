import type { CommerceIdentityRepository } from '../creator-identity/creator-identity-repositories.js';
import { ApplicationError } from '../core/application-error.js';
import type { ActorContext } from '../core/actor-context.js';
import type {
  CommerceActionRepository,
  CustomerRepository,
} from '../customer-request/customer-request-repositories.js';
import type {
  Fulfillment,
  PaidServiceOrder,
  Payment,
  Settlement,
  WalletProjection,
  Withdrawal,
} from '../../modules/paid-commerce/money-domain.js';
import type {
  PaymentSimulationScenario,
  RefundSimulationScenario,
  SettlementSimulationScenario,
  WithdrawalSimulationScenario,
} from './local-commerce-simulation-port.js';
import type {
  LocalCommerceSimulationService,
  SimulationFeeProfile,
  SimulationRunResult,
} from './local-commerce-simulation-service.js';
import type { PaidCommerceRepository } from './paid-commerce-repositories.js';
import type { PaidCommerceService } from './paid-commerce-service.js';
import type { ReservationRepository } from '../reservation/reservation-repositories.js';
import type { ContractRepository } from '../contract-commerce/contract-repositories.js';

export interface LocalPaidCommerceCheckout {
  readonly origin: 'simulation';
  readonly providerId: 'local_commerce_simulator';
  readonly order: PaidServiceOrder;
  readonly creatorDisplayName: string;
  readonly payment?: Payment;
}

export interface CreatorLocalCommerceOrder {
  readonly order: PaidServiceOrder;
  readonly customerName: string;
  readonly payment?: Payment;
  readonly fulfillment?: Fulfillment;
  readonly settlement?: Settlement;
  readonly earningsState:
    'not_started' | 'pending' | 'available' | 'pending_resolution' | 'refunded';
}

export interface CreatorLocalCommerceWorkspace {
  readonly origin: 'simulation';
  readonly providerId: 'local_commerce_simulator';
  readonly orders: readonly CreatorLocalCommerceOrder[];
  readonly wallet: WalletProjection;
  readonly withdrawals: readonly Withdrawal[];
}

export interface LocalPaidCommerceProductService {
  getCheckout(resultAccessToken: string): Promise<LocalPaidCommerceCheckout>;
  simulatePayment(
    resultAccessToken: string,
    scenario: PaymentSimulationScenario,
  ): Promise<SimulationRunResult>;
  advancePayment(
    resultAccessToken: string,
    providerReference: string,
  ): Promise<SimulationRunResult>;
  getCreatorWorkspace(context: ActorContext): Promise<CreatorLocalCommerceWorkspace>;
  simulateSettlement(
    orderId: string,
    scenario: SettlementSimulationScenario,
    context: ActorContext,
  ): Promise<SimulationRunResult>;
  advanceSettlement(
    orderId: string,
    providerReference: string,
    context: ActorContext,
  ): Promise<SimulationRunResult>;
  simulateWithdrawal(
    withdrawalId: string,
    scenario: WithdrawalSimulationScenario,
    context: ActorContext,
  ): Promise<SimulationRunResult>;
  advanceWithdrawal(
    withdrawalId: string,
    providerReference: string,
    context: ActorContext,
  ): Promise<SimulationRunResult>;
  simulateRefund(
    orderId: string,
    scenario: RefundSimulationScenario,
    context: ActorContext,
  ): Promise<SimulationRunResult>;
}

type SimulationResource = 'payment' | 'settlement' | 'withdrawal';

interface BoundOperation {
  readonly resource: SimulationResource;
  readonly internalReference: string;
}

const simulationFeeProfile: SimulationFeeProfile = Object.freeze({
  classification: 'simulation_configuration',
  version: 'simulation-cny-v1',
  providerFeeMinor: 240n,
  platformFeeMinor: 3990n,
  deductionsMinor: 0n,
});

export function createLocalPaidCommerceProductService(dependencies: {
  readonly commerceIdentityRepository: CommerceIdentityRepository;
  readonly commerceActionRepository: CommerceActionRepository;
  readonly customerRepository: CustomerRepository;
  readonly paidCommerceRepository: PaidCommerceRepository;
  readonly paidCommerceService: PaidCommerceService;
  readonly simulationService: LocalCommerceSimulationService;
  readonly reservationRepository?: ReservationRepository;
  readonly contractRepository?: ContractRepository;
}): LocalPaidCommerceProductService {
  const boundOperations = new Map<string, BoundOperation>();
  let exclusive: Promise<void> = Promise.resolve();

  const runExclusive = async <Result>(work: () => Promise<Result>): Promise<Result> => {
    const previous = exclusive;
    let release = (): void => undefined;
    exclusive = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await work();
    } finally {
      release();
    }
  };

  const operationsContext = (correlationId: string): ActorContext => ({
    actor: { kind: 'pilot_operations', operatorId: 'local-paid-commerce-product' },
    correlationId,
  });

  const bindOperation = (
    result: SimulationRunResult,
    resource: SimulationResource,
    internalReference: string,
  ): void => {
    if (result.operation !== undefined) {
      boundOperations.set(result.operation.providerReference, { resource, internalReference });
    }
  };

  const requireBoundOperation = (
    providerReference: string,
    resource: SimulationResource,
    internalReference: string,
  ): void => {
    const binding = boundOperations.get(providerReference);
    if (
      binding === undefined ||
      binding.resource !== resource ||
      binding.internalReference !== internalReference
    ) {
      throw new ApplicationError({
        category: 'authorization',
        code: 'simulation_operation_scope_mismatch',
        message: 'Simulation operation does not belong to this commercial resource.',
      });
    }
  };

  const requireCheckout = async (resultAccessToken: string) => {
    const action =
      await dependencies.commerceActionRepository.findByResultAccessToken(resultAccessToken);
    if (action !== undefined && action.state === 'confirmed') {
      const order = await dependencies.paidCommerceRepository.findOrderByCommerceActionId(
        action.id,
      );
      if (order === undefined) {
        throw notFound('paid_order_not_found', 'Paid Service Order was not found.');
      }
      const identity = await dependencies.commerceIdentityRepository.findById(order.creatorId);
      if (identity === undefined) {
        throw notFound('creator_identity_not_found', 'Creator Commerce Identity was not found.');
      }
      const payment = await dependencies.paidCommerceRepository.findPaymentByOrderId(order.id);
      return { order, identity, payment };
    }
    const reservation =
      await dependencies.reservationRepository?.findReservationByResultAccessToken(
        resultAccessToken,
      );
    if (reservation !== undefined && reservation.state === 'confirmed') {
      const order = await dependencies.paidCommerceRepository.findOrderByReservationId(
        reservation.id,
      );
      if (order === undefined) {
        throw notFound('paid_order_not_found', 'Paid Service Order was not found.');
      }
      const identity = await dependencies.commerceIdentityRepository.findById(order.creatorId);
      if (identity === undefined) {
        throw notFound('creator_identity_not_found', 'Creator Commerce Identity was not found.');
      }
      const payment = await dependencies.paidCommerceRepository.findPaymentByOrderId(order.id);
      return { order, identity, payment };
    }

    const contract =
      await dependencies.contractRepository?.findByResultAccessToken(resultAccessToken);
    if (contract === undefined || contract.state !== 'contracted') {
      throw notFound(
        'confirmed_commerce_source_not_found',
        'Confirmed Request, Reservation or Contract was not found.',
      );
    }
    const order = await dependencies.paidCommerceRepository.findOrderByContractId(contract.id);
    if (order === undefined) {
      throw notFound('paid_order_not_found', 'Paid Service Order was not found.');
    }
    const identity = await dependencies.commerceIdentityRepository.findById(order.creatorId);
    if (identity === undefined) {
      throw notFound('creator_identity_not_found', 'Creator Commerce Identity was not found.');
    }
    const payment = await dependencies.paidCommerceRepository.findPaymentByOrderId(order.id);
    return { order, identity, payment };
  };

  const requireCreatorOrder = async (orderId: string, context: ActorContext) => {
    if (context.actor.kind !== 'creator') {
      throw forbidden('creator_required', 'Creator authentication is required.');
    }
    const order = await dependencies.paidCommerceRepository.findOrderById(orderId);
    if (order === undefined) {
      throw notFound('paid_order_not_found', 'Paid Service Order was not found.');
    }
    if (order.creatorId !== context.actor.creatorId) {
      throw forbidden('paid_order_not_owned', 'Paid Service Order belongs to another Creator.');
    }
    return order;
  };

  return {
    getCheckout: async (resultAccessToken) => {
      const { order, identity, payment } = await requireCheckout(resultAccessToken);
      return {
        origin: 'simulation',
        providerId: 'local_commerce_simulator',
        order,
        creatorDisplayName: identity.profile.displayName,
        ...(payment === undefined ? {} : { payment }),
      };
    },
    simulatePayment: (resultAccessToken, scenario) =>
      runExclusive(async () => {
        const { order, payment } = await requireCheckout(resultAccessToken);
        const context = operationsContext(`local-payment:${order.id}:${Date.now()}`);
        if (payment === undefined) {
          await dependencies.paidCommerceService.beginPayment(order.id, {
            actor: { kind: 'customer', customerId: order.customerId },
            correlationId: context.correlationId,
          });
        } else if (payment.state === 'failed' || payment.state === 'expired') {
          await dependencies.paidCommerceService.retryPayment(
            { orderId: order.id },
            {
              actor: { kind: 'customer', customerId: order.customerId },
              correlationId: context.correlationId,
            },
          );
        } else if (payment.state !== 'pending') {
          throw conflict('payment_not_retryable', 'Payment is not available for another attempt.');
        }
        dependencies.simulationService.configureScenario({ payment: scenario }, context);
        const result = await dependencies.simulationService.createPayment(
          {
            internalReference: order.id,
            amountMinor: order.snapshot.grossPrice.minor,
            currency: order.snapshot.grossPrice.currency,
            idempotencyKey: `product-payment-${order.id}-${context.correlationId}`,
          },
          context,
        );
        bindOperation(result, 'payment', order.id);
        if (scenario === 'expired') {
          await dependencies.paidCommerceService.expireControlledPayment(
            { orderId: order.id },
            context,
          );
        }
        return result;
      }),
    advancePayment: (resultAccessToken, providerReference) =>
      runExclusive(async () => {
        const { order } = await requireCheckout(resultAccessToken);
        requireBoundOperation(providerReference, 'payment', order.id);
        return dependencies.simulationService.advance(
          providerReference,
          operationsContext(`local-payment-advance:${order.id}:${Date.now()}`),
        );
      }),
    getCreatorWorkspace: async (context) => {
      if (context.actor.kind !== 'creator') {
        throw forbidden('creator_required', 'Creator authentication is required.');
      }
      const orders = await dependencies.paidCommerceRepository.findOrdersByCreatorId(
        context.actor.creatorId,
      );
      const workspaceOrders = await Promise.all(
        orders.map(async (order): Promise<CreatorLocalCommerceOrder> => {
          const customer = await dependencies.customerRepository.findById(order.customerId);
          const payment = await dependencies.paidCommerceRepository.findPaymentByOrderId(order.id);
          const fulfillment = await dependencies.paidCommerceRepository.findFulfillmentByOrderId(
            order.id,
          );
          const settlement = await dependencies.paidCommerceRepository.findSettlementByOrderId(
            order.id,
          );
          return {
            order,
            customerName: customer?.contactName ?? 'Customer',
            ...(payment === undefined ? {} : { payment }),
            ...(fulfillment === undefined ? {} : { fulfillment }),
            ...(settlement === undefined ? {} : { settlement }),
            earningsState: earningsState(order, settlement),
          };
        }),
      );
      return {
        origin: 'simulation',
        providerId: 'local_commerce_simulator',
        orders: workspaceOrders,
        wallet: await dependencies.paidCommerceService.getCreatorWallet(context),
        withdrawals: await dependencies.paidCommerceRepository.findWithdrawalsByCreatorId(
          context.actor.creatorId,
        ),
      };
    },
    simulateSettlement: (orderId, scenario, context) =>
      runExclusive(async () => {
        const order = await requireCreatorOrder(orderId, context);
        const operations = operationsContext(`local-settlement:${order.id}:${Date.now()}`);
        dependencies.simulationService.configureScenario({ settlement: scenario }, operations);
        const result = await dependencies.simulationService.createSettlement(
          {
            internalReference: order.id,
            amountMinor:
              order.snapshot.grossPrice.minor -
              simulationFeeProfile.providerFeeMinor -
              simulationFeeProfile.platformFeeMinor -
              simulationFeeProfile.deductionsMinor,
            currency: order.snapshot.grossPrice.currency,
            idempotencyKey: `product-settlement-${order.id}-${operations.correlationId}`,
          },
          simulationFeeProfile,
          operations,
        );
        bindOperation(result, 'settlement', order.id);
        return result;
      }),
    advanceSettlement: (orderId, providerReference, context) =>
      runExclusive(async () => {
        const order = await requireCreatorOrder(orderId, context);
        requireBoundOperation(providerReference, 'settlement', order.id);
        return dependencies.simulationService.advance(
          providerReference,
          operationsContext(`local-settlement-advance:${order.id}:${Date.now()}`),
        );
      }),
    simulateWithdrawal: (withdrawalId, scenario, context) =>
      runExclusive(async () => {
        if (context.actor.kind !== 'creator') {
          throw forbidden('creator_required', 'Creator authentication is required.');
        }
        let withdrawal = await dependencies.paidCommerceRepository.findWithdrawalById(withdrawalId);
        if (withdrawal === undefined) {
          throw notFound('withdrawal_not_found', 'Withdrawal was not found.');
        }
        if (withdrawal.creatorId !== context.actor.creatorId) {
          throw forbidden('withdrawal_not_owned', 'Withdrawal belongs to another Creator.');
        }
        if (withdrawal.state === 'failed') {
          withdrawal = await dependencies.paidCommerceService.retryWithdrawal(
            { withdrawalId },
            context,
          );
        } else if (withdrawal.state !== 'requested') {
          throw conflict('withdrawal_not_retryable', 'Withdrawal is not available for simulation.');
        }
        const operations = operationsContext(`local-withdrawal:${withdrawal.id}:${Date.now()}`);
        dependencies.simulationService.configureScenario({ withdrawal: scenario }, operations);
        const result = await dependencies.simulationService.createWithdrawal(
          {
            internalReference: withdrawal.id,
            amountMinor: withdrawal.amount.minor,
            currency: withdrawal.amount.currency,
            idempotencyKey: `product-withdrawal-${withdrawal.id}-${operations.correlationId}`,
          },
          operations,
        );
        bindOperation(result, 'withdrawal', withdrawal.id);
        return result;
      }),
    advanceWithdrawal: (withdrawalId, providerReference, context) =>
      runExclusive(async () => {
        if (context.actor.kind !== 'creator') {
          throw forbidden('creator_required', 'Creator authentication is required.');
        }
        const withdrawal =
          await dependencies.paidCommerceRepository.findWithdrawalById(withdrawalId);
        if (withdrawal === undefined) {
          throw notFound('withdrawal_not_found', 'Withdrawal was not found.');
        }
        if (withdrawal.creatorId !== context.actor.creatorId) {
          throw forbidden('withdrawal_not_owned', 'Withdrawal belongs to another Creator.');
        }
        requireBoundOperation(providerReference, 'withdrawal', withdrawal.id);
        return dependencies.simulationService.advance(
          providerReference,
          operationsContext(`local-withdrawal-advance:${withdrawal.id}:${Date.now()}`),
        );
      }),
    simulateRefund: (orderId, scenario, context) =>
      runExclusive(async () => {
        const order = await requireCreatorOrder(orderId, context);
        const payment = await dependencies.paidCommerceRepository.findPaymentByOrderId(order.id);
        if (payment === undefined || payment.providerReference === undefined) {
          throw conflict('confirmed_payment_required', 'Refund requires a confirmed Payment.');
        }
        const operations = operationsContext(`local-refund:${order.id}:${Date.now()}`);
        dependencies.simulationService.configureScenario({ refund: scenario }, operations);
        return dependencies.simulationService.refund(
          {
            providerReference: `${payment.providerReference}:refund`,
            internalReference: order.id,
            amountMinor: payment.amount.minor,
            currency: payment.amount.currency,
          },
          operations,
        );
      }),
  };
}

function earningsState(
  order: PaidServiceOrder,
  settlement: Settlement | undefined,
): CreatorLocalCommerceOrder['earningsState'] {
  if (order.state === 'refunded') {
    return 'refunded';
  }
  if (order.state === 'pending_resolution' || settlement?.state === 'failed') {
    return 'pending_resolution';
  }
  if (settlement?.state === 'released' || settlement?.state === 'resolved') {
    return 'available';
  }
  if (settlement?.state === 'pending') {
    return 'pending';
  }
  return 'not_started';
}

function notFound(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'not_found', code, message });
}

function forbidden(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'authorization', code, message });
}

function conflict(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'conflict', code, message });
}
