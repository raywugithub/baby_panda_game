import { describe, it, expect } from 'vitest';
import { canSavePhoto, PHOTO_CAP, stickDiary } from './album';
import { createInitialState } from './state';

describe('album rules', () => {
  it('photo cap is 200 and allows the 200th save only if under cap', () => {
    expect(PHOTO_CAP).toBe(200);
    expect(canSavePhoto(199)).toBe(true);
    expect(canSavePhoto(200)).toBe(false);
  });
  it('stickDiary sets a sticker on an existing entry', () => {
    const s0 = createInitialState(1, 0);
    const s = { ...s0, diary: [{ date: '2026-10-18', text: 'x', sticker: null }] };
    expect(stickDiary(s, '2026-10-18', 'sticker-01').diary[0].sticker).toBe('sticker-01');
  });
  it('stickDiary rejects non-sticker ids and missing dates', () => {
    const s0 = createInitialState(1, 0);
    const s = { ...s0, diary: [{ date: '2026-10-18', text: 'x', sticker: null }] };
    expect(stickDiary(s, '2026-10-18', 'outfit-head-bow')).toBe(s);
    expect(stickDiary(s, '2026-01-01', 'sticker-01')).toBe(s);
  });
});
