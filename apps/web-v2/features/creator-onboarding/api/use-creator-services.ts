import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { MissingPublishCondition } from './contracts';
import type { ServiceOfferingAppearance } from '@/lib/service-offering-appearance';

export interface ServiceOffering {
  id: string;
  creatorId: string;
  capabilityIds: string[];
  templateId?: string;
  title: string;
  description: string;
  availabilityDescription: string;
  appearance?: ServiceOfferingAppearance;
  requestInstructions: string;
  state: 'draft' | 'published' | 'unpublished' | 'archived';
  policyStatus?: 'not_checked' | 'auto_approved' | 'review_required' | 'approved' | 'rejected';
  policyReason?: string;
  policyVersion?: string;
  missingPublishConditions: MissingPublishCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface DistributionAsset {
  offeringId: string;
  publicUrl: string;
  state: 'generated' | 'distributed';
}

export interface PublishServiceOfferingResponse {
  offering: {
    id: string;
    creatorId: string;
    state: 'published';
  };
  distributionAsset: DistributionAsset;
}

export function useDistributionAsset(offeringId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['distribution-asset', offeringId],
    enabled: !!offeringId && enabled,
    queryFn: async (): Promise<DistributionAsset | null> => {
      const { data, error } = await apiClient.GET<DistributionAsset | null>(
        '/api/v1/creator/offerings/{offeringId}/distribution',
        {
          params: { path: { offeringId } },
        },
      );
      if (error) throw new Error(error.error?.message || '无法加载分发状态');
      return data;
    },
  });
}

export function useRecordDistribution(offeringId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST<DistributionAsset>(
        '/api/v1/creator/offerings/{offeringId}/distribution',
        {
          params: { path: { offeringId } },
        },
      );
      if (error) throw new Error(error.error?.message || '记录分发失败');
      if (!data) throw new Error('No data returned from API');
      return data;
    },
    onSuccess: (asset) => queryClient.setQueryData(['distribution-asset', offeringId], asset),
    onError: () => queryClient.invalidateQueries({ queryKey: ['distribution-asset', offeringId] }),
  });
}

export interface CreateServiceOfferingRequest {
  capabilityIds: string[];
  templateId?: string;
  title: string;
  description: string;
  availabilityDescription: string;
  appearance?: ServiceOfferingAppearance;
  requestInstructions: string;
}

export interface UpdateServiceOfferingRequest {
  capabilityIds?: string[];
  templateId?: string;
  title?: string;
  description?: string;
  availabilityDescription?: string;
  appearance?: ServiceOfferingAppearance;
  requestInstructions?: string;
}

/**
 * 获取当前 Creator 的所有服务
 */
export function useCreatorServices() {
  return useQuery({
    queryKey: ['creator-services'],
    queryFn: async (): Promise<ServiceOffering[]> => {
      const { data, error } = await apiClient.GET<{ offerings: ServiceOffering[] }>(
        '/api/v1/creator/offerings',
        {
          params: {
            header: {},
          },
        },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to load services');
      }

      if (!data) {
        return [];
      }

      return data.offerings;
    },
    retry: 1,
  });
}

/**
 * 获取单个服务详情
 */
export function useServiceOffering(offeringId: string) {
  return useQuery({
    queryKey: ['creator-service', offeringId],
    queryFn: async (): Promise<ServiceOffering | null> => {
      const { data, error } = await apiClient.GET<{ offerings: ServiceOffering[] }>(
        '/api/v1/creator/offerings',
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to load service offering');
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data.offerings.find((offering) => offering.id === offeringId) ?? null;
    },
    enabled: !!offeringId,
    retry: 1,
  });
}

/**
 * 创建服务
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateServiceOfferingRequest) => {
      const { data, error } = await apiClient.POST<ServiceOffering>('/api/v1/creator/offerings', {
        body: request,
      });

      if (error) {
        throw new Error(error.error?.message || 'Failed to create service');
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-services'],
      });
    },
  });
}

/**
 * 更新服务
 */
export function useUpdateService(offeringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateServiceOfferingRequest) => {
      const { data, error } = await apiClient.PATCH<ServiceOffering>(
        '/api/v1/creator/offerings/{offeringId}',
        {
          params: {
            path: { offeringId },
          },
          body: request,
        },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to update service');
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-services'],
      });
      queryClient.invalidateQueries({
        queryKey: ['creator-service', offeringId],
      });
    },
  });
}

/**
 * 发布服务
 */
export function usePublishService(offeringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST<PublishServiceOfferingResponse>(
        '/api/v1/creator/offerings/{offeringId}/publish',
        {
          params: {
            path: { offeringId },
          },
        },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to publish service');
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data;
    },
    onSuccess: (result) => {
      queryClient.setQueryData<ServiceOffering | null>(
        ['creator-service', offeringId],
        (current) => (current ? { ...current, state: result.offering.state } : current),
      );
      queryClient.setQueryData(['distribution-asset', offeringId], result.distributionAsset);
      queryClient.invalidateQueries({
        queryKey: ['creator-services'],
      });
      queryClient.invalidateQueries({
        queryKey: ['creator-service', offeringId],
      });
    },
  });
}

/**
 * 下架服务
 */
export function useUnpublishService(offeringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST<ServiceOffering>(
        '/api/v1/creator/offerings/{offeringId}/unpublish',
        {
          params: {
            path: { offeringId },
          },
        },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to unpublish service');
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-services'],
      });
      queryClient.invalidateQueries({
        queryKey: ['creator-service', offeringId],
      });
    },
  });
}

/**
 * 删除服务
 */
export function useDeleteService(offeringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.DELETE('/api/v1/creator/offerings/{offeringId}', {
        params: {
          path: { offeringId },
        },
      });

      if (error) {
        throw new Error(error.error?.message || 'Failed to delete service');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-services'],
      });
    },
  });
}
