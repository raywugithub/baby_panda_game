import { useState } from 'preact/hooks';

/** 加入主畫面的三步圖解（SVG 插圖；第三步用 public 內的真實 App 圖示）。每步只有一個數字徽章。 */
export function InstallGuide({ onPlayHere }: { onPlayHere: () => void }) {
  const [note, setNote] = useState<string | null>(null);

  return (
    <section class="install-guide" aria-label="加入主畫面教學">
      <ol class="install-steps">
        <li class="step-item">
          <span class="step-badge" aria-hidden="true">1</span>
          <div class="step-body">
            <svg class="step-art" viewBox="0 0 160 56" role="img" aria-label="瀏覽器底部工具列的分享圖示">
              <rect x="2" y="4" width="156" height="48" rx="14" fill="#ffffff" stroke="#cfc6b6" stroke-width="2" />
              <path d="M30 22 L24 28 L30 34" fill="none" stroke="#9a9184" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M130 22 L136 28 L130 34" fill="none" stroke="#9a9184" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="80" cy="28" r="20" fill="#F3DFA6" />
              <path d="M72 25 H70 V40 H90 V25 H88" fill="none" stroke="#2A2826" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M80 34 V18 M75 23 L80 18 L85 23" fill="none" stroke="#2A2826" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p>點底部的「分享」圖示</p>
          </div>
        </li>
        <li class="step-item">
          <span class="step-badge" aria-hidden="true">2</span>
          <div class="step-body">
            <svg class="step-art" viewBox="0 0 160 56" role="img" aria-label="選單中的加入主畫面列">
              <rect x="2" y="4" width="156" height="48" rx="14" fill="#ffffff" stroke="#cfc6b6" stroke-width="2" />
              <rect x="14" y="13" width="30" height="30" rx="8" fill="#7bbf8e" />
              <path d="M29 20 V36 M21 28 H37" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
              <text x="56" y="33" font-size="15" font-weight="700" fill="#2A2826">加入主畫面</text>
            </svg>
            <p>向下找到「加入主畫面」</p>
          </div>
        </li>
        <li class="step-item">
          <span class="step-badge" aria-hidden="true">3</span>
          <div class="step-body">
            <img class="step-app-icon" src="./pwa-192.png" alt="熊貓圖示" width="64" height="64" />
            <p>之後從主畫面的熊貓圖示開啟</p>
          </div>
        </li>
      </ol>
      <div class="onb-actions">
        <button type="button" class="btn-primary" onClick={() => setNote('請從主畫面的熊貓圖示開啟熊貓')}>
          我加好了，開啟熊貓
        </button>
        <button type="button" class="btn-secondary" onClick={onPlayHere}>先在這裡玩</button>
      </div>
      {note ? <p class="onb-note" role="status">{note}</p> : null}
    </section>
  );
}
