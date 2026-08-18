import Link from 'next/link';

import { Surface } from './ui/surface';

type PatternNavigationProps = {
  readonly audience: 'creator' | 'customer';
};

const creatorLinks = [
  ['Identity', '#creator-desk'],
  ['Reservations', '#creator-desk'],
  ['Contracts', '#creator-desk'],
  ['Orders / Earnings', '#creator-desk'],
] as const;

const customerLinks = [
  ['Request', '#request-commerce'],
  ['Reserve', '#reservation-commerce'],
  ['Quote / Accept', '#contract-commerce'],
] as const;

export function PatternNavigation({ audience }: PatternNavigationProps) {
  const links = audience === 'creator' ? creatorLinks : customerLinks;
  return (
    <Surface
      className="ds-pattern-navigation"
      id={audience === 'creator' ? 'creator-desk' : undefined}
      tone="subtle"
    >
      <p className="ds-eyebrow">
        {audience === 'creator' ? 'Creator Commerce Desk' : 'Creator Commerce Action'}
      </p>
      <nav aria-label={audience === 'creator' ? 'Creator Commerce sections' : 'Commerce actions'}>
        <div className="ds-pattern-navigation__links">
          {links.map(([label, href]) => (
            <Link className="ds-pattern-navigation__link" href={href} key={href}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </Surface>
  );
}
