import { computed, useComputed, type ReadonlySignal } from '@preact/signals';
import { game } from '../store';
import type { NeedKey } from '../../core/state';

const LOW = 50;

/** 單一指標條：數值與寬度都以 signal 精細訂閱，不重建整個畫面。 */
function Gauge({ label, value, iconKey }: { label: string; value: ReadonlySignal<number>; iconKey?: NeedKey }) {
  const low = useComputed(() => value.value < LOW);
  const shown = useComputed(() => Math.round(value.value));
  return (
    <div class="gauge">
      <span class="gauge-label">
        {label}
        {iconKey && low.value ? <span data-testid={`need-icon-${iconKey}`} aria-hidden="true"> 🥺</span> : null}
      </span>
      <div class="meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={shown}>
        <i style={{ width: `${value.value}%` }} />
      </div>
      <span class="gauge-value">{shown}</span>
    </div>
  );
}

const tummy = computed(() => game.value.needs.tummy);
const clean = computed(() => game.value.needs.clean);
const mood = computed(() => game.value.needs.mood);
const energy = computed(() => game.value.energy);

export function Needs() {
  return (
    <div class="needs">
      <Gauge label="肚子" value={tummy} iconKey="tummy" />
      <Gauge label="香香" value={clean} iconKey="clean" />
      <Gauge label="心情" value={mood} iconKey="mood" />
      <Gauge label="元氣" value={energy} />
    </div>
  );
}
