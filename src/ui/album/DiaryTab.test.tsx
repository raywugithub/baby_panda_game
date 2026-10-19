import 'fake-indexeddb/auto';
import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/preact';
import { DiaryTab } from './DiaryTab';
import { game } from '../store';
import { createInitialState } from '../../core/state';
import { idbKeys, idbDelete, idbPut } from '../../platform/idb';

beforeEach(async () => {
  for (const k of await idbKeys('archive')) await idbDelete('archive', k);
  game.value = { ...createInitialState(1, 0), diary: [
    { date: '2026-10-17', text: '今天去了竹林', sticker: null },
    { date: '2026-10-18', text: '夢到會飛的竹筍', sticker: null },
  ] };
});

it('lists newest diary entries first', () => {
  const { getAllByTestId } = render(<DiaryTab />);
  const items = getAllByTestId('diary-entry');
  expect(items[0].textContent).toContain('夢到會飛的竹筍');
});

it('sticking a sticker records it on that entry', () => {
  const { getAllByText, getAllByLabelText } = render(<DiaryTab />);
  fireEvent.click(getAllByText('貼貼紙')[0]);
  fireEvent.click(getAllByLabelText('貼紙 星星')[0]);
  expect(game.value.diary.find((d) => d.date === '2026-10-18')!.sticker).toBe('sticker-01');
});

it('merges archived entries (read-only) into the list, newest first', async () => {
  await idbPut('archive', 'diary:2026-09-01', { date: '2026-09-01', text: '舊日記：去看海', sticker: 'sticker-02' });
  await idbPut('archive', 'letter:l1', { id: 'l1', date: '2026-09-02', from: 'bamboo', text: '不是日記', read: true });
  const { getAllByTestId, getAllByText } = render(<DiaryTab />);
  await waitFor(() => expect(getAllByTestId('diary-entry')).toHaveLength(3));
  const items = getAllByTestId('diary-entry');
  expect(items[2].textContent).toContain('舊日記：去看海');
  // 封存的日記唯讀：只有兩篇狀態內日記有「貼貼紙」按鈕。
  expect(getAllByText('貼貼紙')).toHaveLength(2);
});
