import { readFile, readdir } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const defaultRepositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const repositoryRoot = resolve(process.argv[2] ?? defaultRepositoryRoot);
const sourceExtensions = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const checkedAreas = ['adapters', 'applications', 'apps', 'contracts', 'database', 'modules'];

const layerRules = {
  modules: {
    forbiddenLocalLayers: new Set(['adapters', 'applications', 'apps', 'contracts', 'database']),
    forbiddenPackages: [
      /^@fastify\//u,
      /^@supabase\//u,
      /^drizzle-orm(?:\/|$)/u,
      /^fastify$/u,
      /^next(?:\/|$)/u,
      /^react(?:\/|$)/u,
      /^typebox(?:\/|$)/u,
    ],
  },
  applications: {
    forbiddenLocalLayers: new Set(['adapters', 'apps', 'contracts', 'database']),
    forbiddenPackages: [
      /^@fastify\//u,
      /^@supabase\//u,
      /^drizzle-orm(?:\/|$)/u,
      /^fastify$/u,
      /^next(?:\/|$)/u,
      /^react(?:\/|$)/u,
      /^typebox(?:\/|$)/u,
    ],
  },
  contracts: {
    forbiddenLocalLayers: new Set(['adapters', 'applications', 'apps', 'database', 'modules']),
    forbiddenPackages: [
      /^@fastify\//u,
      /^@supabase\//u,
      /^drizzle-orm(?:\/|$)/u,
      /^fastify$/u,
      /^next(?:\/|$)/u,
      /^react(?:\/|$)/u,
    ],
  },
  adapters: {
    forbiddenLocalLayers: new Set(['apps']),
    forbiddenPackages: [/^next(?:\/|$)/u, /^react(?:\/|$)/u],
  },
  database: {
    forbiddenLocalLayers: new Set(['adapters', 'applications', 'apps', 'contracts']),
    forbiddenPackages: [
      /^@fastify\//u,
      /^@supabase\//u,
      /^fastify$/u,
      /^next(?:\/|$)/u,
      /^react(?:\/|$)/u,
      /^typebox(?:\/|$)/u,
    ],
  },
  apps: {
    forbiddenLocalLayers: new Set(),
    forbiddenPackages: [],
  },
};

const webClientRules = {
  forbiddenLocalLayers: new Set(['adapters', 'applications', 'contracts', 'database', 'modules']),
  forbiddenPackages: [
    /^@fastify\//u,
    /^@supabase\//u,
    /^drizzle-orm(?:\/|$)/u,
    /^fastify$/u,
    /^postgres$/u,
    /^typebox(?:\/|$)/u,
  ],
};

const importPattern =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/gu;

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      if (['.next', 'coverage', 'dist', 'node_modules'].includes(entry.name)) {
        continue;
      }
      files.push(...(await collectSourceFiles(absolutePath)));
      continue;
    }

    if (sourceExtensions.has(extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function repositoryLayer(absolutePath) {
  return relative(repositoryRoot, absolutePath).split(sep)[0];
}

function importedLocalLayer(sourceFile, specifier) {
  const directLayer = specifier.split('/')[0];
  if (checkedAreas.includes(directLayer)) {
    return directLayer;
  }

  if (!specifier.startsWith('.')) {
    return undefined;
  }

  return repositoryLayer(resolve(sourceFile, '..', specifier));
}

const violations = [];

for (const area of checkedAreas) {
  const absoluteArea = resolve(repositoryRoot, area);
  const files = await collectSourceFiles(absoluteArea);

  for (const file of files) {
    const relativeFile = relative(repositoryRoot, file);
    const rules =
      area === 'apps' && relativeFile.split(sep)[1] === 'web' ? webClientRules : layerRules[area];
    const source = await readFile(file, 'utf8');

    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1] ?? match[2];
      if (specifier === undefined) {
        continue;
      }

      const localLayer = importedLocalLayer(file, specifier);
      if (localLayer !== undefined && rules.forbiddenLocalLayers.has(localLayer)) {
        violations.push(
          `${relative(repositoryRoot, file)} imports forbidden layer "${localLayer}" via "${specifier}"`,
        );
      }

      if (
        !specifier.startsWith('.') &&
        rules.forbiddenPackages.some((pattern) => pattern.test(specifier))
      ) {
        violations.push(
          `${relative(repositoryRoot, file)} imports forbidden package "${specifier}"`,
        );
      }
    }
  }
}

if (violations.length > 0) {
  throw new Error(`Import boundary violations:\n- ${violations.join('\n- ')}`);
}

console.log('Import boundary check passed.');
