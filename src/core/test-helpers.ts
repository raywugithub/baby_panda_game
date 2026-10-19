import { createInitialState, type GameState, type HandmadeId, type MapNode } from './state';
import { localDate } from './time';

export const NOW = Date.parse('2026-10-18T10:00:00+08:00');
export const TODAY: string = localDate(NOW);

const DAY_MS = 24 * 3600_000;

export function fresh(seed = 12345): GameState {
  return createInitialState(seed, NOW);
}

export function handmadeNode(s: GameState, id: HandmadeId): MapNode {
  const node = s.map.nodes.find(
    (n) => n.snapshot.kind === 'handmade' && n.snapshot.handmadeId === id,
  );
  if (!node) throw new Error(`handmade node not found: ${id}`);
  return node;
}

export function dayLater(ms: number = DAY_MS): number {
  return NOW + ms;
}
