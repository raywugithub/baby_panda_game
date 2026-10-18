import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
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
  it('複製存檔碼被拒絕時靜默略過，不產生未處理的 promise rejection', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
    const unhandled: unknown[] = [];
    const onUnhandled = (e: PromiseRejectionEvent) => { unhandled.push(e.reason); };
    globalThis.addEventListener?.('unhandledrejection', onUnhandled as EventListener);
    try {
      render(<Onboarding step="moveOut" />);
      fireEvent.click(screen.getByRole('button', { name: '複製存檔碼' }));
      await new Promise((r) => setTimeout(r, 0));
      expect(unhandled).toEqual([]);
    } finally {
      globalThis.removeEventListener?.('unhandledrejection', onUnhandled as EventListener);
      if (original) Object.defineProperty(navigator, 'clipboard', original);
      else delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });
  it('紙箱：用真的熊貓（boxPeek 姿勢）探出頭，並有「點紙箱打開它」提示', () => {
    render(<Onboarding step="boxPeek" />);
    const box = screen.getByTestId('box-peek');
    expect(box.querySelector('svg[data-pose="boxPeek"]')).toBeTruthy();
    expect(box.textContent).toContain('點紙箱打開它');
  });
  it('安裝引導：三個步驟各只有一個數字徽章，文字不再帶 ①②③', () => {
    const { container } = render(<Onboarding step="install" />);
    const steps = container.querySelectorAll('.install-steps > li');
    expect(steps.length).toBe(3);
    const badges = Array.from(container.querySelectorAll('.install-steps .step-badge')).map(b => b.textContent);
    expect(badges).toEqual(['1', '2', '3']);
    expect(container.textContent).not.toMatch(/[①②③]/);
  });
  it('安裝引導：主要按鈕「我加好了，開啟熊貓」與次要按鈕「先在這裡玩」', () => {
    render(<Onboarding step="install" />);
    expect(screen.getByRole('button', { name: '我加好了，開啟熊貓' }).className).toContain('btn-primary');
    expect(screen.getByRole('button', { name: '先在這裡玩' }).className).toContain('btn-secondary');
  });
  it('安裝引導第三步使用 public 內的真實 App 圖示', () => {
    const { container } = render(<Onboarding step="install" />);
    const img = container.querySelector('.install-steps img') as HTMLImageElement | null;
    expect(img).toBeTruthy();
    expect(img!.getAttribute('src')).toBe('./pwa-192.png');
  });
  it('搬家：「複製存檔碼」為主要按鈕，複製成功後顯示「已複製！」', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
    try {
      render(<Onboarding step="moveOut" />);
      const btn = screen.getByRole('button', { name: '複製存檔碼' });
      expect(btn.className).toContain('btn-primary');
      fireEvent.click(btn);
      await waitFor(() => expect(screen.getByText('已複製！')).toBeTruthy());
    } finally {
      if (original) Object.defineProperty(navigator, 'clipboard', original);
      else delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });
  it('搬家：複製失敗時顯示錯誤訊息', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
    try {
      render(<Onboarding step="moveOut" />);
      fireEvent.click(screen.getByRole('button', { name: '複製存檔碼' }));
      await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('複製失敗'));
    } finally {
      if (original) Object.defineProperty(navigator, 'clipboard', original);
      else delete (navigator as { clipboard?: unknown }).clipboard;
    }
  });
});
