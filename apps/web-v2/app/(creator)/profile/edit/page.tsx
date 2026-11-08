import { IdentityForm } from '@/features/creator-onboarding/components/identity-form';

export const instant = false;

export default function EditProfilePage() {
  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">编辑个人资料</h1>
        <p className="text-muted-foreground mt-2">
          更新您的商业身份信息
        </p>
      </div>

      <IdentityForm />
    </div>
  );
}
