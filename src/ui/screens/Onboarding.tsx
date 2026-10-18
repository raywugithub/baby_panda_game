import { useEffect, useRef, useState } from 'preact/hooks';
import { game, commit } from '../store';
import { goTab } from '../nav';
import { encodeSaveCode } from '../../core/save';
import type { GameState } from '../../core/state';
import { Dialogue } from '../components/Dialogue';
import { InstallGuide } from '../components/InstallGuide';
import { MoveIn } from '../components/MoveIn';
import { Home } from './Home';
import { OnbStep, nextStep, dismissMoveOut } from '../onboarding';

export interface OnboardingProps {
  step: OnbStep;
  /** 引導結束或「先不用」時由 App 卸載引導畫面。 */
  onExit?: () => void;
}

const HUG_HINT = '點她伸出的雙手抱抱她';
const FEED_HINT = '把竹筍糕拖到她嘴邊';

/** 首次啟動引導：安裝、搬家、紙箱、序章、抱抱與餵食教學（規格 8.3、3.4）。 */
export function Onboarding({ step: initial, onExit }: OnboardingProps) {
  const [step, setStep] = useState<OnbStep>(initial);
  const hugLen = game.value.hugLog.length;
  const feedLen = game.value.feedLog.length;
  const hugBase = useRef(0);
  const feedBase = useRef(0);

  // 進入教學步驟時記下目前的次數，之後只看新增的抱抱／餵食。
  useEffect(() => {
    if (step === 'tutorialHug') hugBase.current = game.value.hugLog.length;
    if (step === 'tutorialFeed') feedBase.current = game.value.feedLog.length;
  }, [step]);

  useEffect(() => {
    if (step === 'tutorialHug' && hugLen > hugBase.current) setStep(nextStep('tutorialHug'));
    if (step === 'tutorialFeed' && feedLen > feedBase.current) setStep(nextStep('tutorialFeed'));
  }, [step, hugLen, feedLen]);

  // 完成：寫入 onboardingDone 並前往地圖分頁（規格 3.4）。
  useEffect(() => {
    if (step !== 'done') return;
    commit({ ...game.value, onboardingDone: true });
    goTab('map');
    onExit?.();
  }, [step]);

  function copyCode() {
    try {
      void navigator.clipboard?.writeText(encodeSaveCode(game.value)).catch(() => {});
    } catch {
      // 剪貼簿不可用時靜默略過；存檔碼仍可從設定頁匯出。
    }
  }

  function notMoving() {
    dismissMoveOut();
    onExit?.();
  }

  function imported(s: GameState) {
    commit({ ...s, onboardingDone: true });
    setStep('done');
  }

  switch (step) {
    case 'install':
      return (
        <section class="onboarding">
          <h2>把熊貓帶回家</h2>
          <InstallGuide onPlayHere={() => setStep(nextStep('install'))} />
        </section>
      );
    case 'moveOut':
      return (
        <section class="onboarding">
          <h2>把熊貓搬到主畫面</h2>
          <ol>
            <li>點「複製存檔碼」</li>
            <li>加入主畫面（分享 →「加入主畫面」）</li>
            <li>在主畫面的熊貓裡貼上存檔碼</li>
          </ol>
          <div class="onboarding-actions">
            <button type="button" onClick={copyCode}>複製存檔碼</button>
            <button type="button" onClick={notMoving}>先不用</button>
          </div>
        </section>
      );
    case 'moveIn':
      return (
        <section class="onboarding">
          <h2>歡迎回來</h2>
          <MoveIn onImported={imported} onNewGame={() => setStep(nextStep('moveIn'))} />
        </section>
      );
    case 'boxPeek':
      return (
        <section class="onboarding">
          <button type="button" data-testid="box-peek" aria-label="打開紙箱" onClick={() => setStep(nextStep('boxPeek'))}>
            <svg viewBox="0 0 200 200" width="200" height="200" aria-hidden="true">
              <rect x="30" y="90" width="140" height="90" fill="#d9a86c" stroke="#8a5a2b" stroke-width="4" />
              <path d="M30 90 L100 60 L170 90 Z" fill="#e8bd86" stroke="#8a5a2b" stroke-width="4" />
              <circle cx="100" cy="88" r="28" fill="#fff" stroke="#333" stroke-width="3" />
              <circle cx="90" cy="84" r="5" fill="#333" />
              <circle cx="110" cy="84" r="5" fill="#333" />
            </svg>
            <span>點紙箱打開它</span>
          </button>
        </section>
      );
    case 'prologue':
      return <Dialogue scriptId="prologue" onDone={() => setStep(nextStep('prologue'))} />;
    case 'tutorialHug':
      return <Home tutorialHint={HUG_HINT} />;
    case 'tutorialFeed':
      return <Home tutorialHint={FEED_HINT} />;
    case 'done':
      return null;
  }
}
