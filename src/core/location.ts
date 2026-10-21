import type { FriendId, GameState, LocationProgress, MapNode } from './state';
import type { GameEvent, Outcome, Reward } from './events';
import { dailyLayout, EXTRA_SLOT, nameOf, terrainOf, type HotspotDef, type LocationLayout, type TreasureReward } from './locationgen';
import { canEnter, ensureEnterable, spawnChildren } from './mapgen';
import { ingredientDropChance, pendantModifiers } from './pendants';
import { localDate } from './time';
import { applyReward } from './rewards';
import { addAffinity, chat } from './friends';
import { HANDMADE } from '../content/locations/handmade';
import { minigameReward, type MinigameKind } from './minigames';
import { recordVisit } from './daily';
import { checkStory } from './story';
import { mulberry32, hash, chance, pick } from './rng';
import { INGREDIENT_IDS } from '../content/ingredients';

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
  const extra: HotspotDef = { id: 'extra', role: 'extra', reward: { kind: 'starSand', amount: 10 }, x: EXTRA_SLOT[0], y: EXTRA_SLOT[1] };
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

/**
 * 小遊戲結束（完成、跳過或中途離開）；每天只計一次。
 * score01 為 null 代表跳過或中止，不發獎勵但仍標記為已完成。
 */
export function finishMinigame(s: GameState, nodeId: number, kind: MinigameKind, score01: number | null, now: number): Outcome {
  const none: Outcome = { state: s, events: [] };
  const node = findNode(s, nodeId);
  const progress = progressToday(node, localDate(now));
  if (!node || !progress || progress.foundHotspots.includes('minigame')) return none;
  const marked = withProgress(s, nodeId, { ...progress, foundHotspots: [...progress.foundHotspots, 'minigame'] });
  if (score01 === null) return { state: marked, events: [] };
  const r = minigameReward(score01, pendantModifiers(s).minigameStarSandPct);
  return applyReward(marked, { xp: r.xp, starSand: r.starSand });
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

const COMPLETE_ENERGY_COST = 25;
const REVISIT_XP_LIMIT = 3;
const SECRET_REWARD: Reward = { xp: 10, starSand: 10 };

/**
 * 完成地點（今日已談話且已取得寶物）。首次：成長 +30、星砂 15–25；
 * 重訪：成長 +10（每天前 3 次）、星砂 8–12。祕密另給 +10/+10（只一次）。
 * 每次成功完成都記入信件摘要；首次完成會生成子節點並可能觸發劇情。
 */
export function complete(s: GameState, nodeId: number, now: number): Outcome {
  const none: Outcome = { state: s, events: [] };
  const today = localDate(now);
  const node = findNode(s, nodeId);
  if (!node) return none;
  const p = node.progress;
  if (!p || p.date !== today || !p.talked || !p.treasureFound) return none;
  if (s.energy < ENTER_MIN_ENERGY || node.lastCompletedDate === today) return none;

  const first = node.status === 'open';
  const terrain = terrainOf(node.snapshot);
  const mods = pendantModifiers(s);
  const rand = mulberry32(hash(node.seed, today, 'complete'));

  const baseSand = first ? 15 + Math.floor(rand() * 11) : 8 + Math.floor(rand() * 5);
  let starSand = Math.round(baseSand * (1 + (mods.starSandPct[terrain] ?? 0) / 100));
  let xp = first ? 30 : (s.daily.revisitXpCount < REVISIT_XP_LIMIT ? 10 : 0);

  const secret = p.foundHotspots.includes('secret') && !node.secretFound;
  if (secret) {
    xp += SECRET_REWARD.xp ?? 0;
    starSand += SECRET_REWARD.starSand ?? 0;
  }

  const drop = chance(rand, ingredientDropChance(mods) / 100) ? pick(rand, INGREDIENT_IDS) : null;
  const items: Record<string, number> = drop ? { [drop]: 1 } : {};

  const nodes = s.map.nodes.map((n): MapNode => (n.id === nodeId
    ? { ...n, status: 'done', lastCompletedDate: today, progress: null, secretFound: n.secretFound || secret }
    : n));
  let state: GameState = {
    ...s,
    map: { ...s.map, nodes },
    daily: first ? s.daily : { ...s.daily, revisitXpCount: s.daily.revisitXpCount + 1 },
    completedCount: s.completedCount + (first ? 1 : 0),
  };

  const rewarded = applyReward(state, { xp, starSand, energy: -COMPLETE_ENERGY_COST, chain: 1, items });
  state = rewarded.state;
  let events: GameEvent[] = rewarded.events;

  if (first) {
    const spawned = spawnChildren(state, nodeId);
    state = ensureEnterable(spawned.state);
    events = [...events, ...spawned.events];
  }

  state = recordVisit(state, 'locations', nameOf(node.snapshot));

  const story = checkStory(state);
  return { state: story.state, events: [...events, ...story.events] };
}
