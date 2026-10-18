import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { applyReward } from './rewards';

const base = () => createInitialState(9, 0);

describe('applyReward', () => {
  it('成長值進刻度時送 markUp 事件', () => {
    const { state, events } = applyReward(base(), { xp: 35 });
    expect(state.growthXp).toBe(35);
    expect(events).toContainEqual({ type: 'markUp', mark: 1 });
    expect(events.some(e => e.type === 'reward')).toBe(true);
  });
  it('升階送一個免費禮盒並發出 stageUp', () => {
    const s = { ...base(), growthXp: 240 };
    const { state, events } = applyReward(s, { xp: 35 });
    expect(state.freeBoxes).toBe(1);
    expect(events).toContainEqual({ type: 'stageUp', stage: 2, title: '圓滾滾' });
  });
  it('項圈達到欄位門檻發出 slotUnlocked', () => {
    const s = { ...base(), chainLinks: 49 };
    const { state, events } = applyReward(s, { chain: 1 });
    expect(state.chainLinks).toBe(50);
    expect(events).toContainEqual({ type: 'slotUnlocked', slots: 3 });
  });
  it('元氣限制在 0–100，星砂與物品累加', () => {
    const s = { ...base(), energy: 90 };
    const { state } = applyReward(s, { energy: 50, starSand: 7, items: { 'ing-honey': 2 }, marshmallow: 3 });
    expect(state.energy).toBe(100);
    expect(state.starSand).toBe(107);
    expect(state.inventory['ing-honey']).toBe(2);
    expect(state.marshmallow).toBe(3);
    const low = applyReward({ ...base(), energy: 10 }, { energy: -25 }).state;
    expect(low.energy).toBe(0);
  });
  it('沒有任何獎勵時不改動狀態', () => {
    const s = base();
    expect(applyReward(s, {}).state).toEqual(s);
  });
});
