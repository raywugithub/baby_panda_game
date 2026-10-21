import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FriendCardsTab } from './FriendCardsTab';
import { game } from '../store';
import { fresh } from '../../core/test-helpers';
import * as nav from '../nav';

describe('FriendCardsTab', () => {
  beforeEach(() => { game.value = fresh(); });
  it('shows level and progress for each friend', () => {
    game.value = { ...game.value, friends: { ...game.value.friends, juzi: { points: 30, chatsToday: 0 } } };
    const { getByTestId } = render(<FriendCardsTab />);
    expect(getByTestId('friend-juzi').textContent).toContain('Lv 2');
    const bar = getByTestId('friend-juzi-progress') as HTMLElement;
    expect(bar.style.width).toBe('25%'); // (30-20)/(60-20)
  });
  it('unlocked segment opens dialogue and marks it seen', () => {
    const open = vi.spyOn(nav, 'openOverlay');
    game.value = { ...game.value, friends: { ...game.value.friends, mianhua: { points: 0, chatsToday: 0 } } };
    const { getByTestId } = render(<FriendCardsTab />);
    fireEvent.click(getByTestId('story-mianhua-1'));
    expect(open).toHaveBeenCalledWith({ kind: 'dialogue', scriptId: 'friend-mianhua-1' });
    expect(game.value.storyBeats).toContain('friend-mianhua-1');
  });
  it('locked segment is not clickable', () => {
    const { getByTestId } = render(<FriendCardsTab />);
    expect((getByTestId('story-mianhua-2') as HTMLButtonElement).disabled).toBe(true);
  });
});
