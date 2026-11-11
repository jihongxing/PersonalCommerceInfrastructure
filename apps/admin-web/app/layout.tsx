import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '../components/admin-shell';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'PCI Operations · 运营管理', template: '%s · PCI Operations' },
  description: 'Personal Commerce Infrastructure 运营管理工作台。运营功能尚未开放。',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
