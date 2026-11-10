import Link from 'next/link';

export const instant = false;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link href="/" className="creator-brand">
          <span className="creator-brand-mark">C</span>
          <span>创作者主页</span>
        </Link>
        <Link className="public-login" href="/auth/login">
          创作者登录
        </Link>
      </header>
      <main className="public-main">{children}</main>
    </div>
  );
}
