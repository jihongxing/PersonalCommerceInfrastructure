import { DomainTransitionError } from '../shared/domain-error.js';
import type { Currency } from '../paid-commerce/money-domain.js';

export type ContractState =
  'draft' | 'proposed' | 'accepted' | 'contracted' | 'rejected' | 'expired' | 'cancelled';

export interface ContractScope {
  readonly performanceType: string;
  readonly performanceDate: string;
  readonly location: string;
  readonly durationMinutes: number;
  readonly creatorHeadcount: number;
  readonly deliverables: string;
  readonly priceMinor: bigint;
  readonly currency: Currency;
  readonly cancellationTerms: string;
  readonly fulfillmentCriteria: string;
}

export interface ContractScopeVersion {
  readonly id: string;
  readonly contractId: string;
  readonly version: number;
  readonly scope: ContractScope;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface ContractAcceptanceFact {
  readonly id: string;
  readonly contractId: string;
  readonly scopeVersionId: string;
  readonly actorId: string;
  readonly actorKind: 'creator' | 'buyer';
  readonly acceptedAt: string;
}

export interface Contract {
  readonly id: string;
  readonly commerceActionId: string;
  readonly creatorId: string;
  readonly buyerId: string;
  readonly offeringId: string;
  readonly resultAccessToken: string;
  readonly state: ContractState;
  readonly currentScopeVersionId?: string;
  readonly proposedAt?: string;
  readonly proposalExpiresAt?: string;
  readonly acceptedAt?: string;
  readonly acceptedBy?: string;
  readonly contractedAt?: string;
  readonly orderId?: string;
  readonly rejectedAt?: string;
  readonly cancelledAt?: string;
  readonly cancelledBy?: 'creator' | 'buyer';
}

export function createContract(input: {
  readonly id: string;
  readonly commerceActionId: string;
  readonly creatorId: string;
  readonly buyerId: string;
  readonly offeringId: string;
  readonly resultAccessToken: string;
}): Contract {
  Object.entries(input).forEach(([label, value]) => requireText(value, label));
  return Object.freeze({ ...input, state: 'draft' });
}

export function createContractScopeVersion(input: {
  readonly id: string;
  readonly contractId: string;
  readonly version: number;
  readonly scope: ContractScope;
  readonly createdAt: string;
  readonly createdBy: string;
}): ContractScopeVersion {
  requireText(input.id, 'Scope Version id');
  requireText(input.contractId, 'Contract id');
  requireText(input.createdAt, 'Scope Version created time');
  requireText(input.createdBy, 'Scope Version actor');
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new Error('Scope Version number must be a positive integer.');
  }
  validateScope(input.scope);
  return Object.freeze({
    ...input,
    scope: Object.freeze({ ...input.scope }),
  });
}

export function createContractAcceptanceFact(
  input: ContractAcceptanceFact,
): ContractAcceptanceFact {
  Object.entries(input).forEach(([label, value]) => requireText(value, label));
  return Object.freeze({ ...input });
}

export function proposeContract(
  contract: Contract,
  input: {
    readonly scopeVersionId: string;
    readonly proposedAt: string;
    readonly proposalExpiresAt: string;
  },
): Contract {
  if (contract.state !== 'draft') {
    throw new DomainTransitionError('Contract', contract.state, 'propose');
  }
  requireText(input.scopeVersionId, 'Scope Version id');
  assertTimeRange(input.proposedAt, input.proposalExpiresAt);
  return Object.freeze({
    ...contract,
    state: 'proposed',
    currentScopeVersionId: input.scopeVersionId,
    proposedAt: input.proposedAt,
    proposalExpiresAt: input.proposalExpiresAt,
  });
}

