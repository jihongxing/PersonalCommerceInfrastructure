import { describe, expect, it } from 'vitest';
import { readHiddenPassword } from '../../scripts/database/initialize-first-operations-account.js';

async function* chunks(values: Buffer[]) {
  for (const value of values) yield await Promise.resolve(value);
}
describe('Bootstrap hidden input fidelity', () => {
  it('retains whitespace and Unicode across split UTF-8 chunks', async () => {
    const value = ' 密码😀 horse battery staple ';
    const bytes = Buffer.from(value + '\r');
    expect(await readHiddenPassword(chunks([...bytes].map((b) => Buffer.from([b]))))).toBe(value);
  });
  it('handles Windows Backspace and DEL by code point', async () => {
    expect(
      await readHiddenPassword(chunks([Buffer.from('phrase😀\b好\u007f horse battery staple\r')])),
    ).toBe('phrase horse battery staple');
  });
  it('fails without committing on cancellation, control sequences or incomplete input', async () => {
    for (const value of ['password\u0003', 'password\u001b[D', 'unfinished']) {
      await expect(readHiddenPassword(chunks([Buffer.from(value)]))).rejects.toThrow();
    }
  });
});
