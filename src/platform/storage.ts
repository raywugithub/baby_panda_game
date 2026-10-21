import { signal } from '@preact/signals';
import { createInitialState, GameState, DiaryEntry, Letter, SCHEMA_VERSION } from '../core/state';
import { serialize, parseSave, migrate, validateShape } from '../core/save';
import { idbGet, idbPut, idbDelete, idbKeys } from './idb';
import { now as clockNow, randomSeed } from './clock';

export const LS_KEY = 'panda.save';
export const CORRUPT_KEY = 'panda.save.corrupt';
export const BACKUP_INTERVAL = 10 * 60_000;
export const BACKUP_KEEP = 3;
export const WARN_BYTES = 1_000_000;

export const saveFailed = signal(false);
export const sizeWarning = signal(false);
export const storageUnavailable = signal(false);
/** 啟動讀檔失敗：停止所有寫入，避免蓋掉真正的存檔。 */
export const bootFailed = signal(false);

let readOnly = false;
let getState: (() => GameState) | undefined;
let backupQueue: Promise<void> = Promise.resolve();
let listenersInstalled = false;
/** 遷移前備份失敗：舊版原文尚未保留，主存檔在備份成功前不可覆寫（C23）。 */
let pendingMigration: { raw: string; key: number } | null = null;
/** 遷移前備份等待期間收到的最新狀態；備份成功後只寫入這一份。 */
let pendingState: GameState | null = null;
/** 損壞原文無法保留到 corrupt 鍵：主存檔在保留成功前不可覆寫。 */
let pendingCorrupt: string | null = null;

export function setReadOnly(b: boolean): void {
  readOnly = b;
}

export function setStateSource(getter: () => GameState): void {
  getState = getter;
}

/** 等待 saveGame 排入的備份全部完成（測試與關閉前使用）。 */
export function settleBackups(): Promise<void> {
  return backupQueue;
}

function freshGame(now: number): GameState {
  return createInitialState(randomSeed(), now);
}

function tryParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 保留損壞原文；失敗時回傳 false，呼叫端必須阻止覆寫主存檔。 */
function preserveCorrupt(raw: string): boolean {
  try {
    localStorage.setItem(CORRUPT_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

async function pruneBackups(): Promise<void> {
  const keys = (await idbKeys('backups')).map(Number).sort((a, b) => a - b);
  for (const k of keys.slice(0, Math.max(0, keys.length - BACKUP_KEEP))) {
    await idbDelete('backups', k);
  }
}

async function restoreFromBackups(): Promise<GameState | null> {
  try {
    const keys = (await idbKeys('backups')).map(Number).sort((a, b) => b - a);
    for (const k of keys) {
      const data = await idbGet<string>('backups', k);
      const state = typeof data === 'string' ? parseSave(data) : null;
      if (state) return state;
    }
  } catch {
    storageUnavailable.value = true;
  }
  return null;
}

/** 遷移前把舊版原文寫入備份（規格 8.3）；失敗時回傳 false。 */
async function backupRaw(raw: string, key: number): Promise<boolean> {
  try {
    await idbPut('backups', key, raw);
    await pruneBackups();
    return true;
  } catch {
    storageUnavailable.value = true;
    return false;
  }
}

export async function loadGame(now: number): Promise<{ state: GameState; restored: boolean; readOnly: boolean }> {
  pendingMigration = null;
  pendingState = null;
  pendingCorrupt = null;
  let raw: string | null;
  try {
    raw = localStorage.getItem(LS_KEY);
  } catch {
    storageUnavailable.value = true;
    setReadOnly(false);
    return { state: freshGame(now), restored: false, readOnly: false };
  }

  if (raw !== null) {
    const parsed = tryParse(raw);
    const result = migrate(parsed);

    if (result === 'too-new' && validateShape(parsed)) {
      setReadOnly(true);
      return { state: parsed, restored: false, readOnly: true };
    }

    if (result !== null && result !== 'too-new') {
      setReadOnly(false);
      const fromVersion = (parsed as { schemaVersion: number }).schemaVersion;
      if (fromVersion < SCHEMA_VERSION) {
        if (await backupRaw(raw, now)) {
          saveGame(result);
        } else {
          pendingMigration = { raw, key: now };
          saveFailed.value = true;
        }
      }
      return { state: result, restored: false, readOnly: false };
    }

    if (!preserveCorrupt(raw)) {
      pendingCorrupt = raw;
      saveFailed.value = true;
    }
  }

  setReadOnly(false);
  const fromBackup = await restoreFromBackups();
  if (fromBackup) return { state: fromBackup, restored: true, readOnly: false };
  return { state: freshGame(now), restored: false, readOnly: false };
}

export function saveGame(s: GameState): void {
  if (readOnly) return;
  if (pendingMigration) {
    pendingState = s;
    backupQueue = backupQueue.then(() => retryPendingMigration());
    return;
  }
  if (pendingCorrupt !== null) {
    if (!preserveCorrupt(pendingCorrupt)) {
      saveFailed.value = true;
      return;
    }
    pendingCorrupt = null;
  }
  writeMain(s);
  const t = clockNow();
  backupQueue = backupQueue.then(() => maybeBackup(s, t));
}

function writeMain(s: GameState): void {
  const raw = serialize(s);
  try {
    localStorage.setItem(LS_KEY, raw);
    saveFailed.value = false;
  } catch {
    saveFailed.value = true;
  }
  sizeWarning.value = raw.length > WARN_BYTES;
}

/** 重試遷移前備份；成功後才解除封鎖，並寫入等待期間的最新狀態。 */
async function retryPendingMigration(): Promise<void> {
  const p = pendingMigration;
  if (!p) return;
  if (await backupRaw(p.raw, p.key)) {
    pendingMigration = null;
    const latest = pendingState;
    pendingState = null;
    if (latest) saveGame(latest);
  }
}

export async function maybeBackup(s: GameState, now: number, force = false): Promise<void> {
  try {
    const keys = (await idbKeys('backups')).map(Number);
    const last = keys.length ? Math.max(...keys) : undefined;
    if (!force && last !== undefined && now - last < BACKUP_INTERVAL) return;
    await idbPut('backups', now, serialize(s));
    await pruneBackups();
  } catch {
    storageUnavailable.value = true;
  }
}

export function flushOnHide(): void {
  if (getState) saveGame(getState());
}

export function installFlushListeners(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnHide();
  });
  window.addEventListener('pagehide', () => flushOnHide());
}

export async function archiveItems(a: { diary: DiaryEntry[]; letters: Letter[] }): Promise<void> {
  const items: [string, unknown][] = [
    ...a.diary.map((d): [string, unknown] => [`diary:${d.date}`, d]),
    ...a.letters.map((l): [string, unknown] => [`letter:${l.id}`, l]),
  ];
  for (const [key, value] of items) {
    try {
      await idbPut('archive', key, value);
    } catch {
      storageUnavailable.value = true;
    }
  }
}
