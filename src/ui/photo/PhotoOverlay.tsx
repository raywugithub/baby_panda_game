import { useRef, useState } from 'preact/hooks';
import type { ComponentType } from 'preact';
import type { PandaPose } from '../../panda/poses';
import { ITEM_ART } from '../../art/items';
import { STICKER_ITEMS, FRAME_ITEMS } from '../../content/items/collectibles';
import { now, randomSeed } from '../../platform/clock';
import { savePhoto } from '../../platform/photos';
import { goTab, type Overlay } from '../nav';
import { photoToBlob } from './serialize';
import { PhotoScene, type StickerPlacement, type PhotoBackground } from './PhotoScene';

const POSES: { pose: PandaPose; label: string }[] = [
  { pose: 'sit', label: '坐好' },
  { pose: 'armsOut', label: '張手' },
  { pose: 'hug', label: '抱抱' },
  { pose: 'starEyes', label: '星星眼' },
  { pose: 'dance', label: '跳舞' },
  { pose: 'celebrate', label: '歡呼' },
];

// 點貼紙時依序落在這六個位置（以貼紙數量 % 6 取用）。
const STICKER_SPOTS: [number, number][] = [[60, 80], [320, 80], [60, 300], [320, 300], [190, 40], [190, 340]];

const SAVE_FULL = '相簿滿了（200 張）。要先刪掉一張舊照片嗎？';

function backgroundOf(o: Overlay): PhotoBackground {
  if (o.kind !== 'photo') return 'home';
  return o.context === 'home' ? 'home' : { nodeId: o.context.nodeId };
}

/** 拍照覆蓋層：選姿勢、貼貼紙、選相框，然後存進相簿（不提供下載或分享）。 */
export function PhotoOverlay({ overlay }: { overlay: Overlay }) {
  const [pose, setPose] = useState<PandaPose>('sit');
  const [stickers, setStickers] = useState<StickerPlacement[]>([]);
  const [frameId, setFrameId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [busy, setBusy] = useState(false);
  const sceneBox = useRef<HTMLDivElement>(null);
  const busyLock = useRef(false);

  function addSticker(id: string) {
    const [x, y] = STICKER_SPOTS[stickers.length % STICKER_SPOTS.length];
    setStickers(prev => [...prev, { id, x, y }]);
  }

  async function onShoot() {
    if (busyLock.current) return;
    busyLock.current = true;
    setBusy(true);
    setMessage(null);
    setFull(false);
    try {
      const svg = sceneBox.current?.querySelector('[data-testid="photo-scene"]') as SVGSVGElement | null;
      if (!svg) throw new Error('no scene');
      const blob = await photoToBlob(svg);
      const t = now();
      const result = await savePhoto({
        id: `photo-${t}-${randomSeed().toString(36)}`,
        createdAt: t,
        kind: 'photo',
        title: '熊貓照',
        blob,
      });
      if (result === 'ok') setMessage('已存進相簿');
      else if (result === 'full') setFull(true);
      else setMessage('這次沒辦法存進相簿，裝置的儲存空間可能不能用');
    } catch {
      setMessage('這次拍不成功，再試一次');
    } finally {
      busyLock.current = false;
      setBusy(false);
    }
  }

  return (
    <div class="photo-overlay">
      <div class="photo-stage" ref={sceneBox}>
        <PhotoScene
          pose={pose}
          stickers={stickers}
          frameId={frameId}
          background={backgroundOf(overlay)}
        />
      </div>

      <div class="photo-row photo-grid-3" role="group" aria-label="姿勢">
        {POSES.map(p => (
          <button
            type="button"
            key={p.pose}
            data-role="pose"
            aria-pressed={pose === p.pose}
            onClick={() => setPose(p.pose)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div class="photo-tray" role="group" aria-label="貼紙">
        {STICKER_ITEMS.map(item => {
          const Art = ITEM_ART[item.id] as ComponentType<{ size: number }> | undefined;
          return (
            <button
              type="button"
              key={item.id}
              data-role="sticker"
              aria-label={item.name}
              onClick={() => addSticker(item.id)}
            >
              {Art ? <Art size={36} /> : item.name}
            </button>
          );
        })}
      </div>

      <div class="photo-row photo-grid-4" role="group" aria-label="相框">
        <button
          type="button"
          data-role="frame"
          aria-pressed={frameId === null}
          onClick={() => setFrameId(null)}
        >
          無
        </button>
        {FRAME_ITEMS.map(item => {
          const Art = ITEM_ART[item.id] as ComponentType<{ size: number }> | undefined;
          return (
            <button
              type="button"
              key={item.id}
              data-role="frame"
              aria-label={item.name}
              aria-pressed={frameId === item.id}
              onClick={() => setFrameId(item.id)}
            >
              {Art ? <Art size={36} /> : item.name}
            </button>
          );
        })}
      </div>

      {message ? <p class="photo-toast" role="status">{message}</p> : null}

      {full ? (
        <div class="photo-modal" role="alertdialog" aria-label="相簿已滿">
          <p>{SAVE_FULL}</p>
          <div class="photo-actions">
            <button type="button" onClick={() => goTab('album')}>去相簿刪除</button>
            <button type="button" onClick={() => setFull(false)}>先不要</button>
          </div>
        </div>
      ) : null}

      <div class="photo-actions">
        <button type="button" onClick={() => setStickers([])}>清除貼紙</button>
        <button type="button" disabled={busy} onClick={onShoot}>拍照</button>
      </div>
    </div>
  );
}
