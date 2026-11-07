'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 受保护路由组件
 * 未认证用户将被重定向到登陆页面
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) {
      return;
    }

    // 如果未认证，重定向到登陆页面
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // 加载中显示骨架屏
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // 未认证状态
  if (!isAuthenticated) {
    return null;
  }

  // 已认证，渲染子组件
  return <>{children}</>;
}

/**
 * 未认证路由组件
 * 已认证用户将被重定向到仪表板
 */
export function UnauthenticatedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) {
      return;
    }

    // 如果已认证，重定向到仪表板
    if (isAuthenticated) {
      router.push('/creator/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  // 加载中显示骨架屏
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // 已认证状态
  if (isAuthenticated) {
    return null;
  }

  // 未认证，渲染子组件
  return <>{children}</>;
}
