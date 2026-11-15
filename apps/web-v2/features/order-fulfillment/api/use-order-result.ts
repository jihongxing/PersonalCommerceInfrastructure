import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface OrderResult {
  actionId: string;
  resultAccessToken: string;
  state: 'submitted' | 'confirmed' | 'declined';
  message: string;
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
