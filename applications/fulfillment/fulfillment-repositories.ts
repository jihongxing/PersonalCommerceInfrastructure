/**
 * Fulfillment Repository Interfaces (Ports)
 * 
 * Application layer ports for fulfillment-related persistence
 */

import { FulfillmentCode } from '../../domain/fulfillment-code.js';

/**
 * Repository for fulfillment codes
 */
export interface IFulfillmentCodeRepository {
  save(fulfillmentCode: FulfillmentCode): Promise<void>;
  findByCode(code: string): Promise<FulfillmentCode | null>;
  findByActionId(actionId: string): Promise<FulfillmentCode | null>;
  findById(id: string): Promise<FulfillmentCode | null>;
}

/**
 * Repository interface for commerce actions
 * (Only the fulfillment-related methods)
 */
export interface ICommerceActionRepository {
  findById(id: string): Promise<{ creatorId: string } | undefined>;
  updateFulfillmentStatus?(actionId: string, status: string): Promise<void>;
}
