import type {
  NotificationPort,
  ProductNotification,
} from '../../applications/core/ports/notification-port.js';
import type { SafeLogger } from '../observability/safe-logger.js';

export class LogNotificationAdapter implements NotificationPort {
  public constructor(private readonly logger: SafeLogger) {}

  public deliver(notification: ProductNotification): Promise<void> {
    this.logger.info('product_notification_delivered', notificationLogContext(notification));
    return Promise.resolve();
  }
}

function notificationLogContext(notification: ProductNotification) {
  if (notification.kind === 'creator_request_submitted') {
    return {
      notificationKind: notification.kind,
      recipientCreatorId: notification.recipientCreatorId,
      actionId: notification.actionId,
      offeringId: notification.offeringId,
      offeringTitle: notification.offeringTitle,
    };
  }

  return {
    notificationKind: notification.kind,
    recipientCustomerId: notification.recipientCustomerId,
    actionId: notification.actionId,
  };
}
