'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { SessionRestoreError } from '@/components/auth/protected-route';

export default function Home() {
  const router = useRouter();
  const { isLoading, isAuthenticated, restoreError } = useAuth();

  useEffect(() => {
    if (!isLoading && !restoreError) {
      router.replace(isAuthenticated ? '/dashboard' : '/auth/login');
    }
  }, [router, isLoading, isAuthenticated, restoreError]);

  if (restoreError) return <SessionRestoreError />;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-500">正在验证登录状态...</p>
      </div>
    </div>
  );
}
