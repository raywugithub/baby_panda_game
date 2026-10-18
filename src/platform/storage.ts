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

let readOnly = false;
let getState: (() => GameState) | undefined;
let backupQueue: Promise<void> = Promise.resolve();
let listenersInstalled = false;

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

function preserveCorrupt(raw: string): void {
  try {
    localStorage.setItem(CORRUPT_KEY, raw);
  } catch {
    // 無法保留損壞原文時仍繼續還原流程
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
      if (fromVersion < SCHEMA_VERSION && (await backupRaw(raw, now))) {
        saveGame(result);
      }
      return { state: result, restored: false, readOnly: false };
    }

    preserveCorrupt(raw);
  }

  setReadOnly(false);
  const fromBackup = await restoreFromBackups();
  if (fromBackup) return { state: fromBackup, restored: true, readOnly: false };
  return { state: freshGame(now), restored: false, readOnly: false };
}

export function saveGame(s: GameState): void {
  if (readOnly) return;
  const raw = serialize(s);
  try {
    localStorage.setItem(LS_KEY, raw);
    saveFailed.value = false;
  } catch {
    saveFailed.value = true;
  }
  sizeWarning.value = raw.length > WARN_BYTES;
  const t = clockNow();
  backupQueue = backupQueue.then(() => maybeBackup(s, t));
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
