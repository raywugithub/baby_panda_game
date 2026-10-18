import type { GameState } from '../core/state';

export type OnbStep = 'install' | 'moveOut' | 'moveIn' | 'boxPeek' | 'prologue' | 'tutorialHug' | 'tutorialFeed' | 'done';

export interface OnbCtx {
  isIOS: boolean;
  standalone: boolean;
  hasProgress: boolean;
  onboardingDone: boolean;
  moveOutDismissed: boolean;
}

/** C16：「先不用」的關閉旗標存在 localStorage，不寫入 GameState。 */
export const MOVE_OUT_KEY = 'panda.moveOutDismissed';

export function readMoveOutDismissed(): boolean {
  try {
    return localStorage.getItem(MOVE_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissMoveOut(): void {
  try {
    localStorage.setItem(MOVE_OUT_KEY, '1');
  } catch {
    // 無法寫入時只是下次還會看到，不影響遊戲。
  }
}

export function hasProgress(s: GameState): boolean {
  return s.growthXp > 0 || s.completedCount > 0 || s.diary.length > 0 || s.chainLinks > 0;
}

/** 只在 App 啟動時呼叫一次（C11）；回傳 null 代表不顯示引導。 */
export function initialStep(c: OnbCtx): OnbStep | null {
  if (c.isIOS && !c.standalone && c.hasProgress && !c.moveOutDismissed) return 'moveOut';
  if (c.onboardingDone || c.hasProgress) return null;
  if (!c.standalone && c.isIOS) return 'install';
  if (c.standalone) return 'moveIn';
  return 'boxPeek';
}

export function nextStep(step: OnbStep): OnbStep {
  switch (step) {
    case 'install':
    case 'moveIn':
      return 'boxPeek';
    case 'boxPeek':
      return 'prologue';
    case 'prologue':
      return 'tutorialHug';
    case 'tutorialHug':
      return 'tutorialFeed';
    case 'moveOut':
      return 'boxPeek';
    case 'tutorialFeed':
    case 'done':
      return 'done';
  }
}
