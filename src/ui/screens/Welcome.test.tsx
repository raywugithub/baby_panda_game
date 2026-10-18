import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game, justOpenedAfterMs } from '../store';
import { overlay } from '../nav';
import { Welcome } from './Welcome';
import { Home } from './Home';

const H = 3600_000;
beforeEach(() => {
  game.value = createInitialState(5, 0);
  overlay.value = { kind: 'welcome' };
  justOpenedAfterMs.value = null;
});

describe('Welcome', () => {
  it('顯示歡迎文字與禮物說明，收下後關閉', () => {
    render(<Welcome overlay={{ kind: 'welcome' }} />);
    expect(screen.getByText('你回來了！')).toBeTruthy();
    expect(screen.getByText(/30 星砂/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '收下' }));
    expect(overlay.value).toBeNull();
  });
});

describe('睡覺醒來', () => {
  it('離線 13 小時剛打開時睡著，點熊貓後醒來', async () => {
    const h = new Date(2026, 9, 18, 12).getTime();
    game.value = { ...createInitialState(5, h), needs: { tummy: 80, clean: 80, mood: 80 }, energy: 80 };
    justOpenedAfterMs.value = 13 * H;
    render(<Home />);
    expect(screen.getByRole('img', { name: '熊貓' }).getAttribute('data-pose')).toBe('sleep');
    await act(() => { fireEvent.pointerDown(screen.getByTestId('panda-body'), { pointerId: 1, clientX: 1, clientY: 1 }); });
    expect(justOpenedAfterMs.value).toBeNull();
    expect(game.value.awakeUntil).not.toBeNull();
  });

  it('睡覺時點照顧按鈕（餵食）會先醒來', async () => {
    const h = new Date(2026, 9, 18, 12).getTime();
    game.value = { ...createInitialState(5, h), needs: { tummy: 80, clean: 80, mood: 80 }, energy: 80 };
    justOpenedAfterMs.value = 13 * H;
    render(<Home />);
    await act(() => { fireEvent.click(screen.getByTestId('care-feed')); });
    expect(justOpenedAfterMs.value).toBeNull();
    expect(game.value.awakeUntil).not.toBeNull();
  });
});
