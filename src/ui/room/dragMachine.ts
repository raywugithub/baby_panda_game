export type DragResult = { type: 'none' } | { type: 'drop'; x: number; y: number } | { type: 'snapBack' };

type DragState = 'idle' | 'pending' | 'dragging' | 'cancelled';

const LONG_PRESS_MS = 300;
const MOVE_TOLERANCE_PX = 8;

// Pure long-press drag state machine. Time is injected by the caller via `t`.
export function createDragMachine(): {
  down(x: number, y: number, t: number): void;
  move(x: number, y: number, t: number): void;
  tick(t: number): void;
  up(valid: boolean, x: number, y: number): DragResult;
  cancel(): DragResult;
  state(): DragState;
} {
  let st: DragState = 'idle';
  let sx = 0;
  let sy = 0;
  let startT = 0;
  let px = 0;
  let py = 0;

  return {
    down(x, y, t) {
      st = 'pending';
      sx = x;
      sy = y;
      startT = t;
      px = x;
      py = y;
    },
    move(x, y, t) {
      void t;
      if (st === 'pending') {
        if (Math.hypot(x - sx, y - sy) > MOVE_TOLERANCE_PX) st = 'cancelled';
      } else if (st === 'dragging') {
        px = x;
        py = y;
      }
    },
    tick(t) {
      if (st === 'pending' && t - startT >= LONG_PRESS_MS) st = 'dragging';
    },
    up(valid, x, y) {
      const wasDragging = st === 'dragging';
      st = 'idle';
      if (!wasDragging) return { type: 'none' };
      return valid ? { type: 'drop', x, y } : { type: 'snapBack' };
    },
    cancel() {
      const wasDragging = st === 'dragging';
      st = 'idle';
      return wasDragging ? { type: 'snapBack' } : { type: 'none' };
    },
    state() {
      return st;
    },
  };
}
