import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface CreatorDecisionResponse {
  actionId: string;
  state: 'confirmed' | 'declined';
  resultAccessToken: string;
}

async function decide(
  path: string,
  actionId: string,
  fallback: string,
): Promise<CreatorDecisionResponse> {
  const { data, error } = await apiClient.POST<CreatorDecisionResponse>(path, {
    params: { path: { actionId } },
  });
  if (error) throw new Error(error.error?.message || fallback);
  if (!data) throw new Error('No data returned from API');
  return data;
}

export function useConfirmRequest(_legacyAccessToken?: string) {
  void _legacyAccessToken;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      decide('/api/v1/creator/requests/{actionId}/confirm', actionId, 'Failed to confirm request'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creator-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['creator-confirmed-requests'] });
    },
  });
}

export function useDeclineRequest(_legacyAccessToken?: string) {
  void _legacyAccessToken;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      decide('/api/v1/creator/requests/{actionId}/decline', actionId, 'Failed to decline request'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creator-requests'] });
    },
  });
}

export function useConfirmFulfillment(_legacyAccessToken?: string) {
  void _legacyAccessToken;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      actionId,
      fulfillmentCode,
    }: {
      actionId: string;
      fulfillmentCode: string;
    }) => {
      const { data, error } = await apiClient.POST<{
        actionId: string;
        status: 'fulfilled';
        confirmedAt: string;
      }>('/api/v1/creator/requests/{actionId}/confirm-fulfillment', {
        params: { path: { actionId } },
        body: { fulfillmentCode },
      });
      if (error) throw new Error(error.error?.message || 'Failed to confirm fulfillment');
      if (!data) throw new Error('No data returned from API');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['creator-confirmed-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['order-result'] });
    },
  });
}
