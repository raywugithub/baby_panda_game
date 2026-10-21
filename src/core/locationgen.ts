import type { Ability, FriendId, LocationSnapshot, MapNode, Terrain } from './state';
import { mulberry32, hash, pick, chance } from './rng';
import { generatePuzzle, type Puzzle, type PuzzleKind } from './puzzles';
import { giftPool } from './catalog';
import { TERRAINS, WEATHERS, LANDMARKS, QUIRKS } from '../content/locations';
import { HANDMADE, HANDMADE_SECRET } from '../content/locations/handmade';
import { INGREDIENT_IDS } from '../content/ingredients';
import { FOOD_IDS } from '../content/foods';

/** 生成器版本；節點快照建立後不再依內容表重算 */
export const GENERATOR_VERSION = 1;

const FRIEND_IDS: readonly FriendId[] = ['mianhua', 'juzi', 'manman', 'gulu'];
const LAYOUTS = [0, 1] as const;
const RECENT_PHRASES = 5;
const MAX_NAME_TRIES = 8;

/**
 * 以種子生成地點快照。抽取順序固定（決定性）：
 * 地形、版型、天氣、地標、居民、怪事、門檻。
 */
export function generateSnapshot(
  seed: number,
  abilitiesImplemented: readonly Ability[],
  /** 已經用過的地名（舊到新）；新地名不可重複，也不重複最近 5 個的怪事用語 */
  takenNames: readonly string[] = [],
): LocationSnapshot {
  const rand = mulberry32(seed);
  const terrain = pick(rand, TERRAINS);
  const layout = pick(rand, LAYOUTS);
  const weather = pick(rand, WEATHERS);
  const landmark = pick(rand, LANDMARKS);
  const resident: FriendId | 'passerby' = chance(rand, 0.5) ? pick(rand, FRIEND_IDS) : 'passerby';
  let quirk = pick(rand, QUIRKS);
  const recentPhrases = takenNames.slice(-RECENT_PHRASES).map(n => QUIRKS.find(q => n.startsWith(q.phrase))?.phrase);
  const clashes = (q: (typeof QUIRKS)[number]): boolean =>
    takenNames.includes(q.phrase + terrain.noun) || recentPhrases.includes(q.phrase);
  // 第一次抽到就可用時不動亂數順序（舊種子結果不變）；撞名時才用另外的亂數重抽。
  for (let attempt = 1; attempt <= MAX_NAME_TRIES && clashes(quirk); attempt++) {
    quirk = pick(mulberry32(hash(seed, 'name', attempt)), QUIRKS);
  }
  const gate = chance(rand, 0.25);
  const ability = terrain.ability;
  const requires: Ability | null =
    gate && ability !== null && abilitiesImplemented.includes(ability) ? ability : null;

  return {
    kind: 'generated',
    generatorVersion: GENERATOR_VERSION,
    name: quirk.phrase + terrain.noun,
    terrain: terrain.id,
    layout,
    weather: weather.id,
    landmarkId: landmark.id,
    resident,
    quirkId: quirk.id,
    requires,
  };
}

/** 手工地點所屬地形；生成地點直接回傳其地形 */
export function terrainOf(snap: LocationSnapshot): Terrain {
  return snap.kind === 'handmade' ? HANDMADE[snap.handmadeId].terrain : snap.terrain;
}

/** 地點名稱；手工地點讀 HANDMADE 的名稱 */
export function nameOf(snap: LocationSnapshot): string {
  return snap.kind === 'handmade' ? HANDMADE[snap.handmadeId].name : snap.name;
}

export const SCENE_W = 360;
export const SCENE_H = 480;

export type TreasureReward =
  | { kind: 'starSand'; amount: number }
  | { kind: 'ingredient'; id: string }
  | { kind: 'item'; id: string };

export interface HotspotDef {
  id: string;                       // 'treasure' | 'extra' | 'request' | 'secret' | 'clue0'..'clue2' | 'f0'..'f5'
  x: number; y: number;             // 0..SCENE_W / 0..SCENE_H
  role: 'filler' | 'treasure' | 'extra' | 'request' | 'hidden' | 'clue';
  reward?: TreasureReward;          // treasure / extra only
  clue?: string;                    // clue only
}

export interface LocationLayout {
  hotspots: HotspotDef[];           // 4–6 entries before pendant extras
  secret: { kind: 'hidden' } | { kind: 'puzzle'; puzzle: Puzzle };
  request: { kind: 'find' } | { kind: 'bring'; foodId: string };
  event: string;                    // 今日小事件（來自 QUIRKS.event）
}

