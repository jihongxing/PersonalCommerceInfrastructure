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

/**
 * 通过 resultAccessToken 获取订单结果
 */
export function useOrderResult(token: string) {
  return useQuery({
    queryKey: ['order-result', token],
    queryFn: async (): Promise<OrderResult> => {
      const { data, error } = await apiClient.GET(
        '/api/v1/public/requests/{resultAccessToken}',
        {
          params: {
            path: { resultAccessToken: token },
          },
        }
      );
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load order result'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return data as OrderResult;
    },
    enabled: !!token,
    // 订单状态可能变化，缩短缓存时间
    staleTime: 1000 * 30, // 30 秒
    refetchInterval: (query) => {
      // 如果是 submitted 状态，自动轮询
      const data = query.state.data as OrderResult | undefined;
      return data?.state === 'submitted' ? 10000 : false; // 10 秒轮询
    },
  });
}
