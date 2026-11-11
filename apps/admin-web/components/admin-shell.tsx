'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { sections } from '../lib/sections';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
            基础框架<small>运营功能尚未开放</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Personal Commerce Infrastructure</span>
          <span className="session-state">身份验证尚未接入</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer>PCI Operations · 独立运营管理工作台</footer>
      </div>
    </div>
  );
}
