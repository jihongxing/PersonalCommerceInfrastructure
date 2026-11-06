'use client';

import { useRouter } from 'next/navigation';
import { useCreatorProfile } from '@/features/creator-profile/api/use-creator-profile';
import { CreatorProfileCard } from '@/components/commerce/creator-profile-card';
import { ServiceCard, ServiceListEmpty } from '@/components/commerce/service-card';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreatorProfilePage({
  params,
}: {
  params: { commerceRef: string };
}) {
  const router = useRouter();
  const { data, isLoading, error } = useCreatorProfile(params.commerceRef);

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-6xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold text-destructive mb-2">
              加载失败
            </p>
            <p className="text-muted-foreground">
              {error?.message || '无法加载 Creator 信息'}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              请检查 C号 是否正确，或稍后重试
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleServiceSelect = (serviceId: string) => {
    // 跳转到服务详情页
    router.push(`/s/${serviceId}`);
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      {/* Creator Profile 卡片 */}
      <CreatorProfileCard
        displayName={data.profile.displayName}
        commerceReference={data.profile.commerceReference}
      />

      {/* 服务列表 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">可用服务</h2>
        
        {data.offerings.length === 0 ? (
          <ServiceListEmpty />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.offerings.map((offering) => (
              <ServiceCard
                key={offering.id}
                id={offering.id}
                title={offering.title}
                description={offering.description}
                onSelect={handleServiceSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
