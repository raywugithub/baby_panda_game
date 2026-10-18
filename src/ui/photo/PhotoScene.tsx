import type { JSX } from 'preact';
import type { ComponentType } from 'preact';
import { Panda } from '../../panda/Panda';
import type { PandaPose } from '../../panda/poses';
import { ITEM_ART } from '../../art/items';
import { currentStage } from '../../core/growth';
import { game } from '../store';

export interface StickerPlacement { id: string; x: number; y: number }

export type PhotoBackground = 'home' | 'plain' | { nodeId: number };

export interface PhotoSceneProps {
  pose: PandaPose;
  stickers: StickerPlacement[];
  frameId: string | null;
  label?: string;
  background: PhotoBackground;
}

const FONT_STACK = '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
const PLAIN = '#E8DCCB';
const STICKER_SIZE = 56;
const FRAME_SIZE = 480;

// Plan B 的 LocationBackdrop 可能尚未存在，因此以 glob 偵測；找不到時退回純色底。
type BackdropComponent = (props: { nodeId: number }) => JSX.Element;
const backdropModules = import.meta.glob('/src/**/LocationBackdrop.tsx', { eager: true }) as Record<
  string,
  { LocationBackdrop?: BackdropComponent }
>;
const LocationBackdrop: BackdropComponent | null = Object.values(backdropModules)[0]?.LocationBackdrop ?? null;

function Backdrop({ background }: { background: PhotoBackground }): JSX.Element {
  if (background === 'home') {
    return (
      <g data-testid="photo-backdrop-home">
        <rect x={0} y={0} width={400} height={340} fill="#F7EBD9" />
        <rect x={0} y={340} width={400} height={140} fill="#E4CFA9" />
      </g>
    );
  }
  if (typeof background === 'object' && LocationBackdrop) {
    return <LocationBackdrop nodeId={background.nodeId} />;
  }
  return <rect data-testid="photo-backdrop-plain" x={0} y={0} width={400} height={480} fill={PLAIN} />;
}

/** 拍照用的 SVG 場景（viewBox 0 0 400 480）：背景、熊貓、貼紙、相框、文字。 */
export function PhotoScene({ pose, stickers, frameId, label, background }: PhotoSceneProps): JSX.Element {
  const s = game.value;
  const Frame = frameId ? (ITEM_ART[frameId] as ComponentType<{ size: number }> | undefined) : undefined;
  return (
    <svg
      data-testid="photo-scene"
      viewBox="0 0 400 480"
      width="100%"
      role="img"
      aria-label="熊貓照片"
      font-family={FONT_STACK}
    >
      <Backdrop background={background} />
      <g transform="translate(20 40)">
        <Panda
          pose={pose}
          stage={currentStage(s)}
          outfit={s.equipped.outfit}
          pendants={s.equipped.pendants}
          chainLinks={s.chainLinks}
          size={360}
        />
      </g>
      {/* ItemSvg 以自身原點為中心，所以這裡直接平移到中心點。 */}
      {stickers.map((st, i) => {
        const Art = ITEM_ART[st.id] as ComponentType<{ size: number }> | undefined;
        return Art ? (
          <g key={i} transform={`translate(${st.x} ${st.y})`}>
            <Art size={STICKER_SIZE} />
          </g>
        ) : null;
      })}
      {Frame ? (
        <g transform="translate(200 240)">
          <Frame size={FRAME_SIZE} />
        </g>
      ) : null}
      {label ? (
        <text x={200} y={462} text-anchor="middle" font-size={22} fill="#5B4636">{label}</text>
      ) : null}
    </svg>
  );
}
