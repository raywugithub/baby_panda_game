import { render, fireEvent, act, screen } from '@testing-library/preact';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Minigame } from './Minigame';

// 固定亂數種子，讓泡泡顏色與跳石頭的順序每次執行都相同（測試不隨機失敗）。
vi.mock('../../platform/clock', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../platform/clock')>()),
  randomSeed: () => 20241021,
}));

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
/** 只讀取命中數字本身（不含「（目標 N）」提示），避免字串比對誤判。 */
function count(): string {
  return screen.getByTestId('minigame-hits').textContent ?? '';
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
    for (let i = 0; i < 12; i++) {
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
    expect(count()).toBe('0');
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
    expect(count()).toBe('0');
    tapAt(x + RADIUS_PX - 6, y);
    expect(count()).toBe('1');
  });
  it('re-tapping a caught star does not count again', () => {
    render(<Minigame kind="stars" onFinish={() => {}} />);
    area();
    const star = waitFor()!;
    tapTarget(star);
    tapTarget(star);
    expect(count()).toBe('1');
  });
  /** 熊貓前方、目前要跳的那一排裡，安全（有苔蘚）與會滑的石頭。 */
  function row(kind: 'safe' | 'slick'): HTMLElement {
    const rows = live().filter((el) => el.dataset.stand !== 'true').map((el) => Number(el.dataset.row));
    const cur = Math.min(...rows);
    return live().find((el) => el.dataset.stand !== 'true' && Number(el.dataset.row) === cur && el.dataset.safe === (kind === 'safe' ? 'true' : 'false'))!;
  }
  it('hop: the hopper stands on a stone from the start', () => {
    render(<Minigame kind="hop" onFinish={() => {}} />);
    area();
    advance(100);
    const stand = live().filter((el) => el.dataset.stand === 'true');
    expect(stand).toHaveLength(1);
    expect(Number(stand[0].dataset.y)).toBe(82);
  });
  it('hop: only the mossy stone counts; a slippery one freezes taps for a moment', () => {
    render(<Minigame kind="hop" onFinish={() => {}} />);
    area();
    waitFor();
    const slick = row('slick');
    tapTarget(slick);
    expect(count()).toBe('0');
    expect(slick.className).toContain('is-wobble');
    // 凍結期間點對的石頭也不算
    tapTarget(row('safe'));
    expect(count()).toBe('0');
    advance(800);
    tapTarget(row('safe'));
    expect(count()).toBe('1');
  });
  it('hop: the path climbs without wrapping, hopper stays on a stone at a fixed height', () => {
    render(<Minigame kind="hop" onFinish={() => {}} />);
    area();
    let prevRowY = Infinity;
    for (let i = 0; i < 14; i++) {
      advance(100);
      const safe = row('safe');
      // 下一排永遠在熊貓上方（y 比站立的石頭小）
      expect(Number(safe.dataset.y)).toBeLessThan(82);
      tapTarget(safe);
      advance(300);
      const stand = live().filter((el) => el.dataset.stand === 'true');
      expect(stand).toHaveLength(1);
      expect(Number(stand[0].dataset.y)).toBe(82);
      expect(Number(stand[0].dataset.x)).toBeCloseTo(Number(safe.dataset.x));
      prevRowY = Number(row('safe').dataset.y);
      expect(prevRowY).toBeLessThan(82);
    }
    expect(count()).toBe('14');
  });
  it('hop: the glow hint is only shown for the first three hops', () => {
    render(<Minigame kind="hop" onFinish={() => {}} />);
    area();
    for (let i = 0; i < 4; i++) {
      advance(300);
      expect(live().some((el) => el.dataset.next === 'true')).toBe(i < 3);
      tapTarget(row('safe'));
    }
  });
  it('hop: fourteen correct crossings score 1', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="hop" onFinish={onFinish} />);
    area();
    for (let i = 0; i < 14; i++) {
      advance(300);
      tapTarget(row('safe'));
    }
    advance(30_000);
    expect(onFinish.mock.calls[0][0]).toBe(1);
  });
  it('the result card stays until the player presses 好, which calls onClose', () => {
    const onFinish = vi.fn();
    const onClose = vi.fn();
    const { getByTestId } = render(<Minigame kind="stars" onFinish={onFinish} onClose={onClose} />);
    advance(30_000);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(getByTestId('minigame-result').textContent).toContain('時間到');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('minigame-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('bubble: two same-colour bubbles tapped in a row make a pair; different colours do not', () => {
    render(<Minigame kind="bubble" onFinish={() => {}} />);
    area();
    const first = waitFor((el) => el.dataset.pair !== undefined)!;
    const mate = waitFor((el) => el.dataset.pair === first.dataset.pair && el !== first)!;
    expect(mate.dataset.color).toBe(first.dataset.color);
    tapTarget(first);
    expect(count()).toBe('0');
    tapTarget(mate);
    expect(count()).toBe('1');
  });
  it('bubble: tapping two different colours scores nothing', () => {
    render(<Minigame kind="bubble" onFinish={() => {}} />);
    area();
    const a = waitFor()!;
    const b = waitFor((el) => el.dataset.color !== a.dataset.color)!;
    expect(b).not.toBeNull();
    tapTarget(a);
    tapTarget(b);
    expect(count()).toBe('0');
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
  it('hiding the document pauses the clock and the game resumes afterwards', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="stars" onFinish={onFinish} />);
    advance(10_000);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    advance(60_000);
    expect(onFinish).not.toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    advance(19_000);
    expect(onFinish).not.toHaveBeenCalled();
    advance(1_500);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toBe(0);
  });
});
