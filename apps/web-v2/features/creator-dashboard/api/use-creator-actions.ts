import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface CreatorDecisionResponse {
  actionId: string;
  state: 'confirmed' | 'declined';
  resultAccessToken: string;
}

/**
 * 确认预约请求
 */
export function useConfirmRequest(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string): Promise<CreatorDecisionResponse> => {
      if (!accessToken) {
        throw new Error('Access token required');
      }

      const { data, error } = await apiClient.POST(
        '/api/v1/creator/requests/{actionId}/confirm',
        {
          params: {
            path: { actionId },
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to confirm request'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return data as CreatorDecisionResponse;
    },
    onSuccess: () => {
      // 刷新两个列表
      queryClient.invalidateQueries({ queryKey: ['creator-requests'] });
      queryClient.invalidateQueries({ queryKey: ['creator-confirmed-requests'] });
    },
  });
}

/**
 * 拒绝预约请求
 */
export function useDeclineRequest(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string): Promise<CreatorDecisionResponse> => {
      if (!accessToken) {
        throw new Error('Access token required');
      }

      const { data, error } = await apiClient.POST(
        '/api/v1/creator/requests/{actionId}/decline',
        {
          params: {
            path: { actionId },
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to decline request'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return data as CreatorDecisionResponse;
    },
    onSuccess: () => {
      // 只刷新待处理列表
      queryClient.invalidateQueries({ queryKey: ['creator-requests'] });
    },
  });
}

/**
 * 确认履约（扫描履约码后）
 */
export function useConfirmFulfillment(accessToken?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string): Promise<CreatorDecisionResponse> => {
      if (!accessToken) {
        throw new Error('Access token required');
      }

      const { data, error } = await apiClient.POST(
        '/api/v1/creator/requests/{actionId}/confirm-fulfillment',
        {
          params: {
            path: { actionId },
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to confirm fulfillment'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return data as CreatorDecisionResponse;
    },
    onSuccess: () => {
      // 刷新已确认列表
      queryClient.invalidateQueries({ queryKey: ['creator-confirmed-requests'] });
    },
  });
}
