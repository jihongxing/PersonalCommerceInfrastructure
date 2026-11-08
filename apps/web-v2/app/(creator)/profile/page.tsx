'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorIdentity } from '@/features/creator-onboarding/api/use-creator-identity';
import { ApiError } from '@/lib/api/client';

function ProfileContent() {
  const { data: identity, isLoading, error, refetch } = useCreatorIdentity();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !(error instanceof ApiError && error.code === 'commerce_identity_not_found')) {
    return <div role="alert"><p>商业身份加载失败</p><Button variant="outline" onClick={() => refetch()}>重试</Button></div>;
  }
  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              您还没有创建商业身份。立即创建以开始销售服务。
            </p>
            <Link href="/profile/edit">
              <Button>创建身份</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>个人资料</CardTitle>
          <Link href="/profile/edit">
            <Button variant="outline">编辑</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="font-semibold mb-4">基本信息</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">名字</p>
                <p className="font-medium">{identity.profile.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">简介</p>
                <p className="whitespace-pre-wrap">{identity.profile.bio}</p>
              </div>
              {identity.profile.location && (
                <div>
                  <p className="text-sm text-muted-foreground">所在地</p>
                  <p>{identity.profile.location}</p>
                </div>
              )}
            </div>
          </div>

          {/* 状态 */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">状态</p>
            <Badge
              variant={
                identity.state === 'published' ? 'default' : 'secondary'
              }
            >
              {identity.state === 'published' ? '已发布' : '草稿'}
            </Badge>
          </div>

        </CardContent>
      </Card>

      {/* 下一步引导 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">下一步</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            继续设置您的能力和服务，以便消费者发现您。
          </p>
          <div className="flex gap-3">
            <Link href="/capabilities">
              <Button variant="outline" className="flex-1">
                管理能力
              </Button>
            </Link>
            <Link href="/services">
              <Button className="flex-1">
                创建服务
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">个人资料</h1>
        <p className="text-muted-foreground mt-2">
          管理您的商业身份信息
        </p>
      </div>

      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-48 w-full" />
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </div>
  );
}
