import { h, render } from 'preact';
import { now } from '../../platform/clock';
import { savePhoto } from '../../platform/photos';
import { photoToBlob } from './serialize';
import { PhotoScene } from './PhotoScene';

/** 升階時自動拍一張紀念照存入相簿；同一階重複呼叫會覆蓋，不會重複。失敗靜默略過。 */
export async function commemorate(stage: number): Promise<void> {
  const title = `第 ${stage} 階`;
  const host = document.createElement('div');
  try {
    render(
      h(PhotoScene, { pose: 'celebrate', stickers: [], frameId: null, label: title, background: 'home' }),
      host,
    );
    const svg = host.querySelector('svg');
    if (!svg) return;
    const blob = await photoToBlob(svg);
    await savePhoto({ id: 'stage-' + stage, createdAt: now(), kind: 'commemorative', title, blob });
  } catch {
    // 升階照失敗時相簿只是少一張照片，不影響升階本身。
  } finally {
    render(null, host);
  }
}
