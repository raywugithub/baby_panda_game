import { chance, hash, mulberry32, pick } from './rng';

export type MinigameKind = 'stars' | 'hop' | 'bubble';

export const MINIGAMES: { kind: MinigameKind; name: string; target: number }[] = [
  { kind: 'stars', name: '接星星', target: 24 },
  { kind: 'hop', name: '跳石頭過河', target: 14 },
  { kind: 'bubble', name: '泡泡配對', target: 7 },
];

export const GAME_SECONDS = 30;
const OFFER_CHANCE = 0.3;

/** 本地點今日是否出現小遊戲（約 30%） */
export function minigameOffered(seed: number, nodeId: number, date: string): boolean {
  return chance(mulberry32(hash(seed, nodeId, date, 'mini')), OFFER_CHANCE);
}

/** 本地點今日的小遊戲種類（每個地點不同，不是整天都同一款） */
export function minigameKind(seed: number, nodeId: number, date: string): MinigameKind {
  return pick(mulberry32(hash(seed, nodeId, date, 'kind')), MINIGAMES).kind;
}

export function scoreFromHits(kind: MinigameKind, hits: number): number {
  const game = MINIGAMES.find(g => g.kind === kind)!;
  return Math.min(1, Math.max(0, hits / game.target));
}

/** 獎勵 5～15（依表現）；星砂依星砂墜飾加成 */
export function minigameReward(score01: number, starSandPct: number): { xp: number; starSand: number } {
  const base = 5 + Math.round(10 * score01);
  return { xp: base, starSand: Math.round(base * (1 + starSandPct / 100)) };
}

/** 剩餘毫秒數；暫停時間不計入 */
export function remainingMs(startedAt: number, now: number, pausedMs: number): number {
  return Math.max(0, GAME_SECONDS * 1000 - (now - startedAt - pausedMs));
}
