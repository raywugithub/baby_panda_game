import { useEffect, useState } from 'preact/hooks';
import { Panda } from '../../panda/Panda';
import { currentStage } from '../../core/growth';
import type { FriendId } from '../../core/state';
import { resolveScript, type DialogueScript } from '../../content/story';
import { game, dismissOverlay } from '../store';
import { now } from '../../platform/clock';
import { recordLegend } from './legendRecord';
import { SceneIllustration } from '../../art/scenes/LocationScene';
import type { Overlay } from '../nav';

const FRIEND_NAMES: Record<FriendId, string> = {
  mianhua: '棉花',
  juzi: '橘子',
  manman: '慢慢',
  gulu: '咕嚕',
};

export interface DialogueProps {
  scriptId: string;
  /** 直接提供的腳本（例如地點的臨時對話）；未提供時依 scriptId 查詢。 */
  script?: DialogueScript;
  onDone?: () => void;
}

/** 一次顯示一句；點擊對話框或「下一句」推進，最後一句再點擊呼叫 onDone。 */
export function Dialogue({ scriptId, script: given, onDone }: DialogueProps) {
  const s = game.value;
  const script = given ?? resolveScript(scriptId, s.seed);
  const [index, setIndex] = useState(0);

  // 開啟小傳說時把它存成回憶照片的傳說卡（同 id 覆寫，重複開啟無妨）。
  useEffect(() => {
    const m = /^legend-(\d+)$/.exec(scriptId);
    if (m) void recordLegend(s.seed, Number(m[1]), now()).catch(() => {});
  }, [scriptId]);

  // 查無腳本時直接結束，避免卡住。
  useEffect(() => {
    if (script === null) onDone?.();
  }, [script]);

  if (script === null) return null;

  const line = script.lines[Math.min(index, script.lines.length - 1)];
  const isLast = index >= script.lines.length - 1;

  function advance(e?: Event) {
    e?.stopPropagation();
    if (isLast) onDone?.();
    else setIndex(index + 1);
  }

  const pose = line.pose ?? 'sit';
  const side = line.speaker === 'narrator' ? 'narration' : line.speaker === 'panda' ? 'left' : 'right';
  const name = line.speaker === 'panda' || line.speaker === 'narrator' || line.speaker === 'passerby'
    ? null
    : FRIEND_NAMES[line.speaker];

  return (
    <div class="dialogue">
      <div class="dialogue-panda">
        <Panda
          pose={pose}
          stage={currentStage(s)}
          outfit={s.equipped.outfit}
          pendants={s.equipped.pendants}
          chainLinks={s.chainLinks}
          size={180}
        />
      </div>
      {script.illustration && (
        <div class="dialogue-scene" data-testid="dialogue-illustration">
          <SceneIllustration id={script.illustration} />
        </div>
      )}
      <div class="dialogue-box" data-testid="dialogue-box" data-side={side} onClick={() => advance()}>
        {name !== null && <p class="dialogue-name">{name}</p>}
        <p class={side === 'narration' ? 'dialogue-text narration' : 'dialogue-text'}>{line.text}</p>
        <button type="button" data-testid="dialogue-next" onClick={advance}>
          {isLast ? '結束' : '下一句'}
        </button>
      </div>
    </div>
  );
}

/** 覆蓋層入口：由 registry 掛載，關閉一律經 dismissOverlay（契約 10.8）。 */
export function DialogueOverlay({ overlay }: { overlay: Overlay }) {
  if (overlay.kind !== 'dialogue') return null;
  return <Dialogue scriptId={overlay.scriptId} onDone={dismissOverlay} />;
}
