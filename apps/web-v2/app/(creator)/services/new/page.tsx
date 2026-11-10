import { ServiceForm } from '@/features/creator-onboarding/components/service-form';

export default function NewServicePage() {
  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>创建服务</h1>
          <p>定义您提供的服务内容和要求</p>
        </div>
      </header>

      <ServiceForm />
    </div>
  );
}
