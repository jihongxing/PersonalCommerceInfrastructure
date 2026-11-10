import { IdentityForm } from '@/features/creator-onboarding/components/identity-form';

export const instant = false;

export default function EditProfilePage() {
  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>编辑个人资料</h1>
          <p>更新您的商业身份信息</p>
        </div>
      </header>

      <IdentityForm />
    </div>
  );
}
