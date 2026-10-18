import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { PandaTapZone } from './Surprises';

describe('戳戳區（僅呈現與轉發）', () => {
  it('busy 為真時顯示「假裝很忙」', () => {
    render(<PandaTapZone busy />);
    expect(screen.getByText(/假裝很忙/)).toBeTruthy();
  });
  it('busy 為假時不顯示訊息', () => {
    render(<PandaTapZone busy={false} />);
    expect(screen.queryByText(/假裝很忙/)).toBeNull();
  });
  it('pointerdown 轉發給 onPointerDown，且只呼叫一次', () => {
    const onPointerDown = vi.fn();
    render(<PandaTapZone onPointerDown={onPointerDown} />);
    fireEvent.pointerDown(screen.getByTestId('panda-tap-zone'), { clientX: 1, clientY: 1, pointerId: 1 });
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });
});
