import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { PandaTapZone } from './Surprises';

beforeEach(() => { game.value = createInitialState(5, 0); });

describe('戳戳驚喜', () => {
  it('連續戳 8 下顯示「假裝很忙」並通知呼叫端', () => {
    const onBusy = vi.fn();
    render(<PandaTapZone onBusy={onBusy} />);
    const zone = screen.getByTestId('panda-tap-zone');
    for (let i = 0; i < 8; i++) fireEvent.pointerDown(zone, { clientX: 1, clientY: 1, pointerId: 1 });
    expect(screen.getByText(/假裝很忙/)).toBeTruthy();
    expect(onBusy).toHaveBeenCalledTimes(1);
  });
});
