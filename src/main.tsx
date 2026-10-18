import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import './styles/global.css';
import { App } from './ui/App';
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

render(<App />, document.getElementById('app')!);
void boot(now());
