import { describe, it, expect } from 'vitest';
import { checkMilestones, milestoneThreshold, milestoneTitle } from './milestones';
import { createInitialState } from './state';
import { ITEMS } from '../content/items';
import { levelOf } from './friendLevel';

const withInventory = (ids: string[]) => {
  const s = createInitialState(1, 0);
  const inv: Record<string, number> = {};
  for (const id of ids) inv[id] = 1;
  return { ...s, inventory: inv };
};

describe('milestones', () => {
  it('thresholds 10, 30, 50, then every 25', () => {
    expect([1, 2, 3, 4, 5].map(milestoneThreshold)).toEqual([10, 30, 50, 75, 100]);
  });
  it('titles', () => {
    expect(milestoneTitle(1)).toBe('收藏新星');
    expect(milestoneTitle(4)).toBe('收藏傳說 1');
  });
  it('claims furniture milestone at 10 owned: +1 free box, one event', () => {
    const ids = ITEMS.filter((i) => i.category === 'furniture' && !i.id.startsWith('furn-mianhua') && !i.id.startsWith('furn-juzi') && !i.id.startsWith('furn-manman') && !i.id.startsWith('furn-gulu')).slice(0, 10).map((i) => i.id);
    const s0 = withInventory(ids);
    const out = checkMilestones(s0);
    expect(out.state.milestonesClaimed.furniture).toBe(1);
    expect(out.state.freeBoxes).toBe(s0.freeBoxes + 1);
    expect(out.events).toContainEqual({ type: 'milestone', category: 'furniture', count: 10 });
  });
  it('is idempotent after a claim: second call returns no events and equal state', () => {
    const ids = ITEMS.filter((i) => i.category === 'furniture' && !i.id.startsWith('furn-mianhua') && !i.id.startsWith('furn-juzi') && !i.id.startsWith('furn-manman') && !i.id.startsWith('furn-gulu')).slice(0, 10).map((i) => i.id);
    const once = checkMilestones(withInventory(ids));
    expect(once.events).toContainEqual({ type: 'milestone', category: 'furniture', count: 10 });
    expect(once.state.milestonesClaimed.furniture).toBe(1);
    const twice = checkMilestones(once.state);
    expect(twice.events).toEqual([]);
    expect(twice.state).toEqual(once.state);
  });
  it('friend levels follow contract §10.4: 59 points is level 2, 60 is level 3', () => {
    expect(levelOf(59)).toBe(2);
    expect(levelOf(60)).toBe(3);
  });
  it('does not grant friend furniture even at friend level 3 (60 points); B owns that grant', () => {
    const s0 = createInitialState(1, 0);
    const s = { ...s0, friends: { ...s0.friends, mianhua: { points: 60, chatsToday: 0 } } };
    const out = checkMilestones(s);
    expect(out.state.inventory['furn-mianhua-1']).toBeUndefined();
    expect(out.events.some((e) => e.type === 'reward')).toBe(false);
  });
});
