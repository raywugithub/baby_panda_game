import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { Kitchen, canCook } from './Kitchen';

beforeEach(() => {
  game.value = { ...createInitialState(5, 0), inventory: { 'ing-bamboo-shoot': 1, 'ing-rice-flour': 1, 'ing-honey': 1, 'ing-mushroom': 1 } };
});

describe('canCook', () => {
  it('兩格都要選且數量足夠', () => {
    expect(canCook({ 'ing-honey': 1 }, 'ing-honey', null)).toBe(false);
    expect(canCook({ 'ing-honey': 1 }, 'ing-honey', 'ing-honey')).toBe(false);
    expect(canCook({ 'ing-honey': 2 }, 'ing-honey', 'ing-honey')).toBe(true);
    expect(canCook({ 'ing-honey': 1, 'ing-mushroom': 1 }, 'ing-honey', 'ing-mushroom')).toBe(true);
  });
});

describe('Kitchen', () => {
  it('煮出新食譜顯示發現文字並進入背包', () => {
    render(<Kitchen />);
    fireEvent.click(screen.getByRole('button', { name: '竹筍' }));
    fireEvent.click(screen.getByRole('button', { name: '米粉' }));
    fireEvent.click(screen.getByRole('button', { name: '煮一煮' }));
    expect(screen.getByText('發現新食譜：竹筍麻糬')).toBeTruthy();
    expect(game.value.inventory['recipe-bamboo-mochi']).toBe(1);
  });
  it('不在食譜內的組合顯示謎之料理', () => {
    render(<Kitchen />);
    fireEvent.click(screen.getByRole('button', { name: '米粉' }));
    fireEvent.click(screen.getByRole('button', { name: '蜂蜜' }));
    fireEvent.click(screen.getByRole('button', { name: '煮一煮' }));
    expect(screen.getByText(/謎之料理/)).toBeTruthy();
    expect(game.value.inventory['food-mystery']).toBe(1);
  });
});
