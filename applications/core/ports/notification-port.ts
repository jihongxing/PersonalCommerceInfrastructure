export type ProductNotification =
  | {
      readonly kind: 'creator_request_submitted';
      readonly recipientCreatorId: string;
      readonly actionId: string;
      readonly offeringId: string;
      readonly offeringTitle: string;
    }
  | {
      readonly kind: 'customer_request_confirmed' | 'customer_request_declined';
      readonly recipientCustomerId: string;
      readonly contactMethod: string;
      readonly actionId: string;
      readonly resultAccessToken: string;
    };

export interface NotificationPort {
  deliver(notification: ProductNotification): Promise<void>;
}
