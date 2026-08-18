import type { ActorContext } from '../core/actor-context.js';
import type { PaidCommerceService } from './paid-commerce-service.js';
import type {
  ProviderFactApplicationPolicy,
  ProcessedProviderFact,
} from './provider-fact-application-policy.js';
import type {
  LocalCommerceSimulationEvent,
  LocalCommerceSimulationPort,
  LocalCommerceSimulationScenario,
} from './local-commerce-simulation-port.js';
import type { ProviderOperation, ProviderOperationRequest } from './provider-ports.js';

export interface SimulationFeeProfile {
  readonly classification: 'simulation_configuration';
  readonly version: string;
  readonly providerFeeMinor: bigint;
  readonly platformFeeMinor: bigint;
  readonly deductionsMinor: bigint;
}

export interface LocalCommerceSimulationService {
  configureScenario(
    scenario: Partial<LocalCommerceSimulationScenario>,
    context: ActorContext,
  ): LocalCommerceSimulationScenario;
  getScenario(context: ActorContext): LocalCommerceSimulationScenario;
  createPayment(
    request: ProviderOperationRequest,
    context: ActorContext,
  ): Promise<SimulationRunResult>;
  createSettlement(
    request: ProviderOperationRequest,
    feeProfile: SimulationFeeProfile,
    context: ActorContext,
  ): Promise<SimulationRunResult>;
  createWithdrawal(
    request: ProviderOperationRequest,
    context: ActorContext,
  ): Promise<SimulationRunResult>;
  advance(providerReference: string, context: ActorContext): Promise<SimulationRunResult>;
  refund(
    input: {
      readonly providerReference: string;
      readonly internalReference: string;
      readonly amountMinor: bigint;
      readonly currency: 'CNY';
    },
    context: ActorContext,
  ): Promise<SimulationRunResult>;
}

export interface SimulationRunResult {
  readonly origin: 'simulation';
  readonly providerId: 'local_commerce_simulator';
  readonly scenario: LocalCommerceSimulationScenario;
  readonly feeProfile?: SimulationFeeProfile;
  readonly operation?: ProviderOperation;
  readonly events: readonly LocalCommerceSimulationEvent[];
  readonly processed: readonly ProcessedProviderFact[];
}

export function createLocalCommerceSimulationService(dependencies: {
  readonly simulator: LocalCommerceSimulationPort;
  readonly applicationPolicy: ProviderFactApplicationPolicy;
  readonly paidCommerceService: PaidCommerceService;
}): LocalCommerceSimulationService {
  const pendingSettlementFeeProfiles = new Map<string, SimulationFeeProfile>();

  return {
    configureScenario: (scenario, context) => {
      assertOperations(context);
      dependencies.simulator.configureScenario(scenario);
      return dependencies.simulator.getScenario();
    },
    getScenario: (context) => {
      assertOperations(context);
      return dependencies.simulator.getScenario();
    },
    createPayment: async (request, context) => {
      assertOperations(context);
      const operation = await dependencies.simulator.createPaymentIntent(request);
      return processEvents(dependencies, context, operation);
    },
    createSettlement: async (request, feeProfile, context) => {
      assertOperations(context);
      assertFeeProfile(feeProfile);
      await dependencies.paidCommerceService.prepareControlledSettlement(
        {
          orderId: request.internalReference,
          providerFeeMinor: feeProfile.providerFeeMinor,
          platformFeeMinor: feeProfile.platformFeeMinor,
          deductionsMinor: feeProfile.deductionsMinor,
          calculationVersion: feeProfile.version,
        },
        context,
      );
      const operation = await dependencies.simulator.createSettlement(request);
      pendingSettlementFeeProfiles.set(operation.providerReference, feeProfile);
      if (
        operation.status === 'failed' &&
        dependencies.simulator.getScenario().settlement === 'failed'
      ) {
        await dependencies.paidCommerceService.failControlledSettlement(
          {
            orderId: request.internalReference,
            controlledEvidenceReference: `simulation:${operation.providerReference}:failed`,
          },
          context,
        );
      }
      return processEvents(dependencies, context, operation, feeProfile);
    },
    createWithdrawal: async (request, context) => {
      assertOperations(context);
      const operation = await dependencies.simulator.createWithdrawalIntent(request);
      return processEvents(dependencies, context, operation);
    },
    advance: async (providerReference, context) => {
      assertOperations(context);
      dependencies.simulator.advance(providerReference);
      const feeProfile = pendingSettlementFeeProfiles.get(providerReference);
      const result = await processEvents(dependencies, context, undefined, feeProfile);
      pendingSettlementFeeProfiles.delete(providerReference);
      return result;
    },
    refund: async (input, context) => {
      assertOperations(context);
      dependencies.simulator.recordRefundSucceeded(input);
      return processEvents(dependencies, context);
    },
  };
}

async function processEvents(
  dependencies: {
    readonly simulator: LocalCommerceSimulationPort;
    readonly applicationPolicy: ProviderFactApplicationPolicy;
  },
  context: ActorContext,
  operation?: ProviderOperation,
  feeProfile?: SimulationFeeProfile,
): Promise<SimulationRunResult> {
  const events = dependencies.simulator.takeEvents();
  const processed: ProcessedProviderFact[] = [];
  for (const event of events) {
    const factResult =
      event.resourceType === 'payment'
        ? await dependencies.simulator.verifyPaymentFact({ providerEventId: event.providerEventId })
        : event.resourceType === 'settlement'
          ? await dependencies.simulator.verifySettlementFact({
              providerEventId: event.providerEventId,
            })
          : await dependencies.simulator.verifyWithdrawalFact({
              providerEventId: event.providerEventId,
            });
    if (factResult.verification !== 'verified') {
      continue;
    }
    processed.push(
      await dependencies.applicationPolicy.process(
        {
          fact: factResult,
          ...(feeProfile === undefined || event.resourceType !== 'settlement'
            ? {}
            : {
                settlement: {
                  providerFeeMinor: feeProfile.providerFeeMinor,
                  platformFeeMinor: feeProfile.platformFeeMinor,
                  deductionsMinor: feeProfile.deductionsMinor,
                  calculationVersion: feeProfile.version,
                },
              }),
        },
        context,
      ),
    );
  }
  return {
    origin: 'simulation',
    providerId: 'local_commerce_simulator',
    scenario: dependencies.simulator.getScenario(),
    ...(feeProfile === undefined ? {} : { feeProfile }),
    ...(operation === undefined ? {} : { operation }),
    events,
    processed,
  };
}

function assertOperations(context: ActorContext): void {
  if (context.actor.kind !== 'pilot_operations') {
    throw new Error('Local Commerce Simulation requires authorized Operations.');
  }
}

function assertFeeProfile(profile: SimulationFeeProfile): void {
  if (
    profile.classification !== 'simulation_configuration' ||
    profile.version.trim().length === 0 ||
    profile.providerFeeMinor < 0n ||
    profile.platformFeeMinor < 0n ||
    profile.deductionsMinor < 0n
  ) {
    throw new Error('Simulation fee profile is invalid.');
  }
}
