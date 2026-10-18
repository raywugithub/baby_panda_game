import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { Onboarding } from './Onboarding';

beforeEach(() => { game.value = createInitialState(5, 0); });

describe('Onboarding', () => {
  it('搬家流程（已有進度的 iOS 分頁）提供複製存檔碼與「先不用」', () => {
    render(<Onboarding step="moveOut" />);
    expect(screen.getByText(/把熊貓搬到主畫面/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '複製存檔碼' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '先不用' })).toBeTruthy();
  });
  it('安裝步驟提供「先在這裡玩」', () => {
    render(<Onboarding step="install" />);
    expect(screen.getByText(/把熊貓帶回家/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '先在這裡玩' })).toBeTruthy();
  });
  it('搬家：貼上錯誤存檔碼顯示錯誤且不覆蓋進度', () => {
    render(<Onboarding step="moveIn" />);
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.input(input, { target: { value: '亂碼' } });
    fireEvent.click(screen.getByRole('button', { name: '貼上存檔碼' }));
    expect(screen.getByText('這個存檔碼看不懂')).toBeTruthy();
    expect(game.value.seed).toBe(5);
  });
});
