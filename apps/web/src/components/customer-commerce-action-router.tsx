import { Surface } from './ui/surface';
import { clientSurfaceCopy } from '../content/user-facing-copy';

export function CustomerCommerceActionRouter() {
  return (
    <section
      aria-labelledby="commerce-action-router-title"
      className="ds-section-divider ds-section-stack"
      data-testid="customer-commerce-action-router"
    >
      <p className="ds-eyebrow">{clientSurfaceCopy.patternEyebrow}</p>
      <h2 className="ds-heading-section" id="commerce-action-router-title">
        {clientSurfaceCopy.actionTitle}
      </h2>
      <div className="ds-pattern-action-grid">
        <Surface className="ds-pattern-action-card" id="request-commerce" tone="subtle">
          <strong>{clientSurfaceCopy.requestTitle}</strong>
          <p className="ds-body-secondary">{clientSurfaceCopy.requestDescription}</p>
        </Surface>
        <Surface className="ds-pattern-action-card" id="reservation-commerce" tone="subtle">
          <strong>{clientSurfaceCopy.reservationTitle}</strong>
          <p className="ds-body-secondary">{clientSurfaceCopy.reservationDescription}</p>
        </Surface>
        <Surface className="ds-pattern-action-card" id="contract-commerce" tone="subtle">
          <strong>{clientSurfaceCopy.contractTitle}</strong>
          <p className="ds-body-secondary">{clientSurfaceCopy.contractDescription}</p>
        </Surface>
      </div>
    </section>
  );
}
