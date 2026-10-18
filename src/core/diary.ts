import type { GameState, DiaryEntry } from './state';
import type { DailyHandler } from './daily';
import { hash, mulberry32, pick } from './rng';
import { DIARY_SENTENCES } from '../content/diary';
import { diaryDreamOn } from './dream';

/** 產生某天的日記；同種子同日期結果相同。月亮鈴鐺時在一般內容後附上「夢裡：」夢話。 */
export function makeDiaryEntry(s: GameState, today: string): DiaryEntry {
  const rand = mulberry32(hash(s.seed, today));
  const { locations, foods } = s.lastVisitedSummary;
  const pool = DIARY_SENTENCES.filter(x =>
    !x.dream && (x.needs ?? []).every(n => (n === 'loc' ? locations.length > 0 : foods.length > 0)));
  const base = pick(rand, pool).text
    .replace(/\{(loc|food)\}/g, (_, k: string) => pick(rand, k === 'loc' ? locations : foods));
  let text = base;
  if (diaryDreamOn(s)) {
    const dreams = DIARY_SENTENCES.filter(x => x.dream);
    text += `夢裡：${pick(rand, dreams).text}`;
  }
  return { date: today, text, sticker: null };
}

export const diaryHandler: DailyHandler = (s, today) => ({
  ...s,
  diary: [makeDiaryEntry(s, today), ...s.diary],
});
