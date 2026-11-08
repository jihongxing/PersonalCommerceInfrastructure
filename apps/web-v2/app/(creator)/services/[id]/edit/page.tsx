import { ServiceForm } from '@/features/creator-onboarding/components/service-form';

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">编辑服务</h1>
        <p className="text-muted-foreground mt-2">
          更新您的服务信息
        </p>
      </div>

      <ServiceForm serviceId={id} />
    </div>
  );
}
