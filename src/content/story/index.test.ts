import { describe, it, expect } from 'vitest';
import { resolveScript, SCRIPTS } from './index';
import { legendScript } from './legends';

describe('resolveScript', () => {
  it('returns chapter, friend and prologue scripts by id', () => {
    expect(resolveScript('ch1', 1)?.id).toBe('ch1');
    expect(resolveScript('friend-juzi-2', 1)?.id).toBe('friend-juzi-2');
    expect(SCRIPTS.prologue).toBeDefined();
  });
  it('resolves legend ids from the save seed', () => {
    expect(resolveScript('legend-20', 42)?.id).toBe('legend-20');
    expect(resolveScript('legend-20', 42)).toEqual(legendScript(42, 20));
  });
  it('returns null for unknown ids', () => {
    expect(resolveScript('nope', 1)).toBeNull();
  });
});
