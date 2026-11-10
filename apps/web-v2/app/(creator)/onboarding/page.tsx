'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCreatorIdentity } from '@/features/creator-onboarding/api/use-creator-identity';
import { ApiError } from '@/lib/api/client';

/**
 * Onboarding 入口页面
 * 逻辑：
 * - 如果已有身份 → 重定向到 /profile
 * - 如果没有身份 → 重定向到 /onboarding/welcome
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: identity, isLoading, error, refetch } = useCreatorIdentity();

  useEffect(() => {
    if (!isLoading) {
      if (identity) {
        // 已有身份，重定向到个人资料页
        router.push('/profile');
      } else if (error instanceof ApiError && error.status === 404) {
        // 没有身份，重定向到欢迎页
        router.push('/onboarding/welcome');
      }
    }
  }, [isLoading, identity, error, router]);

  if (error && (!(error instanceof ApiError) || error.status !== 404)) {
    return (
      <div className="p-8">
        <p role="alert">无法加载商业身份，请重试。</p>
        <Button className="mt-4" onClick={() => void refetch()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
