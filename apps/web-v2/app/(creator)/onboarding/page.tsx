'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorIdentity } from '@/features/creator-onboarding/api/use-creator-identity';

/**
 * Onboarding 入口页面
 * 逻辑：
 * - 如果已有身份 → 重定向到 /creator/profile
 * - 如果没有身份 → 重定向到 /creator/onboarding/welcome
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: identity, isLoading } = useCreatorIdentity();

  useEffect(() => {
    if (!isLoading) {
      if (identity) {
        // 已有身份，重定向到个人资料页
        router.push('/creator/profile');
      } else {
        // 没有身份，重定向到欢迎页
        router.push('/creator/onboarding/welcome');
      }
    }
  }, [isLoading, identity, router]);

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
