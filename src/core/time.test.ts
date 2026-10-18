import { describe, it, expect } from 'vitest';
import { localDate } from './time';

describe('localDate', () => {
  it('回傳當地 YYYY-MM-DD', () => {
    expect(localDate(new Date(2026, 9, 18, 0, 30).getTime())).toBe('2026-10-18');
    expect(localDate(new Date(2026, 0, 3, 23, 59).getTime())).toBe('2026-01-03');
  });
});
