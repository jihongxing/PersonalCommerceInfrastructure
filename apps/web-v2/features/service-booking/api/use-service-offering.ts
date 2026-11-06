import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface ServiceOfferingAppearance {
  appearanceType: 'convention' | 'guest' | 'brand' | 'photo' | 'signing';
  startsOn: string;
  endsOn?: string;
  locationDescription: string;
  buyerType: 'organizer' | 'brand' | 'fan_group' | 'approved_external_requester';
  pricingRule?: string;
  requestCallToAction: string;
  upcomingTitle: string;
  externalUrl?: string;
}

export interface ServiceOfferingDetail {
  id: string;
  title: string;
  description: string;
  availabilityDescription: string;
  appearance?: ServiceOfferingAppearance;
  requestInstructions: string;
}

export interface ServiceOfferingResponse {
  creator: {
    displayName: string;
    bio: string;
    capabilityNames: string[];
  };
  offering: ServiceOfferingDetail;
}

/**
 * 获取服务详情（公开 API）
 */
export function useServiceOffering(offeringId: string) {
  return useQuery({
    queryKey: ['service-offering', offeringId],
    queryFn: async (): Promise<ServiceOfferingResponse> => {
      const { data, error } = await apiClient.GET(
        '/api/v1/public/offerings/{offeringId}',
        {
          params: {
            path: { offeringId },
          },
        }
      );
      
      if (error) {
        throw new Error(
          error.error?.message || 'Failed to load service offering'
        );
      }
      
      if (!data) {
        throw new Error('No data returned from API');
      }
      
      return data as ServiceOfferingResponse;
    },
    enabled: !!offeringId,
    staleTime: 1000 * 60 * 5, // 5 分钟
  });
}
