import { DomainTransitionError } from '../shared/domain-error.js';

export type CommerceActionState = 'draft' | 'submitted' | 'confirmed' | 'declined';

export interface CommerceAction {
  readonly id: string;
  readonly customerId: string;
  readonly creatorId: string;
  readonly offeringId: string;
  readonly requestMessage: string;
  readonly resultAccessToken: string;
  readonly state: CommerceActionState;
}

export interface Customer {
  readonly id: string;
  readonly contactName: string;
  readonly contactMethod: string;
}

export interface CustomerRequestInput {
  readonly contactName: string;
  readonly contactMethod: string;
  readonly requestMessage: string;
}

export function createCustomer(
  id: string,
  input: Pick<CustomerRequestInput, 'contactName' | 'contactMethod'>,
): Customer {
  const contactName = input.contactName.trim();
  const contactMethod = input.contactMethod.trim();

  if (id.trim().length === 0 || contactName.length === 0 || contactMethod.length === 0) {
    throw new Error('Customer contact information is required');
  }

  return {
    id: id.trim(),
    contactName,
    contactMethod,
  };
}

export function createDraftCommerceAction(
  id: string,
  customerId: string,
  creatorId: string,
  offeringId: string,
  requestMessage: string,
  resultAccessToken: string,
): CommerceAction {
  const normalizedRequestMessage = requestMessage.trim();

  if (
    id.trim().length === 0 ||
    customerId.trim().length === 0 ||
    creatorId.trim().length === 0 ||
    offeringId.trim().length === 0 ||
    normalizedRequestMessage.length === 0 ||
    resultAccessToken.trim().length === 0
  ) {
    throw new Error('Commerce Action request information is required');
  }

  return {
    id: id.trim(),
    customerId: customerId.trim(),
    creatorId: creatorId.trim(),
    offeringId: offeringId.trim(),
    requestMessage: normalizedRequestMessage,
    resultAccessToken: resultAccessToken.trim(),
    state: 'draft',
  };
}

export function submitCommerceAction(action: CommerceAction): CommerceAction {
  if (action.state !== 'draft') {
    throw new DomainTransitionError('CommerceAction', action.state, 'submit');
  }

  return { ...action, state: 'submitted' };
}
