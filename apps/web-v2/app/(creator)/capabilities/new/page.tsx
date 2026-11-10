import { CapabilityForm } from '@/features/creator-onboarding/components/capability-form';

export default function NewCapabilityPage() {
  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>添加能力</h1>
          <p>描述您的专业能力和特长</p>
        </div>
      </header>

      <CapabilityForm />
    </div>
  );
}
