import { ServiceForm } from '@/features/creator-onboarding/components/service-form';

interface EditServicePageProps {
  params: {
    id: string;
  };
}

export default function EditServicePage({ params }: EditServicePageProps) {
  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">编辑服务</h1>
        <p className="text-muted-foreground mt-2">
          更新您的服务信息
        </p>
      </div>

      <ServiceForm serviceId={params.id} />
    </div>
  );
}
