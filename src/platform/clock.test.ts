import { describe, it, expect } from 'vitest';
import { now, randomSeed } from './clock';

describe('clock', () => {
  it('now 接近 Date.now', () => {
    expect(Math.abs(now() - Date.now())).toBeLessThan(1000);
  });
  it('randomSeed 是 32 位元非負整數', () => {
    for (let i = 0; i < 20; i++) {
      const v = randomSeed();
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(2 ** 32);
    }
  });
});
