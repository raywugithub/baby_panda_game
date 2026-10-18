import type { JSX } from 'preact';
import { chainThickness } from '../core/growth';

// 項圈弧線（二次貝茲）：沿頸部由左至右。
const P0 = [64, 118] as const;
const P1 = [100, 150] as const;
const P2 = [136, 118] as const;
const ARC_D = `M ${P0[0]} ${P0[1]} Q ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`;
const MAX_DRAWN_LINKS = 24;

function pointAt(t: number): [number, number] {
  const u = 1 - t;
  return [
    u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0],
    u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1],
  ];
}

/** 曲線在 t 處的切線角度（度），讓鏈環沿弧線排列。 */
function tangentDeg(t: number): number {
  const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
  const dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** 金色項圈與鏈環；最多畫 24 環，超過以 ×N 文字表示。 */
export function Collar({ links, thickness = chainThickness(links) }: {
  links: number; thickness?: number;
}): JSX.Element {
  const width = 2 + 0.6 * thickness;
  const drawn = Math.min(links, MAX_DRAWN_LINKS);
  return (
    <g data-part="collar" fill="none">
      <path d={ARC_D} stroke="var(--chain)" stroke-width={width} stroke-linecap="round" />
      <path
        d={ARC_D}
        stroke="var(--chain-light)"
        stroke-width={Math.max(1, width / 3)}
        stroke-linecap="round"
        opacity={Math.min(0.2 + 0.1 * thickness, 0.7)}
      />
      {Array.from({ length: drawn }, (_, i) => {
        const t = drawn === 1 ? 0.5 : i / (drawn - 1);
        const [x, y] = pointAt(t);
        return (
          <ellipse
            key={i}
            data-part="link"
            cx={x}
            cy={y}
            rx={2.6}
            ry={1.6}
            transform={`rotate(${tangentDeg(t)} ${x} ${y})`}
            stroke="var(--chain)"
            stroke-width={1.2}
          />
        );
      })}
      {links > MAX_DRAWN_LINKS ? (
        <text data-part="link-count" x={152} y={126} font-size={9} fill="var(--amber)">
          {`×${links}`}
        </text>
      ) : null}
    </g>
  );
}