const PUZZLE_KINDS: readonly PuzzleKind[] = ['shadow', 'sequence', 'diff', 'codelock'];

/** 六個固定熱點位置（場景座標） */
// 熱點只放在地面（草地、沙灘、雲層、雪地的下方），避免浮在空中；地標站在各地形的地面線上（見 LocationScene）。
// 熱點避開熊貓站立的區域（見 LocationScene 的 pandaBox，含 8 單位間距）；右側與底部為主。
const SLOTS: readonly [number, number][] = [[222, 318], [300, 300], [250, 392], [326, 396], [150, 450], [262, 446]];
/** 寶石墜飾額外寶物的位置（同樣避開熊貓與其他熱點） */
export const EXTRA_SLOT: readonly [number, number] = [318, 452];

/** 密碼線索模板；{d} 為密碼第 i 位數字 */
const CLUE_TEMPLATES = [
  '第一個數字：樹洞裡的松鼠藏了 {d} 顆栗子',
  '第二個數字：石頭上有 {d} 道刻痕',
  '第三個數字：草叢裡的蝴蝶停了 {d} 次',
];

function shuffled<T>(rand: () => number, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function treasureReward(rand: () => number): TreasureReward {
  if (chance(rand, 0.5)) return { kind: 'starSand', amount: 5 + Math.floor(rand() * 6) };
  if (chance(rand, 0.5)) return { kind: 'ingredient', id: pick(rand, INGREDIENT_IDS) };
  return { kind: 'item', id: pick(rand, giftPool('common')).id };
}

/**
 * 以節點種子與日期決定當日版面（決定性）。
 * 手工地點的祕密類型取自 HANDMADE_SECRET、請求種類取自 HANDMADE；生成地點隨機決定。
 */
export function dailyLayout(node: MapNode, date: string): LocationLayout {
  const rand = mulberry32(hash(node.seed, date));

  const drawnHidden = chance(rand, 0.5);
  const drawnKind = pick(rand, PUZZLE_KINDS);
  const secretType: 'hidden' | PuzzleKind =
    node.snapshot.kind === 'handmade'
      ? HANDMADE_SECRET[node.snapshot.handmadeId]
      : drawnHidden ? 'hidden' : drawnKind;

  // 手工地點的請求種類取自 HANDMADE（spec 6.3）；生成地點隨機決定。
  const handmadeRequest = node.snapshot.kind === 'handmade' ? HANDMADE[node.snapshot.handmadeId].request : null;
  const request: LocationLayout['request'] =
    handmadeRequest !== null
      ? handmadeRequest.kind === 'find'
        ? { kind: 'find' }
        : { kind: 'bring', foodId: pick(rand, FOOD_IDS) }
      : chance(rand, 0.5)
        ? { kind: 'find' }
        : { kind: 'bring', foodId: pick(rand, FOOD_IDS) };

  const secret: LocationLayout['secret'] =
    secretType === 'hidden' ? { kind: 'hidden' } : { kind: 'puzzle', puzzle: generatePuzzle(rand, secretType) };

  const isFind = request.kind === 'find';
  const isHidden = secret.kind === 'hidden';
  const isCodelock = secret.kind === 'puzzle' && secret.puzzle.kind === 'codelock';
  const required = 1 + (isFind ? 1 : 0) + (isHidden ? 1 : 0) + (isCodelock ? 3 : 0);
  const total = Math.max(4 + Math.floor(rand() * 3), required);
  const fillers = total - required;

  const roles: Omit<HotspotDef, 'x' | 'y'>[] = [{ id: 'treasure', role: 'treasure', reward: treasureReward(rand) }];
  if (isFind) roles.push({ id: 'request', role: 'request' });
  if (isHidden) roles.push({ id: 'secret', role: 'hidden' });
  if (secret.kind === 'puzzle' && secret.puzzle.kind === 'codelock') {
    const code = secret.puzzle.code;
    CLUE_TEMPLATES.forEach((tpl, i) => roles.push({ id: `clue${i}`, role: 'clue', clue: tpl.replace('{d}', code[i]) }));
  }
  for (let i = 0; i < fillers; i++) roles.push({ id: `f${i}`, role: 'filler' });

  const slots = shuffled(rand, SLOTS).slice(0, total);
  const hotspots: HotspotDef[] = roles.map((r, i) => ({ ...r, x: slots[i][0], y: slots[i][1] }));

  return { hotspots, secret, request, event: pick(rand, QUIRKS).event };
}
