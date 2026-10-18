import { describe, it, expect } from 'vitest';
import { createInitialState } from '../core/state';
import { encodeSaveCode, serialize } from '../core/save';
import { exportFileName, exportBlob, importCode, importFileText, shouldRemindBackup } from './transfer';

const D = 24 * 3600_000;

describe('匯出', () => {
  it('檔名與內容', async () => {
    expect(exportFileName(new Date(2026, 9, 18, 10).getTime())).toBe('panda-save-2026-10-18.panda');
    const s = createInitialState(9, 0);
    expect(JSON.parse(await exportBlob(s).text()).seed).toBe(9);
  });
});

describe('匯入（規格 10：匯入格式錯誤不覆蓋）', () => {
  it('亂碼回傳錯誤，目前進度不變', async () => {
    const cur = createInitialState(1, 0);
    const out = await importCode('亂碼', cur, 0);
    expect(out).toEqual({ ok: false, error: '這個存檔碼看不懂' });
    expect(cur.seed).toBe(1);
  });
  it('有效存檔碼回傳新狀態', async () => {
    const other = createInitialState(2, 0);
    const out = await importCode(encodeSaveCode(other), createInitialState(1, 0), 0);
    expect(out.ok && out.state.seed).toBe(2);
  });
  it('.panda 檔案內容（JSON）可匯入，格式錯誤則回傳錯誤', async () => {
    const other = createInitialState(3, 0);
    const out = await importFileText(serialize(other), createInitialState(1, 0), 0);
    expect(out.ok && out.state.seed).toBe(3);
    const bad = await importFileText('{not json', createInitialState(1, 0), 0);
    expect(bad).toEqual({ ok: false, error: '這個存檔碼看不懂' });
  });
});

describe('備份提醒（規格 8.3）', () => {
  it('非主畫面、超過 5 天未匯出才提醒', () => {
    const s = { ...createInitialState(1, 0), settings: { sound: true, lastExportAt: 0, installHintCollapsed: false } };
    expect(shouldRemindBackup(s, 5 * D, false)).toBe(false);
    expect(shouldRemindBackup(s, 6 * D, false)).toBe(true);
    expect(shouldRemindBackup(s, 6 * D, true)).toBe(false);
  });
});
