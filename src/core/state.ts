import { hash } from './rng';
import { localDate } from './time';

export const SCHEMA_VERSION = 1;

export type NeedKey = 'tummy' | 'clean' | 'mood';            // 肚子／香香／心情
export type CareKind = 'feed' | 'bath' | 'play' | 'hug';
export type Ability = 'climb' | 'dive';                       // 第一版已實作的能力
export type Terrain = 'bamboo' | 'beach' | 'cloud' | 'snow' | 'mushroom' | 'starlake';
export type Rarity = 'common' | 'shiny' | 'rainbow';
export type OutfitSlot = 'head' | 'face' | 'body' | 'hand' | 'tail';
export type RoomId = 'living' | 'bedroom';
export type FriendId = 'mianhua' | 'juzi' | 'manman' | 'gulu'; // 棉花／橘子／慢慢／咕嚕
export type HandmadeId = 'bamboo-path' | 'cloud-post' | 'shell-bay';
export type Mood = 'sleeping' | 'sleepy' | 'clingy' | 'happy' | 'normal';

export interface Outfit { head?: string; face?: string; body?: string; hand?: string; tail?: string }
export interface OutfitPreset { outfit: Outfit; pendants: string[] }

export interface PlacedItem {
  uid: string;            // `${itemId}#${n}`
  itemId: string;
  layer: 'floor' | 'wall';
  x: number; y: number;   // floor: 0..7 × 0..5；wall: x 0..7, y 0
  flipped: boolean;
}
export interface RoomState { wall: string; floor: string; placed: PlacedItem[] }

export type LocationSnapshot =
  | { kind: 'handmade'; handmadeId: HandmadeId }
  | { kind: 'generated'; generatorVersion: number; name: string; terrain: Terrain; layout: 0 | 1;
      weather: 'sunny' | 'rain' | 'fog' | 'snow' | 'rainbow'; landmarkId: string;
      resident: FriendId | 'passerby'; quirkId: string; requires: Ability | null };

export interface LocationProgress { date: string; foundHotspots: string[]; talked: boolean; treasureFound: boolean }

export interface MapNode {
  id: number; parentId: number | null; seed: number;
  status: 'open' | 'done'; secretFound: boolean;
  snapshot: LocationSnapshot;
  progress: LocationProgress | null;
  lastCompletedDate: string | null;
}

export interface DiaryEntry { date: string; text: string; sticker: string | null }
export interface Letter { id: string; date: string; from: FriendId; text: string; read: boolean }

export interface GameState {
  schemaVersion: number;
  seed: number;
  createdAt: number;
  lastSeenAt: number;
  lastDailyDate: string;                 // 'YYYY-MM-DD'
  onboardingDone: boolean;
  awakeUntil: number | null;              // 點醒熊貓後 30 分鐘內 moodOf 不回傳 sleeping
  needs: Record<NeedKey, number>;
  energy: number;
  starSand: number;
  marshmallow: number;
  growthXp: number;                       // 累積成長值
  chainLinks: number;
  freeBoxes: number;                      // 升階、里程碑、每日送的免費禮盒（可累積）
  hugLog: number[];                       // 最近一小時有效抱抱的時間戳
  feedLog: number[];                      // 最近 3 分鐘餵食的時間戳
  pokeLog: number[];                      // 最近 3 秒戳熊貓的時間戳
  inventory: Record<string, number>;      // itemId → 擁有數量（家具可多件；衣物/墜飾通常 1）
  equipped: OutfitPreset;
  presets: [OutfitPreset, OutfitPreset, OutfitPreset];
  rooms: Record<RoomId, RoomState>;
  map: { nodes: MapNode[]; nextId: number };
  completedCount: number;                 // 全域累計首次完成地點數
  storyBeats: string[];                   // 已觸發：'prologue'、'ch1'…'ch5'、'legend-20'…
  pendingBeat: string | null;             // 待播放的劇情
  friends: Record<FriendId, { points: number; chatsToday: number }>;
  recipes: string[];                      // 已發現食譜 id
  diary: DiaryEntry[];                    // 最近 60 篇
  letters: Letter[];                      // 最近 30 封
  daily: { revisitXpCount: number; freeBoxUsed: boolean; visitor: FriendId | null; visitorDone: boolean };
  milestonesClaimed: Record<string, number>; // 圖鑑類別 → 已領取的里程碑數量
  settings: { sound: boolean; lastExportAt: number | null; installHintCollapsed: boolean };
  lastVisitedSummary: { locations: string[]; foods: string[] }; // 給日記引用（前一天）
}


function placed(itemId: string, x: number, y: number): PlacedItem {
  return { uid: `${itemId}#1`, itemId, layer: 'floor', x, y, flipped: false };
}

export function createInitialState(seed: number, now: number): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    seed,
    createdAt: now,
    lastSeenAt: now,
    lastDailyDate: localDate(now),
    onboardingDone: false,
    awakeUntil: null,
    needs: { tummy: 70, clean: 70, mood: 70 },
    energy: 100,
    starSand: 100,
    marshmallow: 0,
    growthXp: 0,
    chainLinks: 0,
    freeBoxes: 0,
    hugLog: [],
    feedLog: [],
    pokeLog: [],
    inventory: {
      'food-bamboo-cake': 3,
      'food-strawberry-mochi': 2,
      'wall-default': 1,
      'floor-default': 1,
      'furn-nest': 1,
      'furn-low-table': 1,
      'furn-cushion': 1,
      'pendant-bamboo': 1,
    },
    equipped: { outfit: {}, pendants: ['pendant-bamboo'] },
    presets: [
      { outfit: {}, pendants: [] },
      { outfit: {}, pendants: [] },
      { outfit: {}, pendants: [] },
    ],
    rooms: {
      living: {
        wall: 'wall-default',
        floor: 'floor-default',
        placed: [placed('furn-nest', 1, 4), placed('furn-low-table', 4, 2), placed('furn-cushion', 2, 2)],
      },
      bedroom: { wall: 'wall-default', floor: 'floor-default', placed: [] },
    },
    map: {
      nodes: [{
        id: 1, parentId: null, seed: hash(seed, 1), status: 'open', secretFound: false,
        snapshot: { kind: 'handmade', handmadeId: 'bamboo-path' },
        progress: null, lastCompletedDate: null,
      }],
      nextId: 2,
    },
    completedCount: 0,
    storyBeats: [],
    pendingBeat: null,
    friends: {
      mianhua: { points: 0, chatsToday: 0 },
      juzi: { points: 0, chatsToday: 0 },
      manman: { points: 0, chatsToday: 0 },
      gulu: { points: 0, chatsToday: 0 },
    },
    recipes: [],
    diary: [],
    letters: [],
    daily: { revisitXpCount: 0, freeBoxUsed: false, visitor: null, visitorDone: false },
    milestonesClaimed: {},
    settings: { sound: true, lastExportAt: null, installHintCollapsed: false },
    lastVisitedSummary: { locations: [], foods: [] },
  };
}
