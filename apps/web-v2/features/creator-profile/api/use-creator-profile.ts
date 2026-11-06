import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface CreatorProfile {
  commerceReference: string;
  displayName: string;
}

export interface ServiceOffering {
  id: string;
  title: string;
  description: string;
}

export interface CreatorProfileResponse {
  profile: CreatorProfile;
  offerings: ServiceOffering[];
}

/**
 * 通过 Commerce Reference (C号) 获取 Creator Profile
 */
export function useCreatorProfile(commerceRef: string) {
  return useQuery({
    queryKey: ['creator-profile', commerceRef],
    queryFn: async (): Promise<CreatorProfileResponse> => {
      const { data, error } = await apiClient.GET(
        '/api/v1/public/creator-profile/{commerceRef}',
        {
          params: {
            path: { commerceRef },
          },
        }
      );
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load creator profile'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return data as CreatorProfileResponse;
    },
    enabled: !!commerceRef && commerceRef.length === 18,
    staleTime: 1000 * 60 * 5, // 5 分钟
  });
}
