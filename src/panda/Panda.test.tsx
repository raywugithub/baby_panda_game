import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { Panda } from './Panda';
import { ALL_POSES, POSE_TABLE } from './poses';

describe('熊貓姿勢', () => {
  it('共 29 個姿勢，都在姿勢表內', () => {
    expect(ALL_POSES).toHaveLength(29);
    expect(Object.keys(POSE_TABLE).sort()).toEqual([...ALL_POSES].sort());
  });
  it('每個姿勢的規格彼此不同（不會有兩個姿勢長得一樣）', () => {
    const specs = ALL_POSES.map(p => JSON.stringify(POSE_TABLE[p]));
    expect(new Set(specs).size).toBe(ALL_POSES.length);
  });
  it.each(ALL_POSES)('姿勢 %s 可以渲染並標示 data-pose', (pose) => {
    const { container } = render(<Panda pose={pose} stage={1} outfit={{}} pendants={[]} chainLinks={0} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('data-pose')).toBe(pose);
    expect(container.querySelectorAll('[data-part]').length).toBeGreaterThanOrEqual(14);
    expect(container.querySelector('[data-testid="panda-body"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="panda-mouth"]')).not.toBeNull();
  });
  it('招牌姿勢 armsOut 手臂向前伸、sleep 顯示睡帽', () => {
    const a = render(<Panda pose="armsOut" stage={1} outfit={{}} pendants={[]} chainLinks={0} />);
    const armLTransform = a.container.querySelector('[data-part="armL"]')!.getAttribute('transform');
    const armRTransform = a.container.querySelector('[data-part="armR"]')!.getAttribute('transform');
    expect(armLTransform).toContain('rotate(-75');
    expect(armRTransform).toContain('rotate(75');
    const b = render(<Panda pose="sleep" stage={1} outfit={{}} pendants={[]} chainLinks={0} />);
    expect(b.container.querySelector('[data-part="nightcap"]')).not.toBeNull();
  });
});
