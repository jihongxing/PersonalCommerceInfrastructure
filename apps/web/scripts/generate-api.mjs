import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

import { createApiServer } from '../../../dist/apps/api/src/create-api-server.js';

const outputPath = resolve('src/lib/api/generated.d.ts');
const server = await createApiServer();

try {
  const schema = server.swagger();
  const ast = await openapiTS(schema);
  const output = `${COMMENT_HEADER}${astToString(ast)}`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, 'utf8');
} finally {
  await server.close();
}
