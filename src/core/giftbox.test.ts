import { describe, it, expect } from 'vitest';
import { openGiftBox, canOpen, rollRarity, GIFT_RATES } from './giftbox';
import { createInitialState } from './state';
import { mulberry32 } from './rng';
import { ITEMS } from '../content/items';

const fresh = () => createInitialState(42, 0);

describe('gift box', () => {
  it('first box of the day is free and keeps star sand', () => {
    const r = openGiftBox(fresh(), mulberry32(1));
    expect(r.state.daily.freeBoxUsed).toBe(true);
    expect(r.state.starSand).toBe(100);
  });
  it('then uses freeBoxes before star sand', () => {
    const s0 = fresh();
    const s = { ...s0, daily: { ...s0.daily, freeBoxUsed: true }, freeBoxes: 1 };
    const a = openGiftBox(s, mulberry32(1));
    expect(a.state.freeBoxes).toBe(0);
    expect(a.state.starSand).toBe(100);
    const b = openGiftBox(a.state, mulberry32(2));
    expect(b.state.starSand).toBe(50);
  });
  it('cannot open with no free box and under 50 star sand', () => {
    const s0 = fresh();
    const s = { ...s0, daily: { ...s0.daily, freeBoxUsed: true }, freeBoxes: 0, starSand: 49 };
    expect(canOpen(s)).toBe(false);
    const r = openGiftBox(s, mulberry32(1));
    expect(r.itemId).toBe('');
    expect(r.state).toBe(s);
  });
  it('rolls rarity 75/22/3 over 20000 draws (±1 point)', () => {
    const rand = mulberry32(7);
    const counts = { common: 0, shiny: 0, rainbow: 0 };
    for (let i = 0; i < 20000; i++) counts[rollRarity(rand())]++;
    // ±1 percentage point. toBeCloseTo(x, 2) would only allow ±0.005 and is too tight for a fixed seed.
    for (const k of ['common', 'shiny', 'rainbow'] as const) {
      expect(Math.abs(counts[k] / 20000 - GIFT_RATES[k])).toBeLessThanOrEqual(0.01);
    }
  });
  it('duplicate converts to marshmallow 5/15/40 by rarity', () => {
    const s0 = fresh();
    const s = { ...s0, inventory: { ...s0.inventory } };
    // Own every item so every roll is a duplicate.
    for (const i of ITEMS) s.inventory[i.id] = 1;
    const r = openGiftBox(s, mulberry32(3));
    expect(r.duplicate).toBe(true);
    const delta = r.state.marshmallow - s.marshmallow;
    expect([5, 15, 40]).toContain(delta);
  });
  it('ingredient adds count and never converts', () => {
    const s0 = fresh();
    const s = { ...s0, inventory: { ...s0.inventory } };
    for (const i of ITEMS) if (i.category === 'ingredient') s.inventory[i.id] = 1;
    // Scan seeds until a box yields an ingredient, so the assertion always runs.
    let hit: ReturnType<typeof openGiftBox> | null = null;
    for (let seed = 1; seed <= 500 && !hit; seed++) {
      const r = openGiftBox(s, mulberry32(seed));
      if (r.itemId.startsWith('ing-')) hit = r;
    }
    expect(hit).not.toBeNull();
    expect(hit!.duplicate).toBe(false);
    expect(hit!.state.inventory[hit!.itemId]).toBe(2);
  });
});
