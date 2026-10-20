import { useEffect, useState } from 'preact/hooks';
import { listPhotos, deletePhoto, type PhotoRecord } from '../../platform/photos';
import { PHOTO_CAP } from '../../core/album';

/** 傳說卡沒有圖片，只有標題與內文（text）；照片則帶 blob。 */
type Card = Omit<PhotoRecord, 'blob'> & { blob?: Blob; text?: string };
interface Shown { rec: Card; url: string | null }

const KIND_LABEL: Record<PhotoRecord['kind'], string> = {
  photo: '熊貓照',
  commemorative: '成長紀念照',
  legend: '傳說卡',
};

/** 回憶照片：縮圖格，點一下看大圖並可刪除；物件 URL 在卸載或重新載入時釋放。 */
export function PhotosTab() {
  const [items, setItems] = useState<Shown[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<Shown | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const made: string[] = [];
    listPhotos().then(recs => {
      if (cancelled) return;
      const shown = (recs as Card[]).map(rec => {
        if (!rec.blob) return { rec, url: null };
        const url = URL.createObjectURL(rec.blob);
        made.push(url);
        return { rec, url };
      });
      setItems(shown);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
      made.forEach(u => URL.revokeObjectURL(u));
    };
  }, [version]);

  async function remove(s: Shown) {
    if (!window.confirm('要刪掉這張照片嗎？')) return;
    setError('');
    try {
      await deletePhoto(s.rec.id);
    } catch {
      // 刪除失敗：保留大圖與提示，讓使用者再試一次。
      setError('刪不掉，再試一次');
      return;
    }
    setOpen(null);
    setVersion(v => v + 1);
  }

  // 傳說卡不計入 200 張上限（契約 10.9）。
  const counted = items.filter(i => i.rec.kind === 'photo' || i.rec.kind === 'commemorative').length;

  return (
    <div class="album-photos">
      <p class="album-photo-count">已存 {counted} / {PHOTO_CAP}</p>
      {loaded && items.length === 0 ? (
        <p class="album-soon">還沒有照片，去拍一張吧</p>
      ) : (
        <div class="album-photo-grid">
          {items.map(s => (
            <button
              type="button"
              key={s.rec.id}
              class="album-photo-thumb"
              data-testid="photo-thumb"
              aria-label={`${KIND_LABEL[s.rec.kind]} ${s.rec.title}`}
              onClick={() => setOpen(s)}
            >
              {s.url !== null ? (
                <img src={s.url} alt="" />
              ) : (
                <span class="album-legend-card" aria-hidden="true">
                  <span class="album-legend-title">{s.rec.title}</span>
                  <span class="album-legend-text">{s.rec.text}</span>
                </span>
              )}
              <span class="album-photo-kind">{KIND_LABEL[s.rec.kind]}</span>
            </button>
          ))}
        </div>
      )}
      {open && (
        <div class="album-photo-modal">
          <div class="album-photo-full" role="dialog" aria-label={open.rec.title}>
            {open.url !== null ? (
              <img src={open.url} alt={open.rec.title} />
            ) : (
              <div class="album-legend-full">
                <p class="album-legend-title">{open.rec.title}</p>
                <p class="album-legend-text">{open.rec.text}</p>
              </div>
            )}
            <p class="album-photo-kind">{KIND_LABEL[open.rec.kind]}</p>
            <div class="album-photo-actions">
              <button type="button" onClick={() => { setError(''); setOpen(null); }}>關閉</button>
              <button type="button" class="album-photo-delete" onClick={() => remove(open)}>刪除</button>
            </div>
            {error && <p class="album-photo-error" role="alert">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
