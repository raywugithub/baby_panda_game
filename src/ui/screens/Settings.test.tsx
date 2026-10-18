import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { Settings } from './Settings';
import { APP_VERSION } from '../../version';

beforeEach(() => { game.value = createInitialState(5, 0); });

describe('Settings', () => {
  it('音效開關寫入 settings.sound', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('checkbox', { name: '音效' }));
    expect(game.value.settings.sound).toBe(false);
  });
  it('顯示版本號與安裝狀態', () => {
    render(<Settings />);
    expect(screen.getByText(new RegExp(APP_VERSION))).toBeTruthy();
    expect(screen.getByText(/安裝狀態/)).toBeTruthy();
  });
  it('匯入需先確認，確認文字包含取代警示', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '匯入存檔碼' }));
    expect(screen.getByText('會取代目前的熊貓，要繼續嗎？')).toBeTruthy();
  });
  it('檔案讀取失敗時顯示看不懂的錯誤，不產生未處理的 rejection', async () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '匯入存檔碼' }));
    fireEvent.click(screen.getByRole('button', { name: '繼續' }));
    const input = screen.getByLabelText('選擇 .panda 檔案') as HTMLInputElement;
    const file = new File(['x'], 'a.panda', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: () => Promise.reject(new Error('read failed')) });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('這個存檔碼看不懂'));
    expect(screen.getByLabelText('選擇 .panda 檔案')).toBeTruthy();
  });
});
