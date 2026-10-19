import { describe, it, expect } from 'vitest';
import { generatePuzzle, checkAnswer, SHAPES } from './puzzles';
import { mulberry32 } from './rng';

describe('puzzles', () => {
  it('shadow: 3 distinct options, exactly one matches target, answer index correct', () => {
    for (let s = 1; s <= 200; s++) {
      const p = generatePuzzle(mulberry32(s), 'shadow');
      if (p.kind !== 'shadow') throw new Error('kind');
      expect(new Set(p.options).size).toBe(3);
      expect(p.options.filter(o => o === p.target)).toHaveLength(1);
      expect(p.options[p.answer]).toBe(p.target);
      expect(checkAnswer(p, p.answer)).toBe(true);
      expect(checkAnswer(p, (p.answer + 1) % 3)).toBe(false);
    }
  });
  it('sequence: alternating pattern, answer is the next shape in the pattern', () => {
    for (let s = 1; s <= 200; s++) {
      const p = generatePuzzle(mulberry32(s), 'sequence');
      if (p.kind !== 'sequence') throw new Error('kind');
      expect(p.shown).toHaveLength(4);
      expect(p.shown[2]).toBe(p.shown[0]);
      expect(p.shown[3]).toBe(p.shown[1]);
      expect(p.options[p.answer]).toBe(p.shown[0]);
      expect(new Set(p.options).size).toBe(3);
    }
  });
  it('diff: exactly one of the three panels differs from the other two', () => {
    for (let s = 1; s <= 200; s++) {
      const p = generatePuzzle(mulberry32(s), 'diff');
      if (p.kind !== 'diff') throw new Error('kind');
      const [a, b, c] = p.options.map(o => o.join('|'));
      const odd = a === b ? 2 : a === c ? 1 : 0;
      expect(p.answer).toBe(odd);
      expect(new Set([a, b, c]).size).toBe(2);
    }
  });
  it('codelock: 3 digits from 1 to 9; checkAnswer needs the exact string', () => {
    const p = generatePuzzle(mulberry32(5), 'codelock');
    if (p.kind !== 'codelock') throw new Error('kind');
    expect(p.code).toMatch(/^[1-9]{3}$/);
    expect(checkAnswer(p, p.code)).toBe(true);
    expect(checkAnswer(p, '000')).toBe(false);
  });
  it('shapes come from the fixed six-shape set', () => {
    const p = generatePuzzle(mulberry32(9), 'shadow');
    if (p.kind === 'shadow') for (const o of p.options) expect(SHAPES).toContain(o);
  });
});
