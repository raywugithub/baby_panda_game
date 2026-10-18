# 熊貓成長記 — 共用介面契約

三份實作計畫共用的決策。任何計畫中的型別、函式名稱、ID 若與本文件衝突，以本文件為準。

- 規格：`docs/superpowers/specs/2026-10-18-baby-panda-game-design.md`
- 計畫 A：`2026-10-18-panda-A-foundation-home.md`（基礎與家）
- 計畫 C：`2026-10-18-panda-C-collection-decor.md`（收集與布置）
- 計畫 B：`2026-10-18-panda-B-adventure-story.md`（冒險與故事）
- **執行順序：A → C → B**。後面的計畫可以修改前面計畫建立的檔案，但不可更改本文件定義的簽名。

## 1. 工具與指令

- Node 20+、npm。依賴：`preact`、`@preact/signals`、`fflate`（存檔碼壓縮）、`idb-keyval` 不使用（直接用 IndexedDB 包裝）。開發依賴：`vite`、`typescript`、`@preact/preset-vite`、`vite-plugin-pwa`、`vitest`、`jsdom`、`@testing-library/preact`、`fake-indexeddb`、`@playwright/test`。
- 測試檔與原始碼放在一起：`src/core/growth.ts` ↔ `src/core/growth.test.ts`。E2E 放 `e2e/`。
- 指令：`npm run dev`、`npm run build`、`npm test`（vitest run）、`npm run test:e2e`（playwright）、`npm run typecheck`（tsc --noEmit）。
- TypeScript `strict: true`。所有使用者看得到的文字使用繁體中文（台灣用語）。

## 2. 目錄

```
src/
  core/        純函式，不碰 DOM、不呼叫 Date.now()/Math.random()；時間 now: number（epoch ms）與種子由呼叫端傳入
  content/     純資料與型別（content/types.ts）
  art/         物品與場景的 SVG 元件（art/items/*.tsx、art/scenes/*.tsx）
  panda/       熊貓 SVG 元件
  ui/          Preact 畫面（ui/screens/*、ui/components/*、ui/store.ts、ui/nav.ts）
  platform/    storage.ts、idb.ts、audio.ts、particles.ts、pwa.ts、clock.ts
e2e/
```

## 3. 核心型別（`src/core/state.ts`，計畫 A 建立，完整欄位一次定好）

```ts
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

export function createInitialState(seed: number, now: number): GameState; // 依規格 3.4
```

## 4. 事件與結果

```ts
// src/core/events.ts（計畫 A）
export type GameEvent =
  | { type: 'reward'; xp: number; starSand: number; energy: number; chain: number; items: Record<string, number> }
  | { type: 'markUp'; mark: number }
  | { type: 'stageUp'; stage: number; title: string }
  | { type: 'slotUnlocked'; slots: number }
  | { type: 'recipeDiscovered'; recipeId: string }
  | { type: 'storyBeat'; beatId: string }
  | { type: 'friendLevelUp'; friendId: FriendId; level: number }
  | { type: 'milestone'; category: string; count: number }
  | { type: 'nodesSpawned'; ids: number[] };
export interface Outcome { state: GameState; events: GameEvent[] }

export interface Reward { xp?: number; starSand?: number; energy?: number; chain?: number; items?: Record<string, number>; marshmallow?: number }
```

## 5. 核心函式（擁有者 → 簽名）

