import { Surface } from '@/components/ui/surface';
import { routeCopy } from '@/content/user-facing-copy';

export default function CustomerPage() {
  return (
    <main className="ds-page">
      <Surface className="ds-page__surface">
        <p className="ds-eyebrow">{routeCopy.customer.eyebrow}</p>
        <h1 className="ds-heading-page">{routeCopy.customer.title}</h1>
        <p className="ds-body-secondary ds-measure">{routeCopy.customer.description}</p>
      </Surface>
    </main>
  );
}
