import { tab, TAB_ORDER, type Overlay } from '../nav';

const OVERLAY_NAMES: Record<Overlay['kind'], string> = {
  settings: '設定',
  dialogue: '對話',
  location: '地點',
  photo: '拍照',
  welcome: '歡迎回來',
};

/** 尚未實作的畫面佔位：分頁用時顯示分頁名稱，覆蓋層用時顯示覆蓋層名稱。 */
export function Placeholder(props: { overlay?: Overlay; [key: string]: unknown }) {
  const { overlay } = props;
  const title = overlay
    ? OVERLAY_NAMES[overlay.kind]
    : TAB_ORDER.find((t) => t.tab === tab.value)?.label ?? '';
  return (
    <div class="placeholder">
      <h2>{title}</h2>
      <p>即將推出</p>
    </div>
  );
}
