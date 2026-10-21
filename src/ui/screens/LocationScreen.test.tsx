import { render, fireEvent } from '@testing-library/preact';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocationScreen, chatIndex } from './LocationScreen';
import { game, eventQueue } from '../store';
import { overlay, tab } from '../nav';
import { fresh, handmadeNode, NOW, TODAY } from '../../core/test-helpers';
import { layoutFor } from '../../core/location';
import { generateSnapshot } from '../../core/locationgen';
import { act } from '@testing-library/preact';
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

  it('the 回家 button on the rest message closes the overlay and goes home', () => {
    game.value = { ...game.value, energy: 10 };
    const id = handmadeNode(game.value, 'bamboo-path').id;
    overlay.value = { kind: 'location', nodeId: id };
    tab.value = 'map';
    const { getByRole } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByRole('button', { name: '回家' }));
    expect(overlay.value).toBeNull();
    expect(tab.value).toBe('home');
  });

  it('the non-rest view renders the panda standing in the scene', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect(getByTestId('scene-panda').querySelector('svg')).toBeTruthy();
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

  /** 造一個今天的祕密是密碼鎖的生成地點。 */
  function codelockNode(): number {
    const bamboo = handmadeNode(game.value, 'bamboo-path');
    const id = 98;
    for (let seed = 1; seed < 500; seed++) {
      const snap = { ...generateSnapshot(seed, ['climb', 'dive']), requires: null };
      const node = { ...bamboo, id, seed, snapshot: snap, progress: null, status: 'open' as const };
      const g = { ...game.value, map: { ...game.value.map, nodes: [...game.value.map.nodes.filter(n => n.id !== id), node] } };
      const sec = layoutFor(g, id, TODAY).secret;
      if (sec.kind === 'puzzle' && sec.puzzle.kind === 'codelock') {
        game.value = g;
        return id;
      }
    }
    throw new Error('no codelock node found');
  }

  it('codelock: tapping the clue spots reveals the digits so the code can be worked out and solved', () => {
    const id = codelockNode();
    const layout = layoutFor(game.value, id, TODAY);
    const code = (layout.secret as { kind: 'puzzle'; puzzle: { code: string } }).puzzle.code;
    const { getByTestId, queryByTestId, getAllByRole, container } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('secret-button'));
    // 還沒找線索時，列表是空的
    expect(getByTestId('clue-list').querySelectorAll('li')).toHaveLength(0);
    for (let i = 0; i < 3; i++) {
      fireEvent.click(getByTestId(`hotspot-clue${i}`));
      expect(getByTestId('clue-text').textContent).toContain(code[i]);
      expect(getByTestId('clue-text').textContent).toContain(['第一', '第二', '第三'][i]);
    }
    const items = [...getByTestId('clue-list').querySelectorAll('li')].map((li) => li.textContent ?? '');
    expect(items).toHaveLength(3);
    expect(items.map((t) => t.match(/\d/)![0]).join('')).toBe(code);
    expect(queryByTestId('puzzle-cheer')).toBeNull();
    const inputs = container.querySelectorAll('.puzzle-digits input');
    inputs.forEach((el, i) => fireEvent.input(el, { target: { value: code[i] } }));
    fireEvent.click(getAllByRole('button').find((b) => /開鎖|確定|試試/.test(b.textContent ?? ''))!);
    expect(getByTestId('puzzle-cheer')).toBeTruthy();
    expect(nodeOf(id).progress!.foundHotspots).toContain('secret');
  });

  it('a filler spot shows a short note instead of nothing', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId, queryByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect(queryByTestId('clue-text')).toBeNull();
    const filler = layoutFor(game.value, id, TODAY).hotspots.find(h => h.role === 'filler')!;
    fireEvent.click(getByTestId(`hotspot-${filler.id}`));
    expect(getByTestId('clue-text').textContent!.length).toBeGreaterThan(3);
  });

  it('a find request has no shortcut button; only the hidden spot gives the reward', () => {
    const bamboo = handmadeNode(game.value, 'bamboo-path');
    let id = 0;
    for (let n = 200; n < 400 && !id; n++) {
      const g = { ...game.value, map: { ...game.value.map, nodes: [...game.value.map.nodes, { ...bamboo, id: n, seed: n, snapshot: { ...generateSnapshot(n, ['climb', 'dive']), requires: null }, progress: null }] } };
      if (layoutFor(g, n, TODAY).request.kind === 'find') { game.value = g; id = n; }
    }
    expect(id).toBeGreaterThan(0);
    const before = game.value.starSand;
    const { getByTestId, queryByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect(queryByTestId('request-find')).toBeNull();
    expect(game.value.starSand).toBe(before);
    fireEvent.click(getByTestId('hotspot-request'));
    expect(getByTestId('request-found')).toBeTruthy();
    expect(game.value.starSand).toBeGreaterThan(before);
  });

  it('the complete button says what is missing, and low energy stays on the screen', () => {
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    expect(getByTestId('complete-hint').textContent).toBe('還差：說話、找到寶物');
    fireEvent.click(getByTestId('talk-button'));
    expect(getByTestId('complete-hint').textContent).toBe('還差：找到寶物');
    const treasure = layoutFor(game.value, id, TODAY).hotspots.find(h => h.role === 'treasure')!;
    fireEvent.click(getByTestId(`hotspot-${treasure.id}`));
    act(() => { game.value = { ...game.value, energy: 10 }; });
    expect(getByTestId('complete-hint').textContent).toContain('元氣不夠');
    expect((getByTestId('complete-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('chat line changes from day to day and from place to place', () => {
    const idx = [0, 1, 2].map((d) => chatIndex(`2026-10-${18 + d}`, 5, 2, 10));
    expect(new Set(idx).size).toBe(3);
    expect(chatIndex('2026-10-18', 5, 2, 10)).not.toBe(chatIndex('2026-10-18', 6, 2, 10));
    expect(chatIndex('2026-10-18', 5, 2, 1)).toBe(0);
  });

  it('minigame: the result card is shown at time up and stays until 好 is pressed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    let seed = 1;
    while (!minigameOffered(seed, handmadeNode(game.value, 'bamboo-path').id, TODAY)) seed++;
    game.value = { ...game.value, seed };
    const id = handmadeNode(game.value, 'bamboo-path').id;
    const { getByTestId, queryByTestId } = render(<LocationScreen overlay={{ kind: 'location', nodeId: id }} />);
    fireEvent.click(getByTestId('minigame-button'));
    act(() => { vi.advanceTimersByTime(31_000); });
    expect(getByTestId('minigame-result').textContent).toContain('時間到');
    expect(nodeOf(id).progress!.foundHotspots).toContain('minigame');
    fireEvent.click(getByTestId('minigame-close'));
    expect(queryByTestId('minigame-result')).toBeNull();
  });
});
