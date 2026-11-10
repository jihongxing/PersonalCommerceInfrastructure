import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingWelcomePage() {
  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>开始创建您的主页</h1>
          <p>先完善资料，再添加能力和服务</p>
        </div>
      </header>
      <section
        className="creator-list-surface max-w-2xl"
        aria-labelledby="onboarding-profile-title"
      >
        <h2 id="onboarding-profile-title" className="text-lg font-semibold">
          建立创作者资料
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          使用您的名称和简介开始，之后可以随时编辑。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="min-h-11">
            <Link href="/profile/edit">
              完善资料 <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
