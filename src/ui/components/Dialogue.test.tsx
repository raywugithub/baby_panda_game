import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { Dialogue } from './Dialogue';
import { SCRIPTS } from '../../content/story';
import { act } from '@testing-library/preact';
import { createInitialState } from '../../core/state';
import { game } from '../store';
import { overlay } from '../nav';
import { App } from '../App';

describe('pendingBeat 監看與關閉（契約 10.8）', () => {
  it('pendingBeat 有值且無覆蓋層時自動開啟對話，關閉後清除', async () => {
    game.value = { ...createInitialState(5, 0), onboardingDone: true, pendingBeat: 'prologue' };
    overlay.value = null;
    render(<App />);
    await act(() => {});
    expect(overlay.value).toEqual({ kind: 'dialogue', scriptId: 'prologue' });
    fireEvent.click(screen.getByTestId('overlay-close'));
    expect(game.value.pendingBeat).toBeNull();
    expect(overlay.value).toBeNull();
  });
  it('查無腳本時直接呼叫 onDone（不卡住）', () => {
    let done = false;
    render(<Dialogue scriptId="nope" onDone={() => { done = true; }} />);
    expect(done).toBe(true);
  });
});

describe('Dialogue', () => {
  it('點擊逐句推進，最後一句後呼叫 onDone', () => {
    let done = false;
    render(<Dialogue scriptId="prologue" onDone={() => { done = true; }} />);
    const box = screen.getByTestId('dialogue-box');
    const lines = SCRIPTS['prologue'].lines;
    expect(screen.getByText(lines[0].text)).toBeTruthy();
    for (let i = 1; i < lines.length; i++) fireEvent.click(box);
    expect(screen.getByText(lines[lines.length - 1].text)).toBeTruthy();
    expect(done).toBe(false);
    fireEvent.click(box);
    expect(done).toBe(true);
  });
});

describe('Dialogue 熊貓尺寸', () => {
  it('插圖高度至少 160px 並置中', () => {
    const { container } = render(<Dialogue scriptId="prologue" />);
    const svg = container.querySelector('.dialogue-panda svg') as SVGElement | null;
    expect(svg).toBeTruthy();
    expect(Number(svg!.getAttribute('height'))).toBeGreaterThanOrEqual(160);
  });
});

describe('Dialogue illustration', () => {
  it('renders the script illustration as a scene image above the text', () => {
    game.value = createInitialState(5, 0);
    render(<Dialogue scriptId="ch4" />);
    const ill = screen.getByTestId('dialogue-illustration');
    expect(ill.querySelector('svg')).not.toBeNull();
    expect(ill.compareDocumentPosition(screen.getByTestId('dialogue-box')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('omits the illustration when the script has none', () => {
    game.value = createInitialState(5, 0);
    render(<Dialogue scriptId="prologue" />);
    expect(screen.queryByTestId('dialogue-illustration')).toBeNull();
  });
});
