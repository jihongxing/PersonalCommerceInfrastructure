import { EditCapabilityForm } from '@/features/creator-onboarding/components/edit-capability-form';

interface EditCapabilityPageProps {
  params: {
    id: string;
  };
}

export default function EditCapabilityPage({
  params,
}: EditCapabilityPageProps) {
  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">编辑能力</h1>
        <p className="text-muted-foreground mt-2">
          更新您的能力信息
        </p>
      </div>

      <EditCapabilityForm capabilityId={params.id} />
    </div>
  );
}
