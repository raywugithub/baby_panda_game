import type { JSX } from 'preact';
import { ItemSvg, PAL, OUTLINE, Rainbow, Sparkle } from './primitives';

/** 墜飾共用的吊繩與小圈：墜飾本體畫在 y≈26 以下。 */
function Hook(): JSX.Element {
  return (
    <>
      <line x1={50} y1={0} x2={50} y2={8} {...OUTLINE} stroke-width={2} />
      <circle cx={50} cy={13} r={5} fill="none" {...OUTLINE} stroke-width={2.2} />
    </>
  );
}

/** 貝殼墜飾：扇形貝殼與放射狀紋路。 */
export function PendantShell({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <Hook />
      <path d="M50 22 C26 26 16 50 22 72 Q50 92 78 72 C84 50 74 26 50 22Z" fill={PAL.creamLight} {...OUTLINE} />
      <path d="M50 26 V82 M50 26 L30 78 M50 26 L70 78 M50 26 L40 80 M50 26 L60 80" fill="none" stroke={PAL.pinkDeep} stroke-width={1.6} />
    </ItemSvg>
  );
}

/** 蘑菇墜飾：粉色小傘蓋與白色斑點。 */
export function PendantMushroom({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <Hook />
      <path d="M18 56 Q18 26 50 26 Q82 26 82 56 Q50 62 18 56Z" fill={PAL.pinkDeep} {...OUTLINE} />
      <rect x={40} y={56} width={20} height={26} rx={6} fill={PAL.creamLight} {...OUTLINE} />
      <circle cx={34} cy={42} r={4} fill={PAL.white} />
      <circle cx={52} cy={36} r={3.5} fill={PAL.white} />
      <circle cx={66} cy={46} r={4} fill={PAL.white} />
    </ItemSvg>
  );
}

/** 雪花墜飾（閃亮）：藍色六角雪花。 */
export function PendantSnowflake({ size }: { size: number }): JSX.Element {
  const arms = [0, 60, 120];
  return (
    <ItemSvg size={size}>
      <Hook />
      <g transform="translate(50 56)">
        {arms.map(a => (
          <g key={a} transform={`rotate(${a})`}>
            <line x1={0} y1={-26} x2={0} y2={26} stroke={PAL.navyLight} stroke-width={4} stroke-linecap="round" />
            <path d="M0 -18 L-7 -24 M0 -18 L7 -24 M0 18 L-7 24 M0 18 L7 24" stroke={PAL.navyLight} stroke-width={3} stroke-linecap="round" />
          </g>
        ))}
        <circle r={5} fill={PAL.white} stroke={PAL.navyLight} stroke-width={2} />
      </g>
      <Sparkle x={84} y={28} r={3} />
    </ItemSvg>
  );
}

/** 雲朵墜飾（閃亮）：奶白色小雲。 */
export function PendantCloud({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <Hook />
      <path d="M22 72 Q10 72 14 60 Q18 48 32 52 Q34 32 52 34 Q68 34 70 50 Q84 46 86 60 Q90 72 76 72Z" fill={PAL.white} {...OUTLINE} />
      <Sparkle x={84} y={24} r={3} />
    </ItemSvg>
  );
}

/** 星星墜飾（閃亮）：金色五角星。 */
export function PendantStar({ size }: { size: number }): JSX.Element {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 30 : 13;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(50 + r * Math.cos(a) * 0.95).toFixed(2)},${(58 + r * Math.sin(a) * 0.95).toFixed(2)}`;
  }).join(' ');
  return (
    <ItemSvg size={size}>
      <Hook />
      <polygon points={pts} fill={PAL.gold} {...OUTLINE} />
      <Sparkle x={82} y={30} r={3} />
    </ItemSvg>
  );
}

/** 月亮鈴鐺（彩虹）：彩虹色鈴鐺與月牙。 */
export function PendantMoonBell({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="pendant-moon-bell" /></defs>
      <Hook />
      <path d="M24 70 Q24 30 50 30 Q76 30 76 70 Q82 76 76 78 H24 Q18 76 24 70Z" fill="url(#rb-pendant-moon-bell)" {...OUTLINE} />
      <circle cx={50} cy={86} r={6} fill={PAL.gold} {...OUTLINE} stroke-width={1.8} />
      <path d="M44 48 Q40 56 44 64" fill="none" stroke={PAL.white} stroke-width={3} stroke-linecap="round" />
    </ItemSvg>
  );
}

/** 愛心墜飾（彩虹）：彩虹色愛心。 */
export function PendantHeart({ size }: { size: number }): JSX.Element {
  return (
    <ItemSvg size={size}>
      <defs><Rainbow id="pendant-heart" /></defs>
      <Hook />
      <path d="M50 84 C20 64 14 46 22 36 C30 26 46 28 50 40 C54 28 70 26 78 36 C86 46 80 64 50 84Z" fill="url(#rb-pendant-heart)" {...OUTLINE} />
      <path d="M32 40 Q36 34 42 36" fill="none" stroke={PAL.white} stroke-width={3} stroke-linecap="round" />
    </ItemSvg>
  );
}
