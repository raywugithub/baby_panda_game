import { describe, it, expect } from 'vitest';
import { buy, priceOf } from './shop';
import { createInitialState } from './state';

const base = () => ({ ...createInitialState(1, 0), marshmallow: 300, inventory: {} as Record<string, number> });

describe('marshmallow shop', () => {
  it('prices are 20 / 60 / 200', () => {
    expect([priceOf('common'), priceOf('shiny'), priceOf('rainbow')]).toEqual([20, 60, 200]);
  });
  it('buys a gift-pool item and spends marshmallow', () => {
    const r = buy(base(), 'furn-sofa');
    expect(r).not.toBeNull();
    expect(r!.state.marshmallow).toBe(240);
    expect(r!.state.inventory['furn-sofa']).toBe(1);
  });
  it('refuses non-pool items (starter pendant)', () => {
    expect(buy(base(), 'pendant-bamboo')).toBeNull();
  });
  it('refuses when marshmallow is short', () => {
    expect(buy({ ...base(), marshmallow: 19 }, 'furn-plant-pot')).toBeNull();
  });
  it('refuses a second copy of a wearable or surface, allows furniture repeats', () => {
    const s = { ...base(), inventory: { 'outfit-head-bow': 1, 'furn-plant-pot': 1 } };
    expect(buy(s, 'outfit-head-bow')).toBeNull();
    expect(buy(s, 'furn-plant-pot')!.state.inventory['furn-plant-pot']).toBe(2);
  });
});
