import { describe, it, expect } from 'vitest';
import { REACTION_POSE } from './reactions';
import { ALL_POSES } from './poses';

describe('食物反應對應姿勢（規格 5.2，契約 10.19）', () => {
  it('竹筍糕 patBelly、草莓麻糬 blush、酸梅 sour、星空蘋果 starEyes', () => {
    expect(REACTION_POSE.patBelly).toBe('patBelly');
    expect(REACTION_POSE.blush).toBe('blush');
    expect(REACTION_POSE.sour).toBe('sour');
    expect(REACTION_POSE.starEyes).toBe('starEyes');
  });
  it('所有反應都對應到合法姿勢', () => {
    for (const p of Object.values(REACTION_POSE)) expect(ALL_POSES).toContain(p);
  });
});
