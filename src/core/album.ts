import type { GameState } from './state';

/** 回憶照片上限（只計非傳說卡照片，契約 §10.9）。 */
export const PHOTO_CAP = 200;

/** 目前照片數是否還能再存一張。 */
export function canSavePhoto(count: number): boolean {
  return count < PHOTO_CAP;
}

/** 在指定日期的日記貼上貼紙；貼紙 id 必須以 `sticker-` 開頭，找不到日記則原樣回傳。 */
export function stickDiary(s: GameState, date: string, stickerId: string | null): GameState {
  if (stickerId !== null && !stickerId.startsWith('sticker-')) return s;
  if (!s.diary.some(e => e.date === date)) return s;
  return {
    ...s,
    diary: s.diary.map(e => (e.date === date ? { ...e, sticker: stickerId } : e)),
  };
}
