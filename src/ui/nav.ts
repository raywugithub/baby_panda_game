import { signal } from '@preact/signals';

export type Tab = 'home' | 'map' | 'closet' | 'giftbox' | 'album';
export type Overlay =
  | { kind: 'settings' }
  | { kind: 'dialogue'; scriptId: string }
  | { kind: 'location'; nodeId: number }
  | { kind: 'photo'; context: 'home' | { nodeId: number } }
  | { kind: 'welcome' };

/** 底部導覽列的順序、圖示與無障礙名稱（純文字）。 */
export const TAB_ORDER: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'home', icon: '🏠', label: '家' },
  { tab: 'map', icon: '🪟', label: '窗外' },
  { tab: 'closet', icon: '👗', label: '衣櫃＆布置' },
  { tab: 'giftbox', icon: '🎁', label: '禮盒機' },
  { tab: 'album', icon: '📖', label: '相簿' },
];

export const tab = signal<Tab>('home');
export const overlay = signal<Overlay | null>(null);

export function goTab(t: Tab): void {
  tab.value = t;
  overlay.value = null;
}

export function openOverlay(o: Overlay): void {
  overlay.value = o;
}

export function closeOverlay(): void {
  overlay.value = null;
}
