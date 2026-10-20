import { describe, it, expect, afterEach } from 'vitest';
import { createInitialState } from './state';
import { runDaily, dailyHandlers, recordVisit } from './daily';

const day = (d: number) => new Date(2026, 9, d, 12).getTime();
const fresh = () => ({ ...createInitialState(1, day(17)), lastDailyDate: '2026-10-17' });
const added: unknown[] = [];
const builtin = [...dailyHandlers];
afterEach(() => { dailyHandlers.splice(0, dailyHandlers.length, ...builtin); added.length = 0; });

describe('runDaily', () => {
  it('同一天不執行，狀態不變', () => {
    const s = { ...fresh(), lastDailyDate: '2026-10-18' };
    expect(runDaily(s, day(18))).toEqual(s);
  });
  it('跨日時重設每日計數並更新 lastDailyDate', () => {
    const s = { ...fresh(), daily: { revisitXpCount: 3, freeBoxUsed: true, visitor: 'juzi' as const, visitorDone: true } };
    const out = runDaily(s, day(18));
    expect(out.lastDailyDate).toBe('2026-10-18');
    expect(out.daily).toEqual({ revisitXpCount: 0, freeBoxUsed: false, visitor: null, visitorDone: false });
  });
  it('未完成的來訪跨日保留（不限時）', () => {
    const s = { ...fresh(), daily: { revisitXpCount: 0, freeBoxUsed: false, visitor: 'gulu' as const, visitorDone: false } };
    const out = runDaily(s, day(18));
    expect(out.daily.visitor).toBe('gulu');
    expect(out.daily.visitorDone).toBe(false);
  });
  it('跨日時把所有好友的 chatsToday 歸零', () => {
    const s = fresh();
    s.friends.juzi = { ...s.friends.juzi, chatsToday: 2 };
    s.friends.gulu = { ...s.friends.gulu, chatsToday: 1 };
    const out = runDaily(s, day(18));
    expect(out.friends.juzi.chatsToday).toBe(0);
    expect(out.friends.gulu.chatsToday).toBe(0);
  });
  it('跨日時寫入一篇日記（新的在最前）', () => {
    const s = { ...fresh(), diary: [{ date: '2026-10-17', text: '舊的', sticker: null }] };
    const out = runDaily(s, day(18));
    expect(out.diary.length).toBe(2);
    expect(out.diary[0].date).toBe('2026-10-18');
    expect(out.diary[1].text).toBe('舊的');
  });
  it('日期倒退不執行、不重複發放', () => {
    const s = { ...fresh(), lastDailyDate: '2026-10-18', daily: { revisitXpCount: 3, freeBoxUsed: true, visitor: null, visitorDone: false } };
    expect(runDaily(s, day(10)).daily.revisitXpCount).toBe(3);
  });
  it('依序呼叫已登記的 handler，每天一次，且清空 summary 在最後', () => {
    dailyHandlers.push((s, today) => { added.push(today); return { ...s, lastVisitedSummary: { ...s.lastVisitedSummary, foods: ['seen-by-handler'] } }; });
    const s = recordVisit(fresh(), 'locations', '竹林小徑');
    const out = runDaily(s, day(18));
    expect(added).toEqual(['2026-10-18']);
    expect(out.lastVisitedSummary).toEqual({ locations: [], foods: [] });
    expect(runDaily(out, day(18))).toEqual(out);
  });
});

describe('recordVisit', () => {
  it('去重加入當天摘要', () => {
    let s = recordVisit(fresh(), 'locations', '竹林小徑');
    s = recordVisit(s, 'locations', '竹林小徑');
    s = recordVisit(s, 'foods', '竹筍糕');
    expect(s.lastVisitedSummary).toEqual({ locations: ['竹林小徑'], foods: ['竹筍糕'] });
  });
});
