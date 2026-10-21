import { describe, it, expect } from 'vitest';
import { minigameOffered, minigameKind, scoreFromHits, minigameReward, remainingMs, GAME_SECONDS } from './minigames';

describe('minigames core', () => {
  it('is offered about 30% of the time', () => {
    let n = 0;
    for (let i = 0; i < 4000; i++) if (minigameOffered(i * 7 + 3, 1, '2026-10-18')) n++;
    expect(n / 4000).toBeGreaterThan(0.26);
    expect(n / 4000).toBeLessThan(0.34);
  });
  it('score clamps to 1 and is hits over target', () => {
    expect(scoreFromHits('stars', 12)).toBeCloseTo(0.5);
    expect(scoreFromHits('stars', 99)).toBe(1);
  });
  it('kind varies by node on the same day, but is stable for one node', () => {
    const kinds = new Set<string>();
    for (let n = 1; n <= 50; n++) kinds.add(minigameKind(77, n, '2026-10-18'));
    expect([...kinds].sort()).toEqual(['bubble', 'hop', 'stars']);
    expect(minigameKind(77, 5, '2026-10-18')).toBe(minigameKind(77, 5, '2026-10-18'));
  });
  it('score never goes below 0', () => {
    expect(scoreFromHits('hop', -3)).toBe(0);
  });
  it('reward scales between 5 and 15 before pendant bonus', () => {
    expect(minigameReward(0, 0)).toEqual({ xp: 5, starSand: 5 });
    expect(minigameReward(1, 0)).toEqual({ xp: 15, starSand: 15 });
  });
  it('star pendant +20% applies to star sand only', () => {
    expect(minigameReward(1, 20)).toEqual({ xp: 15, starSand: 18 });
  });
  it('timer is 30 seconds, ignores paused time, and never goes negative', () => {
    expect(GAME_SECONDS).toBe(30);
    expect(remainingMs(0, 10_000, 0)).toBe(20_000);
    expect(remainingMs(0, 10_000, 4_000)).toBe(24_000);
    expect(remainingMs(0, 99_000, 0)).toBe(0);
  });
});
