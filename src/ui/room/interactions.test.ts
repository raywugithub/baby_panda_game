import { it, expect } from 'vitest';
import { interactionPose } from './interactions';
it('maps interactions to Panda poses', () => {
  expect(interactionPose('sit')).toBe('useSit');
  expect(interactionPose('sleep')).toBe('useSleep');
  expect(interactionPose('swing')).toBe('useSwing');
  expect(interactionPose('read')).toBe('useRead');
});
