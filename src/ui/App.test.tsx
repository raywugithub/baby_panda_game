import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { App } from './App';
import { saveFailed } from '../platform/storage';
import { game, restored, commit } from './store';
import { tab, overlay, goTab } from './nav';
import { createInitialState } from '../core/state';

afterEach(() => {
  goTab('home');
  overlay.value = null;
  commit(createInitialState(1, 0));
});

describe('App 殼層', () => {
  it('底部 5 個導覽按鈕，名稱正確', () => {
    render(<App />);
    for (const label of ['家', '窗外', '衣櫃＆布置', '禮盒機', '相簿']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });
  it('存檔失敗時顯示頂部警示', async () => {
    saveFailed.value = true;
    render(<App />);
    expect(screen.getByText('目前無法存檔，請匯出備份')).toBeTruthy();
    saveFailed.value = false;
  });
  it('已從備份還原時顯示提示', () => {
    restored.value = true;
    render(<App />);
    expect(screen.getByText(/已從備份還原/)).toBeTruthy();
    restored.value = false;
  });
  it('分頁按鈕有 tab 測試 id', () => {
    render(<App />);
    expect(screen.getByTestId('tab-home')).toBeTruthy();
  });
  it('目前分頁的按鈕有 aria-current="page"', () => {
    goTab('map');
    render(<App />);
    expect(screen.getByTestId('tab-map').getAttribute('aria-current')).toBe('page');
    expect(screen.getByTestId('tab-home').getAttribute('aria-current')).toBeNull();
  });
  it('有待播劇情且沒有覆蓋層時自動開啟對話', () => {
    commit({ ...createInitialState(1, 0), pendingBeat: 'prologue' });
    render(<App />);
    expect(overlay.value).toEqual({ kind: 'dialogue', scriptId: 'prologue' });
    expect(game.value.pendingBeat).toBe('prologue');
  });
  it('橫放提示元素存在', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.rotate-hint')).not.toBeNull();
  });
});
