import { signal } from '@preact/signals';

/** 有新版 SW 等待中；由 registerSW 的 onNeedRefresh 設為 true。 */
export const updateAvailable = signal(false);

let updateHandler: (() => Promise<void>) | null = null;

/** 由 main.tsx 設定：先存檔與備份，再套用 SW 更新（契約 §9）。 */
export function setUpdateHandler(fn: () => Promise<void>): void {
  updateHandler = fn;
}

export async function applyUpdate(): Promise<void> {
  if (updateHandler) await updateHandler();
}

// CriOS（iPhone 上的 Chrome）的 UA 也包含 iPhone，因此同一條規則即可涵蓋。
export function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  const byDisplayMode =
    typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches;
  return byDisplayMode || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
