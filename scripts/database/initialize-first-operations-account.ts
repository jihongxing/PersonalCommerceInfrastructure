import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { StringDecoder } from 'node:string_decoder';
import postgres from 'postgres';

import { Argon2idOperationsPasswordVerifier } from '../../adapters/auth/operations/argon2id-password-hasher.js';
import { loadDatabaseConfiguration } from '../../apps/prototype/src/configuration/bootstrap.js';
import { normalizeOperationsLoginIdentifier } from '../../modules/operations-identity/operations-identity-contract.js';

export async function initializeFirstOperationsAccount(input: {
  readonly databaseUrl: string;
  readonly loginIdentifier: string;
  readonly password: string;
  readonly evidenceRef: string;
  readonly decisionRef: string;
}): Promise<void> {
  const database = postgres(input.databaseUrl, { max: 1, prepare: false });
  try {
    const login = normalizeOperationsLoginIdentifier(input.loginIdentifier);
    const verifier = await new Argon2idOperationsPasswordVerifier().hash(input.password);
    const ids = {
      principal: `operations-principal-${randomUUID()}`,
      account: `operations-account-${randomUUID()}`,
      credential: `operations-credential-${randomUUID()}`,
      operation: `operations-bootstrap-${randomUUID()}`,
      correlation: `operations-bootstrap-${randomUUID()}`,
    };
    const result = await database.begin(async (transaction) => {
      const identity = await transaction`SELECT session_user, current_user`;
      if (
        identity[0]?.session_user !== 'pci_ops_migration' ||
        identity[0]?.current_user !== 'pci_ops_migration'
      ) {
        throw new Error('Unauthorized initializer.');
      }
      const rows = await transaction<
        { result: string }[]
      >`SELECT operations_api.initialize_first_admin(
        ${ids.principal}, ${ids.account}, ${ids.credential}, ${login}, ${verifier},
        ${ids.operation}, ${ids.correlation}, ${input.evidenceRef}, ${input.decisionRef}
      ) AS result`;
      return rows[0]?.result;
    });
    if (result === 'ALREADY_INITIALIZED') throw new Error('ALREADY_INITIALIZED');
    if (result !== 'INITIALIZED') throw new Error('Bootstrap outcome could not be confirmed.');
    return;
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_INITIALIZED') throw error;
    throw new Error('Operations bootstrap failed or outcome uncertain; reconcile before retry.');
  } finally {
    await database.end({ timeout: 5 });
  }
}

async function main(): Promise<void> {
  const configuration = loadDatabaseConfiguration();
  const loginIdentifier = process.env.OPERATIONS_BOOTSTRAP_LOGIN;
  const login = loginIdentifier ?? (await prompt('Operations login identifier: '));
  const password = await hiddenPrompt('Operations password (minimum 15 characters): ');
  const confirmation = await hiddenPrompt('Confirm password: ');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  await initializeFirstOperationsAccount({
    databaseUrl: configuration.databaseUrl,
    loginIdentifier: login,
    password,
    evidenceRef: process.env.OPERATIONS_BOOTSTRAP_EVIDENCE_REF ?? '',
    decisionRef: process.env.OPERATIONS_BOOTSTRAP_DECISION_REF ?? '',
  });
  console.log('Operations first-account bootstrap completed. No session was created.');
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  try {
    await main();
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_INITIALIZED') {
      console.error('Operations first-account bootstrap refused: already initialized.');
    } else {
      console.error(
        'Operations first-account bootstrap failed; reconcile database state before retry.',
      );
    }
    process.exitCode = 1;
  }
}

async function prompt(message: string): Promise<string> {
  const reader = createInterface({ input, output });
  try {
    return (await reader.question(message)).trim();
  } finally {
    reader.close();
  }
}

async function hiddenPrompt(message: string): Promise<string> {
  if (!input.isTTY || !output.isTTY) throw new Error('Hidden interactive terminal required.');
  output.write(message);
  const wasRaw = input.isRaw;
  input.setRawMode?.(true);
  input.resume();
  try {
    return await readHiddenPassword(input.iterator({ destroyOnReturn: false }));
  } finally {
    input.setRawMode?.(wasRaw);
    input.pause();
    output.write('\n');
  }
}

/** Decode across stream chunks; terminal editing must not corrupt Unicode passwords. */
export async function readHiddenPassword(chunks: AsyncIterable<Buffer | string>): Promise<string> {
  const decoder = new StringDecoder('utf8');
  let value = '';
  for await (const chunk of chunks) {
    const text = typeof chunk === 'string' ? chunk : decoder.write(chunk);
    for (const character of text) {
      if (character === '\r' || character === '\n') {
        return value;
      }
      if (character === '\u0003') {
        throw new Error('Bootstrap cancelled.');
      }
      if (character === '\u007f' || character === '\b') value = [...value].slice(0, -1).join('');
      else if (character < ' ' || character === '\ufffd')
        throw new Error('Unsupported terminal input; retry without control sequences.');
      else value += character;
    }
  }
  throw new Error('Password input ended before confirmation.');
}
