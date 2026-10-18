import { describe, it, expect } from 'vitest';
import { mulberry32, hash, pick, chance } from './rng';

describe('rng', () => {
  it('同種子同序列', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
  it('值域在 [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('hash 為 FNV-1a 32 位元，向量正確', () => {
    expect(hash('')).toBe(2166136261);
    expect(hash('a')).toBe(3826002220);
  });
  it('hash 以 | 串接各部件', () => {
    expect(hash('a', 1)).toBe(hash('a|1'));
    expect(hash(1, 2)).not.toBe(hash(12));
  });
  it('pick 與 chance 的邊界', () => {
    expect(pick(() => 0.999, ['a', 'b'])).toBe('b');
    expect(pick(() => 0, ['a', 'b'])).toBe('a');
    expect(chance(() => 0.29, 0.3)).toBe(true);
    expect(chance(() => 0.3, 0.3)).toBe(false);
  });
});
