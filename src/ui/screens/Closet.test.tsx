import { it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/preact';
import { Closet } from './Closet';
import { game } from '../store';
import { createInitialState } from '../../core/state';

beforeEach(() => {
  const s = createInitialState(1, 0);
  game.value = { ...s, inventory: { ...s.inventory, 'outfit-head-bow': 1 } };
});

it('shows six slot tiles with Chinese labels', () => {
  const { getByText } = render(<Closet />);
  for (const label of ['頭飾', '臉', '衣服', '手持物', '尾巴配件', '項圈墜飾']) getByText(label);
});

it('equips an owned head item from the slot list', () => {
  const { getByText, getAllByText } = render(<Closet />);
  fireEvent.click(getByText('頭飾'));
  fireEvent.click(getByText('蝴蝶結髮圈'));
  expect(game.value.equipped.outfit.head).toBe('outfit-head-bow');
});

it('save to preset 1 then load preset 1 restores the outfit', () => {
  const { getByText } = render(<Closet />);
  fireEvent.click(getByText('頭飾'));
  fireEvent.click(getByText('蝴蝶結髮圈'));
  fireEvent.click(getByText('存到搭配 1'));
  fireEvent.click(getByText('頭飾'));
  fireEvent.click(getByText('不穿'));
  expect(game.value.equipped.outfit.head).toBeUndefined();
  fireEvent.click(getByText('搭配 1'));
  expect(game.value.equipped.outfit.head).toBe('outfit-head-bow');
});

it('spins the panda for 1.2s after a change, then returns to idle', () => {
  vi.useFakeTimers();
  const { container, getByText } = render(<Closet />);
  const pose = () => container.querySelector('svg')?.getAttribute('data-pose');
  fireEvent.click(getByText('頭飾'));
  fireEvent.click(getByText('蝴蝶結髮圈'));
  expect(pose()).toBe('spin');
  act(() => { vi.advanceTimersByTime(1199); });
  expect(pose()).toBe('spin');
  act(() => { vi.advanceTimersByTime(1); });
  expect(pose()).toBe('sit');
  vi.useRealTimers();
});
