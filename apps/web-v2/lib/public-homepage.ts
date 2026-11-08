const REFERENCE =
  /^(?:[3479ACDEFHJKMNPQRTVWXY]{18}|[3479ACDEFHJKMNPQRTVWXY]{6}(?:-[3479ACDEFHJKMNPQRTVWXY]{6}){2})$/u;

export function normalizeReference(input: string): string | null {
  const value = input.trim().toUpperCase();
  return REFERENCE.test(value) ? value.replaceAll('-', '') : null;
}

export function homepageUrl(reference: string): string | null {
  const normalized = normalizeReference(reference);
  const configured =
    process.env.NEXT_PUBLIC_WEB_ORIGIN ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
  if (!normalized || !configured) return null;
  try {
    const origin = new URL(configured);
    if (
      !['http:', 'https:'].includes(origin.protocol) ||
      origin.username ||
      origin.password ||
      origin.pathname !== '/' ||
      origin.search ||
      origin.hash
    )
      return null;
    if (
      process.env.NODE_ENV === 'production' &&
      (origin.protocol !== 'https:' ||
        ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))
    )
      return null;
    return `${origin.origin}/r/${normalized}`;
  } catch {
    return null;
  }
}

export type PublicHomepage = {
  commerceReference: string;
  displayName: string;
  offerings: { id: string; title: string; description: string }[];
};
