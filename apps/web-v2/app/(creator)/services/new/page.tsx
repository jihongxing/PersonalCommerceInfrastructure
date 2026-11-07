import { ServiceForm } from '@/features/creator-onboarding/components/service-form';

export default function NewServicePage() {
  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">创建新服务</h1>
        <p className="text-muted-foreground mt-2">
          定义您提供的服务内容和要求
        </p>
      </div>

      <ServiceForm />
    </div>
  );
}
