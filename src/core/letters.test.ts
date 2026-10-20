import { describe, it, expect } from 'vitest';
import { letterForDay, addLetter, markLetterRead } from './letters';
import { FRIEND_LETTERS } from '../content/friendLetters';
import { fresh } from './test-helpers';

describe('letter content', () => {
  it('has 12 letters, three per friend', () => {
    expect(FRIEND_LETTERS).toHaveLength(12);
    for (const id of ['mianhua', 'juzi', 'manman', 'gulu'] as const) {
      expect(FRIEND_LETTERS.filter(l => l.friendId === id)).toHaveLength(3);
    }
  });
});

describe('letters', () => {
  it('letterForDay is deterministic and unread', () => {
    const a = letterForDay(5, '2026-10-18');
    expect(a).toEqual(letterForDay(5, '2026-10-18'));
    expect(a.read).toBe(false);
    expect(a.id).toBe('letter-2026-10-18');
  });
  it('addLetter never trims: 31 adds keep 31 letters in state', () => {
    let s = fresh();
    for (let i = 0; i < 31; i++) {
      s = addLetter(s, { id: `l${i}`, date: '2026-10-18', from: 'juzi', text: 't', read: false });
    }
    expect(s.letters).toHaveLength(31);
    expect(s.letters[0].id).toBe('l30');
  });
  it('letters do not expire by date', () => {
    const s = addLetter(fresh(), { id: 'old', date: '2020-01-01', from: 'gulu', text: 't', read: false });
    expect(s.letters.map(l => l.id)).toContain('old');
  });
  it('markLetterRead flips only the given letter', () => {
    let s = addLetter(fresh(), { id: 'a', date: 'd', from: 'gulu', text: 't', read: false });
    s = markLetterRead(s, 'a');
    expect(s.letters[0].read).toBe(true);
  });
});
