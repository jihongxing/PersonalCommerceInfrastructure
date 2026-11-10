'use client';

import Link from 'next/link';
import { ArrowRight, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreatorServices,
  type ServiceOffering,
} from '@/features/creator-onboarding/api/use-creator-services';

function ServiceList({ services, empty }: { services: ServiceOffering[]; empty: string }) {
  if (!services.length) return <p className="py-6 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="creator-list-rows">
      {services.map((service) => (
        <li key={service.id} className="creator-service-row">
          <div className="min-w-0">
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            {service.policyStatus &&
              service.policyStatus !== 'auto_approved' &&
              service.policyStatus !== 'approved' && (
                <p className="mt-1 text-xs text-amber-700">
                  {service.policyStatus === 'review_required'
                    ? '等待平台审核'
                    : service.policyStatus === 'rejected'
                      ? '未通过政策检查'
                      : '待检查'}
                  {service.policyReason ? `：${service.policyReason}` : ''}
                </p>
              )}
          </div>
          <div className="creator-service-actions">
            <Button asChild variant="ghost" size="icon" className="min-h-11 min-w-11">
              <Link
                href={`/services/${service.id}/edit`}
                aria-label={`编辑${service.title}`}
                title="编辑服务"
              >
                <Pencil aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="min-h-11 min-w-11">
              <Link
                href={`/services/${service.id}`}
                aria-label={`查看${service.title}`}
                title="查看服务"
              >
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ServicesPage() {
  const { data, isLoading, isError, refetch } = useCreatorServices();
  const services = data ?? [];
  const drafts = services.filter((service) => service.state === 'draft');
  const published = services.filter((service) => service.state === 'published');
  const archived = services.filter(
    (service) => service.state === 'archived' || service.state === 'unpublished',
  );

  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>服务</h1>
          <p>管理可向访客提供的服务</p>
        </div>
        <Button asChild className="min-h-11">
          <Link href="/services/new">
            <Plus aria-hidden="true" />
            创建服务
          </Link>
        </Button>
      </header>
      <section className="creator-list-surface" aria-labelledby="services-heading">
        <div className="creator-list-heading">
          <h2 id="services-heading">我的服务</h2>
          {!isLoading && !isError && <span>{services.length} 项</span>}
        </div>
        {isLoading ? (
          <div className="space-y-4 py-5" aria-label="正在加载服务">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 py-5">
            <p>服务加载失败，请重试。</p>
            <Button variant="outline" onClick={() => void refetch()}>
              重试
            </Button>
          </div>
        ) : !services.length ? (
          <div className="space-y-4 py-5">
            <p className="text-sm text-muted-foreground">还没有创建服务。</p>
            <Button asChild variant="outline">
              <Link href="/services/new">创建第一个服务</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="draft" className="mt-5">
            <TabsList className="grid h-auto w-full max-w-md grid-cols-3">
              <TabsTrigger className="min-h-11 min-w-0 px-1 text-xs sm:text-sm" value="draft">
                草稿 ({drafts.length})
              </TabsTrigger>
              <TabsTrigger className="min-h-11 min-w-0 px-1 text-xs sm:text-sm" value="published">
                已发布 ({published.length})
              </TabsTrigger>
              <TabsTrigger className="min-h-11 min-w-0 px-1 text-xs sm:text-sm" value="archived">
                已下架 ({archived.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="draft">
              <ServiceList services={drafts} empty="还没有草稿服务。" />
            </TabsContent>
            <TabsContent value="published">
              <ServiceList services={published} empty="还没有已发布的服务。" />
            </TabsContent>
            <TabsContent value="archived">
              <ServiceList services={archived} empty="还没有已下架的服务。" />
            </TabsContent>
          </Tabs>
        )}
      </section>
    </div>
  );
}
