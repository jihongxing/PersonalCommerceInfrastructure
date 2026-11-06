import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface SubmitBookingRequest {
  contactName: string;
  contactMethod: string;
  requestMessage: string;
}

export interface BookingResult {
  actionId: string;
  resultAccessToken: string;
  state: 'submitted' | 'confirmed' | 'declined';
  message: string;
  fulfillmentCode?: {
    code: string;
    status: 'pending' | 'fulfilled' | 'expired';
    expiresAt: string;
    confirmedAt?: string;
  };
}

/**
 * 提交预约请求
 */
export function useSubmitBooking(offeringId: string) {
  return useMutation({
    mutationFn: async (request: SubmitBookingRequest): Promise<BookingResult> => {
      const { data, error } = await apiClient.POST(
        '/api/v1/public/offerings/{offeringId}/requests',
        {
          params: {
            path: { offeringId },
          },
          body: request,
        }
      );
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to submit booking request'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return data as BookingResult;
    },
  });
}
