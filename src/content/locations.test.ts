import { describe, it, expect } from 'vitest';
import { TERRAINS, WEATHERS, LANDMARKS, QUIRKS } from './locations';

describe('location content', () => {
  it('matches spec counts', () => {
    expect(TERRAINS).toHaveLength(6);
    expect(WEATHERS).toHaveLength(5);
    expect(LANDMARKS).toHaveLength(12);
    expect(QUIRKS).toHaveLength(20);
  });
  it('ids are unique', () => {
    expect(new Set(LANDMARKS.map(l => l.id)).size).toBe(12);
    expect(new Set(QUIRKS.map(q => q.id)).size).toBe(20);
  });
  it('quirk phrases end with 的 so names read naturally', () => {
    for (const q of QUIRKS) expect(q.phrase.endsWith('的')).toBe(true);
  });
  it('terrain abilities follow spec 6.3 exactly', () => {
    const map = Object.fromEntries(TERRAINS.map(t => [t.id, t.ability]));
    expect(map).toEqual({ bamboo: 'climb', mushroom: 'climb', beach: 'dive', starlake: 'dive', cloud: null, snow: null });
  });
});

describe('quirk phrases', () => {
  it('every phrase is unique, and no event mentions a terrain-specific thing', () => {
    expect(new Set(QUIRKS.map((q) => q.phrase)).size).toBe(QUIRKS.length);
    expect(QUIRKS.some((q) => q.event.includes('鹽湖'))).toBe(false);
    expect(QUIRKS.some((q) => q.phrase.includes('排隊') && q.id === 'q17')).toBe(false);
  });
});
