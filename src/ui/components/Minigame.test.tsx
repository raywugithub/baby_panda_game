import { render, fireEvent, act } from '@testing-library/preact';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Minigame } from './Minigame';

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
    const { getByTestId } = render(<Minigame kind="stars" onFinish={onFinish} />);
    const area = getByTestId('minigame-area');
    for (let i = 0; i < 6; i++) fireEvent.pointerDown(area, { clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toBeCloseTo(0.5);
  });
  it('switching away aborts with null and gives no reward', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="hop" onFinish={onFinish} />);
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(null);
  });
  it('play area uses touch-action none', () => {
    const { getByTestId } = render(<Minigame kind="bubble" onFinish={() => {}} />);
    expect((getByTestId('minigame-area') as HTMLElement).style.touchAction).toBe('none');
  });

  it('countdown shows whole seconds from the clock', () => {
    const { getByTestId } = render(<Minigame kind="hop" onFinish={() => {}} />);
    expect(getByTestId('minigame-timer').textContent).toContain('30');
    act(() => { vi.advanceTimersByTime(5_100); });
    expect(getByTestId('minigame-timer').textContent).toContain('25');
  });
  it('unmounting mid-game finishes with null once', () => {
    const onFinish = vi.fn();
    const { unmount } = render(<Minigame kind="bubble" onFinish={onFinish} />);
    unmount();
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(null);
  });
  it('skip after the game ended does not finish again', () => {
    const onFinish = vi.fn();
    const { getByText } = render(<Minigame kind="stars" onFinish={onFinish} />);
    act(() => { vi.advanceTimersByTime(30_000); });
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
