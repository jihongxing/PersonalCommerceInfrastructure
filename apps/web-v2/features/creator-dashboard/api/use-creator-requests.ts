import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface CreatorRequest {
  action: { id: string; customerId: string; creatorId: string; offeringId: string; requestMessage: string; resultAccessToken: string; state: 'submitted'; };
  customer: { contactName: string; contactMethod: string };
  offering: { title: string };
}
export interface CreatorConfirmedRequest {
  action: { id: string; customerId: string; creatorId: string; offeringId: string; requestMessage: string; resultAccessToken: string; state: 'confirmed'; };
  customer: { contactName: string; contactMethod: string };
  offering: { title: string };
}

export function useCreatorRequests(_legacyAccessToken?: string) {
  void _legacyAccessToken;
  return useQuery({
    queryKey: ['creator-requests'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/creator/requests');
      if (error) throw new Error(error.error?.message || 'Failed to load creator requests');
      if (!data) throw new Error('No data returned from API');
      return (data as { requests: CreatorRequest[] }).requests;
    },
    staleTime: 1000 * 30,
    refetchInterval: 10000,
  });
}

export function useCreatorConfirmedRequests(_legacyAccessToken?: string) {
  void _legacyAccessToken;
  return useQuery({
    queryKey: ['creator-confirmed-requests'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/creator/confirmed-requests');
      if (error) throw new Error(error.error?.message || 'Failed to load confirmed requests');
      if (!data) throw new Error('No data returned from API');
      return (data as { requests: CreatorConfirmedRequest[] }).requests;
    },
    staleTime: 1000 * 60,
    refetchInterval: 30000,
  });
}
