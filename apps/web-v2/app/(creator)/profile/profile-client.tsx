'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreatorIdentity } from '@/features/creator-onboarding/api/use-creator-identity';
import { ApiError } from '@/lib/api/client';
import { HomepageManagement } from './homepage-management';

type ProfileTab = 'profile' | 'public';

function ProfileDetails() {
  const { data: identity, isLoading, error, refetch } = useCreatorIdentity();

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
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
    return (
      <div role="alert" className="space-y-3">
        <p>商业身份加载失败</p>
        <Button variant="outline" onClick={() => void refetch()}>
          重试
        </Button>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4 text-muted-foreground">
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
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>个人资料</CardTitle>
          <Link href="/profile/edit">
            <Button variant="outline">编辑</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-4 font-semibold">基本信息</h3>
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

          <div>
            <p className="mb-2 text-sm text-muted-foreground">状态</p>
            <Badge variant={identity.state === 'published' ? 'default' : 'secondary'}>
              {identity.state === 'published' ? '已发布' : '草稿'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">下一步</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            继续设置您的能力和服务，以便消费者发现您。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/capabilities">
              <Button variant="outline">管理能力</Button>
            </Link>
            <Link href="/services">
              <Button>创建服务</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: ProfileTab = requestedTab === 'public' ? 'public' : 'profile';

  function changeTab(value: string) {
    const nextTab = value as ProfileTab;
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'public') params.set('tab', 'public');
    else params.delete('tab');
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={changeTab} className="space-y-6">
      <TabsList aria-label="个人资料设置">
        <TabsTrigger value="profile">资料</TabsTrigger>
        <TabsTrigger value="public">对外主页</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <ProfileDetails />
      </TabsContent>
      <TabsContent value="public">
        <HomepageManagement />
      </TabsContent>
    </Tabs>
  );
}

export default function ProfileClient() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">个人资料</h1>
        <p className="mt-2 text-muted-foreground">管理您的商业身份信息和对外主页</p>
      </div>

      <Suspense
        fallback={
          <div className="max-w-2xl">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="mt-6 h-48 w-full" />
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </div>
  );
}
