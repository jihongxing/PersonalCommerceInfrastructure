import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ExternalPlatformAccountList } from './private-external-platform-account-workspace.js';

describe('Private External Platform Account workspace', () => {
  it('renders multiple accounts and their lifecycle without mutation controls', () => {
    const markup = renderToStaticMarkup(
      createElement(ExternalPlatformAccountList, {
        accounts: [
          {
            externalPlatformAccountId: 'external-1',
            platform: 'instagram',
            platformAccountId: 'studio-a',
            lifecycle: 'ACTIVE',
          },
          {
            externalPlatformAccountId: 'external-2',
            platform: 'instagram',
            platformAccountId: 'brand-a',
            lifecycle: 'SUSPENDED',
          },
        ],
      }),
    );

    expect(markup).toContain('instagram Account');
    expect(markup).toContain('studio-a');
    expect(markup).toContain('brand-a');
    expect(markup).toContain('ACTIVE');
    expect(markup).toContain('SUSPENDED');
    expect(markup).not.toMatch(/<button[^>]*>.*?(connect|authorize|verify|bind|unbind)/iu);
  });

  it('renders a non-actionable empty state', () => {
    const markup = renderToStaticMarkup(
      createElement(ExternalPlatformAccountList, { accounts: [] }),
    );

    expect(markup).toContain('No external platform accounts.');
    expect(markup).not.toMatch(/connect|add account|verify|bind|authorize/iu);
  });
});
