import { useState } from 'preact/hooks';
import { decodeSaveCode } from '../../core/save';
import type { GameState } from '../../core/state';

export interface MoveInProps {
  onImported: (s: GameState) => void;
  onNewGame: () => void;
}

/** 主畫面第一次開啟：貼上存檔碼搬家，或直接開始新遊戲。失敗時不動任何進度。 */
export function MoveIn({ onImported, onNewGame }: MoveInProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function paste() {
    const s = decodeSaveCode(code.trim());
    if (s === null) {
      setError('這個存檔碼看不懂');
      return;
    }
    setError(null);
    onImported(s);
  }

  return (
    <section class="move-in">
      <p class="onb-lead">如果你之前在瀏覽器玩過，把存檔碼貼在這裡，熊貓就會跟著搬過來。</p>
      <ol class="step-list">
        <li class="step-item">
          <span class="step-badge" aria-hidden="true">1</span>
          <span class="step-text">把複製好的存檔碼貼進下面的方框</span>
        </li>
        <li class="step-item">
          <span class="step-badge" aria-hidden="true">2</span>
          <span class="step-text">按「貼上存檔碼」，熊貓就搬過來</span>
        </li>
      </ol>
      <textarea
        class="move-in-code"
        role="textbox"
        aria-label="存檔碼"
        value={code}
        onInput={e => setCode((e.currentTarget as HTMLTextAreaElement).value)}
      />
      {error ? <p class="onb-note onb-error" role="alert">{error}</p> : null}
      <div class="onb-actions">
        <button type="button" class="btn-primary" onClick={paste}>貼上存檔碼</button>
        <button type="button" class="btn-secondary" onClick={onNewGame}>開始新遊戲</button>
      </div>
    </section>
  );
}
