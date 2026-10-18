import { useState } from 'preact/hooks';

/** 加入主畫面的三步圖解（純 SVG，不用外部圖片）。 */
export function InstallGuide({ onPlayHere }: { onPlayHere: () => void }) {
  const [note, setNote] = useState<string | null>(null);

  return (
    <section class="install-guide" aria-label="加入主畫面教學">
      <ol class="install-steps">
        <li>
          <svg viewBox="0 0 120 40" width="120" height="40" role="img" aria-label="分享圖示">
            <rect x="4" y="6" width="112" height="28" rx="8" fill="#f4f1ea" stroke="#6b6b6b" />
            <path d="M52 16 L60 8 L68 16 M60 8 V24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" />
            <rect x="48" y="20" width="24" height="12" rx="2" fill="none" stroke="#333" stroke-width="2" />
          </svg>
          <p>① 點底部的「分享」圖示</p>
        </li>
        <li>
          <svg viewBox="0 0 120 40" width="120" height="40" role="img" aria-label="加入主畫面列">
            <rect x="4" y="4" width="112" height="32" rx="8" fill="#f4f1ea" stroke="#6b6b6b" />
            <rect x="14" y="14" width="10" height="12" rx="2" fill="#7bbf8e" />
            <text x="32" y="25" font-size="13" fill="#333">加入主畫面</text>
          </svg>
          <p>② 向下找到「加入主畫面」</p>
        </li>
        <li>
          <svg viewBox="0 0 120 40" width="120" height="40" role="img" aria-label="主畫面圖示">
            <rect x="46" y="4" width="28" height="28" rx="7" fill="#e9a86b" />
            <circle cx="60" cy="16" r="6" fill="#fff" />
          </svg>
          <p>③ 之後從主畫面的熊貓圖示開啟</p>
        </li>
      </ol>
      <div class="install-actions">
        <button type="button" onClick={onPlayHere}>先在這裡玩</button>
        <button type="button" onClick={() => setNote('請從主畫面的熊貓圖示開啟熊貓')}>我加好了，開啟熊貓</button>
      </div>
      {note ? <p role="status">{note}</p> : null}
    </section>
  );
}
