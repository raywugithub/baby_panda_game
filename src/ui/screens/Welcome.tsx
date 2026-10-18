import { Panda } from '../../panda/Panda';
import { currentStage } from '../../core/growth';
import { game, dismissOverlay } from '../store';
import type { Overlay } from '../nav';

/** 離線超過 24 小時後打開：熊貓跑過來迎接，禮物（30 星砂與一封信）已由 welcomeBack 寫入。 */
export function Welcome(_props: { overlay?: Overlay }) {
  const s = game.value;
  return (
    <section class="welcome" aria-labelledby="welcome-title">
      <div class="welcome-run-in">
        <Panda
          pose="hug"
          stage={currentStage(s)}
          outfit={s.equipped.outfit}
          pendants={s.equipped.pendants}
          chainLinks={s.chainLinks}
          size={200}
        />
      </div>
      <h2 id="welcome-title">你回來了！</h2>
      <p>熊貓想你了，這是它準備的小禮物：30 星砂＋一封信</p>
      <button type="button" onClick={dismissOverlay}>收下</button>
    </section>
  );
}
