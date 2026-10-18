// src/art/items/starter-art.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { ITEM_ART } from './index';
import { PAL } from './primitives';

// 新玩家一開始就擁有的物品，圖樣必須不依賴 CSS 變數，也不能有預設黑色填色。
const STARTER = ['furn-nest', 'furn-cushion', 'furn-low-table', 'pendant-bamboo'];

describe.each(STARTER)('starter art %s', (id) => {
  it('uses literal colours and explicit fills (no CSS variables, no default black)', () => {
    const C = ITEM_ART[id];
    const { container, unmount } = render(<C size={64} />);
    const shapes = Array.from(container.querySelectorAll('ellipse, rect, circle, path'));
    const paints = Array.from(container.querySelectorAll('[fill], [stroke]'))
      .flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')])
      .filter((v): v is string => !!v && v !== 'none');
    unmount();

    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      expect(shape.hasAttribute('fill'), shape.outerHTML).toBe(true);
    }
    expect(paints.filter((v) => v.includes('var(')), id).toEqual([]);
    expect(paints.filter((v) => ['#000', '#000000', 'black'].includes(v.toLowerCase())), id).toEqual([]);
  });
});

describe('pendant-bamboo charm', () => {
  it('hangs green bamboo leaves from a gold ring', () => {
    const Pendant = ITEM_ART['pendant-bamboo'];
    const { container, unmount } = render(<Pendant size={64} />);
    const colours = Array.from(container.querySelectorAll('[fill], [stroke]'))
      .flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]);
    unmount();
    expect(colours).toContain(PAL.gold);
    expect(colours.some((c) => c === PAL.bamboo || c === PAL.bambooDark)).toBe(true);
  });
});
