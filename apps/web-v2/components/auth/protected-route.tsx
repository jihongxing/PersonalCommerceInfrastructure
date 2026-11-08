'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function SessionRestoreError() {
  const { retryRestore } = useAuth();
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-48 max-w-md flex-col items-start justify-center gap-3 px-6 py-8"
    >
      <p className="font-medium">无法验证登录状态</p>
      <p className="text-sm text-muted-foreground">请检查网络或稍后重试。</p>
      <Button onClick={retryRestore}>重试</Button>
    </div>
  );
}

/**
 * 受保护路由组件
 * 未认证用户将被重定向到登陆页面
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthenticated, restoreError } = useAuth();

  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading || restoreError) {
      return;
    }

    // 如果未认证，重定向到登陆页面
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, restoreError, router]);

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

  if (restoreError) return <SessionRestoreError />;

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
  const { isLoading, isAuthenticated, restoreError } = useAuth();

  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading || restoreError) {
      return;
    }

    // 如果已认证，重定向到仪表板
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, restoreError, router]);

  // 加载中显示骨架屏
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (restoreError) return <SessionRestoreError />;

  // 已认证状态
  if (isAuthenticated) {
    return null;
  }

  // 未认证，渲染子组件
  return <>{children}</>;
}
