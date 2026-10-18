import { useState } from 'preact/hooks';
import { Dress } from './closet/Dress';
import { Decorate } from './closet/Decorate';

// 衣櫃分段：換裝、布置。
type Segment = 'dress' | 'decorate';
const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'dress', label: '換裝' },
  { key: 'decorate', label: '布置' },
];

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
      {seg === 'dress' ? <Dress /> : <Decorate />}
    </div>
  );
}
