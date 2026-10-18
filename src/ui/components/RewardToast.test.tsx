import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/preact';
import { eventQueue } from '../store';
import { RewardToast } from './RewardToast';

beforeEach(() => { eventQueue.value = []; });
afterEach(() => { vi.useRealTimers(); });

const visibleToasts = () => Array.from(document.querySelectorAll('.reward-toast-item')).map((el) => el.textContent);

describe('RewardToast', () => {
  it('同一時間只顯示一則獎勵，依序排隊並保留其他事件', async () => {
    vi.useFakeTimers();
    render(<RewardToast />);
    await act(() => {
      eventQueue.value = [
        { type: 'reward', xp: 5, starSand: 2, energy: 15, chain: 1, items: {} },
        { type: 'markUp', mark: 3 },
        { type: 'storyBeat', beatId: 'prologue' },
      ];
    });
    expect(visibleToasts()).toEqual(['+2 星砂']);
    act(() => { vi.advanceTimersByTime(2500); });
    expect(visibleToasts()).toEqual(['+15 元氣']);
    act(() => { vi.advanceTimersByTime(2500); });
    expect(visibleToasts()).toEqual(['成長刻度 +3']);
    act(() => { vi.advanceTimersByTime(2500); });
    expect(visibleToasts()).toEqual([]);
    expect(eventQueue.value).toEqual([{ type: 'storyBeat', beatId: 'prologue' }]);
  });
  it('升階文字包含階段與稱號', async () => {
    render(<RewardToast />);
    await act(() => { eventQueue.value = [{ type: 'stageUp', stage: 2, title: '圓滾滾' }]; });
    expect(screen.getByText('升上階段 2：圓滾滾')).toBeTruthy();
  });
});
