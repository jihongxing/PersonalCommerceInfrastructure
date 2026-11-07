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
            <h1 className="text-lg font-semibold">Creator Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">
              预约管理系统
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost">返回首页</Button>
          </Link>
        </div>
      </header>

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
