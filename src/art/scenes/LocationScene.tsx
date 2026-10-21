import type { ComponentChildren, JSX } from 'preact';
import type { Terrain, LocationSnapshot } from '../../core/state';
import { SCENE_W, SCENE_H, type HotspotDef } from '../../core/locationgen';
import { HANDMADE } from '../../content/locations/handmade';
import { HANDMADE_SCENES, TERRAIN_SCENES } from './terrains';
import { WEATHER_OVERLAYS } from './weather';
import { LANDMARK_ART } from '../landmarks';

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
/** 熊貓在場景中的水平位置（場景座標）與寬度占場景的比例。 */
const PANDA_X = 96;
/** 熊貓的繪製邊長（場景單位）；腳底在方框下緣。 */
export const PANDA_SIZE = 170;
/** 各地形前景站立的腳底 y；水面（星湖）改站在遠方的山坡上。 */
const PANDA_FOOT_Y: Record<Terrain, number> = { bamboo: 412, beach: 412, cloud: 412, snow: 412, mushroom: 412, starlake: 292 };

/** 熊貓方框（場景單位）：左上 (left, top)、邊長 PANDA_SIZE。測試與佈局共用。 */
export function pandaBox(snap: LocationSnapshot): { left: number; top: number; right: number; bottom: number } {
  const foot = PANDA_FOOT_Y[snap.kind === 'handmade' ? HANDMADE[snap.handmadeId].terrain : snap.terrain];
  return { left: PANDA_X - PANDA_SIZE / 2, top: foot - PANDA_SIZE, right: PANDA_X + PANDA_SIZE / 2, bottom: foot };
}

export interface LocationSceneProps {
  snapshot: LocationSnapshot;
  hotspots: HotspotDef[];
  onTap: (id: string) => void;
  tapped: string[];
  /** 站在地面線上的熊貓（由呼叫端以 <Panda> 提供）；略過時場景只有地標。 */
  panda?: ComponentChildren;
}

/**
 * 地點場景：外框鎖定 3/4，SVG 以 xMidYMid meet 等比縮放，熱點與熊貓以百分比定位，
 * 因此會和美術上的位置對齊。外框 touch-action: none，避免瀏覽器搶走拖曳。
 */
export function LocationScene({ snapshot, hotspots, onTap, tapped, panda }: LocationSceneProps): JSX.Element {
  const box = pandaBox(snapshot);
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
      {panda !== undefined && (
        <div
          data-testid="scene-panda"
          data-foot-y={box.bottom}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${(box.left / SCENE_W) * 100}%`,
            top: `${(box.top / SCENE_H) * 100}%`,
            width: `${(PANDA_SIZE / SCENE_W) * 100}%`,
            aspectRatio: '1 / 1',
            pointerEvents: 'none',
          }}
        >
          <div class="loc-panda-shadow" />
          <div class="loc-panda">{panda}</div>
        </div>
      )}
      {hotspots.map(h => {
        const done = tapped.includes(h.id);
        return (
          <button
            key={h.id}
            type="button"
            class="loc-hotspot"
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
            <span aria-hidden="true" class="loc-hotspot-dot">{done ? '✓' : ''}</span>
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
