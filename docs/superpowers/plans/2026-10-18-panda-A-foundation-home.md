# 熊貓成長記 Foundation & Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可部署的 PWA 骨架、完整的 `core/` 純邏輯（狀態、成長、照顧、情緒、日記、存檔）、平台層（存檔、備份、IndexedDB、PWA），以及「家」畫面的照顧循環、引導與設定，讓玩家能在 iPhone 上養熊貓並安全存檔。

**Architecture:** 純邏輯放在 `src/core/`（不碰 DOM、不呼叫 `Date.now()`／`Math.random()`，時間與種子由呼叫端傳入）；`src/platform/` 負責 localStorage、IndexedDB、音效、粒子、PWA；`src/ui/` 以 Preact 元件與 signals store 呈現畫面，所有狀態變更經由 `commit()` 寫入、排程存檔並推送事件。熊貓是獨立的 SVG 元件（`src/panda/`），會動的部件各自放在 `<g data-part>`。

**Tech Stack:** Vite, TypeScript (strict), Preact + @preact/signals, fflate, vite-plugin-pwa (registerType prompt), Vitest + jsdom + @testing-library/preact, fake-indexeddb, Playwright (Chromium + WebKit), GitHub Actions + GitHub Pages.

**Spec:** docs/superpowers/specs/2026-10-18-baby-panda-game-design.md
**Contract:** docs/superpowers/plans/2026-10-18-panda-00-shared-contract.md

---

## Global Constraints

- 手機是 iPhone，使用 Chrome 瀏覽器；主要目標為 iPhone 上的 Chrome 與主畫面 Web App（iOS 16.4+）。
- 玩家是 9 歲女孩；所有玩法不依賴聲音；完全沒有付費；不做死亡、生病、限時、連續登入獎勵。
- 所有使用者可見文字為繁體中文（台灣用語），風格有梗、不幼稚。
- 電腦版：遊戲區域寬度上限 `480px`，置中，兩側留白；滑鼠與觸控都用 Pointer Events。
- 版面：`viewport-fit=cover`；高度 `100dvh`；左右邊距 `16px`；頂部與底部加 `env(safe-area-inset-*)`；不產生水平捲動；所有按鈕觸控區 `≥ 44px`。
- 只支援直式；觸控裝置橫放時顯示「把手機轉直」提示（電腦版不受影響）。
- 觸控規則：窗外地圖 `touch-action: pan-y`；布置、照顧、小遊戲區 `touch-action: none`；拖曳用 `setPointerCapture`；長按門檻 `300ms`、移動容差 `8px`。
- 全域 `-webkit-touch-callout: none; user-select: none`（輸入框除外）。
- Vite `base: './'`；manifest `start_url` 與 `scope` 都是 `./`；建置時把 git 短 hash 寫入設定頁版本號。
- PWA：`registerType: 'prompt'`；預先快取全部建置產物；遊戲不依賴網路資源；不使用外部圖片或網路字型。
- 效能預算：首次載入 gzip 後 `< 500KB`；家畫面與地點場景 `≥ 50fps`，不達標時先降粒子數，其次關陰影。
- 粒子同時存在上限 `60` 個；Canvas 裝置像素比上限 `2`；尊重 `prefers-reduced-motion`（關閉粒子與大幅晃動）。
- 音效：Web Audio 合成；第一次 `pointerdown` 呼叫 `AudioContext.resume()` 解鎖；音效失敗靜默略過。
- 時間：「當地日期」為裝置時區的 `YYYY-MM-DD`；`lastDailyDate` 只在日期**大於**它時執行每日結算。
- 時鐘與亂數（契約 10.15）：UI、核心與平台層都不可直接呼叫 `Date.now()` 或 `new Date()`，一律透過 `platform/clock.ts` 的 `now()`，核心函式以參數接收時間；`Math.random()` 全專案禁用，亂數一律由種子與 `core/rng.ts` 產生。
- 離線時間差上限 `72` 小時；負值視為 `0`；指標下限 `30`；指標衰減：肚子 `−4／小時`、香香 `−3／小時`、心情 `−5／小時`。
- 元氣 `0–100`：每小時 `+10`；每次有效照顧 `+15`；完成地點 `−25`（完成時才扣）。
- 有效照顧：對應指標 `< 100` 時給獎勵，指標 `+25`（上限 100）；抱抱每小時最多 `5` 次有效抱抱。
- 有效照顧獎勵：成長值 `+5`、星砂 `+2`、元氣 `+15`、金鏈 `+1`。
- 成長刻度：第 n 格單格所需 `25 + 10 × n`；階段 `= floor(刻度 ÷ 5) + 1`；刻度 5 進階段 2、10 進階段 3、15 進階段 4、20 進階段 5。
- 階段身形縮放：階段 1–4 為 `0.80 → 0.90 → 1.00 → 1.05`，階段 5 起固定；光澤層級 `= floor(階段 ÷ 5)`。
- 項圈：起始 2 個墜飾欄位，每 50 環 +1 欄位；鏈環最多畫 24 環，超過以 `×N` 表示；每 100 環變粗一級、最多 5 級。
- 存檔：localStorage 鍵 `panda.save`；損壞備份鍵 `panda.save.corrupt`；`schemaVersion` 整數；主存檔日記最多 60 篇、信件最多 30 封，其餘封存到 IndexedDB。
- 備份：IndexedDB `backups` 儲存區，距上一份超過 `10 分鐘` 才新增，保留最近 `3` 份。
- 寫入：狀態改變後延遲 `1 秒` 寫入；`visibilitychange`（hidden）與 `pagehide` 立即寫入。
- 存檔過大：localStorage 主存檔超過 `1MB` 時提示匯出並先執行封存。
- 離線超過 `12 小時` 後剛打開：熊貓睡覺；離線超過 `24 小時`：歡迎畫面，送 `30 星砂` 與一封信，沒有任何扣分。
- 睡覺時段：當地時間 `23:00–06:00`。
- 隨機小驚喜：3 秒內戳 `8` 下觸發；偷吃被抓包 `10%`；抱抱後害羞 `30%`。
- 打嗝：3 分鐘內吃超過 3 個觸發。
- 洗澡：泡泡覆蓋率達 `70%` 完成。
- 匯入前先確認「會取代目前的熊貓」，並自動備份目前存檔；格式錯誤顯示「這個存檔碼看不懂」且不覆蓋進度。
- 尚未加入主畫面、距離上次匯出超過 `5 天` 時，打開遊戲溫和提醒「幫熊貓備份一下」。
- 照片不進 repo：`.gitignore` 排除 `*.HEIC`。
- 熊貓外觀：毛色暖米灰（不是純白）、黑色淚滴眼圈、琥珀色眼睛、黑鼻子、黑耳朵、黑手腳與肩帶、米灰背與臀、短尾巴、金色／米色鍊條項圈（任何姿勢都要畫出來）。
- 招牌姿勢：坐著，雙手向前伸要抱抱。
- 工具指令：`npm run dev`、`npm run build`、`npm test`、`npm run test:e2e`、`npm run typecheck`。

## Review Focus

- **觸控拖曳被頁面捲動或 iOS 長按選單打斷（餵食、洗澡、布置）：** Task 23 的拖曳測試走 Pointer Events 與 setPointerCapture 路徑；Task 1 的 CSS 測試檢查 `-webkit-touch-callout: none` 與觸控規則。
- **iOS 上存檔消失或分離（Chrome 分頁與主畫面各自獨立、7 天未用可能清除）：** Task 16 測試損壞還原、備份節奏與 localStorage 失敗；Task 28 測試「把熊貓帶回家」分支；Task 29 測試匯入前自動備份。
- **App 切換或關閉時最後 1 秒的變更遺失：** Task 16 測試 `visibilitychange` 與 `pagehide` 立即寫入；Task 30 E2E 模擬 hidden 後重新載入。
- **版面在 iPhone 瀏海、橫放、dvh 下跑版或水平捲動：** Task 1 測試 viewport meta 與 CSS 規則；Task 19 與 Task 22 的手動驗收在 390×844 檢查。
- **時間被往回調、跨午夜、跨時區造成重複禮物或錯誤睡眠：** Task 8 測試 `applyElapsed` 負值、72 小時上限、`isNewDay` 倒退；Task 9 測試日期倒退不重複發放；Task 10 測試 23:00–06:00 睡覺判定。

## File Structure

- `package.json`：依賴與指令。
- `tsconfig.json`：TypeScript strict 設定。
- `vite.config.ts`：Vite、Preact、PWA 外掛、`base './'`、版本常數注入。
- `index.html`：viewport meta、apple web app meta、`#app`。
- `.gitignore`：排除 node_modules、dist、HEIC 與原始照片。
- `src/test-setup.ts`：載入 fake-indexeddb 與 jest-dom 測試設定。
- `src/styles/global.css`：全域 CSS 變數、版面、觸控規則、橫放提示、減少動態。
- `src/main.tsx`：掛載 App、匯入功能模組、啟動 boot。
- `src/env.d.ts`：`__APP_VERSION__` 宣告。
- `src/version.ts`：匯出 `APP_VERSION`。
- `.github/workflows/deploy.yml`：推送 main 時建置並部署到 GitHub Pages。
- `src/core/rng.ts`：mulberry32、hash、pick、chance。
- `src/core/time.ts`：`localDate`、`applyElapsed`、`isNewDay`、`welcomeBack`。
- `src/core/state.ts`：型別（契約 §3）與 `createInitialState`。
- `src/core/events.ts`：`GameEvent`、`Outcome`、`Reward` 型別（契約 §4）。
- `src/core/rewards.ts`：`applyReward`，處理刻度、升階、項圈欄位事件。
- `src/core/growth.ts`：刻度、階段、稱號、光澤、項圈、能力、身形縮放。
- `src/core/friendLevel.ts`：朋友好感門檻與等級（唯一實作，B 重新匯出；Task 6b）。
- `src/core/daily.ts`：`dailyHandlers`（陣列直接列出 reset 與 diary handler）、`runDaily`、`recordVisit`。
- `src/core/mood.ts`：情緒優先順序。
- `src/core/care.ts`：有效照顧、抱抱上限、餵食、料理、打嗝。
- `src/core/diary.ts`：`makeDiaryEntry`。
- `src/core/save.ts`：序列化、驗證、遷移、存檔碼、封存切分。
- `src/core/surprises.ts`：戳戳、害羞、藏食物、夢話等純判定。
- `src/content/types.ts`：內容型別（契約 §6）。
- `src/content/foods.ts`：4 種基本食物＋謎之料理。
- `src/content/ingredients.ts`：6 種食材。
- `src/content/recipes.ts`：12 道食譜。
- `src/content/titles.ts`：階段名、9 階後稱號詞庫（30×30）。
- `src/content/diary.ts`：日記句庫（至少 60 句）。
- `src/content/dreams.ts`：打嗝夢話泡泡（至少 10 句）。
- `src/content/letters.ts`：歡迎回來信件文字。
- `src/content/items/starter.ts`：初始物品（不含貼紙，契約 10.2）。
- `src/content/items/index.ts`：`ITEMS` 陣列與 `ITEM_BY_ID`（A 建立，C 修改時必須保留 `ITEM_BY_ID`）。
- `src/content/story/types.ts`：對話腳本型別（契約 §7）。
- `src/content/story/prologue.ts`：序章對話。
- `src/content/story/index.ts`：`SCRIPTS` 登記表。
- `src/platform/idb.ts`：IndexedDB 包裝（`panda-db` v1，`backups`／`archive`／`photos`）。
- `src/platform/clock.ts`：`now()`、`randomSeed()`。
- `src/platform/storage.ts`：載入、還原、寫入、備份、封存、flush、唯讀、警示 signals。
- `src/platform/transfer.ts`：匯出檔案、匯入存檔碼（純判定＋檔案產生）、搬家判定、備份提醒判定。
- `src/platform/audio.ts`：Web Audio 合成音效與解鎖。
- `src/platform/particles.ts`：Canvas 粒子與上限。
- `src/platform/pwa.ts`：更新狀態、套用更新、`isStandalone`、`isIOS`。
- `src/platform/pwa-config.ts`：`PWA_OPTIONS`（vite-plugin-pwa 設定）。
- `scripts/render-icons.mjs`：把 `public/icon.svg` 輸出為 180／192／512 PNG。
- `public/icon.svg`：熊貓頭像圖示來源。
- `src/ui/store.ts`：`game`、`commit`、`eventQueue`、`consumeEvents`、`readOnly`、`boot`。
- `src/ui/nav.ts`：`tab`、`overlay`、`goTab`、`openOverlay`、`closeOverlay`。
- `src/ui/screens/registry.ts`：`TAB_SCREENS`、`OVERLAY_SCREENS` 佔位登記。
- `src/ui/App.tsx`：App 殼層、底部 5 分頁導覽、橫放提示、存檔警示條。
- `src/ui/onboarding.ts`：引導步驟純判定。
- `src/ui/screens/Onboarding.tsx`：引導畫面容器。
- `src/ui/components/InstallGuide.tsx`：Chrome 分享 → 加入主畫面 SVG 圖解。
- `src/ui/components/MoveIn.tsx`：貼上存檔碼搬家或開始新遊戲。
- `src/ui/components/Dialogue.tsx`：對話元件。
- `src/ui/components/RewardToast.tsx`：獎勵提示。
- `src/ui/screens/Welcome.tsx`：歡迎回來畫面。
- `src/ui/screens/Home.tsx`：家畫面組裝。
- `src/ui/components/TopBar.tsx`：頂部列（設定、信箱、警示）。
- `src/ui/components/Needs.tsx`：三指標與元氣顯示（signals 精細訂閱）。
- `src/ui/components/RoomView.tsx`：房間唯讀呈現（C 擴充為可編輯）。
- `src/ui/components/Mailbox.tsx`：信箱列表與已讀。
- `src/ui/components/DiaryPanel.tsx`：熊貓日記與貼紙回應。
- `src/ui/components/InstallHint.tsx`：角落安裝提示（可收合、不永久消失）。
- `src/ui/components/UpdateBanner.tsx`：有新版本提示。
- `src/ui/components/care/FeedTray.tsx`：食物拖曳餵食。
- `src/ui/components/care/BathArea.tsx`：洗澡覆蓋率。
- `src/ui/components/care/PlayMenu.tsx`：丟球、竹葉琴、瞪眼比賽。
- `src/ui/components/care/HugButton.tsx`：抱抱。
- `src/ui/components/care/careGeometry.ts`：`isNearMouth`、`bathDone` 純函式。
- `src/ui/screens/Kitchen.tsx`：料理台。
- `src/ui/components/Surprises.tsx`：戳戳與小驚喜呈現。
- `src/ui/screens/Settings.tsx`：設定頁。
- `src/panda/Panda.tsx`：熊貓主元件、`ANCHORS`、`PandaProps`。
- `src/panda/poses.ts`：`POSE_TABLE` 與 `ALL_POSES`。
- `src/panda/parts.tsx`：身體、頭、耳、手腳、尾、眼睛、嘴、臉頰、肩帶等 SVG 部件。
- `src/panda/collar.tsx`：項圈鏈條、`×N`、粗細與亮度等級。
- `src/panda/shine.tsx`：光澤與光環星點。
- `src/panda/layers.tsx`：衣物與墜飾圖層。
- `src/panda/reactions.ts`：食物反應對應熊貓姿勢（`REACTION_POSE`）。
- `src/ui/screens/Kitchen.tsx`：料理台（Home 的本地面板，不是 overlay）。
- `e2e/fixtures.ts`：`seedSave(page, patch)`，在頁面載入前寫入存檔（契約 10.17）。
- `src/art/items/index.tsx`：`ITEM_ART` 登記。
- `src/art/items/starter-art.tsx`：初始物品的 SVG 圖。
- `src/ui/screens/Panda*.test.tsx`、各模組 `*.test.ts(x)`：與原始碼同資料夾的測試。
- `playwright.config.ts`：E2E 專案（mobile／desktop × Chromium／WebKit）。
- `e2e/home-smoke.spec.ts`：家畫面循環 smoke。
- `e2e/persistence.spec.ts`：重新整理後進度保留與 visibilitychange 立即寫入（使用 `seedSave`，不經過引導）。

---

### Task 1: 專案骨架與建置設定

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/test-setup.ts`, `src/styles/global.css`, `src/main.tsx`, `src/env.d.ts`, `src/scaffold.test.ts`
- Modify: 無

**Interfaces:**
- Consumes: 無
- Produces: npm 指令 `dev`、`build`、`test`（`vitest run`）、`typecheck`（`tsc --noEmit`）、`test:e2e`（`playwright test`，Task 30 補設定）；`vite.config.ts` 預設匯出 `defineConfig` 物件（`base: './'`）。

- [ ] **Step 1: 寫失敗測試**

`src/scaffold.test.ts`：
```ts
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import config from '../vite.config';

