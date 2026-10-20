import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { Ability, GameState, MapNode, Terrain } from '../../core/state';
import { canEnter } from '../../core/mapgen';
import { nameOf, terrainOf } from '../../core/locationgen';
import { game } from '../store';
import { openOverlay } from '../nav';
import { nodePositions } from './mapLayout';

const MAP_MAX_W = 358;      // 390 手機寬 − 左右各 16px
const MIN_W = 240;
const PAD = 40;             // 內容上下留白
const TARGET = 44;          // 按鈕最小觸控區
const HALF = TARGET / 2;

const TERRAIN_ICON: Record<Terrain, string> = {
  bamboo: '🎋', beach: '🐚', cloud: '☁️', snow: '⛄', mushroom: '🍄', starlake: '🌌',
};
const ABILITY_ICON: Record<Ability, string> = { climb: '🌳', dive: '🌊' };

function mapWidth(): number {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  return Math.min(MAP_MAX_W, Math.max(MIN_W, vw - 32));
}

function useMapWidth(): number {
  const [w, setW] = useState(mapWidth);
  useEffect(() => {
    const onResize = () => setW(mapWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

function NodeButton(props: { node: MapNode; s: GameState; x: number; y: number; width: number }) {
  const { node, s, x, y, width } = props;
  const name = nameOf(node.snapshot);
  const terrain = terrainOf(node.snapshot);
  const locked = node.status === 'open' && !canEnter(s, node.id);
  const ability = node.snapshot.kind === 'generated' ? node.snapshot.requires : null;
  const stateText = node.status === 'done' ? '已完成' : locked ? '需要能力' : '可探索';
  // 地圖左半的節點把標籤放左邊，右半放右邊，同一列的標籤不會互相重疊。
  const side = x < width / 2 ? 'side-left' : 'side-right';
  const classes = ['map-node', `terrain-${terrain}`, node.status, side, locked ? 'locked' : ''].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      class={classes}
      data-testid={`map-node-${node.id}`}
      aria-label={`${name}（${stateText}）`}
      disabled={locked}
      style={{ left: `${x - HALF}px`, top: `${y - HALF}px`, minWidth: `${TARGET}px`, minHeight: `${TARGET}px` }}
      onClick={() => {
        // 已完成的地點隨時可再訪；只有「開放中但需要能力」的節點不可點。
        if (!locked) openOverlay({ kind: 'location', nodeId: node.id });
      }}
    >
      <span class="map-marker" aria-hidden="true">{locked && ability ? ABILITY_ICON[ability] : TERRAIN_ICON[terrain]}</span>
      {node.status === 'done' && (
        <span class="map-stamp" data-testid={`stamp-${node.id}`}>
          ✓{node.secretFound && <span class="map-star">★</span>}
        </span>
      )}
      {locked && (
        <span class="map-lock" aria-hidden="true">🔒</span>
      )}
      <span class="map-label">{name}</span>
    </button>
  );
}

/** 窗外：往上延伸的蜿蜒小路，節點為地點；可上下捲動（touch-action: pan-y）。 */
export function MapScreen() {
  const s = game.value;
  const width = useMapWidth();
  const scroller = useRef<HTMLDivElement>(null);

  // 開啟時捲到最下方（起點竹林小徑在底部），往上走就能看到新地點。
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const positions = nodePositions(s.map.nodes, width);
  const maxUp = -Math.min(0, ...positions.map(p => p.y));
  const height = maxUp + PAD * 2;
  const at = new Map(positions.map(p => [p.id, { x: p.x, y: PAD + maxUp + p.y }]));

  return (
    <div
      class="map-scroll"
      data-testid="map-scroll"
      ref={scroller}
      role="region"
      aria-label="窗外地圖"
      style={{ touchAction: 'pan-y', overflowY: 'auto' }}
    >
      <div class="map-field" style={{ width: `${width}px`, height: `${height}px` }}>
        <svg class="map-path" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {s.map.nodes.map(n => {
            const a = n.parentId === null ? undefined : at.get(n.parentId);
            const b = at.get(n.id);
            if (!a || !b) return null;
            const mid = (a.y + b.y) / 2;
            const d = `M ${a.x} ${a.y} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`;
            return (
              <g key={n.id}>
                <path d={d} class="map-trail-base" />
                <path d={d} class="map-trail" />
              </g>
            );
          })}
        </svg>
        {s.map.nodes.map(n => {
          const p = at.get(n.id)!;
          return <NodeButton key={n.id} node={n} s={s} x={p.x} y={p.y} width={width} />;
        })}
      </div>
    </div>
  );
}
