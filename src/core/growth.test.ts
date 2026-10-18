import { describe, it, expect } from 'vitest';
import * as G from './growth';

describe('刻度（規格 4.2）', () => {
  it('單格成本', () => {
    expect(G.markCost(1)).toBe(35);
    expect(G.markCost(2)).toBe(45);
    expect(G.markCost(5)).toBe(75);
    expect(G.markCost(10)).toBe(125);
    expect(G.markCost(15)).toBe(175);
    expect(G.markCost(20)).toBe(225);
  });
  it('累積成長值換算刻度', () => {
    expect(G.marksForXp(0)).toBe(0);
    expect(G.marksForXp(34)).toBe(0);
    expect(G.marksForXp(35)).toBe(1);
    expect(G.marksForXp(79)).toBe(1);
    expect(G.marksForXp(80)).toBe(2);
    expect(G.marksForXp(274)).toBe(4);
    expect(G.marksForXp(275)).toBe(5);
    expect(G.marksForXp(799)).toBe(9);
    expect(G.marksForXp(800)).toBe(10);
    expect(G.marksForXp(1575)).toBe(15);
    expect(G.marksForXp(2600)).toBe(20);
  });
});

describe('階段與稱號', () => {
  it('階段 = floor(刻度/5)+1', () => {
    expect(G.stageForMarks(0)).toBe(1);
    expect(G.stageForMarks(4)).toBe(1);
    expect(G.stageForMarks(5)).toBe(2);
    expect(G.stageForMarks(10)).toBe(3);
    expect(G.stageForMarks(20)).toBe(5);
  });
  it('1–8 階固定名稱', () => {
    expect(G.stageTitle(1, 1)).toBe('奶熊貓');
    expect(G.stageTitle(999, 8)).toBe('傳說熊貓');
  });
  it('9 階起組合稱號，同種子同階確定', () => {
    const t = G.stageTitle(555, 9);
    expect(t.endsWith('熊貓')).toBe(true);
    expect(G.stageTitle(555, 9)).toBe(t);
    const titles = new Set<string>();
    for (let st = 9; st < 109; st++) titles.add(G.stageTitle(555, st));
    expect(titles.size).toBeGreaterThan(50);
  });
});

describe('身形、光澤、項圈、能力', () => {
  it('身形縮放 0.80/0.90/1.00/1.05 後固定', () => {
    expect([1, 2, 3, 4, 5, 9].map(G.scaleForStage)).toEqual([0.8, 0.9, 1.0, 1.05, 1.05, 1.05]);
  });
  it('光澤層級 floor(階段/5)', () => {
    expect(G.shineTier(4)).toBe(0);
    expect(G.shineTier(5)).toBe(1);
    expect(G.shineTier(9)).toBe(1);
    expect(G.shineTier(10)).toBe(2);
    expect(G.shineTier(20)).toBe(4);
  });
  it('墜飾欄位：起始 2，每 50 環 +1', () => {
    expect(G.pendantSlots(0)).toBe(2);
    expect(G.pendantSlots(49)).toBe(2);
    expect(G.pendantSlots(50)).toBe(3);
    expect(G.pendantSlots(100)).toBe(4);
  });
  it('鏈條粗細等級每 100 環 +1，最多 5', () => {
    expect(G.chainThickness(0)).toBe(0);
    expect(G.chainThickness(99)).toBe(0);
    expect(G.chainThickness(100)).toBe(1);
    expect(G.chainThickness(500)).toBe(5);
    expect(G.chainThickness(5000)).toBe(5);
  });
  it('能力只來自已實作能力', () => {
    expect(G.abilitiesForStage(1)).toEqual([]);
    expect(G.abilitiesForStage(2)).toEqual([]);
    expect(G.abilitiesForStage(3)).toEqual(['climb']);
    expect(G.abilitiesForStage(4)).toEqual(['climb', 'dive']);
    expect(G.abilitiesForStage(8)).toEqual(['climb', 'dive']);
  });
});
