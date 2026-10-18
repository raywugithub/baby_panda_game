// src/art/items/art.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { ITEMS } from '../../content/items';
import { ITEM_ART } from './index';

describe.each(['furniture', 'friend', 'outfit', 'pendant', 'wall', 'floor', 'ingredient', 'sticker', 'frame'])('art %s', (group) => {
  it('every item in the group has an SVG component that renders', () => {
    const match = (i: { id: string; category: string }) =>
      group === 'friend' ? i.id.startsWith('furn-mianhua') || i.id.startsWith('furn-juzi') || i.id.startsWith('furn-manman') || i.id.startsWith('furn-gulu')
      : group === 'furniture' ? i.category === 'furniture' && !/^furn-(mianhua|juzi|manman|gulu)/.test(i.id)
      : i.category === group;
    for (const item of ITEMS.filter(match)) {
      const C = ITEM_ART[item.id];
      expect(C, item.id).toBeDefined();
      const { container, unmount } = render(<C size={64} />);
      expect(container.querySelector('svg'), item.id).not.toBeNull();
      unmount();
    }
  });
});
