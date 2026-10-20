import { describe, it, expect } from 'vitest';
import { LEGEND_TEMPLATES, legendScript } from './legends';
import { COLLAR_CLUES } from './chapters';
import { FRIENDS } from '../friends';
import { hash, mulberry32, pick } from '../../core/rng';

describe('legend templates', () => {
  it('has 10 templates, each with 3 to 5 lines and a clue or friend slot', () => {
    expect(LEGEND_TEMPLATES).toHaveLength(10);
    for (const t of LEGEND_TEMPLATES) {
      expect(t.lines.length).toBeGreaterThanOrEqual(3);
      expect(t.lines.length).toBeLessThanOrEqual(5);
      expect(t.lines.some(l => l.includes('{clue}') || l.includes('{friend}'))).toBe(true);
    }
  });
  it('legendScript is deterministic and fills every slot', () => {
    const a = legendScript(12345, 20);
    expect(a).toEqual(legendScript(12345, 20));
    expect(a.id).toBe('legend-20');
    const text = a.lines.map(l => l.text).join('\n');
    expect(text).not.toMatch(/\{clue\}|\{friend\}/);
    expect(
      COLLAR_CLUES.some(c => text.includes(c.name)) || FRIENDS.some(f => text.includes(f.name.split('（')[0]))
    ).toBe(true);
  });
  it('different n can give different legends', () => {
    const texts = new Set([20, 25, 30, 35, 40, 45].map(n => legendScript(999, n).lines.map(l => l.text).join('')));
    expect(texts.size).toBeGreaterThan(1);
  });
  it('substitutes the exact clue and friend derived from the seed, with narrator speakers', () => {
    for (const [seed, n] of [[12345, 20], [999, 25], [7, 45]] as const) {
      const t = pick(mulberry32(hash(seed, n, 'legend')), LEGEND_TEMPLATES);
      const clue = COLLAR_CLUES[(((n / 5 - 4) % 5) + 5) % 5].name;
      const friend = FRIENDS[hash(seed, n, 'friend') % 4].name;
      const expected = t.lines.map(text => text.split('{clue}').join(clue).split('{friend}').join(friend));
      const s = legendScript(seed, n);
      expect(s.lines.map(l => l.text)).toEqual(expected);
      expect(s.lines.every(l => l.speaker === 'narrator')).toBe(true);
    }
  });
});
