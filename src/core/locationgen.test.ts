import { describe, it, expect } from 'vitest';
import { generateSnapshot, GENERATOR_VERSION } from './locationgen';
import { TERRAINS } from '../content/locations';

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
