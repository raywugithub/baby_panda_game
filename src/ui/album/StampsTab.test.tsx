import { render } from '@testing-library/preact';
import { describe, it, expect, beforeEach } from 'vitest';
import { StampsTab } from './StampsTab';
import { game } from '../store';
import { fresh, handmadeNode } from '../../core/test-helpers';

describe('StampsTab', () => {
  beforeEach(() => { game.value = fresh(); });
  it('stamps only done nodes and adds a star when the secret was found', () => {
    const s = fresh();
    const id = handmadeNode(s, 'bamboo-path').id;
    game.value = { ...s, map: { ...s.map, nodes: s.map.nodes.map(n => n.id === id ? { ...n, status: 'done', secretFound: true } : n) } };
    const { getByTestId, queryByTestId } = render(<StampsTab />);
    expect(getByTestId(`stamp-${id}`).textContent).toContain('★');
    expect(queryByTestId(`stamp-${id + 1000}`)).toBeNull();
  });
  it('clue list shows unfound clues until their chapter is triggered', () => {
    game.value = { ...game.value, storyBeats: ['ch1'] };
    const { getByTestId } = render(<StampsTab />);
    expect(getByTestId('clue-1').textContent).not.toContain('還沒找到');
    expect(getByTestId('clue-2').textContent).toContain('還沒找到');
  });
});
