import 'fake-indexeddb/auto';
import { it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Album } from './Album';
import { game } from '../store';
import { createInitialState } from '../../core/state';
import { idbKeys, idbDelete, idbPut } from '../../platform/idb';

beforeEach(async () => {
  game.value = { ...createInitialState(1, 0), inventory: { 'furn-sofa': 1 } };
  for (const k of await idbKeys('photos')) await idbDelete('photos', k);
  for (const k of await idbKeys('archive')) await idbDelete('archive', k);
});

const photo = (id: string, kind: 'photo' | 'commemorative' | 'legend', createdAt: number) => ({
  id, createdAt, kind, title: id, blob: new Blob(['<svg/>'], { type: 'image/svg+xml' }),
});

it('shows the six tabs in order', () => {
  const { getByText } = render(<Album />);
  for (const t of ['朋友卡', '物品圖鑑', '食譜', '地點印章', '回憶照片', '熊貓日記']) getByText(t);
});

it('owned furniture shows its name; unowned shows a hint and no name', () => {
  const { getByText, queryByText } = render(<Album />);
  fireEvent.click(getByText('物品圖鑑'));
  getByText('小沙發');
  expect(queryByText('小床')).toBeNull();
});

it('undiscovered recipes are hidden behind question marks', () => {
  const { getByText, getAllByText } = render(<Album />);
  fireEvent.click(getByText('食譜'));
  expect(getAllByText('？？？').length).toBeGreaterThan(0);
});

it('photos tab shows the empty state when there are no photos', async () => {
  const { getByText, findByText } = render(<Album />);
  fireEvent.click(getByText('回憶照片'));
  await findByText('還沒有照片，去拍一張吧');
});

it('photos tab shows the saved count and a kind label per photo', async () => {
  await idbPut('photos', 'photo-1', photo('photo-1', 'photo', 1));
  await idbPut('photos', 'stage-2', photo('stage-2', 'commemorative', 2));
  await idbPut('photos', 'legend-1', photo('legend-1', 'legend', 3));
  const { getByText, findByText } = render(<Album />);
  fireEvent.click(getByText('回憶照片'));
  await findByText('已存 2 / 200');
  getByText('熊貓照');
  getByText('成長紀念照');
  getByText('傳說卡');
});

it('deleting a photo asks first, then removes it', async () => {
  await idbPut('photos', 'photo-1', photo('photo-1', 'photo', 1));
  const { getByText, findByText, findAllByTestId, queryByText, queryAllByTestId } = render(<Album />);
  fireEvent.click(getByText('回憶照片'));
  fireEvent.click((await findAllByTestId('photo-thumb'))[0]);
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  fireEvent.click(getByText('刪除'));
  expect(confirm).toHaveBeenCalledWith('要刪掉這張照片嗎？');
  expect(queryAllByTestId('photo-thumb')).toHaveLength(1);
  confirm.mockReturnValue(true);
  fireEvent.click(getByText('刪除'));
  await findByText('還沒有照片，去拍一張吧');
  expect(queryAllByTestId('photo-thumb')).toHaveLength(0);
  expect(queryByText('已存 0 / 200')).not.toBeNull();
  confirm.mockRestore();
});

it('diary tab lists diary entries from state and archive', async () => {
  game.value = { ...game.value, diary: [{ date: '2026-10-18', text: '今天的日記', sticker: null }] };
  await idbPut('archive', 'diary:2026-09-01', { date: '2026-09-01', text: '封存的日記', sticker: null });
  const { getByText, findByText } = render(<Album />);
  fireEvent.click(getByText('熊貓日記'));
  getByText('今天的日記');
  await findByText('封存的日記');
});
