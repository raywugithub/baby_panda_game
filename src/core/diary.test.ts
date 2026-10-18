import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { makeDiaryEntry } from './diary';
import { DIARY_SENTENCES } from '../content/diary';

describe('月亮鈴鐺（夢境日記，契約 10.11、規格 7.2）', () => {
  const dreamy = { ...createInitialState(3, 0), equipped: { outfit: {}, pendants: ['pendant-moon-bell'] } };
  const dayOf = (i: number) => `2026-10-${String(i).padStart(2, '0')}`;
  it('裝備月亮鈴鐺時每篇都附上「夢裡：」夢話', () => {
    for (let i = 1; i <= 10; i++) expect(makeDiaryEntry(dreamy, dayOf(i)).text.includes('夢裡：')).toBe(true);
  });
  it('夢話是附加在一般內容之後，一般引用仍然保留', () => {
    const s = { ...dreamy, lastVisitedSummary: { locations: ['竹林小徑'], foods: [] } };
    const texts = Array.from({ length: 31 }, (_, i) => makeDiaryEntry(s, dayOf((i % 28) + 1)).text);
    const both = texts.filter(t => t.includes('竹林小徑') && t.includes('夢裡：'));
    expect(both.length).toBeGreaterThan(0);
    for (const t of both) expect(t.indexOf('夢裡：')).toBeGreaterThan(0);
  });
  it('未裝備時沒有夢話', () => {
    for (let i = 1; i <= 10; i++) expect(makeDiaryEntry(createInitialState(3, 0), dayOf(i)).text.includes('夢裡')).toBe(false);
  });
  it('夢境句至少 5 句，且不含占位符', () => {
    const dreams = DIARY_SENTENCES.filter(s => s.dream);
    expect(dreams.length).toBeGreaterThanOrEqual(5);
    for (const d of dreams) expect(d.text).not.toMatch(/\{/);
  });
});

describe('日記句庫', () => {
  it('至少 60 句、不重複、只用已定義的占位符', () => {
    expect(DIARY_SENTENCES.length).toBeGreaterThanOrEqual(60);
    expect(new Set(DIARY_SENTENCES.map(s => s.text)).size).toBe(DIARY_SENTENCES.length);
    for (const s of DIARY_SENTENCES) {
      const marks = s.text.match(/\{[a-z]+\}/g) ?? [];
      for (const m of marks) expect(['{loc}', '{food}']).toContain(m);
    }
  });
});

describe('makeDiaryEntry', () => {
  it('同種子同日期結果相同，且不殘留占位符', () => {
    const s = { ...createInitialState(3, 0), lastVisitedSummary: { locations: ['竹林小徑'], foods: ['竹筍糕'] } };
    const a = makeDiaryEntry(s, '2026-10-18');
    expect(makeDiaryEntry(s, '2026-10-18')).toEqual(a);
    expect(a.text).not.toMatch(/\{/);
    expect(a.date).toBe('2026-10-18');
    expect(a.sticker).toBeNull();
  });
  it('有地點紀錄時，多天中會引用竹林小徑', () => {
    const s = { ...createInitialState(3, 0), lastVisitedSummary: { locations: ['竹林小徑'], foods: [] } };
    const hits = Array.from({ length: 31 }, (_, i) => makeDiaryEntry(s, `2026-10-${String(i + 1).padStart(2, '0')}`).text)
      .filter(t => t.includes('竹林小徑'));
    expect(hits.length).toBeGreaterThan(0);
  });
  it('沒有紀錄時不輸出占位符或空白地點', () => {
    const s = createInitialState(3, 0);
    for (let i = 1; i <= 31; i++) {
      const t = makeDiaryEntry(s, `2026-10-${String(i).padStart(2, '0')}`).text;
      expect(t).not.toMatch(/\{|\}|  /);
    }
  });
});
