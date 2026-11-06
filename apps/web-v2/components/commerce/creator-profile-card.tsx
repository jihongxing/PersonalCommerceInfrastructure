import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface CreatorProfileCardProps {
  displayName: string;
  commerceReference: string;
}

export function CreatorProfileCard({
  displayName,
  commerceReference,
}: CreatorProfileCardProps) {
  // 获取 displayName 的首字母作为头像占位符
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // 格式化 C号 显示（添加分隔符）
  const formattedRef = commerceReference.match(/.{1,6}/g)?.join('-') || commerceReference;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-xs">
                {formattedRef}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          欢迎来到 {displayName} 的服务页面
        </p>
      </CardContent>
    </Card>
  );
}
