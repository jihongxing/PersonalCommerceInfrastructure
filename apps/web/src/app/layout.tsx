import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Commerce',
  description: '个人商业服务工作台',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-root">{children}</div>
      </body>
    </html>
  );
}
