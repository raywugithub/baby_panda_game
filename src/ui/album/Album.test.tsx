import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Album } from './Album';
import { game } from '../store';
import { createInitialState } from '../../core/state';

beforeEach(() => {
  game.value = { ...createInitialState(1, 0), inventory: { 'furn-sofa': 1 } };
});

it('shows the six tabs in order', () => {
  const { getByText } = render(<Album />);
  for (const t of ['朋友卡', '物品圖鑑', '食譜', '地點印章', '回憶照片', '熊貓日記']) getByText(t);
});

it('owned furniture shows its name; unowned shows a hint and no name', () => {
  const { getByText, queryByText } = render(<Album />);
  fireEvent.click(getByText('物品圖鑑'));
  getByText('小沙發');
  expect(queryByText('小床')).toBeNull();
});

it('undiscovered recipes are hidden behind question marks', () => {
  const { getByText, getAllByText } = render(<Album />);
  fireEvent.click(getByText('食譜'));
  expect(getAllByText('？？？').length).toBeGreaterThan(0);
});
