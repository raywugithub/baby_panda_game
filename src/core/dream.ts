import type { GameState } from './state';
import { pendantModifiers } from './pendants';

/** 裝備月亮鈴鐺：打嗝門檻降低、日記夢話泡泡機率提高（規格 7.2）。 */
export function diaryDreamOn(s: GameState): boolean {
  return pendantModifiers(s).diaryDream;
}
