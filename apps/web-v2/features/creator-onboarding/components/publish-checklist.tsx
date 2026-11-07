'use client';

import { Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceOffering } from '../api/use-creator-services';

interface PublishChecklistProps {
  service: ServiceOffering;
}

/**
 * 发布前验证清单组件
 * 检查服务是否满足发布条件
 */
export function PublishChecklist({ service }: PublishChecklistProps) {
  const checks = [
    {
      id: 'title',
      label: '服务名称',
      description: '需要填写服务名称',
      passed: !!service.title && service.title.length > 0,
    },
    {
      id: 'description',
      label: '服务描述',
      description: '需要填写详细描述',
      passed: !!service.description && service.description.length > 0,
    },
    {
      id: 'capabilities',
      label: '关联能力',
      description: '需要关联至少一个能力',
      passed: !!service.capabilityIds && service.capabilityIds.length > 0,
    },
    {
      id: 'availability',
      label: '可用性描述',
      description: '需要说明服务何时可用',
      passed: !!service.availabilityDescription && service.availabilityDescription.length > 0,
    },
    {
      id: 'instructions',
      label: '请求说明',
      description: '需要说明消费者如何请求此服务',
      passed: !!service.requestInstructions && service.requestInstructions.length > 0,
    },
  ];

  const allPassed = checks.every((check) => check.passed);
  const passedCount = checks.filter((check) => check.passed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">发布前检查清单</CardTitle>
          <Badge variant={allPassed ? 'default' : 'secondary'}>
            {passedCount} / {checks.length} 完成
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className="flex items-start gap-3 pb-3 border-b last:pb-0 last:border-b-0"
            >
              <div className="flex-shrink-0 mt-1">
                {check.passed ? (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100">
                    <AlertCircle className="w-3 h-3 text-yellow-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{check.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {check.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {allPassed ? (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            ✓ 所有条件已满足，可以发布服务
          </div>
        ) : (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            ⚠ 请完成所有条件后再发布
          </div>
        )}
      </CardContent>
    </Card>
  );
}