export function acceptContract(
  contract: Contract,
  input: { readonly acceptedAt: string; readonly acceptedBy: string },
): Contract {
  if (contract.state === 'accepted' || contract.state === 'contracted') {
    if (contract.acceptedBy === input.acceptedBy) {
      return contract;
    }
    throw new DomainTransitionError('Contract', contract.state, 'accept by another Buyer');
  }
  if (contract.state !== 'proposed') {
    throw new DomainTransitionError('Contract', contract.state, 'accept');
  }
  if (
    contract.proposalExpiresAt === undefined ||
    Date.parse(input.acceptedAt) >= Date.parse(contract.proposalExpiresAt)
  ) {
    throw new DomainTransitionError('Contract', contract.state, 'accept expired proposal');
  }
  requireText(input.acceptedBy, 'Buyer id');
  return Object.freeze({
    ...contract,
    state: 'accepted',
    acceptedAt: input.acceptedAt,
    acceptedBy: input.acceptedBy,
  });
}

export function formContract(
  contract: Contract,
  input: { readonly contractedAt: string; readonly orderId: string },
): Contract {
  if (contract.state === 'contracted') {
    if (contract.orderId === input.orderId) {
      return contract;
    }
    throw new DomainTransitionError('Contract', contract.state, 'form with another Order');
  }
  if (contract.state !== 'accepted') {
    throw new DomainTransitionError('Contract', contract.state, 'form');
  }
  requireText(input.orderId, 'Order id');
  return Object.freeze({
    ...contract,
    state: 'contracted',
    contractedAt: input.contractedAt,
    orderId: input.orderId,
  });
}

export function rejectContract(contract: Contract, rejectedAt: string): Contract {
  if (contract.state === 'rejected') {
    return contract;
  }
  if (contract.state !== 'proposed') {
    throw new DomainTransitionError('Contract', contract.state, 'reject');
  }
  return Object.freeze({ ...contract, state: 'rejected', rejectedAt });
}

export function expireContract(contract: Contract, expiredAt: string): Contract {
  if (contract.state === 'expired') {
    return contract;
  }
  if (contract.state !== 'proposed') {
    throw new DomainTransitionError('Contract', contract.state, 'expire');
  }
  if (
    contract.proposalExpiresAt === undefined ||
    Date.parse(expiredAt) < Date.parse(contract.proposalExpiresAt)
  ) {
    throw new DomainTransitionError('Contract', contract.state, 'expire before proposal TTL');
  }
  return Object.freeze({ ...contract, state: 'expired' });
}

export function cancelContract(
  contract: Contract,
  input: { readonly cancelledAt: string; readonly cancelledBy: 'creator' | 'buyer' },
): Contract {
  if (contract.state === 'cancelled') {
    return contract;
  }
  if (contract.state === 'rejected' || contract.state === 'expired' || contract.state === 'draft') {
    throw new DomainTransitionError('Contract', contract.state, 'cancel');
  }
  return Object.freeze({
    ...contract,
    state: 'cancelled',
    cancelledAt: input.cancelledAt,
    cancelledBy: input.cancelledBy,
  });
}

function validateScope(scope: ContractScope): void {
  requireText(scope.performanceType, 'Performance type');
  requireText(scope.performanceDate, 'Performance date');
  requireText(scope.location, 'Location');
  requireText(scope.deliverables, 'Deliverables');
  requireText(scope.cancellationTerms, 'Cancellation terms');
  requireText(scope.fulfillmentCriteria, 'Fulfillment criteria');
  if (!Number.isInteger(scope.durationMinutes) || scope.durationMinutes <= 0) {
    throw new Error('Performance duration must be a positive integer.');
  }
  if (!Number.isInteger(scope.creatorHeadcount) || scope.creatorHeadcount <= 0) {
    throw new Error('Creator headcount must be a positive integer.');
  }
  if (scope.priceMinor <= 0n) {
    throw new Error('Contract price must be greater than zero.');
  }
}

function assertTimeRange(startsAt: string, endsAt: string): void {
  requireText(startsAt, 'Start time');
  requireText(endsAt, 'End time');
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new Error('End time must be later than start time.');
  }
}

function requireText(value: unknown, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
}
