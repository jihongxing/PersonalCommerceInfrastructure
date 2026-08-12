import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repo = process.cwd();
const sourceRoots = [
  path.join(repo, 'apps', 'web', 'src', 'app'),
  path.join(repo, 'apps', 'web', 'src', 'components', 'creator-identity-workspace.tsx'),
];

const forbiddenPatterns = [
  {
    description: 'Tailwind visual color utility',
    pattern:
      /\b(?:bg|text|border|ring|outline)-(?:slate|zinc|gray|neutral|stone|red|amber|blue|teal|white|black)-/u,
  },
  {
    description: 'Tailwind radius or shadow utility',
    pattern: /\b(?:rounded(?:-[a-z0-9]+)?|shadow(?:-[a-z0-9]+)?)\b/u,
  },
  {
    description: 'raw HTML visual control',
    pattern: /<(?:button|input|textarea)\b/u,
  },
];

async function collectTsxFiles(target) {
  const targetStat = await stat(target);

  if (targetStat.isFile()) {
    return target.endsWith('.tsx') ? [target] : [];
  }

  const entries = await readdir(target, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => collectTsxFiles(path.join(target, entry.name))),
  );

  return files.flat();
}

const files = (await Promise.all(sourceRoots.map(collectTsxFiles))).flat();
const violations = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const relativePath = path.relative(repo, file);

  for (const { description, pattern } of forbiddenPatterns) {
    const match = content.match(pattern);

    if (match !== null) {
      violations.push(`${relativePath}: ${description} "${match[0]}"`);
    }
  }
}

if (violations.length > 0) {
  console.error('Web Design System governance failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  console.error(
    'Use Design System components and ds-* layout classes instead of page-level visual utilities.',
  );
  process.exit(1);
}

console.log('Web Design System governance passed.');
