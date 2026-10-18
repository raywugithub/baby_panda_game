import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { feed, cook, shouldHiccup } from './care';

const MIN = 60_000;
const base = (over = {}) => ({ ...createInitialState(1, 0), ...over });

describe('feed', () => {
  it('扣一份食物並給有效照顧獎勵', () => {
    const s = base({ needs: { tummy: 70, clean: 70, mood: 70 } });
    const out = feed(s, 'food-bamboo-cake', 0);
    expect(out.state.inventory['food-bamboo-cake']).toBe(2);
    expect(out.state.needs.tummy).toBe(95);
    expect(out.state.lastVisitedSummary.foods).toEqual(['竹筍糕']);
  });
  it('指標已滿仍消耗食物但沒有獎勵', () => {
    const s = base({ needs: { tummy: 100, clean: 70, mood: 70 } });
    const out = feed(s, 'food-bamboo-cake', 0);
    expect(out.state.inventory['food-bamboo-cake']).toBe(2);
    expect(out.state.growthXp).toBe(0);
  });
  it('沒有該食物時原狀態不變', () => {
    const s = base({ inventory: {} });
    expect(feed(s, 'food-sour-plum', 0).state).toEqual(s);
  });
});

describe('cook', () => {
  it('首次發現食譜：加入 recipes、給獎勵、發出事件', () => {
    const s = base({ inventory: { 'ing-bamboo-shoot': 1, 'ing-rice-flour': 1 } });
    const out = cook(s, 'ing-bamboo-shoot', 'ing-rice-flour', 0);
    expect(out.result).toBe('recipe-bamboo-mochi');
    expect(out.state.inventory['recipe-bamboo-mochi']).toBe(1);
    expect(out.state.inventory['ing-bamboo-shoot']).toBeUndefined();
    expect(out.state.recipes).toContain('recipe-bamboo-mochi');
    expect(out.events).toContainEqual({ type: 'recipeDiscovered', recipeId: 'recipe-bamboo-mochi' });
    expect(out.state.starSand).toBe(s.starSand + 5);
    expect(out.state.lastVisitedSummary.foods).toEqual(['竹筍麻糬']);
  });
  it('重複做出同一食譜不再發現事件', () => {
    const s = base({ recipes: ['recipe-bamboo-mochi'], inventory: { 'ing-rice-flour': 1, 'ing-bamboo-shoot': 1 } });
    const out = cook(s, 'ing-rice-flour', 'ing-bamboo-shoot', 0);
    expect(out.events.some(e => e.type === 'recipeDiscovered')).toBe(false);
  });
  it('不在食譜內的組合做出謎之料理', () => {
    const s = base({ inventory: { 'ing-rice-flour': 1, 'ing-honey': 1 } });
    const out = cook(s, 'ing-rice-flour', 'ing-honey', 0);
    expect(out.result).toBe('mystery');
    expect(out.state.inventory['food-mystery']).toBe(1);
  });
  it('缺少食材時拋出錯誤', () => {
    expect(() => cook(base({ inventory: {} }), 'ing-honey', 'ing-mushroom', 0)).toThrow('missing ingredient');
  });
});

describe('shouldHiccup（規格 5.2）', () => {
  it('3 分鐘內第 4 個才打嗝', () => {
    const s = base({ feedLog: [0, 10_000, 20_000] });
    expect(shouldHiccup({ ...s, feedLog: [0, 10_000, 20_000] }, 30_000)).toBe(false);
    expect(shouldHiccup({ ...s, feedLog: [0, 10_000, 20_000, 30_000] }, 30_000)).toBe(true);
  });
  it('超過 3 分鐘的紀錄不計入', () => {
    expect(shouldHiccup(base({ feedLog: [0, 0, 0, 3 * MIN + 1] }), 3 * MIN + 1)).toBe(false);
  });
  it('裝備月亮鈴鐺時第 3 個就打嗝', () => {
    const s = base({ feedLog: [0, 10_000, 20_000] });
    const bell = { ...s, equipped: { ...s.equipped, pendants: ['pendant-moon-bell'] } };
    expect(shouldHiccup(bell, 20_000)).toBe(true);
    expect(shouldHiccup({ ...bell, feedLog: [0, 10_000] }, 20_000)).toBe(false);
  });
});
