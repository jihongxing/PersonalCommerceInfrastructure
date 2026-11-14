import argon2 from 'argon2';

import {
  createEncodedPasswordVerifier,
  type EncodedPasswordVerifier,
} from '../../../applications/operations-identity/operations-credential-repositories.js';
import type { OperationsPasswordVerifier } from '../../../applications/operations-identity/operations-human-authentication.js';

const MINIMUM_PASSWORD_LENGTH = 15;

/** Operations-only password hashing. Plaintext and verifiers never leave this adapter. */
export class Argon2idOperationsPasswordVerifier implements OperationsPasswordVerifier {
  private dummy: Promise<EncodedPasswordVerifier> | undefined;
  public async hash(password: string): Promise<EncodedPasswordVerifier> {
    assertPassword(password);
    return createEncodedPasswordVerifier(
      await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      }),
    );
  }

  public async verify(password: string, verifier: EncodedPasswordVerifier): Promise<boolean> {
    if (
      typeof password !== 'string' ||
      [...password].length < MINIMUM_PASSWORD_LENGTH ||
      password.length > 4096
    )
      return false;
    try {
      return await argon2.verify(verifier, password);
    } catch {
      return false;
    }
  }

  public async verifyDummy(password: string): Promise<boolean> {
    const dummy = await (this.dummy ??= this.hash('pci-operations-dummy-password'));
    return this.verify(password, dummy);
  }
}

function assertPassword(password: string): void {
  if (
    typeof password !== 'string' ||
    [...password].length < MINIMUM_PASSWORD_LENGTH ||
    password.length > 4096
  ) {
    throw new Error('Operations password must contain at least 15 characters.');
  }
}
