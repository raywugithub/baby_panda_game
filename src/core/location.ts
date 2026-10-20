import type { FriendId, GameState, LocationProgress, MapNode } from './state';
import type { GameEvent, Outcome, Reward } from './events';
import { dailyLayout, terrainOf, type HotspotDef, type LocationLayout, type TreasureReward } from './locationgen';
import { canEnter } from './mapgen';
import { pendantModifiers } from './pendants';
import { localDate } from './time';
import { applyReward } from './rewards';
import { addAffinity, chat } from './friends';
import { HANDMADE } from '../content/locations/handmade';

const ENTER_MIN_ENERGY = 25;
const FIND_REWARD: Reward = { xp: 15, starSand: 10 };
const REQUEST_AFFINITY = 10;

function findNode(s: GameState, nodeId: number): MapNode | undefined {
  return s.map.nodes.find(n => n.id === nodeId);
}

/** 今日版面；若裝備的墜飾指定該地形，額外加入一個寶物熱點 */
export function layoutFor(s: GameState, nodeId: number, date: string): LocationLayout {
  const node = findNode(s, nodeId);
  if (!node) throw new Error(`node not found: ${nodeId}`);
  const base = dailyLayout(node, date);
  if (!pendantModifiers(s).extraTreasure.includes(terrainOf(node.snapshot))) return base;
  const extra: HotspotDef = { id: 'extra', role: 'extra', reward: { kind: 'starSand', amount: 10 }, x: 300, y: 430 };
  return { ...base, hotspots: [...base.hotspots, extra] };
}

/** 居民若為朋友則回傳其編號；路人回傳 null（手工地點讀 HANDMADE 的居民） */
function friendOf(node: MapNode): FriendId | null {
  const resident = node.snapshot.kind === 'handmade'
    ? HANDMADE[node.snapshot.handmadeId].resident
    : node.snapshot.resident;
  return resident === 'passerby' ? null : resident;
}

function progressToday(node: MapNode | undefined, today: string): LocationProgress | null {
  return node && node.progress && node.progress.date === today ? node.progress : null;
}

function withProgress(s: GameState, nodeId: number, progress: LocationProgress): GameState {
  return { ...s, map: { ...s.map, nodes: s.map.nodes.map(n => (n.id === nodeId ? { ...n, progress } : n)) } };
}

function toReward(r: TreasureReward): Reward {
  return r.kind === 'starSand' ? { starSand: r.amount } : { items: { [r.id]: 1 } };
}

/** 發放獎勵；若有朋友居民且 affinity > 0，同時增加好感度 */
function grant(s: GameState, reward: Reward, friend: FriendId | null, affinity: number): Outcome {
  const r = applyReward(s, reward);
  if (friend === null || affinity <= 0) return r;
  const a = addAffinity(r.state, friend, affinity);
  return { state: a.state, events: [...r.events, ...a.events] };
}

export function enter(s: GameState, nodeId: number, now: number): GameState {
  const node = findNode(s, nodeId);
  const today = localDate(now);
  if (!node || !canEnter(s, nodeId)) return s;
  if (s.energy < ENTER_MIN_ENERGY) return s;
  if (node.status === 'done' && node.lastCompletedDate === today) return s;
  if (node.progress && node.progress.date === today) return s;
  return withProgress(s, nodeId, { date: today, foundHotspots: [], talked: false, treasureFound: false });
}

export function tapHotspot(s: GameState, nodeId: number, hotspotId: string, now: number): Outcome {
  const none: Outcome = { state: s, events: [] };
  const node = findNode(s, nodeId);
  const progress = progressToday(node, localDate(now));
  if (!node || !progress) return none;
  const hotspot = layoutFor(s, nodeId, progress.date).hotspots.find(h => h.id === hotspotId);
  if (!hotspot || progress.foundHotspots.includes(hotspotId)) return none;

  let next: LocationProgress = { ...progress, foundHotspots: [...progress.foundHotspots, hotspotId] };
  if (hotspot.role === 'treasure') next = { ...next, treasureFound: true };
  const base = withProgress(s, nodeId, next);

  switch (hotspot.role) {
    case 'treasure':
    case 'extra':
      return hotspot.reward ? grant(base, toReward(hotspot.reward), null, 0) : { state: base, events: [] };
    case 'request':
      return grant(base, FIND_REWARD, friendOf(node), REQUEST_AFFINITY);
    default:
      return { state: base, events: [] };
  }
}

export function talk(s: GameState, nodeId: number, now: number): Outcome {
  const none: Outcome = { state: s, events: [] };
  const node = findNode(s, nodeId);
  const progress = progressToday(node, localDate(now));
  if (!node || !progress || progress.talked) return none;
  const state = withProgress(s, nodeId, { ...progress, talked: true });
  const friend = friendOf(node);
  if (friend === null) return { state, events: [] };
  const c = chat(state, friend);
  return { state: c.state, events: c.events };
}

/** 送今日指定的食物完成請求；不符合條件回傳 null */
export function bringFood(s: GameState, nodeId: number, foodId: string, now: number): Outcome | null {
  const node = findNode(s, nodeId);
  const progress = progressToday(node, localDate(now));
  if (!node || !progress) return null;
  const layout = layoutFor(s, nodeId, progress.date);
  if (layout.request.kind !== 'bring' || layout.request.foodId !== foodId) return null;
  if (progress.foundHotspots.includes('request')) return null;
  const owned = s.inventory[foodId] ?? 0;
  if (owned < 1) return null;

  const inventory = { ...s.inventory };
  if (owned === 1) delete inventory[foodId];
  else inventory[foodId] = owned - 1;
  const state = withProgress({ ...s, inventory }, nodeId, {
    ...progress,
    foundHotspots: [...progress.foundHotspots, 'request'],
  });
  return grant(state, FIND_REWARD, friendOf(node), REQUEST_AFFINITY);
}

/** 祕密謎題解開後呼叫（UI 於 checkAnswer 為 true 時呼叫）；只標記，不發獎勵 */
export function solveSecret(s: GameState, nodeId: number, now: number): GameState {
  const node = findNode(s, nodeId);
  const progress = progressToday(node, localDate(now));
  if (!node || !progress) return s;
  if (layoutFor(s, nodeId, progress.date).secret.kind !== 'puzzle') return s;
  if (progress.foundHotspots.includes('secret')) return s;
  return withProgress(s, nodeId, { ...progress, foundHotspots: [...progress.foundHotspots, 'secret'] });
}
