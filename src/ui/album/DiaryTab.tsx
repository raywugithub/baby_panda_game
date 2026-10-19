import { useEffect, useState } from 'preact/hooks';
import type { ComponentType } from 'preact';
import { game, commit } from '../store';
import { stickDiary } from '../../core/album';
import type { DiaryEntry } from '../../core/state';
import { idbGet, idbKeys } from '../../platform/idb';
import { STICKER_ITEMS } from '../../content/items/collectibles';
import { ITEM_ART } from '../../art/items';

interface Row { entry: DiaryEntry; archived: boolean }

/** 讀取封存的日記（每個 `diary:<date>` 鍵是一篇 DiaryEntry）；任何錯誤都回傳空陣列。 */
async function loadArchive(): Promise<DiaryEntry[]> {
  try {
    const keys = (await idbKeys('archive')).filter(k => typeof k === 'string' && k.startsWith('diary:'));
    const recs = await Promise.all(keys.map(k => idbGet<DiaryEntry>('archive', k)));
    return recs.filter((r): r is DiaryEntry => typeof r === 'object' && r !== null);
  } catch {
    return [];
  }
}

function stickerName(id: string | null): string | null {
  if (!id) return null;
  return STICKER_ITEMS.find(i => i.id === id)?.name ?? null;
}

export function DiaryTab() {
  const stateDiary = game.value.diary;
  const [archived, setArchived] = useState<DiaryEntry[]>([]);
  const [picking, setPicking] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadArchive().then(r => { if (alive) setArchived(r); });
    return () => { alive = false; };
  }, []);

  const rows: Row[] = [
    ...stateDiary.map(entry => ({ entry, archived: false })),
    ...archived.map(entry => ({ entry, archived: true })),
  ].sort((a, b) => (a.entry.date < b.entry.date ? 1 : a.entry.date > b.entry.date ? -1 : 0));

  function stick(date: string, stickerId: string | null) {
    commit(stickDiary(game.value, date, stickerId));
    setPicking(null);
  }

  return (
    <div class="album-diary">
      {rows.length === 0 && <p class="album-soon">還沒有日記</p>}
      {rows.map(({ entry, archived: isArchived }) => {
        const name = stickerName(entry.sticker);
        const Art = entry.sticker ? (ITEM_ART[entry.sticker] as ComponentType<{ size: number }> | undefined) : undefined;
        return (
          <article
            key={`${isArchived ? 'a' : 's'}-${entry.date}`}
            class="album-diary-entry"
            data-testid="diary-entry"
          >
            <header class="album-diary-head">
              <time class="album-diary-date">{entry.date}</time>
              {isArchived && <span class="album-diary-tag">封存</span>}
            </header>
            <p class="album-diary-text">{entry.text}</p>
            {name && (
              <div class="album-diary-sticker" title={name}>
                {Art ? <Art size={40} /> : null}
                <span>{name}</span>
              </div>
            )}
            {!isArchived && (
              <button
                type="button"
                class="album-diary-stick"
                aria-expanded={picking === entry.date}
                onClick={() => setPicking(picking === entry.date ? null : entry.date)}
              >
                貼貼紙
              </button>
            )}
            {!isArchived && picking === entry.date && (
              <div class="album-sticker-picker" role="group" aria-label="貼紙選擇">
                {STICKER_ITEMS.map(item => {
                  const ItemArt = ITEM_ART[item.id] as ComponentType<{ size: number }> | undefined;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      aria-label={`貼紙 ${item.name}`}
                      class="album-sticker-btn"
                      onClick={() => stick(entry.date, item.id)}
                    >
                      {ItemArt ? <ItemArt size={36} /> : item.name}
                    </button>
                  );
                })}
                {entry.sticker && (
                  <button type="button" class="album-sticker-btn album-sticker-clear" onClick={() => stick(entry.date, null)}>
                    拿掉貼紙
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
