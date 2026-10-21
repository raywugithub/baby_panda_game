import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import './styles/global.css';
import { App } from './ui/App';
import { openOverlay } from './ui/nav';
import { boot, commit, game, registerBeatAck } from './ui/store';
import { ackBeat } from './core/story';
import { updateAvailable, setUpdateHandler } from './platform/pwa';
import { flushOnHide, maybeBackup } from './platform/storage';
import { now } from './platform/clock';
import { ensureEnterable } from './core/mapgen';
import { setSoundEnabled } from './platform/audio';

// 關閉劇情時排入下一個到期劇情（契約 10.8）；由 UI 啟動模組登記，內容層不引用 UI。
registerBeatAck(ackBeat);

const updateSW = registerSW({
  onNeedRefresh() {
    updateAvailable.value = true;
  },
  onOfflineReady() {},
});
setUpdateHandler(async () => {
  flushOnHide();
  await maybeBackup(game.value, now(), true);
  await updateSW(true);
});

try {
  void navigator.storage?.persist?.();
} catch {
  // 不支援或被拒絕時忽略
}

// 先載入存檔再掛載畫面：引導步驟（C11）只在掛載時計算一次，必須看到真正的存檔狀態。
void boot(now())
  .catch(() => ({ welcome: false }))
  .then(({ welcome }) => {
    // 讀檔後確保至少一個地點可進入（舊存檔或能力變動時，避免地圖全部鎖住）。
    setSoundEnabled(game.value.settings.sound);
    const fixed = ensureEnterable(game.value);
    if (fixed !== game.value) commit(fixed);
    render(<App />, document.getElementById('app')!);
    if (welcome) openOverlay({ kind: 'welcome' });
  });
