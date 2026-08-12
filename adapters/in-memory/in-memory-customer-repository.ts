import type { CustomerRepository } from '../../applications/customer-request/customer-request-repositories.js';
import type { Customer } from '../../modules/customer-request/commerce-action.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryCustomerRepository implements CustomerRepository, TransactionParticipant {
  private customers = new Map<string, Customer>();

  public findById(id: string): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    return Promise.resolve(customer === undefined ? undefined : structuredClone(customer));
  }

  public findByContactMethod(contactMethod: string): Promise<Customer | undefined> {
    const customer = [...this.customers.values()].find(
      (entry) => entry.contactMethod === contactMethod,
    );
    return Promise.resolve(customer === undefined ? undefined : structuredClone(customer));
  }

  public save(customer: Customer): Promise<void> {
    this.customers.set(customer.id, structuredClone(customer));
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone(this.customers);
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (!(snapshot instanceof Map)) {
      throw new TypeError('Customer repository snapshot must be a Map.');
    }

    this.customers = structuredClone(snapshot) as Map<string, Customer>;
  }
}
