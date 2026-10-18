import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game, readOnly, eventQueue } from '../store';
import { Home, idlePoseFor } from './Home';
import { overlay } from '../nav';
import { now } from '../../platform/clock';

// C13：家畫面測試固定在當地時間 12:00，避免夜間睡覺時段影響結果。
const clock = vi.hoisted(() => ({ t: 0 }));
vi.mock('../../platform/clock', () => ({
  now: () => clock.t,
  randomSeed: () => 1,
}));

const NOON = new Date(2026, 9, 18, 12).getTime();

beforeEach(() => {
  clock.t = NOON;
  game.value = { ...createInitialState(5, now()), needs: { tummy: 70, clean: 70, mood: 70 } };
  readOnly.value = false;
  overlay.value = null;
  eventQueue.value = [];
});

describe('Home 指標', () => {
  it('三個指標是 meter，並隨 signal 精細更新', async () => {
    render(<Home />);
    const tummy = screen.getByRole('meter', { name: '肚子' });
    expect(tummy.getAttribute('aria-valuenow')).toBe('70');
    await act(() => { game.value = { ...game.value, needs: { ...game.value.needs, tummy: 50 } }; });
    expect(screen.getByRole('meter', { name: '肚子' }).getAttribute('aria-valuenow')).toBe('50');
  });
});

describe('Home 導覽與功能', () => {
  it('設定按鈕開啟設定覆蓋層', () => {
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    expect(overlay.value).toEqual({ kind: 'settings' });
  });
  it('階段 1 時料理台停用並提示', () => {
    render(<Home />);
    const btn = screen.getByRole('button', { name: '料理台' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText('長大一點就能用')).toBeTruthy();
  });
  it('唯讀時顯示提示', () => {
    readOnly.value = true;
    render(<Home />);
    expect(screen.getByText('唯讀模式：請更新遊戲')).toBeTruthy();
  });
});

describe('Home 提示與撒嬌圖示', () => {
  it('想睡時顯示提示文字', () => {
    game.value = { ...createInitialState(5, now()), energy: 20 };
    render(<Home />);
    expect(screen.getByTestId('sleepy-hint').textContent).toBe('抱抱我、餵我吃點東西');
  });
  it('指標低於 50 才顯示撒嬌圖示', () => {
    game.value = { ...createInitialState(5, 0), needs: { tummy: 40, clean: 80, mood: 80 } };
    render(<Home />);
    expect(screen.getByTestId('need-icon-tummy')).toBeTruthy();
    expect(screen.queryByTestId('need-icon-clean')).toBeNull();
  });
  it('操作列按鈕有測試 id', () => {
    render(<Home />);
    for (const id of ['care-feed', 'care-bath', 'care-play', 'care-hug']) expect(screen.getByTestId(id)).toBeTruthy();
  });
});

describe('idlePoseFor', () => {
  it('依情緒選擇待機姿勢', () => {
    expect(idlePoseFor('sleeping')).toBe('sleep');
    expect(idlePoseFor('sleepy')).toBe('yawn');
    expect(idlePoseFor('clingy')).toBe('armsOut');
    expect(idlePoseFor('happy')).toBe('dance');
    expect(idlePoseFor('normal')).toBe('sit');
  });
});

describe('Home 互動細節', () => {
  it('夜裡點醒睡覺中的熊貓：設定 awakeUntil 並改為醒著的姿勢', () => {
    clock.t = new Date(2026, 9, 18, 23, 30).getTime();
    render(<Home />);
    const svg = document.querySelector('svg[data-pose]')!;
    expect(svg.getAttribute('data-pose')).toBe('sleep');
    fireEvent.pointerDown(svg);
    expect(game.value.awakeUntil).toBe(clock.t + 30 * 60_000);
    expect(document.querySelector('svg[data-pose]')!.getAttribute('data-pose')).toBe('dance');
  });
  it('升階事件讓熊貓進入慶祝姿勢，且不消化佇列', async () => {
    render(<Home />);
    expect(document.querySelector('svg[data-pose]')!.getAttribute('data-pose')).toBe('dance');
    await act(() => { eventQueue.value = [{ type: 'stageUp', stage: 2, title: '圓滾滾' }]; });
    expect(document.querySelector('svg[data-pose]')!.getAttribute('data-pose')).toBe('celebrate');
    expect(eventQueue.value).toHaveLength(1);
  });
  it('沒有貼紙時不顯示「貼貼紙」按鈕', () => {
    game.value = { ...game.value, diary: [{ date: '2026-10-18', text: '今天很開心', sticker: null }] };
    render(<Home />);
    expect(screen.getByText('今天很開心')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '貼貼紙' })).toBeNull();
  });
  it('打開信件後標記為已讀', () => {
    game.value = { ...game.value, letters: [{ id: 'l1', date: '2026-10-18', from: 'juzi', text: '嗨，我是橘子', read: false }] };
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: '信箱' }));
    fireEvent.click(screen.getByRole('button', { name: /來自橘子/ }));
    expect(game.value.letters[0].read).toBe(true);
    expect(screen.getByText('嗨，我是橘子')).toBeTruthy();
  });
});
