import { game, commit } from '../store';
import { now } from '../../platform/clock';
import { leaveVisit } from '../../core/adventureDaily';
import { FRIENDS } from '../../content/friends';

/** 朋友來訪卡：有進行中的來訪時顯示朋友名字與「送客」，沒有時不渲染。 */
export function VisitorCard() {
  const { visitor, visitorDone } = game.value.daily;
  if (visitor === null || visitorDone) return null;
  const friend = FRIENDS.find(f => f.id === visitor);
  if (!friend) return null;

  function onLeave() {
    const out = leaveVisit(game.value, now());
    if (out) commit(out);
  }

  return (
    <section class="card visitor-card" data-testid="visitor-card">
      <p>
        <strong>{friend.name}</strong>（{friend.title}）來家裡坐坐了。
      </p>
      <button type="button" class="visitor-leave" onClick={onLeave}>送客</button>
    </section>
  );
}
