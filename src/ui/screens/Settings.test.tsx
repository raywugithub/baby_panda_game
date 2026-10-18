import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
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
});
