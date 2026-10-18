import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { moodOf } from './mood';

const H = 3600_000;
const at = (h: number) => new Date(2026, 9, 18, h, 0).getTime(); // 本地時間
const base = (over = {}) => ({ ...createInitialState(1, 0), ...over });
const ok = { tummy: 80, clean: 80, mood: 80 };

describe('moodOf 優先順序（規格 5.3）', () => {
  it('23:00–05:59 為睡覺', () => {
    expect(moodOf(base({ needs: ok }), at(23), null)).toBe('sleeping');
    expect(moodOf(base({ needs: ok }), at(5), null)).toBe('sleeping');
    expect(moodOf(base({ needs: ok }), at(6), null)).toBe('happy');
  });
  it('離線超過 12 小時剛打開也是睡覺', () => {
    expect(moodOf(base({ needs: ok }), at(12), 13 * H)).toBe('sleeping');
    expect(moodOf(base({ needs: ok }), at(12), 11 * H)).toBe('happy');
  });
  it('點醒後 30 分鐘內夜裡也不睡覺，過期後恢復睡覺', () => {
    const wake = { ...base({ needs: ok }), awakeUntil: at(23) + 30 * 60_000 };
    expect(moodOf(wake, at(23) + 60_000, null)).toBe('happy');
    expect(moodOf(wake, at(23) + 31 * 60_000, null)).toBe('sleeping');
  });
  it('睡覺優先於想睡', () => {
    expect(moodOf(base({ needs: ok, energy: 10 }), at(23), null)).toBe('sleeping');
  });
  it('元氣 < 25 為想睡，優先於撒嬌', () => {
    expect(moodOf(base({ needs: { tummy: 10, clean: 80, mood: 80 }, energy: 24 }), at(12), null)).toBe('sleepy');
    expect(moodOf(base({ needs: { tummy: 10, clean: 80, mood: 80 }, energy: 25 }), at(12), null)).toBe('clingy');
  });
  it('任一指標 < 50 為撒嬌', () => {
    expect(moodOf(base({ needs: { tummy: 49, clean: 90, mood: 90 } }), at(12), null)).toBe('clingy');
  });
  it('三指標平均 ≥ 70 為開心', () => {
    expect(moodOf(base({ needs: { tummy: 70, clean: 70, mood: 70 } }), at(12), null)).toBe('happy');
    expect(moodOf(base({ needs: { tummy: 70, clean: 69, mood: 71 } }), at(12), null)).toBe('happy');
  });
  it('其他為普通', () => {
    expect(moodOf(base({ needs: { tummy: 55, clean: 70, mood: 80 } }), at(12), null)).toBe('normal');
  });
});
