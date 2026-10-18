import { useEffect, useState } from 'preact/hooks';
import { game, dismissOverlay, restored } from './store';
import { tab, overlay, goTab, openOverlay, TAB_ORDER } from './nav';
import { TAB_SCREENS, OVERLAY_SCREENS } from './screens/registry';
import { saveFailed, sizeWarning, storageUnavailable } from '../platform/storage';
import { RewardToast } from './components/RewardToast';
import { Onboarding } from './screens/Onboarding';
import { initialStep, hasProgress, readMoveOutDismissed, OnbStep } from './onboarding';
import { isIOS, isStandalone } from '../platform/pwa';

export function App() {
  const Screen = TAB_SCREENS[tab.value];
  // C11：引導步驟只在 App 啟動時計算一次，工作階段中不會再跳出搬家流程。
  const [onb, setOnb] = useState<OnbStep | null>(() => {
    const s = game.value;
    return initialStep({
      isIOS: isIOS(),
      standalone: isStandalone(),
      hasProgress: hasProgress(s),
      onboardingDone: s.onboardingDone,
      moveOutDismissed: readMoveOutDismissed(),
    });
  });
  const current = overlay.value;
  const pendingBeat = game.value.pendingBeat;
  const overlayOpen = current !== null;

  // 劇情播放：有待播劇情且沒有覆蓋層時開啟對話（契約 §10.8）。
  useEffect(() => {
    if (pendingBeat !== null && overlay.value === null) {
      openOverlay({ kind: 'dialogue', scriptId: pendingBeat });
    }
  }, [pendingBeat, overlayOpen]);

  const OverlayScreen = current ? OVERLAY_SCREENS[current.kind] : undefined;

  return (
    <>
      <div class="rotate-hint">把手機轉直，再來玩吧</div>
      <div class="app-shell">
        {saveFailed.value && <div class="banner" role="alert">目前無法存檔，請匯出備份</div>}
        {storageUnavailable.value && <div class="banner" role="alert">這裡無法保存進度，請匯出備份</div>}
        {sizeWarning.value && <div class="banner" role="alert">存檔變大了，建議匯出備份</div>}
        {restored.value && (
          <div class="banner" role="status">
            已從備份還原，最近的進度已找回
            <button type="button" onClick={() => { restored.value = false; }}>知道了</button>
          </div>
        )}

        <RewardToast />

        <main class="screen">
          {onb !== null ? <Onboarding step={onb} onExit={() => setOnb(null)} /> : <Screen />}
        </main>

        {current && OverlayScreen && (
          <div class="overlay">
            <button type="button" data-testid="overlay-close" aria-label="關閉" onClick={dismissOverlay}>✕</button>
            <OverlayScreen overlay={current} />
          </div>
        )}

        {onb === null && (
          <nav class="tabbar">
            {TAB_ORDER.map(({ tab: t, icon, label }) => (
              <button
                key={t}
                type="button"
                aria-label={label}
                data-testid={`tab-${t}`}
                aria-current={tab.value === t ? 'page' : undefined}
                onClick={() => goTab(t)}
              >
                <span aria-hidden="true">{icon}</span> {label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
