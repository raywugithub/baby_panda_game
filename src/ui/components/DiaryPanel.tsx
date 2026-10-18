import { useState } from 'preact/hooks';
import { game, commit } from '../store';
import { ITEMS, ITEM_BY_ID } from '../../content/items';

const STICKERS = ITEMS.filter(i => i.category === 'sticker');

/** 日記面板：顯示最新一篇，可貼一張貼紙（清單為空時不顯示按鈕）。 */
export function DiaryPanel() {
  const [picking, setPicking] = useState(false);
  const [entry] = game.value.diary;
  if (!entry) return <section class="card"><h3>日記</h3><p>還沒有日記，明天再來看看</p></section>;

  function pick(id: string) {
    const s = game.value;
    const [first, ...rest] = s.diary;
    commit({ ...s, diary: [{ ...first, sticker: id }, ...rest] });
    setPicking(false);
  }

  return (
    <section class="card">
      <h3>日記 · {entry.date}</h3>
      <p>{entry.text}</p>
      {entry.sticker ? <p class="sticker-tag">貼紙：{ITEM_BY_ID[entry.sticker]?.name ?? entry.sticker}</p> : null}
      {STICKERS.length > 0 ? (
        <button type="button" onClick={() => setPicking(p => !p)}>貼貼紙</button>
      ) : null}
      {picking ? (
        <div class="sticker-list">
          {STICKERS.map(i => (
            <button key={i.id} type="button" aria-label={i.name} onClick={() => pick(i.id)}>{i.name}</button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
