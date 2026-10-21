import { useEffect, useState } from 'preact/hooks';
import { game, commit, readOnly } from '../store';
import type { Overlay } from '../nav';
import { InstallGuide } from '../components/InstallGuide';
import { encodeSaveCode } from '../../core/save';
import { setSoundEnabled } from '../../platform/audio';
import { now } from '../../platform/clock';
import { isIOS, isStandalone } from '../../platform/pwa';
import {
  exportFileName,
  exportBlob,
  importCode,
  importFileText,
  type ImportResult,
} from '../../platform/transfer';
import { APP_VERSION } from '../../version';

type ShareNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};

type ImportStage = 'idle' | 'confirm' | 'input';

/** 設定頁：音效、匯出／匯入存檔、加入主畫面說明與版本號（規格 8.3）。 */
export function Settings(_props: { overlay?: Overlay } = {}) {
  const [code, setCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [importStage, setImportStage] = useState<ImportStage>('idle');
  const [pasted, setPasted] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // 開啟設定時同步音效開關到播放層（音效預設開啟，存檔可能關閉）。
  useEffect(() => {
    setSoundEnabled(game.value.settings.sound);
  }, []);

  function toggleSound(on: boolean) {
    const s = game.value;
    commit({ ...s, settings: { ...s.settings, sound: on } });
    setSoundEnabled(on);
  }

  function markExported(t: number) {
    const s = game.value;
    commit({ ...s, settings: { ...s.settings, lastExportAt: t } });
  }

  async function exportSave() {
    const s = game.value;
    const t = now();
    const name = exportFileName(t);
    const blob = exportBlob(s);
    const file = new File([blob], name, { type: 'application/json' });
    setCode(encodeSaveCode(s));
    setMessage(null);
    const nav = navigator as ShareNavigator;
    if (isIOS() && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share?.({ files: [file], title: name });
        markExported(t);
      } catch {
        setMessage('分享沒有完成，可以複製下面的存檔碼先備份');
      }
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    markExported(t);
  }

  function copyCode() {
    if (code === null) return;
    try {
      void navigator.clipboard?.writeText(code).catch(() => {});
    } catch {
      // 剪貼簿不可用時靜默略過；存檔碼仍顯示在畫面上。
    }
  }

  async function applyImport(run: () => Promise<ImportResult>) {
    const out = await run();
    if (out.ok) {
      commit(out.state);
      setImportStage('idle');
      setPasted('');
      setImportError(null);
      setMessage('已匯入熊貓');
    } else {
      setImportError(out.error);
    }
  }

  async function onFileChosen(file: File | undefined) {
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportError('這個存檔碼看不懂');
      return;
    }
    await applyImport(() => importFileText(text, game.value, now()));
  }

  return (
    <section class="settings" aria-labelledby="settings-title">
      <h2 id="settings-title">設定</h2>

      <label class="settings-row">
        <input
          type="checkbox"
          aria-label="音效"
          checked={game.value.settings.sound}
          onChange={e => toggleSound((e.currentTarget as HTMLInputElement).checked)}
        />
        音效
      </label>

      <section class="settings-block" aria-label="存檔">
        <button type="button" onClick={exportSave}>匯出存檔</button>
        {code !== null ? (
          <>
            <textarea readOnly aria-label="匯出的存檔碼" value={code} />
            <button type="button" onClick={copyCode}>複製存檔碼</button>
          </>
        ) : null}
        {message ? <p role="status">{message}</p> : null}

        {importStage === 'idle' ? (
          <button type="button" disabled={readOnly.value} onClick={() => setImportStage('confirm')}>匯入存檔碼</button>
        ) : null}

        {readOnly.value ? <p role="status">目前是唯讀模式，無法匯入。請先更新遊戲。</p> : null}

        {importStage === 'confirm' ? (
          <div class="settings-confirm">
            <p>會取代目前的熊貓，要繼續嗎？</p>
            <p>匯入前會先自動備份目前的熊貓。</p>
            <button type="button" onClick={() => setImportStage('input')}>繼續</button>
            <button type="button" onClick={() => setImportStage('idle')}>算了</button>
          </div>
        ) : null}

        {importStage === 'input' ? (
          <div class="settings-import">
            <textarea
              aria-label="匯入的存檔碼"
              value={pasted}
              onInput={e => setPasted((e.currentTarget as HTMLTextAreaElement).value)}
            />
            <button type="button" onClick={() => applyImport(() => importCode(pasted.trim(), game.value, now()))}>
              貼上匯入
            </button>
            <input
              type="file"
              accept=".panda,application/json"
              aria-label="選擇 .panda 檔案"
              onChange={e => void onFileChosen((e.currentTarget as HTMLInputElement).files?.[0])}
            />
            <button type="button" onClick={() => { setImportStage('idle'); setImportError(null); }}>取消</button>
          </div>
        ) : null}
        {importError ? <p role="alert">{importError}</p> : null}
      </section>

      <section class="settings-block" aria-label="加入主畫面">
        <p>安裝狀態：{isStandalone() ? '已加入主畫面' : '尚未加入主畫面'}</p>
        <button type="button" aria-expanded={showGuide} onClick={() => setShowGuide(v => !v)}>
          加入主畫面說明
        </button>
        {showGuide ? <InstallGuide onPlayHere={() => setShowGuide(false)} /> : null}
      </section>

      <p class="settings-version">熊貓成長記 · 版本 {APP_VERSION}</p>
    </section>
  );
}
