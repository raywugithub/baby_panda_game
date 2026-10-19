import { describe, it, expect } from 'vitest';
import { FRIENDS, FRIEND_IDS } from './friends';
import { FOOD_IDS } from './foods';

describe('friends content', () => {
  it('has four unique friends in the spec order', () => {
    expect(FRIENDS.map(f => f.id)).toEqual(['mianhua', 'juzi', 'manman', 'gulu']);
    expect(FRIEND_IDS).toEqual(FRIENDS.map(f => f.id));
  });
  it('each friend has exactly 10 chat lines and one liked food that exists', () => {
    for (const f of FRIENDS) {
      expect(f.chat).toHaveLength(10);
      expect(new Set(f.chat).size).toBe(10);
      expect(f.likes).toHaveLength(1);
      expect(FOOD_IDS).toContain(f.likes[0]);
    }
  });
});
