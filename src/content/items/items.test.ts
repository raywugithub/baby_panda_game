import { describe, it, expect } from 'vitest';
import { STARTER_ITEMS } from './starter';
import { FURNITURE_ITEMS } from './furniture';
import { DECOR_ITEMS } from './decor';
import { OUTFIT_ITEMS } from './outfits';
import { PENDANT_ITEMS } from './pendants';
import { ITEMS } from './index';
import { FRIEND_FURNITURE } from '../friendFurniture';

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

describe('task 2 merged catalog', () => {
  const count = (c: string) => ITEMS.filter((i) => i.category === c).length;
  it('totals per category', () => {
    expect(count('furniture')).toBe(36);   // 24 living incl. 3 starter + 12 friend
    expect(count('wall')).toBe(6);
    expect(count('floor')).toBe(6);
    expect(count('outfit')).toBe(20);
    expect(count('pendant')).toBe(8);
    expect(count('ingredient')).toBe(6);
    expect(count('sticker')).toBe(24);
    expect(count('frame')).toBe(6);
    expect(ITEMS.length).toBe(112);
  });
  it('ids are unique and prefixed by category', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(112);
    const prefix: Record<string, string> = { furniture: 'furn-', wall: 'wall-', floor: 'floor-', outfit: 'outfit-', pendant: 'pendant-', ingredient: 'ing-', sticker: 'sticker-', frame: 'frame-' };
    for (const i of ITEMS) expect(i.id.startsWith(prefix[i.category])).toBe(true);
  });
  it('gift pool size per rarity is 37 common, 18 shiny, 12 rainbow', () => {
    // Breakdown (common/shiny/rainbow): starter 3/0/0 + living furniture 12/6/3 + decor 6/2/2
    // + outfits 10/5/5 + pendants 2/3/2 + ingredients 4/2/0 = 37/18/12 (contract §10.1, §10.2)
    const pool = ITEMS.filter((i) => i.inGiftPool);
    expect(pool.filter((i) => i.rarity === 'common').length).toBe(37);
    expect(pool.filter((i) => i.rarity === 'shiny').length).toBe(18);
    expect(pool.filter((i) => i.rarity === 'rainbow').length).toBe(12);
  });
  it('friend furniture, stickers and frames are never in the pool', () => {
    for (const i of ITEMS.filter((x) => x.id.startsWith('furn-mianhua') || x.id.startsWith('furn-juzi') || x.id.startsWith('furn-manman') || x.id.startsWith('furn-gulu') || x.category === 'sticker' || x.category === 'frame')) {
      expect(i.inGiftPool).toBe(false);
    }
  });
  it('friend furniture table has 12 entries, levels 3/6/10 per friend', () => {
    expect(FRIEND_FURNITURE.length).toBe(12);
    for (const f of ['mianhua', 'juzi', 'manman', 'gulu']) {
      expect(FRIEND_FURNITURE.filter((x) => x.friendId === f).map((x) => x.level)).toEqual([3, 6, 10]);
    }
  });
});
