import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { care, isEffective } from './care';

const H = 3600_000;
const base = (over = {}) => ({ ...createInitialState(1, 0), ...over });

describe('有效照顧（規格 4.1、4.5）', () => {
  it('指標 < 100 時給完整獎勵並 +25（上限 100）', () => {
    const s = base({ needs: { tummy: 70, clean: 70, mood: 70 }, energy: 50 });
    const { state, events } = care(s, 'feed', 0);
    expect(state.needs.tummy).toBe(95);
    expect(state.growthXp).toBe(5);
    expect(state.starSand).toBe(102);
    expect(state.energy).toBe(65);
    expect(state.chainLinks).toBe(1);
    expect(events.some(e => e.type === 'reward')).toBe(true);
  });
  it('指標上限 100', () => {
    const s = base({ needs: { tummy: 90, clean: 70, mood: 70 } });
    expect(care(s, 'feed', 0).state.needs.tummy).toBe(100);
  });
  it('指標已滿：無任何數值獎勵', () => {
    const s = base({ needs: { tummy: 100, clean: 70, mood: 70 } });
    expect(isEffective(s, 'feed', 0)).toBe(false);
    const out = care(s, 'feed', 0);
    expect(out.state).toEqual(s);
    expect(out.events).toEqual([]);
  });
  it('洗澡對應香香、玩耍對應心情', () => {
    const s = base({ needs: { tummy: 100, clean: 40, mood: 40 } });
    expect(care(s, 'bath', 0).state.needs.clean).toBe(65);
    expect(care(s, 'play', 0).state.needs.mood).toBe(65);
  });
});

describe('抱抱每小時上限', () => {
  it('每小時最多 5 次有效抱抱，第 6 次無獎勵', () => {
    let s = base({ needs: { tummy: 70, clean: 70, mood: 0 } });
    for (let i = 0; i < 5; i++) {
      s = { ...s, needs: { ...s.needs, mood: 0 } }; // 每次先把心情歸零，確保是指標未滿而非上限造成的差異
      expect(isEffective(s, 'hug', i * 1000)).toBe(true);
      s = care(s, 'hug', i * 1000).state;
      expect(s.needs.mood).toBe(25);
    }
    expect(s.hugLog).toHaveLength(5);
    s = { ...s, needs: { ...s.needs, mood: 0 } };
    expect(isEffective(s, 'hug', 5000)).toBe(false);
    const sixth = care(s, 'hug', 5000);
    expect(sixth.state.growthXp).toBe(s.growthXp);
    expect(sixth.state.needs.mood).toBe(0);
  });
  it('超過一小時的抱抱不計入上限', () => {
    const s = base({ hugLog: [0, 0, 0, 0, 0] });
    expect(isEffective(s, 'hug', H + 1)).toBe(true);
  });
});
