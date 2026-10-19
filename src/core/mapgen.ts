import type { Ability, GameState, HandmadeId, LocationSnapshot, MapNode } from './state';
import type { Outcome } from './events';
import { mulberry32, hash, chance } from './rng';
import { generateSnapshot } from './locationgen';
import { currentStage, abilitiesForStage } from './growth';

export { GENERATOR_VERSION } from './locationgen';

const IMPLEMENTED_ABILITIES: Ability[] = ['climb', 'dive'];

/** 手工地點的固定順序：竹林小徑 → 雲朵郵局 → 貝殼灣；貝殼灣之後才開始生成 */
const HANDMADE_NEXT: Partial<Record<HandmadeId, HandmadeId>> = {
  'bamboo-path': 'cloud-post',
  'cloud-post': 'shell-bay',
};

/** 若父節點尚無子節點，依規則生成子節點（決定性）；回傳新狀態與事件 */
export function spawnChildren(s: GameState, parentId: number): Outcome {
  const parent = s.map.nodes.find(n => n.id === parentId);
  if (!parent || s.map.nodes.some(n => n.parentId === parentId)) return { state: s, events: [] };

  const rand = mulberry32(hash(s.seed, parentId, 'spawn'));
  const nextHandmade = parent.snapshot.kind === 'handmade' ? HANDMADE_NEXT[parent.snapshot.handmadeId] : undefined;
  const count = nextHandmade ? 1 : chance(rand, 0.5) ? 2 : 1;

  let nextId = s.map.nextId;
  const children: MapNode[] = [];
  for (let i = 0; i < count; i++) {
    const id = nextId++;
    const seed = hash(s.seed, id);
    const snapshot: LocationSnapshot = nextHandmade
      ? { kind: 'handmade', handmadeId: nextHandmade }
      : generateSnapshot(seed, IMPLEMENTED_ABILITIES);
    children.push({
      id, parentId, seed, status: 'open', secretFound: false,
      snapshot, progress: null, lastCompletedDate: null,
    });
  }

  const state = ensureEnterable({ ...s, map: { nodes: [...s.map.nodes, ...children], nextId } });
  return { state, events: [{ type: 'nodesSpawned', ids: children.map(c => c.id) }] };
}

/** 目前是否可進入該地點；手工地點恆可進入 */
export function canEnter(s: GameState, nodeId: number): boolean {
  const node = s.map.nodes.find(n => n.id === nodeId);
  if (!node) return false;
  if (node.snapshot.kind === 'handmade') return true;
  const requires = node.snapshot.requires;
  return requires === null || abilitiesForStage(currentStage(s)).includes(requires);
}

/** 確保至少一個開放地點可進入；否則解除最新生成地點的能力門檻 */
export function ensureEnterable(s: GameState): GameState {
  const open = s.map.nodes.filter(n => n.status === 'open');
  if (open.some(n => canEnter(s, n.id))) return s;

  const newest = open
    .filter(n => n.snapshot.kind === 'generated')
    .reduce<MapNode | null>((best, n) => (best === null || n.id > best.id ? n : best), null);
  if (!newest) return s;

  return {
    ...s,
    map: {
      ...s.map,
      nodes: s.map.nodes.map(n =>
        n.id === newest.id && n.snapshot.kind === 'generated'
          ? { ...n, snapshot: { ...n.snapshot, requires: null } }
          : n,
      ),
    },
  };
}
