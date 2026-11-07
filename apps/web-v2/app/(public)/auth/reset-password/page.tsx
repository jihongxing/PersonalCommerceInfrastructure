'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/context';

/**
 * 密码强度检查
 */
function getPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('至少 8 个字符');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('包含大写字母');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('包含小写字母');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('包含数字');
  }

  if (/[!@#$%^&*]/.test(password)) {
    score++;
  } else {
    feedback.push('包含特殊字符 (!@#$%^&*)');
  }

  return { score, feedback };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const { score, feedback } = getPasswordStrength(password);
  const strengthLabels = ['', '弱', '中等', '强', '非常强', '极强'];
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-green-600'];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${strengthColors[score]}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-600">
          {strengthLabels[score]}
        </span>
      </div>

      {feedback.length > 0 && (
        <ul className="text-xs text-slate-600 space-y-1">
          {feedback.map((item, idx) => (
            <li key={idx} className="flex items-center gap-1">
              <span className="text-slate-400">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, error, clearError } = useAuth();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLocalError('无效的重置链接');
    }
  }, [token]);

  const passwordStrength = getPasswordStrength(password);
  const isPasswordStrong = passwordStrength.score >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!token) {
      setLocalError('无效的重置链接');
      return;
    }

    // 表单验证
    if (!password || !confirmPassword) {
      setLocalError('密码和确认密码不能为空');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('两次输入的密码不一致');
      return;
    }

    if (!isPasswordStrong) {
      setLocalError('密码不符合强度要求');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password, confirmPassword);
      setIsSuccess(true);
    } catch (err) {
      // 错误已在 hook 中处理
      console.error('Reset password failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>无效的链接</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                重置链接无效或已过期。请重新请求密码重置。
              </p>

              <div className="flex gap-3">
                <Link href="/auth/forgot-password" className="flex-1">
                  <Button className="w-full">
                    重新请求
                  </Button>
                </Link>
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    返回登陆
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>密码已重置</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-900">
                  您的密码已成功重置。请使用新密码登陆。
                </p>
              </div>

              <Link href="/auth/login">
                <Button className="w-full">
                  返回登陆
                </Button>
              </Link>
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
            输入您的新密码
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>创建新密码</CardTitle>
            <CardDescription>
              输入一个强密码以保护您的账户
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

              {/* 新密码输入 */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  新密码
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <PasswordStrengthIndicator password={password} />
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600">密码不匹配</p>
                )}
              </div>

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isPasswordStrong}
              >
                {isLoading ? '重置中...' : '重置密码'}
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
