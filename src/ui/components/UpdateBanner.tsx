import { updateAvailable, applyUpdate } from '../../platform/pwa';

/** 有新版本時顯示更新按鈕；點擊會先存檔與備份再套用。 */
export function UpdateBanner() {
  if (!updateAvailable.value) return null;
  return (
    <button type="button" class="banner update-banner" onClick={() => void applyUpdate()}>
      有新版本，點一下更新
    </button>
  );
}
