// 2.5D 房間透視（契約 10.14）：viewBox 0 0 400 320；牆面 y 0..80，地板 6 列 × 40px。
// 格子碰撞仍以整數格計算（core/room.ts 的 canPlace），這裡只負責像素投影。

export const ROOM_W = 400;
export const ROOM_H = 320;
export const WALL_H = 80;
export const WALL_CELL_W = 50;
export const FLOOR_COLS = 8;
export const FLOOR_ROWS = 6;
export const ROW_H = 40;
const CELL_W = 50;
const CENTER_X = 200;

/** 列縮放：0.80（最後方）→ 1.00（最前方），線性。 */
export function rowScale(r: number): number {
  return 0.8 + (0.2 * r) / 5;
}

export interface Rect { x: number; y: number; w: number; h: number }

/** 地板格 (x, r) 的投影矩形；w×h 為格數（footprint），寬度依列縮放。 */
export function cellRect(x: number, r: number, w = 1, h = 1): Rect {
  const k = rowScale(r);
  return {
    x: CENTER_X - 200 * k + CELL_W * k * x,
    y: WALL_H + ROW_H * r,
    w: CELL_W * k * w,
    h: ROW_H * h,
  };
}

/** 牆面格 (x, 0) 的矩形；牆面不做透視縮放。 */
export function wallRect(x: number, w = 1): Rect {
  return { x: x * WALL_CELL_W, y: 0, w: WALL_CELL_W * w, h: WALL_H };
}

/** 反算：像素座標落在哪一個地板格；落在地板之外回傳 null。 */
export function pixelToCell(px: number, py: number): { x: number; y: number } | null {
  const row = Math.floor((py - WALL_H) / ROW_H);
  if (row < 0 || row >= FLOOR_ROWS) return null;
  const k = rowScale(row);
  const x = Math.floor((px - (CENTER_X - 200 * k)) / (CELL_W * k));
  if (x < 0 || x >= FLOOR_COLS) return null;
  return { x, y: row };
}
