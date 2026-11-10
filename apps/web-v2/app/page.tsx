'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeReference } from '@/lib/public-homepage';
import { useAuth } from '@/lib/auth/context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  return (
    <div className="public-shell">
      <nav className="public-header">
        <Link href="/" className="creator-brand">
          <span className="creator-brand-mark">C</span>
          <span>创作者主页</span>
        </Link>
        <Link className="public-login" href={isAuthenticated ? '/dashboard' : '/auth/login'}>
          {isAuthenticated ? '进入工作台' : '创作者登录'}
        </Link>
      </nav>
      <main className="lookup-main">
        <h1 className="text-2xl font-semibold">查找创作者</h1>
        <p className="mt-3 text-sm text-muted-foreground">通过 C 号访问创作者的公开主页</p>
        <form
          className="mt-6 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const reference = normalizeReference(value);
            if (!reference) {
              setError(true);
              return;
            }
            router.push(`/r/${reference}`);
          }}
        >
          <label htmlFor="reference" className="text-sm font-medium">
            C 号
          </label>
          <Input
            id="reference"
            className="min-w-0 font-mono"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(false);
            }}
            placeholder="XXXXXX-XXXXXX-XXXXXX"
            aria-invalid={error}
            aria-describedby={error ? 'reference-error' : undefined}
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            查找主页
          </Button>
        </form>
        {error && (
          <p id="reference-error" role="alert" className="mt-2 text-sm text-destructive">
            C 号格式不正确，请检查后重试。
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          C 号是公开定位标识，不代表身份或资质认证。
        </p>
      </main>
    </div>
  );
}
