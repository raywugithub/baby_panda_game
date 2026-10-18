import { chance, hash, mulberry32, pick } from './rng';
import { DREAMS } from '../content/dreams';

const POKE_WINDOW_MS = 3000;
const POKE_COUNT = 8;

/** 戳戳（規格 5.4）：3 秒內戳 8 下觸發；修剪超過視窗的紀錄，觸發時清空。 */
export function recordPoke(pokeLog: number[], now: number): { pokeLog: number[]; trigger: boolean } {
  const kept = pokeLog.filter(t => now - t <= POKE_WINDOW_MS);
  kept.push(now);
  if (kept.length >= POKE_COUNT) return { pokeLog: [], trigger: true };
  return { pokeLog: kept, trigger: false };
}

/** 抱抱後害羞：30%。 */
export function shyAfterHug(rand: () => number): boolean {
  return chance(rand, 0.3);
}

/** 偷吃被抓包：有食物時 10%。 */
export function hideFoodOnOpen(rand: () => number, hasFood: boolean): boolean {
  return hasFood && chance(rand, 0.1);
}

/** 打嗝夢話：由種子與時間決定，不使用 Math.random。 */
export function hiccupDream(seed: number, now: number): string {
  return pick(mulberry32(hash(seed, now)), DREAMS);
}
