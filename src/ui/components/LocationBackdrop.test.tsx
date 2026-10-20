import { render } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { LocationBackdrop } from './LocationBackdrop';
import { game } from '../store';
import { fresh, handmadeNode } from '../../core/test-helpers';

describe('LocationBackdrop', () => {
  it('renders the node scene with no hotspot buttons', () => {
    const s = fresh();
    game.value = s;
    const id = handmadeNode(s, 'bamboo-path').id;
    const { container } = render(<LocationBackdrop nodeId={id} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('[data-testid^="hotspot-"]')).toHaveLength(0);
  });
});
