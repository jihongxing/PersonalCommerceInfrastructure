import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Capability } from './use-creator-capabilities';

export interface UpdateCapabilityRequest {
  name?: string;
  description?: string;
}

/**
 * 获取单个能力详情
 */
export function useCapability(capabilityId: string) {
  return useQuery({
    queryKey: ['creator-capability', capabilityId],
    queryFn: async (): Promise<Capability> => {
      // 如果没有单独的获取端点，可以从列表中查询
      const { data, error } = await apiClient.GET(
        '/api/v1/creator/identity/capabilities/{capabilityId}',
        {
          params: {
            path: { capabilityId },
            header: {},
          },
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load capability'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as Capability;
    },
    enabled: !!capabilityId,
    retry: 1,
  });
}

/**
 * 更新能力
 */
export function useUpdateCapability(capabilityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateCapabilityRequest) => {
      const { data, error } = await apiClient.PATCH(
        '/api/v1/creator/identity/capabilities/{capabilityId}',
        {
          params: {
            path: { capabilityId },
          },
          body: request,
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to update capability'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as Capability;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-capabilities'],
      });
      queryClient.invalidateQueries({
        queryKey: ['creator-capability', capabilityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['creator-identity'],
      });
    },
  });
}
