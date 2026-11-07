'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useServiceOffering,
  usePublishService,
  useUnpublishService,
} from '@/features/creator-onboarding/api/use-creator-services';
import { useState } from 'react';
import { FileText, Edit2 } from 'lucide-react';

interface ServiceDetailPageProps {
  params: {
    id: string;
  };
}

export default function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { toast } = useToast();
  const { data: service, isLoading } = useServiceOffering(params.id);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">服务未找到</p>
            <Link href="/creator/services" className="mt-4 block">
              <Button variant="outline">返回服务列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{service.title}</h1>
          <Badge className="mt-2">
            {service.state === 'published'
              ? '已发布'
              : service.state === 'draft'
                ? '草稿'
                : '已下架'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href={`/creator/services/${service.id}/edit`}>
            <Button variant="outline">
              <Edit2 className="w-4 h-4 mr-2" />
              编辑
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">服务描述</p>
              <p className="whitespace-pre-wrap mt-1">{service.description}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">可用性</p>
              <p className="whitespace-pre-wrap mt-1">
                {service.availabilityDescription}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">预约要求</p>
              <p className="whitespace-pre-wrap mt-1">
                {service.requestInstructions}
              </p>
            </div>

            {service.appearance?.priceRangeMin !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">价格范围</p>
                <p className="mt-1">
                  {service.appearance.currency ||'CNY'} {service.appearance.priceRangeMin} -{' '}
                  {service.appearance.priceRangeMax}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 发布状态和操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">发布状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                {service.state === 'draft'
                  ? '此服务还未发布。消费者无法看到。发布后，消费者将能够发现和预约此服务。'
                  : service.state === 'published'
                    ? '此服务已发布。消费者可以搜索并预约此服务。'
                    : '此服务已下架。消费者无法看到。'}
              </p>

              <div className="flex gap-2">
                {service.state === 'draft' && (
                  <Button onClick={() => setShowPublishDialog(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    发布服务
                  </Button>
                )}
                {service.state === 'published' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm('确定要下架这个服务吗？')) {
                        setShowUnpublishDialog(true);
                      }
                    }}
                  >
                    下架服务
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 返回按钮 */}
        <div>
          <Link href="/creator/services">
            <Button variant="outline">返回服务列表</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
