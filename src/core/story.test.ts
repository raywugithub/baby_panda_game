import { describe, it, expect } from 'vitest';
import { dueBeat, checkStory, ackBeat, legendCards } from './story';
import { fresh } from './test-helpers';
import type { GameState } from './state';

describe('dueBeat', () => {
  it('chapters trigger at 3, 6, 9, 12, 15 completions', () => {
    expect(dueBeat(2, [])).toBeNull();
    expect(dueBeat(3, [])).toBe('ch1');
    expect(dueBeat(6, ['ch1'])).toBe('ch2');
    expect(dueBeat(9, ['ch1', 'ch2'])).toBe('ch3');
    expect(dueBeat(12, ['ch1', 'ch2', 'ch3'])).toBe('ch4');
    expect(dueBeat(15, ['ch1', 'ch2', 'ch3', 'ch4'])).toBe('ch5');
  });
  it('legends start at 20 and every 5 completions after', () => {
    expect(dueBeat(19, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'])).toBeNull();
    expect(dueBeat(20, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'])).toBe('legend-20');
    expect(dueBeat(24, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'legend-20'])).toBeNull();
    expect(dueBeat(25, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'legend-20'])).toBe('legend-25');
  });
});

describe('checkStory', () => {
  it('sets pendingBeat once and records it in storyBeats; does not re-trigger', () => {
    let s = { ...fresh(), completedCount: 3 };
    s = checkStory(s).state;
    expect(s.pendingBeat).toBe('ch1');
    expect(s.storyBeats).toContain('ch1');
    const again = checkStory(s);
    expect(again.state).toBe(s);
  });
  it('does not overwrite a pending beat that has not been played', () => {
    let s = { ...fresh(), completedCount: 6, pendingBeat: 'ch1', storyBeats: ['ch1'] };
    expect(checkStory(s).state.pendingBeat).toBe('ch1');
  });
  it('ackBeat clears pendingBeat and then queues the next due beat', () => {
    let s: GameState = { ...fresh(), completedCount: 6, pendingBeat: 'ch1', storyBeats: ['ch1'] };
    s = ackBeat(s);
    expect(s.pendingBeat).toBe('ch2');
  });
});

describe('legendCards', () => {
  it('lists legend beats from storyBeats in order', () => {
    const s = { ...fresh(), storyBeats: ['ch1', 'legend-25', 'legend-20'] };
    expect(legendCards(s).map(c => c.n)).toEqual([20, 25]);
  });
});
