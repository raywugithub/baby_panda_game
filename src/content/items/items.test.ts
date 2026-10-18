import { describe, it, expect } from 'vitest';
import { STARTER_ITEMS } from './starter';
import { FURNITURE_ITEMS } from './furniture';
import { DECOR_ITEMS } from './decor';
import { OUTFIT_ITEMS } from './outfits';
import { PENDANT_ITEMS } from './pendants';

const all = [...STARTER_ITEMS, ...FURNITURE_ITEMS, ...DECOR_ITEMS, ...OUTFIT_ITEMS, ...PENDANT_ITEMS];

describe('task 1 item definitions', () => {
  it('living furniture non-starter count is 21 with 6 interactive', () => {
    const living = FURNITURE_ITEMS; // friend furniture lives in items/friends.ts
    expect(living.length).toBe(21);
    expect(living.filter((i) => i.interaction).length).toBe(6);
  });
  it('decor: 5 walls + 5 floors (non-starter)', () => {
    expect(DECOR_ITEMS.filter((i) => i.category === 'wall').length).toBe(5);
    expect(DECOR_ITEMS.filter((i) => i.category === 'floor').length).toBe(5);
  });
  it('outfits: 20 across 5 slots, 4 each', () => {
    expect(OUTFIT_ITEMS.length).toBe(20);
    for (const slot of ['head', 'face', 'body', 'hand', 'tail'] as const) {
      expect(OUTFIT_ITEMS.filter((i) => i.slot === slot).length).toBe(4);
    }
  });
  it('pendants: 7 non-starter, each with a unique sound id', () => {
    expect(PENDANT_ITEMS.length).toBe(7);
    const sounds = PENDANT_ITEMS.map((p) => p.sound);
    expect(new Set(sounds).size).toBe(7);
    expect(sounds.every((s) => typeof s === 'string')).toBe(true);
    expect(PENDANT_ITEMS.find((p) => p.id === 'pendant-moon-bell')?.pendant).toEqual({ kind: 'diaryDream' });
  });
  it('starter values match the contract table', () => {
    const get = (id: string) => STARTER_ITEMS.find((i) => i.id === id)!;
    expect(get('furn-nest')).toMatchObject({ rarity: 'common', inGiftPool: true, size: { w: 2, h: 2 } });
    expect(get('furn-low-table')).toMatchObject({ inGiftPool: true, size: { w: 2, h: 1 } });
    expect(get('furn-cushion')).toMatchObject({ inGiftPool: true, size: { w: 1, h: 1 } });
    // C17: starter furn-nest and furn-cushion keep their interactions (the panda may use them).
    expect(get('furn-nest').interaction).toBe('sleep');
    expect(get('furn-cushion').interaction).toBe('sit');
    expect(get('wall-default').inGiftPool).toBe(false);
    expect(get('floor-default').inGiftPool).toBe(false);
    // C1: bamboo pendant keeps sound 'bell-soft'.
    expect(get('pendant-bamboo')).toMatchObject({ inGiftPool: false, sound: 'bell-soft' });
  });
  it('every non-starter item has a non-empty hint and no duplicate ids', () => {
    const rest = all.filter((i) => !STARTER_ITEMS.includes(i));
    expect(rest.every((i) => i.hint.trim().length > 0)).toBe(true);
    expect(new Set(all.map((i) => i.id)).size).toBe(all.length);
  });
});
