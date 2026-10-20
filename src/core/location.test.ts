import { describe, it, expect } from 'vitest';
import { enter, tapHotspot, talk, solveSecret, bringFood, layoutFor, finishMinigame } from './location';
import { pendantModifiers } from './pendants';
import { fresh, handmadeNode, NOW, TODAY, dayLater } from './test-helpers';

const bambooId = (s: any) => handmadeNode(s, 'bamboo-path').id;

describe('enter', () => {
  it('rejects when energy is 24 and leaves state unchanged', () => {
    const s = { ...fresh(), energy: 24 };
    expect(enter(s, bambooId(s), NOW)).toBe(s);
  });
  it('accepts at energy 25 and does not charge energy on enter', () => {
    const s = { ...fresh(), energy: 25 };
    const out = enter(s, bambooId(s), NOW);
    expect(out.energy).toBe(25);
    expect(out.map.nodes.find(n => n.id === bambooId(s))!.progress).toMatchObject({ date: TODAY, talked: false, treasureFound: false });
  });
  it('blocks re-entering a node already completed today', () => {
    let s = fresh();
    const n = bambooId(s);
    s = { ...s, map: { ...s.map, nodes: s.map.nodes.map(x => x.id === n ? { ...x, status: 'done', lastCompletedDate: TODAY } : x) } };
    expect(enter(s, n, NOW)).toBe(s);
  });
});

describe('hotspots and progress', () => {
  it('tapping the same hotspot twice gives the reward only once (idempotent)', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    const treasure = layoutFor(s, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    const first = tapHotspot(s, id, treasure.id, NOW);
    const second = tapHotspot(first.state, id, treasure.id, NOW);
    expect(second.state.starSand).toBe(first.state.starSand);
    expect(second.events).toHaveLength(0);
  });
  it('progress survives leaving and returning the same day', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    const tap = layoutFor(s, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    s = tapHotspot(s, id, tap.id, NOW).state;
    s = enter(s, id, NOW + 60_000);
    expect(s.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toContain(tap.id);
  });
  it('progress resets on a new local date', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    const tap = layoutFor(s, id, TODAY).hotspots.find(h => h.role === 'clue' || h.role === 'filler')!;
    s = tapHotspot(s, id, tap.id, NOW).state;
    s = enter(s, id, NOW + 86_400_000);
    expect(s.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toEqual([]);
  });
  it('a hidden secret is recorded as found under id "secret"', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    expect(layoutFor(s, id, TODAY).secret.kind).toBe('hidden'); // bamboo-path is always hidden per Task 4
    s = tapHotspot(s, id, 'secret', NOW).state;
    expect(s.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toContain('secret');
  });
});

describe('talk and secret puzzles', () => {
  it('talk sets talked once; second talk is a no-op', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    s = talk(s, id, NOW).state;
    const again = talk(s, id, NOW);
    expect(again.events).toHaveLength(0);
    expect(s.map.nodes.find(n => n.id === id)!.progress!.talked).toBe(true);
  });
  it('solveSecret marks "secret" once and is idempotent', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    s = solveSecret(s, id, NOW);
    const once = s;
    s = solveSecret(s, id, NOW);
    expect(s).toEqual(once);
  });
});

