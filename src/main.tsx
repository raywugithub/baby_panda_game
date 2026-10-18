import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import './styles/global.css';
import { App } from './ui/App';
import { openOverlay } from './ui/nav';
import { boot, game } from './ui/store';
import { updateAvailable, setUpdateHandler } from './platform/pwa';
import { flushOnHide, maybeBackup } from './platform/storage';
import { now } from './platform/clock';

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
    render(<App />, document.getElementById('app')!);
    if (welcome) openOverlay({ kind: 'welcome' });
  });
