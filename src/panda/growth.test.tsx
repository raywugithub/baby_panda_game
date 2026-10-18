import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { Panda } from './Panda';

const P = (over: Partial<Parameters<typeof Panda>[0]> = {}) =>
  render(<Panda pose="sit" stage={1} outfit={{}} pendants={[]} chainLinks={0} {...over} />);

describe('成長外觀', () => {
  it('階段 1–4 身形縮放 0.80/0.90/1.00/1.05，之後固定', () => {
    const scaleOf = (st: number) => P({ stage: st }).container.querySelector('[data-part="root"]')!.getAttribute('transform');
    expect(scaleOf(1)).toContain('scale(0.8)');
    expect(scaleOf(2)).toContain('scale(0.9)');
    expect(scaleOf(3)).toContain('scale(1)');
    expect(scaleOf(4)).toContain('scale(1.05)');
    expect(scaleOf(9)).toContain('scale(1.05)');
  });
  it('光環星點數：階段 4 無光環，5 為 6 點，10 為 8 點，20 為 12 點', () => {
    expect(P({ stage: 4 }).container.querySelector('[data-part="halo"]')).toBeNull();
    const stars = (st: number) => P({ stage: st }).container.querySelectorAll('[data-part="halo"] [data-star]').length;
    expect(stars(5)).toBe(6);
    expect(stars(10)).toBe(8);
    expect(stars(20)).toBe(12);
  });
});

describe('項圈鏈', () => {
  it('最多畫 24 環，超過以 ×N 表示', () => {
    expect(P({ chainLinks: 0 }).container.querySelectorAll('[data-part="link"]').length).toBe(0);
    expect(P({ chainLinks: 24 }).container.querySelectorAll('[data-part="link"]').length).toBe(24);
    const over = P({ chainLinks: 25 });
    expect(over.container.querySelectorAll('[data-part="link"]').length).toBe(24);
    expect(over.container.querySelector('[data-part="link-count"]')!.textContent).toBe('×25');
    expect(P({ chainLinks: 24 }).container.querySelector('[data-part="link-count"]')).toBeNull();
  });
});

describe('墜飾與衣物圖層', () => {
  it('已裝備的墜飾渲染在 pendant 錨點', () => {
    const { container } = P({ pendants: ['pendant-bamboo'] });
    expect(container.querySelector('[data-part="pendant-pendant-bamboo"]')).not.toBeNull();
  });
  it('沒有圖的衣物 id 不會崩潰也不渲染', () => {
    const { container } = P({ outfit: { head: 'outfit-unknown' } });
    expect(container.querySelector('[data-part="outfit-head"]')).toBeNull();
  });
});
