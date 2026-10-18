import { describe, it, expect } from 'vitest';
import { recordPoke, shyAfterHug, hideFoodOnOpen, hiccupDream } from './surprises';
import { DREAMS } from '../content/dreams';

describe('戳戳（規格 5.4：3 秒內 8 下）', () => {
  it('3 秒內第 8 下觸發', () => {
    let log: number[] = [];
    let trig = false;
    for (let i = 0; i < 8; i++) {
      const r = recordPoke(log, i * 300);
      log = r.pokeLog; trig = r.trigger;
    }
    expect(trig).toBe(true);
    expect(log).toEqual([]);
  });
  it('7 下不觸發，第 8 下（3 秒內）才觸發', () => {
    let log: number[] = [];
    for (let i = 0; i < 7; i++) {
      const r = recordPoke(log, i * 100);
      expect(r.trigger).toBe(false);
      log = r.pokeLog;
    }
    expect(recordPoke(log, 700).trigger).toBe(true);
  });
  it('分散在 3 秒以上不觸發', () => {
    let spread: number[] = [];
    let trig = false;
    for (let i = 0; i < 8; i++) { const r = recordPoke(spread, i * 1000); spread = r.pokeLog; trig = trig || r.trigger; }
    expect(trig).toBe(false);
  });
});

describe('機率類驚喜（規格 5.4）', () => {
  it('抱抱後害羞 30%', () => {
    expect(shyAfterHug(() => 0.29)).toBe(true);
    expect(shyAfterHug(() => 0.3)).toBe(false);
  });
  it('偷吃被抓包 10%，且沒有食物時不發生', () => {
    expect(hideFoodOnOpen(() => 0.09, true)).toBe(true);
    expect(hideFoodOnOpen(() => 0.1, true)).toBe(false);
    expect(hideFoodOnOpen(() => 0, false)).toBe(false);
  });
});

describe('夢話', () => {
  it('至少 10 句，且結果來自句庫', () => {
    expect(DREAMS.length).toBeGreaterThanOrEqual(10);
    expect(DREAMS).toContain(hiccupDream(1, 1000));
  });
  it('同種子同時間結果相同', () => {
    expect(hiccupDream(7, 5000)).toBe(hiccupDream(7, 5000));
  });
});
