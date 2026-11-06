import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  onSelect?: (id: string) => void;
}

export function ServiceCard({
  id,
  title,
  description,
  onSelect,
}: ServiceCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-3">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {/* 未来可以添加价格、图片等信息 */}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onSelect?.(id)} 
          className="w-full"
          variant="default"
        >
          查看详情
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * 服务列表空状态
 */
export function ServiceListEmpty() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">
          暂无可用服务
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Creator 正在准备服务，请稍后再来查看
        </p>
      </CardContent>
    </Card>
  );
}
