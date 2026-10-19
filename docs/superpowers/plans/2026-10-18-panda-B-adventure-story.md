# 冒險與故事 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成「窗外」冒險迴圈（地圖生成、地點場景、謎題與小遊戲、朋友好感、主線與小傳說、信件與來訪、相簿朋友卡與印章），並以端對端測試與真機清單驗收。

**Architecture:** 純邏輯在 `src/core/`（mapgen、locationgen、location、minigames、friends、story、letters、adventureDaily、puzzles），內容資料在 `src/content/`，畫面在 `src/art/`（SVG）與 `src/ui/`（Preact）。所有時間與種子由呼叫端傳入，地點內容以 `hash(seed, …)` 決定，存檔只存節點與快照。

**Tech Stack:** TypeScript (strict), Preact + @preact/signals, Vite, Vitest + jsdom + @testing-library/preact, fake-indexeddb, Playwright（Chromium 與 WebKit）

**Spec:** docs/superpowers/specs/2026-10-18-baby-panda-game-design.md
**Contract:** docs/superpowers/plans/2026-10-18-panda-00-shared-contract.md

Execution order: A → C → B。本計畫假設 A、C 已完成，依契約使用其簽名。

## Global Constraints

- 核心邏輯 `src/core/` 不呼叫 `Date.now()` / `Math.random()`；`now`（epoch ms）與種子由呼叫端傳入。UI 元件同樣不直接呼叫 `Date.now()`，一律使用 `platform/clock.ts` 的 `now()`（契約 §10.15）。
- 種子工具只用契約的 `mulberry32`、`hash`（FNV-1a）、`pick`、`chance`（A 建立）。
- 生成器版本 `GENERATOR_VERSION = 1`；節點快照建立後不再依內容表重算。
- 地點進入需要元氣 ≥ 25；完成時扣 25；中途離開不扣元氣。
- 首次完成地點：成長值 +30、星砂 15～25、金鏈 +1。
- 重訪完成地點：成長值 +10（每天最多計 3 次）、星砂 8～12、金鏈 +1；超過後仍給星砂與寶物，不給成長值。
- 地點祕密：成長值 +10、星砂 +10（每個地點只領一次）。
- 小遊戲：30 秒、30% 機率出現、可跳過（跳過不影響完成）、獎勵 5～15（依表現，成長值與星砂相同）。
- 朋友好感：聊天 +1（每位每天最多 3 次）、送禮 +5（送到喜歡的禮物 +10）、完成請求 +10。
- 朋友等級：第 n 級的單級所需點數為 20 × n，沒有上限；第 3、6、10 級解鎖朋友專屬家具；第 1–5 級依序解鎖專屬故事線第 1–5 段。
- 地圖：首次完成地點後延伸 1–2 個節點（各 50%）；能力門檻機率 25%；地形 6 種、每種 2 版型、天氣 5 種、地標 12 種、怪事 20 種、居民朋友 50%。
- 手工地點順序：竹林小徑 → 雲朵郵局 → 貝殼灣；貝殼灣之後才開始生成。
- 能力門檻只用已實作能力：爬樹、潛水；竹林、蘑菇森林→爬樹；海邊、星空湖→潛水；雲上、雪山→不加門檻。
- 地點熱點 4–6 個，每個熱點可點範圍 ≥ 44px。
- 主線觸發以全域累計首次完成地點數：3→ch1、6→ch2、9→ch3、12→ch4、15→ch5、20、25、30…→小傳說（每 5 個一則）。
- 小傳說模板 10 種；每則都提到一個主線線索或一位朋友。
- 信件：每天最多 1 封，不過期；主存檔最多保留 30 封，更舊的移入 IndexedDB 封存。
- 朋友來訪：每天最多一次，30% 機率；離開時留下一個小禮物。
- 觸控：窗外地圖 `touch-action: pan-y`；場景、小遊戲區 `touch-action: none`；按鈕觸控區 ≥ 44px。
- 版面：最大寬度 480px，左右邊距 16px，不產生水平捲動；手機驗收尺寸 390×844。
- 所有玩家看得到的文字為繁體中文（台灣用語），風格俏皮但不幼稚（spec 原則 5）。
- 文案不使用「抽卡」「保底」字眼。
- 不引用外部圖片或字型；場景與地標全部以 SVG 繪製。
- 每個 commit 訊息結尾加上：`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. 連點與重複觸發（熱點、完成、小遊戲結束）造成重複獎勵 → Task 6（重複點擊測試）、Task 7（重複完成測試）、Task 9（`finishMinigame` 只計一次）。
2. 手指滑動被誤判（地圖上下捲動與場景點擊／拖曳衝突）→ Task 17（地圖 `touch-action: pan-y` 測試）、Task 19（場景 `touch-action: none` 測試）、Task 22（小遊戲區 `touch-action: none` 測試）。
3. 午夜跨日或系統時間倒退（進行中的地點、每日重置）→ Task 6（跨日重置進度測試）、Task 12（每日重置與日期倒退測試）。
4. 地圖軟鎖（所有未探索節點都需要能力）與元氣不足卡住 → Task 5（`ensureEnterable` 測試）、Task 6（元氣門檻測試）、Task 20（不足時顯示休息提示測試）。
5. 切換 App 或 `pagehide` 中斷小遊戲，造成卡住或重複獎勵 → Task 9（`finishMinigame` 守門測試）、Task 22（`pagehide` 中止測試）。

## File Structure

Create:
- `src/content/locations.ts` — 地形（6）、版型數、地形名詞、天氣（5）、地標（12）、怪事（20）的資料與 id。
- `src/content/locations.test.ts` — 內容數量、唯一性、地形能力對應測試。
- `src/core/test-helpers.ts` — 測試用 `fresh()`、`handmadeNode()`、`dayLater()`（只供測試引用）。
- `src/core/locationgen.ts` — `GENERATOR_VERSION`、`generateSnapshot`、`terrainOf`、`nameOf`、`dailyLayout`，並匯出 `LocationLayout`、`HotspotDef`。
- `src/core/locationgen.test.ts` — 快照確定性、能力門檻、熱點與寶物、謎題佈局測試。
- `src/core/puzzles.ts` — 4 種謎題的生成與答案檢查（純函式）。
- `src/core/puzzles.test.ts` — 謎題可解、答案唯一測試。
- `src/core/mapgen.ts` — 手工鏈、子節點生成、`canEnter`、`ensureEnterable`。
- `src/core/mapgen.test.ts`
- `src/core/location.ts` — `layoutFor`、`enter`、`tapHotspot`、`talk`、`bringFood`、`solveSecret`、`complete`、`finishMinigame`。
- `src/core/location.test.ts`
- `src/core/minigames.ts` — 30% 出現判定、表現分數、獎勵換算、計時。
- `src/core/minigames.test.ts`
- `src/core/friends.ts` — 從 `core/friendLevel.ts`（A）重新匯出 `levelOf`；`addAffinity`、`chat`、`giveGift`、`storySegmentsUnlocked`。
- `src/core/friends.test.ts`
- `src/core/story.ts` — `checkStory`、`ackBeat`、`markBeatSeen`、`legendCards`。
- `src/core/story.test.ts`
- `src/core/letters.ts` — 每日信件、`addLetter`（新信放最前面，不裁切）、`markLetterRead`。封存切分使用 A 的 `core/save.ts` `splitArchive`（已在 `ui/store.ts` 的 commit 中呼叫），B 不另外實作。
- `src/core/letters.test.ts`
- `src/core/adventureDaily.ts` — 每日處理器（重置、信件、來訪），匯出 `adventureHandlers`，由 `core/daily.ts` 的 `dailyHandlers` 陣列列出（契約 §10.16）。
- `src/core/adventureDaily.test.ts`
- `src/content/friends.ts` — 4 位朋友的資料（名字、喜歡的食物、聊天句、信件句、故事線）。
- `src/content/friends.test.ts`
- `src/content/friendLetters.ts` — 朋友信件句庫（每位朋友 3 封，共 12 封）。歡迎回來信屬於計畫 A 的 `content/letters.ts`，本計畫不建立（契約 §10.5、§10.9）。
- `src/content/story/chapters.ts` — 序章之後的 ch1–ch5 腳本與 5 個項圈線索。
- `src/content/story/chapters.test.ts`
- `src/content/story/friend-stories.ts` — 4 位朋友 × 5 段故事線腳本（`friend-<id>-<n>`）。
- `src/content/story/legends.ts` — 10 個小傳說模板與 `legendScript(seed, n)`。
- `src/content/story/legends.test.ts`
- `src/content/locations/handmade.ts` — 3 個手工地點（名稱、場景、居民、謎題覆寫、對話、線索）。
- `src/content/locations/handmade.test.ts`
- `src/art/scenes/terrains.tsx` — 6 地形 × 2 版型的背景 SVG。
- `src/art/scenes/weather.tsx` — 5 種天氣覆蓋層（`pointer-events: none`）。
- `src/art/scenes/LocationScene.tsx` — 組合背景、天氣、熱點按鈕（HTML 按鈕疊在 SVG 上）。
- `src/art/scenes/LocationScene.test.tsx`
- `src/ui/components/LocationBackdrop.tsx` — 拍照模式用的地點背景（無熱點），匯出 `LocationBackdrop({ nodeId })`。
- `src/ui/components/LocationBackdrop.test.tsx`
- `src/art/landmarks.tsx` — 12 個地標 SVG 元件與 `LANDMARK_ART`。
- `src/ui/screens/mapLayout.ts` — 節點深度與垂直蜿蜒座標計算（純函式）。
- `src/ui/screens/mapLayout.test.ts`
- `src/ui/screens/MapScreen.tsx` — 窗外地圖畫面。
- `src/ui/screens/MapScreen.test.tsx`
- `src/ui/screens/LocationScreen.tsx` — 地點場景覆蓋畫面（熱點、對話、請求、完成、祕密入口）。
- `src/ui/screens/LocationScreen.test.tsx`
- `src/ui/components/PuzzleView.tsx` — 4 種謎題的互動元件。
- `src/ui/components/PuzzleView.test.tsx`
- `src/ui/components/Minigame.tsx` — 3 種 30 秒小遊戲（可跳過、`pagehide` 中止）。
- `src/ui/components/Minigame.test.tsx`
- `src/ui/components/VisitorCard.tsx` — 家裡來訪朋友卡（送客按鈕）。
- `src/ui/components/VisitorCard.test.tsx`
- `src/ui/components/legendRecord.ts` — `recordLegend(seed, n, now)`：把傳說寫入 IndexedDB `photos`（`kind: 'legend'`，不計入 200 張照片上限）。
- `src/ui/components/legendRecord.test.ts`
- `src/ui/album/FriendCardsTab.tsx` — 覆寫 C 的佔位分頁：相簿「朋友卡」分頁（等級、進度、故事線按鈕）。
- `src/ui/album/FriendCardsTab.test.tsx`
- `src/ui/album/StampsTab.tsx` — 覆寫 C 的佔位分頁：相簿「地點印章」分頁（已完成蓋章、祕密星星、線索列表）。
- `src/ui/album/StampsTab.test.tsx`
- `src/ui/album/LegendCards.tsx` — 傳說卡清單（讀取 IndexedDB `photos` 中 `kind: 'legend'` 的記錄，給回憶照片分頁引用）。
- `e2e/adventure.spec.ts` — 端對端回歸測試（390×844 與 1280×800，Chromium 與 WebKit）。
- `docs/device-test-checklist.md` — 女兒 iPhone 真機測試清單（Chrome 分頁、主畫面 App、Safari 抽測）。

Modify:
- `src/core/daily.ts`（A 建立）— 在 `dailyHandlers` 陣列字面值中加入 `...adventureHandlers`（`import { adventureHandlers } from './adventureDaily'`；不使用副作用 import）。
- `src/content/story/index.ts`（A 建立）— `SCRIPTS` 加入 ch1–ch5 與朋友故事線；呼叫 A 的 `registerScriptResolver` 登記小傳說解析（契約 §10.8）。
- `src/ui/components/Dialogue.tsx`（A 建立）— 開啟 `legend-N` 時呼叫 `recordLegend`；並以 A 的 `registerBeatAck(ackBeat)` 註冊關閉劇情時的處理（A 的 `dismissOverlay` 是唯一關閉路徑）。
- `src/ui/screens/registry.ts`（A 建立）— 登記 `map`、`location` overlay。
- `src/ui/album/Album.tsx`（C 建立）— 把「朋友卡」「地點印章」分頁換成 `FriendCardsTab`、`StampsTab`，「回憶照片」分頁嵌入 `LegendCards`。

---

## Shared test helper (used by many tasks)

### Task 0: Test helpers

**Files:**
- Create: `src/core/test-helpers.ts`

**Interfaces:**
- Consumes: `createInitialState`, `localDate` (A)
- Produces:
  - `export const NOW: number` = `Date.parse('2026-10-18T10:00:00+08:00')`
  - `export function fresh(seed?: number): GameState` (default seed 12345, `createInitialState(seed, NOW)`)
  - `export function handmadeNode(s: GameState, id: HandmadeId): MapNode`
  - `export function dayLater(ms?: number): number` (default one day)
  - `export const TODAY: string` = `localDate(NOW)`

- [ ] **Step 1: Write the helper** (no separate test; it is exercised by later tasks)

- [ ] **Step 2: Implement** `src/core/test-helpers.ts`: plain functions as listed; `handmadeNode` finds the node whose `snapshot.kind === 'handmade' && handmadeId === id` and throws if missing (so a missing initial node fails loudly).

- [ ] **Step 3: Verify it compiles**
Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**
```bash
git add src/core/test-helpers.ts
git commit -m "test(adventure): add shared test helpers for map and location tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Content and generation

### Task 1: Location content data

**Files:**
- Create: `src/content/locations.ts`, `src/content/locations.test.ts`

**Interfaces:**
- Consumes: `Terrain`, `Ability`, `Weather` string union from the snapshot (`LocationSnapshot` in `src/core/state.ts`)
- Produces:
  - `TERRAINS: { id: Terrain; noun: string; ability: Ability | null; layouts: 2 }[]`（6 筆）
  - `WEATHERS: { id: 'sunny' | 'rain' | 'fog' | 'snow' | 'rainbow'; name: string }[]`（5 筆）
  - `LANDMARKS: { id: string; name: string }[]`（12 筆）
  - `QUIRKS: { id: string; phrase: string; event: string }[]`（20 筆）

- [ ] **Step 1: Write the failing test**

```ts
// src/content/locations.test.ts
import { describe, it, expect } from 'vitest';
import { TERRAINS, WEATHERS, LANDMARKS, QUIRKS } from './locations';

describe('location content', () => {
  it('matches spec counts', () => {
    expect(TERRAINS).toHaveLength(6);
    expect(WEATHERS).toHaveLength(5);
    expect(LANDMARKS).toHaveLength(12);
    expect(QUIRKS).toHaveLength(20);
  });
  it('ids are unique', () => {
    expect(new Set(LANDMARKS.map(l => l.id)).size).toBe(12);
    expect(new Set(QUIRKS.map(q => q.id)).size).toBe(20);
  });
  it('quirk phrases end with 的 so names read naturally', () => {
    for (const q of QUIRKS) expect(q.phrase.endsWith('的')).toBe(true);
  });
  it('terrain abilities follow spec 6.3 exactly', () => {
    const map = Object.fromEntries(TERRAINS.map(t => [t.id, t.ability]));
    expect(map).toEqual({ bamboo: 'climb', mushroom: 'climb', beach: 'dive', starlake: 'dive', cloud: null, snow: null });
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/content/locations.test.ts`
Expected: FAIL（module `./locations` not found）

- [ ] **Step 3: Implement `src/content/locations.ts`**
Data only. Terrain nouns (used in names as `phrase + noun`): bamboo「竹林」、beach「海岸」、cloud「雲梯」、snow「雪山」、mushroom「蘑菇林」、starlake「星湖」。Weather names: sunny「晴」、rain「雨」、fog「霧」、snow「下雪」、rainbow「彩虹」。Landmark ids and names: `lm-treehouse` 樹屋、`lm-stone-bridge` 石橋、`lm-windmill` 風車、`lm-lighthouse` 燈塔、`lm-firefly-lamp` 螢火燈籠、`lm-cabin` 小木屋、`lm-swing-tree` 鞦韆樹、`lm-waterwheel` 水車、`lm-sky-garden` 空中花園、`lm-giant-mushroom` 巨菇、`lm-pavilion` 小涼亭、`lm-star-well` 流星井。Quirk ids `q01`…`q20`; phrase must end in「的」; examples: `q01` 「會唱歌的」/「鹽湖裡的歌聲，聽起來像在打哈欠」; `q02` 「打呵欠的」; `q03` 「下糖果雨的」. Author the remaining 17 quirks in the same shape (one short event sentence each, witty, no baby talk).

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/content/locations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/content/locations.ts src/content/locations.test.ts
git commit -m "feat(content): add location terrains, weathers, landmarks and quirks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Generated snapshot (`generateSnapshot`)

**Files:**
- Create: `src/core/locationgen.ts`, `src/core/locationgen.test.ts`

**Interfaces:**
- Consumes: `mulberry32`, `pick`, `chance` (A, `core/rng.ts`); `TERRAINS`, `WEATHERS`, `LANDMARKS`, `QUIRKS` (Task 1); `LocationSnapshot`, `Ability`, `FriendId` (`core/state.ts`)
- Produces:
  - `export const GENERATOR_VERSION = 1`
  - `export function generateSnapshot(seed: number, abilitiesImplemented: readonly Ability[]): LocationSnapshot`
  - `export function terrainOf(snap: LocationSnapshot): Terrain`（handmade: bamboo-path→bamboo、cloud-post→cloud、shell-bay→beach）
  - `export function nameOf(snap: LocationSnapshot): string`（handmade 名稱在 Task 17 改讀 `HANDMADE`；本任務先以常數表內嵌三個名字）

