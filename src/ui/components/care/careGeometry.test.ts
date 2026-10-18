import { describe, it, expect } from 'vitest';
import { isNearMouth, bathDone } from './careGeometry';

describe('careGeometry', () => {
  it('食物靠近嘴巴的判定半徑 40', () => {
    expect(isNearMouth({ x: 100, y: 100 }, { x: 110, y: 100 })).toBe(true);
    expect(isNearMouth({ x: 100, y: 100 }, { x: 141, y: 100 })).toBe(false);
    expect(isNearMouth({ x: 100, y: 100 }, { x: 100, y: 130 }, 20)).toBe(false);
  });
  it('洗澡 70% 覆蓋率（64 格）', () => {
    expect(bathDone(44, 64)).toBe(false);
    expect(bathDone(45, 64)).toBe(true);
  });
});
