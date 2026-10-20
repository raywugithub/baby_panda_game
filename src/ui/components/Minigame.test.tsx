import { render, fireEvent, act, screen } from '@testing-library/preact';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Minigame } from './Minigame';

// jsdom 沒有版面，所以把遊戲區的矩形固定為 300×400（與 CSS 的比例相近）。
const RECT = { left: 0, top: 0, width: 300, height: 400, right: 300, bottom: 400, x: 0, y: 0, toJSON() {} } as DOMRect;
const RADIUS_PX = 32;

function area(): HTMLElement {
  const el = screen.getByTestId('minigame-area');
  el.getBoundingClientRect = () => RECT;
  return el;
}
function live(): HTMLElement[] {
  return [...screen.getByTestId('minigame-area').querySelectorAll<HTMLElement>('[data-target-id]:not([data-popped="true"])')];
}
function advance(ms: number): void {
  act(() => { vi.advanceTimersByTime(ms); });
}
/** 每 100ms 前進一次，直到出現符合條件的目標（最多 40 次）。 */
function waitFor(pred: (el: HTMLElement) => boolean = () => true): HTMLElement | null {
  for (let i = 0; i < 40; i++) {
    const hit = live().find(pred);
    if (hit) return hit;
    advance(100);
  }
  return null;
}
function tapAt(x: number, y: number): void {
  fireEvent.pointerDown(screen.getByTestId('minigame-area'), { clientX: x, clientY: y });
}
function tapTarget(el: HTMLElement): void {
  tapAt((Number(el.dataset.x) / 100) * RECT.width, (Number(el.dataset.y) / 100) * RECT.height);
}
function count(): string {
  return screen.getByTestId('minigame-count').textContent ?? '';
}

describe('Minigame', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('skip finishes with null exactly once', () => {
    const onFinish = vi.fn();
    const { getByText } = render(<Minigame kind="stars" onFinish={onFinish} />);
    fireEvent.click(getByText('跳過'));
    fireEvent.click(getByText('跳過'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(null);
  });
  it('auto-ends after 30 seconds with the hit score', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="stars" onFinish={onFinish} />);
    area();
    for (let i = 0; i < 6; i++) {
      const star = waitFor();
      expect(star).not.toBeNull();
      tapTarget(star!);
    }
    advance(30_000);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toBeCloseTo(0.5);
  });
  it('taps on empty play area never count (score 0)', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="stars" onFinish={onFinish} />);
    area();
    advance(1000);
    const stars = live().map((el) => ({ x: (Number(el.dataset.x) / 100) * RECT.width, y: (Number(el.dataset.y) / 100) * RECT.height }));
    let spot: { x: number; y: number } | null = null;
    for (let y = 5; y < RECT.height && !spot; y += 10) {
      for (let x = 5; x < RECT.width && !spot; x += 10) {
        if (stars.every((s) => Math.hypot(s.x - x, s.y - y) > RADIUS_PX * 2)) spot = { x, y };
      }
    }
    expect(spot).not.toBeNull();
    for (let i = 0; i < 8; i++) tapAt(spot!.x, spot!.y);
    expect(count()).toContain('0');
    advance(30_000);
    expect(onFinish).toHaveBeenCalledWith(0);
  });
  it('a tap just outside the hit radius of a star does not count', () => {
    render(<Minigame kind="stars" onFinish={() => {}} />);
    area();
    const star = waitFor()!;
    const x = (Number(star.dataset.x) / 100) * RECT.width;
    const y = (Number(star.dataset.y) / 100) * RECT.height;
    tapAt(x + RADIUS_PX + 6, y);
    expect(count()).toContain('0');
    tapAt(x + RADIUS_PX - 6, y);
    expect(count()).toContain('1');
  });
  it('re-tapping a caught star does not count again', () => {
    render(<Minigame kind="stars" onFinish={() => {}} />);
    area();
    const star = waitFor()!;
    tapTarget(star);
    tapTarget(star);
    expect(count()).toContain('1');
  });
  it('hop: only the highlighted next stone counts; a wrong stone just wobbles', () => {
    render(<Minigame kind="hop" onFinish={() => {}} />);
    area();
    const next = waitFor((el) => el.dataset.next === 'true')!;
    const wrong = waitFor((el) => el.dataset.next !== 'true')!;
    expect(wrong).not.toBeNull();
    tapTarget(wrong);
    expect(count()).toContain('0');
    expect(wrong.className).toContain('is-wobble');
    tapTarget(next);
    expect(count()).toContain('1');
  });
  it('hop: eight correct crossings score 1', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="hop" onFinish={onFinish} />);
    area();
    for (let i = 0; i < 8; i++) {
      const next = waitFor((el) => el.dataset.next === 'true');
      expect(next).not.toBeNull();
      tapTarget(next!);
    }
    advance(30_000);
    expect(onFinish.mock.calls[0][0]).toBe(1);
  });
  it('bubble: two same-colour bubbles tapped in a row make a pair; different colours do not', () => {
    render(<Minigame kind="bubble" onFinish={() => {}} />);
    area();
    const first = waitFor((el) => el.dataset.pair !== undefined)!;
    const mate = waitFor((el) => el.dataset.pair === first.dataset.pair && el !== first)!;
    expect(mate.dataset.color).toBe(first.dataset.color);
    tapTarget(first);
    expect(count()).toContain('0');
    tapTarget(mate);
    expect(count()).toContain('1');
  });
  it('bubble: tapping two different colours scores nothing', () => {
    render(<Minigame kind="bubble" onFinish={() => {}} />);
    area();
    const a = waitFor()!;
    const b = waitFor((el) => el.dataset.color !== a.dataset.color)!;
    expect(b).not.toBeNull();
    tapTarget(a);
    tapTarget(b);
    expect(count()).toContain('0');
  });
  it('play area uses touch-action none', () => {
    const { getByTestId } = render(<Minigame kind="bubble" onFinish={() => {}} />);
    expect((getByTestId('minigame-area') as HTMLElement).style.touchAction).toBe('none');
  });
  it('countdown shows whole seconds from the clock', () => {
    const { getByTestId } = render(<Minigame kind="hop" onFinish={() => {}} />);
    expect(getByTestId('minigame-timer').textContent).toContain('30');
    advance(5_100);
    expect(getByTestId('minigame-timer').textContent).toContain('25');
  });
  it('switching away aborts with null and gives no reward', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="hop" onFinish={onFinish} />);
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    advance(30_000);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(null);
  });
  it('unmounting mid-game finishes with null once', () => {
    const onFinish = vi.fn();
    const { unmount } = render(<Minigame kind="bubble" onFinish={onFinish} />);
    unmount();
    advance(30_000);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(null);
  });
  it('skip after the game ended does not finish again', () => {
    const onFinish = vi.fn();
    const { getByText } = render(<Minigame kind="stars" onFinish={onFinish} />);
    advance(30_000);
    fireEvent.click(getByText('跳過'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toBe(0);
  });
  it('hiding the document aborts with null', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="stars" onFinish={onFinish} />);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(null);
  });
});
