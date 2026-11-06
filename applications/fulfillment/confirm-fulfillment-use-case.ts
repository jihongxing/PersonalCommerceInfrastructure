/**
 * Confirm Fulfillment Use Case
 * 
 * Creator confirms that an offline service has been completed by entering/scanning
 * the fulfillment code that was provided to the customer.
 */

import type {
  IFulfillmentCodeRepository,
  ICommerceActionRepository,
} from './fulfillment-repositories.js';
import { BusinessError } from '../../modules/shared/business-error.js';
import { AuthorizationError } from '../../modules/shared/business-error.js';

export interface ConfirmFulfillmentCommand {
  actionId: string;
  fulfillmentCode: string;
  creatorId: string;
}

export interface ConfirmFulfillmentResult {
  actionId: string;
  status: 'fulfilled';
  confirmedAt: string;
}

export class ConfirmFulfillmentError extends BusinessError {
  constructor(
    code: string,
    message: string,
    isRetryable: boolean,
    public readonly details?: Record<string, unknown>,
  ) {
    super(code, message, isRetryable, details);
    Object.defineProperty(this, 'name', { value: 'ConfirmFulfillmentError', enumerable: false });
  }
}

export async function confirmFulfillmentUseCase(
  dependencies: {
    fulfillmentCodeRepository: IFulfillmentCodeRepository;
    commerceActionRepository: ICommerceActionRepository;
  },
  command: ConfirmFulfillmentCommand,
): Promise<ConfirmFulfillmentResult> {
  // 1. Validate fulfillment code format
  if (!/^FC-[A-Z0-9]{8}$/.test(command.fulfillmentCode)) {
    throw new ConfirmFulfillmentError(
      'FULFILLMENT_CODE_INVALID_FORMAT',
      'Invalid fulfillment code format. Expected: FC-XXXXXXXX',
      false,
    );
  }

  // 2. Find the fulfillment code
  const fulfillmentCode = await dependencies.fulfillmentCodeRepository.findByCode(
    command.fulfillmentCode,
  );

  if (!fulfillmentCode) {
    throw new ConfirmFulfillmentError(
      'FULFILLMENT_CODE_NOT_FOUND',
      'Fulfillment code does not exist',
      false,
    );
  }

  // 3. Verify it matches the requested action
  if (fulfillmentCode.getActionId() !== command.actionId) {
    throw new ConfirmFulfillmentError(
      'FULFILLMENT_CODE_MISMATCH',
      'Fulfillment code does not match this order',
      false,
    );
  }

  // 4. Verify the creator has permission
  const action = await dependencies.commerceActionRepository.findById(command.actionId);
  if (!action) {
    throw new ConfirmFulfillmentError(
      'ACTION_NOT_FOUND',
      'Order not found',
      false,
    );
  }

  if (action.creatorId !== command.creatorId) {
    throw new AuthorizationError('Not authorized to confirm this order');
  }

  // 5. Check if code is expired
  if (fulfillmentCode.isExpired()) {
    throw new ConfirmFulfillmentError(
      'FULFILLMENT_CODE_EXPIRED',
      'Fulfillment code has expired',
      true,
      { expiresAt: fulfillmentCode.getExpiresAt().toISOString() },
    );
  }

  // 6. Check if code has already been fulfilled
  if (fulfillmentCode.getStatus() === 'fulfilled') {
    throw new ConfirmFulfillmentError(
      'FULFILLMENT_CODE_ALREADY_FULFILLED',
      'This fulfillment code has already been used',
      false,
      { fulfilledAt: fulfillmentCode.getFulfilledAt()?.toISOString() },
    );
  }

  // 7. Mark fulfillment code as fulfilled
  const updatedCode = fulfillmentCode.markFulfilled();
  await dependencies.fulfillmentCodeRepository.save(updatedCode);

  // 8. Update action fulfillment status (TODO: implement when commerce_actions schema supports it)
  if (dependencies.commerceActionRepository.updateFulfillmentStatus) {
    await dependencies.commerceActionRepository.updateFulfillmentStatus(
      command.actionId,
      'fulfilled',
    );
  }

  return {
    actionId: command.actionId,
    status: 'fulfilled',
    confirmedAt: new Date().toISOString(),
  };
}
