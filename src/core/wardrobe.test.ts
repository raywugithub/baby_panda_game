import { describe, it, expect } from 'vitest';
import { equip, setPendants, savePreset, loadPreset } from './wardrobe';
import { createInitialState } from './state';

const owned = (ids: string[], chainLinks = 0) => {
  const s = createInitialState(1, 0);
  const inv: Record<string, number> = { 'pendant-bamboo': 1 };
  for (const id of ids) inv[id] = 1;
  return { ...s, chainLinks, inventory: inv };
};

describe('wardrobe', () => {
  it('equip puts an owned outfit in the matching slot', () => {
    const s = equip(owned(['outfit-head-bow']), 'head', 'outfit-head-bow');
    expect(s.equipped.outfit.head).toBe('outfit-head-bow');
  });
  it('equip rejects wrong slot or unowned item', () => {
    const base = owned(['outfit-head-bow']);
    expect(equip(base, 'face', 'outfit-head-bow')).toBe(base);
    expect(equip(base, 'head', 'outfit-head-cap')).toBe(base);
  });
  it('equip null clears the slot', () => {
    const s = equip(owned(['outfit-head-bow']), 'head', 'outfit-head-bow');
    expect(equip(s, 'head', null).equipped.outfit.head).toBeUndefined();
  });
  it('setPendants respects pendantSlots (2 at start, 3 at 50 chain links)', () => {
    const base = owned(['pendant-shell', 'pendant-star'], 0);
    expect(setPendants(base, ['pendant-bamboo', 'pendant-shell', 'pendant-star']).equipped.pendants).toEqual(base.equipped.pendants); // 3 > 2 slots, rejected
    const ok = setPendants(base, ['pendant-bamboo', 'pendant-shell']);
    expect(ok.equipped.pendants).toEqual(['pendant-bamboo', 'pendant-shell']);
    const more = owned(['pendant-shell', 'pendant-star'], 50);
    expect(setPendants(more, ['pendant-bamboo', 'pendant-shell', 'pendant-star']).equipped.pendants.length).toBe(3);
  });
  it('setPendants rejects duplicates and unowned', () => {
    const base = owned([], 0);
    expect(setPendants(base, ['pendant-bamboo', 'pendant-bamboo']).equipped.pendants).toEqual(base.equipped.pendants);
    expect(setPendants(base, ['pendant-shell']).equipped.pendants).toEqual(base.equipped.pendants);
  });
  it('save and load presets, dropping items no longer owned', () => {
    let s = equip(owned(['outfit-tail-bow']), 'tail', 'outfit-tail-bow');
    s = savePreset(s, 1);
    s = { ...s, inventory: { ...s.inventory, 'outfit-tail-bow': 0 } };
    s = loadPreset(s, 1);
    expect(s.equipped.outfit.tail).toBeUndefined();
  });
});
