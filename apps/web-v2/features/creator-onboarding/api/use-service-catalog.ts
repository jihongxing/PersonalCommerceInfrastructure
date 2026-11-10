import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface CatalogCapability {
  id: string;
  slug: string;
  vertical: string;
  name: string;
  description: string;
  riskTier: 'low' | 'review' | 'prohibited';
  releaseScope: 'vs01' | 'established' | 'future';
  version: string;
  status: 'active' | 'custom_request' | 'retired';
}

export interface ServiceTemplate {
  id: string;
  slug: string;
  capabilityCatalogItemId: string;
  name: string;
  description: string;
  riskTier: 'low' | 'review' | 'prohibited';
  releaseScope: 'vs01' | 'established' | 'future';
  requiredFields: string[];
  version: string;
  status: 'active' | 'custom_request' | 'retired';
}

export interface ServiceCatalog {
  capabilities: CatalogCapability[];
  templates: ServiceTemplate[];
  policyVersion: string;
}

export function useServiceCatalog() {
  return useQuery({
    queryKey: ['service-catalog'],
    queryFn: async (): Promise<ServiceCatalog> => {
      const { data, error } = await apiClient.GET<ServiceCatalog>(
        '/api/v1/creator/service-catalog',
      );
      if (error) throw new Error(error.error?.message || '无法加载能力目录');
      if (!data) throw new Error('能力目录暂无数据');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
