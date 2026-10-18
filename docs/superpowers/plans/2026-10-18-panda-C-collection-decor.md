# Collection & Decor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the item catalog (112 items plus stickers and frames), gift box and shop economy, wardrobe and pendant modifiers, free room decoration, the Closet/GiftBox/Album screens, and photo mode with in-game album storage, on top of Plan A's foundation and home.

**Architecture:** Pure catalog and economy logic lives in `src/core/` (catalog, giftbox, shop, milestones, wardrobe, pendants, room, album) with no DOM or clock access; item art is SVG components registered in `ITEM_ART`. UI screens (Closet, GiftBox, Album, photo overlay) read and write state through the `commit()` store from Plan A, and photo output goes through an SVG-to-PNG pipeline stored in IndexedDB.

**Tech Stack:** Vite, TypeScript (strict), Preact + @preact/signals, Vitest, jsdom, @testing-library/preact, fake-indexeddb, Playwright (E2E only). No new runtime dependencies.

**Spec:** docs/superpowers/specs/2026-10-18-baby-panda-game-design.md
**Contract:** docs/superpowers/plans/2026-10-18-panda-00-shared-contract.md

Execution order: Plan A → Plan C (this) → Plan B. This plan may assume everything Plan A produces, as listed in the contract. Plan B has not been written against this plan yet; anything Plan B must honor is listed in the Self-Review section.

---

## Global Constraints

- 玩家是 9 歲女孩，文案繁體中文（台灣用語），俏皮但不幼稚（原則 5）。
- 完全沒有付費：棉花糖與星砂只能遊戲中獲得；不做任何購買入口。
- 禮盒抽選：普通 75%、✨ 閃亮 22%、🌈 彩虹 3%（開箱畫面公開顯示），稀有度內均等抽一件。
- 禮盒一個 50 星砂；每天（當地日期）第一個禮盒免費；順序：每日免費 → `freeBoxes` → 50 星砂。
- 重複物品轉棉花糖：普通 5、閃亮 15、彩虹 40；食材不算重複，直接加入數量。
- 棉花糖小舖價格：普通 20、閃亮 60、彩虹 200；只能買禮盒物品池中的物品；沒有限時、沒有輪替。
- 禮盒物品池不含冒險專屬物品與朋友專屬家具；池內可包含家具、衣物、牆紙、地板、食材與部分墜飾。
- 文案一律用「禮盒」「打開」「驚喜」；禁用「抽卡」「保底」。
- 房間地板格子 8 欄 × 6 列；牆面 8 格；家具大小只允許 1×1、2×1、2×2；不可重疊；越前方的家具畫在越上層。
- 房間布置區 `touch-action: none`；長按門檻 300ms、移動容差 8px；拖曳使用 `setPointerCapture`。
- 全域 `-webkit-touch-callout: none; user-select: none`（輸入框除外）。
- 所有按鈕觸控區 ≥ 44px；直式手機左右邊距 16px；最大寬度 480px；不產生水平捲動。
- 相簿分頁：朋友卡、物品圖鑑、食譜、地點印章、回憶照片、熊貓日記。
- 圖鑑類別與里程碑：類別為家具、衣服、墜飾；集滿 10、30、50，之後每 25 件，獲得稱號與一個免費禮盒。
- 墜飾只有加成、不懲罰；第一版 8 種，效果依規格 7.2 表。
- 拍照：6 種熊貓姿勢、24 張貼紙、6 種相框；SVG 內只能內嵌資源（不引用外部檔案或字型）；文字字型堆疊 `"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`；輸出長邊上限 1600px，失敗降為 1080px 重試一次，仍失敗顯示「這次拍不成功，再試一次」。
- 照片存入 IndexedDB `photos`，上限 200 張，滿了提示刪除舊照片。
- 存到手機：第一版不做。不得出現下載或分享照片的按鈕；保留 `photoToBlob(svg)` 函式供之後接上。
- `core/` 不呼叫 `Date.now()`、`Math.random()`；時間與亂數由呼叫端傳入。
- 墜飾音效：Web Audio 合成；音效失敗靜默略過。
- 食材掉落（契約 §10.12）：地點完成的基礎機率 30%；蘑菇墜飾加 30 個百分點，合計 60%（`ingredientDropChance`，Task 12）。
- 照片上限 200 只計非傳說卡；傳說卡 id 以 `legend-` 開頭，不計入上限（契約 §10.9，Task 24）。
- 房間 2.5D 透視（契約 §10.14）：列縮放 0.80（最後方）→ 1.00（最前方），格子碰撞仍以整數格計算（Task 16）。
- UI 取時間一律用 `platform/clock.ts` 的 `now()`；`core/` 不呼叫 `Date.now()`（契約 §10.15）。
- 每個 commit 訊息結尾為空一行後 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`（契約 §10.19）；下列各任務的 commit 步驟皆採用此 trailer。

## Review Focus

- **Touch drag on iPhone:** iOS scroll or long-press callout steals the drag, or pointer capture is lost mid-drag, leaving a piece stuck. Test: Task 17 (cancel on >8px movement, `pointercancel` snaps back) and Task 18 (component test with `setPointerCapture` stubbed).
- **Furniture dropped on an invalid cell:** overlap or out-of-bounds placement corrupts the room. Test: Task 14 (`canPlace` boundary and overlap cases) and Task 18 (invalid drop snaps back, state unchanged).
- **Double tap on 打開 charges twice:** fast double tap spends two boxes or stars. Test: Task 21 (button disabled while the box is opening, `openGiftBox` called once).
- **Photo export fails on iOS:** an external `href`, a web font, or an oversized canvas taints or breaks the output. Test: Task 23 (`assertInlineOnly` rejects external refs, `photoSize` gives 1600 then 1080).
- **Photo storage full or unavailable:** the 201st photo overwrites or throws silently. Test: Task 24 (cap at 200 returns `'full'`, IDB failure returns `'unavailable'`).
- **Over-equipping:** more pendants than the chain allows, or wrong-slot outfits. Test: Task 13 (`setPendants` and `equip` reject invalid input).
- **Wording slips:** 「抽卡」「保底」 appear in UI copy. Test: Task 21 (source scan).

---

## File Structure

Create:
- `src/content/items/furniture.ts` — 21 non-starter living-room furniture definitions (interactive ×6 included).
- `src/content/items/decor.ts` — 5 wallpaper and 5 floor definitions (starter wall/floor are in `starter.ts`).
- `src/content/items/outfits.ts` — 20 outfit definitions across 5 slots.
- `src/content/items/pendants.ts` — 7 non-starter pendant definitions with effects and sounds.
- `src/content/items/friends.ts` — 12 friend-exclusive furniture definitions (not in gift pool).
- `src/content/friendFurniture.ts` — unlock table: friend, level, item id.
- `src/content/items/collectibles.ts` — 24 sticker and 6 frame definitions.
- `src/content/items/items.test.ts` — counts, uniqueness, pool table, prefixes.
- `src/core/catalog.ts` — `getItem`, `giftPool` (re-exports A's `ITEM_BY_ID`).
- `src/core/catalog.test.ts`
- `src/core/giftbox.ts` — `GIFT_RATES`, `rollRarity`, `canOpen`, `openGiftBox`.
- `src/core/giftbox.test.ts`
- `src/core/shop.ts` — `buy`, `priceOf`.
- `src/core/shop.test.ts`
- `src/core/milestones.ts` — `milestoneThreshold`, `milestoneTitle`, `checkMilestones` (collection milestones only; friend furniture is granted by B's `addAffinity`, contract §10.3).
- `src/core/milestones.test.ts`
- `src/core/pendants.ts` — `pendantModifiers`, `pendantSoundIds`, `ingredientDropChance`.
- `src/core/pendants.test.ts`
- `src/platform/pendantSound.ts` — `PENDANT_TONES`, `playPendantSound(id)`, `playPendantSounds(ids, gapMs, play?)`.
- `src/core/wardrobe.ts` — `equip`, `setPendants`, `savePreset`, `loadPreset`.
- `src/core/wardrobe.test.ts`
- `src/core/room.ts` — `roomUnlocked`, `canPlace`, `place`, `move`, `flip`, `stow`, `setSurface`, `pickInteraction`.
- `src/core/room.test.ts`
- `src/core/album.ts` — `stickDiary`, `canSavePhoto`, `PHOTO_CAP`.
- `src/core/album.test.ts`
- `src/art/items/primitives.tsx` — `ItemSvg` wrapper (viewBox 0 0 100 100).
- `src/art/items/furniture.tsx` — art for 21 living furniture.
- `src/art/items/friendFurniture.tsx` — art for 12 friend furniture.
- `src/art/items/pendants.tsx` — art for 7 non-starter pendants.
- `src/art/items/outfits.tsx` — art for 20 outfits.
- `src/art/items/decor.tsx` — art for 5 walls and 5 floors.
- `src/art/items/food.tsx` — art for 6 ingredients.
- `src/art/items/collectibles.tsx` — art for 24 stickers and 6 frames.
- `src/art/items/art.test.tsx` — every catalog item has a rendering ITEM_ART component.
- `src/ui/room/interactions.ts` — `interactionPose(i: Interaction): PandaPose`.
- `src/ui/room/interactions.test.ts`
- `src/ui/room/dragMachine.ts` — pure long-press drag state machine.
- `src/ui/room/dragMachine.test.ts`
- `src/ui/room/perspective.ts` — `rowScale`, `cellRect`, `pixelToCell` (2.5D floor projection, contract §10.14).
- `src/ui/room/perspective.test.ts`
- `src/ui/components/RoomView.tsx` — static room renderer (wall cells, floor grid, placed items).
- `src/ui/components/RoomView.test.tsx`
- `src/ui/room/RoomEditor.tsx` — layout-mode drag, drop, snap-back, flip/stow buttons.
- `src/ui/room/RoomEditor.test.tsx`
- `src/ui/screens/Closet.tsx` — tab screen with 換裝 and 布置 segments.
- `src/ui/screens/closet/Dress.tsx` — 換裝 segment (slots, presets, spin).
- `src/ui/screens/closet/Decorate.tsx` — 布置 segment (wallpaper/floor picker, RoomEditor).
- `src/ui/screens/Closet.test.tsx`
- `src/ui/screens/GiftBox.tsx` — tab screen: 禮盒機 (opening) and 棉花糖小舖.
- `src/ui/screens/GiftBox.test.tsx`
- `src/ui/screens/giftbox/Opening.tsx` — shake-box animation and reveal.
- `src/ui/screens/giftbox/Shop.tsx` — 棉花糖小舖 list.
- `src/platform/photos.ts` — `savePhoto`, `listPhotos`, `deletePhoto`, `PhotoRecord`.
- `src/platform/photos.test.ts`
- `src/ui/photo/serialize.ts` — `serializeForPhoto`, `assertInlineOnly`, `photoSize`, `photoToBlob`.
- `src/ui/photo/serialize.test.ts`
- `src/ui/photo/PhotoScene.tsx` — composed scene: background, Panda, stickers, frame, label.
- `src/ui/photo/PhotoOverlay.tsx` — photo mode UI (poses, stickers, frames, save into album).
- `src/ui/photo/PhotoOverlay.test.tsx`
- `src/ui/photo/commemorate.ts` — stage-up commemorative photo.
- `src/ui/photo/commemorate.test.ts`
- `src/ui/album/Album.tsx` — album shell with six tabs.
- `src/ui/album/ItemsTab.tsx` — 物品圖鑑 (家具／衣服／墜飾).
- `src/ui/album/RecipesTab.tsx` — 食譜.
- `src/ui/album/PhotosTab.tsx` — 回憶照片.
- `src/ui/album/DiaryTab.tsx` — 熊貓日記 (state + archive).
- `src/ui/album/FriendCardsTab.tsx` — placeholder for Plan B.
- `src/ui/album/StampsTab.tsx` — placeholder for Plan B.
- `src/ui/album/Album.test.tsx`
- `e2e/collection.spec.ts` — Playwright regression at 390×844 and desktop.

Modify (owned by earlier plans; C only adds what is listed):
- `src/content/items/starter.ts` (A) — verify values in Task 1; no new items.
- `src/content/items/index.ts` (A creates it, contract §10.2) — Task 2: add the remaining ItemDefs to `ITEMS` and rebuild `ITEM_BY_ID` from the full list; keep the export.
- `src/art/items/index.tsx` (A creates it, contract §8) — add `ITEM_ART` entries in Tasks 4–8. Do not create a separate `index.ts` in `src/art/items/`.
- `src/ui/screens/registry.ts` (A) — register `closet`, `giftbox`, `album` tabs and `photo` overlay.
- `src/ui/store.ts` (A) — Task 26: call `checkMilestones` and the commemorate hook from `commit`.
- `src/ui/screens/Home.tsx` (A) — Task 16: render `RoomView`, idle interactive furniture, outfit from `equipped`, collar tap plays pendant tones, photo button.

Album paths (cross-review 7): all album files stay under `src/ui/album/`. Plan B replaces `src/ui/album/FriendCardsTab.tsx` and `src/ui/album/StampsTab.tsx` in place and does not create `src/ui/screens/album/`.

---

## Shared Interfaces Added by This Plan (beyond contract)

These are signatures this plan introduces. They are additions, not changes to contract signatures.

```ts
// core/room.ts
export function canPlace(room: RoomState, item: ItemDef, x: number, y: number, layer: 'floor' | 'wall', ignoreUid?: string): boolean;
// core/pendants.ts (additions to contract §5)
export function pendantSoundIds(ids: string[]): string[];          // sound ids in equipped order
export function ingredientDropChance(m: Modifiers): number;        // 30 + m.ingredientChancePct (base 30, §10.12)
// platform/pendantSound.ts
export function playPendantSounds(soundIds: string[], gapMs: number, play?: (id: string) => void): void; // i-th tone at i × gapMs
// ui/room/perspective.ts (2.5D projection, §10.14)
export function rowScale(row: number): number;                     // 0.80 + 0.20 × row / 5
export function cellRect(x: number, row: number, w?: number, h?: number): { x: number; y: number; w: number; h: number };
export function pixelToCell(px: number, py: number): { x: number; y: number } | null;
export function roomUnlocked(s: GameState, roomId: RoomId): boolean;
export function place(s: GameState, roomId: RoomId, itemId: string, x: number, y: number): GameState | null;
export function move(s: GameState, roomId: RoomId, uid: string, x: number, y: number): GameState | null;
export function flip(s: GameState, roomId: RoomId, uid: string): GameState;
export function stow(s: GameState, roomId: RoomId, uid: string): GameState;
export function setSurface(s: GameState, roomId: RoomId, surface: 'wall' | 'floor', itemId: string): GameState;
export function pickInteraction(room: RoomState, rand: () => number): { uid: string; interaction: Interaction } | null;

// core/milestones.ts
export function milestoneThreshold(k: number): number;   // k ≥ 1
export function milestoneTitle(k: number): string;

// platform/photos.ts
// kind 'legend' records (written by B) use an id starting with 'legend-' and are not counted toward PHOTO_CAP (contract §10.9).
export interface PhotoRecord { id: string; createdAt: number; kind: 'photo' | 'commemorative' | 'legend'; title: string; blob: Blob }
export function savePhoto(rec: PhotoRecord): Promise<'ok' | 'full' | 'unavailable'>;
export function listPhotos(): Promise<PhotoRecord[]>;
export function deletePhoto(id: string): Promise<void>;

// ui/photo/serialize.ts
export function serializeForPhoto(svg: SVGSVGElement): string;
export function assertInlineOnly(svgText: string): void;     // throws on external refs
export function photoSize(viewBox: { w: number; h: number }, longSide: number): { w: number; h: number };
export function photoToBlob(svg: SVGSVGElement): Promise<Blob>;

// ui/room/dragMachine.ts
export type DragResult = { type: 'none' } | { type: 'drop'; x: number; y: number } | { type: 'snapBack' };
export function createDragMachine(): {
  down(x: number, y: number, t: number): void;
  move(x: number, y: number, t: number): void;
  tick(t: number): void;
  up(valid: boolean, x: number, y: number): DragResult;
  cancel(): DragResult;
  state(): 'idle' | 'pending' | 'dragging' | 'cancelled';
};
```

Contract-compatible notes:
- `canPlace` takes an optional `ignoreUid` so `move` can test a piece against its own old position.
- `place` assigns uid `${itemId}#${n}` with `n` one greater than the largest existing n for that item across both rooms.
- Available count for placement = `inventory[itemId] − placed count of that itemId across all rooms`.

---

## Task 1: Item definitions — living furniture, decor, outfits, pendants

**Files:**
- Create: `src/content/items/furniture.ts`, `src/content/items/decor.ts`, `src/content/items/outfits.ts`, `src/content/items/pendants.ts`
- Test: `src/content/items/items.test.ts`
- Verify (do not edit unless a value differs): `src/content/items/starter.ts` (Plan A)

**Interfaces:**
- Consumes (A): `ItemDef`, `PendantEffect`, `Interaction` from `src/content/types.ts`; `STARTER_ITEMS: ItemDef[]` from `src/content/items/starter.ts`.
- Produces: `FURNITURE_ITEMS: ItemDef[]` (21), `DECOR_ITEMS: ItemDef[]` (10), `OUTFIT_ITEMS: ItemDef[]` (20), `PENDANT_ITEMS: ItemDef[]` (7).

