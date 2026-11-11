import { describe, expect, it } from 'vitest';

import { identityStateLabel, toUserFacingMessage } from './user-facing-messages';

describe('user-facing message adapter', () => {
  it('maps internal identity errors to user language', () => {
    expect(
      toUserFacingMessage({ error: { code: 'commerce_identity_not_found' } }, 'fallback'),
    ).toBe('你还没有创建商业主页，请先完善信息。');
  });

  it('does not expose unknown internal error details', () => {
    expect(
      toUserFacingMessage(
        { error: { code: 'database_connection_failed' } },
        '暂时无法保存主页，请稍后再试。',
      ),
    ).toBe('暂时无法保存主页，请稍后再试。');
  });

  it('maps internal state values to user language', () => {
    expect(identityStateLabel('draft')).toBe('草稿');
    expect(identityStateLabel('published')).toBe('已公开');
    expect(identityStateLabel('unpublished')).toBe('已下线');
  });
});
