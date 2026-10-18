import type { ComponentType } from 'preact';
import type { Overlay, Tab } from '../nav';
import { Placeholder } from './Placeholder';
import { Home } from './Home';
import { DialogueOverlay } from '../components/Dialogue';
import { Welcome } from './Welcome';
import { Settings } from './Settings';
import { Closet } from './Closet';
import { GiftBox } from './GiftBox';
import { PhotoOverlay } from '../photo/PhotoOverlay';

// 各計畫在此登記畫面元件；後續任務會替換下列對應值（例如 home 由 Task 22 替換）。
export const TAB_SCREENS: Record<Tab, ComponentType> = {
  home: Home,
  map: Placeholder,
  closet: Closet,
  giftbox: GiftBox,
  album: Placeholder,
};

export const OVERLAY_SCREENS: Partial<Record<Overlay['kind'], ComponentType<{ overlay: Overlay }>>> = {
  settings: Settings,
  dialogue: DialogueOverlay,
  welcome: Welcome,
  photo: PhotoOverlay,
};
