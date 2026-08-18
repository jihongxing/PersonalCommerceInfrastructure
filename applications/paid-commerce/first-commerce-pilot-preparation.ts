import type { Currency, MoneyMinor } from '../../modules/paid-commerce/money-domain.js';
import { ApplicationError } from '../core/application-error.js';

export type PilotCommercePattern = 'request_commerce';
export type PilotFactOrigin = 'simulation' | 'provider';

export interface PilotBusinessConfiguration {
  readonly platformFeeMinor: MoneyMinor;
  readonly currency: Currency;
  readonly servicePriceMinor: MoneyMinor;
  readonly cancellationRule: string;
  readonly refundRule: string;
  readonly fulfillmentRule: string;
  readonly settlementRule: string;
  readonly withdrawalRule: string;
  readonly recoveryPolicy: string;
}

export interface PilotTransactionTemplate {
  readonly creatorId: string;
  readonly offeringId: string;
  readonly customerId: string;
  readonly currency: Currency;
  readonly priceMinor: MoneyMinor;
  readonly pattern: PilotCommercePattern;
  readonly flow: readonly [
    'request',
    'confirm',
    'order',
    'payment',
    'fulfillment',
    'settlement',
    'earnings',
    'wallet',
    'withdrawal',
  ];
}

export interface FounderActivationChecklist {
  readonly offeringConfirmed: boolean;
  readonly priceConfirmed: boolean;
  readonly platformFeeConfirmed: boolean;
  readonly cancellationRefundPolicyConfirmed: boolean;
  readonly creatorConfirmed: boolean;
  readonly creatorQualificationConfirmed: boolean;
  readonly creatorPayoutPathConfirmed: boolean;
  readonly customerConfirmed: boolean;
  readonly customerKnowsControlledPilot: boolean;
  readonly providerConfirmed: boolean;
  readonly accountMappingConfirmed: boolean;
  readonly paymentPathConfirmed: boolean;
  readonly settlementPathConfirmed: boolean;
  readonly withdrawalPathConfirmed: boolean;
  readonly liveGuardOff: boolean;
  readonly killSwitchVerified: boolean;
  readonly webhookVerified: boolean;
  readonly evidenceCaptureVerified: boolean;
  readonly monitoringAuditReady: boolean;
  readonly founderGo: boolean;
}

export interface PilotPreparationFacts {
  readonly providerReady: boolean;
  readonly simulationOnly: boolean;
  readonly realMoneyEnabled: boolean;
  readonly killSwitchActive: boolean;
  readonly evidenceCaptureReady: boolean;
  readonly orderPaymentSettlementLedgerWalletConsistent: boolean;
  readonly withdrawalCompletionEvidencePresent: boolean;
}

export interface FirstCommerceEvidencePackage {
  readonly pilotId: string;
  readonly creatorId: string;
  readonly customerId: string;
  readonly offeringId: string;
  readonly orderId: string;
  readonly paymentReference: string;
  readonly providerReference: string;
  readonly settlementReference: string;
  readonly grossAmountMinor: MoneyMinor;
  readonly providerFeeMinor?: MoneyMinor;
  readonly platformFeeMinor: MoneyMinor;
  readonly creatorNetMinor?: MoneyMinor;
  readonly ledgerEntryIds: readonly string[];
  readonly walletProjectionReference: string;
  readonly withdrawalReference: string;
  readonly fulfillmentEvidence: string;
  readonly auditReferences: readonly string[];
  readonly timestamps: Readonly<Record<string, string>>;
  readonly origin: PilotFactOrigin;
}

export class FirstCommercePilotPreparation {
  public validateConfiguration(configuration: PilotBusinessConfiguration): void {
    assertPositive(configuration.servicePriceMinor, 'servicePriceMinor');
    assertNonNegative(configuration.platformFeeMinor, 'platformFeeMinor');
    assertRequired(configuration.cancellationRule, 'cancellationRule');
    assertRequired(configuration.refundRule, 'refundRule');
    assertRequired(configuration.fulfillmentRule, 'fulfillmentRule');
    assertRequired(configuration.settlementRule, 'settlementRule');
    assertRequired(configuration.withdrawalRule, 'withdrawalRule');
    assertRequired(configuration.recoveryPolicy, 'recoveryPolicy');
    if (configuration.platformFeeMinor >= configuration.servicePriceMinor) {
      throw new ApplicationError({
        category: 'validation',
        code: 'pilot_platform_fee_exceeds_price',
        message: 'Pilot Platform Fee must be less than the configured Service Price.',
      });
    }
  }

