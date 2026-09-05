import { generateInviteCode, normalizeInviteCode } from '../inviteCode';

describe('generateInviteCode', () => {
  it('generates a code of the requested length using unambiguous characters', () => {
    const code = generateInviteCode(6);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it('generates different codes across calls (extremely likely)', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateInviteCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('normalizeInviteCode', () => {
  it('trims, uppercases and strips internal spaces', () => {
    expect(normalizeInviteCode('  ab 3f gh  ')).toBe('AB3FGH');
  });
});
