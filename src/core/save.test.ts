import { describe, it, expect, afterEach } from 'vitest';
import { createInitialState, SCHEMA_VERSION } from './state';
import { serialize, parseSave, migrate, encodeSaveCode, decodeSaveCode, migrations, splitArchive, validateShape } from './save';

const s = createInitialState(7, 0);
afterEach(() => { for (const k of Object.keys(migrations)) delete (migrations as any)[k]; });

describe('序列化與驗證', () => {
  it('往返不變', () => {
    expect(parseSave(serialize(s))).toEqual(s);
  });
  it('壞 JSON、缺欄位回傳 null', () => {
    expect(parseSave('not json')).toBeNull();
    expect(parseSave(JSON.stringify({ ...s, needs: null }))).toBeNull();
    expect(validateShape({ ...s, diary: 'x' })).toBe(false);
    expect(validateShape(s)).toBe(true);
  });
});

describe('遷移', () => {
  it('同版本原樣回傳', () => {
    expect(migrate(JSON.parse(serialize(s)))).toEqual(s);
  });
  it('比程式新回傳 too-new', () => {
    expect(migrate({ ...s, schemaVersion: SCHEMA_VERSION + 1 })).toBe('too-new');
  });
  it('缺版本或非物件回傳 null', () => {
    expect(migrate({ ...s, schemaVersion: undefined })).toBeNull();
    expect(migrate(null)).toBeNull();
  });
  it('依序套用 migrations 直到最新版', () => {
    migrations[0] = (o: any) => ({ ...o, schemaVersion: 1 });
    expect(migrate({ ...s, schemaVersion: 0 })).toEqual(s);
  });
});

describe('存檔碼', () => {
  it('往返不變', () => {
    expect(decodeSaveCode(encodeSaveCode(s))).toEqual(s);
  });
  it('亂碼回傳 null', () => {
    expect(decodeSaveCode('!!!不是存檔碼')).toBeNull();
    expect(decodeSaveCode('')).toBeNull();
  });
});

describe('封存切分（規格 8.3 體積控制）', () => {
  it('日記超過 60 篇時把較舊的移出', () => {
    const diary = Array.from({ length: 65 }, (_, i) => ({ date: `d${i}`, text: 't', sticker: null }));
    const out = splitArchive({ ...s, diary });
    expect(out.state.diary).toHaveLength(60);
    expect(out.state.diary[0].date).toBe('d0');
    expect(out.archived.diary.map(d => d.date)).toEqual(['d60', 'd61', 'd62', 'd63', 'd64']);
  });
  it('信件超過 30 封時把較舊的移出', () => {
    const letters = Array.from({ length: 31 }, (_, i) => ({ id: `l${i}`, date: 'x', from: 'juzi' as const, text: 't', read: true }));
    const out = splitArchive({ ...s, letters });
    expect(out.state.letters).toHaveLength(30);
    expect(out.archived.letters.map(l => l.id)).toEqual(['l30']);
  });
});