- [ ] **Step 1: Write the failing test**

```ts
// src/core/locationgen.test.ts
import { describe, it, expect } from 'vitest';
import { generateSnapshot, GENERATOR_VERSION } from './locationgen';
import { TERRAINS } from '../content/locations';

describe('generateSnapshot', () => {
  it('is deterministic for the same seed', () => {
    expect(generateSnapshot(42, ['climb', 'dive'])).toEqual(generateSnapshot(42, ['climb', 'dive']));
  });
  it('is generated kind with the current generatorVersion', () => {
    const snap = generateSnapshot(7, ['climb', 'dive']);
    expect(snap.kind).toBe('generated');
    if (snap.kind === 'generated') expect(snap.generatorVersion).toBe(GENERATOR_VERSION);
  });
  it('only requires implemented abilities and only where the terrain maps to it', () => {
    for (let seed = 1; seed < 2000; seed++) {
      const snap = generateSnapshot(seed, ['climb', 'dive']);
      if (snap.kind !== 'generated' || snap.requires === null) continue;
      expect(['climb', 'dive']).toContain(snap.requires);
      expect(TERRAINS.find(t => t.id === snap.terrain)!.ability).toBe(snap.requires);
    }
  });
  it('never requires an ability that is not implemented', () => {
    for (let seed = 1; seed < 500; seed++) {
      const snap = generateSnapshot(seed, []);
      if (snap.kind === 'generated') expect(snap.requires).toBeNull();
    }
  });
  it('gates about 25% of terrain-eligible nodes (4 of 6 terrains map to an ability)', () => {
    let gated = 0, n = 4000;
    for (let seed = 1; seed <= n; seed++) {
      const snap = generateSnapshot(seed * 7919, ['climb', 'dive']);
      if (snap.kind === 'generated' && snap.requires !== null) gated++;
    }
    const rate = gated / n; // expected 0.25 * 4/6 ≈ 0.167
    expect(rate).toBeGreaterThan(0.14);
    expect(rate).toBeLessThan(0.19);
  });
  it('resident is a friend about 50% of the time', () => {
    let friends = 0, n = 4000;
    for (let seed = 1; seed <= n; seed++) {
      const snap = generateSnapshot(seed * 104729, ['climb', 'dive']);
      if (snap.kind === 'generated' && snap.resident !== 'passerby') friends++;
    }
    expect(friends / n).toBeGreaterThan(0.45);
    expect(friends / n).toBeLessThan(0.55);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/locationgen.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `generateSnapshot` in `src/core/locationgen.ts`**
Create `mulberry32(seed)` and draw in this fixed order (order matters for determinism): terrain (pick TERRAINS), layout (0 or 1, pick), weather (pick), landmark (pick), resident (chance 0.5 → pick of the 4 FriendIds, else 'passerby'), quirk (pick QUIRKS), gate (chance 0.25), then requires = gate && terrain.ability !== null && abilitiesImplemented includes it ? ability : null. Name = quirk.phrase + TERRAINS noun. Return `{ kind: 'generated', generatorVersion: GENERATOR_VERSION, name, terrain, layout, weather, landmarkId, resident, quirkId, requires }`. Also add `terrainOf` and `nameOf` (handmade names: 竹林小徑、雲朵郵局、貝殼灣).

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/locationgen.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/locationgen.ts src/core/locationgen.test.ts
git commit -m "feat(core): generate location snapshots with ability gating" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Puzzle logic (`puzzles.ts`)

**Files:**
- Create: `src/core/puzzles.ts`, `src/core/puzzles.test.ts`

**Interfaces:**
- Consumes: `mulberry32`, `pick` (A)
- Produces:
  - `export const SHAPES = ['leaf', 'moon', 'star', 'drop', 'cloud', 'shell'] as const`
  - `export type PuzzleKind = 'shadow' | 'sequence' | 'diff' | 'codelock'`
  - `export type Puzzle =`
    - `{ kind: 'shadow'; target: string; options: string[]; answer: number }`
    - `{ kind: 'sequence'; shown: string[]; options: string[]; answer: number }`
    - `{ kind: 'diff'; options: string[][]; answer: number }`（3 個面板，每個 3 個形狀）
    - `{ kind: 'codelock'; code: string }`（3 位數字 `'1'..'9'`）
  - `export function generatePuzzle(rand: () => number, kind: PuzzleKind): Puzzle`
  - `export function checkAnswer(p: Puzzle, input: number | string | null): boolean`（shadow/sequence/diff 接受選項索引；codelock 接受字串，需完全相同）

- [ ] **Step 1: Write the failing test**

```ts
// src/core/puzzles.test.ts
import { describe, it, expect } from 'vitest';
import { generatePuzzle, checkAnswer, SHAPES } from './puzzles';
import { mulberry32 } from './rng';