| 擁有者 | 檔案 | 簽名 |
|---|---|---|
| A | `core/rng.ts` | `mulberry32(seed: number): () => number`；`hash(...parts: (number \| string)[]): number`（32 位元，FNV-1a）；`pick<T>(rand: () => number, arr: readonly T[]): T`；`chance(rand, p: number): boolean` |
| A | `core/time.ts` | `localDate(now: number): string`；`applyElapsed(s: GameState, now: number): GameState`（衰減、元氣回復、72h 上限、負值為 0，更新 lastSeenAt）；`isNewDay(s, now): boolean` |
| A | `core/daily.ts` | `type DailyHandler = (s: GameState, today: string, now: number) => GameState`；`export const dailyHandlers: DailyHandler[]`；`runDaily(s, now): GameState`（日期 > lastDailyDate 才執行） |
| A | `core/rewards.ts` | `applyReward(s: GameState, r: Reward): Outcome`（處理刻度、升階＋送 freeBoxes、項圈欄位事件） |
| A | `core/growth.ts` | `markCost(n: number): number`；`marksForXp(xp: number): number`；`stageForMarks(marks: number): number`；`stageTitle(seed: number, stage: number): string`；`shineTier(stage: number): number`；`pendantSlots(chainLinks: number): number`；`abilitiesForStage(stage: number): Ability[]`；`currentStage(s: GameState): number` |
| A | `core/care.ts` | `care(s: GameState, kind: CareKind, now: number): Outcome`；`isEffective(s, kind, now): boolean`；`feed(s, foodId: string, now): Outcome`（扣食物、呼叫 care）；`cook(s, a: string, b: string, now): Outcome & { result: string }`（回傳食譜 id 或 `'mystery'`）；`shouldHiccup(s, now): boolean` |
| A | `core/mood.ts` | `moodOf(s: GameState, now: number, justOpenedAfterMs: number \| null): Mood` |
| A | `core/save.ts` | `serialize(s): string`；`parseSave(raw: string): GameState \| null`（驗證）；`migrate(obj: unknown): GameState \| 'too-new' \| null`；`encodeSaveCode(s): string`；`decodeSaveCode(code: string): GameState \| null` |
| A | `core/diary.ts` | `makeDiaryEntry(s, today: string): DiaryEntry`（句庫 `content/diary.ts`） |
| C | `core/catalog.ts` | `getItem(id: string): ItemDef`；`giftPool(rarity: Rarity): ItemDef[]` |
| C | `core/giftbox.ts` | `openGiftBox(s, rand: () => number): Outcome & { itemId: string; duplicate: boolean }`（先用 daily 免費 → freeBoxes → 50 星砂）；`canOpen(s): boolean`；`GIFT_RATES` |
| C | `core/shop.ts` | `buy(s, itemId: string): Outcome \| null` |
| C | `core/wardrobe.ts` | `equip(s, slot: OutfitSlot, itemId: string \| null): GameState`；`setPendants(s, ids: string[]): GameState`；`savePreset(s, i: 0\|1\|2)`；`loadPreset(s, i)` |
| C | `core/pendants.ts` | `interface Modifiers { starSandPct: Partial<Record<Terrain, number>>; extraTreasure: Terrain[]; minigameStarSandPct: number; diaryDream: boolean; ingredientChancePct: number; affinityBonus: number }`；`pendantModifiers(s: GameState): Modifiers` |
| C | `core/room.ts` | `canPlace(room: RoomState, item: ItemDef, x, y, layer): boolean`；`place(s, roomId, itemId, x, y): GameState \| null`；`move(...)`；`flip(...)`；`stow(...)` |
| C | `core/milestones.ts` | `checkMilestones(s): Outcome` |
| B | `core/mapgen.ts` | `GENERATOR_VERSION = 1`；`spawnChildren(s, parentId: number): Outcome`；`ensureEnterable(s): GameState`；`canEnter(s, nodeId): boolean` |
| B | `core/locationgen.ts` | `generateSnapshot(seed: number, abilitiesImplemented: readonly Ability[]): LocationSnapshot`；`dailyLayout(node: MapNode, date: string): LocationLayout` |
| B | `core/location.ts` | `enter(s, nodeId, now): GameState`；`tapHotspot(s, nodeId, hotspotId, now): Outcome`；`complete(s, nodeId, now): Outcome` |
| B | `core/story.ts` | `checkStory(s): Outcome`（依 completedCount 設定 pendingBeat） |
| A | `core/friendLevel.ts` | `friendLevelThreshold(level: number): number`＝`10 × (level − 1) × level`（第 n 級單級成本 20n；level 1 起於 0 點）；`levelOf(points: number): number`（滿足門檻的最大 level，最小 1） |
| B | `core/friends.ts` | 從 `core/friendLevel.ts` 重新匯出 `levelOf`；`addAffinity(s, id: FriendId, amount: number): Outcome`；`chat(s, id): Outcome` |

## 6. 內容型別（`src/content/types.ts`，計畫 A 建立型別，C 填入物品資料）