describe('scaffold', () => {
  it('viewport meta 含 viewport-fit=cover', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
    expect(html).toContain('lang="zh-Hant-TW"');
  });
  it('vite base 為相對路徑', () => {
    expect(config.base).toBe('./');
  });
  it('global.css 有 dvh、觸控與橫放提示規則', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toContain('100dvh');
    expect(css).toContain('-webkit-touch-callout: none');
    expect(css).toContain('(orientation: landscape) and (pointer: coarse)');
    expect(css).toContain('min-height: 44px');
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/scaffold.test.ts`
Expected: FAIL（檔案不存在）。

- [ ] **Step 3: 實作**

1. 若專案尚非 git repo：`git init`。
2. `npm init -y`，然後：`npm i preact @preact/signals fflate`；`npm i -D vite typescript @preact/preset-vite vite-plugin-pwa vitest jsdom @testing-library/preact fake-indexeddb @playwright/test`。
3. `tsconfig.json`：`"strict": true`、`"jsx": "react-jsx"`、`"jsxImportSource": "preact"`、`"types": ["vite/client"]`、`"include": ["src", "e2e", "vite.config.ts", "playwright.config.ts"]`。
4. `vite.config.ts`：`defineConfig({ base: './', plugins: [preact()], define: { __APP_VERSION__: JSON.stringify(gitHash()) }, test: { environment: 'jsdom', setupFiles: ['src/test-setup.ts'] } })`；`gitHash()` 以 `execSync('git rev-parse --short HEAD')` 取值，失敗回傳 `'dev'`。Task 18 再加入 `VitePWA(PWA_OPTIONS)`。
5. `index.html`：`<html lang="zh-Hant-TW">`；head 含 `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`、`<meta name="apple-mobile-web-app-capable" content="yes" />`、`<meta name="apple-mobile-web-app-title" content="熊貓成長記" />`、`<title>熊貓成長記</title>`；body 內 `<div id="app"></div>` 與 `<script type="module" src="/src/main.tsx">`。
6. `src/styles/global.css`：`:root` 定義色彩 token（`--fur: #E9DFCF; --fur-shade: #D6C7AF; --ink: #2A2826; --amber: #B9793A; --chain: #D8B36A; --chain-light: #F3DFA6; --paper: #FBF7F0`）；`html, body { height: 100%; margin: 0; overflow-x: hidden; }`；`body { height: 100dvh; background: var(--paper); -webkit-touch-callout: none; user-select: none; }`；`input, textarea { user-select: text; }`；`#app { max-width: 480px; height: 100dvh; margin: 0 auto; padding: env(safe-area-inset-top) 16px env(safe-area-inset-bottom); box-sizing: border-box; }`；`button { min-width: 44px; min-height: 44px; }`；`.rotate-hint { display: none; }` 與 `@media (orientation: landscape) and (pointer: coarse) { .rotate-hint { display: flex; } #app { display: none; } }`；`@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }`。
7. `src/test-setup.ts`：`import 'fake-indexeddb/auto';`。
8. `src/env.d.ts`：`declare const __APP_VERSION__: string;`。
9. `src/main.tsx`：`render(<div>熊貓成長記</div>, document.getElementById('app')!)`（Task 19 替換）。
10. `.gitignore`：`node_modules`、`dist`、`*.HEIC`、`*.heic`、`IMG_*`。
11. 確認 `src/scaffold.test.ts` 需要 `index.html` 內容字串完全一致（含 `/>` 結尾）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/scaffold.test.ts && npm run typecheck && npm run build`
Expected: 測試 PASS；`dist/index.html` 內資源路徑以 `./assets/` 開頭。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: scaffold Vite Preact TypeScript project

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: GitHub Pages 部署與版本號

**Files:**
- Create: `.github/workflows/deploy.yml`, `src/version.ts`, `src/version.test.ts`
- Modify: `src/env.d.ts`（已於 Task 1 建立，確認存在）

**Interfaces:**
- Consumes: `__APP_VERSION__`（Task 1 的 `vite.config.ts` define）
- Produces: `export const APP_VERSION: string`（短 hash 或 `'dev'`）

- [ ] **Step 1: 寫失敗測試**

`src/version.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { APP_VERSION } from './version';

describe('APP_VERSION', () => {
  it('為 7 位 hex 短 hash 或 dev', () => {
    expect(APP_VERSION).toMatch(/^([0-9a-f]{7,12}|dev)$/);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/version.test.ts`
Expected: FAIL（`./version` 不存在）。

- [ ] **Step 3: 實作**

1. `src/version.ts`：`export const APP_VERSION: string = __APP_VERSION__;`。
2. `.github/workflows/deploy.yml`：觸發 `push` 到 `main` 與 `workflow_dispatch`；權限 `contents: read`、`pages: write`、`id-token: write`；job `build`：checkout、`actions/setup-node@v4`（node 20，cache npm）、`npm ci`、`npm test`、`npm run build`、`actions/upload-pages-artifact@v3`（path `dist`）；job `deploy`（needs build，environment `github-pages`）使用 `actions/deploy-pages@v4`。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/version.test.ts`
Expected: PASS。
手動：推送到 GitHub 後，`https://<user>.github.io/<repo>/` 能開啟；Task 29 完成後設定頁顯示短 hash。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "ci: deploy to GitHub Pages with git short hash version

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 亂數與種子工具（`core/rng.ts`）

**Files:**
- Create: `src/core/rng.ts`, `src/core/rng.test.ts`

**Interfaces:**
- Produces（契約 §5）:
  - `mulberry32(seed: number): () => number`
  - `hash(...parts: (number | string)[]): number`
  - `pick<T>(rand: () => number, arr: readonly T[]): T`
  - `chance(rand: () => number, p: number): boolean`

- [ ] **Step 1: 寫失敗測試**

`src/core/rng.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { mulberry32, hash, pick, chance } from './rng';

describe('rng', () => {
  it('同種子同序列', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
  it('值域在 [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('hash 為 FNV-1a 32 位元，向量正確', () => {
    expect(hash('')).toBe(2166136261);
    expect(hash('a')).toBe(3826002220);
  });
  it('hash 以 | 串接各部件', () => {
    expect(hash('a', 1)).toBe(hash('a|1'));
    expect(hash(1, 2)).not.toBe(hash(12));
  });
  it('pick 與 chance 的邊界', () => {
    expect(pick(() => 0.999, ['a', 'b'])).toBe('b');
    expect(pick(() => 0, ['a', 'b'])).toBe('a');
    expect(chance(() => 0.29, 0.3)).toBe(true);
    expect(chance(() => 0.3, 0.3)).toBe(false);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/rng.test.ts`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作**

`src/core/rng.ts`：`mulberry32` 採標準 mulberry32 演算法（`>>> 0` 與 `Math.imul`）；`hash` 以 `parts.map(String).join('|')` 做 FNV-1a 32（offset `2166136261`、prime `16777619`，每步 `Math.imul` 後 `>>> 0`）；`pick` 回傳 `arr[Math.floor(rand() * arr.length)]`；`chance` 回傳 `rand() < p`。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/rng.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/rng.ts src/core/rng.test.ts
git commit -m "feat(core): add seeded rng and hash utilities

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 遊戲狀態型別與初始狀態（`core/state.ts`、`core/events.ts`、`core/time.ts` 之 `localDate`）

**Files:**
- Create: `src/core/state.ts`, `src/core/state.test.ts`, `src/core/events.ts`, `src/core/time.ts`, `src/core/time.test.ts`

**Interfaces:**
- Consumes: `hash`（Task 3）
- Produces:
  - `state.ts`：契約 §3 的全部型別與常數 verbatim；`createInitialState(seed: number, now: number): GameState`。
  - `events.ts`：契約 §4 的 `GameEvent`、`Outcome`、`Reward`。
  - `time.ts`：`localDate(now: number): string`（其餘函式在 Task 8 補上）。

- [ ] **Step 1: 寫失敗測試**

`src/core/state.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { createInitialState, SCHEMA_VERSION } from './state';
import { localDate } from './time';
import { hash } from './rng';

describe('createInitialState（規格 3.4）', () => {
  const s = createInitialState(123, 1000);
  it('指標與數值', () => {
    expect(s.needs).toEqual({ tummy: 70, clean: 70, mood: 70 });
    expect(s.energy).toBe(100);
    expect(s.starSand).toBe(100);
    expect(s.marshmallow).toBe(0);
    expect(s.growthXp).toBe(0);
    expect(s.chainLinks).toBe(0);
    expect(s.freeBoxes).toBe(0);
  });
  it('裝備與背包', () => {
    expect(s.equipped.pendants).toEqual(['pendant-bamboo']);
    expect(s.inventory['pendant-bamboo']).toBe(1);
    expect(s.inventory['food-bamboo-cake']).toBe(3);
    expect(s.inventory['food-strawberry-mochi']).toBe(2);
    expect(s.presets.every(p => p.pendants.length === 0)).toBe(true);
  });
  it('客廳預設擺設在格內', () => {
    const living = s.rooms.living;
    expect(living.wall).toBe('wall-default');
    expect(living.floor).toBe('floor-default');
    expect(living.placed.map(p => p.itemId).sort()).toEqual(['furn-cushion', 'furn-low-table', 'furn-nest']);
    for (const p of living.placed) {
      expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(7);
      expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(5);
    }
    expect(s.rooms.bedroom.placed).toEqual([]);
  });
  it('地圖只有竹林小徑', () => {
    expect(s.map.nodes).toHaveLength(1);
    expect(s.map.nodes[0].snapshot).toEqual({ kind: 'handmade', handmadeId: 'bamboo-path' });
    expect(s.map.nodes[0].seed).toBe(hash(123, 1));
    expect(s.map.nextId).toBe(2);
  });
  it('版本、種子、日期與設定', () => {
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.seed).toBe(123);
    expect(s.createdAt).toBe(1000);
    expect(s.lastDailyDate).toBe(localDate(1000));
    expect(s.settings).toEqual({ sound: true, lastExportAt: null, installHintCollapsed: false });
    expect(s.onboardingDone).toBe(false);
    expect(s.awakeUntil).toBeNull();
  });
});
```

`src/core/time.test.ts`（本任務只測 `localDate`）：
```ts
import { describe, it, expect } from 'vitest';
import { localDate } from './time';

describe('localDate', () => {
  it('回傳當地 YYYY-MM-DD', () => {
    expect(localDate(new Date(2026, 9, 18, 0, 30).getTime())).toBe('2026-10-18');
    expect(localDate(new Date(2026, 0, 3, 23, 59).getTime())).toBe('2026-01-03');
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/state.test.ts src/core/time.test.ts`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作**

1. `src/core/events.ts`：契約 §4 verbatim。
2. `src/core/time.ts`：`export function localDate(now: number): string`，以 `new Date(now)` 的 `getFullYear/getMonth/getDate` 組出補零字串。
3. `src/core/state.ts`：契約 §3 型別 verbatim（含 `export const SCHEMA_VERSION = 1`）；`createInitialState`：
   - `needs` 三項 70、`energy` 100、`starSand` 100、`marshmallow` 0、`growthXp` 0、`chainLinks` 0、`freeBoxes` 0、`createdAt` 與 `lastSeenAt` 為 `now`、`lastDailyDate: localDate(now)`、`onboardingDone: false`、`awakeUntil: null`、`hugLog/feedLog/pokeLog` 為空陣列。
   - `inventory`：`food-bamboo-cake: 3`、`food-strawberry-mochi: 2`、`wall-default: 1`、`floor-default: 1`、`furn-nest: 1`、`furn-low-table: 1`、`furn-cushion: 1`、`pendant-bamboo: 1`。
   - `equipped: { outfit: {}, pendants: ['pendant-bamboo'] }`；`presets` 三組皆 `{ outfit: {}, pendants: [] }`。
   - `rooms.living`：`wall: 'wall-default'`、`floor: 'floor-default'`、`placed` 為 `furn-nest`（x1 y4）、`furn-low-table`（x4 y2）、`furn-cushion`（x2 y2），`layer: 'floor'`、`flipped: false`、`uid` 為 `${itemId}#1`。`rooms.bedroom`：`wall: 'wall-default'`、`floor: 'floor-default'`、`placed: []`。
   - `map: { nodes: [{ id: 1, parentId: null, seed: hash(seed, 1), status: 'open', secretFound: false, snapshot: { kind: 'handmade', handmadeId: 'bamboo-path' }, progress: null, lastCompletedDate: null }], nextId: 2 }`。
   - `completedCount: 0`、`storyBeats: []`、`pendingBeat: null`、`friends` 四位皆 `{ points: 0, chatsToday: 0 }`、`recipes: []`、`diary: []`、`letters: []`、`daily: { revisitXpCount: 0, freeBoxUsed: false, visitor: null, visitorDone: false }`、`milestonesClaimed: {}`、`settings: { sound: true, lastExportAt: null, installHintCollapsed: false }`、`lastVisitedSummary: { locations: [], foods: [] }`。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/state.test.ts src/core/time.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/state.ts src/core/state.test.ts src/core/events.ts src/core/time.ts src/core/time.test.ts
git commit -m "feat(core): add game state types and initial state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 內容資料與型別（`content/`）

**Files:**
- Create: `src/content/types.ts`, `src/content/foods.ts`, `src/content/ingredients.ts`, `src/content/recipes.ts`, `src/content/titles.ts`, `src/content/letters.ts`, `src/content/items/starter.ts`, `src/content/items/index.ts`, `src/content/content.test.ts`

**Interfaces:**
- Consumes: `Rarity`、`OutfitSlot`、`Terrain`（Task 4 的 `state.ts`）
- Produces:
  - `types.ts`：契約 §6 verbatim，另加 `export const CATEGORY_PREFIX: Record<ItemCategory, string>`（furniture `furn-`、wall `wall-`、floor `floor-`、outfit `outfit-`、pendant `pendant-`、food `food-`、ingredient `ing-`、sticker `sticker-`、frame `frame-`）。
  - `foods.ts`：`FOODS: FoodDef[]`（5 筆）、`FOOD_MYSTERY_ID = 'food-mystery'`、`FOOD_IDS: string[]`（4 種基本食物，不含謎之料理；契約 10.1）。
  - `ingredients.ts`：`INGREDIENTS: ItemDef[]`（6 筆，`category: 'ingredient'`，`inGiftPool: true`；4 種 `common`、2 種 `shiny`）、`INGREDIENT_IDS: string[]`（契約 10.1，B 直接 import）。
  - `recipes.ts`：`RECIPES: RecipeDef[]`（12 筆）。
  - `titles.ts`：`STAGE_NAMES: string[]`（8 筆）、`TITLE_ADJECTIVES: string[]`（30）、`TITLE_NOUNS: string[]`（30）。
  - `letters.ts`：`WELCOME_LETTER_TEXT: string`。
  - `items/starter.ts`：`STARTER_ITEMS: ItemDef[]`（不含任何貼紙；契約 10.2）。
  - `items/index.ts`：`ITEMS: ItemDef[]`（= `[...STARTER_ITEMS, ...INGREDIENTS]`，C 之後補入其餘）、`ITEM_BY_ID: Record<string, ItemDef>`（契約 10.2，此檔由 A 建立，C 只能修改並保留）。

- [ ] **Step 1: 寫失敗測試**

`src/content/content.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { FOODS, FOOD_IDS, FOOD_MYSTERY_ID } from './foods';
import { INGREDIENTS, INGREDIENT_IDS } from './ingredients';
import { RECIPES } from './recipes';
import { STAGE_NAMES, TITLE_ADJECTIVES, TITLE_NOUNS } from './titles';
import { ITEMS, ITEM_BY_ID } from './items';
import { CATEGORY_PREFIX } from './types';

describe('內容資料完整性', () => {
  it('數量', () => {
    expect(FOODS).toHaveLength(5);
    expect(INGREDIENTS).toHaveLength(6);
    expect(RECIPES).toHaveLength(12);
    expect(STAGE_NAMES).toHaveLength(8);
    expect(TITLE_ADJECTIVES).toHaveLength(30);
    expect(TITLE_NOUNS).toHaveLength(30);
  });
  it('食物包含謎之料理且 id 正確', () => {
    expect(FOODS.map(f => f.id)).toContain(FOOD_MYSTERY_ID);
    expect(FOOD_MYSTERY_ID).toBe('food-mystery');
  });
  it('食譜食材存在、兩格不同、配對不重複', () => {
    const ingIds = new Set(INGREDIENTS.map(i => i.id));
    const keys = new Set<string>();
    for (const r of RECIPES) {
      expect(ingIds.has(r.inputs[0])).toBe(true);
      expect(ingIds.has(r.inputs[1])).toBe(true);
      expect(r.inputs[0]).not.toBe(r.inputs[1]);
      expect(r.id.startsWith('recipe-')).toBe(true);
      keys.add([...r.inputs].sort().join('+'));
    }
    expect(keys.size).toBe(12);
  });
  it('物品 id 唯一且前綴符合類別', () => {
    const ids = ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const it of ITEMS) expect(it.id.startsWith(CATEGORY_PREFIX[it.category])).toBe(true);
    for (const id of ['wall-default', 'floor-default', 'furn-nest', 'furn-low-table', 'furn-cushion', 'pendant-bamboo']) {
      expect(ITEM_BY_ID[id]).toBeDefined();
    }
  });
  it('FOOD_IDS 為 4 種基本食物且不含謎之料理，星空蘋果 id 正確', () => {
    expect(FOOD_IDS).toEqual(['food-bamboo-cake', 'food-strawberry-mochi', 'food-sour-plum', 'food-starry-apple']);
    expect(FOOD_IDS).not.toContain(FOOD_MYSTERY_ID);
  });
  it('INGREDIENT_IDS 為 6 種，稀有度 4 common、2 shiny', () => {
    expect(INGREDIENT_IDS).toHaveLength(6);
    expect(INGREDIENTS.filter(i => i.rarity === 'common')).toHaveLength(4);
    expect(INGREDIENTS.filter(i => i.rarity === 'shiny').map(i => i.id).sort()).toEqual(['ing-honey', 'ing-mushroom']);
  });
  it('初始物品的禮盒池旗標：家具為 true，牆紙、地板、墜飾為 false，且 A 沒有貼紙', () => {
    const pool = (id: string) => ITEM_BY_ID[id].inGiftPool;
    expect(['furn-nest', 'furn-low-table', 'furn-cushion'].map(pool)).toEqual([true, true, true]);
    expect(['wall-default', 'floor-default', 'pendant-bamboo'].map(pool)).toEqual([false, false, false]);
    expect(ITEMS.filter(i => i.category === 'sticker')).toHaveLength(0);
  });
  it('詞庫不重複', () => {
    expect(new Set(TITLE_ADJECTIVES).size).toBe(30);
    expect(new Set(TITLE_NOUNS).size).toBe(30);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/content/content.test.ts`
Expected: FAIL（檔案不存在）。

- [ ] **Step 3: 實作（內容要求）**

- `types.ts`：契約 §6 verbatim，`PendantEffect`、`ItemDef`、`FoodDef`、`RecipeDef`。
- `foods.ts`（reaction 對應規格 5.2）：
  - `food-bamboo-cake` 竹筍糕，`patBelly`
  - `food-strawberry-mochi` 草莓麻糬，`blush`
  - `food-sour-plum` 酸梅，`sour`
  - `food-starry-apple` 星空蘋果，`starEyes`
  - `food-mystery` 謎之料理，`mystery`
  - `FOOD_IDS = ['food-bamboo-cake', 'food-strawberry-mochi', 'food-sour-plum', 'food-starry-apple']`（不含謎之料理）；星空蘋果 id 固定為 `food-starry-apple`（契約 10.1）。
- `ingredients.ts`（6 筆，`ItemDef`，`category: 'ingredient'`，`inGiftPool: true`，`hint` 寫「禮盒或冒險可能找到」；稀有度：`ing-honey`、`ing-mushroom` 為 `shiny`，其餘 4 種為 `common`；匯出 `INGREDIENT_IDS`）：`ing-bamboo-shoot` 竹筍、`ing-strawberry` 草莓、`ing-rice-flour` 米粉、`ing-red-bean` 紅豆、`ing-honey` 蜂蜜、`ing-mushroom` 蘑菇。
- `recipes.ts`（12 筆，`inputs` 為下列配對，名稱與 id 依序）：
  1. `recipe-bamboo-mochi` 竹筍麻糬 ← `[ing-bamboo-shoot, ing-rice-flour]`，`yum`
  2. `recipe-strawberry-daifuku` 草莓大福 ← `[ing-strawberry, ing-rice-flour]`，`blush`
  3. `recipe-red-bean-dumpling` 紅豆湯圓 ← `[ing-red-bean, ing-rice-flour]`，`yum`
  4. `recipe-honey-bean` 蜜豆 ← `[ing-red-bean, ing-honey]`，`yum`
  5. `recipe-honey-berry` 蜜草莓 ← `[ing-strawberry, ing-honey]`，`starEyes`
  6. `recipe-mushroom-soup` 蘑菇湯 ← `[ing-mushroom, ing-bamboo-shoot]`，`patBelly`
  7. `recipe-mushroom-rice` 蘑菇炊飯 ← `[ing-mushroom, ing-rice-flour]`，`patBelly`
  8. `recipe-honey-bamboo` 蜜竹筍 ← `[ing-bamboo-shoot, ing-honey]`，`yum`
  9. `recipe-berry-bean-ice` 草莓紅豆冰 ← `[ing-strawberry, ing-red-bean]`，`starEyes`
  10. `recipe-honey-mushroom` 蜜蘑菇 ← `[ing-mushroom, ing-honey]`，`yum`
  11. `recipe-strawberry-salad` 草莓蘑菇沙拉 ← `[ing-strawberry, ing-mushroom]`，`sour`
  12. `recipe-bamboo-red-bean-porridge` 竹筍紅豆粥 ← `[ing-bamboo-shoot, ing-red-bean]`，`patBelly`
- `titles.ts`：`STAGE_NAMES = ['奶熊貓','圓滾滾','小探險家','竹林勇者','雲端旅人','星光熊貓','月影守護者','傳說熊貓']`；`TITLE_ADJECTIVES` 30 個（例：午睡、彩虹、打呵欠的、會唱歌的）；`TITLE_NOUNS` 30 個（例：冠軍、收藏家、偵探、廚師）。組合為 `形容詞 + 名詞 + 熊貓`，例：「午睡冠軍熊貓」、「彩虹收藏家熊貓」。
- `letters.ts`：`WELCOME_LETTER_TEXT` 為棉花（郵差兔子）寫的一封短信，3–5 句，口吻輕鬆有梗，提到「我幫你把信留在信箱裡，不急著看」。
- `items/starter.ts`（全部 `rarity: 'common'`；`inGiftPool`：`furn-nest`、`furn-low-table`、`furn-cushion` 為 `true`，`wall-default`、`floor-default`、`pendant-bamboo` 為 `false`，契約 10.2、10.4）：
  - `wall-default` 竹青色牆紙（wall）
  - `floor-default` 木紋地板（floor）
  - `furn-nest` 小窩（furniture，`size: {w:2,h:2}`）
  - `furn-low-table` 矮桌（furniture，`size: {w:2,h:1}`）
  - `furn-cushion` 竹編坐墊（furniture，`size: {w:1,h:1}`）
  - `pendant-bamboo` 竹葉墜飾（pendant，`pendant: {kind:'terrainStarSand', terrain:'bamboo', pct:20}`，`sound: 'bell-soft'`）
  - 不建立任何貼紙：貼紙一律由計畫 C 提供（`sticker-01`…`sticker-24`），A 不寫任何 `sticker-*`（契約 10.2）。
- `items/index.ts`：`ITEMS = [...STARTER_ITEMS, ...INGREDIENTS]`；`ITEM_BY_ID: Record<string, ItemDef>`。C 修改此檔時必須保留 `ITEM_BY_ID`，並直接沿用 `INGREDIENTS` 的 ItemDef，不另外衍生食材定義（避免重複，契約 10.2）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/content/content.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/content
git commit -m "feat(content): add foods, ingredients, recipes, titles and starter items

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 成長數學（`core/growth.ts`）

**Files:**
- Create: `src/core/growth.ts`, `src/core/growth.test.ts`

**Interfaces:**
- Consumes: `GameState`（Task 4）、`hash`（Task 3）、`STAGE_NAMES`、`TITLE_ADJECTIVES`、`TITLE_NOUNS`（Task 5）
- Produces（契約 §5 verbatim）：`markCost(n: number): number`；`marksForXp(xp: number): number`；`stageForMarks(marks: number): number`；`stageTitle(seed: number, stage: number): string`；`shineTier(stage: number): number`；`pendantSlots(chainLinks: number): number`；`abilitiesForStage(stage: number): Ability[]`；`currentStage(s: GameState): number`。
- 額外匯出（新增，不改契約）：`scaleForStage(stage: number): number`；`chainThickness(chainLinks: number): number`。

- [ ] **Step 1: 寫失敗測試**

`src/core/growth.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import * as G from './growth';

describe('刻度（規格 4.2）', () => {
  it('單格成本', () => {
    expect(G.markCost(1)).toBe(35);
    expect(G.markCost(2)).toBe(45);
    expect(G.markCost(5)).toBe(75);
    expect(G.markCost(10)).toBe(125);
    expect(G.markCost(15)).toBe(175);
    expect(G.markCost(20)).toBe(225);
  });
  it('累積成長值換算刻度', () => {
    expect(G.marksForXp(0)).toBe(0);
    expect(G.marksForXp(34)).toBe(0);
    expect(G.marksForXp(35)).toBe(1);
    expect(G.marksForXp(79)).toBe(1);
    expect(G.marksForXp(80)).toBe(2);
    expect(G.marksForXp(274)).toBe(4);
    expect(G.marksForXp(275)).toBe(5);
    expect(G.marksForXp(799)).toBe(9);
    expect(G.marksForXp(800)).toBe(10);
    expect(G.marksForXp(1575)).toBe(15);
    expect(G.marksForXp(2600)).toBe(20);
  });
});

describe('階段與稱號', () => {
  it('階段 = floor(刻度/5)+1', () => {
    expect(G.stageForMarks(0)).toBe(1);
    expect(G.stageForMarks(4)).toBe(1);
    expect(G.stageForMarks(5)).toBe(2);
    expect(G.stageForMarks(10)).toBe(3);
    expect(G.stageForMarks(20)).toBe(5);
  });
  it('1–8 階固定名稱', () => {
    expect(G.stageTitle(1, 1)).toBe('奶熊貓');
    expect(G.stageTitle(999, 8)).toBe('傳說熊貓');
  });
  it('9 階起組合稱號，同種子同階確定', () => {
    const t = G.stageTitle(555, 9);
    expect(t.endsWith('熊貓')).toBe(true);
    expect(G.stageTitle(555, 9)).toBe(t);
    const titles = new Set<string>();
    for (let st = 9; st < 109; st++) titles.add(G.stageTitle(555, st));
    expect(titles.size).toBeGreaterThan(50);
  });
});

describe('身形、光澤、項圈、能力', () => {
  it('身形縮放 0.80/0.90/1.00/1.05 後固定', () => {
    expect([1, 2, 3, 4, 5, 9].map(G.scaleForStage)).toEqual([0.8, 0.9, 1.0, 1.05, 1.05, 1.05]);
  });
  it('光澤層級 floor(階段/5)', () => {
    expect(G.shineTier(4)).toBe(0);
    expect(G.shineTier(5)).toBe(1);
    expect(G.shineTier(9)).toBe(1);
    expect(G.shineTier(10)).toBe(2);
    expect(G.shineTier(20)).toBe(4);
  });
  it('墜飾欄位：起始 2，每 50 環 +1', () => {
    expect(G.pendantSlots(0)).toBe(2);
    expect(G.pendantSlots(49)).toBe(2);
    expect(G.pendantSlots(50)).toBe(3);
    expect(G.pendantSlots(100)).toBe(4);
  });
  it('鏈條粗細等級每 100 環 +1，最多 5', () => {
    expect(G.chainThickness(0)).toBe(0);
    expect(G.chainThickness(99)).toBe(0);
    expect(G.chainThickness(100)).toBe(1);
    expect(G.chainThickness(500)).toBe(5);
    expect(G.chainThickness(5000)).toBe(5);
  });
  it('能力只來自已實作能力', () => {
    expect(G.abilitiesForStage(1)).toEqual([]);
    expect(G.abilitiesForStage(2)).toEqual([]);
    expect(G.abilitiesForStage(3)).toEqual(['climb']);
    expect(G.abilitiesForStage(4)).toEqual(['climb', 'dive']);
    expect(G.abilitiesForStage(8)).toEqual(['climb', 'dive']);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/growth.test.ts`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作**

- `markCost(n) = 25 + 10 * n`。
- `marksForXp(xp)`：從 `n = 0` 起迴圈，累積 `cumulative(n) = 25n + 5n(n+1)`（即前 n 格加總），回傳最大的 n 使 `cumulative(n) <= xp`。
- `stageForMarks(m) = Math.floor(m / 5) + 1`。
- `stageTitle(seed, stage)`：`stage <= 8` 回傳 `STAGE_NAMES[stage - 1]`；否則 `h = hash(seed, stage)`，`adj = TITLE_ADJECTIVES[h % 30]`，`noun = TITLE_NOUNS[hash(seed, stage, 'noun') % 30]`，回傳 `${adj}${noun}熊貓`。
- `shineTier(stage) = Math.floor(stage / 5)`。
- `pendantSlots(links) = 2 + Math.floor(links / 50)`。
- `chainThickness(links) = Math.min(5, Math.floor(links / 100))`。
- `abilitiesForStage(stage)`：`stage >= 4 ? ['climb','dive'] : stage >= 3 ? ['climb'] : []`。
- `scaleForStage(stage) = [0.8, 0.9, 1.0, 1.05][Math.min(stage, 4) - 1]`。
- `currentStage(s) = stageForMarks(marksForXp(s.growthXp))`。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/growth.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/growth.ts src/core/growth.test.ts
git commit -m "feat(core): add growth marks, stages, titles and collar math

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6b: 朋友好感等級（`core/friendLevel.ts`）

**Files:**
- Create: `src/core/friendLevel.ts`, `src/core/friendLevel.test.ts`

**Interfaces:**
- Consumes: 無
- Produces（契約 §5、§10.3、§10.4，唯一實作）：
  - `friendLevelThreshold(level: number): number`＝`10 × (level − 1) × level`（第 1 級起點 0；第 n 級單級成本 `20n`）
  - `levelOf(points: number): number`：滿足門檻的最大等級，最小為 1
- 注意：`core/friends.ts`（計畫 B）只從此檔重新匯出 `levelOf`，不得另行實作（修正交叉審查第 3 項：C 與 B 的公式不同）。

- [ ] **Step 1: 寫失敗測試**

`src/core/friendLevel.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { friendLevelThreshold, levelOf } from './friendLevel';

describe('朋友好感門檻（契約 5、10.4）', () => {
  it('門檻為 10 × (level − 1) × level', () => {
    expect([1, 2, 3, 4, 5].map(friendLevelThreshold)).toEqual([0, 20, 60, 120, 200]);
  });
  it('每升一級的單級成本為 20n', () => {
    expect(friendLevelThreshold(3) - friendLevelThreshold(2)).toBe(40);
    expect(friendLevelThreshold(2) - friendLevelThreshold(1)).toBe(20);
  });
  it('levelOf 的邊界值', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(19)).toBe(1);
    expect(levelOf(20)).toBe(2);
    expect(levelOf(59)).toBe(2);
    expect(levelOf(60)).toBe(3);
    expect(levelOf(120)).toBe(4);
  });
  it('負值與極小值回傳 1', () => {
    expect(levelOf(-5)).toBe(1);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/friendLevel.test.ts`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作**

- `friendLevelThreshold(level) = 10 * (level - 1) * level`。
- `levelOf(points)`：`let L = 1; while (friendLevelThreshold(L + 1) <= points) L++; return L;`（`points` 為負時迴圈不進入，回傳 1）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/friendLevel.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/friendLevel.ts src/core/friendLevel.test.ts
git commit -m "feat(core): add friend affinity level thresholds

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 獎勵套用（`core/rewards.ts`）

**Files:**
- Create: `src/core/rewards.ts`, `src/core/rewards.test.ts`

**Interfaces:**
- Consumes: `GameState`（Task 4）、`Outcome`、`Reward`、`GameEvent`（Task 4）、`marksForXp`、`stageForMarks`、`stageTitle`、`pendantSlots`（Task 6）
- Produces（契約 §5）：`applyReward(s: GameState, r: Reward): Outcome`

- [ ] **Step 1: 寫失敗測試**

`src/core/rewards.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { applyReward } from './rewards';

const base = () => createInitialState(9, 0);

describe('applyReward', () => {
  it('成長值進刻度時送 markUp 事件', () => {
    const { state, events } = applyReward(base(), { xp: 35 });
    expect(state.growthXp).toBe(35);
    expect(events).toContainEqual({ type: 'markUp', mark: 1 });
    expect(events.some(e => e.type === 'reward')).toBe(true);
  });
  it('升階送一個免費禮盒並發出 stageUp', () => {
    const s = { ...base(), growthXp: 240 };
    const { state, events } = applyReward(s, { xp: 35 });
    expect(state.freeBoxes).toBe(1);
    expect(events).toContainEqual({ type: 'stageUp', stage: 2, title: '圓滾滾' });
  });
  it('項圈達到欄位門檻發出 slotUnlocked', () => {
    const s = { ...base(), chainLinks: 49 };
    const { state, events } = applyReward(s, { chain: 1 });
    expect(state.chainLinks).toBe(50);
    expect(events).toContainEqual({ type: 'slotUnlocked', slots: 3 });
  });
  it('元氣限制在 0–100，星砂與物品累加', () => {
    const s = { ...base(), energy: 90 };
    const { state } = applyReward(s, { energy: 50, starSand: 7, items: { 'ing-honey': 2 }, marshmallow: 3 });
    expect(state.energy).toBe(100);
    expect(state.starSand).toBe(107);
    expect(state.inventory['ing-honey']).toBe(2);
    expect(state.marshmallow).toBe(3);
    const low = applyReward({ ...base(), energy: 10 }, { energy: -25 }).state;
    expect(low.energy).toBe(0);
  });
  it('沒有任何獎勵時不改動狀態', () => {
    const s = base();
    expect(applyReward(s, {}).state).toEqual(s);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/rewards.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

`applyReward(s, r)`：
1. 複製 `s`；`growthXp += r.xp ?? 0`。舊刻度 `oldMarks = marksForXp(s.growthXp)`、新刻度 `newMarks`；若新 > 舊，推入 `{type:'markUp', mark:newMarks}`。
2. 舊階段 `stageForMarks(oldMarks)`、新階段；若新 > 舊：`freeBoxes += (新 - 舊)`，推入 `{type:'stageUp', stage:新階段, title: stageTitle(s.seed, 新階段)}`。
3. `starSand += r.starSand ?? 0`；`energy = clamp(energy + (r.energy ?? 0), 0, 100)`；`marshmallow += r.marshmallow ?? 0`；每個 `r.items` 項目加入 `inventory`。
4. 項圈：`oldSlots = pendantSlots(chainLinks)`，`chainLinks += r.chain ?? 0`，若 `pendantSlots(新) > oldSlots` 推入 `{type:'slotUnlocked', slots: 新欄位數}`。
5. 最後無論是否有值，都推入一個 `{type:'reward', xp, starSand, energy, chain, items}`（缺值補 0 與 `{}`）。
6. 注意：`{}` 的 applyReward 仍會推入 reward 事件；測試「沒有任何獎勵時不改動狀態」比較的是 `state`，不含 events。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/rewards.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/rewards.ts src/core/rewards.test.ts
git commit -m "feat(core): apply rewards with mark, stage and collar events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 離線時間、每日判定與歡迎回來（`core/time.ts`）

**Files:**
- Modify: `src/core/time.ts`
- Create: `src/core/time.elapsed.test.ts`

**Interfaces:**
- Consumes: `GameState`、`applyReward`（Task 7）、`WELCOME_LETTER_TEXT`（Task 5）、`hash`（Task 3）
- Produces（契約 §5）：`applyElapsed(s: GameState, now: number): GameState`；`isNewDay(s: GameState, now: number): boolean`。
- 額外匯出：`offlineMs(s: GameState, now: number): number`（負值為 0）；`welcomeBack(s: GameState, now: number): Outcome | null`（超過 24 小時才回傳，信件 `from: 'mianhua'`，送 30 星砂）。
- 注意：`welcomeBack` 必須在 `applyElapsed` 之前呼叫（需要舊的 `lastSeenAt`）。

- [ ] **Step 1: 寫失敗測試**

`src/core/time.elapsed.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { applyElapsed, isNewDay, welcomeBack, offlineMs } from './time';

const H = 3600_000;
const at = (over: Partial<ReturnType<typeof createInitialState>>) => ({ ...createInitialState(1, 0), ...over });

describe('applyElapsed（規格 5.1）', () => {
  it('10 小時後肚子 −40、香香 −30、心情 −50，但下限 30', () => {
    const s = applyElapsed(at({ lastSeenAt: 0 }), 10 * H);
    expect(s.needs).toEqual({ tummy: 30, clean: 40, mood: 30 });
  });
  it('每小時元氣 +10，上限 100', () => {
    expect(applyElapsed(at({ lastSeenAt: 0, energy: 50 }), 2 * H).energy).toBe(70);
    expect(applyElapsed(at({ lastSeenAt: 0, energy: 95 }), 10 * H).energy).toBe(100);
  });
  it('離線時間上限 72 小時', () => {
    const a = applyElapsed(at({ lastSeenAt: 0 }), 72 * H);
    const b = applyElapsed(at({ lastSeenAt: 0 }), 100 * H);
    expect(b).toEqual({ ...a, lastSeenAt: 100 * H });
  });
  it('時間被往回調視為 0，不扣不加', () => {
    const s = applyElapsed(at({ lastSeenAt: 5 * H, needs: { tummy: 60, clean: 60, mood: 60 } }), 1 * H);
    expect(s.needs).toEqual({ tummy: 60, clean: 60, mood: 60 });
    expect(s.lastSeenAt).toBe(1 * H);
  });
  it('已低於下限的指標不會被拉回上升', () => {
    const s = applyElapsed(at({ lastSeenAt: 0, needs: { tummy: 20, clean: 70, mood: 70 } }), 1 * H);
    expect(s.needs.tummy).toBe(20);
  });
});

describe('isNewDay 與 offlineMs', () => {
  it('只有日期大於 lastDailyDate 才是新的一天', () => {
    const today = new Date(2026, 9, 18, 9).getTime();
    expect(isNewDay(at({ lastDailyDate: '2026-10-17' }), today)).toBe(true);
    expect(isNewDay(at({ lastDailyDate: '2026-10-18' }), today)).toBe(false);
    expect(isNewDay(at({ lastDailyDate: '2026-10-19' }), today)).toBe(false);
  });
  it('offlineMs 負值為 0', () => {
    expect(offlineMs(at({ lastSeenAt: 10 }), 5)).toBe(0);
    expect(offlineMs(at({ lastSeenAt: 0 }), 3 * H)).toBe(3 * H);
  });
});

describe('welcomeBack', () => {
  it('不到 24 小時回傳 null', () => {
    expect(welcomeBack(at({ lastSeenAt: 0 }), 23 * H)).toBeNull();
  });
  it('超過 24 小時送 30 星砂與一封信', () => {
    const s = at({ lastSeenAt: 0, starSand: 100 });
    const out = welcomeBack(s, 25 * H)!;
    expect(out.state.starSand).toBe(130);
    expect(out.state.letters).toHaveLength(1);
    expect(out.state.letters[0].from).toBe('mianhua');
    expect(out.state.letters[0].read).toBe(false);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/time.elapsed.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `offlineMs = Math.max(0, now - s.lastSeenAt)`。
- `applyElapsed`：`hours = Math.min(offlineMs / H, 72)`；對 `tummy/clean/mood`，`rate = 4/3/5`，若 `cur > 30` 則 `next = Math.max(30, cur - rate * hours)`，否則維持 `cur`；`energy = Math.min(100, energy + 10 * hours)`；回傳 `lastSeenAt: now`。注意 `now < lastSeenAt` 時 `hours` 為 0，仍更新 `lastSeenAt = now`。
- `isNewDay(s, now) = localDate(now) > s.lastDailyDate`（字串比較）。
- `welcomeBack`：若 `offlineMs(s, now) <= 24 * H` 回傳 `null`；否則 `applyReward(s, { starSand: 30 })` 後把 `Letter` 插入 `letters` 開頭（新到舊；歡迎回來信件只由此函式產生，契約 10.5，`content/letters.ts` 屬於計畫 A）：`{ id: \`welcome-${now}\`, date: localDate(now), from: 'mianhua', text: WELCOME_LETTER_TEXT, read: false }`，回傳 `Outcome`（事件保留 `applyReward` 的結果）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/time.elapsed.test.ts src/core/time.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/time.ts src/core/time.elapsed.test.ts
git commit -m "feat(core): add offline decay, new-day check and welcome-back gift

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 每日結算骨架（`core/daily.ts`）

**Files:**
- Create: `src/core/daily.ts`, `src/core/daily.test.ts`

**Interfaces:**
- Consumes: `GameState`、`localDate`（Task 4）、`isNewDay`（Task 8）
- Produces（契約 §5）：`type DailyHandler = (s: GameState, today: string, now: number) => GameState`；`export const dailyHandlers: DailyHandler[]`；`runDaily(s: GameState, now: number): GameState`。
- 額外匯出：`recordVisit(s: GameState, kind: 'locations' | 'foods', name: string): GameState`（A 的 feed／cook 與 B 的 location `complete` 呼叫，去重後加入 `lastVisitedSummary`；契約 10.10）。
- 語意決策：`lastVisitedSummary` 在一天之內累積；`runDaily` 先依序執行 `dailyHandlers`（此時 summary 仍是「前一天」的內容，供日記引用），最後才清空 summary。

- [ ] **Step 1: 寫失敗測試**

`src/core/daily.test.ts`：
```ts
import { describe, it, expect, afterEach } from 'vitest';
import { createInitialState } from './state';
import { runDaily, dailyHandlers, recordVisit } from './daily';

const day = (d: number) => new Date(2026, 9, d, 12).getTime();
const fresh = () => ({ ...createInitialState(1, day(17)), lastDailyDate: '2026-10-17' });
const added: unknown[] = [];
const builtin = [...dailyHandlers];
afterEach(() => { dailyHandlers.splice(0, dailyHandlers.length, ...builtin); added.length = 0; });

describe('runDaily', () => {
  it('內建日記 handler 在跨日時新增一篇', () => {
    expect(runDaily(fresh(), day(18)).diary).toHaveLength(1);
  });
  it('同一天不執行，狀態不變', () => {
    const s = { ...fresh(), lastDailyDate: '2026-10-18' };
    expect(runDaily(s, day(18))).toEqual(s);
  });
  it('跨日時重設每日計數並更新 lastDailyDate', () => {
    const s = { ...fresh(), daily: { revisitXpCount: 3, freeBoxUsed: true, visitor: 'juzi' as const, visitorDone: true } };
    const out = runDaily(s, day(18));
    expect(out.lastDailyDate).toBe('2026-10-18');
    expect(out.daily).toEqual({ revisitXpCount: 0, freeBoxUsed: false, visitor: null, visitorDone: false });
  });
  it('日期倒退不執行、不重複發放', () => {
    const s = { ...fresh(), lastDailyDate: '2026-10-18', daily: { revisitXpCount: 3, freeBoxUsed: true, visitor: null, visitorDone: false } };
    expect(runDaily(s, day(10)).daily.revisitXpCount).toBe(3);
  });
  it('依序呼叫已登記的 handler，每天一次，且清空 summary 在最後', () => {
    dailyHandlers.push((s, today) => { added.push(today); return { ...s, lastVisitedSummary: { ...s.lastVisitedSummary, foods: ['seen-by-handler'] } }; });
    const s = recordVisit(fresh(), 'locations', '竹林小徑');
    const out = runDaily(s, day(18));
    expect(added).toEqual(['2026-10-18']);
    expect(out.lastVisitedSummary).toEqual({ locations: [], foods: [] });
    expect(runDaily(out, day(18))).toEqual(out);
  });
});

describe('recordVisit', () => {
  it('去重加入當天摘要', () => {
    let s = recordVisit(fresh(), 'locations', '竹林小徑');
    s = recordVisit(s, 'locations', '竹林小徑');
    s = recordVisit(s, 'foods', '竹筍糕');
    expect(s.lastVisitedSummary).toEqual({ locations: ['竹林小徑'], foods: ['竹筍糕'] });
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/daily.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `dailyHandlers` 直接列出（契約 10.16，不靠副作用 import）：初始為 `[resetDaily, diaryHandler]`，其中 `resetDaily` 設定 `daily = { revisitXpCount: 0, freeBoxUsed: false, visitor: null, visitorDone: false }` 並把所有 `friends[*].chatsToday` 歸零；`diaryHandler` 由 `./diary` 匯入。計畫 B 新增 handler 時直接修改此陣列。不提供 `registerDailyHandler`。
- `runDaily(s, now)`：`if (!isNewDay(s, now)) return s;` 否則 `today = localDate(now)`，依序以 `h(state, today, now)` 執行 `dailyHandlers`，最後設 `lastDailyDate = today` 並清空 `lastVisitedSummary`。
- `recordVisit`：陣列加入前檢查是否已含該名稱。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/daily.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/daily.ts src/core/daily.test.ts
git commit -m "feat(core): add daily settlement runner and visit summary

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 情緒狀態優先順序（`core/mood.ts`）

**Files:**
- Create: `src/core/mood.ts`, `src/core/mood.test.ts`

**Interfaces:**
- Consumes: `GameState`（Task 4）
- Produces（契約 §5）：`moodOf(s: GameState, now: number, justOpenedAfterMs: number | null): Mood`；額外匯出 `idlePoseFor(mood: Mood): string`（回傳 `PandaPose` 字面值，型別於 Task 20 收緊）。
- 規則順序：`sleeping` → `sleepy` → `clingy` → `happy` → `normal`。
- `sleeping` 的第一步（契約 10.6）：`s.awakeUntil !== null && now < s.awakeUntil` 時整段睡覺判斷（含離線超過 12 小時）跳過；點醒熊貓的時間戳由 Task 27 寫入 `awakeUntil = now + 30 分鐘`。

- [ ] **Step 1: 寫失敗測試**

`src/core/mood.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { moodOf } from './mood';

const H = 3600_000;
const at = (h: number) => new Date(2026, 9, 18, h, 0).getTime(); // 本地時間
const base = (over = {}) => ({ ...createInitialState(1, 0), ...over });
const ok = { tummy: 80, clean: 80, mood: 80 };

describe('moodOf 優先順序（規格 5.3）', () => {
  it('23:00–05:59 為睡覺', () => {
    expect(moodOf(base({ needs: ok }), at(23), null)).toBe('sleeping');
    expect(moodOf(base({ needs: ok }), at(5), null)).toBe('sleeping');
    expect(moodOf(base({ needs: ok }), at(6), null)).toBe('happy');
  });
  it('離線超過 12 小時剛打開也是睡覺', () => {
    expect(moodOf(base({ needs: ok }), at(12), 13 * H)).toBe('sleeping');
    expect(moodOf(base({ needs: ok }), at(12), 11 * H)).toBe('happy');
  });
  it('點醒後 30 分鐘內夜裡也不睡覺，過期後恢復睡覺', () => {
    const wake = { ...base({ needs: ok }), awakeUntil: at(23) + 30 * 60_000 };
    expect(moodOf(wake, at(23) + 60_000, null)).toBe('happy');
    expect(moodOf(wake, at(23) + 31 * 60_000, null)).toBe('sleeping');
  });
  it('睡覺優先於想睡', () => {
    expect(moodOf(base({ needs: ok, energy: 10 }), at(23), null)).toBe('sleeping');
  });
  it('元氣 < 25 為想睡，優先於撒嬌', () => {
    expect(moodOf(base({ needs: { tummy: 10, clean: 80, mood: 80 }, energy: 24 }), at(12), null)).toBe('sleepy');
    expect(moodOf(base({ needs: { tummy: 10, clean: 80, mood: 80 }, energy: 25 }), at(12), null)).toBe('clingy');
  });
  it('任一指標 < 50 為撒嬌', () => {
    expect(moodOf(base({ needs: { tummy: 49, clean: 90, mood: 90 } }), at(12), null)).toBe('clingy');
  });
  it('三指標平均 ≥ 70 為開心', () => {
    expect(moodOf(base({ needs: { tummy: 70, clean: 70, mood: 70 } }), at(12), null)).toBe('happy');
    expect(moodOf(base({ needs: { tummy: 70, clean: 69, mood: 71 } }), at(12), null)).toBe('happy');
  });
  it('其他為普通', () => {
    expect(moodOf(base({ needs: { tummy: 60, clean: 80, mood: 90 } }), at(12), null)).toBe('normal');
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/mood.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

`moodOf`：先判斷 `awakeUntil`（非 null 且 `now < awakeUntil` 時跳過整段睡覺判斷），再依序判斷 `h = new Date(now).getHours()`，`h >= 23 || h < 6` 或 `justOpenedAfterMs > 12*H` → `sleeping`；`energy < 25` → `sleepy`；任一指標 `< 50` → `clingy`；平均 `>= 70` → `happy`；否則 `normal`。`idlePoseFor`：`sleeping→'sleep'`、`sleepy→'yawn'`、`clingy→'armsOut'`、`happy→'dance'`、`normal→'sit'`。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/mood.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/mood.ts src/core/mood.test.ts
git commit -m "feat(core): add mood priority rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: 有效照顧與抱抱上限（`core/care.ts`）

**Files:**
- Create: `src/core/care.ts`, `src/core/care.test.ts`

**Interfaces:**
- Consumes: `GameState`、`CareKind`、`Outcome`（Task 4）、`applyReward`（Task 7）
- Produces（契約 §5）：`care(s: GameState, kind: CareKind, now: number): Outcome`；`isEffective(s: GameState, kind: CareKind, now: number): boolean`。
- 對應指標：`feed→tummy`、`bath→clean`、`play→mood`、`hug→mood`。

- [ ] **Step 1: 寫失敗測試**

`src/core/care.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { care, isEffective } from './care';

const H = 3600_000;
const base = (over = {}) => ({ ...createInitialState(1, 0), ...over });

describe('有效照顧（規格 4.1、4.5）', () => {
  it('指標 < 100 時給完整獎勵並 +25（上限 100）', () => {
    const s = base({ needs: { tummy: 70, clean: 70, mood: 70 }, energy: 50 });
    const { state, events } = care(s, 'feed', 0);
    expect(state.needs.tummy).toBe(95);
    expect(state.growthXp).toBe(5);
    expect(state.starSand).toBe(102);
    expect(state.energy).toBe(65);
    expect(state.chainLinks).toBe(1);
    expect(events.some(e => e.type === 'reward')).toBe(true);
  });
  it('指標上限 100', () => {
    const s = base({ needs: { tummy: 90, clean: 70, mood: 70 } });
    expect(care(s, 'feed', 0).state.needs.tummy).toBe(100);
  });
  it('指標已滿：無任何數值獎勵', () => {
    const s = base({ needs: { tummy: 100, clean: 70, mood: 70 } });
    expect(isEffective(s, 'feed', 0)).toBe(false);
    const out = care(s, 'feed', 0);
    expect(out.state).toEqual(s);
    expect(out.events).toEqual([]);
  });
  it('洗澡對應香香、玩耍對應心情', () => {
    const s = base({ needs: { tummy: 100, clean: 40, mood: 40 } });
    expect(care(s, 'bath', 0).state.needs.clean).toBe(65);
    expect(care(s, 'play', 0).state.needs.mood).toBe(65);
  });
});

describe('抱抱每小時上限', () => {
  it('每小時最多 5 次有效抱抱，第 6 次無獎勵', () => {
    let s = base({ needs: { tummy: 70, clean: 70, mood: 0 } });
    for (let i = 0; i < 5; i++) {
      s = { ...s, needs: { ...s.needs, mood: 0 } }; // 每次先把心情歸零，確保是指標未滿而非上限造成的差異
      expect(isEffective(s, 'hug', i * 1000)).toBe(true);
      s = care(s, 'hug', i * 1000).state;
      expect(s.needs.mood).toBe(25);
    }
    expect(s.hugLog).toHaveLength(5);
    s = { ...s, needs: { ...s.needs, mood: 0 } };
    expect(isEffective(s, 'hug', 5000)).toBe(false);
    const sixth = care(s, 'hug', 5000);
    expect(sixth.state.growthXp).toBe(s.growthXp);
    expect(sixth.state.needs.mood).toBe(0);
  });
  it('超過一小時的抱抱不計入上限', () => {
    const s = base({ hugLog: [0, 0, 0, 0, 0] });
    expect(isEffective(s, 'hug', H + 1)).toBe(true);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/care.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `isEffective(s, kind, now)`：`kind === 'hug'` 時先取 `hugLog.filter(t => now - t < H)`，數量 `>= 5` 則 false；再檢查對應指標 `< 100`。
- `care(s, kind, now)`：若不有效回傳 `{ state: s, events: [] }`；有效則：指標 `min(100, cur+25)`；若 `kind === 'hug'` 將 `now` 推入 `hugLog`（先修剪超過一小時者）；再以 `applyReward(state, { xp:5, starSand:2, energy:15, chain:1 })` 套用並回傳。
- 注意：獎勵回傳的 `state` 需保留指標更新與抱抱紀錄。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/care.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/care.ts src/core/care.test.ts
git commit -m "feat(core): add effective care rules and hug hourly cap

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: 餵食、料理與打嗝（`core/care.ts` 續）

**Files:**
- Modify: `src/core/care.ts`
- Create: `src/core/care.feed.test.ts`

**Interfaces:**
- Consumes: `care`（Task 11）、`RECIPES`（Task 5）、`FOOD_MYSTERY_ID`（Task 5）、`applyReward`（Task 7）
- Produces（契約 §5）：`feed(s: GameState, foodId: string, now: number): Outcome`；`cook(s: GameState, a: string, b: string, now: number): Outcome & { result: string }`；`shouldHiccup(s: GameState, now: number): boolean`。
- 決策（契約未定，於此定義）：
  - 餵食會消耗一份食物，即使指標已滿（只是沒有獎勵）。
  - `feed` 的 `foodId` 可以是基本食物、料理 id（`recipe-*`）或 `food-mystery`；食物數量為 0 時回傳原狀態。
  - `cook` 的食材不足時直接 `throw new Error('missing ingredient')`，UI 必須先檢查。
  - 料理結果放入背包：食譜 `recipe-x` 或謎之料理 `food-mystery` 數量 +1，回傳 `result` 為食譜 id 或 `'mystery'`。
  - 首次發現食譜：`recipes` 加入、推入 `recipeDiscovered` 事件，並給 `{ xp: 10, starSand: 5 }`。
  - 打嗝：`feedLog` 修剪為 3 分鐘內，`shouldHiccup` 在 `feedLog`（已包含本次餵食）長度 `> 3` 時為 true；裝備月亮鈴鐺（`diaryDreamOn(s)`，規格 7.2「提高打嗝夢話泡泡的機率」）時門檻降為 `> 2`。本任務新增 `src/core/dream.ts` 匯出 `diaryDreamOn(s: GameState): boolean`（`s.equipped.pendants.includes('pendant-moon-bell')`），Task 13 的 `core/diary.ts` 從這裡 import 並重新匯出。
  - 食物與料理都呼叫 `recordVisit(s, 'foods', 名稱)`（契約 10.10）。`foodNameOf(id)`：`FOODS` 的名稱、`RECIPES` 的食譜名稱，`food-mystery` 為 `'謎之料理'`。

- [ ] **Step 1: 寫失敗測試**

`src/core/care.feed.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { feed, cook, shouldHiccup } from './care';

const MIN = 60_000;
const base = (over = {}) => ({ ...createInitialState(1, 0), ...over });

describe('feed', () => {
  it('扣一份食物並給有效照顧獎勵', () => {
    const s = base({ needs: { tummy: 70, clean: 70, mood: 70 } });
    const out = feed(s, 'food-bamboo-cake', 0);
    expect(out.state.inventory['food-bamboo-cake']).toBe(2);
    expect(out.state.needs.tummy).toBe(95);
    expect(out.state.lastVisitedSummary.foods).toEqual(['竹筍糕']);
  });
  it('指標已滿仍消耗食物但沒有獎勵', () => {
    const s = base({ needs: { tummy: 100, clean: 70, mood: 70 } });
    const out = feed(s, 'food-bamboo-cake', 0);
    expect(out.state.inventory['food-bamboo-cake']).toBe(2);
    expect(out.state.growthXp).toBe(0);
  });
  it('沒有該食物時原狀態不變', () => {
    const s = base({ inventory: {} });
    expect(feed(s, 'food-sour-plum', 0).state).toEqual(s);
  });
});

describe('cook', () => {
  it('首次發現食譜：加入 recipes、給獎勵、發出事件', () => {
    const s = base({ inventory: { 'ing-bamboo-shoot': 1, 'ing-rice-flour': 1 } });
    const out = cook(s, 'ing-bamboo-shoot', 'ing-rice-flour', 0);
    expect(out.result).toBe('recipe-bamboo-mochi');
    expect(out.state.inventory['recipe-bamboo-mochi']).toBe(1);
    expect(out.state.inventory['ing-bamboo-shoot']).toBeUndefined();
    expect(out.state.recipes).toContain('recipe-bamboo-mochi');
    expect(out.events).toContainEqual({ type: 'recipeDiscovered', recipeId: 'recipe-bamboo-mochi' });
    expect(out.state.starSand).toBe(s.starSand + 5);
    expect(out.state.lastVisitedSummary.foods).toEqual(['竹筍麻糬']);
  });
  it('重複做出同一食譜不再發現事件', () => {
    const s = base({ recipes: ['recipe-bamboo-mochi'], inventory: { 'ing-rice-flour': 1, 'ing-bamboo-shoot': 1 } });
    const out = cook(s, 'ing-rice-flour', 'ing-bamboo-shoot', 0);
    expect(out.events.some(e => e.type === 'recipeDiscovered')).toBe(false);
  });
  it('不在食譜內的組合做出謎之料理', () => {
    const s = base({ inventory: { 'ing-honey': 1, 'ing-mushroom': 1 } });
    const out = cook(s, 'ing-honey', 'ing-mushroom', 0);
    expect(out.result).toBe('mystery');
    expect(out.state.inventory['food-mystery']).toBe(1);
  });
  it('缺少食材時拋出錯誤', () => {
    expect(() => cook(base({ inventory: {} }), 'ing-honey', 'ing-mushroom', 0)).toThrow('missing ingredient');
  });
});

describe('shouldHiccup（規格 5.2）', () => {
  it('3 分鐘內第 4 個才打嗝', () => {
    const s = base({ feedLog: [0, 10_000, 20_000] });
    expect(shouldHiccup({ ...s, feedLog: [0, 10_000, 20_000] }, 30_000)).toBe(false);
    expect(shouldHiccup({ ...s, feedLog: [0, 10_000, 20_000, 30_000] }, 30_000)).toBe(true);
  });
  it('超過 3 分鐘的紀錄不計入', () => {
    expect(shouldHiccup(base({ feedLog: [0, 0, 0, 3 * MIN + 1] }), 3 * MIN + 1)).toBe(false);
  });
  it('裝備月亮鈴鐺時第 3 個就打嗝', () => {
    const s = base({ feedLog: [0, 10_000, 20_000] });
    const bell = { ...s, equipped: { ...s.equipped, pendants: ['pendant-moon-bell'] } };
    expect(shouldHiccup(bell, 20_000)).toBe(true);
    expect(shouldHiccup({ ...bell, feedLog: [0, 10_000] }, 20_000)).toBe(false);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/care.feed.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `feed`：`inventory[foodId]` 不足時回傳 `{state: s, events: []}`；否則扣 1、`feedLog` 修剪後推入 `now`，再呼叫 `care(state, 'feed', now)`，最後 `recordVisit(state, 'foods', foodNameOf(foodId))`。
- `cook`：檢查 `a`、`b` 各 `>= 1`，否則 `throw`；扣兩份食材（數量為 0 時刪除 key）；依 `RECIPES` 找 `inputs` 與 `[a, b]` 無序相同者；有則 `result = recipe.id`，否則 `result = 'mystery'`，結果 id 為 `FOOD_MYSTERY_ID`。結果 id 數量 +1。若是食譜且不在 `recipes`：加入、推入 `recipeDiscovered`，並 `applyReward(…, { xp: 10, starSand: 5 })`。最後呼叫 `recordVisit(state, 'foods', 料理名稱)`（食譜名或 `謎之料理`，契約 10.10）；回傳 `{ state, events, result }`。
- `shouldHiccup(s, now)`：`feedLog` 過濾 `now - t < 3 * 60_000`，長度 `> (diaryDreamOn(s) ? 2 : 3)` 為 true（`diaryDreamOn` 來自本任務的 `core/dream.ts`）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/care.feed.test.ts src/core/care.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/care.ts src/core/care.feed.test.ts
git commit -m "feat(core): add feeding, cooking and hiccup rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: 熊貓日記（`core/diary.ts`、`content/diary.ts`）

**Files:**
- Create: `src/content/diary.ts`, `src/core/diary.ts`, `src/core/diary.test.ts`

**Interfaces:**
- Consumes: `GameState`、`DiaryEntry`（Task 4）、`hash`、`pick`、`mulberry32`（Task 3）、`DailyHandler`（型別，`import type` 自 Task 9）
- Produces（契約 §5）：`makeDiaryEntry(s: GameState, today: string): DiaryEntry`；`diaryDreamOn(s: GameState): boolean`（`s.equipped.pendants.includes('pendant-moon-bell')`；計畫 C 實作後改用 `pendantModifiers(s).diaryDream`，契約 10.11）。
- 額外：`content/diary.ts` 匯出 `DIARY_SENTENCES: { text: string; needs?: ('loc' | 'food')[]; dream?: boolean }[]`（至少 5 句 `dream: true`，不含占位符）；`diaryHandler: DailyHandler`。
- `diaryHandler` 由 `core/daily.ts` 直接列入 `dailyHandlers`（契約 10.16）；本模組不做副作用註冊。
- `diaryHandler`：把 `makeDiaryEntry(s, today)` 推入 `diary` 開頭；修剪由 Task 14 的 `splitArchive` 負責。

- [ ] **Step 1: 寫失敗測試**

`src/core/diary.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { makeDiaryEntry } from './diary';
import { DIARY_SENTENCES } from '../content/diary';

describe('月亮鈴鐺（夢境日記，契約 10.11）', () => {
  const dreamy = { ...createInitialState(3, 0), equipped: { outfit: {}, pendants: ['pendant-moon-bell'] } };
  const dayOf = (i: number) => `2026-10-${String(i).padStart(2, '0')}`;
  it('裝備月亮鈴鐺時每篇都是夢裡開頭', () => {
    for (let i = 1; i <= 10; i++) expect(makeDiaryEntry(dreamy, dayOf(i)).text.startsWith('夢裡：')).toBe(true);
  });
  it('未裝備時沒有夢裡開頭', () => {
    for (let i = 1; i <= 10; i++) expect(makeDiaryEntry(createInitialState(3, 0), dayOf(i)).text.startsWith('夢裡')).toBe(false);
  });
  it('夢境句至少 5 句，且不含占位符', () => {
    const dreams = DIARY_SENTENCES.filter(s => s.dream);
    expect(dreams.length).toBeGreaterThanOrEqual(5);
    for (const d of dreams) expect(d.text).not.toMatch(/\{/);
  });
});

describe('日記句庫', () => {
  it('至少 60 句、不重複、只用已定義的占位符', () => {
    expect(DIARY_SENTENCES.length).toBeGreaterThanOrEqual(60);
    expect(new Set(DIARY_SENTENCES.map(s => s.text)).size).toBe(DIARY_SENTENCES.length);
    for (const s of DIARY_SENTENCES) {
      const marks = s.text.match(/\{[a-z]+\}/g) ?? [];
      for (const m of marks) expect(['{loc}', '{food}']).toContain(m);
    }
  });
});

describe('makeDiaryEntry', () => {
  it('同種子同日期結果相同，且不殘留占位符', () => {
    const s = { ...createInitialState(3, 0), lastVisitedSummary: { locations: ['竹林小徑'], foods: ['竹筍糕'] } };
    const a = makeDiaryEntry(s, '2026-10-18');
    expect(makeDiaryEntry(s, '2026-10-18')).toEqual(a);
    expect(a.text).not.toMatch(/\{/);
    expect(a.date).toBe('2026-10-18');
    expect(a.sticker).toBeNull();
  });
  it('有地點紀錄時，多天中會引用竹林小徑', () => {
    const s = { ...createInitialState(3, 0), lastVisitedSummary: { locations: ['竹林小徑'], foods: [] } };
    const hits = Array.from({ length: 31 }, (_, i) => makeDiaryEntry(s, `2026-10-${String(i + 1).padStart(2, '0')}`).text)
      .filter(t => t.includes('竹林小徑'));
    expect(hits.length).toBeGreaterThan(0);
  });
  it('沒有紀錄時不輸出占位符或空白地點', () => {
    const s = createInitialState(3, 0);
    for (let i = 1; i <= 31; i++) {
      const t = makeDiaryEntry(s, `2026-10-${String(i).padStart(2, '0')}`).text;
      expect(t).not.toMatch(/\{|\}|  /);
    }
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/diary.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `content/diary.ts`：至少 60 句，寫成 `{ text, needs?, dream? }`；其中至少 5 句 `dream: true`（夢境句，不含占位符，供月亮鈴鐺使用）。範例：
  - `今天我在{loc}找到一顆很圓的石頭，決定當作秘密基地。`（needs: `['loc']`）
  - `{food}吃起來比昨天更甜，我覺得它也很開心。`（needs: `['food']`）
  - `今天沒有出門，但我把尾巴洗得很乾淨，想給誰看看。`
  - 其餘句子以相同語氣補齊：有梗、不幼稚（例如「今天的我有一點點神秘，你不要問」）。
- `makeDiaryEntry(s, today)`：`rand = mulberry32(hash(s.seed, today))`；`dream = diaryDreamOn(s)`；`pool` 只保留 `(x.dream === true) === dream` 且 needs 條件成立者（`loc` 需 `locations.length > 0`，`food` 需 `foods.length > 0`）；`base = pick(rand, pool).text`，替換 `{loc}` 為 `pick(rand, locations)`、`{food}` 為 `pick(rand, foods)`；若 `dream` 為真，文字加上「夢裡：」前綴。回傳 `{ date: today, text, sticker: null }`。
- `diaryHandler`：`(s, today) => ({ ...s, diary: [makeDiaryEntry(s, today), ...s.diary] })`；不做任何註冊。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/diary.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/content/diary.ts src/core/diary.ts src/core/diary.test.ts
git commit -m "feat(core): add diary sentence bank and daily diary entries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: 存檔格式、驗證、遷移與存檔碼（`core/save.ts`）

**Files:**
- Create: `src/core/save.ts`, `src/core/save.test.ts`

**Interfaces:**
- Consumes: `GameState`、`SCHEMA_VERSION`、`createInitialState`（Task 4）、`fflate`（`zlibSync`、`unzlibSync`、`strToU8`、`strFromU8`）
- Produces（契約 §5）：`serialize(s: GameState): string`；`parseSave(raw: string): GameState | null`；`migrate(obj: unknown): GameState | 'too-new' | null`；`encodeSaveCode(s: GameState): string`；`decodeSaveCode(code: string): GameState | null`。
- 額外匯出：
  - `validateShape(obj: unknown): obj is GameState`（只檢查結構，不檢查版本；唯讀模式用）。
  - `migrations: Record<number, (obj: any) => any>`（初始為空物件；`migrations[1]` 會把 v1 升到 v2）。
  - `splitArchive(s: GameState): { state: GameState; archived: { diary: DiaryEntry[]; letters: Letter[] } }`（日記保留最近 60、信件保留最近 30；被移出的是較舊者，依新到舊排序）。
- 決策：存檔碼 = `base64(zlibSync(utf8(serialize(s))))`；base64 以分塊轉換避免參數過多。

- [ ] **Step 1: 寫失敗測試**

`src/core/save.test.ts`：
```ts
import { describe, it, expect, afterEach } from 'vitest';
import { createInitialState, SCHEMA_VERSION } from './state';
import { serialize, parseSave, migrate, encodeSaveCode, decodeSaveCode, migrations, splitArchive, validateShape } from './save';

const s = createInitialState(7, 0);
afterEach(() => { for (const k of Object.keys(migrations)) delete (migrations as any)[k]; });

describe('序列化與驗證', () => {
  it('往返不變', () => {
    expect(parseSave(serialize(s))).toEqual(s);
  });
  it('壞 JSON、缺欄位回傳 null', () => {
    expect(parseSave('not json')).toBeNull();
    expect(parseSave(JSON.stringify({ ...s, needs: null }))).toBeNull();
    expect(validateShape({ ...s, diary: 'x' })).toBe(false);
    expect(validateShape(s)).toBe(true);
  });
});

describe('遷移', () => {
  it('同版本原樣回傳', () => {
    expect(migrate(JSON.parse(serialize(s)))).toEqual(s);
  });
  it('比程式新回傳 too-new', () => {
    expect(migrate({ ...s, schemaVersion: SCHEMA_VERSION + 1 })).toBe('too-new');
  });
  it('缺版本或非物件回傳 null', () => {
    expect(migrate({ ...s, schemaVersion: undefined })).toBeNull();
    expect(migrate(null)).toBeNull();
  });
  it('依序套用 migrations 直到最新版', () => {
    migrations[0] = (o: any) => ({ ...o, schemaVersion: 1 });
    expect(migrate({ ...s, schemaVersion: 0 })).toEqual(s);
  });
});

describe('存檔碼', () => {
  it('往返不變', () => {
    expect(decodeSaveCode(encodeSaveCode(s))).toEqual(s);
  });
  it('亂碼回傳 null', () => {
    expect(decodeSaveCode('!!!不是存檔碼')).toBeNull();
    expect(decodeSaveCode('')).toBeNull();
  });
});

describe('封存切分（規格 8.3 體積控制）', () => {
  it('日記超過 60 篇時把較舊的移出', () => {
    const diary = Array.from({ length: 65 }, (_, i) => ({ date: `d${i}`, text: 't', sticker: null }));
    const out = splitArchive({ ...s, diary });
    expect(out.state.diary).toHaveLength(60);
    expect(out.state.diary[0].date).toBe('d0');
    expect(out.archived.diary.map(d => d.date)).toEqual(['d60', 'd61', 'd62', 'd63', 'd64']);
  });
  it('信件超過 30 封時把較舊的移出', () => {
    const letters = Array.from({ length: 31 }, (_, i) => ({ id: `l${i}`, date: 'x', from: 'juzi' as const, text: 't', read: true }));
    const out = splitArchive({ ...s, letters });
    expect(out.state.letters).toHaveLength(30);
    expect(out.archived.letters.map(l => l.id)).toEqual(['l30']);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/save.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `serialize(s) = JSON.stringify(s)`。
- `validateShape(obj)`：必須是非 null 物件；`needs` 含三個 number；`energy`、`starSand`、`growthXp`、`chainLinks`、`seed`、`createdAt`、`lastSeenAt` 為 number，`awakeUntil` 為 number 或 null；`lastDailyDate` 為 string；`inventory`、`rooms`、`friends`、`map` 為物件；`diary`、`letters`、`recipes`、`storyBeats`、`hugLog`、`feedLog`、`pokeLog` 為陣列；`equipped`、`presets`、`settings`、`lastVisitedSummary` 存在。
- `migrate(obj)`：非物件或 `schemaVersion` 非整數 → `null`；`> SCHEMA_VERSION` → `'too-new'`；否則 `let v = version; while (v < SCHEMA_VERSION) { const f = migrations[v]; if (!f) return null; obj = f(obj); v = obj.schemaVersion; }`；最後 `validateShape(obj) ? obj : null`。
- `parseSave(raw)`：`JSON.parse` 失敗回傳 `null`；否則 `migrate` 結果若為 `GameState` 則回傳，否則 `null`。
- `encodeSaveCode(s)`：`zlibSync(strToU8(serialize(s)))`，轉 binary string（分塊 8192 bytes）後 `btoa`。
- `decodeSaveCode(code)`：`atob`、`unzlibSync`、`strFromU8` 任一失敗或 `parseSave` 為 `null` → `null`。
- `splitArchive`：`diary.length > 60` 時 `state.diary = diary.slice(0, 60)`，`archived.diary = diary.slice(60)`；`letters` 同理以 30 切分；未超過時 `archived` 為空陣列。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core/save.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/core/save.ts src/core/save.test.ts
git commit -m "feat(core): add save serialization, validation, migration and save codes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: IndexedDB 包裝與時脈（`platform/idb.ts`、`platform/clock.ts`）

**Files:**
- Create: `src/platform/idb.ts`, `src/platform/idb.test.ts`, `src/platform/clock.ts`, `src/platform/clock.test.ts`, `src/core/purity.test.ts`

**Interfaces:**
- Produces（契約 §9）：
  - `idb.ts`：`type StoreName = 'backups' | 'archive' | 'photos'`；`idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined>`；`idbPut(store: StoreName, key: IDBValidKey, value: unknown): Promise<void>`；`idbDelete(store: StoreName, key: IDBValidKey): Promise<void>`；`idbKeys(store: StoreName): Promise<IDBValidKey[]>`。資料庫 `panda-db` 版本 1，三個儲存區一次建好。
  - `clock.ts`：`now(): number`（唯一呼叫 `Date.now` 的地方）；`randomSeed(): number`（0 到 2^32-1 的整數）。

- [ ] **Step 1: 寫失敗測試**

`src/platform/idb.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { idbGet, idbPut, idbDelete, idbKeys } from './idb';

describe('idb', () => {
  it('可以寫、讀、列出、刪除', async () => {
    await idbPut('backups', 1, { a: 1 });
    await idbPut('backups', 2, { a: 2 });
    expect(await idbGet('backups', 1)).toEqual({ a: 1 });
    expect((await idbKeys('backups')).sort()).toEqual([1, 2]);
    await idbDelete('backups', 1);
    expect(await idbGet('backups', 1)).toBeUndefined();
  });
  it('三個儲存區都存在', async () => {
    await idbPut('archive', 'diary:2026-10-18', { x: 1 });
    await idbPut('photos', 'p1', { x: 2 });
    expect(await idbGet('archive', 'diary:2026-10-18')).toEqual({ x: 1 });
    expect(await idbGet('photos', 'p1')).toEqual({ x: 2 });
  });
});
```

`src/platform/clock.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { now, randomSeed } from './clock';

describe('clock', () => {
  it('now 接近 Date.now', () => {
    expect(Math.abs(now() - Date.now())).toBeLessThan(1000);
  });
  it('randomSeed 是 32 位元非負整數', () => {
    for (let i = 0; i < 20; i++) {
      const v = randomSeed();
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(2 ** 32);
    }
  });
});
```

`src/core/purity.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p) ? [p] : [];
  });
}

describe('時間與亂數規則（契約 10.15）', () => {
  it('core 不呼叫 Date.now、Math.random 或 new Date()', () => {
    for (const f of files('src/core')) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/Date\.now\(|Math\.random\(|new Date\(\)/);
    }
  });
  it('ui、panda、platform 只能透過 platform/clock.ts 取得時間，且全專案不用 Math.random', () => {
    for (const f of [...files('src/ui'), ...files('src/panda'), ...files('src/platform'), ...files('src/core')]) {
      if (f.endsWith('clock.ts')) continue;
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/Math\.random\(/);
      if (!f.startsWith('src/core')) expect(src, f).not.toMatch(/Date\.now\(|new Date\(\)/);
    }
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/platform/idb.test.ts src/platform/clock.test.ts src/core/purity.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `idb.ts`：`indexedDB.open('panda-db', 1)`，`onupgradeneeded` 建立 `backups`、`archive`、`photos` 三個 object store（不指定 keyPath，使用外部 key）。以單一 `dbPromise` 快取。每個操作包成 Promise，錯誤直接 reject（呼叫端 try/catch）。
- `clock.ts`：`now = () => Date.now()`；`randomSeed` 以 `Uint32Array(1)` 與 `crypto.getRandomValues` 產生。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/platform/idb.test.ts src/platform/clock.test.ts src/core/purity.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/platform/idb.ts src/platform/idb.test.ts src/platform/clock.ts src/platform/clock.test.ts src/core/purity.test.ts
git commit -m "feat(platform): add IndexedDB wrapper and clock

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: 存檔儲存層（`platform/storage.ts`）

**Files:**
- Create: `src/platform/storage.ts`, `src/platform/storage.test.ts`

**Interfaces:**
- Consumes: `serialize`、`parseSave`、`migrate`、`validateShape`（Task 14）、`createInitialState`（Task 4）、`idbGet/idbPut/idbDelete/idbKeys`、`now`、`randomSeed`（Task 15）、`signal`（`@preact/signals`）
- Produces（契約 §9）：`loadGame(now: number): Promise<{ state: GameState; restored: boolean; readOnly: boolean }>`；`saveGame(s: GameState): void`；`flushOnHide(): void`；`maybeBackup(s: GameState, now: number, force?: boolean): Promise<void>`。
- 額外匯出：
  - `setStateSource(getter: () => GameState): void`（`flushOnHide` 取得目前狀態；`store.ts` 啟動時呼叫）。
  - `installFlushListeners(): void`（`visibilitychange` 變為 hidden 與 `pagehide` 時呼叫 `flushOnHide`）。
  - `archiveItems(a: { diary: DiaryEntry[]; letters: Letter[] }): Promise<void>`（寫入 `archive`，key 為 `diary:${date}` 與 `letter:${id}`）。
  - `saveFailed`、`sizeWarning`、`storageUnavailable`：`Signal<boolean>`。
- 常數：`LS_KEY = 'panda.save'`、`CORRUPT_KEY = 'panda.save.corrupt'`、`BACKUP_INTERVAL = 10 * 60_000`、`BACKUP_KEEP = 3`、`WARN_BYTES = 1_000_000`。

- [ ] **Step 1: 寫失敗測試**

`src/platform/storage.test.ts`：
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInitialState } from '../core/state';
import { idbKeys, idbDelete } from './idb';
import { loadGame, saveGame, maybeBackup, flushOnHide, setStateSource, installFlushListeners, saveFailed } from './storage';

const MIN = 60_000;
const s = createInitialState(11, 0);

beforeEach(async () => {
  localStorage.clear();
  for (const k of await idbKeys('backups')) await idbDelete('backups', k);
  saveFailed.value = false;
});

describe('saveGame / loadGame', () => {
  it('寫入後讀回相同狀態', async () => {
    saveGame(s);
    const out = await loadGame(0);
    expect(out.restored).toBe(false);
    expect(out.readOnly).toBe(false);
    expect(out.state).toEqual(s);
  });
  it('主存檔損壞時保留原文到 corrupt 鍵，並從最新備份還原', async () => {
    saveGame(s);
    await maybeBackup(s, 0);
    localStorage.setItem('panda.save', 'garbage');
    const out = await loadGame(5 * MIN);
    expect(out.restored).toBe(true);
    expect(out.state).toEqual(s);
    expect(localStorage.getItem('panda.save.corrupt')).toBe('garbage');
  });
  it('存檔版本較新時唯讀，仍顯示內容', async () => {
    localStorage.setItem('panda.save', JSON.stringify({ ...s, schemaVersion: 99 }));
    const out = await loadGame(0);
    expect(out.readOnly).toBe(true);
    expect(out.state.seed).toBe(11);
  });
  it('localStorage 寫入失敗時不拋錯，並標記 saveFailed', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => saveGame(s)).not.toThrow();
    expect(saveFailed.value).toBe(true);
    vi.restoreAllMocks();
  });
});

describe('maybeBackup（規格 8.3）', () => {
  it('距上一份超過 10 分鐘才新增，只保留最新 3 份', async () => {
    for (const t of [0, 5 * MIN, 10 * MIN, 20 * MIN, 30 * MIN, 40 * MIN]) await maybeBackup(s, t);
    expect((await idbKeys('backups')).map(Number).sort((a, b) => a - b)).toEqual([20 * MIN, 30 * MIN, 40 * MIN]);
  });
  it('force 會無視間隔', async () => {
    await maybeBackup(s, 0);
    await maybeBackup(s, 1 * MIN, true);
    expect((await idbKeys('backups')).length).toBe(2);
  });
});

describe('flush（規格 8.3 寫入時機）', () => {
  it('visibilitychange 變為 hidden 時立即寫入', () => {
    setStateSource(() => s);
    installFlushListeners();
    localStorage.clear();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(JSON.parse(localStorage.getItem('panda.save')!).seed).toBe(11);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });
  it('flushOnHide 直接寫入目前狀態', () => {
    setStateSource(() => s);
    localStorage.clear();
    flushOnHide();
    expect(localStorage.getItem('panda.save')).not.toBeNull();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/platform/storage.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `loadGame(now)`：
  1. 讀 `localStorage.getItem(LS_KEY)`；若拋錯 → `storageUnavailable.value = true`，回傳 `{ state: createInitialState(randomSeed(), now), restored: false, readOnly: false }`（記憶體模式）。
  2. 有原文：`JSON.parse` 後交給 `migrate`。若為 `GameState` → 正常回傳；若為 `'too-new'` 且 `validateShape` 通過 → 回傳 `readOnly: true`（同時設定模組內唯讀旗標）；其他失敗則把原文寫入 `CORRUPT_KEY`，進入步驟 3。
  3. 讀 `idbKeys('backups')` 由大到小，逐一 `idbGet` 後 `parseSave`；第一個成功者回傳 `restored: true`。
  4. 全部失敗或沒有備份：建立 `createInitialState(randomSeed(), now)`，`restored: false`。
- `saveGame(s)`：若唯讀旗標為真則直接返回；`raw = serialize(s)`；`try { localStorage.setItem(LS_KEY, raw); saveFailed.value = false } catch { saveFailed.value = true }`；`sizeWarning.value = raw.length > WARN_BYTES`；`void maybeBackup(s, now())`（不 await，錯誤已在內部吞掉）。
- `maybeBackup(s, now, force = false)`：整個函式包 try/catch（失敗時設 `storageUnavailable`）；`keys = await idbKeys('backups')`；`last = max(keys)`；若 `!force && last !== undefined && now - last < BACKUP_INTERVAL` 則返回；否則 `idbPut('backups', now, serialize(s))`；刪除超過 `BACKUP_KEEP` 的最舊 key。
- `flushOnHide()`：`saveGame(getState())`。
- `installFlushListeners()`：`document.addEventListener('visibilitychange', …)` 在 hidden 時 `flushOnHide()`；`window.addEventListener('pagehide', flushOnHide)`。
- `archiveItems(a)`：逐筆 `idbPut('archive', key, value)`，包 try/catch。
- 唯讀旗標由 `export function setReadOnly(b: boolean)` 修改（store 也會呼叫）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/platform/storage.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/platform/storage.ts src/platform/storage.test.ts
git commit -m "feat(platform): add save storage with backups, recovery and flush

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 17: 音效與粒子（`platform/audio.ts`、`platform/particles.ts`）

**Files:**
- Create: `src/platform/audio.ts`, `src/platform/audio.test.ts`, `src/platform/particles.ts`, `src/platform/particles.test.ts`

**Interfaces:**
- Produces（契約 §9）：
  - `audio.ts`：`type SfxName = 'pop' | 'munch' | 'giggle' | 'snore' | 'jingle' | 'splash' | 'sparkle' | 'whoosh' | 'boing' | 'tada'`；`sfx(name: SfxName): void`；`unlockAudio(): void`；`setSoundEnabled(on: boolean): void`。
  - `particles.ts`：`burst(kind: 'hearts' | 'bubbles' | 'stars' | 'water', x: number, y: number, count?: number): void`；`particleCount(): number`（測試用）；`PARTICLE_CAP = 60`。
- 行為：音效全部失敗時靜默；`setSoundEnabled(false)` 時 `sfx` 不發聲。粒子在 `prefers-reduced-motion: reduce` 時 `burst` 不產生粒子。

- [ ] **Step 1: 寫失敗測試**

`src/platform/audio.test.ts`：
```ts
import { describe, it, expect, vi } from 'vitest';
import { sfx, unlockAudio, setSoundEnabled } from './audio';

describe('audio', () => {
  it('沒有 AudioContext 時 sfx 與 unlock 靜默不拋錯', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => { unlockAudio(); sfx('pop'); sfx('tada'); }).not.toThrow();
    vi.unstubAllGlobals();
  });
  it('關閉音效後不呼叫 AudioContext', () => {
    const ctor = vi.fn();
    vi.stubGlobal('AudioContext', ctor);
    setSoundEnabled(false);
    sfx('jingle');
    expect(ctor).not.toHaveBeenCalled();
    setSoundEnabled(true);
    vi.unstubAllGlobals();
  });
});
```

`src/platform/particles.test.ts`：
```ts
import { describe, it, expect, vi } from 'vitest';
import { burst, particleCount, PARTICLE_CAP } from './particles';

describe('particles', () => {
  it('同時存在的粒子不超過 60', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    burst('hearts', 10, 10, 100);
    expect(particleCount()).toBe(PARTICLE_CAP);
    expect(PARTICLE_CAP).toBe(60);
    vi.unstubAllGlobals();
  });
  it('減少動態時不產生粒子', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    burst('stars', 0, 0, 10);
    expect(particleCount()).toBe(0);
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/platform/audio.test.ts src/platform/particles.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `audio.ts`：模組內 `let ctx: AudioContext | null`；`unlockAudio()` 在 `window` 上登記一次性 `pointerdown` 監聽（`{ once: true, capture: true }`），內部 `try { ctx ??= new AudioContext(); void ctx.resume(); } catch {}`；`sfx(name)`：`if (!enabled || !ctx) return`（`ctx` 未建立時不建立），其餘以 `OscillatorNode` 與簡單頻率包絡合成，依名稱選頻率表；整體 try/catch。`setSoundEnabled` 寫入模組旗標。注意：測試中「關閉後不呼叫」是因為 `enabled` 為 false 時直接返回。
- `particles.ts`：模組內 `const live: Particle[] = []`；`burst` 先檢查 `matchMedia('(prefers-reduced-motion: reduce)').matches`，為真則返回；`n = Math.min(count, PARTICLE_CAP - live.length)`；推入粒子（位置、速度、生命週期、kind）；若存在 Canvas（`document.getElementById('fx')` 並 `getContext('2d')` 非 null）則以 `requestAnimationFrame` 繪製並移除壽命已盡者；繪製時 `dpr = Math.min(devicePixelRatio, 2)`。`particleCount()` 回傳 `live.length`。Canvas 不存在時粒子仍計數並在壽命後移除（以 `setTimeout` 清除）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/platform/audio.test.ts src/platform/particles.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/platform/audio.ts src/platform/audio.test.ts src/platform/particles.ts src/platform/particles.test.ts
git commit -m "feat(platform): add synthesized sfx unlock and capped particles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: PWA 設定、圖示與 iOS 判定（`platform/pwa.ts`、`platform/pwa-config.ts`）

**Files:**
- Create: `src/platform/pwa.ts`, `src/platform/pwa.test.ts`, `src/platform/pwa-config.ts`, `public/icon.svg`, `scripts/render-icons.mjs`
- Modify: `vite.config.ts`（加入 `VitePWA(PWA_OPTIONS)`）、`index.html`（加入 `<link rel="apple-touch-icon" href="./apple-touch-icon.png">`）

**Interfaces:**
- Consumes: `saveGame`、`maybeBackup`（Task 16）、`now`（Task 15）、`signal`
- Produces（契約 §9）：`updateAvailable: Signal<boolean>`；`applyUpdate(): Promise<void>`；`isStandalone(): boolean`；`isIOS(): boolean`；`setUpdateHandler(fn: () => Promise<void>): void`（由 `registerSW` 的回呼設定，`applyUpdate` 呼叫）。
- `pwa-config.ts`：`export const PWA_OPTIONS`（`registerType: 'prompt'`、`manifest: { name: '熊貓成長記', short_name: '熊貓', lang: 'zh-Hant-TW', display: 'standalone', start_url: './', scope: './', background_color: '#FBF7F0', theme_color: '#FBF7F0', icons: [192 與 512 PNG] }`、`workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'] }`）。

- [ ] **Step 1: 寫失敗測試**

`src/platform/pwa.test.ts`：
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isIOS, isStandalone, applyUpdate, setUpdateHandler, updateAvailable } from './pwa';
import { PWA_OPTIONS } from './pwa-config';

afterEach(() => { vi.unstubAllGlobals(); });

describe('PWA 設定', () => {
  it('manifest 使用相對路徑並為獨立模式', () => {
    const m = PWA_OPTIONS.manifest as any;
    expect(m.start_url).toBe('./');
    expect(m.scope).toBe('./');
    expect(m.display).toBe('standalone');
    expect(PWA_OPTIONS.registerType).toBe('prompt');
  });
});

describe('isIOS', () => {
  it('iPhone 上的 Chrome（CriOS）與 Safari 都判定為 iOS', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) CriOS/120.0 Mobile/15E148' });
    expect(isIOS()).toBe(true);
  });
  it('桌面 Mac 不是 iOS', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15' });
    expect(isIOS()).toBe(false);
  });
});

describe('isStandalone', () => {
  it('display-mode standalone 為真', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(display-mode: standalone)' }));
    expect(isStandalone()).toBe(true);
  });
  it('iOS 舊式 navigator.standalone 也算', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('navigator', { standalone: true });
    expect(isStandalone()).toBe(true);
  });
});

describe('applyUpdate', () => {
  it('先執行 handler（內含存檔與備份），再套用更新', async () => {
    const order: string[] = [];
    setUpdateHandler(async () => { order.push('backup'); order.push('activate'); });
    updateAvailable.value = true;
    await applyUpdate();
    expect(order).toEqual(['backup', 'activate']);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/platform/pwa.test.ts`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `pwa-config.ts`：如 Interfaces 所述；`icons` 指向 `apple-touch-icon.png`（180）、`pwa-192.png`、`pwa-512.png`，檔案由下一步產生。
- `scripts/render-icons.mjs`：以 `@resvg/resvg-js`（新增 devDependency，超出契約清單，僅用於產生 PNG）把 `public/icon.svg` 渲染成 `public/apple-touch-icon.png`（180）、`public/pwa-192.png`、`public/pwa-512.png`。package.json 新增 `"icons": "node scripts/render-icons.mjs"`。
- `public/icon.svg`：米灰底、熊貓頭（黑耳、黑眼圈、琥珀眼、金色小項圈）的簡單 SVG，不含外部參照。
- `pwa.ts`：`updateAvailable = signal(false)`；`isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)`（CriOS 也包含 iPhone）；`isStandalone = matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true`；`setUpdateHandler(fn)` 存入模組變數；`applyUpdate()` 呼叫 handler。`main.tsx`（Task 19）以 `registerSW({ onNeedRefresh() { updateAvailable.value = true }, onOfflineReady() {} })` 註冊，並 `setUpdateHandler(async () => { flushOnHide(); await maybeBackup(getState(), now(), true); await updateSW(true); })`。
- `vite.config.ts`：`plugins: [preact(), VitePWA(PWA_OPTIONS)]`。
- `index.html`：補 `<link rel="apple-touch-icon" href="./apple-touch-icon.png" />`。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/platform/pwa.test.ts && npm run icons && npm run build`
Expected: 測試 PASS；`dist/manifest.webmanifest` 含 `"start_url": "./"`。

- [ ] **Step 5: 提交**

```bash
git add src/platform/pwa.ts src/platform/pwa.test.ts src/platform/pwa-config.ts public scripts vite.config.ts index.html package.json package-lock.json
git commit -m "feat(platform): add PWA prompt update, iOS and standalone detection

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

手動驗收：`npm run dev` 後以 iPhone 開啟 `http://<區網IP>:5173`，確認 Chrome 能看到 apple-touch-icon（Task 28 後再完整測試）。

---

### Task 19: 狀態 store、導覽、畫面登記與 App 殼層（`ui/store.ts`、`ui/nav.ts`、`ui/screens/registry.ts`、`ui/App.tsx`、`main.tsx`）

**Files:**
- Create: `src/ui/store.ts`, `src/ui/store.test.ts`, `src/ui/nav.ts`, `src/ui/nav.test.ts`, `src/ui/screens/registry.ts`, `src/ui/App.tsx`, `src/ui/App.test.tsx`, `src/ui/screens/Placeholder.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `Outcome`、`GameState`、`GameEvent`（Task 4）、`splitArchive`（Task 14）、`loadGame`、`saveGame`、`setStateSource`、`installFlushListeners`、`archiveItems`、`setReadOnly`、`saveFailed`、`sizeWarning`、`storageUnavailable`（Task 16）、`welcomeBack`、`applyElapsed`（Task 8）、`runDaily`（Task 9）、`now`（Task 15）
- Produces（契約 §7）：
  - `store.ts`：`game: Signal<GameState>`、`commit(outcome: Outcome | GameState): void`、`eventQueue: Signal<GameEvent[]>`、`consumeEvents(): GameEvent[]`、`readOnly: Signal<boolean>`；額外 `boot(now: number): Promise<{ welcome: boolean }>`、`justOpenedAfterMs: Signal<number | null>`、`restored: Signal<boolean>`、`dismissOverlay(): void`、`registerBeatAck(fn: (s: GameState) => GameState): void`。
  - `nav.ts`：`type Tab = 'home' | 'map' | 'closet' | 'giftbox' | 'album'`；`type Overlay = ...`（契約 §7 verbatim）；`tab: Signal<Tab>`；`overlay: Signal<Overlay | null>`；`goTab(t: Tab): void`；`openOverlay(o: Overlay): void`；`closeOverlay(): void`。
  - `registry.ts`：`TAB_SCREENS: Record<Tab, ComponentType>`（A 先放 `Placeholder`；home 之後由 Task 22 替換）、`OVERLAY_SCREENS: Partial<Record<Overlay['kind'], ComponentType<{ overlay: Overlay }>>>`（A 先放 `settings`、`dialogue`、`welcome` 的佔位，之後的任務替換）。

- [ ] **Step 1: 寫失敗測試**

`src/ui/store.test.ts`：
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInitialState } from '../core/state';
import * as storage from '../platform/storage';
import { game, commit, eventQueue, consumeEvents, readOnly } from './store';

beforeEach(() => { vi.useFakeTimers(); readOnly.value = false; eventQueue.value = []; });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('commit', () => {
  it('更新 signal，並在 1 秒後寫入一次（去抖動）', () => {
    const spy = vi.spyOn(storage, 'saveGame').mockImplementation(() => {});
    const s = createInitialState(1, 0);
    commit(s); commit({ ...s, starSand: 5 });
    vi.advanceTimersByTime(999);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(game.value.starSand).toBe(5);
  });
  it('唯讀模式不寫入', () => {
    const spy = vi.spyOn(storage, 'saveGame').mockImplementation(() => {});
    readOnly.value = true;
    commit(createInitialState(1, 0));
    vi.advanceTimersByTime(2000);
    expect(spy).not.toHaveBeenCalled();
  });
  it('Outcome 的事件進入 eventQueue，consumeEvents 取出並清空', () => {
    const s = createInitialState(1, 0);
    commit({ state: s, events: [{ type: 'markUp', mark: 1 }] });
    expect(consumeEvents()).toEqual([{ type: 'markUp', mark: 1 }]);
    expect(eventQueue.value).toEqual([]);
  });
});
```

`src/ui/nav.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { tab, overlay, goTab, openOverlay, closeOverlay } from './nav';

describe('nav', () => {
  it('切換分頁與覆蓋層', () => {
    goTab('map');
    expect(tab.value).toBe('map');
    openOverlay({ kind: 'settings' });
    expect(overlay.value).toEqual({ kind: 'settings' });
    closeOverlay();
    expect(overlay.value).toBeNull();
  });
});
```

`src/ui/App.test.tsx`：
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { App } from './App';
import { saveFailed } from '../platform/storage';
import { restored } from './store';

describe('App 殼層', () => {
  it('底部 5 個導覽按鈕，名稱正確', () => {
    render(<App />);
    for (const label of ['家', '窗外', '衣櫃＆布置', '禮盒機', '相簿']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
  });
  it('存檔失敗時顯示頂部警示', async () => {
    saveFailed.value = true;
    render(<App />);
    expect(screen.getByText('目前無法存檔，請匯出備份')).toBeTruthy();
    saveFailed.value = false;
  });
  it('已從備份還原時顯示提示', () => {
    restored.value = true;
    render(<App />);
    expect(screen.getByText(/已從備份還原/)).toBeTruthy();
    restored.value = false;
  });
  it('分頁按鈕有 tab 測試 id', () => {
    render(<App />);
    expect(screen.getByTestId('tab-home')).toBeTruthy();
  });
  it('橫放提示元素存在', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.rotate-hint')).not.toBeNull();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/ui`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `nav.ts`：三個 signal 與三個函式；`goTab` 同時把 `overlay` 設為 `null`。
- `registry.ts`：`TAB_SCREENS` 五個分頁皆指向 `Placeholder`（顯示分頁名稱與「即將推出」）；`OVERLAY_SCREENS` 的 `settings`、`dialogue`、`welcome` 指向 `Placeholder`。註解寫明：後續任務會替換對應值。
- `store.ts`：
  - `game = signal(createInitialState(0, 0))`（啟動前的占位，`boot` 會覆蓋）；`eventQueue = signal<GameEvent[]>([])`；`readOnly = signal(false)`；`justOpenedAfterMs = signal<number | null>(null)`。
  - `commit(x)`：若是 `Outcome`，`state = x.state` 並推入事件；否則 `state = x`；然後 `const { state, archived } = splitArchive(state)`，`game.value = state`（分頁只保留切分後的狀態）；若 `archived` 有內容，`void archiveItems(archived)`；`scheduleSave()`。
  - `registerBeatAck(fn: (s: GameState) => GameState): void`：設定關閉劇情時的處理函式，預設為 `s => ({ ...s, pendingBeat: null })`（計畫 B 以 `ackBeat` 取代，清除後排入下一個到期劇情）。
  - `dismissOverlay()`：若目前覆蓋層是 `dialogue` 且 `game.value.pendingBeat === scriptId`，先 `commit(beatAck(game.value))`，再 `closeOverlay()`。測試：註冊一個會把 pendingBeat 設為 `'ch2'` 的 fn 後關閉 `ch1` 對話，`game.value.pendingBeat` 為 `'ch2'`；未註冊時為 null。這是關閉對話的唯一路徑，避免 pendingBeat 還在時被 watcher 反覆重開（契約 10.8）。
  - `scheduleSave()`：`clearTimeout(timer)`，`timer = setTimeout(() => { if (!readOnly.value) saveGame(game.value) }, 1000)`。
  - `boot(now)`：`setStateSource(() => game.value)`；`installFlushListeners()`；`const loaded = await loadGame(now)`；`readOnly.value = loaded.readOnly`；`restored.value = loaded.restored`（`restored` 為 `signal(false)`，供 App 顯示還原提示）；`setReadOnly(loaded.readOnly)`；`let s = loaded.state`；`const w = welcomeBack(s, now)`（若非 null 則 `s = w.state`，`justOpenedAfterMs.value = offlineMs(loaded.state, now)`）；否則 `justOpenedAfterMs.value = offlineMs(s, now)`；`s = applyElapsed(s, now)`；`s = runDaily(s, now)`；`game.value = s`；`return { welcome: w !== null }`。若 `welcomeBack` 回傳非 null，其事件推入 `eventQueue`。`boot` 不呼叫 `commit`，避免覆寫流程；啟動後 `scheduleSave()`。
- `App.tsx`：
  - 包含 `<div class="rotate-hint">把手機轉直，再來玩吧</div>`。
  - 頂部警示條：`saveFailed.value` 為真顯示「目前無法存檔，請匯出備份」；`storageUnavailable` 為真顯示「這裡無法保存進度，請匯出備份」；`sizeWarning` 為真顯示「存檔變大了，建議匯出備份」；`restored` 為真顯示「已從備份還原，最近的進度已找回」並提供「知道了」按鈕（設為 false）（契約 10.18）。
  - 主體：`const Screen = TAB_SCREENS[tab.value]`；`overlay.value` 非 null 時渲染外層 `<div class="overlay">`，內含 `<button data-testid="overlay-close" aria-label="關閉" onClick={dismissOverlay}>✕</button>` 與 `OVERLAY_SCREENS[kind]`（關閉一律走 `store.dismissOverlay`，契約 10.8）。
  - 底部導覽五個按鈕：`<button aria-label={label} data-testid={`tab-${t}`} onClick={() => goTab(t)} aria-current={...}>`，按鈕內容為 emoji 與文字（🏠 家、🪟 窗外、👗 衣櫃＆布置、🎁 禮盒機、📖 相簿）。`aria-label` 必須是純文字名稱。
  - 樣式：導覽列 `position: fixed` 底部，`padding-bottom: env(safe-area-inset-bottom)`；每個按鈕 `min-height: 44px`。
- `main.tsx`：`render(<App />, root)`；啟動時 `navigator.storage?.persist?.()` 包 try/catch、失敗忽略（契約 10.18）；`boot(now())` 完成後不額外處理；`registerSW` 與 `setUpdateHandler` 依 Task 18 設定。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/ui && npm run typecheck`
Expected: PASS。
手動驗收：`npm run dev`，DevTools 切到 390×844，底部五按鈕可點、高度 ≥ 44px、不出現水平捲軸；旋轉到橫向（以 touch 模擬）時出現「把手機轉直」。

- [ ] **Step 5: 提交**

```bash
git add src/ui src/main.tsx
git commit -m "feat(ui): add store, navigation, placeholder registry and app shell

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: 熊貓 SVG 骨架與姿勢表（`panda/Panda.tsx`、`panda/poses.ts`、`panda/parts.tsx`）

**Files:**
- Create: `src/panda/Panda.tsx`, `src/panda/poses.ts`, `src/panda/parts.tsx`, `src/panda/Panda.test.tsx`

**Interfaces:**
- Consumes: `Outfit`（Task 4）
- Produces（契約 §8）：`PandaPose`（29 個字面值，verbatim）、`PandaProps`（verbatim）、`Panda(props): JSX.Element`、`ANCHORS`（於 Task 21 完整化，此任務先提供全部 key 的占位座標）。
- 額外匯出：`ALL_POSES: PandaPose[]`（`poses.ts`）、`POSE_TABLE: Record<PandaPose, PoseSpec>`（`poses.ts`）。
- 結構：`<svg viewBox="0 0 200 240" data-pose={pose} role="img" aria-label="熊貓">`，內部各會動部件為 `<g data-part="…" transform="…">`，部件清單：`body`、`head`、`earL`、`earR`、`armL`、`armR`、`legL`、`legR`、`tail`、`eyeL`、`eyeR`、`mouth`、`cheekL`、`cheekR`、`strap`、`nightcap`（僅 sleep 姿勢顯示）。
- `PoseSpec`：`{ head?: {dx?, dy?, rot?}; body?: {dy?, rot?}; armL?: {rot?, dx?, dy?}; armR?: ...; legL?: ...; legR?: ...; tail?: {rot?}; eyes: 'open' | 'closed' | 'stars' | 'stare' | 'squint'; mouth: 'smile' | 'open' | 'sour' | 'chew' | 'yawn' | 'flat' | 'pout'; cheeks: boolean; nightcap?: boolean }`（完整定義見下方 `POSE_TABLE` 區塊）。

- [ ] **Step 1: 寫失敗測試**

`src/panda/Panda.test.tsx`：
```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { Panda } from './Panda';
import { ALL_POSES, POSE_TABLE } from './poses';

describe('熊貓姿勢', () => {
  it('共 29 個姿勢，都在姿勢表內', () => {
    expect(ALL_POSES).toHaveLength(29);
    expect(Object.keys(POSE_TABLE).sort()).toEqual([...ALL_POSES].sort());
  });
  it('每個姿勢的規格彼此不同（不會有兩個姿勢長得一樣）', () => {
    const specs = ALL_POSES.map(p => JSON.stringify(POSE_TABLE[p]));
    expect(new Set(specs).size).toBe(ALL_POSES.length);
  });
  it.each(ALL_POSES)('姿勢 %s 可以渲染並標示 data-pose', (pose) => {
    const { container } = render(<Panda pose={pose} stage={1} outfit={{}} pendants={[]} chainLinks={0} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('data-pose')).toBe(pose);
    expect(container.querySelectorAll('[data-part]').length).toBeGreaterThanOrEqual(14);
    expect(container.querySelector('[data-testid="panda-body"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="panda-mouth"]')).not.toBeNull();
  });
  it('招牌姿勢 armsOut 手臂向前伸、sleep 顯示睡帽', () => {
    const a = render(<Panda pose="armsOut" stage={1} outfit={{}} pendants={[]} chainLinks={0} />);
    expect(a.container.querySelector('[data-part="armL"]')!.getAttribute('transform')).not.toBe('');
    const b = render(<Panda pose="sleep" stage={1} outfit={{}} pendants={[]} chainLinks={0} />);
    expect(b.container.querySelector('[data-part="nightcap"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/panda/Panda.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `poses.ts`：`ALL_POSES` 依契約列出 29 個字面值（順序同契約 §8，不含 `spit`：`spit` 不是姿勢，已移除）；`POSE_TABLE: Record<PandaPose, PoseSpec>` 依下表逐一定值（角度為度數，位移為 viewBox 單位；未列出的欄位視為 0／不變）。
  - 型別：`interface PartMove { dx?: number; dy?: number; rot?: number }`；`PoseSpec = { head?: PartMove; body?: PartMove; armL?: PartMove; armR?: PartMove; legL?: PartMove; legR?: PartMove; tail?: PartMove; eyes: 'open' | 'closed' | 'stars' | 'stare' | 'squint'; mouth: 'smile' | 'open' | 'sour' | 'chew' | 'yawn' | 'flat' | 'pout'; cheeks: boolean; nightcap?: boolean }`。
  - 表（每個姿勢彼此不同，`Panda.test` 會檢查）：

```ts
export const POSE_TABLE: Record<PandaPose, PoseSpec> = {
  sit:        { armL: { rot: 12 }, armR: { rot: -12 }, eyes: 'open', mouth: 'smile', cheeks: false },
  armsOut:    { head: { dy: -2 }, armL: { rot: -75, dx: -4, dy: -6 }, armR: { rot: 75, dx: 4, dy: -6 }, eyes: 'open', mouth: 'smile', cheeks: false },
  hug:        { head: { rot: 6 }, armL: { rot: -35, dx: 14, dy: -4 }, armR: { rot: 35, dx: -14, dy: -4 }, eyes: 'squint', mouth: 'smile', cheeks: true },
  sleep:      { head: { dx: 0, dy: 6, rot: 12 }, body: { dy: 8, rot: 6 }, armL: { rot: 25, dy: 8 }, armR: { rot: -10, dy: 10 }, legL: { rot: 10 }, legR: { rot: -6 }, eyes: 'closed', mouth: 'flat', cheeks: false, nightcap: true },
  eat:        { head: { rot: -6 }, armL: { rot: -55, dx: -6, dy: -20 }, armR: { rot: 12 }, eyes: 'open', mouth: 'chew', cheeks: false },
  sour:       { head: { rot: -8, dy: 2 }, body: { rot: -3 }, armL: { rot: -40, dx: -4, dy: -14 }, armR: { rot: 10 }, eyes: 'squint', mouth: 'sour', cheeks: false },
  blush:      { head: { rot: 4 }, armL: { rot: 20 }, armR: { rot: -20 }, eyes: 'open', mouth: 'smile', cheeks: true },
  starEyes:   { head: { dy: -3 }, armL: { rot: -30, dy: -8 }, armR: { rot: 30, dy: -8 }, eyes: 'stars', mouth: 'open', cheeks: false },
  patBelly:   { head: { rot: -2 }, body: { rot: -2 }, armL: { rot: 15 }, armR: { rot: -40, dx: 6, dy: -14 }, eyes: 'closed', mouth: 'smile', cheeks: true },
  bath:       { head: { rot: -4, dy: 2 }, body: { dy: 2 }, armL: { rot: -45, dy: -6 }, armR: { rot: 45, dy: -6 }, tail: { rot: 20 }, eyes: 'squint', mouth: 'open', cheeks: false },
  shake:      { head: { rot: -12 }, body: { rot: -8 }, armL: { rot: -30 }, armR: { rot: 30 }, tail: { rot: -25 }, eyes: 'squint', mouth: 'open', cheeks: false },
  shy:        { head: { dy: 6, rot: 8 }, body: { rot: 4 }, armL: { rot: -65, dx: 6, dy: -18 }, armR: { rot: 65, dx: -6, dy: -18 }, eyes: 'closed', mouth: 'flat', cheeks: true },
  busyBook:   { head: { rot: -4 }, armL: { rot: -50, dx: -4, dy: -16 }, armR: { rot: -45, dx: 4, dy: -16 }, eyes: 'squint', mouth: 'flat', cheeks: false },
  sneeze:     { head: { dy: -4, rot: -14 }, body: { rot: -4 }, armL: { rot: -25 }, armR: { rot: -25 }, tail: { rot: -15 }, eyes: 'closed', mouth: 'open', cheeks: false },
  hideFood:   { head: { rot: 10, dy: 4 }, body: { rot: 4 }, armL: { rot: -30, dx: -8, dy: -14 }, armR: { rot: -30, dx: 8, dy: -14 }, eyes: 'open', mouth: 'chew', cheeks: true },
  chase:      { head: { rot: 8 }, body: { rot: 12 }, legL: { rot: -30, dy: -4 }, legR: { rot: 30, dy: 4 }, armL: { rot: -50 }, armR: { rot: 50 }, tail: { rot: 40 }, eyes: 'open', mouth: 'open', cheeks: false },
  dance:      { head: { rot: -8, dy: -2 }, body: { rot: -6 }, armL: { rot: -70, dy: -8 }, armR: { rot: 70, dy: -8 }, legL: { rot: -8 }, legR: { rot: 8 }, tail: { rot: 20 }, eyes: 'open', mouth: 'smile', cheeks: true },
  yawn:       { head: { rot: -6, dy: -2 }, armR: { rot: -60, dx: 4, dy: -12 }, eyes: 'closed', mouth: 'yawn', cheeks: false },
  stare:      { armL: { rot: 12 }, armR: { rot: -12 }, eyes: 'stare', mouth: 'flat', cheeks: false },
  spin:       { head: { rot: 30 }, body: { rot: 15 }, armL: { rot: -40 }, armR: { rot: 40 }, tail: { rot: -30 }, eyes: 'squint', mouth: 'open', cheeks: false },
  celebrate:  { head: { dy: -4 }, armL: { rot: -110, dx: -6, dy: -16 }, armR: { rot: 110, dx: 6, dy: -16 }, tail: { rot: 30 }, eyes: 'open', mouth: 'open', cheeks: true },
  clingy:     { head: { rot: 6, dy: 2 }, body: { dy: 2 }, armL: { rot: -70, dx: 10, dy: -6 }, armR: { rot: 70, dx: -10, dy: -6 }, eyes: 'open', mouth: 'pout', cheeks: false },
  walk:       { body: { dy: -2 }, legL: { rot: -18 }, legR: { rot: 18 }, armL: { rot: 18 }, armR: { rot: -18 }, tail: { rot: 10 }, eyes: 'open', mouth: 'smile', cheeks: false },
  boxPeek:    { head: { dy: -6 }, body: { dy: 40 }, armL: { rot: -20 }, armR: { rot: 20 }, eyes: 'open', mouth: 'smile', cheeks: false },
  shakeBox:   { head: { rot: -4 }, body: { rot: -6, dy: 6 }, armL: { rot: -80, dy: -12 }, armR: { rot: -80, dy: -12 }, eyes: 'squint', mouth: 'open', cheeks: false },
  useSit:     { head: { dy: -2 }, armL: { rot: -20 }, armR: { rot: 20 }, legL: { rot: -25, dy: -4 }, legR: { rot: -25, dy: -4 }, eyes: 'open', mouth: 'smile', cheeks: false },
  useSleep:   { head: { rot: 10, dy: 10 }, body: { dy: 12 }, armL: { rot: 30, dy: 8 }, eyes: 'closed', mouth: 'flat', cheeks: false },
  useSwing:   { head: { rot: -8 }, body: { rot: 10 }, armL: { rot: -80, dy: -4 }, armR: { rot: -80, dy: -4 }, legL: { rot: -30 }, legR: { rot: -30 }, eyes: 'open', mouth: 'open', cheeks: false },
  useRead:    { head: { rot: -8, dy: 4 }, body: { rot: -2 }, armL: { rot: -50, dx: -4, dy: -16 }, armR: { rot: -50, dx: 4, dy: -16 }, eyes: 'squint', mouth: 'flat', cheeks: false },
};
```
  - 各姿勢的用途：`sit` 待機坐著；`armsOut` 招牌（雙手向前伸要抱抱）；`hug` 被抱；`sleep` 夜間睡覺（戴睡帽）；`eat`、`sour`、`blush`、`starEyes`、`patBelly` 為食物反應（見 Task 23 的 `REACTION_POSE`）；`yawn` 想睡；`clingy` 撒嬌；`dance` 開心；`useSit`、`useSleep`、`useSwing`、`useRead` 為使用家具時的姿勢（Task 22 之後的互動），其餘為小驚喜或小遊戲用。
  - 注意：`useSleep` 與 `sleep` 的差別在於 `nightcap` 不設、頭與身體往下（在窩裡睡）。
- 表內 29 個鍵與 `ALL_POSES` 完全相同（`Object.keys(POSE_TABLE).length === 29`；`yawn` 已列入上表）。
- `parts.tsx`：產生身體（米灰 `--fur`、背與臀 `--fur-shade`）、頭（米灰臉、黑色淚滴眼圈、琥珀眼、黑鼻子）、耳（黑）、手臂與腿（黑）、肩帶（黑色 path 在背後連成一圈）、短尾（米灰）。所有顏色使用 CSS 變數。部件全部是 SVG 原始元素，不引用外部檔。
- `Panda.tsx`：`PandaProps` verbatim；`body` 部件群組加 `data-testid="panda-body"`、嘴部群組加 `data-testid="panda-mouth"`（契約 10.17）；依 `POSE_TABLE[pose]` 為每個部件設定 `transform`（rotate 以部件中心為軸，使用 `rotate(deg cx cy)`）；`size` 預設 `240`（`width` 與 `height`）；`onPokeArea` 以 `onPointerDown` 呼叫，區域對應：`body`/`head` → `'body'`、`armL`/`armR` → `'arms'`、`mouth` → `'mouth'`、項圈區（Task 21）→ `'collar'`。`ANCHORS` 本任務先提供占位：`{ head:{x:100,y:50}, body:{x:100,y:140}, hand:{x:150,y:150}, face:{x:100,y:70}, tail:{x:170,y:200}, pendant:{x:100,y:110} }`，Task 21 會依最終形狀修正。
- `Panda.tsx` 接受的 `stage`、`outfit`、`pendants`、`chainLinks` 本任務暫不呈現（Task 21 補上），但型別必須完整。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/panda`
Expected: PASS。
手動驗收：在 `App` 暫時放一個 `<Panda pose="armsOut" …/>` 於 `npm run dev`，390×844，檢查：黑色淚滴眼圈、黑耳、金色項圈區域（Task 21）與米灰毛色、招牌手臂向前伸。完成後移除暫時放置。

- [ ] **Step 5: 提交**

```bash
git add src/panda
git commit -m "feat(panda): add plush-faithful panda SVG rig with 29 poses

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: 熊貓成長外觀、光澤、項圈鏈與墜飾圖層（`panda/shine.tsx`、`panda/collar.tsx`、`panda/layers.tsx`、`art/items/*`）

**Files:**
- Create: `src/panda/shine.tsx`, `src/panda/collar.tsx`, `src/panda/layers.tsx`, `src/art/items/index.tsx`, `src/art/items/starter-art.tsx`, `src/panda/growth.test.tsx`
- Modify: `src/panda/Panda.tsx`（套用縮放、光澤、項圈、衣物與墜飾；修正 `ANCHORS`）

**Interfaces:**
- Consumes: `scaleForStage`、`shineTier`、`chainThickness`（Task 6）、`ITEM_BY_ID`（Task 5）
- Produces（契約 §8）：`ITEM_ART: Record<string, ComponentType<{ size: number }>>`（`art/items/index.tsx`）；`ANCHORS`（最終值）。
- 行為：
  - 身形：根 `<g data-part="root" transform="scale(s)">`，`s = scaleForStage(stage)`；`stage <= 4` 時頭部額外 `scale(1.15 − 0.05 × (stage − 1))` 以表現嬰兒圓頭（階段 1 為 1.15，階段 4 為 1.0）。
  - 光澤：`tier = shineTier(stage)`；`tier >= 1` 時顯示 `<g data-part="halo">`，星點數 `4 + 2 × tier`；毛色漸層透明度 `min(tier, 3) × 0.15`。`tier` 4 以上只增加星點數。
  - 項圈：`<g data-part="collar">`，鏈環 `min(chainLinks, 24)` 個 `<ellipse data-part="link">`；`chainLinks > 24` 時顯示文字 `×${chainLinks}`（`data-part="link-count"`）；粗細 `stroke-width = 2 + 0.6 × chainThickness(links)`，亮度以 `--chain-light` 疊加。
  - 衣物與墜飾：`outfit` 各部位與 `pendants` 依 `ITEM_ART[id]` 渲染於 `ANCHORS` 位置，`data-part="pendant-${id}"` 或 `outfit-${slot}`；`ITEM_ART` 無對應時不渲染（不報錯）。

- [ ] **Step 1: 寫失敗測試**

`src/panda/growth.test.tsx`：
```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { Panda } from './Panda';

const P = (over: Partial<Parameters<typeof Panda>[0]> = {}) =>
  render(<Panda pose="sit" stage={1} outfit={{}} pendants={[]} chainLinks={0} {...over} />);

describe('成長外觀', () => {
  it('階段 1–4 身形縮放 0.80/0.90/1.00/1.05，之後固定', () => {
    const scaleOf = (st: number) => P({ stage: st }).container.querySelector('[data-part="root"]')!.getAttribute('transform');
    expect(scaleOf(1)).toContain('scale(0.8)');
    expect(scaleOf(2)).toContain('scale(0.9)');
    expect(scaleOf(3)).toContain('scale(1)');
    expect(scaleOf(4)).toContain('scale(1.05)');
    expect(scaleOf(9)).toContain('scale(1.05)');
  });
  it('光環星點數：階段 4 無光環，5 為 6 點，10 為 8 點，20 為 12 點', () => {
    expect(P({ stage: 4 }).container.querySelector('[data-part="halo"]')).toBeNull();
    const stars = (st: number) => P({ stage: st }).container.querySelectorAll('[data-part="halo"] [data-star]').length;
    expect(stars(5)).toBe(6);
    expect(stars(10)).toBe(8);
    expect(stars(20)).toBe(12);
  });
});

describe('項圈鏈', () => {
  it('最多畫 24 環，超過以 ×N 表示', () => {
    expect(P({ chainLinks: 0 }).container.querySelectorAll('[data-part="link"]').length).toBe(0);
    expect(P({ chainLinks: 24 }).container.querySelectorAll('[data-part="link"]').length).toBe(24);
    const over = P({ chainLinks: 25 });
    expect(over.container.querySelectorAll('[data-part="link"]').length).toBe(24);
    expect(over.container.querySelector('[data-part="link-count"]')!.textContent).toBe('×25');
    expect(P({ chainLinks: 24 }).container.querySelector('[data-part="link-count"]')).toBeNull();
  });
});

describe('墜飾與衣物圖層', () => {
  it('已裝備的墜飾渲染在 pendant 錨點', () => {
    const { container } = P({ pendants: ['pendant-bamboo'] });
    expect(container.querySelector('[data-part="pendant-pendant-bamboo"]')).not.toBeNull();
  });
  it('沒有圖的衣物 id 不會崩潰也不渲染', () => {
    const { container } = P({ outfit: { head: 'outfit-unknown' } });
    expect(container.querySelector('[data-part="outfit-head"]')).toBeNull();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/panda/growth.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `shine.tsx`：`Halo({ tier })` 元件，輸出 `<g data-part="halo">` 內含 `<circle>`（半透明光環）與 `4 + 2 × tier` 個 `<path data-star>` 星形，位置以角度均分。
- `collar.tsx`：`Collar({ links, thickness })`，依上方規格；鏈環以沿頸部弧線排列的 `ellipse` 表示。
- `layers.tsx`：`OutfitLayers({ outfit, pendants })`，逐一查 `ITEM_ART`，用 `ANCHORS` 位置定位；`data-part` 規則如上。
- `art/items/index.tsx`：`ITEM_ART = { 'pendant-bamboo': BambooPendant, … }`（僅 starter 物品；C 會擴充）。
- `art/items/starter-art.tsx`：`BambooPendant`（竹葉墜飾，綠色葉片與小鈴鐺）、`NestArt`、`LowTableArt`、`CushionArt`（只用於房間預覽，Task 22 的 RoomView 使用）。每個元件接受 `size`。
- `Panda.tsx`：套用根縮放與頭部縮放；插入 `Halo`、`Collar`、`OutfitLayers`；`ANCHORS` 改為依最終身形量測的座標（head、face、body、hand、tail、pendant）。
- 注意：`halo` 在身體之後、前景之前繪製，不改變毛色層級以外的部件。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/panda`
Expected: PASS。
手動驗收：`npm run dev`，設定 `stage=5, chainLinks=30` 的測試頁，390×844 檢查：光環可見、項圈 24 環加上 `×30`、竹葉墜飾在胸前不遮臉、身形比例在階段 1 與 4 之間有明顯變化。

- [ ] **Step 5: 提交**

```bash
git add src/panda src/art
git commit -m "feat(panda): add growth scale, shine halo, collar chain and item layers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: 家畫面（`ui/screens/Home.tsx` 與元件）

**Files:**
- Create: `src/ui/screens/Home.tsx`, `src/ui/components/Needs.tsx`, `src/ui/components/RoomView.tsx`, `src/ui/components/TopBar.tsx`, `src/ui/components/Mailbox.tsx`, `src/ui/components/DiaryPanel.tsx`, `src/ui/components/InstallHint.tsx`, `src/ui/components/UpdateBanner.tsx`, `src/ui/screens/Home.test.tsx`
- Modify: `src/ui/screens/registry.ts`（`TAB_SCREENS.home = Home`）

**Interfaces:**
- Consumes: `game`、`commit`、`justOpenedAfterMs`（Task 19）、`moodOf`、`idlePoseFor`（Task 10）、`Panda`（Task 20–21）、`ITEM_ART`（Task 21）、`isStandalone`、`isIOS`、`updateAvailable`、`applyUpdate`（Task 18）、`openOverlay`（Task 19）、`makeDiaryEntry`（Task 13）、`TITLE`／`stageTitle`、`currentStage`（Task 6）、`setSoundEnabled`（Task 17）
- Produces：`Home` 元件（`ui/screens/Home.tsx`，預設匯出為具名 `Home`）；`idlePoseFor` 由 mood 決定 Panda 姿勢。
- 行為規格：
  - 頂部列：右上角設定按鈕（`aria-label="設定"`，`openOverlay({kind:'settings'})`）、信箱按鈕（`aria-label="信箱"`，顯示未讀數）、`readOnly` 時顯示「唯讀模式：請更新遊戲」。
  - `Needs`：三個 `role="meter"` 元素，`aria-label` 為「肚子」「香香」「心情」，`aria-valuenow` 直接由 signal 讀取；另有元氣條（`aria-label="元氣"`）。各數值用 `computed(() => game.value.needs.tummy)` 精細訂閱，只更新文字與寬度。
  - 熊貓：`<Panda pose={pose} stage={currentStage(game.value)} outfit={equipped.outfit} pendants={equipped.pendants} chainLinks={chainLinks} />`；`pose` 由 `idlePoseFor(moodOf(...))` 決定。`justOpenedAfterMs` 傳入 `moodOf`，點擊熊貓後 `justOpenedAfterMs.value = null`（醒來）。
  - 房間：`RoomView` 讀 `rooms.living`：以 `wall`、`floor` 顏色區塊呈現，並以 `ITEM_ART` 畫出已擺放項目（無圖者以方塊佔位；每件加上 `data-testid="placed-<uid>"`，契約 10.17）。唯讀，C 擴充。
  - 操作列（契約 10.7、10.17）：`care-feed`（餵食）、`care-bath`（洗澡）、`care-play`（玩耍）、`care-hug`（抱抱），以及料理台按鈕（`aria-label="料理台"`；階段 < 2 時 `disabled` 並顯示「長大一點就能用」）。餵食、洗澡、玩耍、料理台的面板由 Home 本地狀態 `useState<'feed' | 'bath' | 'play' | 'kitchen' | null>` 開關，**不使用 overlay**，`Overlay` 聯集不新增 `care`。面板內容由 Task 23／24 提供；本任務先以本地狀態切換一個佔位區塊即可。
  - 想睡提示（規格 5.3）：`moodOf` 為 `sleepy` 時，熊貓下方顯示「抱抱我、餵我吃點東西」（`data-testid="sleepy-hint"`）。
  - 撒嬌圖示（規格 5.3）：任一指標 `< 50` 時，該指標名稱旁顯示 🥺（`data-testid="need-icon-<key>"`，`aria-hidden="true"`）。
  - 日記面板：`DiaryPanel` 顯示 `diary[0]`；「貼貼紙」按鈕的貼紙清單為 `ITEMS.filter(i => i.category === 'sticker')`（契約 10.2，A 不建立貼紙，計畫 C 提供 `sticker-01`…`sticker-24`）；清單為空時隱藏該按鈕。選後 `diary[0].sticker` 寫入並 `commit`。
  - 信箱 `Mailbox`：列出 `letters`，點開標記 `read: true` 並 `commit`。
  - 角落安裝提示 `InstallHint`：`!isStandalone()` 時顯示；`settings.installHintCollapsed` 為真時只顯示小「?」按鈕（仍存在，點擊可展開；不會永久消失）。
  - `UpdateBanner`：`updateAvailable.value` 為真時顯示「有新版本，點一下更新」，點擊 `applyUpdate()`。
- 電腦版：`#app` 寬度上限已於 Task 1 設定；家畫面的熊貓與房間使用 `width: 100%` 等比縮放。

- [ ] **Step 1: 寫失敗測試**

`src/ui/screens/Home.test.tsx`：
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game, readOnly } from '../store';
import { Home, idlePoseFor } from './Home';
import { overlay } from '../nav';

beforeEach(() => {
  game.value = { ...createInitialState(5, Date.now()), needs: { tummy: 70, clean: 70, mood: 70 } };
  readOnly.value = false;
  overlay.value = null;
});

describe('Home 指標', () => {
  it('三個指標是 meter，並隨 signal 精細更新', async () => {
    render(<Home />);
    const tummy = screen.getByRole('meter', { name: '肚子' });
    expect(tummy.getAttribute('aria-valuenow')).toBe('70');
    await act(() => { game.value = { ...game.value, needs: { ...game.value.needs, tummy: 50 } }; });
    expect(screen.getByRole('meter', { name: '肚子' }).getAttribute('aria-valuenow')).toBe('50');
  });
});

describe('Home 導覽與功能', () => {
  it('設定按鈕開啟設定覆蓋層', () => {
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    expect(overlay.value).toEqual({ kind: 'settings' });
  });
  it('階段 1 時料理台停用並提示', () => {
    render(<Home />);
    const btn = screen.getByRole('button', { name: '料理台' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText('長大一點就能用')).toBeTruthy();
  });
  it('唯讀時顯示提示', () => {
    readOnly.value = true;
    render(<Home />);
    expect(screen.getByText('唯讀模式：請更新遊戲')).toBeTruthy();
  });
});

describe('Home 提示與撒嬌圖示', () => {
  it('想睡時顯示提示文字', () => {
    game.value = { ...createInitialState(5, new Date(2026, 9, 18, 12).getTime()), energy: 20 };
    render(<Home />);
    expect(screen.getByTestId('sleepy-hint').textContent).toBe('抱抱我、餵我吃點東西');
  });
  it('指標低於 50 才顯示撒嬌圖示', () => {
    game.value = { ...createInitialState(5, 0), needs: { tummy: 40, clean: 80, mood: 80 } };
    render(<Home />);
    expect(screen.getByTestId('need-icon-tummy')).toBeTruthy();
    expect(screen.queryByTestId('need-icon-clean')).toBeNull();
  });
  it('操作列按鈕有測試 id', () => {
    render(<Home />);
    for (const id of ['care-feed', 'care-bath', 'care-play', 'care-hug']) expect(screen.getByTestId(id)).toBeTruthy();
  });
});

describe('idlePoseFor', () => {
  it('依情緒選擇待機姿勢', () => {
    expect(idlePoseFor('sleeping')).toBe('sleep');
    expect(idlePoseFor('sleepy')).toBe('yawn');
    expect(idlePoseFor('clingy')).toBe('armsOut');
    expect(idlePoseFor('happy')).toBe('dance');
    expect(idlePoseFor('normal')).toBe('sit');
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/ui/screens/Home.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

依 Behavior 規格實作各元件；`Home` 組合 `TopBar`、`Needs`、`Panda`、`RoomView`、操作列、`DiaryPanel`、`Mailbox`（以 `overlay` 或面板切換顯示）、`InstallHint`、`UpdateBanner`。`registry.ts` 的 `TAB_SCREENS.home` 改為 `Home`。`idlePoseFor` 由 `core/mood.ts` 匯入後再匯出（或於 Home 內重新匯出），以符合測試 import 路徑。
- 注意：`moodOf` 需要 `now`，UI 以 `now()`（`platform/clock`）傳入；這是 UI 層，允許呼叫 clock。
- 注意：`commit` 之後的動畫（心跳、打嗝）用 CSS class 切換，不重新渲染整個畫面。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/ui && npm run typecheck`
Expected: PASS。
手動驗收（390×844）：家畫面頂部不被瀏海遮住、三個指標與元氣條可讀、熊貓在畫面中央約佔 60% 寬、底部導覽不遮住操作列、角落安裝提示可收合且仍有「?」按鈕、沒有水平捲動。

- [ ] **Step 5: 提交**

```bash
git add src/ui
git commit -m "feat(ui): add home screen with needs, room, diary, mailbox and install hint

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: 照顧互動（餵食拖曳、洗澡、玩耍、抱抱）

**Files:**
- Create: `src/ui/components/care/careGeometry.ts`, `src/ui/components/care/careGeometry.test.ts`, `src/ui/components/care/FeedTray.tsx`, `src/ui/components/care/BathArea.tsx`, `src/ui/components/care/PlayMenu.tsx`, `src/ui/components/care/HugButton.tsx`, `src/ui/components/care/care.test.tsx`, `src/panda/reactions.ts`, `src/panda/reactions.test.ts`
- Modify: `src/ui/screens/Home.tsx`（操作列接上上述元件）

**Interfaces:**
- Consumes: `care`、`feed`（Task 11–12）、`commit`（Task 19）、`game`、`ANCHORS.mouth`（Task 20–21）、`BathArea`、`FeedTray` 所在區域的 `touch-action`（Task 1 全域樣式）
- Produces：
  - `careGeometry.ts`：`isNearMouth(p: {x:number;y:number}, mouth: {x:number;y:number}, radius?: number): boolean`（預設 40）；`bathDone(painted: number, total: number): boolean`（`painted / total >= 0.7`）。
  - `FeedTray`：列出 `inventory` 中 `food-` 與 `recipe-`、`food-mystery` 有數量者；拖曳時 `setPointerCapture`，放開時若 `isNearMouth` 則呼叫 `commit(feed(game.value, id, now()))`。
  - `BathArea`：8×8 = 64 格；指標移動時，距離格中心 `≤ 24px` 的格子標記為已塗；已塗數達 `bathDone` 時呼叫 `commit(care(game.value, 'bath', now()))`，並播放泡泡粒子 `burst('bubbles', …)`；完成後清空狀態、可重洗。
  - `PlayMenu`：三個子遊戲（丟球、竹葉琴、比賽瞪眼），每個遊戲結束時呼叫 `commit(care(game.value, 'play', now()))`。
  - `HugButton`：點擊「伸出的雙手」區域呼叫 `commit(care(game.value, 'hug', now()))`；無效時仍播放反應動畫（class）但不改 state。
- 觸控：`FeedTray` 與 `BathArea` 容器 `touch-action: none`；移動容差規則不適用於餵食（拖曳即生效）。

- [ ] **Step 1: 寫失敗測試**

`src/ui/components/care/careGeometry.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { isNearMouth, bathDone } from './careGeometry';

describe('careGeometry', () => {
  it('食物靠近嘴巴的判定半徑 40', () => {
    expect(isNearMouth({ x: 100, y: 100 }, { x: 110, y: 100 })).toBe(true);
    expect(isNearMouth({ x: 100, y: 100 }, { x: 141, y: 100 })).toBe(false);
    expect(isNearMouth({ x: 100, y: 100 }, { x: 100, y: 130 }, 20)).toBe(false);
  });
  it('洗澡 70% 覆蓋率（64 格）', () => {
    expect(bathDone(44, 64)).toBe(false);
    expect(bathDone(45, 64)).toBe(true);
  });
});
```

`src/panda/reactions.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { REACTION_POSE } from './reactions';
import { ALL_POSES } from './poses';

describe('食物反應對應姿勢（規格 5.2，契約 10.19）', () => {
  it('竹筍糕 patBelly、草莓麻糬 blush、酸梅 sour、星空蘋果 starEyes', () => {
    expect(REACTION_POSE.patBelly).toBe('patBelly');
    expect(REACTION_POSE.blush).toBe('blush');
    expect(REACTION_POSE.sour).toBe('sour');
    expect(REACTION_POSE.starEyes).toBe('starEyes');
  });
  it('所有反應都對應到合法姿勢', () => {
    for (const p of Object.values(REACTION_POSE)) expect(ALL_POSES).toContain(p);
  });
});
```

`src/ui/components/care/care.test.tsx`：
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { createInitialState } from '../../../core/state';
import { game } from '../../store';
import { FeedTray } from './FeedTray';
import { HugButton } from './HugButton';

beforeEach(() => {
  game.value = { ...createInitialState(5, 0), needs: { tummy: 70, clean: 70, mood: 70 }, energy: 100 };
});

describe('餵食拖曳', () => {
  it('把竹筍糕拖到嘴巴附近放開，肚子 +25', () => {
    render(<FeedTray mouth={{ x: 100, y: 100 }} />);
    const food = screen.getByRole('button', { name: '竹筍糕 ×3' });
    fireEvent.pointerDown(food, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(food, { clientX: 102, clientY: 98, pointerId: 1 });
    expect(game.value.needs.tummy).toBe(95);
    expect(game.value.inventory['food-bamboo-cake']).toBe(2);
  });
  it('放在嘴巴以外不餵食', () => {
    render(<FeedTray mouth={{ x: 100, y: 100 }} />);
    const food = screen.getByRole('button', { name: '竹筍糕 ×3' });
    fireEvent.pointerDown(food, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(food, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(game.value.inventory['food-bamboo-cake']).toBe(3);
  });
});

describe('抱抱', () => {
  it('每次點擊前把心情歸零；前 5 次有效（心情 +25），第 6 次因每小時上限無效', () => {
    render(<HugButton />);
    const hand = screen.getByTestId('care-hug');
    for (let i = 0; i < 6; i++) {
      game.value = { ...game.value, needs: { ...game.value.needs, mood: 0 } };
      fireEvent.click(hand);
    }
    expect(game.value.hugLog).toHaveLength(5);
    expect(game.value.needs.mood).toBe(0);
  });
});

vi.mock('../../../platform/particles', () => ({ burst: vi.fn() }));
import { burst } from '../../../platform/particles';
import { BathArea } from './BathArea';

describe('洗澡水滴', () => {
  it('塗抹時以 water 粒子呼叫 burst', () => {
    render(<BathArea />);
    const area = screen.getByTestId('bath-area');
    fireEvent.pointerDown(area, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(area, { clientX: 40, clientY: 40, pointerId: 1 });
    expect(burst).toHaveBeenCalledWith('water', expect.any(Number), expect.any(Number), 2);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/ui/components/care`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `src/panda/reactions.ts`：`REACTION_POSE: Record<FoodDef['reaction'], PandaPose>`＝`{ patBelly: 'patBelly', blush: 'blush', sour: 'sour', starEyes: 'starEyes', yum: 'eat', mystery: 'stare' }`（規格 5.2；竹筍糕 patBelly、草莓麻糬 blush、酸梅 sour、星空蘋果 starEyes，契約 10.19）。餵食或料理後，Home 以此切換熊貓姿勢 2 秒。
- `careGeometry.ts`：兩個純函式，依測試。
- `FeedTray`：食物按鈕 `aria-label` 為「名稱 ×數量」（例：`竹筍糕 ×3`），`data-testid="tray-<itemId>"`（例：`tray-food-bamboo-cake`，契約 10.17）；`onPointerDown` 記錄 id 與起點並 `setPointerCapture`；`onPointerUp` 檢查 `isNearMouth(pointerPoint, mouth)`，成功則 `commit(feed(game.value, id, now()))`，並呼叫 `onFed?.(食物的 reaction)`。食物名稱與反應來源：`FOODS` 與 `RECIPES`。
- `BathArea`：容器 `data-testid="bath-area"`；`useRef` 保存 64 格的已塗陣列；`onPointerMove`（已按下時）中以相對座標計算最近格中心；每塗到一個新格子呼叫 `burst('water', x, y, 2)`（水滴，契約 10.19）；每次塗抹後以 signals 或 state 更新該格 class，不重繪整個區塊；完成時呼叫 `commit`。
- `PlayMenu`：三個子元件：`BallGame`（點 3 次球即完成）、`HarpGame`（依序點 4 片竹葉即完成）、`StareGame`（點「開始比賽」後隨機 3–6 秒熊貓眨眼；玩家在眨眼前點擊則熊貓輸，否則玩家輸，結果都完成）。完成時呼叫 `commit(care(game.value, 'play', now()))`。
- `HugButton`：`<button aria-label="抱抱" data-testid="care-hug">`；點擊先呼叫 `care`；若 `isEffective` 為假則加上 `class="shy-bounce"` 的短暫動畫而不改 state。
- `Home.tsx`：操作列的 `care-feed`、`care-bath`、`care-play` 切換 Task 22 的本地面板狀態（`useState<'feed' | 'bath' | 'play' | 'kitchen' | null>`），分別顯示 `FeedTray`、`BathArea`、`PlayMenu`；`care-hug` 即 `HugButton`。`FeedTray` 的 `onFed` 以 `REACTION_POSE[reaction]` 切換熊貓姿勢 2 秒（不使用 overlay）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/ui && npm run typecheck`
Expected: PASS。
手動驗收（390×844）：拖曳竹筍糕到嘴邊時頁面不捲動；洗澡區在 64 格塗抹約 70% 時完成並冒泡泡；抱抱 5 次後第 6 次只有動畫。確認 iOS Safari 上長按食物不出現系統選單（`-webkit-touch-callout: none`）。

- [ ] **Step 5: 提交**

```bash
git add src/ui
git commit -m "feat(ui): add drag feeding, bath, play and hug interactions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 24: 料理台（`ui/screens/Kitchen.tsx`）

**Files:**
- Create: `src/ui/screens/Kitchen.tsx`, `src/ui/screens/Kitchen.test.tsx`, `src/ui/components/RecipeResult.tsx`
- Modify: `src/ui/screens/Home.tsx`（料理台按鈕切換 Home 的本地 `kitchen` 面板（不使用 overlay，契約 10.7）；`disabled` 規則沿用 Task 22）

**Interfaces:**
- Consumes: `cook`（Task 12）、`game`、`commit`、`RECIPES`、`INGREDIENTS`、`FOOD_MYSTERY_ID`、`currentStage`（Task 6）
- Produces：`canCook(inv: Record<string, number>, a: string | null, b: string | null): boolean`（兩格都選且兩者數量各 ≥ 1，且兩格不同或數量 ≥ 2）；`Kitchen` 元件。
- 行為：兩個食材槽 + 鍋子按鈕「煮一煮」；結果以 `RecipeResult` 顯示：食譜首次發現顯示「發現新食譜：{名稱}」，已知食譜顯示「{名稱}做好了」，謎之料理顯示「謎之料理：熊貓吃了表情很複雜，但還是會吃完」。料理留在背包（`recipe-*` 或 `food-mystery`），可於 Task 23 的 `FeedTray` 餵食。

- [ ] **Step 1: 寫失敗測試**

`src/ui/screens/Kitchen.test.tsx`：
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { Kitchen, canCook } from './Kitchen';

beforeEach(() => {
  game.value = { ...createInitialState(5, 0), inventory: { 'ing-bamboo-shoot': 1, 'ing-rice-flour': 1, 'ing-honey': 1, 'ing-mushroom': 1 } };
});

describe('canCook', () => {
  it('兩格都要選且數量足夠', () => {
    expect(canCook({ 'ing-honey': 1 }, 'ing-honey', null)).toBe(false);
    expect(canCook({ 'ing-honey': 1 }, 'ing-honey', 'ing-honey')).toBe(false);
    expect(canCook({ 'ing-honey': 2 }, 'ing-honey', 'ing-honey')).toBe(true);
    expect(canCook({ 'ing-honey': 1, 'ing-mushroom': 1 }, 'ing-honey', 'ing-mushroom')).toBe(true);
  });
});

describe('Kitchen', () => {
  it('煮出新食譜顯示發現文字並進入背包', () => {
    render(<Kitchen />);
    fireEvent.click(screen.getByRole('button', { name: '竹筍' }));
    fireEvent.click(screen.getByRole('button', { name: '米粉' }));
    fireEvent.click(screen.getByRole('button', { name: '煮一煮' }));
    expect(screen.getByText('發現新食譜：竹筍麻糬')).toBeTruthy();
    expect(game.value.inventory['recipe-bamboo-mochi']).toBe(1);
  });
  it('不在食譜內的組合顯示謎之料理', () => {
    render(<Kitchen />);
    fireEvent.click(screen.getByRole('button', { name: '蜂蜜' }));
    fireEvent.click(screen.getByRole('button', { name: '蘑菇' }));
    fireEvent.click(screen.getByRole('button', { name: '煮一煮' }));
    expect(screen.getByText(/謎之料理/)).toBeTruthy();
    expect(game.value.inventory['food-mystery']).toBe(1);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/ui/screens/Kitchen.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `canCook`：依測試規則實作。
- `Kitchen`：食材選擇按鈕以 `INGREDIENTS` 顯示「名稱」與數量（數量為 0 時 `disabled`）；兩次點選依序填入兩個槽；「煮一煮」按鈕 `disabled={!canCook(...)}`；點擊後呼叫 `cook(game.value, a, b, now())`，`commit(out)`，並把 `result` 存入元件 state 給 `RecipeResult` 顯示；重新選擇時清空結果。
- `RecipeResult`：依 `result` 與 `recipes` 是否包含（於 cook 前判斷）顯示三種文字之一。
- 注意：`cook` 在食材不足時會 `throw`；`canCook` 為唯一守門，按鈕 `disabled` 必須與之一致。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/ui/screens/Kitchen.test.tsx && npm run typecheck`
Expected: PASS。
手動驗收（390×844）：料理台的兩個食材槽與鍋子按鈕可用拇指點到（≥ 44px）；結果文字不被底部導覽遮住。

- [ ] **Step 5: 提交**

```bash
git add src/ui
git commit -m "feat(ui): add kitchen with ingredient pot and recipe results

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 25: 小驚喜（`core/surprises.ts`、`content/dreams.ts`、`ui/components/Surprises.tsx`）

**Files:**
- Create: `src/core/surprises.ts`, `src/core/surprises.test.ts`, `src/content/dreams.ts`, `src/ui/components/Surprises.tsx`, `src/ui/components/Surprises.test.tsx`
- Modify: `src/ui/screens/Home.tsx`（熊貓 `onPokeArea` 與 `onPointerDown` 接上；開啟家畫面時判定藏食物；抱抱後判定害羞；餵食後判定打嗝）

**Interfaces:**
- Consumes: `chance`、`mulberry32`、`pick`、`hash`（Task 3）、`shouldHiccup`（Task 12）、`game`、`commit`、`DIARY_SENTENCES`（不使用）
- Produces（`core/surprises.ts`，純函式，時間與亂數由呼叫端傳入）：
  - `recordPoke(pokeLog: number[], now: number): { pokeLog: number[]; trigger: boolean }`：修剪超過 3000ms 的紀錄，加入 `now`；長度 `>= 8` 時 `trigger = true` 並清空紀錄。
  - `shyAfterHug(rand: () => number): boolean`：`chance(rand, 0.3)`。
  - `hideFoodOnOpen(rand: () => number, hasFood: boolean): boolean`：`hasFood && chance(rand, 0.1)`。
  - `hiccupDream(seed: number, now: number): string`：從 `content/dreams.ts` 的 `DREAMS` 以 `pick(mulberry32(hash(seed, now)), DREAMS)` 取出。
- `content/dreams.ts`：`DREAMS: string[]`，至少 10 句（例：「夢裡的竹林會唱歌，我跟著唱錯了一個音。」）。
- 七種小驚喜（不含朋友來訪，該項由 Plan B 實作）：戳戳忙碌（busyBook）、打噴嚏（sneeze）、藏食物（hideFood）、抱抱害羞（shy）、打嗝夢話（hiccup）、項圈叮噹（collar jingle）、熊貓日記（已由 Task 13 實作，此處不重做）。
- 注意：規格 5.4 的 8 種包含朋友來訪；本計畫只實作其餘 7 種（見 Self-Review）。

- [ ] **Step 1: 寫失敗測試**

`src/core/surprises.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { recordPoke, shyAfterHug, hideFoodOnOpen, hiccupDream } from './surprises';
import { DREAMS } from '../content/dreams';

describe('戳戳（規格 5.4：3 秒內 8 下）', () => {
  it('3 秒內第 8 下觸發', () => {
    let log: number[] = [];
    let trig = false;
    for (let i = 0; i < 8; i++) {
      const r = recordPoke(log, i * 300);
      log = r.pokeLog; trig = r.trigger;
    }
    expect(trig).toBe(true);
    expect(log).toEqual([]);
  });
  it('7 下、或分散在 3 秒以上不觸發', () => {
    let log: number[] = [];
    for (let i = 0; i < 7; i++) log = recordPoke(log, i * 100).pokeLog;
    expect(recordPoke(log, 700).trigger).toBe(false);
    let spread: number[] = [];
    let trig = false;
    for (let i = 0; i < 8; i++) { const r = recordPoke(spread, i * 1000); spread = r.pokeLog; trig = trig || r.trigger; }
    expect(trig).toBe(false);
  });
});

describe('機率類驚喜（規格 5.4）', () => {
  it('抱抱後害羞 30%', () => {
    expect(shyAfterHug(() => 0.29)).toBe(true);
    expect(shyAfterHug(() => 0.3)).toBe(false);
  });
  it('偷吃被抓包 10%，且沒有食物時不發生', () => {
    expect(hideFoodOnOpen(() => 0.09, true)).toBe(true);
    expect(hideFoodOnOpen(() => 0.1, true)).toBe(false);
    expect(hideFoodOnOpen(() => 0, false)).toBe(false);
  });
});

describe('夢話', () => {
  it('至少 10 句，且結果來自句庫', () => {
    expect(DREAMS.length).toBeGreaterThanOrEqual(10);
    expect(DREAMS).toContain(hiccupDream(1, 1000));
  });
});
```

`src/ui/components/Surprises.test.tsx`：
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { PandaTapZone } from './Surprises';

beforeEach(() => { game.value = createInitialState(5, 0); });

describe('戳戳驚喜', () => {
  it('連續戳 8 下顯示「假裝很忙」', () => {
    render(<PandaTapZone />);
    const zone = screen.getByTestId('panda-tap-zone');
    for (let i = 0; i < 8; i++) fireEvent.pointerDown(zone, { clientX: 1, clientY: 1, pointerId: 1 });
    expect(screen.getByText(/假裝很忙/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/core/surprises.test.ts src/ui/components/Surprises.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `surprises.ts`：依 Interfaces 實作四個純函式；`hiccupDream` 不使用 `Math.random`。
- `dreams.ts`：至少 10 句。
- `Surprises.tsx`：`PandaTapZone` 包住熊貓（外層容器 `data-testid="panda-tap-zone"`，避免與 Panda 內部的 `panda-body` 重複），`onPointerDown` 用 `useState` 保存 `pokeLog`（或 `game` 的 `pokeLog`，二者擇一，以 `game.pokeLog` 為準並 `commit`），`recordPoke` 觸發時顯示「假裝很忙，拿出一本書擋住臉」2 秒並把熊貓姿勢切為 `busyBook`。
- 其餘驚喜接線（於 `Home.tsx`）：
  - 家畫面開啟時：`hideFoodOnOpen(mulberry32(hash(game.value.seed, now(), 'hide')), hasFood)`。禁止使用 `Math.random`（契約 10.15）；觸發時姿勢切 `hideFood` 3 秒。
  - 抱抱後：`shyAfterHug` 為真時姿勢切 `shy` 2 秒並加耳朵粉紅 class。
  - 餵食後：`shouldHiccup` 為真時顯示 `hiccupDream(game.seed, now())` 的泡泡 4 秒。若 `diaryDreamOn(game.value)`（月亮鈴鐺，契約 10.11）為真，同時把 `{ date: localDate(now()), text: '夢裡：' + 夢話, sticker: null }` 插入 `diary` 開頭並 `commit`（夢話寫入日記；月亮鈴鐺另外讓 `shouldHiccup` 門檻降為 > 2）。
  - 點項圈（`collar` 區）：播放 `sfx('jingle')` 並讓熊貓 `shake` 姿勢 1 秒（打噴嚏為另一個隨機觸發，於 `Home` 的 `idle` 計時器中以 `hash` 決定，每 2 分鐘最多一次）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/core src/ui && npm run typecheck`
Expected: PASS。
手動驗收：快速點熊貓 8 下，看到「假裝很忙」與書擋臉；點項圈聽到叮噹。

- [ ] **Step 5: 提交**

```bash
git add src/core/surprises.ts src/core/surprises.test.ts src/content/dreams.ts src/ui
git commit -m "feat: add random surprises except friend visit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 26: 對話元件、獎勵提示與序章（`ui/components/Dialogue.tsx`、`ui/components/RewardToast.tsx`、`content/story/*`）

**Files:**
- Create: `src/content/story/types.ts`, `src/content/story/prologue.ts`, `src/content/story/index.ts`, `src/content/story/story.test.ts`, `src/ui/components/Dialogue.tsx`, `src/ui/components/Dialogue.test.tsx`, `src/ui/components/RewardToast.tsx`, `src/ui/components/RewardToast.test.tsx`
- Modify: `src/ui/screens/registry.ts`（`OVERLAY_SCREENS.dialogue` 指向 `Dialogue.tsx` 具名匯出的 `DialogueOverlay`；`App` 掛載 `RewardToast`）

**Interfaces:**
- Consumes: `eventQueue`、`consumeEvents`（Task 19）、`GameEvent`（Task 4）、`FriendId`、`PandaPose`（Task 20）
- Produces（契約 §7 verbatim）：`DialogueLine`、`DialogueScript`、`SCRIPTS: Record<string, DialogueScript>`（`content/story/index.ts`）；`<Dialogue scriptId onDone />`（`onDone?: () => void`，契約的 `scriptId` 為必填，`onDone` 為額外可選 prop）；`<RewardToast />`。
- 契約 10.8 追加：`content/story/index.ts` 匯出 `resolveScript(id: string, seed: number): DialogueScript | null`（先查 `SCRIPTS`；查不到且 id 以 `legend-` 開頭時呼叫已註冊的 resolver）與 `registerScriptResolver(fn: (id: string, seed: number) => DialogueScript | null): void`（計畫 B 於載入時註冊小傳說解析器）；`ui/components/Dialogue.tsx` 具名匯出 `DialogueOverlay({ overlay })`。
- 行為：
  - `Dialogue`：一次顯示一句，點擊整個對話框或「下一句」按鈕（`data-testid="dialogue-next"`）推進；最後一句再點擊呼叫 `onDone`；旁白置中斜體，熊貓句左側，朋友句標示名字（`FriendId` 對應名稱：`mianhua`→棉花、`juzi`→橘子、`manman`→慢慢、`gulu`→咕嚕）。
  - `RewardToast`：只消化 `reward`、`markUp`、`stageUp`、`slotUnlocked`、`recipeDiscovered`；其餘事件留在佇列（其他計畫處理）。顯示時間 2.5 秒後消失；多個事件依序顯示。
  - 文字：`reward` 顯示「+{starSand} 星砂」、「+{energy} 元氣」（非零才顯示）；`markUp` 顯示「成長刻度 +1」（依 `mark` 值）；`stageUp` 顯示「升上階段 {stage}：{title}」；`slotUnlocked` 顯示「項圈多了一個墜飾欄位！」；`recipeDiscovered` 顯示「新食譜：{名稱}」。
- `prologue` 序章（規格 6.5、3.4）：8–10 句，由熊貓與旁白組成。範例：
  - narrator：「紙箱的蓋子慢慢掀開，一顆圓圓的腦袋探了出來。」
  - panda（pose `blush`）：「……這裡好亮。鼻子先出來的，我慢一步。」
  - narrator：「脖子上有一條金色的項圈，扣環是空的。」
  - panda（pose `sit`）：「空的？那一定是有東西掉了。」
  - 其餘句子延續序章：讓玩家感覺熊貓來自很遠的地方、想找回扣環上的墜飾；口吻有梗不幼稚。
- 注意：`SCRIPTS` 的 key 為 `'prologue'`；B 會再加入 `ch1`–`ch5`。

- [ ] **Step 1: 寫失敗測試**

`src/content/story/story.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { SCRIPTS, resolveScript, registerScriptResolver } from './index';

const SPEAKERS = ['panda', 'mianhua', 'juzi', 'manman', 'gulu', 'narrator', 'passerby'];

describe('對話腳本', () => {
  it('序章存在、8–10 句、講者合法', () => {
    const p = SCRIPTS['prologue'];
    expect(p.id).toBe('prologue');
    expect(p.lines.length).toBeGreaterThanOrEqual(8);
    expect(p.lines.length).toBeLessThanOrEqual(10);
    for (const l of p.lines) expect(SPEAKERS).toContain(l.speaker);
  });
  it('resolveScript：內建腳本直接回傳；未知 id 回傳 null', () => {
    expect(resolveScript('prologue', 1)?.id).toBe('prologue');
    expect(resolveScript('nope', 1)).toBeNull();
    expect(resolveScript('legend-1', 1)).toBeNull();
  });
  it('legend-* 交由已註冊的 resolver 解析（契約 10.8）', () => {
    registerScriptResolver((id, seed) => ({ id, lines: [{ speaker: 'narrator', text: `seed ${seed}` }] }));
    expect(resolveScript('legend-1', 7)!.lines[0].text).toBe('seed 7');
  });
});
```

`src/ui/components/Dialogue.test.tsx`：
```tsx
import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { Dialogue } from './Dialogue';
import { SCRIPTS } from '../../content/story';
import { act } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { overlay } from '../nav';
import { App } from '../App';

describe('pendingBeat 監看與關閉（契約 10.8）', () => {
  it('pendingBeat 有值且無覆蓋層時自動開啟對話，關閉後清除', async () => {
    game.value = { ...createInitialState(5, 0), onboardingDone: true, pendingBeat: 'prologue' };
    overlay.value = null;
    render(<App />);
    await act(() => {});
    expect(overlay.value).toEqual({ kind: 'dialogue', scriptId: 'prologue' });
    fireEvent.click(screen.getByTestId('overlay-close'));
    expect(game.value.pendingBeat).toBeNull();
    expect(overlay.value).toBeNull();
  });
  it('查無腳本時直接呼叫 onDone（不卡住）', () => {
    let done = false;
    render(<Dialogue scriptId="nope" onDone={() => { done = true; }} />);
    expect(done).toBe(true);
  });
});

describe('Dialogue', () => {
  it('點擊逐句推進，最後一句後呼叫 onDone', () => {
    let done = false;
    render(<Dialogue scriptId="prologue" onDone={() => { done = true; }} />);
    const box = screen.getByTestId('dialogue-box');
    const lines = SCRIPTS['prologue'].lines;
    expect(screen.getByText(lines[0].text)).toBeTruthy();
    for (let i = 1; i < lines.length; i++) fireEvent.click(box);
    expect(screen.getByText(lines[lines.length - 1].text)).toBeTruthy();
    expect(done).toBe(false);
    fireEvent.click(box);
    expect(done).toBe(true);
  });
});
```

`src/ui/components/RewardToast.test.tsx`：
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/preact';
import { eventQueue } from '../store';
import { RewardToast } from './RewardToast';

beforeEach(() => { eventQueue.value = []; });

describe('RewardToast', () => {
  it('顯示獎勵與刻度文字，並保留其他事件', async () => {
    render(<RewardToast />);
    await act(() => {
      eventQueue.value = [
        { type: 'reward', xp: 5, starSand: 2, energy: 15, chain: 1, items: {} },
        { type: 'markUp', mark: 3 },
        { type: 'storyBeat', beatId: 'prologue' },
      ];
    });
    expect(screen.getByText('+2 星砂')).toBeTruthy();
    expect(screen.getByText('+15 元氣')).toBeTruthy();
    expect(screen.getByText('成長刻度 +1')).toBeTruthy();
    expect(eventQueue.value).toEqual([{ type: 'storyBeat', beatId: 'prologue' }]);
  });
  it('升階文字包含階段與稱號', async () => {
    render(<RewardToast />);
    await act(() => { eventQueue.value = [{ type: 'stageUp', stage: 2, title: '圓滾滾' }]; });
    expect(screen.getByText('升上階段 2：圓滾滾')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/content/story src/ui/components/Dialogue.test.tsx src/ui/components/RewardToast.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `types.ts`：契約 §7 的 `DialogueLine`、`DialogueScript` verbatim（`pose?: PandaPose`，型別以 `string` 為暫時型別亦可，於 Task 20 之後收緊為 `PandaPose`）。
- `prologue.ts`：依上方序章範例寫滿 8–10 句。
- `index.ts`：`SCRIPTS = { prologue }`；`let resolver: ((id: string, seed: number) => DialogueScript | null) | null = null`；`registerScriptResolver(fn)` 設定 resolver；`resolveScript(id, seed)`：`SCRIPTS[id]` 優先，否則若 `id.startsWith('legend-')` 且 resolver 存在則回傳 `resolver(id, seed)`，其餘回傳 `null`。
- `Dialogue.tsx`：`useState` 記錄索引；`const script = resolveScript(scriptId, game.value.seed)`；若為 `null`（查無腳本）則在 `useEffect` 中直接呼叫 `onDone`，避免卡住；對話框 `data-testid="dialogue-box"`，`onClick` 推進；「下一句」按鈕 `data-testid="dialogue-next"`（`stopPropagation` 後推進，不重複計數）；內容使用 `pose` 切換熊貓（Task 20 的 `Panda`，尺寸 140）。`DialogueOverlay({ overlay })` 在 `overlay.kind === 'dialogue'` 時渲染 `<Dialogue scriptId onDone={dismissOverlay} />`（`dismissOverlay` 來自 Task 19 的 store，會清除 pendingBeat）。
- `RewardToast.tsx`：`useEffect` 監聽 `eventQueue`，把可消化的事件以 `consumeEvents` 的方式只取出可處理者（以 `filter` 後寫回 `eventQueue`）；以 `setTimeout` 2.5 秒清除顯示項目；`role="status"`。
- 在 `App` 中掛載 `<RewardToast />`（固定於頂部下方），並以 `useSignalEffect` 監看 pendingBeat：`game.value.pendingBeat` 非 null 且 `overlay.value === null` 時呼叫 `openOverlay({ kind: 'dialogue', scriptId: pendingBeat })`（契約 10.8）。關閉對話一律經 `dismissOverlay`，不會反覆重開。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/content/story src/ui && npm run typecheck`
Expected: PASS。
手動驗收：觸發一次餵食得到獎勵，頂部出現「+2 星砂」等提示，不遮住底部導覽，2.5 秒後消失。

- [ ] **Step 5: 提交**

```bash
git add src/content/story src/ui
git commit -m "feat(ui): add dialogue component, reward toast and prologue script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 27: 歡迎回來與睡覺醒來（`ui/screens/Welcome.tsx`、`ui/screens/Home.tsx` 修改）

**Files:**
- Create: `src/ui/screens/Welcome.tsx`, `src/ui/screens/Welcome.test.tsx`
- Modify: `src/ui/screens/registry.ts`（`OVERLAY_SCREENS.welcome = Welcome`）、`src/ui/store.ts`（`boot` 回傳 `welcome` 時在 `App` 開啟覆蓋層）、`src/ui/screens/Home.tsx`（睡覺醒來）

**Interfaces:**
- Consumes: `boot`（Task 19）、`justOpenedAfterMs`（Task 19）、`openOverlay`、`closeOverlay`（Task 19）、`moodOf`（Task 10）、`Panda`（Task 20）
- Produces：`Welcome` 元件（`overlay.kind === 'welcome'`）。
- 行為：
  - 歡迎畫面：熊貓以 `hug` 姿勢跑過來（`pose="hug"`，動畫位移 class），文字「你回來了！」與「熊貓想你了，這是它準備的小禮物：30 星砂＋一封信」，按鈕「收下」關閉覆蓋層。信件已於 `welcomeBack` 寫入信箱（Task 8）。
  - 睡覺醒來：`justOpenedAfterMs` 在離線超過 12 小時剛打開時非 null，`moodOf` 回傳 `sleeping`，熊貓顯示 `sleep`；點擊熊貓一次 → `justOpenedAfterMs.value = null`，並 `commit` 設定 `awakeUntil = now() + 30 * 60_000`（契約 10.6）；播放 `yawn` 0.8 秒後回到 `moodOf` 的下一個符合狀態。`awakeUntil` 生效期間（30 分鐘）即使在 23:00–06:00 也不睡覺，過期後才恢復睡覺判定。
  - 睡覺時的 `HugButton` 與 `FeedTray` 在睡覺中仍可用（會醒來後照顧）；點擊任何照顧按鈕前先醒來。

- [ ] **Step 1: 寫失敗測試**

`src/ui/screens/Welcome.test.tsx`：
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game, justOpenedAfterMs } from '../store';
import { overlay } from '../nav';
import { Welcome } from './Welcome';
import { Home } from './Home';

const H = 3600_000;
beforeEach(() => {
  game.value = createInitialState(5, 0);
  overlay.value = { kind: 'welcome' };
});

describe('Welcome', () => {
  it('顯示歡迎文字與禮物說明，收下後關閉', () => {
    render(<Welcome overlay={{ kind: 'welcome' }} />);
    expect(screen.getByText('你回來了！')).toBeTruthy();
    expect(screen.getByText(/30 星砂/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '收下' }));
    expect(overlay.value).toBeNull();
  });
});

describe('睡覺醒來', () => {
  it('離線 13 小時剛打開時睡著，點熊貓後醒來', async () => {
    const h = new Date(2026, 9, 18, 12).getTime();
    game.value = { ...createInitialState(5, h), needs: { tummy: 80, clean: 80, mood: 80 }, energy: 80 };
    justOpenedAfterMs.value = 13 * H;
    render(<Home />);
    expect(screen.getByRole('img', { name: '熊貓' }).getAttribute('data-pose')).toBe('sleep');
    await act(() => { fireEvent.pointerDown(screen.getByTestId('panda-body'), { pointerId: 1, clientX: 1, clientY: 1 }); });
    expect(justOpenedAfterMs.value).toBeNull();
    expect(game.value.awakeUntil).not.toBeNull();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/ui/screens/Welcome.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `Welcome.tsx`：依行為規格；`Overlay` 型別窄化以接收 `{ overlay }` prop（與 registry 型別一致）。
- `store.ts` `boot` 完成後，若 `welcome` 為真則 `openOverlay({ kind: 'welcome' })`（於 `main.tsx` 的 boot `then` 中呼叫，避免 store 依賴 nav 的循環）。
- `Home.tsx`：熊貓 `onPointerDown` 若 `justOpenedAfterMs.value !== null` 或目前 `moodOf` 為 `sleeping`，則設定 `justOpenedAfterMs.value = null`、`commit({ ...game.value, awakeUntil: now() + 30 * 60_000 })` 並播放醒來；`pose` 由 `idlePoseFor(moodOf(game.value, now(), justOpenedAfterMs.value))` 決定。
- 注意：醒來後的 `moodOf` 不再因為 `justOpenedAfterMs` 而睡覺。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/ui && npm run typecheck`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/ui src/main.tsx
git commit -m "feat(ui): add welcome-back screen and wake-up from long sleep

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 28: 首次啟動引導與「把熊貓帶回家」（`ui/onboarding.ts`、`ui/screens/Onboarding.tsx`、`ui/components/InstallGuide.tsx`、`ui/components/MoveIn.tsx`）

**Files:**
- Create: `src/ui/onboarding.ts`, `src/ui/onboarding.test.ts`, `src/ui/screens/Onboarding.tsx`, `src/ui/screens/Onboarding.test.tsx`, `src/ui/components/InstallGuide.tsx`, `src/ui/components/MoveIn.tsx`
- Modify: `src/ui/App.tsx`（若 `initialStep(...)` 非 null 則渲染 `Onboarding` 而非分頁）、`src/ui/screens/Home.tsx`（新增可選 prop `tutorialHint?: string`，有值時顯示提示泡泡，供教學步驟使用）、`src/core/state.ts` 無需修改

**Interfaces:**
- Consumes: `isIOS`、`isStandalone`（Task 18）、`game`、`commit`、`goTab`（Task 19）、`encodeSaveCode`、`decodeSaveCode`（Task 14）、`care`（Task 11）、`Dialogue`（Task 26）、`Panda`（Task 20）
- Produces（`ui/onboarding.ts`）：
  - `type OnbStep = 'install' | 'moveOut' | 'moveIn' | 'boxPeek' | 'prologue' | 'tutorialHug' | 'tutorialFeed' | 'done'`
  - `interface OnbCtx { isIOS: boolean; standalone: boolean; hasProgress: boolean; onboardingDone: boolean; moveOutDismissed: boolean }`
  - `hasProgress(s: GameState): boolean`：`s.growthXp > 0 || s.completedCount > 0 || s.diary.length > 0 || s.chainLinks > 0`
  - `initialStep(c: OnbCtx): OnbStep | null`
  - `nextStep(step: OnbStep): OnbStep`
- 規則：
  - `isIOS && !standalone && hasProgress && !moveOutDismissed` → `'moveOut'`（契約 10.18：iOS 分頁已有進度時顯示「搬家」流程）。`moveOutDismissed` 沿用 `settings.installHintCollapsed` 作為「已關閉」旗標，避免新增欄位；「先不用」會把它設為 `true`，之後只能從設定頁的「加入主畫面說明」再次查看。
  - 其餘 `onboardingDone` 或 `hasProgress` → `null`（不顯示引導）。
  - `!standalone && isIOS && !hasProgress` → `'install'`（規格 8.3「把熊貓帶回家」）。
  - `standalone && !hasProgress` → `'moveIn'`（主畫面第一次開啟，可貼存檔碼或開始新遊戲）。
  - 其他（桌機、Android 或 iOS 非分頁的其他情況）→ `'boxPeek'`。
  - `moveOut` 不經 `nextStep`：「先不用」寫入 `settings.installHintCollapsed = true` 並關閉引導；「複製存檔碼」呼叫 `encodeSaveCode(game.value)` 寫入剪貼簿。
  - `nextStep`：`install → boxPeek`（「先在這裡玩」）；`moveIn → boxPeek`（「開始新遊戲」或貼碼成功後以 `commit` 設定 `onboardingDone` 並跳到 `done`，見下）；`boxPeek → prologue → tutorialHug → tutorialFeed → done`。
- 完成時（`done`）：`commit` 設定 `onboardingDone: true`，`goTab('map')`（規格 3.4：引導去竹林小徑）。
- 搬家：`MoveIn` 的「貼上存檔碼」呼叫 `decodeSaveCode`，成功則 `commit(state)` 並標記 `onboardingDone: true`、跳到 `done`；失敗顯示「這個存檔碼看不懂」且不覆蓋進度。
- `InstallGuide`：SVG 圖解，三個步驟：① 點底部的「分享」圖示 ② 向下找到「加入主畫面」③ 從主畫面圖示開啟。按鈕「先在這裡玩」與「我加好了，開啟熊貓」（後者只提示改由主畫面開啟，不做偵測）。

- [ ] **Step 1: 寫失敗測試**

`src/ui/onboarding.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { initialStep, nextStep, hasProgress } from './onboarding';
import { createInitialState } from '../core/state';

const ctx = (over = {}) => ({ isIOS: true, standalone: false, hasProgress: false, onboardingDone: false, moveOutDismissed: false, ...over });

describe('initialStep（規格 8.3、3.4）', () => {
  it('iPhone 瀏覽器分頁且沒有進度 → 把熊貓帶回家', () => {
    expect(initialStep(ctx())).toBe('install');
  });
  it('主畫面第一次開啟 → 搬家或新遊戲', () => {
    expect(initialStep(ctx({ standalone: true }))).toBe('moveIn');
  });
  it('桌機沒有進度 → 直接開箱', () => {
    expect(initialStep(ctx({ isIOS: false }))).toBe('boxPeek');
  });
  it('iOS 分頁已有進度 → 搬家流程（moveOut）；關閉後不再顯示', () => {
    expect(initialStep(ctx({ hasProgress: true }))).toBe('moveOut');
    expect(initialStep(ctx({ hasProgress: true, moveOutDismissed: true }))).toBeNull();
  });
  it('已完成引導或主畫面已有進度 → 不顯示', () => {
    expect(initialStep(ctx({ onboardingDone: true }))).toBeNull();
    expect(initialStep(ctx({ standalone: true, hasProgress: true }))).toBeNull();
  });
  it('hasProgress 依成長、完成地點、日記與項圈判定', () => {
    const base = createInitialState(1, 0);
    expect(hasProgress(base)).toBe(false);
    expect(hasProgress({ ...base, growthXp: 1 })).toBe(true);
    expect(hasProgress({ ...base, diary: [{ date: '2026-10-18', text: 't', sticker: null }] })).toBe(true);
  });
});

describe('nextStep', () => {
  it('依序走完引導', () => {
    let s: any = 'boxPeek';
    const seen: string[] = [];
    while (s !== 'done') { s = nextStep(s); seen.push(s); }
    expect(seen).toEqual(['prologue', 'tutorialHug', 'tutorialFeed', 'done']);
  });
  it('先在這裡玩 → 開箱', () => {
    expect(nextStep('install')).toBe('boxPeek');
    expect(nextStep('moveIn')).toBe('boxPeek');
  });
});
```

`src/ui/screens/Onboarding.test.tsx`：
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { Onboarding } from './Onboarding';

beforeEach(() => { game.value = createInitialState(5, 0); });

describe('Onboarding', () => {
  it('搬家流程（已有進度的 iOS 分頁）提供複製存檔碼與「先不用」', () => {
    render(<Onboarding step="moveOut" />);
    expect(screen.getByText(/把熊貓搬到主畫面/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '複製存檔碼' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '先不用' })).toBeTruthy();
  });
  it('安裝步驟提供「先在這裡玩」', () => {
    render(<Onboarding step="install" />);
    expect(screen.getByText(/把熊貓帶回家/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '先在這裡玩' })).toBeTruthy();
  });
  it('搬家：貼上錯誤存檔碼顯示錯誤且不覆蓋進度', () => {
    render(<Onboarding step="moveIn" />);
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.input(input, { target: { value: '亂碼' } });
    fireEvent.click(screen.getByRole('button', { name: '貼上存檔碼' }));
    expect(screen.getByText('這個存檔碼看不懂')).toBeTruthy();
    expect(game.value.seed).toBe(5);
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/ui/onboarding.test.ts src/ui/screens/Onboarding.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `onboarding.ts`：依規則實作。
- `Onboarding.tsx`：依 `step` 渲染：`install` → `InstallGuide`；`moveOut` → 「把熊貓搬到主畫面」三步（①「複製存檔碼」按鈕 ②加入主畫面 ③在主畫面貼上存檔碼）與「先不用」按鈕；`moveIn` → `MoveIn`；`boxPeek` → 紙箱插圖（SVG，熊貓頭從箱口露出，`data-testid="box-peek"`，點擊進入 prologue）；`prologue` → `Dialogue scriptId="prologue" onDone={…nextStep}`；`tutorialHug` 與 `tutorialFeed` 渲染 `Home`（`tutorialHint` prop 顯示提示泡泡：「點她伸出的雙手抱抱她」／「把竹筍糕拖到她嘴邊」，不影響功能）。Onboarding 內部以 `useState` 持有目前步驟（`step` prop 只是初始值），偵測 `hugLog.length` 增加即進入 `tutorialFeed`、`feedLog.length` 增加即進入 `done`。
- `done` 的 `commit` 與 `goTab('map')` 如 Interfaces 所述；`onboardingDone` 寫入 state。
- `App.tsx`：若 `initialStep(...)` 非 null，渲染 `Onboarding`；否則渲染分頁殼層。`initialStep` 的 `ctx` 由 `isIOS()`、`isStandalone()`、`hasProgress(game.value)`、`game.value.onboardingDone` 與 `game.value.settings.installHintCollapsed`（即 `moveOutDismissed`）組成。
- `InstallGuide.tsx`：三步驟 SVG 圖解（Chrome 底部分享圖示、「加入主畫面」列、主畫面圖示），每步有文字說明；不使用外部圖片。
- `MoveIn.tsx`：`<textarea>`（`role="textbox"`）與「貼上存檔碼」按鈕，以及「開始新遊戲」按鈕（`nextStep('moveIn')`）。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src/ui && npm run typecheck`
Expected: PASS。
手動驗收：iPhone Chrome 分頁（無進度）第一個畫面為「把熊貓帶回家」；「先在這裡玩」進入紙箱；紙箱點擊後序章可逐句點擊；完成後落在地圖分頁。

- [ ] **Step 5: 提交**

```bash
git add src/ui
git commit -m "feat(ui): add first-run onboarding, install guide and save move-in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 29: 設定、匯出匯入與備份提醒（`platform/transfer.ts`、`ui/screens/Settings.tsx`）

**Files:**
- Create: `src/platform/transfer.ts`, `src/platform/transfer.test.ts`, `src/ui/screens/Settings.tsx`, `src/ui/screens/Settings.test.tsx`
- Modify: `src/ui/screens/registry.ts`（`OVERLAY_SCREENS.settings = Settings`）、`src/ui/components/InstallHint.tsx`（備份提醒條）

**Interfaces:**
- Consumes: `encodeSaveCode`、`decodeSaveCode`、`serialize`（Task 14）、`maybeBackup`（Task 16）、`now`（Task 15）、`isStandalone`、`isIOS`（Task 18）、`APP_VERSION`（Task 2）、`setSoundEnabled`（Task 17）、`game`、`commit`（Task 19）、`closeOverlay`（Task 19）
- Produces（`platform/transfer.ts`）：
  - `exportFileName(now: number): string`（`panda-save-YYYY-MM-DD.panda`，使用當地日期）
  - `exportBlob(s: GameState): Blob`（`application/json`，內容為 `serialize(s)`）
  - `importCode(code: string, current: GameState, now: number): Promise<{ ok: true; state: GameState } | { ok: false; error: string }>`：先呼叫 `maybeBackup(current, now, true)`（自動備份，無論結果）；`decodeSaveCode` 失敗回傳 `{ ok: false, error: '這個存檔碼看不懂' }` 且不改變 `current`。
  - `shouldRemindBackup(s: GameState, now: number, standalone: boolean): boolean`：`!standalone && now - (s.settings.lastExportAt ?? s.createdAt) > 5 × 24 × 3600_000`。

- [ ] **Step 1: 寫失敗測試**

`src/platform/transfer.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../core/state';
import { encodeSaveCode } from '../core/save';
import { exportFileName, exportBlob, importCode, shouldRemindBackup } from './transfer';

const D = 24 * 3600_000;

describe('匯出', () => {
  it('檔名與內容', async () => {
    expect(exportFileName(new Date(2026, 9, 18, 10).getTime())).toBe('panda-save-2026-10-18.panda');
    const s = createInitialState(9, 0);
    expect(JSON.parse(await exportBlob(s).text()).seed).toBe(9);
  });
});

describe('匯入（規格 10：匯入格式錯誤不覆蓋）', () => {
  it('亂碼回傳錯誤，目前進度不變', async () => {
    const cur = createInitialState(1, 0);
    const out = await importCode('亂碼', cur, 0);
    expect(out).toEqual({ ok: false, error: '這個存檔碼看不懂' });
    expect(cur.seed).toBe(1);
  });
  it('有效存檔碼回傳新狀態', async () => {
    const other = createInitialState(2, 0);
    const out = await importCode(encodeSaveCode(other), createInitialState(1, 0), 0);
    expect(out.ok && out.state.seed).toBe(2);
  });
});

describe('備份提醒（規格 8.3）', () => {
  it('非主畫面、超過 5 天未匯出才提醒', () => {
    const s = { ...createInitialState(1, 0), settings: { sound: true, lastExportAt: 0, installHintCollapsed: false } };
    expect(shouldRemindBackup(s, 5 * D, false)).toBe(false);
    expect(shouldRemindBackup(s, 6 * D, false)).toBe(true);
    expect(shouldRemindBackup(s, 6 * D, true)).toBe(false);
  });
});
```

`src/ui/screens/Settings.test.tsx`：
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { Settings } from './Settings';
import { APP_VERSION } from '../../version';

beforeEach(() => { game.value = createInitialState(5, 0); });

describe('Settings', () => {
  it('音效開關寫入 settings.sound', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('checkbox', { name: '音效' }));
    expect(game.value.settings.sound).toBe(false);
  });
  it('顯示版本號與安裝狀態', () => {
    render(<Settings />);
    expect(screen.getByText(new RegExp(APP_VERSION))).toBeTruthy();
    expect(screen.getByText(/安裝狀態/)).toBeTruthy();
  });
  it('匯入需先確認，確認文字包含取代警示', () => {
    render(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: '匯入存檔碼' }));
    expect(screen.getByText('會取代目前的熊貓，要繼續嗎？')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npx vitest run src/platform/transfer.test.ts src/ui/screens/Settings.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 實作**

- `transfer.ts`：依 Interfaces 實作。`exportBlob` 使用 `new Blob([serialize(s)], { type: 'application/json' })`。
- `Settings.tsx`：
  - 音效 `<input type="checkbox">`（`aria-label="音效"`），切換寫入 `settings.sound` 並呼叫 `setSoundEnabled`。
  - 「匯出存檔」：iOS 且 `navigator.canShare?.({ files })` 為真時以 Web Share 分享 `.panda`；否則建立下載連結；同時顯示存檔碼（`encodeSaveCode`）與「複製存檔碼」按鈕；成功後 `settings.lastExportAt = now()` 並 `commit`。
  - 「匯入存檔碼」：按下後顯示確認對話「會取代目前的熊貓，要繼續嗎？」，確認後 `importCode`；成功 `commit(state)`；失敗顯示錯誤文字。
  - 「加入主畫面說明」：顯示目前是否已加入（`isStandalone()`：「已加入主畫面」／「尚未加入主畫面」）並展開 `InstallGuide`（Task 28）。
  - 版本號：`熊貓成長記 · 版本 {APP_VERSION}`。
- `InstallHint.tsx`：`shouldRemindBackup` 為真時顯示「幫熊貓備份一下」溫和提醒，點擊開啟設定。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npx vitest run src && npm run typecheck`
Expected: PASS。
手動驗收：設定頁版本號為 git 短 hash；匯入錯誤碼時頁面顯示錯誤且進度不變；在 iPhone 上匯出時出現分享面板。

- [ ] **Step 5: 提交**

```bash
git add src/platform/transfer.ts src/platform/transfer.test.ts src/ui
git commit -m "feat: add settings with export, import, install status and backup reminder

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 30: 端對端 smoke 與持久化（`playwright.config.ts`、`e2e/`）

**Files:**
- Create: `playwright.config.ts`, `e2e/fixtures.ts`, `e2e/home-smoke.spec.ts`, `e2e/persistence.spec.ts`
- Modify: `package.json`（確認 `test:e2e` 指令）、必要的 `data-testid` 加入 `ui` 元件

**Interfaces:**
- Consumes: 全部 UI（Task 19–29）
- Produces：E2E 專案 `mobile-chromium`、`mobile-webkit`（`devices['iPhone 13']`，視窗 390×844）、`desktop-chromium`（1280×800）、`desktop-webkit`；`webServer` 使用 `npm run build && npm run preview -- --port 4173 --strictPort`；`baseURL: 'http://localhost:4173/'`。

- [ ] **Step 1: 寫失敗測試**

`e2e/fixtures.ts`：
```ts
import type { Page } from '@playwright/test';
import { createInitialState, type GameState } from '../src/core/state';

// 在頁面載入前寫入存檔；只在 localStorage 還沒有 panda.save 時寫入，重新整理不會覆蓋進度（契約 10.17）。
export async function seedSave(page: Page, patch: Partial<GameState> = {}): Promise<void> {
  const state: GameState = { ...createInitialState(4242, Date.now()), onboardingDone: true, ...patch };
  const json = JSON.stringify(state);
  await page.addInitScript((payload: string) => {
    try {
      if (localStorage.getItem('panda.save') === null) localStorage.setItem('panda.save', payload);
    } catch { /* 私密視窗或被封鎖時略過 */ }
  }, json);
}
```

`e2e/home-smoke.spec.ts`：
```ts
import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';

test('家的照顧循環：抱抱、餵食、切到窗外分頁', async ({ page }) => {
  await seedSave(page);
  await page.goto('./');
  await page.getByTestId('care-hug').click();
  await page.getByTestId('care-feed').click();
  await page.getByTestId('tray-food-bamboo-cake').dragTo(page.getByTestId('panda-mouth'));
  await expect(page.getByRole('meter', { name: '肚子' })).toHaveAttribute('aria-valuenow', '95');
  await page.getByTestId('tab-map').click();
  await expect(page.getByTestId('tab-map')).toHaveAttribute('aria-current', 'page');
});

test('新遊戲引導：iPhone 先點「先在這裡玩」，再開箱、看序章、抱抱與餵食後落在窗外分頁', async ({ page }) => {
  await page.goto('./'); // 沒有存檔 → 引導
  const playHere = page.getByRole('button', { name: '先在這裡玩' });
  if (await playHere.count()) await playHere.click();
  await page.getByTestId('box-peek').click();
  for (let i = 0; i < 12 && (await page.getByTestId('dialogue-box').count()); i++) {
    await page.getByTestId('dialogue-next').click();
  }
  await page.getByTestId('care-hug').click();
  await page.getByTestId('care-feed').click();
  await page.getByTestId('tray-food-bamboo-cake').dragTo(page.getByTestId('panda-mouth'));
  await expect(page.getByTestId('tab-map')).toHaveAttribute('aria-current', 'page');
});

test('版面沒有水平捲動', async ({ page }) => {
  await seedSave(page);
  await page.goto('./');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
```

`e2e/persistence.spec.ts`：
```ts
import { test, expect } from '@playwright/test';
import { seedSave } from './fixtures';

test('重新整理後進度仍在', async ({ page }) => {
  await seedSave(page);
  await page.goto('./');
  await page.getByTestId('care-hug').click();
  await page.waitForTimeout(1200); // 規格：狀態改變後 1 秒寫入
  const before = await page.evaluate(() => localStorage.getItem('panda.save'));
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('panda.save'))).toBe(before);
});

test('切到背景立即寫入（visibilitychange hidden），重新載入後心情保留', async ({ page }) => {
  await seedSave(page);
  await page.goto('./');
  await page.getByTestId('care-hug').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('panda.save')!).needs.mood)).toBe(95);
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('panda.save')!).needs.mood)).toBe(95);
});
```

- [ ] **Step 2: 執行，預期 FAIL**

Run: `npm run test:e2e`
Expected: FAIL（`box-peek`、`food-bamboo-cake`、`panda-mouth` 等 testid 尚未全部存在，或引導流程尚未接通）。

- [ ] **Step 3: 實作**

1. `playwright.config.ts`：如 Interfaces 所述；`projects` 四個；`use: { trace: 'on-first-retry' }`。
2. 本計畫負責的 test id（契約 10.17）：`tab-<Tab>`（Task 19）、`care-feed`／`care-bath`／`care-play`／`care-hug`（Task 22–23）、`tray-<itemId>`（Task 23 的 FeedTray；食物 id 為 `tray-food-bamboo-cake` 等，不再使用 `food-<id>`）、`panda-mouth`／`panda-body`（Task 20）、`box-peek`（Task 28）、`dialogue-box`／`dialogue-next`（Task 26）、`overlay-close`（Task 19）、`placed-<uid>`（Task 22 的 RoomView）。`giftbox-open`、`layout-toggle`、`room-cell-<x>-<y>`、`inventory-<itemId>`、`map-node-<id>`、`hotspot-<id>` 屬計畫 B／C，本計畫的 E2E 不使用。
3. 執行 `npx playwright install chromium webkit`。
4. 若 E2E 在某個 project 失敗，只修 UI 的對應問題，不為測試新增後門（例如不得新增 `?skipOnboarding` 參數）。
5. 行為註記：`dragTo` 會模擬 pointer 事件；若在 WebKit 上拖曳不觸發，需確認 `FeedTray` 使用 Pointer Events 而非 HTML5 drag-and-drop。

- [ ] **Step 4: 執行，預期 PASS**

Run: `npm run test:e2e`
Expected: 四個 project 全部 PASS（WebKit 的結果不代表 iOS 真機，見 Step 5）。

- [ ] **Step 5: 提交與真機驗收**

```bash
git add playwright.config.ts e2e src
git commit -m "test(e2e): add home loop smoke and persistence flush tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

真機矩陣（女兒的 iPhone，iOS 16.4+；Playwright 不能代表真機）：
- Chrome 分頁：引導「把熊貓帶回家」、「先在這裡玩」、序章逐句、完成後落在地圖分頁。
- 加入主畫面後開啟：無進度時出現搬家／新遊戲；貼上分頁的存檔碼後進度正確。
- 切換 App 後回來：存檔保留（visibilitychange 寫入）。
- 離線後重新開啟（至少 13 小時或以假時鐘）：睡覺、點擊醒來。
- 安全區域與瀏海：頂部警示與底部導覽不被遮住。
- 效能：家畫面與拖曳時 ≥ 50fps（Safari 開發者工具時間軸）。

---

## Self-Review

### 規格覆蓋表（本計畫負責的部分）

| 規格段落 | 內容 | 任務 |
|---|---|---|
| 1 設計原則 | 不給壓力、無付費、9 歲文案 | Global Constraints；Task 5、13、26 文案 |
| 2 外觀、成長外觀、名字 | 毛色、眼圈、項圈、姿勢、4 階縮放、光澤 | Task 20、21 |
| 3.1 畫面與導覽 | 底部 5 分頁、電腦版置中 | Task 19 |
| 3.2 核心循環 | 照顧→指標→元氣→換地點（地點為 B、C） | Task 22–23（照顧部分） |
| 3.3 貨幣 | 星砂、棉花糖欄位 | Task 4、7 |
| 3.4 新遊戲初始狀態 | 全表 | Task 4、5 |
| 3.4 第一次啟動流程 | 引導、序章、抱抱與餵食、去地圖 | Task 26、28 |
| 4.1 有效照顧 | 指標 <100、+25、抱抱上限 | Task 11 |
| 4.2 成長值與刻度 | 公式、累積表、階段公式、預估 | Task 6 |
| 4.3 成長階段 | 1–8 固定名稱、9+ 組合稱號、升階送禮盒與慶祝 | Task 5、6、7、26 |
| 4.4 項圈金鏈 | 環數、欄位、24 環與 ×N、粗細 5 級 | Task 6、21 |
| 4.5 獎勵數值 | 有效照顧、升階與食譜獎勵 | Task 7、11、12 |
| 5.1 指標與元氣 | 衰減、下限 30、元氣回復、72 小時、時間倒退 | Task 8 |
| 5.2 照顧互動（餵食、料理、洗澡、玩耍、抱抱） | 拖曳、料理、覆蓋率 70%、三種玩耍、抱抱 | Task 12、23、24 |
| 5.2 打嗝 | 3 分鐘內第 4 個 | Task 12、25 |
| 5.3 情緒狀態 | 優先順序、睡覺、醒來 | Task 10、27 |
| 5.4 小驚喜（7 種，不含朋友來訪） | 戳戳、噴嚏、藏食物、害羞、夢話、項圈、日記 | Task 13、25 |
| 5.4 朋友來訪 | 屬 Plan B | 不在本計畫 |
| 5.4 離線超過 24 小時 | 歡迎畫面、30 星砂、一封信 | Task 8、27 |
| 7.3 拍照／存到手機 | **依使用者指示「存到手機先預留，不設計」**：僅建立 `photos` 儲存區，不做匯出、分享或下載 UI；拍照本身屬 Plan C | Task 15（儲存區） |
| 8.1 技術與觸控、版面、PWA、效能 | 腳手架、viewport、CSS、Pointer Events、PWA prompt | Task 1、18、19、23 |
| 8.2 模組結構 | `core`、`content`、`panda`、`ui`、`platform` | 各任務 Files |
| 8.3 存檔位置與寫入時機 | localStorage、backups、archive、1 秒去抖、visibilitychange／pagehide | Task 16、19 |
| 8.3 讀取與還原、版本、唯讀 | 備份還原、corrupt 鍵、遷移、too-new | Task 14、16 |
| 8.3 iOS 限制與對策 | 把熊貓帶回家、分頁有進度時的搬家流程（moveOut）、角落提示、5 天備份提醒、`navigator.storage.persist()`、「已從備份還原」提示 | Task 18、19、28、29 |
| 8.3 匯出匯入 | 檔案與存檔碼、Web Share、自動備份、錯誤不覆蓋 | Task 14、29 |
| 8.3 錯誤處理 | localStorage 失敗橫幅、1MB 警示 | Task 16、19 |
| 8.4 部署 | GitHub Actions、Pages、HEIC 排除 | Task 1、2 |
| 9 每日規則 | `lastDailyDate`、倒退不重複、跨時區 | Task 8、9 |
| 10 錯誤處理 | 全部列於 Task 16、19、14、29 | 各任務 |
| 11 測試（A 範圍） | 照顧、衰減、元氣、情緒、存檔、E2E | 各任務測試與 Task 30 |
| 12 MVP（A 範圍） | 熊貓、四種照顧＋料理、5 情緒、8 驚喜（7）、日記、階段 1–4 內容 | Task 5–27 |

### 本計畫有意留給其他計畫或之後版本

- 朋友來訪、朋友好感與信件來源（Plan B）；地點、地圖生成、冒險、主線章節與小傳說（Plan B）。
- 衣櫃、禮盒機、棉花糖小舖、相簿、物品圖鑑、貼紙與相框完整內容、拍照模式、收集里程碑、房間自由擺放與臥室編輯（Plan C）。
- 階段 2 的 `RoomView` 擴充為可編輯布置（Plan C）；成長紀念照與傳說卡（Plan C 監聽 `stageUp`／`storyBeat` 事件）。
- 「存到手機」功能：依使用者要求只保留 `photos` 儲存區，未設計 UI；日後實作時可在 Plan C 的相簿加入。
- `navigator.storage.persist()`：已於 Task 19 的 `main.tsx` 啟動時呼叫（try/catch，失敗忽略）。
- 地點與朋友的對話腳本（`ch1`–`ch5`、小傳說、朋友故事線）由 Plan B 登記到 `SCRIPTS`。

### 本計畫在契約未定義處所做的決定

1. `saveGame(s): void` 保持契約簽名；封存切分由 `store.commit` 先行處理（`splitArchive` → `archiveItems`），而非由 `saveGame` 回傳。
2. `flushOnHide()` 保持無參數，改以 `setStateSource(getter)` 注入目前狀態。
3. `maybeBackup` 新增可選參數 `force`（匯入前自動備份使用）。
4. `validateShape` 與 `migrations`、`splitArchive`、`archiveItems`、`setReadOnly`、`setStateSource`、`installFlushListeners`、`chainThickness`、`scaleForStage`、`recordVisit`、`welcomeBack`、`offlineMs`、`canCook`、`isNearMouth`、`bathDone`、`recordPoke` 等皆為**新增匯出**，不改動既有簽名。
5. `lastVisitedSummary` 語意：一天之內累積，`runDaily` 先執行 handler（日記引用前一天內容），最後清空。
6. 料理結果的背包 id：食譜為 `recipe-*`，謎之料理為 `food-mystery`；`feed` 接受這些 id。
7. 食物不論指標是否已滿都會被消耗（沒有獎勵而已）。
8. `cook` 在食材不足時 `throw`，`canCook` 為 UI 守門。
9. 歡迎回來信件由 `welcomeBack` 寫入，寄件人為棉花；內容文字於 `content/letters.ts`。
10. 睡覺醒來狀態由 `justOpenedAfterMs` signal 持有，點熊貓即清為 `null`。
11. 規格 5.4 列出 8 種驚喜、其中朋友來訪屬 Plan B，因此本計畫實作 7 種。
12. 熊貓配色採用 Task 1 的 CSS 變數（`--fur: #E9DFCF` 等）為初始值，需與女兒的照片比對後微調。
13. 圖示與 PNG 產生使用 `@resvg/resvg-js`（超出契約的開發依賴清單，僅用於產生 `public/*.png`）。
14. 提交訊息的 Co-Authored-By 依本任務指定使用 `Claude Opus 5.5`。
15. **交叉審查修正（依契約 §10）**：
    - 朋友好感等級只在 `core/friendLevel.ts`（Task 6b）實作，公式 `10 × (L−1) × L`；`levelOf(19)=1`、`levelOf(20)=2`、`levelOf(60)=3`、`levelOf(120)=4`。
    - 食物與食材 ID 清單 `FOOD_IDS`、`INGREDIENT_IDS` 由 A 匯出；星空蘋果 id 為 `food-starry-apple`；食材 4 common、2 shiny。
    - 初始物品的禮盒池：家具三件為 `inGiftPool: true`，牆紙、地板、墜飾為 `false`；A 不建立任何貼紙（貼紙由 C 的 `sticker-01`…`sticker-24` 提供，日記貼紙清單為空時隱藏按鈕）。
    - `content/items/index.ts` 由 A 建立並匯出 `ITEMS` 與 `ITEM_BY_ID`，C 必須保留。
    - 日記每日處理器直接列在 `core/daily.ts` 的 `dailyHandlers` 陣列；不提供 `registerDailyHandler`，不靠副作用 import。
    - 點醒熊貓設定 `awakeUntil = now + 30 分鐘`，`moodOf` 在此期間跳過睡覺判斷（夜裡可以叫醒）。
    - 食物餵食與料理都呼叫 `recordVisit`；B 的地點完成也必須呼叫。
    - 月亮鈴鐺（`pendant-moon-bell`）：日記產生器改用夢境句（「夢裡：」前綴）；打嗝夢話也寫入日記；`shouldHiccup` 門檻從 > 3 降為 > 2（契約 10.11、規格 7.2）。
    - 餵食盤／洗澡／玩耍／料理台由 Home 的本地狀態開關，`Overlay` 聯集不新增 `care`。
    - 熊貓姿勢表 `POSE_TABLE` 對 29 個姿勢全部給定數值；移除 `spit`（不是姿勢）。食物反應對應：竹筍糕 `patBelly`、草莓麻糬 `blush`、酸梅 `sour`、星空蘋果 `starEyes`。
    - 想睡提示文字「抱抱我、餵我吃點東西」；撒嬌時指標旁顯示 🥺；洗澡每塗一格以 `burst('water')` 灑水滴。
    - 劇情：App 以 `useSignalEffect` 監看 `pendingBeat` 並開啟對話；關閉一律經 `dismissOverlay` 清除 pendingBeat；`resolveScript`／`registerScriptResolver` 讓 B 解析 `legend-*`。
    - 時鐘與亂數規則：UI、核心與平台層不可呼叫 `Date.now()`／`new Date()`（`platform/clock.ts` 例外），全專案禁用 `Math.random()`；測試 `core/purity.test.ts` 會檢查。
    - 分頁有進度的 iOS 玩家會看到「把熊貓搬到主畫面」（moveOut）流程；「先不用」沿用 `settings.installHintCollapsed` 作為已關閉旗標。
    - E2E 使用 `seedSave` 寫入存檔，不經過引導；test id 依契約 10.17。
16. 已依交叉審查修正（不影響 A 範圍外的任務）：B 的 `addAffinity`、朋友家具、朋友信件、地點 `complete` 與 nodePositions 等由 B 計畫處理，本計畫只提供 `recordVisit`、`levelOf`、`resolveScript` 等 A 的介面。

### 契約問題（回報給協調者）

- 契約 §5 的 `care`、`feed` 未定義「食物在指標已滿時是否消耗」與「料理結果如何進入餵食」；本計畫已定義（見上）。Plan B 與 C 請沿用。
- 契約 §5 的 `cook` 回傳 `'mystery'`，但未說明謎之料理的背包 id；本計畫定為 `food-mystery`（與 `content/foods.ts` 一致）。
- 契約 §5 未定義 `lastVisitedSummary` 的生命週期；本計畫定為「當天累積、每日結算後清空」，Plan B 的 `complete` 必須呼叫 `recordVisit`。
- 契約 §9 `flushOnHide()` 無參數，但它需要狀態來源；本計畫以 `setStateSource` 解決，建議契約補上此函式。
- 契約 §9 的 `saveGame` 無法回報寫入失敗給 UI；本計畫以 `saveFailed` signal 解決。
- 契約 §3 `GameState.hugLog` 等紀錄陣列為 number[]，但未說明修剪責任；本計畫由各 `care` 函式修剪。

