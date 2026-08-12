import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { createApiServer } from '../../dist/apps/api/src/create-api-server.js';

const baseline = JSON.parse(
  await readFile(resolve('contracts/api/v1/openapi-compatibility.json'), 'utf8'),
);
const server = await createApiServer();

try {
  const document = server.swagger();
  const actual = Object.fromEntries(
    Object.entries(document.paths ?? {})
      .flatMap(([path, pathItem]) =>
        Object.entries(pathItem ?? {})
          .filter(([method, operation]) => {
            return (
              ['delete', 'get', 'patch', 'post', 'put'].includes(method) &&
              operation !== undefined &&
              typeof operation === 'object' &&
              'operationId' in operation
            );
          })
          .map(([method, operation]) => [`${method.toUpperCase()} ${path}`, operation.operationId]),
      )
      .sort(([left], [right]) => left.localeCompare(right)),
  );

  if (JSON.stringify(actual) !== JSON.stringify(baseline)) {
    throw new Error(
      `OpenAPI compatibility manifest changed.\nExpected: ${JSON.stringify(baseline, undefined, 2)}\nActual: ${JSON.stringify(actual, undefined, 2)}`,
    );
  }

  process.stdout.write('OpenAPI compatibility check passed.');
} finally {
  await server.close();
}