```ts
export type ItemCategory = 'furniture' | 'wall' | 'floor' | 'outfit' | 'pendant' | 'food' | 'ingredient' | 'sticker' | 'frame';
export type Interaction = 'sit' | 'sleep' | 'swing' | 'read';
export type PendantEffect =
  | { kind: 'terrainStarSand'; terrain: Terrain; pct: number }
  | { kind: 'terrainExtraTreasure'; terrain: Terrain }
  | { kind: 'minigameStarSand'; pct: number }
  | { kind: 'diaryDream' }
  | { kind: 'ingredientChance'; pct: number }
  | { kind: 'affinityBonus'; amount: number };
export interface ItemDef {
  id: string; name: string; category: ItemCategory; rarity: Rarity;
  inGiftPool: boolean;
  size?: { w: number; h: number };      // furniture
  wallMounted?: boolean;                 // furniture 掛牆
  interaction?: Interaction;
  slot?: OutfitSlot;                     // outfit
  pendant?: PendantEffect;               // pendant
  sound?: string;                        // pendant 叮噹音色 id
  hint: string;                          // 圖鑑剪影提示
}
export interface FoodDef { id: string; name: string; reaction: 'patBelly' | 'blush' | 'sour' | 'starEyes' | 'mystery' | 'yum' }
export interface RecipeDef { id: string; name: string; inputs: [string, string]; reaction: FoodDef['reaction'] }
```

- ID 前綴：家具 `furn-`、牆紙 `wall-`、地板 `floor-`、衣物 `outfit-`、墜飾 `pendant-`、食物 `food-`、食材 `ing-`、食譜 `recipe-`、貼紙 `sticker-`、相框 `frame-`。
- 計畫 A 建立：`content/foods.ts`（4 種基本食物＋謎之料理）、`content/ingredients.ts`（6 種食材）、`content/recipes.ts`（12 道）、初始狀態需要的最少物品（`wall-default`、`floor-default`、`furn-nest`、`furn-low-table`、`furn-cushion`、`pendant-bamboo`）放在 `content/items/starter.ts`。計畫 C 建立其餘物品並合併為 `content/items/index.ts` 的 `ITEMS: ItemDef[]`。
- 初始裝備的 `pendant-bamboo` 效果：`{ kind: 'terrainStarSand', terrain: 'bamboo', pct: 20 }`。

## 7. UI 骨架（計畫 A）

```ts
// ui/store.ts
export const game: Signal<GameState>;
export function commit(outcome: Outcome | GameState): void; // 寫入 signal、排程存檔、把 events 推入 eventQueue
export const eventQueue: Signal<GameEvent[]>;
export function consumeEvents(): GameEvent[];
export const readOnly: Signal<boolean>;

// ui/nav.ts
export type Tab = 'home' | 'map' | 'closet' | 'giftbox' | 'album';
export type Overlay =
  | { kind: 'settings' }
  | { kind: 'dialogue'; scriptId: string }
  | { kind: 'location'; nodeId: number }
  | { kind: 'photo'; context: 'home' | { nodeId: number } }
  | { kind: 'welcome' };
export const tab: Signal<Tab>; export const overlay: Signal<Overlay | null>;
export function goTab(t: Tab): void; export function openOverlay(o: Overlay): void; export function closeOverlay(): void;

// ui/screens/registry.ts —— 各計畫在此登記畫面元件；A 先放佔位畫面
export const TAB_SCREENS: Record<Tab, ComponentType>;
export const OVERLAY_SCREENS: Partial<Record<Overlay['kind'], ComponentType<{ overlay: Overlay }>>>;
```

- 對話元件（計畫 A）：`<Dialogue scriptId />`，腳本格式 `content/story/types.ts`：
  `interface DialogueLine { speaker: 'panda' | FriendId | 'narrator' | 'passerby'; text: string; pose?: PandaPose }`；`interface DialogueScript { id: string; lines: DialogueLine[]; illustration?: string }`；腳本登記於 `content/story/index.ts` 的 `SCRIPTS: Record<string, DialogueScript>`。A 寫 `prologue`；B 寫 `ch1`–`ch5`、小傳說模板與朋友故事線。
- 獎勵提示：`<RewardToast />`（A）消化 eventQueue 中的 reward/markUp/stageUp/slotUnlocked/recipeDiscovered；其他事件由擁有的計畫處理。

## 8. 熊貓元件（計畫 A）

