import type { Ability, GameState } from './state';
import { hash } from './rng';
import { STAGE_NAMES, TITLE_ADJECTIVES, TITLE_NOUNS } from '../content/titles';

export function markCost(n: number): number {
  return 25 + 10 * n;
}

// 前 n 格累積成本：25n + 5n(n+1)
function cumulative(n: number): number {
  return 25 * n + 5 * n * (n + 1);
}

export function marksForXp(xp: number): number {
  let n = 0;
  while (cumulative(n + 1) <= xp) n++;
  return n;
}

export function stageForMarks(marks: number): number {
  return Math.floor(marks / 5) + 1;
}

export function stageTitle(seed: number, stage: number): string {
  if (stage <= 8) return STAGE_NAMES[stage - 1];
  const adj = TITLE_ADJECTIVES[hash(seed, stage) % 30];
  const noun = TITLE_NOUNS[hash(seed, stage, 'noun') % 30];
  return `${adj}${noun}熊貓`;
}

export function shineTier(stage: number): number {
  return Math.floor(stage / 5);
}

export function pendantSlots(chainLinks: number): number {
  return 2 + Math.floor(chainLinks / 50);
}

export function chainThickness(chainLinks: number): number {
  return Math.min(5, Math.floor(chainLinks / 100));
}

export function abilitiesForStage(stage: number): Ability[] {
  return stage >= 4 ? ['climb', 'dive'] : stage >= 3 ? ['climb'] : [];
}

export function scaleForStage(stage: number): number {
  return [0.8, 0.9, 1.0, 1.05][Math.min(stage, 4) - 1];
}

export function currentStage(s: GameState): number {
  return stageForMarks(marksForXp(s.growthXp));
}
