import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

describe('workspace import boundaries', () => {
  const temporaryRoots: string[] = [];

  afterEach(() => {
    for (const root of temporaryRoots.splice(0)) {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('keeps domain, application, contract and adapter dependencies directional', () => {
    const output = execFileSync(
      process.execPath,
      [resolve('scripts/test/check-import-boundaries.mjs')],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    );

    expect(output).toContain('Import boundary check passed.');
  });

  it.each([
    {
      sourceLayer: 'modules',
      sourcePath: 'example/invalid.ts',
      targetLayer: 'applications',
    },
    {
      sourceLayer: 'applications',
      sourcePath: 'invalid.ts',
      targetLayer: 'adapters',
    },
    {
      sourceLayer: 'contracts',
      sourcePath: 'invalid.ts',
      targetLayer: 'modules',
    },
  ])(
    'rejects $sourceLayer imports from $targetLayer',
    ({ sourceLayer, sourcePath, targetLayer }) => {
      const fixtureRoot = mkdtempSync(join(tmpdir(), 'pci-import-boundary-'));
      temporaryRoots.push(fixtureRoot);
      const sourceFile = join(fixtureRoot, sourceLayer, sourcePath);
      const targetFile = join(fixtureRoot, targetLayer, 'example.ts');
      mkdirSync(resolve(sourceFile, '..'), { recursive: true });
      mkdirSync(resolve(targetFile, '..'), { recursive: true });
      writeFileSync(targetFile, 'export const value = 1;\n');
      writeFileSync(
        sourceFile,
        `import { value } from '${targetLayer}/example.js';\nexport const invalid = value;\n`,
      );

      expect(() =>
        execFileSync(
          process.execPath,
          [resolve('scripts/test/check-import-boundaries.mjs'), fixtureRoot],
          {
            cwd: process.cwd(),
            encoding: 'utf8',
            stdio: 'pipe',
          },
        ),
      ).toThrow(new RegExp(`imports forbidden layer "${targetLayer}"`, 'u'));
    },
  );

  it('allows a transport adapter to consume a cross-client contract', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'pci-import-boundary-'));
    temporaryRoots.push(fixtureRoot);
    mkdirSync(join(fixtureRoot, 'adapters', 'transport'), { recursive: true });
    mkdirSync(join(fixtureRoot, 'contracts'), { recursive: true });
    writeFileSync(join(fixtureRoot, 'contracts', 'example.ts'), 'export const value = 1;\n');
    writeFileSync(
      join(fixtureRoot, 'adapters', 'transport', 'valid.ts'),
      "import { value } from 'contracts/example.js';\nexport const valid = value;\n",
    );

    const output = execFileSync(
      process.execPath,
      [resolve('scripts/test/check-import-boundaries.mjs'), fixtureRoot],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    );

    expect(output).toContain('Import boundary check passed.');
  });

  it('rejects Web Reference Client imports from core business layers', () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'pci-import-boundary-'));
    temporaryRoots.push(fixtureRoot);
    mkdirSync(join(fixtureRoot, 'apps', 'web', 'src'), { recursive: true });
    mkdirSync(join(fixtureRoot, 'modules'), { recursive: true });
    writeFileSync(join(fixtureRoot, 'modules', 'example.ts'), 'export const value = 1;\n');
    writeFileSync(
      join(fixtureRoot, 'apps', 'web', 'src', 'invalid.ts'),
      "import { value } from 'modules/example.js';\nexport const invalid = value;\n",
    );

    expect(() =>
      execFileSync(
        process.execPath,
        [resolve('scripts/test/check-import-boundaries.mjs'), fixtureRoot],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe',
        },
      ),
    ).toThrow(/imports forbidden layer "modules"/u);
  });
});
