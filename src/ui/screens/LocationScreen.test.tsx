import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocationScreen } from './LocationScreen';
import { game, eventQueue } from '../store';
import { overlay } from '../nav';
import { fresh, handmadeNode, NOW, TODAY } from '../../core/test-helpers';
import { layoutFor } from '../../core/location';
import { minigameOffered } from '../../core/minigames';
import { HANDMADE_SECRET } from '../../content/locations/handmade';

function nodeOf(id: number) {
  return game.value.map.nodes.find(n => n.id === id)!;
}

describe('LocationScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    game.value = fresh();
    overlay.value = null;
    eventQueue.value = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('low energy shows the rest message and does not enter', () => {
    game.value = { ...game.value, energy: 24 };
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByText, getByRole } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect(getByText(/想先休息/)).toBeTruthy();
    expect(getByRole('button', { name: '回家' })).toBeTruthy();
    expect(nodeOf(id).progress).toBeNull();
  });

  it('the 回家 button on the rest message closes the overlay', () => {
    game.value = { ...game.value, energy: 10 };
    const id = handmadeNode(game.value, 'bamboo-path').id;
    overlay.value = { kind: 'location', nodeId: id };
    const { getByRole } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByRole('button', { name: '回家' }));
    expect(overlay.value).toBeNull();
  });

  it('entering at full energy records today progress', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect(nodeOf(id).progress?.date).toBe(TODAY);
  });

  it('complete is disabled until talked and treasure are found', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect((getByTestId('complete-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('tapping the treasure hotspot records it in game state', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    const treasure = layoutFor(game.value, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    fireEvent.click(getByTestId(`hotspot-${treasure.id}`));
    expect(nodeOf(id).progress!.treasureFound).toBe(true);
  });

  it('talking then tapping treasure enables complete', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('talk-button'));
    const treasure = layoutFor(game.value, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    fireEvent.click(getByTestId(`hotspot-${treasure.id}`));
    expect((getByTestId('complete-button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('complete spends energy, marks the node done and closes the overlay', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    overlay.value = { kind: 'location', nodeId: id };
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('talk-button'));
    const treasure = layoutFor(game.value, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    fireEvent.click(getByTestId(`hotspot-${treasure.id}`));
    const energy = game.value.energy;
    fireEvent.click(getByTestId('complete-button'));
    expect(nodeOf(id).status).toBe('done');
    expect(game.value.energy).toBe(energy - 25);
    expect(overlay.value).toBeNull();
  });

  it('the hidden secret of the bamboo path can be found', () => {
    expect(HANDMADE_SECRET['bamboo-path']).toBe('hidden');
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('hotspot-secret'));
    expect(nodeOf(id).progress!.foundHotspots).toContain('secret');
  });

  it('拍照 button opens the photo overlay for this node', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('photo-button'));
    expect(overlay.value).toEqual({ kind: 'photo', context: { nodeId: id } });
  });

  it('a cloud post request can be completed by bringing the requested food', () => {
    const bamboo = handmadeNode(game.value, 'bamboo-path');
    const id = 99;
    game.value = {
      ...game.value,
      map: { ...game.value.map, nodes: [...game.value.map.nodes, { ...bamboo, id, snapshot: { kind: 'handmade', handmadeId: 'cloud-post' } }] },
    };
    const layout = layoutFor(game.value, id, TODAY);
    expect(layout.request.kind).toBe('bring');
    const wanted = (layout.request as { kind: 'bring'; foodId: string }).foodId;
    game.value = { ...game.value, inventory: { ...game.value.inventory, [wanted]: 1 } };
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId(`food-${wanted}`));
    expect(nodeOf(id).progress!.foundHotspots).toContain('request');
  });

  it('shows the minigame button only when offered today and skipping marks it done', () => {
    let seed = 1;
    while (!minigameOffered(seed, handmadeNode(game.value, 'bamboo-path').id, TODAY)) seed++;
    game.value = { ...game.value, seed };
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId, container } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('minigame-button'));
    fireEvent.click(container.querySelector('.minigame-skip') as HTMLElement);
    expect(nodeOf(id).progress!.foundHotspots).toContain('minigame');
  });
});
