import { it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/preact';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GiftBox } from './GiftBox';
import { game } from '../store';
import { createInitialState } from '../../core/state';

beforeEach(() => {
  vi.useFakeTimers();
  game.value = createInitialState(1, 0);
});

it('shows the three rates', () => {
  const { getByText } = render(<GiftBox />);
  getByText(/普通 75%/);
  getByText(/閃亮 22%/);
  getByText(/彩虹 3%/);
});

it('a double tap opens exactly one box', () => {
  const { getByText } = render(<GiftBox />);
  const btn = getByText('今日免費禮盒');
  fireEvent.click(btn);
  fireEvent.click(btn);
  expect(game.value.daily.freeBoxUsed).toBe(true);
  expect(game.value.starSand).toBe(100);
  expect(game.value.freeBoxes).toBe(0);
});

it('copy never uses 抽卡 or 保底 in any UI source file', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
  const files = walk('src/ui').filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f));
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    expect(text.includes('抽卡'), f).toBe(false);
    expect(text.includes('保底'), f).toBe(false);
  }
});
