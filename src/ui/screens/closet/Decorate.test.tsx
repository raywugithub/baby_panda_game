import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Decorate } from './Decorate';
import { game } from '../../store';
import { createInitialState } from '../../../core/state';

beforeEach(() => {
  const s = createInitialState(1, 0);
  game.value = { ...s, inventory: { ...s.inventory, 'wall-bamboo': 1, 'furn-plant-pot': 1 } };
});

it('bedroom is locked before stage 2', () => {
  const { getByText } = render(<Decorate />);
  getByText('階段 2 解鎖臥室');
});

it('choosing an owned wallpaper sets it', () => {
  const { getByText } = render(<Decorate />);
  fireEvent.click(getByText('牆紙'));
  fireEvent.click(getByText('竹影牆紙'));
  expect(game.value.rooms.living.wall).toBe('wall-bamboo');
});

it('placing an owned item puts it at the first free cell', () => {
  const { getByText } = render(<Decorate />);
  fireEvent.click(getByText('擺放'));
  fireEvent.click(getByText('小盆栽'));
  expect(game.value.rooms.living.placed.some((p) => p.itemId === 'furn-plant-pot')).toBe(true);
});