describe('puzzles', () => {
  it('shadow: 3 distinct options, exactly one matches target, answer index correct', () => {
    for (let s = 1; s <= 200; s++) {
      const p = generatePuzzle(mulberry32(s), 'shadow');
      if (p.kind !== 'shadow') throw new Error('kind');
      expect(new Set(p.options).size).toBe(3);
      expect(p.options.filter(o => o === p.target)).toHaveLength(1);
      expect(p.options[p.answer]).toBe(p.target);
      expect(checkAnswer(p, p.answer)).toBe(true);
      expect(checkAnswer(p, (p.answer + 1) % 3)).toBe(false);
    }
  });
  it('sequence: alternating pattern, answer is the next shape in the pattern', () => {
    for (let s = 1; s <= 200; s++) {
      const p = generatePuzzle(mulberry32(s), 'sequence');
      if (p.kind !== 'sequence') throw new Error('kind');
      expect(p.shown).toHaveLength(4);
      expect(p.shown[2]).toBe(p.shown[0]);
      expect(p.shown[3]).toBe(p.shown[1]);
      expect(p.options[p.answer]).toBe(p.shown[0]);
      expect(new Set(p.options).size).toBe(3);
    }
  });
  it('diff: exactly one of the three panels differs from the other two', () => {
    for (let s = 1; s <= 200; s++) {
      const p = generatePuzzle(mulberry32(s), 'diff');
      if (p.kind !== 'diff') throw new Error('kind');
      const [a, b, c] = p.options.map(o => o.join('|'));
      const odd = a === b ? 2 : a === c ? 1 : 0;
      expect(p.answer).toBe(odd);
      expect(new Set([a, b, c]).size).toBe(2);
    }
  });
  it('codelock: 3 digits from 1 to 9; checkAnswer needs the exact string', () => {
    const p = generatePuzzle(mulberry32(5), 'codelock');
    if (p.kind !== 'codelock') throw new Error('kind');
    expect(p.code).toMatch(/^[1-9]{3}$/);
    expect(checkAnswer(p, p.code)).toBe(true);
    expect(checkAnswer(p, '000')).toBe(false);
  });
  it('shapes come from the fixed six-shape set', () => {
    const p = generatePuzzle(mulberry32(9), 'shadow');
    if (p.kind === 'shadow') for (const o of p.options) expect(SHAPES).toContain(o);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/puzzles.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/core/puzzles.ts`**
- shadow: target = pick(SHAPES); pick 2 distinct other shapes; shuffle the three with rand (Fisher-Yates); answer = index of target.
- sequence: a,b = two distinct shapes; shown = [a,b,a,b]; wrong options = two distinct shapes not equal to a; options = shuffle([a, w1, w2]); answer = index of a.
- diff: base = 3 random shapes; odd = copy of base with one random position replaced by a different shape; options = shuffle of [base, base, odd]; answer = index of odd.
- codelock: 3 digits each `1 + floor(rand()*9)` as string.
- checkAnswer: codelock → `input === p.code`; others → `input === p.answer` (null → false).

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/puzzles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/puzzles.ts src/core/puzzles.test.ts
git commit -m "feat(core): add four puzzle generators and answer checks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Daily layout (`dailyLayout`)

**Files:**
- Modify: `src/core/locationgen.ts`, `src/core/locationgen.test.ts`

**Interfaces:**
- Consumes: `generatePuzzle` (Task 3), `giftPool(rarity)` (C, `core/catalog.ts`), `INGREDIENT_IDS` (A, `content/ingredients.ts`), `FOOD_IDS` (A, `content/foods.ts`), `hash`, `mulberry32`, `pick`, `chance`
- Produces:

```ts
export type TreasureReward = { kind: 'starSand'; amount: number } | { kind: 'ingredient'; id: string } | { kind: 'item'; id: string };
export interface HotspotDef {
  id: string;                       // 'treasure' | 'extra' | 'request' | 'secret' | 'clue0'..'clue2' | 'f0'..'f5'
  x: number; y: number;             // 0..SCENE_W / 0..SCENE_H
  role: 'filler' | 'treasure' | 'extra' | 'request' | 'hidden' | 'clue';
  reward?: TreasureReward;          // treasure / extra only
  clue?: string;                    // clue only
}
export interface LocationLayout {
  hotspots: HotspotDef[];           // 4–6 entries before pendant extras
  secret: { kind: 'hidden' } | { kind: 'puzzle'; puzzle: Puzzle };
  request: { kind: 'find' } | { kind: 'bring'; foodId: string };
  event: string;                    // 今日小事件（來自 QUIRKS.event）
}
export const SCENE_W = 360; export const SCENE_H = 480;
export function dailyLayout(node: MapNode, date: string): LocationLayout;
```

- [ ] **Step 1: Write the failing test** (append to `locationgen.test.ts`)

```ts
import { dailyLayout } from './locationgen';
import { fresh } from './test-helpers';
import { TODAY, dayLater, NOW } from './test-helpers';
import { localDate } from './time';

const node = () => fresh().map.nodes[0]; // 竹林小徑（handmade bamboo-path）

describe('dailyLayout', () => {
  it('has 4 to 6 hotspots with exactly one treasure and at least one request hotspot or bring request', () => {
    for (let d = 0; d < 60; d++) {
      const L = dailyLayout(node(), localDate(NOW + d * 86400000));
      expect(L.hotspots.length).toBeGreaterThanOrEqual(4);
      expect(L.hotspots.length).toBeLessThanOrEqual(6);
      expect(L.hotspots.filter(h => h.role === 'treasure')).toHaveLength(1);
      expect(L.hotspots.find(h => h.role === 'treasure')!.reward).toBeDefined();
    }
  });
  it('hidden secret is a hotspot with id "secret"; puzzle secret adds no hidden hotspot', () => {
    for (let d = 0; d < 60; d++) {
      const L = dailyLayout(node(), localDate(NOW + d * 86400000));
      const hidden = L.hotspots.filter(h => h.role === 'hidden');
      if (L.secret.kind === 'hidden') { expect(hidden).toHaveLength(1); expect(hidden[0].id).toBe('secret'); }
      else expect(hidden).toHaveLength(0);
    }
  });
  it('codelock puzzle has exactly 3 clue hotspots whose text contains the code digits in order', () => {
    let checked = 0;
    for (let d = 0; d < 400; d++) {
      const L = dailyLayout({ ...node(), seed: d * 31 + 7 }, '2026-10-18');
      if (L.secret.kind !== 'puzzle' || L.secret.puzzle.kind !== 'codelock') continue;
      const clues = L.hotspots.filter(h => h.role === 'clue').sort((a, b) => a.id.localeCompare(b.id));
      expect(clues).toHaveLength(3);
      clues.forEach((c, i) => expect(c.clue).toContain(L.secret.puzzle.code[i]));
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  it('is deterministic per node and date, and changes across dates', () => {
    const n = node();
    expect(dailyLayout(n, '2026-10-18')).toEqual(dailyLayout(n, '2026-10-18'));
    const sets = new Set<string>();
    for (let d = 0; d < 10; d++) sets.add(JSON.stringify(dailyLayout(n, `2026-10-${10 + d}`).hotspots.map(h => [h.id, h.x, h.y])));
    expect(sets.size).toBeGreaterThan(1);
  });
  it('handmade overrides: bamboo-path hidden secret, cloud-post codelock, shell-bay shadow', () => {
    const cloud = { ...node(), snapshot: { kind: 'handmade' as const, handmadeId: 'cloud-post' as const } };
    const shell = { ...node(), snapshot: { kind: 'handmade' as const, handmadeId: 'shell-bay' as const } };
    expect(dailyLayout(node(), '2026-10-18').secret.kind).toBe('hidden');
    const c = dailyLayout(cloud, '2026-10-18').secret;
    expect(c.kind === 'puzzle' && c.puzzle.kind).toBe('codelock');
    const s2 = dailyLayout(shell, '2026-10-18').secret;
    expect(s2.kind === 'puzzle' && s2.puzzle.kind).toBe('shadow');
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/locationgen.test.ts`
Expected: FAIL（`dailyLayout` is not exported）

- [ ] **Step 3: Implement `dailyLayout` in `src/core/locationgen.ts`**
- `rand = mulberry32(hash(node.seed, date))`.
- Handmade overrides come from a constant map `{ 'bamboo-path': 'hidden', 'cloud-post': 'codelock', 'shell-bay': 'shadow' }` keyed by handmadeId; generated nodes choose: `chance(rand, 0.5) ? hidden : puzzle` with puzzle kind `pick(rand, ['shadow','sequence','diff','codelock'])`.
- Request: `chance(rand, 0.5) ? find : bring(foodId = pick(rand, FOOD_IDS))`.
- Hotspot count `total = 4 + floor(rand()*3)`; required = treasure(1) + (find ? request(1) : 0) + (hidden ? 1 : 0) + (codelock ? 3 : 0); `total = max(total, required)`; fillers = total − required.
- Slots: fixed six positions `[(60,120),(180,90),(300,130),(90,300),(230,280),(300,380)]`, plus two extra slots `(150,200)` and `(270,200)` used only when total > 6? — NO: total ≤ 6 always because required ≤ 5 and total ≤ 6; use the first `total` entries of the slot list shuffled by rand (Fisher-Yates). Use exactly six slot positions; the list has length 6.
- Assign roles to shuffled slots in this order: treasure(`id 'treasure'`, reward), request(`id 'request'`, only for find), hidden(`id 'secret'`), clue0..2 (codelock; clue text from templates `樹洞裡的松鼠藏了 {d} 顆栗子` / `石頭上有 {d} 道刻痕` / `草叢裡的蝴蝶停了 {d} 次`), then fillers `f0`… .
- Treasure reward: `chance(rand, 0.5)` → starSand amount `5 + floor(rand()*6)`; else `chance(rand, 0.5)` → ingredient `pick(rand, INGREDIENT_IDS)`; else item `pick(rand, giftPool('common'))`.id.
- `event = pick(rand, QUIRKS).event`.
- Puzzle: `generatePuzzle(rand, kind)`.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/locationgen.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/locationgen.ts src/core/locationgen.test.ts
git commit -m "feat(core): derive daily location layout with hotspots, secret and treasure" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Map generation (`mapgen.ts`)

**Files:**
- Create: `src/core/mapgen.ts`, `src/core/mapgen.test.ts`

**Interfaces:**
- Consumes: `generateSnapshot`, `GENERATOR_VERSION`, `terrainOf` (Task 2); `currentStage`, `abilitiesForStage` (A, `core/growth.ts`); `hash`, `mulberry32`, `chance` (A); `Outcome`, `GameEvent` (A, `core/events.ts`); `checkStory` (Task 10, called by location.ts, not here)
- Produces:
  - `export { GENERATOR_VERSION } from './locationgen';`
  - `export function spawnChildren(s: GameState, parentId: number): Outcome`
  - `export function ensureEnterable(s: GameState): GameState`
  - `export function canEnter(s: GameState, nodeId: number): boolean`

Algorithm rules for the implementer:
- `spawnChildren`: if the parent already has any child → return `{ state: s, events: [] }`. Parent snapshot handmade `bamboo-path` → one child handmade `cloud-post`; handmade `cloud-post` → one child handmade `shell-bay`; handmade `shell-bay` or generated → `n = chance(rand, 0.5) ? 2 : 1` generated children (rand = `mulberry32(hash(s.seed, parentId, 'spawn'))`). Child id = `map.nextId++`; child seed = `hash(s.seed, childId)`; child status 'open', secretFound false, progress null, lastCompletedDate null. Generated children snapshot = `generateSnapshot(childSeed, ['climb','dive'])`. Then run `ensureEnterable`. Events: `[{ type: 'nodesSpawned', ids }]` when at least one child added.
- `canEnter`: node exists; handmade → true; generated → `requires === null || abilitiesForStage(currentStage(s)).includes(requires)`.
- `ensureEnterable`: if some open node is enterable → unchanged. Else take the open generated node with the highest id and set its snapshot `requires` to null. Snapshot is changed only at creation time (this function is called right after spawn; never later).

- [ ] **Step 1: Write the failing test**

```ts
// src/core/mapgen.test.ts
import { describe, it, expect } from 'vitest';
import { spawnChildren, ensureEnterable, canEnter, GENERATOR_VERSION } from './mapgen';
import { fresh, handmadeNode } from './test-helpers';

describe('handmade chain', () => {
  it('bamboo-path spawns exactly one cloud-post child (no requirement)', () => {
    let s = fresh();
    const root = handmadeNode(s, 'bamboo-path');
    s = spawnChildren(s, root.id).state;
    const kids = s.map.nodes.filter(n => n.parentId === root.id);
    expect(kids).toHaveLength(1);
    expect(kids[0].snapshot).toEqual({ kind: 'handmade', handmadeId: 'cloud-post' });
  });
  it('cloud-post spawns exactly one shell-bay child', () => {
    let s = fresh();
    s = spawnChildren(s, handmadeNode(s, 'bamboo-path').id).state;
    const cloud = handmadeNode(s, 'cloud-post');
    s = spawnChildren(s, cloud.id).state;
    const kids = s.map.nodes.filter(n => n.parentId === cloud.id);
    expect(kids.map(k => k.snapshot)).toEqual([{ kind: 'handmade', handmadeId: 'shell-bay' }]);
  });
  it('spawning twice does not duplicate children', () => {
    let s = fresh();
    const root = handmadeNode(s, 'bamboo-path');
    s = spawnChildren(s, root.id).state;
    const count = s.map.nodes.length;
    s = spawnChildren(s, root.id).state;
    expect(s.map.nodes.length).toBe(count);
  });
});

describe('generated children', () => {
  it('shell-bay spawns 1 or 2 generated children, each with generatorVersion', () => {
    let s = fresh();
    s = spawnChildren(s, handmadeNode(s, 'bamboo-path').id).state;
    s = spawnChildren(s, handmadeNode(s, 'cloud-post').id).state;
    const bay = handmadeNode(s, 'shell-bay');
    s = spawnChildren(s, bay.id).state;
    const kids = s.map.nodes.filter(n => n.parentId === bay.id);
    expect([1, 2]).toContain(kids.length);
    for (const k of kids) {
      expect(k.snapshot.kind).toBe('generated');
      if (k.snapshot.kind === 'generated') expect(k.snapshot.generatorVersion).toBe(GENERATOR_VERSION);
    }
  });
  it('same save seed gives identical children (determinism)', () => {
    const run = () => {
      let s = fresh(999);
      s = spawnChildren(s, handmadeNode(s, 'bamboo-path').id).state;
      s = spawnChildren(s, handmadeNode(s, 'cloud-post').id).state;
      return spawnChildren(s, handmadeNode(s, 'shell-bay').id).state.map.nodes;
    };
    expect(run()).toEqual(run());
  });
  it('child count across many seeds is about half 1 and half 2', () => {
    let twos = 0;
    for (let seed = 1; seed <= 400; seed++) {
      let s = fresh(seed);
      s = spawnChildren(s, handmadeNode(s, 'bamboo-path').id).state;
      s = spawnChildren(s, handmadeNode(s, 'cloud-post').id).state;
      const bay = handmadeNode(s, 'shell-bay');
      s = spawnChildren(s, bay.id).state;
      if (s.map.nodes.filter(n => n.parentId === bay.id).length === 2) twos++;
    }
    expect(twos / 400).toBeGreaterThan(0.4);
    expect(twos / 400).toBeLessThan(0.6);
  });
});

describe('canEnter and ensureEnterable', () => {
  it('handmade nodes are always enterable', () => {
    const s = fresh();
    expect(canEnter(s, handmadeNode(s, 'bamboo-path').id)).toBe(true);
  });
  it('a climb-gated node is blocked at stage 1 and open at stage 3 (growthXp 800)', () => {
    let s = fresh();
    const node = { ...handmadeNode(s, 'bamboo-path'), id: 50, parentId: 1, status: 'open' as const,
      snapshot: { kind: 'generated' as const, generatorVersion: 1, name: 'x', terrain: 'bamboo' as const, layout: 0 as const,
        weather: 'sunny' as const, landmarkId: 'lm-cabin', resident: 'passerby' as const, quirkId: 'q01', requires: 'climb' as const } };
    s = { ...s, map: { ...s.map, nodes: [...s.map.nodes, node] } };
    expect(canEnter(s, 50)).toBe(false);
    expect(canEnter({ ...s, growthXp: 800 }, 50)).toBe(true);
  });
  it('ensureEnterable unlocks the newest open generated node when every open node is locked', () => {
    let s = fresh();
    const base = handmadeNode(s, 'bamboo-path');
    const mk = (id: number): any => ({ ...base, id, parentId: 1, status: 'open', seed: id,
      snapshot: { kind: 'generated', generatorVersion: 1, name: 'x', terrain: 'bamboo', layout: 0, weather: 'sunny',
        landmarkId: 'lm-cabin', resident: 'passerby', quirkId: 'q01', requires: 'climb' } });
    s = { ...s, map: { ...s.map, nodes: [...s.map.nodes, mk(60), mk(61)] } };
    const fixed = ensureEnterable(s);
    const last = fixed.map.nodes.find(n => n.id === 61)!;
    expect(last.snapshot.kind === 'generated' && last.snapshot.requires).toBeNull();
    expect(canEnter(fixed, 61)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/mapgen.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/core/mapgen.ts`** following the algorithm rules above.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/mapgen.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/mapgen.ts src/core/mapgen.test.ts
git commit -m "feat(core): spawn map children with handmade chain and enterable guarantee" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Location flow

### Task 6: Enter, progress, hotspots, talk, requests, secret

**Files:**
- Create: `src/core/location.ts`, `src/core/location.test.ts`

**Interfaces:**
- Consumes: `dailyLayout`, `terrainOf`, `HotspotDef`, `LocationLayout` (Task 4); `canEnter` (Task 5); `pendantModifiers`, `Modifiers` (C, `core/pendants.ts`); `localDate` (A); `applyReward` (A); `chat` (Task 8); `Outcome` (A); `giftPool`（C，僅 Task 4 使用）
- Produces:
  - `export function layoutFor(s: GameState, nodeId: number, date: string): LocationLayout` — 在 `dailyLayout` 結果後，若 `pendantModifiers(s).extraTreasure` 包含該節點地形，加入 `{ id: 'extra', role: 'extra', reward: { kind: 'starSand', amount: 10 }, x: 300, y: 430 }`。
  - `export function enter(s: GameState, nodeId: number, now: number): GameState`
  - `export function tapHotspot(s: GameState, nodeId: number, hotspotId: string, now: number): Outcome`
  - `export function talk(s: GameState, nodeId: number, now: number): Outcome`
  - `export function bringFood(s: GameState, nodeId: number, foodId: string, now: number): Outcome | null`
  - `export function solveSecret(s: GameState, nodeId: number, now: number): GameState`

Rules:
- `enter`: node must exist and `canEnter`; `s.energy >= 25`; not (`status === 'done'` && `lastCompletedDate === today`); otherwise return `s` unchanged. If `progress?.date === today` keep it; else set `progress = { date: today, foundHotspots: [], talked: false, treasureFound: false }`.
- `tapHotspot`: requires `progress.date === today`; hotspot id must exist in `layoutFor`; if its id is already in `foundHotspots` → no-op (`{ state: s, events: [] }`). Otherwise append id to `foundHotspots`. Role effects: `treasure` → `treasureFound = true` and `applyReward` with the hotspot's reward; `extra` → `applyReward` with reward (no flag change); `hidden` → nothing extra (secret is marked by id 'secret'; id is appended); `request` (find) → `applyReward({ xp: 15, starSand: 10 })` and, if the node's resident is a friend, `addAffinity` +10 is applied via `addAffinity` (Task 8) — implement the call, and it is no-op for passerby; `clue` / `filler` → only the append.
- `talk`: requires progress today; if `talked` already true → no-op. Set `talked = true`. If resident is a friend → call `chat(s, friendId)` (Task 8) and merge its events. Passerby → no affinity.
- `bringFood`: requires request kind `bring` with `foodId` equal to the given id, progress today, `request` not already in `foundHotspots`, and `inventory[foodId] >= 1`. Decrement inventory, append 'request', then reward as find (xp 15, starSand 10) plus resident affinity +10 if friend. Returns null when the request is not valid.
- `solveSecret`: requires puzzle secret, progress today, and 'secret' not already found → append 'secret'. (Called by the UI after `checkAnswer` returns true.)
- Using the same `foundHotspots` list for flags ('request', 'secret', 'minigame') keeps `LocationProgress` unchanged from the contract.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/location.test.ts
import { describe, it, expect } from 'vitest';
import { enter, tapHotspot, talk, solveSecret } from './location';
import { layoutFor } from './location';
import { fresh, handmadeNode, NOW, TODAY, dayLater } from './test-helpers';
import { spawnChildren } from './mapgen';

const bambooId = (s: any) => handmadeNode(s, 'bamboo-path').id;

describe('enter', () => {
  it('rejects when energy is 24 and leaves state unchanged', () => {
    const s = { ...fresh(), energy: 24 };
    expect(enter(s, bambooId(s), NOW)).toBe(s);
  });
  it('accepts at energy 25 and does not charge energy on enter', () => {
    const s = { ...fresh(), energy: 25 };
    const out = enter(s, bambooId(s), NOW);
    expect(out.energy).toBe(25);
    expect(out.map.nodes.find(n => n.id === bambooId(s))!.progress).toMatchObject({ date: TODAY, talked: false, treasureFound: false });
  });
  it('blocks re-entering a node already completed today', () => {
    let s = fresh();
    const n = bambooId(s);
    s = { ...s, map: { ...s.map, nodes: s.map.nodes.map(x => x.id === n ? { ...x, status: 'done', lastCompletedDate: TODAY } : x) } };
    expect(enter(s, n, NOW)).toBe(s);
  });
});

describe('hotspots and progress', () => {
  it('tapping the same hotspot twice gives the reward only once (idempotent)', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    const treasure = layoutFor(s, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    const first = tapHotspot(s, id, treasure.id, NOW);
    const second = tapHotspot(first.state, id, treasure.id, NOW);
    expect(second.state.starSand).toBe(first.state.starSand);
    expect(second.events).toHaveLength(0);
  });
  it('progress survives leaving and returning the same day', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    const tap = layoutFor(s, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    s = tapHotspot(s, id, tap.id, NOW).state;
    s = enter(s, id, NOW + 60_000);
    expect(s.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toContain(tap.id);
  });
  it('progress resets on a new local date', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    const tap = layoutFor(s, id, TODAY).hotspots.find(h => h.role === 'clue' || h.role === 'filler')!;
    s = tapHotspot(s, id, tap.id, NOW).state;
    s = enter(s, id, NOW + 86_400_000);
    expect(s.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toEqual([]);
  });
  it('a hidden secret is recorded as found under id "secret"', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    if (layoutFor(s, id, TODAY).secret.kind !== 'hidden') return; // bamboo-path is always hidden per Task 4
    s = tapHotspot(s, id, 'secret', NOW).state;
    expect(s.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toContain('secret');
  });
});

describe('talk and secret puzzles', () => {
  it('talk sets talked once; second talk is a no-op', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    s = talk(s, id, NOW).state;
    const again = talk(s, id, NOW);
    expect(again.events).toHaveLength(0);
    expect(s.map.nodes.find(n => n.id === id)!.progress!.talked).toBe(true);
  });
  it('solveSecret marks "secret" once and is idempotent', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    const id = bambooId(s);
    s = solveSecret(s, id, NOW);
    const once = s;
    s = solveSecret(s, id, NOW);
    expect(s).toEqual(once);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/location.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/core/location.ts`** following the rules above (functions listed in Produces; keep `complete` for Task 7).

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/location.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/location.ts src/core/location.test.ts
git commit -m "feat(core): enter locations, track hotspot progress and talk" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Complete location (rewards, revisit cap, secret, ingredient drop)

**Files:**
- Modify: `src/core/location.ts`, `src/core/location.test.ts`

**Interfaces:**
- Consumes: `spawnChildren` (Task 5); `checkStory` (Task 10); `applyReward` (A); `recordVisit` (A, 契約 §10.10); `pendantModifiers` (C); `terrainOf`, `nameOf` (Task 2/17); `INGREDIENT_IDS` (A); `mulberry32`, `hash`, `chance`, `pick`; `localDate` (A)
- Produces: `export function complete(s: GameState, nodeId: number, now: number): Outcome`；使用 C 的 `ingredientDropChance(m: Modifiers): number`（回傳百分比，30 + 加成）

Algorithm (order of random draws must stay fixed):
1. `today = localDate(now)`; node must exist; `p = node.progress`; require `p && p.date === today && p.talked && p.treasureFound && s.energy >= 25 && node.lastCompletedDate !== today`; otherwise `{ state: s, events: [] }`.
2. `first = node.status === 'open'`; `terrain = terrainOf(node.snapshot)`; `mods = pendantModifiers(s)`; `rand = mulberry32(hash(node.seed, today, 'complete'))`.
3. Base star sand: first → `15 + floor(rand()*11)`; revisit → `8 + floor(rand()*5)`. Scaled: `Math.round(base * (1 + (mods.starSandPct[terrain] ?? 0) / 100))`.
4. Growth: first → 30; revisit → `s.daily.revisitXpCount < 3 ? 10 : 0`; for revisit, increment `daily.revisitXpCount` by 1 (counter only moves on revisit completion).
5. Secret: if `p.foundHotspots` includes `'secret'` and `!node.secretFound` → xp +10, starSand +10, `secretFound = true`.
6. Ingredient drop: `chance(rand, ingredientDropChance(mods) / 100)` → `items[pick(rand, INGREDIENT_IDS)] = 1`（`ingredientDropChance` 來自 C 的 `core/pendants.ts`，回傳百分比）：基礎 30%；蘑菇墜飾 `pendant-mushroom` 的 `ingredientChancePct` 為 30 個百分點，合計 60%（契約 §10.12）。
7. `applyReward(state, { xp, starSand, energy: -25, chain: 1, items })`.
8. Node update: `status = 'done'`, `lastCompletedDate = today`, `progress = null`, `secretFound` as above. If `first`: `completedCount += 1`, then `spawnChildren(state, node.id)` and merge events.
8b. Then `state = recordVisit(state, 'locations', nameOf(node.snapshot))`（每次成功完成都記錄，契約 §10.10）。
9. Then `checkStory(state)` (Task 10) and merge events.

- [ ] **Step 1: Write the failing test** (append to `location.test.ts`)

```ts
import { complete } from './location';
import { ingredientDropChance, pendantModifiers } from './pendants';
import { dayLater } from './test-helpers';

const doneVisit = (s: any, id: number, now: number, withSecret = false) => {
  let t = enter(s, id, now);
  const hs = layoutFor(t, id, localDate(now));
  t = tapHotspot(t, id, hs.hotspots.find(h => h.role === 'treasure')!.id, now).state;
  if (withSecret) t = tapHotspot(t, id, 'secret', now).state;
  t = talk(t, id, now).state;
  return t;
};
import { localDate } from './time';

describe('complete', () => {
  it('requires talked and treasure; otherwise no-op', () => {
    let s = enter(fresh(), bambooId(fresh()), NOW);
    expect(complete(s, bambooId(s), NOW).state).toBe(s);
  });
  it('first completion: xp +30, chain +1, energy -25, starSand 15-25 before pendant bonus, count +1, spawns children', () => {
    const base = fresh();
    const id = bambooId(base);
    const s = doneVisit({ ...base, energy: 100, growthXp: 0 }, id, NOW);
    const out = complete(s, id, NOW);
    expect(out.state.completedCount).toBe(1);
    expect(out.state.energy).toBe(75);
    expect(out.state.chainLinks).toBe(1);
    expect(out.state.growthXp).toBe(30);
    // bamboo pendant gives +20% on bamboo terrain: 15..25 becomes 18..30
    expect(out.state.starSand - s.starSand).toBeGreaterThanOrEqual(18);
    expect(out.state.starSand - s.starSand).toBeLessThanOrEqual(30);
    expect(out.state.map.nodes.some(n => n.parentId === id)).toBe(true);
    expect(out.events.some(e => e.type === 'nodesSpawned')).toBe(true);
    expect(out.state.lastVisitedSummary.locations).toContain('竹林小徑');
  });
  it('completing the same node twice in one day is a no-op the second time', () => {
    const base = fresh();
    const id = bambooId(base);
    const once = complete(doneVisit({ ...base, energy: 100 }, id, NOW), id, NOW).state;
    expect(complete(once, id, NOW).state).toBe(once);
  });
  it('revisit: xp +10 for the first 3 revisits per day, then 0; completedCount unchanged', () => {
    let s = fresh();
    const id = bambooId(s);
    s = complete(doneVisit({ ...s, energy: 100 }, id, NOW), id, NOW).state; // first completion
    s = { ...s, energy: 100, daily: { ...s.daily, revisitXpCount: 3 } };
    const day = NOW + 86_400_000;
    const xpBefore = s.growthXp;
    s = complete(doneVisit(s, id, day), id, day).state;
    expect(s.growthXp - xpBefore).toBe(0);
    expect(s.completedCount).toBe(1);
  });
  it('secret pays +10 xp and +10 starSand once, and sets secretFound', () => {
    let s = fresh();
    const id = bambooId(s);
    const withSecretDone = complete(doneVisit({ ...s, energy: 100 }, id, NOW, true), id, NOW);
    const node = withSecretDone.state.map.nodes.find(n => n.id === id)!;
    expect(node.secretFound).toBe(true);
    expect(withSecretDone.state.growthXp).toBe(40); // 30 first + 10 secret
  });
  it('energy below 25 blocks completion', () => {
    const base = fresh();
    const id = bambooId(base);
    const s = doneVisit({ ...base, energy: 100 }, id, NOW);
    const low = { ...s, energy: 20 };
    expect(complete(low, id, NOW).state).toBe(low);
  });
});

describe('ingredient chance', () => {
  it('is 30% base and 60% with the mushroom pendant (+30 percentage points)', () => {
    expect(ingredientDropChance(pendantModifiers(fresh()))).toBe(30);
    expect(ingredientDropChance({ ...pendantModifiers(fresh()), ingredientChancePct: 30 })).toBe(60);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/location.test.ts`
Expected: FAIL（`complete` is not exported）

- [ ] **Step 3: Implement `complete` in `src/core/location.ts`** per the algorithm above.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/location.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/location.ts src/core/location.test.ts
git commit -m "feat(core): complete locations with first and revisit rewards" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Minigames, friends, story

### Task 8: Friends core (`friends.ts`)

**Files:**
- Create: `src/core/friends.ts`, `src/core/friends.test.ts`

**Interfaces:**
- Consumes: `FriendId`, `GameState`, `Outcome`, `GameEvent` (A); `levelOf`, `friendLevelThreshold` (A, `core/friendLevel.ts`, 契約 §10.4); `pendantModifiers` (C); `getItem` (C, `core/catalog.ts`); `FRIENDS` (Task 13, `src/content/friends.ts`) — only `id` and `likes` are needed here
- Produces:
  - `export { levelOf } from './friendLevel';`（只 re-export，不另寫公式）
  - `export function addAffinity(s: GameState, id: FriendId, amount: number): Outcome`
  - `export function chat(s: GameState, id: FriendId): Outcome`
  - `export function giveGift(s: GameState, id: FriendId, itemId: string): Outcome | null`
  - `export function storySegmentsUnlocked(level: number): number`（`Math.min(level, 5)`）

Rules:
- 等級公式唯一來源為 A 的 `core/friendLevel.ts`：`friendLevelThreshold(L) = 10 × (L−1) × L`（離開第 n 級需 `20 × n` 點）；`levelOf(p)` 為滿足門檻的最大 L（最小 1）。`levelOf(0)=1`、`levelOf(20)=2`、`levelOf(60)=3`、`levelOf(120)=4`。本檔不重寫公式。
- `addAffinity(s, id, amount)`: `bonus = pendantModifiers(s).affinityBonus` (1 when 愛心墜飾 is equipped, else 0); `gain = amount + bonus` (amount > 0 only, else no-op); points += gain; compute old and new level; for each new level n reached emit `{type:'friendLevelUp', friendId, level:n}`; when n ∈ {3,6,10} add 1 to `inventory['furn-<id>-<k>']` where k = 1, 2, 3 for n = 3, 6, 10 (emit no extra event for items). 朋友專屬家具只在此發放（契約 §10.3）；同一等級只跨越一次，不會重複發放；C 的 `checkMilestones` 不發放。
- `chat(s, id)`: if `chatsToday >= 3` → `{ state: s, events: [] }`; else `chatsToday += 1` and `addAffinity(s, id, 1)`.
- `giveGift(s, id, itemId)`: `getItem(itemId).category` must be `'food'` or `'ingredient'` and `inventory[itemId] >= 1`; otherwise null. Decrement inventory (delete key when 0). Amount = `FRIENDS.find(id).likes.includes(itemId) ? 10 : 5`; then `addAffinity`.
- `storySegmentsUnlocked(level)`: `Math.min(level, 5)`.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/friends.test.ts
import { describe, it, expect } from 'vitest';
import { levelOf, addAffinity, chat, giveGift, storySegmentsUnlocked } from './friends';
import { fresh, NOW } from './test-helpers';
import { setPendants } from './wardrobe';

describe('levelOf', () => {
  it('follows 20 x n single-level cost, unlimited', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(19)).toBe(1);
    expect(levelOf(20)).toBe(2);
    expect(levelOf(59)).toBe(2);
    expect(levelOf(60)).toBe(3);
    expect(levelOf(120)).toBe(4);
    expect(levelOf(10 * 99 * 100)).toBe(100);
  });
});

describe('addAffinity', () => {
  it('emits friendLevelUp when crossing a threshold', () => {
    const out = addAffinity(fresh(), 'mianhua', 20);
    expect(out.state.friends.mianhua.points).toBe(20);
    expect(out.events).toContainEqual({ type: 'friendLevelUp', friendId: 'mianhua', level: 2 });
  });
  it('unlocks exclusive furniture at levels 3, 6 and 10', () => {
    let s = fresh();
    s = addAffinity(s, 'juzi', 60).state; // level 3
    expect(s.inventory['furn-juzi-1']).toBe(1);
    s = addAffinity(s, 'juzi', 240).state; // 300 points: level 6
    expect(s.inventory['furn-juzi-2']).toBe(1);
    s = addAffinity(s, 'juzi', 600).state; // 900 points: level 10
    expect(s.inventory['furn-juzi-3']).toBe(1);
    s = addAffinity(s, 'juzi', 1).state;   // 901 points: still level 10, no second grant
    expect(s.inventory['furn-juzi-3']).toBe(1);
  });
  it('heart pendant adds +1 per award', () => {
    const s = setPendants(fresh(), ['pendant-heart']);
    expect(addAffinity(s, 'gulu', 5).state.friends.gulu.points).toBe(6);
  });
});

describe('chat', () => {
  it('+1 per chat, capped at 3 per day per friend', () => {
    let s = fresh();
    for (let i = 0; i < 3; i++) s = chat(s, 'manman').state;
    expect(s.friends.manman.points).toBe(3);
    expect(chat(s, 'manman').state).toBe(s);
    expect(s.friends.gulu.chatsToday).toBe(0);
  });
});

describe('giveGift', () => {
  it('liked gift +10, other gift +5, consumes one item', () => {
    let s = { ...fresh(), inventory: { 'food-starry-apple': 2, 'food-bamboo-cake': 1 } };
    const liked = giveGift(s, 'juzi', 'food-starry-apple')!; // juzi likes starry apple
    expect(liked.state.friends.juzi.points).toBe(10);
    expect(liked.state.inventory['food-starry-apple']).toBe(1);
    const other = giveGift(s, 'juzi', 'food-bamboo-cake')!;
    expect(other.state.friends.juzi.points).toBe(5);
    expect(other.state.inventory['food-bamboo-cake']).toBeUndefined();
  });
  it('returns null without the item or for a non-food item', () => {
    expect(giveGift(fresh(), 'juzi', 'food-starry-apple')).toBeNull();
    expect(giveGift({ ...fresh(), inventory: { 'wall-default': 1 } }, 'juzi', 'wall-default')).toBeNull();
  });
});

describe('storySegmentsUnlocked', () => {
  it('level n unlocks segments 1..n, capped at 5', () => {
    expect(storySegmentsUnlocked(1)).toBe(1);
    expect(storySegmentsUnlocked(4)).toBe(4);
    expect(storySegmentsUnlocked(9)).toBe(5);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/friends.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/core/friends.ts`** following the rules above.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/friends.test.ts`
Expected: PASS. Note: `juzi` likes `food-starry-apple` (Task 13 content).

- [ ] **Step 5: Commit**
```bash
git add src/core/friends.ts src/core/friends.test.ts
git commit -m "feat(core): friend affinity levels, chat cap, gifts and furniture unlocks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Minigame core (`minigames.ts`) and `finishMinigame`

**Files:**
- Create: `src/core/minigames.ts`, `src/core/minigames.test.ts`
- Modify: `src/core/location.ts`, `src/core/location.test.ts`

**Interfaces:**
- Consumes: `hash`, `mulberry32`, `chance` (A); `pendantModifiers` (C); `applyReward` (A); `localDate` (A)
- Produces:
  - `export type MinigameKind = 'stars' | 'hop' | 'bubble'`
  - `export const MINIGAMES: { kind: MinigameKind; name: string; target: number }[]` — `stars` 「接星星」 target 12、`hop` 「跳石頭過河」 target 8、`bubble` 「泡泡配對」 target 6
  - `export const GAME_SECONDS = 30`
  - `export function minigameOffered(seed: number, nodeId: number, date: string): boolean` — `chance(mulberry32(hash(seed, nodeId, date, 'mini'))(), 0.3)` (use a single rand draw)
  - `export function minigameKind(seed: number, date: string): MinigameKind`
  - `export function scoreFromHits(kind: MinigameKind, hits: number): number` — `min(1, hits / target)`
  - `export function minigameReward(score01: number, starSandPct: number): { xp: number; starSand: number }` — `base = 5 + Math.round(10 * score01)`; `xp = base`; `starSand = Math.round(base * (1 + starSandPct / 100))`
  - `export function remainingMs(startedAt: number, now: number, pausedMs: number): number` — `max(0, GAME_SECONDS*1000 - (now - startedAt - pausedMs))`
- In `location.ts`: `export function finishMinigame(s: GameState, nodeId: number, kind: MinigameKind, score01: number | null, now: number): Outcome` — `score01 === null` means skipped or aborted (no reward). Guard: progress today exists, `foundHotspots` does not include `'minigame'`; otherwise return no-op. Always append `'minigame'` to `foundHotspots` (so skip, abort and finish all count once). Reward: `pendantModifiers(s).minigameStarSandPct`, then `applyReward(s, { xp, starSand })`.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/minigames.test.ts
import { describe, it, expect } from 'vitest';
import { minigameOffered, scoreFromHits, minigameReward, remainingMs, GAME_SECONDS } from './minigames';
import { mulberry32 } from './rng';

describe('minigames core', () => {
  it('is offered about 30% of the time', () => {
    let n = 0;
    for (let i = 0; i < 4000; i++) if (minigameOffered(i * 7 + 3, 1, '2026-10-18')) n++;
    expect(n / 4000).toBeGreaterThan(0.26);
    expect(n / 4000).toBeLessThan(0.34);
  });
  it('score clamps to 1 and is hits over target', () => {
    expect(scoreFromHits('stars', 6)).toBeCloseTo(0.5);
    expect(scoreFromHits('stars', 99)).toBe(1);
  });
  it('reward scales between 5 and 15 before pendant bonus', () => {
    expect(minigameReward(0, 0)).toEqual({ xp: 5, starSand: 5 });
    expect(minigameReward(1, 0)).toEqual({ xp: 15, starSand: 15 });
  });
  it('star pendant +20% applies to star sand only', () => {
    expect(minigameReward(1, 20)).toEqual({ xp: 15, starSand: 18 });
  });
  it('timer is 30 seconds, ignores paused time, and never goes negative', () => {
    expect(GAME_SECONDS).toBe(30);
    expect(remainingMs(0, 10_000, 0)).toBe(20_000);
    expect(remainingMs(0, 10_000, 4_000)).toBe(24_000);
    expect(remainingMs(0, 99_000, 0)).toBe(0);
  });
});
```

Add to `src/core/location.test.ts`:

```ts
import { finishMinigame } from './location';
it('finishMinigame counts once per day even if called twice (abort then finish)', () => {
  let s = enter(fresh(), bambooId(fresh()), NOW);
  const id = bambooId(s);
  s = finishMinigame(s, id, 'stars', null, NOW).state;
  const again = finishMinigame(s, id, 'stars', 1, NOW);
  expect(again.state).toBe(s);
  expect(again.events).toHaveLength(0);
});
it('a skipped minigame gives no reward but is marked done', () => {
  let s = enter(fresh(), bambooId(fresh()), NOW);
  const id = bambooId(s);
  const before = s.starSand;
  s = finishMinigame(s, id, 'hop', null, NOW).state;
  expect(s.starSand).toBe(before);
  expect(s.map.nodes.find(n => n.id === id)!.progress!.foundHotspots).toContain('minigame');
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/minigames.test.ts src/core/location.test.ts`
Expected: FAIL（exports missing）

- [ ] **Step 3: Implement `src/core/minigames.ts` and `finishMinigame` in `src/core/location.ts`.**

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/minigames.test.ts src/core/location.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/minigames.ts src/core/minigames.test.ts src/core/location.ts src/core/location.test.ts
git commit -m "feat(core): minigame offer roll, scoring, rewards and single-count finish" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Story triggers (`story.ts`)

**Files:**
- Create: `src/core/story.ts`, `src/core/story.test.ts`

**Interfaces:**
- Consumes: `GameState`, `Outcome` (A); `legendCards` uses `storyBeats`
- Produces:
  - `export function dueBeat(completedCount: number, storyBeats: string[]): string | null`
  - `export function checkStory(s: GameState): Outcome`
  - `export function ackBeat(s: GameState): GameState`（清除 `pendingBeat` 後再 `checkStory`）
  - `export function markBeatSeen(s: GameState, beatId: string): GameState`（把 id 加入 `storyBeats`，已存在則不變；用於朋友故事線）
  - `export function legendCards(s: GameState): { beatId: string; n: number }[]`（`storyBeats` 中的 `legend-N`，依 N 升冪）

Rules:
- Chapter thresholds: `{ ch1: 3, ch2: 6, ch3: 9, ch4: 12, ch5: 15 }`. Legend: when `completedCount >= 20`, the due legend is `legend-${floor(completedCount/5)*5}`.
- `dueBeat`: among ch1..ch5 with threshold ≤ count and not in `storyBeats`, return the first in order; else if count ≥ 20 and `legend-${floor(count/5)*5}` not in `storyBeats`, return it; else null. (`'prologue'` is owned by Plan A and is excluded here.)
- `checkStory`: if `pendingBeat !== null` → return unchanged. Else `id = dueBeat(...)`; if null → unchanged; else `pendingBeat = id`, `storyBeats = [...storyBeats, id]`, event `{type:'storyBeat', beatId:id}`.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/story.test.ts
import { describe, it, expect } from 'vitest';
import { dueBeat, checkStory, ackBeat, legendCards } from './story';
import { fresh } from './test-helpers';

describe('dueBeat', () => {
  it('chapters trigger at 3, 6, 9, 12, 15 completions', () => {
    expect(dueBeat(2, [])).toBeNull();
    expect(dueBeat(3, [])).toBe('ch1');
    expect(dueBeat(6, ['ch1'])).toBe('ch2');
    expect(dueBeat(9, ['ch1', 'ch2'])).toBe('ch3');
    expect(dueBeat(12, ['ch1', 'ch2', 'ch3'])).toBe('ch4');
    expect(dueBeat(15, ['ch1', 'ch2', 'ch3', 'ch4'])).toBe('ch5');
  });
  it('legends start at 20 and every 5 completions after', () => {
    expect(dueBeat(19, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'])).toBeNull();
    expect(dueBeat(20, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'])).toBe('legend-20');
    expect(dueBeat(24, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'legend-20'])).toBeNull();
    expect(dueBeat(25, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'legend-20'])).toBe('legend-25');
  });
});

describe('checkStory', () => {
  it('sets pendingBeat once and records it in storyBeats; does not re-trigger', () => {
    let s = { ...fresh(), completedCount: 3 };
    s = checkStory(s).state;
    expect(s.pendingBeat).toBe('ch1');
    expect(s.storyBeats).toContain('ch1');
    const again = checkStory(s);
    expect(again.state).toBe(s);
  });
  it('does not overwrite a pending beat that has not been played', () => {
    let s = { ...fresh(), completedCount: 6, pendingBeat: 'ch1', storyBeats: ['ch1'] };
    expect(checkStory(s).state.pendingBeat).toBe('ch1');
  });
  it('ackBeat clears pendingBeat and then queues the next due beat', () => {
    let s = { ...fresh(), completedCount: 6, pendingBeat: 'ch1', storyBeats: ['ch1'] };
    s = ackBeat(s);
    expect(s.pendingBeat).toBe('ch2');
  });
});

describe('legendCards', () => {
  it('lists legend beats from storyBeats in order', () => {
    const s = { ...fresh(), storyBeats: ['ch1', 'legend-25', 'legend-20'] };
    expect(legendCards(s).map(c => c.n)).toEqual([20, 25]);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/story.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/core/story.ts`.**

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/story.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/story.ts src/core/story.test.ts
git commit -m "feat(core): trigger chapter and legend beats from completed locations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Note: Task 7's `complete` already calls `checkStory` (step 9). If Task 7 was implemented before this task, its `checkStory` import is a stub that this task fills in; no change to `location.ts` is needed here.

---

### Task 11: Letters (`letters.ts`) and letter content

**Files:**
- Create: `src/content/friendLetters.ts`, `src/core/letters.ts`, `src/core/letters.test.ts`

**Interfaces:**
- Consumes: `Letter`, `FriendId`, `GameState` (A); `hash`, `mulberry32`, `pick` (A); `FRIENDS` ids (Task 13)
- Produces:
  - `content/friendLetters.ts`: `FRIEND_LETTERS: { friendId: FriendId; text: string }[]`（12 封：每位朋友 3 封）。歡迎回來信屬於計畫 A 的 `content/letters.ts`（契約 §10.5），本計畫不建立、不產生。
  - `core/letters.ts`:
    - `export function letterForDay(seed: number, date: string): Letter`（id `letter-${date}`、`read: false`）
    - `export function addLetter(s: GameState, letter: Letter): GameState`（新信插入 `letters[0]`，不裁切）
    - `export function markLetterRead(s: GameState, id: string): GameState`

Rules:
- `letterForDay`: `rand = mulberry32(hash(seed, date, 'letter'))`; pick one of `LETTERS`; `from = friendId`.
- `addLetter`: insert at index 0 (newest first, matching A's `splitArchive`, which keeps `slice(0, 30)`); never trims and never expires.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/letters.test.ts
import { describe, it, expect } from 'vitest';
import { letterForDay, addLetter, markLetterRead } from './letters';
import { FRIEND_LETTERS } from '../content/friendLetters';
import { fresh } from './test-helpers';

describe('letter content', () => {
  it('has 12 letters, three per friend', () => {
    expect(FRIEND_LETTERS).toHaveLength(12);
    for (const id of ['mianhua', 'juzi', 'manman', 'gulu'] as const) {
      expect(FRIEND_LETTERS.filter(l => l.friendId === id)).toHaveLength(3);
    }
  });
});

describe('letters', () => {
  it('letterForDay is deterministic and unread', () => {
    const a = letterForDay(5, '2026-10-18');
    expect(a).toEqual(letterForDay(5, '2026-10-18'));
    expect(a.read).toBe(false);
    expect(a.id).toBe('letter-2026-10-18');
  });
  it('addLetter never trims: 31 adds keep 31 letters in state', () => {
    let s = fresh();
    for (let i = 0; i < 31; i++) {
      s = addLetter(s, { id: `l${i}`, date: '2026-10-18', from: 'juzi', text: 't', read: false });
    }
    expect(s.letters).toHaveLength(31);
    expect(s.letters[0].id).toBe('l30');
  });
  it('letters do not expire by date', () => {
    const s = addLetter(fresh(), { id: 'old', date: '2020-01-01', from: 'gulu', text: 't', read: false });
    expect(s.letters.map(l => l.id)).toContain('old');
  });
  it('markLetterRead flips only the given letter', () => {
    let s = addLetter(fresh(), { id: 'a', date: 'd', from: 'gulu', text: 't', read: false });
    s = markLetterRead(s, 'a');
    expect(s.letters[0].read).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/letters.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/content/friendLetters.ts` (12 texts, witty Traditional Chinese, one short sentence to a short paragraph each) and `src/core/letters.ts`. Do not touch `src/ui/store.ts`: A's `commit` already runs `splitArchive` (A Task 14) and archives the overflow.**

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/letters.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/content/friendLetters.ts src/core/letters.ts src/core/letters.test.ts src/ui/store.ts
git commit -m "feat(core): append-only letters with archive split on commit" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Friend home visits and daily handlers (`adventureDaily.ts`)

**Files:**
- Create: `src/core/adventureDaily.ts`, `src/core/adventureDaily.test.ts`, `src/ui/components/VisitorCard.tsx`, `src/ui/components/VisitorCard.test.tsx`
- Modify: `src/core/daily.ts`（A 建立）

**Interfaces:**
- Consumes: `DailyHandler`, `dailyHandlers`, `runDaily` (A, `core/daily.ts`); `letterForDay`, `addLetter` (Task 11); `mulberry32`, `hash`, `chance`, `pick`; `INGREDIENT_IDS` (A); `Outcome` (A); `FRIENDS` ids (Task 13)
- Produces:
  - `export const adventureHandlers: DailyHandler[]` — 依序：`resetAdventureDaily`、`dailyLetter`、`dailyVisit`
  - `export function leaveVisit(s: GameState, now: number): Outcome | null`（給 `VisitorCard` 呼叫）
  - In `core/daily.ts`: `import { adventureHandlers } from './adventureDaily';` and add `...adventureHandlers` into the `dailyHandlers` array literal（契約 §10.16：直接 import 並列出；不使用副作用 import，也不使用 `push`）

Rules:
- `resetAdventureDaily(s)`: every friend `chatsToday = 0`; `daily.revisitXpCount = 0`; every node `progress = null`.
- `dailyLetter(s, today)`: `addLetter(s, letterForDay(s.seed, today))`（不裁切；超過 30 封的封存由 `ui/store.ts` 的 commit 處理，見 Task 11）。
- `dailyVisit(s, today)`: if `daily.visitor !== null && !daily.visitorDone` → unchanged (visit persists until the player ends it). Otherwise `rand = mulberry32(hash(s.seed, today, 'visit'))`; `chance(rand, 0.3)` → `visitor = pick(rand, FRIEND_IDS)`, `visitorDone = false`; else `visitor = null`, `visitorDone = true`.
- `leaveVisit(s, now)`: requires `visitor !== null && !visitorDone`; sets `visitorDone = true`; gift = `pick(mulberry32(hash(s.seed, localDate(now), 'gift'))(), INGREDIENT_IDS)` added to inventory (+1). Returns `{ state, events: [] }`.
- `VisitorCard`: when `visitor` is set and not done, show the friend's name and a 「送客」 button (min 44px) that calls `leaveVisit` through `commit(...)`; when none, render nothing.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/adventureDaily.test.ts
import { describe, it, expect } from 'vitest';
import { adventureHandlers, leaveVisit } from './adventureDaily';
import { fresh, NOW } from './test-helpers';
import { INGREDIENT_IDS } from '../content/ingredients';

const [reset, letter, visit] = adventureHandlers;

describe('daily handlers', () => {
  it('reset clears chatsToday and revisitXpCount and drops progress', () => {
    let s = { ...fresh(), daily: { ...fresh().daily, revisitXpCount: 3 } };
    s = { ...s, friends: { ...s.friends, juzi: { points: 5, chatsToday: 3 } } };
    s = reset(s, '2026-10-19', NOW);
    expect(s.friends.juzi.chatsToday).toBe(0);
    expect(s.daily.revisitXpCount).toBe(0);
  });
  it('letter handler adds exactly one letter per day', () => {
    const s = letter(fresh(), '2026-10-19', NOW);
    expect(s.letters).toHaveLength(1);
  });
  it('visit happens on about 30% of days', () => {
    let visits = 0;
    let s = fresh();
    for (let d = 0; d < 300; d++) {
      const date = `2026-${String(1 + Math.floor(d / 28)).padStart(2, '0')}-${String((d % 28) + 1).padStart(2, '0')}`;
      s = { ...s, daily: { ...s.daily, visitor: null, visitorDone: true } };
      s = visit(s, date, NOW);
      if (s.daily.visitor !== null) visits++;
    }
    expect(visits / 300).toBeGreaterThan(0.2);
    expect(visits / 300).toBeLessThan(0.4);
  });
  it('an unfinished visit is kept on the next day (no time limit)', () => {
    let s = { ...fresh(), daily: { ...fresh().daily, visitor: 'gulu' as const, visitorDone: false } };
    expect(visit(s, '2026-10-30', NOW)).toBe(s);
  });
  it('leaveVisit gives one ingredient and marks done', () => {
    const s = { ...fresh(), daily: { ...fresh().daily, visitor: 'gulu' as const, visitorDone: false } };
    const out = leaveVisit(s, NOW)!;
    expect(out.state.daily.visitorDone).toBe(true);
    const got = INGREDIENT_IDS.filter(id => (out.state.inventory[id] ?? 0) > 0);
    expect(got).toHaveLength(1);
  });
});
```

Add `src/ui/components/VisitorCard.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { VisitorCard } from './VisitorCard';
import { game } from '../store';
import { fresh } from '../../core/test-helpers';

describe('VisitorCard', () => {
  it('shows the visitor and ends the visit on 送客', () => {
    game.value = { ...fresh(), daily: { ...fresh().daily, visitor: 'manman', visitorDone: false } };
    const { getByText, queryByText } = render(<VisitorCard />);
    fireEvent.click(getByText('送客'));
    expect(game.value.daily.visitorDone).toBe(true);
    expect(queryByText('送客')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/core/adventureDaily.test.ts src/ui/components/VisitorCard.test.tsx`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/core/adventureDaily.ts`, the `daily.ts` registration, and `VisitorCard.tsx`.** The VisitorCard uses `game` and `commit` from `ui/store.ts` (A).

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/core/adventureDaily.test.ts src/ui/components/VisitorCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/core/adventureDaily.ts src/core/adventureDaily.test.ts src/core/daily.ts src/ui/components/VisitorCard.tsx src/ui/components/VisitorCard.test.tsx
git commit -m "feat(core): daily reset, letter and friend visit handlers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Content (friends, story, legends, handmade)

### Task 13: Friend content (`content/friends.ts`)

**Files:**
- Create: `src/content/friends.ts`, `src/content/friends.test.ts`

**Interfaces:**
- Consumes: `FriendId` (A); `FOOD_IDS` (A); `ITEMS` (C, `content/items/index.ts`) for referential checks only
- Produces:
  - `export const FRIENDS: { id: FriendId; name: string; title: string; likes: string[]; chat: string[]; }[]` — `chat` has exactly 10 lines (index by `(level-1) % 10`)
  - Friend ids and names: `mianhua` 棉花（郵差兔子）、`juzi` 橘子（糖果店狐狸）、`manman` 慢慢（說故事的烏龜）、`gulu` 咕嚕（愛發明的刺蝟）
  - Likes (one food each): `mianhua`→`food-strawberry-mochi`，`juzi`→`food-starry-apple`，`manman`→`food-bamboo-cake`，`gulu`→`food-sour-plum`
  - `export const FRIEND_IDS: FriendId[]` = the four ids in the order above

Rules: chat lines are short, witty, Traditional Chinese, no baby talk. Example for `juzi` line 1: 「今天的糖果架換了新口味，你猜是什麼？答對了打八折。」

- [ ] **Step 1: Write the failing test**

```ts
// src/content/friends.test.ts
import { describe, it, expect } from 'vitest';
import { FRIENDS, FRIEND_IDS } from './friends';
import { FOOD_IDS } from './foods';

describe('friends content', () => {
  it('has four unique friends in the spec order', () => {
    expect(FRIENDS.map(f => f.id)).toEqual(['mianhua', 'juzi', 'manman', 'gulu']);
    expect(FRIEND_IDS).toEqual(FRIENDS.map(f => f.id));
  });
  it('each friend has exactly 10 chat lines and one liked food that exists', () => {
    for (const f of FRIENDS) {
      expect(f.chat).toHaveLength(10);
      expect(new Set(f.chat).size).toBe(10);
      expect(f.likes).toHaveLength(1);
      expect(FOOD_IDS).toContain(f.likes[0]);
    }
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/content/friends.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/content/friends.ts` with the data above.** The test imports `ITEMS` (C) and `FOOD_IDS` (A): the friend-likes test checks membership in `FOOD_IDS`, which is the real rule for gifts.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/content/friends.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/content/friends.ts src/content/friends.test.ts
git commit -m "feat(content): add four friends with liked foods and chat lines" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Chapter scripts ch1–ch5 (`content/story/chapters.ts`)

**Files:**
- Create: `src/content/story/chapters.ts`, `src/content/story/chapters.test.ts`

**Interfaces:**
- Consumes: `DialogueScript`, `DialogueLine` (A, `content/story/types.ts`)
- Produces:
  - `export const COLLAR_CLUES: { id: 'clue-collar-1' | … | 'clue-collar-5'; name: string }[]`（5 個，名稱例：刻字的扣環、會發光的碎片、藏在內側的地圖、慢慢老師的信、遠方傳來的鈴聲）
  - `export const CHAPTER_SCRIPTS: Record<'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5', DialogueScript>`
  - Each script: `id` equals its key, `illustration` set (e.g. `'ch1-bamboo-hollow'`), `lines` of length ≥ 8, the speakers are only `panda | narrator | mianhua | juzi | manman | gulu | passerby`, and the line set mentions that chapter's clue name exactly once in the last 3 lines.

Narrative guardrail: 慢慢老師 says the collar's empty ring once held a glowing pendant from far away. Keep each chapter 8–10 lines, witty, not babyish.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/story/chapters.test.ts
import { describe, it, expect } from 'vitest';
import { COLLAR_CLUES, CHAPTER_SCRIPTS } from './chapters';

const SPEAKERS = ['panda', 'narrator', 'mianhua', 'juzi', 'manman', 'gulu', 'passerby'];

describe('chapter scripts', () => {
  it('has five chapters and five collar clues with unique ids', () => {
    expect(Object.keys(CHAPTER_SCRIPTS).sort()).toEqual(['ch1', 'ch2', 'ch3', 'ch4', 'ch5']);
    expect(new Set(COLLAR_CLUES.map(c => c.id)).size).toBe(5);
  });
  it('each chapter has 8 to 10 lines, valid speakers and an illustration', () => {
    for (const [key, script] of Object.entries(CHAPTER_SCRIPTS)) {
      expect(script.id).toBe(key);
      expect(script.lines.length).toBeGreaterThanOrEqual(8);
      expect(script.lines.length).toBeLessThanOrEqual(10);
      expect(script.illustration).toBeTruthy();
      for (const l of script.lines) expect(SPEAKERS).toContain(l.speaker);
    }
  });
  it('each chapter mentions its own collar clue in the last three lines', () => {
    COLLAR_CLUES.forEach((clue, i) => {
      const script = CHAPTER_SCRIPTS[`ch${i + 1}` as keyof typeof CHAPTER_SCRIPTS];
      const tail = script.lines.slice(-3).map(l => l.text).join('\n');
      expect(tail).toContain(clue.name);
    });
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/content/story/chapters.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/content/story/chapters.ts` (write all five scripts).**

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/content/story/chapters.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/content/story/chapters.ts src/content/story/chapters.test.ts
git commit -m "feat(content): write chapter scripts ch1 to ch5 for the collar secret" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Friend storyline segments (`content/story/friend-stories.ts`)

**Files:**
- Create: `src/content/story/friend-stories.ts`, `src/content/story/friend-stories.test.ts`

**Interfaces:**
- Consumes: `DialogueScript` (A); `FRIEND_IDS` (Task 13)
- Produces: `export const FRIEND_STORIES: Record<string, DialogueScript>` with keys `friend-<id>-<n>` for n = 1..5 and every friend (20 total). Each script has 4–6 lines, the first line speaker is the friend.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/story/friend-stories.test.ts
import { describe, it, expect } from 'vitest';
import { FRIEND_STORIES } from './friend-stories';
import { FRIEND_IDS } from '../friends';

describe('friend storylines', () => {
  it('has 5 segments for each of the 4 friends', () => {
    expect(Object.keys(FRIEND_STORIES)).toHaveLength(20);
    for (const id of FRIEND_IDS) for (let n = 1; n <= 5; n++) {
      const s = FRIEND_STORIES[`friend-${id}-${n}`];
      expect(s).toBeDefined();
      expect(s.id).toBe(`friend-${id}-${n}`);
      expect(s.lines.length).toBeGreaterThanOrEqual(4);
      expect(s.lines.length).toBeLessThanOrEqual(6);
      expect(s.lines[0].speaker).toBe(id);
    }
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/content/story/friend-stories.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/content/story/friend-stories.ts`.** Segment n of a friend is unlocked at friend level n (Task 8 `storySegmentsUnlocked`). Each segment reveals one step of that friend's own story; segment 5 mentions the collar (`項圈`) once.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/content/story/friend-stories.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/content/story/friend-stories.ts src/content/story/friend-stories.test.ts
git commit -m "feat(content): write five storyline segments for each friend" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Legend templates (`content/story/legends.ts`)

**Files:**
- Create: `src/content/story/legends.ts`, `src/content/story/legends.test.ts`

**Interfaces:**
- Consumes: `COLLAR_CLUES` (Task 14); `FRIENDS` (Task 13); `DialogueScript` (A); `hash`, `mulberry32`, `pick` (A)
- Produces:
  - `export const LEGEND_TEMPLATES: { id: string; lines: string[] }[]` — exactly 10 templates; each `lines` has 3–5 entries; each template contains `{clue}` or `{friend}` at least once.
  - `export function legendScript(seed: number, n: number): DialogueScript` — `id = legend-${n}`; `t = pick(mulberry32(hash(seed, n, 'legend')), LEGEND_TEMPLATES)`; `clue` = `COLLAR_CLUES[(n/5 - 4) % 5].name`; `friend` = `FRIENDS[...]` name from `hash(seed, n, 'friend') % 4`; each `{clue}` / `{friend}` in lines replaced; speaker for each line is `narrator`.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/story/legends.test.ts
import { describe, it, expect } from 'vitest';
import { LEGEND_TEMPLATES, legendScript } from './legends';
import { COLLAR_CLUES } from './chapters';
import { FRIENDS } from '../friends';

describe('legend templates', () => {
  it('has 10 templates, each with 3 to 5 lines and a clue or friend slot', () => {
    expect(LEGEND_TEMPLATES).toHaveLength(10);
    for (const t of LEGEND_TEMPLATES) {
      expect(t.lines.length).toBeGreaterThanOrEqual(3);
      expect(t.lines.length).toBeLessThanOrEqual(5);
      expect(t.lines.some(l => l.includes('{clue}') || l.includes('{friend}'))).toBe(true);
    }
  });
  it('legendScript is deterministic and fills every slot', () => {
    const a = legendScript(12345, 20);
    expect(a).toEqual(legendScript(12345, 20));
    expect(a.id).toBe('legend-20');
    const text = a.lines.map(l => l.text).join('\n');
    expect(text).not.toMatch(/\{clue\}|\{friend\}/);
    expect(
      COLLAR_CLUES.some(c => text.includes(c.name)) || FRIENDS.some(f => text.includes(f.name.split('（')[0]))
    ).toBe(true);
  });
  it('different n can give different legends', () => {
    const texts = new Set([20, 25, 30, 35, 40, 45].map(n => legendScript(999, n).lines.map(l => l.text).join('')));
    expect(texts.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/content/story/legends.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/content/story/legends.ts` with 10 templates.** Each template is a short story hook; each mentions `{clue}` or `{friend}`.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/content/story/legends.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/content/story/legends.ts src/content/story/legends.test.ts
git commit -m "feat(content): add ten legend templates that reference clues or friends" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Handmade locations (`content/locations/handmade.ts`)

**Files:**
- Create: `src/content/locations/handmade.ts`, `src/content/locations/handmade.test.ts`
- Modify: `src/core/locationgen.ts`（`nameOf` 與 `terrainOf` 改讀 `HANDMADE`）

**Interfaces:**
- Consumes: `HandmadeId`, `Terrain` (A); `FriendId` (A); `DialogueLine` (A)
- Produces:
  - `export const HANDMADE: Record<HandmadeId, { name: string; terrain: Terrain; scene: { layout: 0 | 1 }; resident: FriendId | 'passerby'; request: { kind: 'find' } | { kind: 'bring' }; talk: DialogueLine[] }>`
  - `bamboo-path`: 竹林小徑、terrain `bamboo`、resident `manman`、talk 6 行
  - `cloud-post`: 雲朵郵局、terrain `cloud`、resident `mianhua`、talk 6 行
  - `shell-bay`: 貝殼灣、terrain `beach`、resident `passerby`（路過的居民）、talk 6 行
  - `export const HANDMADE_SECRET: Record<HandmadeId, 'hidden' | 'codelock' | 'shadow'>` — `bamboo-path: 'hidden'`, `cloud-post: 'codelock'`, `shell-bay: 'shadow'`（Task 4 的覆寫以此常數為準）

Rules: `talk` lines are bespoke and point to the collar mystery at least once in the shell-bay and cloud-post entries (mention 慢慢老師 or the collar). The `request` kinds: bamboo-path `find`, cloud-post `bring`, shell-bay `find`.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/locations/handmade.test.ts
import { describe, it, expect } from 'vitest';
import { HANDMADE, HANDMADE_SECRET } from './handmade';
import { FRIEND_IDS } from '../friends';

describe('handmade locations', () => {
  it('defines the three chain locations with names and terrains from spec 6.3', () => {
    expect(HANDMADE['bamboo-path'].name).toBe('竹林小徑');
    expect(HANDMADE['cloud-post'].name).toBe('雲朵郵局');
    expect(HANDMADE['shell-bay'].name).toBe('貝殼灣');
    expect(HANDMADE['bamboo-path'].terrain).toBe('bamboo');
    expect(HANDMADE['cloud-post'].terrain).toBe('cloud');
    expect(HANDMADE['shell-bay'].terrain).toBe('beach');
  });
  it('residents are friends or passerby and every talk has at least 6 lines', () => {
    for (const h of Object.values(HANDMADE)) {
      expect(h.resident === 'passerby' || FRIEND_IDS.includes(h.resident)).toBe(true);
      expect(h.talk.length).toBeGreaterThanOrEqual(6);
    }
  });
  it('secret kinds match the layout overrides used by dailyLayout', () => {
    expect(HANDMADE_SECRET).toEqual({ 'bamboo-path': 'hidden', 'cloud-post': 'codelock', 'shell-bay': 'shadow' });
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/content/locations/handmade.test.ts`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `src/content/locations/handmade.ts`; then in `src/core/locationgen.ts` set `nameOf` and `terrainOf` to read `HANDMADE[...].name` / `.terrain`, and in `dailyLayout` read the override from `HANDMADE_SECRET`. Run `npx vitest run src/core/locationgen.test.ts` to confirm nothing regressed.**

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/content/locations/handmade.test.ts src/core/locationgen.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/content/locations/handmade.ts src/content/locations/handmade.test.ts src/core/locationgen.ts
git commit -m "feat(content): define three handmade locations with bespoke dialogue" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Story registry and `resolveScript`

**Files:**
- Create: `src/content/story/index.test.ts`、`src/ui/components/legendRecord.ts`、`src/ui/components/legendRecord.test.ts`
- Modify: `src/content/story/index.ts`（A 建立）、`src/ui/components/Dialogue.tsx`（A 建立）

**Interfaces:**
- Consumes: `SCRIPTS`, `resolveScript`, `registerScriptResolver` (A, `content/story/index.ts`, 契約 §10.8); `CHAPTER_SCRIPTS` (Task 14), `FRIEND_STORIES` (Task 15), `legendScript` (Task 16); `commit`, `game`, `openOverlay` (A); `idbPut` (A, `platform/idb.ts`); `now` (A, `platform/clock.ts`); `ackBeat` (Task 10)
- Produces:
  - `SCRIPTS` 字面值加入 `...CHAPTER_SCRIPTS, ...FRIEND_STORIES`（ch1–ch5 與 20 段朋友故事線直接列入 SCRIPTS）。
  - 在 `content/story/index.ts` 呼叫 `registerScriptResolver((id, seed) => { const m = /^legend-(\d+)$/.exec(id); return m ? legendScript(seed, Number(m[1])) : null; })`。`resolveScript` 由 A 實作（先查 SCRIPTS，查不到再問 resolver），本計畫不另寫。
  - `export async function recordLegend(seed: number, n: number, now: number): Promise<void>`（`src/ui/components/legendRecord.ts`）：`idbPut('photos', { id: \`legend-${n}\`, kind: 'legend', createdAt: now, text: legendScript(seed, n).lines[0].text })`。PhotoRecord 型別由 C 定義於 `src/platform/photos.ts`；寫入為冪等（同 id 覆寫）；傳說卡不計入 200 張照片上限（上限只計 `kind: 'photo'`）。
  - `Dialogue.tsx`：開啟 `scriptId` 為 `legend-N` 時呼叫 `recordLegend(game.value.seed, N, now())`；關閉對話不在 Dialogue 中處理：在 `src/content/story/index.ts` 呼叫 A 的 `registerBeatAck(ackBeat)`，A 的 `dismissOverlay` 會以它清除 pendingBeat 並排入下一個到期的劇情（契約 §10.8）。

- [ ] **Step 1: Write the failing test**

```ts
// src/content/story/index.test.ts
import { describe, it, expect } from 'vitest';
import { resolveScript, SCRIPTS } from './index';
import { legendScript } from './legends';

describe('resolveScript', () => {
  it('returns chapter, friend and prologue scripts by id', () => {
    expect(resolveScript('ch1', 1)?.id).toBe('ch1');
    expect(resolveScript('friend-juzi-2', 1)?.id).toBe('friend-juzi-2');
    expect(SCRIPTS.prologue).toBeDefined();
  });
  it('resolves legend ids from the save seed', () => {
    expect(resolveScript('legend-20', 42)).toEqual(resolveScript('legend-20', 42));
    expect(resolveScript('legend-20', 42)?.id).toBe('legend-20');
    expect(resolveScript('legend-20', 42)).toEqual(legendScript(42, 20));
  });
  it('returns undefined for unknown ids', () => {
    expect(resolveScript('nope', 1)).toBeUndefined();
  });
});
```

Add `src/ui/components/legendRecord.test.ts` (IndexedDB is provided by fake-indexeddb in the test setup):

```ts
// src/ui/components/legendRecord.test.ts
import { describe, it, expect } from 'vitest';
import { recordLegend } from './legendRecord';
import { idbGet } from '../../platform/idb';

describe('recordLegend', () => {
  it('writes one kind legend record per legend id, overwriting on repeat', async () => {
    await recordLegend(42, 20, 1000);
    await recordLegend(42, 20, 2000);
    const rec: any = await idbGet('photos', 'legend-20');
    expect(rec.kind).toBe('legend');
    expect(rec.createdAt).toBe(2000);
    expect(typeof rec.text).toBe('string');
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/content/story/index.test.ts src/ui/components/legendRecord.test.ts`
Expected: FAIL（`recordLegend` 不存在；legend resolver 尚未登記）

- [ ] **Step 3: In `src/content/story/index.ts` merge `CHAPTER_SCRIPTS` and `FRIEND_STORIES` into `SCRIPTS` and call `registerScriptResolver` for legend ids; implement `recordLegend` in `src/ui/components/legendRecord.ts`; in `Dialogue.tsx` call `recordLegend` when a `legend-N` script opens and call `registerBeatAck(ackBeat)` from `src/content/story/index.ts` (A's `dismissOverlay` invokes it; no close handling in Dialogue).**

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/content/story/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/content/story/index.ts src/content/story/index.test.ts src/ui/components/Dialogue.tsx src/ui/components/legendRecord.ts src/ui/components/legendRecord.test.ts
git commit -m "feat(story): register chapter and friend scripts and resolve legend ids" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Scene, map and screens

### Task 19: Map layout (`mapLayout.ts`) and Map screen

**Files:**
- Create: `src/ui/screens/mapLayout.ts`, `src/ui/screens/mapLayout.test.ts`, `src/ui/screens/MapScreen.tsx`, `src/ui/screens/MapScreen.test.tsx`
- Modify: `src/ui/screens/registry.ts`（A 建立）

**Interfaces:**
- Consumes: `MapNode`, `GameState` (A); `canEnter` (Task 5); `nameOf` (Task 2/17); `openOverlay` (A, `ui/nav.ts`); `game` (A, `ui/store.ts`)
- Produces:
  - `export function nodePositions(nodes: MapNode[], width: number): { id: number; x: number; y: number; depth: number }[]`（回傳順序同輸入）。depth = 祖先數。同一深度的節點依 id 排序取索引 `i`：`col = i % 3`、`row = Math.floor(i / 3)`、`jitter = (hash(node.seed, 'jx') % 7) − 3`（−3..3）；`x = width × (col + 1) / 4 + Math.sin(depth × 0.9) × width × 0.08 + jitter`；`y = −(depth × 150 + row × 50)`。同深度 ≤ 9 個節點保證互不重疊（44px 目標，測試覆蓋）；handmade 與 generated 節點使用同一公式。
  - `export function MapScreen(): JSX.Element`（`TAB_SCREENS.map`）
- UI: scroll container `data-testid="map-scroll"` with `style="touch-action: pan-y"`, `overflow-y: auto`, `height: 100dvh` minus nav; each node is a `<button data-testid="map-node-<id>" style="min-width:44px;min-height:44px">`; status: open (亮), done (蓋章，`data-testid="stamp-<id>"`，祕密找到時 `★`), locked (`🔒` plus ability emoji 🌳 for climb, 🌊 for dive). Tap: if `canEnter` and not locked, `openOverlay({ kind: 'location', nodeId })`.

- [ ] **Step 1: Write the failing test**

```ts
// src/ui/screens/mapLayout.test.ts
import { describe, it, expect } from 'vitest';
import { nodePositions } from './mapLayout';
import { fresh } from '../../core/test-helpers';

describe('nodePositions', () => {
  it('stacks deeper nodes higher and keeps x inside the 390px gutter (width 358)', () => {
    const nodes = [...fresh().map.nodes];
    const pos = nodePositions(nodes, 358);
    expect(pos).toHaveLength(nodes.length);
    for (const p of pos) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(358);
    }
    expect(pos[0].depth).toBe(0);
    expect(pos[0].y).toBe(0);
  });
  it('same-depth nodes never overlap (44px targets), up to 9 at one depth', () => {
    const base = fresh().map.nodes[0];
    const kids = Array.from({ length: 9 }, (_, i) => ({ ...base, id: 100 + i, parentId: base.id, seed: 1000 + i * 37 }));
    const pos = nodePositions([base, ...kids], 358);
    for (let a = 0; a < pos.length; a++) {
      for (let b = a + 1; b < pos.length; b++) {
        const overlap = Math.abs(pos[a].x - pos[b].x) < 44 && Math.abs(pos[a].y - pos[b].y) < 44;
        expect(overlap).toBe(false);
      }
    }
  });
});
```

Add `src/ui/screens/MapScreen.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, vi } from 'vitest';
import { MapScreen } from './MapScreen';
import { game } from '../store';
import { fresh } from '../../core/test-helpers';
import * as nav from '../nav';

describe('MapScreen', () => {
  it('uses pan-y touch action on the scroll container (iPhone vertical scroll)', () => {
    game.value = fresh();
    const { container } = render(<MapScreen />);
    const scroller = container.querySelector('[data-testid="map-scroll"]') as HTMLElement;
    expect(scroller.style.touchAction).toBe('pan-y');
  });
  it('every node button is at least 44px', () => {
    game.value = fresh();
    const { container } = render(<MapScreen />);
    container.querySelectorAll('[data-testid^="map-node-"]').forEach(b => {
      expect(parseInt((b as HTMLElement).style.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });
  it('shows a lock with the ability icon for a climb-gated node and does not open it', () => {
    const s = fresh();
    const gated = { ...s.map.nodes[0], id: 70, parentId: 1, seed: 70, status: 'open' as const,
      snapshot: { kind: 'generated' as const, generatorVersion: 1, name: '會唱歌的竹林', terrain: 'bamboo' as const,
        layout: 0 as const, weather: 'sunny' as const, landmarkId: 'lm-cabin', resident: 'passerby' as const, quirkId: 'q01', requires: 'climb' as const } };
    game.value = { ...s, map: { ...s.map, nodes: [...s.map.nodes, gated] } };
    const open = vi.spyOn(nav, 'openOverlay');
    const { getByTestId } = render(<MapScreen />);
    const btn = getByTestId('map-node-70');
    expect(btn.textContent).toContain('🔒');
    expect(btn.textContent).toContain('🌳');
    fireEvent.click(btn);
    expect(open).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/ui/screens/mapLayout.test.ts src/ui/screens/MapScreen.test.tsx`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `mapLayout.ts` and `MapScreen.tsx`; register `map: MapScreen` in `ui/screens/registry.ts`.** Compute depth by walking `parentId`. Stamps and labels use `nameOf(snapshot)`.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/ui/screens/mapLayout.test.ts src/ui/screens/MapScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Manual verification**
Run: `npm run dev`, open the app in Chrome devtools at 390×844. Check: the map scrolls up and down with a finger, the path winds left and right, locked nodes show 🔒 and the ability icon, done nodes show a stamp, nothing scrolls sideways, and the bottom nav stays visible above the home indicator.

- [ ] **Step 6: Commit**
```bash
git add src/ui/screens/mapLayout.ts src/ui/screens/mapLayout.test.ts src/ui/screens/MapScreen.tsx src/ui/screens/MapScreen.test.tsx src/ui/screens/registry.ts
git commit -m "feat(ui): add winding map screen with lock and stamp states" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Terrain scenes, weather overlays and landmarks (SVG)

**Files:**
- Create: `src/art/scenes/terrains.tsx`, `src/art/scenes/weather.tsx`, `src/art/landmarks.tsx`, `src/art/scenes/LocationScene.tsx`, `src/art/scenes/LocationScene.test.tsx`, `src/ui/components/LocationBackdrop.tsx`, `src/ui/components/LocationBackdrop.test.tsx`

**Interfaces:**
- Consumes: `SCENE_W`, `SCENE_H`, `HotspotDef`, `LocationLayout` (Task 4); `Terrain`, `LocationSnapshot` (A); `LANDMARKS` (Task 1)
- Produces:
  - `TERRAIN_SCENES: Record<\`${Terrain}-${0 | 1}\`, ComponentType>`（12 個）
  - `WEATHER_OVERLAYS: Record<'sunny' | 'rain' | 'fog' | 'snow' | 'rainbow', ComponentType>`（5 個，根元素 `pointer-events: none`）
  - `LANDMARK_ART: Record<string, ComponentType<{ size: number }>>`（12 個，key 同 `LANDMARKS` id）
  - `export function LocationScene(props: { snapshot: LocationSnapshot; hotspots: HotspotDef[]; onTap: (id: string) => void; tapped: string[] }): JSX.Element`
  - `sceneKey(snapshot)`: generated → `${terrain}-${layout}`; handmade → from `HANDMADE[id].terrain` with layout 0.
  - `export function LocationBackdrop(props: { nodeId: number }): JSX.Element`（`src/ui/components/LocationBackdrop.tsx`）：讀 `game.value` 中該節點的快照，只渲染背景 SVG（無熱點、`pointer-events: none`）；C 的 PhotoOverlay 使用（契約 §10.13）。
- UI rules: the SVG has `viewBox="0 0 360 480"` and `preserveAspectRatio="xMidYMid slice"`; hotspots are HTML `<button>`s absolutely positioned at `left: (x/360)*100%`, `top: (y/480)*100%`, `transform: translate(-50%,-50%)`, `width: 44px; height: 44px`, `aria-label` from hotspot role, `data-testid="hotspot-<id>"`, `style.touchAction = 'none'`; tapped hotspots show a ✓ and get `data-done="true"`. The wrapper `div` sets `touch-action: none`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/art/scenes/LocationScene.test.tsx
import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, vi } from 'vitest';
import { LocationScene } from './LocationScene';
import { TERRAIN_SCENES, WEATHER_OVERLAYS } from './terrains';
import { LANDMARK_ART } from '../landmarks';
import { LANDMARKS } from '../../content/locations';

const snap = { kind: 'generated' as const, generatorVersion: 1, name: '會唱歌的竹林', terrain: 'bamboo' as const,
  layout: 1 as const, weather: 'fog' as const, landmarkId: 'lm-treehouse', resident: 'passerby' as const, quirkId: 'q01', requires: null };
const hotspots = [
  { id: 'treasure', x: 60, y: 120, role: 'treasure' as const, reward: { kind: 'starSand' as const, amount: 5 } },
  { id: 'f0', x: 300, y: 380, role: 'filler' as const },
];

describe('scene art coverage', () => {
  it('has 12 terrain scenes, 5 weather overlays and 12 landmark components', () => {
    expect(Object.keys(TERRAIN_SCENES)).toHaveLength(12);
    expect(Object.keys(WEATHER_OVERLAYS)).toHaveLength(5);
    for (const l of LANDMARKS) expect(LANDMARK_ART[l.id]).toBeDefined();
  });
});

describe('LocationScene', () => {
  it('renders one hotspot button per hotspot with a 44px target', () => {
    const { container } = render(<LocationScene snapshot={snap} hotspots={hotspots} onTap={() => {}} tapped={[]} />);
    const btns = container.querySelectorAll('[data-testid^="hotspot-"]');
    expect(btns).toHaveLength(2);
    btns.forEach(b => {
      expect(parseInt((b as HTMLElement).style.width)).toBeGreaterThanOrEqual(44);
      expect(parseInt((b as HTMLElement).style.height)).toBeGreaterThanOrEqual(44);
    });
  });
  it('calls onTap with the hotspot id and marks tapped hotspots', () => {
    const onTap = vi.fn();
    const { getByTestId } = render(<LocationScene snapshot={snap} hotspots={hotspots} onTap={onTap} tapped={['f0']} />);
    fireEvent.click(getByTestId('hotspot-treasure'));
    expect(onTap).toHaveBeenCalledWith('treasure');
    expect(getByTestId('hotspot-f0').getAttribute('data-done')).toBe('true');
  });
  it('the scene wrapper disables browser touch panning (touch-action none)', () => {
    const { container } = render(<LocationScene snapshot={snap} hotspots={hotspots} onTap={() => {}} tapped={[]} />);
    expect((container.firstElementChild as HTMLElement).style.touchAction).toBe('none');
  });
});
```

Add `src/ui/components/LocationBackdrop.test.tsx`:

```tsx
import { render } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { LocationBackdrop } from './LocationBackdrop';
import { game } from '../store';
import { fresh, handmadeNode } from '../../core/test-helpers';

describe('LocationBackdrop', () => {
  it('renders the node scene with no hotspot buttons', () => {
    const s = fresh();
    game.value = s;
    const id = handmadeNode(s, 'bamboo-path').id;
    const { container } = render(<LocationBackdrop nodeId={id} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('[data-testid^="hotspot-"]')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/art/scenes/LocationScene.test.tsx src/ui/components/LocationBackdrop.test.tsx`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement the SVG art and `LocationScene.tsx`.** Terrain scenes: each is a background SVG with a sky, ground, and 3–5 terrain-specific shapes; layout 0 and 1 differ in composition (e.g., path left vs right). Landmarks: simple SVG shapes sized to `size`. Weather overlays use `pointer-events: none` and no external assets.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/art/scenes/LocationScene.test.tsx`
Expected: PASS

- [ ] **Step 5: Manual verification**
Run: `npm run dev`, open a generated location at 390×844. Check: the scene fills the width without cropping the hotspots, all 6 terrains look distinct, weather overlays don't block taps, hotspots are large enough to tap with a thumb, and the frame rate stays smooth while tapping (≥50fps target on the device).

- [ ] **Step 6: Commit**
```bash
git add src/art/scenes/terrains.tsx src/art/scenes/weather.tsx src/art/landmarks.tsx src/art/scenes/LocationScene.tsx src/art/scenes/LocationScene.test.tsx src/ui/components/LocationBackdrop.tsx src/ui/components/LocationBackdrop.test.tsx
git commit -m "feat(art): add terrain scenes, weather overlays and landmarks as SVG" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Puzzle view (`PuzzleView.tsx`)

**Files:**
- Create: `src/ui/components/PuzzleView.tsx`, `src/ui/components/PuzzleView.test.tsx`

**Interfaces:**
- Consumes: `Puzzle`, `checkAnswer` (Task 3)
- Produces: `export function PuzzleView(props: { puzzle: Puzzle; onSolved: () => void }): JSX.Element`
- UI: shadow → show `target` shape and 3 option buttons; sequence → show `shown` shapes with a 「？」 and 3 options; diff → 3 panels as buttons with the 3 shape rows; codelock → 3 digit inputs (`inputmode="numeric"`, `maxlength=1`, `data-testid="code-1..3"`) and a 「開鎖」 button. Wrong answer shows 「再想想」 and keeps the view open. Correct answer calls `onSolved()` once.

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/components/PuzzleView.test.tsx
import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, vi } from 'vitest';
import { PuzzleView } from './PuzzleView';
import { generatePuzzle } from '../../core/puzzles';
import { mulberry32 } from '../../core/rng';

describe('PuzzleView', () => {
  it('shadow: the correct option solves, a wrong one shows 再想想', () => {
    const p = generatePuzzle(mulberry32(3), 'shadow') as any;
    const onSolved = vi.fn();
    const { getByTestId, getByText } = render(<PuzzleView puzzle={p} onSolved={onSolved} />);
    fireEvent.click(getByTestId(`option-${(p.answer + 1) % 3}`));
    expect(getByText('再想想')).toBeTruthy();
    expect(onSolved).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(`option-${p.answer}`));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });
  it('codelock: three digits must match the code exactly', () => {
    const p = { kind: 'codelock' as const, code: '472' };
    const onSolved = vi.fn();
    const { getByTestId, getByText } = render(<PuzzleView puzzle={p} onSolved={onSolved} />);
    const set = (i: number, v: string) => fireEvent.input(getByTestId(`code-${i}`), { target: { value: v } });
    set(1, '4'); set(2, '7'); set(3, '1');
    fireEvent.click(getByText('開鎖'));
    expect(onSolved).not.toHaveBeenCalled();
    set(3, '2');
    fireEvent.click(getByText('開鎖'));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/ui/components/PuzzleView.test.tsx`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `PuzzleView.tsx`.** Option buttons have `data-testid="option-<index>"` and `min-height: 44px`; diff panels use the same testids. Use `checkAnswer` for validation.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/ui/components/PuzzleView.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/ui/components/PuzzleView.tsx src/ui/components/PuzzleView.test.tsx
git commit -m "feat(ui): add four puzzle views for the location secrets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: Minigame view (`Minigame.tsx`)

**Files:**
- Create: `src/ui/components/Minigame.tsx`, `src/ui/components/Minigame.test.tsx`

**Interfaces:**
- Consumes: `MinigameKind`, `MINIGAMES`, `GAME_SECONDS`, `scoreFromHits`, `remainingMs` (Task 9)
- Produces: `export function Minigame(props: { kind: MinigameKind; onFinish: (score01: number | null) => void }): JSX.Element`
- UI and rules:
  - Play area `data-testid="minigame-area"` with `touch-action: none`.
  - Countdown shows whole seconds from `remainingMs`; tap targets count `hits`.
  - 「跳過」 button always visible (`min-height: 44px`); calls `onFinish(null)`.
  - When the countdown reaches 0 → `onFinish(scoreFromHits(kind, hits))` exactly once.
  - `visibilitychange` to `hidden` or `pagehide` → `onFinish(null)` exactly once (no reward on abort).
  - Pause time is accumulated while `document.hidden`; the timer reads `now()` from `platform/clock.ts`（契約 §10.15：UI 也不直接呼叫 `Date.now()`）。

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/components/Minigame.test.tsx
import { render, fireEvent, act } from '@testing-library/preact';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Minigame } from './Minigame';

describe('Minigame', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('skip finishes with null exactly once', () => {
    const onFinish = vi.fn();
    const { getByText } = render(<Minigame kind="stars" onFinish={onFinish} />);
    fireEvent.click(getByText('跳過'));
    fireEvent.click(getByText('跳過'));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(null);
  });
  it('auto-ends after 30 seconds with the hit score', () => {
    const onFinish = vi.fn();
    const { getByTestId } = render(<Minigame kind="stars" onFinish={onFinish} />);
    const area = getByTestId('minigame-area');
    for (let i = 0; i < 6; i++) fireEvent.pointerDown(area, { clientX: 10, clientY: 10 });
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0]).toBeCloseTo(0.5);
  });
  it('switching away aborts with null and gives no reward', () => {
    const onFinish = vi.fn();
    render(<Minigame kind="hop" onFinish={onFinish} />);
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(null);
  });
  it('play area uses touch-action none', () => {
    const { getByTestId } = render(<Minigame kind="bubble" onFinish={() => {}} />);
    expect((getByTestId('minigame-area') as HTMLElement).style.touchAction).toBe('none');
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/ui/components/Minigame.test.tsx`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `Minigame.tsx`.** Use a single `done` ref to guarantee one `onFinish` call; register `pagehide` and `visibilitychange` listeners in `useEffect` and remove them on unmount. Targets for each kind are visual (falling stars, stepping stones, pairs); only the hit count matters for scoring.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/ui/components/Minigame.test.tsx`
Expected: PASS

- [ ] **Step 5: Manual verification**
Run: `npm run dev` at 390×844 and start a minigame from a location. Check: the play area does not scroll the page when dragged, the 跳過 button is easy to hit, the countdown is readable, and switching to another app then returning ends the game without a reward.

- [ ] **Step 6: Commit**
```bash
git add src/ui/components/Minigame.tsx src/ui/components/Minigame.test.tsx
git commit -m "feat(ui): add 30-second skippable minigame view with abort on background" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: Location screen (`LocationScreen.tsx`)

**Files:**
- Create: `src/ui/screens/LocationScreen.tsx`, `src/ui/screens/LocationScreen.test.tsx`
- Modify: `src/ui/screens/registry.ts`

**Interfaces:**
- Consumes: `enter`, `tapHotspot`, `talk`, `bringFood`, `solveSecret`, `complete`, `finishMinigame`, `layoutFor` (Tasks 6–9); `minigameOffered`, `minigameKind` (Task 9); `LocationScene` (Task 20); `PuzzleView` (Task 21); `Minigame` (Task 22); `commit`, `game` (A); `closeOverlay` (A); `resolveScript` (Task 18); `Dialogue` (A); `openOverlay` (A)
- Produces: `export function LocationScreen(props: { overlay: { kind: 'location'; nodeId: number } }): JSX.Element` registered as `OVERLAY_SCREENS.location`.
- UI rules:
  - On mount: if `canEnter` is false or energy < 25 → show 「熊貓想先休息，回家照顧一下吧」 with a 「回家」 button calling `closeOverlay`; do not call `enter`. Otherwise call `commit(enter(...))`.
  - Scene: `LocationScene` with `layoutFor(...)` hotspots, `tapped = foundHotspots`; tapping calls `commit(tapHotspot(...))`.
  - Resident / passerby: 「說話」 button (`data-testid="talk-button"`, disabled when `talked`) → `commit(talk(...))`; open `Dialogue` for the resident's first line if the layout has no script (use a generic line from the handmade `talk` or 1 line from `FRIENDS.chat` by level).
  - Request panel: `find` → 「找到了」 is the hotspot `request` tap; `bring` → a food picker listing `inventory` food items with `bringFood`.
  - Secret: if `layout.secret.kind === 'puzzle'` and `'secret'` not found → 「祕密謎題」 button (`data-testid="secret-button"`) opens `PuzzleView`; onSolved → `commit(solveSecret(...))`.
  - Minigame: if `minigameOffered(seed, nodeId, today)` and `'minigame'` not in foundHotspots → show 「小遊戲」 button; opening shows `Minigame`; `onFinish(score)` → `commit(finishMinigame(...))`.
  - Complete: `data-testid="complete-button"`, disabled until `talked && treasureFound`; click → `commit(complete(...))` then `closeOverlay()`.
  - 拍照：`data-testid="photo-button"`（≥ 44px）→ `openOverlay({ kind: 'photo', context: { nodeId } })`（契約 §10.13；C 的 PhotoOverlay 以 `LocationBackdrop` 作背景）。

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/screens/LocationScreen.test.tsx
import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocationScreen } from './LocationScreen';
import { game } from '../store';
import { fresh, handmadeNode } from '../../core/test-helpers';
import { layoutFor } from '../../core/location';
import { TODAY } from '../../core/test-helpers';
import * as nav from '../nav';

describe('LocationScreen', () => {
  beforeEach(() => {
    game.value = fresh();
  });
  it('low energy shows the rest message and does not enter', () => {
    game.value = { ...game.value, energy: 24 };
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByText } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect(getByText(/想先休息/)).toBeTruthy();
    expect(game.value.map.nodes.find(n => n.id === id)!.progress).toBeNull();
  });
  it('complete is disabled until talked and treasure are found', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect((getByTestId('complete-button') as HTMLButtonElement).disabled).toBe(true);
  });
  it('tapping the treasure hotspot records it in game state', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    const treasure = layoutFor(game.value, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    fireEvent.click(getByTestId(`hotspot-${treasure.id}`));
    expect(game.value.map.nodes.find(n => n.id === id)!.progress!.treasureFound).toBe(true);
  });
  it('talking then tapping treasure enables complete', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('talk-button'));
    const treasure = layoutFor(game.value, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    fireEvent.click(getByTestId(`hotspot-${treasure.id}`));
    expect((getByTestId('complete-button') as HTMLButtonElement).disabled).toBe(false);
  });
  it('拍照 button opens the photo overlay for this node', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const open = vi.spyOn(nav, 'openOverlay');
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('photo-button'));
    expect(open).toHaveBeenCalledWith({ kind: 'photo', context: { nodeId: id } });
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/ui/screens/LocationScreen.test.tsx`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement `LocationScreen.tsx` and register `location: LocationScreen` in `ui/screens/registry.ts`.** Keep every core call inside `commit(...)`; a null result from `bringFood` shows a small 「這個不行喔」 hint.

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/ui/screens/LocationScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Manual verification**
Run: `npm run dev` at 390×844 with energy at 30, then 100. Check: the rest message appears at low energy and the 回家 button returns to home; at full energy the scene fills the width, each hotspot taps with a thumb, 完成 stays grey until talk and treasure are done, and the sheet scrolls without sideways overflow.

- [ ] **Step 6: Commit**
```bash
git add src/ui/screens/LocationScreen.tsx src/ui/screens/LocationScreen.test.tsx src/ui/screens/registry.ts
git commit -m "feat(ui): add location screen with hotspots, talk, requests, secret and complete" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 24: Album tabs (朋友卡, 地點印章, 傳說卡)

**Files:**
- Create: `src/ui/album/FriendCardsTab.tsx`（覆寫 C 的佔位檔）, `src/ui/album/FriendCardsTab.test.tsx`, `src/ui/album/StampsTab.tsx`（覆寫 C 的佔位檔）, `src/ui/album/StampsTab.test.tsx`, `src/ui/album/LegendCards.tsx`, `src/ui/album/LegendCards.test.tsx`
- Modify: `src/ui/album/Album.tsx`（C 建立；替換「朋友卡」「地點印章」佔位分頁，嵌入 `LegendCards`）

**Interfaces:**
- Consumes: `levelOf`, `friendLevelThreshold` (A, `core/friendLevel.ts`); `FRIENDS` (Task 13); `storySegmentsUnlocked` (Task 8); `FRIEND_STORIES` keys (Task 15); `markBeatSeen` (Task 10); `CHAPTER_SCRIPTS`, `COLLAR_CLUES` (Task 14); `idbGet`, `idbKeys` (A, `platform/idb.ts`); `PhotoRecord` (C, `platform/photos.ts`); `game`, `openOverlay` (A); `nameOf` (Task 2/17)
- Produces:
  - `FriendCardsTab(): JSX.Element`（`src/ui/album/FriendCardsTab.tsx`）：每位朋友顯示名字、等級、進度條（`(points - friendLevelThreshold(level)) / (friendLevelThreshold(level+1) - friendLevelThreshold(level))`）、已解鎖故事線按鈕（`data-testid="story-<id>-<n>"`，點擊 `markBeatSeen` 並 `openOverlay({kind:'dialogue', scriptId})`）；未解鎖的段顯示「等級 n 解鎖」。
  - `StampsTab(): JSX.Element`（`src/ui/album/StampsTab.tsx`）：每個已完成地點（`status === 'done'`）顯示蓋章 `data-testid="stamp-<id>"`；`secretFound` 時多一顆 ★；下方顯示「項圈線索」清單（`data-testid="clue-<n>"`），已觸發的 `ch1`…`ch5` 對應 `COLLAR_CLUES` 名稱顯示，未觸發顯示「還沒找到」。
  - `LegendCards(): JSX.Element`（`src/ui/album/LegendCards.tsx`）：讀取 IndexedDB `photos` 中 `kind: 'legend'` 的記錄（`idbKeys('photos')` 篩出 `legend-` 前綴後逐一 `idbGet`），每張 `data-testid="legend-<id>"` 顯示記錄的 `text`（Task 18 寫入），點擊開啟 `dialogue` overlay（`scriptId` = 記錄 id）。傳說卡不由 `storyBeats` 重建。
- Album integration: `ui/album/Album.tsx`（C）的「朋友卡」「地點印章」分頁以 `FriendCardsTab`、`StampsTab` 覆寫 C 的佔位元件；「回憶照片」分頁在照片列表上方嵌入 `<LegendCards />`。

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/album/FriendCardsTab.test.tsx
import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FriendCardsTab } from './FriendCardsTab';
import { game } from '../store';
import { fresh } from '../../core/test-helpers';
import * as nav from '../nav';

describe('FriendCardsTab', () => {
  beforeEach(() => { game.value = fresh(); });
  it('shows level and progress for each friend', () => {
    game.value = { ...game.value, friends: { ...game.value.friends, juzi: { points: 30, chatsToday: 0 } } };
    const { getByTestId } = render(<FriendCardsTab />);
    expect(getByTestId('friend-juzi').textContent).toContain('Lv 2');
    const bar = getByTestId('friend-juzi-progress') as HTMLElement;
    expect(bar.style.width).toBe('25%'); // (30-20)/(60-20)
  });
  it('unlocked segment opens dialogue and marks it seen', () => {
    const open = vi.spyOn(nav, 'openOverlay');
    const { getByTestId } = render(<FriendCardsTab />);
    fireEvent.click(getByTestId('story-mianhua-1'));
    expect(open).toHaveBeenCalledWith({ kind: 'dialogue', scriptId: 'friend-mianhua-1' });
    expect(game.value.storyBeats).toContain('friend-mianhua-1');
  });
  it('locked segment is not clickable', () => {
    const { getByTestId } = render(<FriendCardsTab />);
    expect((getByTestId('story-mianhua-2') as HTMLButtonElement).disabled).toBe(true);
  });
});
```

Note: with `points: 30` and level 2 (T(2)=20, T(3)=60), progress is `(30-20)/(60-20) = 25%`, which the first assertion expects.

Add `src/ui/album/StampsTab.test.tsx`:

```tsx
import { render } from '@testing-library/preact';
import { describe, it, expect, beforeEach } from 'vitest';
import { StampsTab } from './StampsTab';
import { game } from '../store';
import { fresh, handmadeNode } from '../../core/test-helpers';

describe('StampsTab', () => {
  beforeEach(() => { game.value = fresh(); });
  it('stamps only done nodes and adds a star when the secret was found', () => {
    const s = fresh();
    const id = handmadeNode(s, 'bamboo-path').id;
    game.value = { ...s, map: { ...s.map, nodes: s.map.nodes.map(n => n.id === id ? { ...n, status: 'done', secretFound: true } : n) } };
    const { getByTestId, queryByTestId } = render(<StampsTab />);
    expect(getByTestId(`stamp-${id}`).textContent).toContain('★');
    expect(queryByTestId(`stamp-${id + 1000}`)).toBeNull();
  });
  it('clue list shows unfound clues until their chapter is triggered', () => {
    game.value = { ...game.value, storyBeats: ['ch1'] };
    const { getByTestId } = render(<StampsTab />);
    expect(getByTestId('clue-1').textContent).not.toContain('還沒找到');
    expect(getByTestId('clue-2').textContent).toContain('還沒找到');
  });
});

```

Add `src/ui/album/LegendCards.test.tsx`:

```tsx
import { render } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { LegendCards } from './LegendCards';
import { recordLegend } from '../components/legendRecord';
import { NOW } from '../../core/test-helpers';

describe('LegendCards', () => {
  it('lists legend records stored in IndexedDB photos', async () => {
    await recordLegend(42, 20, NOW);
    const { findByTestId } = render(<LegendCards />);
    expect(await findByTestId('legend-legend-20')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npx vitest run src/ui/album/FriendCardsTab.test.tsx src/ui/album/StampsTab.test.tsx src/ui/album/LegendCards.test.tsx`
Expected: FAIL（module not found）

- [ ] **Step 3: Implement the three components in `src/ui/album/` (overwriting C's placeholder `FriendCardsTab.tsx` and `StampsTab.tsx`) and integrate them into `src/ui/album/Album.tsx`.**

- [ ] **Step 4: Run, expect PASS**
Run: `npx vitest run src/ui/album/FriendCardsTab.test.tsx src/ui/album/StampsTab.test.tsx src/ui/album/LegendCards.test.tsx`
Expected: PASS

- [ ] **Step 5: Manual verification**
Run: `npm run dev` at 390×844, open 相簿. Check: friend cards show the level and a bar that fills as points rise, locked story segments say which level unlocks them, stamps show a star on secret-found places, and the clue list fills in after each chapter.

- [ ] **Step 6: Commit**
```bash
git add src/ui/album/FriendCardsTab.tsx src/ui/album/FriendCardsTab.test.tsx src/ui/album/StampsTab.tsx src/ui/album/StampsTab.test.tsx src/ui/album/LegendCards.tsx src/ui/album/LegendCards.test.tsx src/ui/album/Album.tsx
git commit -m "feat(ui): add friend cards, stamp book, clue list and legend cards to album" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Integration and verification

### Task 25: End-to-end regression (Playwright) and device checklist

**Files:**
- Create: `e2e/adventure.spec.ts`, `docs/device-test-checklist.md`
- Modify: `playwright.config.ts`（A 建立）— projects: `mobile-chromium`、`mobile-webkit`（390×844，`isMobile: true`）、`desktop-chromium`（1280×800）、`desktop-webkit`（1280×800）

**Interfaces:**
- Consumes: 契約 §10.17 的 `seedSave(page, patch)`（`e2e/fixtures.ts`，A）與 testids：A（`care-hug`, `care-feed`, `tray-<itemId>`, `panda-mouth`, `tab-map`, `tab-giftbox`, `dialogue-next`）、B（`map-node-<id>`, `hotspot-<id>`, `talk-button`, `complete-button`, `minigame-area`, `map-scroll`, `stamp-<id>`）、C（`giftbox-open`, `inventory-<itemId>`, `room-cell-<x>-<y>`, `placed-<uid>`）
- Produces: a runnable `npm run test:e2e` covering the full path.

- [ ] **Step 1: Write the failing test**

```ts
// e2e/adventure.spec.ts
import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';
import { CHAPTER_SCRIPTS } from '../src/content/story/chapters';

test('new game → hug → feed → complete 竹林小徑 → open gift box → place furniture → reload keeps progress', async ({ page }) => {
  await seedSave(page, {});                                  // onboardingDone: true，跳過新手引導（契約 §10.17）
  await page.goto('./');
  await page.getByTestId('care-hug').click();
  await page.getByTestId('care-feed').click();               // 開啟餵食盤
  await page.getByTestId('tray-food-bamboo-cake').dragTo(page.getByTestId('panda-mouth'));
  await page.getByTestId('tab-map').click();
  await page.getByTestId(/^map-node-/).first().click();
  await page.getByTestId('talk-button').click();
  await page.getByTestId(/^hotspot-treasure/).click();
  await page.getByTestId('complete-button').click();
  await page.getByTestId('tab-giftbox').click();
  await page.getByTestId('giftbox-open').click();            // C
  await page.getByTestId(/^inventory-/).first().dragTo(page.getByTestId('room-cell-2-3')); // C
  await page.reload();
  await expect(page.getByTestId(/^placed-/).first()).toBeVisible();
  await expect(page.getByTestId(/^stamp-/).first()).toBeVisible();
});

test('completing the third location opens chapter 1 automatically', async ({ page }) => {
  await seedSave(page, { completedCount: 2, energy: 100 }); // 第 3 個完成地點觸發 ch1（契約 §10.8）
  await page.goto('./');
  await page.getByTestId('tab-map').click();
  await page.getByTestId(/^map-node-/).first().click();
  await page.getByTestId('talk-button').click();
  await page.getByTestId(/^hotspot-treasure/).click();
  await page.getByTestId('complete-button').click();
  await expect(page.getByText(CHAPTER_SCRIPTS.ch1.lines[0].text)).toBeVisible();
});

test('map scroll container stays touch-action pan-y and page has no horizontal scroll', async ({ page }) => {
  await seedSave(page, {});
  await page.goto('./');
  await page.getByTestId('tab-map').click();
  const scroller = page.getByTestId('map-scroll');
  await expect(scroller).toHaveCSS('touch-action', 'pan-y');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
```

- [ ] **Step 2: Run it, expect FAIL**
Run: `npm run test:e2e -- e2e/adventure.spec.ts`
Expected: FAIL（no app yet at this point, or testids missing）

- [ ] **Step 3: Implement** the missing testids in B's components if absent; add the playwright projects; write `docs/device-test-checklist.md` with the sections below. Do not add tests for 照片存到手機: it is reserved and not designed in this version (user instruction).

`docs/device-test-checklist.md` must contain these headings and check items (女兒 iPhone, iOS 16.4+):
- `## 測試矩陣`: 「Chrome 分頁」、「從 Chrome 加入主畫面」、「iOS Safari 分頁（抽測）」 × each item below.
- `## 窗外地圖`: 上下捲動不被地圖誤拖曳、節點點擊、鎖頭與能力圖示、蓋章與 ★、底部導覽不被 home indicator 遮住。
- `## 地點場景`: 熱點 44px 點得到、天氣覆蓋層不擋點擊、元氣不足時的休息提示、中途離開後再進來進度保留、跨日後進度重置、完成按鈕門檻。
- `## 謎題與小遊戲`: 四種謎題可操作、密碼鍵盤數字輸入、小遊戲 30 秒計時、跳過、切到其他 App 再回來不給獎勵且不卡住、`pagehide` 後不重複獎勵。
- `## 朋友與故事`: 聊天每天 3 次上限、送禮、等級進度條、故事線解鎖、信件每日一封、來訪送客。
- `## 離線與存檔（B 相關）`: 離線隔天打開後每日重置一次、重新整理後地點進度與蓋章仍在、相簿線索與傳說卡仍在。
- `## 效能與版面`: 390×844 無水平捲動、場景與地圖 ≥ 50fps、横放顯示「把手機轉直」提示。
- Each item has `[ ]` checkboxes and a 「結果」 line.

- [ ] **Step 4: Run, expect PASS**
Run: `npm run test:e2e`
Expected: PASS on all four projects. Then `npm test` and `npm run typecheck` must also PASS.

- [ ] **Step 5: Real device**
Follow `docs/device-test-checklist.md` on the daughter's iPhone (Chrome tab, home-screen app, Safari spot check). Record results in the file's 結果 lines. Playwright is a regression signal only; it does not replace this step.

- [ ] **Step 6: Commit**
```bash
git add e2e/adventure.spec.ts docs/device-test-checklist.md playwright.config.ts
git commit -m "test(e2e): add adventure regression flow and iPhone device checklist" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-Review

### Spec coverage (sections owned by this plan)

| Spec section / bullet | Task |
|---|---|
| 3.1 窗外 tab (map) | 19 |
| 3.2 step 3 (choose location, explore scene) | 6, 23 |
| 4.4 金鏈 from locations (+1 on first and revisit) | 7 |
| 4.5 地點 rewards: first (30 / 15–25 / −25 / +1), revisit (10 capped 3 per day / 8–12 / −25 / +1), secret (+10 / +10), minigame 5–15, friend request (+15 / +10), recipe discovery (no, owned by A) | 6, 7, 9 |
| 6.1 map generation, 1–2 children at 50%, handmade chain, ability threshold 25%, ensureEnterable, snapshot | 2, 5, 17 |
| 6.2 location gameplay: scene, 4–6 hotspots, resident/passerby + request, treasure, secret (hidden or 4 puzzles), 30% minigame skippable, energy ≥25 at enter and −25 at completion, progress kept until completion or date change, daily refresh | 4, 6, 7, 9, 20, 21, 22, 23 |
| 6.3 handmade (3) and generated content (6 terrains × 2 layouts, 5 weathers, 12 landmarks, 20 quirks, name combos), generator seed and snapshot with generatorVersion, ability gating only from implemented abilities, terrain mapping | 1, 2, 5, 17, 20 |
| 6.4 friends (4, 5-segment storyline, points rules, level 20n, unlimited, per-level dialogue, furniture at 3/6/10, letters daily max 1 never expire, resident 50%) | 8, 11, 12, 13, 15, 24 |
| 6.5 main story (prologue owned by A; ch1–ch5 at 3/6/9/12/15; legends from 20 every 5; 10 templates; legend card in album; ch scripts) | 10, 14, 16, 18, 24 |
| 7.6 album: 朋友卡 and 地點印章 tabs; 傳說卡 in 回憶照片 | 24 |
| 7.7 content counts owned here: 4 friends, 5 segments each, 主線 5 章, 小傳說 10, 謎題 4, 小遊戲 3, 手工地點 3 | 1, 3, 13, 14, 15, 16, 17, 22 |
| 8.2 modules `mapgen`, `locationgen`, `story`, `friends` | 2, 5, 8, 10, 4, 6, 7 |
| 8.1 touch rules (pan-y map, touch-action none scene and minigame), 44px targets, 16px gutter / 480px via layout | 19, 20, 22, 25 |
| 9 每日規則 (cross-day reset of chatsToday, revisit counter, location progress) | 12 |
| 10 錯誤處理 (location: energy rest message) | 23 |
| 11 單元測試 items owned here (map determinism, ability only implemented, always-enterable guarantee, snapshot stability, revisit cap, energy at completion, chapter triggers, legend, friend level formula, daily settlement for these handlers) | 2, 4, 5, 7, 8, 10, 12 |
| 11 元件測試 owned here (scene hotspots, minigame gestures, map drag) | 19, 20, 22, 23 |
| 11 E2E flow (new game → hug → feed → complete 竹林小徑 → gift box → furniture → reload) | 25 |
| 11 真機矩陣 (iPhone Chrome tab / home-screen / Safari spot check; map and scene and minigame items) | 25 |
| 13 不做的事 | Respected: no payment, no timers on visits, no expiry on letters or visits, no friend death or penalty |

Review focus coverage: 1 → Tasks 6, 7, 9; 2 → Tasks 19, 20, 22; 3 → Tasks 6, 12; 4 → Tasks 5, 6, 23; 5 → Tasks 9, 22.

### Cross-review revision (applied to this plan)

| Issue | Fix | Tasks touched |
|---|---|---|
| 1 food/ingredient ids | `food-starry-apple`; FOOD_IDS/INGREDIENT_IDS from A per contract §10.1 | 8, 13, Self-Review |
| 2 friend furniture | ids `furn-<id>-k`; granted only by `addAffinity`; no-double-grant test | 8 |
| 3 level formula | `levelOf` re-exported from A's `core/friendLevel.ts`; own formula removed | 8, 24 |
| 7 album paths | `src/ui/album/` (`FriendCardsTab`, `StampsTab`, `LegendCards`) overwriting C placeholders | 24, file list |
| 8 letter loss | `addLetter` never trims; A's `splitArchive` (core/save.ts) in store `commit` archives overflow | 11, 12 |
| 9 duplicate letters file | `content/friendLetters.ts` (12 friend letters); welcome letter removed from B | 11, file list |
| 10 chapters never play | `registerScriptResolver` for `legend-N`; ch1–ch5 in `SCRIPTS`; E2E checks ch1 opens | 18, 25 |
| 11 visits not recorded | `recordVisit(state, 'locations', name)` in `complete`, with test | 7 |
| 13 overlapping nodes | `nodePositions` by depth, sibling index and seed; no-overlap test (9 nodes) | 19 |
| 15 E2E | `seedSave`, contract testids, `tray-<itemId>`, `panda-mouth`, `giftbox-open` | 25 |
| 21 photo mode | `photo-button` in LocationScreen; `LocationBackdrop` exported | 20, 23 |
| 22 legend cards | `recordLegend` writes `PhotoRecord kind 'legend'`; LegendCards reads `photos` | 18, 24 |
| 23 clock | Minigame uses `platform/clock` `now()` | 22 |
| 27 ingredient chance | uses C's `ingredientDropChance(mods) / 100` (30 base + 30 points), with test | 7 |
| contract §10.16 | `adventureHandlers` listed in `core/daily.ts` array, not side-effect import | 12, file list |
| 25 commit trailers | all commit trailers are `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` | Global Constraints, Self-Review |

Not in plan B's scope (left unchanged here): 4, 5, 6, 12 (awake), 14, 16, 17, 18, 19, 20, 24, 26 items that belong to plans A or C.

### Intentionally left to other plans or outside this plan

- 照片存到手機：依使用者指示先預留、不設計，本計畫不含任何任務或真機項目。
- 相簿「回憶照片」的照片本體、拍照模式、禮盒機、棉花糖小舖、物品圖鑑 → Plan C。
- 熊貓 SVG、照顧、情緒、序章、welcome overlay 與離線歡迎禮物、`dailyHandlers` 本體、存檔與備份、PWA → Plan A。
- 墜飾 `Modifiers` 的定義與 `pendantModifiers`、衣櫃、布置、朋友專屬家具的物品定義（`furn-<id>-1..3`，契約 §10.3）→ Plan C。

### Decisions this plan made where the contract was silent

1. Friend level: 唯一公式為契約 §5／§10.4 的 `core/friendLevel.ts`（A），`T(L) = 10·(L−1)·L`（L=2 為 20，L=3 為 60，L=10 為 900）；本計畫的 `friends.ts` 只 re-export `levelOf`。
2. Gifts (`giveGift`) only use food or ingredient items from inventory, and a liked item gives +10.
3. Requests: `find` is a hotspot tap; `bring` is giving one basic food. Rewards are given on the request itself (xp 15, starSand 10) and resident friends also get +10 affinity. Requests do not gate completion.
4. Secret choice: each generated location has a 50% chance of a hidden hotspot, otherwise a puzzle; handmade locations use fixed kinds (Task 17).
5. Flags for `request`, `secret`, `minigame` are stored in `LocationProgress.foundHotspots` so the contract's `LocationProgress` shape is unchanged.
6. Visits persist until the player ends them (no expiry); a visit is only chosen on a day when there is no unfinished visit.
7. Story: `checkStory` appends the beat to `storyBeats` when it sets `pendingBeat`, and `ackBeat` clears it. `prologue` stays with Plan A.
8. Legends: 小傳說由 A 的 `resolveScript` 經 `registerScriptResolver` 動態解析（契約 §10.8），B 在 `content/story/index.ts` 註冊；模板產生的腳本不放入靜態 `SCRIPTS`。
9. Letters: `addLetter` 不裁切、新信放在最前面；超過 30 封的部分由 A 的 `splitArchive`（`core/save.ts`）在 `ui/store.ts` 的 `commit` 中封存（契約 §10.5）。
10. 信件與聊天流程與時間無關；小遊戲計時使用 `platform/clock.ts` 的 `now()`（契約 §10.15），核心與 UI 皆不直接呼叫 `Date.now()`。
11. 食材掉落：`chance(rand, ingredientDropChance(mods) / 100)`（C 的函式，回傳百分比）；蘑菇墜飾 `pendant-mushroom` 的 30 為百分點，合計 60%（契約 §10.12）。
12. 地圖座標：同深度依索引分三欄三列，加上依 seed 的 ±3px 抖動；同深度 ≤ 9 個節點保證不重疊（測試覆蓋）。超過 9 個時列數會延伸，本計畫未保證該情況。
13. 傳說卡：Dialogue 開啟 `legend-N` 時寫入 IndexedDB `photos`（`kind: 'legend'`，`recordLegend`）；傳說卡清單只讀 `photos`，不由 `storyBeats` 重建。
14. 拍照：地點畫面提供「拍照」按鈕（`photo-button`），並匯出 `LocationBackdrop({ nodeId })` 供 C 的 PhotoOverlay 使用（契約 §10.13）。
15. 每日處理器：`adventureHandlers` 由 `core/daily.ts` 的 `dailyHandlers` 陣列直接列出，不使用副作用 import（契約 §10.16）。

### Contract problems found (for the orchestrator to reconcile)

- `LocationLayout` and the puzzle types are not in the contract; this plan defines them in `core/locationgen.ts` and `core/puzzles.ts`.
- 已由契約 §10.1 解決：A 匯出 `INGREDIENT_IDS` 與 `FOOD_IDS`；星空蘋果 id 為 `food-starry-apple`（本計畫已改用）。
- Plan C must provide `giftPool(rarity)` and `ITEMS` ids used by treasure rewards, the 8 pendant ids (`pendant-heart`, `pendant-shell`, and others), and the 12 friend furniture ids `furn-<id>-1..3`（契約 §10.3；只由 B 的 `addAffinity` 發放）. Task 8 and Task 4 fail loudly if these are missing.
- 已由契約 §10.8 解決：A 的 `Dialogue` 經 `resolveScript(id, seed)` 查詢；B 只在 Task 18 新增 `recordLegend` 與 `registerBeatAck(ackBeat)`。
- The initial map node (竹林小徑) is assumed to be a handmade `bamboo-path` node created by Plan A; tests find it by snapshot, not by id.
- 已由契約 §10.15／§10.17 解決：E2E 使用契約列出的 testid 與 `seedSave`（食物為 `tray-<itemId>`，禮盒為 `giftbox-open`）。
- Commit attribution: 本計畫所有 commit 訊息結尾為 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`（契約 §10.19）。
