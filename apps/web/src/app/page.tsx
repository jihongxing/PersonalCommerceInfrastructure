import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { commonCopy, routeCopy } from '@/content/user-facing-copy';

export default function HomePage() {
  return (
    <main className="ds-home-page">
      <header className="ds-site-header">
        <Link className="ds-brand" href="/">
          <span className="ds-brand-mark" aria-hidden="true" />
          <span>{commonCopy.brand}</span>
        </Link>
        <span className="ds-header-note">{commonCopy.workspace}</span>
      </header>
      <section className="ds-home-hero">
        <div className="ds-home-hero__copy">
          <p className="ds-eyebrow">{routeCopy.home.eyebrow}</p>
          <h1 className="ds-home-title">{routeCopy.home.title}</h1>
          <p className="ds-home-description">{routeCopy.home.description}</p>
          <Button asChild>
            <Link href="/creator">{routeCopy.home.primaryAction}</Link>
          </Button>
        </div>
        <div className="ds-home-preview" aria-label={routeCopy.home.previewLabel}>
          <div className="ds-home-preview__topline">
            <span>{routeCopy.home.previewTitle}</span>
            <span className="ds-status-pill ds-status-pill--draft">
              {routeCopy.home.previewStatus}
            </span>
          </div>
          <p className="ds-home-preview__name">{routeCopy.home.previewName}</p>
          <p className="ds-home-preview__role">{routeCopy.home.previewRole}</p>
          <div className="ds-home-preview__rule" />
          <p className="ds-home-preview__label">{routeCopy.home.previewNextLabel}</p>
          <p className="ds-home-preview__action">{routeCopy.home.previewNextAction}</p>
          <div className="ds-home-preview__steps">
            {routeCopy.home.previewSteps.map((step, index) => (
              <span className={index < 2 ? 'is-done' : index === 2 ? 'is-current' : ''} key={step}>
                {step}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="ds-home-flow" aria-labelledby="home-flow-title">
        <div>
          <p className="ds-eyebrow">{routeCopy.home.flowEyebrow}</p>
          <h2 className="ds-heading-section" id="home-flow-title">
            {routeCopy.home.flowTitle}
          </h2>
        </div>
        <ol className="ds-home-flow__list">
          {routeCopy.home.flowItems.map(([title, description], index) => (
            <li key={title}>
              <span>{`0${index + 1}`}</span>
              <strong>{title}</strong>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>
      <nav className="ds-home-secondary-links" aria-label={commonCopy.primaryNavigationLabel}>
        <Link href="/public">
          <strong>{commonCopy.publicEntry}</strong>
          <span>{routeCopy.home.publicCard}</span>
        </Link>
        <Link href="/customer">
          <strong>{commonCopy.customer}</strong>
          <span>{routeCopy.home.customerCard}</span>
        </Link>
      </nav>
    </main>
  );
}
