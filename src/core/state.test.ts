import { describe, it, expect } from 'vitest';
import { createInitialState, SCHEMA_VERSION } from './state';
import { localDate } from './time';
import { hash } from './rng';

describe('createInitialState（規格 3.4）', () => {
  const s = createInitialState(123, 1000);
  it('指標與數值', () => {
    expect(s.needs).toEqual({ tummy: 70, clean: 70, mood: 70 });
    expect(s.energy).toBe(100);
    expect(s.starSand).toBe(100);
    expect(s.marshmallow).toBe(0);
    expect(s.growthXp).toBe(0);
    expect(s.chainLinks).toBe(0);
    expect(s.freeBoxes).toBe(0);
  });
  it('裝備與背包', () => {
    expect(s.equipped.pendants).toEqual(['pendant-bamboo']);
    expect(s.inventory['pendant-bamboo']).toBe(1);
    expect(s.inventory['food-bamboo-cake']).toBe(3);
    expect(s.inventory['food-strawberry-mochi']).toBe(2);
    expect(s.presets.every(p => p.pendants.length === 0)).toBe(true);
  });
  it('客廳預設擺設在格內', () => {
    const living = s.rooms.living;
    expect(living.wall).toBe('wall-default');
    expect(living.floor).toBe('floor-default');
    expect(living.placed.map(p => p.itemId).sort()).toEqual(['furn-cushion', 'furn-low-table', 'furn-nest']);
    for (const p of living.placed) {
      expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(7);
      expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(5);
    }
    expect(s.rooms.bedroom.placed).toEqual([]);
  });
  it('地圖只有竹林小徑', () => {
    expect(s.map.nodes).toHaveLength(1);
    expect(s.map.nodes[0].snapshot).toEqual({ kind: 'handmade', handmadeId: 'bamboo-path' });
    expect(s.map.nodes[0].seed).toBe(hash(123, 1));
    expect(s.map.nextId).toBe(2);
  });
  it('版本、種子、日期與設定', () => {
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.seed).toBe(123);
    expect(s.createdAt).toBe(1000);
    expect(s.lastDailyDate).toBe(localDate(1000));
    expect(s.settings).toEqual({ sound: true, lastExportAt: null, installHintCollapsed: false });
    expect(s.onboardingDone).toBe(false);
    expect(s.awakeUntil).toBeNull();
  });
});
