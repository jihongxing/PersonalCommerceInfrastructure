import { EditCapabilityForm } from '@/features/creator-onboarding/components/edit-capability-form';

interface EditCapabilityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCapabilityPage({ params }: EditCapabilityPageProps) {
  const { id } = await params;
  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>编辑能力</h1>
          <p>更新您的能力信息</p>
        </div>
      </header>

      <EditCapabilityForm capabilityId={id} />
    </div>
  );
}
