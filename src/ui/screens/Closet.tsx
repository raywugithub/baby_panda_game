import { useState } from 'preact/hooks';
import { Dress } from './closet/Dress';

// 衣櫃分段：換裝（本任務）；布置由 Task 20 加入。
type Segment = 'dress';
const SEGMENTS: { key: Segment; label: string }[] = [{ key: 'dress', label: '換裝' }];

export function Closet() {
  const [seg, setSeg] = useState<Segment>('dress');
  return (
    <div class="closet">
      <div class="closet-segments" role="group" aria-label="衣櫃分段">
        {SEGMENTS.map(s => (
          <button
            type="button"
            key={s.key}
            aria-pressed={seg === s.key}
            onClick={() => setSeg(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {seg === 'dress' ? <Dress /> : null}
    </div>
  );
}
