import { ServiceForm } from '@/features/creator-onboarding/components/service-form';

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>编辑服务</h1>
          <p>更新您的服务信息</p>
        </div>
      </header>

      <ServiceForm serviceId={id} />
    </div>
  );
}
