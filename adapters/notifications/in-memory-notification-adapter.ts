import type {
  NotificationPort,
  ProductNotification,
} from '../../applications/core/ports/notification-port.js';

export class InMemoryNotificationAdapter implements NotificationPort {
  private notifications: ProductNotification[] = [];

  public deliver(notification: ProductNotification): Promise<void> {
    this.notifications.push(structuredClone(notification));
    return Promise.resolve();
  }

  public list(): readonly ProductNotification[] {
    return structuredClone(this.notifications);
  }
}
