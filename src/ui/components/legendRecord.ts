import { idbPut } from '../../platform/idb';
import { legendScript } from '../../content/story/legends';

/**
 * 把第 n 則小傳說寫入回憶照片（傳說卡）。同 id 覆寫，故重複開啟不會重複計算。
 * 傳說卡沒有圖片，只存標題與內文；不計入 200 張照片上限。
 */
export async function recordLegend(seed: number, n: number, now: number): Promise<void> {
  const script = legendScript(seed, n);
  await idbPut('photos', `legend-${n}`, {
    id: `legend-${n}`,
    kind: 'legend',
    title: `第 ${n} 則小傳說`,
    text: script.lines.map(l => l.text).join('\n'),
    createdAt: now,
  });
}
