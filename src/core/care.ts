import type { CareKind, GameState, NeedKey } from './state';
import type { Outcome } from './events';
import { applyReward } from './rewards';

const H = 3600_000;
const HUG_HOURLY_CAP = 5;
const NEED_FOR: Record<CareKind, NeedKey> = { feed: 'tummy', bath: 'clean', play: 'mood', hug: 'mood' };

/** 有效照顧：對應指標 < 100；抱抱另需最近一小時未達 5 次。 */
export function isEffective(s: GameState, kind: CareKind, now: number): boolean {
  if (kind === 'hug' && s.hugLog.filter(t => now - t < H).length >= HUG_HOURLY_CAP) return false;
  return s.needs[NEED_FOR[kind]] < 100;
}

export function care(s: GameState, kind: CareKind, now: number): Outcome {
  if (!isEffective(s, kind, now)) return { state: s, events: [] };
  const key = NEED_FOR[kind];
  const needs = { ...s.needs, [key]: Math.min(100, s.needs[key] + 25) };
  const hugLog = kind === 'hug'
    ? [...s.hugLog.filter(t => now - t < H), now]
    : s.hugLog;
  const updated: GameState = { ...s, needs, hugLog };
  return applyReward(updated, { xp: 5, starSand: 2, energy: 15, chain: 1 });
}
