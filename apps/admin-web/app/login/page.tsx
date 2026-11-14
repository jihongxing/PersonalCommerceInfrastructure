'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function OperationsLoginPage() {
  const router = useRouter();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/operations/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ loginIdentifier, password }),
      });
      if (!response.ok) {
        setError('登录信息无法验证，请检查后重试。');
        return;
      }
      setPassword('');
      router.replace('/');
      router.refresh();
    } catch {
      setError('暂时无法连接运营服务，请稍后重试。');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <p className="eyebrow">PCI Operations</p>
        <h1 id="login-heading">登录运营工作台</h1>
        <p className="login-help">使用已初始化的 Operations Account 登录。</p>
        <form onSubmit={(event) => void submit(event)}>
          <label>
            登录标识
            <input
              autoComplete="username"
              required
              value={loginIdentifier}
              onChange={(event) => setLoginIdentifier(event.target.value)}
            />
          </label>
          <label>
            密码
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error === null ? null : (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={pending}>
            {pending ? '正在验证…' : '登录'}
          </button>
        </form>
      </section>
    </main>
  );
}
