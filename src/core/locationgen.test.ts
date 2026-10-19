import { describe, it, expect } from 'vitest';
import { generateSnapshot, GENERATOR_VERSION, dailyLayout } from './locationgen';
import { TERRAINS } from '../content/locations';
import { fresh } from './test-helpers';
import { NOW } from './test-helpers';
import { localDate } from './time';
import type { MapNode } from './state';

describe('generateSnapshot', () => {
  it('is deterministic for the same seed', () => {
    expect(generateSnapshot(42, ['climb', 'dive'])).toEqual(generateSnapshot(42, ['climb', 'dive']));
  });
  it('is generated kind with the current generatorVersion', () => {
    const snap = generateSnapshot(7, ['climb', 'dive']);
    expect(snap.kind).toBe('generated');
    if (snap.kind === 'generated') expect(snap.generatorVersion).toBe(GENERATOR_VERSION);
  });
  it('only requires implemented abilities and only where the terrain maps to it', () => {
    for (let seed = 1; seed < 2000; seed++) {
      const snap = generateSnapshot(seed, ['climb', 'dive']);
      if (snap.kind !== 'generated' || snap.requires === null) continue;
      expect(['climb', 'dive']).toContain(snap.requires);
      expect(TERRAINS.find(t => t.id === snap.terrain)!.ability).toBe(snap.requires);
    }
  });
  it('never requires an ability that is not implemented', () => {
    for (let seed = 1; seed < 500; seed++) {
      const snap = generateSnapshot(seed, []);
      if (snap.kind === 'generated') expect(snap.requires).toBeNull();
    }
  });
  it('gates about 25% of terrain-eligible nodes (4 of 6 terrains map to an ability)', () => {
    let gated = 0, n = 4000;
    for (let seed = 1; seed <= n; seed++) {
      const snap = generateSnapshot(seed * 7919, ['climb', 'dive']);
      if (snap.kind === 'generated' && snap.requires !== null) gated++;
    }
    const rate = gated / n; // expected 0.25 * 4/6 ≈ 0.167
    expect(rate).toBeGreaterThan(0.14);
    expect(rate).toBeLessThan(0.19);
  });
  it('resident is a friend about 50% of the time', () => {
    let friends = 0, n = 4000;
    for (let seed = 1; seed <= n; seed++) {
      const snap = generateSnapshot(seed * 104729, ['climb', 'dive']);
      if (snap.kind === 'generated' && snap.resident !== 'passerby') friends++;
    }
    expect(friends / n).toBeGreaterThan(0.45);
    expect(friends / n).toBeLessThan(0.55);
  });
});

describe('dailyLayout', () => {
  const node = (): MapNode => fresh().map.nodes[0]; // 竹林小徑（handmade bamboo-path）
  const generated = (seed: number): MapNode => ({
    ...node(),
    seed,
    snapshot: generateSnapshot(seed, ['climb', 'dive']),
  });

  it('has 4 to 6 hotspots with exactly one treasure and at least one request hotspot or bring request', () => {
    for (let d = 0; d < 60; d++) {
      const L = dailyLayout(node(), localDate(NOW + d * 86400000));
      expect(L.hotspots.length).toBeGreaterThanOrEqual(4);
      expect(L.hotspots.length).toBeLessThanOrEqual(6);
      expect(L.hotspots.filter(h => h.role === 'treasure')).toHaveLength(1);
      expect(L.hotspots.find(h => h.role === 'treasure')!.reward).toBeDefined();
    }
  });
  it('hidden secret is a hotspot with id "secret"; puzzle secret adds no hidden hotspot', () => {
    for (let d = 0; d < 60; d++) {
      const L = dailyLayout(node(), localDate(NOW + d * 86400000));
      const hidden = L.hotspots.filter(h => h.role === 'hidden');
      if (L.secret.kind === 'hidden') { expect(hidden).toHaveLength(1); expect(hidden[0].id).toBe('secret'); }
      else expect(hidden).toHaveLength(0);
    }
  });
  it('codelock puzzle has exactly 3 clue hotspots whose text contains the code digits in order', () => {
    let checked = 0;
    for (let d = 0; d < 400; d++) {
      const L = dailyLayout(generated(d * 31 + 7), '2026-10-18');
      const secret = L.secret;
      if (secret.kind !== 'puzzle' || secret.puzzle.kind !== 'codelock') continue;
      const code = secret.puzzle.code;
      const clues = L.hotspots.filter(h => h.role === 'clue').sort((a, b) => a.id.localeCompare(b.id));
      expect(clues).toHaveLength(3);
      clues.forEach((c, i) => expect(c.clue).toContain(code[i]));
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  it('is deterministic per node and date, and changes across dates', () => {
    const n = node();
    expect(dailyLayout(n, '2026-10-18')).toEqual(dailyLayout(n, '2026-10-18'));
    const sets = new Set<string>();
    for (let d = 0; d < 10; d++) sets.add(JSON.stringify(dailyLayout(n, `2026-10-${10 + d}`).hotspots.map(h => [h.id, h.x, h.y])));
    expect(sets.size).toBeGreaterThan(1);
  });
  it('handmade overrides: bamboo-path hidden secret, cloud-post codelock, shell-bay shadow', () => {
    const cloud: MapNode = { ...node(), snapshot: { kind: 'handmade', handmadeId: 'cloud-post' } };
    const shell: MapNode = { ...node(), snapshot: { kind: 'handmade', handmadeId: 'shell-bay' } };
    expect(dailyLayout(node(), '2026-10-18').secret.kind).toBe('hidden');
    const c = dailyLayout(cloud, '2026-10-18').secret;
    expect(c.kind === 'puzzle' && c.puzzle.kind).toBe('codelock');
    const s2 = dailyLayout(shell, '2026-10-18').secret;
    expect(s2.kind === 'puzzle' && s2.puzzle.kind).toBe('shadow');
  });
});
