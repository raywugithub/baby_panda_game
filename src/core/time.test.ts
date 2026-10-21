import { describe, it, expect } from 'vitest';
import { localDate } from './time';

describe('localDate', () => {
  it('回傳當地 YYYY-MM-DD', () => {
    expect(localDate(new Date(2026, 9, 18, 0, 30).getTime())).toBe('2026-10-18');
    expect(localDate(new Date(2026, 0, 3, 23, 59).getTime())).toBe('2026-01-03');
  });
});

describe('isNewDay 時鐘往前跳過', () => {
  it('lastDailyDate 比明天還晚時，今天仍算新的一天', async () => {
    const { isNewDay } = await import('./time');
    const { createInitialState } = await import('./state');
    const t = new Date(2026, 9, 18, 10).getTime();
    const s = { ...createInitialState(1, t), lastDailyDate: '2027-01-01' };
    expect(isNewDay(s, t)).toBe(true);
    expect(isNewDay({ ...s, lastDailyDate: '2026-10-18' }, t)).toBe(false);
    expect(isNewDay({ ...s, lastDailyDate: '2026-10-19' }, t)).toBe(false);
  });
});
