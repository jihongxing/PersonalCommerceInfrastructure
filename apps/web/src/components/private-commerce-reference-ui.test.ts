import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  CommerceReferenceView,
  type PrivateCommerceReference,
} from './private-commerce-profile-workspace.js';

describe('Private Commerce Reference view', () => {
  it('renders the grouped C号 and a copy control without reference mutation controls', () => {
    const markup = renderReference({
      assignmentStatus: 'ASSIGNED',
      commerceReference: '3C7M4Q9RDFHJKNTWVY',
      displayValue: '3C7M4Q-9RDFHJ-KNTWVY',
    });

    expect(markup).toContain('3C7M4Q-9RDFHJ-KNTWVY');
    expect(markup).toContain('Copy C号');
    expect(markup).not.toMatch(/generate|allocate|regenerate|replace|release|delete/iu);
  });

  it('renders a non-mutating empty state when the Profile has no assigned C号', () => {
    const markup = renderReference({ assignmentStatus: 'NOT_ASSIGNED' });

    expect(markup).toContain('This profile has no assigned Commerce Reference.');
    expect(markup).not.toContain('Copy C号');
    expect(markup).not.toMatch(/generate|allocate|regenerate|replace|release|delete/iu);
  });
});

function renderReference(reference: PrivateCommerceReference): string {
  return renderToStaticMarkup(createElement(CommerceReferenceView, { reference }));
}
