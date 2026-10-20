import { describe, it, expect } from 'vitest';
import { FRIEND_STORIES } from './friend-stories';
import { FRIEND_IDS } from '../friends';

describe('friend storylines', () => {
  it('has 5 segments for each of the 4 friends', () => {
    expect(Object.keys(FRIEND_STORIES)).toHaveLength(20);
    for (const id of FRIEND_IDS) for (let n = 1; n <= 5; n++) {
      const s = FRIEND_STORIES[`friend-${id}-${n}`];
      expect(s).toBeDefined();
      expect(s.id).toBe(`friend-${id}-${n}`);
      expect(s.lines.length).toBeGreaterThanOrEqual(4);
      expect(s.lines.length).toBeLessThanOrEqual(6);
      expect(s.lines[0].speaker).toBe(id);
    }
  });
});
