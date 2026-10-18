import { useEffect, useRef, useState } from 'preact/hooks';
import { game, commit } from '../store';
import { goTab } from '../nav';
import { encodeSaveCode } from '../../core/save';
import type { GameState } from '../../core/state';
import { currentStage } from '../../core/growth';
import { Panda } from '../../panda/Panda';
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

/** 紙箱：真的熊貓頭從箱口探出來；點擊即可打開。 */
function BoxPeek({ onOpen }: { onOpen: () => void }) {
  const s = game.value;
  return (
    <button type="button" class="box-peek" data-testid="box-peek" onClick={onOpen}>
      <div class="box-scene">
        <svg class="box-back" viewBox="0 0 300 260" aria-hidden="true">
          <ellipse cx="150" cy="128" rx="128" ry="22" fill="#6b4420" />
          <path d="M22 128 L8 48 L72 92 Z" fill="#e8bd86" stroke="#8a5a2b" stroke-width="4" stroke-linejoin="round" />
          <path d="M278 128 L292 48 L228 92 Z" fill="#e8bd86" stroke="#8a5a2b" stroke-width="4" stroke-linejoin="round" />
        </svg>
        <div class="box-panda">
          <Panda
            pose="boxPeek"
            stage={currentStage(s)}
            outfit={s.equipped.outfit}
            pendants={s.equipped.pendants}
            chainLinks={s.chainLinks}
            size={180}
          />
        </div>
        <svg class="box-front" viewBox="0 0 300 260" aria-hidden="true">
          <rect x="18" y="128" width="264" height="124" rx="6" fill="#d9a86c" stroke="#8a5a2b" stroke-width="4" />
          <rect x="18" y="128" width="264" height="18" fill="#c8925a" stroke="#8a5a2b" stroke-width="4" />
          <rect x="128" y="146" width="44" height="30" rx="4" fill="#f3dca8" stroke="#8a5a2b" stroke-width="3" />
          <path d="M18 176 H282" stroke="#8a5a2b" stroke-width="3" stroke-dasharray="8 6" opacity="0.5" />
        </svg>
      </div>
      <span class="box-prompt">點紙箱打開它</span>
    </button>
  );
}

/** 首次啟動引導：安裝、搬家、紙箱、序章、抱抱與餵食教學（規格 8.3、3.4）。 */
export function Onboarding({ step: initial, onExit }: OnboardingProps) {
  const [step, setStep] = useState<OnbStep>(initial);
  const hugLen = game.value.hugLog.length;
  const feedLen = game.value.feedLog.length;
  const hugBase = useRef(0);
  const feedBase = useRef(0);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');

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

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(encodeSaveCode(game.value));
      setCopyState('ok');
    } catch {
      // 剪貼簿不可用或被拒絕：提示改從設定頁匯出，不影響進度。
      setCopyState('fail');
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
          <div class="onb-card">
            <h2 class="onb-title">把熊貓帶回家</h2>
            <InstallGuide onPlayHere={() => setStep(nextStep('install'))} />
          </div>
        </section>
      );
    case 'moveOut':
      return (
        <section class="onboarding">
          <div class="onb-card">
            <h2 class="onb-title">把熊貓搬到主畫面</h2>
            <ol class="step-list">
              <li class="step-item">
                <span class="step-badge" aria-hidden="true">1</span>
                <span class="step-text">點「複製存檔碼」</span>
              </li>
              <li class="step-item">
                <span class="step-badge" aria-hidden="true">2</span>
                <span class="step-text">加入主畫面（分享 →「加入主畫面」）</span>
              </li>
              <li class="step-item">
                <span class="step-badge" aria-hidden="true">3</span>
                <span class="step-text">在主畫面的熊貓裡貼上存檔碼</span>
              </li>
            </ol>
            <div class="onb-actions">
              <button type="button" class="btn-primary" onClick={copyCode}>複製存檔碼</button>
              {copyState === 'ok' ? <p class="onb-note" role="status">已複製！</p> : null}
              {copyState === 'fail' ? (
                <p class="onb-note onb-error" role="alert">複製失敗了，請到設定頁匯出存檔碼</p>
              ) : null}
              <button type="button" class="btn-secondary" onClick={notMoving}>先不用</button>
            </div>
          </div>
        </section>
      );
    case 'moveIn':
      return (
        <section class="onboarding">
          <div class="onb-card">
            <h2 class="onb-title">歡迎回來</h2>
            <MoveIn onImported={imported} onNewGame={() => setStep(nextStep('moveIn'))} />
          </div>
        </section>
      );
    case 'boxPeek':
      return (
        <section class="onboarding onboarding-box">
          <BoxPeek onOpen={() => setStep(nextStep('boxPeek'))} />
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
