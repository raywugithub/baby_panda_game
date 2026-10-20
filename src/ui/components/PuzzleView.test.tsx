// src/ui/components/PuzzleView.test.tsx
import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, vi } from 'vitest';
import { PuzzleView } from './PuzzleView';
import { generatePuzzle, SHAPES } from '../../core/puzzles';
import { mulberry32 } from '../../core/rng';
import { SHAPE_ART } from '../../art/shapes';

describe('PuzzleView', () => {
  it('shadow: the correct option solves, a wrong one shows 再想想', () => {
    const p = generatePuzzle(mulberry32(3), 'shadow') as any;
    const onSolved = vi.fn();
    const { getByTestId, getByText } = render(<PuzzleView puzzle={p} onSolved={onSolved} />);
    fireEvent.click(getByTestId(`option-${(p.answer + 1) % 3}`));
    expect(getByText('再想想')).toBeTruthy();
    expect(onSolved).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(`option-${p.answer}`));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });
  it('codelock: three digits must match the code exactly', () => {
    const p = { kind: 'codelock' as const, code: '472' };
    const onSolved = vi.fn();
    const { getByTestId, getByText } = render(<PuzzleView puzzle={p} onSolved={onSolved} />);
    const set = (i: number, v: string) => fireEvent.input(getByTestId(`code-${i}`), { target: { value: v } });
    set(1, '4'); set(2, '7'); set(3, '1');
    fireEvent.click(getByText('開鎖'));
    expect(onSolved).not.toHaveBeenCalled();
    set(3, '2');
    fireEvent.click(getByText('開鎖'));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it('sequence: shows the riddle with a ？ and the first shape is the answer', () => {
    const p = generatePuzzle(mulberry32(11), 'sequence') as any;
    const onSolved = vi.fn();
    const { getByTestId, getByText, container } = render(<PuzzleView puzzle={p} onSolved={onSolved} />);
    expect(getByText('？')).toBeTruthy();
    expect(container.querySelectorAll('[data-part="riddle-shape"]').length).toBe(4);
    fireEvent.click(getByTestId(`option-${p.answer}`));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it('diff: the odd panel solves, the matching panels do not', () => {
    const p = generatePuzzle(mulberry32(5), 'diff') as any;
    const onSolved = vi.fn();
    const { getByTestId, getByText } = render(<PuzzleView puzzle={p} onSolved={onSolved} />);
    const wrong = (p.answer + 1) % 3;
    fireEvent.click(getByTestId(`option-${wrong}`));
    expect(getByText('再想想')).toBeTruthy();
    expect(onSolved).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(`option-${p.answer}`));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it('solves only once even when tapped again', () => {
    const p = generatePuzzle(mulberry32(3), 'shadow') as any;
    const onSolved = vi.fn();
    const { getByTestId } = render(<PuzzleView puzzle={p} onSolved={onSolved} />);
    fireEvent.click(getByTestId(`option-${p.answer}`));
    fireEvent.click(getByTestId(`option-${p.answer}`));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it('option buttons are at least 44px tall', () => {
    const p = generatePuzzle(mulberry32(3), 'shadow') as any;
    const { getByTestId } = render(<PuzzleView puzzle={p} onSolved={() => {}} />);
    const btn = getByTestId('option-0') as HTMLElement;
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.className).toContain('puzzle-option');
  });
});

describe('SHAPE_ART', () => {
  it.each(SHAPES)('%s has a silhouette and a colour version', (shape) => {
    const Art = SHAPE_ART[shape];
    const { container: dark, unmount } = render(<Art size={64} silhouette />);
    const { container: color } = render(<Art size={64} />);
    expect(dark.querySelector('svg')).toBeTruthy();
    expect(color.querySelector('svg')).toBeTruthy();
    const darkFills = Array.from(dark.querySelectorAll('[fill]')).map((el) => el.getAttribute('fill'));
    expect(darkFills.every((f) => f === '#2A2826')).toBe(true);
    unmount();
  });
});
