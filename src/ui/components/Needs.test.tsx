import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { game } from '../store';
import { createInitialState } from '../../core/state';
import { Needs } from './Needs';

describe('指標數字取整數', () => {
  beforeEach(() => {
    const s = createInitialState(0, 0);
    game.value = {
      ...s,
      needs: { ...s.needs, tummy: 94.998, clean: 50.4, mood: 12.5 },
      energy: 66.6,
    };
  });
  it('顯示數字為 Math.round 後的整數', () => {
    const { container } = render(<Needs />);
    const values = Array.from(container.querySelectorAll('.gauge-value')).map((el) => el.textContent);
    expect(values).toEqual(['95', '50', '13', '67']);
  });
  it('aria-valuenow 為整數', () => {
    render(<Needs />);
    const meters = screen.getAllByRole('meter');
    expect(meters.map((m) => m.getAttribute('aria-valuenow'))).toEqual(['95', '50', '13', '67']);
  });
});
