export const instant = false;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* 简单的页头 */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Personal Commerce</h1>
        </div>
      </header>

      {/* 主内容区 */}
      <main>{children}</main>

      {/* 简单的页脚 */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>为被平台封禁的 Creator 提供永不失效的商业身份</p>
        </div>
      </footer>
    </div>
  );
}
