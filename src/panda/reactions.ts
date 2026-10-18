import type { FoodDef } from '../content/types';
import type { PandaPose } from './poses';

/** 食物反應對應的熊貓姿勢（規格 5.2，契約 10.19）。 */
export const REACTION_POSE: Record<FoodDef['reaction'], PandaPose> = {
  patBelly: 'patBelly',
  blush: 'blush',
  sour: 'sour',
  starEyes: 'starEyes',
  yum: 'eat',
  mystery: 'stare',
};
