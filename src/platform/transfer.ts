import type { GameState } from '../core/state';
import { serialize, decodeSaveCode, parseSave } from '../core/save';
import { localDate } from '../core/time';
import { maybeBackup } from './storage';

const DAY = 24 * 3600_000;
const BACKUP_REMIND_AFTER = 5 * DAY;

export type ImportResult = { ok: true; state: GameState } | { ok: false; error: string };

export function exportFileName(now: number): string {
  return `panda-save-${localDate(now)}.panda`;
}

export function exportBlob(s: GameState): Blob {
  return new Blob([serialize(s)], { type: 'application/json' });
}

async function importWith(
  decode: (raw: string) => GameState | null,
  raw: string,
  current: GameState,
  now: number,
): Promise<ImportResult> {
  // 規格 8.3：匯入前一律自動備份目前存檔，不論匯入是否成功。
  await maybeBackup(current, now, true);
  const state = decode(raw);
  if (state === null) return { ok: false, error: '這個存檔碼看不懂' };
  return { ok: true, state };
}

/** 貼上的存檔碼（encodeSaveCode 產生）。格式錯誤時不改變 current。 */
export function importCode(code: string, current: GameState, now: number): Promise<ImportResult> {
  return importWith(decodeSaveCode, code, current, now);
}

/** 匯入 .panda 檔案的文字內容（serialize 產生的 JSON）。 */
export function importFileText(text: string, current: GameState, now: number): Promise<ImportResult> {
  return importWith(parseSave, text, current, now);
}

export function shouldRemindBackup(s: GameState, now: number, standalone: boolean): boolean {
  return !standalone && now - (s.settings.lastExportAt ?? s.createdAt) > BACKUP_REMIND_AFTER;
}
