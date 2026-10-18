import { useState } from 'preact/hooks';
import { game, commit } from '../store';
import { isStandalone } from '../../platform/pwa';

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

  if (collapsed && !peek) {
    return <button type="button" class="install-fab" aria-label="安裝提示" onClick={() => setPeek(true)}>?</button>;
  }
  return (
    <section class="install-hint" aria-label="安裝提示">
      <p>點瀏覽器的分享或選單，再選「加入主畫面」，就能像 App 一樣打開。</p>
      <button type="button" onClick={() => setCollapsed(true)}>收起</button>
    </section>
  );
}
