import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/preact';
import { eventQueue } from '../store';
import { RewardToast } from './RewardToast';

beforeEach(() => { eventQueue.value = []; });

describe('RewardToast', () => {
  it('顯示獎勵與刻度文字，並保留其他事件', async () => {
    render(<RewardToast />);
    await act(() => {
      eventQueue.value = [
        { type: 'reward', xp: 5, starSand: 2, energy: 15, chain: 1, items: {} },
        { type: 'markUp', mark: 3 },
        { type: 'storyBeat', beatId: 'prologue' },
      ];
    });
    expect(screen.getByText('+2 星砂')).toBeTruthy();
    expect(screen.getByText('+15 元氣')).toBeTruthy();
    expect(screen.getByText('成長刻度 +3')).toBeTruthy();
    expect(eventQueue.value).toEqual([{ type: 'storyBeat', beatId: 'prologue' }]);
  });
  it('升階文字包含階段與稱號', async () => {
    render(<RewardToast />);
    await act(() => { eventQueue.value = [{ type: 'stageUp', stage: 2, title: '圓滾滾' }]; });
    expect(screen.getByText('升上階段 2：圓滾滾')).toBeTruthy();
  });
});
