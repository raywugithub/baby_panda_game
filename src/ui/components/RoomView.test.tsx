import { it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { RoomView } from './RoomView';
import { createInitialState } from '../../core/state';

it('renders each placed item in a group with its uid, sorted back to front', () => {
  const s = createInitialState(1, 0);
  const room = { ...s.rooms.living, placed: [
    { uid: 'furn-bed#1', itemId: 'furn-bed', layer: 'floor' as const, x: 0, y: 4, flipped: false },
    { uid: 'furn-plant-pot#1', itemId: 'furn-plant-pot', layer: 'floor' as const, x: 0, y: 0, flipped: false },
  ] };
  const { container } = render(<RoomView room={room} />);
  const uids = [...container.querySelectorAll('[data-uid]')].map((el) => el.getAttribute('data-uid'));
  expect(uids).toEqual(['furn-plant-pot#1', 'furn-bed#1']);
  expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 400 320');
  expect(container.querySelector('[data-testid="placed-furn-plant-pot#1"]')).not.toBeNull();
  expect(container.querySelectorAll('[data-testid^="room-cell-"]').length).toBe(48);
});

/** 物品美術的實際寬度（ItemSvg 的 width 屬性）。 */
function artWidth(container: Element, uid: string): number {
  const svg = container.querySelector(`[data-testid="placed-${uid}"] svg`);
  return Number(svg!.getAttribute('width'));
}

it('draws a 2×1 item about twice as wide as a 1×1 item in the same row', () => {
  const s = createInitialState(1, 0);
  const room = { ...s.rooms.living, placed: [
    { uid: 'furn-rug#1', itemId: 'furn-rug', layer: 'floor' as const, x: 0, y: 2, flipped: false },
    { uid: 'furn-plant-pot#1', itemId: 'furn-plant-pot', layer: 'floor' as const, x: 4, y: 2, flipped: false },
  ] };
  const { container } = render(<RoomView room={room} />);
  const ratio = artWidth(container, 'furn-rug#1') / artWidth(container, 'furn-plant-pot#1');
  expect(ratio).toBeGreaterThan(1.8);
  expect(ratio).toBeLessThan(2.2);
});

it('draws items in the front row larger than the same item in the back row (1.00 / 0.80)', () => {
  const s = createInitialState(1, 0);
  const room = { ...s.rooms.living, placed: [
    { uid: 'furn-plant-pot#back', itemId: 'furn-plant-pot', layer: 'floor' as const, x: 0, y: 0, flipped: false },
    { uid: 'furn-plant-pot#front', itemId: 'furn-plant-pot', layer: 'floor' as const, x: 0, y: 5, flipped: false },
  ] };
  const { container } = render(<RoomView room={room} />);
  const ratio = artWidth(container, 'furn-plant-pot#front') / artWidth(container, 'furn-plant-pot#back');
  expect(ratio).toBeGreaterThan(1.20);
  expect(ratio).toBeLessThan(1.30);
});

it('keeps the bottom of a floor item on the bottom edge of its footprint', () => {
  const s = createInitialState(1, 0);
  const room = { ...s.rooms.living, placed: [
    { uid: 'furn-rug#1', itemId: 'furn-rug', layer: 'floor' as const, x: 0, y: 2, flipped: false },
  ] };
  const { container } = render(<RoomView room={room} />);
  const svg = container.querySelector('[data-testid="placed-furn-rug#1"] svg')!;
  // 內層群組把物品中心放在 (寬/2, 高 − 美術邊長/2)，底邊應落在足跡高 40 的底緣。
  const [, , ty] = svg.parentElement!.getAttribute('transform')!.match(/translate\(([-\d.]+) ([-\d.]+)\)/)!;
  const bottom = Number(ty) + Number(svg.getAttribute('y')) + Number(svg.getAttribute('height'));
  expect(bottom).toBeCloseTo(40, 5);
});

it('with depthRow, items in rows behind the character sit under it and front-row items sit over it', () => {
  const s = createInitialState(1, 0);
  const room = { ...s.rooms.living, placed: [
    { uid: 'furn-plant-pot#back', itemId: 'furn-plant-pot', layer: 'floor' as const, x: 0, y: 1, flipped: false },
    { uid: 'furn-plant-pot#front', itemId: 'furn-plant-pot', layer: 'floor' as const, x: 0, y: 5, flipped: false },
  ] };
  const { container } = render(<RoomView room={room} depthRow={4}><div data-testid="kid" /></RoomView>);
  const kid = container.querySelector('[data-testid="kid"]')!;
  const back = container.querySelector('[data-uid="furn-plant-pot#back"]')!;
  const front = container.querySelector('[data-uid="furn-plant-pot#front"]')!;
  expect(back.compareDocumentPosition(kid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(kid.compareDocumentPosition(front) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
