import type { JSX } from 'preact';
import { game } from '../store';
import { ITEM_BY_ID } from '../../content/items';
import { ITEM_ART } from '../../art/items';
import type { PlacedItem } from '../../core/state';

// 唯讀、平面版房間；2.5D 透視由計畫 C（契約 10.14）實作。
const WALL_PCT = 25;
const FLOOR_PCT = 100 - WALL_PCT;
const COLS = 8;
const ROWS = 6;
const WALL_COLOR: Record<string, string> = { 'wall-default': '#CFE3C0' };
const FLOOR_COLOR: Record<string, string> = { 'floor-default': '#D9B98C' };

function PlacedView({ item }: { item: PlacedItem }): JSX.Element {
  const def = ITEM_BY_ID[item.itemId];
  const Art = ITEM_ART[item.itemId] as (typeof ITEM_ART)[string] | undefined;
  const w = def?.size?.w ?? 1;
  const h = def?.size?.h ?? 1;
  const left = `${(item.x * 100) / COLS}%`;
  const width = `${(w * 100) / COLS}%`;
  const style =
    item.layer === 'wall'
      ? { left, width, top: '0%', height: `${WALL_PCT}%` }
      : {
          left,
          width,
          top: `${WALL_PCT + (item.y * FLOOR_PCT) / ROWS}%`,
          height: `${(h * FLOOR_PCT) / ROWS}%`,
        };
  return (
    <div class="room-item" data-testid={`placed-${item.uid}`} style={style}>
      {Art ? (
        <svg
          viewBox="-50 -50 100 100"
          width="100%"
          height="100%"
          aria-hidden="true"
          style={item.flipped ? { transform: 'scaleX(-1)' } : undefined}
        >
          <Art size={100} />
        </svg>
      ) : (
        <div class="room-box" />
      )}
    </div>
  );
}

export function RoomView(): JSX.Element {
  const room = game.value.rooms.living;
  const wall = WALL_COLOR[room.wall] ?? 'var(--fur-shade)';
  const floor = FLOOR_COLOR[room.floor] ?? 'var(--fur)';
  return (
    <div class="room" role="img" aria-label="客廳">
      <div class="room-wall" style={{ background: wall }} />
      <div class="room-floor" style={{ background: floor }} />
      {room.placed.map(p => <PlacedView key={p.uid} item={p} />)}
    </div>
  );
}
