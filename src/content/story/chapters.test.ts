import { describe, it, expect } from 'vitest';
import { COLLAR_CLUES, CHAPTER_SCRIPTS } from './chapters';
import { TERRAINS, LANDMARKS } from '../locations';
import { HANDMADE } from '../locations/handmade';

const SPEAKERS = ['panda', 'narrator', 'mianhua', 'juzi', 'manman', 'gulu', 'passerby'];

describe('chapter scripts', () => {
  it('has five chapters and five collar clues with unique ids', () => {
    expect(Object.keys(CHAPTER_SCRIPTS).sort()).toEqual(['ch1', 'ch2', 'ch3', 'ch4', 'ch5']);
    expect(new Set(COLLAR_CLUES.map(c => c.id)).size).toBe(5);
  });
  it('each chapter has 8 to 10 lines, valid speakers and an illustration', () => {
    for (const [key, script] of Object.entries(CHAPTER_SCRIPTS)) {
      expect(script.id).toBe(key);
      expect(script.lines.length).toBeGreaterThanOrEqual(8);
      expect(script.lines.length).toBeLessThanOrEqual(10);
      expect(script.illustration).toBeTruthy();
      for (const l of script.lines) expect(SPEAKERS).toContain(l.speaker);
    }
  });
  it('each chapter mentions its own collar clue in the last three lines', () => {
    COLLAR_CLUES.forEach((clue, i) => {
      const script = CHAPTER_SCRIPTS[`ch${i + 1}` as keyof typeof CHAPTER_SCRIPTS];
      const tail = script.lines.slice(-3).map(l => l.text).join('\n');
      expect(tail).toContain(clue.name);
    });
  });
  it('each chapter mentions its clue exactly once overall', () => {
    COLLAR_CLUES.forEach((clue, i) => {
      const script = CHAPTER_SCRIPTS[`ch${i + 1}` as keyof typeof CHAPTER_SCRIPTS];
      const all = script.lines.map(l => l.text).join('\n');
      expect(all.split(clue.name).length - 1).toBe(1);
    });
  });
  it('every illustration key is a handmade id or a valid terrain/landmark pair', () => {
    const terrains = TERRAINS.map(t => t.id as string);
    const landmarks = LANDMARKS.map(l => l.id);
    const handmade = Object.keys(HANDMADE);
    for (const script of Object.values(CHAPTER_SCRIPTS)) {
      const key = script.illustration!;
      if (handmade.includes(key)) continue;
      const [terrain, landmark, ...rest] = key.split('/');
      expect(rest.length).toBe(0);
      expect(terrains).toContain(terrain);
      expect(landmarks).toContain(landmark);
    }
  });
});
