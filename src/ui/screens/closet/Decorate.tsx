import { useState } from 'preact/hooks';
import type { GameState, RoomId } from '../../../core/state';
import { place, roomUnlocked, setSurface } from '../../../core/room';
import { ITEMS } from '../../../content/items';
import { game, commit } from '../../store';
import { RoomView } from '../../components/RoomView';
import { RoomEditor } from '../../room/RoomEditor';

const FLOOR_COLS = 8;
const FLOOR_ROWS = 6;

type SurfaceKind = 'wall' | 'floor';
const SURFACE_TABS: { key: SurfaceKind; label: string }[] = [
  { key: 'wall', label: '牆紙' },
  { key: 'floor', label: '地板' },
];

/** 已持有但尚未擺進任何房間的數量。 */
function availableCount(s: GameState, itemId: string): number {
  let placed = 0;
  for (const roomId of Object.keys(s.rooms) as RoomId[]) {
    for (const p of s.rooms[roomId].placed) if (p.itemId === itemId) placed++;
  }
  return (s.inventory[itemId] ?? 0) - placed;
}

/** 依掃描順序（先 y 後 x）找第一個可以放下的格子；牆面家具只會在 y = 0 找到。 */
function firstFreeCell(s: GameState, roomId: RoomId, itemId: string): GameState | null {
  for (let y = 0; y < FLOOR_ROWS; y++) {
    for (let x = 0; x < FLOOR_COLS; x++) {
      const next = place(s, roomId, itemId, x, y);
      if (next) return next;
    }
  }
  return null;
}

/** 衣櫃的布置分段：選房間、換牆紙與地板、擺放家具，並可切換到布置模式。 */
export function Decorate() {
  const s = game.value;
  const [roomId, setRoomId] = useState<RoomId>('living');
  const [kind, setKind] = useState<SurfaceKind>('wall');
  const [trayOpen, setTrayOpen] = useState(false);
  const [layout, setLayout] = useState(false);
  const [full, setFull] = useState(false);

  const bedroomOpen = roomUnlocked(s, 'bedroom');
  const room = s.rooms[roomId];

  const ownedSurfaces = ITEMS.filter(i => i.category === kind && (s.inventory[i.id] ?? 0) > 0);
  const tray = ITEMS.filter(i => i.category === 'furniture' && availableCount(s, i.id) > 0);

  function chooseSurface(id: string) {
    commit(setSurface(s, roomId, kind, id));
  }

  function placeItem(itemId: string) {
    const next = firstFreeCell(game.value, roomId, itemId);
    if (next) {
      commit(next);
      setFull(false);
      setTrayOpen(false);
    } else {
      setFull(true);
    }
  }

  return (
    <div class="closet-decorate">
      <div class="closet-segments" role="group" aria-label="房間">
        <button type="button" aria-pressed={roomId === 'living'} onClick={() => setRoomId('living')}>
          客廳
        </button>
        <button
          type="button"
          aria-pressed={roomId === 'bedroom'}
          disabled={!bedroomOpen}
          onClick={() => setRoomId('bedroom')}
        >
          {bedroomOpen ? '臥室' : '階段 2 解鎖臥室'}
        </button>
      </div>

      <div class="closet-segments" role="group" aria-label="牆面與地板">
        {SURFACE_TABS.map(t => (
          <button key={t.key} type="button" aria-pressed={kind === t.key} onClick={() => setKind(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div class="closet-list" role="group" aria-label={kind === 'wall' ? '牆紙' : '地板'}>
        {ownedSurfaces.map(i => (
          <button
            key={i.id}
            type="button"
            aria-pressed={room[kind] === i.id}
            onClick={() => chooseSurface(i.id)}
          >
            {i.name}
          </button>
        ))}
      </div>

      <div class="closet-segments" role="group" aria-label="擺放與布置模式">
        <button type="button" aria-pressed={trayOpen} onClick={() => setTrayOpen(o => !o)}>
          擺放
        </button>
        <button
          type="button"
          data-testid="layout-toggle"
          aria-pressed={layout}
          onClick={() => setLayout(v => !v)}
        >
          布置模式
        </button>
      </div>
      {trayOpen ? (
        <div class="closet-list" role="group" aria-label="可擺放的家具">
          {tray.map(i => (
            <button key={i.id} type="button" data-testid={`tray-${i.id}`} onClick={() => placeItem(i.id)}>
              {i.name}
            </button>
          ))}
        </div>
      ) : null}
      {full ? <p role="status">放不下了，先收回一件吧</p> : null}
      {layout ? <RoomEditor roomId={roomId} /> : <RoomView room={room} />}
    </div>
  );
}