```ts
export type PandaPose = 'sit' | 'armsOut' | 'hug' | 'sleep' | 'eat' | 'sour' | 'blush' | 'starEyes' | 'patBelly'
  | 'bath' | 'shake' | 'shy' | 'busyBook' | 'sneeze' | 'hideFood' | 'chase' | 'dance' | 'stare' | 'spin'
  | 'celebrate' | 'yawn' | 'clingy' | 'walk' | 'boxPeek' | 'shakeBox' | 'useSit' | 'useSleep' | 'useSwing' | 'useRead';
export interface PandaProps { pose: PandaPose; stage: number; outfit: Outfit; pendants: string[]; chainLinks: number; size?: number; onPokeArea?: (area: 'body' | 'arms' | 'collar' | 'mouth') => void }
export function Panda(props: PandaProps): JSX.Element; // src/panda/Panda.tsx
export const ANCHORS: Record<OutfitSlot | 'pendant', { x: number; y: number }>; // viewBox 0 0 200 240
```

- 衣物圖層由 `art/items` 中的元件繪製：`ITEM_ART: Record<string, ComponentType<{ size: number }>>`（`src/art/items/index.tsx`，A 建立並放入 starter 物品的圖，C 補齊）。

## 9. 平台（計畫 A）

- `platform/idb.ts`：資料庫 `panda-db` 版本 1，儲存區 `backups`、`archive`、`photos` **一次建好**。`idbGet/idbPut/idbDelete/idbKeys(store)`。
- `platform/storage.ts`：`loadGame(now): Promise<{ state: GameState; restored: boolean; readOnly: boolean }>`；`saveGame(s): void`（同步寫 localStorage `panda.save`）；`flushOnHide()`；`maybeBackup(s, now)`。
- `platform/audio.ts`：`sfx(name: SfxName): void`；`unlockAudio(): void`；`SfxName = 'pop' | 'munch' | 'giggle' | 'snore' | 'jingle' | 'splash' | 'sparkle' | 'whoosh' | 'boing' | 'tada'`。
- `platform/particles.ts`：`burst(kind: 'hearts' | 'bubbles' | 'stars' | 'water', x: number, y: number, count?: number): void`（上限 60，DPR ≤ 2）。
- `platform/clock.ts`：`now(): number`（唯一呼叫 Date.now 的地方）；`randomSeed(): number`。
- `platform/pwa.ts`：`updateAvailable: Signal<boolean>`；`applyUpdate(): Promise<void>`（先 saveGame + 備份）；`isStandalone(): boolean`；`isIOS(): boolean`。

## 10. 交叉審查後追加的決策（優先於各計畫內容）

