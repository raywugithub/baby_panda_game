import { zlibSync, unzlibSync, strToU8, strFromU8 } from 'fflate';
import { GameState, SCHEMA_VERSION, DiaryEntry, Letter } from './state';

export const migrations: Record<number, (obj: any) => any> = {};

const DIARY_KEEP = 60;
const LETTER_KEEP = 30;
const CHUNK = 8192;

const isNum = (v: unknown): v is number => typeof v === 'number';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

export function validateShape(obj: unknown): obj is GameState {
  if (!isObj(obj)) return false;
  const needs = obj.needs;
  if (!isObj(needs) || !isNum(needs.tummy) || !isNum(needs.clean) || !isNum(needs.mood)) return false;
  if (!isNum(obj.energy) || !isNum(obj.starSand) || !isNum(obj.growthXp) || !isNum(obj.chainLinks)) return false;
  if (!isNum(obj.seed) || !isNum(obj.createdAt) || !isNum(obj.lastSeenAt)) return false;
  if (!(obj.awakeUntil === null || isNum(obj.awakeUntil))) return false;
  if (typeof obj.lastDailyDate !== 'string') return false;
  for (const k of ['inventory', 'rooms', 'friends', 'map']) if (!isObj(obj[k])) return false;
  for (const k of ['diary', 'letters', 'recipes', 'storyBeats', 'hugLog', 'feedLog', 'pokeLog']) {
    if (!Array.isArray(obj[k])) return false;
  }
  for (const k of ['equipped', 'presets', 'settings', 'lastVisitedSummary']) if (!(k in obj)) return false;
  return true;
}

export function migrate(obj: unknown): GameState | 'too-new' | null {
  if (!isObj(obj)) return null;
  const version = obj.schemaVersion;
  if (!Number.isInteger(version)) return null;
  if ((version as number) > SCHEMA_VERSION) return 'too-new';
  let cur: any = obj;
  let v = version as number;
  while (v < SCHEMA_VERSION) {
    const f = migrations[v];
    if (!f) return null;
    cur = f(cur);
    const next = isObj(cur) ? cur.schemaVersion : undefined;
    // 必須前進，否則遷移鏈會無限迴圈
    if (!Number.isInteger(next) || (next as number) <= v) return null;
    v = next as number;
  }
  return validateShape(cur) ? cur : null;
}

export function parseSave(raw: string): GameState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = migrate(parsed);
  return result === 'too-new' || result === null ? null : result;
}

export function encodeSaveCode(s: GameState): string {
  const bytes = zlibSync(strToU8(serialize(s)));
  let bin = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(bin);
}

export function decodeSaveCode(code: string): GameState | null {
  try {
    const bin = atob(code);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return parseSave(strFromU8(unzlibSync(bytes)));
  } catch {
    return null;
  }
}

export function splitArchive(s: GameState): {
  state: GameState;
  archived: { diary: DiaryEntry[]; letters: Letter[] };
} {
  return {
    state: {
      ...s,
      diary: s.diary.slice(0, DIARY_KEEP),
      letters: s.letters.slice(0, LETTER_KEEP),
    },
    archived: {
      diary: s.diary.slice(DIARY_KEEP),
      letters: s.letters.slice(LETTER_KEEP),
    },
  };
}
