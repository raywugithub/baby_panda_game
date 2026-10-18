import { describe, it, expect } from 'vitest';
import { canPlace, place, move, flip, stow, roomUnlocked, pickInteraction, setSurface } from './room';
import { createInitialState } from './state';
import { getItem } from './catalog';
import { mulberry32 } from './rng';
import type { RoomState } from './state';

// Fresh living room (no starter furniture) with the given items added to inventory.
const withItems = (ids: string[]) => {
  const s = createInitialState(1, 0);
  const inv: Record<string, number> = { ...s.inventory };
  for (const id of ids) inv[id] = (inv[id] ?? 0) + 1;
  return { ...s, inventory: inv, rooms: { ...s.rooms, living: { ...s.rooms.living, placed: [] } } };
};

describe('room rules', () => {
  it('floor footprint must fit inside 8x6', () => {
    const room = createInitialState(1, 0).rooms.living;
    expect(canPlace(room, getItem('furn-bed'), 7, 0, 'floor')).toBe(false); // 2x2 at x=7 overflows
    expect(canPlace(room, getItem('furn-bed'), 6, 4, 'floor')).toBe(true);
    expect(canPlace(room, getItem('furn-bed'), 6, 5, 'floor')).toBe(false); // y+h=7 > 6
  });
  it('no overlap between footprints', () => {
    const s = place(withItems(['furn-bed', 'furn-plant-pot']), 'living', 'furn-bed', 0, 0)!;
    expect(s).not.toBeNull();
    expect(canPlace(s.rooms.living, getItem('furn-plant-pot'), 1, 1, 'floor')).toBe(false);
    expect(canPlace(s.rooms.living, getItem('furn-plant-pot'), 2, 0, 'floor')).toBe(true);
  });
  it('wall-mounted items only on the wall row', () => {
    const room = createInitialState(1, 0).rooms.living;
    expect(canPlace(room, getItem('furn-lantern'), 0, 0, 'floor')).toBe(false);
    expect(canPlace(room, getItem('furn-lantern'), 7, 0, 'wall')).toBe(true);
    expect(canPlace(room, getItem('furn-lantern'), 8, 0, 'wall')).toBe(false);
  });
  it('place requires an owned, unplaced copy', () => {
    const s = withItems(['furn-plant-pot']);
    const once = place(s, 'living', 'furn-plant-pot', 0, 0)!;
    expect(once.rooms.living.placed[0].uid).toBe('furn-plant-pot#1');
    expect(place(once, 'living', 'furn-plant-pot', 3, 3)).toBeNull(); // only 1 owned
  });
  it('move keeps the old spot for the moved item (ignoreUid) and rejects overlap', () => {
    const s = place(withItems(['furn-plant-pot']), 'living', 'furn-plant-pot', 0, 0)!;
    expect(move(s, 'living', 'furn-plant-pot#1', 0, 0)).not.toBeNull();
    expect(move(s, 'living', 'furn-plant-pot#1', 8, 0)).toBeNull();
  });
  it('flip toggles and stow removes', () => {
    const s = place(withItems(['furn-plant-pot']), 'living', 'furn-plant-pot', 0, 0)!;
    expect(flip(s, 'living', 'furn-plant-pot#1').rooms.living.placed[0].flipped).toBe(true);
    expect(stow(s, 'living', 'furn-plant-pot#1').rooms.living.placed).toEqual([]);
  });
  it('bedroom unlocks at stage 2 (275 xp = 5 marks)', () => {
    expect(roomUnlocked(createInitialState(1, 0), 'bedroom')).toBe(false);
    expect(roomUnlocked({ ...createInitialState(1, 0), growthXp: 275 }, 'bedroom')).toBe(true);
  });
  it('setSurface requires owned wall of matching surface', () => {
    const s = withItems(['wall-bamboo']);
    expect(setSurface(s, 'living', 'wall', 'wall-bamboo').rooms.living.wall).toBe('wall-bamboo');
    expect(setSurface(s, 'living', 'floor', 'wall-bamboo').rooms.living.floor).toBe(s.rooms.living.floor);
  });
  it('pickInteraction returns null with no interactive furniture or roll failure', () => {
    const room: RoomState = { wall: 'wall-default', floor: 'floor-default', placed: [] };
    expect(pickInteraction(room, mulberry32(1))).toBeNull();
  });
  it('pickInteraction picks a placed interactive item when rolled', () => {
    const s = place(withItems(['furn-sofa']), 'living', 'furn-sofa', 0, 0)!;
    let hit = null;
    for (let seed = 1; seed < 50 && !hit; seed++) hit = pickInteraction(s.rooms.living, mulberry32(seed));
    expect(hit).toEqual({ uid: 'furn-sofa#1', interaction: 'sit' });
  });
});
