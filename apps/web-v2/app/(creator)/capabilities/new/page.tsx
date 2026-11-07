import { CapabilityForm } from '@/features/creator-onboarding/components/capability-form';

export default function NewCapabilityPage() {
  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">添加能力</h1>
        <p className="text-muted-foreground mt-2">
          描述您的专业能力和特长
        </p>
      </div>

      <CapabilityForm />
    </div>
  );
}
