import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repo = process.cwd();
const files = [];

for await (const file of glob('apps/web/src/**/*.{tsx,jsx}', {
  cwd: repo,
  exclude: (entry) =>
    entry.includes('generated.') || entry.includes(`${path.sep}lib${path.sep}api${path.sep}`),
})) {
  files.push(path.join(repo, file));
}

const forbiddenTerms = [
  'Commerce Identity',
  'Capability',
  'Commerce Action',
  'Confirmed Commerce',
  'Paid Transaction',
  'Access Token',
  'Bearer Token',
  'API',
  'Actor',
  'Repository',
  'Provider',
  'Draft',
  'Published',
  'Unpublished',
];

const violations = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const relativeFile = path.relative(repo, file);
  const isUiPrimitive = relativeFile.includes(`${path.sep}components${path.sep}ui${path.sep}`);
  const userFacingFragments = [
    ...source.matchAll(/<(?:[A-Za-z][^<>]*?)>([^<>\r\n]+)<\/[A-Za-z][^<>]*>/g),
    ...source.matchAll(/(?:aria-label|placeholder|title|alt)\s*=\s*["']([^"']+)["']/g),
  ];

  for (const match of userFacingFragments) {
    const fragment = match[1];
    for (const term of forbiddenTerms) {
      if (fragment.includes(term)) {
        violations.push(`${path.relative(repo, file)}: ${term} in "${fragment.trim()}"`);
      }
    }
  }

  if (!isUiPrimitive) {
    const staticJsxText = [
      ...source.matchAll(/<(?:[A-Za-z][^<>]*?)>([^<>{}\r\n]+)<\/[A-Za-z][^<>]*>/g),
    ]
      .map((match) => match[1].trim())
      .filter((fragment) => fragment.length > 0);
    for (const fragment of staticJsxText) {
      violations.push(
        `${relativeFile}: static user-facing JSX text must come from Copy Catalog: "${fragment}"`,
      );
    }

    const staticUserFacingAttributes = [
      ...source.matchAll(/(?:aria-label|placeholder|title|alt)\s*=\s*["']([^"']+)["']/g),
    ];
    for (const match of staticUserFacingAttributes) {
      violations.push(
        `${relativeFile}: static user-facing attribute must come from Copy Catalog: "${match[1]}"`,
      );
    }
  }

  if (/response\.error\.error\.message|error\.message/.test(source)) {
    violations.push(`${relativeFile}: raw API or Error message is rendered in a client component`);
  }
}

if (violations.length > 0) {
  console.error('User-facing copy governance failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`User-facing copy governance passed (${files.length} files scanned).`);
