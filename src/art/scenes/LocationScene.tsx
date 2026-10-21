import type { ComponentChildren, JSX } from 'preact';
import type { Terrain, LocationSnapshot } from '../../core/state';
import { SCENE_W, SCENE_H, type HotspotDef } from '../../core/locationgen';
import { HANDMADE } from '../../content/locations/handmade';
import { HANDMADE_SCENES, TERRAIN_SCENES } from './terrains';
import { WEATHER_OVERLAYS } from './weather';
import { LANDMARK_ART } from '../landmarks';
import { PAL } from '../items/primitives';

/** 各地形的地面線（場景座標 y）：地標底部中心站在這條線上。 */
const GROUND_Y: Record<Terrain, number> = { bamboo: 262, beach: 300, cloud: 318, snow: 330, mushroom: 300, starlake: 276 };
const LANDMARK_SIZE = 150;

function landmarkAt(terrain: Terrain): { x: number; y: number } {
  return { x: 180, y: GROUND_Y[terrain] };
}

/** 場景鍵：生成地點為 `${terrain}-${layout}`；手工地點取其地形、版型 0。 */
export function sceneKey(snap: LocationSnapshot): `${Terrain}-${0 | 1}` {
  return snap.kind === 'handmade' ? `${HANDMADE[snap.handmadeId].terrain}-0` : `${snap.terrain}-${snap.layout}`;
}

/** 場景本體（不含熱點）：地形、地標與天氣，座標為 SCENE_W×SCENE_H。 */
export function LocationArtwork({ snapshot }: { snapshot: LocationSnapshot }): JSX.Element {
  if (snapshot.kind === 'handmade') {
    const Scene = HANDMADE_SCENES[snapshot.handmadeId];
    return <Scene />;
  }
  const Scene = TERRAIN_SCENES[sceneKey(snapshot)];
  const Landmark = LANDMARK_ART[snapshot.landmarkId];
  const Weather = WEATHER_OVERLAYS[snapshot.weather];
  const at = landmarkAt(snapshot.terrain);
  return (
    <>
      <Scene />
      {Landmark && (
        <g transform={`translate(${at.x} ${at.y})`}>
          <Landmark size={LANDMARK_SIZE} />
        </g>
      )}
      <Weather />
    </>
  );
}

const ROLE_LABEL: Record<HotspotDef['role'], string> = {
  treasure: '寶物',
  extra: '額外的寶物',
  request: '朋友的請求',
  hidden: '藏起來的東西',
  clue: '線索',
  filler: '有趣的東西',
};

const HOTSPOT_PX = 44;

export interface LocationSceneProps {
  snapshot: LocationSnapshot;
  hotspots: HotspotDef[];
  onTap: (id: string) => void;
  tapped: string[];
}

/**
 * 地點場景：外框鎖定 3/4，SVG 以 xMidYMid meet 等比縮放，熱點以百分比定位，
 * 因此熱點會和美術上的位置對齊。外框 touch-action: none，避免瀏覽器搶走拖曳。
 */
export function LocationScene({ snapshot, hotspots, onTap, tapped }: LocationSceneProps): JSX.Element {
  return (
    <div
      data-testid="location-scene"
      style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', touchAction: 'none', overflow: 'hidden', borderRadius: '16px' }}
    >
      <svg
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        role="img"
        aria-label="地點場景"
        style={{ display: 'block' }}
      >
        <LocationArtwork snapshot={snapshot} />
      </svg>
      {hotspots.map(h => {
        const done = tapped.includes(h.id);
        return (
          <button
            key={h.id}
            type="button"
            data-testid={`hotspot-${h.id}`}
            data-done={done ? 'true' : undefined}
            aria-label={done ? `${ROLE_LABEL[h.role]}（已找到）` : ROLE_LABEL[h.role]}
            onClick={() => onTap(h.id)}
            style={{
              position: 'absolute',
              left: `${(h.x / SCENE_W) * 100}%`,
              top: `${(h.y / SCENE_H) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: `${HOTSPOT_PX}px`,
              height: `${HOTSPOT_PX}px`,
              padding: 0,
              border: 0,
              background: 'transparent',
              touchAction: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: done ? PAL.goldLight : 'rgba(255,255,255,0.78)',
                border: `2px solid ${PAL.brown}`,
                color: PAL.brown,
                fontSize: '14px',
                fontWeight: 700,
                lineHeight: '20px',
                textAlign: 'center',
              }}
            >
              {done ? '✓' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 對話插圖：`'<terrain>/<landmarkId>'`（地形取版型 0 加上地標）或手工地點 id。
 * 無法辨識的 key 回傳 null，讓對話框照常顯示。
 */
export function SceneIllustration({ id }: { id: string }): JSX.Element | null {
  if (id in HANDMADE_SCENES) {
    const Scene = HANDMADE_SCENES[id as keyof typeof HANDMADE_SCENES];
    return <IllustrationFrame><Scene /></IllustrationFrame>;
  }
  const [terrain, landmarkId] = id.split('/');
  const Scene = TERRAIN_SCENES[`${terrain}-0` as keyof typeof TERRAIN_SCENES];
  if (!Scene) return null;
  const Landmark = landmarkId ? LANDMARK_ART[landmarkId] : undefined;
  const at = landmarkAt(terrain as Terrain);
  return (
    <IllustrationFrame>
      <Scene />
      {Landmark && (
        <g transform={`translate(${at.x} ${at.y})`}>
          <Landmark size={LANDMARK_SIZE} />
        </g>
      )}
    </IllustrationFrame>
  );
}

function IllustrationFrame({ children }: { children?: ComponentChildren }): JSX.Element {
  return (
    <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%" role="img" aria-label="場景插圖" style={{ display: 'block' }}>
      {children}
    </svg>
  );
}
