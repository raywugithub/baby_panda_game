import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { createInitialState } from '../../../core/state';
import { game } from '../../store';
import { FeedTray } from './FeedTray';
import { HugButton } from './HugButton';

beforeEach(() => {
  game.value = { ...createInitialState(5, 0), needs: { tummy: 70, clean: 70, mood: 70 }, energy: 100 };
});

describe('餵食拖曳', () => {
  it('把竹筍糕拖到嘴巴附近放開，肚子 +25', () => {
    render(<FeedTray mouth={{ x: 100, y: 100 }} />);
    const food = screen.getByRole('button', { name: '竹筍糕 ×3' });
    fireEvent.pointerDown(food, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(food, { clientX: 102, clientY: 98, pointerId: 1 });
    expect(game.value.needs.tummy).toBe(95);
    expect(game.value.inventory['food-bamboo-cake']).toBe(2);
  });
  it('放在嘴巴以外不餵食', () => {
    render(<FeedTray mouth={{ x: 100, y: 100 }} />);
    const food = screen.getByRole('button', { name: '竹筍糕 ×3' });
    fireEvent.pointerDown(food, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(food, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(game.value.inventory['food-bamboo-cake']).toBe(3);
  });
});

describe('抱抱', () => {
  it('每次點擊前把心情歸零；前 5 次有效（心情 +25），第 6 次因每小時上限無效', () => {
    render(<HugButton />);
    const hand = screen.getByTestId('care-hug');
    for (let i = 0; i < 6; i++) {
      game.value = { ...game.value, needs: { ...game.value.needs, mood: 0 } };
      fireEvent.click(hand);
    }
    expect(game.value.hugLog).toHaveLength(5);
    expect(game.value.needs.mood).toBe(0);
  });
});

vi.mock('../../../platform/particles', () => ({ burst: vi.fn() }));
import { burst } from '../../../platform/particles';
import { BathArea } from './BathArea';

describe('洗澡水滴', () => {
  it('塗抹時以 water 粒子呼叫 burst', () => {
    render(<BathArea />);
    const area = screen.getByTestId('bath-area');
    // C14：測試環境沒有版面，手動給容器一個非零的矩形。
    vi.spyOn(area, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 256, bottom: 256, width: 256, height: 256, x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect);
    fireEvent.pointerDown(area, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(area, { clientX: 40, clientY: 40, pointerId: 1 });
    expect(burst).toHaveBeenCalledWith('water', expect.any(Number), expect.any(Number), 2);
  });
});
