import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface FulfillmentCode {
  code: string;
  status: 'pending' | 'fulfilled' | 'expired';
  expiresAt: string;
  confirmedAt?: string;
}

export interface OrderResult {
  actionId: string;
  resultAccessToken: string;
  state: 'submitted' | 'confirmed' | 'declined';
  message: string;
  fulfillmentCode?: FulfillmentCode;
}

export function useFulfillmentQrCode(code?: string) {
  return useQuery({
    queryKey: ['fulfillment-code-qr', code],
    queryFn: async () => {
      const { data, error } = await apiClient.GET<{ dataUrl: string }>(
        '/api/v1/public/fulfillment-code/{code}/qrcode',
        { params: { path: { code } } },
      );
      if (error) throw new Error(error.error?.message || 'Failed to load fulfillment QR code');
      if (!data) throw new Error('No QR code returned from API');
      return data.dataUrl;
    },
    enabled: Boolean(code),
    staleTime: 1000 * 60 * 60,
  });
}

export function useOrderResult(token: string) {
  return useQuery({
    queryKey: ['order-result', token],
    queryFn: async (): Promise<OrderResult> => {
      const { data, error } = await apiClient.GET('/api/v1/public/requests/{resultAccessToken}', {
        params: { path: { resultAccessToken: token } },
      });
      if (error) throw new Error(error.error?.message || 'Failed to load order result');
      if (!data) throw new Error('No data returned from API');
      return data as OrderResult;
    },
    enabled: !!token,
    staleTime: 1000 * 30,
    refetchInterval: (query) =>
      (query.state.data as OrderResult | undefined)?.state === 'submitted' ? 10000 : false,
  });
}
