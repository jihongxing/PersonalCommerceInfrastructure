import type {
  EntityCollectionRepository,
  EntityRepository,
} from '../core/ports/entity-repository.js';
import type { CommerceAction, Customer } from '../../modules/customer-request/commerce-action.js';

export interface CustomerRepository extends EntityRepository<Customer> {
  findByContactMethod(contactMethod: string): Promise<Customer | undefined>;
}

export interface CommerceActionRepository extends EntityCollectionRepository<CommerceAction> {
  findSubmittedByCustomerAndOffering(
    customerId: string,
    offeringId: string,
  ): Promise<CommerceAction | undefined>;
  findByResultAccessToken(token: string): Promise<CommerceAction | undefined>;
  saveTerminalDecision(action: CommerceAction): Promise<boolean>;
}
