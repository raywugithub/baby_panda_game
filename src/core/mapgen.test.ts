import { describe, it, expect } from 'vitest';
import { spawnChildren, ensureEnterable, canEnter, GENERATOR_VERSION } from './mapgen';
import { fresh, handmadeNode } from './test-helpers';

describe('handmade chain', () => {
  it('bamboo-path spawns exactly one cloud-post child (no requirement)', () => {
    let s = fresh();
    const root = handmadeNode(s, 'bamboo-path');
    s = spawnChildren(s, root.id).state;
    const kids = s.map.nodes.filter(n => n.parentId === root.id);
    expect(kids).toHaveLength(1);
    expect(kids[0].snapshot).toEqual({ kind: 'handmade', handmadeId: 'cloud-post' });
  });
  it('cloud-post spawns exactly one shell-bay child', () => {
    let s = fresh();
    s = spawnChildren(s, handmadeNode(s, 'bamboo-path').id).state;
    const cloud = handmadeNode(s, 'cloud-post');
    s = spawnChildren(s, cloud.id).state;
    const kids = s.map.nodes.filter(n => n.parentId === cloud.id);
    expect(kids.map(k => k.snapshot)).toEqual([{ kind: 'handmade', handmadeId: 'shell-bay' }]);
  });
  it('spawning twice does not duplicate children', () => {
    let s = fresh();
    const root = handmadeNode(s, 'bamboo-path');
    s = spawnChildren(s, root.id).state;
    const count = s.map.nodes.length;
    s = spawnChildren(s, root.id).state;
    expect(s.map.nodes.length).toBe(count);
  });
});

describe('generated children', () => {
  it('shell-bay spawns 1 or 2 generated children, each with generatorVersion', () => {
    let s = fresh();
    s = spawnChildren(s, handmadeNode(s, 'bamboo-path').id).state;
    s = spawnChildren(s, handmadeNode(s, 'cloud-post').id).state;
    const bay = handmadeNode(s, 'shell-bay');
    s = spawnChildren(s, bay.id).state;
    const kids = s.map.nodes.filter(n => n.parentId === bay.id);
    expect([1, 2]).toContain(kids.length);
    for (const k of kids) {
      expect(k.snapshot.kind).toBe('generated');
      if (k.snapshot.kind === 'generated') expect(k.snapshot.generatorVersion).toBe(GENERATOR_VERSION);
    }
  });
  it('same save seed gives identical children (determinism)', () => {
    const run = () => {
      let s = fresh(999);
      s = spawnChildren(s, handmadeNode(s, 'bamboo-path').id).state;
      s = spawnChildren(s, handmadeNode(s, 'cloud-post').id).state;
      return spawnChildren(s, handmadeNode(s, 'shell-bay').id).state.map.nodes;
    };
    expect(run()).toEqual(run());
  });
  it('child count across many seeds is about half 1 and half 2', () => {
    let twos = 0;
    for (let seed = 1; seed <= 400; seed++) {
      let s = fresh(seed);
      s = spawnChildren(s, handmadeNode(s, 'bamboo-path').id).state;
      s = spawnChildren(s, handmadeNode(s, 'cloud-post').id).state;
      const bay = handmadeNode(s, 'shell-bay');
      s = spawnChildren(s, bay.id).state;
      if (s.map.nodes.filter(n => n.parentId === bay.id).length === 2) twos++;
    }
    expect(twos / 400).toBeGreaterThan(0.4);
    expect(twos / 400).toBeLessThan(0.6);
  });
});

describe('canEnter and ensureEnterable', () => {
  it('handmade nodes are always enterable', () => {
    const s = fresh();
    expect(canEnter(s, handmadeNode(s, 'bamboo-path').id)).toBe(true);
  });
  it('a climb-gated node is blocked at stage 1 and open at stage 3 (growthXp 800)', () => {
    let s = fresh();
    const node = { ...handmadeNode(s, 'bamboo-path'), id: 50, parentId: 1, status: 'open' as const,
      snapshot: { kind: 'generated' as const, generatorVersion: 1, name: 'x', terrain: 'bamboo' as const, layout: 0 as const,
        weather: 'sunny' as const, landmarkId: 'lm-cabin', resident: 'passerby' as const, quirkId: 'q01', requires: 'climb' as const } };
    s = { ...s, map: { ...s.map, nodes: [...s.map.nodes, node] } };
    expect(canEnter(s, 50)).toBe(false);
    expect(canEnter({ ...s, growthXp: 800 }, 50)).toBe(true);
  });
  it('ensureEnterable unlocks the newest open generated node when every open node is locked', () => {
    let s = fresh();
    const base = handmadeNode(s, 'bamboo-path');
    const mk = (id: number): any => ({ ...base, id, parentId: 1, status: 'open', seed: id,
      snapshot: { kind: 'generated', generatorVersion: 1, name: 'x', terrain: 'bamboo', layout: 0, weather: 'sunny',
        landmarkId: 'lm-cabin', resident: 'passerby', quirkId: 'q01', requires: 'climb' } });
    const rootDone = s.map.nodes.map(n => (n.id === 1 ? { ...n, status: 'done' as const } : n));
    s = { ...s, map: { ...s.map, nodes: [...rootDone, mk(60), mk(61)] } };
    const fixed = ensureEnterable(s);
    const last = fixed.map.nodes.find(n => n.id === 61)!;
    expect(last.snapshot.kind === 'generated' && last.snapshot.requires).toBeNull();
    expect(canEnter(fixed, 61)).toBe(true);
  });
});

describe('generated location names vary', () => {
  it('60 spawns in a row: no duplicate name and no phrase within 5 consecutive nodes', async () => {
    const { generateSnapshot, nameOf } = await import('./locationgen');
    const { QUIRKS } = await import('../content/locations');
    const names: string[] = [];
    for (let i = 0; i < 60; i++) {
      const snap = generateSnapshot(1000 + i * 37, ['climb', 'dive'], names);
      names.push(nameOf(snap));
    }
    expect(new Set(names).size).toBe(60);
    const phrase = (n: string) => QUIRKS.find((q) => n.startsWith(q.phrase))!.phrase;
    for (let i = 5; i < names.length; i++) {
      expect(names.slice(i - 5, i).map(phrase)).not.toContain(phrase(names[i]));
    }
  });
  it('first-try names are unchanged when nothing is taken (old seeds stay the same)', async () => {
    const { generateSnapshot } = await import('./locationgen');
    expect(generateSnapshot(42, ['climb'])).toEqual(generateSnapshot(42, ['climb'], []));
  });
});
