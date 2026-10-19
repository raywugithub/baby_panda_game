import { describe, it, expect } from 'vitest';
import { levelOf, addAffinity, chat, giveGift, storySegmentsUnlocked } from './friends';
import { fresh } from './test-helpers';
import { setPendants } from './wardrobe';

describe('levelOf', () => {
  it('follows 20 x n single-level cost, unlimited', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(19)).toBe(1);
    expect(levelOf(20)).toBe(2);
    expect(levelOf(59)).toBe(2);
    expect(levelOf(60)).toBe(3);
    expect(levelOf(120)).toBe(4);
    expect(levelOf(10 * 99 * 100)).toBe(100);
  });
});

describe('addAffinity', () => {
  it('emits friendLevelUp when crossing a threshold', () => {
    const out = addAffinity(fresh(), 'mianhua', 20);
    expect(out.state.friends.mianhua.points).toBe(20);
    expect(out.events).toContainEqual({ type: 'friendLevelUp', friendId: 'mianhua', level: 2 });
  });
  it('unlocks exclusive furniture at levels 3, 6 and 10', () => {
    let s = fresh();
    s = addAffinity(s, 'juzi', 60).state; // level 3
    expect(s.inventory['furn-juzi-1']).toBe(1);
    s = addAffinity(s, 'juzi', 240).state; // 300 points: level 6
    expect(s.inventory['furn-juzi-2']).toBe(1);
    s = addAffinity(s, 'juzi', 600).state; // 900 points: level 10
    expect(s.inventory['furn-juzi-3']).toBe(1);
    s = addAffinity(s, 'juzi', 1).state;   // 901 points: still level 10, no second grant
    expect(s.inventory['furn-juzi-3']).toBe(1);
  });
  it('heart pendant adds +1 per award', () => {
    const owned = { ...fresh(), inventory: { 'pendant-heart': 1 } };
    const s = setPendants(owned, ['pendant-heart']);
    expect(s.equipped.pendants).toEqual(['pendant-heart']); // slot count at chainLinks 0 allows it
    expect(addAffinity(s, 'gulu', 5).state.friends.gulu.points).toBe(6);
  });
});

describe('chat', () => {
  it('+1 per chat, capped at 3 per day per friend', () => {
    let s = fresh();
    for (let i = 0; i < 3; i++) s = chat(s, 'manman').state;
    expect(s.friends.manman.points).toBe(3);
    expect(chat(s, 'manman').state).toBe(s);
    expect(s.friends.gulu.chatsToday).toBe(0);
  });
});

describe('giveGift', () => {
  it('liked gift +10, other gift +5, consumes one item', () => {
    const s = { ...fresh(), inventory: { 'food-starry-apple': 2, 'food-bamboo-cake': 1 } };
    const liked = giveGift(s, 'juzi', 'food-starry-apple')!; // juzi likes starry apple
    expect(liked.state.friends.juzi.points).toBe(10);
    expect(liked.state.inventory['food-starry-apple']).toBe(1);
    const other = giveGift(s, 'juzi', 'food-bamboo-cake')!;
    expect(other.state.friends.juzi.points).toBe(5);
    expect(other.state.inventory['food-bamboo-cake']).toBeUndefined();
  });
  it('returns null without the item or for a non-food item', () => {
    expect(giveGift(fresh(), 'juzi', 'food-starry-apple')).toBeNull();
    expect(giveGift({ ...fresh(), inventory: { 'wall-default': 1 } }, 'juzi', 'wall-default')).toBeNull();
  });
});

describe('storySegmentsUnlocked', () => {
  it('level n unlocks segments 1..n, capped at 5', () => {
    expect(storySegmentsUnlocked(1)).toBe(1);
    expect(storySegmentsUnlocked(4)).toBe(4);
    expect(storySegmentsUnlocked(9)).toBe(5);
  });
});
