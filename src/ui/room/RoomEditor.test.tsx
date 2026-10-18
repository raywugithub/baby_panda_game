import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/preact';
import { RoomEditor } from './RoomEditor';
import { game } from '../store';
import { createInitialState } from '../../core/state';

// C11: pointer positions are converted with getBoundingClientRect arithmetic.
// The room is stubbed at 400×320 CSS px at the origin, so client px == viewBox units.
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: 400, bottom: 320, width: 400, height: 320, x: 0, y: 0, toJSON() {},
  } as DOMRect);
  const s = createInitialState(1, 0);
  game.value = { ...s, inventory: { ...s.inventory, 'furn-plant-pot': 1 },
    rooms: { ...s.rooms, living: { ...s.rooms.living, placed: [
      { uid: 'furn-plant-pot#1', itemId: 'furn-plant-pot', layer: 'floor', x: 0, y: 0, flipped: false },
    ] } } };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('a 300ms press starts a drag; a move beyond 8px before that does not', () => {
  const { container } = render(<RoomEditor roomId="living" />);
  const g = container.querySelector('[data-uid="furn-plant-pot#1"]') as SVGGElement;
  (g as any).setPointerCapture = () => {};
  fireEvent.pointerDown(g, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(g, { pointerId: 1, clientX: 30, clientY: 10 });
  act(() => { vi.advanceTimersByTime(400); });
  expect(container.querySelector('[data-dragging]')).toBeNull();
});

it('a press held past 300ms enters dragging', () => {
  const { container } = render(<RoomEditor roomId="living" />);
  const g = container.querySelector('[data-uid="furn-plant-pot#1"]') as SVGGElement;
  (g as any).setPointerCapture = () => {};
  fireEvent.pointerDown(g, { pointerId: 1, clientX: 10, clientY: 10 });
  act(() => { vi.advanceTimersByTime(300); });
  fireEvent.pointerMove(g, { pointerId: 1, clientX: 60, clientY: 60 });
  expect(container.querySelector('[data-dragging]')).not.toBeNull();
  fireEvent.pointerUp(g, { pointerId: 1, clientX: 60, clientY: 60 });
});

it('invalid drop snaps back and leaves state unchanged', () => {
  const { container } = render(<RoomEditor roomId="living" />);
  const g = container.querySelector('[data-uid="furn-plant-pot#1"]') as SVGGElement;
  (g as any).setPointerCapture = () => {};
  const before = game.value;
  fireEvent.pointerDown(g, { pointerId: 1, clientX: 10, clientY: 10 });
  act(() => { vi.advanceTimersByTime(300); });
  fireEvent.pointerMove(g, { pointerId: 1, clientX: 900, clientY: 900 }); // far outside
  fireEvent.pointerUp(g, { pointerId: 1, clientX: 900, clientY: 900 });
  expect(game.value).toBe(before);
});

it('valid drop moves the item to the cell under the pointer', () => {
  const { container } = render(<RoomEditor roomId="living" />);
  const g = container.querySelector('[data-uid="furn-plant-pot#1"]') as SVGGElement;
  (g as any).setPointerCapture = () => {};
  // Grab the back-row cell (0,0) at its centre-ish point (50,100), inside its projected rect.
  fireEvent.pointerDown(g, { pointerId: 1, clientX: 50, clientY: 100 });
  act(() => { vi.advanceTimersByTime(300); });
  // Front row (y=5), column 4 at full scale: x 0..400 centred, cell 50px wide, row 40px tall.
  fireEvent.pointerMove(g, { pointerId: 1, clientX: 210, clientY: 290 });
  fireEvent.pointerUp(g, { pointerId: 1, clientX: 210, clientY: 290 });
  expect(game.value.rooms.living.placed[0]).toMatchObject({ x: 4, y: 5 });
});

it('flip button toggles the selected item', () => {
  const { getByText, container } = render(<RoomEditor roomId="living" />);
  const g = container.querySelector('[data-uid="furn-plant-pot#1"]') as SVGGElement;
  (g as any).setPointerCapture = () => {};
  fireEvent.pointerDown(g, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(g, { pointerId: 1, clientX: 10, clientY: 10 }); // quick tap = select
  fireEvent.click(getByText('翻轉'));
  expect(game.value.rooms.living.placed[0].flipped).toBe(true);
});

it('editor root sets touch-action none', () => {
  const { container } = render(<RoomEditor roomId="living" />);
  expect((container.firstElementChild as HTMLElement).style.touchAction).toBe('none');
});
