import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { applyElapsed, isNewDay, welcomeBack, offlineMs } from './time';

const H = 3600_000;
const at = (over: Partial<ReturnType<typeof createInitialState>>) => ({ ...createInitialState(1, 0), ...over });

describe('applyElapsed（規格 5.1）', () => {
  it('10 小時後肚子 −40、香香 −30、心情 −50，但下限 30', () => {
    const s = applyElapsed(at({ lastSeenAt: 0 }), 10 * H);
    expect(s.needs).toEqual({ tummy: 30, clean: 40, mood: 30 });
  });
  it('每小時元氣 +10，上限 100', () => {
    expect(applyElapsed(at({ lastSeenAt: 0, energy: 50 }), 2 * H).energy).toBe(70);
    expect(applyElapsed(at({ lastSeenAt: 0, energy: 95 }), 10 * H).energy).toBe(100);
  });
  it('離線時間上限 72 小時', () => {
    const a = applyElapsed(at({ lastSeenAt: 0 }), 72 * H);
    const b = applyElapsed(at({ lastSeenAt: 0 }), 100 * H);
    expect(b).toEqual({ ...a, lastSeenAt: 100 * H });
  });
  it('時間被往回調視為 0，不扣不加', () => {
    const s = applyElapsed(at({ lastSeenAt: 5 * H, needs: { tummy: 60, clean: 60, mood: 60 } }), 1 * H);
    expect(s.needs).toEqual({ tummy: 60, clean: 60, mood: 60 });
    expect(s.lastSeenAt).toBe(1 * H);
  });
  it('已低於下限的指標不會被拉回上升', () => {
    const s = applyElapsed(at({ lastSeenAt: 0, needs: { tummy: 20, clean: 70, mood: 70 } }), 1 * H);
    expect(s.needs.tummy).toBe(20);
  });
});

describe('isNewDay 與 offlineMs', () => {
  it('只有日期大於 lastDailyDate 才是新的一天', () => {
    const today = new Date(2026, 9, 18, 9).getTime();
    expect(isNewDay(at({ lastDailyDate: '2026-10-17' }), today)).toBe(true);
    expect(isNewDay(at({ lastDailyDate: '2026-10-18' }), today)).toBe(false);
    expect(isNewDay(at({ lastDailyDate: '2026-10-19' }), today)).toBe(false);
  });
  it('offlineMs 負值為 0', () => {
    expect(offlineMs(at({ lastSeenAt: 10 }), 5)).toBe(0);
    expect(offlineMs(at({ lastSeenAt: 0 }), 3 * H)).toBe(3 * H);
  });
});

describe('welcomeBack', () => {
  it('不到 24 小時回傳 null', () => {
    expect(welcomeBack(at({ lastSeenAt: 0 }), 23 * H)).toBeNull();
  });
  it('超過 24 小時送 30 星砂與一封信', () => {
    const s = at({ lastSeenAt: 0, starSand: 100 });
    const out = welcomeBack(s, 25 * H)!;
    expect(out.state.starSand).toBe(130);
    expect(out.state.letters).toHaveLength(1);
    expect(out.state.letters[0].from).toBe('mianhua');
    expect(out.state.letters[0].read).toBe(false);
  });
});
