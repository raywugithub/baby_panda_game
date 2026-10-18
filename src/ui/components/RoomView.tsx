import type { ComponentChildren, JSX } from 'preact';
import { game } from '../store';
import { ITEM_BY_ID } from '../../content/items';
import { ITEM_ART } from '../../art/items';
import type { PlacedItem, RoomState } from '../../core/state';
import { cellRect, wallRect, FLOOR_COLS, FLOOR_ROWS, ROOM_W, ROOM_H, WALL_H, type Rect } from '../room/perspective';

// 2.5D 房間（契約 10.14）：SVG viewBox 0 0 400 320；牆面與地板的底色依 room.wall / room.floor 決定。
const WALL_COLOR: Record<string, string> = { 'wall-default': '#CFE3C0' };
const FLOOR_COLOR: Record<string, string> = { 'floor-default': '#D9B98C' };

export interface RoomViewProps {
  /** 要顯示的房間；省略時顯示客廳。 */
  room?: RoomState;
  /** 成長階段；4 起加上 room-grown。 */
  stage?: number;
  /** Task 18 編輯覆蓋層使用；此處僅保留欄位。 */
  editable?: boolean;
  /** 目前選取的物品 uid，會以外框標示。 */
  selectedUid?: string | null;
  children?: ComponentChildren;
}

/** 物品在房間座標中的矩形（牆面或地板透視）。 */
function footprintOf(item: PlacedItem): Rect {
  const def = ITEM_BY_ID[item.itemId];
  const w = def?.size?.w ?? 1;
  const h = def?.size?.h ?? 1;
  return item.layer === 'wall' ? wallRect(item.x, w) : cellRect(item.x, item.y, w, h);
}

function PlacedView({ item, selected }: { item: PlacedItem; selected: boolean }): JSX.Element {
  const Art = ITEM_ART[item.itemId] as (typeof ITEM_ART)[string] | undefined;
  const f = footprintOf(item);
  const size = Math.min(f.w, f.h);
  const flip = item.flipped ? ' scale(-1 1)' : '';
  return (
    <g data-uid={item.uid} data-testid={`placed-${item.uid}`} transform={`translate(${f.x} ${f.y})`}>
      <g transform={`translate(${f.w / 2} ${f.h / 2})${flip}`}>
        {Art ? <Art size={size} /> : <rect x={-size / 2} y={-size / 2} width={size} height={size} rx={6} style={{ fill: 'var(--fur-shade)' }} />}
      </g>
      {selected ? <rect x={0} y={0} width={f.w} height={f.h} fill="none" style={{ stroke: 'var(--amber, #E8A33D)' }} stroke-width={2} /> : null}
    </g>
  );
}

/** 牆紙與地板：有美術圖時以圖樣填滿，否則用純色。 */
function Surface({ id, y, h, color, colors }: { id: string; y: number; h: number; color: string; colors: Record<string, string> }): JSX.Element {
  const Art = ITEM_ART[id] as (typeof ITEM_ART)[string] | undefined;
  return (
    <g>
      <rect x={0} y={y} width={ROOM_W} height={h} style={{ fill: colors[id] ?? color }} />
      {Art ? (
        <svg x={0} y={y} width={ROOM_W} height={h} viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid slice">
          <Art size={100} />
        </svg>
      ) : null}
    </g>
  );
}

/**
 * 房間背景（牆與地板）加上擺放的物品；children 疊在房間內，例如站在地板上的熊貓。
 * stage 4 起熊貓以 1.05 倍縮放，身高超過房間高度，房間加上 room-grown 讓熊貓縮小以保留頭與耳朵。
 */
export function RoomView({ room, stage, selectedUid, children }: RoomViewProps): JSX.Element {
  const r = room ?? game.value.rooms.living;
  const wallFallback = 'var(--fur-shade)';
  const floorFallback = 'var(--fur)';
  const grown = stage !== undefined && stage >= 4;
  // 先畫後方（y 小）的物品，前方的蓋在上面。
  const items = [...r.placed].sort((a, b) => a.y - b.y);
  return (
    <div class={grown ? 'room room-grown' : 'room'} role="img" aria-label="客廳">
      <svg class="room-svg" viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} aria-hidden="true">
        <Surface id={r.wall} y={0} h={WALL_H} color={wallFallback} colors={WALL_COLOR} />
        <Surface id={r.floor} y={WALL_H} h={ROOM_H - WALL_H} color={floorFallback} colors={FLOOR_COLOR} />
        {Array.from({ length: FLOOR_ROWS }, (_, row) =>
          Array.from({ length: FLOOR_COLS }, (_, col) => {
            const c = cellRect(col, row);
            return (
              <rect
                key={`${col}-${row}`}
                data-testid={`room-cell-${col}-${row}`}
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                fill="none"
                stroke="rgba(60,40,20,0.18)"
                stroke-width={1}
              />
            );
          }),
        )}
        {items.map(p => <PlacedView key={p.uid} item={p} selected={p.uid === selectedUid} />)}
      </svg>
      {children}
    </div>
  );
}
