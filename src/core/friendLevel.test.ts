import { describe, it, expect } from 'vitest';
import { friendLevelThreshold, levelOf } from './friendLevel';

describe('朋友好感門檻（契約 5、10.4）', () => {
  it('門檻為 10 × (level − 1) × level', () => {
    expect([1, 2, 3, 4, 5].map(friendLevelThreshold)).toEqual([0, 20, 60, 120, 200]);
  });
  it('每升一級的單級成本為 20n', () => {
    expect(friendLevelThreshold(3) - friendLevelThreshold(2)).toBe(40);
    expect(friendLevelThreshold(2) - friendLevelThreshold(1)).toBe(20);
  });
  it('levelOf 的邊界值', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(19)).toBe(1);
    expect(levelOf(20)).toBe(2);
    expect(levelOf(59)).toBe(2);
    expect(levelOf(60)).toBe(3);
    expect(levelOf(120)).toBe(4);
  });
  it('負值與極小值回傳 1', () => {
    expect(levelOf(-5)).toBe(1);
  });
});
