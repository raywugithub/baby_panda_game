import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game, readOnly, eventQueue } from '../store';
import { Home } from './Home';
import { overlay } from '../nav';

vi.mock('../../platform/clock', () => ({
  now: () => new Date(2026, 9, 18, 12).getTime(),
  randomSeed: () => 1,
}));

beforeEach(() => {
  const s = createInitialState(5, new Date(2026, 9, 18, 12).getTime());
  game.value = { ...s, needs: { tummy: 70, clean: 70, mood: 70 } };
  readOnly.value = false;
  overlay.value = null;
  eventQueue.value = [];
});

describe('Home 朋友來訪', () => {
  it('有未完成的來訪時顯示來訪卡，且照顧按鈕仍在', () => {
    game.value = { ...game.value, daily: { ...game.value.daily, visitor: 'mianhua', visitorDone: false } };
    render(<Home />);
    expect(screen.getByText('送客')).toBeTruthy();
    expect(screen.getByTestId('care-feed')).toBeTruthy();
    expect(screen.getByTestId('care-bath')).toBeTruthy();
    expect(screen.getByTestId('care-play')).toBeTruthy();
  });

  it('沒有來訪時不顯示來訪卡', () => {
    render(<Home />);
    expect(screen.queryByText('送客')).toBeNull();
  });
});
