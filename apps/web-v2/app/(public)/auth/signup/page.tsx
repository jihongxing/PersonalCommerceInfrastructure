'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/context';
import { UnauthenticatedRoute } from '@/components/auth/protected-route';

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

export default function SignupPage() {
  const router = useRouter();
  const { signup, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const passwordStrength = getPasswordStrength(password);
  const isPasswordStrong = passwordStrength.score >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // 表单验证
    if (!email || !name || !password || !confirmPassword) {
      setLocalError('所有字段都不能为空');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('邮箱格式无效');
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
      await signup(email, password, name);
      // 注册成功，重定向到仪表板
      router.push('/creator/dashboard');
    } catch (err) {
      // 错误已在 hook 中处理
      console.error('Signup failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">开始使用</h1>
          <p className="mt-2 text-slate-600">
            创建您的商业账户
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>创建账户</CardTitle>
            <CardDescription>
              注册以管理您的服务和能力
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

              {/* 名称输入 */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  名称
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="你的名称"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  密码
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
                {isLoading ? '注册中...' : '创建账户'}
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

              {/* 登陆链接 */}
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  已有账户？{' '}
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    现在登陆
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 底部提示 */}
        <p className="mt-6 text-center text-xs text-slate-500">
          注册即代表您同意我们的{' '}
          <Link href="/terms" className="text-slate-600 hover:text-slate-700 underline">
            服务条款
          </Link>
          {' '}和{' '}
          <Link href="/privacy" className="text-slate-600 hover:text-slate-700 underline">
            隐私政策
          </Link>
        </p>
      </div>
    </div>
  );
}
