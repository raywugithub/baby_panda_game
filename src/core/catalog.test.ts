import { describe, it, expect } from 'vitest';
import { getItem, giftPool } from './catalog';

describe('catalog', () => {
  it('getItem returns the definition', () => {
    expect(getItem('furn-sofa')).toMatchObject({ rarity: 'shiny', interaction: 'sit' });
  });
  it('getItem throws on unknown id', () => {
    expect(() => getItem('furn-nope')).toThrow('unknown item: furn-nope');
  });
  it('giftPool returns only pool items of that rarity', () => {
    const rainbow = giftPool('rainbow');
    expect(rainbow.length).toBe(12);
    expect(rainbow.every((i) => i.inGiftPool && i.rarity === 'rainbow')).toBe(true);
    expect(rainbow.some((i) => i.id.startsWith('furn-juzi'))).toBe(false);
  });
});
