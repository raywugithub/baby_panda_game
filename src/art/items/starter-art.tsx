import type { JSX } from 'preact';

// 物品圖皆以 100×100 的座標繪製，以中心對齊 (0,0)，實際大小由 size 決定。
function frame(size: number, children: JSX.Element): JSX.Element {
  return (
    <svg x={-size / 2} y={-size / 2} width={size} height={size} viewBox="0 0 100 100" overflow="visible">
      {children}
    </svg>
  );
}

/** 竹葉墜飾：細繩、綠色雙葉與小鈴鐺。 */
export function BambooPendant({ size }: { size: number }): JSX.Element {
  return frame(size, (
    <>
      <line x1={50} y1={0} x2={50} y2={22} stroke="var(--ink)" stroke-width={2} />
      <ellipse cx={38} cy={30} rx={12} ry={5} transform="rotate(-30 38 30)" fill="#7FA66A" />
      <ellipse cx={62} cy={30} rx={12} ry={5} transform="rotate(30 62 30)" fill="#5E8C52" />
      <circle cx={50} cy={72} r={11} fill="var(--chain)" />
      <circle cx={50} cy={80} r={2} fill="var(--ink)" />
    </>
  ));
}

/** 小窩（房間預覽用）。 */
export function NestArt({ size }: { size: number }): JSX.Element {
  return frame(size, (
    <>
      <ellipse cx={50} cy={68} rx={46} ry={22} fill="var(--fur-shade)" />
      <ellipse cx={50} cy={62} rx={34} ry={14} fill="var(--fur)" />
    </>
  ));
}

/** 矮桌（房間預覽用）。 */
export function LowTableArt({ size }: { size: number }): JSX.Element {
  return frame(size, (
    <>
      <rect x={4} y={34} width={92} height={14} rx={4} fill="var(--amber)" />
      <rect x={12} y={48} width={6} height={44} fill="var(--amber)" />
      <rect x={82} y={48} width={6} height={44} fill="var(--amber)" />
    </>
  ));
}

/** 竹編坐墊（房間預覽用）。 */
export function CushionArt({ size }: { size: number }): JSX.Element {
  return frame(size, (
    <ellipse cx={50} cy={58} rx={42} ry={30} fill="var(--chain)" />
  ));
}
