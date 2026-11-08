import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface ServiceOffering {
  id: string;
  creatorId: string;
  capabilityIds: string[];
  title: string;
  description: string;
  availabilityDescription: string;
  appearance?: {
    currency?: string;
    priceRangeMin?: number;
    priceRangeMax?: number;
  };
  requestInstructions: string;
  state: 'draft' | 'published' | 'unpublished' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceOfferingRequest {
  capabilityIds: string[];
  title: string;
  description: string;
  availabilityDescription: string;
  appearance?: {
    currency?: string;
    priceRangeMin?: number;
    priceRangeMax?: number;
  };
  requestInstructions: string;
}

export interface UpdateServiceOfferingRequest {
  capabilityIds?: string[];
  title?: string;
  description?: string;
  availabilityDescription?: string;
  appearance?: {
    currency?: string;
    priceRangeMin?: number;
    priceRangeMax?: number;
  };
  requestInstructions?: string;
}

/**
 * 获取当前 Creator 的所有服务
 */
export function useCreatorServices() {
  return useQuery({
    queryKey: ['creator-services'],
    queryFn: async (): Promise<ServiceOffering[]> => {
      const { data, error } = await apiClient.GET(
        '/api/v1/creator/offerings',
        {
          params: {
            header: {},
          },
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load services'
        );
      }

      if (!data) {
        return [];
      }

      return (data.offerings || []) as ServiceOffering[];
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
      const { data, error } = await apiClient.GET('/api/v1/creator/offerings');

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load service offering'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return (data.offerings as ServiceOffering[]).find((offering) => offering.id === offeringId) ?? null;
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
      const { data, error } = await apiClient.POST(
        '/api/v1/creator/offerings',
        {
          body: request,
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to create service'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as ServiceOffering;
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
      const { data, error } = await apiClient.PATCH(
        '/api/v1/creator/offerings/{offeringId}',
        {
          params: {
            path: { offeringId },
          },
          body: request,
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to update service'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as ServiceOffering;
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
      const { data, error } = await apiClient.POST(
        '/api/v1/creator/offerings/{offeringId}/publish',
        {
          params: {
            path: { offeringId },
          },
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to publish service'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as ServiceOffering;
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
 * 下架服务
 */
export function useUnpublishService(offeringId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST(
        '/api/v1/creator/offerings/{offeringId}/unpublish',
        {
          params: {
            path: { offeringId },
          },
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to unpublish service'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as ServiceOffering;
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
      const { data, error } = await apiClient.DELETE(
        '/api/v1/creator/offerings/{offeringId}',
        {
          params: {
            path: { offeringId },
          },
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to delete service'
        );
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
