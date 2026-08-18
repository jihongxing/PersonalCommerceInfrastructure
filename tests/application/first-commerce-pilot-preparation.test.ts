import { describe, expect, it } from 'vitest';

import {
  FirstCommercePilotPreparation,
  PILOT_FLOW,
  type FirstCommerceEvidencePackage,
  type FounderActivationChecklist,
  type PilotBusinessConfiguration,
  type PilotPreparationFacts,
  type PilotTransactionTemplate,
} from '../../applications/paid-commerce/first-commerce-pilot-preparation.js';

const preparation = new FirstCommercePilotPreparation();
const configuration: PilotBusinessConfiguration = {
  platformFeeMinor: 3990n,
  currency: 'CNY',
  servicePriceMinor: 39900n,
  cancellationRule: 'Founder-approved cancellation policy.',
  refundRule: 'DEC-013-B recovery policy applies after settlement.',
  fulfillmentRule: 'Creator completes the confirmed Request service.',
  settlementRule: 'Verified Settlement Fact required before Available Earnings.',
  withdrawalRule: 'Verified Withdrawal Fact required before Withdrawn.',
  recoveryPolicy: 'Recovery Obligation is projected and never overwrites history.',
};
const template: PilotTransactionTemplate = {
  creatorId: 'creator-1',
  offeringId: 'offering-1',
  customerId: 'customer-1',
  currency: 'CNY',
  priceMinor: 39900n,
  pattern: 'request_commerce',
  flow: PILOT_FLOW,
};
const completeChecklist: FounderActivationChecklist = {
  offeringConfirmed: true,
  priceConfirmed: true,
  platformFeeConfirmed: true,
  cancellationRefundPolicyConfirmed: true,
  creatorConfirmed: true,
  creatorQualificationConfirmed: true,
  creatorPayoutPathConfirmed: true,
  customerConfirmed: true,
  customerKnowsControlledPilot: true,
  providerConfirmed: true,
  accountMappingConfirmed: true,
  paymentPathConfirmed: true,
  settlementPathConfirmed: true,
  withdrawalPathConfirmed: true,
  liveGuardOff: true,
  killSwitchVerified: true,
  webhookVerified: true,
  evidenceCaptureVerified: true,
  monitoringAuditReady: true,
  founderGo: false,
};
const safeFacts: PilotPreparationFacts = {
  providerReady: false,
  simulationOnly: true,
  realMoneyEnabled: false,
  killSwitchActive: true,
  evidenceCaptureReady: true,
  orderPaymentSettlementLedgerWalletConsistent: true,
  withdrawalCompletionEvidencePresent: true,
};

describe('VS-02I First Commerce Pilot Preparation', () => {
  it('PILOT-01 validates the centralized Business Configuration', () => {
    expect(() => preparation.validateConfiguration(configuration)).not.toThrow();
  });

  it('PILOT-02 keeps Founder Activation Guard OFF by default', () => {
    const result = preparation.evaluateFounderActivation(completeChecklist, safeFacts);
    expect(result.founderActivationReady).toBe(true);
  });

  it('PILOT-03 rejects Founder readiness when Provider is not ready', () => {
    expect(() => preparation.assertProviderReadyForLive(safeFacts, completeChecklist)).toThrow(
      'externally verified Provider',
    );
  });

  it('PILOT-04 validates Creator, Offering, Currency and Price', () => {
    expect(() => preparation.validateTemplate(template, configuration)).not.toThrow();
    expect(() =>
      preparation.validateTemplate({ ...template, priceMinor: 40000n }, configuration),
    ).toThrow('price must match');
  });

  it('PILOT-05 enforces the configured Platform Fee calculation boundary', () => {
    expect(() =>
      preparation.validateConfiguration({ ...configuration, platformFeeMinor: 39900n }),
    ).toThrow('Platform Fee must be less');
  });

  it('PILOT-06 validates the First Commerce Evidence Package shape', () => {
    const evidence: FirstCommerceEvidencePackage = {
      pilotId: 'pilot-1',
      creatorId: template.creatorId,
      customerId: template.customerId,
      offeringId: template.offeringId,
      orderId: 'order-1',
      paymentReference: '',
      providerReference: '',
      settlementReference: '',
      grossAmountMinor: 39900n,
      platformFeeMinor: configuration.platformFeeMinor,
      ledgerEntryIds: [],
      walletProjectionReference: 'wallet-projection-1',
      withdrawalReference: '',
      fulfillmentEvidence: 'fulfillment-evidence-1',
      auditReferences: [],
      timestamps: {},
      origin: 'simulation',
    };
    expect(() => preparation.validateEvidencePackage(evidence)).not.toThrow();
    expect(() =>
      preparation.validateEvidencePackage({
        ...evidence,
        providerReference: 'fake-provider-reference',
      }),
    ).toThrow('Simulation evidence cannot use Provider references');
  });

  it('PILOT-07 preserves the Live kill switch as a hard stop', () => {
    expect(safeFacts.realMoneyEnabled).toBe(false);
    expect(safeFacts.killSwitchActive).toBe(true);
  });

  it('PILOT-08 prevents Simulation from satisfying Real Commerce Completion', () => {
    expect(() =>
      preparation.assertSimulationCannotCompleteRealCommerce('simulation', true),
    ).toThrow('cannot satisfy First Completed Paid Commerce');
  });

  it('PILOT-09 requires Order, Payment, Settlement, Ledger and Wallet consistency', () => {
    const result = preparation.evaluateFounderActivation(completeChecklist, safeFacts);
    expect(result.reasons).not.toContain('commerce_facts_not_consistent');
    expect(
      preparation.evaluateFounderActivation(completeChecklist, {
        ...safeFacts,
        orderPaymentSettlementLedgerWalletConsistent: false,
      }).founderActivationReady,
    ).toBe(false);
  });

  it('PILOT-10 requires Withdrawal Completion Evidence', () => {
    const result = preparation.evaluateFounderActivation(completeChecklist, {
      ...safeFacts,
      withdrawalCompletionEvidencePresent: false,
    });
    expect(result.founderActivationReady).toBe(false);
    expect(result.reasons).toContain('withdrawal_evidence_not_ready');
  });
});
