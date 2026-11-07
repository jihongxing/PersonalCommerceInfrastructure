'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/context';

export default function ForgotPasswordPage() {
  const { forgotPassword, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // 表单验证
    if (!email) {
      setLocalError('邮箱不能为空');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('邮箱格式无效');
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      // 错误已在 hook 中处理
      console.error('Forgot password failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>检查您的邮箱</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  如果该邮箱已注册，您将很快收到密码重置链接。
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>• 检查您的收件箱</p>
                <p>• 如果收不到邮件，检查垃圾邮件文件夹</p>
                <p>• 重置链接有效期为 1 小时</p>
              </div>

              <div className="flex gap-3">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    返回登陆
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                >
                  返回重置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">重置密码</h1>
          <p className="mt-2 text-slate-600">
            输入您的邮箱地址，我们将发送重置链接
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>忘记密码</CardTitle>
            <CardDescription>
              我们会将重置链接发送到您的邮箱
            </CardDescription>
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

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '发送中...' : '发送重置链接'}
              </Button>

              {/* 返回登陆 */}
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  返回登陆
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
