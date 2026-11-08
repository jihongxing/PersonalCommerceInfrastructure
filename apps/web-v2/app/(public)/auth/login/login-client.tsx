'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/context';
import { UnauthenticatedRoute } from '@/components/auth/protected-route';

function LoginContent() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // 表单验证
    if (!email || !password) {
      setLocalError('邮箱和密码不能为空');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('邮箱格式无效');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // 登陆成功，重定向到仪表板
      router.push('/dashboard');
    } catch (err) {
      // 错误已在 hook 中处理
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">欢迎回来</h1>
          <p className="mt-2 text-slate-600">登陆您的商业账户</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>登陆</CardTitle>
            <CardDescription>使用您的邮箱和密码登陆</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 错误提示 */}
              {displayError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{displayError}</p>
                </div>
              )}

              {/* 邮箱输入 */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  邮箱地址
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    密码
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    忘记密码？
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* 提交按钮 */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '登陆中...' : '登陆'}
              </Button>

              {/* 分隔符 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">或</span>
                </div>
              </div>

              {/* 注册链接 */}
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  没有账户？{' '}
                  <Link
                    href="/auth/signup"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    现在注册
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 底部提示 */}
        <p className="mt-6 text-center text-xs text-slate-500">
          登陆即代表您同意我们的{' '}
          <Link href="/terms" className="text-slate-600 hover:text-slate-700 underline">
            服务条款
          </Link>{' '}
          和{' '}
          <Link href="/privacy" className="text-slate-600 hover:text-slate-700 underline">
            隐私政策
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginClient() {
  return (
    <UnauthenticatedRoute>
      <LoginContent />
    </UnauthenticatedRoute>
  );
}
