import { useComputed } from '@preact/signals';
import { game, readOnly } from '../store';
import { openOverlay } from '../nav';

/** 頂部列：信箱（未讀數）、設定；唯讀模式時顯示提示。 */
export function TopBar({ onMailbox }: { onMailbox: () => void }) {
  const unread = useComputed(() => game.value.letters.filter(l => !l.read).length);
  return (
    <header class="topbar">
      {readOnly.value ? <p class="readonly" role="status">唯讀模式：請更新遊戲</p> : null}
      <div class="topbar-buttons">
        <button type="button" aria-label="信箱" onClick={onMailbox}>
          📮
          {unread.value > 0 ? <span class="badge" aria-hidden="true">{unread}</span> : null}
        </button>
        <button type="button" aria-label="設定" onClick={() => openOverlay({ kind: 'settings' })}>⚙️</button>
      </div>
    </header>
  );
}
