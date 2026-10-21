import type { JSX } from 'preact';
import { game } from '../store';
import { COLLAR_CLUES } from '../../content/story/chapters';
import { nameOf, terrainOf } from '../../core/locationgen';
import type { Terrain } from '../../core/state';

/** 地形印記（SVG）：每種地形一個小圖案，印在圓形郵戳上。 */
function Motif({ terrain }: { terrain: Terrain }): JSX.Element {
  const stroke = '#6B4F3A';
  const sw = { stroke, 'stroke-width': 1.6, 'stroke-linejoin': 'round' as const, 'stroke-linecap': 'round' as const };
  switch (terrain) {
    case 'bamboo':
      return (
        <g>
          <rect x={16} y={8} width={5} height={34} rx={2} fill="#7FA66B" {...sw} />
          <rect x={27} y={14} width={5} height={28} rx={2} fill="#5E8C52" {...sw} />
          <rect x={38} y={6} width={5} height={36} rx={2} fill="#7FA66B" {...sw} />
          <path d="M21 14 Q30 8 35 16 Q28 18 21 14 Z" fill="#9CC48A" {...sw} />
          <path d="M32 26 Q40 20 46 26 Q40 30 32 26 Z" fill="#9CC48A" {...sw} />
        </g>
      );
    case 'beach':
      return (
        <g>
          <path d="M8 36 Q16 30 24 36 T40 36 T56 36" fill="none" stroke="#5FA8C9" stroke-width={3} stroke-linecap="round" />
          <path d="M8 44 Q16 38 24 44 T40 44 T56 44" fill="none" stroke="#9FD3E6" stroke-width={3} stroke-linecap="round" />
          <path d="M32 10 Q40 14 38 24 Q32 22 26 24 Q24 14 32 10 Z" fill="#F6DA8A" {...sw} />
        </g>
      );
    case 'cloud':
      return (
        <g>
          <path d="M14 36 Q8 36 9 30 Q10 24 17 25 Q18 16 27 17 Q33 10 40 17 Q50 16 50 26 Q57 27 55 34 Q54 38 48 38 L16 38 Q14 38 14 36 Z" fill="#FFFFFF" {...sw} />
          <circle cx={46} cy={12} r={4} fill="#F6DA8A" {...sw} />
        </g>
      );
    case 'snow':
      return (
        <g>
          <path d="M4 42 L20 14 L34 42 Z" fill="#B9C9D9" {...sw} />
          <path d="M20 14 L26 24 L22 23 L18 27 L14 22 Z" fill="#FFFFFF" {...sw} />
          <path d="M26 42 L42 10 L58 42 Z" fill="#A4B8CC" {...sw} />
          <path d="M42 10 L48 22 L44 21 L40 25 L36 20 Z" fill="#FFFFFF" {...sw} />
        </g>
      );
    case 'mushroom':
      return (
        <g>
          <rect x={26} y={30} width={10} height={14} rx={3} fill="#F6EEDF" {...sw} />
          <path d="M10 32 Q10 12 32 12 Q54 12 54 32 Z" fill="#E0566B" {...sw} />
          <circle cx={22} cy={22} r={3} fill="#FFFFFF" />
          <circle cx={40} cy={20} r={2.5} fill="#FFFFFF" />
          <circle cx={32} cy={28} r={2} fill="#FFFFFF" />
        </g>
      );
    case 'starlake':
      return (
        <g>
          <ellipse cx={32} cy={38} rx={22} ry={8} fill="#4A5A80" {...sw} />
          <path d="M32 6 L34.5 13 L42 13 L36 17.5 L38 25 L32 20.5 L26 25 L28 17.5 L22 13 L29.5 13 Z" fill="#F6DA8A" {...sw} />
          <circle cx={14} cy={20} r={1.8} fill="#F6DA8A" />
          <circle cx={52} cy={24} r={1.8} fill="#F6DA8A" />
        </g>
      );
  }
}

/** 地點印章：圓形郵戳，地形圖案、地名；祕密找到時多一顆星。 */
function Stamp({ id, name, terrain, secretFound }: {
  id: number; name: string; terrain: Terrain; secretFound: boolean;
}): JSX.Element {
  return (
    <div class="stamp" data-testid={`stamp-${id}`}>
      <div class="stamp-ring">
        <svg viewBox="0 0 64 52" width={64} height={52} aria-hidden="true">
          <Motif terrain={terrain} />
        </svg>
        {secretFound && <span class="stamp-star" aria-label="已找到祕密">★</span>}
      </div>
      <span class="stamp-name">{name}</span>
    </div>
  );
}

/** 地點印章分頁：每個已完成地點蓋一枚章；下方列出項圈線索（主線 ch1–ch5 觸發後顯示）。 */
export function StampsTab() {
  const s = game.value;
  const done = s.map.nodes.filter(n => n.status === 'done');
  return (
    <div class="album-stamps">
      {done.length === 0 ? (
        <p class="album-soon">還沒有蓋章，去窗外走走吧</p>
      ) : (
        <div class="stamp-grid">
          {done.map(n => (
            <Stamp
              key={n.id}
              id={n.id}
              name={nameOf(n.snapshot)}
              terrain={terrainOf(n.snapshot)}
              secretFound={n.secretFound}
            />
          ))}
        </div>
      )}

      <section class="card stamp-clues">
        <h3 class="album-group-title">項圈線索</h3>
        <ol class="clue-list">
          {COLLAR_CLUES.map((c, i) => {
            const n = i + 1;
            const found = s.storyBeats.includes(`ch${n}`);
            return (
              <li key={c.id} class={found ? 'clue' : 'clue clue-missing'} data-testid={`clue-${n}`}>
                <span class="clue-no">線索 {n}</span>
                <span class="clue-name">{found ? c.name : '還沒找到'}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

export default StampsTab;
