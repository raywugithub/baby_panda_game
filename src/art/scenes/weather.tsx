import type { JSX } from 'preact';
import { PAL } from '../items/primitives';

// 天氣覆蓋層：整個 360×480 場景的半透明疊層。根元素 pointer-events: none，不擋住熱點點擊。

const NO_POINTER = { pointerEvents: 'none' } as const;

/** 晴：右上角的暖色太陽與柔和光暈。 */
function SunnyOverlay(): JSX.Element {
  return (
    <g style={NO_POINTER} data-weather="sunny">
      <defs>
        <radialGradient id="wx-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#FFF6C9" stop-opacity="0.85" />
          <stop offset="1" stop-color="#FFF6C9" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx={318} cy={44} r={92} fill="url(#wx-sun)" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line key={i} x1={318 + Math.cos(a) * 38} y1={44 + Math.sin(a) * 38} x2={318 + Math.cos(a) * 54} y2={44 + Math.sin(a) * 54}
            stroke={PAL.gold} stroke-width={3} stroke-linecap="round" opacity={0.7} />
        );
      })}
      <circle cx={318} cy={44} r={24} fill={PAL.goldLight} stroke={PAL.gold} stroke-width={2.5} opacity={0.9} />
    </g>
  );
}

/** 雨：淡藍斜線與微微變暗的天色。 */
function RainOverlay(): JSX.Element {
  const drops: [number, number][] = [[18, 20], [70, 8], [128, 32], [186, 4], [240, 26], [300, 12], [344, 40],
    [40, 90], [104, 76], [166, 98], [222, 70], [280, 92], [330, 110], [18, 160], [78, 150], [150, 170], [208, 150], [268, 166], [326, 186]];
  return (
    <g style={NO_POINTER} data-weather="rain">
      <rect x={0} y={0} width={360} height={480} fill="#5E7A93" opacity={0.12} />
      {drops.map(([x, y], i) => (
        <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 22} stroke="#7FA7C9" stroke-width={2.2} stroke-linecap="round" opacity={0.75} />
      ))}
      <ellipse cx={180} cy={470} rx={160} ry={12} fill="#9FD3E6" opacity={0.25} />
    </g>
  );
}

/** 霧：幾層半透明的白色霧帶，讓遠景變得朦朧。 */
function FogOverlay(): JSX.Element {
  return (
    <g style={NO_POINTER} data-weather="fog">
      <rect x={0} y={0} width={360} height={480} fill="#EEF2F4" opacity={0.22} />
      <path d="M-10 120 Q60 100 120 118 T260 116 T380 120 V150 H-10Z" fill="#F6F8F9" opacity={0.7} />
      <path d="M-10 230 Q70 212 140 228 T290 226 T380 232 V266 H-10Z" fill="#F6F8F9" opacity={0.62} />
      <path d="M-10 340 Q80 322 150 338 T300 334 T380 342 V376 H-10Z" fill="#F6F8F9" opacity={0.5} />
    </g>
  );
}

/** 雪：大小不一的白色雪花。 */
function SnowOverlay(): JSX.Element {
  const flakes: [number, number, number][] = [[20, 24, 3], [64, 60, 2], [112, 18, 4], [160, 52, 2.5], [208, 14, 3],
    [254, 58, 2], [300, 22, 3.5], [340, 74, 2.5], [40, 120, 2.5], [96, 140, 3.5], [150, 116, 2], [196, 150, 3],
    [246, 126, 2.5], [306, 152, 3], [14, 200, 2], [76, 212, 3], [132, 232, 2.5], [188, 204, 3], [262, 236, 2], [324, 214, 3.5],
    [36, 300, 3], [102, 316, 2], [170, 296, 3.5], [226, 318, 2.5], [290, 306, 3], [340, 330, 2]];
  return (
    <g style={NO_POINTER} data-weather="snow">
      {flakes.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={PAL.white} stroke="#B9D9EA" stroke-width={0.8} />
        </g>
      ))}
    </g>
  );
}

/** 彩虹：天空上方的一道半透明彩虹弧。 */
function RainbowOverlay(): JSX.Element {
  const bands = ['#F4B6C2', '#F6B3A8', '#E5B94E', '#A8D48C', '#8FC4E8', '#B7AEE6'];
  return (
    <g style={NO_POINTER} data-weather="rainbow">
      {bands.map((c, i) => (
        <path key={i} d={`M ${-30 + i * 6} 300 Q 180 ${-70 + i * 10} ${390 - i * 6} 300`} fill="none" stroke={c} stroke-width={7} opacity={0.55} />
      ))}
    </g>
  );
}

export const WEATHER_OVERLAYS: Record<'sunny' | 'rain' | 'fog' | 'snow' | 'rainbow', () => JSX.Element> = {
  sunny: SunnyOverlay,
  rain: RainOverlay,
  fog: FogOverlay,
  snow: SnowOverlay,
  rainbow: RainbowOverlay,
};
