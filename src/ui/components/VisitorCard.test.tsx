import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, beforeEach } from 'vitest';
import { VisitorCard } from './VisitorCard';
import { game } from '../store';
import { fresh } from '../../core/test-helpers';

describe('VisitorCard', () => {
  beforeEach(() => {
    game.value = { ...fresh(), daily: { ...fresh().daily, visitor: 'manman', visitorDone: false } };
  });

  it('shows the visitor and ends the visit on 送客', () => {
    const { getByText, queryByText } = render(<VisitorCard />);
    expect(getByText(/慢慢/)).toBeTruthy();
    fireEvent.click(getByText('送客'));
    expect(game.value.daily.visitorDone).toBe(true);
    expect(queryByText('送客')).toBeNull();
  });

  it('renders nothing when there is no visit', () => {
    game.value = { ...game.value, daily: { ...game.value.daily, visitor: null, visitorDone: true } };
    const { container } = render(<VisitorCard />);
    expect(container.textContent).toBe('');
  });
});
