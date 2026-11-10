'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Award, BriefcaseBusiness, Home, Inbox, LogOut, UserRound } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/auth/context';

const navigation = [
  { href: '/dashboard', label: '工作台', icon: Home },
  { href: '/profile', label: '资料', icon: UserRound },
  { href: '/capabilities', label: '能力', icon: Award },
  { href: '/services', label: '服务', icon: BriefcaseBusiness },
  { href: '/requests', label: '请求', icon: Inbox },
];

function CreatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, error } = useAuth();

  async function handleLogout() {
    try {
      await logout();
      router.push('/auth/login');
    } catch {
      // The authentication context exposes the error to the user.
    }
  }

  const links = navigation.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        className={active ? 'active' : undefined}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={20} aria-hidden="true" />
        <span>{label}</span>
      </Link>
    );
  });

  return (
    <div className="creator-shell">
      <aside className="creator-sidebar">
        <Link className="creator-brand" href="/dashboard">
          <span className="creator-brand-mark">C</span>
          <span>
            创作者工作台<small>CREATOR WORKSPACE</small>
          </span>
        </Link>
        <nav className="creator-side-nav" aria-label="创作者导航">
          {links}
        </nav>
        <Link className="creator-home-link" href="/">
          返回公开查找
        </Link>
      </aside>
      <div className="creator-content">
        <header className="creator-topbar">
          <span>创作者工作台</span>
          <div className="creator-account">
            <Link href="/profile" className="creator-account-name" title={user?.email}>
              {user?.email || '个人资料'}
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="creator-logout"
              title="退出登录"
              aria-label="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        {error && (
          <p role="alert" className="creator-auth-error">
            退出登录失败：{error}
          </p>
        )}
        <main className="creator-main">{children}</main>
      </div>
      <nav className="creator-mobile-nav" aria-label="创作者导航">
        {links}
      </nav>
    </div>
  );
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <CreatorShell>{children}</CreatorShell>
    </ProtectedRoute>
  );
}