describe('requests and puzzle secrets (extra coverage)', () => {
  it('a find request grants xp 15 and starSand 10 once', () => {
    const s0 = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s0);
    const layout = layoutFor(s0, id, TODAY);
    expect(layout.request.kind).toBe('find'); // bamboo-path always requests a find
    if (layout.request.kind !== 'find') return;
    const req = layout.hotspots.find(h => h.role === 'request')!;
    const out = tapHotspot(s0, id, req.id, NOW);
    expect(out.state.growthXp).toBe(s0.growthXp + 15);
    expect(out.state.starSand).toBe(s0.starSand + 10);
    expect(tapHotspot(out.state, id, req.id, NOW).events).toHaveLength(0);
  });

  it('bringFood is null for the wrong food and consumes one matching item once', () => {
    // cloud-post always brings a food; swap the snapshot on this node (test-only)
    let s = fresh();
    const id = bambooId(s);
    s = { ...s, map: { ...s.map, nodes: s.map.nodes.map(n => n.id === id ? { ...n, snapshot: { kind: 'handmade', handmadeId: 'cloud-post' } } : n) } };
    s = enter(s, id, NOW);
    const layout = layoutFor(s, id, TODAY);
    expect(layout.request.kind).toBe('bring');
    if (layout.request.kind !== 'bring') return;
    const foodId = layout.request.foodId;
    s = { ...s, inventory: { ...s.inventory, [foodId]: 2 } };
    expect(bringFood(s, id, 'not-a-real-food', NOW)).toBeNull();
    const out = bringFood(s, id, foodId, NOW)!;
    expect(out.state.inventory[foodId]).toBe(1);
    expect(out.state.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toContain('request');
    expect(bringFood(out.state, id, foodId, NOW)).toBeNull();
  });

  it('solveSecret marks "secret" on a puzzle-secret node', () => {
    let s = fresh();
    const id = bambooId(s);
    // borrow cloud-post's codelock secret by swapping this node's snapshot (test-only)
    s = { ...s, map: { ...s.map, nodes: s.map.nodes.map(n => n.id === id ? { ...n, snapshot: { kind: 'handmade', handmadeId: 'cloud-post' } } : n) } };
    s = enter(s, id, NOW);
    expect(layoutFor(s, id, TODAY).secret.kind).toBe('puzzle');
    const solved = solveSecret(s, id, NOW);
    expect(solved.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toContain('secret');
    expect(solveSecret(solved, id, NOW)).toEqual(solved);
  });
});

describe('handmade residents', () => {
  it('tapping bamboo-path find request gives manman +10 affinity', () => {
    const s0 = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s0);
    const req = layoutFor(s0, id, TODAY).hotspots.find(h => h.role === 'request')!;
    const before = s0.friends.manman.points;
    const out = tapHotspot(s0, id, req.id, NOW);
    expect(out.state.friends.manman.points - before).toBe(10 + pendantBonus(s0));
  });

  it('talk on bamboo-path calls chat for manman', () => {
    const s0 = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s0);
    const out = talk(s0, id, NOW);
    expect(out.state.friends.manman.chatsToday).toBe(1);
    expect(out.state.friends.manman.points).toBeGreaterThan(s0.friends.manman.points);
    expect(out.state.map.nodes.find(n => n.id === id)!.progress!.talked).toBe(true);
  });

  it('bringFood on cloud-post gives mianhua +10 affinity', () => {
    let s = fresh();
    const id = bambooId(s);
    s = { ...s, map: { ...s.map, nodes: s.map.nodes.map(n => n.id === id ? { ...n, snapshot: { kind: 'handmade', handmadeId: 'cloud-post' } } : n) } };
    s = enter(s, id, NOW);
    const layout = layoutFor(s, id, TODAY);
    expect(layout.request.kind).toBe('bring');
    if (layout.request.kind !== 'bring') return;
    const foodId = layout.request.foodId;
    s = { ...s, inventory: { ...s.inventory, [foodId]: 1 } };
    const before = s.friends.mianhua.points;
    const out = bringFood(s, id, foodId, NOW)!;
    expect(out.state.friends.mianhua.points - before).toBe(10 + pendantBonus(s));
  });
});

function pendantBonus(s: ReturnType<typeof fresh>): number {
  return pendantModifiers(s).affinityBonus;
}

describe('finishMinigame', () => {
  it('finishMinigame counts once per day even if called twice (abort then finish)', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    s = finishMinigame(s, id, 'stars', null, NOW).state;
    const again = finishMinigame(s, id, 'stars', 1, NOW);
    expect(again.state).toBe(s);
    expect(again.events).toHaveLength(0);
  });
  it('a skipped minigame gives no reward but is marked done', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    const before = s.starSand;
    s = finishMinigame(s, id, 'hop', null, NOW).state;
    expect(s.starSand).toBe(before);
    expect(s.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toContain('minigame');
  });
});
