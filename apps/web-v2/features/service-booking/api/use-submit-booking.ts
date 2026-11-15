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
}

/**
 * 提交 Customer Request
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