1. **食物 ID**：`content/foods.ts`（A）另外匯出 `FOOD_IDS`（不含謎之料理）；`content/ingredients.ts`（A）匯出 `INGREDIENT_IDS`。星空蘋果 id 為 `food-starry-apple`。食材稀有度：4 種 common、2 種 shiny。
2. **物品索引**：`content/items/index.ts` 由 A 建立並匯出 `ITEMS` 與 `ITEM_BY_ID`；C **修改**此檔加入其餘物品，必須保留 `ITEM_BY_ID`，並直接使用 A 的 `INGREDIENTS`（已是 ItemDef），不另外衍生。A 的 starter 中 `furn-nest`、`furn-low-table`、`furn-cushion` 設為 `inGiftPool: true`；`wall-default`、`floor-default`、`pendant-bamboo` 為 false。A **不建立任何貼紙**；貼紙一律為 C 的 `sticker-01`…`sticker-24`，日記貼紙回應從 C 的 `STICKER_ITEMS` 挑選（A 先以 `ITEMS.filter(i => i.category === 'sticker')` 讀取，C 執行前為空清單時隱藏貼紙按鈕）。
3. **朋友專屬家具**：id 為 `furn-<friendId>-<k>`（k = 1..3，例如 `furn-juzi-1`），由 C 定義於目錄（不在禮盒池），**只由 B 的 `addAffinity` 在等級 3／6／10 發放**；C 的 `checkMilestones` 不發放朋友家具。
4. **好感度等級**：唯一實作在 A 的 `core/friendLevel.ts`（見第 5 節）。例：`levelOf(0)=1`、`levelOf(19)=1`、`levelOf(20)=2`、`levelOf(59)=2`、`levelOf(60)=3`、`levelOf(120)=4`。
5. **信件**：`content/letters.ts` 屬於 A（歡迎回來信）；B 的朋友信件寫在 `content/friendLetters.ts`。歡迎回來信只由 A 的 welcomeBack 產生。核心函式不裁切 `diary`／`letters`；超過 60／30 的部分只由 `ui/store.ts` 的 `commit` 透過 `splitArchive` 移入 IndexedDB 封存。
6. **熊貓叫醒**：點睡覺中的熊貓時設定 `awakeUntil = now + 30 分鐘`；`moodOf` 第一步：`awakeUntil !== null && now < awakeUntil` 時跳過「睡覺」判斷。初始值 null。
7. **照顧面板**：不使用 overlay；餵食盤、洗澡區、玩耍選單由 Home 畫面的本地狀態開關。`Overlay` 聯集不新增 `care`。
8. **劇情播放**：A 的 App 監看 `game.value.pendingBeat`；當它不為 null 且 `overlay.value` 為 null 時，呼叫 `openOverlay({ kind: 'dialogue', scriptId: pendingBeat })`；對話關閉時清除 pendingBeat。B 負責 `ch1`–`ch5` 與小傳說腳本（小傳說 id `legend-<n>`，Dialogue 以 `resolveScript(id, seed)` 解析，A 實作 resolveScript 時先查 `SCRIPTS`，查不到且 id 以 `legend-` 開頭時呼叫 B 註冊的 `registerScriptResolver`；A 提供 `registerScriptResolver(fn: (id: string, seed: number) => DialogueScript | null): void`）。
9. **傳說卡**：B 在小傳說觸發時寫入一筆 `PhotoRecord { kind: 'legend', ... }` 到 IndexedDB `photos`（`PhotoRecord` 型別由 C 定義於 `src/platform/photos.ts`）；C 的回憶照片分頁照常讀取 photos store 即可顯示。傳說卡不計入 200 張照片上限。
10. **日記引用**：A 提供 `recordVisit(s, kind: 'locations' | 'foods', name: string): GameState`；A 的 feed 與 cook、B 的 location `complete` 都必須呼叫。
11. **日記與小遊戲的月亮鈴鐺**：A 的 `shouldHiccup` 與日記產生器讀取 `pendantModifiers(s).diaryDream`（C 執行前 A 先以 `s.equipped.pendants.includes('pendant-moon-bell')` 判斷；C 實作後改用 `pendantModifiers`）。月亮鈴鐺 id 為 `pendant-moon-bell`。
12. **食材掉落**：地點完成時掉落食材的基礎機率 30%；蘑菇墜飾的 +30% 為**加上 30 個百分點**（合計 60%）。
13. **拍照於地點**：B 的地點畫面提供「拍照」按鈕呼叫 `openOverlay({ kind: 'photo', context: { nodeId } })`，並匯出 `LocationBackdrop({ nodeId })` 元件給 C 的 PhotoOverlay 使用（C 在 B 執行前以純色背景代替）。
14. **房間 2.5D**：依規格 7.1 實作透視：地板第 0 列（最後方）縮放 0.80、第 5 列（最前方）1.00，逐列線性；家具依所在列縮放並由後往前繪製。碰撞仍以格子計算。
15. **時間**：UI 與核心都不可直接呼叫 `Date.now()`，一律使用 `platform/clock.ts` 的 `now()`。
16. **日記處理器註冊**：`core/daily.ts` 直接 import 並列出所有 daily handler（不靠副作用 import）；B 新增 handler 時修改 `core/daily.ts` 的陣列。
17. **E2E**：A 建立 `e2e/fixtures.ts` 匯出 `seedSave(page, patch: Partial<GameState>)`，在 `page.addInitScript` 中寫入 `panda.save`（預設 `onboardingDone: true`）。test id 規則：`tab-<Tab>`、`care-hug`、`care-feed`、`care-bath`、`care-play`、`tray-<itemId>`、`panda-mouth`、`panda-body`、`giftbox-open`、`layout-toggle`、`room-cell-<x>-<y>`、`placed-<uid>`、`inventory-<itemId>`、`map-node-<id>`、`hotspot-<id>`、`dialogue-next`、`overlay-close`。
18. **啟動與存檔提示**：`main.tsx` 呼叫 `navigator.storage.persist()`（try/catch）；`loadGame` 回傳 `restored: true` 時 App 顯示「已從備份還原」提示；iOS 非主畫面且已有進度時，onboarding 顯示「搬家」流程（複製存檔碼 → 加入主畫面 → 貼上）。
19. **commit 署名**：所有 commit 訊息結尾為空一行後 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
