import type { GameState, RoomId, RoomState, PlacedItem } from './state';
import { currentStage } from './growth';
import { getItem, ITEM_BY_ID } from './catalog';
import type { ItemDef, Interaction } from '../content/types';

const FLOOR_W = 8;
const FLOOR_H = 6;
const WALL_W = 8;

type Layer = 'floor' | 'wall';

const footprint = (item: ItemDef): { w: number; h: number } => item.size ?? { w: 1, h: 1 };

/** 所有房間內已擺放的同一物品數量。 */
function placedCountAll(s: GameState, itemId: string): number {
  let n = 0;
  for (const roomId of Object.keys(s.rooms) as RoomId[]) {
    for (const p of s.rooms[roomId].placed) if (p.itemId === itemId) n++;
  }
  return n;
}

/** 兩個房間合計中，此物品用過的最大流水號。 */
function maxUsedN(s: GameState, itemId: string): number {
  let max = 0;
  for (const roomId of Object.keys(s.rooms) as RoomId[]) {
    for (const p of s.rooms[roomId].placed) {
      if (p.itemId !== itemId) continue;
      const n = Number(p.uid.slice(itemId.length + 1));
      if (n > max) max = n;
    }
  }
  return max;
}

export function roomUnlocked(s: GameState, roomId: RoomId): boolean {
  if (roomId === 'living') return true;
  return currentStage(s) >= 2;
}

export function canPlace(
  room: RoomState,
  item: ItemDef,
  x: number,
  y: number,
  layer: Layer,
  ignoreUid?: string,
): boolean {
  if (item.category !== 'furniture') return false;
  const { w, h } = footprint(item);
  if (layer === 'wall') {
    if (!item.wallMounted) return false;
    if (y !== 0 || x < 0 || x >= WALL_W) return false;
  } else {
    if (item.wallMounted) return false;
    if (x < 0 || x + w > FLOOR_W || y < 0 || y + h > FLOOR_H) return false;
  }
  for (const p of room.placed) {
    if (p.layer !== layer || p.uid === ignoreUid) continue;
    const other = footprint(getItem(p.itemId));
    const overlaps = x < p.x + other.w && p.x < x + w && y < p.y + other.h && p.y < y + h;
    if (overlaps) return false;
  }
  return true;
}

export function place(s: GameState, roomId: RoomId, itemId: string, x: number, y: number): GameState | null {
  const item = ITEM_BY_ID[itemId];
  if (!item) return null;
  if ((s.inventory[itemId] ?? 0) - placedCountAll(s, itemId) <= 0) return null;
  if (!roomUnlocked(s, roomId)) return null;
  const layer: Layer = item.wallMounted ? 'wall' : 'floor';
  const room = s.rooms[roomId];
  if (!canPlace(room, item, x, y, layer)) return null;
  const piece: PlacedItem = {
    uid: `${itemId}#${maxUsedN(s, itemId) + 1}`,
    itemId,
    layer,
    x,
    y,
    flipped: false,
  };
  return withRoom(s, roomId, { ...room, placed: [...room.placed, piece] });
}

export function move(s: GameState, roomId: RoomId, uid: string, x: number, y: number): GameState | null {
  const room = s.rooms[roomId];
  const target = room.placed.find((p) => p.uid === uid);
  if (!target) return null;
  if (!canPlace(room, getItem(target.itemId), x, y, target.layer, uid)) return null;
  const placed = room.placed.map((p) => (p.uid === uid ? { ...p, x, y } : p));
  return withRoom(s, roomId, { ...room, placed });
}

export function flip(s: GameState, roomId: RoomId, uid: string): GameState {
  const room = s.rooms[roomId];
  const placed = room.placed.map((p) => (p.uid === uid ? { ...p, flipped: !p.flipped } : p));
  return withRoom(s, roomId, { ...room, placed });
}

export function stow(s: GameState, roomId: RoomId, uid: string): GameState {
  const room = s.rooms[roomId];
  return withRoom(s, roomId, { ...room, placed: room.placed.filter((p) => p.uid !== uid) });
}

export function setSurface(s: GameState, roomId: RoomId, surface: 'wall' | 'floor', itemId: string): GameState {
  const item = ITEM_BY_ID[itemId];
  if (!item || item.category !== surface) return s;
  if ((s.inventory[itemId] ?? 0) <= 0) return s;
  return withRoom(s, roomId, { ...s.rooms[roomId], [surface]: itemId });
}

/** 隨機挑一件已擺放的互動家具；沒有或骰子未過（≥ 0.5）則回傳 null。 */
export function pickInteraction(
  room: RoomState,
  rand: () => number,
): { uid: string; interaction: Interaction } | null {
  const candidates = room.placed
    .filter((p) => p.layer === 'floor' && getItem(p.itemId).interaction)
    .map((p) => ({ uid: p.uid, interaction: getItem(p.itemId).interaction as Interaction }));
  if (candidates.length === 0) return null;
  if (rand() >= 0.5) return null;
  return candidates[Math.floor(rand() * candidates.length)];
}

function withRoom(s: GameState, roomId: RoomId, room: RoomState): GameState {
  return { ...s, rooms: { ...s.rooms, [roomId]: room } };
}
