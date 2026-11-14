'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { sections } from '../lib/sections';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  return (
    <AuthenticatedAdminShell key={pathname} pathname={pathname}>
      {children}
    </AuthenticatedAdminShell>
  );
}

function AuthenticatedAdminShell({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);
  const [sessionError, setSessionError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/operations/auth/session', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error('Session unavailable');
        return (await response.json()) as AdminSession;
      })
      .then((nextSession) => {
        if (cancelled) return;
        setSession(nextSession);
        if (nextSession === null) router.replace('/login');
      })
      .catch(() => {
        if (!cancelled) setSessionError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

  if (sessionError)
    return (
      <main>
        <p role="alert">暂时无法验证登录状态，请重试。</p>
        <button
          onClick={() => {
            setSession(undefined);
            setSessionError(false);
            setAttempt(attempt + 1);
          }}
        >
          重试
        </button>
      </main>
    );
  if (!session)
    return (
      <main>
        <p role="status">正在验证 Session</p>
      </main>
    );

  const logout = async () => {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const response = await fetch('/api/operations/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (response.status !== 204) throw new Error('Logout not confirmed');
      setSession(null);
      router.replace('/login');
      router.refresh();
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="PCI 运营管理首页">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            PCI<small>Operations</small>
          </span>
        </Link>
        <p className="nav-heading">运营管理</p>
        <nav aria-label="运营管理导航">
          {sections.map((section) => {
            const href = section.slug ? '/' + section.slug : '/';
            return (
              <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
                {section.label}
                <span aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" aria-hidden="true" />
          <div>
            只读数据已开放<small>Catalog / Audit</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Personal Commerce Infrastructure</span>
          <span className="session-state">
            {session.accountId}
            <button
              className="logout-button"
              type="button"
              disabled={loggingOut}
              onClick={() => void logout()}
            >
              {loggingOut ? '正在退出…' : '退出'}
            </button>
          </span>
        </header>
        {logoutError && <p role="alert">退出未确认，服务端登录可能仍有效。请重试退出。</p>}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer>PCI Operations · 独立运营管理工作台</footer>
      </div>
    </div>
  );
}

interface AdminSession {
  readonly principalId: string;
  readonly accountId: string;
  readonly sessionId: string;
  readonly permissions: readonly string[];
}
