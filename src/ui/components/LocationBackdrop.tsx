import type { JSX } from 'preact';
import { game } from '../store';
import { LocationArtwork } from '../../art/scenes/LocationScene';

/**
 * 地點背景（無熱點、不接受指標事件）：供拍照覆蓋層（契約 §10.13）作為相片底圖。
 * 節點不存在時退回純色底。
 */
export function LocationBackdrop({ nodeId }: { nodeId: number }): JSX.Element {
  const node = game.value.map.nodes.find(n => n.id === nodeId);
  return (
    <svg
      data-testid="location-backdrop"
      x={0}
      y={0}
      width={400}
      height={480}
      viewBox="0 0 360 480"
      preserveAspectRatio="xMidYMid slice"
      style={{ pointerEvents: 'none' }}
    >
      {node ? <LocationArtwork snapshot={node.snapshot} /> : <rect x={0} y={0} width={360} height={480} fill="#E8DCCB" />}
    </svg>
  );
}
