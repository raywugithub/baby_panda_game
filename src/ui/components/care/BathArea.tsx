import { useRef } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { game, commit } from '../../store';
import { care } from '../../../core/care';
import { now } from '../../../platform/clock';
import { burst } from '../../../platform/particles';
import { bathDone } from './careGeometry';

const N = 8;
const TOTAL = N * N;
const PAINT_RADIUS = 24;

const emptyGrid = (): boolean[] => Array.from({ length: TOTAL }, () => false);

/** 洗澡：在 8×8 格上塗抹，覆蓋 70% 即完成；完成後清空可重洗。 */
export function BathArea() {
  const cells = useSignal<boolean[]>(emptyGrid());
  const pressed = useRef(false);

  function onPointerDown(e: PointerEvent) {
    pressed.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerUp() {
    pressed.current = false;
  }

  function onPointerMove(e: PointerEvent) {
    if (!pressed.current) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const cell = r.width / N;
    const cellH = r.height / N;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const next = cells.value.slice();
    let painted = 0;
    for (let i = 0; i < TOTAL; i++) {
      if (!next[i]) {
        const cx = ((i % N) + 0.5) * cell;
        const cy = (Math.floor(i / N) + 0.5) * cellH;
        if (Math.hypot(x - cx, y - cy) <= PAINT_RADIUS) {
          next[i] = true;
          burst('water', r.left + cx, r.top + cy, 2);
        }
      }
      if (next[i]) painted++;
    }
    if (bathDone(painted, TOTAL)) {
      commit(care(game.value, 'bath', now()));
      burst('bubbles', r.left + r.width / 2, r.top + r.height / 2);
      cells.value = emptyGrid();
      return;
    }
    cells.value = next;
  }

  return (
    <div
      data-testid="bath-area"
      style={{
        touchAction: 'none',
        display: 'grid',
        gridTemplateColumns: `repeat(${N}, 1fr)`,
        gridTemplateRows: `repeat(${N}, 1fr)`,
        width: 'min(240px, 100%)',
        aspectRatio: '1',
        gap: '2px',
        background: 'var(--fur-shade)',
        borderRadius: '10px',
        margin: '0 auto',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {cells.value.map((wet, i) => (
        <i key={i} style={{ background: wet ? '#bfe6ff' : 'transparent', borderRadius: '4px' }} />
      ))}
    </div>
  );
}
