import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Zap } from 'lucide-react';

export default function OnboardingWelcomePage() {
  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto">
        {/* 欢迎头部 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            欢迎加入 Personal Commerce
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            为被平台封禁的 Creator 提供永不失效的商业身份
          </p>
          <p className="text-sm text-muted-foreground">
            5 分钟快速设置，开始接收预约
          </p>
        </div>

        {/* 快速开始流程 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>开始使用，只需 5 步</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">创建商业身份</h3>
                  <p className="text-sm text-muted-foreground">
                    告诉消费者您是谁和您做什么
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">添加能力标签</h3>
                  <p className="text-sm text-muted-foreground">
                    描述您的专业领域和特长
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">创建服务</h3>
                  <p className="text-sm text-muted-foreground">
                    定义您提供的具体服务和要求
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">发布服务</h3>
                  <p className="text-sm text-muted-foreground">
                    让消费者发现和预约您的服务
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  5
                </div>
                <div>
                  <h3 className="font-semibold">管理预约</h3>
                  <p className="text-sm text-muted-foreground">
                    审核、确认预约，获得履约码
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 关键特性 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              为什么选择我们
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">永不失效的商业身份</p>
                  <p className="text-sm text-muted-foreground">
                    您的 C 号商务引用不会被平台封禁
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">完全隐私保护</p>
                  <p className="text-sm text-muted-foreground">
                    您的真实身份信息不会被暴露
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">实时预约管理</p>
                  <p className="text-sm text-muted-foreground">
                    立即接收和管理来自消费者的预约
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">履约码验证</p>
                  <p className="text-sm text-muted-foreground">
                    生成唯一的履约码，确保交易安全
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 立即开始按钮 */}
        <div className="flex gap-3 justify-center">
          <Link href="/profile/edit" className="flex-1 max-w-xs">
            <Button size="lg" className="w-full">
              立即开始
            </Button>
          </Link>
          <Link href="/" className="flex-1 max-w-xs">
            <Button size="lg" variant="outline" className="w-full">
              返回首页
            </Button>
          </Link>
        </div>

        {/* 帮助文本 */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          有任何问题？随时返回编辑您的信息
        </p>
      </div>
    </div>
  );
}
