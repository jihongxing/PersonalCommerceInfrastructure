import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface CreatorRequest {
  action: {
    id: string;
    customerId: string;
    creatorId: string;
    offeringId: string;
    requestMessage: string;
    resultAccessToken: string;
    state: 'submitted';
  };
  customer: {
    contactName: string;
    contactMethod: string;
  };
  offering: {
    title: string;
  };
}

export interface CreatorConfirmedRequest {
  action: {
    id: string;
    customerId: string;
    creatorId: string;
    offeringId: string;
    requestMessage: string;
    resultAccessToken: string;
    state: 'confirmed';
  };
  customer: {
    contactName: string;
    contactMethod: string;
  };
  offering: {
    title: string;
  };
  fulfillmentCode: {
    code: string;
    status: 'pending' | 'fulfilled' | 'expired';
    expiresAt: string;
    confirmedAt?: string;
  };
}

/**
 * 获取待处理的预约请求列表
 */
export function useCreatorRequests(accessToken?: string) {
  return useQuery({
    queryKey: ['creator-requests', accessToken],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Access token required');
      }

      const { data, error } = await apiClient.GET('/api/v1/creator/requests', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load creator requests'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return (data as { requests: CreatorRequest[] }).requests;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 30, // 30 秒
    refetchInterval: 10000, // 10 秒自动刷新
  });
}

/**
 * 获取已确认的预约列表
 */
export function useCreatorConfirmedRequests(accessToken?: string) {
  return useQuery({
    queryKey: ['creator-confirmed-requests', accessToken],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Access token required');
      }

      const { data, error } = await apiClient.GET('/api/v1/creator/confirmed-requests', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load confirmed requests'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return (data as { requests: CreatorConfirmedRequest[] }).requests;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60, // 1 分钟
    refetchInterval: 30000, // 30 秒自动刷新
  });
}
