import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const repo = process.cwd();
const tokenPath = path.join(repo, 'design-system', 'tokens', 'design-tokens.json');
export const outputPath = path.join(
  repo,
  'apps',
  'web',
  'src',
  'design-system',
  'generated-tokens.css',
);

function toKebabCase(value) {
  return value.replace(/[A-Z]/gu, (character) => `-${character.toLowerCase()}`);
}

function flatten(value, parts = []) {
  if (Array.isArray(value)) {
    return [[parts, value.join(', ')]];
  }

  if (typeof value !== 'object' || value === null) {
    return [[parts, String(value)]];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    flatten(nestedValue, [...parts, key]),
  );
}

function variableName(parts) {
  return `--pci-${parts.map(toKebabCase).join('-')}`;
}

function resolveSemanticValue(parts, value) {
  if (parts.at(-1) === 'fontFamily') {
    return `var(${variableName(['primitive', 'font', 'family', value])})`;
  }

  return value;
}

function declarations(entries, resolver = (_parts, value) => value) {
  return entries
    .map(([parts, value]) => `  ${variableName(parts)}: ${resolver(parts, value)};`)
    .join('\n');
}

export function generateWebTokenCss(tokens) {
  return `/* This file is generated from design-system/tokens/design-tokens.json. Do not edit manually. */
:root {
${declarations(flatten(tokens.primitive, ['primitive']))}
${declarations(flatten(tokens.semantic, ['semantic']), resolveSemanticValue)}
}
`;
}

export async function loadWebTokenCss() {
  const tokens = JSON.parse(await readFile(tokenPath, 'utf8'));

  return prettier.format(generateWebTokenCss(tokens), {
    parser: 'css',
    filepath: outputPath,
  });
}

export async function writeWebTokenAdapter() {
  const content = await loadWebTokenCss();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');

  console.log(`Generated Web Token Adapter: ${path.relative(repo, outputPath)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeWebTokenAdapter();
}
