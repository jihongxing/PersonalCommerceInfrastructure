import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface CreatorIdentity {
  creatorId: string;
  profile: {
    displayName: string;
    bio: string;
    avatarUrl?: string;
    location?: string;
    socialLinks?: Array<{
      platform: string;
      url: string;
    }>;
  };
  capabilityIds: string[];
  state: 'draft' | 'published' | 'unpublished';
  createdAt: string;
  updatedAt: string;
}

export interface CreateIdentityRequest {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  location?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
}

export interface UpdateIdentityRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
}

/**
 * 获取当前 Creator 的身份信息
 */
export function useCreatorIdentity() {
  return useQuery({
    queryKey: ['creator-identity'],
    queryFn: async (): Promise<CreatorIdentity> => {
      const { data, error } = await apiClient.GET(
        '/api/v1/creator/identity',
        {
          params: {
            header: {
              // Bearer token 会在 apiClient 中自动添加
            },
          },
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load creator identity'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as CreatorIdentity;
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
      const { data, error } = await apiClient.POST(
        '/api/v1/creator/identity',
        {
          body: request,
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to create identity'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as CreatorIdentity;
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
      const { data, error } = await apiClient.PATCH(
        '/api/v1/creator/identity',
        {
          body: request,
        }
      );

      if (error) {
        throw new Error(
          error.error?.message || 'Failed to update identity'
        );
      }

      if (!data) {
        throw new Error('No data returned from API');
      }

      return data as CreatorIdentity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creator-identity'],
      });
    },
  });
}
