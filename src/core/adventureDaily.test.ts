import { describe, it, expect } from 'vitest';
import { adventureHandlers, leaveVisit } from './adventureDaily';
import { fresh, NOW } from './test-helpers';
import { INGREDIENT_IDS } from '../content/ingredients';

const [reset, letter, visit] = adventureHandlers;

describe('daily handlers', () => {
  it('reset clears chatsToday and revisitXpCount and drops progress', () => {
    let s = { ...fresh(), daily: { ...fresh().daily, revisitXpCount: 3 } };
    s = { ...s, friends: { ...s.friends, juzi: { points: 5, chatsToday: 3 } } };
    s = reset(s, '2026-10-19', NOW);
    expect(s.friends.juzi.chatsToday).toBe(0);
    expect(s.daily.revisitXpCount).toBe(0);
  });
  it('letter handler adds exactly one letter per day', () => {
    const s = letter(fresh(), '2026-10-19', NOW);
    expect(s.letters).toHaveLength(1);
  });
  it('letter handler does not add a second letter for the same date', () => {
    const once = letter(fresh(), '2026-10-19', NOW);
    const twice = letter(once, '2026-10-19', NOW);
    expect(twice).toBe(once);
    expect(twice.letters).toHaveLength(1);
    expect(letter(twice, '2026-10-20', NOW).letters).toHaveLength(2);
  });
  it('visit happens on about 30% of days', () => {
    let visits = 0;
    let s = fresh();
    for (let d = 0; d < 300; d++) {
      const date = `2026-${String(1 + Math.floor(d / 28)).padStart(2, '0')}-${String((d % 28) + 1).padStart(2, '0')}`;
      s = { ...s, daily: { ...s.daily, visitor: null, visitorDone: true } };
      s = visit(s, date, NOW);
      if (s.daily.visitor !== null) visits++;
    }
    expect(visits / 300).toBeGreaterThan(0.2);
    expect(visits / 300).toBeLessThan(0.4);
  });
  it('an unfinished visit is kept on the next day (no time limit)', () => {
    const s = { ...fresh(), daily: { ...fresh().daily, visitor: 'gulu' as const, visitorDone: false } };
    expect(visit(s, '2026-10-30', NOW)).toBe(s);
  });
  it('leaveVisit gives one ingredient and marks done', () => {
    const s = { ...fresh(), daily: { ...fresh().daily, visitor: 'gulu' as const, visitorDone: false } };
    const out = leaveVisit(s, NOW)!;
    expect(out.state.daily.visitorDone).toBe(true);
    const got = INGREDIENT_IDS.filter(id => (out.state.inventory[id] ?? 0) > 0);
    expect(got).toHaveLength(1);
  });
});
