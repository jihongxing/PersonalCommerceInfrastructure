import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { commonCopy, routeCopy } from '@/content/user-facing-copy';

export default function HomePage() {
  return (
    <main className="ds-page ds-page--centered">
      <section className="ds-introduction">
        <p className="ds-eyebrow">{routeCopy.home.eyebrow}</p>
        <h1 className="ds-heading-page">{routeCopy.home.title}</h1>
        <p className="ds-body-secondary ds-measure">{routeCopy.home.description}</p>
      </section>
      <nav className="ds-navigation-grid" aria-label={commonCopy.primaryNavigationLabel}>
        <Button asChild size="card" variant="outline">
          <Link className="ds-navigation-card" href="/creator">
            <strong>{commonCopy.creator}</strong>
            <span>{routeCopy.home.creatorCard}</span>
          </Link>
        </Button>
        <Button asChild size="card" variant="outline">
          <Link className="ds-navigation-card" href="/public">
            <strong>{commonCopy.publicEntry}</strong>
            <span>{routeCopy.home.publicCard}</span>
          </Link>
        </Button>
        <Button asChild size="card" variant="outline">
          <Link className="ds-navigation-card" href="/customer">
            <strong>{commonCopy.customer}</strong>
            <span>{routeCopy.home.customerCard}</span>
          </Link>
        </Button>
      </nav>
    </main>
  );
}
