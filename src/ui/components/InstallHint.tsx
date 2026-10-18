import { useState } from 'preact/hooks';
import { game, commit } from '../store';
import { openOverlay } from '../nav';
import { isStandalone } from '../../platform/pwa';
import { now } from '../../platform/clock';
import { shouldRemindBackup } from '../../platform/transfer';

/** 角落安裝提示；收合後只剩「?」按鈕，點擊可再展開（不會永久消失）。 */
export function InstallHint() {
  const collapsed = game.value.settings.installHintCollapsed;
  const [peek, setPeek] = useState(false);
  if (isStandalone()) return null;

  function setCollapsed(v: boolean) {
    const s = game.value;
    commit({ ...s, settings: { ...s.settings, installHintCollapsed: v } });
    setPeek(false);
  }

  // 規格 8.3：未加入主畫面且超過 5 天未匯出，溫和提醒備份；點擊開啟設定。
  const backupDue = shouldRemindBackup(game.value, now(), false);
  const backupBar = backupDue ? (
    <button type="button" class="backup-reminder" onClick={() => openOverlay({ kind: 'settings' })}>
      幫熊貓備份一下
    </button>
  ) : null;

  if (collapsed && !peek) {
    return (
      <>
        {backupBar}
        <button type="button" class="install-fab" aria-label="安裝提示" onClick={() => setPeek(true)}>?</button>
      </>
    );
  }
  return (
    <>
      {backupBar}
      <section class="install-hint" aria-label="安裝提示">
        <p>點瀏覽器的分享或選單，再選「加入主畫面」，就能像 App 一樣打開。</p>
        <button type="button" onClick={() => setCollapsed(true)}>收起</button>
      </section>
    </>
  );
}
