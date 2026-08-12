import type { NotificationPort, ProductNotification } from './ports/notification-port.js';

export async function deliverBestEffortNotification(
  notificationPort: NotificationPort,
  notification: ProductNotification,
): Promise<void> {
  try {
    await notificationPort.deliver(notification);
  } catch {
    return;
  }
}
