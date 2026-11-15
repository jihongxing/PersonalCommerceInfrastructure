import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api/client';
import type { CreatorIdentityResponse } from './contracts';

export type CreatorIdentity = CreatorIdentityResponse;

export interface CreateIdentityRequest {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  location?: string;
  socialLinks?: string[];
}

export interface UpdateIdentityRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  socialLinks?: string[];
}

/**
 * 获取当前 Creator 的身份信息
 */
export function useCreatorIdentity() {
  return useQuery({
    queryKey: ['creator-identity'],
    queryFn: async (): Promise<CreatorIdentity> => {
      const { data, error, status } = await apiClient.GET<CreatorIdentityResponse>(
        '/api/v1/creator/identity',
        {
          params: {
            header: {
              // The same-origin BFF supplies the server-side Creator session.
            },
          },
        },
      );

      if (error) {
        throw new ApiError(error.error?.message || '加载商业身份失败', error.error?.code, status);
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data;
    },
    retry: 1,
  });
}

/**
 * 创建 Creator 身份
 */
export function useCreateIdentity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateIdentityRequest) => {
      const { data, error } = await apiClient.POST<CreatorIdentityResponse>(
        '/api/v1/creator/identity',
        {
          body: {
            profile: {
              ...request,
              avatarUrl: request.avatarUrl || undefined,
              location: request.location || undefined,
              socialLinks: request.socialLinks || [],
            },
          },
        },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to create identity');
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-identity'],
      });
    },
  });
}

/**
 * 更新 Creator 身份
 */
export function useUpdateIdentity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateIdentityRequest) => {
      const { data, error } = await apiClient.PATCH<CreatorIdentityResponse>(
        '/api/v1/creator/identity',
        {
          body: {
            profile: {
              ...request,
              avatarUrl: request.avatarUrl || undefined,
              location: request.location || undefined,
              socialLinks: request.socialLinks || [],
            },
          },
        },
      );

      if (error) {
        throw new Error(error.error?.message || 'Failed to update identity');
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-identity'],
      });
    },
  });
}