  public validateTemplate(
    template: PilotTransactionTemplate,
    configuration: PilotBusinessConfiguration,
  ): void {
    this.validateConfiguration(configuration);
    assertRequired(template.creatorId, 'creatorId');
    assertRequired(template.offeringId, 'offeringId');
    assertRequired(template.customerId, 'customerId');
    if (template.currency !== configuration.currency) {
      throw new ApplicationError({
        category: 'validation',
        code: 'pilot_currency_mismatch',
        message: 'Pilot Transaction Template currency must match Business Configuration.',
      });
    }
    if (template.priceMinor !== configuration.servicePriceMinor) {
      throw new ApplicationError({
        category: 'validation',
        code: 'pilot_price_mismatch',
        message: 'Pilot Transaction Template price must match Business Configuration.',
      });
    }
    if (template.pattern !== 'request_commerce') {
      throw new ApplicationError({
        category: 'validation',
        code: 'pilot_pattern_not_allowed',
        message: 'The First Commerce Pilot allows Request Commerce only.',
      });
    }
    if (template.flow.join('>') !== PILOT_FLOW.join('>')) {
      throw new ApplicationError({
        category: 'validation',
        code: 'pilot_flow_mismatch',
        message: 'Pilot Transaction Template must use the frozen First Commerce flow.',
      });
    }
  }

  public evaluateFounderActivation(
    checklist: FounderActivationChecklist,
    facts: PilotPreparationFacts,
  ): { readonly founderActivationReady: boolean; readonly reasons: readonly string[] } {
    const reasons: string[] = [];
    if (!facts.simulationOnly && !facts.providerReady) reasons.push('provider_not_ready');
    if (facts.realMoneyEnabled) reasons.push('real_money_must_remain_disabled');
    if (!facts.killSwitchActive) reasons.push('kill_switch_not_active');
    if (!facts.evidenceCaptureReady) reasons.push('evidence_capture_not_ready');
    if (!facts.orderPaymentSettlementLedgerWalletConsistent) {
      reasons.push('commerce_facts_not_consistent');
    }
    if (!facts.withdrawalCompletionEvidencePresent) reasons.push('withdrawal_evidence_not_ready');
    for (const [key, value] of Object.entries(checklist)) {
      if (key !== 'founderGo' && value !== true) reasons.push(`${key}_incomplete`);
    }
    if (checklist.founderGo !== false && checklist.founderGo !== true) {
      reasons.push('founder_go_must_be_explicit');
    }
    return Object.freeze({
      founderActivationReady: reasons.length === 0 && checklist.founderGo === false,
      reasons: Object.freeze(reasons),
    });
  }

  public assertSimulationCannotCompleteRealCommerce(
    origin: PilotFactOrigin,
    realCommerceCompletion: boolean,
  ): void {
    if (origin === 'simulation' && realCommerceCompletion) {
      throw new ApplicationError({
        category: 'conflict',
        code: 'simulation_cannot_complete_real_commerce',
        message: 'Simulation facts cannot satisfy First Completed Paid Commerce.',
      });
    }
  }

  public assertProviderReadyForLive(
    facts: PilotPreparationFacts,
    checklist: FounderActivationChecklist,
  ): void {
    if (!facts.providerReady || !checklist.providerConfirmed) {
      throw new ApplicationError({
        category: 'unavailable',
        code: 'pilot_provider_not_ready',
        message: 'Live Pilot activation requires an externally verified Provider.',
      });
    }
  }

  public validateEvidencePackage(evidence: FirstCommerceEvidencePackage): void {
    assertRequired(evidence.pilotId, 'pilotId');
    assertRequired(evidence.creatorId, 'creatorId');
    assertRequired(evidence.customerId, 'customerId');
    assertRequired(evidence.offeringId, 'offeringId');
    assertRequired(evidence.orderId, 'orderId');
    assertRequired(evidence.fulfillmentEvidence, 'fulfillmentEvidence');
    if (evidence.origin === 'simulation') {
      if (
        evidence.providerReference ||
        evidence.settlementReference ||
        evidence.withdrawalReference
      ) {
        throw new ApplicationError({
          category: 'conflict',
          code: 'simulation_provider_reference_forbidden',
          message: 'Simulation evidence cannot use Provider references.',
        });
      }
    }
  }
}

export const PILOT_FLOW = Object.freeze([
  'request',
  'confirm',
  'order',
  'payment',
  'fulfillment',
  'settlement',
  'earnings',
  'wallet',
  'withdrawal',
] as const);

function assertRequired(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new ApplicationError({
      category: 'validation',
      code: 'pilot_required_field_missing',
      message: `Pilot field ${field} is required.`,
    });
  }
}

function assertPositive(value: MoneyMinor, field: string): void {
  if (value <= 0n) {
    throw new ApplicationError({
      category: 'validation',
      code: 'pilot_amount_must_be_positive',
      message: `Pilot ${field} must be positive.`,
    });
  }
}

function assertNonNegative(value: MoneyMinor, field: string): void {
  if (value < 0n) {
    throw new ApplicationError({
      category: 'validation',
      code: 'pilot_amount_must_not_be_negative',
      message: `Pilot ${field} must not be negative.`,
    });
  }
}
