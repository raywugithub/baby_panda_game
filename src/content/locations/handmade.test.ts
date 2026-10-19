import { describe, it, expect } from 'vitest';
import type { FriendId } from '../../core/state';
import { HANDMADE, HANDMADE_SECRET } from './handmade';

// FRIEND_IDS 本應來自 ../friends（Task 13）；該檔尚未存在，暫以同順序的常數代替。
const FRIEND_IDS: FriendId[] = ['mianhua', 'juzi', 'manman', 'gulu'];

describe('handmade locations', () => {
  it('defines the three chain locations with names and terrains from spec 6.3', () => {
    expect(HANDMADE['bamboo-path'].name).toBe('竹林小徑');
    expect(HANDMADE['cloud-post'].name).toBe('雲朵郵局');
    expect(HANDMADE['shell-bay'].name).toBe('貝殼灣');
    expect(HANDMADE['bamboo-path'].terrain).toBe('bamboo');
    expect(HANDMADE['cloud-post'].terrain).toBe('cloud');
    expect(HANDMADE['shell-bay'].terrain).toBe('beach');
  });
  it('residents are friends or passerby and every talk has at least 6 lines', () => {
    for (const h of Object.values(HANDMADE)) {
      expect(h.resident === 'passerby' || FRIEND_IDS.includes(h.resident)).toBe(true);
      expect(h.talk.length).toBeGreaterThanOrEqual(6);
    }
  });
  it('secret kinds match the layout overrides used by dailyLayout', () => {
    expect(HANDMADE_SECRET).toEqual({ 'bamboo-path': 'hidden', 'cloud-post': 'codelock', 'shell-bay': 'shadow' });
  });
  it('request kinds follow the chain: find, bring, find', () => {
    expect(HANDMADE['bamboo-path'].request.kind).toBe('find');
    expect(HANDMADE['cloud-post'].request.kind).toBe('bring');
    expect(HANDMADE['shell-bay'].request.kind).toBe('find');
  });
  it('shell-bay and cloud-post talk point to the collar mystery', () => {
    for (const id of ['cloud-post', 'shell-bay'] as const) {
      const text = HANDMADE[id].talk.map(l => l.text).join('');
      expect(/慢慢老師|項圈/.test(text)).toBe(true);
    }
  });
});
