import { describe, it, expect } from 'vitest';
import { createDragMachine } from './dragMachine';

describe('drag machine', () => {
  it('long press of 300ms starts dragging', () => {
    const m = createDragMachine();
    m.down(10, 10, 0);
    m.tick(299);
    expect(m.state()).toBe('pending');
    m.tick(300);
    expect(m.state()).toBe('dragging');
  });
  it('moving more than 8px before 300ms cancels', () => {
    const m = createDragMachine();
    m.down(10, 10, 0);
    m.move(19, 10, 100);
    expect(m.state()).toBe('cancelled');
    m.tick(400);
    expect(m.state()).toBe('cancelled');
  });
  it('exactly 8px is still tolerated', () => {
    const m = createDragMachine();
    m.down(10, 10, 0);
    m.move(18, 10, 100);
    expect(m.state()).toBe('pending');
  });
  it('valid drop returns drop, invalid returns snapBack', () => {
    const m = createDragMachine();
    m.down(0, 0, 0); m.tick(300);
    expect(m.up(true, 40, 50)).toEqual({ type: 'drop', x: 40, y: 50 });
    m.down(0, 0, 0); m.tick(300);
    expect(m.up(false, 40, 50)).toEqual({ type: 'snapBack' });
  });
  it('pointercancel while dragging snaps back', () => {
    const m = createDragMachine();
    m.down(0, 0, 0); m.tick(300);
    expect(m.cancel()).toEqual({ type: 'snapBack' });
    expect(m.state()).toBe('idle');
  });
});