**Starter values that must hold** (Plan A's `starter.ts`, contract §10.2; the test in this task asserts them):

| id | category | rarity | inGiftPool | size |
|---|---|---|---|---|
| furn-nest | furniture | common | true | 2×2 |
| furn-low-table | furniture | common | true | 2×1 |
| furn-cushion | furniture | common | true | 1×1 |
| wall-default | wall | common | false | — |
| floor-default | floor | common | false | — |
| pendant-bamboo | pendant | common | false | — |

`pendant-bamboo` effect: `{ kind: 'terrainStarSand', terrain: 'bamboo', pct: 20 }`, sound `'chime-bamboo'`.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/items/items.test.ts
import { describe, it, expect } from 'vitest';
import { STARTER_ITEMS } from './starter';
import { FURNITURE_ITEMS } from './furniture';
import { DECOR_ITEMS } from './decor';
import { OUTFIT_ITEMS } from './outfits';
import { PENDANT_ITEMS } from './pendants';

const all = [...STARTER_ITEMS, ...FURNITURE_ITEMS, ...DECOR_ITEMS, ...OUTFIT_ITEMS, ...PENDANT_ITEMS];

describe('task 1 item definitions', () => {
  it('living furniture non-starter count is 21 with 6 interactive', () => {
    const living = FURNITURE_ITEMS; // friend furniture lives in items/friends.ts
    expect(living.length).toBe(21);
    expect(living.filter((i) => i.interaction).length).toBe(6);
  });
  it('decor: 5 walls + 5 floors (non-starter)', () => {
    expect(DECOR_ITEMS.filter((i) => i.category === 'wall').length).toBe(5);
    expect(DECOR_ITEMS.filter((i) => i.category === 'floor').length).toBe(5);
  });
  it('outfits: 20 across 5 slots, 4 each', () => {
    expect(OUTFIT_ITEMS.length).toBe(20);
    for (const slot of ['head', 'face', 'body', 'hand', 'tail'] as const) {
      expect(OUTFIT_ITEMS.filter((i) => i.slot === slot).length).toBe(4);
    }
  });
  it('pendants: 7 non-starter, each with a unique sound id', () => {
    expect(PENDANT_ITEMS.length).toBe(7);
    const sounds = PENDANT_ITEMS.map((p) => p.sound);
    expect(new Set(sounds).size).toBe(7);
    expect(sounds.every((s) => typeof s === 'string')).toBe(true);
    expect(PENDANT_ITEMS.find((p) => p.id === 'pendant-moon-bell')?.pendant).toEqual({ kind: 'diaryDream' });
  });
  it('starter values match the contract table', () => {
    const get = (id: string) => STARTER_ITEMS.find((i) => i.id === id)!;
    expect(get('furn-nest')).toMatchObject({ rarity: 'common', inGiftPool: true, size: { w: 2, h: 2 } });
    expect(get('furn-low-table')).toMatchObject({ inGiftPool: true, size: { w: 2, h: 1 } });
    expect(get('furn-cushion')).toMatchObject({ inGiftPool: true, size: { w: 1, h: 1 } });
    expect(get('wall-default').inGiftPool).toBe(false);
    expect(get('floor-default').inGiftPool).toBe(false);
    expect(get('pendant-bamboo')).toMatchObject({ inGiftPool: false, sound: 'chime-bamboo' });
  });
  it('every non-starter item has a non-empty hint and no duplicate ids', () => {
    const rest = all.filter((i) => !STARTER_ITEMS.includes(i));
    expect(rest.every((i) => i.hint.trim().length > 0)).toBe(true);
    expect(new Set(all.map((i) => i.id)).size).toBe(all.length);
  });
});
```

- [ ] **Step 2: Run it, expected FAIL**

Run: `npx vitest run src/content/items/items.test.ts`
Expected: FAIL with module-not-found for `./furniture`, `./decor`, `./outfits`, `./pendants`.

- [ ] **Step 3: Implement the four data files**

Each file exports one `const ...: ItemDef[]` array. Rules for every entry:
- `id` uses the prefix from contract §6; `category` matches the file; `inGiftPool: true` unless stated.
- `hint` is one line in Traditional Chinese that hints without naming the item, for example `'竹林深處好像有一個會晃的東西…'`. Do not repeat the name.

Living furniture (`furniture.ts`), name | rarity | size | flags:

| id | 名稱 | rarity | size | flags |
|---|---|---|---|---|
| furn-bamboo-shelf | 竹編小架 | common | 2×1 | |
| furn-plant-pot | 小盆栽 | common | 1×1 | |
| furn-lantern | 紙燈籠 | common | 1×1 | wallMounted |
| furn-toy-box | 玩具箱 | common | 1×1 | |
| furn-rug | 小地毯 | common | 2×1 | |
| furn-bamboo-chair | 竹椅 | common | 1×1 | |
| furn-lamp | 小檯燈 | common | 1×1 | |
| furn-cabinet | 小櫃子 | common | 2×1 | |
| furn-snack-basket | 點心籃 | common | 1×1 | |
| furn-bamboo-fence | 竹籬笆 | common | 2×1 | |
| furn-mushroom-stool | 蘑菇小凳 | common | 1×1 | |
| furn-flower-vase | 花瓶 | common | 1×1 | |
| furn-sofa | 小沙發 | shiny | 2×1 | interaction `sit` |
| furn-bed | 小床 | shiny | 2×2 | interaction `sleep` |
| furn-swing | 鞦韆 | shiny | 2×2 | interaction `swing` |
| furn-reading-nook | 閱讀角椅 | shiny | 1×1 | interaction `read` |
| furn-bookshelf | 書架 | shiny | 2×1 | |
| furn-clock | 掛鐘 | shiny | 1×1 | wallMounted |
| furn-hammock | 吊床 | rainbow | 2×2 | interaction `sleep` |
| furn-beanbag | 豆袋椅 | rainbow | 1×1 | interaction `sit` |
| furn-fountain | 小噴泉 | rainbow | 2×2 | |

Sample entries (exact shape):
```ts
export const FURNITURE_ITEMS: ItemDef[] = [
  { id: 'furn-sofa', name: '小沙發', category: 'furniture', rarity: 'shiny', inGiftPool: true,
    size: { w: 2, h: 1 }, interaction: 'sit', hint: '客廳角落好像有人偷偷坐過…' },
  { id: 'furn-lantern', name: '紙燈籠', category: 'furniture', rarity: 'common', inGiftPool: true,
    size: { w: 1, h: 1 }, wallMounted: true, hint: '夜裡會亮起來的圓圓東西…' },
];
```

Decor (`decor.ts`), inGiftPool true:
- walls: `wall-bamboo` 竹影牆紙 common; `wall-cloud` 雲朵牆紙 common; `wall-stripe` 薄荷條紋 common; `wall-starnight` 星空牆紙 shiny; `wall-rainbow` 彩虹牆紙 rainbow.
- floors: `floor-wood` 木板地 common; `floor-moss` 苔蘚石板 common; `floor-tatami` 草蓆 common; `floor-cotton` 棉花地毯 shiny; `floor-starfield` 星砂地板 rainbow.
- Walls and floors have no `size`.

Outfits (`outfits.ts`), inGiftPool true, `slot` set, rarity as listed:

| slot | id | 名稱 | rarity |
|---|---|---|---|
| head | outfit-head-bamboo-hat | 竹葉帽 | common |
| head | outfit-head-bow | 蝴蝶結髮圈 | common |
| head | outfit-head-cap | 小毛帽 | shiny |
| head | outfit-head-crown | 星星小皇冠 | rainbow |
| face | outfit-face-glasses | 圓框眼鏡 | common |
| face | outfit-face-sleepmask | 小眼罩 | common |
| face | outfit-face-blush | 腮紅貼 | shiny |
| face | outfit-face-tiger | 虎紋彩繪 | rainbow |
| body | outfit-body-scarf | 小圍巾 | common |
| body | outfit-body-vest | 小背心 | common |
| body | outfit-body-raincoat | 小雨衣 | shiny |
| body | outfit-body-hanfu | 小漢服 | rainbow |
| hand | outfit-hand-fan | 竹葉扇 | common |
| hand | outfit-hand-balloon | 小氣球 | common |
| hand | outfit-hand-umbrella | 小雨傘 | shiny |
| hand | outfit-hand-flute | 竹笛 | rainbow |
| tail | outfit-tail-bow | 尾巴蝴蝶結 | common |
| tail | outfit-tail-ribbon | 緞帶 | common |
| tail | outfit-tail-fluffy | 毛絨尾套 | shiny |
| tail | outfit-tail-star | 星星尾飾 | rainbow |

Pendants (`pendants.ts`), 7 non-starter. `sound` must be unique; `inGiftPool` as shown:

| id | 名稱 | rarity | inGiftPool | pendant effect | sound |
|---|---|---|---|---|---|
| pendant-shell | 貝殼墜飾 | common | true | `{ kind: 'terrainExtraTreasure', terrain: 'beach' }` | chime-shell |
| pendant-mushroom | 蘑菇墜飾 | common | true | `{ kind: 'ingredientChance', pct: 30 }` | chime-mushroom |
| pendant-snowflake | 雪花墜飾 | shiny | true | `{ kind: 'terrainStarSand', terrain: 'snow', pct: 20 }` | chime-snow |
| pendant-cloud | 雲朵墜飾 | shiny | true | `{ kind: 'terrainExtraTreasure', terrain: 'cloud' }` | chime-cloud |
| pendant-star | 星星墜飾 | shiny | true | `{ kind: 'minigameStarSand', pct: 20 }` | chime-star |
| pendant-moon-bell | 月亮鈴鐺 | rainbow | true | `{ kind: 'diaryDream' }` | chime-moon |
| pendant-heart | 愛心墜飾 | rainbow | true | `{ kind: 'affinityBonus', amount: 1 }` | chime-heart |

- [ ] **Step 4: Run it, expected PASS**

Run: `npx vitest run src/content/items/items.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/raywu/Documents/_baby_panda_game
git add src/content/items/furniture.ts src/content/items/decor.ts src/content/items/outfits.ts src/content/items/pendants.ts src/content/items/items.test.ts
git commit -m "$(cat <<'EOF'
feat(content): add living furniture, decor, outfit and pendant definitions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Friend furniture, ingredients, stickers, frames, merged catalog

**Files:**
- Create: `src/content/items/friends.ts`, `src/content/friendFurniture.ts`, `src/content/items/collectibles.ts`
- Modify: `src/content/items/index.ts` (A creates it, contract §10.2), `src/content/items/items.test.ts` (append tests)

**Interfaces:**
- Consumes (A): `INGREDIENTS: ItemDef[]` from `src/content/ingredients.ts` (6 ItemDefs, `category: 'ingredient'`, 4 common then 2 shiny per contract §10.1; C uses them as-is and does not re-derive them); `STARTER_ITEMS`; `ITEM_BY_ID` in `src/content/items/index.ts`.
- Produces: `FRIEND_ITEMS: ItemDef[]` (12); `FRIEND_FURNITURE: { friendId: FriendId; level: number; itemId: string }[]`; `STICKER_ITEMS`, `FRAME_ITEMS`; `ITEMS: ItemDef[]` (in `index.ts`).

**Friend furniture table** (`FRIEND_FURNITURE` and `FRIEND_ITEMS`; `inGiftPool: false`, rarity `shiny` for all; unlock on friend level 3, 6, 10):

| friendId | itemId | 名稱 | size | wallMounted | level |
|---|---|---|---|---|---|
| mianhua | furn-mianhua-1 | 郵筒 | 1×1 | | 3 |
| mianhua | furn-mianhua-2 | 信件櫃 | 2×1 | | 6 |
| mianhua | furn-mianhua-3 | 郵差小推車 | 2×1 | | 10 |
| juzi | furn-juzi-1 | 糖果罐 | 1×1 | | 3 |
| juzi | furn-juzi-2 | 糖果櫃檯 | 2×1 | | 6 |
| juzi | furn-juzi-3 | 狐狸燈籠 | 1×1 | yes | 10 |
| manman | furn-manman-1 | 烏龜石 | 1×1 | | 3 |
| manman | furn-manman-2 | 故事書櫃 | 2×1 | | 6 |
| manman | furn-manman-3 | 龜殼帳篷 | 2×2 | | 10 |
| gulu | furn-gulu-1 | 發明工作台 | 2×1 | | 3 |
| gulu | furn-gulu-2 | 齒輪掛鐘 | 1×1 | yes | 6 |
| gulu | furn-gulu-3 | 小機器人 | 1×1 | | 10 |

Ingredients: no new file. Plan A's `INGREDIENTS` (`ItemDef[]`, ids `ing-*`) are already part of `ITEMS` through `index.ts`; their rarity is 4 common and 2 shiny (contract §10.1) and their hints are Plan A's.

Stickers: `sticker-01`…`sticker-24` in this order: 星星、愛心、竹葉、雲朵、月亮、蘑菇、雪花、小花、皇冠、蝴蝶結、泡泡、彩虹、小魚、貝殼、愛心眼、驚嘆號、音符、太陽、閃電、腳印、竹筍、草莓、棉花糖、禮盒. `category: 'sticker'`, `rarity: 'common'`, `inGiftPool: false`.

Frames: `frame-01`…`frame-06`: 竹框、雲框、星空框、彩虹框、蘑菇框、金邊框. `category: 'frame'`, `rarity: 'common'`, `inGiftPool: false`.

`index.ts` (A) currently has `ITEMS = [...STARTER_ITEMS, ...INGREDIENTS]` and `ITEM_BY_ID`. C edits it to `ITEMS = [...STARTER_ITEMS, ...INGREDIENTS, ...FURNITURE_ITEMS, ...FRIEND_ITEMS, ...DECOR_ITEMS, ...OUTFIT_ITEMS, ...PENDANT_ITEMS, ...STICKER_ITEMS, ...FRAME_ITEMS]`. `ITEM_BY_ID` (`Record<string, ItemDef>`, same export as A) is rebuilt from the full `ITEMS`. Do not create a second `ITEMS` source or re-derive ingredient ItemDefs.

- [ ] **Step 1: Write the failing test** (append to `items.test.ts`)

```ts
import { ITEMS } from './index';
import { FRIEND_FURNITURE } from '../friendFurniture';

describe('task 2 merged catalog', () => {
  const count = (c: string) => ITEMS.filter((i) => i.category === c).length;
  it('totals per category', () => {
    expect(count('furniture')).toBe(36);   // 24 living incl. 3 starter + 12 friend
    expect(count('wall')).toBe(6);
    expect(count('floor')).toBe(6);
    expect(count('outfit')).toBe(20);
    expect(count('pendant')).toBe(8);
    expect(count('ingredient')).toBe(6);
    expect(count('sticker')).toBe(24);
    expect(count('frame')).toBe(6);
    expect(ITEMS.length).toBe(112);
  });
  it('ids are unique and prefixed by category', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(112);
    const prefix: Record<string, string> = { furniture: 'furn-', wall: 'wall-', floor: 'floor-', outfit: 'outfit-', pendant: 'pendant-', ingredient: 'ing-', sticker: 'sticker-', frame: 'frame-' };
    for (const i of ITEMS) expect(i.id.startsWith(prefix[i.category])).toBe(true);
  });
  it('gift pool size per rarity is 37 common, 18 shiny, 12 rainbow', () => {
    // Breakdown (common/shiny/rainbow): starter 3/0/0 + living furniture 12/6/3 + decor 6/2/2
    // + outfits 10/5/5 + pendants 2/3/2 + ingredients 4/2/0 = 37/18/12 (contract §10.1, §10.2)
    const pool = ITEMS.filter((i) => i.inGiftPool);
    expect(pool.filter((i) => i.rarity === 'common').length).toBe(37);
    expect(pool.filter((i) => i.rarity === 'shiny').length).toBe(18);
    expect(pool.filter((i) => i.rarity === 'rainbow').length).toBe(12);
  });
  it('friend furniture, stickers and frames are never in the pool', () => {
    for (const i of ITEMS.filter((x) => x.id.startsWith('furn-mianhua') || x.id.startsWith('furn-juzi') || x.id.startsWith('furn-manman') || x.id.startsWith('furn-gulu') || x.category === 'sticker' || x.category === 'frame')) {
      expect(i.inGiftPool).toBe(false);
    }
  });
  it('friend furniture table has 12 entries, levels 3/6/10 per friend', () => {
    expect(FRIEND_FURNITURE.length).toBe(12);
    for (const f of ['mianhua', 'juzi', 'manman', 'gulu']) {
      expect(FRIEND_FURNITURE.filter((x) => x.friendId === f).map((x) => x.level)).toEqual([3, 6, 10]);
    }
  });
});
```

- [ ] **Step 2: Run it, expected FAIL**

Run: `npx vitest run src/content/items/items.test.ts`
Expected: FAIL (missing `./index`, `../friendFurniture`).

- [ ] **Step 3: Implement**

- `friends.ts` exports `FRIEND_ITEMS`; `friendFurniture.ts` exports `FRIEND_FURNITURE` (table above) and imports the `FriendId` type from `src/core/state.ts`.
- `FRIEND_ITEMS` entries are generated from `FRIEND_FURNITURE` with a `.map` (one line each: `{ id, name, category: 'furniture', rarity: 'shiny', inGiftPool: false, size, wallMounted?, hint }`).
- `collectibles.ts` as described above; `index.ts` as described in Files and Rules (edit A's file, keep `ITEM_BY_ID`).

- [ ] **Step 4: Run it, expected PASS**

Run: `npx vitest run src/content/items/items.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
cd /Users/raywu/Documents/_baby_panda_game
git add src/content/items src/content/friendFurniture.ts
git commit -m "$(cat <<'EOF'
feat(content): add friend furniture, ingredients, stickers, frames and merged catalog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Catalog lookup — `core/catalog.ts`

**Files:**
- Create: `src/core/catalog.ts`, `src/core/catalog.test.ts`

**Interfaces:**
- Consumes: `ITEMS` (Task 2), `ItemDef`, `Rarity` (contract).
- Produces: `getItem(id: string): ItemDef` (throws `Error('unknown item: ' + id)`); `giftPool(rarity: Rarity): ItemDef[]`. Re-exports `ITEM_BY_ID` (`Record<string, ItemDef>`) from `content/items/index.ts`; it is not rebuilt here.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/catalog.test.ts
import { describe, it, expect } from 'vitest';
import { getItem, giftPool } from './catalog';

describe('catalog', () => {
  it('getItem returns the definition', () => {
    expect(getItem('furn-sofa')).toMatchObject({ rarity: 'shiny', interaction: 'sit' });
  });
  it('getItem throws on unknown id', () => {
    expect(() => getItem('furn-nope')).toThrow('unknown item: furn-nope');
  });
  it('giftPool returns only pool items of that rarity', () => {
    const rainbow = giftPool('rainbow');
    expect(rainbow.length).toBe(12);
    expect(rainbow.every((i) => i.inGiftPool && i.rarity === 'rainbow')).toBe(true);
    expect(rainbow.some((i) => i.id.startsWith('furn-juzi'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, expected FAIL**

Run: `npx vitest run src/core/catalog.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `src/core/catalog.ts`: `export { ITEM_BY_ID } from '../content/items'`; `getItem` reads `ITEM_BY_ID[id]` and throws when missing; `giftPool` filters `ITEMS` by `inGiftPool && rarity`.

- [ ] **Step 4: Run it, expected PASS**

Run: `npx vitest run src/core/catalog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/raywu/Documents/_baby_panda_game
git add src/core/catalog.ts src/core/catalog.test.ts
git commit -m "$(cat <<'EOF'
feat(core): add catalog lookup and gift pool filter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Tasks 4–8: Item art (SVG components)

These five tasks add `ITEM_ART` entries. They share one test file and one primitive.

**Shared rules for all art tasks:**
- Every component returns `<ItemSvg size={size}>…</ItemSvg>`; the root is an inline `<svg>` with `viewBox="0 0 100 100"`, `width` and `height` equal to `size`. No `<image>`, no external `href`, no `<text>` with a web font.
- Palette: 米灰 `#E8DCCB`, 深棕 `#6B4F3A`, 竹綠 `#7FA66B`, 粉紅 `#F4B6C2`, 金 `#E5B94E`, 星空藍 `#2E3A59`, 彩虹 gradient defined inline with `<linearGradient id="rb-<itemId>">` (unique per item to avoid id collisions).
- Shiny items add one inline `<circle>` sparkle; rainbow items use the inline gradient.
- Each art component is exported under the name in its table row, and registered in `ITEM_ART` under its item id.

**Task 4 — Art: living furniture (21) and the primitive**

**Files:**
- Create: `src/art/items/primitives.tsx`, `src/art/items/furniture.tsx`, `src/art/items/art.test.tsx`
- Modify: `src/art/items/index.tsx` (add entries)

**Interfaces:**
- Consumes: `ITEMS` (Task 2); `ITEM_ART` from `src/art/items/index.tsx` (Plan A, contains starter art).
- Produces: `ItemSvg({ size, children })` in `primitives.tsx`; `ITEM_ART` entries for the 21 non-starter living furniture.

- [ ] **Step 1: Write the failing test** (`art.test.tsx`)

```tsx
// src/art/items/art.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { ITEMS } from '../../content/items';
import { ITEM_ART } from './index';

describe.each(['furniture', 'friend', 'outfit', 'pendant', 'wall', 'floor', 'ingredient', 'sticker', 'frame'])('art %s', (group) => {
  it('every item in the group has an SVG component that renders', () => {
    const match = (i: { id: string; category: string }) =>
      group === 'friend' ? i.id.startsWith('furn-mianhua') || i.id.startsWith('furn-juzi') || i.id.startsWith('furn-manman') || i.id.startsWith('furn-gulu')
      : group === 'furniture' ? i.category === 'furniture' && !/^furn-(mianhua|juzi|manman|gulu)/.test(i.id)
      : i.category === group;
    for (const item of ITEMS.filter(match)) {
      const C = ITEM_ART[item.id];
      expect(C, item.id).toBeDefined();
      const { container, unmount } = render(<C size={64} />);
      expect(container.querySelector('svg'), item.id).not.toBeNull();
      unmount();
    }
  });
});
```

Note: the `art %s` group names are the filters used in later tasks: `furniture`, `friend`, `pendant`, `outfit`, `wall`, `floor`, `ingredient`, `sticker`, `frame`. `pendant` covers the 7 non-starter pendants and the starter pendant (Task 5 will cover them).

- [ ] **Step 2: Run it, expected FAIL**

Run: `npx vitest run src/art/items/art.test.tsx -t "art furniture"`
Expected: FAIL with `expect(C, item.id).toBeDefined()` for `furn-bamboo-shelf`.

- [ ] **Step 3: Implement**
- `primitives.tsx`: `ItemSvg` as in the shared rules.
- `furniture.tsx`: 21 components, one per living furniture row (names: `BambooShelf`, `PlantPot`, `Lantern`, `ToyBox`, `Rug`, `BambooChair`, `Lamp`, `Cabinet`, `SnackBasket`, `BambooFence`, `MushroomStool`, `FlowerVase`, `Sofa`, `Bed`, `Swing`, `ReadingNook`, `Bookshelf`, `Clock`, `Hammock`, `Beanbag`, `Fountain`). Each footprint is drawn within the viewBox to match the item's size (2×1 items are wide, 2×2 fill the box).
- `index.tsx`: add `'furn-bamboo-shelf': BambooShelf` etc.

- [ ] **Step 4: Run it, expected PASS**

Run: `npx vitest run src/art/items/art.test.tsx -t "art furniture"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/raywu/Documents/_baby_panda_game
git add src/art/items
git commit -m "$(cat <<'EOF'
feat(art): add living furniture item art and item svg primitive

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

**Task 5 — Art: friend furniture (12) and non-starter pendants (7)**

**Files:** Create `src/art/items/friendFurniture.tsx`, `src/art/items/pendants.tsx`; modify `src/art/items/index.tsx`.

- [ ] **Step 1:** Test already exists in `art.test.tsx` (groups `friend` and `pendant`). Run `npx vitest run src/art/items/art.test.tsx -t "art friend"` → Expected FAIL.
- [ ] **Step 2: Implement.** 12 friend components named after each item (`MianhuaMailbox`, `MianhuaLetterCabinet`, `MianhuaCart`, `JuziCandyJar`, `JuziCounter`, `JuziFoxLantern`, `ManmanStone`, `ManmanStoryShelf`, `ManmanTent`, `GuluWorkbench`, `GuluGearClock`, `GuluRobot`). 7 pendant components drawn as small charms on a chain link; each uses its effect's visual theme (shell, mushroom, snowflake, cloud, star, moon bell, heart). Pendant art is drawn in the same 100×100 box and is positioned by Panda at `ANCHORS.pendant`.
- [ ] **Step 3: Run `npx vitest run src/art/items/art.test.tsx -t "art friend"` and `-t "art pendant"`** → Expected PASS. (`pendant` includes starter `pendant-bamboo` from Plan A.)
- [ ] **Step 4: Commit** with message `feat(art): add friend furniture and pendant item art` and the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer.

**Task 6 — Art: outfits (20)**

**Files:** Create `src/art/items/outfits.tsx`; modify `src/art/items/index.tsx`.

- [ ] **Step 1:** Run `npx vitest run src/art/items/art.test.tsx -t "art outfit"` → Expected FAIL.
- [ ] **Step 2: Implement** 20 components, one per outfit row, grouped by slot. Each draws only its slot's layer (head items sit on the top of the head area, face items over the face, body over the belly, hand items in the hand area, tail items at the back). Head items use ANCHORS.head from Plan A's `Panda`. Colors per the shared palette; rainbow items use the inline gradient.
- [ ] **Step 3: Run the same command** → Expected PASS.
- [ ] **Step 4: Commit** with message `feat(art): add outfit item art for five slots` and the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer.

**Task 7 — Art: walls (5), floors (5), ingredients (6)**

**Files:** Create `src/art/items/decor.tsx`, `src/art/items/food.tsx`; modify `src/art/items/index.tsx`.

- [ ] **Step 1:** Run `npx vitest run src/art/items/art.test.tsx -t "art wall"`, `-t "art floor"`, `-t "art ingredient"` → Expected FAIL.
- [ ] **Step 2: Implement.** Wall art is a 100×100 swatch of the wallpaper pattern (stripes, clouds, stars, rainbow gradient). Floor art is a swatch of the floor texture. Ingredient art is a single food item icon for each of the six ingredients from Plan A's `INGREDIENTS`, keyed by each item's `ing-*` id (no new ItemDefs; contract §10.2).
- [ ] **Step 3: Run the same three commands** → Expected PASS.
- [ ] **Step 4: Commit** with message `feat(art): add wallpaper, floor and ingredient item art` and the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer.

**Task 8 — Art: stickers (24) and frames (6)**

**Files:** Create `src/art/items/collectibles.tsx`; modify `src/art/items/index.tsx`.

- [ ] **Step 1:** Run `npx vitest run src/art/items/art.test.tsx -t "art sticker"` and `-t "art frame"` → Expected FAIL.
- [ ] **Step 2: Implement.** 24 sticker components (one per name in Task 2's order) and 6 frame components. Frames are drawn as a border ring with transparent center so the photo shows through; sticker and frame art has no background.
- [ ] **Step 3: Run the same two commands** → Expected PASS. Then run `npx vitest run src/art/items` → Expected PASS (all art tests).
- [ ] **Step 4: Commit** with message `feat(art): add sticker and frame item art` and the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer.

---

## Task 9: Gift box — `core/giftbox.ts`

**Files:**
- Create: `src/core/giftbox.ts`, `src/core/giftbox.test.ts`

**Interfaces:**
- Consumes (A): `GameState`, `Outcome` (contract §3–4), `mulberry32`; (C): `giftPool`, `getItem` (Task 3).
- Produces: `GIFT_RATES: Record<Rarity, number>` = `{ common: 0.75, shiny: 0.22, rainbow: 0.03 }`; `rollRarity(r: number): Rarity`; `canOpen(s: GameState): boolean`; `openGiftBox(s, rand): Outcome & { itemId: string; duplicate: boolean }`; `GIFT_COST = 50`.

Rules:
- `canOpen` is true if `!s.daily.freeBoxUsed` or `s.freeBoxes > 0` or `s.starSand >= 50`.
- `openGiftBox` with `canOpen` false returns `{ state: s, events: [], itemId: '', duplicate: false }`.
- Otherwise pay in order: free daily box (`daily.freeBoxUsed = true`) → `freeBoxes − 1` → `starSand − 50`.
- Roll rarity with `rand()`: `r < 0.75` common; `r < 0.97` shiny; else rainbow. Then pick index `Math.floor(rand() * pool.length)` from `giftPool(rarity)`.
- Duplicate: `item.category !== 'ingredient' && (inventory[id] ?? 0) > 0`. Duplicate → `marshmallow += { common: 5, shiny: 15, rainbow: 40 }[rarity]`; inventory unchanged. Ingredient or new item → `inventory[id] = (inventory[id] ?? 0) + 1`.
- Events are `[]`; milestone checks happen in `commit` (Task 26), not here.
- Do not mutate `s`; return new objects.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/giftbox.test.ts
import { describe, it, expect } from 'vitest';
import { openGiftBox, canOpen, rollRarity, GIFT_RATES } from './giftbox';
import { createInitialState } from './state';
import { mulberry32 } from './rng';

const fresh = () => createInitialState(42, 0);

describe('gift box', () => {
  it('first box of the day is free and keeps star sand', () => {
    const r = openGiftBox(fresh(), mulberry32(1));
    expect(r.state.daily.freeBoxUsed).toBe(true);
    expect(r.state.starSand).toBe(100);
  });
  it('then uses freeBoxes before star sand', () => {
    const s0 = fresh();
    const s = { ...s0, daily: { ...s0.daily, freeBoxUsed: true }, freeBoxes: 1 };
    const a = openGiftBox(s, mulberry32(1));
    expect(a.state.freeBoxes).toBe(0);
    expect(a.state.starSand).toBe(100);
    const b = openGiftBox(a.state, mulberry32(2));
    expect(b.state.starSand).toBe(50);
  });
  it('cannot open with no free box and under 50 star sand', () => {
    const s0 = fresh();
    const s = { ...s0, daily: { ...s0.daily, freeBoxUsed: true }, freeBoxes: 0, starSand: 49 };
    expect(canOpen(s)).toBe(false);
    const r = openGiftBox(s, mulberry32(1));
    expect(r.itemId).toBe('');
    expect(r.state).toBe(s);
  });
  it('rolls rarity 75/22/3 over 20000 draws (±1 point)', () => {
    const rand = mulberry32(7);
    const counts = { common: 0, shiny: 0, rainbow: 0 };
    for (let i = 0; i < 20000; i++) counts[rollRarity(rand())]++;
    expect(counts.common / 20000).toBeCloseTo(GIFT_RATES.common, 1);
    expect(counts.shiny / 20000).toBeCloseTo(GIFT_RATES.shiny, 1);
    expect(counts.rainbow / 20000).toBeCloseTo(GIFT_RATES.rainbow, 1);
  });
  it('duplicate converts to marshmallow 5/15/40 by rarity', () => {
    const s0 = fresh();
    const s = { ...s0, inventory: { ...s0.inventory } };
    // Own every item so every roll is a duplicate.
    const { ITEMS } = require('../content/items');
    for (const i of ITEMS) s.inventory[i.id] = 1;
    const r = openGiftBox(s, mulberry32(3));
    expect(r.duplicate).toBe(true);
    const delta = r.state.marshmallow - s.marshmallow;
    expect([5, 15, 40]).toContain(delta);
  });
  it('ingredient adds count and never converts', () => {
    const s0 = fresh();
    const s = { ...s0, inventory: { ...s0.inventory } };
    const { ITEMS } = require('../content/items');
    for (const i of ITEMS) if (i.category === 'ingredient') s.inventory[i.id] = 1;
    // Force an ingredient roll by checking the rule directly on a second box.
    const r = openGiftBox(s, mulberry32(11));
    if (r.itemId.startsWith('ing-')) {
      expect(r.duplicate).toBe(false);
      expect(r.state.inventory[r.itemId]).toBe(2);
    }
  });
});
```

Replace the two inline `require` lines with ES imports `import { ITEMS } from '../content/items';` when implementing. The tests above are the spec; the implementer may tidy the imports.

- [ ] **Step 2: Run it, expected FAIL**

Run: `npx vitest run src/core/giftbox.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `src/core/giftbox.ts` following the rules above.

- [ ] **Step 4: Run it, expected PASS**

Run: `npx vitest run src/core/giftbox.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/raywu/Documents/_baby_panda_game
git add src/core/giftbox.ts src/core/giftbox.test.ts
git commit -m "$(cat <<'EOF'
feat(core): add gift box rarity roll, payment order and duplicate conversion

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Marshmallow shop — `core/shop.ts`

**Files:** Create `src/core/shop.ts`, `src/core/shop.test.ts`.

**Interfaces:**
- Consumes: `GameState`, `Outcome`; `getItem` (Task 3).
- Produces: `priceOf(rarity: Rarity): number` (20/60/200); `buy(s: GameState, itemId: string): Outcome | null`.

Rules:
- `null` if `!item.inGiftPool`, or `s.marshmallow < price`, or `item.category` is `outfit`, `pendant`, `wall`, or `floor` and `inventory[id] > 0` (no duplicate wearables or surfaces).
- Furniture, ingredients may be bought repeatedly.
- On success: `inventory[id] += 1`, `marshmallow -= price`, events `[]`.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/shop.test.ts
import { describe, it, expect } from 'vitest';
import { buy, priceOf } from './shop';
import { createInitialState } from './state';

const base = () => ({ ...createInitialState(1, 0), marshmallow: 300, inventory: {} as Record<string, number> });

describe('marshmallow shop', () => {
  it('prices are 20 / 60 / 200', () => {
    expect([priceOf('common'), priceOf('shiny'), priceOf('rainbow')]).toEqual([20, 60, 200]);
  });
  it('buys a gift-pool item and spends marshmallow', () => {
    const r = buy(base(), 'furn-sofa');
    expect(r).not.toBeNull();
    expect(r!.state.marshmallow).toBe(240);
    expect(r!.state.inventory['furn-sofa']).toBe(1);
  });
  it('refuses non-pool items (starter pendant)', () => {
    expect(buy(base(), 'pendant-bamboo')).toBeNull();
  });
  it('refuses when marshmallow is short', () => {
    expect(buy({ ...base(), marshmallow: 19 }, 'furn-plant-pot')).toBeNull();
  });
  it('refuses a second copy of a wearable or surface, allows furniture repeats', () => {
    const s = { ...base(), inventory: { 'outfit-head-bow': 1, 'furn-plant-pot': 1 } };
    expect(buy(s, 'outfit-head-bow')).toBeNull();
    expect(buy(s, 'furn-plant-pot')!.state.inventory['furn-plant-pot']).toBe(2);
  });
});
```

- [ ] **Step 2: Run it, expected FAIL.** Command: `npx vitest run src/core/shop.test.ts`.
- [ ] **Step 3: Implement** `src/core/shop.ts` per rules.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(core): add marshmallow shop purchase rules` and the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer (use the same heredoc pattern as Task 9).

---

## Task 11: Collection milestones and friend furniture — `core/milestones.ts`

**Files:** Create `src/core/milestones.ts`, `src/core/milestones.test.ts`.

**Interfaces:**
- Consumes: `GameState`, `Outcome`, `GameEvent`; `ITEMS` (Task 2); `levelOf` from `core/friendLevel.ts` (Plan A, used only in the test to pin the level values).
- Produces: `milestoneThreshold(k: number): number` (k=1→10, 2→30, 3→50, k≥4 → `50 + 25 * (k − 3)`); `milestoneTitle(k: number): string` (1 `收藏新星`, 2 `收藏達人`, 3 `收藏大師`, k≥4 `收藏傳說 ${k − 3}`); `checkMilestones(s: GameState): Outcome`.

Rules:
- Categories: `furniture`, `outfit`, `pendant`. `count(cat)` = number of `ITEMS` with that category and `inventory[id] > 0`.
- While `count(cat) >= milestoneThreshold(claimed[cat] + 1)`: `claimed[cat] += 1`, `freeBoxes += 1`, emit `{ type: 'milestone', category: cat, count: threshold }`.
- Friend furniture is NOT granted here (contract §10.3). Plan B's `addAffinity` grants `furn-<friendId>-<k>` at friend levels 3, 6, 10 (level from A's `levelOf`, contract §10.4). `checkMilestones` never reads `friends` and never writes friend furniture ids, so there is exactly one grant path.
- Idempotent: a second call with the same state returns no events.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/milestones.test.ts
import { describe, it, expect } from 'vitest';
import { checkMilestones, milestoneThreshold, milestoneTitle } from './milestones';
import { createInitialState } from './state';
import { ITEMS } from '../content/items';
import { levelOf } from './friendLevel';

const withInventory = (ids: string[]) => {
  const s = createInitialState(1, 0);
  const inv: Record<string, number> = {};
  for (const id of ids) inv[id] = 1;
  return { ...s, inventory: inv };
};

describe('milestones', () => {
  it('thresholds 10, 30, 50, then every 25', () => {
    expect([1, 2, 3, 4, 5].map(milestoneThreshold)).toEqual([10, 30, 50, 75, 100]);
  });
  it('titles', () => {
    expect(milestoneTitle(1)).toBe('收藏新星');
    expect(milestoneTitle(4)).toBe('收藏傳說 1');
  });
  it('claims furniture milestone at 10 owned: +1 free box, one event', () => {
    const ids = ITEMS.filter((i) => i.category === 'furniture' && !i.id.startsWith('furn-mianhua') && !i.id.startsWith('furn-juzi') && !i.id.startsWith('furn-manman') && !i.id.startsWith('furn-gulu')).slice(0, 10).map((i) => i.id);
    const s0 = withInventory(ids);
    const out = checkMilestones(s0);
    expect(out.state.milestonesClaimed.furniture).toBe(1);
    expect(out.state.freeBoxes).toBe(s0.freeBoxes + 1);
    expect(out.events).toContainEqual({ type: 'milestone', category: 'furniture', count: 10 });
  });
  it('is idempotent', () => {
    const once = checkMilestones(withInventory(['furn-nest', 'furn-low-table']));
    const twice = checkMilestones(once.state);
    expect(twice.events).toEqual([]);
    expect(twice.state).toEqual(once.state);
  });
  it('friend levels follow contract §10.4: 59 points is level 2, 60 is level 3', () => {
    expect(levelOf(59)).toBe(2);
    expect(levelOf(60)).toBe(3);
  });
  it('does not grant friend furniture even at friend level 3 (60 points); B owns that grant', () => {
    const s0 = createInitialState(1, 0);
    const s = { ...s0, friends: { ...s0.friends, mianhua: { points: 60, chatsToday: 0 } } };
    const out = checkMilestones(s);
    expect(out.state.inventory['furn-mianhua-1']).toBeUndefined();
    expect(out.events.some((e) => e.type === 'reward')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/core/milestones.test.ts`.
- [ ] **Step 3: Implement** `src/core/milestones.ts` per rules.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(core): add collection milestones` (heredoc as Task 1, with the Opus trailer).

---

## Task 12: Pendant modifiers and pendant sounds

**Files:** Create `src/core/pendants.ts`, `src/core/pendants.test.ts`, `src/platform/pendantSound.ts`.

**Interfaces:**
- Consumes: `GameState`; `getItem` (Task 3); `PendantEffect`.
- Produces: `interface Modifiers { starSandPct: Partial<Record<Terrain, number>>; extraTreasure: Terrain[]; minigameStarSandPct: number; diaryDream: boolean; ingredientChancePct: number; affinityBonus: number }` (contract); `pendantModifiers(s: GameState): Modifiers`; `pendantSoundIds(ids: string[]): string[]`; `ingredientDropChance(m: Modifiers): number`; `PENDANT_TONES: Record<string, number[]>` (keys are the 8 sound ids, values are note frequencies in Hz); `playPendantSound(soundId: string): void`; `playPendantSounds(soundIds: string[], gapMs: number, play?: (id: string) => void): void`.

Rules:
- Iterate `s.equipped.pendants`, `getItem(id).pendant`, and fold:
  - `terrainStarSand`: add `pct` to `starSandPct[terrain]`.
  - `terrainExtraTreasure`: push terrain to `extraTreasure`.
  - `minigameStarSand`: add `pct` to `minigameStarSandPct`.
  - `diaryDream`: `diaryDream = true`.
  - `ingredientChance`: add `pct` to `ingredientChancePct`.
  - `affinityBonus`: add `amount` to `affinityBonus`.
- `PENDANT_TONES` has 8 distinct keys: `chime-bamboo`, `chime-shell`, `chime-snow`, `chime-cloud`, `chime-star`, `chime-moon`, `chime-mushroom`, `chime-heart`. Each value is a 2–3 note array (for example `[880, 1320]`), all different.
- `playPendantSound(id)`: lazily creates an `AudioContext` in a try/catch; plays the notes with `OscillatorNode` at 0.15s spacing, gain 0.15; any error is ignored. The caller checks the sound setting.
- `pendantSoundIds(ids)`: maps each equipped pendant id to `getItem(id).sound` in equipped order, dropping undefined sounds. Pure, in `core/pendants.ts`.
- `ingredientDropChance(m)` = `30 + m.ingredientChancePct` (contract §10.12: base 30%, mushroom adds 30 percentage points, so 60%). Plan B's completion roll uses this value.
- `playPendantSounds(ids, gapMs, play = playPendantSound)`: the i-th id is played via `play(ids[i])` after `i × gapMs` ms (i = 0 immediately) using `setTimeout`. The collar tap in Home calls it with `pendantSoundIds(equipped.pendants)` and `350`, one tone per pendant, only when `settings.sound` is true (the caller checks).
- `diaryDream` consumers: replace Plan A's temporary moon-bell check (contract §10.11) by changing the body of `diaryDreamOn` in `core/dream.ts` (used by both `shouldHiccup` and the diary generator) to `return pendantModifiers(s).diaryDream`. Pendant id is `pendant-moon-bell` everywhere.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/pendants.test.ts
import { describe, it, expect, vi } from 'vitest';
import { pendantModifiers, pendantSoundIds, ingredientDropChance } from './pendants';
import { createInitialState } from './state';
import { PENDANT_TONES, playPendantSounds } from '../platform/pendantSound';
import { PENDANT_ITEMS } from '../content/items/pendants';

const wear = (ids: string[]) => {
  const s = createInitialState(1, 0);
  return { ...s, equipped: { outfit: {}, pendants: ids } };
};

describe('pendant modifiers', () => {
  it('bamboo starter gives +20% bamboo star sand', () => {
    expect(pendantModifiers(wear(['pendant-bamboo'])).starSandPct.bamboo).toBe(20);
  });
  it('bamboo and snowflake stack independently', () => {
    const m = pendantModifiers(wear(['pendant-bamboo', 'pendant-snowflake']));
    expect(m.starSandPct).toEqual({ bamboo: 20, snow: 20 });
  });
  it('shell and cloud add extra treasure terrains', () => {
    expect(pendantModifiers(wear(['pendant-shell', 'pendant-cloud'])).extraTreasure.sort()).toEqual(['beach', 'cloud']);
  });
  it('moon bell enables diary dream; heart adds affinity 1', () => {
    const m = pendantModifiers(wear(['pendant-moon-bell', 'pendant-heart']));
    expect(m.diaryDream).toBe(true);
    expect(m.affinityBonus).toBe(1);
  });
  it('mushroom +30 ingredient chance; star +20 minigame star sand', () => {
    const m = pendantModifiers(wear(['pendant-mushroom', 'pendant-star']));
    expect(m.ingredientChancePct).toBe(30);
    expect(m.minigameStarSandPct).toBe(20);
  });
  it('8 distinct sound tones, one per pendant sound id', () => {
    const sounds = [...PENDANT_ITEMS.map((p) => p.sound), 'chime-bamboo'];
    expect(new Set(sounds).size).toBe(8);
    for (const snd of sounds) expect(PENDANT_TONES[snd!].length).toBeGreaterThanOrEqual(2);
  });
  it('moon bell alone sets diaryDream; without it diaryDream is false', () => {
    expect(pendantModifiers(wear(['pendant-moon-bell'])).diaryDream).toBe(true);
    expect(pendantModifiers(wear(['pendant-bamboo'])).diaryDream).toBe(false);
  });
  it('mushroom gives 60% ingredient drop (base 30 + 30 points); no mushroom gives 30%', () => {
    expect(ingredientDropChance(pendantModifiers(wear(['pendant-mushroom'])))).toBe(60);
    expect(ingredientDropChance(pendantModifiers(wear([])))).toBe(30);
  });
  it('one sound per equipped pendant, in equipped order', () => {
    expect(pendantSoundIds(['pendant-bamboo', 'pendant-moon-bell'])).toEqual(['chime-bamboo', 'chime-moon']);
  });
  it('collar tones play one per pendant, the i-th at i × gap', () => {
    vi.useFakeTimers();
    const play = vi.fn();
    playPendantSounds(['chime-bamboo', 'chime-moon'], 350, play);
    expect(play.mock.calls).toEqual([['chime-bamboo']]);
    vi.advanceTimersByTime(349);
    expect(play).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(play.mock.calls).toEqual([['chime-bamboo'], ['chime-moon']]);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/core/pendants.test.ts`.
- [ ] **Step 3: Implement** `pendants.ts` and `platform/pendantSound.ts` per the rules.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(core): add pendant modifiers, drop chance and per-pendant tones` (heredoc as Task 1, with the Opus trailer).

---

## Task 13: Wardrobe — `core/wardrobe.ts`

**Files:** Create `src/core/wardrobe.ts`, `src/core/wardrobe.test.ts`.

**Interfaces:**
- Consumes: `GameState`, `OutfitSlot`, `OutfitPreset`; `getItem` (Task 3); `pendantSlots(chainLinks)` (Plan A, `core/growth.ts`).
- Produces (contract): `equip(s, slot, itemId | null): GameState`; `setPendants(s, ids: string[]): GameState`; `savePreset(s, i: 0|1|2): GameState`; `loadPreset(s, i: 0|1|2): GameState`.

Rules:
- `equip`: `null` clears the slot. Otherwise the item must be `category === 'outfit'`, `slot === slot`, and `inventory[id] > 0`; otherwise return `s` unchanged.
- `setPendants`: every id must be a `pendant` with `inventory > 0`, no duplicates, and `ids.length <= pendantSlots(s.chainLinks)`; otherwise return `s` unchanged.
- `savePreset(i)`: `presets[i] = { outfit: { ...equipped.outfit }, pendants: [...equipped.pendants] }`.
- `loadPreset(i)`: copy `presets[i]` into `equipped`, dropping any outfit slot or pendant whose item is no longer owned; cap pendants at `pendantSlots`.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/wardrobe.test.ts
import { describe, it, expect } from 'vitest';
import { equip, setPendants, savePreset, loadPreset } from './wardrobe';
import { createInitialState } from './state';

const owned = (ids: string[], chainLinks = 0) => {
  const s = createInitialState(1, 0);
  const inv: Record<string, number> = { 'pendant-bamboo': 1 };
  for (const id of ids) inv[id] = 1;
  return { ...s, chainLinks, inventory: inv };
};

describe('wardrobe', () => {
  it('equip puts an owned outfit in the matching slot', () => {
    const s = equip(owned(['outfit-head-bow']), 'head', 'outfit-head-bow');
    expect(s.equipped.outfit.head).toBe('outfit-head-bow');
  });
  it('equip rejects wrong slot or unowned item', () => {
    const base = owned(['outfit-head-bow']);
    expect(equip(base, 'face', 'outfit-head-bow')).toBe(base);
    expect(equip(base, 'head', 'outfit-head-cap')).toBe(base);
  });
  it('equip null clears the slot', () => {
    const s = equip(owned(['outfit-head-bow']), 'head', 'outfit-head-bow');
    expect(equip(s, 'head', null).equipped.outfit.head).toBeUndefined();
  });
  it('setPendants respects pendantSlots (2 at start, 3 at 50 chain links)', () => {
    const base = owned(['pendant-shell', 'pendant-star'], 0);
    expect(setPendants(base, ['pendant-bamboo', 'pendant-shell', 'pendant-star']).equipped.pendants).toEqual(base.equipped.pendants); // 3 > 2 slots, rejected
    const ok = setPendants(base, ['pendant-bamboo', 'pendant-shell']);
    expect(ok.equipped.pendants).toEqual(['pendant-bamboo', 'pendant-shell']);
    const more = owned(['pendant-shell', 'pendant-star'], 50);
    expect(setPendants(more, ['pendant-bamboo', 'pendant-shell', 'pendant-star']).equipped.pendants.length).toBe(3);
  });
  it('setPendants rejects duplicates and unowned', () => {
    const base = owned([], 0);
    expect(setPendants(base, ['pendant-bamboo', 'pendant-bamboo']).equipped.pendants).toEqual(base.equipped.pendants);
    expect(setPendants(base, ['pendant-shell']).equipped.pendants).toEqual(base.equipped.pendants);
  });
  it('save and load presets, dropping items no longer owned', () => {
    let s = equip(owned(['outfit-tail-bow']), 'tail', 'outfit-tail-bow');
    s = savePreset(s, 1);
    s = { ...s, inventory: { ...s.inventory, 'outfit-tail-bow': 0 } };
    s = loadPreset(s, 1);
    expect(s.equipped.outfit.tail).toBeUndefined();
  });
});
```

Note: at chainLinks 0 there are 2 pendant slots, so the 3-id call must be rejected and leave `equipped.pendants` unchanged (the test above asserts this).

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/core/wardrobe.test.ts`.
- [ ] **Step 3: Implement** `wardrobe.ts` per rules.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(core): add wardrobe equip, pendant slots and presets`.

---

## Task 14: Room rules — `core/room.ts`

**Files:** Create `src/core/room.ts`, `src/core/room.test.ts`.

**Interfaces:**
- Consumes: `GameState`, `RoomState`, `PlacedItem`, `RoomId`, `Interaction`; `getItem`; `currentStage(s)` (Plan A).
- Produces: `roomUnlocked`, `canPlace`, `place`, `move`, `flip`, `stow`, `setSurface`, `pickInteraction` (signatures in "Shared Interfaces Added by This Plan").

Rules:
- `roomUnlocked(s, 'living')` = true. `roomUnlocked(s, 'bedroom')` = `currentStage(s) >= 2`.
- `canPlace(room, item, x, y, layer, ignoreUid?)`:
  - `layer === 'wall'`: item must be `category === 'furniture' && wallMounted`; footprint 1×1; `y === 0`; `0 <= x <= 7`.
  - `layer === 'floor'`: item must be `category === 'furniture' && !wallMounted`; footprint `size` (default 1×1); `0 <= x`, `x + w <= 8`, `0 <= y`, `y + h <= 6`.
  - No overlap with any other `placed` item on the same layer (ignore the item whose `uid === ignoreUid`). Wall items overlap only with wall items at the same x. Flip does not change footprint.
- `place(s, roomId, itemId, x, y)`: item must exist; available count `inventory[id] − placedCountAll(id) > 0`; `roomUnlocked`; `canPlace`. Uid is `${itemId}#${n}` with `n` one greater than the largest n already used for that item across both rooms. `flipped: false`. Layer is `'wall'` if the item is wall-mounted, else `'floor'`. Returns new state or `null`.
- `move`: find by uid in that room; `canPlace(..., uid)`; update `x`, `y`; `null` if invalid.
- `flip`: toggle `flipped`; return state (always valid).
- `stow`: remove the item from `placed`; return state.
- `setSurface(s, roomId, 'wall' | 'floor', itemId)`: item must be category `wall` or `floor` matching surface and `inventory > 0`; otherwise return `s`. Sets `rooms[roomId].wall` or `.floor`.
- `pickInteraction(room, rand)`: list placed floor items whose `interaction` is set; if none, or `rand() >= 0.5`, return `null`; else pick `Math.floor(rand() * n)`; return `{ uid, interaction }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/room.test.ts
import { describe, it, expect } from 'vitest';
import { canPlace, place, move, flip, stow, roomUnlocked, pickInteraction, setSurface } from './room';
import { createInitialState } from './state';
import { getItem } from './catalog';
import { mulberry32 } from './rng';

const withItems = (ids: string[], stage = 1) => {
  const s = createInitialState(1, 0);
  const inv: Record<string, number> = { ...s.inventory };
  for (const id of ids) inv[id] = (inv[id] ?? 0) + 1;
  return { ...s, inventory: inv, chainLinks: stage === 1 ? 0 : 250 };
};

describe('room rules', () => {
  it('floor footprint must fit inside 8x6', () => {
    const room = createInitialState(1, 0).rooms.living;
    expect(canPlace(room, getItem('furn-bed'), 7, 0, 'floor')).toBe(false); // 2x2 at x=7 overflows
    expect(canPlace(room, getItem('furn-bed'), 6, 4, 'floor')).toBe(true);
    expect(canPlace(room, getItem('furn-bed'), 6, 5, 'floor')).toBe(false); // y+h=7 > 6
  });
  it('no overlap between footprints', () => {
    const s = place(withItems(['furn-bed', 'furn-plant-pot']), 'living', 'furn-bed', 0, 0)!;
    expect(s).not.toBeNull();
    expect(canPlace(s.rooms.living, getItem('furn-plant-pot'), 1, 1, 'floor')).toBe(false);
    expect(canPlace(s.rooms.living, getItem('furn-plant-pot'), 2, 0, 'floor')).toBe(true);
  });
  it('wall-mounted items only on the wall row', () => {
    const room = createInitialState(1, 0).rooms.living;
    expect(canPlace(room, getItem('furn-lantern'), 0, 0, 'floor')).toBe(false);
    expect(canPlace(room, getItem('furn-lantern'), 7, 0, 'wall')).toBe(true);
    expect(canPlace(room, getItem('furn-lantern'), 8, 0, 'wall')).toBe(false);
  });
  it('place requires an owned, unplaced copy', () => {
    const s = withItems(['furn-plant-pot']);
    const once = place(s, 'living', 'furn-plant-pot', 0, 0)!;
    expect(once.rooms.living.placed[0].uid).toBe('furn-plant-pot#1');
    expect(place(once, 'living', 'furn-plant-pot', 3, 3)).toBeNull(); // only 1 owned
  });
  it('move keeps the old spot for the moved item (ignoreUid) and rejects overlap', () => {
    const s = place(withItems(['furn-plant-pot']), 'living', 'furn-plant-pot', 0, 0)!;
    expect(move(s, 'living', 'furn-plant-pot#1', 0, 0)).not.toBeNull();
    expect(move(s, 'living', 'furn-plant-pot#1', 8, 0)).toBeNull();
  });
  it('flip toggles and stow removes', () => {
    const s = place(withItems(['furn-plant-pot']), 'living', 'furn-plant-pot', 0, 0)!;
    expect(flip(s, 'living', 'furn-plant-pot#1').rooms.living.placed[0].flipped).toBe(true);
    expect(stow(s, 'living', 'furn-plant-pot#1').rooms.living.placed).toEqual([]);
  });
  it('bedroom unlocks at stage 2 (250 chain links = 0 marks, so use marks) ', () => {
    expect(roomUnlocked(createInitialState(1, 0), 'bedroom')).toBe(false);
    expect(roomUnlocked({ ...createInitialState(1, 0), growthXp: 275 }, 'bedroom')).toBe(true);
  });
  it('setSurface requires owned wall of matching surface', () => {
    const s = withItems(['wall-bamboo']);
    expect(setSurface(s, 'living', 'wall', 'wall-bamboo').rooms.living.wall).toBe('wall-bamboo');
    expect(setSurface(s, 'living', 'floor', 'wall-bamboo').rooms.living.floor).toBe(s.rooms.living.floor);
  });
  it('pickInteraction returns null with no interactive furniture or roll failure', () => {
    const room = createInitialState(1, 0).rooms.living;
    expect(pickInteraction(room, mulberry32(1))).toBeNull();
  });
  it('pickInteraction picks a placed interactive item when rolled', () => {
    const s = place(withItems(['furn-sofa']), 'living', 'furn-sofa', 0, 0)!;
    let hit = null;
    for (let seed = 1; seed < 50 && !hit; seed++) hit = pickInteraction(s.rooms.living, mulberry32(seed));
    expect(hit).toEqual({ uid: 'furn-sofa#1', interaction: 'sit' });
  });
});
```

Note: `roomUnlocked` for bedroom uses `currentStage(s)`, which uses `growthXp` through `marksForXp` (Plan A). The test uses `growthXp: 275` (stage 2 begins at 5 marks = 275 xp). Remove the stray "250 chain links" words from the test name when implementing.

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/core/room.test.ts`.
- [ ] **Step 3: Implement** `room.ts` per rules.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(core): add room placement, move, flip, stow and interaction pick`.

---

## Task 15: Album rules — `core/album.ts`

**Files:** Create `src/core/album.ts`, `src/core/album.test.ts`.

**Interfaces:**
- Consumes: `GameState`, `DiaryEntry`.
- Produces: `PHOTO_CAP = 200`; `canSavePhoto(count: number): boolean` (`count < PHOTO_CAP`); `stickDiary(s, date: string, stickerId: string | null): GameState`.

Rules:
- `stickDiary`: `stickerId` must be `null` or start with `sticker-`; the entry with `date` must exist in `s.diary`; otherwise return `s`. Sets its `sticker`.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/album.test.ts
import { describe, it, expect } from 'vitest';
import { canSavePhoto, PHOTO_CAP, stickDiary } from './album';
import { createInitialState } from './state';

describe('album rules', () => {
  it('photo cap is 200 and allows the 200th save only if under cap', () => {
    expect(PHOTO_CAP).toBe(200);
    expect(canSavePhoto(199)).toBe(true);
    expect(canSavePhoto(200)).toBe(false);
  });
  it('stickDiary sets a sticker on an existing entry', () => {
    const s0 = createInitialState(1, 0);
    const s = { ...s0, diary: [{ date: '2026-10-18', text: 'x', sticker: null }] };
    expect(stickDiary(s, '2026-10-18', 'sticker-01').diary[0].sticker).toBe('sticker-01');
  });
  it('stickDiary rejects non-sticker ids and missing dates', () => {
    const s0 = createInitialState(1, 0);
    const s = { ...s0, diary: [{ date: '2026-10-18', text: 'x', sticker: null }] };
    expect(stickDiary(s, '2026-10-18', 'outfit-head-bow')).toBe(s);
    expect(stickDiary(s, '2026-01-01', 'sticker-01')).toBe(s);
  });
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/core/album.test.ts`.
- [ ] **Step 3: Implement** `album.ts` per rules.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(core): add album photo cap and diary sticker reply`.

---

## Task 16: Room view and Home integration

**Files:**
- Create: `src/ui/room/perspective.ts`, `src/ui/room/perspective.test.ts`, `src/ui/room/interactions.ts`, `src/ui/room/interactions.test.ts`, `src/ui/components/RoomView.tsx`, `src/ui/components/RoomView.test.tsx`
- Modify: `src/ui/screens/Home.tsx` (Plan A)

**Interfaces:**
- Consumes: `RoomState`, `PlacedItem`, `Interaction`, `PandaPose`, `Outfit`; `getItem`; `ITEM_ART`; `Panda` (Plan A).
- Produces: `interactionPose(i: Interaction): PandaPose` (`sit`→`useSit`, `sleep`→`useSleep`, `swing`→`useSwing`, `read`→`useRead`); `RoomView(props: { room: RoomState; editable?: boolean; selectedUid?: string | null; onCellPress?: never })` — static view for Phase 1; editor overlay comes in Task 18.

**Geometry (fixed, 2.5D per contract §10.14):** viewBox `0 0 400 320`. Wall band `y 0..80`: 8 cells of 50px, `x = col × 50`; a wall item at `(x, 0)` occupies `(x × 50, 0, 50, 80)`. Floor band `y 80..320`: 6 rows of 40px each. Row `r` has depth scale `k = rowScale(r) = 0.80 + 0.20 × r / 5` (back row 0.80, front row 1.00, linear). Cells in row `r` are `50 × k` wide, centred on x = 200: cell `(x, r)` spans horizontally from `200 − 200k + 50k·x` with width `50k`, and vertically `[80 + 40r, +40)`. A floor item at `(x, y)` with footprint `w×h` is scaled by `k = rowScale(y)`, anchored at its bottom centre; its footprint is `w × 50k` wide and `h × 40` high. Floor cells are `<rect data-testid="room-cell-<x>-<y>">` (contract §10.17). Collision is still computed on the integer grid (`canPlace`, Task 14). Items are drawn sorted by `y` ascending (back first). Each item is wrapped in `<g data-uid={uid} data-testid={'placed-' + uid} transform=…>`, art at `size = min(footprint w, footprint h)` centered in the footprint, and `scale(-1, 1)` around the footprint center when `flipped`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/ui/room/perspective.test.ts
import { describe, it, expect } from 'vitest';
import { rowScale, cellRect, pixelToCell } from './perspective';
describe('2.5D floor perspective', () => {
  it('row scale runs linearly 0.80 (back) to 1.00 (front)', () => {
    expect(rowScale(0)).toBeCloseTo(0.8, 10);
    expect(rowScale(5)).toBeCloseTo(1.0, 10);
    expect(rowScale(1)).toBeCloseTo(0.84, 10);
    expect(rowScale(3)).toBeCloseTo(0.92, 10);
  });
  it('back cells are narrower; front cells are full width and centred on x = 200', () => {
    const back = cellRect(0, 0);
    expect(back.w).toBeCloseTo(40, 6);
    expect(back.x).toBeCloseTo(40, 6);
    expect(back.y).toBe(80);
    expect(cellRect(0, 5)).toEqual({ x: 0, y: 280, w: 50, h: 40 });
  });
  it('pixelToCell inverts the projection and rejects points outside the floor', () => {
    expect(pixelToCell(200, 280)).toEqual({ x: 4, y: 5 });  // front row, centre
    expect(pixelToCell(161, 80)).toEqual({ x: 3, y: 0 });   // back row: floor((161 − 40) / 40) = 3
    expect(pixelToCell(10, 80)).toBeNull();                 // left of the back row
    expect(pixelToCell(200, 60)).toBeNull();                // wall band
  });
});
```

```ts
// src/ui/room/interactions.test.ts
import { it, expect } from 'vitest';
import { interactionPose } from './interactions';
it('maps interactions to Panda poses', () => {
  expect(interactionPose('sit')).toBe('useSit');
  expect(interactionPose('sleep')).toBe('useSleep');
  expect(interactionPose('swing')).toBe('useSwing');
  expect(interactionPose('read')).toBe('useRead');
});
```

```tsx
// src/ui/components/RoomView.test.tsx
import { it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { RoomView } from './RoomView';
import { createInitialState } from '../../core/state';

it('renders each placed item in a group with its uid, sorted back to front', () => {
  const s = createInitialState(1, 0);
  const room = { ...s.rooms.living, placed: [
    { uid: 'furn-bed#1', itemId: 'furn-bed', layer: 'floor' as const, x: 0, y: 4, flipped: false },
    { uid: 'furn-plant-pot#1', itemId: 'furn-plant-pot', layer: 'floor' as const, x: 0, y: 0, flipped: false },
  ] };
  const { container } = render(<RoomView room={room} />);
  const uids = [...container.querySelectorAll('[data-uid]')].map((el) => el.getAttribute('data-uid'));
  expect(uids).toEqual(['furn-plant-pot#1', 'furn-bed#1']);
  expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 400 320');
  expect(container.querySelector('[data-testid="placed-furn-plant-pot#1"]')).not.toBeNull();
  expect(container.querySelectorAll('[data-testid^="room-cell-"]').length).toBe(48);
});
```

- [ ] **Step 2: Run them, expected FAIL.** `npx vitest run src/ui/room/perspective.test.ts src/ui/room/interactions.test.ts src/ui/components/RoomView.test.tsx`.
- [ ] **Step 3: Implement**
- `perspective.ts`: `rowScale(r) = 0.80 + 0.20 * r / 5`; `cellRect(x, r, w = 1, h = 1)` per the geometry (`k = rowScale(r)`, `left = 200 − 200k + 50k·x`, `top = 80 + 40r`, `width = 50k·w`, `height = 40·h`); `pixelToCell(px, py)`: `row = Math.floor((py − 80) / 40)`, `null` if outside 0..5, `x = Math.floor((px − (200 − 200k)) / (50k))`, `null` if outside 0..7, otherwise `{ x, y: row }`.
- `interactions.ts` and `RoomView.tsx` per the geometry above. `RoomView` draws the wall fill from `rooms.wall` and floor from `rooms.floor` as simple fills (wallpaper and floor art swatch from `ITEM_ART[id]` when present, otherwise a flat fill).
- Home (`src/ui/screens/Home.tsx`, Plan A) changes only:
  1. Replace the placeholder room with `<RoomView room={game.value.rooms.living} />`.
  2. Pass `game.value.equipped.outfit`, `equipped.pendants`, and `game.value.chainLinks` to `<Panda>`.
  3. When Plan A's mood is `'normal'`, every 15 seconds call `pickInteraction(room, Math.random)` from a `useEffect` that is not part of `core/` (the UI may use `Math.random`; `core/` may not). If it returns a pick, set the Panda pose to `interactionPose(pick.interaction)` for 3 seconds, then return to `'normal'`. Clear the timer on unmount.
  4. Add a 衣櫃＆布置 entry point is already in the tab bar (Plan A); do not add a second button.
  5. Collar tap (issue 19, C part): `onPokeArea('collar')` calls `playPendantSounds(pendantSoundIds(game.value.equipped.pendants), 350)` (Task 12) only when `game.value.settings.sound` is true, so each equipped pendant rings its own tone 350 ms after the previous one.
- [ ] **Step 4: Run them, expected PASS.** Plus `npx vitest run` for Plan A's Home tests (must still pass).
- [ ] **Step 5: Commit** with message `feat(ui): add static room view and interactive idle poses on home`.

---

## Task 17: Long-press drag state machine — `ui/room/dragMachine.ts`

**Files:** Create `src/ui/room/dragMachine.ts`, `src/ui/room/dragMachine.test.ts`.

**Interfaces:** Produces `createDragMachine()` and `DragResult` (see "Shared Interfaces").

Rules (pure, time injected):
- `down(x, y, t)`: state `pending`, record start `(x, y, t)`.
- `move(x, y, t)`: in `pending`, if `Math.hypot(x − sx, y − sy) > 8`, state `cancelled` (treated as scroll). In `dragging`, record current pointer. Other states: ignore.
- `tick(t)`: in `pending`, if `t − st >= 300` and state is still `pending`, state `dragging`.
- `up(valid, x, y)`: in `dragging`: `valid` → `{ type: 'drop', x, y }`, else `{ type: 'snapBack' }`; state `idle`. In other states: `{ type: 'none' }`, state `idle`.
- `cancel()`: in `dragging` → `{ type: 'snapBack' }`; else `{ type: 'none' }`; state `idle`. Used for `pointercancel`.
- Exactly 8px is still tolerated (distance must be `> 8` to cancel).

- [ ] **Step 1: Write the failing test**

```ts
// src/ui/room/dragMachine.test.ts
import { describe, it, expect } from 'vitest';
import { createDragMachine } from './dragMachine';

describe('drag machine', () => {
  it('long press of 300ms starts dragging', () => {
    const m = createDragMachine();
    m.down(10, 10, 0);
    m.tick(299);
    expect(m.state()).toBe('pending');
    m.tick(300);
    expect(m.state()).toBe('dragging');
  });
  it('moving more than 8px before 300ms cancels', () => {
    const m = createDragMachine();
    m.down(10, 10, 0);
    m.move(19, 10, 100);
    expect(m.state()).toBe('cancelled');
    m.tick(400);
    expect(m.state()).toBe('cancelled');
  });
  it('exactly 8px is still tolerated', () => {
    const m = createDragMachine();
    m.down(10, 10, 0);
    m.move(18, 10, 100);
    expect(m.state()).toBe('pending');
  });
  it('valid drop returns drop, invalid returns snapBack', () => {
    const m = createDragMachine();
    m.down(0, 0, 0); m.tick(300);
    expect(m.up(true, 40, 50)).toEqual({ type: 'drop', x: 40, y: 50 });
    m.down(0, 0, 0); m.tick(300);
    expect(m.up(false, 40, 50)).toEqual({ type: 'snapBack' });
  });
  it('pointercancel while dragging snaps back', () => {
    const m = createDragMachine();
    m.down(0, 0, 0); m.tick(300);
    expect(m.cancel()).toEqual({ type: 'snapBack' });
    expect(m.state()).toBe('idle');
  });
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/room/dragMachine.test.ts`.
- [ ] **Step 3: Implement** `dragMachine.ts` per rules.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(ui): add long-press drag state machine for room editing`.

---

## Task 18: Room editor — layout mode

**Files:**
- Create: `src/ui/room/RoomEditor.tsx`, `src/ui/room/RoomEditor.test.tsx`
- Modify: `src/ui/components/RoomView.tsx` (add `editable` behavior via the editor wrapper; no change to the static view's output)

**Interfaces:**
- Consumes: `createDragMachine` (Task 17); `move`, `flip`, `stow`, `canPlace` (Task 14); `pixelToCell` (Task 16, `ui/room/perspective.ts`); `commit` (Plan A `ui/store.ts`); `game` signal (Plan A).
- Produces: `RoomEditor(props: { roomId: RoomId })`.

Behavior:
- The container has `style="touch-action: none"`. On `pointerdown` over a placed item `<g data-uid>`: call `el.setPointerCapture(e.pointerId)`, `machine.down(...)`. Pointer move and up go through the same element (captured).
- A 300ms timer (driven by `requestAnimationFrame` or `setInterval` at 50ms, calling `machine.tick(now)`) enters dragging. In dragging, show the item at the pointer position minus the grab offset, with a dashed outline.
- Drop: convert the pointer to SVG viewBox coordinates and call `pixelToCell(px, py)` (2.5D projection, Task 16) for floor items; subtract the grab offset in cells measured at the item's own row scale, and `null` is an invalid drop (snap back). Wall items use `y = 0` and `x = floor(px / 50)`. Call `move(game.value, roomId, uid, x, y)`; if `null`, call `commit` with no change (snap back by not changing state). Otherwise `commit(newState)`.
- `pointercancel` → `machine.cancel()`; the item returns to its origin (no state change).
- When an item is selected (after a tap that did not become a drag), show buttons `翻轉` (calls `flip`) and `收回` (calls `stow`). Both are ≥ 44px. Labels exactly `翻轉` and `收回`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/room/RoomEditor.test.tsx
import { it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/preact';
import { RoomEditor } from './RoomEditor';
import { game } from '../store';
import { createInitialState } from '../../core/state';

beforeEach(() => {
  vi.useFakeTimers();
  const s = createInitialState(1, 0);
  game.value = { ...s, inventory: { ...s.inventory, 'furn-plant-pot': 1 },
    rooms: { ...s.rooms, living: { ...s.rooms.living, placed: [
      { uid: 'furn-plant-pot#1', itemId: 'furn-plant-pot', layer: 'floor', x: 0, y: 0, flipped: false },
    ] } } };
});

it('a 300ms press starts a drag; a move beyond 8px before that does not', () => {
  const { container } = render(<RoomEditor roomId="living" />);
  const g = container.querySelector('[data-uid="furn-plant-pot#1"]') as SVGGElement;
  (g as any).setPointerCapture = () => {};
  fireEvent.pointerDown(g, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(g, { pointerId: 1, clientX: 30, clientY: 10 });
  act(() => vi.advanceTimersByTime(400));
  expect(container.querySelector('[data-dragging]')).toBeNull();
});

it('invalid drop snaps back and leaves state unchanged', () => {
  const { container } = render(<RoomEditor roomId="living" />);
  const g = container.querySelector('[data-uid="furn-plant-pot#1"]') as SVGGElement;
  (g as any).setPointerCapture = () => {};
  const before = game.value;
  fireEvent.pointerDown(g, { pointerId: 1, clientX: 10, clientY: 10 });
  act(() => vi.advanceTimersByTime(300));
  fireEvent.pointerMove(g, { pointerId: 1, clientX: 900, clientY: 900 }); // far outside
  fireEvent.pointerUp(g, { pointerId: 1, clientX: 900, clientY: 900 });
  expect(game.value).toBe(before);
});

it('flip button toggles the selected item', () => {
  const { getByText, container } = render(<RoomEditor roomId="living" />);
  const g = container.querySelector('[data-uid="furn-plant-pot#1"]') as SVGGElement;
  (g as any).setPointerCapture = () => {};
  fireEvent.pointerDown(g, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(g, { pointerId: 1, clientX: 10, clientY: 10 }); // quick tap = select
  fireEvent.click(getByText('翻轉'));
  expect(game.value.rooms.living.placed[0].flipped).toBe(true);
});

it('editor root sets touch-action none', () => {
  const { container } = render(<RoomEditor roomId="living" />);
  expect((container.firstElementChild as HTMLElement).style.touchAction).toBe('none');
});
```

- [ ] **Step 2: Run them, expected FAIL.** `npx vitest run src/ui/room/RoomEditor.test.tsx`.
- [ ] **Step 3: Implement** `RoomEditor.tsx` per behavior. Use `game` and `commit` from Plan A's `ui/store.ts`.
- [ ] **Step 4: Run them, expected PASS.** Then manual check later in Task 29.
- [ ] **Step 5: Commit** with message `feat(ui): add room layout editor with long-press drag and snap-back`.

---

## Task 19: Closet screen — 換裝 (dress-up) segment

**Files:**
- Create: `src/ui/screens/Closet.tsx`, `src/ui/screens/closet/Dress.tsx`, `src/ui/screens/Closet.test.tsx`
- Modify: `src/ui/screens/registry.ts` (Plan A) — `TAB_SCREENS.closet = Closet`

**Interfaces:**
- Consumes: `equip`, `setPendants`, `savePreset`, `loadPreset` (Task 13); `ITEMS`; `Panda` with `pose="spin"` (Plan A); `commit`, `game` (Plan A); `pendantSlots` (Plan A).
- Produces: `Closet()` component with a segmented control `換裝 | 布置` (布置 is added in Task 20). Default segment is 換裝.

UI:
- Left/top: Panda preview with the equipped outfit and pendants.
- Six slot tiles: 頭飾、臉、衣服、手持物、尾巴配件、項圈墜飾. Tap a tile → list of owned items for that slot (outfit items by `slot`; pendant items for the sixth tile), with a `不穿` option. Selecting calls `equip` or `setPendants` and `commit`s.
- Pendant tile shows `已用 n / 總數 m` where `m = pendantSlots(game.value.chainLinks)`.
- Preset buttons `搭配 1`、`搭配 2`、`搭配 3`, each with a 儲存 long-tap? No: two buttons per preset are too busy; use one row of three `搭配 1…3` buttons (tap = load) and a `存到搭配 1…3` row (tap = save). Labels exact.
- After any change, set Panda pose to `spin` for 1.2s and then back to `normal`.
- Registry: `TAB_SCREENS.closet = Closet`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/screens/Closet.test.tsx
import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Closet } from './Closet';
import { game } from '../store';
import { createInitialState } from '../../core/state';

beforeEach(() => {
  const s = createInitialState(1, 0);
  game.value = { ...s, inventory: { ...s.inventory, 'outfit-head-bow': 1 } };
});

it('shows six slot tiles with Chinese labels', () => {
  const { getByText } = render(<Closet />);
  for (const label of ['頭飾', '臉', '衣服', '手持物', '尾巴配件', '項圈墜飾']) getByText(label);
});

it('equips an owned head item from the slot list', () => {
  const { getByText, getAllByText } = render(<Closet />);
  fireEvent.click(getByText('頭飾'));
  fireEvent.click(getByText('蝴蝶結髮圈'));
  expect(game.value.equipped.outfit.head).toBe('outfit-head-bow');
});

it('save to preset 1 then load preset 1 restores the outfit', () => {
  const { getByText } = render(<Closet />);
  fireEvent.click(getByText('頭飾'));
  fireEvent.click(getByText('蝴蝶結髮圈'));
  fireEvent.click(getByText('存到搭配 1'));
  fireEvent.click(getByText('頭飾'));
  fireEvent.click(getByText('不穿'));
  expect(game.value.equipped.outfit.head).toBeUndefined();
  fireEvent.click(getByText('搭配 1'));
  expect(game.value.equipped.outfit.head).toBe('outfit-head-bow');
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/screens/Closet.test.tsx`.
- [ ] **Step 3: Implement** `Closet.tsx` (segment shell), `closet/Dress.tsx`, update `registry.ts`.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(ui): add closet dress-up screen with slots and presets`.

---

## Task 20: Closet — 布置 (decorate) segment

**Files:**
- Create: `src/ui/screens/closet/Decorate.tsx`, `src/ui/screens/closet/Decorate.test.tsx`
- Modify: `src/ui/screens/Closet.tsx` (add the 布置 segment)

**Interfaces:**
- Consumes: `RoomEditor` (Task 18), `setSurface` (Task 14), `place` (Task 14), `RoomView`, `game`, `commit`.
- Produces: `Decorate()` component.

UI:
- Room selector: `客廳` (always) and `臥室` (only if `roomUnlocked(game.value, 'bedroom')`; otherwise the tab shows `階段 2 解鎖臥室` and is disabled).
- Surface picker: `牆紙` and `地板` tabs, each listing owned wallpapers/floors (inventory > 0), with the current one highlighted. Tap → `setSurface`.
- `擺放` button: opens a list of owned furniture not yet placed (available count > 0). Each list button has `data-testid="tray-<itemId>"` (contract §10.17). Tapping an item calls `place` at the first free cell found by scanning `y` then `x` (first valid cell per `canPlace`). If none, show `放不下了，先收回一件吧`.
- `布置模式` area renders `<RoomEditor roomId={selected} />`. Selected item buttons `翻轉` and `收回` come from RoomEditor.

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/screens/closet/Decorate.test.tsx
import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Decorate } from './Decorate';
import { game } from '../../store';
import { createInitialState } from '../../../core/state';

beforeEach(() => {
  const s = createInitialState(1, 0);
  game.value = { ...s, inventory: { ...s.inventory, 'wall-bamboo': 1, 'furn-plant-pot': 1 } };
});

it('bedroom is locked before stage 2', () => {
  const { getByText } = render(<Decorate />);
  getByText('階段 2 解鎖臥室');
});

it('choosing an owned wallpaper sets it', () => {
  const { getByText } = render(<Decorate />);
  fireEvent.click(getByText('牆紙'));
  fireEvent.click(getByText('竹影牆紙'));
  expect(game.value.rooms.living.wall).toBe('wall-bamboo');
});

it('placing an owned item puts it at the first free cell', () => {
  const { getByText } = render(<Decorate />);
  fireEvent.click(getByText('擺放'));
  fireEvent.click(getByText('小盆栽'));
  expect(game.value.rooms.living.placed.some((p) => p.itemId === 'furn-plant-pot')).toBe(true);
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/screens/closet/Decorate.test.tsx`.
- [ ] **Step 3: Implement** `Decorate.tsx` and add the 布置 segment to `Closet.tsx`.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(ui): add decorate segment with wallpaper, floor and placement`.

---

## Task 21: GiftBox screen — opening animation and rates

**Files:**
- Create: `src/ui/screens/GiftBox.tsx`, `src/ui/screens/giftbox/Opening.tsx`, `src/ui/screens/GiftBox.test.tsx`
- Modify: `src/ui/screens/registry.ts` (Plan A) — `TAB_SCREENS.giftbox = GiftBox`

**Interfaces:**
- Consumes: `openGiftBox`, `canOpen`, `GIFT_RATES` (Task 9); `getItem`; `ITEM_ART`; `Panda` (`pose="shakeBox"`, then `"boxPeek"`); `commit`, `game` (Plan A); `burst` (Plan A, particles).
- Produces: `GiftBox()` component with two segments: `禮盒機` (this task) and `棉花糖小舖` (Task 22).

Behavior:
- Rates line shown above the button: `普通 75%｜✨ 閃亮 22%｜🌈 彩虹 3%`.
- Button label by state:
  - `!daily.freeBoxUsed` → `今日免費禮盒`
  - else `freeBoxes > 0` → `用一個禮盒打開`
  - else `starSand >= 50` → `花 50 ⭐ 打開禮盒`
  - else disabled with text `星砂還不夠，去冒險吧`.
- The main button carries `data-testid="giftbox-open"` (contract §10.17).
- Pressing the button sets `phase = 'shaking'` synchronously, which disables the button; compute `openGiftBox(game.value, Math.random)` once at press time and store the result in component state; after 1.2s show the reveal (`phase = 'reveal'`): item art, name, rarity label, and either `新收藏！` (not duplicate) or `已經有了！換成 N 🍡` (duplicate; N = 5/15/40 by rarity). `commit` the outcome at press time (state changes immediately; reveal is cosmetic). Button re-enabled only on `phase === 'idle'` after the user taps `好耶` on the reveal.
- Copy must only use 禮盒、打開、驚喜. Never 抽卡、保底.

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/screens/GiftBox.test.tsx
import { it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/preact';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GiftBox } from './GiftBox';
import { game } from '../store';
import { createInitialState } from '../../core/state';

beforeEach(() => {
  vi.useFakeTimers();
  game.value = createInitialState(1, 0);
});

it('shows the three rates', () => {
  const { getByText } = render(<GiftBox />);
  getByText(/普通 75%/);
  getByText(/閃亮 22%/);
  getByText(/彩虹 3%/);
});

it('a double tap opens exactly one box', () => {
  const { getByText } = render(<GiftBox />);
  const btn = getByText('今日免費禮盒');
  fireEvent.click(btn);
  fireEvent.click(btn);
  expect(game.value.daily.freeBoxUsed).toBe(true);
  expect(game.value.starSand).toBe(100);
  expect(game.value.freeBoxes).toBe(0);
});

it('copy never uses 抽卡 or 保底 in any UI source file', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
  const files = walk('src/ui').filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f));
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    expect(text.includes('抽卡'), f).toBe(false);
    expect(text.includes('保底'), f).toBe(false);
  }
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/screens/GiftBox.test.tsx`.
- [ ] **Step 3: Implement** `GiftBox.tsx` and `giftbox/Opening.tsx` per behavior. Guard against re-entry with `phase !== 'idle'` checked inside the press handler (the disabled attribute alone is not enough under fast taps).
- [ ] **Step 4: Run it, expected PASS.** Also run the full suite: `npx vitest run`.
- [ ] **Step 5: Commit** with message `feat(ui): add gift box screen with shake-open animation and rates`.

---

## Task 22: GiftBox screen — 棉花糖小舖 (marshmallow shop)

**Files:**
- Create: `src/ui/screens/giftbox/Shop.tsx`, `src/ui/screens/giftbox/Shop.test.tsx`
- Modify: `src/ui/screens/GiftBox.tsx` (add the second segment)

**Interfaces:**
- Consumes: `buy`, `priceOf` (Task 10); `giftPool` (Task 3); `game`, `commit`.
- Produces: `Shop()` component.

UI:
- Header shows `🍡 棉花糖 ${marshmallow}`.
- Lists `giftPool('common')`, `giftPool('shiny')`, `giftPool('rainbow')` as three sections titled `普通`, `閃亮`, `彩虹`, each item showing name, price (`priceOf`), and owned state (`已有` when `inventory > 0` and the item is a wearable or surface; furniture and ingredients show a count when owned).
- Tap buys via `buy`; if `null`, show `棉花糖不夠，或已經有了`.
- No timers, no rotation, no limited-time text.

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/screens/giftbox/Shop.test.tsx
import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Shop } from './Shop';
import { game } from '../../store';
import { createInitialState } from '../../../core/state';

beforeEach(() => {
  game.value = { ...createInitialState(1, 0), marshmallow: 25 };
});

it('buys a common item for 20 marshmallow', () => {
  const { getAllByText } = render(<Shop />);
  fireEvent.click(getAllByText('20 🍡')[0]);
  expect(game.value.marshmallow).toBe(5);
});

it('shows the three rarity sections and no timer text', () => {
  const { getByText, queryByText } = render(<Shop />);
  getByText('普通'); getByText('閃亮'); getByText('彩虹');
  expect(queryByText(/限時|剩餘/)).toBeNull();
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/screens/giftbox/Shop.test.tsx`.
- [ ] **Step 3: Implement** `Shop.tsx` and add the segment to `GiftBox.tsx`.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(ui): add marshmallow shop to gift box screen`.

---

## Task 23: Photo serialization and output — `ui/photo/serialize.ts`

**Files:** Create `src/ui/photo/serialize.ts`, `src/ui/photo/serialize.test.ts`.

**Interfaces:**
- Produces (see "Shared Interfaces"): `serializeForPhoto`, `assertInlineOnly`, `photoSize`, `photoToBlob`.

Rules:
- `serializeForPhoto(svg)`: `svg.cloneNode(true)`; set `xmlns="http://www.w3.org/2000/svg"` and `xmlns:xlink`; set `font-family` attribute on the root to `"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`; return `new XMLSerializer().serializeToString(clone)`.
- `assertInlineOnly(text)`: throw `Error('external resource')` if the text matches `/(href|src)\s*=\s*"(https?:|\/\/)/`, `/url\(\s*['"]?(https?:|\/\/)/`, or `/@import|@font-face/`. Internal `url(#id)` and `href="#id"` are allowed.
- `photoSize(viewBox: {w,h}, longSide)`: scale so `max(w,h) = longSide`; `w = round(viewBox.w × f)`, `h = round(viewBox.h × f)`.
- `photoToBlob(svg)`: text = `serializeForPhoto`; `assertInlineOnly(text)`; try `draw(text, longSide = 1600)`; on any failure try `draw(text, 1080)`; if that fails, throw `Error('這次拍不成功，再試一次')`. `draw` creates an `Image` from `data:image/svg+xml;charset=utf-8,` + `encodeURIComponent(text)`, waits for `onload`, draws to a canvas of `photoSize` dimensions, `canvas.toBlob(cb, 'image/png')`; reject if the blob is null.
- `photoToBlob` has no UI button attached in this plan (存到手機 is deferred). The function is exported for future use.

- [ ] **Step 1: Write the failing test**

```ts
// src/ui/photo/serialize.test.ts
import { describe, it, expect } from 'vitest';
import { assertInlineOnly, photoSize } from './serialize';

describe('photo output rules', () => {
  it('rejects external hrefs, urls and font imports', () => {
    expect(() => assertInlineOnly('<svg><image href="https://x.com/a.png"/></svg>')).toThrow('external resource');
    expect(() => assertInlineOnly('<svg style="font-family:x"><style>@import url(a.css)</style></svg>')).toThrow();
    expect(() => assertInlineOnly('<svg><rect style="fill:url(https://x/y)"/></svg>')).toThrow();
  });
  it('allows internal references', () => {
    expect(() => assertInlineOnly('<svg><g clip-path="url(#c)"/><use href="#sticker-01"/></svg>')).not.toThrow();
  });
  it('long side 1600 for a 400x480 viewBox, and 1080 retry size', () => {
    expect(photoSize({ w: 400, h: 480 }, 1600)).toEqual({ w: 1333, h: 1600 });
    expect(photoSize({ w: 400, h: 480 }, 1080)).toEqual({ w: 900, h: 1080 });
  });
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/photo/serialize.test.ts`.
- [ ] **Step 3: Implement** `serialize.ts` per rules (`photoToBlob` is not unit-tested; it is covered by the manual check in Task 29).
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(photo): add inline-only svg serialization and png size rules`.

---

## Task 24: Photo storage — `platform/photos.ts`

**Files:** Create `src/platform/photos.ts`, `src/platform/photos.test.ts`.

**Interfaces:**
- Consumes: `idbPut`, `idbGet`, `idbDelete`, `idbKeys` from `src/platform/idb.ts` (Plan A). **Assumed signatures:** `idbPut(store, key, value): Promise<void>`, `idbKeys(store): Promise<IDBValidKey[]>`, `idbDelete(store, key): Promise<void>`, `idbGet(store, key): Promise<unknown>`. If Plan A differs, adapt in this file only.
- Produces: `PhotoRecord`, `savePhoto`, `listPhotos`, `deletePhoto` (see "Shared Interfaces"). `PhotoRecord` is defined here by C (contract §10.9); Plan B writes `kind: 'legend'` records with ids prefixed `legend-`.

Rules:
- `savePhoto(rec)`: `keys = await idbKeys('photos')`; `counted = keys.filter(k => !String(k).startsWith('legend-')).length` (legend cards are not counted, contract §10.9); if `!canSavePhoto(counted)` return `'full'`; `await idbPut('photos', rec.id, rec)`; return `'ok'`. Any thrown error → `'unavailable'`.
- `listPhotos()`: keys → get each → sorted by `createdAt` descending. Errors → `[]`.
- `deletePhoto(id)`: `idbDelete('photos', id)`.

- [ ] **Step 1: Write the failing test** (uses `fake-indexeddb/auto`, imported at the top of the test; Plan A's test setup should already load it, but import it explicitly if not)

```ts
// src/platform/photos.test.ts
import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { savePhoto, listPhotos, deletePhoto } from './photos';
import * as idb from './idb';

const rec = (i: number) => ({ id: `p${i}`, createdAt: i, kind: 'photo' as const, title: '', blob: new Blob(['x']) });

describe('photo storage', () => {
  it('saves, lists newest first, deletes', async () => {
    expect(await savePhoto(rec(1))).toBe('ok');
    expect(await savePhoto(rec(2))).toBe('ok');
    expect((await listPhotos()).map((p) => p.id)).toEqual(['p2', 'p1']);
    await deletePhoto('p1');
    expect((await listPhotos()).map((p) => p.id)).toEqual(['p2']);
  });
  it('returns full at the 200 cap', async () => {
    vi.spyOn(idb, 'idbKeys').mockResolvedValueOnce(new Array(200).fill('k'));
    expect(await savePhoto(rec(999))).toBe('full');
  });
  it('returns unavailable when IndexedDB throws', async () => {
    vi.spyOn(idb, 'idbKeys').mockRejectedValueOnce(new Error('no idb'));
    expect(await savePhoto(rec(998))).toBe('unavailable');
  });
  it('legend records do not count toward the 200 cap (199 photos + 50 legend keys still saves)', async () => {
    vi.spyOn(idb, 'idbKeys').mockResolvedValueOnce([...new Array(199).fill('photo-x'), ...new Array(50).fill('legend-x')]);
    expect(await savePhoto(rec(997))).toBe('ok');
  });
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/platform/photos.test.ts`.
- [ ] **Step 3: Implement** `photos.ts` per rules.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(platform): add photo album storage with 200 cap`.

---

## Task 25: Photo mode UI — PhotoScene and PhotoOverlay

**Files:**
- Create: `src/ui/photo/PhotoScene.tsx`, `src/ui/photo/PhotoOverlay.tsx`, `src/ui/photo/PhotoOverlay.test.tsx`
- Modify: `src/ui/screens/registry.ts` (Plan A) — `OVERLAY_SCREENS.photo = PhotoOverlay`
- Modify: `src/ui/screens/Home.tsx` (Plan A) — add a 拍照 button that calls `openOverlay({ kind: 'photo', context: 'home' })`

**Interfaces:**
- Consumes: `Panda` (Plan A) with the 6 photo poses; `ITEM_ART` for stickers and frames; `savePhoto` (Task 24); `photoToBlob` (Task 23); `game`, `commit`; `closeOverlay`, `Overlay` (Plan A).
- Produces: `PhotoScene(props: { pose: PandaPose; stickers: { id: string; x: number; y: number }[]; frameId: string | null; label?: string; background: 'home' | 'plain' | { nodeId: number } })` and `PhotoOverlay(props: { overlay: Overlay })`.
- Location backdrop (contract §10.13, cross-review 21): `background: { nodeId }` renders Plan B's `LocationBackdrop({ nodeId })`. C discovers it without importing a file that may not exist yet: `const backdropModules = import.meta.glob('/src/**/LocationBackdrop.tsx', { eager: true })`, then `LocationBackdrop = Object.values(backdropModules)[0]?.LocationBackdrop ?? null`. If none exists (before Plan B), draw a solid `#E8DCCB` rect with `data-testid="photo-backdrop-plain"`. `PhotoOverlay` reads `overlay.context`: `'home'` → `background: 'home'`; `{ nodeId }` → `background: { nodeId }`.

Fixed values:
- Photo poses (exactly 6): `sit`, `armsOut`, `hug`, `starEyes`, `dance`, `celebrate`.
- Stickers: 24 from `STICKER_ITEMS` (Task 2), shown in a tray.
- Frames: 6 from `FRAME_ITEMS`, plus `無` (no frame).
- Scene viewBox: `0 0 400 480`. Sticker positions for taps cycle through `[[60,80],[320,80],[60,300],[320,300],[190,40],[190,340]]` by `stickers.length % 6`.
- `label` text font-family is the photo font stack: `"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif`.

UI:
- Pose row (6 buttons), sticker tray (24 buttons, tap adds one at the next position), frame row (7 buttons including `無`), buttons `清除貼紙` and `拍照`.
- `拍照`: `photoToBlob(svgEl)`, then `savePhoto({ id: 'photo-' + now + '-' + rand, createdAt: now, kind: 'photo', title: '熊貓照', blob })`. Results: `'ok'` → toast `已存進相簿`; `'full'` → modal text `相簿滿了（200 張）。要先刪掉一張舊照片嗎？` with buttons `去相簿刪除` (navigates to Album tab via `goTab('album')` and closes the overlay) and `先不要`; `'unavailable'` → `這次沒辦法存進相簿，裝置的儲存空間可能不能用`; a `photoToBlob` error → `這次拍不成功，再試一次`.
- The overlay must NOT render any button or text containing `下載` or `分享` or `存到手機` (save-to-phone is deferred).
- `now` and random id are created in the UI layer with `now()` and `randomSeed()` from `platform/clock.ts` (Plan A).

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/photo/PhotoOverlay.test.tsx
import { it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/preact';
import { PhotoOverlay } from './PhotoOverlay';
import * as photos from '../../platform/photos';
import * as serialize from './serialize';

beforeEach(() => {
  vi.spyOn(serialize, 'photoToBlob').mockResolvedValue(new Blob(['png']));
});

it('offers six poses, 24 stickers and six frames plus none', () => {
  const { container, getAllByRole } = render(<PhotoOverlay overlay={{ kind: 'photo', context: 'home' }} />);
  expect(container.querySelectorAll('[data-role="pose"]').length).toBe(6);
  expect(container.querySelectorAll('[data-role="sticker"]').length).toBe(24);
  expect(container.querySelectorAll('[data-role="frame"]').length).toBe(7);
});

it('saves a photo into the album on 拍照', async () => {
  const save = vi.spyOn(photos, 'savePhoto').mockResolvedValue('ok');
  const { getByText, findByText } = render(<PhotoOverlay overlay={{ kind: 'photo', context: 'home' }} />);
  fireEvent.click(getByText('拍照'));
  await findByText('已存進相簿');
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ kind: 'photo' }));
});

it('shows the delete prompt when the album is full', async () => {
  vi.spyOn(photos, 'savePhoto').mockResolvedValue('full');
  const { getByText, findByText } = render(<PhotoOverlay overlay={{ kind: 'photo', context: 'home' }} />);
  fireEvent.click(getByText('拍照'));
  await findByText(/相簿滿了（200 張）/);
});

it('location photo falls back to a solid backdrop before Plan B exists', () => {
  const { container } = render(<PhotoOverlay overlay={{ kind: 'photo', context: { nodeId: 3 } }} />);
  const rect = container.querySelector('[data-testid="photo-backdrop-plain"]');
  expect(rect?.getAttribute('fill')).toBe('#E8DCCB');
});

it('has no save-to-phone, download or share control', () => {
  const { container } = render(<PhotoOverlay overlay={{ kind: 'photo', context: 'home' }} />);
  const text = container.textContent ?? '';
  expect(/下載|分享|存到手機/.test(text)).toBe(false);
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/photo/PhotoOverlay.test.tsx`.
- [ ] **Step 3: Implement** `PhotoScene.tsx` (layers: background, Panda, stickers, frame, label), `PhotoOverlay.tsx`; update registry and Home button.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(ui): add photo mode with poses, stickers, frames and album save`.

---

## Task 26: Stage-up commemorative photo and commit wiring

**Files:**
- Create: `src/ui/photo/commemorate.ts`, `src/ui/photo/commemorate.test.ts`
- Modify: `src/ui/store.ts` (Plan A)

**Interfaces:**
- Consumes: `checkMilestones` (Task 11); `savePhoto` (Task 24); `photoToBlob` (Task 23); `PhotoScene` (Task 25); `render` from preact.
- Produces: `commemorate(stage: number): Promise<void>`.

Rules:
- `commemorate(stage)`: mount `<PhotoScene pose="celebrate" stickers={[]} frameId={null} label={`第 ${stage} 階`} background="home" />` into a detached `div`; take its `svg`; `photoToBlob`; `savePhoto({ id: 'stage-' + stage, createdAt: now(), kind: 'commemorative', title: `第 ${stage} 階`, blob })`; unmount. Errors are swallowed (the stage-up still happens; the album just has no photo).
- `id` uses the stage so a repeated call for the same stage overwrites instead of duplicating.
- Plan A's `commit` (in `ui/store.ts`) changes:
  1. Normalize input: if the argument is a `GameState`, wrap it as an `Outcome` with `events: []`.
  2. Run `checkMilestones(outcome.state)`; merge its `events` into the outcome events and use its `state`.
  3. For each event of `type === 'stageUp'`, call `commemorate(event.stage)` (fire and forget).
  4. Continue with Plan A's existing behavior (write signal, schedule save, push events to `eventQueue`).

- [ ] **Step 1: Write the failing test**

```ts
// src/ui/photo/commemorate.test.ts
import { it, expect, vi } from 'vitest';
import { commemorate } from './commemorate';
import * as photos from '../../platform/photos';
import * as serialize from './serialize';

it('saves a commemorative photo with the stage id', async () => {
  vi.spyOn(serialize, 'photoToBlob').mockResolvedValue(new Blob(['png']));
  const save = vi.spyOn(photos, 'savePhoto').mockResolvedValue('ok');
  await commemorate(2);
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: 'stage-2', kind: 'commemorative', title: '第 2 階' }));
});

it('swallows errors so a stage-up never fails', async () => {
  vi.spyOn(serialize, 'photoToBlob').mockRejectedValue(new Error('boom'));
  await expect(commemorate(3)).resolves.toBeUndefined();
});
```

Also add to `src/ui/store.test.ts` (create if Plan A did not): commit adds a milestone event when a furniture count reaches 10 and calls `commemorate` for a `stageUp` event (spy on the module).

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/photo/commemorate.test.ts src/ui/store.test.ts`.
- [ ] **Step 3: Implement** `commemorate.ts` and the `commit` changes.
- [ ] **Step 4: Run it, expected PASS.** Then `npx vitest run` for the full suite.
- [ ] **Step 5: Commit** with message `feat(ui): auto-save stage-up photo and run milestones on commit`.

---

## Task 27: Album shell, 物品圖鑑 and 食譜

**Files:**
- Create: `src/ui/album/Album.tsx`, `src/ui/album/ItemsTab.tsx`, `src/ui/album/RecipesTab.tsx`, `src/ui/album/FriendCardsTab.tsx`, `src/ui/album/StampsTab.tsx`, `src/ui/album/Album.test.tsx`
- Modify: `src/ui/screens/registry.ts` (Plan A) — `TAB_SCREENS.album = Album`

**Interfaces:**
- Consumes: `ITEMS` (Task 2); `ITEM_ART`; `game`; `RECIPES` (Plan A `content/recipes.ts`); `FoodDef`/`RecipeDef` types.
- Produces: `Album()` with six tabs in this order: `朋友卡`, `物品圖鑑`, `食譜`, `地點印章`, `回憶照片`, `熊貓日記`. `FriendCardsTab` and `StampsTab` are placeholders at `src/ui/album/` that Plan B replaces in place (keep their default export name; cross-review 7).

Behavior:
- Tab bar is horizontally scrollable inside the screen only (`overflow-x: auto` on the tab bar container; the page itself never scrolls horizontally). Each tab button ≥ 44px tall.
- `物品圖鑑`: three sub-groups `家具`、`衣服`、`墜飾` (categories `furniture` excluding friend furniture is NOT excluded: show all `furniture` items, friend furniture included at the end of the grid). Owned (`inventory > 0`): show `ITEM_ART` and name, in a cell with `data-testid="inventory-<itemId>"` (contract §10.17). Not owned: grey silhouette (`filter: brightness(0)` on the art wrapper) and `hint` text. Friend furniture not owned shows the hint too.
- `食譜`: list of `RECIPES`. Discovered (`state.recipes` includes id): name and the two input names. Undiscovered: `？？？` and a hint `把兩種食材放進鍋子試試看`.
- `朋友卡`: `FriendCardsTab` placeholder text `朋友卡即將到來` (Plan B fills).
- `地點印章`: `StampsTab` placeholder text `地點印章即將到來` (Plan B fills).

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/album/Album.test.tsx
import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { Album } from './Album';
import { game } from '../store';
import { createInitialState } from '../../core/state';

beforeEach(() => {
  game.value = { ...createInitialState(1, 0), inventory: { 'furn-sofa': 1 } };
});

it('shows the six tabs in order', () => {
  const { getByText } = render(<Album />);
  for (const t of ['朋友卡', '物品圖鑑', '食譜', '地點印章', '回憶照片', '熊貓日記']) getByText(t);
});

it('owned furniture shows its name; unowned shows a hint and no name', () => {
  const { getByText, queryByText } = render(<Album />);
  fireEvent.click(getByText('物品圖鑑'));
  getByText('小沙發');
  expect(queryByText('小床')).toBeNull();
});

it('undiscovered recipes are hidden behind question marks', () => {
  const { getByText, getAllByText } = render(<Album />);
  fireEvent.click(getByText('食譜'));
  expect(getAllByText('？？？').length).toBeGreaterThan(0);
});
```

Note: the "owned furniture" test expects the name `小沙發` to appear for owned items and to be absent for unowned items. The unowned item's name must not appear anywhere in the tab; only its hint appears.

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/album/Album.test.tsx`.
- [ ] **Step 3: Implement** the shell, three tabs, two placeholders, and registry entry.
- [ ] **Step 4: Run it, expected PASS.**
- [ ] **Step 5: Commit** with message `feat(ui): add album shell with item collection and recipe tabs`.

---

## Task 28: Album — 回憶照片 (photos) and 熊貓日記 (diary with archive)

**Files:**
- Create: `src/ui/album/PhotosTab.tsx`, `src/ui/album/DiaryTab.tsx`, `src/ui/album/DiaryTab.test.tsx`
- Modify: `src/ui/album/Album.tsx` (wire the two tabs), `src/ui/album/Album.test.tsx` (add cases)

**Interfaces:**
- Consumes: `listPhotos`, `deletePhoto` (Task 24); `stickDiary` (Task 15); `idbKeys`, `idbGet` (Plan A `platform/idb.ts`); `game`, `commit`; `STICKER_ITEMS` (C's 24 stickers, `sticker-01`…`sticker-24`, contract §10.2; Plan A creates none); `PHOTO_CAP` (Task 15).
- Produces: `PhotosTab()`, `DiaryTab()`.

Behavior:
- `回憶照片`: grid of thumbnails from `listPhotos()` (object URLs from each `blob`, revoked on unmount). Each shows a kind label: `熊貓照`、`成長紀念照`、`傳說卡`. Top shows `已存 n / 200`. Tap a photo to see it full size with a `刪除` button; `刪除` asks `window.confirm('要刪掉這張照片嗎？')` then `deletePhoto`. Empty state: `還沒有照片，去拍一張吧`.
- `熊貓日記`: entries from `game.value.diary` (newest first), then older entries from the archive. Archive read: `idbKeys('archive')` filtered to keys starting with `diary:`, each value an array of `DiaryEntry`; merged and sorted by `date` descending. Errors → only state entries shown.
- Each entry has a `貼貼紙` button that opens a sticker picker (24 stickers) and calls `stickDiary` (state entries only; archived entries are read-only, show their sticker if any).

Note on archive key format: Plan A writes archive records. This plan assumes keys `diary:<seq>` with array values. See Self-Review contract gaps.

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/album/DiaryTab.test.tsx
import 'fake-indexeddb/auto';
import { it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { DiaryTab } from './DiaryTab';
import { game } from '../store';
import { createInitialState } from '../../core/state';

beforeEach(() => {
  game.value = { ...createInitialState(1, 0), diary: [
    { date: '2026-10-17', text: '今天去了竹林', sticker: null },
    { date: '2026-10-18', text: '夢到會飛的竹筍', sticker: null },
  ] };
});

it('lists newest diary entries first', () => {
  const { getAllByTestId } = render(<DiaryTab />);
  const items = getAllByTestId('diary-entry');
  expect(items[0].textContent).toContain('夢到會飛的竹筍');
});

it('sticking a sticker records it on that entry', () => {
  const { getAllByText, getAllByLabelText } = render(<DiaryTab />);
  fireEvent.click(getAllByText('貼貼紙')[0]);
  fireEvent.click(getAllByLabelText('貼紙 星星')[0]);
  expect(game.value.diary.find((d) => d.date === '2026-10-18')!.sticker).toBe('sticker-01');
});
```

- [ ] **Step 2: Run it, expected FAIL.** `npx vitest run src/ui/album/DiaryTab.test.tsx`.
- [ ] **Step 3: Implement** `PhotosTab.tsx`, `DiaryTab.tsx`, and wire them into `Album.tsx`. Add `data-testid="diary-entry"` on each entry and `aria-label="貼紙 <name>"` on sticker buttons.
- [ ] **Step 4: Run it, expected PASS.** Then `npx vitest run src/ui/album`.
- [ ] **Step 5: Commit** with message `feat(ui): add photo album tab and diary tab with archive and stickers`.

---

## Task 29: End-to-end regression and manual verification

**Files:** Create `e2e/collection.spec.ts`.

**Interfaces:** Uses the running app from `npm run dev` or the built `dist` via Playwright's `webServer` config (Plan A). Uses `seedSave(page, patch)` from `e2e/fixtures.ts` (Plan A, contract §10.17) and the test ids `tab-giftbox`, `tab-closet`, `tab-album`, `giftbox-open`, `tray-<itemId>`, `placed-<uid>`.

- [ ] **Step 1: Write the failing E2E test**

```ts
// e2e/collection.spec.ts
import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test.describe(`collection at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('free gift box reveals an item and the 物品圖鑑 tab opens', async ({ page }) => {
      await seedSave(page, {});                                   // onboardingDone: true by default (contract §10.17)
      await page.goto('/');
      await page.getByTestId('tab-giftbox').click();
      await page.getByTestId('giftbox-open').click();
      await expect(page.getByText(/新收藏！|已經有了！/)).toBeVisible({ timeout: 4000 });
      await page.getByRole('button', { name: '好耶', exact: true }).click();
      await page.getByTestId('tab-album').click();
      await page.getByRole('button', { name: '物品圖鑑', exact: true }).click();
    });

    test('a placed furniture item survives a reload', async ({ page }) => {
      await seedSave(page, { inventory: { 'furn-plant-pot': 1 } }); // seeds only when no panda.save exists yet (Self-Review 16)
      await page.goto('/');
      await page.getByTestId('tab-closet').click();
      await page.getByRole('button', { name: '布置', exact: true }).click();
      await page.getByRole('button', { name: '擺放', exact: true }).click();
      await page.getByTestId('tray-furn-plant-pot').click();
      await expect(page.getByTestId('placed-furn-plant-pot#1')).toBeVisible();
      await page.reload();
      await page.getByTestId('tab-closet').click();
      await page.getByRole('button', { name: '布置', exact: true }).click();
      await expect(page.getByTestId('placed-furn-plant-pot#1')).toBeVisible();
    });
  });
}
```

- [ ] **Step 2: Run it, expected FAIL** before the screens are wired up in earlier tasks. Command: `npm run test:e2e -- e2e/collection.spec.ts`. After Tasks 19–28 are complete, expected PASS.
- [ ] **Step 3: Manual verification at 390×844 (iPhone viewport)** with `npm run dev`:
  - Closet: drag a furniture item in 布置模式; a 5px jitter does not start a drag; holding 300ms does. Drop onto an occupied cell: the item returns to its origin.
  - Gift box: double-tap 今日免費禮盒 quickly; only one box opens (star sand unchanged the second time).
  - Photo: take a photo, then confirm the album shows it. Confirm the overlay has no 下載 / 分享 / 存到手機 control.
  - No horizontal scroll on any screen; all buttons are at least 44px tall.
  - Landscape rotation: the existing 「把手機轉直」 hint from Plan A still shows and the editor does not break.
- [ ] **Step 4: Run the full gate.** `npm run typecheck && npm test`. Expected: all pass.
- [ ] **Step 5: Commit** with message `test(e2e): add collection regression for gift box, album and room persistence`.

---

## Self-Review

### Spec coverage (sections owned by Plan C)

| Spec section / bullet | Owned by | Task(s) |
|---|---|---|
| 7.1 房間布置：8×6 floor, 8 wall cells, sizes 1×1 / 2×1 / 2×2, no overlap | core rules, UI | 14, 16, 18 |
| 7.1 長按 300ms、8px 容差、放不下彈回 | UI | 17, 18 |
| 7.1 房間 2.5D 透視（列縮放 0.80→1.00，後方先畫）（契約 §10.14） | UI | 16, 18 |
| 7.1 互動家具（沙發、床、鞦韆、看書）在普通狀態使用 | core + Home | 14, 16 |
| 7.1 臥室 at stage 2 | core + UI | 14, 20 |
| 7.2 6 部位、8 墜飾、3 組搭配、換裝轉圈 | core + UI | 1, 5, 6, 12, 13, 19 |
| 7.2 墜飾效果與音效 | content + platform | 1, 12 |
| 7.3 拍照 6 姿勢 / 24 貼紙 / 6 相框、SVG→Canvas PNG、字型、1600/1080、禁止外部資源 | UI + platform | 23, 25 |
| 7.3 照片存入相簿（IndexedDB）、上限 200、滿了提示刪除 | platform + UI | 24, 25 |
| 7.3 存到手機：不做，保留 `photoToBlob` | UI | 23, 25 (no control), 29 |
| 7.4 禮盒 50 星砂、每日免費、開箱動畫、75/22/3、池內均等、重複轉棉花糖、用詞 | core + UI | 9, 21 |
| 7.5 棉花糖小舖：任何池內物品、20/60/200 | core + UI | 10, 22 |
| 7.6 相簿六分頁、剪影與提示、收集里程碑 | UI + core | 11, 27, 28 |
| 7.7 內容數量（家具 24＋12、牆紙／地板 6／6、衣物 20、墜飾 8、貼紙 24、相框 6、食材） | content + art | 1, 2, 4–8 |
| 4.3 階段 3 以上升階：相簿自動存成長紀念照、送免費禮盒 | UI + commit | 26 (photo); free box is Plan A's `applyReward` |
| 5.4 日記貼貼紙回應 | UI + core | 15, 28 |
| 6.4 朋友專屬家具於好感度 3/6/10 解鎖 | core + content | 2, 11 |
| 8.1 觸控規則（房間布置 `touch-action: none`、`setPointerCapture`） | UI | 18 |
| 8.2 模組：core/catalog, giftbox, shop, wardrobe, pendants, room, milestones; art/items; ui/screens | all | see File Structure |
| 10 錯誤處理：IndexedDB 不可用 → 照片無法保存並提示原因 | platform + UI | 24, 25 |
| 11 測試：禮盒分佈統計、池內均等、重複轉換、房間碰撞彈回、墜飾、里程碑、用詞 | tests | 9, 11, 14, 17, 18, 21 |

### Review Focus → test mapping

| Review Focus item | Test (task) |
|---|---|
| Touch drag stolen by iOS / pointer lost | Task 17 (`>8px cancels`, `pointercancel snaps back`); Task 18 (`touch-action none`) |
| Invalid drop corrupts room | Task 14 (bounds, overlap); Task 18 (snap back, state unchanged) |
| Double tap charges twice | Task 21 (`double tap opens exactly one box`) |
| Photo export fails on iOS | Task 23 (`assertInlineOnly`, `photoSize`); Task 29 manual |
| Photo storage full / unavailable | Task 24 (`full` at 200, `unavailable` on throw) |
| Over-equipping pendants and wrong-slot outfits | Task 13 (`setPendants` capacity, `equip` slot check) |
| Banned wording | Task 21 (source scan) |

### Contract gaps and decisions (this plan's assumptions)

1. **Friend level formula.** Resolved by contract §10.4: the single implementation is Plan A's `core/friendLevel.ts` (`levelOf(59) = 2`, `levelOf(60) = 3`). Plan C no longer computes levels; Task 11 pins 59/60 through `levelOf` and checks that no friend furniture is granted.
2. **IndexedDB helper signatures.** The contract lists `idbGet/idbPut/idbDelete/idbKeys(store)` without arguments. Task 24 assumes `idbPut(store, key, value)`, `idbGet(store, key)`, `idbDelete(store, key)`, `idbKeys(store)`. Plan A must match or Task 24 adapts.
3. **Archive key format.** Task 28 assumes Plan A archives diary entries under keys `diary:<seq>` with array values in the `archive` store. Plan A must confirm this format (or Task 28 adapts).
4. **Legend cards (傳說卡).** Resolved by contract §10.9: Plan B writes `PhotoRecord { kind: 'legend' }` (type from Task 24) with an id prefixed `legend-`. Those records are listed by PhotosTab (Task 28) and are not counted toward `PHOTO_CAP` (Task 24).
5. **Stickers, frames, and poses are always available.** The spec does not say how stickers or frames are obtained. This plan treats all 24 stickers, 6 frames and 6 poses as unlocked from the start; this is a decision, not a contract value. Confirm with the owner.
6. **Starter item values.** Resolved by contract §10.2: `furn-nest`, `furn-low-table`, `furn-cushion` are `inGiftPool: true`; `wall-default`, `floor-default`, `pendant-bamboo` are `false`. Task 1 asserts these values.
7. **ITEM_ART root.** Each art component returns its own `<svg viewBox="0 0 100 100">` so it can be nested inside `RoomView`, Panda, and photo scenes. Plan A's `ITEM_ART` type `ComponentType<{ size: number }>` is unchanged.
8. **Pendant sound ids.** The contract says `sound?: string` without listing ids. This plan defines them (`chime-bamboo`, `chime-shell`, `chime-snow`, `chime-cloud`, `chime-star`, `chime-moon`, `chime-mushroom`, `chime-heart`) and tones in `platform/pendantSound.ts`, a file Plan C owns.
9. **Ingredient ItemDefs.** Resolved by contract §10.2: Plan A's `INGREDIENTS` is already `ItemDef[]` and is part of `ITEMS`. Plan C does not re-derive or duplicate them. Plan A must use 4 common and 2 shiny (§10.1), which the pool counts in Task 2 depend on.
10. **Floor geometry.** Resolved by contract §10.14: the floor uses the 2.5D row scale (0.80 back → 1.00 front) in `ui/room/perspective.ts`. Collision stays on the integer grid; drop targets are found with `pixelToCell`.
11. **Commit attribution.** Resolved by contract §10.19 and the Global Constraints: every commit message in this plan ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
12. **Friend furniture grant path.** Ids are `furn-<friendId>-<k>` (contract §10.3). Only Plan B's `addAffinity` grants them at levels 3, 6, 10. Task 11 checks that `checkMilestones` does not.
13. **Diary dream.** The pendant id is `pendant-moon-bell`. Task 12 replaces Plan A's temporary check with `pendantModifiers(s).diaryDream` (contract §10.11).
14. **Location photo backdrop.** Plan B's `LocationBackdrop` is discovered by glob in Task 25 and falls back to a solid `#E8DCCB` rect until it exists (contract §10.13).
15. **Album paths.** All album files stay under `src/ui/album/`. Plan B replaces the placeholders there in place (cross-review 7).
16. **E2E fixture guard.** `seedSave` must write `panda.save` only when no save exists yet. Otherwise the reload test in Task 29 reseeds on reload and fails. This is a requirement on Plan A's `e2e/fixtures.ts` (contract §10.17).
17. **Pool counts depend on Plan A.** Task 2 expects 37 common, 18 shiny and 12 rainbow in the gift pool. That needs Plan A's starter pool flags (§10.2) and ingredient rarities of 4 common and 2 shiny (§10.1).

### Cross-review revisions applied in this pass (plan C side)

- Issue 2: friend furniture grant removed from `checkMilestones` (Task 11). Ids kept as `furn-<friendId>-<k>`.
- Issue 3: friend level tests pinned to `levelOf(59) = 2`, `levelOf(60) = 3` (Task 11). No local level helper.
- Issue 4: starter pool flags and ingredient rarity align with contract §10.1 and §10.2. The pool breakdown is in Task 2.
- Issue 5: C owns all 24 stickers (`sticker-01`…`sticker-24`). Plan A creates none (Tasks 2 and 28).
- Issue 6: C edits Plan A's `content/items/index.ts` and keeps `ITEM_BY_ID`. Ingredients are not re-derived (Tasks 2 and 3).
- Issue 7: album paths are under `src/ui/album/` (Task 27 and Files).
- Issue 15: test ids per §10.17 (`tab-*`, `giftbox-open`, `tray-*`, `placed-*`, `room-cell-*`, `inventory-*`). E2E uses `seedSave` (Tasks 16, 18, 20, 21, 27, 29).
- Issue 19: collar tap plays one tone per equipped pendant, 350 ms apart (Tasks 12 and 16).
- Issue 20: `pendant-moon-bell` diary dream is consumed through `pendantModifiers` (Task 12).
- Issue 21: photo mode uses `LocationBackdrop` when present, a solid color before (Task 25).
- Issue 22: legend records have kind `legend` and a `legend-` id, not counted in the cap (Task 24).
- Issue 24: 2.5D row scale 0.80 → 1.00 with exact-value tests (Task 16) and pixel-to-cell tests (Task 16, used by Task 18).
- Issue 25: all commit trailers are Claude Opus 5.5 (Global Constraints, Tasks 4–8, 10, 11, 12).
- Issue 26: `ITEM_ART` lives in `src/art/items/index.tsx` (Files, Tasks 4–8).
- Issue 27: ingredient drop is 30% base; a mushroom pendant adds 30 points, so 60%. `ingredientDropChance` is tested in Task 12.
- Other issues (1, 8–14, 16–18, 23, 28) are in plans A and B. Plan C has no changes for them.

### Intentionally left to other plans

- Plan A: Home base, commit/store core, `starter.ts`, `createInitialState`, idb, audio, particles, clock, router, RewardToast, Panda component, `applyReward`, daily handler, and save/archive writes.
- Plan B: map, locations, stamps tab content, friends tab content, story, legend cards, friend affinity logic, and `levelOf`.
- Out of this plan's first version: save-to-phone (存到手機), bathroom/garden/treehouse rooms, extra abilities and rooms, and the location photo backdrop (Plan B supplies a backdrop for `context: { nodeId }`).
