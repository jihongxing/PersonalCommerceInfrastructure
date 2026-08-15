import { Surface } from '@/components/ui/surface';
import { routeCopy } from '@/content/user-facing-copy';

export default function PublicPage() {
  return (
    <main className="ds-public-placeholder ds-page">
      <Surface className="ds-page__surface">
        <p className="ds-eyebrow">{routeCopy.public.eyebrow}</p>
        <h1 className="ds-heading-page">{routeCopy.public.title}</h1>
        <p className="ds-body-secondary ds-measure">{routeCopy.public.description}</p>
      </Surface>
    </main>
  );
}
