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
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <nav className="flex items-center justify-between gap-4 border-b pb-5">
        <span className="font-semibold">Personal Commerce</span>
        <Link
          className="text-sm underline underline-offset-4"
          href={isAuthenticated ? '/dashboard' : '/auth/login'}
        >
          {isAuthenticated ? '进入工作台' : '创作者登录'}
        </Link>
      </nav>
      <section className="py-12">
        <h1 className="text-2xl font-semibold">查找商业主页</h1>
        <p className="mt-3 text-sm text-muted-foreground">输入创作者分享的 C 号</p>
        <form
          className="mt-6 flex flex-wrap gap-3"
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
          <label htmlFor="reference" className="sr-only">
            C 号
          </label>
          <Input
            id="reference"
            className="min-w-0 flex-1 font-mono"
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
            查找
          </Button>
        </form>
        {error && (
          <p id="reference-error" role="alert" className="mt-2 text-sm text-destructive">
            C 号格式不正确，请检查后重试。
          </p>
        )}
      </section>
    </main>
  );
}
