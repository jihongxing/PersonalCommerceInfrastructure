import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Capability, CreatorIdentityResponse } from './contracts';

export type { Capability } from './contracts';

export interface CreateCapabilityRequest {
  name: string;
  description: string;
  catalogItemId?: string;
}

/**
 * 获取当前 Creator 的所有能力
 */
export function useCreatorCapabilities() {
  return useQuery({
    queryKey: ['creator-capabilities'],
    queryFn: async (): Promise<Capability[]> => {
      const { data, error } = await apiClient.GET<CreatorIdentityResponse>(
        '/api/v1/creator/identity',
        { params: { header: {} } },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to load capabilities');
      }

      if (!data) {
        return [];
      }

      return data.capabilities;
    },
    retry: 1,
  });
}

/**
 * 添加能力
 */
export function useCreateCapability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateCapabilityRequest) => {
      const { data, error } = await apiClient.POST<CreatorIdentityResponse>(
        '/api/v1/creator/identity/capabilities',
        {
          body: request,
        },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to create capability');
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-capabilities'],
      });
      // 也失效身份查询，因为能力 ID 可能改变
      queryClient.invalidateQueries({
        queryKey: ['creator-identity'],
      });
    },
  });
}

/**
 * 删除能力
 */
export function useDeleteCapability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (capabilityId: string) => {
      const { error } = await apiClient.DELETE(
        '/api/v1/creator/identity/capabilities/{capabilityId}',
        {
          params: {
            path: { capabilityId },
          },
        },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to delete capability');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-capabilities'],
      });
      queryClient.invalidateQueries({
        queryKey: ['creator-identity'],
      });
    },
  });
}
