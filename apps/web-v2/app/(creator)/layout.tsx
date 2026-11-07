import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Creator 专用页头 */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Creator Studio</h1>
            <p className="text-xs text-muted-foreground mt-1">
              管理您的商业身份和服务
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost">返回首页</Button>
          </Link>
        </div>
      </header>

      {/* Creator 导航菜单 */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4 flex gap-8 text-sm">
          <Link href="/creator/onboarding" className="py-3 px-2 border-b-2 border-transparent hover:border-foreground transition-colors">
            入门
          </Link>
          <Link href="/creator/profile" className="py-3 px-2 border-b-2 border-transparent hover:border-foreground transition-colors">
            个人资料
          </Link>
          <Link href="/creator/capabilities" className="py-3 px-2 border-b-2 border-transparent hover:border-foreground transition-colors">
            能力
          </Link>
          <Link href="/creator/services" className="py-3 px-2 border-b-2 border-transparent hover:border-foreground transition-colors">
            服务
          </Link>
          <Link href="/dashboard" className="py-3 px-2 border-b-2 border-transparent hover:border-foreground transition-colors">
            预约审核
          </Link>
        </div>
      </nav>

      {/* 主内容区 */}
      <main>{children}</main>

      {/* 页脚 */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Personal Commerce - Creator Dashboard</p>
        </div>
      </footer>
    </div>
  );
}
