// src/ui/screens/giftbox/Shop.test.tsx
import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Shop } from './Shop';
import { game } from '../../store';
import { createInitialState } from '../../../core/state';

beforeEach(() => {
  game.value = { ...createInitialState(1, 0), marshmallow: 25 };
});

it('buys a common item for 20 marshmallow', () => {
  const { getAllByText } = render(<Shop />);
  fireEvent.click(getAllByText('20 🍡')[0]);
  expect(game.value.marshmallow).toBe(5);
});

it('shows the three rarity sections and no timer text', () => {
  const { getByText, queryByText } = render(<Shop />);
  getByText('普通'); getByText('閃亮'); getByText('彩虹');
  expect(queryByText(/限時|剩餘/)).toBeNull();
});
