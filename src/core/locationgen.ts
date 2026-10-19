import type { Ability, FriendId, LocationSnapshot, Terrain } from './state';
import { mulberry32, pick, chance } from './rng';
import { TERRAINS, WEATHERS, LANDMARKS, QUIRKS } from '../content/locations';
import { HANDMADE } from '../content/locations/handmade';

/** 生成器版本；節點快照建立後不再依內容表重算 */
export const GENERATOR_VERSION = 1;

const FRIEND_IDS: readonly FriendId[] = ['mianhua', 'juzi', 'manman', 'gulu'];
const LAYOUTS = [0, 1] as const;

/**
 * 以種子生成地點快照。抽取順序固定（決定性）：
 * 地形、版型、天氣、地標、居民、怪事、門檻。
 */
export function generateSnapshot(seed: number, abilitiesImplemented: readonly Ability[]): LocationSnapshot {
  const rand = mulberry32(seed);
  const terrain = pick(rand, TERRAINS);
  const layout = pick(rand, LAYOUTS);
  const weather = pick(rand, WEATHERS);
  const landmark = pick(rand, LANDMARKS);
  const resident: FriendId | 'passerby' = chance(rand, 0.5) ? pick(rand, FRIEND_IDS) : 'passerby';
  const quirk = pick(rand, QUIRKS);
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
