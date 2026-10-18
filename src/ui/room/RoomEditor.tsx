import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { PlacedItem, RoomId } from '../../core/state';
import { game, commit } from '../store';
import { move, flip, stow } from '../../core/room';
import { ITEM_BY_ID } from '../../content/items';
import { ITEM_ART } from '../../art/items';
import { RoomView, footprintOf } from '../components/RoomView';
import { createDragMachine } from './dragMachine';
import { pixelToCell, cellRect, wallRect, ROOM_W, ROOM_H, ROW_H, WALL_CELL_W } from './perspective';
import { now } from '../../platform/clock';

const LONG_PRESS_TICK_MS = 50;

interface Point { x: number; y: number }

/** 一次按壓的紀錄：按下的物品、按下點相對物品左上角的偏移、以及抓取點所在的格數。 */
interface Press {
  uid: string;
  item: PlacedItem;
  offX: number;
  offY: number;
  grabCellsX: number;
  grabCellsY: number;
  started: boolean;
}

interface Ghost { item: PlacedItem; x: number; y: number }

const btn = { minHeight: '44px', minWidth: '44px', padding: '0 16px', borderRadius: '12px' };

/** 客戶端座標換成 viewBox 座標（C11：只用 getBoundingClientRect 的算術）。 */
function toView(root: HTMLElement | null, cx: number, cy: number): Point | null {
  if (!root) return null;
  const r = root.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  return { x: ((cx - r.left) * ROOM_W) / r.width, y: ((cy - r.top) * ROOM_H) / r.height };
}

/** 拖到的目標格：地板以指標所在格減去抓取格數；牆面 y 固定為 0，x = floor(px / 50)。 */
function dropCell(p: Press, v: Point): Point | null {
  if (p.item.layer === 'wall') {
    return { x: Math.floor(v.x / WALL_CELL_W) - p.grabCellsX, y: 0 };
  }
  const cell = pixelToCell(v.x, v.y);
  if (!cell) return null;
  return { x: cell.x - p.grabCellsX, y: cell.y - p.grabCellsY };
}

/** 布置模式：長按拖曳、放錯位置會彈回，點一下選取後可翻轉或收回。 */
export function RoomEditor({ roomId }: { roomId: RoomId }): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef(createDragMachine());
  const pressRef = useRef<Press | null>(null);
  const lastRef = useRef<Point>({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [selected, setSelected] = useState<string | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);

  const stopTimer = (): void => {
    clearInterval(timerRef.current);
    timerRef.current = undefined;
  };
  useEffect(() => stopTimer, []);

  const room = game.value.rooms[roomId];
  const selectedItem = selected ? room.placed.find(p => p.uid === selected) : undefined;

  const ghostAt = (press: Press, cx: number, cy: number): Ghost | null => {
    const v = toView(rootRef.current, cx, cy);
    if (!v) return null;
    return { item: press.item, x: v.x - press.offX, y: v.y - press.offY };
  };

  const onPointerDown = (e: PointerEvent): void => {
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('button')) return;
    const g = target?.closest('[data-uid]') as SVGGElement | null | undefined;
    if (!g) {
      setSelected(null);
      return;
    }
    const uid = g.getAttribute('data-uid');
    const item = room.placed.find(p => p.uid === uid);
    if (!uid || !item) return;
    g.setPointerCapture(e.pointerId);

    const v = toView(rootRef.current, e.clientX, e.clientY);
    const rect = footprintOf(item);
    const cellW = item.layer === 'wall' ? wallRect(0).w : cellRect(0, item.y).w;
    const offX = v ? v.x - rect.x : 0;
    const offY = v ? v.y - rect.y : 0;
    pressRef.current = {
      uid,
      item,
      offX,
      offY,
      grabCellsX: Math.floor(offX / cellW),
      grabCellsY: item.layer === 'wall' ? 0 : Math.floor(offY / ROW_H),
      started: false,
    };
    lastRef.current = { x: e.clientX, y: e.clientY };
    machineRef.current.down(e.clientX, e.clientY, now());

    stopTimer();
    timerRef.current = setInterval(() => {
      const m = machineRef.current;
      m.tick(now());
      const press = pressRef.current;
      if (m.state() === 'dragging' && press && !press.started) {
        press.started = true;
        setGhost(ghostAt(press, lastRef.current.x, lastRef.current.y));
        stopTimer();
      }
    }, LONG_PRESS_TICK_MS);
  };

  const onPointerMove = (e: PointerEvent): void => {
    const m = machineRef.current;
    if (m.state() === 'idle') return;
    m.move(e.clientX, e.clientY, now());
    lastRef.current = { x: e.clientX, y: e.clientY };
    const press = pressRef.current;
    if (m.state() === 'dragging' && press) setGhost(ghostAt(press, e.clientX, e.clientY));
  };

  const onPointerUp = (e: PointerEvent): void => {
    const m = machineRef.current;
    const prior = m.state();
    const press = pressRef.current;
    pressRef.current = null;
    stopTimer();
    setGhost(null);

    if (prior === 'dragging' && press) {
      const v = toView(rootRef.current, e.clientX, e.clientY);
      const cell = v ? dropCell(press, v) : null;
      const r = m.up(cell !== null, cell?.x ?? 0, cell?.y ?? 0);
      if (r.type === 'drop') {
        const next = move(game.value, roomId, press.uid, r.x, r.y);
        if (next) commit(next); // 不合法則不 commit，物品彈回原位
      }
      return;
    }
    m.up(false, 0, 0);
    if (prior === 'pending' && press) setSelected(press.uid);
  };

  const onPointerCancel = (): void => {
    machineRef.current.cancel();
    pressRef.current = null;
    stopTimer();
    setGhost(null);
  };

  const Art = ghost ? (ITEM_ART[ghost.item.itemId] as (typeof ITEM_ART)[string] | undefined) : undefined;
  const gf = ghost ? footprintOf(ghost.item) : null;
  const gSize = gf ? Math.min(gf.w, gf.h) : 0;
  const gFlip = ghost?.item.flipped ? ' scale(-1 1)' : '';

  return (
    <div
      ref={rootRef}
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <RoomView
        room={room}
        editable
        selectedUid={selected}
        hiddenUid={ghost?.item.uid ?? null}
      >
        {ghost && gf ? (
          <svg class="room-svg" viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} aria-hidden="true">
            <g data-dragging transform={`translate(${ghost.x} ${ghost.y})`}>
              <rect
                x={0}
                y={0}
                width={gf.w}
                height={gf.h}
                rx={6}
                fill="rgba(255,255,255,0.35)"
                stroke="var(--amber, #E8A33D)"
                stroke-width={2}
                stroke-dasharray="6 4"
              />
              <g transform={`translate(${gf.w / 2} ${gf.h / 2})${gFlip}`}>
                {Art ? <Art size={gSize} /> : null}
              </g>
            </g>
          </svg>
        ) : null}
      </RoomView>
      {selectedItem ? (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button type="button" style={btn} onClick={() => commit(flip(game.value, roomId, selectedItem.uid))}>翻轉</button>
          <button
            type="button"
            style={btn}
            onClick={() => {
              commit(stow(game.value, roomId, selectedItem.uid));
              setSelected(null);
            }}
          >
            收回
          </button>
        </div>
      ) : null}
    </div>
  );
}
